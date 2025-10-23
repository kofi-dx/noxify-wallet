import { Router } from 'express';
import authRoutes from './auth';
import walletRoutes from './wallet';
import transactionRoutes from './transaction'; // Add this

const router = Router();

// Use routes
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/transaction', transactionRoutes); // Add this

// Default route
router.get('/', (req, res) => {
  res.json({
    message: 'Noxify Wallet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      wallet: '/api/wallet',
      transaction: '/api/transaction', // Add this
      health: '/health'
    }
  });
});

export default router;