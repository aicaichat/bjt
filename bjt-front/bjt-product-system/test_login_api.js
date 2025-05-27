// 测试新的登录API功能
const API_BASE_URL = 'http://localhost/wp-json/bjt/v1';

console.log('🧪 Testing BJT Login API with wp_bjt_users table...\n');

// 测试用户凭据
const testUsers = [
  {
    name: '管理员用户',
    username: 'admin',
    password: 'password123',
    expectedRole: 'admin',
    expectedUnit: 'metric'
  },
  {
    name: '销售用户',
    username: 'sales_user',
    password: 'password123',
    expectedRole: 'sales',
    expectedUnit: 'metric'
  },
  {
    name: '合作伙伴用户',
    username: 'partner_user',
    password: 'password123',
    expectedRole: 'partner',
    expectedUnit: 'imperial'
  },
  {
    name: '客户用户',
    username: 'customer_user',
    password: 'password123',
    expectedRole: 'customer',
    expectedUnit: 'metric'
  },
  {
    name: '英制单位测试用户',
    username: 'test_imperial',
    password: 'password123',
    expectedRole: 'customer',
    expectedUnit: 'imperial'
  }
];

// 测试登录功能
async function testLogin(userCredentials) {
  try {
    console.log(`🔐 Testing login for ${userCredentials.name} (${userCredentials.username})...`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userCredentials.username,
        password: userCredentials.password,
        remember_me: true
      }),
    });

    console.log(`   Response status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Response data:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log(`   ❌ Login failed: ${data.message || response.statusText}`);
      return false;
    }

    if (data.success && data.data) {
      const { access_token, user } = data.data;
      
      console.log(`   ✅ Login successful!`);
      console.log(`   📋 User details:`);
      console.log(`      - ID: ${user.id}`);
      console.log(`      - Username: ${user.username}`);
      console.log(`      - Email: ${user.email}`);
      console.log(`      - Role: ${user.role} (expected: ${userCredentials.expectedRole})`);
      console.log(`      - Preferred Unit: ${user.preferred_unit} (expected: ${userCredentials.expectedUnit})`);
      console.log(`      - Region: ${user.region}`);
      console.log(`      - Country: ${user.country}`);
      console.log(`      - Status: ${user.status}`);
      console.log(`   🔑 Token: ${access_token.substring(0, 20)}...`);
      
      // 验证角色和单位制
      const roleMatch = user.role === userCredentials.expectedRole;
      const unitMatch = user.preferred_unit === userCredentials.expectedUnit;
      
      if (roleMatch && unitMatch) {
        console.log(`   ✅ Role and preferred unit match expectations`);
      } else {
        console.log(`   ⚠️  Role match: ${roleMatch}, Unit match: ${unitMatch}`);
      }
      
      return { success: true, token: access_token, user };
    } else {
      console.log(`   ❌ Login failed: Invalid response format`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Login failed with error: ${error.message}`);
    return false;
  }
}

// 测试获取当前用户信息
async function testGetCurrentUser(token) {
  try {
    console.log(`\n🔍 Testing get current user with token...`);
    
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`   Response status: ${response.status}`);
    
    const data = await response.json();

    if (!response.ok) {
      console.log(`   ❌ Get current user failed: ${data.message || response.statusText}`);
      return false;
    }

    if (data.success && data.data) {
      console.log(`   ✅ Get current user successful!`);
      console.log(`   📋 Current user: ${data.data.username} (${data.data.email})`);
      return true;
    } else {
      console.log(`   ❌ Get current user failed: Invalid response format`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Get current user failed with error: ${error.message}`);
    return false;
  }
}

// 测试更新用户偏好单位制
async function testUpdatePreferredUnit(token, newUnit) {
  try {
    console.log(`\n📝 Testing update preferred unit to ${newUnit}...`);
    
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferred_unit: newUnit
      }),
    });

    console.log(`   Response status: ${response.status}`);
    
    const data = await response.json();

    if (!response.ok) {
      console.log(`   ❌ Update preferred unit failed: ${data.message || response.statusText}`);
      return false;
    }

    if (data.success && data.data) {
      console.log(`   ✅ Update preferred unit successful!`);
      console.log(`   📋 New preferred unit: ${data.data.preferred_unit}`);
      return true;
    } else {
      console.log(`   ❌ Update preferred unit failed: Invalid response format`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Update preferred unit failed with error: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 Starting comprehensive login API tests...\n');
  
  let successCount = 0;
  let totalTests = testUsers.length;
  
  for (const userCredentials of testUsers) {
    const loginResult = await testLogin(userCredentials);
    
    if (loginResult && loginResult.success) {
      successCount++;
      
      // 测试获取当前用户信息
      await testGetCurrentUser(loginResult.token);
      
      // 测试更新偏好单位制
      const newUnit = userCredentials.expectedUnit === 'metric' ? 'imperial' : 'metric';
      await testUpdatePreferredUnit(loginResult.token, newUnit);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
  }
  
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Successful logins: ${successCount}/${totalTests}`);
  console.log(`   📈 Success rate: ${(successCount/totalTests*100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log(`\n🎉 All tests passed! The login API is working correctly with wp_bjt_users table.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please check the API implementation and database setup.`);
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
}); 