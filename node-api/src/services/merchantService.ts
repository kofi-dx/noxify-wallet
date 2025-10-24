// src/services/merchantService.ts
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Merchant, Payment, User, Wallet } from '../models';


export class MerchantService {
  /**
   * Generate secure API key
   */
  private generateApiKey(): string {
    return `nox_sk_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate unique payment ID
   */
  private generatePaymentId(): string {
    return `pay_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  }

  /**
   * Register a new merchant
   */
  async registerMerchant(
    userId: string,
    businessName: string,
    businessEmail: string,
    website: string,
    businessType: 'ecommerce' | 'b2b' | 'both'
  ): Promise<Merchant> {
    try {
      console.log(`🔄 Registering merchant for user ${userId}`);
      
      // 🆕 CHECK IF USER EXISTS
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 🆕 CHECK IF MERCHANT ALREADY EXISTS FOR THIS USER
      const existingMerchant = await Merchant.findOne({
        where: { userId, businessEmail }
      });

      if (existingMerchant) {
        throw new Error('Merchant already registered with this email');
      }

      const apiKey = this.generateApiKey();
      console.log(`✅ Generated API key for merchant`);

      const merchant = await Merchant.create({
        userId,
        businessName,
        businessEmail,
        website,
        businessType,
        apiKey,
        status: 'pending',
      });

      console.log(`✅ Merchant created with ID: ${merchant.id}`);
      return merchant;
    } catch (error: any) {
      console.error('❌ Error registering merchant:', error);
      console.error('Error details:', error.message);
      throw new Error(`Failed to register merchant: ${error.message}`);
    }
  }

  /**
   * Create a payment link
   */
  async createPaymentLink(
    merchantId: string,
    amount: number,
    currency: string,
    description: string,
    customerEmail: string,
    customerName: string,
    metadata?: any
  ): Promise<{ paymentLink: string; paymentId: string }> {
    try {
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant || merchant.status !== 'approved') {
        throw new Error('Merchant not found or not approved');
      }

      const walletAddress = await this.getMerchantWalletAddress(merchantId);
      const paymentId = this.generatePaymentId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // FIXED: Include all required fields including blockchain
      const payment = await Payment.create({
        merchantId,
        paymentId,
        amount,
        currency,
        description,
        customerEmail,
        customerName,
        walletAddress,
        metadata,
        expiresAt,
        status: 'pending',
        blockchain: 'ethereum', // Required field
      });

      const paymentLink = `${process.env.BASE_URL || 'http://localhost:3000'}/pay/${paymentId}`;

      return {
        paymentLink,
        paymentId,
      };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }

  /**
   * Get merchant's wallet address
   */
private async getMerchantWalletAddress(merchantId: string): Promise<string> {
  const merchant = await Merchant.findByPk(merchantId, {
    include: [{
      model: User,
      as: 'user',
      include: [{
        model: Wallet,
        as: 'wallets',
        where: { blockchain: 'ethereum', isActive: true },
        required: false
      }]
    }]
  });

  if (!merchant) {
    throw new Error('Merchant not found');
  }

  const user = (merchant as any).user;
  if (!user || !user.wallets || user.wallets.length === 0) {
    throw new Error('Merchant has no active Ethereum wallet. Please create a wallet first.');
  }

  return user.wallets[0].address;
}

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string): Promise<Merchant | null> {
    try {
      const merchant = await Merchant.findOne({
        where: { apiKey, status: 'approved' }
      });
      return merchant;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return null;
    }
  }

  /**
   * Get merchant payments
   */
  async getMerchantPayments(merchantId: string, limit = 50, offset = 0): Promise<{ payments: Payment[]; total: number }> {
    try {
      const payments = await Payment.findAndCountAll({
        where: { merchantId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        payments: payments.rows,
        total: payments.count,
      };
    } catch (error: any) {
      console.error('Error getting merchant payments:', error);
      throw new Error(`Failed to get payments: ${error.message}`);
    }
  }
}

export default new MerchantService();