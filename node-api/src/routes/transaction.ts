import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  sendTransaction, 
  getTransactionHistory, 
  getTransaction,
  getGasPrices,
  getGasEstimate 
} from '../controllers/transactionController';

const router = Router();

// All transaction routes require authentication
router.use(authenticateToken);

router.post('/send', sendTransaction);
router.get('/history/:address', getTransactionHistory);
router.get('/:hash', getTransaction);
router.get('/gas/prices', getGasPrices);
router.post('/gas/estimate', getGasEstimate);

export default router;