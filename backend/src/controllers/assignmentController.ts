import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/assignments (With optional classId & subject filters)
export const getAssignments = async (req: Request, res: Response) => {
  const { classId, subject } = req.query;

  try {
    const whereClause: Record<string, any> = {};
    if (classId && typeof classId === 'string') whereClause.classId = classId;
    if (subject && typeof subject === 'string') whereClause.subject = subject;

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      orderBy: { dueDate: 'asc' },
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// GET /api/assignments/:id (Get single assignment with submissions)
export const getAssignmentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Assignment ID is required' });
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        submissions: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return res.status(500).json({ error: 'Failed to fetch assignment' });
  }
};

// POST /api/assignments
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, type, classId, subject, description, dueDate, totalStudents } = req.body;

    if (!title || !classId || !dueDate) {
      return res.status(400).json({ error: 'title, classId, and dueDate are required' });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: 'Valid dueDate format is required' });
    }

    // Process uploaded file paths
    const files = (req.files as Express.Multer.File[]) || [];
    const uploadedUrls = files.map((file) => `/uploads/${file.filename}`);

    // Parse existing attachment URLs passed in body
    let existingAttachments: string[] = [];
    if (req.body.attachments) {
      existingAttachments = Array.isArray(req.body.attachments)
        ? req.body.attachments
        : [req.body.attachments];
    }

    const allAttachments = [...existingAttachments, ...uploadedUrls];

    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        type: type || 'HOMEWORK',
        classId,
        subject: subject || '',
        description: description || '',
        attachments: allAttachments,
        dueDate: parsedDueDate,
        totalStudents: Number(totalStudents) || 0,
      },
    });

    return res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ error: 'Failed to create assignment' });
  }
};
// PUT /api/assignments/:id
export const updateAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Assignment ID is required' });
  }

  const { title, type, classId, subject, description, attachments, dueDate, totalStudents } = req.body;

  try {
    const existing = await prisma.assignment.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    let parsedDueDate = existing.dueDate;
    if (dueDate) {
      const dateCheck = new Date(dueDate);
      if (isNaN(dateCheck.getTime())) {
        return res.status(400).json({ error: 'Invalid dueDate format' });
      }
      parsedDueDate = dateCheck;
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        type: type ?? existing.type,
        classId: classId ?? existing.classId,
        subject: subject ?? existing.subject,
        description: description ?? existing.description,
        attachments: attachments ?? existing.attachments,
        dueDate: parsedDueDate,
        totalStudents: totalStudents !== undefined ? Number(totalStudents) : existing.totalStudents,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update assignment error:', error);
    return res.status(500).json({ error: 'Failed to update assignment' });
  }
};

// DELETE /api/assignments/:id
export const deleteAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Assignment ID is required' });
  }

  try {
    const existing = await prisma.assignment.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await prisma.assignment.delete({ where: { id } });

    return res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return res.status(500).json({ error: 'Failed to delete assignment' });
  }
};