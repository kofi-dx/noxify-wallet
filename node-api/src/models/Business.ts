import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface BusinessAttributes {
  id: string;
  userId: string;
  companyName: string;
  companyEmail: string;
  registrationNumber: string;
  taxId: string;
  businessType: 'ecommerce' | 'b2b' | 'individual' | 'services' | 'retail' | 'nonprofit';
  industry: string;
  employeeCount: number;
  annualRevenue?: number;
  website: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  status: 'pending' | 'approved' | 'suspended' | 'verified';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BusinessCreationAttributes extends Optional<BusinessAttributes, 'id' | 'annualRevenue' | 'verifiedAt' | 'createdAt' | 'updatedAt'> {}

class Business extends Model<BusinessAttributes, BusinessCreationAttributes> implements BusinessAttributes {
  public id!: string;
  public userId!: string;
  public companyName!: string;
  public companyEmail!: string;
  public registrationNumber!: string;
  public taxId!: string;
  public businessType!: 'ecommerce' | 'b2b' | 'individual' | 'services' | 'retail' | 'nonprofit';
  public industry!: string;
  public employeeCount!: number;
  public annualRevenue?: number;
  public website!: string;
  public phone!: string;
  public address!: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  public status!: 'pending' | 'approved' | 'suspended' | 'verified';
  public verifiedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Business.init({
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
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessType: {
    type: DataTypes.ENUM('ecommerce', 'b2b', 'individual', 'services', 'retail', 'nonprofit'),
    allowNull: false,
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  annualRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'suspended', 'verified'),
    defaultValue: 'pending',
  },
  verifiedAt: {
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
  modelName: 'Business',
  tableName: 'businesses',
});

export default Business;