# BJT 管理后台路由系统

## 概述

BJT管理后台提供了完整的登录验证和路由保护机制，支持管理员登录后访问各种管理功能。

## 核心特性

### 🔐 登录验证保护
- **自动重定向**: 未登录用户访问admin页面会自动重定向到登录页面
- **Token管理**: 使用localStorage存储admin_token进行会话管理
- **登录状态检查**: 实时检查登录状态，token失效时自动跳转登录
- **登录后重定向**: 登录成功后可重定向到用户之前访问的页面

### 📍 默认路由设置
- **Dashboard重定向**: 访问 `/admin` 或 `/admin/dashboard` 默认重定向到 `/admin/settings`
- **设置页面优先**: 系统设置页面作为管理后台的默认入口页面
- **智能导航**: 登录成功后智能重定向到用户之前尝试访问的页面

## 路由结构

### 公开路由（无需登录）
```
/admin/login    - 管理员登录页面
/admin/debug    - 调试页面
```

### 受保护路由（需要登录）
```
/admin/                    - 重定向到 /admin/settings
/admin/dashboard          - 重定向到 /admin/settings
/admin/settings           - 系统设置（默认页面）
/admin/product-lines      - 产品线管理
/admin/machines           - 主机管理
/admin/parts              - 主机料号管理
/admin/accessories        - 配件管理
/admin/consumables        - 耗材管理
/admin/spare-parts        - 备件管理
/admin/users              - 用户管理
/admin/relations          - 关系管理
```

### 开发环境路由
```
/admin/test              - 测试页面（仅开发环境）
```

## 使用方法

### 1. 访问管理后台

直接访问 `http://localhost:5173/admin`：

1. **未登录状态**: 自动重定向到 `/admin/login`
2. **已登录状态**: 自动重定向到 `/admin/settings`

### 2. 管理员登录

访问 `http://localhost:5173/admin/login`：

**测试账户**:
- 用户名: `admin`
- 密码: `password`
- 角色: 系统管理员

### 3. 登录流程

```typescript
// 1. 用户输入凭据
const credentials = { username: 'admin', password: 'password' };

// 2. 调用登录API
const response = await AdminService.login(credentials.username, credentials.password);

// 3. 保存token
localStorage.setItem('admin_token', response.data.token);

// 4. 重定向到目标页面
const redirectTo = previousUrl || '/admin/settings';
navigate(redirectTo, { replace: true });
```

### 4. 路由保护机制

```typescript
// ProtectedAdminRoute组件会检查token
const adminToken = localStorage.getItem('admin_token');

if (!adminToken) {
  // 重定向到登录页面，保存当前路径
  return <Navigate to="/admin/login" state={{ from: currentPath }} replace />;
}

// Token存在，允许访问
return <>{children}</>;
```

## 开发和测试

### 测试登录保护

1. **清除token测试**:
   ```javascript
   localStorage.removeItem('admin_token');
   // 然后访问 /admin，应该重定向到登录页面
   ```

2. **访问测试页面** (仅开发环境):
   ```
   http://localhost:5173/admin/test
   ```

3. **检查token状态**:
   ```javascript
   console.log('Admin Token:', localStorage.getItem('admin_token'));
   ```

### 退出登录

```typescript
const handleLogout = () => {
  localStorage.removeItem('admin_token');
  navigate('/admin/login');
};
```

## 组件架构

### 核心组件

1. **AdminRoutes**: 主路由配置组件
2. **ProtectedAdminRoute**: 路由保护组件
3. **AdminLayout**: 管理后台布局组件
4. **AdminLoginPage**: 登录页面组件

### 文件结构

```
frontend/src/admin/
├── routes.tsx                    # 主路由配置
├── components/
│   ├── ProtectedAdminRoute.tsx   # 路由保护组件
│   └── layout/
│       ├── AdminLayout.tsx       # 布局组件
│       ├── AdminHeader.tsx       # 头部组件
│       └── AdminSidebar.tsx      # 侧边栏组件
├── pages/
│   ├── login/
│   │   └── AdminLoginPage.tsx    # 登录页面
│   ├── settings/
│   │   └── SettingsPage.tsx      # 设置页面（默认）
│   └── AdminTestPage.tsx         # 测试页面
└── api/
    └── adminService.ts           # Admin API服务
```

## 安全考虑

1. **Token验证**: 目前使用简单的localStorage存储，生产环境应考虑：
   - Token过期机制
   - 定期刷新Token
   - HTTPS传输
   - CSRF保护

2. **权限控制**: 可扩展角色权限系统：
   - 角色定义（admin, operator, viewer）
   - 页面权限控制
   - 操作权限验证

3. **会话管理**: 
   - 自动登出机制
   - 并发会话控制
   - 异常登录检测

## 配置选项

### 环境变量

```env
NODE_ENV=development          # 开发环境启用测试页面
REACT_APP_ADMIN_API_URL=      # Admin API地址
```

### 自定义配置

```typescript
// 修改默认重定向页面
<Route index element={<Navigate to="/admin/custom-page" replace />} />

// 添加新的受保护路由
<Route path="custom" element={<CustomPage />} />
```

## 故障排除

### 常见问题

1. **无法访问admin页面**
   - 检查是否有admin_token: `localStorage.getItem('admin_token')`
   - 检查路由是否正确配置
   - 查看浏览器控制台错误信息

2. **登录后重定向错误**
   - 检查AdminLoginPage中的重定向逻辑
   - 确认目标路由存在且可访问

3. **Token失效**
   - 清除localStorage: `localStorage.clear()`
   - 重新登录获取新token

### 调试工具

访问 `/admin/debug` 页面查看系统状态和调试信息。

---

**更新时间**: 2024-05-28  
**版本**: v1.0.0 