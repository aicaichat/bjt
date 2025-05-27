const BASE_URL = 'http://localhost:8080/wp-json/bjt/v1';

async function testUserAPI() {
  console.log('🚀 开始测试用户管理API...\n');

  try {
    // 1. 测试获取用户列表
    console.log('1. 测试获取用户列表...');
    const usersResponse = await fetch(`${BASE_URL}/users`);
    console.log(`状态码: ${usersResponse.status}`);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ 用户列表获取成功');
      console.log(`用户数量: ${usersData.data?.length || 0}`);
      if (usersData.data && usersData.data.length > 0) {
        console.log('第一个用户:', JSON.stringify(usersData.data[0], null, 2));
      }
    } else {
      const errorText = await usersResponse.text();
      console.log('❌ 用户列表获取失败');
      console.log('错误信息:', errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 测试创建用户
    console.log('2. 测试创建用户...');
    const newUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      customer_code: 'TEST001',
      role: 'customer',
      country: 'China',
      region: 'Asia',
      company_logo: '',
      status: 'active',
      preferred_unit: 'metric'
    };

    const createResponse = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser)
    });

    console.log(`状态码: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ 用户创建成功');
      console.log('创建的用户:', JSON.stringify(createData.data, null, 2));
      
      // 保存用户ID用于后续测试
      const userId = createData.data.id;

      console.log('\n' + '='.repeat(50) + '\n');

      // 3. 测试获取单个用户
      console.log('3. 测试获取单个用户...');
      const userResponse = await fetch(`${BASE_URL}/users/${userId}`);
      console.log(`状态码: ${userResponse.status}`);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ 单个用户获取成功');
        console.log('用户信息:', JSON.stringify(userData.data, null, 2));
      } else {
        const errorText = await userResponse.text();
        console.log('❌ 单个用户获取失败');
        console.log('错误信息:', errorText);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // 4. 测试更新用户
      console.log('4. 测试更新用户...');
      const updateData = {
        country: 'United States',
        region: 'North America',
        status: 'inactive'
      };

      const updateResponse = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      console.log(`状态码: ${updateResponse.status}`);
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ 用户更新成功');
        console.log('更新后的用户:', JSON.stringify(updateResult.data, null, 2));
      } else {
        const errorText = await updateResponse.text();
        console.log('❌ 用户更新失败');
        console.log('错误信息:', errorText);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // 5. 测试重置密码
      console.log('5. 测试重置密码...');
      const resetResponse = await fetch(`${BASE_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`状态码: ${resetResponse.status}`);
      
      if (resetResponse.ok) {
        const resetResult = await resetResponse.json();
        console.log('✅ 密码重置成功');
        console.log('重置结果:', JSON.stringify(resetResult.data, null, 2));
      } else {
        const errorText = await resetResponse.text();
        console.log('❌ 密码重置失败');
        console.log('错误信息:', errorText);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // 6. 测试删除用户
      console.log('6. 测试删除用户...');
      const deleteResponse = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'DELETE'
      });

      console.log(`状态码: ${deleteResponse.status}`);
      
      if (deleteResponse.ok) {
        console.log('✅ 用户删除成功');
      } else {
        const errorText = await deleteResponse.text();
        console.log('❌ 用户删除失败');
        console.log('错误信息:', errorText);
      }

    } else {
      const errorText = await createResponse.text();
      console.log('❌ 用户创建失败');
      console.log('错误信息:', errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 7. 测试批量操作
    console.log('7. 测试批量操作...');
    const batchResponse = await fetch(`${BASE_URL}/users/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'disable',
        ids: [1, 2, 3] // 假设的用户ID
      })
    });

    console.log(`状态码: ${batchResponse.status}`);
    
    if (batchResponse.ok) {
      const batchResult = await batchResponse.json();
      console.log('✅ 批量操作成功');
      console.log('批量操作结果:', JSON.stringify(batchResult.data, null, 2));
    } else {
      const errorText = await batchResponse.text();
      console.log('❌ 批量操作失败');
      console.log('错误信息:', errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 8. 测试导出用户
    console.log('8. 测试导出用户...');
    const exportResponse = await fetch(`${BASE_URL}/users/export`);
    console.log(`状态码: ${exportResponse.status}`);
    
    if (exportResponse.ok) {
      const contentType = exportResponse.headers.get('content-type');
      console.log('✅ 用户导出成功');
      console.log('内容类型:', contentType);
      
      if (contentType && contentType.includes('text/csv')) {
        const csvContent = await exportResponse.text();
        console.log('CSV内容预览:', csvContent.substring(0, 200) + '...');
      }
    } else {
      const errorText = await exportResponse.text();
      console.log('❌ 用户导出失败');
      console.log('错误信息:', errorText);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }

  console.log('\n🏁 用户管理API测试完成！');
}

// 运行测试
testUserAPI(); 