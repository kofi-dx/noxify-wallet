// scripts/approve-test-merchant.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function approveTestMerchant(email) {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    if (!email) {
      // Get the most recent test merchant
      const [merchants] = await sequelize.query(
        `SELECT "businessEmail" FROM merchants WHERE status = 'pending' ORDER BY "createdAt" DESC LIMIT 1`
      );
      
      if (merchants.length === 0) {
        console.log('❌ No pending merchants found');
        return;
      }
      
      email = merchants[0].businessEmail;
    }

    console.log(`🔄 Approving merchant: ${email}`);

    // Update merchant status
    const [updatedCount] = await sequelize.query(
      `UPDATE merchants SET status = 'approved' WHERE "businessEmail" = ?`,
      { replacements: [email] }
    );

    console.log(`✅ Approved ${updatedCount} merchant(s)`);

    // Verify the update
    const [merchants] = await sequelize.query(
      `SELECT "businessName", "businessEmail", status, "apiKey" FROM merchants WHERE "businessEmail" = ?`,
      { replacements: [email] }
    );

    console.log('📋 Approved merchant details:', merchants[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

// Get email from command line or use most recent
const email = process.argv[2];
approveTestMerchant(email);