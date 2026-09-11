import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/payment
export const getPayment = async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findMany({
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
      orderBy: { date: 'desc' },
    });

    return res.status(200).json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// GET /api/payment/stats
export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amountPaid: true },
    });

    const pendingPaymentsCount = await prisma.payment.count({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
      },
    });

    return res.status(200).json({
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      pendingCount: pendingPaymentsCount,
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
};

// POST /api/payment
export const createPayment = async (req: Request, res: Response) => {
  const { studentId, totalFee, amountPaid, status, type, date } = req.body;

  if (!studentId || totalFee === undefined || totalFee === null) {
    return res.status(400).json({ error: 'Student ID and total fee are required' });
  }

  const parsedTotal = parseFloat(totalFee);
  const parsedPaid = parseFloat(amountPaid) || 0;

  if (isNaN(parsedTotal) || parsedTotal <= 0) {
    return res.status(400).json({ error: 'Valid total fee amount is required' });
  }

  try {
    const newPayment = await prisma.payment.create({
      data: {
        studentId,
        totalFee: parsedTotal,
        amountPaid: parsedPaid,
        status: status ? String(status).toUpperCase() : 'PENDING',
        type: type || 'School Fees',
        date: date ? new Date(date) : new Date(),
      },
    });

    return res.status(201).json(newPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
};

// PATCH /api/payment/:id/status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { status, amountPaid } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Payment ID is required' });
  }

  try {
    const existingPayment = await prisma.payment.findUnique({ where: { id } });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = String(status).toUpperCase();
    if (amountPaid !== undefined && amountPaid !== null) {
      dataToUpdate.amountPaid = parseFloat(amountPaid);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.status(200).json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ error: 'Failed to update payment status' });
  }
};