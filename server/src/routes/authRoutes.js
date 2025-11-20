import { Router } from 'express';
import { register, login, getMe, updateMe, logout, adminResetPassword } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.post('/logout', requireAuth, logout);

// Admin: reset a user's password (requires admin role)
router.post('/admin/users/:userId/password', requireAuth, requireRole('admin'), adminResetPassword);

export default router;
