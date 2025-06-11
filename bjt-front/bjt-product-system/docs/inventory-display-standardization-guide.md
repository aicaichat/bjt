# 库存显示标准化指导文档

## 📋 概述

本文档定义了产品页面（主机、耗材、备件、配件）库存显示的统一标准，确保权限控制精确、多语言支持完整、用户体验一致。

## 🎯 核心原则

### 权限分级原则
- **Admin/Sales**: 完全访问权限，查看所有区域库存
- **Partner**: 限制访问权限，仅查看所属区域库存
- **Customer**: 无库存访问权限，不显示任何库存信息

### 多语言一致性原则
- 所有库存相关文本必须支持中英文切换
- 库存状态描述统一使用翻译键
- 区域名称支持本地化显示

### 用户体验统一性原则
- 所有产品页面使用相同的库存显示组件
- 库存状态颜色和样式保持一致
- 权限提示信息清晰友好

## 🔐 权限控制矩阵

```typescript
const INVENTORY_DISPLAY_RULES = {
  admin: {
    canViewInventory: true,
    showAllRegions: true,
    showDetailedStock: true,
    description: "管理员 - 显示所有区域的详细库存信息"
  },
  sales: {
    canViewInventory: true, 
    showAllRegions: true,
    showDetailedStock: true,
    description: "销售员 - 显示所有区域的详细库存信息"
  },
  partner: {
    canViewInventory: true,
    showAllRegions: false,
    showDetailedStock: true, 
    description: "合作伙伴 - 只显示用户所属区域的库存信息"
  },
  customer: {
    canViewInventory: false,
    showAllRegions: false,
    showDetailedStock: false,
    description: "客户 - 不显示任何库存信息"
  }
};
```

### 权限验证逻辑

| 用户角色 | 库存可见性 | 区域范围 | 详细程度 | 实际应用 |
|---------|-----------|---------|----------|----------|
| **admin** | ✅ 完全可见 | 🌍 全球所有区域 | 📊 精确数量 | 库存管理、全局监控 |
| **sales** | ✅ 完全可见 | 🌍 全球所有区域 | 📊 精确数量 | 销售决策、库存咨询 |
| **partner** | ⚠️ 限制可见 | 🏢 所属区域 | 📊 精确数量 | 区域销售、本地库存 |
| **customer** | ❌ 不可见 | ➖ 无权限 | ➖ 无信息 | 纯购买体验 |

## 🎨 库存状态标准

### 状态分级标准
```typescript
const STOCK_LEVELS = {
  OUT_OF_STOCK: { threshold: 0, priority: 1 },
  LOW_STOCK: { threshold: 10, priority: 2 },
  MEDIUM_STOCK: { threshold: 50, priority: 3 },
  HIGH_STOCK: { threshold: Infinity, priority: 4 }
};
```

### 视觉设计标准
```typescript
const STOCK_STATUS_STYLES = {
  outOfStock: {
    colorClass: 'red',
    textClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    icon: '🚫'
  },
  lowStock: {
    colorClass: 'orange', 
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    icon: '⚠️'
  },
  mediumStock: {
    colorClass: 'yellow',
    textClass: 'text-yellow-600',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    icon: '📦'
  },
  highStock: {
    colorClass: 'green',
    textClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    icon: '✅'
  }
};
```

## 🔧 技术实现标准

### 1. 权限控制Hook
```typescript
/**
 * 库存权限管理Hook
 * @returns {Object} 权限配置对象
 */
const useInventoryPermissions = () => {
  const { user } = useAuth();
  
  const getInventoryPermissions = useCallback(() => {
    if (!user) return INVENTORY_DISPLAY_RULES.customer;
    
    const userRole = user.role?.toLowerCase() || 'customer';
    return INVENTORY_DISPLAY_RULES[userRole] || INVENTORY_DISPLAY_RULES.customer;
  }, [user]);

  const permissions = getInventoryPermissions();
  
  return {
    canViewInventory: permissions.canViewInventory,
    shouldShowAllRegions: permissions.showAllRegions,
    canShowDetailedStock: permissions.showDetailedStock,
    userRegion: user?.region || 'CN',
    userRole: user?.role || 'customer'
  };
};
```

### 2. 数据过滤逻辑
```typescript
/**
 * 根据用户权限过滤库存数据
 * @param {InventoryData[]} inventory - 原始库存数据
 * @param {Object} permissions - 用户权限配置
 * @returns {InventoryData[]} 过滤后的库存数据
 */
const filterInventoryByPermission = (
  inventory: InventoryData[], 
  permissions: ReturnType<typeof useInventoryPermissions>
): InventoryData[] => {
  const { canViewInventory, shouldShowAllRegions, userRegion } = permissions;
  
  // 无权限查看库存
  if (!canViewInventory) {
    return [];
  }
  
  // Admin和Sales看所有区域
  if (shouldShowAllRegions) {
    return inventory || [];
  }
  
  // Partner只看自己区域
  return (inventory || []).filter(inv => inv.region === userRegion);
};
```

### 3. 状态计算逻辑
```typescript
/**
 * 计算库存状态（支持多语言）
 * @param {number} quantity - 库存数量
 * @param {Function} t - 翻译函数
 * @returns {Object} 库存状态对象
 */
const getStockStatusWithI18n = (quantity: number, t: TFunction) => {
  if (quantity <= 0) {
    return {
      status: 'outOfStock',
      label: t('inventory.outOfStock'),
      ...STOCK_STATUS_STYLES.outOfStock
    };
  } else if (quantity <= 10) {
    return {
      status: 'lowStock', 
      label: t('inventory.lowStock'),
      ...STOCK_STATUS_STYLES.lowStock
    };
  } else if (quantity <= 50) {
    return {
      status: 'mediumStock',
      label: t('inventory.mediumStock'), 
      ...STOCK_STATUS_STYLES.mediumStock
    };
  } else {
    return {
      status: 'highStock',
      label: t('inventory.highStock'),
      ...STOCK_STATUS_STYLES.highStock
    };
  }
};
```

### 4. 统一显示组件
```typescript
/**
 * 库存显示组件
 * @param {Object} props - 组件属性
 */
const InventoryDisplay: React.FC<{
  inventory: InventoryData[];
  productId: string | number;
  productType: 'machine' | 'consumable' | 'spare_part' | 'accessory';
  className?: string;
}> = ({ inventory, productId, productType, className = '' }) => {
  const { t } = useTranslation();
  const permissions = useInventoryPermissions();
  const filteredInventory = filterInventoryByPermission(inventory, permissions);
  
  // 无权限时不显示
  if (!permissions.canViewInventory) {
    return null;
  }
  
  // 无库存数据时的显示
  if (!filteredInventory || filteredInventory.length === 0) {
    return (
      <div className={`inventory-display ${className}`}>
        <div className="inventory-title">
          {t('inventory.title')}:
        </div>
        <Tag color="red" className="inventory-tag">
          {t('inventory.noData')}
        </Tag>
      </div>
    );
  }
  
  return (
    <div className={`inventory-display ${className}`}>
      <div className="inventory-title">
        {t('inventory.title')}:
      </div>
      <div className="inventory-tags">
        {filteredInventory.map((inv, index) => {
          const stockStatus = getStockStatusWithI18n(inv.quantity || inv.amount || 0, t);
          const regionName = REGIONS[inv.region]?.nameCn || inv.region;
          
          return (
            <Tag 
              key={`${productType}-${productId}-inventory-${inv.region}-${index}`}
              color={stockStatus.colorClass}
              className={`inventory-tag ${stockStatus.textClass} ${stockStatus.bgClass}`}
              icon={stockStatus.icon}
            >
              {regionName}: {inv.quantity || inv.amount || 0}
            </Tag>
          );
        })}
      </div>
    </div>
  );
};
```

## 🌐 多语言配置标准

### 中文翻译文件 (zh/common.json)
```json
{
  "inventory": {
    "title": "库存",
    "outOfStock": "缺货", 
    "lowStock": "库存偏低",
    "mediumStock": "库存适中",
    "highStock": "库存充足",
    "noData": "无库存信息",
    "status": "库存状态",
    "total": "总库存",
    "available": "可用库存",
    "reserved": "预留库存",
    "lastUpdated": "最后更新",
    "refreshing": "刷新中...",
    "error": "库存数据加载失败"
  },
  "regions": {
    "CN": "中国",
    "US": "美国", 
    "EU": "欧洲",
    "APAC": "亚太",
    "NA": "北美"
  }
}
```

### 英文翻译文件 (en/common.json)
```json
{
  "inventory": {
    "title": "Inventory",
    "outOfStock": "Out of Stock",
    "lowStock": "Low Stock", 
    "mediumStock": "Medium Stock",
    "highStock": "In Stock",
    "noData": "No inventory data",
    "status": "Stock Status",
    "total": "Total Stock",
    "available": "Available Stock",
    "reserved": "Reserved Stock",
    "lastUpdated": "Last Updated",
    "refreshing": "Refreshing...",
    "error": "Failed to load inventory data"
  },
  "regions": {
    "CN": "China",
    "US": "United States", 
    "EU": "Europe",
    "APAC": "Asia Pacific",
    "NA": "North America"
  }
}
```

## 🎯 页面应用标准

### 1. 主机页面应用
```typescript
// 在主机列表中添加库存显示
const renderMachineInventory = (machine: Machine) => (
  <InventoryDisplay 
    inventory={machine.inventory || []}
    productId={machine.id}
    productType="machine"
    className="machine-inventory"
  />
);
```

### 2. 耗材页面应用
```typescript
// 在耗材列表中添加库存显示
const renderConsumableInventory = (consumable: Consumable) => (
  <InventoryDisplay 
    inventory={consumable.inventory || []}
    productId={consumable.id}
    productType="consumable"
    className="consumable-inventory"
  />
);
```

### 3. 备件页面应用
```typescript
// 在备件列表中添加库存显示
const renderSparePartInventory = (sparePart: SparePart) => (
  <InventoryDisplay 
    inventory={sparePart.inventory || []}
    productId={sparePart.id}
    productType="spare_part"
    className="spare-part-inventory"
  />
);
```

### 4. 配件显示应用
```typescript
// 在配件详情中添加库存显示
const renderAccessoryInventory = (accessory: MachineAccessory) => {
  const accessoryInventory = accessory.parts?.[0]?.inventory || [];
  
  return (
    <InventoryDisplay 
      inventory={accessoryInventory}
      productId={accessory.id}
      productType="accessory"
      className="accessory-inventory"
    />
  );
};
```

## 🎨 样式标准

### CSS类名规范
```scss
// 库存显示容器
.inventory-display {
  margin-bottom: 1rem;
  
  .inventory-title {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-label);
    margin-bottom: 0.5rem;
  }
  
  .inventory-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .inventory-tag {
    font-size: 0.75rem;
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    
    &.text-red-600 {
      color: #dc2626;
      background-color: #fef2f2;
      border-color: #fecaca;
    }
    
    &.text-orange-600 {
      color: #ea580c;
      background-color: #fff7ed;
      border-color: #fed7aa;
    }
    
    &.text-yellow-600 {
      color: #d97706;
      background-color: #fffbeb;
      border-color: #fde68a;
    }
    
    &.text-green-600 {
      color: #16a34a;
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }
  }
}

// 页面特定样式
.machine-inventory { 
  /* 主机页面特定样式 */ 
}
.consumable-inventory { 
  /* 耗材页面特定样式 */ 
}
.spare-part-inventory { 
  /* 备件页面特定样式 */ 
}
.accessory-inventory { 
  /* 配件页面特定样式 */ 
}
```

## ✅ 实施检查清单

### Phase 1: 基础设施 (必须完成)
- [ ] 创建 `useInventoryPermissions` Hook
- [ ] 实现 `filterInventoryByPermission` 函数
- [ ] 完成 `getStockStatusWithI18n` 函数
- [ ] 创建 `InventoryDisplay` 通用组件
- [ ] 添加CSS样式文件

### Phase 2: 多语言支持 (必须完成)
- [ ] 更新中文翻译文件 (`zh/common.json`)
- [ ] 更新英文翻译文件 (`en/common.json`)
- [ ] 验证翻译键的完整性
- [ ] 测试语言切换功能

### Phase 3: 页面集成 (逐步完成)
- [ ] 主机页面集成库存显示
- [ ] 耗材页面集成库存显示
- [ ] 备件页面集成库存显示
- [ ] 配件区域集成库存显示

### Phase 4: 权限测试 (必须验证)
- [ ] Admin用户测试 - 验证全区域库存显示
- [ ] Sales用户测试 - 验证全区域库存显示
- [ ] Partner用户测试 - 验证区域限制
- [ ] Customer用户测试 - 验证库存隐藏

### Phase 5: 用户体验优化 (推荐完成)
- [ ] 库存数据加载状态
- [ ] 库存数据错误处理
- [ ] 库存刷新功能
- [ ] 响应式设计适配

## 🚨 常见问题和解决方案

### Q1: 用户角色判断不准确
**解决方案**: 确保用户认证信息正确，检查 `user.role` 字段的大小写一致性

### Q2: 区域库存过滤失效
**解决方案**: 验证 `user.region` 和库存数据中的 `region` 字段格式一致

### Q3: 多语言切换后库存状态未更新
**解决方案**: 确保组件正确监听语言变化，重新计算状态标签

### Q4: 库存数据格式不统一
**解决方案**: 统一数据接口，确保所有产品类型使用相同的库存数据结构

## 📊 性能优化建议

1. **数据缓存**: 使用 React Query 或 SWR 缓存库存数据
2. **权限缓存**: 缓存用户权限配置，避免重复计算
3. **懒加载**: 在用户展开详情时才加载库存数据
4. **批量查询**: 合并多个产品的库存查询请求

## 🔄 维护和更新

### 定期检查项目
- 权限规则是否需要调整
- 翻译文本是否需要优化
- 库存阈值是否需要调整
- 新增产品类型的适配

### 版本控制
- 记录每次权限规则变更
- 文档化库存显示逻辑变更
- 保持多语言文件同步更新

---

**文档版本**: v1.0
**创建时间**: 2024-12-10
**最后更新**: 2024-12-10
**适用范围**: 主机页面、耗材页面、备件页面、配件显示 