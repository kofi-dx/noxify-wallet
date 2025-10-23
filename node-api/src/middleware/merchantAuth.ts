// src/middleware/merchantAuth.ts
import { Request, Response, NextFunction } from 'express';
import merchantService from '../services/merchantService';

export interface MerchantRequest extends Request {
  merchant?: any;
}

export const authenticateMerchant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key required',
      });
      return;
    }

    const merchant = await merchantService.verifyApiKey(apiKey);
    if (!merchant) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
      return;
    }

    (req as MerchantRequest).merchant = merchant;
    next();
  } catch (error) {
    console.error('Merchant auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};