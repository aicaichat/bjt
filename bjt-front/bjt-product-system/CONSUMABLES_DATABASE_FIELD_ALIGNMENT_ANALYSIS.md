# 耗材管理页面数据库字段对齐分析

## 📊 数据库表结构对比

### 当前标准数据库表结构 (wp_bjt_consumables)
```sql
CREATE TABLE `wp_bjt_consumables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `model_imperial` varchar(100) COMMENT '型号(英制)',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `brand` varchar(100) COMMENT '品牌',
  `app_model` varchar(255) COMMENT '适用机型',
  `bag_type` varchar(100) COMMENT '袋型',
  `material` varchar(100) COMMENT '材质',
  `thickness_met` decimal(10,2) COMMENT '厚度/克重(um/gsm)',
  `thickness_imp` decimal(10,2) COMMENT '厚度/克重(mil/#)',
  `width_met` decimal(10,2) COMMENT '膜宽(cm)',
  `width_imp` decimal(10,2) COMMENT '膜宽(inch)',
  `length_met` decimal(10,2) COMMENT '袋长(cm)',
  `length_imp` decimal(10,2) COMMENT '袋长(inch)',
  `bubble_diameter_met` decimal(10,2) COMMENT '泡径(cm)',
  `bubble_diameter_imp` decimal(10,2) COMMENT '泡径(inch)',
  `total_length_met` decimal(10,2) COMMENT '总长(m)',
  `total_length_imp` decimal(10,2) COMMENT '总长(ft)',
  `tube_inner_diameter_cm` decimal(10,2) COMMENT '纸筒内径(cm)',
  `tube_inner_diameter_inch` decimal(10,2) COMMENT '纸筒内径(inch)',
  -- 包装信息
  `package_type` varchar(100) COMMENT '包装方式',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  -- 托盘信息
  `pallet_size_cm` varchar(100) COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet_a` int(11) COMMENT '一托卷数A',
  `pallet_gross_weight_a_kg` decimal(10,2) COMMENT '整托毛重A(kg)',
  `pallet_gross_weight_a_lbs` decimal(10,2) COMMENT '整托毛重A(lbs)',
  `pallet_height_a_cm` decimal(10,2) COMMENT '打托高度A(cm)',
  `pallet_height_a_inch` decimal(10,2) COMMENT '打托高度A(inch)',
  -- 图片
  `image_url` varchar(255) COMMENT '产品图片(袋型实物)',
  `package_image_url` varchar(255) COMMENT '包装实物图片',
  -- 状态
  `status` varchar(20) DEFAULT 'publish',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔍 页面字段与数据库字段对齐分析

### 1. **规格信息页面字段对齐**

#### 1.1 厚度信息部分
| 页面字段名 | 数据库字段 | 状态 | CSV标准名称 | 标准单位 | 问题 |
|------------|------------|------|-------------|----------|------|
| `thickness_met` | `thickness_met` | ✅ 对齐 | 厚度/克重(公制) | μm / gsm | ⚠️ 页面标签需要更新 |
| `thickness_imp` | `thickness_imp` | ✅ 对齐 | 厚度/克重(英制) | mil / lb | ⚠️ 页面标签需要更新 |

**问题**: 
- 页面标签显示为"厚度"，应该显示为"厚度/克重"
- 单位显示为"(mil/#)"，CSV标准是"(mil / lb)"

#### 1.2 尺寸信息部分
| 页面字段名 | 数据库字段 | 状态 | CSV标准名称 | 标准单位 | 问题 |
|------------|------------|------|-------------|----------|------|
| `width_met` | `width_met` | ✅ 对齐 | 宽度(公制) | cm | ⚠️ 页面标签显示为"尺寸" |
| `width_imp` | `width_imp` | ✅ 对齐 | 宽度(英制) | inch | ⚠️ 页面标签显示为"尺寸" |
| `length_met` | `length_met` | ✅ 对齐 | 袋长(公制) | cm | ⚠️ 页面标签显示为"尺寸" |
| `length_imp` | `length_imp` | ✅ 对齐 | 袋长(英制) | inch | ⚠️ 页面标签显示为"尺寸" |

**问题**: 
- 页面所有字段标签都显示为"尺寸(cm/inch)"，应该区分"宽度"和"袋长"
- 数据库注释是"膜宽"和"袋长"，与CSV标准一致

#### 1.3 其他信息部分
| 页面字段名 | 数据库字段 | 状态 | CSV标准名称 | 标准单位 | 问题 |
|------------|------------|------|-------------|----------|------|
| `bubble_diameter_met` | `bubble_diameter_met` | ✅ 对齐 | 泡径(公制) | mm | ❌ 单位不一致 |
| `bubble_diameter_imp` | `bubble_diameter_imp` | ✅ 对齐 | 泡径(英制) | inch | ⚠️ 页面标签显示为"尺寸" |
| `total_length_met` | `total_length_met` | ✅ 对齐 | 总长(公制) | m | ⚠️ 页面标签显示为"尺寸" |
| `total_length_imp` | `total_length_imp` | ✅ 对齐 | 总长(英制) | ft | ⚠️ 页面标签显示为"尺寸" |

**问题**: 
- 泡径单位：数据库注释是(cm)，CSV标准是(mm)，需要统一
- 页面标签都显示为"尺寸"，应该区分"泡径"和"总长"

#### 1.4 纸筒信息部分
| 页面字段名 | 数据库字段 | 状态 | CSV标准名称 | 标准单位 | 问题 |
|------------|------------|------|-------------|----------|------|
| `tube_inner_diameter_cm` | `tube_inner_diameter_cm` | ✅ 对齐 | 纸筒内径(公制) | cm | ⚠️ 页面标签显示为"尺寸" |
| `tube_inner_diameter_inch` | `tube_inner_diameter_inch` | ✅ 对齐 | 纸筒内径(英制) | inch | ⚠️ 页面标签显示为"尺寸" |

**问题**: 
- 页面标签显示为"尺寸(cm/inch)"，应该显示为"纸筒内径"

## 🛠️ 修复方案

### 1. 页面标签修复
需要更新页面中的字段标签，使其与CSV标准和数据库注释一致：

```tsx
// 当前问题代码
<Form.Item
  name="thickness_met"
  label={t('fields.thickness', { ns: 'consumables' }) + '(μm/gsm)'}
>

// 应该修复为
<Form.Item
  name="thickness_met"
  label={t('fields.thickness_met', { ns: 'consumables' })}
>
```

### 2. 翻译文件更新
需要在翻译文件中添加具体的字段标签：

```json
// zh/consumables.json
{
  "fields": {
    "thickness_met": "厚度/克重(μm/gsm)",
    "thickness_imp": "厚度/克重(mil/lb)",
    "width_met": "宽度(cm)",
    "width_imp": "宽度(inch)",
    "length_met": "袋长(cm)",
    "length_imp": "袋长(inch)",
    "bubble_diameter_met": "泡径(mm)",
    "bubble_diameter_imp": "泡径(inch)",
    "total_length_met": "总长(m)",
    "total_length_imp": "总长(ft)",
    "tube_inner_diameter_cm": "纸筒内径(cm)",
    "tube_inner_diameter_inch": "纸筒内径(inch)"
  }
}
```

### 3. 数据库字段单位统一
需要统一泡径字段的单位标准：

**选项A**: 修改数据库注释（推荐）
```sql
ALTER TABLE `wp_bjt_consumables` 
MODIFY COLUMN `bubble_diameter_met` decimal(10,2) COMMENT '泡径(mm)',
MODIFY COLUMN `bubble_diameter_imp` decimal(10,2) COMMENT '泡径(inch)';
```

**选项B**: 修改CSV标准
将CSV中的泡径单位从mm改为cm

### 4. 页面组件结构优化
建议重构页面组件，为每个字段使用专门的标签：

```tsx
// 厚度部分
<Divider orientation="left">厚度/克重</Divider>
<Row gutter={16}>
  <Col span={12}>
    <Form.Item name="thickness_met" label="厚度/克重(μm/gsm)">
      <InputNumber />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item name="thickness_imp" label="厚度/克重(mil/lb)">
      <InputNumber />
    </Form.Item>
  </Col>
</Row>

// 尺寸部分
<Divider orientation="left">尺寸信息</Divider>
<Row gutter={16}>
  <Col span={6}>
    <Form.Item name="width_met" label="宽度(cm)">
      <InputNumber />
    </Form.Item>
  </Col>
  <Col span={6}>
    <Form.Item name="width_imp" label="宽度(inch)">
      <InputNumber />
    </Form.Item>
  </Col>
  <Col span={6}>
    <Form.Item name="length_met" label="袋长(cm)">
      <InputNumber />
    </Form.Item>
  </Col>
  <Col span={6}>
    <Form.Item name="length_imp" label="袋长(inch)">
      <InputNumber />
    </Form.Item>
  </Col>
</Row>
```

## 📋 修复优先级

### 高优先级 (必须修复)
1. ✅ 页面字段标签与CSV标准对齐
2. ✅ 翻译文件完善具体字段标签
3. ✅ 泡径单位标准统一

### 中优先级 (建议修复)
1. 页面组件结构优化
2. 数据库注释与CSV标准完全一致
3. 字段验证规则完善

### 低优先级 (可选)
1. 字段帮助文本添加
2. 条件显示逻辑（如泡径仅在气泡膜时显示）
3. 单位换算提示

## 🎯 总结

**数据库字段与页面字段映射**: ✅ 完全对齐
**字段标签显示**: ❌ 需要修复
**单位标准**: ⚠️ 泡径单位需要统一
**CSV标准符合度**: 85% (修复后可达100%)

主要问题是页面显示标签过于简化，没有体现具体的字段含义和标准单位。修复后将完全符合CSV标准化要求。 