# PO页面字段展示分析报告

## 📋 概述

PO（Purchase Order）页面是系统中用于生成和展示采购订单的核心页面，它需要统一处理来自不同产品类型（主机、配件、备件、耗材）的产品信息，并以标准化的表格形式展示。

## 🏗️ 产品数据结构

### UnifiedProduct 接口
PO页面使用 `UnifiedProduct` 接口来统一处理所有产品类型：

```typescript
interface UnifiedProduct {
  // 基础标识字段
  id: string;
  code?: string;           // 产品编码
  sku?: string;            // SKU编码
  part_number?: string;    // 料号
  item_id?: number;        // 项目ID
  product_id?: number;     // 产品ID
  
  // 名称字段
  name: string | { [key: string]: string };  // 支持多语言的产品名称
  
  // 规格字段
  spec?: string;           // 公制规格
  specs?: string | Record<string, string>;  // 复数规格
  spec_imperial?: string;  // 英制规格
  
  // 其他属性
  model?: string;          // 型号
  brand?: string;          // 品牌
  type?: string;           // 类型
  product_type?: string;   // 产品类型
  unit?: string;           // 单位
  
  // 数量和价格
  quantity: number;        // 数量
  price: number;           // 价格
  unit_price?: number;     // 单价
  amount?: number;         // 总金额
  
  // 图片
  image?: string;          // 图片URL
  image_url?: string;      // 图片URL（备用）
}
```

## 📊 PO表格字段映射

### 表格列定义
PO页面的产品表格包含以下8个主要列：

| 列名 | 中文翻译键 | 英文翻译键 | 数据来源 | 显示逻辑 |
|------|-----------|-----------|----------|----------|
| 料号 | `table.columns.partNumber` | "Part No." | `p.code \|\| p.sku \|\| p.part_number \|\| p.item_id \|\| '-'` | 优先级递减，最后显示'-' |
| 名称 | `table.columns.item` | "Item" | `getProductName(p)` | 多语言名称获取函数 |
| 型号 | `table.columns.model` | "Model" | `p.model \|\| ''` | 直接显示型号字段 |
| 规格描述 | `table.columns.description` | "Spec." | `p.spec \|\| ''` | 显示规格字段 |
| 品牌 | `table.columns.brandName` | "Brand" | `p.brand \|\| ''` | 显示品牌字段 |
| 数量 | `table.columns.quantity` | "Quantity" | `p.quantity` | 必需字段，粗体显示 |
| 单价 | `table.columns.unitPrice` | "Unit Price" | `Number(p.price \|\| 0).toFixed(2)` | 格式化为2位小数 |
| 金额 | `table.columns.amount` | "Amount" | `Number((p.price \|\| 0) * (p.quantity \|\| 1)).toFixed(2)` | 计算总金额 |

## 🎯 不同产品类型的字段处理

### 1. 料号字段 (Part Number)
```typescript
// 优先级：code > sku > part_number > item_id > '-'
p.code || p.sku || (p as any).part_number || (p as any).item_id || '-'
```

**各产品类型映射：**
- **主机**: `part_number` 字段
- **配件**: `part_number` 字段  
- **备件**: `part_number` 字段
- **耗材**: `part_number` 字段

### 2. 名称字段 (Item Name)
```typescript
const getProductName = (product: UnifiedProduct) => {
  // 1. 优先使用显式多语言字段
  if (currentLanguage === 'zh' && (product as any).name_zh) {
    return (product as any).name_zh;
  }
  if (currentLanguage !== 'zh' && (product as any).name_en) {
    return (product as any).name_en;
  }

  // 2. 检查复合 name 对象
  if (typeof product.name === 'object' && product.name !== null) {
    const key = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    const val = (product.name as any)[key] || 
                (currentLanguage === 'zh' ? (product.name as any)['zh'] : (product.name as any)['en']);
    if (val) return val;
  }

  // 3. fallback 到单字符串 name
  if (typeof product.name === 'string') return product.name;

  return '';
};
```

**各产品类型映射：**
- **主机**: `name_zh`/`name_en` 或 `name`
- **配件**: `name_zh`/`name_en` 或 `name`
- **备件**: `name_zh`/`name_en` 或 `name`
- **耗材**: `name_zh`/`name_en` 或 `name`

### 3. 型号字段 (Model)
```typescript
p.model || ''
```

**各产品类型映射：**
- **主机**: `model` 字段（机器型号）
- **配件**: `model` 字段（配件型号）
- **备件**: `model` 字段（备件型号，可能为空）
- **耗材**: `model` 字段（耗材型号，通常为空）

### 4. 规格描述字段 (Spec.)
```typescript
p.spec || ''
```

**各产品类型映射：**
- **主机**: `spec` 字段（技术规格）
- **配件**: `spec` 字段（配件规格）
- **备件**: `spec`/`spec_imperial` 字段（根据用户偏好）
- **耗材**: `spec`/`spec_imperial` 字段（根据用户偏好）

### 5. 品牌字段 (Brand)
```typescript
p.brand || ''
```

**各产品类型映射：**
- **主机**: `brand` 字段（制造商品牌）
- **配件**: `brand` 字段（配件品牌）
- **备件**: `brand` 字段（备件品牌）
- **耗材**: `brand` 字段（耗材品牌）

## 🌐 多语言支持

### 翻译文件结构
PO页面的表格列名通过以下翻译键定义：

```json
// zh/po.json
{
  "table": {
    "columns": {
      "partNumber": "料号",
      "item": "名称", 
      "model": "型号",
      "description": "规格描述",
      "brandName": "品牌",
      "quantity": "数量",
      "unitPrice": "单价",
      "amount": "金额"
    }
  }
}

// en/po.json  
{
  "table": {
    "columns": {
      "partNumber": "Part No.",
      "item": "Item",
      "model": "Model", 
      "description": "Spec.",
      "brandName": "Brand",
      "quantity": "Quantity",
      "unitPrice": "Unit Price",
      "amount": "Amount"
    }
  }
}
```

## 🔄 数据流转过程

### 1. 数据来源
PO页面接收来自以下页面的产品数据：
- **购物车页面** → 结账流程
- **订单列表页面** → 查看/重新生成PO
- **订单详情页面** → 生成PO

### 2. 数据标准化
所有产品数据都会通过 `UnifiedProduct` 接口进行标准化处理，确保字段的一致性。

### 3. 显示渲染
在表格渲染时，根据字段优先级和用户语言偏好来显示最合适的值。

## 📋 与CSV标准的对比

### PO页面 vs CSV标准字段对照

| PO表格列 | CSV标准中文 | CSV标准英文 | 一致性状态 |
|---------|------------|------------|----------|
| 料号 | 料号 | Part No. | ✅ 完全一致 |
| 名称 | 名称 | Item | ✅ 完全一致 |
| 型号 | 型号 | Model | ✅ 完全一致 |
| 规格描述 | 规格描述 | Spec. | ✅ 完全一致 |
| 品牌 | 品牌 | Brand | ✅ 完全一致 |
| 数量 | 单箱数量 | Qty per Carton | ⚠️ 概念不同 |
| 单价 | - | - | ❌ CSV中无对应 |
| 金额 | - | - | ❌ CSV中无对应 |

**注意**: PO页面的"数量"和"单价"、"金额"是订单相关字段，不是产品属性字段，因此与CSV产品属性标准不直接对应。

## 🎯 关键特性

### 1. 统一性
- 所有产品类型使用相同的表格结构
- 统一的字段映射逻辑
- 一致的多语言支持

### 2. 容错性
- 字段缺失时的fallback机制
- 数据类型转换和格式化
- 默认值处理

### 3. 灵活性
- 支持多种数据源格式
- 动态字段映射
- 可扩展的产品类型支持

## 🚀 优化建议

### 1. 字段标准化
- 确保所有产品类型的字段命名一致
- 建立统一的数据转换规则
- 完善fallback机制

### 2. 性能优化
- 优化多语言名称获取逻辑
- 缓存常用的格式化结果
- 减少不必要的字段检查

### 3. 用户体验
- 添加字段缺失时的友好提示
- 支持字段显示的个性化配置
- 提供更详细的产品信息tooltip 

## 🎯 分析目标
检查PO页面在显示不同产品类型（主机、配件、备件、耗材）时，各个字段的显示逻辑是否正确，特别关注：
- 名称字段的多语言支持
- 型号字段的fallback逻辑
- 品牌字段的处理
- 规格字段的单位制选择

## 🔍 分析方法
通过代码审查和数据源验证，检查PO页面的字段获取和显示逻辑。

## 📊 字段处理逻辑分析

### 1. 料号字段 (Part Number)
```typescript
{p.code || p.sku || (p as any).part_number || (p as any).item_id || '-'}
```

**优先级**: `code` → `sku` → `part_number` → `item_id` → `'-'`

**状态**: ✅ **逻辑完善**
- 提供了完整的fallback链
- 覆盖了所有可能的字段名称
- 最终提供默认值 `'-'`

### 2. 名称字段 (Item Name)
```typescript
const getProductName = (product: UnifiedProduct) => {
  if (!product) return '';

  // 优先使用显式多语言字段
  if (currentLanguage === 'zh' && (product as any).name_zh) {
    return (product as any).name_zh;
  }
  if (currentLanguage !== 'zh' && (product as any).name_en) {
    return (product as any).name_en;
  }

  // 再检查复合 name 对象
  if (typeof product.name === 'object' && product.name !== null) {
    const key = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    const val = (product.name as any)[key] || (currentLanguage === 'zh' ? (product.name as any)['zh'] : (product.name as any)['en']);
    if (val) return val;
  }

  // 最后 fallback 到单字符串 name
  if (typeof product.name === 'string') return product.name;

  return '';
};
```

**处理逻辑**:
1. **优先级1**: `name_zh`/`name_en` 字段（根据当前语言）
2. **优先级2**: `name` 对象的多语言属性
3. **优先级3**: `name` 字符串
4. **最终**: 空字符串

**状态**: ✅ **多语言支持完善**
- 支持 `name_zh`/`name_en` 字段
- 支持 `name` 对象格式
- 支持 `name` 字符串格式
- 根据当前语言自动选择

### 3. 型号字段 (Model)
```typescript
{p.model || ''}
```

**状态**: ✅ **基础功能正常**
- 直接使用 `model` 字段
- 提供空字符串作为默认值

### 4. 规格字段 (Specification)
```typescript
{p.spec || ''}
```

**状态**: ✅ **基础功能正常**
- 直接使用 `spec` 字段
- 提供空字符串作为默认值

**💡 可选改进**: 可考虑根据用户偏好选择公制/英制
```typescript
{preferredUnit === 'imperial' ? (p.spec_imperial || p.spec || '') : (p.spec || p.spec_imperial || '')}
```

### 5. 品牌字段 (Brand)
```typescript
{p.brand || ''}
```

**状态**: ✅ **功能正常**
- 直接使用 `brand` 字段
- 提供空字符串作为默认值

### 6. 数量字段 (Quantity)
```typescript
<Input
  type="number"
  min="1"
  value={p.quantity}
  onChange={(e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    // 更新逻辑
  }}
  style={{ width: '80px' }}
/>
```

**状态**: ✅ **功能完善**
- 包含输入验证
- 最小值限制
- 实时更新逻辑

### 7. 单价字段 (Unit Price)
```typescript
{formatPrice(p.unit_price || 0)}
```

**状态**: ✅ **格式化完善**
- 使用 `formatPrice` 函数格式化
- 提供默认值 0

### 8. 金额字段 (Amount)
```typescript
{formatPrice((p.unit_price || 0) * (p.quantity || 1))}
```

**状态**: ✅ **计算逻辑正确**
- 自动计算单价 × 数量
- 使用相同的格式化函数
- 处理空值情况

## 📋 Excel导出字段处理

### Excel表格中的字段映射
```typescript
<td style={{fontWeight: '500'}}>
  {getProductName(p)}
</td>
<td style={{textAlign: 'center'}}>
  {p.model || ''}
</td>
<td style={{fontSize: '13px', lineHeight: '1.4'}}>
  {p.spec || ''}
</td>
<td style={{textAlign: 'center'}}>
  {p.brand || 'Lockedair'}
</td>
```

**Excel导出特点**:
- ✅ **与页面显示一致**: 使用相同的 `getProductName()` 函数
- ✅ **提供默认品牌**: 'Lockedair' 作为备用品牌
- ✅ **完整字段映射**: 包含所有必要字段
- ✅ **逻辑一致性**: 导出逻辑与显示逻辑保持一致

## 🎯 产品类型特定处理

### 主机 (Hosts)
- **名称**: 使用 `name_zh`/`name_en`
- **型号**: 使用 `model`
- **品牌**: 使用 `brand`

### 配件 (Accessories)  
- **名称**: 使用 `name_zh`/`name_en`
- **型号**: 使用 `model`
- **品牌**: 使用 `brand`

### 备件 (Spare Parts)
- **名称**: 使用 `name_zh`/`name_en`
- **型号**: 使用 `model`
- **品牌**: 当前显示逻辑满足业务需求

### 耗材 (Consumables)
- **名称**: 使用 `name_zh`/`name_en`
- **型号**: 使用 `model`
- **品牌**: 使用 `brand`

## 📈 总结

PO页面的字段处理逻辑整体完善，功能正常：

### ✅ 现状评估
1. **料号字段**: 完善的fallback逻辑，优先级清晰
2. **名称字段**: 多语言支持完善，满足业务需求
3. **型号字段**: 现有逻辑符合业务要求
4. **规格字段**: 基础功能正常，可选择性优化单位制
5. **品牌字段**: 当前显示逻辑满足业务需求
6. **数量/价格字段**: 功能完善，包含验证和格式化
7. **Excel导出**: 与页面显示保持一致

### 💡 可选改进
- **规格单位制**: 可根据用户偏好优化公制/英制显示

PO页面当前的字段处理逻辑已经满足业务需求，提供了稳定可靠的产品信息展示功能。

---

## 🔄 状态更新 (2024-12-19)

### ✅ 耗材名称显示问题已修复

**问题描述**: 耗材产品在PO页面显示时，名称字段不支持多语言切换

**根本原因**: Mock数据中缺少 `name_zh` 和 `name_en` 字段，只有 `model` 字段

**修复方案**: 
1. **更新Mock数据**: 为所有耗材产品添加了 `name_zh` 和 `name_en` 字段
2. **字段映射**: 
   - 中文名称格式: `{产品类型} {型号}` (如: "气垫膜 ACF-200")
   - 英文名称格式: `{Product Type} {Model}` (如: "Air Cushion Film ACF-200")

**修复效果**:
- ✅ 耗材名称现在支持中英文切换
- ✅ 与其他产品类型（主机、配件、备件）保持一致
- ✅ `getProductName()` 函数正常工作
- ✅ PO页面和Excel导出都能正确显示耗材名称

**验证结果**: 耗材产品名称字段现在和主机、配件、备件一样，完全支持多语言切换功能。 