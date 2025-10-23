// src/services/webhookService.ts
import axios from 'axios';
import { Payment } from '../models';

export class WebhookService {
  /**
   * Send webhook notification
   */
  async sendWebhook(merchant: any, payment: Payment, event: string): Promise<void> {
    try {
      if (!merchant.webhookUrl) {
        return; // No webhook configured
      }

      const payload = {
        event,
        payment: {
          id: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          transactionHash: payment.transactionHash,
          customerEmail: payment.customerEmail,
          customerName: payment.customerName,
          metadata: payment.metadata,
        },
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
        },
        timestamp: new Date().toISOString(),
      };

      await axios.post(merchant.webhookUrl, payload, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Noxify-Payment-Gateway/1.0',
        },
      });

      console.log(`✅ Webhook sent for payment ${payment.paymentId}`);
    } catch (error) {
      console.error(`❌ Failed to send webhook for payment ${payment.paymentId}:`, error);
      // In production, you might want to retry or queue failed webhooks
    }
  }

  /**
   * Process payment completion
   */
  async processPaymentCompletion(paymentId: string, transactionHash: string): Promise<void> {
    try {
      const payment = await Payment.findOne({ where: { paymentId } });
      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      // Update payment status
      payment.status = 'completed';
      payment.transactionHash = transactionHash;
      await payment.save();

      // Get merchant details
      const merchant = await payment.get('merchant');

      // Send webhook
      if (merchant) {
        await this.sendWebhook(merchant, payment, 'payment.completed');
      }
    } catch (error: any) {
      console.error('Error processing payment completion:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }
}

export default new WebhookService();