// src/models/Payment.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Merchant from './Merchant';

interface PaymentAttributes {
  id: string;
  merchantId: string;
  paymentId: string; // Public facing payment ID
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  blockchain: 'ethereum' | 'polygon';
  walletAddress: string; // Where to send payment
  transactionHash?: string;
  metadata?: any; // Additional payment data
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Make optional fields properly optional
interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'transactionHash' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public merchantId!: string;
  public paymentId!: string;
  public amount!: number;
  public currency!: string;
  public description!: string;
  public customerEmail!: string;
  public customerName!: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  public blockchain!: 'ethereum' | 'polygon';
  public walletAddress!: string;
  public transactionHash?: string;
  public metadata?: any;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  merchantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'merchants',
      key: 'id',
    },
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'ETH',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  blockchain: {
    type: DataTypes.ENUM('ethereum', 'polygon'),
    defaultValue: 'ethereum',
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  transactionHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
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
  modelName: 'Payment',
  tableName: 'payments',
  indexes: [
    {
      unique: true,
      fields: ['paymentId'],
    },
    {
      fields: ['merchantId', 'status'],
    },
    {
      fields: ['walletAddress'],
    },
  ],
});

export default Payment;