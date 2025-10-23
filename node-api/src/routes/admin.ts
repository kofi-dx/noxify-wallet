// src/routes/admin.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getPendingMerchants, 
  approveMerchant, 
  getDashboardStats 
} from '../controllers/adminController';

const router = Router();

// Admin routes (add admin role check in middleware later)
router.use(authenticateToken);

router.get('/merchants/pending', getPendingMerchants);
router.patch('/merchants/:merchantId/approve', approveMerchant);
router.get('/stats', getDashboardStats);

export default router;