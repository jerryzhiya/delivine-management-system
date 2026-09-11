import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/schedule
export const getSchedule = async (req: Request, res: Response) => {
  const { classId, dayOfWeek } = req.query;

  try {
    const whereClause: any = {};
    if (classId && typeof classId === 'string') whereClause.classId = classId;
    if (dayOfWeek && typeof dayOfWeek === 'string') whereClause.dayOfWeek = dayOfWeek;

    const schedule = await prisma.schedulePeriod.findMany({
      where: whereClause,
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

// POST /api/schedule
export const createSchedulePeriod = async (req: Request, res: Response) => {
  const { classId, dayOfWeek, startTime, endTime, subjectId, teacherId, room, isBreak } = req.body;

  if (!classId || !dayOfWeek || !startTime || !endTime) {
    return res.status(400).json({ error: 'classId, dayOfWeek, startTime, and endTime are required' });
  }

  try {
    const newPeriod = await prisma.schedulePeriod.create({
      data: {
        classId,
        dayOfWeek,
        startTime,
        endTime,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        room: room || '',
        isBreak: Boolean(isBreak),
      },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(newPeriod);
  } catch (error) {
    console.error('Error creating schedule period:', error);
    return res.status(500).json({ error: 'Failed to create schedule period' });
  }
};

// PUT /api/schedule/:id
export const updateSchedulePeriod = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Schedule Period ID is required' });
  }

  const { classId, dayOfWeek, startTime, endTime, subjectId, teacherId, room, isBreak } = req.body;

  try {
    const existingPeriod = await prisma.schedulePeriod.findUnique({ where: { id } });

    if (!existingPeriod) {
      return res.status(404).json({ error: 'Schedule period not found' });
    }

    const updated = await prisma.schedulePeriod.update({
      where: { id },
      data: {
        classId: classId ?? existingPeriod.classId,
        dayOfWeek: dayOfWeek ?? existingPeriod.dayOfWeek,
        startTime: startTime ?? existingPeriod.startTime,
        endTime: endTime ?? existingPeriod.endTime,
        subjectId: subjectId !== undefined ? subjectId : existingPeriod.subjectId,
        teacherId: teacherId !== undefined ? teacherId : existingPeriod.teacherId,
        room: room !== undefined ? room : existingPeriod.room,
        isBreak: isBreak !== undefined ? Boolean(isBreak) : existingPeriod.isBreak,
      },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating schedule period:', error);
    return res.status(500).json({ error: 'Failed to update schedule period' });
  }
};

// DELETE /api/schedule/:id
export const deleteSchedulePeriod = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Schedule Period ID is required' });
  }

  try {
    const existingPeriod = await prisma.schedulePeriod.findUnique({ where: { id } });

    if (!existingPeriod) {
      return res.status(404).json({ error: 'Schedule period not found' });
    }

    await prisma.schedulePeriod.delete({ where: { id } });
    return res.status(200).json({ message: 'Schedule period deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule period:', error);
    return res.status(500).json({ error: 'Failed to delete schedule period' });
  }
};