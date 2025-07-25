# 前端页面显示验证报告

## 问题描述
用户反馈前端页面只显示了3个产品线，需要检查API返回值和前端显示逻辑。

## 检查结果

### 1. 数据库状态
```sql
+----+--------------------+---------+
| id | title_zh           | status  |
+----+--------------------+---------+
|  1 | 气垫系列           | publish |
|  2 | 纸垫系列ttt        | publish |
|  3 | 胶带系列           | publish |
|  4 | 气柱袋产品线       | publish |
+----+--------------------+---------+
```

### 2. API返回数据
- **API端点**: `GET /wp-json/bjt/v1/product-lines?status=publish`
- **返回数量**: 4个产品线
- **返回顺序**: 4, 1, 2, 3 (按创建时间倒序)

### 3. 产品线4配置
```json
{
  "id": 4,
  "title_zh": "气柱袋产品线",
  "title_en": "Air Column Bag Product Line",
  "subitem1_zh": "气柱袋产品",
  "subitem1_en": "Air Column Bag Products",
  "subitem1_link": "/admin/products/air-column-bags",
  "status": "publish"
}
```

### 4. 前端代码逻辑
- **数据获取**: 使用 `useProductLines` Hook，参数 `status: 'publish'`
- **产品线4特殊处理**: 
  ```javascript
  if (line.id === 4) {
    return [{
      text: getSubitem1(line),
      path: line.subitem1_link,
      isExternal: line.subitem1_link.startsWith('http')
    }];
  }
  ```
- **渲染逻辑**: 显示所有返回的产品线，无过滤

### 5. 样式配置
- **产品线4标识**: `data-product-line="4"`
- **特殊样式**: 绿色主题 (`#52c41a`)
- **外部链接**: 支持HTTP/HTTPS链接，显示外部链接图标

## 预期显示结果
前端页面应该显示4个产品线：
1. **气柱袋产品线** (ID: 4) - 绿色主题，1个链接
2. **气垫系列** (ID: 1) - 蓝色主题，3个链接
3. **纸垫系列** (ID: 2) - 蓝色主题，3个链接
4. **胶带系列** (ID: 3) - 蓝色主题，3个链接

## 解决方案
1. **状态修复**: 已将产品线3的状态从 `draft` 更新为 `publish`，现在API返回所有4个产品线。
2. **排序修复**: 调整了产品线的 `sort_order` 字段：
   - 产品线1: sort_order = 1
   - 产品线2: sort_order = 2  
   - 产品线3: sort_order = 3
   - 产品线4: sort_order = 4

### 排序逻辑
API使用 `ORDER BY sort_order ASC, id DESC` 进行排序，确保产品线按照1, 2, 3, 4的顺序显示。

## 验证步骤
1. 访问 http://localhost:5173
2. 检查页面是否显示4个产品线
3. 验证产品线4是否有绿色主题
4. 验证产品线4是否只有1个链接
5. 验证其他产品线是否有3个链接

## 技术细节
- **前端服务**: http://localhost:5173
- **API服务**: http://localhost:8080
- **数据库**: MySQL (已更新状态)
- **Docker环境**: 正常运行 