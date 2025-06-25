# 耗材管理页面字段标准化任务

## 任务目标
将耗材管理页面的所有字段名称与`表单属性综合统一.csv`文件中的标准完全对齐。

## CSV标准字段分析

### 物品属性 (Item Info)
| CSV属性 | 中文标准 | 英文标准 | 单位 | 当前状态 |
|---------|----------|----------|------|----------|
| 产品图片 | 产品图片 | Product Image | - | ❌ 需修改 |
| 型号(公制) | 型号 | Model | - | ✅ 已对齐 |
| 型号(英制) | 型号 | Model | - | ✅ 已对齐 |
| 品牌 | 品牌 | Brand | - | ✅ 已对齐 |
| 料号 | 料号 | Part No. | - | ❌ 需修改 |
| 名称(英文) | 名称 | Item | - | ❌ 需修改 |
| 电压 | 电压 | Voltage | V | ✅ 已对齐 |
| 频率 | 频率 | Frequency | Hz | ✅ 已对齐 |
| Spec.(公制) | 规格描述 | Spec. | - | ❌ 需修改 |
| Spec.(英制) | 规格描述 | Spec. | - | ❌ 需修改 |
| 适用机型 | 适用机型 | Applicable Machine | - | ❌ 需修改 |
| 适配序列号 | 适配序列号 | Applicable SN. | - | ❌ 需添加 |
| 单位 | 单位 | Unit | - | ✅ 已对齐 |

### 额外属性 (Other Info)
| CSV属性 | 中文标准 | 英文标准 | 单位 | 当前状态 |
|---------|----------|----------|------|----------|
| 袋型 | 袋型 | Film Type | - | ❌ 需修改 |
| 袋型编码 | 袋型编码 | Film Type Code | - | ❌ 需添加 |
| 材质 | 材质 | Material | - | ✅ 已对齐 |
| 泡径 | 泡径 | Bubble Dia. | mm/inch | ❌ 需修改 |
| 厚度/克重(公制) | 厚度/克重 | Thickness/Basis Weight | μm/gsm | ❌ 需修改 |
| 厚度/克重(英制) | 厚度/克重 | Thickness/Basis Weight | mil/lb | ❌ 需修改 |
| 宽度(公制) | 宽度 | Width | cm | ✅ 已对齐 |
| 宽度(英制) | 宽度 | Width | inch | ✅ 已对齐 |
| 虚线间距(公制) | 虚线间距 | Perforation | cm | ❌ 需添加 |
| 虚线间距(英制) | 虚线间距 | Perforation | inch | ❌ 需添加 |
| 总长(公制) | 总长 | Length | m | ❌ 需修改 |
| 总长(英制) | 总长 | Length | ft | ❌ 需修改 |
| 筋数 | 筋数 | Reinforcement | - | ❌ 需添加 |
| 层数 | 层数 | Ply | - | ❌ 需添加 |
| 颜色 | 颜色 | Color | - | ✅ 已对齐 |
| 印刷 | 印刷 | Printing | - | ❌ 需添加 |
| 纸筒内径(公制) | 纸筒内径 | Inner Dia. | cm | ❌ 需修改 |
| 纸筒内径(英制) | 纸筒内径 | Inner Dia. | inch | ❌ 需修改 |
| 必选品 | 必选品 | Necessaries | - | ❌ 需添加 |
| 必选品数量 | 必选品数量 | Qty. of necessaries | - | ❌ 需添加 |

### 包装属性 (Package Info)
| CSV属性 | 中文标准 | 英文标准 | 单位 | 当前状态 |
|---------|----------|----------|------|----------|
| 包装方式 | 包装方式 | Packaging Method | - | ❌ 需修改 |
| 包装图片 | 包装图片 | Packaging Image | - | ❌ 需修改 |
| 包装尺寸 | 包装尺寸 | Packaging Dim. | cm/inch | ❌ 需修改 |
| 单件净重 | 单件净重 | Net Weight | kg/lb | ❌ 需修改 |
| 包装毛重 | 包装毛重 | Gross Weight | kg/lb | ❌ 需修改 |
| 单箱数量 | 单箱数量 | Qty per Carton | - | ❌ 需修改 |

### 打托属性 (Pallet Info)
| CSV属性 | 中文标准 | 英文标准 | 单位 | 当前状态 |
|---------|----------|----------|------|----------|
| 托盘尺寸 | 托盘尺寸 | Pallet Size | cm/inch | ❌ 需修改 |
| 一托数量1 | 一托数量 | Packs per Pallet | - | ❌ 需修改 |
| 打托高度1 | 打托高度 | Pallet Height | cm/inch | ❌ 需修改 |
| 整托毛重1 | 整托毛重 | GW per Pallet | kg/lb | ❌ 需修改 |

## 修改计划

### 1. 修改中文翻译文件
文件：`frontend/src/admin/i18n/locales/zh/consumables.json`

#### 需要修改的字段：
```json
{
  "fields": {
    // 物品属性
    "image_url": "产品图片",
    "part_number": "料号", 
    "name": "名称",
    "spec": "规格描述",
    "spec_imperial": "规格描述",
    "app_model": "适用机型",
    
    // 额外属性
    "bag_type": "袋型",
    "bubble_diameter_met": "泡径",
    "bubble_diameter_imp": "泡径", 
    "thickness_met": "厚度/克重",
    "thickness_imp": "厚度/克重",
    "total_length_met": "总长",
    "total_length_imp": "总长",
    "tube_inner_diameter_cm": "纸筒内径",
    "tube_inner_diameter_inch": "纸筒内径",
    
    // 包装属性
    "package_type": "包装方式",
    "package_image_url": "包装图片",
    "package_size_cm": "包装尺寸",
    "package_size_inch": "包装尺寸",
    "net_weight_kg": "单件净重",
    "net_weight_lbs": "单件净重",
    "gross_weight_kg": "包装毛重",
    "gross_weight_lbs": "包装毛重",
    "pcs_per_box": "单箱数量",
    
    // 打托属性
    "pallet_size_cm": "托盘尺寸",
    "pallet_size_inch": "托盘尺寸",
    "pcs_per_pallet": "一托数量",
    "height": "打托高度"
  }
}
```

### 2. 修改英文翻译文件
文件：`frontend/src/admin/i18n/locales/en/consumables.json`

#### 需要修改的字段：
```json
{
  "fields": {
    // 物品属性
    "image_url": "Product Image",
    "part_number": "Part No.",
    "name": "Item",
    "spec": "Spec.",
    "spec_imperial": "Spec.",
    "app_model": "Applicable Machine",
    
    // 额外属性
    "bag_type": "Film Type",
    "bubble_diameter_met": "Bubble Dia.",
    "bubble_diameter_imp": "Bubble Dia.",
    "thickness_met": "Thickness/Basis Weight",
    "thickness_imp": "Thickness/Basis Weight",
    "total_length_met": "Length",
    "total_length_imp": "Length",
    "tube_inner_diameter_cm": "Inner Dia.",
    "tube_inner_diameter_inch": "Inner Dia.",
    
    // 包装属性
    "package_type": "Packaging Method",
    "package_image_url": "Packaging Image",
    "package_size_cm": "Packaging Dim.",
    "package_size_inch": "Packaging Dim.",
    "net_weight_kg": "Net Weight",
    "net_weight_lbs": "Net Weight",
    "gross_weight_kg": "Gross Weight",
    "gross_weight_lbs": "Gross Weight",
    "pcs_per_box": "Qty per Carton",
    
    // 打托属性
    "pallet_size_cm": "Pallet Size",
    "pallet_size_inch": "Pallet Size",
    "pcs_per_pallet": "Packs per Pallet",
    "height": "Pallet Height"
  }
}
```

### 3. 需要添加的新字段
以下字段在CSV中存在但当前系统中缺失，需要考虑添加：

- 适配序列号 (Applicable SN.)
- 袋型编码 (Film Type Code)  
- 虚线间距 (Perforation)
- 筋数 (Reinforcement)
- 层数 (Ply)
- 印刷 (Printing)
- 必选品 (Necessaries)
- 必选品数量 (Qty. of necessaries)

## 实施步骤

1. **备份现有翻译文件**
2. **修改中文翻译文件**
3. **修改英文翻译文件**
4. **验证修改效果**
5. **重启前端服务**
6. **测试完整性**

## 验证清单

- [ ] 所有字段名称与CSV标准100%对齐
- [ ] 中英文翻译一致性
- [ ] 单位显示正确
- [ ] 表单功能正常
- [ ] 数据保存/读取正常

---
*任务创建时间: 2025-01-18*
*负责人: AI Assistant* 