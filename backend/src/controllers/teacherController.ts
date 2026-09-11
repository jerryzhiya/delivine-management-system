import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// @desc    Get all teachers
// @route   GET /api/teachers
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        classes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

// @desc    Get single teacher by ID
// @route   GET /api/teachers/:id
export const getTeacherById = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Teacher ID is required' });
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        classes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.status(200).json(teacher);
  } catch (error) {
    console.error('Error fetching teacher details:', error);
    return res.status(500).json({ error: 'Failed to fetch teacher details' });
  }
};

// @desc    Add a new teacher
// @route   POST /api/teachers
export const createTeacher = async (req: Request, res: Response) => {
  const { name, email, subject, phone, experience, avatar } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Teacher name is required' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Valid teacher email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingTeacher = await prisma.teacher.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }

    const newTeacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        subject: subject ? subject.trim() : '',
        phone: phone ? phone.trim() : null,
        experience: experience !== undefined ? Number(experience) : 0,
        avatar: avatar || null,
      },
    });

    return res.status(201).json(newTeacher);
  } catch (error) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({ error: 'Failed to create teacher' });
  }
};

// @desc    Update teacher details
// @route   PUT /api/teachers/:id
export const updateTeacher = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Teacher ID is required' });
  }

  const { name, email, subject, phone, experience, avatar } = req.body;

  try {
    const existingTeacher = await prisma.teacher.findUnique({ where: { id } });

    if (!existingTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (email && email.trim().toLowerCase() !== existingTeacher.email) {
      const emailTaken = await prisma.teacher.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (emailTaken) {
        return res.status(400).json({ error: 'Email is already in use by another teacher' });
      }
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingTeacher.name,
        email: email ? email.trim().toLowerCase() : existingTeacher.email,
        subject: subject !== undefined ? subject.trim() : existingTeacher.subject,
        phone: phone !== undefined ? phone.trim() : existingTeacher.phone,
        experience: experience !== undefined ? Number(experience) : existingTeacher.experience,
        avatar: avatar !== undefined ? avatar : existingTeacher.avatar,
      },
    });

    return res.status(200).json(updatedTeacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({ error: 'Failed to update teacher' });
  }
};

// @desc    Delete a teacher record
// @route   DELETE /api/teachers/:id
export const deleteTeacher = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Teacher ID is required' });
  }

  try {
    const existingTeacher = await prisma.teacher.findUnique({ where: { id } });

    if (!existingTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await prisma.teacher.delete({ where: { id } });

    return res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ error: 'Failed to delete teacher' });
  }
};