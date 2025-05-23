# BJT Core Entities API 接口文档

**版本**: v1.0.0  
**最后更新**: 2023-MM-DD  
**基础URL**: `/wp-json/bjt/v1`

## 目录

1. [通用说明](#1-通用说明)
2. [认证接口](#2-认证接口)
3. [产品线接口](#3-产品线接口)
4. [设备型号接口](#4-设备型号接口)
5. [配件型号接口](#5-配件型号接口)
6. [配件接口](#6-配件接口)
7. [备件型号接口](#7-备件型号接口)
8. [备件接口](#8-备件接口)
9. [耗材接口](#9-耗材接口)
10. [购物车接口](#10-购物车接口)
11. [订单接口](#11-订单接口)
12. [数据字典接口](#12-数据字典接口)
13. [主机料号接口](#13-主机料号接口)
14. [错误码](#14-错误码)

---

## 1. 通用说明

### 1.1 请求格式

所有API请求应采用HTTPS协议，请求头需包含:

```
Content-Type: application/json
Accept: application/json
```

对于需要认证的接口，请求头还需包含:

```
Authorization: Bearer {token}
```

### 1.2 响应格式

所有API响应采用统一JSON格式:

```json
{
  "success": true|false,
  "data": { ... },
  "message": "成功/错误信息（可选）",
  "code": 1001 // 错误码（仅出错时返回）
}
```

### 1.3 错误处理

当API请求失败时，将返回包含错误信息的响应:

```json
{
  "success": false,
  "message": "错误描述",
  "code": 1001 // 错误码
}
```

### 1.4 分页处理

支持分页的接口采用以下参数:

- `page`: 页码，从1开始，默认为1
- `per_page`: 每页记录数，默认为10

分页响应格式在响应头中包含:

- `X-WP-Total`: 总记录数
- `X-WP-TotalPages`: 总页数
- `Link`: 包含上一页和下一页的链接（如果适用）

或在响应体中返回（部分接口）:

```json
{
  "success": true,
  "data": {
    "items": [ ... 数据项数组 ... ],
    "total": 100,    // 总记录数
    "page": 1,       // 当前页码
    "page_size": 10, // 每页记录数
    "total_pages": 10 // 总页数
  }
}
```

### 1.5 多语言支持

大多数接口支持`lang`参数选择语言，可选值:
- `zh` - 中文(默认)
- `en` - 英文

---

## 2. 认证接口

### 2.1 用户登录

用户登录并获取JWT令牌

**请求**:  
- 方法: `POST`
- 路径: `/auth/login`
- 认证: 不需要

**请求体**:
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "expires_in": 86400,
    "user": {
      "id": 123,
      "username": "用户名",
      "email": "email@example.com",
      "name": "姓名",
      "role": "SALES",
      "region": "CN",
      "vipLevel": 2,
      "type": "vip"
    }
  }
}
```

**失败响应** (状态码: 401):
```json
{
  "success": false,
  "message": "用户名或密码错误",
  "code": 1001
}
```

### 2.2 获取当前用户信息

获取当前登录用户的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/user/me`
- 认证: 需要

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "用户名",
    "email": "email@example.com",
    "name": "姓名",
    "role": "SALES",
    "region": "CN",
    "vipLevel": 2,
    "type": "vip",
    "permissions": [
      "view_prices",
      "view_inventory",
      "add_to_cart"
    ]
  }
}
```

**失败响应** (状态码: 401):
```json
{
  "success": false,
  "message": "未授权访问",
  "code": 1002
}
```

### 2.3 刷新令牌

刷新JWT令牌以延长会话时间

**请求**:  
- 方法: `POST`
- 路径: `/auth/refresh`
- 认证: 需要（过期令牌也可以）

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_string",
    "expires_in": 86400
  }
}
```

**失败响应** (状态码: 401):
```json
{
  "success": false,
  "message": "无效的刷新令牌",
  "code": 1003
}
```

### 2.4 退出登录

使当前令牌失效，完成退出登录

**请求**:  
- 方法: `POST`
- 路径: `/auth/logout`
- 认证: 需要

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

---

## 3. 产品线接口

### 3.1 获取产品线列表

获取所有产品线的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/product-lines`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，用于过滤产品线
- `status` (字符串, 可选): 状态筛选，可选值: `publish`, `draft`, `trash`

**成功响应** (状态码: 200):
```json
[
  {
    "id": 1,
    "code": "LP",
    "title_zh": "气垫机产品线",
    "title_en": "Air Cushion Machine Line",
    "description_zh": "气垫机产品线描述",
    "description_en": "Air Cushion Machine Line Description",
    "subitem1_zh": "子项1中文",
    "subitem1_en": "Subitem 1 English",
    "subitem2_zh": "子项2中文",
    "subitem2_en": "Subitem 2 English",
    "subitem3_zh": "子项3中文",
    "subitem3_en": "Subitem 3 English",
    "image_url": "http://example.com/lp.jpg",
    "status": "publish",
    "sort_order": 10,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
  // ... 更多产品线
]
```

**响应头**:
- `X-WP-Total`: 总记录数
- `X-WP-TotalPages`: 总页数
- `Link`: 上一页/下一页链接

### 3.2 创建产品线

创建新的产品线

**请求**:  
- 方法: `POST`
- 路径: `/product-lines`
- 认证: 需要

**请求体**:
```json
{
  "code": "NEWPL",
  "name_cn": "新产品线",
  "name_en": "New Product Line",
  "description_zh": "产品线描述（中文）", 
  "description_en": "Product line description (English)",
  "subitem1_zh": "子项1中文值",
  "subitem1_en": "Subitem 1 English Value",
  "subitem2_zh": "子项2中文值",
  "subitem2_en": "Subitem 2 English Value",
  "subitem3_zh": "子项3中文值",
  "subitem3_en": "Subitem 3 English Value",
  "image_url": "http://example.com/newpl.jpg",
  "status": "publish",
  "sort_order": 5
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Product line created successfully.",
  "data": {
    "id": 2,
    "code": "NEWPL",
    "title_zh": "新产品线",
    "title_en": "New Product Line",
    "description_zh": "产品线描述（中文）",
    "description_en": "Product line description (English)",
    "subitem1_zh": "子项1中文值",
    "subitem1_en": "Subitem 1 English Value",
    "subitem2_zh": "子项2中文值",
    "subitem2_en": "Subitem 2 English Value",
    "subitem3_zh": "子项3中文值",
    "subitem3_en": "Subitem 3 English Value",
    "image_url": "http://example.com/newpl.jpg",
    "status": "publish",
    "sort_order": 5,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: 缺少必填字段
- 状态码 `409`: 代码冲突，已存在相同code的产品线

### 3.3 获取产品线详情

通过ID获取特定产品线的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/product-lines/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 产品线ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "LP",
    "title_zh": "气垫机产品线",
    "title_en": "Air Cushion Machine Line",
    "description_zh": "气垫机产品线描述",
    "description_en": "Air Cushion Machine Line Description",
    "subitem1_zh": "子项1中文",
    "subitem1_en": "Subitem 1 English",
    "subitem2_zh": "子项2中文",
    "subitem2_en": "Subitem 2 English",
    "subitem3_zh": "子项3中文",
    "subitem3_en": "Subitem 3 English",
    "image_url": "http://example.com/lp.jpg",
    "status": "publish",
    "sort_order": 10,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: ID无效
- 状态码 `404`: 产品线不存在

### 3.4 更新产品线

更新现有产品线的信息

**请求**:  
- 方法: `PUT`
- 路径: `/product-lines/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 产品线ID

**请求体**:
```json
{
  "name_cn": "更新的产品线名称",
  "status": "draft",
  "sort_order": 15,
  "subitem1_zh": "更新的子项1中文",
  "subitem1_en": "Updated Subitem 1 English"
  // ... 其他要更新的字段
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Product line updated successfully.",
  "data": {
    "id": 1,
    "code": "LP",
    "title_zh": "更新的产品线名称",
    "title_en": "Air Cushion Machine Line",
    "description_zh": "气垫机产品线描述",
    "description_en": "Air Cushion Machine Line Description",
    "subitem1_zh": "更新的子项1中文",
    "subitem1_en": "Updated Subitem 1 English",
    "subitem2_zh": "子项2中文",
    "subitem2_en": "Subitem 2 English",
    "subitem3_zh": "子项3中文",
    "subitem3_en": "Subitem 3 English",
    "image_url": "http://example.com/lp.jpg",
    "status": "draft",
    "sort_order": 15,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: ID无效或没有有效的更新字段
- 状态码 `404`: 产品线不存在
- 状态码 `409`: 代码冲突，尝试使用已存在的code

### 3.5 删除产品线

删除指定的产品线

**请求**:  
- 方法: `DELETE`
- 路径: `/product-lines/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 产品线ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Product line with ID {id} deleted successfully."
}
```

**失败响应**:
- 状态码 `400`: ID无效
- 状态码 `404`: 产品线不存在
- 状态码 `500`: 数据库错误

---

## 4. 设备型号接口

### 4.1 获取设备列表

获取所有可用设备型号的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/machines`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "code": "MEY-001",
        "title_zh": "气垫机 Pro - MEY系列",
        "title_en": "Air Cushion Machine Pro - MEY Series",
        "description_zh": "气垫机产品描述（中文）",
        "description_en": "Air Cushion Machine description (English)",
        "product_line_id": 1,
        "type": "气垫机",
        "image_url": "http://example.com/images/MEY-001.jpg",
        "image2_url": "http://example.com/images/MEY-001-2.jpg",
        "explosion_diagram_pdf": "http://example.com/docs/MEY-001-diagram.pdf",
        "status": "publish",
        "sort_order": 10,
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多设备
    ],
    "total": 6,
    "page": 1,
    "per_page": 10,
    "total_pages": 1
  }
}
```

### 4.2 获取设备详情

获取单个设备型号的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/machines/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 设备ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "MEY-001",
    "title_zh": "气垫机 Pro - MEY系列",
    "title_en": "Air Cushion Machine Pro - MEY Series",
    "description_zh": "气垫机产品描述（中文）",
    "description_en": "Air Cushion Machine description (English)",
    "product_line_id": 1,
    "type": "气垫机",
    "image_url": "http://example.com/images/MEY-001.jpg",
    "image2_url": "http://example.com/images/MEY-001-2.jpg",
    "explosion_diagram_pdf": "http://example.com/docs/MEY-001-diagram.pdf",
    "status": "publish",
    "sort_order": 10,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: ID无效
- 状态码 `404`: 设备不存在

### 4.3 创建设备

创建新的设备型号

**请求**:  
- 方法: `POST`
- 路径: `/machines`
- 认证: 需要

**请求体**:
```json
{
  "code": "MEY-002",
  "name_cn": "气垫机 Pro - MEY系列 2代",
  "name_en": "Air Cushion Machine Pro - MEY Series 2",
  "product_line_id": 1,
  "description_zh": "气垫机2代产品描述（中文）",
  "description_en": "Air Cushion Machine 2 description (English)",
  "type": "气垫机",
  "image1_url": "http://example.com/images/MEY-002.jpg",
  "image2_url": "http://example.com/images/MEY-002-2.jpg",
  "explosion_diagram_pdf": "http://example.com/docs/MEY-002-diagram.pdf",
  "status": "publish",
  "sort_order": 20
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Machine created successfully.",
  "data": {
    "id": 2,
    "code": "MEY-002",
    "title_zh": "气垫机 Pro - MEY系列 2代",
    "title_en": "Air Cushion Machine Pro - MEY Series 2",
    "description_zh": "气垫机2代产品描述（中文）",
    "description_en": "Air Cushion Machine 2 description (English)",
    "product_line_id": 1,
    "type": "气垫机",
    "image_url": "http://example.com/images/MEY-002.jpg",
    "image2_url": "http://example.com/images/MEY-002-2.jpg",
    "explosion_diagram_pdf": "http://example.com/docs/MEY-002-diagram.pdf",
    "status": "publish",
    "sort_order": 20,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: 缺少必填字段
- 状态码 `409`: 冲突，同一产品线下已存在相同型号的设备

### 4.4 更新设备

更新现有的设备型号信息

**请求**:  
- 方法: `PUT`
- 路径: `/machines/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 设备ID

**请求体**:
```json
{
  "name_cn": "气垫机 Pro - MEY系列（更新）",
  "description_zh": "更新后的产品描述",
  "sort_order": 15
  // ... 其他要更新的字段
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Machine updated successfully.",
  "data": {
    "id": 1,
    "code": "MEY-001",
    "title_zh": "气垫机 Pro - MEY系列（更新）",
    "title_en": "Air Cushion Machine Pro - MEY Series",
    "description_zh": "更新后的产品描述",
    "description_en": "Air Cushion Machine description (English)",
    "product_line_id": 1,
    "type": "气垫机",
    "image_url": "http://example.com/images/MEY-001.jpg",
    "image2_url": "http://example.com/images/MEY-001-2.jpg",
    "explosion_diagram_pdf": "http://example.com/docs/MEY-001-diagram.pdf",
    "status": "publish",
    "sort_order": 15,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: ID无效
- 状态码 `404`: 设备不存在
- 状态码 `409`: 冲突，同一产品线下已存在相同型号的设备

### 4.5 删除设备

删除指定的设备型号

**请求**:  
- 方法: `DELETE`
- 路径: `/machines/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 设备ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Machine deleted successfully.",
  "data": {
    "id": 1
  }
}
```

**失败响应**:
- 状态码 `400`: ID无效
- 状态码 `404`: 设备不存在
- 状态码 `500`: 数据库错误

### 4.6 获取设备配件

获取特定设备型号的适配配件列表

**请求**:  
- 方法: `GET`
- 路径: `/machines/{id}/accessories`
- 认证: 需要

**路径参数**:
- `id` (字符串): 主机料号 (host part number), 例如 "13A00001"

**查询参数**:
- `level` (整数, 可选): 配件级别，默认为1，有效范围1-5

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "FS-001",
        "model": "Floor Stand",
        "title": "地面支架组件",
        "level": 1,
        "image_url": "/images/shop/FS-001.jpg",
        "parts": [
          {
            "id": "BJT-FS-V2-2024",
            "part_number": "BJT-FS-V2-2024",
            "title": "标准地面支架",
            "specs": {
              "电压": "N/A",
              "频率": "N/A",
              "托盘尺寸": "90×70×120cm",
              "一托数量": "16件"
            },
            "spec": "90×70×120cm, 7.8kg",
            "spec_imperial": "35.4×27.6×47.2inch, 17.2lbs"
          }
        ]
      }
    ],
    "total": 1
  }
}
```

**注**: 当前API实现中此功能为占位，响应可能返回临时消息。

---

## 5. 配件型号接口

配件型号接口用于管理和查询配件型号(`wp_bjt_accessory_models`)的信息。

### 5.1 获取配件型号列表

获取配件型号的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/accessory-models`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `product_line_id` (整数, 可选): 产品线ID筛选
- `model` (字符串, 可选): 配件型号编码筛选
- `type` (字符串, 可选): 配件类型筛选
- `status` (字符串, 可选): 状态筛选，可选值: `publish`, `draft`, `trash`
- `search` (字符串, 可选): 搜索词，匹配名称和型号编码
- `orderby` (字符串, 可选): 排序字段，可选值: `id`, `model`, `title_zh`, `title_en`, `type`, `sort_order`, `status`等
- `order` (字符串, 可选): 排序方向，可选值: `ASC`, `DESC`，默认`ASC`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "model": "FS-001",
        "title_zh": "地面支架组件",
        "title_en": "Floor Stand",
        "description_zh": "稳固耐用的地面支架，适用于MEY系列气垫机。",
        "description_en": "Sturdy floor stand for MEY series air cushion machines.",
        "type": "支架",
        "image1_url": "/images/FS-001-1.jpg",
        "image2_url": "/images/FS-001-2.jpg",
        "explosion_diagram_pdf": "/docs/FS-001-diagram.pdf",
        "status": "publish",
        "sort_order": 10,
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多配件型号
    ],
    "total": 10,
    "page": 1,
    "per_page": 10,
    "total_pages": 1
  }
}
```

### 5.2 获取配件型号详情

获取单个配件型号的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/accessory-models/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 配件型号ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_line_id": 1,
    "model": "FS-001",
    "title_zh": "地面支架组件",
    "title_en": "Floor Stand",
    "description_zh": "稳固耐用的地面支架，适用于MEY系列气垫机。",
    "description_en": "Sturdy floor stand for MEY series air cushion machines.",
    "type": "支架",
    "image1_url": "/images/FS-001-1.jpg",
    "image2_url": "/images/FS-001-2.jpg",
    "explosion_diagram_pdf": "/docs/FS-001-diagram.pdf",
    "status": "publish",
    "sort_order": 10,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `404`: 配件型号不存在

### 5.3 创建配件型号

创建新的配件型号

**请求**:  
- 方法: `POST`
- 路径: `/accessory-models`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "model": "FS-002",
  "title_zh": "专业地面支架组件",
  "title_en": "Professional Floor Stand",
  "description_zh": "增强型地面支架，适用于MEY系列高端气垫机。",
  "description_en": "Enhanced floor stand for premium MEY series air cushion machines.",
  "type": "支架",
  "image1_url": "/images/FS-002-1.jpg",
  "image2_url": "/images/FS-002-2.jpg",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "配件型号创建成功",
  "data": {
    "id": 2,
    "product_line_id": 1,
    "model": "FS-002",
    // ... 创建的配件型号信息
  }
}
```

**失败响应**:
- 状态码 `400`: 缺少必填字段或参数无效
- 状态码 `404`: 产品线不存在
- 状态码 `409`: 同一产品线下已存在相同型号编码

### 5.4 更新配件型号

更新现有的配件型号信息

**请求**:  
- 方法: `PUT`
- 路径: `/accessory-models/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 配件型号ID

**请求体**:
```json
{
  "title_zh": "更新的地面支架组件",
  "title_en": "Updated Floor Stand",
  "description_zh": "更新后的地面支架描述",
  "status": "publish"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "配件型号更新成功",
  "data": {
    "id": 1,
    // ... 更新后的配件型号信息
  }
}
```

**失败响应**:
- 状态码 `400`: 参数无效
- 状态码 `404`: 配件型号不存在
- 状态码 `409`: 型号编码冲突

### 5.5 删除配件型号

删除指定的配件型号

**请求**:  
- 方法: `DELETE`
- 路径: `/accessory-models/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 配件型号ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "配件型号删除成功",
  "data": {
    "id": 1
  }
}
```

**失败响应**:
- 状态码 `400`: 配件型号正在被使用
- 状态码 `404`: 配件型号不存在

---

## 6. 配件接口

### 6.1 获取配件列表

获取配件的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/accessories`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10，最大100
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`
- `region` (字符串, 可选): 区域代码，可选值: `CN`, `EU`, `NA`, `AU`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "model": "FS-001",
        "brand": "BJT",
        "part_number": "BJT-FS-V2-2024",
        "name": "地面支架组件",
        "spec": "90×70×120cm, 7.8kg",
        "spec_imperial": "35.4×27.6×47.2inch, 17.2lbs",
        "voltage": "220V/110V",
        "frequency": "50Hz/60Hz",
        "image_url": "/images/shop/FS-001.jpg",
        "status": "publish",
        "unit": "pcs",
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多配件
    ],
    "total": 10,
    "page": 1,
    "page_size": 10,
    "total_pages": 1
  }
}
```

**失败响应**:
- 状态码 `500`: 数据库错误

### 6.2 获取配件详情

获取单个配件的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/accessories/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 配件ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`
- `region` (字符串, 可选): 区域代码，可选值: `CN`, `EU`, `NA`, `AU`

**成功响应** (状态码: 200):
```json
{
  "id": 1,
  "product_line_id": 1,
  "model": "FS-001",
  "brand": "BJT",
  "part_number": "BJT-FS-V2-2024",
  "name": "地面支架组件",
  "spec": "90×70×120cm, 7.8kg",
  "spec_imperial": "35.4×27.6×47.2inch, 17.2lbs",
  "voltage": "220V/110V",
  "frequency": "50Hz/60Hz",
  "package_size_cm": "100×80×20cm",
  "package_size_inch": "39.4×31.5×7.9inch",
  "net_weight_kg": 7.8,
  "net_weight_lbs": 17.2,
  "gross_weight_kg": 8.5,
  "gross_weight_lbs": 18.7,
  "pcs_per_box": 1,
  "pallet_size_cm": "120×100×160cm",
  "pallet_size_inch": "47.2×39.4×63.0inch",
  "pcs_per_pallet": 16,
  "pallet_height_cm": 160,
  "pallet_height_inch": 63.0,
  "pallet_gross_weight_kg": 150,
  "pallet_gross_weight_lbs": 330.7,
  "image_url": "/images/shop/FS-001.jpg",
  "status": "publish",
  "unit": "pcs",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS",
  "model_info": {
    "title": "地面支架",
    "description": "稳固耐用的地面支架，适用于MEY系列气垫机。",
    "type": "支架",
    "image1_url": "/images/FS-001-1.jpg",
    "image2_url": "/images/FS-001-2.jpg",
    "diagram_pdf": "/docs/FS-001-diagram.pdf"
  }
}
```

如果提供了`region`参数，响应中还将包含价格和库存信息：

```json
{
  // ... 基本信息
  "pricing": {
    "base_price": 85,
    "discount_rate": 0.85,
    "currency": "CNY"
  },
  "inventory": [
    {
      "region": "CN",
      "warehouse": "主仓库",
      "quantity": 156,
      "reserved": 5,
      "status": "in_stock"
    }
  ]
}
```

**失败响应**:
- 状态码 `404`: 配件不存在

### 6.3 创建配件

创建新的配件

**请求**:  
- 方法: `POST`
- 路径: `/accessories`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "model": "FS-002",
  "brand": "BJT",
  "part_number": "BJT-FS-PRO-2024",
  "name_zh": "专业地面支架组件",
  "name_en": "Professional Floor Stand",
  "spec": "100×80×130cm, 9.5kg",
  "spec_imperial": "39.4×31.5×51.2inch, 20.9lbs",
  "voltage": "220V/110V",
  "frequency": "50Hz/60Hz",
  "image_url": "/images/shop/FS-002.jpg",
  "status": "publish",
  "unit": "pcs"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Accessory created successfully.",
  "data": {
    "id": 2,
    // ... 创建的配件信息
  }
}
```

### 6.4 更新配件

更新现有的配件信息

**请求**:  
- 方法: `PUT`
- 路径: `/accessories/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 配件ID

**请求体**:
```json
{
  "name_zh": "升级版地面支架组件",
  "name_en": "Upgraded Floor Stand",
  "spec": "90×70×125cm, 8.0kg",
  "image_url": "/images/shop/FS-001-updated.jpg"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Accessory updated successfully.",
  "data": {
    "id": 1,
    // ... 更新后的配件信息
  }
}
```

**失败响应**:
- 状态码 `404`: 配件不存在

### 6.5 删除配件

删除指定的配件

**请求**:  
- 方法: `DELETE`
- 路径: `/accessories/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 配件ID

**查询参数**:
- `force` (布尔, 可选): 是否强制删除，默认为`false`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Accessory deleted successfully."
}
```

**失败响应**:
- 状态码 `404`: 配件不存在

### 6.6 获取配件子配件

获取特定父配件的下级配件列表，按下级配件的型号进行分组。

**请求**:  
- 方法: `GET`
- 路径: `/accessories/{id}/children`
- 认证: 需要

**路径参数**:
- `id` (字符串): 父配件料号 (Parent Accessory Part Number)

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`
- `region` (字符串, 可选): 区域代码，可选值: `CN`, `EU`, `NA`, `AU` (用于获取价格和库存)
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "CHILD-MODEL-001", // 子配件型号代码
        "model": "子配件型号A (例如：打印头模块)",
        "title": "子配件型号A (例如：打印头模块)",
        "image_url": "/images/models/CHILD-MODEL-001.jpg",
        "parts": [
          {
            "id": 101, // wp_bjt_accessories 表中的数据库ID
            "part_number": "CHILD-PN-001A",
            "name": "子配件料号1A (打印头TH-1)",
            "spec": "规格参数1A",
            "spec_imperial": "Imperial Specs 1A",
            "voltage": "24V",
            "frequency": "N/A",
        "unit": "pcs",
            "pricing": {
              "base_price": 50.00,
              "currency": "CNY",
              "discount_rate": 0.05
            },
            "inventory": [
              {
                "warehouse": "主仓库",
                "quantity": 20,
                "reserved": 2,
                "available": 18
              }
            ]
          },
          {
            "id": 102,
            "part_number": "CHILD-PN-001B",
            "name": "子配件料号1B (打印头TH-2)",
            // ... other fields ...
      }
        ]
      },
      {
        "id": "CHILD-MODEL-002",
        "model": "子配件型号B (例如：切刀单元)",
        // ... other fields ...
        "parts": [
          {
            "id": 105,
            "part_number": "CHILD-PN-002A",
            // ... other fields ...
          }
    ]
      }
    ],
    "total": 2, // 总的子配件型号组数
  "page": 1,
    "per_page": 10,
  "total_pages": 1,
    "parent_part_number": "PARENT-ACC-PN-XYZ" // 请求的父配件料号
  }
}
```

如果父配件料号不存在，或没有子配件，`items` 数组将为空，`total` 为0。

**失败响应**:
- 状态码 `404`: 父配件料号不存在 (`parent_accessory_not_found`)
- 状态码 `500`: 数据库错误

### 6.7 获取配件必选备件

获取配件的必选备件列表

**请求**:  
- 方法: `GET`
- 路径: `/accessories/{accessoryId}/required`
- 认证: 需要

**路径参数**:
- `accessoryId` (整数): 配件ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "items": [
    {
      "id": 5,
      "product_line_id": 1,
      "app_model": "MEY-001",
      "model": "SP-001",
      "is_consumable": 0,
      "image_url": "/images/shop/SP-001.jpg",
      "part_number": "BJT-SP-001-2024",
      "name": "连接器",
      "spec": "10×10×5mm",
      "spec_imperial": "0.4×0.4×0.2inch",
      "app_sn": "A123",
      "status": "publish",
      "unit": "pcs",
      "quantity": 2
    }
    // ... 更多必选备件
  ],
  "accessory_id": 1,
  "accessory_part_number": "BJT-FS-V2-2024"
}
```

**失败响应**:
- 状态码 `404`: 配件不存在
- 状态码 `500`: 数据库错误

---

## 7. 备件型号接口

备件型号接口用于管理和查询备件型号(`wp_bjt_spare_part_models`)的信息。

### 7.1 获取备件型号列表

获取备件型号的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/spare-part-models`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `product_line_id` (整数, 可选): 产品线ID筛选
- `model` (字符串, 可选): 备件型号编码筛选
- `type` (字符串, 可选): 备件类型筛选
- `status` (字符串, 可选): 状态筛选，可选值: `publish`, `draft`, `trash`
- `search` (字符串, 可选): 搜索词，匹配名称和型号编码
- `orderby` (字符串, 可选): 排序字段，可选值: `id`, `model`, `title_zh`, `title_en`, `type`, `sort_order`, `status`等
- `order` (字符串, 可选): 排序方向，可选值: `ASC`, `DESC`，默认`ASC`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "model": "SP-001",
        "title_zh": "连接器型号",
        "title_en": "Connector Model",
        "description_zh": "用于连接主机和配件的标准连接器型号。",
        "description_en": "Standard connector model for connecting host machines and accessories.",
        "type": "连接器",
        "image1_url": "/images/models/SP-001.jpg",
        "image2_url": null,
        "explosion_diagram_pdf": "/docs/models/SP-001-diagram.pdf",
        "status": "publish",
        "sort_order": 10,
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多备件型号
    ],
    "total": 10,
    "page": 1,
    "per_page": 10,
    "total_pages": 1
  }
}
```

### 7.2 获取备件型号详情

获取单个备件型号的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/spare-part-models/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 备件型号ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_line_id": 1,
    "model": "SP-001",
    "title_zh": "连接器型号",
    "title_en": "Connector Model",
    "description_zh": "用于连接主机和配件的标准连接器型号。",
    "description_en": "Standard connector model for connecting host machines and accessories.",
    "type": "连接器",
    "image1_url": "/images/models/SP-001.jpg",
    "image2_url": null,
    "explosion_diagram_pdf": "/docs/models/SP-001-diagram.pdf",
    "status": "publish",
    "sort_order": 10,
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `404`: 备件型号不存在

### 7.3 创建备件型号

创建新的备件型号

**请求**:  
- 方法: `POST`
- 路径: `/spare-part-models`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "model": "SP-002",
  "title_zh": "密封圈型号",
  "title_en": "Seal Ring Model",
  "description_zh": "高耐磨密封圈型号，适用于高压环境。",
  "description_en": "High wear-resistant seal ring model for high-pressure environments.",
  "type": "密封件",
  "image1_url": "/images/models/SP-002.jpg",
  "image2_url": "/images/models/SP-002-2.jpg",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "备件型号创建成功",
  "data": {
    "id": 2,
    "product_line_id": 1,
    "model": "SP-002",
    // ... 创建的备件型号信息
  }
}
```

**失败响应**:
- 状态码 `400`: 缺少必填字段或参数无效
- 状态码 `404`: 产品线不存在
- 状态码 `409`: 同一产品线下已存在相同型号编码

### 7.4 更新备件型号

更新现有的备件型号信息

**请求**:  
- 方法: `PUT`
- 路径: `/spare-part-models/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 备件型号ID

**请求体**:
```json
{
  "title_zh": "更新的密封圈型号",
  "title_en": "Updated Seal Ring Model",
  "description_zh": "更新后的高耐磨密封圈型号描述",
  "status": "publish"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "备件型号更新成功",
  "data": {
    "id": 2,
    // ... 更新后的备件型号信息
  }
}
```

**失败响应**:
- 状态码 `400`: 参数无效
- 状态码 `404`: 备件型号不存在
- 状态码 `409`: 型号编码冲突

### 7.5 删除备件型号

删除指定的备件型号

**请求**:  
- 方法: `DELETE`
- 路径: `/spare-part-models/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 备件型号ID

**查询参数**:
- `force` (布尔值, 可选): 是否强制删除，默认为 `false`。当设置为 `true` 时，即使备件型号被引用也会被删除，相关备件的状态将被设置为 `trash`。

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "备件型号删除成功",
  "data": {
    "id": 2
  }
}
```

**失败响应**:
- 状态码 `400`: 备件型号正在被使用 (当 `force=false` 时)
- 状态码 `404`: 备件型号不存在

---

## 8. 备件接口

### 8.1 获取备件列表

获取所有备件的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/spare-parts`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配料号、名称等字段
- `status` (字符串, 可选): 状态筛选，可选值: `publish`, `draft`, `trash`
- `product_line_id` (整数, 可选): 产品线ID筛选
- `app_model` (字符串, 可选): 适用机型筛选

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "part_number": "BJT-SP-001-2024",
        "name": "连接器",
        "app_model": "MEY-001,MEY-002",
        "is_consumable": false,
        "image_url": "/images/spare-parts/SP-001.jpg",
        "spec": "10×10×5mm",
        "spec_imperial": "0.4×0.4×0.2inch",
        "app_sn": "SN10001-SN20000",
        "status": "publish",
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多备件
    ],
    "total": 15,
    "total_pages": 2,
    "current_page": 1
  }
}
```

### 8.2 获取备件详情

获取单个备件的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/spare-parts/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 备件ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_line_id": 1,
    "part_number": "BJT-SP-001-2024",
    "name_zh": "连接器",
    "name_en": "Connector",
    "app_model": "MEY-001,MEY-002",
    "is_consumable": false,
    "image_url": "/images/spare-parts/SP-001.jpg",
    "spec": "10×10×5mm",
    "spec_imperial": "0.4×0.4×0.2inch",
    "app_sn": "SN10001-SN20000",
    "package_size_cm": "15×15×10cm",
    "package_size_inch": "5.9×5.9×3.9inch",
    "net_weight_kg": 0.05,
    "net_weight_lbs": 0.11,
    "gross_weight_kg": 0.07,
    "gross_weight_lbs": 0.15,
    "pcs_per_box": 50,
    "required_parts": "BJT-SP-002-2024",
    "required_quantity": "2",
    "status": "publish",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

### 8.3 创建备件

创建新的备件

**请求**:  
- 方法: `POST`
- 路径: `/spare-parts`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "part_number": "BJT-SP-002-2024",
  "name_zh": "密封圈",
  "name_en": "Seal Ring",
  "app_model": "MEY-001,MEY-003",
  "is_consumable": true,
  "image_url": "/images/spare-parts/SP-002.jpg",
  "spec": "20×20×2mm",
  "spec_imperial": "0.8×0.8×0.08inch",
  "app_sn": "SN20000* (2022及以后)",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Spare part created successfully.",
  "data": {
    "id": 2,
    // ... 创建的备件信息
  }
}
```

### 8.4 更新备件

更新现有的备件信息

**请求**:  
- 方法: `PUT`
- 路径: `/spare-parts/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 备件ID

**请求体**:
```json
{
  "name_zh": "改良版密封圈",
  "name_en": "Improved Seal Ring",
  "app_model": "MEY-001,MEY-003,MEY-004",
  "image_url": "/images/spare-parts/SP-002-updated.jpg"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Spare part updated successfully.",
  "data": {
    "id": 2,
    // ... 更新后的备件信息
  }
}
```

### 8.5 删除备件

删除指定的备件

**请求**:  
- 方法: `DELETE`
- 路径: `/spare-parts/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 备件ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Spare part deleted successfully."
}
```

### 8.6 获取备件兼容性信息

获取备件与设备型号的兼容性信息

**请求**:  
- 方法: `GET`
- 路径: `/spare-parts/{id}/compatibility`
- 认证: 需要

**路径参数**:
- `id` (整数): 备件ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "id": 1,
  "part_number": "BJT-SP-001-2024",
  "name": "连接器",
  "compatible_models": [
    {
      "id": 1,
      "model": "MEY-001",
      "title": "气垫机 Pro - MEY系列",
      "type": "气垫机",
      "image_url": "/images/shop/MEY-001.jpg"
    },
    {
      "id": 2,
      "model": "MEY-002",
      "title": "气垫机 Pro - MEY系列 2代",
      "type": "气垫机",
      "image_url": "/images/shop/MEY-002.jpg"
    }
  ],
  "serial_number_info": {
    "raw": "SN10001-SN20000",
    "formatted": [
      {
        "type": "range",
        "start": "SN10001",
        "end": "SN20000",
        "display": "SN10001-SN20000"
      }
    ]
  }
}
```

**失败响应**:
- 状态码 `404`: 备件不存在

## 9. 耗材接口

### 9.1 获取耗材列表

获取所有耗材的分页列表，支持多种筛选条件

**请求**:  
- 方法: `GET`
- 路径: `/consumables`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配料号、型号、品牌等字段
- `status` (字符串, 可选): 状态筛选，可选值: `publish`, `draft`, `trash`
- `product_line_id` (整数, 可选): 产品线ID筛选
- `model` (字符串, 可选): 兼容主机型号筛选
- `shape` (字符串, 可选): 包装形状筛选，对应数据库中的`bag_type`字段
- `material` (字符串, 可选): 材料筛选
- `thickness` (数值, 可选): 厚度筛选（公制）
- `width` (数值, 可选): 宽度筛选（公制）
- `length` (数值, 可选): 长度筛选（公制）

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "code": "BJT-CONS-001-2024",
        "name": "气垫膜-轻型",
        "brand": "BJT",
        "specs": {
          "material": "HDPE",
          "shape": "roll",
          "thickness": {
            "metric": "25um",
            "imperial": "1mil"
          },
          "width": {
            "metric": "100cm",
            "imperial": "39.4inch"
          },
          "length": {
            "metric": "200m",
            "imperial": "656ft"
          },
          "compatibility": ["MEY-001", "MEY-002"]
        },
        "package_type": "roll",
        "image_url": "/images/consumables/BJT-CONS-001.jpg",
        "status": "publish"
      }
      // ... 更多耗材
    ],
    "total": 25,
    "total_pages": 3,
    "current_page": 1
  }
}
```

### 9.2 获取耗材详情

获取单个耗材的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/consumables/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 耗材ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_line_id": 1,
    "code": "BJT-CONS-001-2024",
    "name": "气垫膜-轻型",
    "brand": "BJT",
    "specs": {
      "material": "HDPE",
      "shape": "roll",
      "thickness": {
        "metric": "25um",
        "imperial": "1mil"
      },
      "width": {
        "metric": "100cm",
        "imperial": "39.4inch"
      },
      "length": {
        "metric": "200m",
        "imperial": "656ft"
      },
      "compatibility": ["MEY-001", "MEY-002"]
    },
    "package_type": "roll",
    "image_url": "/images/consumables/BJT-CONS-001.jpg",
    "status": "publish",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

### 9.3 创建耗材

创建新的耗材

**请求**:  
- 方法: `POST`
- 路径: `/consumables`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "code": "BJT-CONS-002-2024",
  "name": "气垫膜-中型",
  "model": "气垫膜-中型",
  "brand": "BJT",
  "material": "LDPE",
  "bag_type": "roll",
  "thickness_met_val": 30,
  "width_met_val": 120,
  "length_met_val": 150,
  "total_length_met_val": 150,
  "app_model": "MEY-001,MEY-002",
  "package_type": "roll",
  "image_url": "/images/consumables/BJT-CONS-002.jpg",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Consumable created successfully.",
  "data": {
    "id": 2,
    // ... 创建的耗材信息
  }
}
```

### 9.4 更新耗材

更新现有的耗材信息

**请求**:  
- 方法: `PUT`
- 路径: `/consumables/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 耗材ID

**请求体**:
```json
{
  "name": "气垫膜-中型（更新）",
  "thickness_met_val": 32,
  "app_model": "MEY-001,MEY-002,MEY-003",
  "image_url": "/images/consumables/BJT-CONS-002-updated.jpg"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Consumable updated successfully.",
  "data": {
    "id": 2,
    // ... 更新后的耗材信息
  }
}
```

### 9.5 删除耗材

删除指定的耗材

**请求**:  
- 方法: `DELETE`
- 路径: `/consumables/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 耗材ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Consumable deleted successfully."
}
```

### 9.6 批量获取耗材价格

批量获取多个耗材的价格信息

**请求**:  
- 方法: `POST`
- 路径: `/consumables/prices/batch`
- 认证: 需要

**请求体**:
```json
{
  "ids": [1, 2, 3],
  "region": "CN",
  "quantity": 5
}
```

**成功响应** (状态码: 200):
```json
{
  "region": "CN",
  "quantity": 5,
  "items": [
    {
      "id": 1,
      "part_number": "BJT-CONS-001-2024",
      "model": "气垫膜-轻型",
      "found": true,
      "price": 100,
      "currency": "CNY",
      "discount_rate": 0.1,
      "final_price": 90
    },
    {
      "id": 2,
      "part_number": "BJT-CONS-002-2024",
      "model": "气垫膜-中型",
      "found": true,
      "price": 150,
      "currency": "CNY",
      "discount_rate": 0.15,
      "final_price": 127.5
    },
    {
      "id": 3,
      "part_number": "BJT-CONS-003-2024",
      "model": "气垫膜-重型",
      "found": false,
      "price": null,
      "currency": null,
      "discount_rate": null,
      "final_price": null
    }
  ]
}
```

### 9.7 批量获取耗材库存

批量获取多个耗材的库存信息

**请求**:  
- 方法: `POST`
- 路径: `/consumables/inventory/batch`
- 认证: 需要

**请求体**:
```json
{
  "ids": [1, 2, 3],
  "region": "CN",
  "warehouse": "主仓库"
}
```

**请求参数**:
- `ids` (数组, 必需): 耗材ID数组
- `region` (字符串, 可选): 区域代码，可选值: `CN`, `EU`, `NA`, `AU`
- `warehouse` (字符串, 可选): 仓库代码

**成功响应** (状态码: 200):
```json
{
  "items": [
    {
      "id": 1,
      "part_number": "BJT-CONS-001-2024",
      "model": "气垫膜-轻型",
      "found": true,
      "total_quantity": 1000,
      "total_available": 950,
      "inventory": [
        {
          "region": "CN",
          "warehouse": "主仓库",
          "quantity": 1000,
          "reserved": 50,
          "available": 950
        }
      ]
    },
    {
      "id": 2,
      "part_number": "BJT-CONS-002-2024",
      "model": "气垫膜-中型",
      "found": true,
      "total_quantity": 500,
      "total_available": 480,
      "inventory": [
        {
          "region": "CN",
          "warehouse": "主仓库",
          "quantity": 500,
          "reserved": 20,
          "available": 480
        }
      ]
    },
    {
      "id": 3,
      "part_number": "BJT-CONS-003-2024",
      "model": "气垫膜-重型",
      "found": false,
      "total_quantity": 0,
      "total_available": 0,
      "inventory": []
    }
  ]
}
```

**错误响应**:
- 状态码 `400`: 无效的参数
- 状态码 `404`: 未找到有效的耗材

## 10. 购物车接口

购物车接口用于管理用户的购物车内容，包括添加、更新、删除产品以及查看购物车内容。

### 10.1 获取购物车内容

获取当前用户的购物车内容

**请求**:  
- 方法: `GET`
- 路径: `/cart`
- 认证: 需要

**查询参数**:
- `region` (字符串, 可选): 用于价格和库存查询的区域代码
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "items": [
    {
      "item_id": 1,
      "product_type": "host",
      "product_id": 42,
      "part_number": "BJT-H-001",
      "quantity": 1,
      "name": "气垫机 Pro Max",
      "image_url": "/images/hosts/H-001.jpg",
      "unit_price": 1499.99,
      "currency": "CNY",
      "line_total": 1499.99,
      "inventory_status": "in_stock",
      "added_at": "YYYY-MM-DD HH:MM:SS"
    },
    {
      "item_id": 2,
      "product_type": "accessory",
      "product_id": 55,
      "part_number": "BJT-A-010",
      "quantity": 2,
      "name": "连接套件",
      "image_url": "/images/accessories/A-010.jpg",
      "unit_price": 99.50,
      "currency": "CNY",
      "line_total": 199.00,
      "inventory_status": "low_stock",
      "added_at": "YYYY-MM-DD HH:MM:SS"
    }
  ],
  "item_count": 2,
  "total_quantity": 3,
  "cart_total": 1698.99,
  "currency": "CNY"
}
```

### 10.2 添加商品到购物车

添加新商品到当前用户的购物车

**请求**:  
- 方法: `POST`
- 路径: `/cart/items`
- 认证: 需要

**请求体**:
```json
{
  "product_type": "consumable",
  "part_number": "BJT-C-005",
  "quantity": 3
}
```

**成功响应** (状态码: 201):
```json
{
  "item_id": 3,
  "product_type": "consumable",
  "product_id": 78,
  "part_number": "BJT-C-005",
  "quantity": 3,
  "name": "过滤网",
  "image_url": "/images/consumables/C-005.jpg",
  "unit_price": 29.99,
  "currency": "CNY",
  "line_total": 89.97,
  "inventory_status": "in_stock",
  "added_at": "YYYY-MM-DD HH:MM:SS"
}
```

**失败响应**:
- 状态码 `400`: 请求参数错误（如缺少必要字段、数量无效）
- 状态码 `404`: 产品不存在

### 10.3 更新购物车商品数量

更新已在购物车中的商品数量

**请求**:  
- 方法: `PUT`
- 路径: `/cart/items/{item_id}`
- 认证: 需要

**路径参数**:
- `item_id` (整数): 购物车项目ID

**请求体**:
```json
{
  "quantity": 5
}
```

**成功响应** (状态码: 200):
```json
{
  "item_id": 3,
  "product_type": "consumable",
  "product_id": 78,
  "part_number": "BJT-C-005",
  "quantity": 5,
  "name": "过滤网",
  "image_url": "/images/consumables/C-005.jpg",
  "unit_price": 29.99,
  "currency": "CNY",
  "line_total": 149.95,
  "inventory_status": "in_stock",
  "added_at": "YYYY-MM-DD HH:MM:SS"
}
```

**失败响应**:
- 状态码 `400`: 请求参数错误（如数量小于1）
- 状态码 `404`: 购物车项目不存在

### 10.4 删除购物车商品

从购物车中删除指定商品

**请求**:  
- 方法: `DELETE`
- 路径: `/cart/items/{item_id}`
- 认证: 需要

**路径参数**:
- `item_id` (整数): 购物车项目ID

**成功响应** (状态码: 200):
```json
{
  "deleted": true,
  "previous": {
    "item_id": 3,
    "product_type": "consumable",
    "part_number": "BJT-C-005",
    "quantity": 5,
    // ... 被删除项目的其他详细信息
  }
}
```

**失败响应**:
- 状态码 `404`: 购物车项目不存在

### 10.5 清空购物车

删除当前用户购物车中的所有商品

**请求**:  
- 方法: `POST`
- 路径: `/cart/clear`
- 认证: 需要

**成功响应** (状态码: 200):
```json
{
  "cleared": true,
  "deleted_count": 3
}
```

## 11. 订单接口

订单接口用于创建、管理和查询用户的订单信息。

### 11.1 获取订单列表

获取用户订单的分页列表。普通用户只能查看自己的订单，管理员可以查看所有订单。

**请求**:  
- 方法: `GET`
- 路径: `/orders`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配订单号等字段
- `status` (字符串, 可选): 订单状态筛选
- `user_id` (整数, 可选): 用户ID筛选（仅管理员可用）
- `order` (字符串, 可选): 排序方向，可选值: `asc`, `desc`，默认`desc`
- `orderby` (字符串, 可选): 排序字段，可选值: `id`, `order_number`, `status`, `total_amount`, `created_at`，默认`id`

**成功响应** (状态码: 200):
```json
[
  {
    "id": 1001,
    "order_number": "BJT-2023-1001",
    "user_id": 42,
    "status": "processing",
    "total_amount": 1799.99,
    "currency": "CNY",
    "shipping_address": {
      "name": "张三",
      "phone": "13800138000",
      "address": "北京市海淀区科技园路100号",
      "postal_code": "100081"
    },
    "billing_address": {
      "name": "张三",
      "phone": "13800138000",
      "address": "北京市海淀区科技园路100号",
      "postal_code": "100081"
    },
    "payment_method": "alipay",
    "items": [
      {
        "order_item_id": 5001,
        "product_type": "host",
        "product_id": 42,
        "part_number": "BJT-H-001",
        "name": "气垫机 Pro Max",
        "quantity": 1,
        "unit_price": 1499.99,
        "line_total": 1499.99
      },
      {
        "order_item_id": 5002,
        "product_type": "accessory",
        "product_id": 55,
        "part_number": "BJT-A-010",
        "name": "连接套件",
        "quantity": 2,
        "unit_price": 150.00,
        "line_total": 300.00
      }
    ],
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS",
    "_links": {
      "self": {
        "href": "/wp-json/bjt/v1/orders/1001"
      }
    }
  },
  // ... 更多订单
]
```

**分页响应头**:
- `X-WP-Total`: 订单总数
- `X-WP-TotalPages`: 总页数

### 11.2 获取订单详情

获取单个订单的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/orders/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 订单ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "id": 1001,
  "order_number": "BJT-2023-1001",
  "user_id": 42,
  "status": "processing",
  "total_amount": 1799.99,
  "currency": "CNY",
  "shipping_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市海淀区科技园路100号",
    "postal_code": "100081"
  },
  "billing_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市海淀区科技园路100号",
    "postal_code": "100081"
  },
  "payment_method": "alipay",
  "items": [
    {
      "order_item_id": 5001,
      "product_type": "host",
      "product_id": 42,
      "part_number": "BJT-H-001",
      "name": "气垫机 Pro Max",
      "quantity": 1,
      "unit_price": 1499.99,
      "line_total": 1499.99
    },
    {
      "order_item_id": 5002,
      "product_type": "accessory",
      "product_id": 55,
      "part_number": "BJT-A-010",
      "name": "连接套件",
      "quantity": 2,
      "unit_price": 150.00,
      "line_total": 300.00
    }
  ],
  "notes": "请尽快发货，谢谢！",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

**失败响应**:
- 状态码 `404`: 订单不存在
- 状态码 `403`: 无权查看此订单

### 11.3 创建订单

根据用户购物车内容创建新订单

**请求**:  
- 方法: `POST`
- 路径: `/orders`
- 认证: 需要

**请求体**:
```json
{
  "shipping_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市海淀区科技园路100号",
    "postal_code": "100081"
  },
  "billing_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市海淀区科技园路100号",
    "postal_code": "100081"
  },
  "payment_method": "alipay",
  "cart_region": "CN",
  "cart_lang": "zh",
  "notes": "请尽快发货，谢谢！"
}
```

**成功响应** (状态码: 201):
```json
{
  "id": 1001,
  "order_number": "BJT-2023-1001",
  "user_id": 42,
  "status": "pending_payment",
  "total_amount": 1799.99,
  "currency": "CNY",
  "shipping_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市海淀区科技园路100号",
    "postal_code": "100081"
  },
  "billing_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市海淀区科技园路100号",
    "postal_code": "100081"
  },
  "payment_method": "alipay",
  "items": [
    {
      "order_item_id": 5001,
      "product_type": "host",
      "product_id": 42,
      "part_number": "BJT-H-001",
      "name": "气垫机 Pro Max",
      "quantity": 1,
      "unit_price": 1499.99,
      "line_total": 1499.99
    },
    {
      "order_item_id": 5002,
      "product_type": "accessory",
      "product_id": 55,
      "part_number": "BJT-A-010",
      "name": "连接套件",
      "quantity": 2,
      "unit_price": 150.00,
      "line_total": 300.00
    }
  ],
  "notes": "请尽快发货，谢谢！",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

**失败响应**:
- 状态码 `400`: 购物车为空或请求参数错误
- 状态码 `400`: 库存不足

### 11.4 更新订单状态

更新订单的状态（仅管理员可用）

**请求**:  
- 方法: `PUT`
- 路径: `/orders/{id}`
- 认证: 需要（管理员权限）

**路径参数**:
- `id` (整数): 订单ID

**请求体**:
```json
{
  "status": "shipped"
}
```

**成功响应** (状态码: 200):
```json
{
  "id": 1001,
  "order_number": "BJT-2023-1001",
  "status": "shipped",
  // ... 订单的其他详细信息
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

**失败响应**:
- 状态码 `400`: 无效的状态值
- 状态码 `403`: 无管理员权限
- 状态码 `404`: 订单不存在

## 12. 数据字典接口

数据字典接口提供系统中使用的各种基础数据，如区域、标签等。

### 12.1 区域接口

#### 12.1.1 获取区域列表

获取系统中所有区域的列表

**请求**:  
- 方法: `GET`
- 路径: `/regions`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配区域名称等
- `status` (字符串, 可选): 状态筛选，可选值: `active`, `inactive`
- `currency` (字符串, 可选): 货币代码筛选
- `order` (字符串, 可选): 排序方向，可选值: `asc`, `desc`，默认`asc`
- `orderby` (字符串, 可选): 排序字段，可选值: `code`, `name_zh`, `name_en`, `currency`, `status`

**成功响应** (状态码: 200):
```json
[
  {
    "code": "CN",
    "name_zh": "中国",
    "name_en": "China",
    "currency": "CNY",
    "status": "active",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS",
    "_links": {
      "self": {
        "href": "/wp-json/bjt/v1/regions/CN"
      }
    }
  },
  {
    "code": "US",
    "name_zh": "美国",
    "name_en": "United States",
    "currency": "USD",
    "status": "active",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS",
    "_links": {
      "self": {
        "href": "/wp-json/bjt/v1/regions/US"
      }
    }
  }
  // ... 更多区域
]
```

#### 12.1.2 获取区域详情

获取单个区域的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/regions/{code}`
- 认证: 需要

**路径参数**:
- `code` (字符串): 区域代码，如 `CN`, `US`

**成功响应** (状态码: 200):
```json
{
  "code": "CN",
  "name_zh": "中国",
  "name_en": "China",
  "currency": "CNY",
  "status": "active",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

#### 12.1.3 创建区域

创建新的区域（需要管理员权限）

**请求**:  
- 方法: `POST`
- 路径: `/regions`
- 认证: 需要（管理员权限）

**请求体**:
```json
{
  "code": "JP",
  "name_zh": "日本",
  "name_en": "Japan",
  "currency": "JPY"
}
```

**成功响应** (状态码: 201):
```json
{
  "code": "JP",
  "name_zh": "日本",
  "name_en": "Japan",
  "currency": "JPY",
  "status": "active",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

#### 12.1.4 更新区域

更新现有区域的信息（需要管理员权限）

**请求**:  
- 方法: `PUT`
- 路径: `/regions/{code}`
- 认证: 需要（管理员权限）

**路径参数**:
- `code` (字符串): 区域代码，如 `CN`, `US`

**请求体**:
```json
{
  "name_zh": "中国大陆",
  "name_en": "Mainland China",
  "status": "active"
}
```

**成功响应** (状态码: 200):
```json
{
  "code": "CN",
  "name_zh": "中国大陆",
  "name_en": "Mainland China",
  "currency": "CNY",
  "status": "active",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

#### 12.1.5 删除区域

删除指定的区域（需要管理员权限）

**请求**:  
- 方法: `DELETE`
- 路径: `/regions/{code}`
- 认证: 需要（管理员权限）

**路径参数**:
- `code` (字符串): 区域代码，如 `CN`, `US`

**查询参数**:
- `force` (布尔值, 可选): 是否强制删除，默认为 `false`

**成功响应** (状态码: 200):
```json
{
  "deleted": true,
  "previous": {
    "code": "JP",
    "name_zh": "日本",
    "name_en": "Japan",
    // ... 被删除区域的其他详细信息
  }
}
```

### 12.2 标签接口

#### 12.2.1 获取标签列表

获取系统中所有标签的列表

**请求**:  
- 方法: `GET`
- 路径: `/tags`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配标签名称、别名或描述
- `slug` (字符串, 可选): 标签别名筛选
- `order` (字符串, 可选): 排序方向，可选值: `asc`, `desc`，默认`asc`
- `orderby` (字符串, 可选): 排序字段，可选值: `id`, `name`, `slug`

**成功响应** (状态码: 200):
```json
[
  {
    "id": 1,
    "name": "热销",
    "slug": "hot",
    "description": "热销产品标签",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS",
    "_links": {
      "self": {
        "href": "/wp-json/bjt/v1/tags/1"
      }
    }
  },
  {
    "id": 2,
    "name": "新品",
    "slug": "new",
    "description": "新上市产品标签",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS",
    "_links": {
      "self": {
        "href": "/wp-json/bjt/v1/tags/2"
      }
    }
  }
  // ... 更多标签
]
```

#### 12.2.2 获取标签详情

获取单个标签的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/tags/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 标签ID

**成功响应** (状态码: 200):
```json
{
  "id": 1,
  "name": "热销",
  "slug": "hot",
  "description": "热销产品标签",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

#### 12.2.3 创建标签

创建新的标签（需要管理员权限）

**请求**:  
- 方法: `POST`
- 路径: `/tags`
- 认证: 需要（管理员权限）

**请求体**:
```json
{
  "name": "促销",
  "slug": "promotion",
  "description": "促销活动产品标签"
}
```

**成功响应** (状态码: 201):
```json
{
  "id": 3,
  "name": "促销",
  "slug": "promotion",
  "description": "促销活动产品标签",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

#### 12.2.4 更新标签

更新现有标签的信息（需要管理员权限）

**请求**:  
- 方法: `PUT`
- 路径: `/tags/{id}`
- 认证: 需要（管理员权限）

**路径参数**:
- `id` (整数): 标签ID

**请求体**:
```json
{
  "name": "限时促销",
  "description": "限时促销活动产品标签"
}
```

**成功响应** (状态码: 200):
```json
{
  "id": 3,
  "name": "限时促销",
  "slug": "promotion",
  "description": "限时促销活动产品标签",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

#### 11.2.5 删除标签

删除指定的标签（需要管理员权限）

**请求**:  
- 方法: `DELETE`
- 路径: `/tags/{id}`
- 认证: 需要（管理员权限）

**路径参数**:
- `id` (整数): 标签ID

**查询参数**:
- `force` (布尔值, 可选): 是否强制删除，默认为 `true`

**成功响应** (状态码: 200):
```json
{
  "deleted": true,
  "previous": {
    "id": 3,
    "name": "限时促销",
    "slug": "promotion",
    // ... 被删除标签的其他详细信息
  }
}
```

### 12.3 形状接口

形状接口提供系统中使用的各种包装形状数据，主要用于耗材筛选。

#### 12.3.1 获取形状列表

获取系统中所有形状的列表

**请求**:  
- 方法: `GET`
- 路径: `/dictionaries/shapes`
- 认证: 需要

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "type": "shapes",
    "items": [
      {
        "code": "pillow",
        "name": "平袋",
        "id": 1,
        "product_line_id": 1,
        "image_url": "/images/shop/MFB25.jpg",
        "image_url2": "/images/shop/MFB25_demo.jpg",
        "sort_order": 10
      },
      {
        "code": "bubble",
        "name": "气泡袋",
        "id": 2,
        "product_line_id": 1,
        "image_url": "/images/shop/MEX.JPG",
        "image_url2": null,
        "sort_order": 20
      }
    ]
  }
}
```

**失败响应**:
- 状态码 `404`: 字典类型不存在

**使用示例**:
此接口主要用于耗材筛选，前端可通过形状代码(`code`)对耗材进行筛选。耗材中的`bag_type`字段对应形状表中的`code`字段。

### 12.4 材料接口

材料接口提供系统中使用的各种包装材料数据，主要用于耗材筛选。

#### 12.4.1 获取材料列表

获取系统中所有材料的列表

**请求**:  
- 方法: `GET`
- 路径: `/dictionaries/materials`
- 认证: 需要

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "type": "materials",
    "items": [
      {
        "code": "PAPER",
        "name": "纸质",
        "id": 1,
        "product_line_id": 1,
        "sort_order": 10
      },
      {
        "code": "HDPE",
        "name": "高密度聚乙烯",
        "id": 2,
        "product_line_id": 1,
        "sort_order": 20
      },
      {
        "code": "LDPE",
        "name": "低密度聚乙烯",
        "id": 3,
        "product_line_id": 1,
        "sort_order": 30
      }
    ]
  }
}
```

**失败响应**:
- 状态码 `404`: 字典类型不存在

**使用示例**:
此接口主要用于耗材筛选，前端可通过材料代码(`code`)对耗材进行筛选。耗材中的`material`字段对应材料表中的`code`字段。

## 13. 主机料号接口

### 13.1 获取主机料号列表

获取所有主机料号的列表

**请求**:  
- 方法: `GET`
- 路径: `/host-parts`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配主机料号等字段
- `status` (字符串, 可选): 状态筛选，可选值: `publish`, `draft`, `trash`
- `product_line_id` (整数, 可选): 产品线ID筛选
- `app_model` (字符串, 可选): 适用机型筛选

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "part_number": "BJT-H-001",
        "name": "气垫机 Pro Max",
        "app_model": "MEY-001,MEY-002",
        "is_consumable": false,
        "image_url": "/images/hosts/H-001.jpg",
        "spec": "10×10×5mm",
        "spec_imperial": "0.4×0.4×0.2inch",
        "app_sn": "SN10001-SN20000",
        "status": "publish",
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多主机料号
    ],
    "total": 10,
    "total_pages": 2,
    "current_page": 1
  }
}
```

### 13.2 获取主机料号详情

通过ID获取特定主机料号的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/host-parts/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 主机料号ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_line_id": 1,
    "part_number": "BJT-H-001",
    "name": "气垫机 Pro Max",
    "app_model": "MEY-001,MEY-002",
    "is_consumable": false,
    "image_url": "/images/hosts/H-001.jpg",
    "spec": "10×10×5mm",
    "spec_imperial": "0.4×0.4×0.2inch",
    "app_sn": "SN10001-SN20000",
    "package_size_cm": "15×15×10cm",
    "package_size_inch": "5.9×5.9×3.9inch",
    "net_weight_kg": 0.05,
    "net_weight_lbs": 0.11,
    "gross_weight_kg": 0.07,
    "gross_weight_lbs": 0.15,
    "pcs_per_box": 50,
    "required_parts": "BJT-H-002-2024",
    "required_quantity": "2",
    "status": "publish",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**失败响应**:
- 状态码 `400`: ID无效
- 状态码 `404`: 主机料号不存在

### 13.3 创建主机料号

创建新的主机料号

**请求**:  
- 方法: `POST`
- 路径: `/host-parts`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "part_number": "BJT-H-002-2024",
  "name": "气垫机 Pro Max 2代",
  "app_model": "MEY-002,MEY-003",
  "is_consumable": false,
  "image_url": "/images/hosts/H-002.jpg",
  "spec": "10×10×5mm",
  "spec_imperial": "0.4×0.4×0.2inch",
  "app_sn": "SN20001-SN30000",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Host part created successfully.",
  "data": {
    "id": 2,
    // ... 创建的主机料号信息
  }
}
```

**失败响应**:
- 状态码 `400`: 缺少必填字段或参数无效
- 状态码 `404`: 产品线不存在
- 状态码 `409`: 同一产品线下已存在相同型号编码

### 13.4 更新主机料号

更新现有的主机料号信息

**请求**:  
- 方法: `PUT`
- 路径: `/host-parts/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 主机料号ID

**请求体**:
```json
{
  "name": "气垫机 Pro Max 2代（更新）",
  "app_model": "MEY-002,MEY-003,MEY-004",
  "image_url": "/images/hosts/H-002-updated.jpg"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Host part updated successfully.",
  "data": {
    "id": 2,
    // ... 更新后的主机料号信息
  }
}
```

**失败响应**:
- 状态码 `400`: 参数无效
- 状态码 `404`: 主机料号不存在
- 状态码 `409`: 型号编码冲突

### 13.5 删除主机料号

删除指定的主机料号

**请求**:  
- 方法: `DELETE`
- 路径: `/host-parts/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 主机料号ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Host part deleted successfully.",
  "data": {
    "id": 1
  }
}
```

**失败响应**:
- 状态码 `400`: 主机料号正在被使用
- 状态码 `404`: 主机料号不存在

## 14. 错误码

以下是API可能返回的错误码及其含义：

### 14.1 通用错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_param | 请求参数无效 |
| 400 | missing_field | 缺少必要字段 |
| 400 | invalid_json | JSON格式错误 |
| 401 | rest_not_logged_in | 用户未登录 |
| 403 | rest_forbidden | 没有操作权限 |
| 404 | rest_not_found | 资源不存在 |
| 405 | rest_method_not_allowed | 请求方法不允许 |
| 500 | db_error | 数据库操作错误 |
| 500 | server_error | 服务器内部错误 |

### 14.2 认证错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 401 | invalid_credentials | 用户名或密码错误 |
| 401 | invalid_token | 无效的令牌 |
| 401 | expired_token | 令牌已过期 |

### 14.3 产品相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_product_type | 产品类型无效 |
| 404 | product_not_found | 产品不存在 |
| 400 | duplicate_part_number | 料号重复 |

### 14.4 购物车错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | cart_empty | 购物车为空 |
| 400 | invalid_quantity | 数量无效 |
| 404 | cart_item_not_found | 购物车项目不存在 |

### 14.5 订单错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_order_status | 订单状态无效 |
| 400 | insufficient_inventory | 库存不足 |
| 400 | invalid_address | 地址信息无效 |
| 404 | order_not_found | 订单不存在 |

### 14.6 错误响应格式

错误响应的JSON格式如下：

```json
{
  "success": false,
  "code": "error_code",
  "message": "错误描述信息",
  "data": {
    // 可能包含的额外错误信息
  },
  "status": 400 // HTTP状态码
}
```
