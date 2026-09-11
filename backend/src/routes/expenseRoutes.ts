import express, { type Router } from 'express';
import { createExpense, deleteExpense, getExpenseStats, getExpenses, updateExpense, updateExpenseStatus } from '../controllers/expenseController.js';
import { authorizedRoles, protectRoute } from '../middlewares/authMiddlewares.js';

const router: Router = express.Router();

router.use(protectRoute, authorizedRoles('ADMIN'));
router.get('/', getExpenses);
router.get('/stats', getExpenseStats);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.patch('/:id/status', updateExpenseStatus);
router.delete('/:id', deleteExpense);

export default router;