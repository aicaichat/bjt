# BJT产品管理系统 - 用户角色体系深度分析

## 概述

本文档详细分析了BJT产品管理系统的用户角色体系、权限机制以及页面访问控制的完整实现。

## 数据库用户表结构

### wp_bjt_users 表字段

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

### 关键字段说明

1. **`role`**: 用户角色，决定用户的权限级别
   - `admin`: 管理员
   - `sales`: 销售人员
   - `partner`: 合作伙伴
   - `customer`: 客户

2. **`preferred_unit`**: 用户偏好单位制
   - `metric`: 公制（厘米、千克、摄氏度）
   - `imperial`: 英制（英寸、磅、华氏度）

## 用户角色定义

### 1. Admin（管理员）👑
- **权限级别**: 最高
- **主要职责**: 系统管理、用户管理、产品管理
- **权限列表**:
  - ✅ 查看价格 (viewPrices)
  - ✅ 查看库存 (viewInventory)
  - ✅ 添加购物车 (addToCart)
  - ✅ 下单 (placeOrder)
  - ✅ 访问管理后台 (viewAdmin)
  - ✅ 编辑产品 (editProducts)
  - ✅ 删除产品 (deleteProducts)
  - ✅ 管理用户 (manageUsers)
  - ✅ 管理订单 (manageOrders)

### 2. Sales（销售人员）💼
- **权限级别**: 高
- **主要职责**: 销售支持、客户服务、订单管理
- **权限列表**:
  - ✅ 查看价格 (viewPrices)
  - ✅ 查看库存 (viewInventory)
  - ✅ 添加购物车 (addToCart)
  - ✅ 下单 (placeOrder)
  - ❌ 访问管理后台 (viewAdmin)
  - ✅ 编辑产品 (editProducts)
  - ❌ 删除产品 (deleteProducts)
  - ❌ 管理用户 (manageUsers)
  - ✅ 管理订单 (manageOrders)

### 3. Partner（合作伙伴）🤝
- **权限级别**: 中
- **主要职责**: 业务合作、产品采购
- **权限列表**:
  - ✅ 查看价格 (viewPrices)
  - ✅ 查看库存 (viewInventory)
  - ✅ 添加购物车 (addToCart)
  - ✅ 下单 (placeOrder)
  - ❌ 访问管理后台 (viewAdmin)
  - ❌ 编辑产品 (editProducts)
  - ❌ 删除产品 (deleteProducts)
  - ❌ 管理用户 (manageUsers)
  - ❌ 管理订单 (manageOrders)

### 4. Customer（客户）👤
- **权限级别**: 基础
- **主要职责**: 产品浏览、下单购买
- **权限列表**:
  - ✅ 查看价格 (viewPrices)
  - ❌ 查看库存 (viewInventory)
  - ✅ 添加购物车 (addToCart)
  - ✅ 下单 (placeOrder)
  - ❌ 访问管理后台 (viewAdmin)
  - ❌ 编辑产品 (editProducts)
  - ❌ 删除产品 (deleteProducts)
  - ❌ 管理用户 (manageUsers)
  - ❌ 管理订单 (manageOrders)

## 前端权限实现

### AuthContext 权限系统

```typescript
// 用户权限定义
export interface UserPermissions {
  viewPrices: boolean;
  viewInventory: boolean;
  addToCart: boolean;
  placeOrder: boolean;
  viewAdmin: boolean;
  editProducts: boolean;
  deleteProducts: boolean;
  manageUsers: boolean;
  manageOrders: boolean;
}

// 根据角色获取权限
const getPermissionsByRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case UserRole.ADMIN:
      return { /* 所有权限为true */ };
    case UserRole.SALES:
      return { /* 销售权限 */ };
    case UserRole.PARTNER:
      return { /* 合作伙伴权限 */ };
    case UserRole.CUSTOMER:
      return { /* 客户权限 */ };
  }
};

// 权限检查函数
const hasPermission = (permission: keyof UserPermissions): boolean => {
  if (!user || !user.permissions) return false;
  return user.permissions[permission];
};
```

### 页面级权限控制

#### 1. 机器页面 (Machines)
```typescript
// 权限检查
const isSales = user && hasPermission('viewInventory');
const isAdmin = user && hasPermission('viewAdmin');
const canViewPrices = user && hasPermission('viewPrices');
const canAddToCart = user && hasPermission('addToCart');

// 条件渲染
{isSales && (
  <div className="inventory-section">
    {/* 库存信息 - 仅销售和管理员可见 */}
  </div>
)}

<Button
  disabled={!canAddToCart}
  onClick={() => handleAddToCart(product)}
>
  {canAddToCart ? '添加到购物车' : '无权限添加'}
</Button>
```

#### 2. 用户Profile页面
```typescript
{hasPermission('viewAdmin') && (
  <TabPane tab="权限信息" key="permissions">
    {/* 权限信息展示 - 仅管理员可见 */}
  </TabPane>
)}
```

## 单位制偏好系统

### 数据库字段
- `preferred_unit`: 存储用户偏好的单位制
  - `metric`: 公制
  - `imperial`: 英制

### 前端实现

#### 1. 自动应用用户偏好
```typescript
// 根据用户偏好设置单位制
const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
  user?.preferredUnit || 'metric'
);

// 当用户信息变化时，更新单位制设置
useEffect(() => {
  if (user?.preferredUnit) {
    setUnitSystem(user.preferredUnit);
  }
}, [user?.preferredUnit]);
```

#### 2. 动态显示单位
```typescript
// 根据单位制显示不同的数据
<span>
  {unitSystem === 'metric' 
    ? machine.package_size_cm 
    : machine.package_size_inch
  }
</span>
```

#### 3. 用户偏好设置
```typescript
// 更新用户偏好单位制
const updatePreferredUnit = async (unit: UnitSystem) => {
  await authService.updateProfile({
    preferred_unit: unit
  });
  
  // 更新本地状态
  const updatedUser = { ...user, preferredUnit: unit };
  setUser(updatedUser);
  localStorage.setItem('user', JSON.stringify(updatedUser));
};
```

## 页面访问权限矩阵

| 页面/功能 | Admin | Sales | Partner | Customer |
|-----------|-------|-------|---------|----------|
| 产品浏览 | ✅ | ✅ | ✅ | ✅ |
| 价格查看 | ✅ | ✅ | ✅ | ✅ |
| 库存查看 | ✅ | ✅ | ❌ | ❌ |
| 添加购物车 | ✅ | ✅ | ✅ | ✅ |
| 下单 | ✅ | ✅ | ✅ | ✅ |
| 管理后台 | ✅ | ❌ | ❌ | ❌ |
| 用户管理 | ✅ | ❌ | ❌ | ❌ |
| 产品编辑 | ✅ | ✅ | ❌ | ❌ |
| 产品删除 | ✅ | ❌ | ❌ | ❌ |
| 订单管理 | ✅ | ✅ | ❌ | ❌ |
| 权限查看 | ✅ | ❌ | ❌ | ❌ |

## 安全机制

### 1. 前端权限检查
- 基于用户角色的权限矩阵
- 组件级别的条件渲染
- 按钮状态控制（禁用/启用）

### 2. 后端权限验证
- JWT Token验证
- 基于角色的API访问控制
- 数据库级别的权限检查

### 3. 数据保护
- 敏感信息（如库存）仅对有权限用户显示
- 价格信息根据用户级别显示
- 操作日志记录

## 用户体验优化

### 1. 智能默认设置
- 根据用户地区自动设置偏好单位制
- 基于用户角色显示相关功能

### 2. 权限提示
- 无权限操作时显示友好提示
- 权限不足时提供联系方式

### 3. 个性化界面
- 根据用户角色定制界面布局
- 单位制偏好自动应用到所有页面

## 扩展性设计

### 1. 角色扩展
- 支持添加新的用户角色
- 权限矩阵可配置化

### 2. 权限细化
- 支持更细粒度的权限控制
- 可按功能模块分配权限

### 3. 多租户支持
- 支持不同客户的独立权限体系
- 数据隔离和访问控制

## 最佳实践

### 1. 权限检查
```typescript
// ✅ 推荐：使用权限函数
const canEdit = hasPermission('editProducts');

// ❌ 不推荐：直接检查角色
const canEdit = user.role === 'admin' || user.role === 'sales';
```

### 2. 条件渲染
```typescript
// ✅ 推荐：基于权限的条件渲染
{hasPermission('viewInventory') && <InventoryComponent />}

// ❌ 不推荐：基于角色的条件渲染
{user.role === 'admin' && <InventoryComponent />}
```

### 3. 错误处理
```typescript
// ✅ 推荐：友好的权限错误提示
if (!hasPermission('addToCart')) {
  return <Button disabled>无权限添加到购物车</Button>;
}

// ❌ 不推荐：隐藏功能
if (!hasPermission('addToCart')) {
  return null;
}
```

## 总结

BJT产品管理系统的用户角色体系通过以下方式实现了完整的权限控制：

1. **数据库层面**: 通过`role`和`preferred_unit`字段存储用户角色和偏好
2. **前端层面**: 通过AuthContext提供统一的权限检查机制
3. **UI层面**: 基于权限动态显示/隐藏功能和内容
4. **用户体验**: 通过单位制偏好提供个性化体验

这套系统既保证了安全性，又提供了良好的用户体验和扩展性。 