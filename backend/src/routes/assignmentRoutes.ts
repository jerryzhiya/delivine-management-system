import express, { Router } from 'express';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { authorizedRoles, protectRoute } from '../middlewares/authMiddlewares.js';
import { upload } from '../middlewares/upload.js';

const router: Router = express.Router();

router.use(protectRoute);

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - classId
 *         - subject
 *         - description
 *         - dueDate
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Quadratic Equations Problem Set"
 *         type:
 *           type: string
 *           example: "HOMEWORK"
 *         classId:
 *           type: string
 *           example: "10-A"
 *         subject:
 *           type: string
 *           example: "Mathematics"
 *         description:
 *           type: string
 *           example: "Complete exercises 1-20 from Chapter 5."
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           example: ["/uploads/1787799427299-148077941.pdf"]
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: "2026-10-15T18:00:00Z"
 */

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get all assignments
 *     tags: [Assignments]
 *     responses:
 *       200:
 *         description: List of assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assignment'
 */
router.get('/', getAssignments);

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Create a new assignment with media files
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               classId:
 *                 type: string
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               totalStudents:
 *                 type: integer
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Assignment created
 */
router.post('/', authorizedRoles('ADMIN', 'TEACHER'), upload.array('files'), createAssignment);

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Update an assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               classId:
 *                 type: string
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               totalStudents:
 *                 type: integer
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Assignment updated
 */
router.put('/:id', authorizedRoles('ADMIN', 'TEACHER'), upload.array('files'), updateAssignment);

/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment deleted
 */
router.delete('/:id', authorizedRoles('ADMIN', 'TEACHER'), deleteAssignment);

export default router;