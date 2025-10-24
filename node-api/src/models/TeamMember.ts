import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface TeamMemberAttributes {
  id: string;
  businessId: string;
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
  permissions: string[];
  department?: string;
  isActive: boolean;
  invitedBy: string;
  invitedAt: Date;
  joinedAt?: Date;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamMemberCreationAttributes extends Optional<TeamMemberAttributes, 'id' | 'department' | 'joinedAt' | 'lastActive' | 'createdAt' | 'updatedAt'> {}

class TeamMember extends Model<TeamMemberAttributes, TeamMemberCreationAttributes> implements TeamMemberAttributes {
  public id!: string;
  public businessId!: string;
  public userId!: string;
  public email!: string;
  public role!: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
  public permissions!: string[];
  public department?: string;
  public isActive!: boolean;
  public invitedBy!: string;
  public invitedAt!: Date;
  public joinedAt?: Date;
  public lastActive?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly user?: User;
}

TeamMember.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  businessId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'businesses',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'manager', 'staff', 'viewer'),
    allowNull: false,
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  invitedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastActive: {
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
  modelName: 'TeamMember',
  tableName: 'team_members',
  indexes: [
    {
      unique: true,
      fields: ['businessId', 'userId'],
    },
    {
      fields: ['businessId', 'email'],
    },
  ],
});

export default TeamMember;