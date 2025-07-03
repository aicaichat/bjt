# 单箱数量为0产品显示问题分析与解决方案

## 问题描述

**现象**：线上环境显示 `pcs_per_box` 为0的产品字段，而线下环境不显示，造成环境行为不一致。

**影响**：用户在不同环境下看到的产品信息不同，可能造成困惑。

## 根本原因分析

### 1. 环境配置差异
```bash
# 生产环境 (frontend/env.production)
VITE_USE_STANDARDIZED_FIELDS=true      ✅
VITE_ENABLE_STANDARD_FIELDS=true       ✅

# 开发环境 (frontend/env.development) - 修复前
# 缺少上述配置                          ❌

# 本地环境 (.env.local) - 修复前  
VITE_ENABLE_STANDARD_FIELDS=false      ❌
VITE_USE_STANDARDIZED_FIELDS=false     ❌
```

### 2. 代码逻辑分析

**正确的隐藏逻辑已存在**：
```typescript
// frontend/src/hooks/useConsumableFieldDisplay.ts (行 233-237)
if (fieldKey === 'pcs_per_box') {
  const value = item[fieldKey];
  return value !== null && value !== undefined && value !== '' && Number(value) > 0;
}
```

**问题**：此逻辑只在启用标准化字段显示时生效。

### 3. 组件渲染差异

```typescript
// frontend/src/pages/Consumables/index.tsx (行 2950)
const useStandardizedFields = import.meta.env.VITE_USE_STANDARDIZED_FIELDS === 'true' || true;

if (useStandardizedFields) {
  // 使用 StandardConsumableItem - 包含正确的隐藏逻辑
  return <MemoConsumableItem ... />;
} else {
  // 使用旧版组件 - 可能缺少隐藏逻辑
  return <div>旧版产品显示</div>;
}
```

## 解决方案

### 1. 统一环境配置

**修复后的配置**：
```bash
# 所有环境统一启用标准化字段
VITE_USE_STANDARDIZED_FIELDS=true
VITE_ENABLE_STANDARD_FIELDS=true
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_ENABLE_MULTILANG=true
VITE_ENABLE_SMART_UNIT_SYSTEM=true
```

### 2. 配置文件更新

- ✅ **frontend/env.development**：添加缺少的功能开关
- ✅ **frontend/.env.local**：创建统一的本地配置（最高优先级）
- ✅ **frontend/env.production**：验证配置正确

### 3. 验证机制

**自动验证脚本**：`verify-pcs-per-box-fix.js`
- 检查环境变量配置
- 扫描页面产品显示
- 统计零值产品显示情况

## 修复效果验证

### 配置优先级（Vite环境变量加载顺序）
1. `.env.local` （最高优先级）
2. `.env.development` / `.env.production`
3. `.env`
4. 默认值

### 预期行为
- ✅ `pcs_per_box > 0`：正常显示字段和数值
- ✅ `pcs_per_box = 0`：不显示该字段（整行隐藏）
- ✅ `pcs_per_box = null/undefined`：不显示该字段

### 验证步骤
1. 重启开发服务器：`cd frontend && npm run dev`
2. 访问耗材页面：`http://localhost:5173/consumables`
3. 检查产品卡片中的 "Qty per Carton" 字段显示
4. 在浏览器控制台运行验证脚本

## 技术细节

### shouldShowField 函数逻辑
```typescript
const shouldShowField = (item: any, fieldKey: string): boolean => {
  // 条件显示规则检查
  const conditionalConfig = CONSUMABLE_DISPLAY_CONFIG.CONDITIONAL_FIELDS[fieldKey];
  if (conditionalConfig && !conditionalConfig.condition(item)) {
    return false;
  }
  
  // pcs_per_box 特殊处理：0值视为null，不显示
  if (fieldKey === 'pcs_per_box') {
    const value = item[fieldKey];
    return value !== null && value !== undefined && value !== '' && Number(value) > 0;
  }
  
  // 其他字段：有值则显示
  const value = getLocalizedValue(item, fieldKey);
  return value !== '';
};
```

### 标准化组件使用
```typescript
// 确保使用包含修复逻辑的标准化组件
{fieldsToDisplay.includes('pcs_per_box') && shouldShowField(item, 'pcs_per_box') && (
  <div className="spec-badge">
    <div className="spec-label">{getFieldLabel('pcs_per_box')}</div>
    <div className="spec-value">{getLocalizedValue(item, 'pcs_per_box')}</div>
  </div>
)}
```

## 测试案例

### 测试数据示例
```javascript
// 应该显示 pcs_per_box 字段
const product1 = { pcs_per_box: 50 };    // ✅ 显示 "50"
const product2 = { pcs_per_box: 1 };     // ✅ 显示 "1"

// 不应该显示 pcs_per_box 字段  
const product3 = { pcs_per_box: 0 };     // ❌ 隐藏字段
const product4 = { pcs_per_box: null };  // ❌ 隐藏字段
const product5 = { pcs_per_box: '' };    // ❌ 隐藏字段
```

### 浏览器控制台验证命令
```javascript
// 检查环境变量
console.log('VITE_USE_STANDARDIZED_FIELDS:', import.meta.env.VITE_USE_STANDARDIZED_FIELDS);

// 检查页面产品
document.querySelectorAll('.spec-badge').forEach(badge => {
  const label = badge.querySelector('.spec-label')?.textContent;
  const value = badge.querySelector('.spec-value')?.textContent;
  if (label?.includes('Qty') || label?.includes('单箱')) {
    console.log('发现数量字段:', { label, value });
  }
});
```

## 回滚方案

如需回滚到修复前状态：
```bash
# 删除统一配置
rm frontend/.env.local

# 恢复开发环境配置
git checkout frontend/env.development
```

## 注意事项

1. **此修复只影响字段显示**：产品本身仍然存在，只是隐藏了 `pcs_per_box` 字段
2. **不影响数据完整性**：后端数据保持不变
3. **向后兼容**：旧版组件仍可正常工作
4. **环境一致性**：确保所有环境行为统一

## 后续优化建议

1. **考虑产品级隐藏**：如果 `pcs_per_box` 为0表示产品不可用，可考虑完全隐藏产品
2. **添加数据验证**：在后端添加数据完整性检查
3. **用户体验优化**：为缺少包装信息的产品添加特殊标识
4. **监控告警**：添加对异常数据的监控和告警机制 