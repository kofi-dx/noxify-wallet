import User from './User';
import Account from './Account';
import Wallet from './Wallet';

export { User, Account, Wallet };

export const initAssociations = () => {
  try {
    // **FIXED: Define ALL associations in one place to avoid conflicts**
    
    // User -> Account (One-to-Many)
    User.hasMany(Account, { 
      foreignKey: 'userId', 
      as: 'accounts' 
    });
    Account.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });
    
    // User -> Wallet (One-to-Many)
    User.hasMany(Wallet, { 
      foreignKey: 'userId', 
      as: 'wallets' 
    });
    Wallet.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });
    
    console.log('✅ All model associations initialized');
  } catch (error) {
    console.error('❌ Error initializing model associations:', error);
  }
};

export default {
  User,
  Account,
  Wallet,
};