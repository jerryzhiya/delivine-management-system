import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authenticated user not found' });
    const user = await prisma.users.findUnique({ where: { id: userId }, select: publicUserSelect });
    if (!user) return res.status(404).json({ error: 'User profile not found' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching own profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, email } = req.body;
    if (!userId) return res.status(401).json({ error: 'Authenticated user not found' });
    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'Name and email are required' });

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { name: name.trim(), email: email.trim().toLowerCase() },
      select: publicUserSelect,
    });
    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'That email address is already in use.' });
    console.error('Error updating own profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// GET /api/users
export const getUsers = async (req: Request, res: Response) => {
  try {
    // Check if the frontend passed a role filter (e.g., /api/users?role=STUDENT)
    const { role } = req.query; 

    const whereClause: any = {};
    if (role) {
      whereClause.role = (role as string).toUpperCase();
    }

    // Fetch users from the database
    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // Notice we explicitly EXCLUDE the password field for security
      },
      orderBy: {
        createdAt: 'desc', // Show newest users first
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    // 1. Correctly extract 'id' as a string from req.params
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 2. Query the database
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 3. Handle user not found
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 4. Return user
    return res.status(200).json(user);

  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Type Guard: Ensure 'id' is a valid string for Prisma
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing user ID' });
    }

    // 2. Destructure fields from the request body
    const { name, email, role } = req.body;

    // 3. Check if the user exists before updating
    const existingUser = await prisma.users.findUnique({ where: { id } });
    
    if (!existingUser) {
      // Return immediately so execution stops here
      return res.status(404).json({ error: 'User not found' });
    }

    // 4. Update the user record
    const updatedUser = await prisma.users.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingUser.name,
        email: email !== undefined ? email : existingUser.email,
        role: role !== undefined ? role : existingUser.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 5. Send successful response
    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Type Guard: Ensure 'id' exists and is a valid string for Prisma
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing user ID' });
    }

    // 2. Check if the user exists before deleting
    const existingUser = await prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Delete the user
    await prisma.users.delete({
      where: { id },
    });

    // 4. Return success response
    return res.status(200).json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};