import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// @desc    Get all classes
// @route   GET /api/classes
export const getClasses = async (req: Request, res: Response) => {
  try {
    const [classes, students] = await Promise.all([
      prisma.class.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.student.findMany({
        where: { isActive: true },
        select: { grade: true },
      }),
    ]);

    const studentCounts = students.reduce<Record<string, number>>((counts, student) => {
      const grade = student.grade?.trim();
      if (grade) counts[grade] = (counts[grade] || 0) + 1;
      return counts;
    }, {});

    const classesWithCounts = classes.map((classRecord) => ({
      ...classRecord,
      studentCount: studentCounts[classRecord.name] || 0,
    }));

    return res.status(200).json({
     success: true,
     data: classesWithCounts
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

// @desc    Get single class by ID
// @route   GET /api/classes/:id
export const getClassById = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Class ID is required' });
  }

  try {
    const classRecord = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!classRecord) {
      return res.status(404).json({ error: 'Class record not found' });
    }

    return res.status(200).json(classRecord);
  } catch (error) {
    console.error('Error fetching class:', error);
    return res.status(500).json({ error: 'Failed to fetch class record' });
  }
};

// @desc    Create a new class
// @route   POST /api/classes
export const createClass = async (req: Request, res: Response) => {
  const { name, teacherId, capacity } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Class name is required' });
  }

  try {
    const existingClass = await prisma.class.findUnique({ where: { name: name.trim() } });
    if (existingClass) {
      return res.status(400).json({ error: 'Class name already exists' });
    }

    const parsedCapacity = capacity ? parseInt(capacity, 10) : 30;
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ error: 'Valid class capacity is required' });
    }

    // Created without 'include' to prevent MongoDB Atlas transaction errors (P2010)
    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        teacherId: teacherId && teacherId !== '' ? teacherId : null,
        capacity: parsedCapacity,
      },
    });

    return res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    return res.status(500).json({ error: 'Failed to create class' });
  }
};

// @desc    Assign or unassign a teacher to a class
// @route   PUT /api/classes/:id/assign-teacher
export const assignTeacherToClass = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { teacherId } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Class ID is required' });
  }

  try {
    const existingClass = await prisma.class.findUnique({ where: { id } });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        teacherId: !teacherId || teacherId === 'unassigned' ? null : teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    console.error('Error assigning teacher to class:', error);
    return res.status(500).json({ error: 'Failed to assign teacher to class' });
  }
};

// @desc    Update a class (e.g., assign a new teacher)
// @route   PUT /api/classes/:id
export const updateClass = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Class ID is required' });
  }

  const { name, teacherId, capacity } = req.body;

  try {
    const existingClass = await prisma.class.findUnique({ where: { id } });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Prevent renaming to a class name that is already taken
    if (name && name.trim() !== existingClass.name) {
      const nameTaken = await prisma.class.findUnique({ where: { name: name.trim() } });
      if (nameTaken) {
        return res.status(400).json({ error: 'Class name already exists' });
      }
    }

    let parsedCapacity = existingClass.capacity;
    if (capacity !== undefined) {
      const checkCap = parseInt(capacity, 10);
      if (isNaN(checkCap) || checkCap <= 0) {
        return res.status(400).json({ error: 'Valid class capacity is required' });
      }
      parsedCapacity = checkCap;
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingClass.name,
        teacherId: teacherId === '' ? null : (teacherId ?? existingClass.teacherId),
        capacity: parsedCapacity,
      },
    });

    return res.status(200).json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({ error: 'Failed to update class' });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
export const deleteClass = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Class ID is required' });
  }

  try {
    const existingClass = await prisma.class.findUnique({ where: { id } });

    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    await prisma.class.delete({ where: { id } });

    return res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({ error: 'Failed to delete class' });
  }
};