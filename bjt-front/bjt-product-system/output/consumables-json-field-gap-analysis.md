# 耗材页面字段使用情况差异分析报告（基于JSON标准）

生成时间: 2025-06-09T05:00:22.641Z
数据来源: output/all-pages-display-fields.json

## 📋 总体概述

- **前端字段总数**: 122
- **JSON标准字段总数**: 67 (去重后: 47)
- **完全匹配**: 20
- **部分匹配**: 11
- **前端独有**: 91
- **标准未实现**: 40

## 📊 JSON标准字段定义

### 商品列表 (13个字段)

1. **适用机型** → `app_model`
2. **名称(英文)新增需求** → `name_en`
3. **形状** → `shape`
4. **产品图片袋型实物** → `product_image_url`
5. **料号** → `part_number`
6. **型号（公制）** → `model_metric`
7. **型号(英制)** → `model_imperial`
8. **Spec.** → `spec`
9. **Spec.(英制)** → `spec_imperial`
10. **泡径cm** → `bubble_diameter_cm`
11. **泡径inch** → `bubble_diameter_inch`
12. **productId** → `product_id`
13. **单箱数量** → `pcs_per_box`

### 购物车 (12个字段)

1. **适用机型** → `app_model`
2. **名称(英文)新增需求** → `name_en`
3. **产品图片袋型实物** → `product_image_url`
4. **料号** → `part_number`
5. **型号（公制）** → `model_metric`
6. **型号(英制)** → `model_imperial`
7. **Spec.** → `spec`
8. **Spec.(英制)** → `spec_imperial`
9. **泡径cm** → `bubble_diameter_cm`
10. **泡径inch** → `bubble_diameter_inch`
11. **productId** → `product_id`
12. **单箱数量** → `pcs_per_box`

### tooltip (34个字段)

1. **材质** → `material`
2. **厚度/克重um/gsm** → `thickness_um`
3. **厚度/克重mil/#** → `thickness_mil`
4. **膜宽cm** → `width_cm`
5. **膜宽inch** → `width_inch`
6. **袋长cm** → `length_cm`
7. **袋长inch** → `length_inch`
8. **名称(英文)新增需求** → `name_en`
9. **总长m** → `total_length_m`
10. **总长ft** → `total_length_ft`
11. **包装方式** → `package_type`
12. **包装尺寸cm** → `package_size_cm`
13. **包装尺寸inch** → `package_size_inch`
14. **单件净重kg** → `net_weight_kg`
15. **单件净重lbs** → `net_weight_lbs`
16. **包装实物图片** → `package_image_url`
17. **托盘尺寸cm** → `pallet_size_cm`
18. **一托卷数A** 
19. **整托毛重Akg** 
20. **整托毛重Albs** 
21. **打托高度Acm** 
22. **打托高度Ainch** 
23. **一托卷数B** 
24. **整盘毛重kg** 
25. **整盘毛重Blbs** 
26. **打托高度cm** 
27. **打托高度Binch** 
28. **一托卷数C** 
29. **整托毛重kg** 
30. **整托毛重Clbs** 
31. **打托高度Ccm** 
32. **打托高度Cinch** 
33. **纸筒内径cm** 
34. **纸筒内径inch** 

### PO页 (8个字段)

1. **名称(英文)新增需求** → `name_en`
2. **料号** → `part_number`
3. **型号（公制）** → `model_metric`
4. **型号(英制)** → `model_imperial`
5. **Spec.** → `spec`
6. **Spec.(英制)** → `spec_imperial`
7. **品牌** → `brand`
8. **productId** → `product_id`

## 🎯 各场景字段覆盖率

| 场景 | JSON标准字段数 | 已实现 | 缺失 | 覆盖率 | 状态 |
|------|------------|--------|------|---------|------|
| 筛选项 | 7 | 16 | 0 | 100.0% | ✅ 良好 |
| 商品列表 | 13 | 18 | 3 | 76.9% | ⚠️ 一般 |
| 购物车 | 12 | 12 | 3 | 75.0% | ⚠️ 一般 |
| tooltip | 34 | 23 | 20 | 41.2% | ❌ 需要改进 |
| PO页 | 8 | 9 | 1 | 87.5% | ✅ 良好 |

## 📄 筛选项 详细分析

**场景说明**: 页面顶部的筛选控件区域
**JSON标准要求**: 7 个字段

### ✅ 已实现字段

- **Filters.selectedModel** 
- **filterOptions?.shapes?.find(s => s.id === selectedShape** 
- **filter.material** 
- **Filters.selectedSpecs.thickness** 
- **Filters.selectedSpecs.width** 
- **Filters.length** 
- **selectedModel** 
- **selectedShape** 
- **selectedMaterial** 
- **适用机型** (`app_model`)
- **形状** (`shape`)
- **材质** (`material`)
- **厚度/克重** 
- **膜宽** 
- **袋长** 
- **泡径** 

### 💡 修复建议

- 🔍 **筛选控件完整性**: 基于商品列表字段实现相应的筛选功能
- 🎛️ **智能单位制**: 根据用户地区智能显示公制/英制筛选项
- 📊 **筛选逻辑**: 实现前端筛选为主的策略，避免频繁API调用

## 📄 商品列表 详细分析

**场景说明**: 耗材产品列表展示区域
**JSON标准要求**: 13 个字段

### ✅ 已实现字段

- **item.app_model** 
- **item.shape** 
- **item.image_url** 
- **item.part_number** 
- **item.model** 
- **item.spec** 
- **item.bubble_diameter** 
- **product.model** 
- **适用机型** (`app_model`)
- **名称(英文)新增需求** (`name_en`)
- **形状** (`shape`)
- **料号** (`part_number`)
- **型号(英制)** (`model_imperial`)
- **Spec.** (`spec`)
- **Spec.(英制)** (`spec_imperial`)
- **泡径inch** (`bubble_diameter_inch`)
- **productId** (`product_id`)
- **单箱数量** (`pcs_per_box`)

### ❌ 缺失字段

- **产品图片袋型实物** → 需要实现: `product_image_url`
- **型号（公制）** → 需要实现: `model_metric`
- **泡径cm** → 需要实现: `bubble_diameter_cm`

### 💡 修复建议

- 📋 **字段显示**: 按JSON标准实现所有13个必需字段
- 🖼️ **图片显示**: 确保产品图片和包装图片正确显示
- 🏷️ **规格信息**: 智能显示公制/英制规格，避免单位重复

## 📄 购物车 详细分析

**场景说明**: 购物车页面字段显示
**JSON标准要求**: 12 个字段

### ✅ 已实现字段

- **Cart] cartItem.properties:', cartItem.** 
- **cartItem.** 
- **addToCart** 
- **适用机型** (`app_model`)
- **名称(英文)新增需求** (`name_en`)
- **料号** (`part_number`)
- **型号(英制)** (`model_imperial`)
- **Spec.** (`spec`)
- **Spec.(英制)** (`spec_imperial`)
- **泡径inch** (`bubble_diameter_inch`)
- **productId** (`product_id`)
- **单箱数量** (`pcs_per_box`)

### ❌ 缺失字段

- **产品图片袋型实物** → 需要实现: `product_image_url`
- **型号（公制）** → 需要实现: `model_metric`
- **泡径cm** → 需要实现: `bubble_diameter_cm`

### 💡 修复建议

- 🛒 **购物车字段**: 按JSON标准实现所有12个必需字段
- 📦 **数量信息**: 正确显示单箱数量等包装信息
- 🔢 **规格标识**: 确保型号、料号等关键标识完整显示

## 📄 tooltip 详细分析

**场景说明**: 详细信息弹窗显示
**JSON标准要求**: 34 个字段

### ✅ 已实现字段

- **Tooltip** 
- **detailModalVisible, setDetailModal** 
- **Material** 
- **thickness** 
- **width** 
- **length** 
- **package_size** 
- **net_weight_kg', 'unit_weight_kg', 'specs.net_weight** 
- **pallet** 
- **材质** (`material`)
- **膜宽cm** (`width_cm`)
- **膜宽inch** (`width_inch`)
- **袋长cm** (`length_cm`)
- **袋长inch** (`length_inch`)
- **名称(英文)新增需求** (`name_en`)
- **总长m** (`total_length_m`)
- **包装方式** (`package_type`)
- **包装尺寸cm** (`package_size_cm`)
- **包装尺寸inch** (`package_size_inch`)
- **单件净重kg** (`net_weight_kg`)
- **单件净重lbs** (`net_weight_lbs`)
- **包装实物图片** (`package_image_url`)
- **托盘尺寸cm** (`pallet_size_cm`)

### ❌ 缺失字段

- **厚度/克重um/gsm** → 需要实现: `thickness_um`
- **厚度/克重mil/#** → 需要实现: `thickness_mil`
- **总长ft** → 需要实现: `total_length_ft`
- **一托卷数A** 
- **整托毛重Akg** 
- **整托毛重Albs** 
- **打托高度Acm** 
- **打托高度Ainch** 
- **一托卷数B** 
- **整盘毛重kg** 
- **整盘毛重Blbs** 
- **打托高度cm** 
- **打托高度Binch** 
- **一托卷数C** 
- **整托毛重kg** 
- **整托毛重Clbs** 
- **打托高度Ccm** 
- **打托高度Cinch** 
- **纸筒内径cm** 
- **纸筒内径inch** 

### 💡 修复建议

- 📝 **详细信息**: 按JSON标准实现所有34个详细信息字段
- 📏 **托盘配置**: 支持A/B/C三种托盘配置的动态显示
- 🎯 **条件显示**: 根据产品类型条件显示相关字段（如气泡类型显示泡径）

## 📄 PO页 详细分析

**场景说明**: PO页面字段显示
**JSON标准要求**: 8 个字段

### ✅ 已实现字段

- **port { useCart, ExtendedCartItem** 
- **order-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 w-full h-32 flex item** 
- **名称(英文)新增需求** (`name_en`)
- **料号** (`part_number`)
- **型号(英制)** (`model_imperial`)
- **Spec.** (`spec`)
- **Spec.(英制)** (`spec_imperial`)
- **品牌** (`brand`)
- **productId** (`product_id`)

### ❌ 缺失字段

- **型号（公制）** → 需要实现: `model_metric`

### 💡 修复建议

- 📄 **PO字段**: 按JSON标准实现所有8个必需字段
- 🏢 **商务信息**: 确保品牌、规格等商务信息完整显示

## 🔄 字段映射分析

### ✅ 完全匹配字段

| 前端字段 | JSON标准字段 | 英文映射 | 场景 | 匹配类型 |
|----------|-------------|----------|------|----------|
| `Material` | 材质 | `material` | tooltip | exact |
| `Shape` | 形状 | `shape` | 商品列表 | exact |
| `app_model` | 适用机型 | `app_model` | 购物车 | exact |
| `brand` | 品牌 | `brand` | PO页 | exact |
| `lengthCm` | 袋长cm | `length_cm` | tooltip | exact |
| `lengthInch` | 袋长inch | `length_inch` | tooltip | exact |
| `material` | 材质 | `material` | tooltip | exact |
| `net_weight_kg` | 单件净重kg | `net_weight_kg` | tooltip | exact |
| `package_image_url` | 包装实物图片 | `package_image_url` | tooltip | exact |
| `part_number` | 料号 | `part_number` | PO页 | exact |
| `pcsPerBox` | 单箱数量 | `pcs_per_box` | 购物车 | exact |
| `shape` | 形状 | `shape` | 商品列表 | exact |
| `spec` | Spec. | `spec` | PO页 | exact |
| `widthCm` | 膜宽cm | `width_cm` | tooltip | exact |
| `widthInch` | 膜宽inch | `width_inch` | tooltip | exact |
| `包装方式` | 包装方式 | `package_type` | tooltip | exact |
| `单箱数量` | 单箱数量 | `pcs_per_box` | 购物车 | exact |
| `品牌` | 品牌 | `brand` | PO页 | exact |
| `料号` | 料号 | `part_number` | PO页 | exact |
| `材质` | 材质 | `material` | tooltip | exact |

### ⚠️ 部分匹配字段

| 前端字段 | JSON标准字段 | 英文映射 | 场景 | 匹配类型 | 分数 |
|----------|-------------|----------|------|----------|------|
| `Model` | 适用机型 | `app_model` | 商品列表 | contains | 0.63 |
| `Product` | productId | `product_id` | 商品列表 | contains | 0.78 |
| `Specs` | Spec. | `spec` | 商品列表 | contains | 0.80 |
| `Thickness` | 厚度/克重um/gsm | `thickness_um` | tooltip | contains | 0.82 |
| `Width` | 膜宽cm | `width_cm` | tooltip | contains | 0.71 |
| `bubbleDiameter` | 泡径cm | `bubble_diameter_cm` | 商品列表 | contains | 0.88 |
| `model` | 适用机型 | `app_model` | 商品列表 | contains | 0.63 |
| `specs` | Spec. | `spec` | 商品列表 | contains | 0.80 |
| `thickness` | 厚度/克重um/gsm | `thickness_um` | tooltip | contains | 0.82 |
| `width` | 膜宽cm | `width_cm` | tooltip | contains | 0.71 |
| `总长` | 总长m | `total_length_m` | tooltip | contains | 0.67 |

### ❌ 未实现的JSON标准字段

| JSON标准字段 | 英文映射 | 场景 | 优先级 |
|-------------|----------|------|---------|
| 名称(英文)新增需求 | `name_en` | 商品列表 | P2-增强 |
| 产品图片袋型实物 | `product_image_url` | 商品列表 | P2-增强 |
| 型号（公制） | `model_metric` | 商品列表 | P0-关键 |
| 型号(英制) | `model_imperial` | 商品列表 | P0-关键 |
| Spec.(英制) | `spec_imperial` | 商品列表 | P0-关键 |
| 泡径inch | `bubble_diameter_inch` | 商品列表 | P2-增强 |
| 名称(英文)新增需求 | `name_en` | 购物车 | P2-增强 |
| 产品图片袋型实物 | `product_image_url` | 购物车 | P2-增强 |
| 型号（公制） | `model_metric` | 购物车 | P0-关键 |
| 型号(英制) | `model_imperial` | 购物车 | P0-关键 |
| Spec.(英制) | `spec_imperial` | 购物车 | P0-关键 |
| 泡径inch | `bubble_diameter_inch` | 购物车 | P2-增强 |
| 厚度/克重mil/# | `thickness_mil` | tooltip | P2-增强 |
| 名称(英文)新增需求 | `name_en` | tooltip | P2-增强 |
| 总长ft | `total_length_ft` | tooltip | P2-增强 |
| 包装尺寸cm | `package_size_cm` | tooltip | P2-增强 |
| 包装尺寸inch | `package_size_inch` | tooltip | P2-增强 |
| 单件净重lbs | `net_weight_lbs` | tooltip | P2-增强 |
| 托盘尺寸cm | `pallet_size_cm` | tooltip | P2-增强 |
| 一托卷数A | `N/A` | tooltip | P2-增强 |
| 整托毛重Akg | `N/A` | tooltip | P2-增强 |
| 整托毛重Albs | `N/A` | tooltip | P2-增强 |
| 打托高度Acm | `N/A` | tooltip | P2-增强 |
| 打托高度Ainch | `N/A` | tooltip | P2-增强 |
| 一托卷数B | `N/A` | tooltip | P2-增强 |
| 整盘毛重kg | `N/A` | tooltip | P2-增强 |
| 整盘毛重Blbs | `N/A` | tooltip | P2-增强 |
| 打托高度cm | `N/A` | tooltip | P2-增强 |
| 打托高度Binch | `N/A` | tooltip | P2-增强 |
| 一托卷数C | `N/A` | tooltip | P2-增强 |
| 整托毛重kg | `N/A` | tooltip | P2-增强 |
| 整托毛重Clbs | `N/A` | tooltip | P2-增强 |
| 打托高度Ccm | `N/A` | tooltip | P2-增强 |
| 打托高度Cinch | `N/A` | tooltip | P2-增强 |
| 纸筒内径cm | `N/A` | tooltip | P2-增强 |
| 纸筒内径inch | `N/A` | tooltip | P2-增强 |
| 名称(英文)新增需求 | `name_en` | PO页 | P2-增强 |
| 型号（公制） | `model_metric` | PO页 | P0-关键 |
| 型号(英制) | `model_imperial` | PO页 | P0-关键 |
| Spec.(英制) | `spec_imperial` | PO页 | P0-关键 |

## 🎯 基于JSON标准的修复计划

### P0 - 关键字段（立即修复）

- **型号（公制）** (商品列表) → 实现: `model_metric`
- **型号(英制)** (商品列表) → 实现: `model_imperial`
- **Spec.(英制)** (商品列表) → 实现: `spec_imperial`
- **型号（公制）** (购物车) → 实现: `model_metric`
- **型号(英制)** (购物车) → 实现: `model_imperial`
- **Spec.(英制)** (购物车) → 实现: `spec_imperial`
- **型号（公制）** (PO页) → 实现: `model_metric`
- **型号(英制)** (PO页) → 实现: `model_imperial`
- **Spec.(英制)** (PO页) → 实现: `spec_imperial`

### P1 - 重要字段（本周修复）

- ✅ 所有重要字段已实现

### P2 - 增强字段（下周修复）

- **名称(英文)新增需求** (商品列表) → 实现: `name_en`
- **产品图片袋型实物** (商品列表) → 实现: `product_image_url`
- **泡径inch** (商品列表) → 实现: `bubble_diameter_inch`
- **名称(英文)新增需求** (购物车) → 实现: `name_en`
- **产品图片袋型实物** (购物车) → 实现: `product_image_url`
- **泡径inch** (购物车) → 实现: `bubble_diameter_inch`
- **厚度/克重mil/#** (tooltip) → 实现: `thickness_mil`
- **名称(英文)新增需求** (tooltip) → 实现: `name_en`
- **总长ft** (tooltip) → 实现: `total_length_ft`
- **包装尺寸cm** (tooltip) → 实现: `package_size_cm`
- ... 还有 21 个增强字段

## 💻 基于JSON标准的代码修复示例

### 商品列表字段修复示例

```typescript
// ✅ 基于JSON标准的13个必需字段
interface ConsumableListItem {
  app_model: string;    // 适用机型
  name_en: string;    // 名称(英文)新增需求
  shape: string;    // 形状
  product_image_url: string;    // 产品图片袋型实物
  part_number: string;    // 料号
  model_metric: string;    // 型号（公制）
  model_imperial: string;    // 型号(英制)
  spec: string;    // Spec.
  spec_imperial: string;    // Spec.(英制)
  bubble_diameter_cm: string;    // 泡径cm
  bubble_diameter_inch: string;    // 泡径inch
  product_id: string;    // productId
  pcs_per_box: string;    // 单箱数量
}

const ConsumableCard = ({ item }: { item: ConsumableListItem }) => (
  <div className="consumable-card">
    <img src={item.product_image_url} alt={item.shape} />
    <h3>{item.app_model}</h3>
    <p>料号: {item.part_number}</p>
    <p>型号(公制): {item.model_metric}</p>
    <p>型号(英制): {item.model_imperial}</p>
    <p>规格: {item.spec}</p>
    <p>规格(英制): {item.spec_imperial}</p>
    <p>泡径: {item.bubble_diameter_cm}cm</p>
    <p>单箱数量: {item.pcs_per_box}</p>
  </div>
);
```

## 📊 基于JSON标准的验收标准

修复完成后，各场景的字段覆盖率应达到：
- **筛选项**: ≥ 100% (7个字段中至少实现7个)
- **商品列表**: ≥ 95% (13个字段中至少实现13个)
- **购物车**: ≥ 95% (12个字段中至少实现12个)
- **tooltip**: ≥ 85% (34个字段中至少实现29个)
- **PO页**: ≥ 100% (8个字段中至少实现8个)

**总体目标**: 前端字段与JSON标准定义的匹配率达到90%以上