# BJT产品管理系统 - 登录API实现文档

## 概述

本文档详细说明了BJT产品管理系统中基于 `wp_bjt_users` 表的登录API实现，包括用户角色权限系统和偏好单位制支持。

## 数据库结构

### wp_bjt_users 表

```sql
CREATE TABLE `wp_bjt_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `customer_code` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL,                    -- 用户角色
  `country` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `preferred_unit` varchar(20) DEFAULT NULL,      -- 偏好单位制
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

### 测试用户数据

系统包含以下测试用户（密码均为 `password123`）：

| 用户名 | 邮箱 | 角色 | 偏好单位制 | 区域 |
|--------|------|------|------------|------|
| admin | admin@bjt.com | admin | metric | CN |
| sales_user | sales@bjt.com | sales | metric | CN |
| partner_user | partner@bjt.com | partner | imperial | US |
| customer_user | customer@bjt.com | customer | metric | EU |
| test_imperial | test.imperial@bjt.com | customer | imperial | EU |

## API端点

### 1. 用户登录

**端点**: `POST /wp-json/bjt/v1/auth/login`

**请求体**:
```json
{
  "username": "admin",
  "password": "password123",
  "remember_me": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@bjt.com",
      "name": "admin",
      "display_name": "admin",
      "role": "admin",
      "region": "CN",
      "country": "China",
      "customer_code": "ADM001",
      "company_logo": "/images/logos/admin.png",
      "preferred_unit": "metric",
      "status": "active",
      "permissions": ["view_prices", "view_inventory", ...],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  },
  "message": "登录成功"
}
```

### 2. 获取当前用户信息

**端点**: `GET /wp-json/bjt/v1/user/me`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@bjt.com",
    "role": "admin",
    "preferred_unit": "metric",
    ...
  }
}
```

### 3. 更新用户资料

**端点**: `PUT /wp-json/bjt/v1/user/profile`

**请求头**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**请求体**:
```json
{
  "preferred_unit": "imperial",
  "email": "newemail@bjt.com",
  "country": "United States"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "preferred_unit": "imperial",
    ...
  },
  "message": "用户资料更新成功"
}
```

### 4. 刷新令牌

**端点**: `POST /wp-json/bjt/v1/auth/refresh`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "new_token_here",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

### 5. 退出登录

**端点**: `POST /wp-json/bjt/v1/auth/logout`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

## 用户角色权限系统

### 角色定义

| 角色 | 说明 | 权限级别 |
|------|------|----------|
| admin | 管理员 | 最高权限，可管理所有功能 |
| sales | 销售人员 | 可查看价格、库存，管理产品和订单 |
| partner | 合作伙伴 | 可查看价格、库存，下单购买 |
| customer | 客户 | 可查看价格，下单购买 |

### 权限映射

```typescript
interface UserPermissions {
  view_prices: boolean;        // 查看价格
  view_inventory: boolean;     // 查看库存
  add_to_cart: boolean;        // 添加到购物车
  place_order: boolean;        // 下单
  view_admin: boolean;         // 访问管理后台
  edit_products: boolean;      // 编辑产品
  delete_products: boolean;    // 删除产品
  manage_users: boolean;       // 管理用户
  manage_orders: boolean;      // 管理订单
}
```

### 角色权限详情

#### Admin (管理员)
- ✅ 所有权限
- 可访问管理后台
- 可管理用户和订单
- 可编辑和删除产品

#### Sales (销售)
- ✅ 查看价格和库存
- ✅ 添加到购物车和下单
- ✅ 编辑产品
- ✅ 管理订单
- ❌ 访问管理后台
- ❌ 删除产品
- ❌ 管理用户

#### Partner (合作伙伴)
- ✅ 查看价格和库存
- ✅ 添加到购物车和下单
- ❌ 其他管理功能

#### Customer (客户)
- ✅ 查看价格
- ✅ 添加到购物车和下单
- ❌ 查看库存
- ❌ 其他管理功能

## 偏好单位制系统

### 单位制类型

```typescript
type UnitSystem = 'metric' | 'imperial';
```

### 单位制影响

1. **重量单位**
   - metric: kg, g
   - imperial: lb, oz

2. **长度单位**
   - metric: mm, cm, m
   - imperial: in, ft

3. **温度单位**
   - metric: °C
   - imperial: °F

4. **压力单位**
   - metric: bar, kPa
   - imperial: psi

### 前端实现

```typescript
// 在Machines页面中根据用户偏好设置单位制
const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
  user?.preferred_unit || 'metric'
);

// 当用户信息变化时，更新单位制设置
useEffect(() => {
  if (user?.preferred_unit) {
    setUnitSystem(user.preferred_unit);
  }
}, [user?.preferred_unit]);
```

## 前端集成

### AuthContext 更新

```typescript
// 新的AuthContext支持wp_bjt_users表
import { authService, User, UserRole, UnitSystem } from '../api/services/auth.service';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getUserRole: () => UserRole | null;
  getPreferredUnit: () => UnitSystem;
  setPreferredUnit: (unit: UnitSystem) => Promise<void>;
}
```

### 权限检查

```typescript
// 在组件中检查权限
const { hasPermission } = useAuth();

// 检查是否可以查看价格
if (hasPermission('view_prices')) {
  // 显示价格
}

// 检查是否可以添加到购物车
if (hasPermission('add_to_cart')) {
  // 显示添加到购物车按钮
}
```

## 安全特性

### 1. 密码加密
- 使用PHP的 `password_hash()` 函数加密密码
- 使用 `password_verify()` 验证密码

### 2. JWT令牌
- 使用JWT令牌进行身份验证
- 令牌包含用户ID和过期时间
- 支持令牌刷新机制

### 3. 权限验证
- 每个API端点都进行权限验证
- 基于用户角色的访问控制
- 前端和后端双重权限检查

## 测试

### 运行测试

```bash
# 1. 首先插入测试用户数据
mysql -u root -p bjt_product < docker/dev/mysql/test_users.sql

# 2. 运行API测试
node test_login_api.js
```

### 测试覆盖

- ✅ 用户登录功能
- ✅ 获取当前用户信息
- ✅ 更新用户偏好单位制
- ✅ 角色权限验证
- ✅ JWT令牌验证
- ✅ 错误处理

## 部署说明

### 1. 数据库设置

```sql
-- 创建wp_bjt_users表
CREATE TABLE `wp_bjt_users` (...);

-- 插入测试用户
INSERT INTO wp_bjt_users (...) VALUES (...);
```

### 2. WordPress插件

确保 `bjt-core-entities` 插件已激活：

```php
// 在WordPress管理后台激活插件
// 或通过WP-CLI
wp plugin activate bjt-core-entities
```

### 3. 前端配置

```typescript
// 更新API配置
const API_BASE_URL = 'http://your-domain.com/wp-json/bjt/v1';
```

## 故障排除

### 常见问题

1. **登录失败**
   - 检查数据库连接
   - 验证用户凭据
   - 检查密码加密

2. **权限错误**
   - 验证JWT令牌
   - 检查用户角色
   - 确认权限映射

3. **单位制不更新**
   - 检查API端点
   - 验证请求格式
   - 确认数据库更新

### 调试工具

- 使用 `test_login_api.js` 测试API
- 检查浏览器开发者工具
- 查看WordPress错误日志

## 总结

本实现提供了完整的用户认证和权限管理系统，支持：

- ✅ 基于 `wp_bjt_users` 表的用户认证
- ✅ 角色权限系统
- ✅ 偏好单位制支持
- ✅ JWT令牌认证
- ✅ 前后端权限验证
- ✅ 完整的API文档和测试

系统现在可以真正使用数据库中的用户数据进行认证，而不再依赖硬编码的模拟数据。 