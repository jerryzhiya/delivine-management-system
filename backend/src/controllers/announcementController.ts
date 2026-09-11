import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// @desc    Get all announcements (pinned first, then newest)
// @route   GET /api/announcements
// @access  Private (All authenticated users)
export const getAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { date: 'desc' },
      ],
    });

    return res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private (Admin only)
export const createAnnouncement = async (req: Request, res: Response) => {
  const { title, content, description, category, audience, targetAudience, isPinned, date } = req.body;

  if (!title || (!content && !description)) {
    return res.status(400).json({ error: 'Title and content/description are required' });
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        description: description ?? content ?? '',
        category: category || 'General',
        targetAudience: targetAudience || audience || 'All',
        isPinned: Boolean(isPinned),
        date: date ? new Date(date) : new Date(),
      },
    });

    return res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin only)
export const updateAnnouncement = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Announcement ID is required' });
  }

  const { title, description, category, targetAudience, isPinned, date } = req.body;

  try {
    const existingAnnouncement = await prisma.announcement.findUnique({ where: { id } });

    if (!existingAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingAnnouncement.title,
        description: description !== undefined ? description : existingAnnouncement.description,
        category: category !== undefined ? category : existingAnnouncement.category,
        targetAudience: targetAudience !== undefined ? targetAudience : existingAnnouncement.targetAudience,
        isPinned: isPinned !== undefined ? Boolean(isPinned) : existingAnnouncement.isPinned,
        date: date ? new Date(date) : existingAnnouncement.date,
      },
    });

    return res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ error: 'Failed to update announcement' });
  }
};

// @desc    Toggle pinned status of an announcement
// @route   PATCH /api/announcements/:id/pin
// @access  Private (Admin only)
export const togglePinAnnouncement = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid announcement ID' });
  }

  try {
    const existing = await prisma.announcement.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        isPinned: !existing.isPinned,
      },
    });

    return res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating pin status:', error);
    return res.status(500).json({ error: 'Failed to toggle pin status' });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin only)
export const deleteAnnouncement = async (req: Request, res: Response) => {
  const id = typeof req.params.id === 'string'
    ? req.params.id
    : typeof req.body?.id === 'string'
    ? req.body.id
    : undefined;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid announcement ID' });
  }

  try {
    const existing = await prisma.announcement.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await prisma.announcement.delete({ where: { id } });

    return res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ error: 'Failed to delete announcement' });
  }
};