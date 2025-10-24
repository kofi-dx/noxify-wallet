import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CustomerPaymentMethodAttributes {
  id: string;
  userId: string;
  type: 'mobile_money' | 'crypto' | 'bank_account' | 'card';
  provider: string;
  details: {
    phoneNumber?: string;
    address?: string;
    accountNumber?: string;
    bankName?: string;
    cardLast4?: string;
  };
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerPaymentMethodCreationAttributes extends Optional<CustomerPaymentMethodAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerPaymentMethod extends Model<CustomerPaymentMethodAttributes, CustomerPaymentMethodCreationAttributes> implements CustomerPaymentMethodAttributes {
  public id!: string;
  public userId!: string;
  public type!: 'mobile_money' | 'crypto' | 'bank_account' | 'card';
  public provider!: string;
  public details!: {
    phoneNumber?: string;
    address?: string;
    accountNumber?: string;
    bankName?: string;
    cardLast4?: string;
  };
  public isDefault!: boolean;
  public isVerified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerPaymentMethod.init({
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
  type: {
    type: DataTypes.ENUM('mobile_money', 'crypto', 'bank_account', 'card'),
    allowNull: false,
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isVerified: {
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
  modelName: 'CustomerPaymentMethod',
  tableName: 'customer_payment_methods',
  indexes: [
    {
      fields: ['userId', 'type'],
    },
    {
      fields: ['userId', 'isDefault'],
    },
  ],
});

export default CustomerPaymentMethod;