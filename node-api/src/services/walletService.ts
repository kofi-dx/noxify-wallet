import { ethers } from 'ethers';
import { Wallet } from '../models';
import { Alchemy, Network } from 'alchemy-sdk';

export class WalletService {
  private alchemy: Alchemy;

  constructor() {
    const network = process.env.NODE_ENV === 'production' ? Network.ETH_MAINNET : Network.ETH_SEPOLIA;
    
    const config = {
      apiKey: process.env.ALCHEMY_API_KEY,
      network: network,
    };
    this.alchemy = new Alchemy(config);
  }

  /**
   * Generate a new Ethereum wallet address for a user
   */
  async generateEthereumWallet(userId: string): Promise<{ address: string; privateKey?: string }> {
    try {
      console.log(`🔄 Generating Ethereum wallet for user: ${userId}`);
      
      const wallet = ethers.Wallet.createRandom();
      
      console.log(`✅ Wallet generated: ${wallet.address}`);
      
      const userWallet = await Wallet.create({
        userId: userId,
        blockchain: 'ethereum' as const,
        address: wallet.address,
        currency: 'ETH',
        isActive: true,
        isTestnet: true,
      });

      console.log(`✅ Ethereum wallet saved to database for user ${userId}: ${wallet.address}`);
      console.log(`✅ Wallet record created with ID: ${userWallet.id}`);

      return {
        address: wallet.address,
        privateKey: process.env.NODE_ENV === 'development' ? wallet.privateKey : undefined
      };
    } catch (error: any) {
      console.error('❌ Error generating Ethereum wallet:', error);
      throw new Error(`Failed to generate wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance from blockchain
   */
  async getWalletBalance(address: string): Promise<string> {
    try {
      console.log(`🔄 Fetching balance for address: ${address}`);
      
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const balance = await this.alchemy.core.getBalance(address);
      const balanceString = balance.toString();
      const formattedBalance = ethers.formatEther(balanceString);
      
      console.log(`✅ Balance for ${address}: ${formattedBalance} ETH`);
      return formattedBalance;
    } catch (error: any) {
      console.error('❌ Error getting wallet balance:', error);
      return '0';
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      return await Wallet.findAll({
        where: { userId, isActive: true },
        attributes: { exclude: ['fireblocksVaultId', 'fireblocksWalletId'] }
      });
    } catch (error) {
      console.error('Error getting user wallets:', error);
      return [];
    }
  }

  /**
   * Validate Ethereum address
   */
  isValidEthereumAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}

// Create default instance
const walletService = new WalletService();

// Named exports
export { walletService };

// Default export
export default walletService;

// Individual method exports for direct importing
export const generateEthereumWallet = walletService.generateEthereumWallet.bind(walletService);
export const getWalletBalance = walletService.getWalletBalance.bind(walletService);
export const getUserWallets = walletService.getUserWallets.bind(walletService);
export const isValidEthereumAddress = walletService.isValidEthereumAddress.bind(walletService);