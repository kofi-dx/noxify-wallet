import { Request, Response } from 'express';
import walletService from '../services/walletService';

export const createWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Create wallet request received');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const userId = (req as any).user?.userId;
    console.log('User ID from token:', userId);
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { blockchain = 'ethereum' } = req.body || {};
    console.log('Blockchain from request:', blockchain);

    if (blockchain !== 'ethereum') {
      res.status(400).json({
        success: false,
        message: 'Only Ethereum supported in MVP',
      });
      return;
    }

    const wallet = await walletService.generateEthereumWallet(userId);

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: {
        address: wallet.address,
        blockchain: 'ethereum',
        isTestnet: true,
        // Private key only returned in development for testing
        ...(wallet.privateKey && { 
          privateKey: wallet.privateKey,
          warning: 'PRIVATE KEY ONLY SHOWN IN DEVELOPMENT - NEVER SHARE OR STORE THIS' 
        })
      },
    });
  } catch (error: any) {
    console.error('❌ Create wallet error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create wallet: ${error.message}`,
    });
  }
};

export const getWallets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    console.log(`🔄 Fetching wallets for user: ${userId}`);
    
    const wallets = await walletService.getUserWallets(userId);

    console.log(`✅ Found ${wallets.length} wallets for user ${userId}`);

    // Get balances for each wallet
    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          const balance = await walletService.getWalletBalance(wallet.address);
          return {
            id: wallet.id,
            address: wallet.address,
            blockchain: wallet.blockchain,
            currency: wallet.currency,
            balance: balance,
            isTestnet: wallet.isTestnet,
            createdAt: wallet.createdAt,
          };
        } catch (error) {
          console.error(`❌ Error getting balance for wallet ${wallet.address}:`, error);
          return {
            id: wallet.id,
            address: wallet.address,
            blockchain: wallet.blockchain,
            currency: wallet.currency,
            balance: '0',
            isTestnet: wallet.isTestnet,
            createdAt: wallet.createdAt,
            error: 'Failed to fetch balance'
          };
        }
      })
    );

    res.json({
      success: true,
      data: { 
        wallets: walletsWithBalances,
        total: walletsWithBalances.length 
      },
    });
  } catch (error: any) {
    console.error('❌ Get wallets error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch wallets: ${error.message}`,
    });
  }
};

export const getWalletBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    
    console.log(`🔄 Fetching balance for address: ${address}`);

    // Validate address format
    if (!walletService.isValidEthereumAddress(address)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address format',
      });
      return;
    }

    const balance = await walletService.getWalletBalance(address);

    res.json({
      success: true,
      data: { 
        address, 
        balance: `${balance} ETH`,
        numeric_balance: balance
      },
    });
  } catch (error: any) {
    console.error('❌ Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch wallet balance: ${error.message}`,
    });
  }
};