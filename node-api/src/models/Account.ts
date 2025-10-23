import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface AccountAttributes {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  availableBalance: number;
  accountType: 'personal' | 'business';
  status: 'active' | 'frozen' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: string;
  public userId!: string;
  public currency!: string;
  public balance!: number;
  public availableBalance!: number;
  public accountType!: 'personal' | 'business';
  public status!: 'active' | 'frozen' | 'closed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init({
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
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
  },
  balance: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
  },
  availableBalance: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
  },
  accountType: {
    type: DataTypes.ENUM('personal', 'business'),
    defaultValue: 'personal',
  },
  status: {
    type: DataTypes.ENUM('active', 'frozen', 'closed'),
    defaultValue: 'active',
  },
  // **FIXED: Add explicit timestamp definitions**
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
  modelName: 'Account',
  tableName: 'accounts',
  timestamps: true, // This will auto-manage these fields
});

// **COMMENTED OUT: Associations are already defined in model files**
// User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
// Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Account;