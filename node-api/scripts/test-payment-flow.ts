// scripts/test-payment-flow.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testPaymentFlow() {
  try {
    console.log('🧪 Testing Complete Payment Flow...\n');

    // 1. Login as merchant
    console.log('1. 🔐 Logging in as merchant...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'merchant@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // 2. Create payment link
    console.log('2. 💳 Creating payment link...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/merchant/payments`, {
      amount: '0.001',
      currency: 'ETH',
      description: 'Test Product',
      customerEmail: 'test@customer.com',
      customerName: 'Test Customer'
    }, {
      headers: {
        'x-api-key': 'nox_sk_0b126d9a13139fd9114769fb0f54cc734c8c28eb13820a2efcccf8536adbb6c4'
      }
    });

    const paymentLink = paymentResponse.data.data.paymentLink;
    const paymentId = paymentResponse.data.data.paymentId;
    console.log(`✅ Payment created: ${paymentLink}\n`);

    // 3. Get payment page
    console.log('3. 📄 Getting payment page...');
    const paymentPageResponse = await axios.get(`${BASE_URL}/pay/${paymentId}`);
    const paymentData = paymentPageResponse.data.data;
    console.log(`✅ Payment page loaded:`);
    console.log(`   Amount: ${paymentData.amount} ${paymentData.currency}`);
    console.log(`   Wallet: ${paymentData.walletAddress}`);
    console.log(`   Merchant: ${paymentData.merchant}\n`);

    // 4. Check payment status
    console.log('4. 🔍 Checking payment status...');
    const statusResponse = await axios.get(`${BASE_URL}/pay/${paymentId}/status`);
    console.log(`✅ Payment status: ${statusResponse.data.data.payment.status}\n`);

    console.log('🎉 PAYMENT FLOW TEST COMPLETE!');
    console.log('\n📋 NEXT STEPS:');
    console.log(`1. Send ${paymentData.amount} ETH to: ${paymentData.walletAddress}`);
    console.log(`2. Payment will be automatically detected within 1-2 minutes`);
    console.log(`3. Or manually trigger check: POST ${BASE_URL}/pay/${paymentId}/check`);
    console.log(`4. Check status again to see "completed" status`);

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPaymentFlow();