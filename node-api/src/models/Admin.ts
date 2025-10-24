import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AdminAttributes {
  id: string;
  userId: string;
  role: 'super_admin' | 'support_agent' | 'compliance_officer' | 'financial_analyst';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// FIXED: Make isActive optional with default value
interface AdminCreationAttributes extends Optional<AdminAttributes, 'id' | 'isActive' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public id!: string;
  public userId!: string;
  public role!: 'super_admin' | 'support_agent' | 'compliance_officer' | 'financial_analyst';
  public permissions!: string[];
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Admin.init({
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
  role: {
    type: DataTypes.ENUM('super_admin', 'support_agent', 'compliance_officer', 'financial_analyst'),
    allowNull: false,
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // FIXED: Add default value
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
  modelName: 'Admin',
  tableName: 'admins',
});

export default Admin;