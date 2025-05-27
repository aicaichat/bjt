# 备件页面购物车修复提示词 - BJT产品管理系统

## 概述

本提示词专门针对BJT产品管理系统中备件页面的购物车功能修复，包括数据结构优化、购物车侧边栏展示字段完善、以及备件特有的业务逻辑处理。

## 问题分析

### 1. 备件数据结构问题
- **数据字段不完整**: 备件页面添加到购物车时缺少关键字段
- **类型定义不匹配**: `SparePart`类型与购物车`ExtendedCartItem`类型字段映射不完整
- **必选备件关系**: 缺少必选备件(`required_parts`)的关联处理

### 2. 购物车侧边栏展示问题
- **备件专用字段缺失**: 购物车侧边栏未展示备件特有的字段
- **适配机型显示**: 缺少适配机型(`app_model`)的展示
- **适配序列号**: 缺少适配序列号(`app_sn`)的展示
- **易损件标识**: 缺少易损件(`is_consumable`)的标识

### 3. 业务逻辑问题
- **价格计算**: 备件价格层级计算不准确
- **库存状态**: 备件库存状态显示不完整
- **单位处理**: 备件单位(`unit`)处理不统一

## 需要准备的材料

### 1. 数据库字段映射表
基于API文档中的备件表结构(`wp_bjt_spare_parts`)：

| 数据库字段 | 前端字段 | 购物车展示 | 说明 |
|-----------|---------|-----------|------|
| `part_number` | `part_number` | ✅ 料号 | 主要标识 |
| `name_zh` | `name` | ✅ 名称 | 产品名称 |
| `app_model` | `app_model` | ✅ 适配机型 | 兼容的主机型号 |
| `image_url` | `image_url` | ✅ 产品图片 | 产品图片URL |
| `spec` | `spec` | ✅ 规格(公制) | 规格参数 |
| `spec_imperial` | `spec_imperial` | ✅ 规格(英制) | 英制规格参数 |
| `app_sn` | `app_sn` | ✅ 适配序列号 | 适用序列号范围 |
| `pcs_per_box` | `pcs_per_box` | ✅ 单箱数量 | 包装数量 |
| `is_consumable` | `is_consumable` | ✅ 易损件标识 | 是否为易损件 |
| `unit` | `unit` | ✅ 单位 | 计量单位 |
| `model` | `model` | ✅ 型号 | 备件型号 |

### 2. 备件购物车展示字段清单
根据文档要求，备件购物车需要展示的字段：

```typescript
interface SparePartCartDisplay {
  // 基本信息
  part_number: string;        // 料号
  name: string;              // 名称  
  image_url: string;         // 产品图片
  model: string;             // 型号
  
  // 规格信息
  spec: string;              // 规格(公制)
  spec_imperial: string;     // 规格(英制)
  
  // 适配信息
  app_model: string;         // 适配机型
  app_sn: string;           // 适配序列号
  
  // 包装信息
  pcs_per_box: number;      // 单箱数量
  unit: string;             // 单位
  
  // 产品属性
  is_consumable: boolean;   // 易损件标识
  product_id: number;       // 产品ID
  
  // 价格和数量
  quantity: number;         // 数量
  unit_price: number;       // 单价
  line_total: number;       // 小计
}
```

## 修复方案实施

### 1. 备件页面addToCart方法优化

**文件**: `frontend/src/pages/SpareParts/index.tsx`

**问题**: 当前addToCart方法缺少备件特有字段的完整映射

**解决方案**: 完善备件属性传递逻辑

```typescript
const addToCart = async (sparePart: SparePart, quantity = 1) => {
  try {
    // 提取备件特有的属性
    const sparePartProperties = {
      // 基本信息
      part_number: sparePart.part_number,
      productName: sparePart.name_zh || sparePart.name_en,
      model: sparePart.model,
      image_url: sparePart.image_url,
      
      // 规格信息
      spec: sparePart.spec,
      spec_imperial: sparePart.spec_imperial,
      
      // 适配信息
      app_model: sparePart.app_model,
      app_sn: sparePart.app_sn,
      
      // 包装信息
      pcs_per_box: sparePart.pcs_per_box,
      unit: sparePart.unit,
      
      // 产品属性
      is_consumable: sparePart.is_consumable,
      product_type: 'spare_part',
      
      // 必选备件信息
      required_parts: sparePart.required_parts,
      required_quantity: sparePart.required_quantity,
      
      // 包装规格
      package_size_cm: sparePart.package_size_cm,
      package_size_inch: sparePart.package_size_inch,
      net_weight_kg: sparePart.net_weight_kg,
      net_weight_lbs: sparePart.net_weight_lbs
    };

    // 计算价格
    const unitPrice = calculateFinalPrice(sparePart);
    
    // 构建购物车项目
    const cartItem: ExtendedCartItem = {
      // 基本购物车字段
      item_id: sparePart.id,
      product_type: 'spare_part',
      product_id: sparePart.id,
      part_number: sparePart.part_number,
      quantity: quantity,
      name: sparePart.name_zh || sparePart.name_en,
      image_url: sparePart.image_url,
      unit_price: unitPrice,
      currency: getCurrencySymbol(userRegion),
      line_total: unitPrice * quantity,
      inventory_status: 'in_stock',
      added_at: new Date().toISOString(),
      
      // 扩展字段
      id: sparePart.id.toString(),
      code: sparePart.part_number,
      partNumber: sparePart.part_number,
      image: sparePart.image_url,
      category: '备件',
      productId: sparePart.id,
      price: unitPrice,
      selected: true,
      type: 'spare_part',
      
      // 备件特有属性
      properties: sparePartProperties,
      specs: {
        part_number: sparePart.part_number,
        model: sparePart.model,
        app_model: sparePart.app_model,
        app_sn: sparePart.app_sn,
        spec: sparePart.spec,
        spec_imperial: sparePart.spec_imperial,
        pcs_per_box: sparePart.pcs_per_box,
        unit: sparePart.unit,
        is_consumable: sparePart.is_consumable
      }
    };

    await addItem(cartItem);
    success('备件已添加到购物车');
    
  } catch (error) {
    console.error('添加备件到购物车失败:', error);
    showErrorToast('添加失败', '添加备件到购物车时发生错误');
  }
};
```

### 2. 购物车侧边栏备件展示优化

**文件**: `frontend/src/components/Cart/CartSidebar.tsx`

**问题**: 缺少备件专用的详细信息展示组件

**解决方案**: 添加`renderSparePartDetails`函数

```typescript
// 渲染备件详细信息
const renderSparePartDetails = (item: any) => {
  const props = item.properties || {};
  const specs = item.specs || {};
  
  return (
    <div className="spare-part-details">
      {/* 基本信息 */}
      <div className="detail-section">
        <div className="detail-row">
          <span className="label">料号:</span>
          <span className="value">{props.part_number || item.part_number}</span>
        </div>
        <div className="detail-row">
          <span className="label">型号:</span>
          <span className="value">{props.model || specs.model}</span>
        </div>
        <div className="detail-row">
          <span className="label">产品ID:</span>
          <span className="value">{props.product_id || item.product_id}</span>
        </div>
      </div>

      {/* 适配信息 */}
      {(props.app_model || specs.app_model) && (
        <div className="detail-section">
          <div className="detail-row">
            <span className="label">适配机型:</span>
            <span className="value app-model">{props.app_model || specs.app_model}</span>
          </div>
        </div>
      )}

      {(props.app_sn || specs.app_sn) && (
        <div className="detail-row">
          <span className="label">适配序列号:</span>
          <span className="value app-sn">{props.app_sn || specs.app_sn}</span>
        </div>
      )}

      {/* 规格信息 */}
      <div className="detail-section">
        <div className="detail-row">
          <span className="label">规格:</span>
          <span className="value">
            {preferredUnit === 'metric' 
              ? (props.spec || specs.spec)
              : (props.spec_imperial || specs.spec_imperial || props.spec || specs.spec)
            }
          </span>
        </div>
      </div>

      {/* 包装信息 */}
      {(props.pcs_per_box || specs.pcs_per_box) && (
        <div className="detail-row">
          <span className="label">单箱数量:</span>
          <span className="value">{props.pcs_per_box || specs.pcs_per_box}</span>
        </div>
      )}

      {(props.unit || specs.unit) && (
        <div className="detail-row">
          <span className="label">单位:</span>
          <span className="value">{props.unit || specs.unit}</span>
        </div>
      )}

      {/* 易损件标识 */}
      {(props.is_consumable || specs.is_consumable) && (
        <div className="detail-row">
          <span className="label">类型:</span>
          <span className="value">
            <span className="consumable-badge">
              {(props.is_consumable || specs.is_consumable) ? '易损件' : '标准备件'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

// 在主渲染函数中添加备件类型判断
{item.product_type === 'spare_part' && renderSparePartDetails(item)}
```

### 3. CSS样式优化

**文件**: `frontend/src/components/Cart/CartSidebar.css`

**问题**: 缺少备件专用的样式定义

**解决方案**: 添加备件详情样式

```css
/* 备件详情样式 */
.spare-part-details {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.spare-part-details .detail-section {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.spare-part-details .detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.spare-part-details .detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  line-height: 1.4;
}

.spare-part-details .detail-row:last-child {
  margin-bottom: 0;
}

.spare-part-details .label {
  font-weight: 500;
  color: #333;
  min-width: 70px;
  flex-shrink: 0;
}

.spare-part-details .value {
  color: #666;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

/* 易损件标识样式 */
.consumable-badge {
  background: #fff2e8;
  color: #fa8c16;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* 适配信息特殊样式 */
.spare-part-details .value.app-model {
  font-family: monospace;
  font-size: 11px;
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
}

.spare-part-details .value.app-sn {
  font-family: monospace;
  font-size: 10px;
  color: #0969da;
}
```

## 测试验证清单

### 1. 功能测试
- [ ] 备件页面添加到购物车功能正常
- [ ] 购物车侧边栏正确显示备件信息
- [ ] 备件特有字段完整展示
- [ ] 易损件标识正确显示
- [ ] 适配机型和序列号正确展示

### 2. 数据完整性测试
- [ ] 所有必要字段都有值
- [ ] 价格计算正确
- [ ] 数量操作正常
- [ ] 删除功能正常

### 3. 用户体验测试
- [ ] 界面布局美观
- [ ] 响应速度正常
- [ ] 错误处理友好
- [ ] 多语言支持正常

## 维护说明

1. **字段映射维护**: 当数据库结构变更时，及时更新字段映射表
2. **类型定义同步**: 保持前端类型定义与后端API接口同步
3. **样式一致性**: 确保备件展示样式与其他产品类型保持一致
4. **性能监控**: 监控购物车操作的性能，特别是大量备件时的表现

## 相关文件清单

- `frontend/src/pages/SpareParts/index.tsx` - 备件页面主文件
- `frontend/src/types/spareParts.ts` - 备件类型定义
- `frontend/src/components/Cart/CartSidebar.tsx` - 购物车侧边栏
- `frontend/src/components/Cart/CartSidebar.css` - 购物车样式
- `frontend/src/contexts/CartContext.tsx` - 购物车上下文
- `frontend/src/api/services/cart.service.ts` - 购物车服务 