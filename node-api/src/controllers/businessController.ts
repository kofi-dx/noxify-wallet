import { Request, Response } from 'express';
import { Business, TeamMember } from '../models';

export const registerBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const {
      companyName,
      companyEmail,
      registrationNumber,
      taxId,
      businessType,
      industry,
      employeeCount,
      annualRevenue,
      website,
      phone,
      address
    } = req.body;

    // Check if business already exists for this user
    const existingBusiness = await Business.findOne({ where: { userId } });
    if (existingBusiness) {
      res.status(400).json({
        success: false,
        message: 'Business already registered for this user',
      });
      return;
    }

    const business = await Business.create({
      userId,
      companyName,
      companyEmail,
      registrationNumber,
      taxId,
      businessType,
      industry,
      employeeCount,
      annualRevenue,
      website,
      phone,
      address,
      status: 'pending'
    });

    // Create owner team member
    await TeamMember.create({
      businessId: business.id,
      userId,
      email: (req as any).user.email,
      role: 'owner',
      permissions: ['all'],
      invitedBy: userId,
      invitedAt: new Date(),
      joinedAt: new Date(),
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Business registration submitted for approval',
      data: {
        business: {
          id: business.id,
          companyName: business.companyName,
          status: business.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Register business error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to register business: ${error.message}`,
    });
  }
};

export const getBusinessProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    const business = await Business.findOne({ 
      where: { userId },
      include: [
        { 
          association: 'teamMembers',
          include: ['user']
        }
      ]
    });

    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Business not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { business },
    });
  } catch (error: any) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get business profile: ${error.message}`,
    });
  }
};