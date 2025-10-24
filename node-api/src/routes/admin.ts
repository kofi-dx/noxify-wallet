import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../controllers/adminController';
import {
    adminLogin,
  getAdminDashboard,
  getAllUsers,
  getDashboardStats,
  getUsers,
  getUserDetail,
  updateUserAccount,
  resetUserPassword,
  impersonateUser,
  getPendingKYCs,
  getPendingMerchants,
  approveMerchant,
  getSupportTickets,
  getSupportTicket,
  assignTicket,
  resolveTicket,
  addTicketMessage
} from '../controllers/adminController';
import { getPendingApprovals, approveUser } from '../controllers/approvalController'; // 🆕 FIXED IMPORT PATH

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

router.post('/login', adminLogin);
// Dashboard
router.get('/dashboard', getAdminDashboard);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users', getUsers);
router.get('/users/:userId', getUserDetail);
router.patch('/users/:userId', updateUserAccount);
router.post('/users/:userId/reset-password', resetUserPassword);
router.post('/users/:userId/impersonate', impersonateUser);

// KYC Management
router.get('/kyc/pending', getPendingKYCs);

// Merchant Management
router.get('/merchants/pending', getPendingMerchants);
router.patch('/merchants/:merchantId/approve', approveMerchant);

// Support Management
router.get('/support/tickets', getSupportTickets);
router.get('/support/tickets/:ticketId', getSupportTicket);
router.patch('/support/tickets/:ticketId/assign', assignTicket);
router.patch('/support/tickets/:ticketId/resolve', resolveTicket);
router.post('/support/tickets/:ticketId/messages', addTicketMessage);

// 🆕 Approval Management
router.get('/approvals/pending', getPendingApprovals);
router.patch('/users/:userId/approve', approveUser);

export default router;