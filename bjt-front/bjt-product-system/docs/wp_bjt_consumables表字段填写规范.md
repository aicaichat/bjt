# wp_bjt_consumables 表字段填写规范

## 📋 重要字段填写指导

### 🎯 筛选功能关键字段（必须正确填写）

#### 1. **bag_type** (形状) - 筛选器显示用
```sql
-- ✅ 标准值（必须使用这些值）
'Pillow'              -- 气泡枕
'Precut Air Pillow'   -- 开口气泡枕  
'Bubble'              -- 气泡膜
'Tube'                -- 气枕膜
'paper Bubble'        -- 纸质气泡膜
'paper air Pillow'    -- 纸质气垫枕

-- ❌ 错误示例
'pillow', 'PILLOW', '气泡枕', 'Air Pillow', 'bubble膜'
```

#### 2. **material** (材质) - 筛选器显示用
```sql
-- ✅ 标准值（必须使用这些值）
'HDPE'          -- 纯HDPE材质
'50% HDPE'      -- 50%回料HDPE
'30% HDPE'      -- 30%回料HDPE  
'LDPE'          -- LDPE材质
'PAPE'          -- PAPE共挤膜
'PAPER'         -- 纸塑膜

-- ❌ 错误示例
'hdpe', '50%HDPE', '50% hdpe', 'paper', '纸质'
```

#### 3. **app_model** (适用机型) - 筛选器显示用
```sql
-- ✅ 标准格式（逗号分隔，无多余引号）
'LA-E4C'                    -- 单个机型
'LA-E4C, LA-E4S V2.0'      -- 多个机型，逗号+空格分隔
'LA-E4S(paper)'             -- 特殊机型标注

-- ❌ 错误示例  
'"LA-E4C","LA-E4S V2.0"'   -- 多余引号
'LA-E4C,LA-E4S V2.0'       -- 缺少空格
'LA-E4C；LA-E4S V2.0'      -- 错误分隔符
```

### 📏 数值字段填写规范

#### 4. **thickness_met** (厚度/重量-公制)
```sql
-- ✅ 塑料材质：厚度(微米)
20, 25, 30, 50, 80, 100

-- ✅ 纸质材质：重量(克/平方米)  
50, 60, 70, 80, 90, 100

-- ❌ 错误示例
NULL, 0, '20um', '50gsm'  -- 不要带单位，不要为空
```

#### 5. **width_met** (膜宽-公制厘米)
```sql
-- ✅ 标准值
20, 40, 60, 80, 100, 120, 150, 200

-- ❌ 错误示例
NULL, 0, '20cm', 2000  -- 不要带单位，不要为空，不要用毫米
```

#### 6. **length_met** (袋长-公制厘米)
```sql
-- ✅ 标准值
10, 13, 16.5, 20, 25, 30, 33, 40

-- ❌ 错误示例
NULL, 0, '10cm', 100  -- 不要带单位，不要为空，不要用毫米
```

### 🏷️ 产品标识字段

#### 7. **part_number** (料号) - 必填
```sql
-- ✅ 标准格式
'MEX-KPB-50-20-13-L'     -- MEX系列
'MEY-KPB-50-20-13-L'     -- MEY系列  
'MFF-HDPE-25-40-16.5-L'  -- MFF系列
'MFC-HDPE-30-80-20-L'    -- MFC系列
'MFB-PAPER-60-40-20-L'   -- MFB系列

-- 格式说明：[系列]-[材质]-[厚度/重量]-[宽度]-[长度]-[规格]
```

#### 8. **model** (型号-公制) - 必填
```sql
-- ✅ 标准格式（包含规格信息）
'MEX-KPB-50-20×13cm'
'MFF-HDPE-25-40×16.5cm'

-- 格式：[系列]-[材质]-[厚度/重量]-[宽度]×[长度]cm
```

#### 9. **model_imperial** (型号-英制)
```sql
-- ✅ 标准格式
'MEX-KPB-50-8"×5"'
'MFF-HDPE-25-16"×6.5"'

-- 格式：[系列]-[材质]-[厚度/重量]-[宽度]"×[长度]"
```

### 💰 价格相关字段

#### 10. **bubble_diameter_met** (泡径-公制毫米)
```sql
-- ✅ 仅气泡类产品填写
10, 20, 30  -- 气泡膜的气泡直径

-- ✅ 非气泡类产品
NULL  -- 气枕膜、纸质产品等不填写
```

#### 11. **pcs_per_box** (单箱数量) - 必填
```sql
-- ✅ 标准值
1, 2, 4, 6, 8, 10, 12  -- 每箱卷数

-- ❌ 错误示例
NULL, 0  -- 必须填写实际数量
```

### 📦 包装信息字段

#### 12. **package_type** (包装方式)
```sql
-- ✅ 标准值
'卷装'     -- 大部分耗材
'盒装'     -- 特殊包装
'袋装'     -- 预切产品
```

#### 13. **total_length_met** (总长度-公制米)
```sql
-- ✅ 标准值
100, 150, 200, 250, 300, 500  -- 每卷总长度(米)

-- ❌ 错误示例
NULL, 0, 10000  -- 不要为空，不要用厘米
```

### 🖼️ 图片字段

#### 14. **image_url** (产品图片)
```sql
-- ✅ 标准路径格式
'/images/MEX/values/MEX.png'
'/images/MFF/values/MFF.png'
'/images/MFC/values/MFC.png'
'/images/MFB/values/MFB.png'

-- 路径规则：/images/[系列]/values/[系列].png
```

#### 15. **package_image_url** (包装图片)
```sql
-- ✅ 标准路径格式  
'/images/MEX/package/MEX-package.png'
'/images/MFF/package/MFF-package.png'

-- 路径规则：/images/[系列]/package/[系列]-package.png
```

## 🚨 常见错误和避免方法

### ❌ 错误1：字段值不统一
```sql
-- 错误：同一个概念用不同的值
bag_type: 'Pillow', 'pillow', 'PILLOW', '气泡枕'

-- 正确：统一使用标准值
bag_type: 'Pillow'
```

### ❌ 错误2：数值字段带单位
```sql
-- 错误：在数值字段中包含单位
thickness_met: '20um', '50gsm'
width_met: '40cm'

-- 正确：纯数值
thickness_met: 20, 50
width_met: 40
```

### ❌ 错误3：机型格式不规范
```sql
-- 错误：引号和分隔符混乱
app_model: '"LA-E4C","LA-E4S V2.0"'
app_model: 'LA-E4C；LA-E4S V2.0'

-- 正确：统一格式
app_model: 'LA-E4C, LA-E4S V2.0'
```

### ❌ 错误4：必填字段为空
```sql
-- 错误：关键字段为空
part_number: NULL
model: NULL
pcs_per_box: NULL

-- 正确：必须填写
part_number: 'MEX-KPB-50-20-13-L'
model: 'MEX-KPB-50-20×13cm'  
pcs_per_box: 4
```

## 📊 数据验证SQL

### 检查数据规范性
```sql
-- 检查bag_type是否规范
SELECT bag_type, COUNT(*) 
FROM wp_bjt_consumables 
WHERE status = 'publish' 
  AND bag_type NOT IN ('Pillow', 'Precut Air Pillow', 'Bubble', 'Tube', 'paper Bubble', 'paper air Pillow')
GROUP BY bag_type;

-- 检查material是否规范  
SELECT material, COUNT(*)
FROM wp_bjt_consumables
WHERE status = 'publish'
  AND material NOT IN ('HDPE', '50% HDPE', '30% HDPE', 'LDPE', 'PAPE', 'PAPER')
GROUP BY material;

-- 检查必填字段是否为空
SELECT 'part_number为空' as issue, COUNT(*) as count
FROM wp_bjt_consumables 
WHERE status = 'publish' AND (part_number IS NULL OR part_number = '')
UNION ALL
SELECT 'model为空' as issue, COUNT(*) as count  
FROM wp_bjt_consumables
WHERE status = 'publish' AND (model IS NULL OR model = '')
UNION ALL
SELECT 'pcs_per_box为空' as issue, COUNT(*) as count
FROM wp_bjt_consumables
WHERE status = 'publish' AND (pcs_per_box IS NULL OR pcs_per_box = 0);
```

## 🎯 新增产品填写模板

```sql
INSERT INTO wp_bjt_consumables (
    part_number,           -- 'MEX-KPB-50-20-13-L'
    model,                 -- 'MEX-KPB-50-20×13cm'  
    model_imperial,        -- 'MEX-KPB-50-8"×5"'
    bag_type,              -- 'Pillow'
    material,              -- 'HDPE'
    app_model,             -- 'LA-E4C, LA-E4S V2.0'
    thickness_met,         -- 50
    width_met,             -- 20
    length_met,            -- 13
    total_length_met,      -- 200
    pcs_per_box,           -- 4
    package_type,          -- '卷装'
    image_url,             -- '/images/MEX/values/MEX.png'
    package_image_url,     -- '/images/MEX/package/MEX-package.png'
    status                 -- 'publish'
) VALUES (
    'MEX-KPB-50-20-13-L',
    'MEX-KPB-50-20×13cm',
    'MEX-KPB-50-8"×5"', 
    'Pillow',
    'HDPE',
    'LA-E4C, LA-E4S V2.0',
    50,
    20,
    13,
    200,
    4,
    '卷装',
    '/images/MEX/values/MEX.png',
    '/images/MEX/package/MEX-package.png',
    'publish'
);
```

## 📝 填写检查清单

新增或修改产品时，请检查：

- [ ] **bag_type** 使用标准值（6个选项之一）
- [ ] **material** 使用标准值（6个选项之一）  
- [ ] **app_model** 格式正确（逗号+空格分隔，无多余引号）
- [ ] **thickness_met** 纯数值，不带单位
- [ ] **width_met** 纯数值，单位厘米
- [ ] **length_met** 纯数值，单位厘米
- [ ] **part_number** 不为空，格式规范
- [ ] **model** 不为空，包含规格信息
- [ ] **pcs_per_box** 不为空，大于0
- [ ] **image_url** 路径正确，文件存在
- [ ] **status** 设为 'publish'

遵循这个规范，可以确保筛选功能正常工作，避免数据不一致问题！ 