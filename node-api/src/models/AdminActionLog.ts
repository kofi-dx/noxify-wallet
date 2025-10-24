import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AdminActionLogAttributes {
  id: string;
  adminId: string;
  action: string;
  resourceType: 'user' | 'merchant' | 'business' | 'kyc' | 'payment' | 'ticket';
  resourceId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface AdminActionLogCreationAttributes extends Optional<AdminActionLogAttributes, 'id' | 'ipAddress' | 'userAgent' | 'createdAt'> {}

class AdminActionLog extends Model<AdminActionLogAttributes, AdminActionLogCreationAttributes> implements AdminActionLogAttributes {
  public id!: string;
  public adminId!: string;
  public action!: string;
  public resourceType!: 'user' | 'merchant' | 'business' | 'kyc' | 'payment' | 'ticket';
  public resourceId!: string;
  public details!: any;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

AdminActionLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id',
    },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resourceType: {
    type: DataTypes.ENUM('user', 'merchant', 'business', 'kyc', 'payment', 'ticket'),
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'AdminActionLog',
  tableName: 'admin_action_logs',
  indexes: [
    {
      fields: ['adminId'],
    },
    {
      fields: ['resourceType', 'resourceId'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

export default AdminActionLog;