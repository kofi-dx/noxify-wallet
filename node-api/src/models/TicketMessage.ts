import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TicketMessageAttributes {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'ai';
  message: string;
  messageType: 'text' | 'system' | 'resolution' | 'ai_suggestion';
  attachments?: string[];
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketMessageCreationAttributes extends Optional<TicketMessageAttributes, 'id' | 'attachments' | 'createdAt' | 'updatedAt'> {}

class TicketMessage extends Model<TicketMessageAttributes, TicketMessageCreationAttributes> implements TicketMessageAttributes {
  public id!: string;
  public ticketId!: string;
  public senderId!: string;
  public senderType!: 'user' | 'admin' | 'ai';
  public message!: string;
  public messageType!: 'text' | 'system' | 'resolution' | 'ai_suggestion';
  public attachments?: string[];
  public isInternal!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TicketMessage.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'support_tickets',
      key: 'id',
    },
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  senderType: {
    type: DataTypes.ENUM('user', 'admin', 'ai'),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  messageType: {
    type: DataTypes.ENUM('text', 'system', 'resolution', 'ai_suggestion'),
    defaultValue: 'text',
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  isInternal: {
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
  modelName: 'TicketMessage',
  tableName: 'ticket_messages',
  indexes: [
    {
      fields: ['ticketId'],
    },
    {
      fields: ['senderId'],
    },
  ],
});

export default TicketMessage;