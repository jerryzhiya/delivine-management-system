import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const isValidObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

const ensureString = (val: unknown, fallback = ''): string => {
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0].trim();
  return fallback;
};

// GET /api/parents
export const getParents = async (req: Request, res: Response) => {
  try {
    const parents = await prisma.parent.findMany({
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(parents);
  } catch (error) {
    console.error('Fetch parents error:', error);
    return res.status(500).json({ error: 'Failed to fetch parents' });
  }
};

// GET /api/parents/:id
export const getParentById = async (req: Request, res: Response) => {
  const requester = (req as any).user as { id?: string; role?: string; parentId?: string } | undefined;
  let id = ensureString(req.params.id);
  id = id.replace(/\.\d+$/, '');

  if (id === 'me' || req.path === '/me') {
    const user = (req as any).user;
    id = ensureString(user?.parentId || user?.id);
  }

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: 'Valid 24-character MongoDB Parent ID is required' });
  }

  if (requester?.role === 'PARENT' && requester.parentId !== id) {
    return res.status(403).json({ error: 'You can only access your own parent profile' });
  }

  try {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            gradeRecords: true,
            attendance: true,
            payments: true,
          },
        },
      },
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    return res.status(200).json(parent);
  } catch (error) {
    console.error('Fetch parent error:', error);
    return res.status(500).json({ error: 'Failed to fetch parent details' });
  }
};

// POST /api/parents
export const createParent = async (req: Request, res: Response) => {
  const status = req.body.status || 'ACTIVE';
  const name = ensureString(req.body?.name);
  const email = ensureString(req.body?.email);
  const phone = ensureString(req.body?.phone);
  const relationship = ensureString(req.body?.relationship, 'Guardian');
  const address = ensureString(req.body?.address, '');
  const avatar = ensureString(req.body?.avatar, '');

  const rawStudentIds = Array.isArray(req.body?.studentIds) ? req.body.studentIds : [];
  const studentIds = rawStudentIds
    .map((item: unknown) => ensureString(item))
    .filter(isValidObjectId);

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  try {
    const newParent = await prisma.parent.create({
      data: {
        name,
        email,
        phone,
        relationship,
        address,
        avatar,
        status,
        studentIds,
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
          },
        },
      },
    });

    return res.status(201).json(newParent);
  } catch (error) {
    console.error('Create parent error:', error);
    return res.status(500).json({ error: 'Failed to create parent profile' });
  }
};

// PUT /api/parents/:id
export const updateParent = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: 'Valid 24-character MongoDB Parent ID is required' });
  }

  try {
    const existing = await prisma.parent.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Parent not found' });

    const rawStudentIds = Array.isArray(req.body?.studentIds) ? req.body.studentIds : undefined;
    const studentIds = rawStudentIds
      ? rawStudentIds.map((item: unknown) => ensureString(item)).filter(isValidObjectId)
      : undefined;

    const updatedParent = await prisma.parent.update({
      where: { id },
      data: {
        name: req.body?.name !== undefined ? ensureString(req.body.name) : existing.name,
        email: req.body?.email !== undefined ? ensureString(req.body.email) : existing.email,
        phone: req.body?.phone !== undefined ? ensureString(req.body.phone) : existing.phone,
        relationship: req.body?.relationship !== undefined ? ensureString(req.body.relationship) : existing.relationship,
        address: req.body?.address !== undefined ? ensureString(req.body.address) : existing.address,
        avatar: req.body?.avatar !== undefined ? ensureString(req.body.avatar) : existing.avatar,
        status: req.body?.status !== undefined ? req.body.status : existing.status,
        ...(studentIds && { studentIds }),
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
          },
        },
      },
    });

    return res.status(200).json(updatedParent);
  } catch (error) {
    console.error('Update parent error:', error);
    return res.status(500).json({ error: 'Failed to update parent profile' });
  }
};

// POST /api/parents/:id/link-student
export const linkStudentToParent = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);
  const studentId = ensureString(req.body?.studentId);

  if (!id || !isValidObjectId(id) || !studentId || !isValidObjectId(studentId)) {
    return res.status(400).json({ error: 'Valid 24-character Parent ID and Student ID are required' });
  }

  try {
    const parent = await prisma.parent.findUnique({ where: { id } });
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    if (!parent || !student) {
      return res.status(404).json({ error: 'Parent or Student not found' });
    }

    const updatedParent = await prisma.parent.update({
      where: { id },
      data: { students: { connect: { id: studentId } } },
      include: { students: { select: { id: true, firstName: true, lastName: true, grade: true } } },
    });

    return res.status(200).json(updatedParent);
  } catch (error) {
    console.error('Link student error:', error);
    return res.status(500).json({ error: 'Failed to link student to parent' });
  }
};

// DELETE /api/parents/:id/unlink-student/:studentId
export const unlinkStudentFromParent = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);
  const studentId = ensureString(req.params.studentId);

  if (!id || !isValidObjectId(id) || !studentId || !isValidObjectId(studentId)) {
    return res.status(400).json({ error: 'Valid 24-character Parent ID and Student ID are required' });
  }

  try {
    const parent = await prisma.parent.findUnique({ where: { id } });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const updatedParent = await prisma.parent.update({
      where: { id },
      data: { students: { disconnect: { id: studentId } } },
      include: { students: { select: { id: true, firstName: true, lastName: true, grade: true } } },
    });

    return res.status(200).json(updatedParent);
  } catch (error) {
    console.error('Unlink student error:', error);
    return res.status(500).json({ error: 'Failed to unlink student' });
  }
};

// DELETE /api/parents/:id
export const deleteParent = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: 'Valid 24-character MongoDB Parent ID is required' });
  }

  try {
    const existing = await prisma.parent.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Parent not found' });

    await prisma.parent.delete({ where: { id } });
    return res.status(200).json({ message: 'Parent profile deleted successfully' });
  } catch (error) {
    console.error('Delete parent error:', error);
    return res.status(500).json({ error: 'Failed to delete parent profile' });
  }
};