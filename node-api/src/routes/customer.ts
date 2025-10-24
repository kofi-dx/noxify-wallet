import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createCustomerProfile, getCustomerProfile } from '../controllers/customerController';

const router = Router();

router.use(authenticateToken);

router.post('/profile', createCustomerProfile);
router.get('/profile', getCustomerProfile);

export default router;