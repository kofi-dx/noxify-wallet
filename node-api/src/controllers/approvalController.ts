import { Request, Response } from 'express';
import { User, Merchant, Business, KYCApplication } from '../models';
import adminService from '../services/adminService';

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Approve KYC
    await user.update({ 
      kycStatus: 'verified',
      status: 'active' // 🆕 Move from demo/pending to ACTIVE
    });

    // Approve role-specific profile
    if (user.role === 'merchant') {
      const merchant = await Merchant.findOne({ where: { userId } });
      if (merchant) {
        await merchant.update({ status: 'approved' });
      }
    } else if (user.role === 'business') {
      const business = await Business.findOne({ where: { userId } });
      if (business) {
        await business.update({ status: 'approved' });
      }
    }

    // Update KYC application
    const kycApplication = await KYCApplication.findOne({ where: { userId } });
    if (kycApplication) {
      await kycApplication.update({
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: new Date()
      });
    }

    // Log admin action
    await adminService.logAdminAction(adminId, 'approve_user', 'user', userId, {
      role: user.role,
      previousStatus: user.status
    });

    res.json({
      success: true,
      message: 'User approved successfully - Account is now LIVE',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          kycStatus: user.kycStatus
        }
      },
    });
  } catch (error: any) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to approve user: ${error.message}`,
    });
  }
};

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;

    const where: any = { status: 'pending' };
    if (role) where.role = role;

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Merchant,
          as: 'merchants',
          required: false
        },
        {
          model: Business,
          as: 'business',
          required: false
        },
        {
          model: KYCApplication,
          as: 'kycApplications',
          required: false
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: users.count,
        },
      },
    });
  } catch (error: any) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get pending approvals: ${error.message}`,
    });
  }
};