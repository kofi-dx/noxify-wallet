// src/services/webhookService.ts - ENHANCED
import axios from 'axios';
import { Payment, Merchant } from '../models';

export class WebhookService {
  async sendWebhook(merchant: any, payment: Payment, event: string): Promise<void> {
    try {
      if (!merchant.webhookUrl) {
        console.log(`No webhook URL configured for merchant ${merchant.id}`);
        return;
      }

      const payload = {
        event,
        payment: {
          id: payment.paymentId,
          amount: payment.amount.toString(),
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

      console.log(`🔄 Sending webhook to ${merchant.webhookUrl} for event ${event}`);

      const response = await axios.post(merchant.webhookUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Noxify-Payment-Gateway/1.0',
          'X-Noxify-Signature': this.generateSignature(payload, merchant.apiKey),
        },
      });

      console.log(`✅ Webhook sent successfully for payment ${payment.paymentId}`);
      
    } catch (error: any) {
      console.error(`❌ Failed to send webhook for payment ${payment.paymentId}:`, error.message);
      // In production, implement retry logic with exponential backoff
    }
  }

  private generateSignature(payload: any, apiKey: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // New: Process different webhook events
  async processPaymentEvent(paymentId: string, event: string): Promise<void> {
    try {
      const payment = await Payment.findOne({
        where: { paymentId },
        include: [{ model: Merchant, as: 'merchant' }]
      });

      if (!payment || !payment.merchant) {
        throw new Error(`Payment or merchant not found for ${paymentId}`);
      }

      await this.sendWebhook(payment.merchant, payment, event);
    } catch (error) {
      console.error('Error processing payment event:', error);
    }
  }
}

export default new WebhookService();