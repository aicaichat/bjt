# Admin路由功能验证

## 🧪 测试步骤

### 1. 测试未登录状态的重定向

1. **清除admin token**:
   ```javascript
   // 在浏览器控制台中执行
   localStorage.removeItem('admin_token');
   console.log('Admin token cleared');
   ```

2. **访问admin页面**:
   ```
   访问: http://localhost:5173/admin
   期望结果: 自动重定向到 http://localhost:5173/admin/login
   ```

3. **访问受保护的admin子页面**:
   ```
   访问: http://localhost:5173/admin/settings
   期望结果: 自动重定向到 http://localhost:5173/admin/login
   ```

### 2. 测试登录功能

1. **访问登录页面**:
   ```
   访问: http://localhost:5173/admin/login
   期望结果: 显示登录表单
   ```

2. **使用测试账户登录**:
   ```
   用户名: admin
   密码: password
   期望结果: 登录成功，重定向到 /admin/settings
   ```

3. **检查token是否保存**:
   ```javascript
   // 在浏览器控制台中执行
   console.log('Admin token:', localStorage.getItem('admin_token'));
   // 期望结果: 显示token字符串
   ```

### 3. 测试默认重定向

1. **访问admin根路径**:
   ```
   访问: http://localhost:5173/admin
   期望结果: 自动重定向到 http://localhost:5173/admin/settings
   ```

2. **访问dashboard路径**:
   ```
   访问: http://localhost:5173/admin/dashboard
   期望结果: 自动重定向到 http://localhost:5173/admin/settings
   ```

### 4. 测试登录后的页面保护

1. **确保已登录状态**
2. **访问各个admin页面**:
   ```
   http://localhost:5173/admin/settings       - ✅ 应该正常访问
   http://localhost:5173/admin/users          - ✅ 应该正常访问
   http://localhost:5173/admin/product-lines  - ✅ 应该正常访问
   ```

### 5. 测试智能重定向

1. **清除token**:
   ```javascript
   localStorage.removeItem('admin_token');
   ```

2. **尝试访问特定页面**:
   ```
   访问: http://localhost:5173/admin/users
   期望结果: 重定向到登录页面，但保存了来源页面信息
   ```

3. **登录后验证重定向**:
   ```
   登录成功后
   期望结果: 自动重定向回 /admin/users (而不是默认的settings页面)
   ```

### 6. 测试退出登录

1. **在任意admin页面，点击头部的退出登录**
2. **期望结果**:
   - Token被清除
   - 重定向到登录页面
   - 无法再访问受保护页面

## 🔧 开发环境测试

### 访问测试页面 (仅开发环境)

```
访问: http://localhost:5173/admin/test
期望结果: 显示admin功能测试页面，包含各种状态信息
```

## ✅ 验证清单

- [ ] 未登录时访问admin页面会重定向到登录页面
- [ ] 登录页面正常显示和工作
- [ ] 使用测试账户可以成功登录
- [ ] 登录后token正确保存到localStorage
- [ ] 访问 `/admin` 默认重定向到 `/admin/settings`
- [ ] 访问 `/admin/dashboard` 重定向到 `/admin/settings`
- [ ] 登录后可以正常访问所有受保护页面
- [ ] 智能重定向：登录后返回用户之前尝试访问的页面
- [ ] 退出登录功能正常工作
- [ ] 开发环境下可以访问测试页面

## 🐛 常见问题排查

### 问题1: 重定向不工作
```javascript
// 检查路由配置
console.log('Current path:', window.location.pathname);
console.log('Admin token:', localStorage.getItem('admin_token'));
```

### 问题2: 登录后还是重定向到登录页面
```javascript
// 检查token是否正确保存
console.log('Token exists:', !!localStorage.getItem('admin_token'));
console.log('Token value:', localStorage.getItem('admin_token'));
```

### 问题3: 页面白屏或错误
```javascript
// 检查浏览器控制台是否有错误
// 检查网络请求是否正常
```

## 🔍 调试工具

1. **浏览器开发者工具**:
   - Console: 查看日志和错误
   - Network: 检查API请求
   - Application > Local Storage: 查看token存储

2. **React开发者工具**:
   - 检查组件状态
   - 查看路由状态

3. **Admin调试页面**:
   ```
   http://localhost:5173/admin/debug
   ``` 