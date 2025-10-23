// src/services/paymentMonitorService.ts - FIXED
import { ethers } from 'ethers';
import { Payment, Merchant } from '../models';
import webhookService from './webhookService';

// 🆕 Define proper types
interface PaymentWithMerchant extends Payment {
  merchant?: Merchant;
}

export class PaymentMonitorService {
  private provider: ethers.JsonRpcProvider;
  private isMonitoring: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    console.log('🔄 Starting payment monitoring service...');
    this.isMonitoring = true;

    // Monitor new blocks for transactions
    this.provider.on('block', async (blockNumber) => {
      try {
        console.log(`🔍 Scanning block ${blockNumber} for payments...`);
        await this.scanBlockForPayments(blockNumber);
      } catch (error) {
        console.error('Error scanning block:', error);
      }
    });

    console.log('✅ Payment monitoring service started');
  }

  private async scanBlockForPayments(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      if (!block || !block.transactions) return;

      console.log(`🔍 Checking ${block.transactions.length} transactions in block ${blockNumber}`);

      for (const txHash of block.transactions) {
        await this.checkTransaction(txHash);
      }
    } catch (error) {
      console.error('Error scanning block:', error);
    }
  }

  private async checkTransaction(txHash: string): Promise<void> {
    try {
      console.log(`🔍 Checking transaction: ${txHash}`);
      
      const tx = await this.provider.getTransaction(txHash);
      if (!tx || !tx.to) {
        console.log(`❌ Transaction ${txHash} invalid or has no recipient`);
        return;
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        console.log(`❌ Transaction ${txHash} failed or not confirmed`);
        return;
      }

      // 🆕 FIX: Proper type handling
      const payment = await Payment.findOne({
        where: { 
          walletAddress: tx.to.toLowerCase(),
          status: 'pending'
        },
        include: [{ model: Merchant, as: 'merchant' }]
      }) as PaymentWithMerchant | null;

      if (payment && this.isPaymentMatch(payment, tx)) {
        await this.processPaymentConfirmation(payment, txHash, tx);
      } else if (payment) {
        console.log(`⚠️ Payment found but amount mismatch for ${payment.paymentId}`);
      }
    } catch (error: any) {
      console.error(`❌ Error checking transaction ${txHash}:`, error.message);
    }
  }

  private isPaymentMatch(payment: PaymentWithMerchant, tx: any): boolean {
    try {
      // 🆕 FIX: Handle decimal conversion properly
      const expectedAmountWei = ethers.parseEther(payment.amount.toString());
      const receivedAmountWei = tx.value;
      
      console.log(`💰 Amount check - Expected: ${expectedAmountWei}, Received: ${receivedAmountWei}`);
      
      // Allow 2% tolerance for gas or rounding
      const tolerance = expectedAmountWei / BigInt(50); // 2%
      const minAmount = expectedAmountWei - tolerance;
      const maxAmount = expectedAmountWei + tolerance;

      const isMatch = receivedAmountWei >= minAmount && receivedAmountWei <= maxAmount;
      console.log(`🎯 Amount match: ${isMatch} for payment ${payment.paymentId}`);
      
      return isMatch;
    } catch (error) {
      console.error('Error in amount matching:', error);
      return false;
    }
  }

  private async processPaymentConfirmation(payment: PaymentWithMerchant, txHash: string, tx: any): Promise<void> {
    try {
      console.log(`✅ Payment detected: ${payment.paymentId} - ${txHash}`);

      // Update payment status
      await payment.update({
        status: 'completed',
        transactionHash: txHash
      });

      // Send webhook to merchant
      if (payment.merchant) {
        await webhookService.sendWebhook(payment.merchant, payment, 'payment.completed');
        console.log(`✅ Webhook sent for payment ${payment.paymentId}`);
      } else {
        console.log(`⚠️ No merchant found for payment ${payment.paymentId}`);
      }

      console.log(`✅ Payment ${payment.paymentId} fully processed`);
    } catch (error: any) {
      console.error(`❌ Error processing payment confirmation for ${payment.paymentId}:`, error.message);
    }
  }

  // 🆕 Add method to manually check specific payment
  async manuallyCheckPayment(paymentId: string): Promise<void> {
    try {
      const payment = await Payment.findOne({
        where: { paymentId },
        include: [{ model: Merchant, as: 'merchant' }]
      }) as PaymentWithMerchant | null;

      if (!payment) {
        console.log(`❌ Payment ${paymentId} not found`);
        return;
      }

      console.log(`🔍 Manually checking payment ${paymentId}...`);
      
      // Check recent blocks for transactions to this wallet
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100); // Check last 100 blocks

      for (let blockNumber = fromBlock; blockNumber <= currentBlock; blockNumber++) {
        const block = await this.provider.getBlock(blockNumber);
        if (block && block.transactions) {
          for (const txHash of block.transactions) {
            await this.checkTransaction(txHash);
          }
        }
      }
    } catch (error: any) {
      console.error(`❌ Error manually checking payment ${paymentId}:`, error.message);
    }
  }
}

export default new PaymentMonitorService();