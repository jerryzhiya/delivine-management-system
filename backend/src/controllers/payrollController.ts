import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const VALID_STATUSES = ['PENDING', 'PAID', 'CANCELLED'];

const getId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parseAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

export const getPayrollRecords = async (_req: Request, res: Response) => {
  try {
    const records = await prisma.teacherPayroll.findMany({
      include: {
        teacher: { select: { id: true, name: true, email: true, subject: true } },
      },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching teacher payroll:', error);
    return res.status(500).json({ error: 'Failed to fetch teacher payroll' });
  }
};

export const getPayrollStats = async (_req: Request, res: Response) => {
  try {
    const [records, teacherCount] = await Promise.all([
      prisma.teacherPayroll.findMany({ select: { netSalary: true, status: true } }),
      prisma.teacher.count(),
    ]);

    return res.status(200).json({
      totalPayroll: records.reduce((sum, record) => sum + record.netSalary, 0),
      paidPayroll: records
        .filter((record) => record.status === 'PAID')
        .reduce((sum, record) => sum + record.netSalary, 0),
      pendingCount: records.filter((record) => record.status === 'PENDING').length,
      teacherCount,
    });
  } catch (error) {
    console.error('Error fetching payroll statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch payroll statistics' });
  }
};

export const createPayrollRecord = async (req: Request, res: Response) => {
  const { teacherId, period, baseSalary, deductions, status, paidAt, notes } = req.body;
  const parsedBaseSalary = parseAmount(baseSalary);
  const parsedDeductions = parseAmount(deductions ?? 0);

  if (!teacherId || typeof teacherId !== 'string' || !period || typeof period !== 'string') {
    return res.status(400).json({ error: 'Teacher and payroll period are required' });
  }
  if (parsedBaseSalary === null || parsedBaseSalary <= 0) {
    return res.status(400).json({ error: 'Base salary must be greater than zero' });
  }
  if (parsedDeductions === null || parsedDeductions > parsedBaseSalary) {
    return res.status(400).json({ error: 'Deductions must be valid and cannot exceed base salary' });
  }

  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const payroll = await prisma.teacherPayroll.create({
      data: {
        teacherId,
        period: period.trim(),
        baseSalary: parsedBaseSalary,
        deductions: parsedDeductions,
        netSalary: parsedBaseSalary - parsedDeductions,
        status: VALID_STATUSES.includes(String(status).toUpperCase()) ? String(status).toUpperCase() : 'PENDING',
        paidAt: paidAt ? new Date(paidAt) : null,
        notes: notes?.trim() || null,
      },
      include: { teacher: { select: { id: true, name: true, email: true, subject: true } } },
    });

    return res.status(201).json(payroll);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'A payroll record already exists for this teacher and period' });
    }
    console.error('Error creating teacher payroll:', error);
    return res.status(500).json({ error: 'Failed to create payroll record' });
  }
};

export const updatePayrollStatus = async (req: Request, res: Response) => {
  const id = getId(req.params.id);
  const status = String(req.body.status || '').toUpperCase();

  if (!id) return res.status(400).json({ error: 'Valid payroll ID is required' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid payroll status' });

  try {
    const payroll = await prisma.teacherPayroll.update({
      where: { id },
      data: { status, paidAt: status === 'PAID' ? new Date() : null },
      include: { teacher: { select: { id: true, name: true, email: true, subject: true } } },
    });
    return res.status(200).json(payroll);
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Payroll record not found' });
    console.error('Error updating payroll status:', error);
    return res.status(500).json({ error: 'Failed to update payroll status' });
  }
};