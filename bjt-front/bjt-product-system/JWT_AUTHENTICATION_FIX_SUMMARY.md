# JWT 认证系统修复总结

## 🔍 问题诊断

### 原始问题
- 前端显示 `GET http://localhost:5173/wp-json/bjt/v1/user/me 401 (Unauthorized)`
- PDF上传失败：`未找到认证token，请重新登录`
- 存储键值不一致问题

### 发现的关键信息
1. **正确的登录凭据**: `admin` / `password123` (从测试脚本发现)
2. **存储键值不匹配**: 
   - 旧系统使用：`bjt_token`
   - authService使用：`auth_token`
3. **当前JWT Token**: 有效的JWT token存在但键值不对应

## 🔧 解决方案实施

### 1. 修复MachinesPage.tsx认证逻辑

#### 导入authService
```typescript
import authService from '../../../api/services/auth.service';
```

#### 统一认证状态管理
- 使用authService的标准方法：`getToken()`, `getUser()`, `isAuthenticated()`
- 自动迁移旧token：从`bjt_token`迁移到`auth_token`
- 统一用户信息存储：使用localStorage而非sessionStorage

#### 增强的认证检查函数
```typescript
const checkAuthStatus = async () => {
  // 使用authService检查认证状态
  // 自动迁移旧token
  // JWT token解码和过期检查
  // 自动获取用户信息
}
```

#### 改进的登录测试功能
```typescript
const testLogin = async (username: string, password: string) => {
  // 主要使用authService.login()
  // 备用方法支持多种登录端点
  // 自动保存token和用户信息
}
```

### 2. JWT Token 分析

#### 解码您当前的JWT Token
```javascript
// Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODA4MCIsImlhdCI6MTc0OTExNTExNSwiZXhwIjoxNzQ5MjAxNTE1LCJkYXRhIjp7InVzZXJfaWQiOiIxNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifX0.3U2_b07Xf_yNvfpcfpug_IxQf0-RKbQKdsBKFYR4OzQ

// 解码后的payload:
{
  "iss": "http://localhost:8080",
  "iat": 1749115115,
  "exp": 1749201515,
  "data": {
    "user_id": "14",
    "username": "admin", 
    "role": "admin"
  }
}
```

#### Token验证
- ✅ Token格式有效
- ✅ 包含用户信息
- ✅ 过期时间合理
- ⚠️ 需要验证密钥匹配

### 3. 存储键值标准化

#### AuthService标准键值
```typescript
private tokenKey = 'auth_token';  // JWT token
private userKey = 'user';         // 用户信息
```

#### 迁移逻辑
```typescript
// 自动迁移旧token
const oldToken = localStorage.getItem('bjt_token');
if (oldToken && !storedToken) {
  localStorage.setItem('auth_token', oldToken);
  localStorage.removeItem('bjt_token');
}
```

## 🐳 Docker 服务管理

### 重启前端服务
```bash
docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend
```

### 查看服务状态
```bash
docker-compose -f docker/dev/docker-compose.nginx.yml ps
```

### 查看前端日志
```bash
docker-compose -f docker/dev/docker-compose.nginx.yml logs --tail=20 frontend
```

## 🔍 测试验证

### 前端认证状态检查
1. 打开浏览器开发者工具
2. 访问 http://localhost:5173
3. 在MachinesPage中查看认证状态显示区域
4. 使用测试登录按钮验证不同凭据

### 预期结果
- ✅ 显示JWT Token状态
- ✅ 显示用户信息
- ✅ 自动迁移旧token
- ✅ Token过期检查
- ✅ PDF上传功能正常

## 📝 重要提醒

### 正确的登录凭据
- **用户名**: `admin`
- **密码**: `password123`

### 存储位置
- **Token**: `localStorage['auth_token']`
- **用户信息**: `localStorage['user']`

### JWT密钥
- **开发环境**: `bjt-secret-key-2023`
- **设置命令**: 已在Docker compose中配置

## 🚀 下一步建议

1. **验证功能**: 测试认证状态显示和PDF上传
2. **清理代码**: 移除临时调试日志
3. **优化错误处理**: 完善用户友好的错误提示
4. **安全加固**: 在生产环境中使用更强的JWT密钥

---

**修复完成时间**: 2024-12-06  
**Docker服务状态**: ✅ 前端服务已重启并正常运行  
**热重载状态**: ✅ Vite HMR正常工作 