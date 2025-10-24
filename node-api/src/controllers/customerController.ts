import { Request, Response } from 'express';
import { CustomerProfile, CustomerPaymentMethod } from '../models';

export const createCustomerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { preferences } = req.body;

    // Check if profile already exists
    const existingProfile = await CustomerProfile.findOne({ where: { userId } });
    if (existingProfile) {
      res.status(400).json({
        success: false,
        message: 'Customer profile already exists',
      });
      return;
    }

    const customerProfile = await CustomerProfile.create({
      userId,
      notificationPreferences: preferences?.notifications ? 'all' : 'none',
      marketingConsent: preferences?.newsletter || false,
      tier: 'basic',
      loyaltyPoints: 0,
      totalSpent: 0,
      totalTransactions: 0,
      favoriteMerchants: []
    });

    res.status(201).json({
      success: true,
      message: 'Customer profile created successfully',
      data: {
        profile: customerProfile,
      },
    });
  } catch (error: any) {
    console.error('Create customer profile error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create customer profile: ${error.message}`,
    });
  }
};

export const getCustomerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    const profile = await CustomerProfile.findOne({ where: { userId } });
    const paymentMethods = await CustomerPaymentMethod.findAll({ 
      where: { userId },
      order: [['isDefault', 'DESC']]
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        profile,
        paymentMethods,
      },
    });
  } catch (error: any) {
    console.error('Get customer profile error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get customer profile: ${error.message}`,
    });
  }
};