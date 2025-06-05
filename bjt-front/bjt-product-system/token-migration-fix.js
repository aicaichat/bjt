// BJT 认证Token修复脚本
// 在浏览器控制台中运行此脚本来修复token存储问题

console.log('🔧 开始BJT认证Token修复...');

// 步骤1: 检查当前状态
console.log('📋 步骤1: 检查当前认证状态');
const oldToken = localStorage.getItem('bjt_token');
const newToken = localStorage.getItem('auth_token');
const userInfo = localStorage.getItem('user');

console.log('当前存储状态:', {
  'bjt_token': oldToken ? `存在 (${oldToken.length} 字符)` : '不存在',
  'auth_token': newToken ? `存在 (${newToken.length} 字符)` : '不存在',
  'user': userInfo ? '存在' : '不存在'
});

// 步骤2: Token迁移
if (oldToken && !newToken) {
  console.log('🔄 步骤2: 执行Token迁移...');
  localStorage.setItem('auth_token', oldToken);
  localStorage.removeItem('bjt_token');
  console.log('✅ Token迁移完成');
  
  // 解码token信息
  try {
    const payload = oldToken.split('.')[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload));
      console.log('🔐 Token信息:', {
        用户ID: decoded.data.user_id,
        用户名: decoded.data.username,
        角色: decoded.data.role,
        签发时间: new Date(decoded.iat * 1000).toLocaleString(),
        过期时间: new Date(decoded.exp * 1000).toLocaleString(),
        是否过期: decoded.exp * 1000 < Date.now()
      });
      
      // 如果没有用户信息，从token中创建
      if (!userInfo && decoded.data) {
        const user = {
          id: decoded.data.user_id,
          username: decoded.data.username,
          role: decoded.data.role
        };
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ 用户信息已创建:', user);
      }
    }
  } catch (error) {
    console.error('❌ 解码Token失败:', error);
  }
} else if (newToken) {
  console.log('✅ 步骤2: Token已存在，无需迁移');
} else {
  console.log('⚠️ 步骤2: 没有找到有效的Token');
}

// 步骤3: 验证修复结果
console.log('📋 步骤3: 验证修复结果');
const finalToken = localStorage.getItem('auth_token');
const finalUser = localStorage.getItem('user');

console.log('修复后状态:', {
  'auth_token': finalToken ? `存在 (${finalToken.length} 字符)` : '不存在',
  'user': finalUser ? '存在' : '不存在'
});

// 步骤4: 测试API调用
if (finalToken) {
  console.log('🔄 步骤4: 测试API调用...');
  fetch('/wp-json/bjt/v1/user/me', {
    headers: {
      'Authorization': `Bearer ${finalToken}`,
    },
    credentials: 'include'
  })
  .then(response => {
    console.log('API响应状态:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ API调用成功:', data);
  })
  .catch(error => {
    console.error('❌ API调用失败:', error);
  });
} else {
  console.log('⚠️ 步骤4: 没有Token，跳过API测试');
}

// 提示刷新页面
console.log('');
console.log('🎉 修复完成！请刷新页面查看效果。');
console.log('如果问题仍然存在，请尝试以下步骤:');
console.log('1. 清除所有localStorage: localStorage.clear()');
console.log('2. 重新登录系统');
console.log('3. 或使用测试登录功能'); 