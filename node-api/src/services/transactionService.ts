import { ethers } from 'ethers';
import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';

export class TransactionService {
  private alchemy: Alchemy;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // **FIXED: Use Sepolia instead of Goerli**
    const network = process.env.NODE_ENV === 'production' ? Network.ETH_MAINNET : Network.ETH_SEPOLIA;
    
    const config = {
      apiKey: process.env.ALCHEMY_API_KEY,
      network: network,
    };
    this.alchemy = new Alchemy(config);
    
    // **FIXED: Update RPC URL to Sepolia**
    this.provider = new ethers.JsonRpcProvider(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
  }

  /**
   * Send ETH from one address to another
   */
  async sendTransaction(fromPrivateKey: string, toAddress: string, amount: string): Promise<string> {
    try {
      // Validate inputs
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      
      // **FIXED: Use provider to get balance instead of wallet.getBalance()**
      const balance = await this.provider.getBalance(wallet.address);
      const amountWei = ethers.parseEther(amount);
      
      if (balance < amountWei) {
        throw new Error(`Insufficient balance. Available: ${ethers.formatEther(balance)} ETH, Required: ${amount} ETH`);
      }

      // Create transaction
      const tx = {
        to: toAddress,
        value: amountWei,
      };
      
      console.log(`🔄 Sending ${amount} ETH from ${wallet.address} to ${toAddress}`);
      
      // Send transaction
      const transaction = await wallet.sendTransaction(tx);
      console.log(`✅ Transaction sent: ${transaction.hash}`);
      
      // Wait for confirmation (optional - can remove for faster response)
      const receipt = await transaction.wait();
      console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`);
      
      return transaction.hash;
    } catch (error: any) {
      console.error('❌ Error sending transaction:', error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string): Promise<any[]> {
    try {
      // Use the correct category types from Alchemy SDK
      const categories: AssetTransfersCategory[] = [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.INTERNAL,
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
        AssetTransfersCategory.ERC1155
      ];

      const transactions = await this.alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        fromAddress: address,
        category: categories,
      });
      
      return transactions.transfers;
    } catch (error: any) {
      console.error('❌ Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(hash: string): Promise<any> {
    try {
      const transaction = await this.provider.getTransaction(hash);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      return {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        value: ethers.formatEther(transaction.value || 0),
        blockNumber: transaction.blockNumber,
        confirmations: transaction.confirmations,
        timestamp: await this.getBlockTimestamp(transaction.blockNumber),
      };
    } catch (error: any) {
      console.error('❌ Error getting transaction:', error);
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Get block timestamp
   */
  private async getBlockTimestamp(blockNumber: number | null): Promise<number | null> {
    if (!blockNumber) return null;
    
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block?.timestamp || null;
    } catch (error) {
      console.error('Error getting block timestamp:', error);
      return null;
    }
  }

  /**
   * Get gas estimates for a transaction
   */
  async getGasEstimate(from: string, to: string, value: string): Promise<any> {
    try {
      const gasEstimate = await this.provider.estimateGas({
        from,
        to,
        value: ethers.parseEther(value),
      });

      const feeData = await this.provider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null,
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
      };
    } catch (error: any) {
      console.error('❌ Error estimating gas:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Get current gas prices
   */
  async getGasPrices(): Promise<any> {
    try {
      const feeData = await this.provider.getFeeData();

      return {
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : '0',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : '0',
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
      };
    } catch (error: any) {
      console.error('❌ Error getting gas prices:', error);
      throw new Error(`Failed to get gas prices: ${error.message}`);
    }
  }

  /**
   * Get wallet balance using provider (alternative method)
   */
  async getWalletBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.error('❌ Error getting wallet balance:', error);
      return '0';
    }
  }
}

export default new TransactionService();