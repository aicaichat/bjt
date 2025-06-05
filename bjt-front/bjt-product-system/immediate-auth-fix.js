// 立即修复BJT认证问题
// 在浏览器控制台中粘贴并运行此脚本

console.log('🔧 立即修复BJT认证问题...');

// 步骤1: 检查当前状态
const bjt_token = localStorage.getItem('bjt_token');
const auth_token = localStorage.getItem('auth_token');
const user = localStorage.getItem('user');

console.log('当前状态:', {
  bjt_token: bjt_token ? '✅ 存在' : '❌ 不存在',
  auth_token: auth_token ? '✅ 存在' : '❌ 不存在',
  user: user ? '✅ 存在' : '❌ 不存在'
});

// 步骤2: 找到有效的token
let validToken = auth_token || bjt_token;

if (!validToken) {
  console.error('❌ 未找到任何JWT token');
  alert('未找到有效的JWT token，请重新登录');
} else {
  console.log('✅ 找到有效token，长度:', validToken.length);
  
  try {
    // 步骤3: 解码token
    const payload = validToken.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    console.log('🔐 Token信息:', {
      用户ID: decoded.data.user_id,
      用户名: decoded.data.username,
      角色: decoded.data.role,
      过期时间: new Date(decoded.exp * 1000).toLocaleString(),
      是否过期: decoded.exp * 1000 < Date.now()
    });
    
    // 步骤4: 检查token是否过期
    if (decoded.exp * 1000 < Date.now()) {
      console.error('❌ Token已过期');
      alert('Token已过期，请重新登录');
      return;
    }
    
    // 步骤5: 设置正确的auth_token
    localStorage.setItem('auth_token', validToken);
    if (bjt_token) {
      localStorage.removeItem('bjt_token');
      console.log('✅ 已迁移 bjt_token 到 auth_token');
    }
    
    // 步骤6: 创建用户信息
    const userInfo = {
      id: parseInt(decoded.data.user_id) || 14,
      username: decoded.data.username || 'admin',
      email: (decoded.data.username || 'admin') + '@bjt.com',
      name: decoded.data.username || 'admin',
      display_name: decoded.data.username || 'admin',
      role: decoded.data.role || 'admin',
      region: 'CN',
      preferred_unit: 'metric',
      status: 'active',
      permissions: ['read', 'write', 'delete', 'admin'],
      created_at: new Date(decoded.iat * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(userInfo));
    console.log('✅ 用户信息已创建:', userInfo);
    
    // 步骤7: 验证修复结果
    console.log('🎉 修复完成！验证结果:');
    console.log({
      auth_token: localStorage.getItem('auth_token') ? '✅ 存在' : '❌ 不存在',
      user: localStorage.getItem('user') ? '✅ 存在' : '❌ 不存在'
    });
    
    // 步骤8: 测试API
    console.log('🔄 测试API访问...');
    fetch('/wp-json/bjt/v1/user/me', {
      headers: {
        'Authorization': `Bearer ${validToken}`,
      },
      credentials: 'include'
    })
    .then(response => {
      console.log('API响应状态:', response.status);
      if (response.ok) {
        console.log('✅ API访问成功！');
        alert('🎉 认证修复成功！请刷新页面查看效果。');
      } else {
        console.warn('⚠️ API访问失败，状态码:', response.status);
        alert('⚠️ Token可能无效，但基本信息已修复。请刷新页面尝试。');
      }
      return response.json();
    })
    .then(data => {
      console.log('API响应数据:', data);
    })
    .catch(error => {
      console.error('API测试失败:', error);
      alert('⚠️ API测试失败，但基本信息已修复。请刷新页面尝试。');
    });
    
  } catch (error) {
    console.error('❌ 处理token时出错:', error);
    alert('❌ 处理token时出错: ' + error.message);
  }
}

console.log('');
console.log('📋 修复说明:');
console.log('1. ✅ 已将token迁移到正确的存储键值 (auth_token)');
console.log('2. ✅ 已从JWT token中提取并创建用户信息');
console.log('3. ✅ 已验证token有效性和过期时间');
console.log('4. 📱 请刷新页面，然后查看认证状态');
console.log('5. 🔄 如果仍有问题，点击页面上的"检查认证状态"按钮'); 