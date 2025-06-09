# 耗材页面字段使用情况差异分析报告

生成时间: 2025-06-09T04:42:32.176Z

## 📋 总体概述

- **前端字段总数**: 107
- **标准字段总数**: 47
- **完全匹配**: 18
- **部分匹配**: 0
- **前端独有**: 89
- **标准未实现**: 34

## 🎯 各场景字段覆盖率

| 场景 | 预期字段数 | 已实现 | 缺失 | 覆盖率 | 状态 |
|------|------------|--------|------|---------|------|
| 筛选项 | 9 | 11 | 7 | 22.2% | ❌ 需要改进 |
| 商品列表 | 13 | 12 | 9 | 30.8% | ❌ 需要改进 |
| 购物车 | 12 | 6 | 9 | 25.0% | ❌ 需要改进 |
| tooltip | 34 | 12 | 31 | 8.8% | ❌ 需要改进 |

## 📄 筛选项 详细分析

**场景说明**: 页面顶部的筛选控件区域

### ✅ 已实现字段

- `Filters.selectedModel`
- `filterOptions?.shapes?.find(s => s.id === selectedShape`
- `filter.material`
- `Filters.selectedSpecs.thickness`
- `Filters.selectedSpecs.width`
- `Filters.length`
- `selectedModel`
- `selectedShape`
- `selectedMaterial`
- `形状`
- `材质`

### ❌ 缺失字段

- **`适用机型`** → 标准Key: `Applicable Machine` (Applicable Machine)
- **`厚度/克重um/gsm`** → 标准Key: `厚度/克重um/gsm` (厚度/克重um/gsm)
- **`厚度/克重mil/#`** → 标准Key: `厚度/克重mil/#` (厚度/克重mil/#)
- **`膜宽cm`** → 标准Key: `膜宽cm` (膜宽cm)
- **`膜宽inch`** → 标准Key: `膜宽inch` (膜宽inch)
- **`袋长cm`** → 标准Key: `袋长cm` (袋长cm)
- **`袋长inch`** → 标准Key: `袋长inch` (袋长inch)

### 💡 修复建议

- 🔍 **筛选控件完整性**: 确保所有7个筛选维度都有对应的UI控件
- 🎛️ **智能单位制**: 根据用户地区智能显示公制/英制筛选项
- 📊 **筛选逻辑**: 实现前端筛选为主的策略，避免频繁API调用

## 📄 商品列表 详细分析

**场景说明**: 耗材产品列表展示区域

### ✅ 已实现字段

- `item.app_model`
- `item.shape`
- `item.image_url`
- `item.part_number`
- `item.model`
- `item.spec`
- `item.bubble_diameter`
- `product.model`
- `形状`
- `料号`
- `productId`
- `单箱数量`

### ❌ 缺失字段

- **`适用机型`** → 标准Key: `Applicable Machine` (Applicable Machine)
- **`名称(英文)新增需求`** → 标准Key: `Item` (Item)
- **`产品图片袋型实物`** → 标准Key: `产品图片袋型实物` (产品图片袋型实物)
- **`型号（公制）`** → 标准Key: `Model` (Model)
- **`型号(英制)`** → 标准Key: `Model` (Model)
- **`Spec.`** → 标准Key: `Spec.` (Spec.)
- **`Spec.(英制)`** → 标准Key: `Spec.` (Spec.)
- **`泡径cm`** → 标准Key: `Bubble Dia.` (Bubble Dia.)
- **`泡径inch`** → 标准Key: `Bubble Dia.` (Bubble Dia.)

### 💡 修复建议

- 📋 **字段显示**: 按CSV第7行√标记实现所有必需字段
- 🖼️ **图片显示**: 确保产品图片和包装图片正确显示
- 🏷️ **规格信息**: 智能显示公制/英制规格，避免单位重复

## 📄 购物车 详细分析

**场景说明**: 购物车页面字段显示

### ✅ 已实现字段

- `Cart] cartItem.properties:', cartItem.`
- `cartItem.`
- `addToCart`
- `料号`
- `productId`
- `单箱数量`

### ❌ 缺失字段

- **`适用机型`** → 标准Key: `Applicable Machine` (Applicable Machine)
- **`名称(英文)新增需求`** → 标准Key: `Item` (Item)
- **`产品图片袋型实物`** → 标准Key: `产品图片袋型实物` (产品图片袋型实物)
- **`型号（公制）`** → 标准Key: `Model` (Model)
- **`型号(英制)`** → 标准Key: `Model` (Model)
- **`Spec.`** → 标准Key: `Spec.` (Spec.)
- **`Spec.(英制)`** → 标准Key: `Spec.` (Spec.)
- **`泡径cm`** → 标准Key: `Bubble Dia.` (Bubble Dia.)
- **`泡径inch`** → 标准Key: `Bubble Dia.` (Bubble Dia.)

### 💡 修复建议

- 🛒 **购物车字段**: 与商品列表保持一致的字段显示
- 📦 **数量信息**: 正确显示单箱数量等包装信息
- 🔢 **规格标识**: 确保型号、料号等关键标识完整显示

## 📄 tooltip 详细分析

**场景说明**: 详细信息弹窗显示

### ✅ 已实现字段

- `Tooltip`
- `detailModalVisible, setDetailModal`
- `Material`
- `thickness`
- `width`
- `length`
- `package_size`
- `net_weight_kg', 'unit_weight_kg', 'specs.net_weight`
- `pallet`
- `材质`
- `包装方式`
- `包装实物图片`

### ❌ 缺失字段

- **`厚度/克重um/gsm`** → 标准Key: `厚度/克重um/gsm` (厚度/克重um/gsm)
- **`厚度/克重mil/#`** → 标准Key: `厚度/克重mil/#` (厚度/克重mil/#)
- **`膜宽cm`** → 标准Key: `膜宽cm` (膜宽cm)
- **`膜宽inch`** → 标准Key: `膜宽inch` (膜宽inch)
- **`袋长cm`** → 标准Key: `袋长cm` (袋长cm)
- **`袋长inch`** → 标准Key: `袋长inch` (袋长inch)
- **`名称(英文)新增需求`** → 标准Key: `Item` (Item)
- **`总长m`** → 标准Key: `总长m` (总长m)
- **`总长ft`** → 标准Key: `总长ft` (总长ft)
- **`包装尺寸cm`** → 标准Key: `Package Size(cm)` (Package Size(cm))
- **`包装尺寸inch`** → 标准Key: `Package Size(cm)` (Package Size(cm))
- **`单件净重kg`** → 标准Key: `Net Weight(kg)` (Net Weight(kg))
- **`单件净重lbs`** → 标准Key: `Net Weight(kg)` (Net Weight(kg))
- **`托盘尺寸cm`** → 标准Key: `托盘尺寸cm` (托盘尺寸cm)
- **`一托卷数A`** → 标准Key: `一托卷数a` (一托卷数A)
- **`整托毛重Akg`** → 标准Key: `整托毛重akg` (整托毛重Akg)
- **`整托毛重Albs`** → 标准Key: `整托毛重albs` (整托毛重Albs)
- **`打托高度Acm`** → 标准Key: `打托高度acm` (打托高度Acm)
- **`打托高度Ainch`** → 标准Key: `打托高度ainch` (打托高度Ainch)
- **`一托卷数B`** → 标准Key: `一托卷数b` (一托卷数B)
- **`整盘毛重kg`** → 标准Key: `整盘毛重kg` (整盘毛重kg)
- **`整盘毛重Blbs`** → 标准Key: `整盘毛重blbs` (整盘毛重Blbs)
- **`打托高度cm`** → 标准Key: `打托高度cm` (打托高度cm)
- **`打托高度Binch`** → 标准Key: `打托高度binch` (打托高度Binch)
- **`一托卷数C`** → 标准Key: `一托卷数c` (一托卷数C)
- **`整托毛重kg`** → 标准Key: `整托毛重kg` (整托毛重kg)
- **`整托毛重Clbs`** → 标准Key: `整托毛重clbs` (整托毛重Clbs)
- **`打托高度Ccm`** → 标准Key: `打托高度ccm` (打托高度Ccm)
- **`打托高度Cinch`** → 标准Key: `打托高度cinch` (打托高度Cinch)
- **`纸筒内径cm`** → 标准Key: `纸筒内径cm` (纸筒内径cm)
- **`纸筒内径inch`** → 标准Key: `纸筒内径inch` (纸筒内径inch)

### 💡 修复建议

- 📝 **详细信息**: 实现33个详细信息字段的完整显示
- 📏 **托盘配置**: 支持A/B/C三种托盘配置的动态显示
- 🎯 **条件显示**: 根据产品类型条件显示相关字段（如气泡类型显示泡径）

## 🔄 字段映射分析

### ✅ 完全匹配字段

| 前端字段 | 标准字段 | 标准Key | 匹配类型 |
|----------|----------|---------|----------|
| `Material` | 材质 | Material | english |
| `Model` | 型号(英制) | Model | english |
| `Product` | productId | productid | contains |
| `brand` | 品牌 | Brand | english |
| `id` | productId | productid | contains |
| `item` | 名称(英文)新增需求 | Item | english |
| `material` | 材质 | Material | english |
| `model` | 型号(英制) | Model | english |
| `net_weight_kg` | 单件净重lbs | Net Weight(kg) | english |
| `spec` | Spec.(英制) | Spec. | contains |
| `包装方式` | 包装方式 | 包装方式 | exact |
| `单箱数量` | 单箱数量 | Qty per Carton | exact |
| `厚度` | 厚度/克重um/gsm | 厚度/克重um/gsm | contains |
| `品牌` | 品牌 | Brand | exact |
| `型号` | 型号（公制） | Model | contains |
| `总长` | 总长ft | 总长ft | contains |
| `料号` | 料号 | Part No. | exact |
| `材质` | 材质 | Material | exact |

### ❌ 未实现的标准字段

| 标准字段 | 标准Key | 英文名 | 显示场景 |
|----------|---------|--------|----------|
| 适用机型 | Applicable Machine | Applicable Machine | 商品列表, 购物车 |
| 形状 | 形状 | 形状 | 商品列表 |
| 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 商品列表, 购物车 |
| Spec. | Spec. | Spec. | 商品列表, 购物车 |
| 泡径cm | Bubble Dia. | Bubble Dia. | 商品列表, 购物车 |
| 泡径inch | Bubble Dia. | Bubble Dia. | 商品列表, 购物车 |
| 厚度/克重mil/# | 厚度/克重mil/# | 厚度/克重mil/# | tooltip |
| 膜宽cm | 膜宽cm | 膜宽cm | tooltip |
| 膜宽inch | 膜宽inch | 膜宽inch | tooltip |
| 袋长cm | 袋长cm | 袋长cm | tooltip |
| 袋长inch | 袋长inch | 袋长inch | tooltip |
| 总长m | 总长m | 总长m | tooltip |
| 包装尺寸cm | Package Size(cm) | Package Size(cm) | tooltip |
| 包装尺寸inch | Package Size(cm) | Package Size(cm) | tooltip |
| 单件净重kg | Net Weight(kg) | Net Weight(kg) | tooltip |
| 包装实物图片 | 包装实物图片 | 包装实物图片 | tooltip |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | tooltip |
| 一托卷数A | 一托卷数a | 一托卷数A | tooltip |
| 整托毛重Akg | 整托毛重akg | 整托毛重Akg | tooltip |
| 整托毛重Albs | 整托毛重albs | 整托毛重Albs | tooltip |
| 打托高度Acm | 打托高度acm | 打托高度Acm | tooltip |
| 打托高度Ainch | 打托高度ainch | 打托高度Ainch | tooltip |
| 一托卷数B | 一托卷数b | 一托卷数B | tooltip |
| 整盘毛重kg | 整盘毛重kg | 整盘毛重kg | tooltip |
| 整盘毛重Blbs | 整盘毛重blbs | 整盘毛重Blbs | tooltip |
| 打托高度cm | 打托高度cm | 打托高度cm | tooltip |
| 打托高度Binch | 打托高度binch | 打托高度Binch | tooltip |
| 一托卷数C | 一托卷数c | 一托卷数C | tooltip |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | tooltip |
| 整托毛重Clbs | 整托毛重clbs | 整托毛重Clbs | tooltip |
| 打托高度Ccm | 打托高度ccm | 打托高度Ccm | tooltip |
| 打托高度Cinch | 打托高度cinch | 打托高度Cinch | tooltip |
| 纸筒内径cm | 纸筒内径cm | 纸筒内径cm | tooltip |
| 纸筒内径inch | 纸筒内径inch | 纸筒内径inch | tooltip |

## 🎯 优先级修复计划

### P0 - 关键字段（立即修复）

- **适用机型** → `Applicable Machine` - 产品核心标识信息
- **Spec.** → `Spec.` - 产品核心标识信息

### P1 - 重要字段（本周修复）

- **形状** → `形状` - 筛选和展示核心字段
- **膜宽cm** → `膜宽cm` - 筛选和展示核心字段
- **袋长cm** → `袋长cm` - 筛选和展示核心字段

### P2 - 增强字段（下周修复）

- **产品图片袋型实物** → `产品图片袋型实物` - 详细信息增强
- **泡径cm** → `Bubble Dia.` - 详细信息增强
- **泡径inch** → `Bubble Dia.` - 详细信息增强
- **厚度/克重mil/#** → `厚度/克重mil/#` - 详细信息增强
- **膜宽inch** → `膜宽inch` - 详细信息增强
- **袋长inch** → `袋长inch` - 详细信息增强
- **总长m** → `总长m` - 详细信息增强
- **包装尺寸cm** → `Package Size(cm)` - 详细信息增强
- **包装尺寸inch** → `Package Size(cm)` - 详细信息增强
- **单件净重kg** → `Net Weight(kg)` - 详细信息增强
- ... 还有 19 个增强字段

## 💻 代码修复示例

### 筛选项修复示例

```typescript
// ✅ 正确：完整的筛选项实现
const ConsumablesFilters = () => {
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedShape, setSelectedShape] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [thicknessRange, setThicknessRange] = useState(null);
  const [widthRange, setWidthRange] = useState(null);
  const [lengthRange, setLengthRange] = useState(null);
  
  return (
    <div className="filters-container">
      <ModelFilter value={selectedModel} onChange={setSelectedModel} />
      <ShapeFilter value={selectedShape} onChange={setSelectedShape} />
      <MaterialFilter value={selectedMaterial} onChange={setSelectedMaterial} />
      <ThicknessRangeFilter value={thicknessRange} onChange={setThicknessRange} />
      <WidthRangeFilter value={widthRange} onChange={setWidthRange} />
      <LengthRangeFilter value={lengthRange} onChange={setLengthRange} />
    </div>
  );
};
```

### 商品列表字段修复示例

```typescript
// ✅ 正确：按CSV标准显示所有必需字段
const ConsumableCard = ({ item }) => {
  return (
    <div className="consumable-card">
      <img src={item.image_url} alt={item.shape} />
      <div className="details">
        <h3>{item.app_model}</h3>
        <p><strong>料号:</strong> {item.part_number}</p>
        <p><strong>型号(公制):</strong> {item.model}</p>
        <p><strong>型号(英制):</strong> {item.model_imperial}</p>
        <p><strong>规格(公制):</strong> {item.spec}</p>
        <p><strong>规格(英制):</strong> {item.spec_imperial}</p>
        {item.bubble_diameter_met && (
          <p><strong>泡径(cm):</strong> {item.bubble_diameter_met}</p>
        )}
        <p><strong>单箱数量:</strong> {item.pcs_per_box}</p>
      </div>
    </div>
  );
};
```
