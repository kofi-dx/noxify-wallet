// src/routes/merchant.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authenticateMerchant } from '../middleware/merchantAuth';
import {
  registerMerchant,
  createPaymentLink,
  getPayments,
  getPaymentStatus,
} from '../controllers/merchantController';

const router = Router();

// User-facing merchant routes (require JWT)
router.post('/register', authenticateToken, registerMerchant);

// API routes (require API key)
router.post('/payments', authenticateMerchant, createPaymentLink);
router.get('/payments', authenticateMerchant, getPayments);
router.get('/payments/:paymentId', authenticateMerchant, getPaymentStatus);

export default router;