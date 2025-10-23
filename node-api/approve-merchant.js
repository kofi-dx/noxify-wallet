// approve-merchant.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Use your DATABASE_URL from .env
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

async function approveMerchant() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Update merchant status
    const [updatedCount] = await sequelize.query(
      `UPDATE merchants SET status = 'approved' WHERE "businessEmail" = 'store@test.com'`
    );

    console.log(`✅ Approved ${updatedCount} merchant(s)`);

    // Verify the update
    const [merchants] = await sequelize.query(
      `SELECT "businessName", "businessEmail", status, "apiKey" FROM merchants WHERE "businessEmail" = 'store@test.com'`
    );

    console.log('📋 Merchant details:', merchants[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

approveMerchant();