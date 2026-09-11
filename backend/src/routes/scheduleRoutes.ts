import express, { Router } from 'express';
import {
  getSchedule,
  createSchedulePeriod,
  updateSchedulePeriod,
  deleteSchedulePeriod,
} from '../controllers/scheduleController.js';
import { authorizedRoles, protectRoute } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

router.use(protectRoute);

/**
 * @swagger
 * components:
 *   schemas:
 *     SchedulePeriod:
 *       type: object
 *       required:
 *         - classId
 *         - dayOfWeek
 *         - startTime
 *         - endTime
 *         - subject
 *       properties:
 *         id:
 *           type: string
 *         classId:
 *           type: string
 *           example: "Class 10-A"
 *         dayOfWeek:
 *           type: string
 *           example: "Monday"
 *         startTime:
 *           type: string
 *           example: "08:00"
 *         endTime:
 *           type: string
 *           example: "09:00"
 *         subject:
 *           type: string
 *           example: "Mathematics"
 *         teacherName:
 *           type: string
 *           example: "Dr. Anderson"
 *         room:
 *           type: string
 *           example: "Room 101"
 *         isBreak:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Retrieve class timetable schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID (e.g., Class 10-A)
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: string
 *         description: Filter by day (e.g., Monday)
 *     responses:
 *       200:
 *         description: Schedule records retrieved successfully
 */
router.get('/', authorizedRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), getSchedule);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Add a period to the schedule
 *     tags: [Schedule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchedulePeriod'
 *     responses:
 *       201:
 *         description: Schedule period added successfully
 */
router.post('/', authorizedRoles('ADMIN'), createSchedulePeriod);

/**
 * @swagger
 * /api/schedule/{id}:
 *   put:
 *     summary: Update a schedule period
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchedulePeriod'
 *     responses:
 *       200:
 *         description: Schedule period updated successfully
 */
router.put('/:id', authorizedRoles('ADMIN'), updateSchedulePeriod);

/**
 * @swagger
 * /api/schedule/{id}:
 *   delete:
 *     summary: Delete a schedule period
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule period deleted successfully
 */
router.delete('/:id', authorizedRoles('ADMIN'), deleteSchedulePeriod);

export default router;