import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// @desc    Get recent activity feed
// @route   GET /api/activities
export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to the 10 most recent entries for the dashboard
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};