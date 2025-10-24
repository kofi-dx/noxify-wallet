import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface KYCApplicationAttributes {
  id: string;
  userId: string;
  type: 'individual' | 'business';
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'requires_action';
  tier: '1' | '2' | '3';
  
  // Personal Information
  personalInfo?: {
    dateOfBirth: string;
    gender?: 'male' | 'female' | 'other';
    nationality: string;
    idType: 'passport' | 'national_id' | 'drivers_license';
    idNumber: string;
    idIssuedDate?: string;
    idExpiryDate?: string;
    idIssuingCountry: string;
  };

  // Address Information
  addressInfo?: {
    residentialAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    proofOfAddressType?: 'utility_bill' | 'bank_statement' | 'government_letter';
  };

  // Business Information (for business KYC)
  businessInfo?: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    businessType: string;
    industry: string;
    incorporationDate: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    directors: Array<{
      name: string;
      position: string;
      nationality: string;
      idNumber: string;
    }>;
  };

  // Document URLs
  documents?: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
    proofOfAddress?: string;
    businessRegistration?: string;
    taxCertificate?: string;
  };

  // Verification Details
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  requiredActions?: string[];

  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// FIXED: Make all fields optional except userId, type, tier
interface KYCApplicationCreationAttributes extends Optional<KYCApplicationAttributes, 
  'id' | 'status' | 'personalInfo' | 'addressInfo' | 'businessInfo' | 'documents' | 
  'verifiedBy' | 'verifiedAt' | 'rejectionReason' | 'requiredActions' | 'submittedAt' | 
  'createdAt' | 'updatedAt'
> {}

class KYCApplication extends Model<KYCApplicationAttributes, KYCApplicationCreationAttributes> implements KYCApplicationAttributes {
  public id!: string;
  public userId!: string;
  public type!: 'individual' | 'business';
  public status!: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'requires_action';
  public tier!: '1' | '2' | '3';
  public personalInfo?: {
    dateOfBirth: string;
    gender?: 'male' | 'female' | 'other';
    nationality: string;
    idType: 'passport' | 'national_id' | 'drivers_license';
    idNumber: string;
    idIssuedDate?: string;
    idExpiryDate?: string;
    idIssuingCountry: string;
  };
  public addressInfo?: {
    residentialAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    proofOfAddressType?: 'utility_bill' | 'bank_statement' | 'government_letter';
  };
  public businessInfo?: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    businessType: string;
    industry: string;
    incorporationDate: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    directors: Array<{
      name: string;
      position: string;
      nationality: string;
      idNumber: string;
    }>;
  };
  public documents?: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
    proofOfAddress?: string;
    businessRegistration?: string;
    taxCertificate?: string;
  };
  public verifiedBy?: string;
  public verifiedAt?: Date;
  public rejectionReason?: string;
  public requiredActions?: string[];
  public submittedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

KYCApplication.init({
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
    type: DataTypes.ENUM('individual', 'business'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'pending', 'approved', 'rejected', 'requires_action'),
    defaultValue: 'draft', // FIXED: Add default value
  },
  tier: {
    type: DataTypes.ENUM('1', '2', '3'),
    defaultValue: '1', // FIXED: Add default value
  },
  personalInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  addressInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  businessInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  verifiedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requiredActions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  submittedAt: {
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
  modelName: 'KYCApplication',
  tableName: 'kyc_applications',
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
  ],
});

export default KYCApplication;