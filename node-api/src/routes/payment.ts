// src/routes/payment.ts - UPDATE THIS FILE
import { Router } from 'express';
import { 
  getPaymentPage, 
  getPaymentStatus, 
  manuallyCheckPayment,
  initiateSimulatedPayment,      // 🆕 ADD THESE
  completeSimulatedPayment       // 🆕 ADD THESE
} from '../controllers/paymentController';

const router = Router();

// Public routes for customers
router.get('/:paymentId', getPaymentPage);
router.get('/:paymentId/status', getPaymentStatus);
router.post('/:paymentId/check', manuallyCheckPayment);

// 🆕 Simulated payment routes (for testing)
router.post('/simulate/initiate', initiateSimulatedPayment);
router.post('/simulate/complete', completeSimulatedPayment);

export default router;