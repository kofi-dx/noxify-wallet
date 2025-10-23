// src/routes/index.ts - CHECK THIS FILE
import { Router } from 'express';
import authRoutes from './auth';
import walletRoutes from './wallet';
import transactionRoutes from './transaction';
import merchantRoutes from './merchant';
import paymentRoutes from './payment'; // Make sure this exists
import adminRoutes from './admin';

const router = Router();

// Use routes - CHECK THESE LINES
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/transaction', transactionRoutes);
router.use('/merchant', merchantRoutes);
router.use('/pay', paymentRoutes); // This should mount payment routes at /pay
router.use('/admin', adminRoutes);

export default router;