import express, { type Router } from "express";
import { getDashboardOverview } from "../controllers/dashboardController.js";
import { authorizedRoles, protectRoute } from "../middlewares/authMiddlewares.js";


const router: Router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieves total students, teachers, revenue, and active classes.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully.
 */
router.get("/", protectRoute, authorizedRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), getDashboardOverview);


export default router;