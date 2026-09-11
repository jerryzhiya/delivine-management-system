import type  { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/subjects
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const { classId, teacherId } = req.query;
    const whereClause: any = {};

    if (classId && typeof classId === 'string') {
      whereClause.classId = classId;
    }

    if (teacherId && typeof teacherId === 'string') {
      whereClause.teacherId = teacherId;
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

// GET /api/subjects/:id
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid Subject ID is required' });
    }

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    return res.status(200).json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    return res.status(500).json({ error: 'Failed to fetch subject' });
  }
};

// POST /api/subjects
export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, code, description, teacherId, classId } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Subject name and course code are required' });
    }

    const existingSubject = await prisma.subject.findFirst({
      where: { code },
    });

    if (existingSubject) {
      return res.status(400).json({ error: 'A subject with this course code already exists' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description: description || '',
        teacherId: teacherId || null,
        classId: classId || null,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return res.status(500).json({ error: 'Failed to create subject' });
  }
};

// PUT /api/subjects/:id
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid Subject ID is required' });
    }

    const { name, code, description, teacherId, classId } = req.body;

    const existingSubject = await prisma.subject.findUnique({ where: { id } });

    if (!existingSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name: name ?? existingSubject.name,
        code: code ?? existingSubject.code,
        description: description !== undefined ? description : existingSubject.description,
        teacherId: teacherId !== undefined ? teacherId : existingSubject.teacherId,
        classId: classId !== undefined ? classId : existingSubject.classId,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      message: 'Subject updated successfully',
      subject: updatedSubject,
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return res.status(500).json({ error: 'Failed to update subject' });
  }
};

// DELETE /api/subjects/:id
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid Subject ID is required' });
    }

    const existingSubject = await prisma.subject.findUnique({ where: { id } });

    if (!existingSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await prisma.subject.delete({ where: { id } });

    return res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return res.status(500).json({ error: 'Failed to delete subject' });
  }
};