import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SupportTicketAttributes {
  id: string;
  userId: string;
  assignedTo?: string;
  category: 'account_issue' | 'payment_issue' | 'kyc_issue' | 'technical_issue' | 'general_inquiry' | 'dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  subject: string;
  description: string;
  aiSuggestedSolutions?: string[];
  resolution?: string;
  resolvedAt?: Date;
  customerSatisfaction?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SupportTicketCreationAttributes extends Optional<SupportTicketAttributes, 'id' | 'assignedTo' | 'aiSuggestedSolutions' | 'resolution' | 'resolvedAt' | 'customerSatisfaction' | 'createdAt' | 'updatedAt'> {}

class SupportTicket extends Model<SupportTicketAttributes, SupportTicketCreationAttributes> implements SupportTicketAttributes {
  public id!: string;
  public userId!: string;
  public assignedTo?: string;
  public category!: 'account_issue' | 'payment_issue' | 'kyc_issue' | 'technical_issue' | 'general_inquiry' | 'dispute';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public status!: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  public subject!: string;
  public description!: string;
  public aiSuggestedSolutions?: string[];
  public resolution?: string;
  public resolvedAt?: Date;
  public customerSatisfaction?: number;
  public tags!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SupportTicket.init({
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
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id',
    },
  },
  category: {
    type: DataTypes.ENUM('account_issue', 'payment_issue', 'kyc_issue', 'technical_issue', 'general_inquiry', 'dispute'),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  aiSuggestedSolutions: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  customerSatisfaction: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
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
  modelName: 'SupportTicket',
  tableName: 'support_tickets',
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['priority'],
    },
    {
      fields: ['category'],
    },
  ],
});

export default SupportTicket;