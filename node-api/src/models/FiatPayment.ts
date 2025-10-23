// src/models/FiatPayment.ts - CREATE THIS FILE
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FiatPaymentAttributes {
  id: string;
  paymentId: string;
  provider: 'mtn' | 'vodafone' | 'airteltigo' | 'bank' | 'simulated';
  phoneNumber?: string;
  bankAccount?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'simulated';
  providerTransactionId?: string;
  isSimulated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FiatPaymentCreationAttributes extends Optional<FiatPaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class FiatPayment extends Model<FiatPaymentAttributes, FiatPaymentCreationAttributes> implements FiatPaymentAttributes {
  public id!: string;
  public paymentId!: string;
  public provider!: 'mtn' | 'vodafone' | 'airteltigo' | 'bank' | 'simulated';
  public phoneNumber?: string;
  public bankAccount?: string;
  public amount!: number;
  public currency!: string;
  public status!: 'pending' | 'completed' | 'failed' | 'simulated';
  public providerTransactionId?: string;
  public isSimulated!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FiatPayment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'payments',
      key: 'paymentId'
    }
  },
  provider: {
    type: DataTypes.ENUM('mtn', 'vodafone', 'airteltigo', 'bank', 'simulated'),
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankAccount: {
    type: DataTypes.STRING,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'GHS'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'simulated'),
    defaultValue: 'pending'
  },
  providerTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isSimulated: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  modelName: 'FiatPayment',
  tableName: 'fiat_payments',
  indexes: [
    {
      fields: ['paymentId']
    },
    {
      fields: ['providerTransactionId']
    }
  ]
});

export default FiatPayment;