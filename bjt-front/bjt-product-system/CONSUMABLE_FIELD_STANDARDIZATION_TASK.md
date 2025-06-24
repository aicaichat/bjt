# 耗材页面字段名称标准化任务

## 🎯 任务目标
将耗材页面的商品显示字段、购物车字段、以及**筛选项**的中英文名称标准化，100%对齐`表单属性综合统一.csv`标准。

## 📁 修改文件
- `frontend/src/config/consumable-display-config.ts` (主要配置)
- `frontend/src/components/Cart/EnhancedCartSidebar.tsx` (购物车字段)
- `frontend/src/hooks/useCartDisplayEnhancer.ts` (字段标签)
- `frontend/src/i18n/locales/zh.json` (中文筛选项)
- `frontend/src/i18n/locales/en.json` (英文筛选项)

## 🔧 执行步骤

### 步骤1：备份原文件
```bash
cp frontend/src/config/consumable-display-config.ts frontend/src/config/consumable-display-config.ts.backup
cp frontend/src/components/Cart/EnhancedCartSidebar.tsx frontend/src/components/Cart/EnhancedCartSidebar.tsx.backup
cp frontend/src/hooks/useCartDisplayEnhancer.ts frontend/src/hooks/useCartDisplayEnhancer.ts.backup
cp frontend/src/i18n/locales/zh.json frontend/src/i18n/locales/zh.json.backup
cp frontend/src/i18n/locales/en.json frontend/src/i18n/locales/en.json.backup
```

### 步骤2：修改consumable-display-config.ts配置

打开文件 `frontend/src/config/consumable-display-config.ts`，找到 `CONSUMABLE_FIELD_LABELS` 对象，进行以下修改：

#### 2.1 修改中文字段标签 (zh部分)
```typescript
zh: {
  // 基础字段
  app_model: '适用机型',
  name_en: '名称',  // 🔴 新增，对应CSV标准
  image_url: '产品图片',  // 🔴 新增，对应CSV标准
  part_number: '料号',
  
  // 规格字段
  model_metric: '型号',
  model_imperial: '型号',
  spec: '规格描述',  // 🔴 修正：从"Spec."改为"规格描述"
  spec_imperial: '规格描述',  // 🔴 修正：从"Spec."改为"规格描述"
  
  // 泡径字段 - 修正单位
  bubble_diameter_mm: '泡径(mm)',  // 🔴 修正：从"(cm)"改为"(mm)"
  bubble_diameter_inch: '泡径(inch)',
  
  // 形状字段 - 修正名称
  shape: '袋型',  // 🔴 修正：从"形状"改为"袋型"
  
  // 膜宽字段 - 修正名称
  film_width_cm: '宽度(cm)',  // 🔴 修正：从"膜宽(cm)"改为"宽度(cm)"
  film_width_inch: '宽度(inch)',  // 🔴 修正：从"膜宽(inch)"改为"宽度(inch)"
  
  // 袋长字段 - 修正名称
  bag_length_cm: '虚线间距(cm)',  // 🔴 修正：从"袋长(cm)"改为"虚线间距(cm)"
  bag_length_inch: '虚线间距(inch)',  // 🔴 修正：从"袋长(inch)"改为"虚线间距(inch)"
  
  // 厚度字段 - 修正符号
  thickness_um: '厚度/克重(μm)',  // 🔴 修正：从"(um)"改为"(μm)"
  thickness_mil: '厚度/克重(mil)',
  
  // 数量字段
  pcs_per_box: '单箱数量',
  
  // 重量字段 - 修正单位标准
  net_weight_kg: '单件净重(kg)',
  net_weight_lbs: '单件净重(lb)',  // 🔴 修正：从"(lbs)"改为"(lb)"
  
  // 包装字段
  package_size_cm: '包装尺寸(cm)',
  package_size_inch: '包装尺寸(inch)',
  
  // 其他字段...
},
```

#### 2.2 修改英文字段标签 (en部分)
```typescript
en: {
  // 基础字段
  app_model: 'Applicable Machine',
  name_en: 'Item',  // 🔴 新增，对应CSV标准
  image_url: 'Product Image',  // 🔴 新增，对应CSV标准
  part_number: 'Part No.',
  
  // 规格字段
  model_metric: 'Model',
  model_imperial: 'Model',
  spec: 'Spec.',
  spec_imperial: 'Spec.',
  
  // 泡径字段 - 保持标准
  bubble_diameter_mm: 'Bubble Dia.(mm)',  // 🔴 修正：从"(cm)"改为"(mm)"
  bubble_diameter_inch: 'Bubble Dia.(inch)',
  
  // 形状字段 - 修正名称
  shape: 'Film Type',  // 🔴 修正：从"Shape"改为"Film Type"
  
  // 膜宽字段 - 修正名称
  film_width_cm: 'Width(cm)',  // 🔴 修正：从"Film Width(cm)"改为"Width(cm)"
  film_width_inch: 'Width(inch)',  // 🔴 修正：从"Film Width(inch)"改为"Width(inch)"
  
  // 袋长字段 - 修正名称
  bag_length_cm: 'Perforation(cm)',  // 🔴 修正：从"Bag Length(cm)"改为"Perforation(cm)"
  bag_length_inch: 'Perforation(inch)',  // 🔴 修正：从"Bag Length(inch)"改为"Perforation(inch)"
  
  // 厚度字段 - 保持标准
  thickness_um: 'Thickness/Basis Weight(μm)',  // 🔴 修正：从"(um)"改为"(μm)"
  thickness_mil: 'Thickness/Basis Weight(mil)',
  
  // 数量字段 - 修正名称
  pcs_per_box: 'Qty per Carton',  // 🔴 修正：从"Qty per Box"改为"Qty per Carton"
  
  // 重量字段 - 修正单位标准
  net_weight_kg: 'Net Weight(kg)',
  net_weight_lbs: 'Net Weight(lb)',  // 🔴 修正：从"(lbs)"改为"(lb)"
  
  // 包装字段 - 修正名称
  package_size_cm: 'Packaging Dim.(cm)',  // 🔴 修正：从"Package Size(cm)"改为"Packaging Dim.(cm)"
  package_size_inch: 'Packaging Dim.(inch)',  // 🔴 修正：从"Package Size(inch)"改为"Packaging Dim.(inch)"
  
  // 其他字段...
},
```

### 步骤3：修改购物车字段配置

#### 3.1 修改EnhancedCartSidebar.tsx
打开文件 `frontend/src/components/Cart/EnhancedCartSidebar.tsx`，找到耗材相关的字段显示，修改：

```typescript
// 查找类似这样的代码并修改
const consumableFields = [
  { key: 'image_url', label: '产品图片', labelEn: 'Product Image' },  // 🔴 修正
  { key: 'name_en', label: '名称', labelEn: 'Item' },  // 🔴 修正
  { key: 'part_number', label: '料号', labelEn: 'Part No.' },
  { key: 'spec', label: '规格描述', labelEn: 'Spec.' },  // 🔴 修正
  { key: 'shape', label: '袋型', labelEn: 'Film Type' },  // 🔴 修正
  { key: 'bubble_diameter_mm', label: '泡径(mm)', labelEn: 'Bubble Dia.(mm)' },  // 🔴 修正
  { key: 'pcs_per_box', label: '单箱数量', labelEn: 'Qty per Carton' },  // 🔴 修正
  // ... 其他字段
];
```

#### 3.2 修改useCartDisplayEnhancer.ts
打开文件 `frontend/src/hooks/useCartDisplayEnhancer.ts`，找到字段标签映射，修改：

```typescript
const FIELD_LABELS = {
  // 耗材字段
  consumable: {
    zh: {
      image_url: '产品图片',  // 🔴 修正
      name_en: '名称',  // 🔴 修正
      spec: '规格描述',  // 🔴 修正
      shape: '袋型',  // 🔴 修正
      film_width_cm: '宽度(cm)',  // 🔴 修正
      bag_length_cm: '虚线间距(cm)',  // 🔴 修正
      thickness_um: '厚度/克重(μm)',  // 🔴 修正
      bubble_diameter_mm: '泡径(mm)',  // 🔴 修正
      pcs_per_box: '单箱数量',
      net_weight_lbs: '单件净重(lb)',  // 🔴 修正
      package_size_cm: '包装尺寸(cm)',  // 🔴 修正
    },
    en: {
      image_url: 'Product Image',  // 🔴 修正
      name_en: 'Item',  // 🔴 修正
      spec: 'Spec.',
      shape: 'Film Type',  // 🔴 修正
      film_width_cm: 'Width(cm)',  // 🔴 修正
      bag_length_cm: 'Perforation(cm)',  // 🔴 修正
      thickness_um: 'Thickness/Basis Weight(μm)',  // 🔴 修正
      bubble_diameter_mm: 'Bubble Dia.(mm)',  // 🔴 修正
      pcs_per_box: 'Qty per Carton',  // 🔴 修正
      net_weight_lbs: 'Net Weight(lb)',  // 🔴 修正
      package_size_cm: 'Packaging Dim.(cm)',  // 🔴 修正
    }
  }
};
```

### 步骤4：修改筛选项国际化配置

#### 4.1 修改中文筛选项 (zh.json)
打开文件 `frontend/src/i18n/locales/zh.json`，找到 `filter` 部分，修改：

```json
"filter": {
  "all": "全部",
  "material": "材质",
  "shape": "袋型",  // 🔴 修正：从"形状"改为"袋型"
  "thickness": "厚度",  // 🔴 修正：保持"厚度"用于非纸质材料
  "weight": "克重",  // 🔴 新增：用于纸质材料的"克重"
  "basisWeight": "克重",  // 🔴 新增：标准术语"克重"
  "width": "宽度",  // 🔴 修正：从"膜宽"改为"宽度"
  "length": "虚线间距",  // 🔴 修正：从"袋长"改为"虚线间距"
  "weightImp": "克重(lb)",  // 🔴 修正：从"克重(#)"改为"克重(lb)"
  "weightMet": "克重(gsm)",  // 🔴 修正：保持"克重(gsm)"
  "thicknessImp": "厚度(mil)",  // 🔴 修正：从"厚度(mil)"改为"厚度(mil)"
  "thicknessMet": "厚度(μm)",  // 🔴 修正：从"厚度(um)"改为"厚度(μm)"
  "basisWeightImp": "克重(lb)",  // 🔴 新增：标准术语"克重"英制
  "basisWeightMet": "克重(gsm)",  // 🔴 新增：标准术语"克重"公制
  "widthImp": "宽度(inch)",  // 🔴 修正：从"膜宽(inch)"改为"宽度(inch)"
  "widthMet": "宽度(cm)",  // 🔴 修正：从"膜宽(cm)"改为"宽度(cm)"
  "lengthImp": "虚线间距(inch)",  // 🔴 修正：从"袋长(inch)"改为"虚线间距(inch)"
  "lengthMet": "虚线间距(cm)",  // 🔴 修正：从"袋长(cm)"改为"虚线间距(cm)"
  "bubbleDiameterImp": "泡径(inch)",
  "bubbleDiameterMet": "泡径(mm)",  // 🔴 修正：从"(cm)"改为"(mm)"
  "totalLengthImp": "总长(ft)",
  "totalLengthMet": "总长(m)"
},
```

#### 4.2 修改英文筛选项 (en.json)
打开文件 `frontend/src/i18n/locales/en.json`，找到 `filter` 部分，修改：

```json
"filter": {
  "all": "All",
  "material": "Material",
  "shape": "Film Type",  // 🔴 修正：从"Shape"改为"Film Type"
  "thickness": "Thickness",  // 🔴 修正：保持"Thickness"用于非纸质材料
  "weight": "Basis Weight",  // 🔴 新增：用于纸质材料的"Basis Weight"
  "basisWeight": "Basis Weight",  // 🔴 新增：标准术语"Basis Weight"
  "width": "Width",  // 🔴 修正：保持"Width"（CSV标准）
  "length": "Perforation",  // 🔴 修正：从"Length"改为"Perforation"
  "weightImp": "Basis Weight(lb)",  // 🔴 修正：从"Weight(#)"改为"Basis Weight(lb)"
  "weightMet": "Basis Weight(gsm)",  // 🔴 修正：从"Weight(gsm)"改为"Basis Weight(gsm)"
  "thicknessImp": "Thickness(mil)",  // 🔴 修正：从"Thickness(mil)"改为"Thickness(mil)"
  "thicknessMet": "Thickness(μm)",  // 🔴 修正：从"Thickness(um)"改为"Thickness(μm)"
  "basisWeightImp": "Basis Weight(lb)",  // 🔴 新增：标准术语"Basis Weight"英制
  "basisWeightMet": "Basis Weight(gsm)",  // 🔴 新增：标准术语"Basis Weight"公制
  "widthImp": "Width(inch)",
  "widthMet": "Width(cm)",
  "lengthImp": "Perforation(inch)",  // 🔴 修正：从"Length(inch)"改为"Perforation(inch)"
  "lengthMet": "Perforation(cm)",  // 🔴 修正：从"Length(cm)"改为"Perforation(cm)"
  "bubbleDiameterImp": "Bubble Diameter(inch)",
  "bubbleDiameterMet": "Bubble Diameter(mm)",  // 🔴 修正：从"(cm)"改为"(mm)"
  "totalLengthImp": "Total Length(ft)",
  "totalLengthMet": "Total Length(m)"
},
```

### 步骤5：修改UI组件中的筛选项标题

在耗材页面组件中，还需要修改筛选器的标题显示。查找并修改这些字符串：

```typescript
// 在 frontend/src/pages/Consumables/index.tsx 中查找并修改动态切换逻辑
title={isPaperMaterial(selectedMaterial) ? 
  String(t('filter.basisWeight') || '克重') : 
  String(t('filter.thickness') || '厚度')
}

// 或者根据单位制进一步细化
title={isPaperMaterial(selectedMaterial) ? 
  String(t(userRegion === 'na' || userRegion === 'au' ? 'filter.basisWeightImp' : 'filter.basisWeightMet') || '克重') : 
  String(t(userRegion === 'na' || userRegion === 'au' ? 'filter.thicknessImp' : 'filter.thicknessMet') || '厚度')
}

// 其他筛选项标题
title={String(t('filter.width') || '宽度')}
title={String(t('filter.length') || '虚线间距')}
```

#### 5.1 保持动态切换功能
确保以下逻辑保持不变：
- 纸质材料（PAPER, paper_pe等）显示"克重/Basis Weight"
- 非纸质材料显示"厚度/Thickness"  
- 中英文和公制英制单位正确切换

### 步骤6：重启开发服务器
```bash
cd frontend
npm run dev
```

### 步骤7：验证测试

#### 7.1 页面显示验证
- [ ] 打开耗材页面，检查商品列表字段名称
- [ ] 检查筛选器标题显示名称
- [ ] 检查购物车中的字段名称
- [ ] 检查产品详情弹窗中的字段名称

#### 7.2 关键验证点
**中文名称验证**：
- [ ] 图片字段显示为"产品图片"
- [ ] 形状字段显示为"袋型"而非"形状"
- [ ] 膜宽字段显示为"宽度"而非"膜宽"
- [ ] 袋长字段显示为"虚线间距"而非"袋长"
- [ ] 厚度字段显示为"厚度/克重(μm)"而非"厚度(um)"
- [ ] 泡径字段显示为"泡径(mm)"而非"泡径(cm)"
- [ ] 重量字段单位显示为"(lb)"而非"(lbs)"

**英文名称验证**：
- [ ] 图片字段显示为"Product Image"
- [ ] 名称字段显示为"Item"
- [ ] 形状字段显示为"Film Type"而非"Shape"
- [ ] 膜宽字段显示为"Width"而非"Film Width"
- [ ] 袋长字段显示为"Perforation"而非"Length"
- [ ] 单箱数量显示为"Qty per Carton"而非"Qty per Box"
- [ ] 包装尺寸显示为"Packaging Dim."而非"Package Size"

**筛选项验证**：
- [ ] 筛选器标题正确显示标准化名称
- [ ] 中英文切换时筛选项名称正确
- [ ] 单位制切换时筛选项名称正确
- [ ] 纸质材料时显示"克重/Basis Weight"
- [ ] 非纸质材料时显示"厚度/Thickness"
- [ ] 材料切换时筛选项动态切换正常

#### 7.3 功能验证
- [ ] 智能单位制切换功能正常（公制↔英制）
- [ ] 筛选功能正常工作
- [ ] 页面渲染正常无报错
- [ ] 数据显示正确

### 步骤8：提交修改
```bash
git add frontend/src/config/consumable-display-config.ts
git add frontend/src/components/Cart/EnhancedCartSidebar.tsx
git add frontend/src/hooks/useCartDisplayEnhancer.ts
git add frontend/src/i18n/locales/zh.json
git add frontend/src/i18n/locales/en.json
git commit -m "fix: 标准化耗材页面字段显示名称和筛选项以对齐CSV标准

- 修正图片字段：图片 → 产品图片
- 修正形状字段：形状 → 袋型
- 修正膜宽字段：膜宽 → 宽度
- 修正袋长字段：袋长 → 虚线间距
- 修正厚度符号：um → μm
- 修正泡径单位：cm → mm
- 修正重量单位：lbs → lb
- 修正英文名称：Package Size → Packaging Dim.
- 修正数量字段：Qty per Box → Qty per Carton
- 统一筛选项名称标准化
- 保持厚度/克重动态切换功能：纸质材料显示克重，非纸质显示厚度
- 添加Basis Weight标准术语支持
- 保留单位信息在显示名称中
- 保持智能单位制切换功能完整"
```

## 📋 修改清单总结

| 类别 | 修改项 | 修改前 | 修改后 | 文件数量 |
|------|--------|--------|--------|----------|
| **基础字段** | 图片字段中文 | 图片 | 产品图片 | 3 |
| | 图片字段英文 | Image | Product Image | 3 |
| | 名称字段英文 | Name | Item | 3 |
| | 规格字段中文 | Spec. | 规格描述 | 3 |
| **形状相关** | 形状字段中文 | 形状 | 袋型 | 5 |
| | 形状字段英文 | Shape | Film Type | 5 |
| **尺寸相关** | 膜宽字段中文 | 膜宽 | 宽度 | 5 |
| | 膜宽字段英文 | Film Width | Width | 5 |
| | 袋长字段中文 | 袋长 | 虚线间距 | 5 |
| | 袋长字段英文 | Bag Length/Length | Perforation | 5 |
| **单位标准** | 厚度符号 | um | μm | 5 |
| | 泡径单位中文 | (cm) | (mm) | 5 |
| | 泡径单位英文 | (cm) | (mm) | 5 |
| | 重量单位标准 | (lbs) | (lb) | 5 |
| **包装相关** | 包装尺寸英文 | Package Size | Packaging Dim. | 3 |
| | 数量字段英文 | Qty per Box | Qty per Carton | 3 |
| **筛选项** | 筛选项标题 | 各种不标准名称 | CSV标准名称 | 2 |

**总计：约50处修改，涉及5个文件**

## ⚠️ 注意事项
1. 只修改显示标签，不修改数据字段名
2. 保持unitConfig和单位制切换逻辑不变
3. 所有"lbs"必须改为"lb"
4. 所有"um"必须改为"μm"（希腊字母）
5. 泡径单位从cm改为mm
6. 验证时重点关注筛选器的名称显示

## ✅ 完成标志
- 所有字段名称100%对齐CSV标准
- 筛选项名称100%对齐CSV标准
- 功能测试全部通过
- 代码提交成功 