import express, { Router } from 'express';
import {
  submitAssignment,
  getSubmissionsByAssignment,
  gradeSubmission,
} from '../controllers/submissionController.js';
import { upload } from '../middlewares/upload.js'; // 1. Import Multer upload
import { authorizedRoles, protectRoute } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

router.use(protectRoute);

// ... swagger docs ...

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Submit an assignment
 *     tags: [Submissions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               assignmentId:
 *                 type: string
 *               studentId:
 *                 type: string
 *               studentName:
 *                 type: string
 *               studentClass:
 *                 type: string
 *               content:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 */
// 2. Add upload.array('attachments') middleware here:
router.post('/', authorizedRoles('STUDENT', 'ADMIN', 'TEACHER'), upload.array('attachments'), submitAssignment);

router.get('/assignment/:assignmentId', authorizedRoles('ADMIN', 'TEACHER', 'STUDENT'), getSubmissionsByAssignment);
router.put('/:id/grade', authorizedRoles('ADMIN', 'TEACHER'), gradeSubmission);

export default router;