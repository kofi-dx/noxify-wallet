import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'kofidennox@gmail.com',
      password: 'Pass123!Word.Noxif'
    });

    if (response.data.success) {
      console.log('✅ Admin login successful via regular auth!');
      console.log('👤 User data:', {
        email: response.data.data.user.email,
        role: response.data.data.user.role,
        status: response.data.data.user.status
      });
      console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
      
      return response.data.data.token;
    }
  } catch (error: any) {
    console.error('❌ Admin login failed:', error.response?.data?.message || error.message);
  }
}

async function testAdminAccess(userToken: string) {
  try {
    console.log('\n🔧 Testing admin API access...');
    
    // Test getting user profile (should show admin data)
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (profileResponse.data.success) {
      console.log('✅ Profile access successful');
      console.log('👑 Admin data in profile:', {
        email: profileResponse.data.data.user.email,
        role: profileResponse.data.data.user.role,
        admin: profileResponse.data.data.user.admin ? 'Yes' : 'No'
      });
    }

  } catch (error: any) {
    console.error('❌ Admin access test failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  const token = await testAdminLogin();
  if (token) {
    await testAdminAccess(token);
  }
}

main();