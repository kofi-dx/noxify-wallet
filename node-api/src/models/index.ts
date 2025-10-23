// src/models/index.ts - UPDATE THIS FILE
import User from './User';
import Account from './Account';
import Wallet from './Wallet';
import Merchant from './Merchant';
import Payment from './Payment';
import FiatPayment from './FiatPayment'; // 🆕 ADD THIS

export { User, Account, Wallet, Merchant, Payment, FiatPayment }; // 🆕 ADD FiatPayment

export const initAssociations = () => {
  try {
    // Existing associations
    User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
    Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
    Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // Merchant associations
    User.hasMany(Merchant, { foreignKey: 'userId', as: 'merchants' });
    Merchant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Payment associations
    Merchant.hasMany(Payment, { foreignKey: 'merchantId', as: 'payments' });
    Payment.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

    // 🆕 FiatPayment associations
    Payment.hasMany(FiatPayment, { foreignKey: 'paymentId', sourceKey: 'paymentId', as: 'fiatPayments' });
    FiatPayment.belongsTo(Payment, { foreignKey: 'paymentId', targetKey: 'paymentId', as: 'payment' });
    
    console.log('✅ All model associations initialized');
  } catch (error) {
    console.error('❌ Error initializing model associations:', error);
  }
};