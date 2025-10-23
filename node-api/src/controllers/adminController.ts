// src/controllers/adminController.ts
import { Request, Response } from 'express';
import { Merchant, User, Payment } from '../models';

export const getPendingMerchants = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchants = await Merchant.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'user', attributes: ['email', 'firstName', 'lastName'] }]
    });

    res.json({
      success: true,
      data: { merchants },
      total: merchants.length
    });
  } catch (error: any) {
    console.error('Get pending merchants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending merchants'
    });
  }
};

export const approveMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;

    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
      return;
    }

    merchant.status = 'approved';
    await merchant.save();

    // TODO: Send approval email to merchant

    res.json({
      success: true,
      message: 'Merchant approved successfully',
      data: { merchant }
    });
  } catch (error: any) {
    console.error('Approve merchant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve merchant'
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalMerchants = await Merchant.count();
    const pendingMerchants = await Merchant.count({ where: { status: 'pending' } });
    const totalPayments = await Payment.count();
    const completedPayments = await Payment.count({ where: { status: 'completed' } });
    const totalVolume = await Payment.sum('amount', { where: { status: 'completed' } });

    res.json({
      success: true,
      data: {
        stats: {
          totalMerchants,
          pendingMerchants,
          totalPayments,
          completedPayments,
          totalVolume: totalVolume || 0
        }
      }
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};