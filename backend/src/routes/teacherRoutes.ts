import express, { type Router } from 'express';
import { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

// Require login for teacher routes
router.use(protectRoute);

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Retrieve all teachers
 *     tags: [Teachers]
 *     responses:
 *       200:
 *         description: A list of teachers.
 */
// Read endpoints (Admin & Teacher can view)
router.get('/', authorizedRoles('ADMIN', 'TEACHER'), getTeachers);

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get a teacher by ID
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single teacher object.
 */
router.get('/:id', authorizedRoles('ADMIN', 'TEACHER'), getTeacherById);

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Add a new teacher
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher created successfully.
 */
// Endpoints (Admin only)
router.post('/', authorizedRoles('ADMIN'), createTeacher);

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update teacher details
 *     tags: [Teachers]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher updated successfully.
 */
router.put('/:id', authorizedRoles('ADMIN'), updateTeacher);

/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teacher deleted successfully.
 */
router.delete('/:id', authorizedRoles('ADMIN'), deleteTeacher);

export default router;
