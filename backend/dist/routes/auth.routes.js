import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
// Register route
router.post('/register', validateBody([
    { field: 'username', type: 'string', required: true, min: 3, max: 30 },
    { field: 'email', type: 'email', required: true },
    { field: 'password', type: 'string', required: true, min: 6 }
]), AuthController.register);
// Login route
router.post('/login', validateBody([
    { field: 'email', type: 'email', required: true },
    { field: 'password', type: 'string', required: true }
]), AuthController.login);
// Get current user profile
router.get('/me', protect, AuthController.me);
router.get('/profile', protect, AuthController.me);
// Forgot password route
router.post('/forgot-password', validateBody([
    { field: 'username', type: 'string', required: true },
    { field: 'email', type: 'email', required: true },
    { field: 'newPassword', type: 'string', required: true, min: 6 }
]), AuthController.forgotPassword);
export default router;
