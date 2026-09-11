import express, { type Router} from 'express';
import { getGrades, getGradeById, createGrade, updateGrade, deleteGrade } from '../controllers/gradeController.js';

import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

// Require login for all grade endpoint
router.use(protectRoute);


/**
 * @swagger
 * /api/grades:
 *   get:
 *     summary: Retrieve all grades
 *     description: Fetch a list of all recorded grades. Accessible by Admins and Teachers.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grades retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.get('/', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getGrades);

/**
 * @swagger
 * /api/grades/{id}:
 *   get:
 *     summary: Retrieve a single grade by ID
 *     description: Fetch detailed grade information for a specific record. Accessible by Admins and Teachers.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The grade ID
 *     responses:
 *       200:
 *         description: Grade retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       404:
 *         description: Grade not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getGradeById);

/**
 * @swagger
 * /api/grades:
 *   post:
 *     summary: Record a new grade
 *     description: Add a new grade record for a student. Accessible by Admins and Teachers.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - subjectId
 *               - score
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10012345678"
 *               subjectId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10087654321"
 *               score:
 *                 type: number
 *                 example: 88.5
 *               remarks:
 *                 type: string
 *                 example: "Excellent performance in midterm exam"
 *     responses:
 *       201:
 *         description: Grade recorded successfully
 *       400:
 *         description: Bad request - Missing or invalid input fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.post('/', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), createGrade);

/**
 * @swagger
 * /api/grades/{id}:
 *   put:
 *     summary: Update an existing grade
 *     description: Update score or remarks for a grade record by ID. Accessible by Admins and Teachers.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The grade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 example: 92.0
 *               remarks:
 *                 type: string
 *                 example: "Score adjusted after re-evaluation"
 *     responses:
 *       200:
 *         description: Grade updated successfully
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       404:
 *         description: Grade not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), updateGrade);

/**
 * @swagger
 * /api/grades/{id}:
 *   delete:
 *     summary: Delete a grade record
 *     description: Permanently remove a grade entry from the database. Accessible ONLY by Admins.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The grade ID
 *     responses:
 *       200:
 *         description: Grade deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Grade not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteGrade);

export default router;
