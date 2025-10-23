// src/models/Merchant.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface MerchantAttributes {
  id: string;
  userId: string;
  businessName: string;
  businessEmail: string;
  website: string;
  businessType: 'ecommerce' | 'b2b' | 'both';
  status: 'pending' | 'approved' | 'suspended';
  apiKey: string;
  webhookUrl?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Make optional fields properly optional
interface MerchantCreationAttributes extends Optional<MerchantAttributes, 'id' | 'webhookUrl' | 'successRedirectUrl' | 'failureRedirectUrl' | 'createdAt' | 'updatedAt'> {}

class Merchant extends Model<MerchantAttributes, MerchantCreationAttributes> implements MerchantAttributes {
  public id!: string;
  public userId!: string;
  public businessName!: string;
  public businessEmail!: string;
  public website!: string;
  public businessType!: 'ecommerce' | 'b2b' | 'both';
  public status!: 'pending' | 'approved' | 'suspended';
  public apiKey!: string;
  public webhookUrl?: string;
  public successRedirectUrl?: string;
  public failureRedirectUrl?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Merchant.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  website: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessType: {
    type: DataTypes.ENUM('ecommerce', 'b2b', 'both'),
    defaultValue: 'ecommerce',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'suspended'),
    defaultValue: 'pending',
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  successRedirectUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  failureRedirectUrl: {
    type: DataTypes.STRING,
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
  modelName: 'Merchant',
  tableName: 'merchants',
});

export default Merchant;