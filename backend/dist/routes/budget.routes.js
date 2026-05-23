import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { EXPENSE_CATEGORIES } from '../config/constants.js';
const router = Router();
// Apply auth guard to all routes
router.use(protect);
router.get('/', BudgetController.getBudgets);
router.get('/breakdown', BudgetController.getBudgetVSExpense);
router.post('/', validateBody([
    { field: 'category', type: 'string', required: true, enum: EXPENSE_CATEGORIES },
    { field: 'limit', type: 'number', required: true, min: 0.01 },
    { field: 'month', type: 'number', required: false, min: 1, max: 12 },
    { field: 'year', type: 'number', required: false }
]), BudgetController.createBudget);
router.put('/:id', validateBody([
    { field: 'limit', type: 'number', required: true, min: 0.01 }
]), BudgetController.updateBudget);
router.delete('/:id', BudgetController.deleteBudget);
export default router;
