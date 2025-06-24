# Machine页面字段名称标准化任务

## 🎯 任务目标
将machine页面主机属性和配件属性的中英文字段名称标准化，100%对齐`表单属性综合统一.csv`标准。

## 📁 修改文件
- `frontend/src/config/machine-display-config.ts`

## 🔧 执行步骤

### 步骤1：备份原文件
```bash
cp frontend/src/config/machine-display-config.ts frontend/src/config/machine-display-config.ts.backup
```

### 步骤2：修改MACHINE_FIELD_LABELS配置

打开文件 `frontend/src/config/machine-display-config.ts`，找到第215行左右的 `MACHINE_FIELD_LABELS` 对象，进行以下修改：

#### 2.1 修改中文字段标签 (zh部分)
```typescript
zh: {
  // 基础字段
  model: '型号',
  part_number: '料号',
  voltage: '电压',
  image_url: '产品图片',  // 🔴 从"图片"改为"产品图片"
  name: '名称',
  
  // 重量字段 - 修正单位标准
  net_weight_kg: '单件净重(kg)',
  net_weight_lbs: '单件净重(lb)',  // 🔴 从"(lbs)"改为"(lb)"
  gross_weight_kg: '单件毛重(kg)',
  gross_weight_lbs: '单件毛重(lb)',  // 🔴 从"(lbs)"改为"(lb)"
  pallet_gross_weight_kg: '整托毛重(kg)',
  pallet_gross_weight_lbs: '整托毛重(lb)',  // 🔴 从"(lbs)"改为"(lb)"
  
  // 尺寸字段
  package_size_cm: '包装尺寸(cm)',
  package_size_inch: '包装尺寸(inch)',
  pallet_size_cm: '托盘尺寸(cm)',
  pallet_size_inch: '托盘尺寸(inch)',
  pallet_height_cm: '打托高度(cm)',
  pallet_height_inch: '打托高度(inch)',
  
  // 数量字段
  pcs_per_box: '单箱数量',
  pcs_per_pallet: '一托数量',
  
  // 配件特有字段
  frequency: '频率',  // 🔴 从"频率Hz"改为"频率"
},
```

#### 2.2 修改英文字段标签 (en部分)
```typescript
en: {
  // 基础字段
  model: 'Model',
  part_number: 'Part No.',
  voltage: 'Voltage',
  image_url: 'Product Image',  // 🔴 从"Image"改为"Product Image"
  name: 'Item',  // 🔴 从"Name"改为"Item"
  
  // 重量字段 - 修正英文名称和单位标准
  net_weight_kg: 'Net Weight(kg)',
  net_weight_lbs: 'Net Weight(lb)',  // 🔴 从"(lbs)"改为"(lb)"
  gross_weight_kg: 'Gross Weight(kg)',
  gross_weight_lbs: 'Gross Weight(lb)',  // 🔴 从"(lbs)"改为"(lb)"
  pallet_gross_weight_kg: 'GW per Pallet(kg)',  // 🔴 从"Pallet GW(kg)"改为"GW per Pallet(kg)"
  pallet_gross_weight_lbs: 'GW per Pallet(lb)',  // 🔴 从"Pallet GW(lbs)"改为"GW per Pallet(lb)"
  
  // 尺寸字段 - 修正英文名称
  package_size_cm: 'Packaging Dim.(cm)',  // 🔴 从"Package Size(cm)"改为"Packaging Dim.(cm)"
  package_size_inch: 'Packaging Dim.(inch)',  // 🔴 从"Package Size(inch)"改为"Packaging Dim.(inch)"
  pallet_size_cm: 'Pallet Size(cm)',
  pallet_size_inch: 'Pallet Size(inch)',
  pallet_height_cm: 'Pallet Height(cm)',
  pallet_height_inch: 'Pallet Height(inch)',
  
  // 数量字段 - 修正英文名称
  pcs_per_box: 'Qty per Carton',  // 🔴 从"Qty per Box"改为"Qty per Carton"
  pcs_per_pallet: 'Packs per Pallet',  // 🔴 从"Qty per Pallet"改为"Packs per Pallet"
  
  // 配件特有字段
  frequency: 'Frequency',
}
```

### 步骤3：修改JSON字段映射

#### 3.1 修改MACHINE_JSON_FIELDS (约第350行)
找到 `machineList` 和 `machineCart` 数组，修改：
```typescript
machineList: [
  "型号",      // model
  "电压",      // voltage  
  "产品图片",   // 🔴 从"图片"改为"产品图片"
  "料号",      // part_number
  "名称",      // name
  "单箱数量",   // pcs_per_box
  "托盘尺寸cm", // pallet_size_cm
  "托盘尺寸inch", // pallet_size_inch
  "一托数量"    // pcs_per_pallet
],

machineCart: [
  "型号",      // model
  "电压",      // voltage
  "产品图片",   // 🔴 从"图片"改为"产品图片"
  "料号",      // part_number
  "名称",      // name
  "单箱数量",   // pcs_per_box
  "托盘尺寸cm", // pallet_size_cm
  "托盘尺寸inch", // pallet_size_inch
  "一托数量"    // pcs_per_pallet
],
```

#### 3.2 修改ACCESSORY_JSON_FIELDS (约第390行)
找到 `accessoryList` 和 `accessoryCart` 数组，修改：
```typescript
accessoryList: [
  "产品图片",     // image
  "型号",        // model
  "料号",        // part_number
  "名称",        // 🔴 从"产品名称"改为"名称"
  "电压",        // 🔴 从"电压V"改为"电压"
  "频率",        // 🔴 从"频率Hz"改为"频率"
  "单箱数量",     // pcs_per_box
  "托盘尺寸cm",   // pallet_size_cm
  "托盘尺寸inch", // pallet_size_inch
  "一托数量"      // pcs_per_pallet
],

accessoryCart: [
  "产品图片",     // image
  "型号",        // model
  "料号",        // part_number
  "名称",        // 🔴 从"产品名称"改为"名称"
  "电压",        // 🔴 从"电压V"改为"电压"
  "频率",        // 🔴 从"频率Hz"改为"频率"
  "单箱数量"      // pcs_per_box
],
```

### 步骤4：重启开发服务器
```bash
cd frontend
npm run dev
```

### 步骤5：验证测试

#### 5.1 页面显示验证
- [ ] 打开Machine页面，检查主机商品列表字段名称
- [ ] 检查配件商品列表字段名称  
- [ ] 检查购物车中的字段名称
- [ ] 检查Tooltip中的字段名称

#### 5.2 关键验证点
**中文名称验证**：
- [ ] 图片字段显示为"产品图片"
- [ ] 重量字段单位显示为"(lb)"而非"(lbs)"
- [ ] 配件名称显示为"名称"而非"产品名称"

**英文名称验证**：
- [ ] 图片字段显示为"Product Image"
- [ ] 名称字段显示为"Item"
- [ ] 整托毛重显示为"GW per Pallet(xx)"
- [ ] 包装尺寸显示为"Packaging Dim.(xx)"
- [ ] 单箱数量显示为"Qty per Carton"
- [ ] 一托数量显示为"Packs per Pallet"

#### 5.3 功能验证
- [ ] 智能单位制切换功能正常（公制↔英制）
- [ ] 页面渲染正常无报错
- [ ] 数据显示正确

### 步骤6：提交修改
```bash
git add frontend/src/config/machine-display-config.ts
git commit -m "fix: 标准化machine页面字段显示名称以对齐CSV标准

- 修正图片字段：图片 → 产品图片
- 修正重量单位：lbs → lb  
- 修正英文名称：Package Size → Packaging Dim.
- 修正数量字段：Qty per Box → Qty per Carton
- 统一配件名称：产品名称 → 名称
- 保留单位信息在显示名称中
- 保持智能单位制切换功能完整"
```

## 📋 修改清单总结

| 修改项 | 修改前 | 修改后 | 数量 |
|--------|--------|--------|------|
| 图片字段中文 | 图片 | 产品图片 | 1 |
| 图片字段英文 | Image | Product Image | 1 |
| 名称字段英文 | Name | Item | 1 |
| 重量单位标准 | (lbs) | (lb) | 6处 |
| 整托毛重英文 | Pallet GW | GW per Pallet | 2 |
| 包装尺寸英文 | Package Size | Packaging Dim. | 2 |
| 数量字段英文 | Qty per Box/Pallet | Qty per Carton/Packs per Pallet | 2 |
| 配件名称 | 产品名称 | 名称 | 2 |
| 电压频率后缀 | 电压V/频率Hz | 电压/频率 | 4 |

**总计：21处修改**

## ⚠️ 注意事项
1. 只修改显示标签，不修改数据字段名
2. 保持unitConfig和单位制切换逻辑不变
3. 所有"lbs"必须改为"lb"
4. 验证时重点关注单位显示的一致性

## ✅ 完成标志
- 所有字段名称100%对齐CSV标准
- 功能测试全部通过
- 代码提交成功 