import { Router } from 'express';
import authRoutes from './auth';
import walletRoutes from './wallet';
import transactionRoutes from './transaction';
import merchantRoutes from './merchant';
import paymentRoutes from './payment';
import adminRoutes from './admin';
import businessRoutes from './business';
import customerRoutes from './customer';
import kycRoutes from './kyc';
import supportRoutes from './support';
import profileRoutes from './profile'; // 🆕 ADD

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/transaction', transactionRoutes);
router.use('/merchant', merchantRoutes);
router.use('/pay', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/business', businessRoutes);
router.use('/customer', customerRoutes);
router.use('/kyc', kycRoutes);
router.use('/support', supportRoutes);
router.use('/profile', profileRoutes); // 🆕 ADD

export default router;