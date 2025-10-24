import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Account, Wallet, Merchant, Business, CustomerProfile, KYCApplication } from '../models';
import { generateEthereumWallet } from '../services/walletService'; // 🆕 FIXED IMPORT

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

export const registerWithRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      country, 
      role,
      businessType,
      merchant,
      business,
      customer 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !role) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: email, password, firstName, lastName, phone, role',
      });
      return;
    }

    // Validate role
    if (!['merchant', 'business', 'customer'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: merchant, business, or customer',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with DEMO status
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      country: country || 'GH',
      role,
      businessType: businessType || null,
      kycStatus: 'pending',
      isActive: true,
      status: 'demo' // 🆕 DEMO mode until approved
    });

    // Create default account
    await Account.create({
      userId: user.id,
      currency: 'USD',
      balance: 0,
      availableBalance: 0,
      accountType: role === 'customer' ? 'personal' : 'business',
      status: 'active'
    });

    // 🆕 Create Ethereum wallet for user - FIXED IMPORT
    const wallet = await generateEthereumWallet(user.id);

    // Role-specific initial setups
    if (role === 'merchant') {
      // Create basic merchant profile (incomplete - will be filled later)
      if (merchant) {
        await Merchant.create({
          userId: user.id,
          businessName: merchant.businessName || `${firstName}'s Business`,
          businessEmail: merchant.businessEmail || email,
          website: merchant.website || '',
          businessType: merchant.businessType || 'ecommerce',
          status: 'pending',
          apiKey: `nox_${require('crypto').randomBytes(16).toString('hex')}`
        });
      }
    }

    if (role === 'business') {
      // Create basic business profile (incomplete - will be filled later)
      if (business) {
        await Business.create({
          userId: user.id,
          companyName: business.companyName || `${firstName}'s Company`,
          companyEmail: business.companyEmail || email,
          registrationNumber: business.registrationNumber || '',
          taxId: business.taxId || '',
          businessType: business.businessType || 'services',
          industry: business.industry || 'Technology',
          employeeCount: business.employeeCount || 1,
          website: business.website || '',
          phone: business.phone || phone,
          address: business.address || {
            street: '',
            city: '',
            state: '',
            country: country || 'GH',
            postalCode: ''
          },
          status: 'pending'
        });
      }
    }

    if (role === 'customer') {
      // Create customer profile
      await CustomerProfile.create({
        userId: user.id,
        notificationPreferences: customer?.preferences?.notifications ? 'all' : 'none',
        marketingConsent: customer?.preferences?.newsletter || false,
        tier: 'basic',
        loyaltyPoints: 0,
        totalSpent: 0,
        totalTransactions: 0,
        favoriteMerchants: []
      });
    }

    // 🆕 Create initial KYC application
    await KYCApplication.create({
      userId: user.id,
      type: role === 'customer' ? 'individual' : 'business',
      tier: '1',
      status: 'draft'
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully - Complete your profile to get approved',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businessType: user.businessType,
          kycStatus: user.kycStatus,
          status: user.status,
          wallet: {
            address: wallet.address,
            blockchain: 'ethereum'
          }
        },
        nextSteps: {
          action: 'complete_profile',
          message: 'Please complete your business profile and KYC verification'
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Role-based registration error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error during registration: ${error.message}`,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user with wallet info
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Wallet,
        as: 'wallets',
        where: { isActive: true },
        required: false
      }]
    });
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Update last login time
    await user.update({ lastLoginAt: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get role-specific profile data
    let profileData = {};
    if (user.role === 'merchant') {
      const merchant = await Merchant.findOne({ where: { userId: user.id } });
      profileData = { merchant };
    } else if (user.role === 'business') {
      const business = await Business.findOne({ where: { userId: user.id } });
      profileData = { business };
    } else if (user.role === 'customer') {
      const customerProfile = await CustomerProfile.findOne({ where: { userId: user.id } });
      profileData = { customerProfile };
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businessType: user.businessType,
          kycStatus: user.kycStatus,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          wallets: user.wallets || []
        },
        ...profileData,
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error during login: ${error.message}`,
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Wallet,
          as: 'wallets',
          where: { isActive: true },
          required: false
        },
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
          model: CustomerProfile,
          as: 'customerProfile',
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

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

// 🆕 Check user approval status
export const getApprovalStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'status', 'kycStatus', 'role']
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const kycApplication = await KYCApplication.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        status: user.status,
        kycStatus: user.kycStatus,
        role: user.role,
        kycApplication: kycApplication ? {
          status: kycApplication.status,
          type: kycApplication.type,
          tier: kycApplication.tier
        } : null,
        isApproved: user.status === 'active' && user.kycStatus === 'verified'
      },
    });
  } catch (error: any) {
    console.error('Get approval status error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get approval status: ${error.message}`,
    });
  }
};