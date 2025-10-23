// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth';
import walletRoutes from './wallet';
import transactionRoutes from './transaction';
import merchantRoutes from './merchant'; // Add this

const router = Router();

// Use routes
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/transaction', transactionRoutes);
router.use('/merchant', merchantRoutes); // Add this

export default router;