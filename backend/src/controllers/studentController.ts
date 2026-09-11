import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { logActivity } from '../utils/activityLogger.js';
import type { StudentStatus } from '@prisma/client';

// @desc    Get all students (Optional filter by ?status=ACTIVE or ?isActive=true)
// @route   GET /api/students
// @access  Private (Admin & Teacher)
export const getStudents = async (req: Request, res: Response) => {
  try {
    const { status, isActive, class: className } = req.query;

    const whereClause: Record<string, unknown> = {};
    if (status && typeof status === 'string') {
      whereClause.status = status as StudentStatus;
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: { lastName: 'asc' },
    });

    const normalizedClassName = typeof className === 'string'
      ? className.trim().replace(/\s+/g, ' ').toLowerCase()
      : null;
    const filteredStudents = normalizedClassName
      ? students.filter((student) => student.grade?.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedClassName)
      : students;

    res.status(200).json(filteredStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// @desc    Get single student by ID with full historical records
// @route   GET /api/students/:id
// @access  Private (Admin & Teacher)
export const getStudentById = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        gradeRecords: true,
        payments: true,
        submission: true,
        attendance: true,
        parents: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

// @desc    Add a new student
// @route   POST /api/students
// @access  Private (Admin only)
export const createStudent = async (req: Request, res: Response) => {
  // 1. Destructure avatar from req.body
  const { firstName, middleName, lastName, grade, status, avatar } = req.body;
  const normalizedGrade = typeof grade === 'string' ? grade : '';

  try {
    const newStudent = await prisma.student.create({
      data: {
        firstName,
        middleName,
        lastName,
        avatar, // 2. Pass avatar to Prisma
        grade: normalizedGrade,
        status: status || 'ACTIVE',
        isActive: true,
      },
    });

    await logActivity('New student enrolled', `${firstName} ${lastName}`, 'student');

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

// @desc    Update student details & status
// @route   PUT /api/students/:id
// @access  Private (Admin only)
export const updateStudent = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  // 1. Destructure avatar from req.body
  const { firstName, middleName, lastName, grade, status, isActive, avatar } = req.body;
  const normalizedGrade = typeof grade === 'string' ? grade : '';

  try {
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        middleName,
        lastName,
        grade: normalizedGrade,
        ...(avatar !== undefined && { avatar }), // 2. Update avatar if sent
        ...(status && { status }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};
// @desc    Soft-delete / Deactivate a student (Preserves history & relations)
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
export const deleteStudent = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  try {
    // Soft deletion: set status to WITHDRAWN and deactivate user account
    const deactivatedStudent = await prisma.student.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        isActive: false,
      },
    });

    await logActivity(
      'Student deactivated',
      `${deactivatedStudent.firstName} ${deactivatedStudent.lastName}`,
      'student'
    );

    res.status(200).json({
      message: 'Student record deactivated and soft-deleted successfully',
      student: deactivatedStudent,
    });
  } catch (error) {
    console.error('Error deactivating student:', error);
    res.status(500).json({ error: 'Failed to deactivate student' });
  }
};