# 单位制智能切换功能使用指南

## 🎯 功能概述

基于现有的 `useAuth().getPreferredUnit()` 用户偏好设置，实现购物车系统中重量、尺寸、长度等字段的智能公制/英制切换，确保全球用户的最佳体验。

## 🚀 快速开始

### 1. 访问测试页面
```
http://localhost:5173/unit-system-test
```

### 2. 访问单位显示演示页面
```
http://localhost:5173/unit-display-demo
```

### 3. 访问购物车页面
```
http://localhost:5173/cart
```

## 🔧 核心组件

### 1. useSmartUnitSystem Hook
```typescript
import { useSmartUnitSystem } from '../hooks/useSmartUnitSystem';

const {
  preferredUnitSystem,     // 当前单位制 'metric' | 'imperial'
  toggleUnitSystem,        // 切换单位制函数
  resetToAccountSetting,   // 重置为账户设置
  isTemporaryOverride,     // 是否为临时切换
  accountUnitSetting       // 账户设置的单位制
} = useSmartUnitSystem();
```

### 2. UnitSystemToggle 组件
```typescript
import { UnitSystemToggle } from '../components/UnitSystemToggle';

<UnitSystemToggle 
  size="default"           // 'small' | 'default' | 'large'
  showLabel={true}         // 是否显示标签
  placement="top"          // Tooltip位置
/>
```

### 3. SmartFieldValue 组件
```typescript
import { SmartFieldValue } from '../components/SmartFieldValue';

<SmartFieldValue 
  product={product}        // 产品数据对象
  fieldKey="net_weight"    // 字段键名
  showUnit={true}          // 是否显示单位（默认true）
  precision={2}            // 数字精度
  className="font-bold"    // 自定义样式
/>
```

### 4. useSmartFieldMapping Hook
```typescript
import { useSmartFieldMapping } from '../hooks/useSmartFieldMapping';

const { getSmartFieldMapping, getFieldUnit, preferredUnitSystem } = useSmartFieldMapping();

// 获取智能映射的字段名
const targetField = getSmartFieldMapping('net_weight', product);
// 公制用户: 'net_weight_kg'
// 英制用户: 'net_weight_lbs'

// 获取字段对应的单位
const unit = getFieldUnit('net_weight_kg');  // 返回 'kg'
const unit2 = getFieldUnit('package_size_inch');  // 返回 'inch'
```

## 📋 支持的字段映射

### 机器字段
| 基础字段 | 公制字段 | 英制字段 | 说明 |
|---------|---------|---------|------|
| `net_weight` | `net_weight_kg` | `net_weight_lbs` | 净重 |
| `package_size` | `package_size_cm` | `package_size_inch` | 包装尺寸 |
| `pallet_size` | `pallet_size_cm` | `pallet_size_inch` | 托盘尺寸 |
| `stacking_height` | `stacking_height_cm` | `stacking_height_inch` | 打托高度 |
| `pallet_gross_weight` | `pallet_gross_weight_kg` | `pallet_gross_weight_lbs` | 整托毛重 |

### 耗材字段
| 基础字段 | 公制字段 | 英制字段 | 说明 |
|---------|---------|---------|------|
| `film_width` | `film_width_cm` | `film_width_inch` | 膜宽 |
| `bag_length` | `bag_length_cm` | `bag_length_inch` | 袋长 |
| `total_length` | `total_length_m` | `total_length_ft` | 总长 |
| `bubble_diameter` | `bubble_diameter_cm` | `bubble_diameter_inch` | 泡径 |
| `thickness` | `thickness_um` | `thickness_mil` | 厚度 |
| `core_diameter` | `core_diameter_cm` | `core_diameter_inch` | 纸筒内径 |

### 备件字段
| 基础字段 | 公制字段 | 英制字段 | 说明 |
|---------|---------|---------|------|
| `spec` | `spec` | `spec_imperial` | 规格 |

### 配件字段
| 基础字段 | 说明 |
|---------|------|
| `voltage` | 电压（无需转换） |
| `frequency` | 频率（无需转换） |

## 🏷️ 单位显示功能

### 自动单位添加
所有支持单位制切换的字段都会自动添加相应的单位标识：

| 字段类型 | 公制单位 | 英制单位 |
|---------|---------|---------|
| 重量 | kg, lbs | lbs |
| 尺寸 | cm | inch |
| 长度 | m | ft |
| 厚度 | μm | mil |
| 电压 | V | V |
| 频率 | Hz | Hz |

### 单位显示控制
```typescript
// 显示单位（默认）
<SmartFieldValue product={product} fieldKey="net_weight" showUnit={true} />
// 输出: "25.5kg" 或 "56.2lbs"

// 不显示单位
<SmartFieldValue product={product} fieldKey="net_weight" showUnit={false} />
// 输出: "25.5" 或 "56.2"

// 规格字段通常不显示单位
<SmartFieldValue product={product} fieldKey="spec" showUnit={false} />
// 输出: "AC 220V 50Hz 1.5kW"
```

## 🔄 工作原理

### 1. 单位制优先级
```
1. 手动临时设置（最高优先级）
   ↓
2. 用户账户设置（通过 useAuth().getPreferredUnit()）
   ↓
3. 默认公制（全球默认）
```

### 2. 字段选择逻辑
```typescript
// 1. 根据用户偏好选择目标字段
const targetField = isImperial ? 'net_weight_lbs' : 'net_weight_kg';

// 2. 检查目标字段是否存在且有值
if (product[targetField] !== undefined && product[targetField] !== null && product[targetField] !== '') {
  return targetField;
}

// 3. 如果目标字段不存在，尝试另一个单位制的字段
const fallbackField = isImperial ? 'net_weight_kg' : 'net_weight_lbs';
if (product[fallbackField] !== undefined && product[fallbackField] !== null && product[fallbackField] !== '') {
  return fallbackField;
}

// 4. 都不存在则返回基础字段名
return 'net_weight';
```

### 3. 临时切换机制
- 临时切换存储在 `sessionStorage` 中
- 页面刷新后保持临时设置
- 不影响用户账户设置
- 可以随时重置为账户设置

## 🎨 UI 集成

### 购物车页面集成
```typescript
// CartList.tsx 中的集成示例
const SmartField: React.FC<{ fieldKey: string; label: string }> = ({ fieldKey, label }) => (
  <div className="property-item">
    <span className="property-label">{label}:</span>
    <span className="property-value">
      <SmartFieldValue product={item} fieldKey={fieldKey} />
    </span>
  </div>
);

// 使用示例
<SmartField fieldKey="package_size" label={getLabel('packageSize', t)} />
<SmartField fieldKey="net_weight" label={getLabel('netWeight', t)} />
```

### 顶部控制栏
```typescript
{/* 顶部控制栏 */}
<div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
  {/* 全选栏 */}
  <div className="flex items-center">
    <input type="checkbox" ... />
    <span>{t('selectAll', {ns: 'cart'})}</span>
  </div>
  
  {/* 单位制切换 */}
  <div className="flex items-center gap-4">
    <span className="text-sm text-gray-600">
      {language === 'zh' ? '单位制' : 'Unit System'}:
    </span>
    <UnitSystemToggle size="small" showLabel={false} />
  </div>
</div>
```

## 🧪 测试验证

### 自动验证脚本
```javascript
// 在浏览器控制台中运行
validateUnitSystemSwitching();
```

### 手动测试步骤
1. 访问测试页面：`/unit-system-test`
2. 观察当前单位制状态
3. 点击单位制切换开关
4. 观察字段值的实时变化
5. 检查映射字段名的变化
6. 验证临时设置指示器

### 验证要点
- ✅ 单位制切换响应及时（<100ms）
- ✅ 字段映射正确（公制↔英制）
- ✅ 临时设置存储正常
- ✅ 账户设置同步
- ✅ 购物车页面集成完整

## 📱 移动端适配

### 响应式设计
```css
/* 移动端单位制切换 */
@media (max-width: 768px) {
  .unit-system-toggle {
    flex-direction: column;
    gap: 8px;
  }
  
  .unit-system-switch {
    transform: scale(0.9);
  }
}
```

### 触摸优化
- 切换按钮增大触摸区域
- Tooltip 在移动端自动调整位置
- 长按显示详细信息

## 🔧 配置选项

### 环境变量
```env
# 默认单位制（可选）
VITE_DEFAULT_UNIT_SYSTEM=metric

# 启用单位制切换（可选）
VITE_ENABLE_UNIT_SWITCHING=true
```

### 自定义配置
```typescript
// 在 CART_FIELD_CONFIGS 中添加新字段
export const CART_FIELD_CONFIGS = {
  'custom_field': {
    key: 'custom_field',
    unitConfig: {
      metric: 'custom_field_metric',
      imperial: 'custom_field_imperial'
    },
    priority: 'high',
    scenarios: ['cart-page']
  }
};
```

## 🚨 注意事项

### 数据要求
- 数据库中必须包含对应的公制和英制字段
- 字段值不能为 `null`、`undefined` 或空字符串
- 数字字段建议保留适当精度

### 性能考虑
- 字段映射使用 `useCallback` 优化
- 避免在渲染循环中重复计算
- 临时设置使用 `sessionStorage` 而非 `localStorage`

### 兼容性
- 支持所有现代浏览器
- 兼容现有认证系统
- 不影响现有数据结构

## 📞 技术支持

如有问题，请联系开发团队或查看：
- 项目文档：`docs/购物车系统实施指南/06-单位制智能切换.md`
- 测试页面：`/unit-system-test`
- 验证脚本：`public/unit-system-test.js` 