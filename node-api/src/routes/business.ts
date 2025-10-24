import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { registerBusiness, getBusinessProfile } from '../controllers/businessController';

const router = Router();

router.use(authenticateToken);

router.post('/register', registerBusiness);
router.get('/profile', getBusinessProfile);

export default router;