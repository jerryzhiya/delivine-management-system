import { prisma } from '../config/prisma.js';

export const logActivity = async (title: string, description: string, type: string) => {
  try {
    await prisma.activityLog.create({
      data: {
        title,
        description,
        type,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};