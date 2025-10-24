import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface KYCDocumentAttributes {
  id: string;
  kycApplicationId: string;
  userId: string;
  documentType: 'id_front' | 'id_back' | 'selfie' | 'proof_of_address' | 'business_registration' | 'tax_certificate' | 'bank_statement' | 'utility_bill';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  metadata?: any;
  uploadedAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// FIXED: Make all fields optional except required ones
interface KYCDocumentCreationAttributes extends Optional<KYCDocumentAttributes, 
  'id' | 'verificationStatus' | 'rejectionReason' | 'metadata' | 'verifiedAt' | 
  'uploadedAt' | 'createdAt' | 'updatedAt'
> {}

class KYCDocument extends Model<KYCDocumentAttributes, KYCDocumentCreationAttributes> implements KYCDocumentAttributes {
  public id!: string;
  public kycApplicationId!: string;
  public userId!: string;
  public documentType!: 'id_front' | 'id_back' | 'selfie' | 'proof_of_address' | 'business_registration' | 'tax_certificate' | 'bank_statement' | 'utility_bill';
  public fileName!: string;
  public fileUrl!: string;
  public fileSize!: number;
  public mimeType!: string;
  public verificationStatus!: 'pending' | 'verified' | 'rejected';
  public rejectionReason?: string;
  public metadata?: any;
  public uploadedAt!: Date;
  public verifiedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

KYCDocument.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  kycApplicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'kyc_applications',
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
  documentType: {
    type: DataTypes.ENUM('id_front', 'id_back', 'selfie', 'proof_of_address', 'business_registration', 'tax_certificate', 'bank_statement', 'utility_bill'),
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending', // FIXED: Add default value
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // FIXED: Add default value
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
  modelName: 'KYCDocument',
  tableName: 'kyc_documents',
  indexes: [
    {
      fields: ['kycApplicationId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['documentType'],
    },
  ],
});

export default KYCDocument;