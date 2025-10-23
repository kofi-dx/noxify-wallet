import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createWallet, getWallets, getWalletBalance } from '../controllers/walletController';

const router = Router();

// All wallet routes require authentication
router.use(authenticateToken);

router.post('/create', createWallet);
router.get('/list', getWallets);
router.get('/balance/:address', getWalletBalance);

export default router;