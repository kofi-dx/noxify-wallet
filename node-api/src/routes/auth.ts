import { Router } from 'express';
import { login, getProfile, registerWithRole, getApprovalStatus } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerWithRole);
router.post('/register-with-role', registerWithRole); // 🆕 Use this for role-based registration
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/approval-status', authenticateToken, getApprovalStatus);

export default router;