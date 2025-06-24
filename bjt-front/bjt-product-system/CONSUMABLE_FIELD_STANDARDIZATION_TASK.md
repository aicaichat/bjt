# 耗材页面字段名称标准化任务

## 🎯 任务目标
将耗材页面字段名称标准化，100%对齐`表单属性综合统一.csv`标准，**重点修复lbs显示问题**。

## 🚨 **核心问题分析**
1. **主要问题**：耗材页面的翻译文件中大量使用`lbs`而非标准的`lb`
2. **次要问题**：部分字段英文名称不符合CSV标准
3. **重要原则**：**绝对不修改材料筛选相关功能代码**

## 📁 修改文件（只修改翻译文件）
- `frontend/src/i18n/locales/zh.json` 
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/zh/consumables.json`
- `frontend/src/i18n/locales/en/consumables.json`

## 🔧 执行步骤

### 步骤1：备份原文件
```bash
cp frontend/src/i18n/locales/zh.json frontend/src/i18n/locales/zh.json.backup
cp frontend/src/i18n/locales/en.json frontend/src/i18n/locales/en.json.backup
cp frontend/src/i18n/locales/zh/consumables.json frontend/src/i18n/locales/zh/consumables.json.backup
cp frontend/src/i18n/locales/en/consumables.json frontend/src/i18n/locales/en/consumables.json.backup
```

### 步骤2：修复主要lbs显示问题

#### 2.1 修改 `frontend/src/i18n/locales/en.json`
```json
// 第213行：Package Size 标准化
"package_size": "Packaging Dim.(inch)",  // 原: "Package Size(inch)"

// 第214行：Unit Weight 标准化
"net_weight": "Unit Weight(lb)",  // 原: "Unit Weight(lbs)"

// 第584行：tooltip中的Unit Weight
"imperial": "Unit Weight(lb)",  // 原: "Unit Weight(lbs)"

// 第596行：tooltip中的Package Size
"imperial": "Packaging Dim.(inch)",  // 原: "Package Size(inch)"
```

#### 2.2 修改 `frontend/src/i18n/locales/zh.json`
```json
// 对应的中文标签保持一致
"package_size": "包装尺寸(inch)",
"net_weight": "单位重量(lb)",
// tooltip对应项
"imperial": "单位重量(lb)",
"imperial": "包装尺寸(inch)",
```

#### 2.3 ⭐⭐⭐ **关键修复** - `frontend/src/i18n/locales/en/consumables.json`
```json
// 第320行：Package Size tooltip
"imperial": "Packaging Dim.(inch)",  // 原: "Package Size inch"

// 第324行：Unit Weight tooltip ⭐⭐⭐ 最重要修复
"imperial": "Unit Weight(lb)",  // 原: "Unit Weight lbs"

// 第347行：Gross Weight tooltip
"imperial": "Gross Weight(lb)",  // 原: "Gross Weight lbs"
```

#### 2.4 修改 `frontend/src/i18n/locales/zh/consumables.json`
```json
// 对应的中文tooltip修复
"imperial": "包装尺寸(inch)",
"imperial": "单位重量(lb)", 
"imperial": "毛重(lb)",
```

### 步骤3：验证修复效果

#### 3.1 重启开发服务器
```bash
cd frontend
npm run dev
```

#### 3.2 ⭐⭐⭐ **重点验证项目**
1. **耗材详情页面**：检查Tooltip中显示 **"Unit Weight(lb)"** 而非 "Unit Weight lbs"
2. **包装信息区域**：检查显示 **"Packaging Dim.(inch)"** 而非 "Package Size inch"
3. **毛重显示**：检查显示 **"Gross Weight(lb)"** 而非 "Gross Weight lbs"
4. **筛选器标签**：确保不影响材料筛选功能

## 📊 **修改总结**

### 总计修改：**8处关键修复**
1. **en.json**: 4处 (package_size, net_weight, 2个tooltip)
2. **zh.json**: 2处 (对应中文翻译)  
3. **en/consumables.json**: 3处 (⭐最重要的tooltip修复)
4. **zh/consumables.json**: 2处 (对应中文tooltip)

### 🎯 **核心修复重点**
- **"Unit Weight lbs" → "Unit Weight(lb)"** ⭐⭐⭐
- **"Package Size inch" → "Packaging Dim.(inch)"** 
- **"Gross Weight lbs" → "Gross Weight(lb)"**

## ⚠️ **严格禁区**
- **绝对不修改** `frontend/src/pages/Consumables/index.tsx`
- **绝对不修改** 任何筛选器功能代码
- **绝对不修改** 材料筛选多语言切换逻辑

## ✅ **验证清单**
- [ ] 耗材详情页面Tooltip显示正确
- [ ] 包装信息显示标准化
- [ ] 材料筛选功能正常工作
- [ ] 多语言切换功能正常
- [ ] 无控制台错误

## 🎯 **成功标准**
用户截图中的 **"Unit Weight lbs"** 问题完全消失，显示为标准的 **"Unit Weight(lb)"**。

## 📋 修改清单总结

| 修改类别 | 文件 | 修改数量 | 主要修改 |
|---------|------|----------|----------|
| **lbs→lb修复** | zh.json | 5处 | 所有重量单位lbs→lb |
| | en.json | 5处 | 所有重量单位lbs→lb |  
| | zh/consumables.json | 2处 | tooltip重量字段lbs→lb |
| | **en/consumables.json** | **2处** | **🔥 tooltip.unitWeight.imperial等关键修复** |
| **英文名称修正** | en.json | 2处 | Package Size→Packaging Dim. |
| | en/consumables.json | 1处 | tooltip.packageSize修正 |

**总计：17处修改，涉及4个翻译文件**

## ⚠️ 注意事项

### ✅ 允许修改的内容
- 翻译文件中的显示文本
- 单位标准化（lbs→lb）
- 英文名称对齐CSV标准

### 🚫 **绝对禁止修改的内容**
- `frontend/src/pages/Consumables/index.tsx` 中的任何代码
- `generateMaterialOptions` 函数
- 材料筛选相关的任何逻辑代码
- API调用和数据处理逻辑
- 智能单位制切换代码

### 🎯 **修改原则**
1. **最小修改原则**：只修改必要的翻译文本
2. **安全第一**：绝不触碰任何功能代码  
3. **重点突出**：主要解决lbs显示问题
4. **保护功能**：确保材料筛选功能完整保留

### 🔥 **关键修复点**
- `tooltip.unitWeight.imperial`: "Unit Weight lbs" → "Unit Weight(lb)"
- `tooltip.grossWeight.imperial`: "Gross Weight lbs" → "Gross Weight(lb)"
- `tooltip.packageSize`: "Package Size" → "Packaging Dim."

## ✅ 完成标志
- 所有重量字段显示为"(lb)"而非"(lbs)" ⭐
- **Tooltip中"Unit Weight(lb)"正确显示** ⭐⭐⭐
- 英文名称100%对齐CSV标准  
- 材料筛选多语言切换功能完整保留 ⭐
- 功能测试全部通过
- 代码提交成功 