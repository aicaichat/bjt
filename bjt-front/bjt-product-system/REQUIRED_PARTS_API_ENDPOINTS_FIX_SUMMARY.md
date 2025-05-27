# 必选备件API端点修复总结（已修正逻辑）

## 修复概述

经过数据库分析，发现了必选备件的正确逻辑：
- **主机（60A01xxx）**：本身没有必选备件
- **配件（60Axxxxx）**：某些配件有必选备件
- **备件（其他格式）**：某些备件有必选备件

已按照正确逻辑对API端点进行了修复。

## 数据库分析结果

### 必选备件关系分布：
```sql
-- 配件的必选备件（在 wp_bjt_relations 表中）
SELECT child_part_number, required_parts, required_quantity 
FROM wp_bjt_relations 
WHERE child_part_number IN ('60A11002', '60A11009', '60A04005') 
AND required_parts IS NOT NULL;

-- 结果：
-- 60A11002 (FR8002收卷车) -> 05A0101289,05A0101290 (数量: 2,2)
-- 60A11009 (FR8004收卷车) -> 05A0101289,05A0101290 (数量: 2,2)  
-- 60A04005 (EC2005推车) -> 05A0101289,05A0101290 (数量: 2,2)
```

```sql
-- 备件的必选备件（在 wp_bjt_spare_parts 表中）
SELECT part_number, required_parts, required_quantity 
FROM wp_bjt_spare_parts 
WHERE required_parts IS NOT NULL;

-- 结果：
-- 01A0101038 (去皱硅胶) -> 11A0103002,11A0101003 (数量: 2,2)
-- 07A0105325 (陶瓷刀片) -> 11A0103157,11A0101002 (数量: 1,1)
-- 等等...
```

## 修复内容

### 1. 主机控制器 (class-part-controller.php) ✅

#### 修复内容：
- **移除必选备件查询**：主机本身不应该有必选备件
- **返回空数组**：`required_parts` 字段始终返回 `[]`
- **保留权限控制**：维持现有的权限检查方法

#### API响应格式：
```json
{
  "id": 1,
  "part_number": "60A01143",
  "name_zh": "LA-E4S V2.0主机",
  "required_parts": [], // 主机没有必选备件
  // ... 其他字段
}
```

### 2. 配件控制器 (class-accessory-controller.php) ✅

#### 修复内容：
- **修正查询逻辑**：查询 `child_part_number` 字段而不是 `part_number`
- **正确的SQL查询**：
  ```sql
  SELECT required_parts, required_quantity 
  FROM wp_bjt_relations 
  WHERE child_part_number = %s 
  AND required_parts IS NOT NULL 
  AND required_parts != ''
  ```

#### API响应格式：
```json
{
  "id": 1,
  "part_number": "60A11002",
  "name": "FR8002 收卷车",
  "required_parts": [
    {
      "part_number": "05A0101289",
      "quantity": 2
    },
    {
      "part_number": "05A0101290",
      "quantity": 2
    }
  ],
  // ... 其他字段
}
```

### 3. 备件控制器 (class-spare-part-controller.php) ✅

#### 修复内容：
- **查询逻辑正确**：已正确查询 `wp_bjt_spare_parts` 表的 `required_parts` 字段
- **数据格式统一**：与配件控制器保持一致的数组格式
- **保持现有功能**：维持兼容性查询等功能

## 正确的查询逻辑

### 主机查询：
```sql
-- 主机本身没有必选备件，不需要查询
-- required_parts 字段返回空数组 []
```

### 配件查询：
```sql
SELECT required_parts, required_quantity 
FROM wp_bjt_relations 
WHERE child_part_number = %s 
AND required_parts IS NOT NULL 
AND required_parts != '' 
AND status = 'publish'
```

### 备件查询：
```sql
-- 直接从备件表获取
SELECT required_parts, required_quantity 
FROM wp_bjt_spare_parts 
WHERE part_number = %s 
AND required_parts IS NOT NULL 
AND required_parts != ''
```

## 测试用例

### 主机测试：
- `60A01143` (LA-E4S V2.0主机) → 应返回 `required_parts: []`

### 配件测试：
- `60A11002` (FR8002收卷车) → 应返回 2个必选备件
- `60A04005` (EC2005推车) → 应返回 2个必选备件  
- `60A04038` (ET400自动分离器) → 应返回 `required_parts: []`

### 备件测试：
- `01A0101038` (去皱硅胶) → 应返回 2个必选备件
- `08A0105795` (8A保险丝) → 应返回 `required_parts: []`

## API端点列表

### 主机相关端点：
- `GET /wp-json/bjt/v1/parts` - 获取主机列表（required_parts为空数组）
- `GET /wp-json/bjt/v1/parts/{id}` - 获取单个主机详情（required_parts为空数组）

### 配件相关端点：
- `GET /wp-json/bjt/v1/accessories` - 获取配件列表（包含必选备件信息）
- `GET /wp-json/bjt/v1/accessories/{id}` - 获取单个配件详情（包含必选备件信息）

### 备件相关端点：
- `GET /wp-json/bjt/v1/spare-parts` - 获取备件列表（包含必选备件信息）
- `GET /wp-json/bjt/v1/spare-parts/{id}` - 获取单个备件详情（包含必选备件信息）

## 前端集成要点

### 1. 逻辑判断
前端应该根据商品类型判断是否需要处理必选备件：
```javascript
function hasRequiredParts(item) {
  // 主机没有必选备件
  if (item.part_number && item.part_number.startsWith('60A01')) {
    return false;
  }
  
  // 配件和备件可能有必选备件
  return item.required_parts && item.required_parts.length > 0;
}
```

### 2. 自动添加逻辑
```javascript
function addRequiredPartsToCart(mainItem) {
  // 只有配件和备件才可能有必选备件
  if (hasRequiredParts(mainItem)) {
    mainItem.required_parts.forEach(requiredPart => {
      addToCart({
        part_number: requiredPart.part_number,
        quantity: requiredPart.quantity,
        is_required: true,
        parent_part_number: mainItem.part_number
      });
    });
  }
}
```

## 完成状态

- ✅ **逻辑分析完成** - 明确了主机、配件、备件的必选备件逻辑
- ✅ **主机控制器修复完成** - 移除了错误的必选备件查询
- ✅ **配件控制器修复完成** - 修正为查询 child_part_number 字段
- ✅ **备件控制器确认正确** - 已正确查询备件表
- ✅ **数据格式统一完成** - 所有API返回一致的数组格式
- ✅ **测试用例准备完成** - 创建了完整的测试验证脚本

所有修复都基于实际数据库分析，确保了逻辑的正确性和数据的一致性。 