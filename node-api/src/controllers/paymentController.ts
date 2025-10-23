// src/controllers/paymentController.ts - FIXED
import { Request, Response } from 'express';
import { Payment, Merchant } from '../models';
import { ethers } from 'ethers';
import { SimulatedMobileMoneyService } from '../services/simulatedMobileMoneyService';
import FiatPayment from '../models/FiatPayment';

// 🆕 Define type for payment with merchant
interface PaymentWithMerchant extends Payment {
  merchant?: Merchant;
}

export const getPaymentPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      where: { paymentId },
      include: [{ model: Merchant, as: 'merchant' }]
    }) as PaymentWithMerchant | null;

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    if (payment.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Payment already ${payment.status}`
      });
      return;
    }

    if (new Date() > payment.expiresAt) {
      res.status(400).json({
        success: false,
        message: 'Payment link has expired'
      });
      return;
    }

    // 🆕 Safe access to merchant property
    const paymentData = {
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      merchant: payment.merchant?.businessName || 'Unknown Merchant',
      walletAddress: payment.walletAddress,
      expiresAt: payment.expiresAt
    };

    res.json({
      success: true,
      data: paymentData,
      message: 'Payment details retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get payment page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load payment page'
    });
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      where: { paymentId },
      attributes: ['paymentId', 'amount', 'currency', 'status', 'transactionHash', 'createdAt']
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
};

export const manuallyCheckPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const paymentMonitorService = await import('../services/paymentMonitorService');
    await paymentMonitorService.default.manuallyCheckPayment(paymentId);

    res.json({
      success: true,
      message: 'Manual payment check initiated'
    });
  } catch (error: any) {
    console.error('Manual payment check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manually check payment'
    });
  }
};


export const initiateSimulatedPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId, provider, phoneNumber, bankAccount } = req.body;

    const payment = await Payment.findOne({ where: { paymentId } });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    // Create fiat payment record (simulated)
    const fiatPayment = await FiatPayment.create({
      paymentId,
      provider: provider || 'simulated',
      phoneNumber,
      bankAccount,
      amount: payment.amount, // In production, convert to GHS
      currency: 'GHS',
      status: 'pending',
      isSimulated: true,
    });

    const momoService = new SimulatedMobileMoneyService();
    
    // Convert crypto amount to GHS for display
    const ghsAmount = momoService.convertCryptoToGHS(
      parseFloat(payment.amount.toString()), 
      payment.currency
    );

    // Initiate simulated payment
    const simulationResult = await momoService.initiateSimulatedPayment(
      phoneNumber,
      ghsAmount,
      paymentId
    );

    // Update with simulated transaction ID
    await fiatPayment.update({
      providerTransactionId: simulationResult.transactionId
    });

    res.json({
      success: true,
      message: 'Simulated payment initiated',
      data: {
        paymentId,
        simulated: true,  // ✅ Important: Frontend knows it's simulated
        transactionId: simulationResult.transactionId,
        amount: {
          crypto: payment.amount,
          currency: payment.currency,
          fiat: ghsAmount,
          fiatCurrency: 'GHS'
        },
        instructions: simulationResult.instructions,
        // Frontend will show "TEST MODE" banner
        testMode: true
      }
    });

  } catch (error: any) {
    console.error('Simulated payment error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to initiate simulated payment: ${error.message}`
    });
  }
};

// Complete simulated payment (for testing)
export const completeSimulatedPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.body;

    const fiatPayment = await FiatPayment.findOne({ 
      where: { providerTransactionId: transactionId }
    });

    if (!fiatPayment) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const momoService = new SimulatedMobileMoneyService();
    const result = await momoService.completeSimulatedPayment(transactionId);

    // Update payment status
    await fiatPayment.update({
      status: 'completed'
    });

    // Update main payment status
    await Payment.update(
      { status: 'completed' },
      { where: { paymentId: fiatPayment.paymentId } }
    );

    res.json({
      success: true,
      message: 'Simulated payment completed',
      data: result
    });

  } catch (error: any) {
    console.error('Complete simulated payment error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to complete simulated payment: ${error.message}`
    });
  }
};