import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const VALID_STATUSES = ['PENDING', 'PAID', 'CANCELLED'];
const getId = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const parseAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

export const getExpenses = async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.schoolExpense.findMany({
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    });
    return res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching school expenses:', error);
    return res.status(500).json({ error: 'Failed to fetch school expenses' });
  }
};

export const getExpenseStats = async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.schoolExpense.findMany({
      select: { amount: true, status: true, category: true },
    });
    const paidExpenses = expenses.filter((expense) => expense.status === 'PAID');
    const categoryTotals = paidExpenses.reduce<Record<string, number>>((totals, expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      return totals;
    }, {});
    const topCategory = Object.entries(categoryTotals).sort(([, first], [, second]) => second - first)[0];

    return res.status(200).json({
      totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      paidExpenses: paidExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      pendingCount: expenses.filter((expense) => expense.status === 'PENDING').length,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
    });
  } catch (error) {
    console.error('Error fetching expense statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const { title, category, amount, status, expenseDate, notes } = req.body;
  const parsedAmount = parseAmount(amount);

  if (!title?.trim() || !category?.trim()) {
    return res.status(400).json({ error: 'Expense title and category are required' });
  }
  if (parsedAmount === null) {
    return res.status(400).json({ error: 'Expense amount must be greater than zero' });
  }

  const normalizedStatus = String(status || 'PENDING').toUpperCase();
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid expense status' });
  }

  try {
    const expense = await prisma.schoolExpense.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        amount: parsedAmount,
        status: normalizedStatus,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        notes: notes?.trim() || null,
      },
    });
    return res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating school expense:', error);
    return res.status(500).json({ error: 'Failed to create school expense' });
  }
};

export const updateExpenseStatus = async (req: Request, res: Response) => {
  const id = getId(req.params.id);
  const status = String(req.body.status || '').toUpperCase();

  if (!id) return res.status(400).json({ error: 'Valid expense ID is required' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid expense status' });

  try {
    const expense = await prisma.schoolExpense.update({ where: { id }, data: { status } });
    return res.status(200).json(expense);
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Expense not found' });
    console.error('Error updating expense status:', error);
    return res.status(500).json({ error: 'Failed to update expense status' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const id = getId(req.params.id);
  const { title, category, amount, status, expenseDate, notes } = req.body;
  const parsedAmount = parseAmount(amount);

  if (!id) return res.status(400).json({ error: 'Valid expense ID is required' });
  if (!title?.trim() || !category?.trim()) {
    return res.status(400).json({ error: 'Expense title and category are required' });
  }
  if (parsedAmount === null) {
    return res.status(400).json({ error: 'Expense amount must be greater than zero' });
  }

  const normalizedStatus = String(status || 'PENDING').toUpperCase();
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid expense status' });
  }

  try {
    const expense = await prisma.schoolExpense.update({
      where: { id },
      data: {
        title: title.trim(),
        category: category.trim(),
        amount: parsedAmount,
        status: normalizedStatus,
        ...(expenseDate ? { expenseDate: new Date(expenseDate) } : {}),
        notes: notes?.trim() || null,
      },
    });
    return res.status(200).json(expense);
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Expense not found' });
    console.error('Error updating school expense:', error);
    return res.status(500).json({ error: 'Failed to update school expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const id = getId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Valid expense ID is required' });

  try {
    await prisma.schoolExpense.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Expense not found' });
    console.error('Error deleting school expense:', error);
    return res.status(500).json({ error: 'Failed to delete school expense' });
  }
};