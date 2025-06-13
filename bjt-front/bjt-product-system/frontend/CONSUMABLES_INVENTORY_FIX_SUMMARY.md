# 耗材页面库存显示修复总结

## 🎯 问题描述

用户反馈：**库存信息的显示和用户的角色有很大关系，只有admin和sales才显示库存**

## 🔍 问题分析

通过对比机器页面和耗材页面的代码，发现：

### 机器页面（正确实现）
```typescript
// 在机器页面中，库存显示有权限控制
const isSales = user && (user.role === 'admin' || user.role === 'sales');

// 库存信息只对admin和sales角色显示
{isSales && (
  <div className="mb-4">
    <div className="font-medium text-sm text-gray-600 mb-2">
      {t('tableHeaders.stock')}:
    </div>
    <div className="flex flex-wrap gap-1">
      {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
        const stockStatus = getStockStatus(getRegionInventory(machine, regionKey.toString()));
        return (
          <Tag 
            key={`${machine.id}-inventory-${regionKey}`}
            color={stockStatus.color}
            className="text-xs"
          >
            {REGIONS[regionKey].nameCn}: {getRegionInventory(machine, regionKey.toString())}
          </Tag>
        );
      })}
    </div>
  </div>
)}
```

### 耗材页面（问题实现）
```typescript
// 耗材页面缺少权限控制，所有用户都能看到库存
<div className="stock-info">
  <span className="stock-label">库存状态</span>
  <span className="stock-status-text">✓ 充足</span>
</div>
```

## 🛠️ 修复方案

### 1. 权限控制修复 ✅
**问题**：所有用户都能看到库存信息
**修复**：添加 `{isSales && (` 权限控制，只有admin和sales角色才能看到库存

#### 修复代码
```typescript
// 在耗材页面组件中添加权限判断
const isSales = user && (user.role === 'admin' || user.role === 'sales');

// 在库存显示区域添加权限控制
{isSales && (
  <div className="stock-info">
    <div className="stock-header">
      <span className="stock-label">{String(t('ui.stockStatus') || '库存状态')}</span>
      <span className="stock-status-text">
        {stockStatus === 'high' ? String(t('ui.sufficient') || '✓ 充足') : 
         stockStatus === 'low' ? String(t('ui.lowWarning') || '⚠ 紧张') : 
         String(t('ui.outIcon') || '✗ 缺货')}
      </span>
    </div>
    <div className="stock-details">
      <div className="total-stock">
        {String(t('ui.totalStock') || '总库存')}: <span className="stock-number">{totalStock}</span>
      </div>
      <div className="region-stock">
        {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
          const regionStock = getRegionInventory(item, regionKey.toString());
          const stockStatus = getStockStatus(regionStock);
          return (
            <span 
              key={`${item.id}-inventory-${regionKey}`}
              className={`region-tag ${stockStatus.color}`}
            >
              {i18n.language.startsWith('zh') ? REGIONS[regionKey].nameCn : REGIONS[regionKey].nameEn}: {regionStock}
            </span>
          );
        })}
      </div>
    </div>
  </div>
)}
```

### 2. 数据结构兼容性修复 ✅
**问题**：`product.inventory?.find is not a function` 错误
**原因**：`TEMP_INVENTORY_MOCK` 使用对象格式，但代码假设是数组格式

#### 修复代码
```typescript
const getRegionInventory = (product: ConsumableProduct, region: string): number => {
  // 首先尝试从真实库存数据获取
  if (product.inventory) {
    // 检查inventory是否为数组格式
    if (Array.isArray(product.inventory)) {
      const regionInventory = product.inventory.find(inv => inv.region === region);
      if (regionInventory && regionInventory.quantity > 0) {
        return regionInventory.quantity;
      }
    } else if (typeof product.inventory === 'object') {
      // 如果inventory是对象格式，直接获取区域库存
      const regionStock = product.inventory[region.toLowerCase()];
      if (regionStock && parseInt(String(regionStock)) > 0) {
        return parseInt(String(regionStock));
      }
    }
  }
  
  // 如果没有真实数据，使用临时Mock数据
  const mockInventory = TEMP_INVENTORY_MOCK[product.id] || {};
  return parseInt(String(mockInventory[region.toLowerCase()])) || 0;
};
```

### 3. 库存显示多语言支持修复 ✅
**问题**：库存区域名称硬编码为中文
**修复**：根据当前语言显示对应的区域名称

#### 修复代码
```typescript
// 修复前：硬编码中文
{REGIONS[regionKey].nameCn}: {regionStock}

// 修复后：支持多语言
{i18n.language.startsWith('zh') ? REGIONS[regionKey].nameCn : REGIONS[regionKey].nameEn}: {regionStock}
```

### 4. 材料字段多语言支持修复 ✅
**问题**：材料显示的是code值（如"HDPE"、"50% HDPE"），而不是根据语言显示对应的中英文名称
**原因**：`getLocalizedValue`函数对于材料字段没有特殊处理，直接返回`item.material`的值

#### 修复代码
```typescript
// 在useConsumableFieldDisplay.ts中添加材料字段的多语言处理
if (fieldKey === 'material') {
  const materialCode = item.material;
  if (!materialCode || !materialsData) {
    return materialCode ? String(materialCode) : '';
  }
  
  // 根据材料code查找对应的材料数据
  const materialInfo = materialsData.find((material: any) => 
    material.code === materialCode || material.id === materialCode
  );
  
  if (materialInfo) {
    // 根据当前语言返回对应的名称
    if (i18n.language.startsWith('zh')) {
      return materialInfo.name_zh || materialInfo.name_en || materialCode;
    } else {
      return materialInfo.name_en || materialInfo.name_zh || materialCode;
    }
  }
  
  // 如果没找到材料信息，返回原始code
  return String(materialCode);
}
```

#### 材料数据结构
```typescript
// wp_bjt_materials 表结构
{
  id: 1,
  code: '30% HDPE',           // 材料代码
  name_zh: '30%回料HDPE',     // 中文名称
  name_en: '30%Recycled HDPE', // 英文名称
  status: 'publish'
}
```

## ✅ 修复效果

### 权限控制
- ✅ **admin角色**：可以看到库存信息
- ✅ **sales角色**：可以看到库存信息  
- ❌ **其他角色**：无法看到库存信息（普通用户、客户等）
- ❌ **未登录用户**：无法看到库存信息

### 多语言支持
- ✅ **中文环境**：显示"中国: 150", "美国: 80", "欧洲: 120", "澳洲: 60"
- ✅ **英文环境**：显示"China: 150", "United States: 80", "Europe: 120", "Australia: 60"
- ✅ **材料中文**：显示"30%回料HDPE", "50%回料LDPE", "HDPE", "LDPE"
- ✅ **材料英文**：显示"30%Recycled HDPE", "50%Recycled LDPE", "HDPE", "LDPE"

### 数据兼容性
- ✅ **数组格式库存**：正确处理 `[{region: 'cn', quantity: 150}]`
- ✅ **对象格式库存**：正确处理 `{cn: 150, us: 80, eu: 120, au: 60}`
- ✅ **Mock数据回退**：当真实数据不存在时使用Mock数据

## 🔧 技术实现

### 修改文件
1. **frontend/src/pages/Consumables/index.tsx**
   - 添加 `isSales` 权限控制变量
   - 在库存显示区域添加权限检查
   - 修复 `getRegionInventory` 函数的数据兼容性
   - 添加库存区域名称的多语言支持

2. **frontend/src/hooks/useConsumableFieldDisplay.ts**
   - 添加 `useMaterials` hook导入
   - 在 `getLocalizedValue` 函数中添加材料字段的多语言处理逻辑
   - 根据材料code查找对应的name_zh/name_en

### 接口更新
```typescript
interface StandardConsumableItemProps {
  // ... 其他属性
  isSales: boolean; // 新增：权限控制
}
```

## 🎯 总结

通过这次修复，耗材页面的库存显示功能现在：

1. **权限控制完善** - 与机器页面保持一致，只有销售权限用户才能看到库存
2. **多语言支持完整** - 库存区域名称和材料名称都支持中英文切换
3. **数据兼容性强** - 同时支持数组和对象两种库存数据格式
4. **用户体验优化** - 根据用户角色和语言偏好显示相应内容

现在耗材页面的库存显示已经与机器页面保持完全一致的功能和体验！🛒✨ 