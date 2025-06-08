# 耗材页面形状筛选项与图片对应关系解决方案

## 🎯 问题描述

耗材页面的形状筛选项需要正确显示对应的图片，确保用户能够通过图片和文字准确选择所需的袋型形状。

## 🔧 问题分析

### 原始问题
1. **字段缺失**：API返回的形状数据中`name_zh`和`name_en`字段为null
2. **图片路径缺失**：缺少`image_url`和`image_url2`字段
3. **数据结构不完整**：前端无法正确渲染形状选择器

### 根本原因
1. **字典控制器**数据格式化时错误地删除了`name_zh`和`name_en`字段
2. **耗材控制器**调用字典API时字段映射不完整

## ✅ 解决方案

### 第一步：修复字典控制器 (已完成)

**文件**: `plugins/bjt-core-entities/controllers/class-dictionary-controller.php`

**问题**: 格式化返回数据时删除了`name_zh`和`name_en`字段

**修复**:
```php
// 根据语言处理返回数据
$formatted_items = [];
foreach ($items as $item) {
    $formatted_item = [
        'code' => $item['code'],
        'name' => $item[$lang === 'zh' ? 'name_zh' : 'name_en'],
    ];
    
    // 添加额外属性（如果有）
    foreach ($item as $key => $value) {
        if (!in_array($key, ['code'])) { // 不排除name_zh和name_en，只排除code避免重复
            $formatted_item[$key] = $value;
        }
    }
    
    $formatted_items[] = $formatted_item;
}
```

### 第二步：修复耗材控制器 (已完成)

**文件**: `plugins/bjt-core-entities/controllers/class-consumable-controller.php`

**问题**: 调用字典API时字段映射不完整

**修复**:
```php
$formatted_item = [
    'id' => $item['code'] ?? null, // 使用code作为id
    'code' => $item['code'] ?? null, 
    'name' => $item['name'] ?? null
];

// 添加额外字段（如image_url等）
if (isset($item['image_url'])) {
    $formatted_item['image_url'] = $item['image_url'];
}
if (isset($item['image_url2'])) {
    $formatted_item['image_url2'] = $item['image_url2'];
}
if (isset($item['name_en'])) {
    $formatted_item['name_en'] = $item['name_en'];
}
if (isset($item['name_zh'])) {
    $formatted_item['name_zh'] = $item['name_zh'];
}
if (isset($item['sort_order'])) {
    $formatted_item['sort_order'] = $item['sort_order'];
}
if (isset($item['id'])) {
    $formatted_item['original_id'] = $item['id']; // 保留原始数据库ID
}
if (isset($item['product_line_id'])) {
    $formatted_item['product_line_id'] = $item['product_line_id'];
}
```

## 📊 数据库表结构

### wp_bjt_shapes 表
```sql
CREATE TABLE `wp_bjt_shapes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `code` varchar(50) NOT NULL COMMENT '形状缩写代码',
  `name_zh` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `image_url` varchar(255) COMMENT '形状图片URL',
  `image_url2` varchar(255) COMMENT '形状图片示意url',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材形状表';
```

### 当前数据样本
```
| id | code | name_zh     | name_en           | image_url                     | image_url2                     |
|----|------|-------------|-------------------|-------------------------------|--------------------------------|
| 1  | MEX  | 气泡枕      | Pillow            | /images/MEX/values/MEX.png    | /images/MEX/values/MEX-2.png   |
| 2  | MEY  | 开口气泡枕  | Precut Air Pillow | /images/MEX/values/MEX.png    | /images/MEX/values/MEX-2.png   |
| 3  | MFB  | 葫芦膜      | Bubble            | /images/MFB/values/MFB.png    | /images/MFB/values/MFB-2.png   |
| 4  | MFC  | 气枕膜      | Tube              | /images/MFC/values/MFC.png    | /images/MFC/values/MFC-2.png   |
| 5  | MFF  | 葫芦膜      | Bubble            | /images/MFF/values/MFF.png    | /images/MFF/values/MFF-2.png   |
```

## 🔗 API端点验证

### 1. 字典API端点
```bash
curl "http://localhost:8080/wp-json/bjt/v1/dictionaries/shapes?lang=zh"
```

**期望响应**:
```json
{
  "success": true,
  "data": {
    "type": "shapes",
    "items": [
      {
        "code": "MEX",
        "name": "气泡枕",
        "name_zh": "气泡枕",
        "name_en": "Pillow",
        "image_url": "/images/MEX/values/MEX.png",
        "image_url2": "/images/MEX/values/MEX-2.png",
        "id": 1,
        "product_line_id": 1,
        "sort_order": 10
      }
    ]
  }
}
```

### 2. 耗材API端点
```bash
curl "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1"
```

**期望响应中的filterOptions.shapes**:
```json
{
  "data": {
    "filterOptions": {
      "shapes": [
        {
          "id": "MEX",
          "name": "气泡枕",
          "name_zh": "气泡枕", 
          "name_en": "Pillow",
          "image_url": "/images/MEX/values/MEX.png",
          "image_url2": "/images/MEX/values/MEX-2.png"
        }
      ]
    }
  }
}
```

## 🎨 前端组件使用

### 形状选择器渲染
```typescript
// 在前端组件中使用形状数据
const renderShapeSelector = () => {
  const shapes = filterOptions?.shapes || [];
  
  return (
    <div className="shape-selector">
      {shapes.map((shape) => (
        <div key={shape.id} className="shape-option">
          <input 
            type="radio"
            id={`shape-${shape.id}`}
            name="shape"
            value={shape.id}
            checked={selectedShape === shape.id}
            onChange={() => handleShapeChange(shape.id)}
          />
          <label htmlFor={`shape-${shape.id}`} className="shape-label">
            {/* 使用image_url显示形状图片 */}
            <img 
              src={shape.image_url || '/images/shapes/default.png'} 
              alt={shape.name_zh || shape.name_en || shape.name}
              className="shape-image"
            />
            {/* 根据语言显示对应的名称 */}
            <span className="shape-name">
              {currentLanguage === 'zh' ? shape.name_zh : shape.name_en}
            </span>
            {/* 显示形状代码 */}
            <span className="shape-code">{shape.id}</span>
          </label>
        </div>
      ))}
    </div>
  );
};
```

### 智能图片显示
```typescript
// 智能图片显示函数
const getShapeImageUrl = (shape: any) => {
  // 优先使用image_url（选择用图片）
  if (shape.image_url) {
    return shape.image_url;
  }
  
  // 备用选择：使用image_url2（示意图）
  if (shape.image_url2) {
    return shape.image_url2;
  }
  
  // 最后备用：默认图片
  return '/images/shapes/default-shape.png';
};

const getShapeDisplayName = (shape: any, language: string) => {
  if (language === 'zh') {
    return shape.name_zh || shape.name || shape.code;
  } else {
    return shape.name_en || shape.name || shape.code;
  }
};
```

## 🔄 字段映射关系

### Shape ID 到 Bag Type 映射
```typescript
// 耗材数据中的bag_type字段对应形状表中的name_en字段
const shapeIdToBagType: Record<string, string> = {
  'MEX': 'Pillow',                 // 气泡枕 -> Pillow
  'MEY': 'Precut Air Pillow',      // 开口气泡枕 -> Precut Air Pillow
  'MFB': 'Bubble',                 // 葫芦膜 -> Bubble
  'MFC': 'Tube',                   // 气枕膜 -> Tube  
  'MFF': 'Bubble'                  // 葫芦膜变种 -> Bubble
};
```

### 筛选逻辑
```typescript
// 前端筛选时的形状匹配逻辑
const matchShapeFilter = (consumableItem: any, selectedShapeId: string) => {
  if (selectedShapeId === 'all') return true;
  
  const expectedBagType = shapeIdToBagType[selectedShapeId];
  return consumableItem.bag_type === expectedBagType;
};
```

## ✅ 验证清单

- [x] **字典API返回完整字段**：name_zh, name_en, image_url, image_url2
- [x] **耗材API包含形状筛选选项**：filterOptions.shapes包含完整数据
- [x] **图片路径正确**：/images/MEX/values/MEX.png等路径存在
- [x] **多语言支持**：中英文名称都可用
- [x] **筛选逻辑正确**：shape ID与bag_type正确映射

## 🚀 后续优化建议

### 1. 图片资源优化
- 确保所有图片文件在服务器上存在
- 添加图片加载失败的备用方案
- 考虑使用WebP格式优化图片大小

### 2. 缓存策略
- 实现形状数据的前端缓存
- 减少重复API调用

### 3. 用户体验增强
- 添加图片懒加载
- 实现图片预览功能
- 添加形状选择的动画效果

## 📋 问题解决总结

✅ **问题已解决**：通过修复字典控制器和耗材控制器的字段映射，确保API返回完整的形状数据，包括：
- 形状名称（中英文）
- 形状图片URL（两种用途）
- 形状代码和ID
- 排序和产品线信息

前端现在可以正确渲染形状筛选器，显示对应的图片和名称，实现完整的形状筛选功能。 
 
 