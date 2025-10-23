// src/models/index.ts
import User from './User';
import Account from './Account';
import Wallet from './Wallet';
import Merchant from './Merchant'; // Add this
import Payment from './Payment';   // Add this

export { User, Account, Wallet, Merchant, Payment };

export const initAssociations = () => {
  try {
    // Existing associations
    User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
    Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
    Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // NEW: Merchant associations
    User.hasMany(Merchant, { foreignKey: 'userId', as: 'merchants' });
    Merchant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // NEW: Payment associations
    Merchant.hasMany(Payment, { foreignKey: 'merchantId', as: 'payments' });
    Payment.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
    
    console.log('✅ All model associations initialized');
  } catch (error) {
    console.error('❌ Error initializing model associations:', error);
  }
};