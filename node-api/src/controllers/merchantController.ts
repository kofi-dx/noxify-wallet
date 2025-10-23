// src/controllers/merchantController.ts
import { Request, Response } from 'express';
import merchantService from '../services/merchantService';
import { Payment } from '../models';

export const registerMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { businessName, businessEmail, website, businessType } = req.body;

    if (!businessName || !businessEmail || !website) {
      res.status(400).json({
        success: false,
        message: 'businessName, businessEmail, and website are required',
      });
      return;
    }

    const merchant = await merchantService.registerMerchant(
      userId,
      businessName,
      businessEmail,
      website,
      businessType || 'ecommerce'
    );

    res.status(201).json({
      success: true,
      message: 'Merchant registration submitted for approval',
      data: {
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          businessEmail: merchant.businessEmail,
          status: merchant.status,
          apiKey: merchant.apiKey, // Only returned once
        },
      },
    });
  } catch (error: any) {
    console.error('Register merchant error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to register merchant: ${error.message}`,
    });
  }
};

export const createPaymentLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).merchant.id;
    const { amount, currency, description, customerEmail, customerName, metadata } = req.body;

    if (!amount || !description || !customerEmail || !customerName) {
      res.status(400).json({
        success: false,
        message: 'amount, description, customerEmail, and customerName are required',
      });
      return;
    }

    const { paymentLink, paymentId } = await merchantService.createPaymentLink(
      merchantId,
      parseFloat(amount),
      currency || 'ETH',
      description,
      customerEmail,
      customerName,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        paymentLink,
        paymentId,
        amount,
        currency: currency || 'ETH',
        description,
        customerEmail,
      },
    });
  } catch (error: any) {
    console.error('Create payment link error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create payment link: ${error.message}`,
    });
  }
};

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).merchant.id;
    const { limit = 50, offset = 0 } = req.query;

    const { payments, total } = await merchantService.getMerchantPayments(
      merchantId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
    });
  } catch (error: any) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get payments: ${error.message}`,
    });
  }
};

// Add to src/controllers/merchantController.ts
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const merchantId = (req as any).merchant.id;

    const payment = await Payment.findOne({
      where: { paymentId, merchantId }
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { payment },
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get payment status: ${error.message}`,
    });
  }
};