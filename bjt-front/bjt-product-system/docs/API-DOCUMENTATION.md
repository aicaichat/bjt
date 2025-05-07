# BJT 产品管理系统 API 文档

## 一、API 概述

### 1.1 基础信息
- 基础URL：`/wp-json/bjt/v1`
- 请求格式：`application/json`
- 响应格式：`application/json`
- 字符编码：`UTF-8`

### 1.2 通用响应格式
```json
{
  "success": true|false,
  "data": {
    // 响应数据
  },
  "message": "提示信息（可选）",
  "code": 200 // 错误码（仅在失败时返回）
}
```

### 1.3 认证方式
- 使用 JWT (JSON Web Token) 认证
- Token 通过 Authorization 请求头传递
- 格式：`Authorization: Bearer {token}`

### 1.4 错误码说明
- 200: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误

## 二、认证接口

### 2.1 用户登录
**请求**
- 方法：`POST`
- 路径：`/auth/login`
- 参数：
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 86400,
    "user": {
      "id": 123,
      "username": "用户名",
      "email": "email@example.com",
      "name": "姓名",
      "role": "SALES",
      "region": "CN",
      "vipLevel": 2
    }
  }
}
```

### 2.2 获取当前用户信息
**请求**
- 方法：`GET`
- 路径：`/auth/me`
- 认证：需要

**响应**
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
    "permissions": [
      "view_products",
      "view_prices",
      "view_inventory"
    ]
  }
}
```

## 三、产品线接口

### 3.1 获取产品线列表
**请求**
- 方法：`GET`
- 路径：`/product-lines`
- 认证：需要
- 参数：
  - `page`: 页码（可选，默认1）
  - `page_size`: 每页数量（可选，默认10）
  - `lang`: 语言（可选，默认zh）
  - `status`: 状态（可选，默认publish）
    - `publish`: 已发布
    - `draft`: 草稿
    - `trash`: 已删除

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "code": "LP",
        "name": "气垫机产品线",
        "description": "高效气泡缓冲包装解决方案",
        "image_url": "/images/product-lines/lp.jpg",
        "status": "active"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

### 3.2 获取产品线详情
**请求**
- 方法：`GET`
- 路径：`/product-lines/{id}`
- 认证：需要
- 参数：
  - `lang`: 语言（可选，默认zh）

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "LP",
    "name": "气垫机产品线",
    "description": "高效气泡缓冲包装解决方案",
    "image_url": "/images/product-lines/lp.jpg",
    "status": "active",
    "machines": [
      {
        "id": 1,
        "model": "LP-V1",
        "name": "气垫机 V1",
        "image_url": "/images/machines/lp-v1.jpg"
      }
    ]
  }
}
```

## 四、设备接口

### 4.1 获取设备列表
**请求**
- 方法：`GET`
- 路径：`/machines`
- 认证：需要
- 参数：
  - `product_line_id`: 产品线ID（可选）
  - `page`: 页码（可选，默认1）
  - `page_size`: 每页数量（可选，默认10）
  - `lang`: 语言（可选，默认zh）
  - `region`: 区域（可选，默认CN）

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "model": "LP-V1",
        "name": "气垫机 V1",
        "description": "入门级气垫机",
        "specifications": {
          "voltage": "220V",
          "power": "250W",
          "dimensions": "560x350x334mm"
        },
        "image_url": "/images/machines/lp-v1.jpg",
        "price": {
          "base": 12800,
          "currency": "CNY"
        },
        "inventory": {
          "available": 100,
          "reserved": 10
        }
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

### 4.2 获取设备详情
**请求**
- 方法：`GET`
- 路径：`/machines/{id}`
- 认证：需要
- 参数：
  - `lang`: 语言（可选，默认zh）
  - `region`: 区域（可选，默认CN）

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "model": "LP-V1",
    "name": "气垫机 V1",
    "description": "入门级气垫机",
    "specifications": {
      "voltage": "220V",
      "power": "250W",
      "dimensions": "560x350x334mm"
    },
    "image_url": "/images/machines/lp-v1.jpg",
    "price": {
      "base": 12800,
      "currency": "CNY",
      "tiers": [
        {
          "min_quantity": 1,
          "max_quantity": 5,
          "price": 12800
        },
        {
          "min_quantity": 6,
          "max_quantity": 10,
          "price": 12000
        }
      ]
    },
    "inventory": {
      "available": 100,
      "reserved": 10,
      "next_arrival": "2024-05-01"
    },
    "accessories": [
      {
        "id": 1,
        "model": "LP-ACC-001",
        "name": "标准支架",
        "type": "required",
        "quantity": 1
      }
    ]
  }
}
```

## 五、配件接口

### 5.1 获取配件列表
**请求**
- 方法：`GET`
- 路径：`/accessories`
- 认证：需要
- 参数：
  - `machine_id`: 设备ID（可选）
  - `parent_id`: 父级配件ID（可选）
  - `page`: 页码（可选，默认1）
  - `page_size`: 每页数量（可选，默认10）
  - `lang`: 语言（可选，默认zh）
  - `region`: 区域（可选，默认CN）

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "model": "LP-ACC-001",
        "name": "标准支架",
        "description": "气垫机标准支架",
        "specifications": {
          "material": "钢制",
          "dimensions": "800x600x1200mm"
        },
        "image_url": "/images/accessories/lp-acc-001.jpg",
        "price": {
          "base": 1200,
          "currency": "CNY"
        },
        "inventory": {
          "available": 50,
          "reserved": 5
        }
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

### 5.2 获取配件详情
**请求**
- 方法：`GET`
- 路径：`/accessories/{id}`
- 认证：需要
- 参数：
  - `lang`: 语言（可选，默认zh）
  - `region`: 区域（可选，默认CN）

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "model": "LP-ACC-001",
    "name": "标准支架",
    "description": "气垫机标准支架",
    "specifications": {
      "material": "钢制",
      "dimensions": "800x600x1200mm"
    },
    "image_url": "/images/accessories/lp-acc-001.jpg",
    "price": {
      "base": 1200,
      "currency": "CNY",
      "tiers": [
        {
          "min_quantity": 1,
          "max_quantity": 5,
          "price": 1200
        },
        {
          "min_quantity": 6,
          "max_quantity": 10,
          "price": 1100
        }
      ]
    },
    "inventory": {
      "available": 50,
      "reserved": 5,
      "next_arrival": "2024-05-01"
    },
    "compatible_machines": [
      {
        "id": 1,
        "model": "LP-V1",
        "name": "气垫机 V1"
      }
    ],
    "required_accessories": [
      {
        "id": 2,
        "model": "LP-ACC-002",
        "name": "固定螺丝包",
        "quantity": 1
      }
    ]
  }
}
```

## 六、耗材接口

### 6.1 获取耗材列表
**请求**
- 方法：`GET`
- 路径：`/consumables`
- 认证：需要
- 参数：
  - `product_line_id`: 产品线ID（可选）
  - `machine_id`: 设备ID（可选）
  - `page`: 页码（可选，默认1）
  - `page_size`: 每页数量（可选，默认10）
  - `lang`: 语言（可选，默认zh）
  - `region`: 区域（可选，默认CN）

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "model": "LP-FILM-001",
        "name": "标准气泡膜",
        "description": "标准气泡缓冲膜",
        "specifications": {
          "material": "HDPE",
          "thickness": "25um",
          "width": "200mm",
          "length": "200m"
        },
        "image_url": "/images/consumables/lp-film-001.jpg",
        "price": {
          "base": 200,
          "currency": "CNY"
        },
        "inventory": {
          "available": 1000,
          "reserved": 100
        }
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

### 6.2 获取耗材详情
**请求**
- 方法：`GET`
- 路径：`/consumables/{id}`
- 认证：需要
- 参数：
  - `lang`: 语言（可选，默认zh）
  - `region`: 区域（可选，默认CN）

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "model": "LP-FILM-001",
    "name": "标准气泡膜",
    "description": "标准气泡缓冲膜",
    "specifications": {
      "material": "HDPE",
      "thickness": "25um",
      "width": "200mm",
      "length": "200m"
    },
    "image_url": "/images/consumables/lp-film-001.jpg",
    "price": {
      "base": 200,
      "currency": "CNY",
      "tiers": [
        {
          "min_quantity": 1,
          "max_quantity": 10,
          "price": 200
        },
        {
          "min_quantity": 11,
          "max_quantity": 50,
          "price": 180
        }
      ]
    },
    "inventory": {
      "available": 1000,
      "reserved": 100,
      "next_arrival": "2024-05-01"
    },
    "compatible_machines": [
      {
        "id": 1,
        "model": "LP-V1",
        "name": "气垫机 V1"
      }
    ]
  }
}
```

## 七、价格接口

### 7.1 批量获取价格
**请求**
- 方法：`POST`
- 路径：`/prices/batch`
- 认证：需要
- 参数：
```json
{
  "items": [
    {
      "type": "machine",
      "id": 1,
      "quantity": 1
    },
    {
      "type": "accessory",
      "id": 2,
      "quantity": 5
    }
  ],
  "region": "CN"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "machine",
        "id": 1,
        "base_price": 12800,
        "final_price": 12800,
        "currency": "CNY",
        "quantity": 1
      },
      {
        "type": "accessory",
        "id": 2,
        "base_price": 1200,
        "final_price": 1100,
        "currency": "CNY",
        "quantity": 5
      }
    ],
    "total": {
      "amount": 18300,
      "currency": "CNY"
    }
  }
}
```

## 八、库存接口

### 8.1 批量获取库存
**请求**
- 方法：`POST`
- 路径：`/inventory/batch`
- 认证：需要
- 参数：
```json
{
  "items": [
    {
      "type": "machine",
      "id": 1
    },
    {
      "type": "accessory",
      "id": 2
    }
  ],
  "region": "CN",
  "warehouse": "SHA"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "machine",
        "id": 1,
        "available": 100,
        "reserved": 10,
        "next_arrival": "2024-05-01"
      },
      {
        "type": "accessory",
        "id": 2,
        "available": 50,
        "reserved": 5,
        "next_arrival": null
      }
    ]
  }
}
```

## 九、错误处理

### 9.1 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "code": 1001,
  "details": {
    // 详细错误信息
  }
}
```

### 9.2 常见错误码
- 1001: 参数验证失败
- 1002: 认证失败
- 1003: 权限不足
- 1004: 资源不存在
- 1005: 库存不足
- 1006: 价格无效
- 1007: 操作失败

## 十、API 使用建议

### 10.1 性能优化
1. 使用批量接口减少请求次数
2. 合理设置缓存
3. 按需加载数据
4. 使用合适的页面大小

### 10.2 错误处理
1. 实现全局错误处理
2. 添加请求重试机制
3. 实现错误恢复策略
4. 记录错误日志

### 10.3 安全建议
1. 使用 HTTPS
2. 验证所有输入
3. 实现请求限流
4. 保护敏感数据 