import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createKYCApplication,
  submitKYCApplication,
  getKYCApplication,
  getKYCLimits,
  uploadKYCDocument,
  getPendingKYCApplications,
  approveKYCApplication,
  rejectKYCApplication
} from '../controllers/kycController';

const router = Router();

// User routes
router.use(authenticateToken);

router.post('/application', createKYCApplication);
router.post('/application/submit', submitKYCApplication);
router.get('/application', getKYCApplication);
router.get('/limits', getKYCLimits);
router.post('/documents/upload', uploadKYCDocument);

// Admin routes (add admin middleware later)
router.get('/admin/applications/pending', getPendingKYCApplications);
router.patch('/admin/applications/:applicationId/approve', approveKYCApplication);
router.patch('/admin/applications/:applicationId/reject', rejectKYCApplication);

export default router;