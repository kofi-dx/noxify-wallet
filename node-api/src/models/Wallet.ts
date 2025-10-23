import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface WalletAttributes {
  id: string;
  userId: string;
  blockchain: 'ethereum' | 'polygon' | 'solana';
  address: string;
  currency: string;
  isActive: boolean;
  isTestnet: boolean;
  fireblocksVaultId?: string;
  fireblocksWalletId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Make id, createdAt, updatedAt optional when creating
interface WalletCreationAttributes extends Optional<WalletAttributes, 'id' | 'createdAt' | 'updatedAt' | 'fireblocksVaultId' | 'fireblocksWalletId'> {}

class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  public id!: string;
  public userId!: string;
  public blockchain!: 'ethereum' | 'polygon' | 'solana';
  public address!: string;
  public currency!: string;
  public isActive!: boolean;
  public isTestnet!: boolean;
  public fireblocksVaultId!: string;
  public fireblocksWalletId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Wallet.init({
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
  blockchain: {
    type: DataTypes.ENUM('ethereum', 'polygon', 'solana'),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ETH',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isTestnet: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  fireblocksVaultId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fireblocksWalletId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // **ADD THESE: Explicitly define createdAt and updatedAt**
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
  modelName: 'Wallet',
  tableName: 'wallets',
  timestamps: true, // This will auto-manage these fields
  indexes: [
    {
      unique: true,
      fields: ['address', 'blockchain'],
    },
  ],
});

// Associations
//User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
//Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Wallet;