import express, { type Router } from "express";
import { getPayment, getPaymentStats, createPayment, updatePaymentStatus } from "../controllers/paymentController.js";
import { protectRoute, authorizedRoles } from "../middlewares/authMiddlewares.js";

const router: Router = express.Router();

// Required authentication for all payemnet endpoint
router.use(protectRoute);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Retrieve payment records
 *     description: Fetch a list of all payment records. Accessible by Admins and Teachers.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.get('/', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getPayment);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Retrieve payment statistics
 *     description: Fetch overall analytics, total revenue, and payment status summaries. Accessible by Admins and Teachers.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN or TEACHER role
 *       500:
 *         description: Internal server error
 */
router.get('/stats', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getPaymentStats);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     description: Record a new payment entry in the system. Accessible ONLY by Admins.
 *     tags: [Payments]
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
 *               - amount
 *               - paymentMethod
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "65b2a1c8f3a9e10012345678"
 *               amount:
 *                 type: number
 *                 example: 1500.00
 *               paymentMethod:
 *                 type: string
 *                 example: "BANK_TRANSFER"
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED]
 *                 example: "COMPLETED"
 *               description:
 *                 type: string
 *                 example: "First semester tuition fee"
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Bad request - Missing or invalid input fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', protectRoute, authorizedRoles('ADMIN'), createPayment);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   patch:
 *     summary: Update payment status
 *     description: Update the status of a specific payment record (e.g., PENDING to COMPLETED). Accessible ONLY by Admins.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *                 example: "COMPLETED"
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Bad request - Invalid status value
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/status', protectRoute, authorizedRoles('ADMIN'), updatePaymentStatus);
router.patch('/:id/record', protectRoute, authorizedRoles('ADMIN'), updatePaymentStatus);
export default router;