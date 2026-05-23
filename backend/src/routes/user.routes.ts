import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

// All user routes are protected
router.use(protect);

router.get('/profile', UserController.getProfile as any);
router.put('/profile', validateBody([
  { field: 'username', type: 'string', required: false, min: 3 },
  { field: 'email', type: 'email', required: false },
  { field: 'avatar', type: 'string', required: false },
  { field: 'currency', type: 'string', required: false },
  { field: 'theme', type: 'string', required: false }
]), UserController.updateProfile as any);

router.put('/change-password', validateBody([
  { field: 'currentPassword', type: 'string', required: true },
  { field: 'newPassword', type: 'string', required: true, min: 6 }
]), UserController.changePassword as any);

export default router;
