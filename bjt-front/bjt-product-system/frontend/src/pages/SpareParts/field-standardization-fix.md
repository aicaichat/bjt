# 备件页面字段标准化修复方案

## 📊 问题分析

### 当前备件页面显示字段 vs CSV标准字段对比

| 显示位置 | 当前字段名 | 当前翻译键 | CSV标准中文 | CSV标准英文 | 状态 | 修复建议 |
|---------|-----------|------------|------------|------------|------|----------|
| **基础信息显示** ||||||||
| 适配信息 | `适配机型` | `table.columns.compatibility` | `适用机型` | `Applicable Machine` | ⚠️ 不一致 | 修改翻译键 |
| 规格信息 | `规格` | `fields.specifications` | `规格描述` | `Spec.` | ⚠️ 不一致 | 统一命名 |
| 序列号 | `适配序列号` | `fields.compatibleSerialNumber` | `适配序列号` | `Applicable SN.` | ✅ 一致 | 无需修改 |
| 包装数量 | `单箱数量` | `fields.pcsPerBox` | `单箱数量` | `Qty per Carton` | ✅ 一致 | 无需修改 |
| **Tooltip显示字段** ||||||||
| 包装尺寸 | `包装尺寸(cm/inch)` | `details.properties.packageSize*` | `包装尺寸` | `Packaging Dim.` | ⚠️ 不一致 | 统一单位显示 |
| 净重 | `净重(kg/lbs)` | `details.properties.netWeight*` | `单件净重` | `Net Weight` | ⚠️ 不一致 | 统一命名 |

## 🛠️ 修复方案

### 1. 翻译文件修复

#### 中文翻译文件修复 (`zh/spareParts.json`)
```json
{
  "table": {
    "columns": {
      "compatibility": "适用机型",  // 修改：适配机型 → 适用机型
      "spec": "规格描述"           // 修改：规格 → 规格描述
    }
  },
  "fields": {
    "specifications": "规格描述",   // 修改：规格 → 规格描述
    "compatibleModels": "适用机型", // 修改：适配机型 → 适用机型
    "partModel": "适用机型"        // 修改：适配机型 → 适用机型
  },
  "details": {
    "properties": {
      "packageSizeCm": "包装尺寸(cm)",    // 统一格式
      "packageSizeInch": "包装尺寸(inch)", // 统一格式
      "netWeightKg": "单件净重(kg)",      // 修改：净重 → 单件净重
      "netWeightLbs": "单件净重(lb)"      // 修改：净重 → 单件净重
    }
  }
}
```

#### 英文翻译文件修复 (`en/spareParts.json`)
```json
{
  "table": {
    "columns": {
      "compatibility": "Applicable Machine", // 确保与CSV一致
      "spec": "Spec."                       // 确保与CSV一致
    }
  },
  "fields": {
    "specifications": "Spec.",              // 确保与CSV一致
    "compatibleModels": "Applicable Machine", // 确保与CSV一致
    "partModel": "Applicable Machine"       // 确保与CSV一致
  },
  "details": {
    "properties": {
      "packageSizeCm": "Packaging Dim.(cm)",    // 使用CSV标准
      "packageSizeInch": "Packaging Dim.(inch)", // 使用CSV标准
      "netWeightKg": "Net Weight(kg)",          // 使用CSV标准
      "netWeightLbs": "Net Weight(lb)"          // 使用CSV标准
    }
  }
}
```

### 2. 代码逻辑修复

#### 主要修复点：
1. **统一字段命名规范**：所有字段名称严格按照CSV标准
2. **智能单位制显示**：根据用户偏好显示公制/英制
3. **翻译键标准化**：确保翻译键与CSV标准英文名称一致

### 3. 验证标准

修复后需要验证：
- ✅ 中文环境下显示CSV标准中文名称
- ✅ 英文环境下显示CSV标准英文名称  
- ✅ 单位制智能切换正常工作
- ✅ Tooltip显示字段与CSV标准一致

## 📋 CSV标准字段完整映射

根据 `表单属性综合统一.csv` 第43-44行：

| CSV属性 | 中文标准 | 英文标准 | 单位 | 备件页面对应字段 |
|---------|----------|----------|------|------------------|
| 适用机型 | 适用机型 | Applicable Machine | - | app_model |
| 料号 | 料号 | Part No. | - | part_number |
| 名称(英文) | 名称 | Item | - | name_en |
| 规格描述 | 规格描述 | Spec. | - | spec/spec_imperial |
| 适配序列号 | 适配序列号 | Applicable SN. | - | app_sn |
| 包装尺寸 | 包装尺寸 | Packaging Dim. | cm/inch | package_size_cm/inch |
| 单件净重 | 单件净重 | Net Weight | kg/lb | net_weight_kg/lbs |
| 单箱数量 | 单箱数量 | Qty per Carton | - | pcs_per_box |

## 🎯 实施优先级

### P0 (立即修复)
- 翻译文件中的字段名称标准化
- 主要显示字段与CSV标准对齐

### P1 (重要修复)  
- Tooltip字段显示标准化
- 单位制显示逻辑优化

### P2 (优化改进)
- 字段显示顺序优化
- 用户体验提升 