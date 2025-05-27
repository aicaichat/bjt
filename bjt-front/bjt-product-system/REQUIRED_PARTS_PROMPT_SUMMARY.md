# 必选备件系统提示词总结

## 核心概念

**必选备件（Required Parts）**是指与主商品配套使用的必需组件，当用户购买主商品时，系统会自动添加相应的必选备件到购物车中。

## 数据库结构

### 关键表结构
```sql
-- 关系表：存储必选备件关系
wp_bjt_relations:
- required_parts: 必选备件料号列表（逗号分隔）
- required_quantity: 对应数量列表（逗号分隔）
- part_number: 主商品料号
- parent_part_number: 父级商品料号

-- 备件表：存储备件详细信息
wp_bjt_spare_parts:
- part_number: 备件料号
- app_model: 适配机型
- name_zh/name_en: 中英文名称
- spec/spec_imperial: 公制/英制规格
- app_sn: 适配序列号
- pcs_per_box: 单箱数量
- package_size_cm/package_size_inch: 包装尺寸
- net_weight_kg/net_weight_lbs: 单件净重
```

## 展示逻辑要求

### 严格展示字段（不可增减）

**基础信息字段：**
- 适配机型 (app_model)
- 产品图片 (image_url)
- 料号 (part_number)
- 名称 (name_zh/name_en)
- 规格 (spec/spec_imperial)
- 产品ID (productId)
- 适配序列号 (app_sn)
- 单箱数量 (pcs_per_box)

**包装信息字段：**
- 包装尺寸 cm/inch (package_size_cm/package_size_inch)
- 单件净重 kg/lbs (net_weight_kg/net_weight_lbs)

### 公制/英制切换规则
```typescript
// 英制区域：北美(na)、澳洲(au)
const isImperial = userRegion === 'na' || userRegion === 'au';

// 显示逻辑
const displaySpec = isImperial 
  ? (item.spec_imperial || item.spec) 
  : (item.spec || item.spec_imperial);

const packageSize = isImperial 
  ? `${item.package_size_inch || 'N/A'} inch`
  : `${item.package_size_cm || 'N/A'} cm`;

const netWeight = isImperial 
  ? `${item.net_weight_lbs || 'N/A'} lbs`
  : `${item.net_weight_kg || 'N/A'} kg`;
```

## 实现约束

### 严格遵循的原则
1. **不修改现有代码** - 保持列表代码和原购物车代码不变
2. **只针对必选备件** - 专门为必选备件创建独立组件
3. **严格字段控制** - 只显示指定字段，不随意增减
4. **区域自适应** - 根据用户区域自动选择公制/英制
5. **独立组件设计** - 不影响现有功能

### 禁止的操作
- ❌ 修改现有列表展示代码
- ❌ 修改原有购物车组件
- ❌ 添加未指定的展示字段
- ❌ 移除必需的展示字段
- ❌ 硬编码单位制式

## 组件架构

### 核心组件
```typescript
// 1. 必选备件购物车项目
RequiredPartCartItem: {
  props: {
    item: ExtendedCartItem & { is_required: true },
    userRegion: string, // 用于公制/英制判断
    language: 'zh' | 'en'
  }
}

// 2. 备件详情提示框
SparePartTooltip: {
  props: {
    sparePart: SparePart,
    userRegion: string, // 用于公制/英制判断
    language: 'zh' | 'en'
  }
}

// 3. 购物车列表容器
CartList: {
  功能: 分离主商品和必选备件，传递userRegion参数
}
```

### 数据流
```
主商品添加 → 解析required_parts → 查询备件详情 → 创建必选备件购物车项 → 自动添加到购物车
```

## 视觉设计规范

### 必选备件标识
- **主色调**: 橙色系 (`orange-400`, `orange-500`, `orange-600`)
- **边框**: 左侧橙色粗边框 (`border-l-4 border-orange-400`)
- **背景**: 浅橙色背景 (`bg-orange-50`)
- **标识**: 橙色圆点 (`w-3 h-3 bg-orange-500 rounded-full`)

### Tooltip设计
- **背景**: 深色半透明 (`rgba(0, 0, 0, 0.95)`)
- **效果**: 毛玻璃效果 (`backdropFilter: 'blur(8px)'`)
- **布局**: 分层信息展示（基础信息、包装信息）
- **定位**: 智能边界检测和位置调整

## 多语言文本

### 中英文对照
```typescript
const texts = {
  zh: {
    requiredPart: '必选备件',
    mainItem: '主商品',
    compatibleModel: '适配机型',
    partNumber: '料号',
    name: '名称',
    specification: '规格',
    compatibleSN: '适配序列号',
    pcsPerBox: '单箱数量',
    packageSize: '包装尺寸',
    netWeight: '单件净重',
    quantity: '数量',
    subtotal: '小计'
  },
  en: {
    requiredPart: 'Required Part',
    mainItem: 'Main Item',
    compatibleModel: 'Compatible Model',
    partNumber: 'Part Number',
    name: 'Name',
    specification: 'Specification',
    compatibleSN: 'Compatible S/N',
    pcsPerBox: 'Pcs per Box',
    packageSize: 'Package Size',
    netWeight: 'Net Weight',
    quantity: 'Quantity',
    subtotal: 'Subtotal'
  }
};
```

## 业务逻辑

### 必选备件解析
```typescript
// 解析必选备件字符串
const parseRequiredParts = (
  requiredParts: string,     // "05A0101289,05A0101290"
  requiredQuantity: string   // "2,2"
) => {
  const parts = requiredParts.split(',');
  const quantities = requiredQuantity.split(',').map(Number);
  return parts.map((part, index) => ({
    part_number: part.trim(),
    quantity: quantities[index] || 1
  }));
};
```

### 自动添加逻辑
```typescript
// 当主商品添加到购物车时，自动添加必选备件
const addMainProductWithRequiredParts = async (mainProduct, quantity) => {
  // 1. 添加主商品
  await addToCart(mainProduct, quantity);
  
  // 2. 解析并添加必选备件
  if (mainProduct.required_parts) {
    const requiredParts = parseRequiredParts(
      mainProduct.required_parts,
      mainProduct.required_quantity
    );
    
    for (const requiredPart of requiredParts) {
      const sparePartDetails = await fetchSparePartDetails(requiredPart.part_number);
      const cartItem = createRequiredPartCartItem(
        sparePartDetails,
        requiredPart.quantity * quantity,
        mainProduct.part_number
      );
      await addToCart(cartItem);
    }
  }
};
```

## 测试要点

### 功能测试
- ✅ 必选备件自动添加
- ✅ 公制/英制单位切换
- ✅ 多语言文本显示
- ✅ 购物车分组显示
- ✅ Tooltip信息展示

### 视觉测试
- ✅ 橙色主题标识
- ✅ 布局响应式适配
- ✅ 边界位置调整
- ✅ 交互状态反馈

### 数据测试
- ✅ 字段完整性验证
- ✅ 单位转换准确性
- ✅ 数量计算正确性
- ✅ 关联关系维护

## 错误处理

### 常见问题
1. **缺失字段**: 使用 `|| 'N/A'` 提供默认值
2. **单位缺失**: 优先显示用户区域对应单位，回退到另一单位
3. **图片加载失败**: 自动回退到占位图片
4. **数据解析错误**: 提供错误边界和用户友好提示

## 性能优化

### 关键点
- 使用 `React.memo` 优化组件渲染
- 使用 `useCallback` 稳定函数引用
- 实现数据缓存减少重复请求
- 智能加载避免不必要的API调用

这个提示词总结涵盖了必选备件系统的所有关键要求和实现细节，确保开发过程中严格遵循既定规范。 