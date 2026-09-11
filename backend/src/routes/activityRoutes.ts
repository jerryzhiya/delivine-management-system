import express, { Router } from 'express';
import { getActivities } from '../controllers/activityController.js';
import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

router.use(protectRoute);

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get recent activities
 *     description: Retrieves the 10 most recent actions (enrollments, payments, etc.) for the activity feed.
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: A list of recent activities.
 */
router.get('/', authorizedRoles('ADMIN', 'TEACHER'), getActivities);

export default router;