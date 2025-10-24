import axios from 'axios';
import bcrypt from 'bcryptjs';

const BASE_URL = 'http://localhost:3000';

async function createSuperAdmin() {
  try {
    console.log('👑 Creating super admin user...');
    
    // First, let's create the user directly in the database
    const { default: sequelize } = await import('../src/config/database');
    const { User, Admin } = await import('../src/models');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'kofidennox@gmail.com' },
      include: [{ model: Admin, as: 'admin' }]
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('📧 Email: kofidennox@gmail.com');
      console.log('👑 Role:', existingAdmin.role);
      if (existingAdmin.admin) {
        console.log('🔐 Admin permissions:', existingAdmin.admin.permissions);
      }
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Pass123!Word.Noxif', saltRounds);

    // Create admin user directly
    const adminUser = await User.create({
      email: 'kofidennox@gmail.com',
      password: hashedPassword,
      firstName: 'Kofi',
      lastName: 'Dennox',
      phone: '+233538291739',
      country: 'GH',
      role: 'admin', // Now this should work
      businessType: 'services',
      kycStatus: 'verified',
      status: 'active',
      isActive: true
    });

    // Create admin record
    await Admin.create({
      userId: adminUser.id,
      role: 'super_admin',
      permissions: ['all'],
      isActive: true
    });

    console.log('🎉 Super admin created successfully!');
    console.log('📧 Email: kofidennox@gmail.com');
    console.log('🔑 Password: Pass123!Word.Noxif');
    console.log('👑 Role: Super Admin');
    console.log('🔐 Permissions: Full control');
    console.log('🆔 User ID:', adminUser.id);

  } catch (error: any) {
    console.error('❌ Failed to create admin:', error.message);
    
    if (error.message.includes('enum_users_role')) {
      console.log('\n💡 Solution: Run the enum update script first:');
      console.log('npx ts-node scripts/update-user-role-enum.ts');
    }
  }
}

createSuperAdmin();