import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { completeBusinessProfile, getDashboardData } from '../controllers/profileController';

const router = Router();

router.use(authenticateToken);

router.post('/complete-business', completeBusinessProfile);
router.get('/dashboard', getDashboardData);

export default router;