import { KYCApplication, KYCDocument, User } from '../models';

export class KYCService {
  /**
   * Create or update KYC application
   */
  async createOrUpdateKYCApplication(
    userId: string,
    data: {
      type: 'individual' | 'business';
      tier: '1' | '2' | '3';
      personalInfo?: any;
      addressInfo?: any;
      businessInfo?: any;
    }
  ): Promise<KYCApplication> {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check for existing application
      let application = await KYCApplication.findOne({
        where: { userId }
      });

      if (application) {
        // Update existing application
        await application.update({
          ...data,
          status: 'draft' // Reset to draft when updating
        });
      } else {
        // FIXED: Create new application with proper structure
        application = await KYCApplication.create({
          userId,
          type: data.type,
          tier: data.tier,
          personalInfo: data.personalInfo || null,
          addressInfo: data.addressInfo || null,
          businessInfo: data.businessInfo || null,
          status: 'draft'
        });
      }

      return application;
    } catch (error: any) {
      console.error('Error creating/updating KYC application:', error);
      throw new Error(`Failed to process KYC application: ${error.message}`);
    }
  }

  /**
   * Submit KYC application for review
   */
  async submitKYCApplication(userId: string): Promise<KYCApplication> {
    try {
      const application = await KYCApplication.findOne({
        where: { userId }
      });

      if (!application) {
        throw new Error('KYC application not found');
      }

      if (application.status === 'approved') {
        throw new Error('KYC application already approved');
      }

      // Validate required fields based on type and tier
      await this.validateKYCApplication(application);

      // Update application status
      await application.update({
        status: 'submitted',
        submittedAt: new Date()
      });

      // Update user KYC status
      await User.update(
        { kycStatus: 'pending' },
        { where: { id: userId } }
      );

      return application;
    } catch (error: any) {
      console.error('Error submitting KYC application:', error);
      throw new Error(`Failed to submit KYC application: ${error.message}`);
    }
  }

  /**
   * Validate KYC application completeness
   */
  private async validateKYCApplication(application: KYCApplication): Promise<void> {
    const errors: string[] = [];

    // Tier 1 validation (Basic)
    if (application.tier === '1') {
      if (!application.personalInfo) {
        errors.push('Personal information is required for Tier 1 KYC');
      } else {
        const { personalInfo } = application;
        if (!personalInfo.dateOfBirth) errors.push('Date of birth is required');
        if (!personalInfo.nationality) errors.push('Nationality is required');
        if (!personalInfo.idType) errors.push('ID type is required');
        if (!personalInfo.idNumber) errors.push('ID number is required');
      }
    }

    // Tier 2 validation (Address verification)
    if (application.tier === '2') {
      if (!application.addressInfo) {
        errors.push('Address information is required for Tier 2 KYC');
      } else {
        const { addressInfo } = application;
        if (!addressInfo.residentialAddress) errors.push('Residential address is required');
        if (!addressInfo.proofOfAddressType) errors.push('Proof of address type is required');
      }
    }

    // Business validation
    if (application.type === 'business') {
      if (!application.businessInfo) {
        errors.push('Business information is required for business KYC');
      } else {
        const { businessInfo } = application;
        if (!businessInfo.companyName) errors.push('Company name is required');
        if (!businessInfo.registrationNumber) errors.push('Registration number is required');
        if (!businessInfo.taxId) errors.push('Tax ID is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(`KYC application validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get KYC application by user ID
   */
  async getKYCApplication(userId: string): Promise<KYCApplication | null> {
    try {
      return await KYCApplication.findOne({
        where: { userId },
        include: [{
          model: KYCDocument,
          as: 'kycDocuments'
        }]
      });
    } catch (error: any) {
      console.error('Error getting KYC application:', error);
      throw new Error(`Failed to get KYC application: ${error.message}`);
    }
  }

  /**
   * Admin: Get all pending KYC applications
   */
  async getPendingApplications(limit: number = 50, offset: number = 0): Promise<{ applications: KYCApplication[]; total: number }> {
    try {
      const result = await KYCApplication.findAndCountAll({
        where: { status: 'submitted' },
        limit,
        offset,
        order: [['submittedAt', 'ASC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        }]
      });

      return {
        applications: result.rows,
        total: result.count
      };
    } catch (error: any) {
      console.error('Error getting pending KYC applications:', error);
      throw new Error(`Failed to get pending KYC applications: ${error.message}`);
    }
  }

  /**
   * Admin: Approve KYC application
   */
  async approveKYCApplication(applicationId: string, adminId: string): Promise<KYCApplication> {
    try {
      const application = await KYCApplication.findByPk(applicationId);
      if (!application) {
        throw new Error('KYC application not found');
      }

      await application.update({
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: new Date()
      });

      // Update user KYC status
      await User.update(
        { kycStatus: 'verified' },
        { where: { id: application.userId } }
      );

      return application;
    } catch (error: any) {
      console.error('Error approving KYC application:', error);
      throw new Error(`Failed to approve KYC application: ${error.message}`);
    }
  }

  /**
   * Admin: Reject KYC application
   */
  async rejectKYCApplication(applicationId: string, adminId: string, reason: string): Promise<KYCApplication> {
    try {
      const application = await KYCApplication.findByPk(applicationId);
      if (!application) {
        throw new Error('KYC application not found');
      }

      await application.update({
        status: 'rejected',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason
      });

      // Update user KYC status
      await User.update(
        { kycStatus: 'rejected' },
        { where: { id: application.userId } }
      );

      return application;
    } catch (error: any) {
      console.error('Error rejecting KYC application:', error);
      throw new Error(`Failed to reject KYC application: ${error.message}`);
    }
  }

  /**
   * Upload KYC document
   */
  async uploadKYCDocument(
    userId: string,
    kycApplicationId: string,
    fileData: {
      documentType: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      metadata?: any;
    }
  ): Promise<KYCDocument> {
    try {
      // Verify application belongs to user
      const application = await KYCApplication.findOne({
        where: { id: kycApplicationId, userId }
      });

      if (!application) {
        throw new Error('KYC application not found or access denied');
      }

      // FIXED: Create document with proper structure
      const document = await KYCDocument.create({
        kycApplicationId,
        userId,
        documentType: fileData.documentType as any,
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        metadata: fileData.metadata || null,
        verificationStatus: 'pending',
        uploadedAt: new Date()
      });

      // Update application documents reference
      const documents = application.documents || {};
      const documentKey = fileData.documentType as keyof typeof documents;
      (documents as any)[documentKey] = fileData.fileUrl;

      await application.update({ documents });

      return document;
    } catch (error: any) {
      console.error('Error uploading KYC document:', error);
      throw new Error(`Failed to upload KYC document: ${error.message}`);
    }
  }

  /**
   * Get KYC limits based on tier
   */
  getKYCLimits(tier: string): { dailyLimit: number; monthlyLimit: number; singleTransactionLimit: number } {
    const limits = {
      '1': { dailyLimit: 1000, monthlyLimit: 5000, singleTransactionLimit: 500 },
      '2': { dailyLimit: 5000, monthlyLimit: 25000, singleTransactionLimit: 2500 },
      '3': { dailyLimit: 50000, monthlyLimit: 250000, singleTransactionLimit: 10000 }
    };

    return limits[tier as keyof typeof limits] || limits['1'];
  }

  /**
   * Check if user has required KYC level for transaction
   */
  async checkKYCRequirement(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string; currentTier?: string; requiredTier?: string }> {
    try {
      const application = await this.getKYCApplication(userId);
      
      if (!application || application.status !== 'approved') {
        return {
          allowed: false,
          reason: 'KYC verification required'
        };
      }

      const limits = this.getKYCLimits(application.tier);
      
      if (amount > limits.singleTransactionLimit) {
        // Find the required tier for this amount
        let requiredTier: string = '1';
        for (const [tier, tierLimits] of Object.entries(this.getKYCLimits('3'))) {
          if (amount <= (tierLimits as any).singleTransactionLimit) {
            requiredTier = tier;
            break;
          }
        }

        return {
          allowed: false,
          reason: `Transaction amount exceeds limit for current KYC tier`,
          currentTier: application.tier,
          requiredTier
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking KYC requirement:', error);
      return { allowed: false, reason: 'Error checking KYC status' };
    }
  }
}

export default new KYCService();