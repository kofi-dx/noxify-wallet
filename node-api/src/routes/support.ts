import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createSupportTicket,
  getUserTickets,
  getTicket,
  addUserMessage
} from '../controllers/supportController';

const router = Router();

router.use(authenticateToken);

router.post('/tickets', createSupportTicket);
router.get('/tickets', getUserTickets);
router.get('/tickets/:ticketId', getTicket);
router.post('/tickets/:ticketId/messages', addUserMessage);

export default router;