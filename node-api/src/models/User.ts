import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Wallet } from 'ethers';
import Business from './Business';
import CustomerProfile from './CustomerProfile';
import KYCApplication from './KYCApplication';
import Merchant from './Merchant';
import Admin from './Admin';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'merchant' | 'business' | 'customer' | 'admin'; // 🆕 ADD 'admin' here
  businessType?: 'ecommerce' | 'b2b' | 'individual' | 'services' | 'retail' | 'nonprofit' | null;
  kycStatus: 'pending' | 'verified' | 'rejected';
  status: 'demo' | 'pending' | 'active' | 'suspended'; // 🆕 Account status
  dateOfBirth?: Date;
  country: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'businessType' | 'dateOfBirth' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public role!: 'merchant' | 'business' | 'customer' | 'admin'; // 🆕 ADD 'admin' here
  public businessType?: 'ecommerce' | 'b2b' | 'individual' | 'services' | 'retail' | 'nonprofit' | null;
  public kycStatus!: 'pending' | 'verified' | 'rejected';
  public status!: 'demo' | 'pending' | 'active' | 'suspended';
  public dateOfBirth?: Date;
  public country!: string;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public admin?: Admin;
  
  // 🧩 Optional properties populated via `.include`
  public wallets?: Wallet[];
  public merchants?: Merchant[];
  public business?: Business;
  public customerProfile?: CustomerProfile;
  public kycApplications?: KYCApplication[];
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('merchant', 'business', 'customer', 'admin'), 
    allowNull: false,
    defaultValue: 'customer',
  },
  businessType: {
    type: DataTypes.ENUM('ecommerce', 'b2b', 'individual', 'services', 'retail', 'nonprofit'),
    allowNull: true,
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
  status: {
    type: DataTypes.ENUM('demo', 'pending', 'active', 'suspended'),
    defaultValue: 'demo', // 🆕 Start in demo mode
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'GH',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  indexes: [
    {
      fields: ['email'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['kycStatus'],
    },
  ],
});

export default User;