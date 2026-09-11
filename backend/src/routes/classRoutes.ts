import express, { type Router } from "express";
import { protectRoute, authorizedRoles } from "../middlewares/authMiddlewares.js";
import { getClasses, getClassById, createClass, updateClass, assignTeacherToClass, deleteClass } from "../controllers/classController.js";

const router: Router = express.Router();

router.get('/', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getClasses);
router.get('/:id', protectRoute, authorizedRoles('ADMIN', 'TEACHER'), getClassById);
router.post('/', protectRoute, authorizedRoles('ADMIN'), createClass);
router.put('/:id', protectRoute, authorizedRoles('ADMIN'), updateClass);
router.put('/:id/assign-teacher', protectRoute, authorizedRoles('ADMIN'), assignTeacherToClass);
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteClass);


export default router;