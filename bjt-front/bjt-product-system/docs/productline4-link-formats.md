# 产品线4子项链接格式支持文档

## 概述

产品线4（气柱袋产品线）的子项支持多种链接格式，可以灵活配置跳转目标。

## 支持的链接格式

### 1. 完整HTTPS链接
```
https://example.com/edit/air-column-bags
https://admin.company.com/products/edit/123
https://crm.system.com/products/air-bags
```

### 2. 完整HTTP链接
```
http://localhost:3000/admin/products
http://internal.system.com/edit
```

### 3. 相对路径（推荐用于内部页面）
```
/admin/products/edit
/consumables/air-column-bags
/products/category/air-bags
```

### 4. 相对路径（当前目录）
```
./edit
./products/air-bags
```

### 5. 相对路径（上级目录）
```
../admin/products
../edit/air-bags
```

## 技术实现

### 前端验证
- 使用Antd的URL类型验证
- 自定义正则表达式验证多种格式
- 实时验证用户输入

### 后端存储
- 数据库字段：`subitem1_link` (VARCHAR(500))
- API字段类型：`string` with `format: 'uri'`
- 支持存储任何有效的URL格式

### 验证规则
```javascript
const urlPattern = /^(https?:\/\/[^\s]+|\/[^\s]*|\.\.?\/[^\s]*)$/;
```

## 使用建议

### 内部页面链接（推荐）
```
/admin/products/air-column-bags/edit
/consumables/line-4/manage
```

### 外部系统链接
```
https://crm.company.com/products/edit?type=air-bags
https://warehouse.system.com/inventory/air-column-bags
```

### 开发环境测试
```
http://localhost:3000/admin/products
http://localhost:5173/products/air-bags
```

## 配置示例

当前产品线4配置：
- **中文名称**: 气柱袋产品
- **英文名称**: Air Column Bag Products  
- **编辑链接**: `https://example.com/edit/air-column-bags`

## 注意事项

1. **安全性**: 外部链接会在新窗口打开，避免安全风险
2. **验证**: 链接必须是有效的URL格式
3. **长度限制**: 链接最大长度500字符
4. **必填字段**: 产品线4的子项链接为必填项

## 测试验证

可以通过以下方式测试链接格式：

1. **前端界面**: 在产品线4编辑页面测试不同链接格式
2. **API测试**: 直接调用API验证链接存储
3. **数据库查询**: 检查链接是否正确保存

```sql
SELECT id, title_zh, subitem1_zh, subitem1_link 
FROM wp_bjt_product_lines 
WHERE id = 4;
``` 