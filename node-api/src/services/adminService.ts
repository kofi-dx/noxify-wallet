import { Admin, User, Merchant, Business, KYCApplication, Payment, SupportTicket, AdminActionLog } from '../models';
import { Op } from 'sequelize';

export class AdminService {
  /**
   * Check if user is admin
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const admin = await Admin.findOne({
        where: { userId, isActive: true }
      });
      return !!admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get admin by user ID
   */
  async getAdminByUserId(userId: string): Promise<Admin | null> {
    try {
      return await Admin.findOne({
        where: { userId, isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }]
      });
    } catch (error) {
      console.error('Error getting admin:', error);
      return null;
    }
  }

  /**
   * Create new admin
   */
  async createAdmin(userId: string, role: string, permissions: string[] = []): Promise<Admin> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // FIXED: Include isActive field
      const admin = await Admin.create({
        userId,
        role: role as any,
        permissions,
        isActive: true // Explicitly set isActive
      });

      // Log admin creation
      await this.logAdminAction(admin.id, 'create_admin', 'admin', admin.id, {
        role,
        permissions
      });

      return admin;
    } catch (error: any) {
      console.error('Error creating admin:', error);
      throw new Error(`Failed to create admin: ${error.message}`);
    }
  }

  /**
   * Impersonate user for support
   */
  async impersonateUser(adminId: string, userId: string): Promise<{ token: string; user: any }> {
    try {
      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate impersonation token (short-lived)
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          isImpersonation: true,
          impersonatedBy: adminId,
          originalAdmin: adminId
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // Log impersonation action
      await this.logAdminAction(adminId, 'impersonate_user', 'user', userId, {
        userEmail: user.email,
        userRole: user.role
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error: any) {
      console.error('Error impersonating user:', error);
      throw new Error(`Failed to impersonate user: ${error.message}`);
    }
  }

  /**
   * Get comprehensive user profile for support
   */
  async getUserProfileForSupport(userId: string): Promise<any> {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Merchant,
            as: 'merchants'
          },
          {
            model: Business,
            as: 'business'
          },
          {
            model: KYCApplication,
            as: 'kycApplications'
          },
          {
            model: Payment,
            as: 'payments',
            limit: 10,
            order: [['createdAt', 'DESC']]
          },
          {
            model: SupportTicket,
            as: 'supportTickets',
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Update user account for support
   */
  async updateUserAccount(adminId: string, userId: string, updates: any): Promise<User> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Store previous values for logging
      const previousValues = {
        isActive: user.isActive,
        kycStatus: user.kycStatus,
        businessType: user.businessType,
        phone: user.phone,
        country: user.country
      };

      // Allowed fields for admin updates
      const allowedUpdates = ['isActive', 'kycStatus', 'businessType', 'phone', 'country'];
      const updateData: any = {};

      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updateData[key] = updates[key];
        }
      });

      await user.update(updateData);

      // Log the action
      await this.logAdminAction(adminId, 'update_user_account', 'user', userId, {
        updates: updateData,
        previousValues
      });

      return user;
    } catch (error: any) {
      console.error('Error updating user account:', error);
      throw new Error(`Failed to update user account: ${error.message}`);
    }
  }

  /**
   * Reset user password (admin override)
   */
  async resetUserPassword(adminId: string, userId: string): Promise<{ temporaryPassword: string }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      await user.update({ password: hashedPassword });

      // Log the action
      await this.logAdminAction(adminId, 'reset_user_password', 'user', userId, {
        action: 'password_reset_by_admin'
      });

      return { temporaryPassword };
    } catch (error: any) {
      console.error('Error resetting user password:', error);
      throw new Error(`Failed to reset user password: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    try {
      const [
        totalUsers,
        totalMerchants,
        totalBusinesses,
        pendingKYC,
        pendingTickets,
        totalRevenue,
        activeUsersToday
      ] = await Promise.all([
        User.count(),
        Merchant.count(),
        Business.count(),
        KYCApplication.count({ where: { status: 'submitted' } }),
        SupportTicket.count({ where: { status: 'open' } }),
        Payment.sum('amount', { where: { status: 'completed' } }),
        // FIXED: Use proper field name and Op import
        User.count({ 
          where: {
            lastLoginAt: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        users: {
          total: totalUsers,
          activeToday: activeUsersToday,
          merchants: totalMerchants,
          businesses: totalBusinesses
        },
        approvals: {
          pendingKYC,
          pendingTickets
        },
        financial: {
          totalRevenue: totalRevenue || 0,
          completedPayments: await Payment.count({ where: { status: 'completed' } })
        }
      };
    } catch (error: any) {
      console.error('Error getting dashboard stats:', error);
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Log admin actions for audit
   */
  async logAdminAction(adminId: string, action: string, resourceType: string, resourceId: string, details: any): Promise<void> {
    try {
      await AdminActionLog.create({
        adminId,
        action,
        resourceType: resourceType as any,
        resourceId,
        details,
        ipAddress: '0.0.0.0', // Would come from request in controller
        userAgent: 'Admin-System' // Would come from request in controller
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get admin action logs
   */
  async getAdminActionLogs(adminId?: string, limit: number = 50, offset: number = 0): Promise<{ logs: AdminActionLog[]; total: number }> {
    try {
      const where: any = {};
      if (adminId) {
        where.adminId = adminId;
      }

      const result = await AdminActionLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Admin,
          as: 'admin',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }]
      });

      return {
        logs: result.rows,
        total: result.count
      };
    } catch (error: any) {
      console.error('Error getting admin action logs:', error);
      throw new Error(`Failed to get admin action logs: ${error.message}`);
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export default new AdminService();