import { Request, Response } from 'express';
import kycService from '../services/kycService';

export const createKYCApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { type, tier, personalInfo, addressInfo, businessInfo } = req.body;

    const application = await kycService.createOrUpdateKYCApplication(userId, {
      type,
      tier,
      personalInfo,
      addressInfo,
      businessInfo
    });

    res.status(200).json({
      success: true,
      message: 'KYC application saved successfully',
      data: { application },
    });
  } catch (error: any) {
    console.error('Create KYC application error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create KYC application: ${error.message}`,
    });
  }
};

export const submitKYCApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    const application = await kycService.submitKYCApplication(userId);

    res.json({
      success: true,
      message: 'KYC application submitted for review',
      data: { application },
    });
  } catch (error: any) {
    console.error('Submit KYC application error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to submit KYC application: ${error.message}`,
    });
  }
};

export const getKYCApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    const application = await kycService.getKYCApplication(userId);

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'KYC application not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { application },
    });
  } catch (error: any) {
    console.error('Get KYC application error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get KYC application: ${error.message}`,
    });
  }
};

export const getKYCLimits = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { tier } = req.query;

    const application = await kycService.getKYCApplication(userId);
    const userTier = tier as string || application?.tier || '1';

    const limits = kycService.getKYCLimits(userTier);

    res.json({
      success: true,
      data: {
        tier: userTier,
        limits,
        kycStatus: application?.status || 'not_started'
      },
    });
  } catch (error: any) {
    console.error('Get KYC limits error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get KYC limits: ${error.message}`,
    });
  }
};

export const uploadKYCDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { kycApplicationId, documentType, fileName, fileUrl, fileSize, mimeType, metadata } = req.body;

    // Validate required fields
    if (!kycApplicationId || !documentType || !fileName || !fileUrl || !fileSize || !mimeType) {
      res.status(400).json({
        success: false,
        message: 'All document fields are required: kycApplicationId, documentType, fileName, fileUrl, fileSize, mimeType',
      });
      return;
    }

    // Validate document type
    const validDocumentTypes = ['id_front', 'id_back', 'selfie', 'proof_of_address', 'business_registration', 'tax_certificate', 'bank_statement', 'utility_bill'];
    if (!validDocumentTypes.includes(documentType)) {
      res.status(400).json({
        success: false,
        message: `Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}`,
      });
      return;
    }

    const document = await kycService.uploadKYCDocument(userId, kycApplicationId, {
      documentType,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document },
    });
  } catch (error: any) {
    console.error('Upload KYC document error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to upload document: ${error.message}`,
    });
  }
};

// Admin controllers
export const getPendingKYCApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { applications, total } = await kycService.getPendingApplications(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
    });
  } catch (error: any) {
    console.error('Get pending KYC applications error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get pending KYC applications: ${error.message}`,
    });
  }
};

export const approveKYCApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const adminId = (req as any).user?.userId;

    const application = await kycService.approveKYCApplication(applicationId, adminId);

    res.json({
      success: true,
      message: 'KYC application approved successfully',
      data: { application },
    });
  } catch (error: any) {
    console.error('Approve KYC application error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to approve KYC application: ${error.message}`,
    });
  }
};

export const rejectKYCApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const adminId = (req as any).user?.userId;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
      return;
    }

    const application = await kycService.rejectKYCApplication(applicationId, adminId, reason);

    res.json({
      success: true,
      message: 'KYC application rejected',
      data: { application },
    });
  } catch (error: any) {
    console.error('Reject KYC application error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to reject KYC application: ${error.message}`,
    });
  }
};