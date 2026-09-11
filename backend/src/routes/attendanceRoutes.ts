import express, { Router } from 'express';
import {
  getAttendance,
  getAttendanceStats,
  markBulkAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Retrieve attendance records
 *     description: Fetch attendance records with optional filtering by student, class, or date. Accessible by Admins and Teachers.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter attendance by student ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter attendance by class ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter attendance by specific date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.get('/', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getAttendance);

/**
 * @swagger
 * /api/attendance/stats:
 *   get:
 *     summary: Get overall attendance statistics
 *     description: Retrieve total counts and overall attendance rates for dashboard analytics. Accessible by Admins and Teachers.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance statistics fetched successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.get('/stats', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getAttendanceStats);

/**
 * @swagger
 * /api/attendance/bulk:
 *   post:
 *     summary: Mark bulk attendance
 *     description: Record attendance status for multiple students at once. Accessible by Admins and Teachers.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-16T08:00:00.000Z"
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                     - status
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       example: "65b2a1c8f3a9e10012345678"
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, LATE, EXCUSED]
 *                       example: "PRESENT"
 *                     remarks:
 *                       type: string
 *                       example: "Arrived 10 mins late"
 *     responses:
 *       201:
 *         description: Attendance recorded successfully
 *       400:
 *         description: Bad request - Missing or invalid records array
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.post('/bulk', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), markBulkAttendance);

/**
 * @swagger
 * /api/attendance/{id}:
 *   put:
 *     summary: Update an attendance record
 *     description: Modify the attendance status or remarks for a specific record ID. Accessible by Admins and Teachers.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The attendance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, EXCUSED]
 *                 example: "EXCUSED"
 *               remarks:
 *                 type: string
 *                 example: "Medical note submitted"
 *     responses:
 *       200:
 *         description: Attendance record updated successfully
 *       400:
 *         description: Bad request - Invalid ID parameter
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       404:
 *         description: Attendance record not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), updateAttendance);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Delete an attendance record
 *     description: Permanently remove an attendance entry. Accessible ONLY by Admins.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The attendance record ID
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Attendance record not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteAttendance);

export default router;