import { ethers } from 'ethers';
import { Wallet } from '../models';
import { Alchemy, Network } from 'alchemy-sdk';

export class WalletService {
  private alchemy: Alchemy;

  constructor() {
    // **FIXED: Use Sepolia instead of Goerli**
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
      
      // For MVP, we'll generate wallets locally (TESTNET ONLY)
      const wallet = ethers.Wallet.createRandom();
      
      console.log(`✅ Wallet generated: ${wallet.address}`);
      
      // **FIXED: Only provide required fields, let Sequelize handle the rest**
      const userWallet = await Wallet.create({
        userId: userId,
        blockchain: 'ethereum' as const, // Use const assertion
        address: wallet.address,
        currency: 'ETH',
        isActive: true,
        isTestnet: true,
        // No id, createdAt, updatedAt - Sequelize handles these
      });

      console.log(`✅ Ethereum wallet saved to database for user ${userId}: ${wallet.address}`);
      console.log(`✅ Wallet record created with ID: ${userWallet.id}`);

      // In development, return private key for testing (NEVER in production)
      return {
        address: wallet.address,
        privateKey: process.env.NODE_ENV === 'development' ? wallet.privateKey : undefined
      };
    } catch (error: any) {
      console.error('❌ Error generating Ethereum wallet:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to generate wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance from blockchain
   */
  async getWalletBalance(address: string): Promise<string> {
    try {
      console.log(`🔄 Fetching balance for address: ${address}`);
      
      // Validate Ethereum address
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const balance = await this.alchemy.core.getBalance(address);
      
      // Convert BigNumber to string before formatting
      const balanceString = balance.toString();
      const formattedBalance = ethers.formatEther(balanceString);
      
      console.log(`✅ Balance for ${address}: ${formattedBalance} ETH`);
      return formattedBalance;
    } catch (error: any) {
      console.error('❌ Error getting wallet balance:', error);
      console.error('Balance error details:', error.message);
      
      // Return 0 instead of throwing for better UX
      return '0';
    }
  }

  /**
   * Alternative method using direct ethers provider (if Alchemy continues to have issues)
   */
  async getWalletBalanceDirect(address: string): Promise<string> {
    try {
      console.log(`🔄 Fetching balance directly for address: ${address}`);
      
      // Validate Ethereum address
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      // **FIXED: Update to Sepolia RPC URL**
      const provider = new ethers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      );

      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      
      console.log(`✅ Direct balance for ${address}: ${formattedBalance} ETH`);
      return formattedBalance;
    } catch (error: any) {
      console.error('❌ Error getting direct wallet balance:', error);
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

export default new WalletService();