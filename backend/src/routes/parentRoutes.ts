import express, { type Router } from 'express';
import {
  getParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  linkStudentToParent,
  unlinkStudentFromParent,
} from '../controllers/parentController.js';
import { protectRoute, authorizedRoles } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

router.get('/', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getParents);
router.get('/me', protectRoute, authorizedRoles('ADMIN', 'PARENT'), getParentById);
router.get('/:id', protectRoute, authorizedRoles('ADMIN', 'TEACHER', 'PARENT'), getParentById);

router.post('/', protectRoute, authorizedRoles('ADMIN'), createParent);
router.put('/:id', protectRoute, authorizedRoles('ADMIN'), updateParent);
router.post('/:id/link-student', protectRoute, authorizedRoles('ADMIN'), linkStudentToParent);
router.delete('/:id/unlink-student/:studentId', protectRoute, authorizedRoles('ADMIN'), unlinkStudentFromParent);
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteParent);

export default router;