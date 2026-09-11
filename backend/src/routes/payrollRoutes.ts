import express, { type Router } from 'express';
import {
  createPayrollRecord,
  getPayrollRecords,
  getPayrollStats,
  updatePayrollStatus,
} from '../controllers/payrollController.js';
import { authorizedRoles, protectRoute } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

router.use(protectRoute, authorizedRoles('ADMIN'));
router.get('/', getPayrollRecords);
router.get('/stats', getPayrollStats);
router.post('/', createPayrollRecord);
router.patch('/:id/status', updatePayrollStatus);

export default router;