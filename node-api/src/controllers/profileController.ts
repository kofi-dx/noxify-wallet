import { Request, Response } from 'express';
import { User, Merchant, Business, KYCApplication, KYCDocument, Wallet, Payment } from '../models';
import { getWalletBalance, getUserWallets } from '../services/walletService'; // 🆕 FIXED IMPORT

export const completeBusinessProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { businessData, kycData, documents } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Update user business type if provided
    if (businessData.businessType) {
      await user.update({ businessType: businessData.businessType });
    }

    let profile;
    if (user.role === 'merchant') {
      profile = await Merchant.findOne({ where: { userId } });
      if (profile) {
        await profile.update({
          businessName: businessData.businessName,
          businessEmail: businessData.businessEmail,
          website: businessData.website,
          businessType: businessData.businessType,
          webhookUrl: businessData.webhookUrl,
          successRedirectUrl: businessData.successRedirectUrl,
          failureRedirectUrl: businessData.failureRedirectUrl
        });
      }
    } else if (user.role === 'business') {
      profile = await Business.findOne({ where: { userId } });
      if (profile) {
        await profile.update({
          companyName: businessData.companyName,
          companyEmail: businessData.companyEmail,
          registrationNumber: businessData.registrationNumber,
          taxId: businessData.taxId,
          businessType: businessData.businessType,
          industry: businessData.industry,
          employeeCount: businessData.employeeCount,
          annualRevenue: businessData.annualRevenue,
          website: businessData.website,
          phone: businessData.phone,
          address: businessData.address
        });
      }
    }

    // Update KYC application
    const kycApplication = await KYCApplication.findOne({ where: { userId } });
    if (kycApplication && kycData) {
      await kycApplication.update({
        personalInfo: kycData.personalInfo,
        addressInfo: kycData.addressInfo,
        businessInfo: kycData.businessInfo,
        status: 'submitted',
        tier: kycData.tier || '2'
      });

      // Update user status to pending approval
      await user.update({ 
        status: 'pending',
        kycStatus: 'pending'
      });

      // Handle document uploads
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          await KYCDocument.create({
            kycApplicationId: kycApplication.id,
            userId,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            verificationStatus: 'pending'
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Profile completed successfully - Under review',
      data: {
        profile,
        kycStatus: 'submitted',
        userStatus: 'pending'
      },
    });
  } catch (error: any) {
    console.error('Complete business profile error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to complete profile: ${error.message}`,
    });
  }
};

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    const user = await User.findByPk(userId, {
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
      ]
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Get wallet balances and recent transactions - FIXED TYPES
    const wallets = await getUserWallets(userId);
    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet: Wallet) => ({
        ...wallet.toJSON(),
        balance: await getWalletBalance(wallet.address)
      }))
    );

    // Get recent payments based on role - FIXED TYPES
    let recentPayments: Payment[] = [];
    
    if (user.role === 'merchant') {
      const merchant = await Merchant.findOne({ where: { userId } });
      if (merchant) {
        recentPayments = await Payment.findAll({
          where: { merchantId: merchant.id },
          limit: 10,
          order: [['createdAt', 'DESC']]
        });
      }
    }

    // FIXED: Proper type for reduce function
    const totalBalance = walletsWithBalances.reduce((sum: number, wallet: any) => {
      return sum + parseFloat(wallet.balance || '0');
    }, 0);

    const dashboardData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus
      },
      profile: user.merchants?.[0] || user.business,
      wallets: walletsWithBalances,
      recentPayments,
      kycApplication: user.kycApplications?.[0],
      stats: {
        totalBalance,
        totalTransactions: recentPayments.length,
        pendingApproval: user.status === 'pending'
      }
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error: any) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get dashboard data: ${error.message}`,
    });
  }
};