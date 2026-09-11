import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// @desc    Submit or update an assignment submission (Student)
// @route   POST /api/submissions
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId, content } = req.body;
    
    // Get student ID from auth middleware or body
    const studentId = (req as any).user?.id || req.body.studentId;

    // 1. Validate MongoDB ObjectId format (24 hex characters)
    if (!assignmentId || !OBJECT_ID_REGEX.test(assignmentId)) {
      return res.status(400).json({
        error: 'Invalid assignmentId. Must be a 24-character hexadecimal ObjectId.',
      });
    }

    if (!studentId || !OBJECT_ID_REGEX.test(studentId)) {
      return res.status(400).json({
        error: 'Invalid studentId. Must be a 24-character hexadecimal ObjectId.',
      });
    }

    // 2. Verify assignment exists & check due date
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // 3. Process uploaded files from Multer
    let attachmentPaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
    }

    // 4. Calculate submission status (Submitted vs Late)
    const isLate = new Date() > new Date(assignment.dueDate);
    const status = isLate ? 'Late' : 'Submitted';

    // 5. Upsert submission record (removed non-existent studentName and studentClass fields)
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {
        content: content || '',
        ...(attachmentPaths.length > 0 && { attachments: attachmentPaths }),
        status,
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        studentId,
        content: content || '',
        attachments: attachmentPaths,
        status,
      },
    });

    // 6. Recalculate and update total submission count on Assignment
    try {
      const submissionCount = await prisma.submission.count({
        where: { assignmentId },
      });

      await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          submissionsCount: submissionCount,
        } as any,
      });
    } catch (countErr) {
      console.warn('Could not update assignment submissionsCount:', countErr);
    }

    return res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

// @desc    Get all submissions for a specific assignment (Teacher view)
// @route   GET /api/submissions/assignment/:assignmentId
export const getSubmissionsByAssignment = async (req: Request, res: Response) => {
  const rawId = req.params.assignmentId;
  const assignmentId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!assignmentId || typeof assignmentId !== 'string' || !OBJECT_ID_REGEX.test(assignmentId)) {
    return res.status(400).json({ error: 'Valid 24-character Assignment ID is required' });
  }

  try {
    const user = (req as any).user as { id?: string; role?: string } | undefined;
    if (user?.role === 'STUDENT' && !user.id) {
      return res.status(403).json({ error: 'Student identity is required' });
    }

    const where = user?.role === 'STUDENT'
      ? { assignmentId, studentId: user.id as string }
      : { assignmentId };

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// @desc    Grade a student's submission (Teacher action)
// @route   PUT /api/submissions/:id/grade
export const gradeSubmission = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string' || !OBJECT_ID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Valid 24-character Submission ID is required' });
  }

  const { grade, feedback } = req.body;

  if (grade === undefined || grade === null) {
    return res.status(400).json({ error: 'Grade is required' });
  }

  const numericGrade = Number(grade);
  if (isNaN(numericGrade) || numericGrade < 0) {
    return res.status(400).json({ error: 'Valid positive numeric grade is required' });
  }

  try {
    const existingSubmission = await prisma.submission.findUnique({ where: { id } });

    if (!existingSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        grade: numericGrade,
        feedback: feedback !== undefined ? feedback : existingSubmission.feedback,
        status: 'Graded',
      },
    });

    return res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error('Error grading submission:', error);
    return res.status(500).json({ error: 'Failed to grade submission' });
  }
};