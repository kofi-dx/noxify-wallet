import { Request, Response } from 'express';
import adminService from '../services/adminService';
import supportService from '../services/supportService';
import { User, Merchant, Business, KYCApplication, Payment, Admin, SupportTicket } from '../models';

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: Function): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const isAdmin = await adminService.isUserAdmin(userId);
    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get dashboard stats: ${error.message}`,
    });
  }
};

// User management
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, role, status } = req.query;
    
    const where: any = {};
    if (role) where.role = role;
    if (status) where.isActive = status === 'active';

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get users: ${error.message}`,
    });
  }
};

export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.userId;

    const userProfile = await adminService.getUserProfileForSupport(userId);

    res.json({
      success: true,
      data: { user: userProfile },
    });
  } catch (error: any) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get user details: ${error.message}`,
    });
  }
};

export const updateUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.userId;
    const updates = req.body;

    const user = await adminService.updateUserAccount(adminId, userId, updates);

    res.json({
      success: true,
      message: 'User account updated successfully',
      data: { user },
    });
  } catch (error: any) {
    console.error('Update user account error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to update user account: ${error.message}`,
    });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.userId;

    const { temporaryPassword } = await adminService.resetUserPassword(adminId, userId);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: { temporaryPassword },
    });
  } catch (error: any) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to reset user password: ${error.message}`,
    });
  }
};

// Impersonation
export const impersonateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.userId;

    const { token, user } = await adminService.impersonateUser(adminId, userId);

    res.json({
      success: true,
      message: 'Impersonation successful',
      data: { token, user },
    });
  } catch (error: any) {
    console.error('Impersonate user error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to impersonate user: ${error.message}`,
    });
  }
};

// KYC Management
export const getPendingKYCs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const applications = await KYCApplication.findAndCountAll({
      where: { status: 'submitted' },
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order: [['submittedAt', 'ASC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      }]
    });

    res.json({
      success: true,
      data: {
        applications: applications.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: applications.count,
        },
      },
    });
  } catch (error: any) {
    console.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get pending KYC applications: ${error.message}`,
    });
  }
};

// Merchant Management
export const getPendingMerchants = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchants = await Merchant.findAll({
      where: { status: 'pending' },
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['email', 'firstName', 'lastName'] 
      }]
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
    const adminId = (req as any).user.userId;

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

    // Log admin action
    await adminService.logAdminAction(adminId, 'approve_merchant', 'merchant', merchantId, {
      businessName: merchant.businessName,
      businessEmail: merchant.businessEmail
    });

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

// Support Ticket Management
export const getSupportTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.query;
    const { tickets, total } = await supportService.getTickets(filters);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          limit: parseInt(filters.limit as string) || 50,
          offset: parseInt(filters.offset as string) || 0,
          total,
        },
      },
    });
  } catch (error: any) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get support tickets: ${error.message}`,
    });
  }
};

export const getSupportTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const ticket = await supportService.getTicketWithConversation(ticketId);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { ticket },
    });
  } catch (error: any) {
    console.error('Get support ticket error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get support ticket: ${error.message}`,
    });
  }
};

export const assignTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const adminId = (req as any).user.userId;
    const { assignedTo } = req.body;

    const ticket = await supportService.assignTicketToAdmin(ticketId, assignedTo);

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: { ticket },
    });
  } catch (error: any) {
    console.error('Assign ticket error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to assign ticket: ${error.message}`,
    });
  }
};

export const resolveTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const adminId = (req as any).user.userId;
    const { resolution } = req.body;

    const ticket = await supportService.resolveTicket(ticketId, adminId, resolution);

    res.json({
      success: true,
      message: 'Ticket resolved successfully',
      data: { ticket },
    });
  } catch (error: any) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to resolve ticket: ${error.message}`,
    });
  }
};

export const addTicketMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const adminId = (req as any).user.userId;
    const { message, isInternal = false, attachments } = req.body;

    const ticketMessage = await supportService.addTicketMessage(
      ticketId,
      adminId,
      'admin',
      message,
      'text',
      isInternal,
      attachments
    );

    res.json({
      success: true,
      message: 'Message added successfully',
      data: { message: ticketMessage },
    });
  } catch (error: any) {
    console.error('Add ticket message error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to add message: ${error.message}`,
    });
  }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with admin role
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Admin,
        as: 'admin',
        where: { isActive: true },
        required: true
      }]
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
      return;
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
      return;
    }

    // Generate admin JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'admin',
        adminRole: user.admin!.role,
        permissions: user.admin!.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    await user.admin!.update({ lastLoginAt: new Date() });


    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: user.admin!.id,
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.admin!.role,
          permissions: user.admin!.permissions
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login',
    });
  }
};

// 🆕 Admin Dashboard Stats
export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.userId;

    const [
      totalUsers,
      totalMerchants,
      totalBusinesses,
      pendingKYC,
      pendingTickets,
      totalRevenue,
      todayRevenue,
      activeUsersToday
    ] = await Promise.all([
      User.count(),
      Merchant.count(),
      Business.count(),
      KYCApplication.count({ where: { status: 'submitted' } }),
      SupportTicket.count({ where: { status: 'open' } }),
      Payment.sum('amount', { where: { status: 'completed' } }),
      Payment.sum('amount', { 
        where: { 
          status: 'completed',
          createdAt: {
            [require('sequelize').Op.gte]: new Date(new Date().setHours(0,0,0,0))
          }
        } 
      }),
      User.count({ 
        where: {
          lastLoginAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Recent activities
    const recentPayments = await Payment.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Merchant,
        as: 'merchant',
        attributes: ['businessName']
      }]
    });

    const recentRegistrations = await User.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            merchants: totalMerchants,
            businesses: totalBusinesses,
            activeToday: activeUsersToday
          },
          approvals: {
            pendingKYC,
            pendingTickets
          },
          financial: {
            totalRevenue: totalRevenue || 0,
            todayRevenue: todayRevenue || 0,
            completedPayments: await Payment.count({ where: { status: 'completed' } })
          }
        },
        recentActivities: {
          payments: recentPayments,
          registrations: recentRegistrations
        }
      },
    });
  } catch (error: any) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get admin dashboard: ${error.message}`,
    });
  }
};

// 🆕 User Management
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, role, status, search } = req.query;
    
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[require('sequelize').Op.or] = [
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

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
      order: [['createdAt', 'DESC']]
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
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get users: ${error.message}`,
    });
  }
};

// 🆕 Approve User
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

    // Update user status
    await user.update({ 
      status: 'active',
      kycStatus: 'verified'
    });

    // Update role-specific profile
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
      message: 'User approved successfully',
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