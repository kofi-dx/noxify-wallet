import User from './User';
import Account from './Account';
import Wallet from './Wallet';
import Merchant from './Merchant';
import Payment from './Payment';
import FiatPayment from './FiatPayment';
import Business from './Business';
import TeamMember from './TeamMember';
import CustomerProfile from './CustomerProfile';
import CustomerPaymentMethod from './CustomerPaymentMethod';
import KYCApplication from './KYCApplication';
import KYCDocument from './KYCDocument';
import Admin from './Admin';
import SupportTicket from './SupportTicket';
import TicketMessage from './TicketMessage';
import AdminActionLog from './AdminActionLog';

export { 
  User, 
  Account, 
  Wallet, 
  Merchant, 
  Payment, 
  FiatPayment,
  Business,
  TeamMember,
  CustomerProfile,
  CustomerPaymentMethod,
  KYCApplication,
  KYCDocument,
  Admin,
  SupportTicket,
  TicketMessage,
  AdminActionLog
};

export const initAssociations = () => {
  try {
    // User associations
    User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
    Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' }); // 🆕 FIXED
    Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // Merchant associations
    User.hasMany(Merchant, { foreignKey: 'userId', as: 'merchants' }); // 🆕 FIXED
    Merchant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Payment associations
    Merchant.hasMany(Payment, { foreignKey: 'merchantId', as: 'payments' });
    Payment.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

    // FiatPayment associations
    Payment.hasMany(FiatPayment, { foreignKey: 'paymentId', sourceKey: 'paymentId', as: 'fiatPayments' });
    FiatPayment.belongsTo(Payment, { foreignKey: 'paymentId', targetKey: 'paymentId', as: 'payment' });
    
    // Business associations
    User.hasOne(Business, { foreignKey: 'userId', as: 'business' }); // 🆕 FIXED
    Business.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    Business.hasMany(TeamMember, { foreignKey: 'businessId', as: 'teamMembers' });
    TeamMember.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });
    TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Customer associations
    User.hasOne(CustomerProfile, { foreignKey: 'userId', as: 'customerProfile' }); // 🆕 FIXED
    CustomerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    User.hasMany(CustomerPaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
    CustomerPaymentMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // KYC associations
    User.hasMany(KYCApplication, { foreignKey: 'userId', as: 'kycApplications' }); // 🆕 FIXED
    KYCApplication.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    KYCApplication.hasMany(KYCDocument, { foreignKey: 'kycApplicationId', as: 'documents' });
    KYCDocument.belongsTo(KYCApplication, { foreignKey: 'kycApplicationId', as: 'kycApplication' });
    
    User.hasMany(KYCDocument, { foreignKey: 'userId', as: 'kycDocuments' });
    KYCDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Admin & Support associations
    User.hasOne(Admin, { foreignKey: 'userId', as: 'admin' });
    Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });
    SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    Admin.hasMany(SupportTicket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
    SupportTicket.belongsTo(Admin, { foreignKey: 'assignedTo', as: 'assignedAdmin' });
    
    SupportTicket.hasMany(TicketMessage, { foreignKey: 'ticketId', as: 'messages' });
    TicketMessage.belongsTo(SupportTicket, { foreignKey: 'ticketId', as: 'ticket' });
    
    Admin.hasMany(AdminActionLog, { foreignKey: 'adminId', as: 'actionLogs' });
    AdminActionLog.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });
    
    console.log('✅ All model associations initialized');
  } catch (error) {
    console.error('❌ Error initializing model associations:', error);
  }
};