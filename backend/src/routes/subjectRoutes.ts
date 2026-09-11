import express, { Router } from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';
import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Retrieve all subjects
 *     description: Fetch a list of all curriculum subjects with optional class or teacher filters. Accessible by all authenticated users.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter subjects by Class ID
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter subjects assigned to a specific Teacher ID
 *     responses:
 *       200:
 *         description: List of subjects retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/', protectRoute, getSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Retrieve a subject by ID
 *     description: Fetch detailed information for a specific subject. Accessible by all authenticated users.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The subject ID
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', protectRoute, getSubjectById);

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject
 *     description: Add a new subject to the school curriculum and optionally assign a teacher or class. Accessible ONLY by Admins.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mathematics"
 *               code:
 *                 type: string
 *                 example: "MATH-101"
 *               description:
 *                 type: string
 *                 example: "Algebra, Geometry, and Calculus fundamentals"
 *               teacherId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10012345678"
 *               classId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10087654321"
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Bad request - Duplicate code or missing required fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', protectRoute, authorizedRoles('ADMIN'), createSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     description: Update subject details or reassign its teacher/class. Accessible ONLY by Admins.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Advanced Mathematics"
 *               code:
 *                 type: string
 *                 example: "MATH-201"
 *               description:
 *                 type: string
 *                 example: "Advanced calculus and statistics"
 *               teacherId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10012345678"
 *               classId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10087654321"
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', protectRoute, authorizedRoles('ADMIN'), updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     description: Remove a subject from the curriculum. Accessible ONLY by Admins.
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteSubject);

export default router;