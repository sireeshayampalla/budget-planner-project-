import { Router } from 'express';
import { InsightController } from '../controllers/insight.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware
router.use(protect as any);

router.get('/', InsightController.getInsights as any);
router.get('/dashboard', InsightController.getDashboardStats as any);

export default router;
