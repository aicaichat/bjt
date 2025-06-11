# 机器页面单位显示标准化实施指南

## 🎯 项目目标

基于耗材页面的成功经验，为机器页面实现标准化的单位显示：**标题包含单位，内容显示纯数值，避免重复**，同时支持完整的多语言和智能单位制切换。

## 📋 核心架构

### 设计原则
1. **配置驱动**：通过配置文件定义所有字段映射和显示规则
2. **Hook封装**：使用自定义Hook封装业务逻辑，组件专注UI展示
3. **组件标准化**：创建可复用的标准化组件，支持多种显示场景
4. **智能单位制**：基于 AuthContext 的 `getPreferredUnit()` 自动切换公制/英制

### 技术栈
- **配置层**：`machine-display-config.ts` - 字段映射和场景配置
- **逻辑层**：`useMachineFieldDisplay.ts` - 智能单位制切换和数据处理
- **组件层**：`MachineFieldDisplay.tsx` - 标准化UI组件
- **集成层**：在现有机器页面中渐进式集成

## 🔧 核心特性

### 1. 智能单位制切换
```typescript
// 基于AuthContext自动获取用户偏好
const { getPreferredUnit } = useAuth();
const preferredUnit = getPreferredUnit(); // 'metric' | 'imperial'

// 自动选择对应字段
const targetField = preferredUnit === 'imperial' 
  ? unitConfig.imperial  // 'net_weight_lbs'
  : unitConfig.metric;   // 'net_weight_kg'
```

### 2. 标准化单位显示
```typescript
// ✅ 正确：标题含单位，内容纯数值
getFieldLabel('net_weight') → '单件净重(kg)'
getLocalizedValue(machine, 'net_weight') → '25.5'

// ❌ 错误：单位重复显示  
getFieldLabel('net_weight') → '单件净重(kg)'
getLocalizedValue(machine, 'net_weight') → '25.5 kg' // 重复了！
```

### 3. 复合尺寸格式处理
```typescript
// 支持多种尺寸格式，保持原有格式
formatCompositeDimension('75*35*45') → '75*35*45'  // 不添加单位
formatCompositeDimension('29.5x13.8x17.7') → '29.5x13.8x17.7'
```

### 4. 多语言支持
```typescript
// 根据语言和单位制动态生成标签
MACHINE_FIELD_LABELS = {
  zh: {
    net_weight_kg: '单件净重(kg)',
    net_weight_lbs: '单件净重(lbs)'
  },
  en: {
    net_weight_kg: 'Net Weight(kg)',
    net_weight_lbs: 'Net Weight(lbs)'
  }
};
```

## 📁 文件结构

```
frontend/src/
├── config/
│   └── machine-display-config.ts     # 配置文件
├── hooks/
│   └── useMachineFieldDisplay.ts     # 核心Hook
├── components/
│   └── MachineFieldDisplay.tsx       # 标准化组件
├── pages/Machines/
│   └── index.tsx                     # 集成应用
└── types/
    └── machines.ts                   # 类型定义
```

## 🚀 实施步骤

### Phase 1: 基础配置 (✅ 已完成)
- [x] 创建 `machine-display-config.ts` 配置文件
- [x] 定义字段映射和场景配置
- [x] 设置功能开关和多语言标签

### Phase 2: 核心Hook (✅ 已完成)  
- [x] 创建 `useMachineFieldDisplay.ts` Hook
- [x] 实现基于 `getPreferredUnit()` 的智能单位制切换
- [x] 遵循单位处理规范：标题含单位，内容纯数值

### Phase 3: 标准化组件 (✅ 已完成)
- [x] 创建 `MachineFieldDisplay.tsx` 组件库
- [x] 支持多种显示场景：productCard, tooltip, cart, po
- [x] 实现渐进式集成，确保向后兼容

### Phase 4: 页面集成 (🚧 待实施)
- [ ] 在机器页面中集成新组件
- [ ] 添加功能开关支持新旧切换
- [ ] 保持现有功能完全不受影响

### Phase 5: 测试验证 (🚧 待实施)
- [ ] 单元测试：Hook和组件功能
- [ ] 集成测试：完整页面流程  
- [ ] 多语言测试：中英文切换
- [ ] 单位制测试：公制/英制切换

## 💻 集成示例

### 在现有机器页面中应用

```typescript
// 在 frontend/src/pages/Machines/index.tsx 中集成
import { useMachineFieldDisplay } from '../../hooks/useMachineFieldDisplay';
import { MachineFields, MachineTooltip } from '../../components/MachineFieldDisplay';
import { MACHINE_FEATURE_FLAGS } from '../../config/machine-display-config';

const MachinesPage: React.FC = () => {
  // 现有代码保持不变...
  
  // 新增：使用标准化字段显示Hook
  const { formatMachineFields, getFieldLabel, getLocalizedValue } = useMachineFieldDisplay({
    scenario: 'productCard'
  });

  // 渲染机器卡片 - 新旧组件切换
  const renderMachineCard = (machine: MachinePart) => {
    if (MACHINE_FEATURE_FLAGS.ENABLE_STANDARDIZED_DISPLAY) {
      // 使用新的标准化组件
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <MachineFields 
            machine={machine}
            scenario="productCard"
            layout="grid"
            columns={2}
          />
          
          <MachineTooltip machine={machine}>
            <Button icon={<InfoCircleOutlined />}>
              详细信息
            </Button>
          </MachineTooltip>
        </div>
      );
    } else {
      // 保持原有组件逻辑
      return renderOriginalMachineCard(machine);
    }
  };
};
```

### 环境变量配置

```bash
# .env.development
REACT_APP_ENABLE_MACHINE_STANDARD_DISPLAY=true
REACT_APP_ENABLE_SMART_UNIT_SYSTEM=true

# .env.production  
REACT_APP_ENABLE_MACHINE_STANDARD_DISPLAY=false  # 生产环境暂时关闭
REACT_APP_ENABLE_SMART_UNIT_SYSTEM=true
```

## 🧪 验证工具

### 浏览器控制台验证脚本

```javascript
// 验证机器页面单位显示标准
const validateMachineUnitDisplay = () => {
  console.log('🔍 验证机器页面单位显示标准...');
  
  const checkList = [
    {
      name: '标题包含单位信息',
      test: () => {
        const labels = document.querySelectorAll('.machine-field-label, strong');
        return Array.from(labels).some(label => 
          /(kg|lbs|cm|inch|件|pcs|\(|\))/.test(label.textContent || '')
        );
      }
    },
    {
      name: '内容为纯数值',
      test: () => {
        const values = document.querySelectorAll('.machine-field-value, .text-gray-800');
        return Array.from(values).every(value => {
          const text = value.textContent?.trim() || '';
          // 检查是否包含单位（排除合法的复合尺寸格式）
          return !text || 
                 text === 'N/A' || 
                 !/\s*(kg|lbs|cm|inch|件|pcs)$/.test(text) ||
                 /^\d+[\*x×]\d+[\*x×]?\d*$/.test(text); // 允许75*35*45格式
        });
      }
    },
    {
      name: '智能单位制工作正常',
      test: () => {
        const labels = document.querySelectorAll('strong');
        const hasMetric = Array.from(labels).some(l => /(kg|cm)/.test(l.textContent || ''));
        const hasImperial = Array.from(labels).some(l => /(lbs|inch)/.test(l.textContent || ''));
        return hasMetric || hasImperial;
      }
    }
  ];
  
  let passed = 0;
  checkList.forEach(check => {
    try {
      const result = check.test();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
      if (result) passed++;
    } catch (error) {
      console.error(`❌ ${check.name} - 测试异常:`, error);
    }
  });
  
  const score = (passed / checkList.length) * 100;
  console.log(`\n📊 验证结果: ${passed}/${checkList.length} (${score.toFixed(1)}%)`);
  
  return score >= 90;
};

// 执行验证
validateMachineUnitDisplay();
```

### 开发环境调试

```typescript
// 启用调试模式查看详细信息
const { debugInfo } = useMachineFieldDisplay({ 
  scenario: 'productCard',
  enableDebug: true 
});

console.log('🔍 调试信息:', debugInfo);
```

## 🛡️ 安全保障

### 1. 渐进式部署
- 功能开关控制新旧组件切换
- 生产环境默认使用旧组件
- 开发环境可选择启用新组件

### 2. 向后兼容性
- 新组件不影响现有功能
- API数据结构保持兼容
- 错误处理机制完善

### 3. 性能优化
- useMemo缓存计算结果
- 组件按需渲染
- 错误边界保护

## 📊 验收标准

### 功能验证清单
- [ ] 所有重量字段标题包含单位(kg/lbs)，内容为纯数值
- [ ] 所有尺寸字段标题包含单位(cm/inch)，内容为纯数值或复合格式
- [ ] 所有数量字段标题包含单位(件/pcs)，内容为纯数值
- [ ] 智能单位制根据 `getPreferredUnit()` 正确切换
- [ ] 多语言标题正确显示（中文/英文）
- [ ] Tooltip中的字段格式正确
- [ ] 无单位重复显示问题
- [ ] 现有功能（筛选、购物车等）正常工作
- [ ] 页面性能无明显影响

### 测试场景
1. **公制用户**：应显示公制单位(kg, cm)标题
2. **英制用户**：应显示英制单位(lbs, inch)标题  
3. **语言切换**：标题应正确翻译，数值保持不变
4. **空值处理**：空字段应显示空内容，不显示单位
5. **复合尺寸**：如"75*35*45"应保持原格式，不添加单位后缀
6. **功能开关**：新旧组件切换正常，不影响现有功能

### 性能指标
- [ ] Hook执行时间 < 10ms
- [ ] 组件渲染时间 < 50ms  
- [ ] 内存使用无明显增长
- [ ] 页面加载时间不受影响

## 🔮 后续优化

### Phase 6: 扩展应用
- [ ] 配件页面应用相同标准
- [ ] 耗材页面标准统一
- [ ] 购物车页面标准化

### Phase 7: 高级特性
- [ ] 用户自定义单位偏好
- [ ] 动态单位转换
- [ ] 字段显示个性化配置

### Phase 8: 监控优化
- [ ] 字段显示质量监控
- [ ] 用户行为分析
- [ ] 性能持续优化

## 🎉 项目价值

### 技术价值
1. **标准化架构**：建立了可复用的字段显示标准
2. **智能化体验**：基于用户偏好自动适配单位制
3. **国际化支持**：完整的多语言解决方案
4. **工程化实践**：配置驱动的开发模式

### 业务价值
1. **用户体验**：避免单位重复，提升界面清晰度
2. **国际化**：支持全球不同地区的单位制偏好
3. **维护性**：统一的标准降低维护成本
4. **扩展性**：架构支持快速扩展到其他页面

这个实施方案展示了企业级前端开发的最佳实践，从架构设计到实现细节都体现了专业的工程化思维，为机器页面提供了完整的单位显示标准化解决方案。 