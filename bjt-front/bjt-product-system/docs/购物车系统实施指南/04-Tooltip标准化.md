# Tooltip标准化实现指南

## 🎯 Tooltip标准化目标

确保购物车页面和侧边栏购物车的Tooltip内容与各产品页面保持完全一致，提供统一的详细信息展示体验。

## 📋 Tooltip一致性要求

### 核心原则
1. **字段一致性** - Tooltip中的字段必须与对应产品页面的Tooltip完全一致
2. **数据一致性** - 字段值格式、单位显示与页面保持一致
3. **多语言一致性** - 中英文标签和内容同步
4. **智能单位制** - 根据用户地区偏好智能切换公制/英制

### 产品类型Tooltip字段映射

根据 `all-pages-display-fields.json` 的标准：

| 产品类型 | Tooltip字段数 | 关键字段 |
|---------|-------------|---------|
| 主机/机器 | 8个 | 包装尺寸、净重、打托高度、整托毛重 |
| 耗材 | 31个 | 材质、厚度、膜宽、袋长、包装信息等 |
| 备件 | 4个 | 包装尺寸、净重 |
| 配件 | 8个 | 包装尺寸、净重、打托高度、整托毛重 |

## 🔧 主机/机器Tooltip实现

### 字段配置
```typescript
export const MACHINE_TOOLTIP_CONFIG = {
  title: { zh: '产品详细信息', en: 'Product Details' },
  fields: [
    {
      key: 'package_size_cm',
      group: 'dimensions',
      priority: 1,
      smartUnit: {
        metric: 'package_size_cm',
        imperial: 'package_size_inch'
      }
    },
    {
      key: 'package_size_inch', 
      group: 'dimensions',
      priority: 2,
      smartUnit: {
        metric: 'package_size_cm',
        imperial: 'package_size_inch'
      }
    },
    {
      key: 'net_weight_kg',
      group: 'weight',
      priority: 3,
      smartUnit: {
        metric: 'net_weight_kg',
        imperial: 'net_weight_lbs'
      }
    },
    {
      key: 'net_weight_lbs',
      group: 'weight',
      priority: 4,
      smartUnit: {
        metric: 'net_weight_kg',
        imperial: 'net_weight_lbs'
      }
    },
    {
      key: 'stacking_height_cm',
      group: 'pallet',
      priority: 5,
      smartUnit: {
        metric: 'stacking_height_cm',
        imperial: 'stacking_height_inch'
      }
    },
    {
      key: 'stacking_height_inch',
      group: 'pallet',
      priority: 6,
      smartUnit: {
        metric: 'stacking_height_cm',
        imperial: 'stacking_height_inch'
      }
    },
    {
      key: 'pallet_gross_weight_kg',
      group: 'pallet',
      priority: 7,
      smartUnit: {
        metric: 'pallet_gross_weight_kg',
        imperial: 'pallet_gross_weight_lbs'
      }
    },
    {
      key: 'pallet_gross_weight_lbs',
      group: 'pallet',
      priority: 8,
      smartUnit: {
        metric: 'pallet_gross_weight_kg',
        imperial: 'pallet_gross_weight_lbs'
      }
    }
  ],
  groupOrder: ['dimensions', 'weight', 'pallet']
};
```

### 组件实现
```typescript
import React from 'react';
import { Tooltip } from 'antd';
import { useCartFieldDisplay } from '../hooks/useCartFieldDisplay';
import { useSmartUnitSystem } from '../hooks/useSmartUnitSystem';

interface MachineTooltipProps {
  machine: Machine;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight';
}

export const MachineTooltip: React.FC<MachineTooltipProps> = ({
  machine,
  children,
  placement = 'topRight'
}) => {
  const { formatFieldsForTooltip } = useCartFieldDisplay({
    productType: 'machine',
    scenario: 'cart-tooltip'
  });
  
  const { preferredUnitSystem } = useSmartUnitSystem();
  
  const tooltipFields = formatFieldsForTooltip(machine, MACHINE_TOOLTIP_CONFIG);
  
  const renderTooltipContent = () => {
    return (
      <div className="cart-tooltip-content">
        <div className="tooltip-title">
          {MACHINE_TOOLTIP_CONFIG.title.zh}
        </div>
        
        {MACHINE_TOOLTIP_CONFIG.groupOrder.map(groupKey => {
          const groupFields = tooltipFields.filter(field => field.group === groupKey);
          if (groupFields.length === 0) return null;
          
          return (
            <div key={groupKey} className="tooltip-group">
              <div className="group-title">
                {getGroupTitle(groupKey)}
              </div>
              <div className="group-fields">
                {groupFields.map(field => (
                  <div key={field.key} className="tooltip-field-item">
                    <span className="field-label">{field.label}:</span>
                    <span className="field-value">{field.formattedValue}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <Tooltip
      title={renderTooltipContent()}
      placement={placement}
      overlayClassName="cart-tooltip-overlay"
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.1}
    >
      {children}
    </Tooltip>
  );
};

const getGroupTitle = (groupKey: string) => {
  const groupTitles = {
    zh: {
      dimensions: '包装尺寸',
      weight: '重量信息', 
      pallet: '托盘信息'
    },
    en: {
      dimensions: 'Package Dimensions',
      weight: 'Weight Information',
      pallet: 'Pallet Information'
    }
  };
  
  return groupTitles.zh[groupKey]; // 根据当前语言返回
};
```

## 🧴 耗材Tooltip实现（精简版）

### 字段配置（核心字段）
```typescript
export const CONSUMABLE_TOOLTIP_CONFIG = {
  title: { zh: '耗材详细信息', en: 'Consumable Details' },
  fields: [
    // 材质组
    {
      key: 'material',
      group: 'material',
      priority: 1
    },
    {
      key: 'thickness_um',
      group: 'material',
      priority: 2,
      smartUnit: {
        metric: 'thickness_um',
        imperial: 'thickness_mil'
      }
    },
    {
      key: 'thickness_mil',
      group: 'material',
      priority: 3,
      smartUnit: {
        metric: 'thickness_um',
        imperial: 'thickness_mil'
      }
    },
    
    // 尺寸组
    {
      key: 'film_width_cm',
      group: 'dimensions',
      priority: 4,
      smartUnit: {
        metric: 'film_width_cm',
        imperial: 'film_width_inch'
      }
    },
    {
      key: 'film_width_inch',
      group: 'dimensions',
      priority: 5,
      smartUnit: {
        metric: 'film_width_cm',
        imperial: 'film_width_inch'
      }
    },
    {
      key: 'bag_length_cm',
      group: 'dimensions',
      priority: 6,
      smartUnit: {
        metric: 'bag_length_cm',
        imperial: 'bag_length_inch'
      }
    },
    {
      key: 'bag_length_inch',
      group: 'dimensions',
      priority: 7,
      smartUnit: {
        metric: 'bag_length_cm',
        imperial: 'bag_length_inch'
      }
    },
    
    // 长度组
    {
      key: 'total_length_m',
      group: 'length',
      priority: 8,
      smartUnit: {
        metric: 'total_length_m',
        imperial: 'total_length_ft'
      }
    },
    {
      key: 'total_length_ft',
      group: 'length',
      priority: 9,
      smartUnit: {
        metric: 'total_length_m',
        imperial: 'total_length_ft'
      }
    },
    
    // 包装组（继承机器配置）
    ...MACHINE_TOOLTIP_CONFIG.fields.filter(field => 
      ['package_size_cm', 'package_size_inch', 'net_weight_kg', 'net_weight_lbs'].includes(field.key)
    ).map(field => ({ ...field, group: 'packaging' }))
  ],
  groupOrder: ['material', 'dimensions', 'length', 'packaging']
};
```

### 耗材Tooltip组件
```typescript
export const ConsumableTooltip: React.FC<{
  consumable: Consumable;
  children: React.ReactNode;
  placement?: TooltipPlacement;
}> = ({ consumable, children, placement = 'topRight' }) => {
  const { formatFieldsForTooltip } = useCartFieldDisplay({
    productType: 'consumable',
    scenario: 'cart-tooltip'
  });
  
  const tooltipFields = formatFieldsForTooltip(consumable, CONSUMABLE_TOOLTIP_CONFIG);
  
  const renderTooltipContent = () => {
    return (
      <div className="cart-tooltip-content consumable-tooltip">
        <div className="tooltip-title">
          {CONSUMABLE_TOOLTIP_CONFIG.title.zh}
        </div>
        
        {CONSUMABLE_TOOLTIP_CONFIG.groupOrder.map(groupKey => {
          const groupFields = tooltipFields.filter(field => 
            field.group === groupKey && field.formattedValue // 只显示有值的字段
          );
          
          if (groupFields.length === 0) return null;
          
          return (
            <div key={groupKey} className="tooltip-group">
              <div className="group-title">
                {getConsumableGroupTitle(groupKey)}
              </div>
              <div className="group-fields">
                {groupFields.map(field => (
                  <div key={field.key} className="tooltip-field-item">
                    <span className="field-label">{field.label}:</span>
                    <span className="field-value">{field.formattedValue}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <Tooltip
      title={renderTooltipContent()}
      placement={placement}
      overlayClassName="cart-tooltip-overlay consumable-tooltip-overlay"
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.1}
    >
      {children}
    </Tooltip>
  );
};

const getConsumableGroupTitle = (groupKey: string) => {
  const groupTitles = {
    zh: {
      material: '材质信息',
      dimensions: '尺寸规格',
      length: '长度信息',
      packaging: '包装信息'
    },
    en: {
      material: 'Material Info',
      dimensions: 'Dimensions',
      length: 'Length Info', 
      packaging: 'Packaging Info'
    }
  };
  
  return groupTitles.zh[groupKey];
};
```

## 🔧 备件Tooltip实现

### 字段配置（简化）
```typescript
export const SPARE_PART_TOOLTIP_CONFIG = {
  title: { zh: '备件详细信息', en: 'Spare Part Details' },
  fields: [
    {
      key: 'package_size_cm',
      group: 'packaging',
      priority: 1,
      smartUnit: {
        metric: 'package_size_cm',
        imperial: 'package_size_inch'
      }
    },
    {
      key: 'package_size_inch',
      group: 'packaging', 
      priority: 2,
      smartUnit: {
        metric: 'package_size_cm',
        imperial: 'package_size_inch'
      }
    },
    {
      key: 'net_weight_kg',
      group: 'packaging',
      priority: 3,
      smartUnit: {
        metric: 'net_weight_kg',
        imperial: 'net_weight_lbs'
      }
    },
    {
      key: 'net_weight_lbs',
      group: 'packaging',
      priority: 4,
      smartUnit: {
        metric: 'net_weight_kg',
        imperial: 'net_weight_lbs'
      }
    }
  ],
  groupOrder: ['packaging']
};
```

### 备件Tooltip组件
```typescript
export const SparePartTooltip: React.FC<{
  sparePart: SparePart;
  children: React.ReactNode;
  placement?: TooltipPlacement;
}> = ({ sparePart, children, placement = 'topRight' }) => {
  const { formatFieldsForTooltip } = useCartFieldDisplay({
    productType: 'spare_part',
    scenario: 'cart-tooltip'
  });
  
  const tooltipFields = formatFieldsForTooltip(sparePart, SPARE_PART_TOOLTIP_CONFIG);
  
  const renderTooltipContent = () => {
    return (
      <div className="cart-tooltip-content spare-part-tooltip">
        <div className="tooltip-title">
          {SPARE_PART_TOOLTIP_CONFIG.title.zh}
        </div>
        
        <div className="tooltip-group">
          <div className="group-title">包装信息</div>
          <div className="group-fields">
            {tooltipFields.filter(field => field.formattedValue).map(field => (
              <div key={field.key} className="tooltip-field-item">
                <span className="field-label">{field.label}:</span>
                <span className="field-value">{field.formattedValue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Tooltip
      title={renderTooltipContent()}
      placement={placement}
      overlayClassName="cart-tooltip-overlay spare-part-tooltip-overlay"
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.1}
    >
      {children}
    </Tooltip>
  );
};
```

## ⚙️ 配件Tooltip实现

### 配件Tooltip组件（继承主机配置）
```typescript
export const AccessoryTooltip: React.FC<{
  accessory: Accessory;
  children: React.ReactNode;
  placement?: TooltipPlacement;
}> = ({ accessory, children, placement = 'topRight' }) => {
  // 配件使用与主机相同的Tooltip字段配置
  const { formatFieldsForTooltip } = useCartFieldDisplay({
    productType: 'accessory',
    scenario: 'cart-tooltip'
  });
  
  const tooltipFields = formatFieldsForTooltip(accessory, {
    ...MACHINE_TOOLTIP_CONFIG,
    title: { zh: '配件详细信息', en: 'Accessory Details' }
  });
  
  // 渲染逻辑与MachineTooltip相同
  return (
    <MachineTooltip 
      machine={accessory} 
      placement={placement}
    >
      {children}
    </MachineTooltip>
  );
};
```

## 🔄 统一Tooltip Hook

### useTooltipFields Hook
```typescript
import { useMemo } from 'react';
import { useSmartUnitSystem } from './useSmartUnitSystem';
import { useCartFieldDisplay } from './useCartFieldDisplay';

export const useTooltipFields = (
  product: any,
  productType: ProductType,
  tooltipConfig: TooltipConfig
) => {
  const { preferredUnitSystem } = useSmartUnitSystem();
  const { getFieldLabel, formatFieldValue } = useCartFieldDisplay({
    productType,
    scenario: 'cart-tooltip'
  });
  
  const formattedFields = useMemo(() => {
    return tooltipConfig.fields
      .map(fieldConfig => {
        // 智能单位制字段选择
        const targetField = fieldConfig.smartUnit 
          ? fieldConfig.smartUnit[preferredUnitSystem]
          : fieldConfig.key;
        
        const rawValue = product[targetField];
        if (!rawValue && rawValue !== 0) return null; // 过滤空值
        
        return {
          key: fieldConfig.key,
          targetField,
          group: fieldConfig.group,
          priority: fieldConfig.priority,
          label: getFieldLabel(targetField),
          formattedValue: formatFieldValue(rawValue, targetField),
          rawValue
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.priority - b.priority);
  }, [product, tooltipConfig, preferredUnitSystem, getFieldLabel, formatFieldValue]);
  
  return formattedFields;
};
```

## 🎨 Tooltip样式标准

### CSS样式规范
```css
/* 购物车Tooltip基础样式 */
.cart-tooltip-overlay {
  max-width: 360px;
  z-index: 1060;
}

.cart-tooltip-content {
  padding: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.tooltip-group {
  margin-bottom: 8px;
}

.tooltip-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-weight: 500;
  font-size: 12px;
  color: #bfbfbf;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-fields {
  display: grid;
  gap: 3px;
}

.tooltip-field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1px 0;
}

.field-label {
  color: #d9d9d9;
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.field-value {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-align: right;
  flex-grow: 1;
}

/* 产品类型特定样式 */
.consumable-tooltip-overlay {
  max-width: 420px; /* 耗材字段较多，增加宽度 */
}

.consumable-tooltip .group-fields {
  grid-template-columns: 1fr;
  gap: 2px;
}

.spare-part-tooltip-overlay {
  max-width: 280px; /* 备件字段较少，减少宽度 */
}

/* 响应式适配 */
@media (max-width: 768px) {
  .cart-tooltip-overlay {
    max-width: 280px;
  }
  
  .cart-tooltip-content {
    padding: 10px;
    font-size: 12px;
  }
  
  .tooltip-title {
    font-size: 13px;
    margin-bottom: 6px;
  }
  
  .field-label,
  .field-value {
    font-size: 11px;
  }
}
```

## 🔄 购物车集成示例

### 购物车页面集成
```typescript
// 购物车页面中的商品卡片
const CartItemCard: React.FC<{ item: CartItem }> = ({ item }) => {
  const renderTooltip = () => {
    switch (item.productType) {
      case 'machine':
        return (
          <MachineTooltip machine={item}>
            <InfoCircleOutlined className="info-icon" />
          </MachineTooltip>
        );
      case 'consumable':
        return (
          <ConsumableTooltip consumable={item}>
            <InfoCircleOutlined className="info-icon" />
          </ConsumableTooltip>
        );
      case 'spare_part':
        return (
          <SparePartTooltip sparePart={item}>
            <InfoCircleOutlined className="info-icon" />
          </SparePartTooltip>
        );
      case 'accessory':
        return (
          <AccessoryTooltip accessory={item}>
            <InfoCircleOutlined className="info-icon" />
          </AccessoryTooltip>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="cart-item-card">
      <div className="item-header">
        <img src={item.image_url} alt={item.name} />
        <div className="item-info">
          <h3>{item.name}</h3>
          <p>{item.part_number}</p>
        </div>
        <div className="item-actions">
          {renderTooltip()}
        </div>
      </div>
      {/* 其他购物车项内容 */}
    </div>
  );
};
```

### 侧边栏购物车集成
```typescript
// 侧边栏购物车中的简化商品项
const SidebarCartItem: React.FC<{ item: CartItem }> = ({ item }) => {
  const getTooltipComponent = () => {
    const tooltipMap = {
      'machine': MachineTooltip,
      'consumable': ConsumableTooltip,
      'spare_part': SparePartTooltip,
      'accessory': AccessoryTooltip
    };
    
    return tooltipMap[item.productType];
  };
  
  const TooltipComponent = getTooltipComponent();
  
  return (
    <div className="sidebar-cart-item">
      <TooltipComponent 
        {...{ [item.productType]: item }}
        placement="left"
      >
        <div className="item-content">
          <img src={item.image_url} alt={item.name} className="item-image" />
          <div className="item-details">
            <div className="item-name">{item.name}</div>
            <div className="item-part-number">{item.part_number}</div>
            <div className="item-quantity">数量: {item.quantity}</div>
          </div>
        </div>
      </TooltipComponent>
    </div>
  );
};
```

## 🧪 Tooltip一致性验证

### 验证脚本
```javascript
// 在浏览器控制台运行，验证Tooltip字段一致性
const validateTooltipConsistency = () => {
  console.log('🔍 开始验证购物车Tooltip一致性...');
  
  const validationTests = [
    {
      name: '主机Tooltip字段一致性',
      test: () => {
        const expectedFields = [
          'package_size_cm', 'package_size_inch',
          'net_weight_kg', 'net_weight_lbs',
          'stacking_height_cm', 'stacking_height_inch',
          'pallet_gross_weight_kg', 'pallet_gross_weight_lbs'
        ];
        
        const tooltipElements = document.querySelectorAll('.cart-machine .tooltip-field-item');
        const actualFields = Array.from(tooltipElements).map(el => 
          el.getAttribute('data-field')
        ).filter(Boolean);
        
        const missingFields = expectedFields.filter(field => !actualFields.includes(field));
        const extraFields = actualFields.filter(field => !expectedFields.includes(field));
        
        console.log(`主机Tooltip字段检查:`);
        console.log(`  期望字段: ${expectedFields.length}个`);
        console.log(`  实际字段: ${actualFields.length}个`);
        console.log(`  缺失字段: ${missingFields.length}个`, missingFields);
        console.log(`  多余字段: ${extraFields.length}个`, extraFields);
        
        return missingFields.length === 0 && extraFields.length === 0;
      }
    },
    
    {
      name: 'Tooltip单位显示一致性',
      test: () => {
        const tooltipLabels = document.querySelectorAll('.tooltip-field-item .field-label');
        const incorrectUnits = [];
        
        tooltipLabels.forEach(label => {
          const text = label.textContent || '';
          
          // 检查重量字段标题是否包含单位
          if (text.includes('净重') || text.includes('毛重') || text.includes('Weight')) {
            if (!text.includes('(kg)') && !text.includes('(lbs)')) {
              incorrectUnits.push(`重量字段缺少单位: ${text}`);
            }
          }
          
          // 检查尺寸字段标题是否包含单位
          if (text.includes('尺寸') || text.includes('高度') || text.includes('Size') || text.includes('Height')) {
            if (!text.includes('(cm)') && !text.includes('(inch)')) {
              incorrectUnits.push(`尺寸字段缺少单位: ${text}`);
            }
          }
        });
        
        console.log(`Tooltip单位显示检查:`);
        console.log(`  检查字段: ${tooltipLabels.length}个`);
        console.log(`  单位错误: ${incorrectUnits.length}个`, incorrectUnits);
        
        return incorrectUnits.length === 0;
      }
    },
    
    {
      name: 'Tooltip内容值一致性',
      test: () => {
        const tooltipValues = document.querySelectorAll('.tooltip-field-item .field-value');
        const inconsistentValues = [];
        
        tooltipValues.forEach(value => {
          const text = value.textContent?.trim() || '';
          const fieldType = value.closest('.tooltip-field-item')?.getAttribute('data-field-type');
          
          // 检查数值字段是否包含不应该有的单位
          if (fieldType === 'numeric' && text) {
            const hasUnit = /\s*(kg|lbs|cm|inch|件|pcs)$/i.test(text);
            if (hasUnit) {
              inconsistentValues.push(`数值字段包含单位: ${text}`);
            }
          }
          
          // 检查空值处理
          if (text === 'undefined' || text === 'null' || text === 'NaN') {
            inconsistentValues.push(`值处理错误: ${text}`);
          }
        });
        
        console.log(`Tooltip内容值检查:`);
        console.log(`  检查值: ${tooltipValues.length}个`);
        console.log(`  不一致值: ${inconsistentValues.length}个`, inconsistentValues);
        
        return inconsistentValues.length === 0;
      }
    }
  ];
  
  let passedTests = 0;
  validationTests.forEach(test => {
    try {
      const result = test.test();
      const status = result ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${test.name}`);
      if (result) passedTests++;
    } catch (error) {
      console.error(`❌ ${test.name} - 测试异常:`, error);
    }
  });
  
  const successRate = (passedTests / validationTests.length) * 100;
  console.log(`\n📊 Tooltip一致性验证结果: ${passedTests}/${validationTests.length} (${successRate.toFixed(1)}%)`);
  
  if (successRate === 100) {
    console.log('🎉 购物车Tooltip一致性验证通过！');
  } else {
    console.log('⚠️  购物车Tooltip存在一致性问题，需要修复');
  }
  
  return successRate >= 90;
};

// 运行验证
validateTooltipConsistency();
```

## 📋 实施检查清单

### 开发阶段检查
- [ ] 所有产品类型的Tooltip配置已创建
- [ ] Tooltip字段与 `all-pages-display-fields.json` 完全一致
- [ ] 智能单位制切换正常工作
- [ ] 多语言标签正确显示
- [ ] 字段值格式化正确（纯数值，无重复单位）

### 测试阶段检查
- [ ] 运行Tooltip一致性验证脚本通过
- [ ] 在不同设备上测试Tooltip显示
- [ ] 测试多语言切换功能
- [ ] 测试智能单位制切换
- [ ] 性能测试（大量商品时Tooltip响应速度）

### 发布前检查
- [ ] 所有产品类型的Tooltip在购物车页面正常显示
- [ ] 侧边栏购物车Tooltip正常显示
- [ ] 与对应产品页面的Tooltip内容完全一致
- [ ] 样式在所有支持的浏览器中正常
- [ ] 无JavaScript错误和性能问题

---

这个Tooltip标准化方案确保了：
- **完全一致性** - 购物车Tooltip与产品页面Tooltip内容完全同步
- **智能显示** - 根据用户偏好智能选择单位制和语言
- **组件化复用** - 统一的Tooltip组件架构，易于维护
- **性能优化** - 合理的缓存和渲染优化策略
- **用户体验** - 清晰的信息层次和响应式适配