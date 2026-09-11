import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// @desc    Get all grades (optional query filter by studentId or subject)
// @route   GET /api/grades
export const getGrades = async (req: Request, res: Response) => {
  const { studentId, subject } = req.query;

  try {
    const whereClause: Record<string, any> = {};
    if (studentId && typeof studentId === 'string') whereClause.studentId = studentId;
    if (subject && typeof subject === 'string') whereClause.subject = subject;

    const grades = await prisma.gradeRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
              grade: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return res.status(500).json({ error: 'Failed to fetch grades' });
  }
};

// @desc    Get single grade record by ID
// @route   GET /api/grades/:id
export const getGradeById = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Grade ID is required' });
  }

  try {
    const gradeRecord = await prisma.gradeRecord.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            grade: true,
          },
        },
      },
    });

    if (!gradeRecord) {
      return res.status(404).json({ error: 'Grade record not found' });
    }

    return res.status(200).json(gradeRecord);
  } catch (error) {
    console.error('Error fetching grade record:', error);
    return res.status(500).json({ error: 'Failed to fetch grade record' });
  }
};

// @desc    Record a new grade for a student
// @route   POST /api/grades
export const createGrade = async (req: Request, res: Response) => {
  const { studentId, subject, score, grade, term, remark, ca1, ca2, ca3, exam } = req.body;

  if (!studentId || !subject || score === undefined || score === null) {
    return res.status(400).json({ error: 'studentId, subject, and score are required' });
  }

  const numericScore = parseFloat(score);
  if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
    return res.status(400).json({ error: 'Score must be a valid number between 0 and 100' });
  }

  try {
    // 1. Ensure student exists
    const studentExists = await prisma.student.findUnique({ where: { id: studentId } });
    if (!studentExists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // 2. Create grade record
    const newGrade = await prisma.gradeRecord.create({
      data: {
        studentId,
        subject: subject.trim(),
        score: numericScore,
        ca1: ca1 !== undefined && ca1 !== null ? parseFloat(ca1) : null,
        ca2: ca2 !== undefined && ca2 !== null ? parseFloat(ca2) : null,
        ca3: ca3 !== undefined && ca3 !== null ? parseFloat(ca3) : null,
        exam: exam !== undefined && exam !== null ? parseFloat(exam) : null,
        grade: grade || calculateGradeLetter(numericScore),
        term: term || 'Semester 1',
        remark: remark || '',
      },
    });

    return res.status(201).json(newGrade);
  } catch (error) {
    console.error('Error recording grade:', error);
    return res.status(500).json({ error: 'Failed to record grade' });
  }
};

// @desc    Update a grade record
// @route   PUT /api/grades/:id
export const updateGrade = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Grade ID is required' });
  }

  const { subject, score, grade, term, remark, ca1, ca2, ca3, exam } = req.body;

  try {
    const existingGrade = await prisma.gradeRecord.findUnique({ where: { id } });

    if (!existingGrade) {
      return res.status(404).json({ error: 'Grade record not found' });
    }

    let updatedScore = existingGrade.score;
    if (score !== undefined && score !== null) {
      const parsedScore = parseFloat(score);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
        return res.status(400).json({ error: 'Score must be a valid number between 0 and 100' });
      }
      updatedScore = parsedScore;
    }

    // Automatically recalculate letter grade if score updated without providing an explicit grade
    const updatedGradeLetter = grade !== undefined 
      ? grade 
      : (score !== undefined ? calculateGradeLetter(updatedScore) : existingGrade.grade);

    const updatedGrade = await prisma.gradeRecord.update({
      where: { id },
      data: {
        subject: subject ? subject.trim() : existingGrade.subject,
        score: updatedScore,
        ...(ca1 !== undefined && { ca1: ca1 === null || ca1 === '' ? null : parseFloat(ca1) }),
        ...(ca2 !== undefined && { ca2: ca2 === null || ca2 === '' ? null : parseFloat(ca2) }),
        ...(ca3 !== undefined && { ca3: ca3 === null || ca3 === '' ? null : parseFloat(ca3) }),
        ...(exam !== undefined && { exam: exam === null || exam === '' ? null : parseFloat(exam) }),
        grade: updatedGradeLetter,
        term: term !== undefined ? term : existingGrade.term,
        remark: remark !== undefined ? remark : existingGrade.remark,
      },
    });

    return res.status(200).json(updatedGrade);
  } catch (error) {
    console.error('Error updating grade:', error);
    return res.status(500).json({ error: 'Failed to update grade record' });
  }
};

// @desc    Delete a grade record
// @route   DELETE /api/grades/:id
export const deleteGrade = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Grade ID is required' });
  }

  try {
    const existingGrade = await prisma.gradeRecord.findUnique({ where: { id } });

    if (!existingGrade) {
      return res.status(404).json({ error: 'Grade record not found' });
    }

    await prisma.gradeRecord.delete({ where: { id } });

    return res.status(200).json({ message: 'Grade record deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return res.status(500).json({ error: 'Failed to delete grade record' });
  }
};

// Helper function to derive letter grade automatically if not provided
function calculateGradeLetter(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}