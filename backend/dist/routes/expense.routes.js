import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { EXPENSE_CATEGORIES } from '../config/constants.js';
const router = Router();
// Apply auth middleware to all expense routes
router.use(protect);
router.get('/', ExpenseController.getExpenses);
router.post('/', validateBody([
    { field: 'amount', type: 'number', required: true, min: 0.01 },
    { field: 'category', type: 'string', required: true, enum: EXPENSE_CATEGORIES },
    { field: 'description', type: 'string', required: false, max: 200 },
    { field: 'date', type: 'date', required: false }
]), ExpenseController.createExpense);
router.put('/:id', validateBody([
    { field: 'amount', type: 'number', required: false, min: 0.01 },
    { field: 'category', type: 'string', required: false, enum: EXPENSE_CATEGORIES },
    { field: 'description', type: 'string', required: false, max: 200 },
    { field: 'date', type: 'date', required: false }
]), ExpenseController.updateExpense);
router.delete('/:id', ExpenseController.deleteExpense);
export default router;
