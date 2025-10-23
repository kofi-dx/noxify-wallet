import { Request, Response } from 'express';
import transactionService from '../services/transactionService';

export const sendTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { toAddress, amount, privateKey } = req.body;
    
    console.log('🔄 Send transaction request:', { toAddress, amount });
    
    if (!toAddress || !amount || !privateKey) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: toAddress, amount, privateKey',
      });
      return;
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
      return;
    }

    const txHash = await transactionService.sendTransaction(privateKey, toAddress, amount);

    res.json({
      success: true,
      message: 'Transaction sent successfully',
      data: {
        transactionHash: txHash,
        toAddress,
        amount: `${amount} ETH`,
        explorerUrl: `https://goerli.etherscan.io/tx/${txHash}`,
      },
    });
  } catch (error: any) {
    console.error('❌ Send transaction error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to send transaction: ${error.message}`,
    });
  }
};

export const getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    
    console.log(`🔄 Getting transaction history for: ${address}`);
    
    if (!address) {
      res.status(400).json({
        success: false,
        message: 'Address is required',
      });
      return;
    }

    const transactions = await transactionService.getTransactionHistory(address);

    res.json({
      success: true,
      data: {
        address,
        transactions,
        total: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get transaction history: ${error.message}`,
    });
  }
};

export const getTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;
    
    console.log(`🔄 Getting transaction: ${hash}`);
    
    if (!hash) {
      res.status(400).json({
        success: false,
        message: 'Transaction hash is required',
      });
      return;
    }

    const transaction = await transactionService.getTransaction(hash);

    res.json({
      success: true,
      data: {
        transaction,
      },
    });
  } catch (error: any) {
    console.error('❌ Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get transaction: ${error.message}`,
    });
  }
};

export const getGasPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Getting current gas prices');
    
    const gasPrices = await transactionService.getGasPrices();

    res.json({
      success: true,
      data: {
        gasPrices,
        network: 'Ethereum Goerli Testnet',
      },
    });
  } catch (error: any) {
    console.error('❌ Get gas prices error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get gas prices: ${error.message}`,
    });
  }
};

export const getGasEstimate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, value } = req.body;
    
    console.log('🔄 Getting gas estimate:', { from, to, value });
    
    if (!from || !to || !value) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: from, to, value',
      });
      return;
    }

    const gasEstimate = await transactionService.getGasEstimate(from, to, value);

    res.json({
      success: true,
      data: {
        gasEstimate,
        from,
        to,
        value: `${value} ETH`,
      },
    });
  } catch (error: any) {
    console.error('❌ Get gas estimate error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get gas estimate: ${error.message}`,
    });
  }
};