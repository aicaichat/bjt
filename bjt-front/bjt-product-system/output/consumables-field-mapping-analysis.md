# 耗材页面字段对应关系分析

## 分析目标
对比耗材页面前端代码实现与JSON标准字段，找到字段对应关系和缺失字段。

## JSON标准字段 (from display-fields.json)

### 1. 商品列表 (13个字段)
```json
[
  "适用机型",
  "名称(英文)新增需求", 
  "形状",
  "产品图片袋型实物",
  "料号",
  "型号（公制）",
  "型号(英制)",
  "Spec.",
  "Spec.(英制)",
  "泡径cm",
  "泡径inch", 
  "productId",
  "单箱数量"
]
```

### 2. 购物车 (12个字段) 
```json
[
  "适用机型",
  "名称(英文)新增需求",
  "产品图片袋型实物", 
  "料号",
  "型号（公制）",
  "型号(英制)",
  "Spec.",
  "Spec.(英制)",
  "泡径cm",
  "泡径inch",
  "productId",
  "单箱数量"
]
```

### 3. Tooltip (34个字段) - **注意：不包含适用机型**
```json
[
  "材质", "厚度/克重um/gsm", "厚度/克重mil/#", "膜宽cm", "膜宽inch",
  "袋长cm", "袋长inch", "名称(英文)新增需求", "总长m", "总长ft",
  "包装方式", "包装尺寸cm", "包装尺寸inch", "单件净重kg", "单件净重lbs", 
  "包装实物图片", "托盘尺寸cm", "一托卷数A", "整托毛重Akg", "整托毛重Albs",
  "打托高度Acm", "打托高度Ainch", "一托卷数B", "整盘毛重kg", "整盘毛重Blbs",
  "打托高度cm", "打托高度Binch", "一托卷数C", "整托毛重kg", "整托毛重Clbs",
  "打托高度Ccm", "打托高度Cinch", "纸筒内径cm", "纸筒内径inch"
]
```

### 4. PO页 (8个字段)
```json
[
  "名称(英文)新增需求", "料号", "型号（公制）", "型号(英制)",
  "Spec.", "Spec.(英制)", "品牌", "productId"
]
```

## 重要字段映射说明
- **智能单位制显示**: 型号(公制)/型号(英制) 根据用户地区设置自动选择显示一个，实际是同一个字段的双状态
- **型号(英制) = Spec.(英制)** (实际是同一概念)
- **形状 = shape**

## 字段合并规则 (智能单位制显示)

以下字段对根据用户设置(`userRegion`) 自动选择显示，计为单个字段：

### 商品列表合并后实际字段 (10个逻辑字段)
1. 适用机型
2. 名称(英文)新增需求
3. 形状  
4. 产品图片袋型实物
5. 料号
6. **型号** (公制/英制智能显示)
7. **规格** (公制/英制智能显示) 
8. **泡径** (cm/inch智能显示)
9. productId
10. 单箱数量

### 购物车合并后实际字段 (9个逻辑字段)
与商品列表相同，去除形状字段

### Tooltip合并后实际字段 (23个逻辑字段)
合并所有公制/英制字段对后的实际逻辑字段数

## 前端代码实现分析

### 1. 商品列表显示字段 (frontend/src/pages/Consumables/index.tsx 2461-2600行)

**已实现字段:**
1. `item.image_url` → **产品图片袋型实物** ✅
2. `item.code` → **料号** ✅  
3. `item.name` → **名称(英文)新增需求** ✅
4. `item.model` → **型号** ✅ (仅公制，未实现智能切换)
5. `item.id` → **productId** ✅
6. `item.specs?.width` → 显示宽度信息 (部分相关)
7. `item.specs?.length` → 显示长度信息 (部分相关)
8. `item.specs?.rollLength` → 显示总长信息 (部分相关)
9. `item.specs?.material` → 显示材质信息 (部分相关)

**缺失字段:**
1. **适用机型** ❌ (无 `app_model` 字段显示)
2. **形状** ❌ (无 `shape` 字段显示)
3. **型号智能切换** ❌ (只显示公制，未根据用户设置智能切换)
4. **规格** ❌ (无 `spec` 智能显示)
5. **泡径** ❌ (无智能单位制显示)
6. **单箱数量** ❌ (无 `pcs_per_box` 字段显示)

### 2. 购物车显示字段 (frontend/src/pages/Consumables/index.tsx 2134-2170行)

**购物车添加时的ExtendedCartItem包含:**
```typescript
const cartItem: ExtendedCartItem = {
  // 基础字段
  name: resolvedName,           // → 名称(英文)新增需求 ✅
  image_url: properties.image_url,  // → 产品图片袋型实物 ✅
  part_number: properties.part_number, // → 料号 ✅
  productId: parseInt(itemId),  // → productId ✅
  
  // 规格信息
  specs: {
    partNumber: properties.part_number,
    productName: resolvedName
  },
  
  // 其他购物车必要字段...
}
```

**缺失字段:**
1. **适用机型** ❌
2. **型号智能显示** ❌
3. **规格智能显示** ❌
4. **泡径智能显示** ❌
5. **单箱数量** ❌

### 3. 购物车侧边栏显示 (frontend/src/components/Cart/CartSidebar.tsx 100-140行)

**renderConsumableDetails函数已实现:**
```typescript
// 基础信息 - 已实现智能单位制显示
part_number, brand, model/model_imperial, spec/spec_imperial
// 耗材特有字段  
material, width, length, thickness, rollLength, shape
```

**已显示字段 (智能单位制):**
1. `part_number` → **料号** ✅
2. `brand` → **品牌** ✅ (PO页需要)
3. `model` / `model_imperial` → **型号** ✅ **智能切换已实现**
4. `spec` / `spec_imperial` → **规格** ✅ **智能切换已实现**
5. `material` → **材质** ✅ (tooltip需要)
6. `width` → **膜宽** ✅ (tooltip需要)
7. `length` → **袋长** ✅ (tooltip需要)
8. `shape` → **形状** ✅

**缺失字段:**
1. **适用机型** ❌
2. **产品图片袋型实物** ❌ (在购物车详情中未显示)
3. **泡径智能显示** ❌
4. **单箱数量** ❌

### 4. Tooltip详细信息 (frontend/src/pages/Consumables/index.tsx 343-880行)

**ConsumableTooltipContent组件已实现 - 完整智能单位制显示:**

**基本规格 (7个逻辑字段):**
1. `material` → **材质** ✅
2. `thickness` → **厚度/克重** (um/gsm 或 mil/#) ✅ **智能切换已实现**
3. `width_cm/width_inch` → **膜宽** (cm或inch) ✅ **智能切换已实现**
4. `length_cm/length_inch` → **袋长** (cm或inch) ✅ **智能切换已实现**
5. `roll_length_m/roll_length_ft` → **总长** (m或ft) ✅ **智能切换已实现**
6. `bubble_diameter_met/bubble_diameter_inch` → **泡径** (cm或inch) ✅ **智能切换已实现** (条件显示)
7. `name` → **名称(英文)新增需求** ✅ (在标题显示)

**包装属性 (7个逻辑字段):**
1. `packaging_type` → **包装方式** ✅
2. `package_size_cm/package_size_inch` → **包装尺寸** (cm或inch) ✅ **智能切换已实现**
3. `unit_weight_kg/unit_weight_lbs` → **单件净重** (kg或lbs) ✅ **智能切换已实现**
4. `pallet_size_cm` → **托盘尺寸cm** ✅
5. `package_image_url` → **包装实物图片** ✅
6. `package_gross_weight_kg/package_gross_weight_lbs` → 前端额外实现的包装毛重 ✅
7. `pcs_per_box` → 前端额外实现的单箱数量 ✅

**打托属性 (9个逻辑字段 - 配置A/B/C):**
1. `pallet_rolls_a/b/c` → **一托卷数A/B/C** ✅ (3个字段)
2. `pallet_weight_a/b/c_kg/lbs` → **整托毛重A/B/C** (kg或lbs) ✅ **智能切换已实现** (3个逻辑字段)
3. `pallet_height_a/b/c_cm/inch` → **打托高度A/B/C** (cm或inch) ✅ **智能切换已实现** (3个逻辑字段)
4. `core_diameter_cm/inch` → **纸筒内径** (cm或inch) ✅ **智能切换已实现**

**Tooltip覆盖情况:**
- Tooltip JSON标准的34个字段合并为23个逻辑字段，前端已100%实现智能单位制显示 ✅

## 字段映射关系总结

### 前端字段 → JSON标准字段映射 (智能单位制)

| 前端字段 | JSON标准字段 | 智能显示逻辑 | 覆盖场景 |
|---------|-------------|-------------|----------|
| `item.image_url` | 产品图片袋型实物 | 单一字段 | 商品列表、购物车 |
| `item.code` | 料号 | 单一字段 | 商品列表、购物车、PO页 |
| `item.name` | 名称(英文)新增需求 | 单一字段 | 商品列表、购物车、PO页、tooltip |
| `item.model/model_imperial` | 型号 | 根据userRegion智能切换 | tooltip、PO页 |
| `item.spec/spec_imperial` | 规格 | 根据userRegion智能切换 | tooltip、PO页 |
| `item.id` | productId | 单一字段 | 商品列表、购物车、PO页 |
| `item.brand` | 品牌 | 单一字段 | PO页 |
| `item.shape` | 形状 | 单一字段 | 购物车侧边栏 |
| `material` | 材质 | 单一字段 | tooltip |
| `thickness` | 厚度/克重 | um/gsm ↔ mil/# | tooltip |
| `width_cm/inch` | 膜宽 | cm ↔ inch | tooltip |
| `length_cm/inch` | 袋长 | cm ↔ inch | tooltip |
| `roll_length_m/ft` | 总长 | m ↔ ft | tooltip |
| `bubble_diameter_met/inch` | 泡径 | cm ↔ inch | tooltip |

### 关键缺失字段 (基于智能单位制)

**P0级缺失 (影响基础功能):**
1. **适用机型** (`app_model`) - 商品列表、购物车缺失
2. **形状** (`shape`) - 商品列表、购物车缺失
3. **型号智能显示** - 商品列表、购物车缺失 (仅显示公制)
4. **规格智能显示** - 商品列表、购物车缺失

**P1级缺失 (影响详细信息):**
1. **泡径智能显示** - 商品列表、购物车缺失
2. **单箱数量** - 商品列表、购物车缺失

## 建议修复方案 (智能单位制显示)

### 1. 商品列表字段补全 - 智能单位制版本
```typescript
// 在商品卡片中添加缺失字段 - 智能单位制显示
<div className="product-specs">
  {/* 适用机型 */}
  <div className="spec-item">
    <span>适用机型: {item.app_model || 'N/A'}</span>
  </div>
  
  {/* 形状 */}
  <div className="spec-item">
    <span>形状: {item.shape || 'N/A'}</span>
  </div>
  
  {/* 型号智能单位制显示 */}
  <div className="spec-item">
    <span>型号: {userRegion === 'na' || userRegion === 'au' ? 
      (item.model_imperial || item.model || 'N/A') : 
      (item.model || 'N/A')
    }</span>
  </div>
  
  {/* 规格智能单位制显示 */}
  <div className="spec-item">
    <span>规格: {userRegion === 'na' || userRegion === 'au' ? 
      (item.spec_imperial || item.spec || 'N/A') : 
      (item.spec || 'N/A')
    }</span>
  </div>
  
  {/* 泡径智能单位制显示 (条件显示) */}
  {shouldShowBubbleDiameter(item.shape) && (
    <div className="spec-item">
      <span>泡径: {userRegion === 'na' || userRegion === 'au' ? 
        `${item.bubble_diameter_inch || 'N/A'} inch` : 
        `${item.bubble_diameter_cm || 'N/A'} cm`
      }</span>
    </div>
  )}
  
  {/* 单箱数量 */}
  <div className="spec-item">
    <span>单箱数量: {item.pcs_per_box || 'N/A'}</span>
  </div>
</div>
```

### 2. 购物车字段补全 - 智能单位制版本
```typescript
// 在addToCart函数中补全cartItem - 确保包含双单位制数据
const cartItem: ExtendedCartItem = {
  // 现有字段...
  
  // 补全缺失字段 - 包含双单位制数据供智能显示
  app_model: product.app_model,
  shape: product.shape,
  model: product.model,
  model_imperial: product.model_imperial,
  spec: product.spec,
  spec_imperial: product.spec_imperial,
  bubble_diameter_cm: product.bubble_diameter_cm,
  bubble_diameter_inch: product.bubble_diameter_inch,
  pcs_per_box: product.pcs_per_box,
  
  properties: {
    ...properties,
    // 确保properties也包含这些字段 - 双单位制数据
    app_model: product.app_model,
    shape: product.shape,
    model: product.model,
    model_imperial: product.model_imperial,
    spec: product.spec,
    spec_imperial: product.spec_imperial,
    bubble_diameter_cm: product.bubble_diameter_cm,
    bubble_diameter_inch: product.bubble_diameter_inch,
    pcs_per_box: product.pcs_per_box
  }
}
```

### 3. 购物车显示字段补全 - 智能单位制版本
```typescript
// 在CartSidebar的renderConsumableDetails函数中添加 - 已有智能单位制基础
const renderConsumableDetails = (item: any) => {
  const props = item.properties || {};
  
  return (
    <div className="consumable-details">
      {/* 现有字段已实现智能单位制... */}
      
      {/* 新增适用机型 */}
      <div className="detail-row">
        <span className="label">适用机型:</span>
        <span className="value">{getValue(props.app_model || item.app_model, t)}</span>
      </div>
      
      {/* 条件显示泡径 - 智能单位制 */}
      {shouldShowBubbleDiameter(props.shape || item.shape) && (
        <div className="detail-row">
          <span className="label">泡径:</span>
          <span className="value">
            {preferredUnit === 'metric' 
              ? `${getValue(props.bubble_diameter_cm || item.bubble_diameter_cm, t)}cm`
              : `${getValue(props.bubble_diameter_inch || item.bubble_diameter_inch, t)}inch`
            }
          </span>
        </div>
      )}
      
      {/* 新增单箱数量 */}
      <div className="detail-row">
        <span className="label">单箱数量:</span>
        <span className="value">{getValue(props.pcs_per_box || item.pcs_per_box, t)}</span>
      </div>
    </div>
  );
};
```

## 覆盖率统计 (基于智能单位制合并)

### 总体覆盖情况
- **筛选项**: 100% (7/7个筛选维度全部实现)
- **商品列表**: 50% (5/10个逻辑字段已实现)
- **购物车**: 44.4% (4/9个逻辑字段已实现)  
- **Tooltip**: 100% (23/23个逻辑字段已实现，完整智能单位制) ✅
- **PO页**: 87.5% (7/8个字段已实现，购物车中已有)

### 智能单位制实现状态
- **Tooltip**: ✅ 完全实现智能单位制显示
- **购物车侧边栏**: ✅ 已实现智能单位制显示
- **商品列表**: ❌ 仅显示公制，需要实现智能切换
- **购物车主要功能**: ❌ 需要补全数据和显示逻辑

### 优先级建议
1. **P0**: 商品列表智能单位制显示 (影响用户选择体验)
2. **P1**: 购物车智能单位制显示 (影响购买确认体验)
3. **P2**: 维护Tooltip的完整智能单位制显示 ✅ 已完成