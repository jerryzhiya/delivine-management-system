import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/attendance (Filter by classId, studentId, or date)
export const getAttendance = async (req: Request, res: Response) => {
  const { studentId, classId, date } = req.query;

  try {
    const whereClause: Record<string, any> = {};

    if (studentId && typeof studentId === 'string') {
      whereClause.studentId = studentId;
    }

    if (classId && typeof classId === 'string') {
      whereClause.classId = classId;
    }

    if (date && typeof date === 'string') {
      const startOfDay = new Date(date);
      if (isNaN(startOfDay.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

// GET /api/attendance/stats
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const [totalRecords, presentRecords] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: 'PRESENT' } }),
    ]);

    const overallRate = totalRecords === 0 ? 0 : Math.round((presentRecords / totalRecords) * 100);

    return res.status(200).json({
      totalRecords,
      presentRecords,
      overallAttendanceRate: `${overallRate}%`,
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
};

// POST /api/attendance/bulk (Mark attendance for a class with duplicate filtering)
export const markBulkAttendance = async (req: Request, res: Response) => {
  const { records, date } = req.body;
  // records format: [{ studentId: "65b...", status: "PRESENT", remarks: "" }]

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'A non-empty records array is required' });
  }

  try {
    const attendanceDate = date ? new Date(date) : new Date();
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format provided' });
    }

    // 1. Set full 24-hour UTC window for the requested date
    const startOfDay = new Date(attendanceDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 2. Collect all student IDs from the request body
    const studentIds = records
      .map((item: { studentId: string }) => item.studentId)
      .filter(Boolean);

    // 3. Find students who already have attendance logged for this date
    const existingRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingRecords.map((rec) => rec.studentId));

    // 4. Filter out any student who already has a record for today
    const filteredRecords = records.filter(
      (item: { studentId: string }) => !existingStudentIds.has(item.studentId)
    );

    if (filteredRecords.length === 0) {
      return res.status(200).json({
        message: 'Attendance has already been recorded for all submitted students on this date.',
        count: 0,
        skippedCount: records.length,
      });
    }

    // 5. Format valid records for bulk insertion
    const formattedData = filteredRecords.map(
      (item: { studentId: string; status: string; remarks?: string }) => ({
        studentId: item.studentId,
        status: item.status,
        remarks: item.remarks || '',
        date: attendanceDate,
      })
    );

    // 6. Perform bulk create without multi-document transaction errors
    const result = await prisma.attendance.createMany({
      data: formattedData,
    });

    return res.status(201).json({
      message: 'Attendance recorded successfully',
      count: result.count,
      skippedCount: records.length - result.count,
    });
  } catch (error) {
    console.error('Error marking bulk attendance:', error);
    return res.status(500).json({ error: 'Failed to record attendance' });
  }
};

// PUT /api/attendance/:id
export const updateAttendance = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Attendance ID is required' });
  }

  const { status, remarks } = req.body;

  try {
    const existingRecord = await prisma.attendance.findUnique({ where: { id } });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const updatedRecord = await prisma.attendance.update({
      where: { id },
      data: {
        status: status ?? existingRecord.status,
        remarks: remarks !== undefined ? remarks : existingRecord.remarks,
      },
    });

    return res.status(200).json(updatedRecord);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({ error: 'Failed to update attendance record' });
  }
};

// DELETE /api/attendance/:id
export const deleteAttendance = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Attendance ID is required' });
  }

  try {
    const existingRecord = await prisma.attendance.findUnique({ where: { id } });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    await prisma.attendance.delete({ where: { id } });

    return res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({ error: 'Failed to delete attendance record' });
  }
};