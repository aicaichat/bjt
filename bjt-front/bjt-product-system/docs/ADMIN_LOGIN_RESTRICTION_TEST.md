# 管理后台登录限制测试文档

## 🔒 安全要求

管理后台现在只允许 **admin** 账号登录，其他任何账号都将被拒绝访问。

## 🧪 测试场景

### 1. 测试admin账号登录（应该成功）

**步骤**：
1. 访问管理后台登录页面：`http://localhost:3000/admin/login`
2. 输入以下凭据：
   - 用户名：`admin`
   - 密码：`password`
3. 点击"管理员登录"按钮

**期望结果**：
- ✅ 登录成功
- ✅ 显示"管理员登录成功"消息
- ✅ 自动跳转到 `/admin/settings` 页面
- ✅ localStorage 中保存了 `admin_token`

### 2. 测试非admin账号登录（应该失败）

#### 2.1 测试其他预定义账号
**步骤**：
1. 访问管理后台登录页面
2. 尝试输入以下任一凭据：
   - 用户名：`user` / 密码：`password`
   - 用户名：`sales` / 密码：`password`
   - 用户名：`manager` / 密码：`password`
   - 用户名：`customer` / 密码：`password`
3. 点击"管理员登录"按钮

**期望结果**：
- ❌ 登录失败
- ❌ 显示错误消息："访问被拒绝：只有管理员账号可以登录后台管理系统"
- ❌ 停留在登录页面
- ❌ localStorage 中没有保存 `admin_token`

#### 2.2 测试表单验证
**步骤**：
1. 在用户名字段输入非admin用户名（如：`test`）
2. 观察表单验证

**期望结果**：
- ❌ 表单显示验证错误："只有admin账号可以登录管理后台"
- ❌ 登录按钮保持禁用状态

#### 2.3 测试空用户名或错误用户名
**步骤**：
1. 尝试以下组合：
   - 空用户名 + 任意密码
   - `Admin`（大写）+ `password`
   - `administrator` + `password`
   - `root` + `password`

**期望结果**：
- ❌ 全部登录失败
- ❌ 显示相应的错误消息

### 3. 测试后端安全验证

**步骤**：
1. 使用浏览器开发者工具或Postman
2. 直接调用登录API：
   ```javascript
   fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ username: 'user', password: 'password' })
   })
   ```

**期望结果**：
- ❌ 返回错误响应
- ❌ 不返回有效的token

## 🔍 验证工具

### 在浏览器控制台中运行的测试脚本

```javascript
// 测试admin登录
async function testAdminLogin() {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' })
    });
    const data = await response.json();
    console.log('Admin login result:', data);
    return data.success;
  } catch (error) {
    console.error('Admin login error:', error);
    return false;
  }
}

// 测试非admin登录
async function testNonAdminLogin(username) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'password' })
    });
    const data = await response.json();
    console.log(`${username} login result:`, data);
    return data.success;
  } catch (error) {
    console.error(`${username} login error:`, error);
    return false;
  }
}

// 运行完整测试
async function runLoginTests() {
  console.log('🧪 开始登录限制测试...');
  
  const adminResult = await testAdminLogin();
  console.log('✅ Admin登录测试:', adminResult ? '通过' : '失败');
  
  const testUsers = ['user', 'sales', 'manager', 'customer', 'root', 'administrator'];
  
  for (const user of testUsers) {
    const result = await testNonAdminLogin(user);
    console.log(`❌ ${user}登录测试:`, !result ? '通过(被正确拒绝)' : '失败(不应该成功)');
  }
  
  console.log('🏁 测试完成');
}

// 运行测试
runLoginTests();
```

### 检查当前登录状态

```javascript
// 检查当前是否有admin token
function checkAdminToken() {
  const token = localStorage.getItem('admin_token');
  console.log('Admin token:', token ? '存在' : '不存在');
  return !!token;
}

// 清除admin token
function clearAdminToken() {
  localStorage.removeItem('admin_token');
  console.log('Admin token已清除');
}

// 验证当前登录状态
checkAdminToken();
```

## 🛡️ 安全层级

### 前端安全
1. **表单验证**：用户名输入时实时验证
2. **预提交检查**：提交前再次验证用户名
3. **UI限制**：测试账号卡片只显示admin账号

### 后端安全
1. **API级验证**：AdminService.login方法中的用户名检查
2. **响应验证**：检查后端返回的用户信息
3. **Token验证**：确保只为admin用户生成token

### 多层防护
- 即使绕过前端验证，后端API也会拒绝非admin用户
- 即使后端意外返回其他用户token，前端也会再次验证
- 所有错误都会被正确处理和显示

## 📋 测试清单

- [ ] admin账号可以成功登录
- [ ] 非admin账号被拒绝登录
- [ ] 表单验证正常工作
- [ ] 错误消息显示正确
- [ ] Token只为admin用户保存
- [ ] 登录后正确跳转
- [ ] 安全提示显示正确
- [ ] 测试账号功能只显示admin

## 🔧 故障排除

### 如果admin无法登录
1. 检查后端API是否正常运行
2. 确认用户名密码正确：`admin` / `password`
3. 查看浏览器控制台错误信息
4. 检查网络请求是否成功

### 如果其他账号能够登录
1. 检查AdminService.login方法的验证逻辑
2. 确认前端表单验证是否启用
3. 查看后端API返回的响应内容
4. 检查是否有缓存问题

## 🎯 预期行为总结

✅ **允许的行为**：
- admin账号使用正确密码登录
- 登录成功后访问管理后台所有功能

❌ **禁止的行为**：
- 任何非admin账号尝试登录
- 使用错误的admin密码登录
- 绕过前端直接调用API（非admin用户）
- 伪造用户信息或Token 