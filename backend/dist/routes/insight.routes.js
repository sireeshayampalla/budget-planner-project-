import { Router } from 'express';
import { InsightController } from '../controllers/insight.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
// Apply auth middleware
router.use(protect);
router.get('/', InsightController.getInsights);
router.get('/dashboard', InsightController.getDashboardStats);
export default router;
