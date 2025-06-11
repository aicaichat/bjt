# Machine页面多语言和单位显示修复指南

## 🎯 修复目标
- 消除所有硬编码中文文本
- 实现智能单位制显示 (metric/imperial)
- 保持所有现有功能不变
- 最小化代码改动

## 📋 Phase 0: 现状检查

### 0.1 运行检查脚本
```bash
#!/bin/bash
# 检查当前状态脚本
echo "🔍 Machine页面现状检查"
echo "=================================="

# 检查硬编码文本数量
HARDCODED_COUNT=$(grep -o "加载配件失败\|包装尺寸\|单件净重\|打托高度\|整托毛重\|型号:\|电压(V):\|料号\|产品名称\|单箱数量:\|托盘尺寸:\|一托数量:\|频率(Hz):" frontend/src/pages/Machines/index.tsx | wc -l)
echo "🔥 发现硬编码文本: $HARDCODED_COUNT 处"

# 检查现有语言文件
ZH_EXISTS=$(test -f "frontend/src/i18n/locales/zh/machines.json" && echo "✅" || echo "❌")
EN_EXISTS=$(test -f "frontend/src/i18n/locales/en/machines.json" && echo "✅" || echo "❌")

echo "📁 中文语言文件: $ZH_EXISTS"
echo "📁 英文语言文件: $EN_EXISTS"

# 检查现有t()函数使用
T_USAGE=$(grep -c "t('.*')" frontend/src/pages/Machines/index.tsx)
echo "🌐 现有t()函数使用: $T_USAGE 处"

echo ""
echo "🎯 需要修复的问题:"
if [ $HARDCODED_COUNT -gt 0 ]; then
  echo "- 消除 $HARDCODED_COUNT 处硬编码文本"
fi
if [ "$ZH_EXISTS" = "❌" ]; then
  echo "- 创建中文语言文件"
fi
if [ "$EN_EXISTS" = "❌" ]; then
  echo "- 创建英文语言文件"
fi
```

## 🚀 Phase 1: 语言文件创建/补充

### 1.1 创建/更新中文语言文件
```json
// frontend/src/i18n/locales/zh/machines.json
{
  "pageTitle": "机器管理",
  "errors": {
    "accessoryLoadFailed": "加载配件失败",
    "processingFailed": "处理失败",
    "unknownError": "未知错误"
  },
  "fields": {
    "model": "型号",
    "voltage": "电压",
    "partNumber": "料号",
    "productName": "产品名称",
    "pcsPerBox": "单箱数量",
    "palletSize": "托盘尺寸",
    "pcsPerPallet": "一托数量",
    "packageSize": "包装尺寸",
    "netWeight": "单件净重",
    "palletHeight": "打托高度",
    "palletGrossWeight": "整托毛重",
    "frequencyHz": "频率",
    "price": "价格",
    "inventory": "库存"
  },
  "units": {
    "cm": "cm",
    "inch": "inch",
    "kg": "kg",
    "lbs": "lbs",
    "V": "V",
    "Hz": "Hz"
  },
  "actions": {
    "selectAccessory": "选择配件",
    "addToCart": "添加到购物车",
    "specDetails": "规格详情",
    "moreInfo": "更多信息"
  },
  "messages": {
    "addedSuccess": "添加成功！",
    "addedToCartMessage": "已添加到购物车",
    "viewCart": "查看购物车",
    "continueShopping": "继续购物"
  },
  "loading": {
    "accessories": "加载配件中..."
  },
  "accessories": {
    "compatible": "兼容配件",
    "level": "第",
    "levelUnit": "级",
    "subCompatible": "的子配件",
    "nextLevelLoaded": "下一级配件已加载",
    "nextLevelLoadedDesc": "已为您加载了 {{count}} 个第{{level}}级配件选项",
    "noNextLevel": "配件选择完成",
    "noNextLevelDesc": "{{name}} 没有更多子级配件，您已完成第{{level}}级的配件选择。",
    "allLevelsComplete": "所有配件选择完成",
    "allLevelsCompleteDesc": "您已完成全部5级配件的选择，可以添加到购物车了。"
  },
  "notifications": {
    "specPdfNotFound": "暂无该配件的规格说明文档",
    "mainSpecPdfNotFound": "暂无规格说明文档"
  },
  "tooltip": {
    "hoverDetails": "悬停查看详细规格信息"
  }
}
```

### 1.2 创建/更新英文语言文件
```json
// frontend/src/i18n/locales/en/machines.json
{
  "pageTitle": "Machine Management",
  "errors": {
    "accessoryLoadFailed": "Failed to load accessories",
    "processingFailed": "Processing failed",
    "unknownError": "Unknown error"
  },
  "fields": {
    "model": "Model",
    "voltage": "Voltage", 
    "partNumber": "Part Number",
    "productName": "Product Name",
    "pcsPerBox": "Pcs Per Box",
    "palletSize": "Pallet Size",
    "pcsPerPallet": "Pcs Per Pallet",
    "packageSize": "Package Size",
    "netWeight": "Net Weight",
    "palletHeight": "Pallet Height",
    "palletGrossWeight": "Pallet Gross Weight",
    "frequencyHz": "Frequency",
    "price": "Price",
    "inventory": "Inventory"
  },
  "units": {
    "cm": "cm",
    "inch": "inch",
    "kg": "kg", 
    "lbs": "lbs",
    "V": "V",
    "Hz": "Hz"
  },
  "actions": {
    "selectAccessory": "Select Accessory",
    "addToCart": "Add to Cart",
    "specDetails": "Spec Details",
    "moreInfo": "More Info"
  },
  "messages": {
    "addedSuccess": "Added Successfully!",
    "addedToCartMessage": "added to cart",
    "viewCart": "View Cart",
    "continueShopping": "Continue Shopping"
  },
  "loading": {
    "accessories": "Loading Accessories..."
  },
  "accessories": {
    "compatible": "Compatible Accessories",
    "level": "Level",
    "levelUnit": "",
    "subCompatible": "Sub Accessories",
    "nextLevelLoaded": "Next Level Accessories Loaded",
    "nextLevelLoadedDesc": "Loaded {{count}} Level {{level}} accessory options for you",
    "noNextLevel": "Accessory Selection Complete",
    "noNextLevelDesc": "{{name}} has no more sub-accessories, you have completed Level {{level}} accessory selection.",
    "allLevelsComplete": "All Levels Complete",
    "allLevelsCompleteDesc": "You have completed all 5 levels of accessory selection and can add to cart."
  },
  "notifications": {
    "specPdfNotFound": "No specification document available for this accessory",
    "mainSpecPdfNotFound": "No specification document available"
  },
  "tooltip": {
    "hoverDetails": "Hover for detailed specifications"
  }
}
```

## 🎯 Phase 2: 精准文本替换

### 2.1 在 frontend/src/pages/Machines/index.tsx 中进行以下替换

**错误提示替换：**
```typescript
// 第475行附近 - 替换错误提示
- showErrorToast('加载配件失败');
+ showErrorToast(t('errors.accessoryLoadFailed'));

// 第1445行附近 - 替换处理失败提示
- t('errors.processingFailed') || '处理失败',
+ t('errors.processingFailed'),

// 第1446行附近 - 替换未知错误提示  
- err.message || t('errors.unknownError') || '未知错误'
+ err.message || t('errors.unknownError')
```

**字段标签替换：**
```typescript
// 第1138行附近 - 托盘尺寸标签
- <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.palletSize')}:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.palletSize')}:</strong>

// 第1147行附近 - 包装尺寸标签
- <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.packSize')}:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.packageSize')}:</strong>

// 第1571行附近 - 配件型号标签
- <strong className="w-24 text-gray-600 font-medium">型号:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.model')}:</strong>

// 第1576行附近 - 配件电压标签
- <strong className="w-24 text-gray-600 font-medium">电压(V):</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.voltage')}({t('units.V')}):</strong>

// 第1582行附近 - 配件频率标签
- <strong className="w-24 text-gray-600 font-bold text-yellow-800">⚡ 频率(Hz):</strong>
+ <strong className="w-24 text-gray-600 font-bold text-yellow-800">⚡ {t('fields.frequencyHz')}({t('units.Hz')}):</strong>

// 第1587行附近 - 包装尺寸标签
- <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.packageSize')}:</strong>

// 第1594行附近 - 单箱数量标签
- <strong className="w-24 text-gray-600 font-medium">单箱数量:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.pcsPerBox')}:</strong>

// 第1598行附近 - 托盘尺寸标签
- <strong className="w-24 text-gray-600 font-medium">托盘尺寸:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.palletSize')}:</strong>

// 第1605行附近 - 一托数量标签
- <strong className="w-24 text-gray-600 font-medium">一托数量:</strong>
+ <strong className="w-24 text-gray-600 font-medium">{t('fields.pcsPerPallet')}:</strong>

// 第1684行附近 - 价格标签
- 价格:
+ {t('fields.price')}:

// 第1692行附近 - 库存标签
- 库存:
+ {t('fields.inventory')}:
```

**Tooltip内容替换：**
```typescript
// 第1155行附近 - 包装尺寸tooltip
- 包装尺寸 {unitSystem === 'metric' ? 'cm' : 'inch'}:
+ {t('fields.packageSize')} {unitSystem === 'metric' ? t('units.cm') : t('units.inch')}:

// 第1162行附近 - 单件净重tooltip
- 单件净重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:
+ {t('fields.netWeight')} {unitSystem === 'metric' ? t('units.kg') : t('units.lbs')}:

// 第1169行附近 - 打托高度tooltip
- 打托高度 {unitSystem === 'metric' ? 'cm' : 'inch'}:
+ {t('fields.palletHeight')} {unitSystem === 'metric' ? t('units.cm') : t('units.inch')}:

// 第1176行附近 - 整托毛重tooltip
- 整托毛重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:
+ {t('fields.palletGrossWeight')} {unitSystem === 'metric' ? t('units.kg') : t('units.lbs')}:

// 第1184行附近 - 悬停提示
- <span className="text-xs text-gray-500">{t('hoverDetails')}</span>
+ <span className="text-xs text-gray-500">{t('tooltip.hoverDetails')}</span>

// 第1743行附近 - 配件包装尺寸tooltip
- <span className="text-gray-600 font-medium text-xs">📦 包装尺寸:</span>
+ <span className="text-gray-600 font-medium text-xs">📦 {t('fields.packageSize')}:</span>

// 第1748行附近 - 配件单件净重tooltip
- <span className="text-gray-600 font-medium text-xs">⚖️ 单件净重:</span>
+ <span className="text-gray-600 font-medium text-xs">⚖️ {t('fields.netWeight')}:</span>

// 第1755行附近 - 配件单件毛重tooltip
- <span className="text-gray-600 font-medium text-xs">📊 单件毛重:</span>
+ <span className="text-gray-600 font-medium text-xs">📊 {t('fields.grossWeight')}:</span>

// 第1762行附近 - 配件打托高度tooltip
- <span className="text-gray-600 font-medium text-xs">📏 打托高度:</span>
+ <span className="text-gray-600 font-medium text-xs">📏 {t('fields.palletHeight')}:</span>

// 第1769行附近 - 配件整托毛重tooltip
- <span className="text-gray-600 font-medium text-xs">🏗️ 整托毛重:</span>
+ <span className="text-gray-600 font-medium text-xs">🏗️ {t('fields.palletGrossWeight')}:</span>

// 第1776行附近 - 配件悬停提示
- <span className="text-xs text-gray-500">💡 悬停查看详细规格信息</span>
+ <span className="text-xs text-gray-500">💡 {t('tooltip.hoverDetails')}</span>
```

**动作和消息替换：**
```typescript
// 第1275行附近 - 选择配件动作
- <span className="text-sm font-medium">{t('actions.selectAccessory') || '选择配件'}</span>
+ <span className="text-sm font-medium">{t('actions.selectAccessory')}</span>

// 第1616行附近 - 规格详情按钮
- {t('specDetails') || '规格详情'}
+ {t('actions.specDetails')}

// 第1656行附近 - 更多信息按钮
- showInfoToast('暂无该配件的规格说明文档');
+ showInfoToast(t('notifications.specPdfNotFound'));

// 第1782行附近 - 更多信息按钮
- {t('moreInfo') || '更多信息'}
+ {t('actions.moreInfo')}

// 第1719行附近 - 添加到购物车按钮
- {t('buttons.addToCart') || '添加到购物车'}
+ {t('actions.addToCart')}

// 第2863行附近 - 添加成功提示
- 添加成功！
+ {t('messages.addedSuccess')}

// 第2866行附近 - 添加到购物车消息
- {notificationProduct} × {notificationQuantity} 已添加到购物车
+ {notificationProduct} × {notificationQuantity} {t('messages.addedToCartMessage')}

// 第2874行附近 - 查看购物车按钮
- 查看购物车
+ {t('messages.viewCart')}

// 第2879行附近 - 继续购物按钮
- 继续购物
+ {t('messages.continueShopping')}
```

**配件相关消息替换：**
```typescript
// 第515行附近 - 兼容配件消息
- let contextText = `${accessoryName} ${t('accessories.compatible') || '兼容配件'}`;
+ let contextText = `${accessoryName} ${t('accessories.compatible')}`;

// 第517行附近 - 级别配件消息
- contextText = `${t('accessories.level') || '第'} ${level} ${t('accessories.levelUnit') || '级'} ${accessoryName} ${t('accessories.subCompatible') || '的子配件'}`;
+ contextText = `${t('accessories.level')} ${level} ${t('accessories.levelUnit')} ${accessoryName} ${t('accessories.subCompatible')}`;

// 第629行附近 - 下一级加载成功
- t('accessories.nextLevelLoaded') || '下一级配件已加载',
+ t('accessories.nextLevelLoaded'),

// 第632行附近 - 下一级加载描述
- }) || `已为您加载了 ${nextLevelAccessories.length} 个第${nextLevel}级配件选项`
+ })

// 第641行附近 - 无下一级消息
- t('accessories.noNextLevel') || '配件选择完成',
+ t('accessories.noNextLevel'),

// 第645行附近 - 无下一级描述
- }) || `${accessoryName} 没有更多子级配件，您已完成第${level}级的配件选择。`
+ })

// 第648行附近 - 所有级别完成
- t('accessories.allLevelsComplete') || '所有配件选择完成',
+ t('accessories.allLevelsComplete'),

// 第649行附近 - 所有级别完成描述
- t('accessories.allLevelsCompleteDesc') || '您已完成全部5级配件的选择，可以添加到购物车了。'
+ t('accessories.allLevelsCompleteDesc')
```

**加载状态替换：**
```typescript
// 第2749行附近 - 加载配件状态
- text={t('loading.accessories') || '加载配件中...'} 
+ text={t('loading.accessories')}

// 其他3处类似的加载状态 (第2757、2765、2773行附近)
- text={t('loading.accessories') || '加载配件中...'} 
+ text={t('loading.accessories')}
```

**通知相关替换：**
```typescript
// 第1202行附近 - 规格说明未找到
- showInfoToast('暂无规格说明文档');
+ showInfoToast(t('notifications.mainSpecPdfNotFound'));
```

## 🎯 Phase 3: 添加智能单位显示辅助函数

### 3.1 在组件内添加辅助函数
在 `frontend/src/pages/Machines/index.tsx` 的开头部分（约第150行，在其他函数定义之后）添加：

```typescript
// 智能单位显示辅助函数
const getUnitLabel = (fieldType: 'size' | 'weight') => {
  if (fieldType === 'size') {
    return unitSystem === 'metric' ? t('units.cm') : t('units.inch');
  }
  return unitSystem === 'metric' ? t('units.kg') : t('units.lbs');
};

const formatFieldWithUnit = (metricValue: any, imperialValue: any, fieldType: 'size' | 'weight') => {
  const value = unitSystem === 'metric' ? metricValue : imperialValue;
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return `${value} ${getUnitLabel(fieldType)}`;
};
```

### 3.2 应用智能单位显示
在托盘尺寸和包装尺寸显示处使用新函数：

```typescript
// 机器列表中的托盘尺寸显示 (第1140行附近)
<span className="text-gray-800 font-medium">
  {formatFieldWithUnit(machine.pallet_size_cm, machine.pallet_size_inch, 'size')}
</span>

// 机器列表中的包装尺寸显示 (第1149行附近)  
<span className="text-gray-800 font-medium">
  {formatFieldWithUnit(machine.package_size_cm, machine.package_size_inch, 'size')}
</span>

// 配件中的包装尺寸显示 (第1589行附近)
<span className="text-gray-800 font-medium">
  {formatFieldWithUnit(getFieldValue('package_size_cm'), getFieldValue('package_size_inch'), 'size')}
</span>

// 配件中的托盘尺寸显示 (第1600行附近)
<span className="text-gray-800 font-medium">
  {formatFieldWithUnit(getFieldValue('pallet_size_cm'), getFieldValue('pallet_size_inch'), 'size')}
</span>
```

## 🔧 Phase 4: 验证和测试

### 4.1 运行验证脚本
```bash
#!/bin/bash
echo "🔍 修复后验证检查"
echo "=================================="

# 检查硬编码文本是否消除
HARDCODED_AFTER=$(grep -o "加载配件失败\|包装尺寸[^{]\|单件净重[^{]\|打托高度[^{]\|整托毛重[^{]\|型号:[^{]\|电压(V):[^{]\|料号[^{]\|产品名称[^{]\|单箱数量:[^{]\|托盘尺寸:[^{]\|一托数量:[^{]\|频率(Hz):[^{]" frontend/src/pages/Machines/index.tsx | wc -l)
echo "🔥 剩余硬编码文本: $HARDCODED_AFTER 处"

# 检查t()函数使用
T_USAGE_AFTER=$(grep -c "t('.*')" frontend/src/pages/Machines/index.tsx)
echo "🌐 t()函数使用: $T_USAGE_AFTER 处"

# 检查语言文件是否创建
ZH_EXISTS=$(test -f "frontend/src/i18n/locales/zh/machines.json" && echo "✅" || echo "❌")
EN_EXISTS=$(test -f "frontend/src/i18n/locales/en/machines.json" && echo "✅" || echo "❌")
echo "📁 中文语言文件: $ZH_EXISTS"
echo "📁 英文语言文件: $EN_EXISTS"

if [ $HARDCODED_AFTER -eq 0 ]; then
  echo "🎉 硬编码文本已完全消除！"
else
  echo "⚠️ 仍有 $HARDCODED_AFTER 处硬编码文本需要处理"
fi

# 构建测试
echo ""
echo "🔨 运行构建测试..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ 构建成功"
else
  echo "❌ 构建失败，请检查代码"
fi
```

### 4.2 功能测试清单
- [ ] 页面正常加载
- [ ] 机器列表显示正常
- [ ] 多级配件选择功能正常
- [ ] 购物车添加功能正常
- [ ] 中英文切换正常
- [ ] 单位制切换正常 (metric ↔ imperial)
- [ ] 错误提示支持多语言
- [ ] Tooltip内容支持多语言

## 🚨 回滚方案

如果修改出现问题，可以快速回滚：

```bash
# 方案1: Git回滚
git checkout HEAD~1 -- frontend/src/pages/Machines/index.tsx
git checkout HEAD~1 -- frontend/src/i18n/locales/

# 方案2: 备份恢复 (如果提前备份了)
cp frontend/src/pages/Machines/index.tsx.backup frontend/src/pages/Machines/index.tsx
```

## 📋 执行检查清单

### 开始前检查
- [ ] 运行现状检查脚本
- [ ] 备份当前代码: `cp frontend/src/pages/Machines/index.tsx frontend/src/pages/Machines/index.tsx.backup`
- [ ] 确认Git状态干净

### 执行中检查
- [ ] 创建/更新语言文件
- [ ] 按顺序进行文本替换
- [ ] 添加辅助函数
- [ ] 每个阶段后测试构建

### 完成后检查
- [ ] 运行验证脚本
- [ ] 功能测试通过
- [ ] 构建成功
- [ ] 提交代码

---

**预期结果**: 完全消除硬编码文本，实现多语言和智能单位显示，同时保持所有现有功能不变。 