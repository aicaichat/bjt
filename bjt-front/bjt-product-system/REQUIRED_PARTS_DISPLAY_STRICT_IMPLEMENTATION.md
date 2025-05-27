# 必选备件展示逻辑严格实现

## 实现原则

1. **不修改**现有列表代码和购物车代码
2. **只针对必选备件**在购物车中的展示进行优化
3. **严格按照展示逻辑要求**的字段，不随意增减
4. **公制/英制**根据用户信息选择
5. **Tooltip**严格按照要求显示

## 展示字段要求

### 列表展示字段（基础信息）
```
- 适配机型 (app_model)
- 产品图片 (image_url)
- 料号 (part_number)
- 名称 (name_zh/name_en)
- 规格 (spec/spec_imperial)
- 产品ID (productId)
- 适配序列号 (app_sn)
- 单箱数量 (pcs_per_box)
```

### 包装信息字段
```
- 包装尺寸 cm/inch (package_size_cm/package_size_inch)
- 单件净重 kg/lbs (net_weight_kg/net_weight_lbs)
```

## 实现的组件

### 1. RequiredPartCartItem 组件

**严格按照展示逻辑的字段显示：**

```typescript
// 基础信息区域
- 适配机型: item.app_model
- 料号: item.part_number  
- 名称: item.name_zh/name_en
- 规格: item.spec/spec_imperial (根据用户区域选择)
- 适配序列号: item.app_sn
- 单箱数量: item.pcs_per_box

// 包装信息区域
- 包装尺寸: item.package_size_cm/package_size_inch (根据用户区域选择)
- 单件净重: item.net_weight_kg/net_weight_lbs (根据用户区域选择)
```

**公制/英制选择逻辑：**
```typescript
const isImperial = userRegion === 'na' || userRegion === 'au';
```

### 2. SparePartTooltip 组件

**严格按照展示逻辑的字段显示：**

```typescript
// 基础信息
- 适配机型: sparePart.app_model
- 规格: sparePart.spec/spec_imperial (根据用户区域选择)
- 适配序列号: sparePart.app_sn
- 单箱数量: sparePart.pcs_per_box

// 包装信息
- 包装尺寸: sparePart.package_size_cm/package_size_inch (根据用户区域选择)
- 单件净重: sparePart.net_weight_kg/net_weight_lbs (根据用户区域选择)
```

**移除的字段：**
- 毛重信息 (gross_weight_kg/gross_weight_lbs)
- 状态信息 (status)
- 计量单位 (unit)
- 产品类型 (is_consumable)

### 3. CartList 组件

**功能：**
- 分离主要商品和必选备件
- 为必选备件传递 `userRegion` 参数
- 提供必选备件说明文字

## 用户区域判断

```typescript
// 英制单位区域：北美(na)、澳洲(au)
const isImperial = userRegion === 'na' || userRegion === 'au';

// 公制单位区域：中国(cn)、欧洲(eu)等其他区域
const isMetric = !isImperial;
```

## 字段显示逻辑

### 规格显示
```typescript
// 根据用户区域选择显示的规格
const displaySpec = isImperial 
  ? (item.spec_imperial || item.spec) 
  : (item.spec || item.spec_imperial);
```

### 包装尺寸显示
```typescript
// 根据用户区域选择单位
const packageSize = isImperial 
  ? `${item.package_size_inch || 'N/A'} inch`
  : `${item.package_size_cm || 'N/A'} cm`;
```

### 重量显示
```typescript
// 根据用户区域选择单位
const netWeight = isImperial 
  ? `${item.net_weight_lbs || 'N/A'} lbs`
  : `${item.net_weight_kg || 'N/A'} kg`;
```

## 视觉设计

### 必选备件标识
- 橙色边框和背景 (`border-orange-400 bg-orange-50`)
- 橙色圆点标识 (`w-3 h-3 bg-orange-500 rounded-full`)
- 橙色文字 (`text-orange-600`)

### Tooltip设计
- 深色半透明背景 (`rgba(0, 0, 0, 0.95)`)
- 毛玻璃效果 (`backdropFilter: 'blur(8px)'`)
- 分层信息展示（基础信息、包装信息）
- 智能位置调整，避免超出屏幕边界

## 多语言支持

```typescript
// 中英文文本
const texts = {
  zh: {
    compatibleModel: '适配机型',
    partNumber: '料号',
    name: '名称',
    specification: '规格',
    compatibleSN: '适配序列号',
    pcsPerBox: '单箱数量',
    packageSize: '包装尺寸',
    netWeight: '单件净重',
    requiredPart: '必选备件',
    mainItem: '主商品'
  },
  en: {
    compatibleModel: 'Compatible Model',
    partNumber: 'Part Number',
    name: 'Name',
    specification: 'Specification',
    compatibleSN: 'Compatible S/N',
    pcsPerBox: 'Pcs per Box',
    packageSize: 'Package Size',
    netWeight: 'Net Weight',
    requiredPart: 'Required Part',
    mainItem: 'Main Item'
  }
};
```

## 总结

此实现严格遵循展示逻辑要求：

1. **字段完全对应**：只显示指定的字段，不增加不减少
2. **公制英制切换**：根据用户区域自动选择合适的单位
3. **组件独立性**：不影响现有列表和购物车代码
4. **视觉一致性**：必选备件有明确的橙色主题标识
5. **用户体验**：Tooltip提供详细信息，购物车提供完整展示

通过这种严格的实现方式，确保了功能的准确性和用户体验的一致性。 