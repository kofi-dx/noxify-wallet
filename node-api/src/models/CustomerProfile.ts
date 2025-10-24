import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CustomerProfileAttributes {
  id: string;
  userId: string;
  tier: 'basic' | 'premium' | 'vip';
  loyaltyPoints: number;
  totalSpent: number;
  totalTransactions: number;
  favoriteMerchants: string[];
  notificationPreferences: 'email' | 'sms' | 'push' | 'all' | 'none';
  marketingConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerProfileCreationAttributes extends Optional<CustomerProfileAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerProfile extends Model<CustomerProfileAttributes, CustomerProfileCreationAttributes> implements CustomerProfileAttributes {
  public id!: string;
  public userId!: string;
  public tier!: 'basic' | 'premium' | 'vip';
  public loyaltyPoints!: number;
  public totalSpent!: number;
  public totalTransactions!: number;
  public favoriteMerchants!: string[];
  public notificationPreferences!: 'email' | 'sms' | 'push' | 'all' | 'none';
  public marketingConsent!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerProfile.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  tier: {
    type: DataTypes.ENUM('basic', 'premium', 'vip'),
    defaultValue: 'basic',
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalSpent: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  totalTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  favoriteMerchants: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  notificationPreferences: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'all', 'none'),
    defaultValue: 'all',
  },
  marketingConsent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  modelName: 'CustomerProfile',
  tableName: 'customer_profiles',
});

export default CustomerProfile;