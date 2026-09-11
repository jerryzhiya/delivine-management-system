import express, { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser, getMyProfile, updateMyProfile } from '../controllers/userController.js';
import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js'; 

const router: Router = express.Router();

router.get('/me', protectRoute, getMyProfile);
router.put('/me', protectRoute, updateMyProfile);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Fetch all users in the system. Can be filtered by role. Only accessible by Admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, TEACHER, ADMIN, PARENT]
 *         required: false
 *     responses:
 *       200:
 *         description: A list of users retrieved successfully
 */
router.get('/', protectRoute, authorizedRoles('ADMIN'), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Retrieve a single user by ID
 *     description: Fetch detailed information for a single user by their ID. Only accessible by Admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/:id', protectRoute, authorizedRoles('ADMIN'), getUserById);
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user's details
 *     description: Update specific fields (name, email, role) of a user. Only accessible by Admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
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
 *               role:
 *                 type: string
 *                 enum: [STUDENT, TEACHER, ADMIN, PARENT]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', protectRoute, authorizedRoles('ADMIN'), updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Remove a user from the system permanently. Only accessible by Admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteUser);

export default router;