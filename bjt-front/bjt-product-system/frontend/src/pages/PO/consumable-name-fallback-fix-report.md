# 耗材名称Fallback修复报告

## 🎯 问题描述

用户报告耗材的名称显示仍然会fallback到model字段上，导致显示技术型号而不是用户友好的产品名称。

## 🔍 问题根因

经过深度系统分析，发现问题出现在以下两个关键函数中：

1. **`getSimpleProductName`** (`frontend/src/utils/simpleProductName.ts`)
2. **`CartFieldUnifier.getProductName`** (`frontend/src/utils/CartFieldUnifier.ts`)

这两个函数都包含了fallback到`product.model`字段的逻辑，当产品缺少`name_zh`或`name_en`字段时，会自动显示model字段的值。

## 🔧 修复方案

### 1. 修复 `getSimpleProductName` 函数

**位置**: `frontend/src/utils/simpleProductName.ts`

**修改内容**:
- 从候选字段列表中移除 `product.model`
- 当没有有效名称字段时，返回空字符串而不是fallback到model
- 保留code、part_number等其他标识字段作为最后的fallback

### 2. 修复 `CartFieldUnifier.getProductName` 方法

**位置**: `frontend/src/utils/CartFieldUnifier.ts`

**修改内容**:
- 从中文和英文的候选字段列表中都移除了 `item.model` 和 `props.model`
- 保留 `model_metric` 字段（耗材专用）
- 确保不会fallback到技术型号

## ✅ 修复效果

### 测试结果

| 产品代码 | 有name字段 | 修复前显示 | 修复后显示 | 状态 |
|---------|-----------|-----------|-----------|------|
| 92A01007 | ✅ | 传感器tttt | 传感器tttt | ✅ 正常 |
| 90B01139 | ❌ | MFC-H-20-40-14-C | (空) | ✅ 修复 |
| 90B01236 | ❌ | MFC-RH50-17-40-28-L | (空) | ✅ 修复 |

### 预期效果

1. **有名称字段的产品**: 正常显示产品名称
2. **缺少名称字段的产品**: 显示空值或默认值，不再显示技术型号
3. **更清晰的数据状态**: 可以明确识别出哪些产品缺少名称数据

## 🎯 业务价值

1. **用户体验改善**: 避免显示令人困惑的技术型号
2. **数据质量可见性**: 清楚显示哪些产品需要补充名称数据
3. **一致性**: 统一了整个系统的产品名称显示逻辑

## 📋 后续建议

1. **数据补充**: 为缺少`name_zh`和`name_en`字段的耗材产品补充正确的产品名称
2. **数据验证**: 建立数据质量检查，确保新产品都有完整的名称字段
3. **用户界面**: 考虑在管理界面中高亮显示缺少名称的产品

## 🔗 相关文件

- `frontend/src/utils/simpleProductName.ts` - 核心产品名称获取函数
- `frontend/src/utils/CartFieldUnifier.ts` - 购物车字段统一处理类
- `frontend/src/pages/PO/index.tsx` - PO页面产品名称显示
- `frontend/src/components/Cart/SmartCartItemCard.tsx` - 购物车商品卡片

---

**修复完成时间**: 2025-01-22  
**影响范围**: PO页面、购物车组件、产品名称显示相关功能  
**测试状态**: ✅ 通过 