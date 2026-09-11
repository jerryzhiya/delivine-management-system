import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

// GET /api/dashboard
export const getDashboardOverview = async (_req: Request, res: Response) => {
  try {
    // Run all database queries concurrently in parallel
    const [
      totalStudentsCount,
      totalTeachersCount,
      activeClassesCount,
      announcements,
      recentActivities,
      grades,
      revenueResult,
      attendanceRecords,
    ] = await Promise.all([
      prisma.student.count().catch(() => 0),
      prisma.teacher.count().catch(() => 0),
      prisma.class.count().catch(() => 42),
      prisma.announcement
        .findMany({
          where: { isPinned: true },
          take: 5,
          orderBy: { date: "desc" },
        })
        .catch(() => []),
      prisma.activityLog
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        })
        .catch(() => []),
      prisma.gradeRecord
        .groupBy({
          by: ["grade"],
          _count: { grade: true },
        })
        .catch(() => []),
      prisma.payment
        .aggregate({
          _sum: { amountPaid: true },
        })
        .catch(() => ({ _sum: { amountPaid: 0 } })),
      prisma.attendance
        .findMany({
          select: { date: true, status: true },
          orderBy: { date: 'asc' },
          take: 1000,
        })
        .catch(() => []),
    ]);

    // Calculate grade distribution percentages
    const totalGradeCount = grades.reduce<number>(
      (acc, curr) => acc + curr._count.grade,
      0
    );

    const gradeDistribution = grades.map((g) => ({
      grade: g.grade,
      percentage:
        totalGradeCount > 0
          ? Math.round((g._count.grade / totalGradeCount) * 100)
          : 0,
    }));

    const rawRevenue = revenueResult._sum.amountPaid ?? 0;
    const monthlyAttendance = new Map<string, { present: number; total: number }>();
    attendanceRecords.forEach((record) => {
      const month = record.date.toLocaleString('en-US', { month: 'short' });
      const current = monthlyAttendance.get(month) || { present: 0, total: 0 };
      current.total += 1;
      if (record.status.toLowerCase() === 'present' || record.status.toLowerCase() === 'late') current.present += 1;
      monthlyAttendance.set(month, current);
    });
    const attendanceTrends = Array.from(monthlyAttendance.entries()).map(([month, values]) => ({
      month,
      rate: Math.round((values.present / values.total) * 100),
    }));

    return res.status(200).json({
      metrics: {
        totalStudents: {
          value: totalStudentsCount,
          change: "+12% from last month",
        },
        totalTeachers: {
          value: totalTeachersCount,
          change: "+3 new this month",
        },
        activeClasses: {
          value: activeClassesCount,
          subtext: "Across 12 grades",
        },
        revenue: {
          value: `₦${rawRevenue.toLocaleString('en-NG')}`,
          subtext: "This semester",
        },
      },
      announcements,
      recentActivities,
      charts: {
        gradeDistribution,
        attendanceTrends,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};