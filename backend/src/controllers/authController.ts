import type { Request, Response } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

const VALID_ROLES = ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT'] as const;

// @desc    Admin-only: Register a new user and create role profile
// @route   POST /api/auth/register
// @access  Private (Admin)
export const register = async (req: Request, res: Response) => {
  const { email, password, name, role, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const formattedRole = (role || 'STUDENT').toUpperCase();

  if (!VALID_ROLES.includes(formattedRole as any)) {
    return res.status(400).json({ error: 'Invalid role. Must be STUDENT, TEACHER, ADMIN, or PARENT' });
  }

  try {
    // 1. Check if email exists in either table before proceeding
    const [existingUser, existingParent] = await Promise.all([
      prisma.users.findUnique({ where: { email: normalizedEmail } }),
      prisma.parent.findUnique({ where: { email: normalizedEmail } }),
    ]);

    if (existingUser || existingParent) {
      return res.status(400).json({
        error: 'An account or profile with this email address already exists.',
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Execute atomic creation
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          role: formattedRole,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (formattedRole === 'STUDENT') {
        const nameParts = newUser.name.trim().split(/\s+/);
        const firstName = nameParts.shift() || newUser.name.trim();
        const lastName = nameParts.join(' ') || firstName;

        await tx.student.create({
          data: {
            firstName,
            lastName,
            grade: '',
            status: 'ACTIVE',
            isActive: true,
          },
        });
      } else if (formattedRole === 'TEACHER') {
        await tx.teacher.create({
          data: {
            name: newUser.name.trim(),
            email: newUser.email,
            subject: '',
            phone: phone || null,
            experience: 0,
          },
        });
      } else if (formattedRole === 'PARENT') {
        await tx.parent.upsert({
          where: { email: normalizedEmail },
          update: {
            name: newUser.name,
            phone: phone || '',
          },
          create: {
            name: newUser.name,
            email: newUser.email,
            phone: phone || '',
            relationship: 'Guardian',
            studentIds: [],
          },
        });
      }

      return newUser;
    });

    return res.status(201).json({
      message: `${formattedRole} account and profile created successfully`,
      user: result,
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Prisma Unique Constraint Failure gracefully
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'A record with this email already exists in the database.',
      });
    }

    return res.status(500).json({ error: 'Failed to create user account' });
  }
};
// @desc    Authenticate user & get JWT token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log('LOGIN FAIL: No user found for this:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Lookup or auto-create MongoDB Parent profile if role is PARENT
    let parentId: string | undefined = undefined;

    if (user.role === 'PARENT') {
      let parentProfile = await prisma.parent.findUnique({
        where: { email: normalizedEmail },
      });

      // Auto-heal missing Parent collection document
      if (!parentProfile) {
        parentProfile = await prisma.parent.create({
          data: {
            name: user.name,
            email: user.email,
            phone: '',
            relationship: 'Guardian',
            studentIds: [],
          },
        });
      }

      parentId = parentProfile.id;
    }

    const jwtSecret: Secret = process.env.JWT_SECRET || 'development-secret';
    const signOptions: SignOptions = { expiresIn: '1d' };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, parentId },
      jwtSecret,
      signOptions
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        parentId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
};

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.users.update({
      where: { email },
      data: {
        resetPasswordToken,
        resetPasswordExpire,
      },
    });

    res.status(200).json({
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  const rawToken = req.params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing token' });
  }

  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.users.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.status(200).json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};