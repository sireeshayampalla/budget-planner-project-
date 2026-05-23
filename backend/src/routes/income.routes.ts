import { Router } from 'express';
import { IncomeController } from '../controllers/income.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware to all income routes
router.use(protect as any);

router.get('/', IncomeController.getIncomes as any);

router.post(
  '/',
  validateBody([
    { field: 'amount', type: 'number', required: true, min: 0.01 },
    { field: 'source', type: 'string', required: true, min: 1, max: 100 },
    { field: 'description', type: 'string', required: false, max: 200 },
    { field: 'date', type: 'date', required: false }
  ]),
  IncomeController.createIncome as any
);

router.put(
  '/:id',
  validateBody([
    { field: 'amount', type: 'number', required: false, min: 0.01 },
    { field: 'source', type: 'string', required: false, min: 1, max: 100 },
    { field: 'description', type: 'string', required: false, max: 200 },
    { field: 'date', type: 'date', required: false }
  ]),
  IncomeController.updateIncome as any
);

router.delete('/:id', IncomeController.deleteIncome as any);

export default router;
