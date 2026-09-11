import express, { type Router } from "express";
import {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
} from "../controllers/studentController.js";
import { authorizedRoles, protectRoute } from "../middlewares/authMiddlewares.js";

const router: Router = express.Router();

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Retrieve a list of students
 *     description: Retrieve a list of all students enrolled in the school.
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: A list of students.
 */

// Required login for all student routes
router.use(protectRoute);

// Read Endpoints (Admin & Teacher can view)
router.get('/', authorizedRoles('ADMIN', 'TEACHER'), getStudents);

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Add a new student
 *     tags: [Students]
 *     # ... (rest of the POST swagger comment here)
 */
router.get('/:id', authorizedRoles('ADMIN', 'TEACHER'), getStudentById)

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Add a new student
 *     description: Register a new student into the school management system.
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               email:
 *                 type: string
 *                 example: "jane.smith@example.com"
 *               classId:
 *                 type: string
 *                 description: Valid MongoDB ObjectId for the class
 *                 example: "65ab1234567890abcdef1234"
 *     responses:
 *       201:
 *         description: Student created successfully.
 *       400:
 *         description: Invalid input data or email already exists.
 *       500:
 *         description: Server error.
 */
// Write Endpoints (Admin only)
router.post('/', authorizedRoles("ADMIN"), createStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update student details
 *     description: Update the profile information of an existing student.
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The exact ID of the student to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               classId:
 *                 type: string
 *                 example: "65ab1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Student updated successfully.
 *       404:
 *         description: Student not found.
 *       500:
 *         description: Server error.
 */
router.put('/:id', authorizedRoles('ADMIN'), updateStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete a student
 *     description: Remove a student from the school management system entirely.
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The exact ID of the student to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully.
 *       404:
 *         description: Student not found.
 *       500:
 *         description: Server error.
 */
router.delete('/:id', authorizedRoles('ADMIN'), deleteStudent);


export default router;