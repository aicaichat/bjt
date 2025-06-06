# BJT Core Entities API 接口文档

**版本**: v1.5.0  
**最后更新**: 2025-01-08  
**基础URL**: `/wp-json/bjt/v1`

## 更新日志

### v1.5.0 (2025-01-08)
- ✨ **新增文件上传接口**: 实现完整的文件上传管理功能
  - **POST /upload/specification**: PDF规格文档上传，支持主机设备规格说明书上传
  - **GET /upload/nonce**: 上传认证nonce获取，兼容传统AJAX调用
- 🔐 **JWT认证支持**: 文件上传接口使用JWT Bearer Token认证
- 📁 **文件存储规则**: 规范化存储路径和文件命名规则
- 🚀 **前端集成**: 提供React组件示例和认证Token获取方法
- ⚡ **自动重试机制**: 支持401错误时自动重新登录并重试上传
- 🛡️ **安全验证**: 文件类型、大小限制和权限控制

### v1.4.0 (2025-05-28)
- ✨ **新增系统设置接口**: 实现完整的系统设置管理功能
  - **GET /settings**: 获取系统设置信息，包括基础信息、邮件设置、API设置和安全设置
  - **PUT /settings**: 更新系统设置，支持管理员权限验证
  - **GET /settings/test**: 公开测试端点，用于验证API功能
- 🔧 **数据验证和安全**: 全面的输入验证、数据清理和权限控制
- 🗄️ **自动数据库管理**: 自动创建 `wp_bjt_settings` 表，JSON格式存储配置
- 📝 **完善文档**: 详细的API文档、使用示例和权限说明
- 🔐 **权限控制**: 读取权限可配置，写入权限限制为管理员

### v1.3.0 (2025-05-27)
- 🔧 **重要修正**: 修正必选备件逻辑，明确主机、配件、备件的必选备件关系
  - **主机（60A01xxx）**: 本身没有必选备件，`required_parts` 始终返回空数组 `[]`
  - **配件（60Axxxxx）**: 某些配件有必选备件，查询 `wp_bjt_relations` 表的 `child_part_number` 字段
  - **备件（其他格式）**: 某些备件有必选备件，查询 `wp_bjt_spare_parts` 表的 `required_parts` 字段
- 📊 基于实际数据库分析，确保API逻辑与业务需求一致
- 🔄 统一必选备件数据格式为 `[{part_number, quantity}]` 数组格式
- ✅ 添加完整的测试用例和验证脚本

### v1.2.0 (2025-05-27)
- ✨ 新增备件必选配件关系支持 (`required_parts`, `required_quantity`)
- 🚀 备件接口增强：支持定价和库存信息查询
- 🔧 优化备件数据结构，从关系表动态获取必选配件数据
- 📝 完善备件接口文档，增加定价层级和库存区域信息
- 🐛 修复分页参数处理和响应格式统一

### v1.1.0 (2024-01-15)
- ✨ 新增多级配件关系接口 (`/relations/{part_number}/accessories`)
- 🚀 支持最多5级配件层级的递归查询
- 🔧 优化配件关系查询性能，减少API调用次数
- 📝 完善关系接口文档和错误码

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
14. [关系接口](#14-关系接口)
15. [系统设置接口](#15-系统设置接口)
16. [文件上传接口](#16-文件上传接口)
17. [必选备件逻辑说明](#17-必选备件逻辑说明)
18. [错误码](#18-错误码)

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
        "image1_url": "http://example.com/images/MEY-001.jpg",
        "image2_url": "http://example.com/images/MEY-001-2.jpg",
        "explosion_diagram_pdf": "http://example.com/docs/MEY-001-diagram.pdf",
        "spec_pdf": "http://example.com/docs/MEY-001-spec.pdf",
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
    "image1_url": "http://example.com/images/MEY-001.jpg",
    "image2_url": "http://example.com/images/MEY-001-2.jpg",
    "explosion_diagram_pdf": "http://example.com/docs/MEY-001-diagram.pdf",
    "spec_pdf": "http://example.com/docs/MEY-001-spec.pdf",
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
  "spec_pdf": "http://example.com/docs/MEY-002-spec.pdf",
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
    "image1_url": "http://example.com/images/MEY-002.jpg",
    "image2_url": "http://example.com/images/MEY-002-2.jpg",
    "explosion_diagram_pdf": "http://example.com/docs/MEY-002-diagram.pdf",
    "spec_pdf": "http://example.com/docs/MEY-002-spec.pdf",
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
  "sort_order": 15,
  "image1_url": "http://example.com/images/MEY-001.jpg",
  "spec_pdf": "http://example.com/docs/MEY-001-spec.pdf"
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
    "image1_url": "http://example.com/images/MEY-001.jpg",
    "image2_url": "http://example.com/images/MEY-001-2.jpg",
    "explosion_diagram_pdf": "http://example.com/docs/MEY-001-diagram.pdf",
    "spec_pdf": "http://example.com/docs/MEY-001-spec.pdf",
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
  "success": true,
  "data": {
    "items": [
      {
        "id": 37,
        "product_line_id": 1,
        "app_model": "FR8002,FR8004,EC2005",
        "model": null,
        "is_consumable": false,
        "image_url": "/uploads/accessory/05A0101289.jpg",
        "part_number": "05A0101289",
        "name_zh": "脚垫钣金1",
        "name_en": "Foot Mat Sheet Metal 1",
        "spec": "",
        "spec_imperial": "",
        "app_sn": null,
        "status": "publish",
        "unit": "pcs",
        "quantity": 2
      },
      {
        "id": 38,
        "product_line_id": 1,
        "app_model": "FR8002,FR8004,EC2005",
        "model": null,
        "is_consumable": false,
        "image_url": "/uploads/accessory/05A0101290.jpg",
        "part_number": "05A0101290",
        "name_zh": "脚垫钣金2",
        "name_en": "Foot Mat Sheet Metal 2",
        "spec": "",
        "spec_imperial": "",
        "app_sn": null,
        "status": "publish",
        "unit": "pcs",
        "quantity": 2
      }
    ],
    "accessory_id": 12,
    "accessory_part_number": "60A11002"
  }
}
```

**重要说明**:
- **配件（料号格式：60Axxxxx）的必选备件**从 `wp_bjt_relations` 表查询，使用 `child_part_number` 字段匹配
- 根据实际数据库分析，有必选备件的配件包括：
  - `60A11002` (FR8002 收卷车) → 必选备件：`05A0101289,05A0101290` (数量：2,2)
  - `60A11009` (FR8004 收卷车) → 必选备件：`05A0101289,05A0101290` (数量：2,2)  
  - `60A04005` (EC2005 工作台) → 必选备件：`05A0101289,05A0101290` (数量：2,2)
- 如果配件没有必选备件，返回空数组 `[]`

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

获取所有备件的分页列表，包含定价和库存信息

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
- `is_consumable` (布尔, 可选): 是否为耗材筛选
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_line_id": 1,
        "part_number": "08A0105795",
        "model": null,
        "name_zh": "8A 保险丝",
        "name_en": "8A Fuse",
        "app_model": "\"LA-E4S V2.0\",LA-E4S(paper)",
        "is_consumable": true,
        "image_url": "/uploads/spare_parts/08A0105795.jpg",
        "spec": "8A Fuse For \"LA-E4S V2.0\",LA-E4S(paper) AC100-240V",
        "spec_imperial": "8A Fuse For \"LA-E4S V2.0\",LA-E4S(paper) AC100-240V",
        "app_sn": "ALL",
        "package_size_cm": null,
        "package_size_inch": null,
        "net_weight_kg": 0.01,
        "net_weight_lbs": 0.2,
        "gross_weight_kg": null,
        "gross_weight_lbs": null,
        "pcs_per_box": 1,
        "required_parts": null,
        "required_quantity": null,
        "unit": "pcs",
        "status": "publish",
        "pricing": [
          {
            "range": "1-10",
            "price": 15.50,
            "regionalPrices": {
              "cn": 15.50,
              "eu": 18.60,
              "na": 17.25,
              "au": 19.80
            }
          },
          {
            "range": ">10",
            "price": 13.95,
            "regionalPrices": {
              "cn": 13.95,
              "eu": 16.74,
              "na": 15.53,
              "au": 17.82
            }
          }
        ],
        "inventory": {
          "CN": 150,
          "EU": 75,
          "NA": 100,
          "AU": 50
        }
      },
      {
        "id": 2,
        "product_line_id": 1,
        "part_number": "60A11002",
        "model": null,
        "name_zh": "FR8002 收卷车",
        "name_en": "FR8002 Winder Cart",
        "app_model": "\"LA-E4S V2.0\",LA-E4S(paper)",
        "is_consumable": false,
        "image_url": "/uploads/spare_parts/11A0103002.jpg",
        "spec": "",
        "spec_imperial": "",
        "app_sn": "ALL",
        "package_size_cm": null,
        "package_size_inch": null,
        "net_weight_kg": 0.1,
        "net_weight_lbs": 0.2,
        "gross_weight_kg": null,
        "gross_weight_lbs": null,
        "pcs_per_box": 1,
        "required_parts": "05A0101289,05A0101290",
        "required_quantity": "2,2",
        "unit": "pcs",
        "status": "publish",
        "pricing": [
          {
            "range": "base",
            "price": 1250.00,
            "regionalPrices": {
              "cn": 1250.00,
              "eu": 1500.00,
              "na": 1375.00,
              "au": 1625.00
            }
          }
        ],
        "inventory": {
          "CN": 25,
          "EU": 12,
          "NA": 18,
          "AU": 8
        }
      },
      {
        "id": 3,
        "product_line_id": 1,
        "part_number": "01A0101038",
        "model": null,
        "name_zh": "去皱硅胶",
        "name_en": "Wrinkle Removal Silicone Gel",
        "app_model": "\"LA-E4S V2.0\",LA-E4S(paper)",
        "is_consumable": true,
        "image_url": "/uploads/spare_parts/01A0101038.jpg",
        "spec": "Wrinkle Removal Silicone Gel For \"LA-E4S V2.0\",LA-E4S(paper) AC100-240V",
        "spec_imperial": "Wrinkle Removal Silicone Gel For \"LA-E4S V2.0\",LA-E4S(paper) AC100-240V",
        "app_sn": "ALL",
        "package_size_cm": null,
        "package_size_inch": null,
        "net_weight_kg": 0.1,
        "net_weight_lbs": 0.2,
        "gross_weight_kg": null,
        "gross_weight_lbs": null,
        "pcs_per_box": 1,
        "required_parts": [
          {
            "part_number": "11A0103002",
            "quantity": 2
          },
          {
            "part_number": "11A0101003", 
            "quantity": 2
          }
        ],
        "unit": "pcs",
        "status": "publish",
        "pricing": [
          {
            "range": "base",
            "price": 25.00,
            "regionalPrices": {
              "cn": 25.00,
              "eu": 30.00,
              "na": 28.00,
              "au": 32.00
            }
          }
        ],
        "inventory": {
          "CN": 150,
          "EU": 80,
          "NA": 120,
          "AU": 60
        },
        "created_at": "2025-05-27 10:30:00",
        "updated_at": "2025-05-27 10:30:00"
      }
    ],
    "total": 45,
    "total_pages": 5,
    "current_page": 1
  }
}
```

### 8.2 获取备件详情

获取单个备件的详细信息，包含完整的定价层级和库存信息

**请求**:  
- 方法: `GET`
- 路径: `/spare-parts/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 备件ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "product_line_id": 1,
    "part_number": "60A11002",
    "model": null,
    "name_zh": "FR8002 收卷车",
    "name_en": "FR8002 Winder Cart",
    "app_model": "\"LA-E4S V2.0\",LA-E4S(paper)",
    "is_consumable": false,
    "image_url": "/uploads/spare_parts/11A0103002.jpg",
    "spec": "",
    "spec_imperial": "",
    "app_sn": "ALL",
    "package_size_cm": null,
    "package_size_inch": null,
    "net_weight_kg": 0.1,
    "net_weight_lbs": 0.2,
    "gross_weight_kg": null,
    "gross_weight_lbs": null,
    "pcs_per_box": 1,
    "required_parts": "05A0101289,05A0101290",
    "required_quantity": "2,2",
    "unit": "pcs",
    "status": "publish",
    "pricing": [
      {
        "range": "base",
        "price": 1250.00,
        "regionalPrices": {
          "cn": 1250.00,
          "eu": 1500.00,
          "na": 1375.00,
          "au": 1625.00
        }
      }
    ],
    "inventory": {
      "CN": 25,
      "EU": 12,
      "NA": 18,
      "AU": 8
    },
    "created_at": "2025-05-27 10:30:00",
    "updated_at": "2025-05-27 10:30:00"
  }
}
```

**字段说明**:

#### 基础信息字段
- `id`: 备件唯一标识符
- `product_line_id`: 所属产品线ID
- `part_number`: 备件料号（唯一）
- `model`: 备件型号（可选）
- `name_zh`: 中文名称
- `name_en`: 英文名称
- `app_model`: 适用机型，多个用逗号分隔
- `is_consumable`: 是否为耗材（布尔值）
- `image_url`: 产品图片URL
- `spec`: 规格说明（中文/公制）
- `spec_imperial`: 规格说明（英文/英制）
- `app_sn`: 适用序列号范围
- `unit`: 计量单位（如：pcs, set, kg等）
- `status`: 状态（publish, draft, trash）

#### 包装信息字段
- `package_size_cm`: 包装尺寸（厘米）
- `package_size_inch`: 包装尺寸（英寸）
- `net_weight_kg`: 净重（千克）
- `net_weight_lbs`: 净重（磅）
- `gross_weight_kg`: 毛重（千克）
- `gross_weight_lbs`: 毛重（磅）
- `pcs_per_box`: 每箱数量

#### 必选配件字段
- `required_parts`: 必选配件料号，多个用逗号分隔（如："05A0101289,05A0101290"）
- `required_quantity`: 对应必选配件数量，多个用逗号分隔（如："2,2"）

**重要说明**:
- **备件（非60A开头料号）的必选备件**从 `wp_bjt_spare_parts` 表的 `required_parts` 字段查询
- 根据实际数据库分析，有必选备件的备件包括：
  - `01A0101038` (去皱硅胶) → 必选备件：`11A0103002,11A0101003` (数量：2,2)
  - `07A0105325` (陶瓷刀片) → 必选备件：`11A0103157,11A0101002` (数量：1,1)
- 在新版API中，`required_parts` 字段统一返回数组格式：`[{part_number, quantity}]`
- 如果备件没有必选备件，返回空数组 `[]`

#### 定价信息字段
- `pricing`: 定价层级数组
  - `range`: 数量范围（如："1-10", ">10", "base"）
  - `price`: 默认价格（通常为CN区域价格）
  - `regionalPrices`: 区域价格对象
    - `cn`: 中国区域价格
    - `eu`: 欧洲区域价格
    - `na`: 北美区域价格
    - `au`: 澳洲区域价格

#### 库存信息字段
- `inventory`: 库存信息对象，按区域分组
  - `CN`: 中国区域库存数量
  - `EU`: 欧洲区域库存数量
  - `NA`: 北美区域库存数量
  - `AU`: 澳洲区域库存数量

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
  "part_number": "BJT-SP-003-2024",
  "name_zh": "新型密封圈",
  "name_en": "New Seal Ring",
  "app_model": "\"LA-E4S V2.0\",LA-E4S(paper)",
  "is_consumable": true,
  "image_url": "/uploads/spare_parts/BJT-SP-003.jpg",
  "spec": "新型密封圈规格说明",
  "spec_imperial": "New Seal Ring Specification",
  "app_sn": "ALL",
  "net_weight_kg": 0.05,
  "net_weight_lbs": 0.11,
  "pcs_per_box": 10,
  "unit": "pcs",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Spare part created successfully.",
  "data": {
    "id": 3,
    "product_line_id": 1,
    "part_number": "BJT-SP-003-2024",
    // ... 创建的备件完整信息
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
  "name_zh": "改良版新型密封圈",
  "name_en": "Improved New Seal Ring",
  "app_model": "\"LA-E4S V2.0\",LA-E4S(paper),LA-E5P",
  "spec": "改良版新型密封圈规格说明",
  "spec_imperial": "Improved New Seal Ring Specification"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Spare part updated successfully.",
  "data": {
    "id": 3,
    // ... 更新后的备件完整信息
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
  "success": true,
  "data": {
    "id": 1,
    "part_number": "08A0105795",
    "name": "8A 保险丝",
    "compatible_models": [
      {
        "id": 1,
        "model": "\"LA-E4S V2.0\"",
        "title": "LA-E4S V2.0 商用型缓冲气垫机",
        "type": "气垫机",
        "image_url": "/uploads/host/LA-E4S V2.0.jpg"
      },
      {
        "id": 2,
        "model": "LA-E4S(paper)",
        "title": "LA-E4S(paper)商用型缓冲气垫机",
        "type": "气垫机",
        "image_url": "/uploads/host/LA-E4S(paper).jpg"
      }
    ],
    "serial_number_info": {
      "raw": "ALL",
      "formatted": [
        {
          "type": "universal",
          "display": "适用于所有序列号"
        }
      ]
    },
    "required_parts_info": {
      "has_required_parts": false,
      "required_parts": null,
      "required_quantity": null,
      "parsed_requirements": []
    }
  }
}
```

### 8.7 获取备件筛选选项

获取备件页面的筛选选项数据

**请求**:  
- 方法: `GET`
- 路径: `/spare-parts/filter-options`
- 认证: 需要

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "hostModels": [
      "\"LA-E4S V2.0\"",
      "LA-E4S(paper)"
    ],
    "accessoryModels": [
      "ET400",
      "ET1003",
      "FR8002"
    ],
    "partTypes": [
      {
        "id": "consumable",
        "name": "耗材"
      },
      {
        "id": "component",
        "name": "组件"
      }
    ]
  }
}
```

**失败响应**:
- 状态码 `404`: 备件不存在
- 状态码 `500`: 服务器内部错误

**注意事项**:
1. **必选配件关系**: 当备件有`required_parts`时，添加到购物车会自动计算并提示相关的必选配件
2. **定价层级**: 根据购买数量自动匹配对应的价格层级
3. **库存检查**: 添加到购物车前会检查对应区域的库存数量
4. **序列号兼容性**: `app_sn`字段支持多种格式：
   - `"ALL"`: 适用于所有序列号
   - `"SN10001-SN20000"`: 序列号范围
   - `"BJTE4S-21-****"`: 带通配符的序列号模式
   - `">BJTE4S-3511153"`: 大于某个序列号的所有设备

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
    "part_number": "60A01143",
    "name": "LA-E4S V2.0主机-标准版",
    "app_model": "LA-E4S V2.0",
    "is_consumable": false,
    "image_url": "/uploads/host/LA-E4S V2.0.jpg",
    "spec": "Business Class Air Cushion Pillow & Bubble System,AC220V",
    "spec_imperial": "Business Class Air Cushion Pillow & Bubble System,AC220V",
    "app_sn": "ALL",
    "package_size_cm": "40×34.5×39",
    "package_size_inch": "15.7×13.6×15.4",
    "net_weight_kg": 8.8,
    "net_weight_lbs": 19.4,
    "gross_weight_kg": 10.8,
    "gross_weight_lbs": 23.8,
    "pcs_per_box": 1,
    "required_parts": [],
    "status": "publish",
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

**重要说明**:
- **主机（料号格式：60A01xxx）本身没有必选备件**，`required_parts` 字段始终返回空数组 `[]`
- 主机的配件和备件关系通过关系接口 `/relations/{part_number}` 查询

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

## 14. 关系接口

关系接口用于管理产品与配件之间的关系。

### 14.1 获取产品与配件关系列表

获取产品与配件关系的分页列表

**请求**:  
- 方法: `GET`
- 路径: `/product-accessory-relations`
- 认证: 需要

**查询参数**:
- `page` (整数, 可选): 页码，默认1
- `per_page` (整数, 可选): 每页数量，默认10
- `search` (字符串, 可选): 搜索词，匹配产品名称、配件名称等字段
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
        "product_id": 42,
        "part_number": "BJT-H-001",
        "accessory_id": 55,
        "accessory_part_number": "BJT-A-010",
        "status": "publish",
        "created_at": "YYYY-MM-DD HH:MM:SS",
        "updated_at": "YYYY-MM-DD HH:MM:SS"
      }
      // ... 更多产品与配件关系
    ],
    "total": 10,
    "total_pages": 2,
    "current_page": 1
  }
}
```

### 14.2 获取产品与配件关系详情

获取单个产品与配件关系的详细信息

**请求**:  
- 方法: `GET`
- 路径: `/product-accessory-relations/{id}`
- 认证: 需要

**路径参数**:
- `id` (整数): 产品与配件关系ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "id": 1,
  "product_line_id": 1,
  "product_id": 42,
  "part_number": "BJT-H-001",
  "accessory_id": 55,
  "accessory_part_number": "BJT-A-010",
  "status": "publish",
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS"
}
```

### 14.3 创建产品与配件关系

创建新的产品与配件关系

**请求**:  
- 方法: `POST`
- 路径: `/product-accessory-relations`
- 认证: 需要 (写入权限)

**请求体**:
```json
{
  "product_line_id": 1,
  "product_id": 42,
  "part_number": "BJT-H-001",
  "accessory_id": 55,
  "accessory_part_number": "BJT-A-010",
  "status": "publish"
}
```

**成功响应** (状态码: 201):
```json
{
  "success": true,
  "message": "Product accessory relation created successfully.",
  "data": {
    "id": 2,
    // ... 创建的产品与配件关系信息
  }
}
```

### 14.4 更新产品与配件关系

更新现有的产品与配件关系信息

**请求**:  
- 方法: `PUT`
- 路径: `/product-accessory-relations/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 产品与配件关系ID

**请求体**:
```json
{
  "status": "draft"
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Product accessory relation updated successfully.",
  "data": {
    "id": 1,
    // ... 更新后的产品与配件关系信息
  }
}
```

### 14.5 删除产品与配件关系

删除指定的产品与配件关系

**请求**:  
- 方法: `DELETE`
- 路径: `/product-accessory-relations/{id}`
- 认证: 需要 (写入权限)

**路径参数**:
- `id` (整数): 产品与配件关系ID

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Product accessory relation deleted successfully."
}
```

### 14.6 获取产品与配件关系兼容性信息

获取产品与配件关系的兼容性信息

**请求**:  
- 方法: `GET`
- 路径: `/product-accessory-relations/{id}/compatibility`
- 认证: 需要

**路径参数**:
- `id` (整数): 产品与配件关系ID

**查询参数**:
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`

**成功响应** (状态码: 200):
```json
{
  "id": 1,
  "product_line_id": 1,
  "product_id": 42,
  "part_number": "BJT-H-001",
  "accessory_id": 55,
  "accessory_part_number": "BJT-A-010",
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
- 状态码 `404`: 产品与配件关系不存在

### 14.7 获取多级配件关系 (新增优化接口)

获取指定产品的多级配件关系树形结构，支持最多5级配件层级

**请求**:  
- 方法: `GET`
- 路径: `/relations/{part_number}/accessories`
- 认证: 需要

**路径参数**:
- `part_number` (字符串): 主机料号

**查询参数**:
- `max_levels` (整数, 可选): 最大层级数，范围1-5，默认5
- `lang` (字符串, 可选): 语言，可选值: `zh`, `en`，默认`zh`
- `region` (字符串, 可选): 区域代码，可选值: `CN`, `EU`, `NA`, `AU`，用于获取价格和库存信息

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "data": {
    "part_number": "60A01149",
    "max_levels": 5,
    "accessories": [
      {
        "id": "1",
        "part_number": "60A04038",
        "model": "ET400",
        "name": "ET400 自动分离器",
        "spec": "ET400 Auto Separator,AC110V",
        "spec_imperial": "ET400 Auto Separator,AC110V",
        "voltage": "110V",
        "frequency": null,
        "image_url": "/uploads/accessory/ET400.jpg",
        "unit": "pcs",
        "level": 1,
        "pricing": {
          "base_price": 299.99,
          "currency": "CNY",
          "discount_rate": 0.1
        },
        "inventory": [
          {
            "warehouse": "CN-BJ-01",
            "quantity": 50,
            "reserved": 5,
            "available": 45
          }
        ],
        "children": [
          {
            "id": "22",
            "part_number": "60A04039",
            "model": "EC401",
            "name": "EC401 小支架",
            "spec": "EC401 Small bracket",
            "spec_imperial": "EC401 Small bracket",
            "voltage": null,
            "frequency": null,
            "image_url": "/uploads/accessory/EC401.jpg",
            "unit": "pcs",
            "level": 2,
            "pricing": {
              "base_price": 29.99,
              "currency": "CNY",
              "discount_rate": 0.05
            },
            "inventory": [
              {
                "warehouse": "CN-BJ-01",
                "quantity": 100,
                "reserved": 10,
                "available": 90
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "19",
        "part_number": "60A06006",
        "model": "EC2007",
        "name": "EC2007 移动网篮",
        "spec": "EC2007 Movable Basket",
        "spec_imperial": "EC2007 Movable Basket",
        "voltage": null,
        "frequency": null,
        "image_url": "/uploads/accessory/EC2007.jpg",
        "unit": "pcs",
        "level": 1,
        "children": []
      }
    ]
  }
}
```

**特性说明**:
- **递归层级结构**: 自动获取最多5级的配件关系
- **去重处理**: 自动去除重复的配件记录
- **完整信息**: 包含配件的完整信息（规格、价格、库存等）
- **多语言支持**: 根据lang参数返回对应语言的配件名称
- **区域化数据**: 根据region参数返回对应区域的价格和库存信息
- **性能优化**: 一次API调用获取所有层级数据，减少网络请求

**失败响应**:
- 状态码 `400`: 参数无效（如max_levels超出范围）
- 状态码 `404`: 指定料号不存在
- 状态码 `500`: 服务器内部错误

**使用示例**:
```bash
# 获取60A01149的所有配件关系（最多5级）
GET /wp-json/bjt/v1/relations/60A01149/accessories?lang=zh&region=CN&max_levels=5

# 只获取前2级配件关系
GET /wp-json/bjt/v1/relations/60A01149/accessories?max_levels=2

# 获取英文版本的配件信息
GET /wp-json/bjt/v1/relations/60A01149/accessories?lang=en&region=EU
```

**数据结构说明**:
- `level`: 配件层级，1为一级配件，2为二级配件，以此类推
- `children`: 子配件数组，包含下一级的配件信息
- `pricing`: 价格信息（仅在提供region参数时返回）
- `inventory`: 库存信息（仅在提供region参数时返回）

## 15. 必选备件逻辑说明

### 15.1 业务逻辑概述

在BJT产品系统中，必选备件（Required Parts）是指某些产品在使用时必须配套的其他零部件。根据产品类型的不同，必选备件的查询逻辑也有所区别：

### 15.2 产品类型与必选备件关系

#### 15.2.1 主机（Host Parts）
- **料号格式**: `60A01xxx`
- **必选备件**: 主机本身**没有必选备件**
- **API返回**: `required_parts` 字段始终返回空数组 `[]`
- **关系查询**: 主机的配件和备件关系通过关系接口 `/relations/{part_number}` 查询

**示例主机料号**:
- `60A01143` - LA-E4S V2.0主机-标准版
- `60A01141` - LA-E4S V2.0主机-美标版
- `60A01148` - LA-E4S(paper)主机-标准版
- `60A01149` - LA-E4S(paper)主机-美标版

#### 15.2.2 配件（Accessories）
- **料号格式**: `60Axxxxx`（除主机外的60A开头料号）
- **必选备件**: 某些配件有必选备件
- **数据来源**: 查询 `wp_bjt_relations` 表，使用 `child_part_number` 字段匹配
- **API接口**: `/accessories/{accessoryId}/required`

**有必选备件的配件**:
- `60A11002` (FR8002 收卷车) → 必选备件：`05A0101289,05A0101290` (数量：2,2)
- `60A11009` (FR8004 收卷车) → 必选备件：`05A0101289,05A0101290` (数量：2,2)
- `60A04005` (EC2005 工作台) → 必选备件：`05A0101289,05A0101290` (数量：2,2)

#### 15.2.3 备件（Spare Parts）
- **料号格式**: 非60A开头的各种格式
- **必选备件**: 某些备件有必选备件
- **数据来源**: 查询 `wp_bjt_spare_parts` 表的 `required_parts` 字段
- **API接口**: 在备件详情接口中直接返回

**有必选备件的备件**:
- `01A0101038` (去皱硅胶) → 必选备件：`11A0103002,11A0101003` (数量：2,2)
- `07A0105325` (陶瓷刀片) → 必选备件：`11A0103157,11A0101002` (数量：1,1)

### 15.3 数据格式统一

#### 15.3.1 数据库存储格式
在数据库中，必选备件信息以逗号分隔的字符串形式存储：
- `required_parts`: `"05A0101289,05A0101290"`
- `required_quantity`: `"2,2"`

#### 15.3.2 API返回格式
在API响应中，必选备件信息统一返回为数组格式：
```json
{
  "required_parts": [
    {
      "part_number": "05A0101289",
      "quantity": 2
    },
    {
      "part_number": "05A0101290", 
      "quantity": 2
    }
  ]
}
```

#### 15.3.3 空值处理
- 如果产品没有必选备件，返回空数组：`"required_parts": []`
- 不返回 `null` 或 `undefined`

### 15.4 API控制器实现

#### 15.4.1 主机控制器 (class-part-controller.php)
```php
// 主机没有必选备件，直接返回空数组
$formatted_item['required_parts'] = [];
```

#### 15.4.2 配件控制器 (class-accessory-controller.php)
```php
// 从关系表查询必选备件
$relations = $wpdb->get_results($wpdb->prepare(
    "SELECT required_parts, required_quantity 
     FROM {$wpdb->prefix}bjt_relations 
     WHERE child_part_number = %s 
     AND required_parts IS NOT NULL 
     AND required_parts != ''",
    $part_number
));
```

#### 15.4.3 备件控制器 (class-spare-part-controller.php)
```php
// 从备件表直接获取必选备件信息
// required_parts 字段已存在于表中
$required_parts = $item_db_object->required_parts;
$required_quantity = $item_db_object->required_quantity;
```

### 15.5 前端使用指南

#### 15.5.1 判断产品类型
```javascript
function determinePartType(partNumber) {
  if (partNumber.startsWith('60A01')) {
    return 'host';
  } else if (partNumber.startsWith('60A')) {
    return 'accessory';
  } else {
    return 'spare_part';
  }
}
```

#### 15.5.2 获取必选备件
```javascript
// 主机：直接返回空数组
if (partType === 'host') {
  return [];
}

// 配件：调用专门的必选备件接口
if (partType === 'accessory') {
  const response = await fetch(`/wp-json/bjt/v1/accessories/${accessoryId}/required`);
  return response.data.items;
}

// 备件：从详情接口获取
if (partType === 'spare_part') {
  const response = await fetch(`/wp-json/bjt/v1/spare-parts/${sparePartId}`);
  return response.data.required_parts;
}
```

### 15.6 测试验证

#### 15.6.1 测试用例
系统提供了完整的测试脚本 `test-required-parts-logic.php` 来验证必选备件逻辑：

```bash
# 运行测试脚本
php test-required-parts-logic.php
```

#### 15.6.2 预期结果
- 主机接口：`required_parts` 始终为空数组
- 配件接口：正确返回必选备件信息（如果有）
- 备件接口：正确返回必选备件信息（如果有）

---

## 16. 错误码

以下是API可能返回的错误码及其含义：

### 16.1 通用错误码

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

### 16.2 认证错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 401 | invalid_credentials | 用户名或密码错误 |
| 401 | invalid_token | 无效的令牌 |
| 401 | expired_token | 令牌已过期 |

### 16.3 产品相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_product_type | 产品类型无效 |
| 404 | product_not_found | 产品不存在 |
| 400 | duplicate_part_number | 料号重复 |
| 400 | missing_part_number | 缺少料号 |
| 400 | missing_product_line_id | 缺少产品线ID |
| 409 | duplicate_spare_part | 该产品线中已存在相同料号的备件 |
| 400 | invalid_required_parts_format | 必选配件格式无效 |
| 400 | required_parts_not_found | 必选配件不存在 |
| 400 | insufficient_inventory | 库存不足 |
| 400 | invalid_pricing_tier | 定价层级无效 |

### 16.4 备件相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 404 | spare_part_not_found | 备件不存在 |
| 400 | invalid_spare_part_id | 备件ID无效 |
| 400 | spare_part_required_parts_missing | 必选配件缺失 |
| 400 | spare_part_compatibility_check_failed | 备件兼容性检查失败 |
| 400 | invalid_app_model_format | 适用机型格式无效 |
| 400 | invalid_serial_number_format | 序列号格式无效 |
| 400 | spare_part_filter_options_unavailable | 备件筛选选项不可用 |

### 16.5 购物车错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | cart_empty | 购物车为空 |
| 400 | invalid_quantity | 数量无效 |
| 404 | cart_item_not_found | 购物车项目不存在 |

### 16.6 订单错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_order_status | 订单状态无效 |
| 400 | insufficient_inventory | 库存不足 |
| 400 | invalid_address | 地址信息无效 |
| 404 | order_not_found | 订单不存在 |

### 16.7 关系接口错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_max_levels | 最大层级数超出范围(1-5) |
| 400 | invalid_part_number | 料号格式无效 |
| 404 | part_not_found | 指定料号不存在 |
| 404 | no_accessories_found | 未找到相关配件 |

### 16.8 系统设置相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | missing_settings_data | 缺少设置数据 |
| 400 | settings_validation_failed | 设置数据验证失败 |
| 400 | json_encode_failed | JSON编码失败 |
| 500 | settings_get_failed | 获取设置失败 |
| 500 | settings_update_failed | 更新设置失败 |
| 500 | database_save_failed | 数据库保存失败 |

### 16.9 错误响应格式

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

## 17. 系统设置接口

系统设置接口用于管理全局系统配置，包括基础信息、邮件设置、API设置和安全设置等。

### 17.1 获取系统设置

获取系统的完整设置信息

**请求**:  
- 方法: `GET`
- 路径: `/settings`
- 认证: 需要

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    // 基础信息
    "company_name": "BJT Technology",
    "contact_info": "contact@bjt.com",
    "logo_url": "/images/logo-1.webp",
    
    // 系统设置
    "default_language": "zh",
    "theme": "default",
    "timezone": "Asia/Shanghai",
    "date_format": "YYYY-MM-DD",
    
    // 邮件设置
    "smtp_host": "smtp.example.com",
    "smtp_port": 587,
    "smtp_username": "user@example.com",
    "smtp_password": "encrypted_password",
    "smtp_encryption": "tls",
    "mail_from_address": "noreply@bjt.com",
    "mail_from_name": "BJT System",
    
    // API设置
    "payment_api": "https://api.payment.com",
    "logistics_api": "https://api.logistics.com",
    "inventory_api": "https://api.inventory.com",
    
    // 安全设置
    "session_timeout": 3600,
    "password_policy": {
      "min_length": 8,
      "require_uppercase": true,
      "require_lowercase": true,
      "require_numbers": true,
      "require_symbols": false
    },
    "login_attempts": 5,
    "lockout_duration": 900
  }
}
```

**字段说明**:

#### 基础信息字段
- `company_name`: 公司名称
- `contact_info`: 联系信息（邮箱格式）
- `logo_url`: 公司Logo URL

#### 系统设置字段
- `default_language`: 默认语言，可选值: `zh`, `en`
- `theme`: 主题设置
- `timezone`: 时区设置
- `date_format`: 日期格式

#### 邮件设置字段
- `smtp_host`: SMTP服务器地址
- `smtp_port`: SMTP端口号
- `smtp_username`: SMTP用户名
- `smtp_password`: SMTP密码
- `smtp_encryption`: 加密方式，可选值: `none`, `ssl`, `tls`
- `mail_from_address`: 发件人邮箱
- `mail_from_name`: 发件人名称

#### API设置字段
- `payment_api`: 支付API地址
- `logistics_api`: 物流API地址
- `inventory_api`: 库存API地址

#### 安全设置字段
- `session_timeout`: 会话超时时间（秒）
- `password_policy`: 密码策略对象
  - `min_length`: 最小长度
  - `require_uppercase`: 是否需要大写字母
  - `require_lowercase`: 是否需要小写字母
  - `require_numbers`: 是否需要数字
  - `require_symbols`: 是否需要特殊符号
- `login_attempts`: 最大登录尝试次数
- `lockout_duration`: 锁定时长（秒）

### 17.2 更新系统设置

更新系统设置信息

**请求**:  
- 方法: `PUT`
- 路径: `/settings`
- 认证: 需要（管理员权限）

**请求体**:
```json
{
  "company_name": "BJT Technology Updated",
  "contact_info": "updated@bjt.com",
  "default_language": "en",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_encryption": "tls",
  "session_timeout": 7200,
  "password_policy": {
    "min_length": 10,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": true
  }
}
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    // 更新后的完整设置信息
    "company_name": "BJT Technology Updated",
    "contact_info": "updated@bjt.com",
    "logo_url": "/images/logo-1.webp",
    "default_language": "en",
    "theme": "default",
    "timezone": "Asia/Shanghai",
    "date_format": "YYYY-MM-DD",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "",
    "smtp_password": "",
    "smtp_encryption": "tls",
    "mail_from_address": "",
    "mail_from_name": "BJT System",
    "payment_api": "",
    "logistics_api": "",
    "inventory_api": "",
    "session_timeout": 7200,
    "password_policy": {
      "min_length": 10,
      "require_uppercase": true,
      "require_lowercase": true,
      "require_numbers": true,
      "require_symbols": true
    },
    "login_attempts": 5,
    "lockout_duration": 900
  }
}
```

**失败响应**:
- 状态码 `400`: 请求参数错误或验证失败
```json
{
  "success": false,
  "code": "settings_validation_failed",
  "message": "Settings validation failed: Invalid email format",
  "data": {
    "status": 400
  }
}
```
- 状态码 `401`: 未授权访问
```json
{
  "success": false,
  "code": "rest_forbidden", 
  "message": "Sorry, you are not allowed to do that.",
  "data": {
    "status": 401
  }
}
```
- 状态码 `500`: 服务器内部错误
```json
{
  "success": false,
  "code": "database_save_failed",
  "message": "Failed to save settings to database",
  "data": {
    "status": 500
  }
}
```

### 17.3 测试系统设置API

测试系统设置API是否正常工作

**请求**:  
- 方法: `GET`
- 路径: `/settings/test`
- 认证: 不需要（公开测试端点）

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Settings API test successful",
  "data": {
    "status": "ok",
    "message": "Settings API is working correctly",
    "endpoints": {
      "GET /wp-json/bjt/v1/settings": "Get system settings",
      "PUT /wp-json/bjt/v1/settings": "Update system settings",
      "GET /wp-json/bjt/v1/settings/test": "Test endpoint (current)"
    },
    "timestamp": "2025-05-28 23:01:25"
  }
}
```

### 17.4 数据验证规则

#### 基础信息验证
- `company_name`: 文本清理，不能为空
- `contact_info`: 邮箱格式验证
- `logo_url`: URL格式验证

#### 系统设置验证
- `default_language`: 枚举值验证（zh, en）
- `theme`: 文本清理
- `timezone`: 文本清理
- `date_format`: 文本清理

#### 邮件设置验证
- `smtp_host`: 文本清理
- `smtp_port`: 整数验证，范围1-65535
- `smtp_username`: 文本清理
- `smtp_password`: 不进行清理（保持原始值）
- `smtp_encryption`: 枚举值验证（none, ssl, tls）
- `mail_from_address`: 邮箱格式验证
- `mail_from_name`: 文本清理

#### 安全设置验证
- `session_timeout`: 整数验证，最小值300秒（5分钟）
- `login_attempts`: 整数验证，最小值3次
- `lockout_duration`: 整数验证，最小值300秒（5分钟）
- `password_policy.min_length`: 整数验证，最小值6
- 其他密码策略字段: 布尔值验证

### 17.5 权限管理

#### 读取权限
- **当前实现**: 允许所有人读取（用于测试）
- **生产环境**: 应限制为登录用户
- **建议**: `return is_user_logged_in();`

#### 写入权限
- **当前实现**: 仅管理员可写入
- **验证**: `return current_user_can('manage_options');`
- **说明**: 只有具有WordPress管理员权限的用户才能修改系统设置

### 17.6 数据存储

#### 数据库表结构
```sql
CREATE TABLE wp_bjt_settings (
  id int(11) NOT NULL AUTO_INCREMENT,
  option_key varchar(100) NOT NULL,
  option_value longtext NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_option_key (option_key)
);
```

#### 存储格式
- **键**: `system` (用于系统设置)
- **值**: JSON格式的设置数据
- **编码**: UTF-8，支持中文字符
- **自动管理**: 表不存在时自动创建

### 17.7 使用示例

#### JavaScript/TypeScript示例
```javascript
// 获取系统设置
const getSettings = async () => {
  try {
    const response = await fetch('/wp-json/bjt/v1/settings');
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message);
  } catch (error) {
    console.error('Failed to get settings:', error);
  }
};

// 更新系统设置
const updateSettings = async (settings) => {
  try {
    const response = await fetch('/wp-json/bjt/v1/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message);
  } catch (error) {
    console.error('Failed to update settings:', error);
  }
};
```

#### PHP示例
```php
// 获取系统设置
$response = wp_remote_get('http://localhost:5173/wp-json/bjt/v1/settings');
$body = wp_remote_retrieve_body($response);
$data = json_decode($body, true);

// 更新系统设置
$settings = [
  'company_name' => 'New Company Name',
  'contact_info' => 'new@example.com'
];

$response = wp_remote_request('http://localhost:5173/wp-json/bjt/v1/settings', [
  'method' => 'PUT',
  'headers' => ['Content-Type' => 'application/json'],
  'body' => json_encode($settings)
]);
```

## 16. 文件上传接口

文件上传接口使用BJT Core Entities插件提供的上传控制器，支持PDF规格文档上传等功能。

### 16.1 上传PDF规格文档

上传主机设备的PDF规格说明书

**请求**:  
- 方法: `POST`
- 路径: `/upload/specification`
- 认证: 需要（JWT Token）

**请求参数**:
- `host_id` (整数, 必需): 主机ID，用于关联上传的文件
- `upload_dir` (字符串, 可选): 上传目录，默认为 `frontend/public/uploads`
- `pdf_file` (文件, 必需): 要上传的PDF文件

**请求示例**:
```javascript
const formData = new FormData();
formData.append('pdf_file', file);
formData.append('host_id', '123');
formData.append('upload_dir', 'frontend/public/uploads');

const response = await fetch('/wp-json/bjt/v1/upload/specification', {
  method: 'POST',
  body: formData,
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
  },
});
```

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "PDF规格说明书上传成功",
  "data": {
    "url": "http://example.com/frontend/public/uploads/specifications/123/document_1672531200.pdf",
    "filename": "document_1672531200.pdf",
    "host_id": 123,
    "file_size": 2048576,
    "upload_path": "/path/to/frontend/public/uploads/specifications/123/document_1672531200.pdf"
  }
}
```

**失败响应**:
- 状态码 `400`: 请求参数错误
```json
{
  "success": false,
  "code": "invalid_host_id",
  "message": "无效的主机ID",
  "data": {
    "status": 400
  }
}
```
- 状态码 `400`: 文件类型错误
```json
{
  "success": false,
  "code": "invalid_file_type",
  "message": "只能上传PDF文件",
  "data": {
    "status": 400
  }
}
```
- 状态码 `400`: 文件过大
```json
{
  "success": false,
  "code": "file_too_large",
  "message": "文件大小不能超过10MB",
  "data": {
    "status": 400
  }
}
```
- 状态码 `401`: 认证失败
```json
{
  "success": false,
  "code": "rest_not_logged_in",
  "message": "未提供授权令牌",
  "data": {
    "status": 401
  }
}
```
- 状态码 `403`: 权限不足
```json
{
  "success": false,
  "code": "insufficient_permissions",
  "message": "权限不足，无法上传文件",
  "data": {
    "status": 403
  }
}
```

### 16.2 获取上传nonce

获取用于上传的认证nonce（兼容传统AJAX调用）

**请求**:  
- 方法: `GET`
- 路径: `/upload/nonce`
- 认证: 需要（JWT Token）

**成功响应** (状态码: 200):
```json
{
  "success": true,
  "message": "Nonce生成成功",
  "data": {
    "nonce": "abc123def456",
    "action": "bjt_upload_specification",
    "user_id": 1
  }
}
```

**失败响应**:
- 状态码 `401`: 用户未认证
```json
{
  "success": false,
  "code": "user_not_authenticated",
  "message": "用户未认证",
  "data": {
    "status": 401
  }
}
```

### 16.3 文件存储规则

#### 16.3.1 存储路径
- **基础路径**: `frontend/public/uploads/`
- **规格文档路径**: `frontend/public/uploads/specifications/{host_id}/`
- **文件命名**: `{原文件名}_{时间戳}.{扩展名}`

#### 16.3.2 文件限制
- **支持格式**: PDF (.pdf)
- **最大大小**: 10MB
- **文件名**: 自动添加时间戳避免冲突

#### 16.3.3 权限要求
- **允许角色**: admin, editor, manager
- **认证方式**: JWT Bearer Token
- **API端点**: BJT Core Entities (`/wp-json/bjt/v1/upload/*`)

### 16.4 前端集成示例

#### 16.4.1 React组件示例
```typescript
interface PdfUploaderProps {
  hostId?: number;
  onChange?: (url: string) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ hostId, onChange }) => {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('host_id', hostId?.toString() || '0');
    formData.append('upload_dir', 'frontend/public/uploads');

    try {
      const response = await fetch('/wp-json/bjt/v1/upload/specification', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        onChange?.(result.data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
};
```

#### 16.4.2 认证Token获取
```javascript
// 通过登录获取JWT Token
const getAuthToken = async () => {
  const response = await fetch('/wp-json/bjt/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  return data.success ? data.data.token : null;
};
```

### 16.5 错误处理

#### 16.5.1 文件上传相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_host_id | 主机ID无效 |
| 400 | no_file | 没有上传文件 |
| 400 | upload_error | 文件上传错误 |
| 400 | invalid_file_type | 文件类型无效 |
| 400 | file_too_large | 文件过大 |
| 401 | rest_not_logged_in | 未提供授权令牌 |
| 401 | user_not_authenticated | 用户未认证 |
| 403 | insufficient_permissions | 权限不足 |
| 500 | save_failed | 保存文件失败 |

#### 16.5.2 自动重试机制
前端组件支持自动重试机制：
- 遇到401错误时自动尝试重新登录
- 获取新token后重试上传
- 最多重试一次，避免无限循环

## 17. 必选备件逻辑说明

### 17.1 业务逻辑概述

在BJT产品系统中，必选备件（Required Parts）是指某些产品在使用时必须配套的其他零部件。根据产品类型的不同，必选备件的查询逻辑也有所区别：

### 17.2 产品类型与必选备件关系

#### 17.2.1 主机（Host Parts）
- **料号格式**: `60A01xxx`
- **必选备件**: 主机本身**没有必选备件**
- **API返回**: `required_parts` 字段始终返回空数组 `[]`
- **关系查询**: 主机的配件和备件关系通过关系接口 `/relations/{part_number}` 查询

**示例主机料号**:
- `60A01143` - LA-E4S V2.0主机-标准版
- `60A01141` - LA-E4S V2.0主机-美标版
- `60A01148` - LA-E4S(paper)主机-标准版
- `60A01149` - LA-E4S(paper)主机-美标版

#### 17.2.2 配件（Accessories）
- **料号格式**: `60Axxxxx`（除主机外的60A开头料号）
- **必选备件**: 某些配件有必选备件
- **数据来源**: 查询 `wp_bjt_relations` 表，使用 `child_part_number` 字段匹配
- **API接口**: `/accessories/{accessoryId}/required`

**有必选备件的配件**:
- `60A11002` (FR8002 收卷车) → 必选备件：`05A0101289,05A0101290` (数量：2,2)
- `60A11009` (FR8004 收卷车) → 必选备件：`05A0101289,05A0101290` (数量：2,2)
- `60A04005` (EC2005 工作台) → 必选备件：`05A0101289,05A0101290` (数量：2,2)

#### 17.2.3 备件（Spare Parts）
- **料号格式**: 非60A开头的各种格式
- **必选备件**: 某些备件有必选备件
- **数据来源**: 查询 `wp_bjt_spare_parts` 表的 `required_parts` 字段
- **API接口**: 在备件详情接口中直接返回

**有必选备件的备件**:
- `01A0101038` (去皱硅胶) → 必选备件：`11A0103002,11A0101003` (数量：2,2)
- `07A0105325` (陶瓷刀片) → 必选备件：`11A0103157,11A0101002` (数量：1,1)

### 17.3 数据格式统一

#### 17.3.1 数据库存储格式
在数据库中，必选备件信息以逗号分隔的字符串形式存储：
- `required_parts`: `"05A0101289,05A0101290"`
- `required_quantity`: `"2,2"`

#### 17.3.2 API返回格式
在API响应中，必选备件信息统一返回为数组格式：
```json
{
  "required_parts": [
    {
      "part_number": "05A0101289",
      "quantity": 2
    },
    {
      "part_number": "05A0101290", 
      "quantity": 2
    }
  ]
}
```

#### 17.3.3 空值处理
- 如果产品没有必选备件，返回空数组：`"required_parts": []`
- 不返回 `null` 或 `undefined`

### 17.4 API控制器实现

#### 17.4.1 主机控制器 (class-part-controller.php)
```php
// 主机没有必选备件，直接返回空数组
$formatted_item['required_parts'] = [];
```

#### 17.4.2 配件控制器 (class-accessory-controller.php)
```php
// 从关系表查询必选备件
$relations = $wpdb->get_results($wpdb->prepare(
    "SELECT required_parts, required_quantity 
     FROM {$wpdb->prefix}bjt_relations 
     WHERE child_part_number = %s 
     AND required_parts IS NOT NULL 
     AND required_parts != ''",
    $part_number
));
```

#### 17.4.3 备件控制器 (class-spare-part-controller.php)
```php
// 从备件表直接获取必选备件信息
// required_parts 字段已存在于表中
$required_parts = $item_db_object->required_parts;
$required_quantity = $item_db_object->required_quantity;
```

### 17.5 前端使用指南

#### 17.5.1 判断产品类型
```javascript
function determinePartType(partNumber) {
  if (partNumber.startsWith('60A01')) {
    return 'host';
  } else if (partNumber.startsWith('60A')) {
    return 'accessory';
  } else {
    return 'spare_part';
  }
}
```

#### 17.5.2 获取必选备件
```javascript
// 主机：直接返回空数组
if (partType === 'host') {
  return [];
}

// 配件：调用专门的必选备件接口
if (partType === 'accessory') {
  const response = await fetch(`/wp-json/bjt/v1/accessories/${accessoryId}/required`);
  return response.data.items;
}

// 备件：从详情接口获取
if (partType === 'spare_part') {
  const response = await fetch(`/wp-json/bjt/v1/spare-parts/${sparePartId}`);
  return response.data.required_parts;
}
```

### 17.6 测试验证

#### 17.6.1 测试用例
系统提供了完整的测试脚本 `test-required-parts-logic.php` 来验证必选备件逻辑：

```bash
# 运行测试脚本
php test-required-parts-logic.php
```

#### 17.6.2 预期结果
- 主机接口：`required_parts` 始终为空数组
- 配件接口：正确返回必选备件信息（如果有）
- 备件接口：正确返回必选备件信息（如果有）

---

## 18. 错误码

以下是API可能返回的错误码及其含义：

### 18.1 通用错误码

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

### 18.2 认证错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 401 | invalid_credentials | 用户名或密码错误 |
| 401 | invalid_token | 无效的令牌 |
| 401 | expired_token | 令牌已过期 |

### 18.3 产品相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_product_type | 产品类型无效 |
| 404 | product_not_found | 产品不存在 |
| 400 | duplicate_part_number | 料号重复 |
| 400 | missing_part_number | 缺少料号 |
| 400 | missing_product_line_id | 缺少产品线ID |
| 409 | duplicate_spare_part | 该产品线中已存在相同料号的备件 |
| 400 | invalid_required_parts_format | 必选配件格式无效 |
| 400 | required_parts_not_found | 必选配件不存在 |
| 400 | insufficient_inventory | 库存不足 |
| 400 | invalid_pricing_tier | 定价层级无效 |

### 18.4 备件相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 404 | spare_part_not_found | 备件不存在 |
| 400 | invalid_spare_part_id | 备件ID无效 |
| 400 | spare_part_required_parts_missing | 必选配件缺失 |
| 400 | spare_part_compatibility_check_failed | 备件兼容性检查失败 |
| 400 | invalid_app_model_format | 适用机型格式无效 |
| 400 | invalid_serial_number_format | 序列号格式无效 |
| 400 | spare_part_filter_options_unavailable | 备件筛选选项不可用 |

### 18.5 购物车错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | cart_empty | 购物车为空 |
| 400 | invalid_quantity | 数量无效 |
| 404 | cart_item_not_found | 购物车项目不存在 |

### 18.6 订单错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_order_status | 订单状态无效 |
| 400 | insufficient_inventory | 库存不足 |
| 400 | invalid_address | 地址信息无效 |
| 404 | order_not_found | 订单不存在 |

### 18.7 关系接口错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | invalid_max_levels | 最大层级数超出范围(1-5) |
| 400 | invalid_part_number | 料号格式无效 |
| 404 | part_not_found | 指定料号不存在 |
| 404 | no_accessories_found | 未找到相关配件 |

### 18.8 系统设置相关错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | missing_settings_data | 缺少设置数据 |
| 400 | settings_validation_failed | 设置数据验证失败 |
| 400 | json_encode_failed | JSON编码失败 |
| 500 | settings_get_failed | 获取设置失败 |
| 500 | settings_update_failed | 更新设置失败 |
| 500 | database_save_failed | 数据库保存失败 |

### 18.9 错误响应格式

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

### 18.10 错误响应格式

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
