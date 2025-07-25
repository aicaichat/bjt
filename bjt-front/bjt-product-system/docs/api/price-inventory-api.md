# Price & Inventory API Documentation (Phase-2)

> Version: **bjt-phase2/v1.2**  
> Base URL: `https://<your-domain>/wp-json/bjt-phase2/v1`

本文件描述了价格 (Price) 与库存 (Inventory) 以及订单同步 (Order Sync) 相关接口的请求格式、参数说明、返回示例、错误码及安全约定，供前端、第三方系统及测试人员对接使用。

---
## 目录
1. [统一约定](#统一约定)  
2. [鉴权与权限](#鉴权与权限)  
3. [登录 & Token 接口](#登录--token-接口)  
4. [价格接口](#价格接口)  
    4.1 [GET /prices](#41-get-prices)  
    4.2 [POST /prices/batch](#42-post-pricesbatch)  
5. [库存接口](#库存接口)  
    5.1 [GET /inventory](#51-get-inventory)  
    5.2 [POST /inventory/batch](#52-post-inventorybatch)  
6. [组合接口（可选）](#组合接口可选)  
7. [订单同步接口](#订单同步接口)  
    7.1 [POST /orders/sync-to-crm](#71-post-orderssync-to-crm)  
    7.2 [GET /orders/sync-status/{task_id}](#72-get-orderssync-statustask_id)  
8. [属性接口](#属性接口)  
    8.1 [GET /parts/{part_number}](#81-get-partspart_number)  
9. [错误码一览](#错误码一览)  
10. [变更记录](#变更记录)

---
## 统一约定
| 约定 | 描述 |
| ---- | ---- |
| **编码** | 所有请求与响应均使用 UTF-8 编码；JSON 使用 `application/json` Content-Type。|
| **时间格式** | `YYYY-MM-DD HH:MM:SS` (UTC+8 unless specified)。 |
| **Region** | 两位大写区域码，如 `CN`,`US`,`EU`,`AU`。 |
| **Currency** | 三位 ISO-4217 货币码，如 `CNY`,`USD`,`EUR`。|
| **List Price / Tier Price** | `list_price` 为标价。如带 `quantity`，系统将按 **Pricing Rules** 计算实际单价 (`price`) 并返回 `rule_applied`。 |

### Pricing Rules 通用格式

`pricing_rules` 字段（数据库 `tier_json`）统一存储为 **数组**，数组元素包含 `conditions` 与 `price` 两部分，便于未来扩展除数量外的更多维度（客户等级、地区、时间窗口等）。

```json
[
  {
    "conditions": { "min_qty": 1, "max_qty": 4 },
    "price": 1200.0
  },
  {
    "conditions": { "min_qty": 5, "max_qty": 19 },
    "price": 1150.0
  },
  {
    "conditions": { "min_qty": 20 },       // max_qty 省略表示无限大
    "price": 1100.0
  }
]
```

当前仅使用 `min_qty` / `max_qty` 条件；后续可在同一层级添加：
• `customer_level`, `region`, `date_from`, `date_to` 等。

---
## 鉴权与权限
1. **游客**  
  • 可访问 `GET /prices` 与 `GET /inventory`，仅返回公开价格区间与库存状态，不包含精确数量。  
2. **登录用户**  
  • 通过 **JWT** (Authorization: `Bearer <token>`) 或 **WordPress Cookie** 进行鉴权。  
  • 根据角色分配细粒度能力：
    - `view_prices`, `view_inventory`：查看精确价格 / 库存。  
    - `manage_prices`, `manage_inventory`：后台批量导入、编辑、同步。  
3. 所有示例均假设请求头：
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---
## 登录 & Token 接口
### 3.1 POST `/auth/login`

使用用户名 / 邮箱 + 密码登录，返回 JWT `access_token` 与 `refresh_token`。

#### Request Body
```json
{
  "username": "alice@example.com", // 或 username
  "password": "Secret123!"
}
```

#### 响应
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
    "expires_in": 3600,            // 秒
    "refresh_token": "def50200a1...",
    "user": {
      "id": 42,
      "username": "alice",
      "customer_code": "CUST-001",
      "role": "user"
    }
  }
}
```

### 3.2 POST `/auth/refresh`

使用 `refresh_token` 获取新的 `access_token`。

#### Request Body
```json
{
  "refresh_token": "def50200a1..."
}
```

#### 响应
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
    "expires_in": 3600
  }
}
```

*Token 放入请求头：*
```http
Authorization: Bearer <access_token>
```

> 注意：若 `refresh_token` 过期或无效，将返回 `401 unauthorized`。

---
## 价格接口
### 4.1 GET `/prices`
按单个或多个料号查询价格。

| Query Param | 必填 | 类型 | 描述 |
| ----------- | ---- | ---- | ---- |
| `part_number` | Y | string | 料号，可逗号分隔批量。上限 50。 |
| `customer_code` | Y | string | 客户代码，用于确定区域、币种与客户专属定价。若需使用登录用户，请在前端读取用户信息填入。 |
| `quantity` | N | integer | 需要报价的数量，用于匹配阶梯价 (可选)。 |

#### 响应
```json
{
  "success": true,
  "data": [
    {
      "part_number": "AB123",
      "region": "CN",
      "currency": "CNY",
      "list_price": 1200.0,
      "price": 1150.0,
      "pricing_rules": [
        { "conditions": { "min_qty": 1,  "max_qty": 4  }, "price": 1200.0 },
        { "conditions": { "min_qty": 5,  "max_qty": 19 }, "price": 1150.0 },
        { "conditions": { "min_qty": 20               }, "price": 1100.0 }
      ],
      "rule_applied": {
        "conditions": { "min_qty": 5, "max_qty": 19 },
        "price": 1150.0
      }
    }
  ],
  "errors": []
}
```

---
### 4.2 POST `/prices/batch`
一次查询多条价格记录（推荐超过 5 条时使用）。

#### Request Body
```json
{
  "items": [
    {
      "part_number": "AB123",   // 必填
      "customer_code": "CUST-001",  // 可选：客户代码（对应用户表 customer_code），若缺省将使用当前登录用户
      "quantity": 5               // 可选：用于阶梯价匹配
    },
    {
      "part_number": "XY999",
      "customer_code": "CUST-002"
    }
  ]
}
```

#### 响应
与 **GET /prices** 相同结构，`data` 按提交顺序返回。

---
## 库存接口
### 5.1 GET `/inventory`

| Query Param | 必填 | 类型 | 描述 |
| ----------- | ---- | ---- | ---- |
| `part_number` | Y | string | 料号，可逗号分隔批量。上限 50。 |
| `customer_code` | N | string | 客户代码；若缺省则取当前登录用户的 `customer_code`。 |

#### 响应
```json
{
  "success": true,
  "data": [
    {
      "part_number": "AB123",
      "region": "CN",
      "status": "in_stock",
      "quantity_total": 340,
      "quantity_available": 300,
      "warehouses": [
        { "code": "SH01", "total": 200, "reserved": 20 },
        { "code": "GD02", "total": 140, "reserved": 20 }
      ],
      "estimated_restock_date": null
    }
  ],
  "errors": []
}
```

> **注** ：游客无权限时 `quantity_*` 字段将被省略，只返回 `status`。

---
### 5.2 POST `/inventory/batch`

#### Body
```json
{
  "items": [
    { "part_number": "AB123" },
    { "part_number": "XY999" }
  ]
}
```

#### 响应
同 **GET /inventory**。

---
## 组合接口（可选）
### 6.1 POST `/commerce/info`

一次调用同时获取 **价格** 与 **库存** 信息，适合商品列表/购物车批量刷新场景。

#### Request Body
```json
{
  "items": [
    {
      "part_number": "AB123",     // 必填
      "customer_code": "CUST-001", // 可选
      "quantity": 3                 // 可选：用于阶梯价
    },
    { "part_number": "XY999" }
  ]
}
```

字段说明同 `POST /prices/batch`，库存接口无需 `customer_code` 但允许传入；后端会优先按价格逻辑解析客户信息。

#### 响应
```json
{
  "success": true,
  "data": [
    {
      "part_number": "AB123",
      "price": {
        "currency": "CNY",
        "list_price": 1200.0,
        "price": 1180.0,
        "pricing_rules": [
          { "conditions": { "min_qty": 1,  "max_qty": 4 }, "price": 1200.0 },
          { "conditions": { "min_qty": 5,  "max_qty": 19 }, "price": 1150.0 },
          { "conditions": { "min_qty": 20               }, "price": 1100.0 }
        ],
        "rule_applied": {
          "conditions": { "min_qty": 1, "max_qty": 4 },
          "price": 1180.0
        }
      },
      "inventory": {
        "status": "in_stock",
        "quantity_total": 340,
        "quantity_available": 300,
        "warehouses": [
          { "code": "SH01", "total": 200, "reserved": 20 },
          { "code": "GD02", "total": 140, "reserved": 20 }
        ]
      }
    },
    {
      "part_number": "XY999",
      "price": null,
      "inventory": null,
      "error": {
        "code": "price_not_found",
        "message": "No price record for part_number XY999"
      }
    }
  ],
  "errors": []
}
```

• 若某个料号缺少价格或库存，将在对应 item 中返回 `price`/`inventory` 为 `null` 并附 `error` 字段，而不会影响整个请求状态。  
• 若请求整体失败（如参数超限），`success` 为 `false`，具体错误置于顶层 `errors`。

---
## 订单同步接口
### 7.1 POST `/orders/sync-to-crm`

异步将指定的单个订单同步到CRM系统。该接口**仅支持单个订单同步**，不需要支持批量同步。接口会立即返回同步任务信息，不等待CRM同步完成。实际同步过程在后台异步执行，客户端可通过任务状态查询接口获取同步结果。

#### Request Body
```json
{
  "order_id": 1001,           // 必填：订单ID
  "force_sync": false,        // 可选：是否强制同步，默认false
  "include_items": true       // 可选：是否包含订单项详情，默认true
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `order_id` | integer | Y | 需要同步的单个订单ID，对应商城订单系统中的订单ID |
| `force_sync` | boolean | N | 是否强制同步。为true时会覆盖已存在的CRM订单，默认false |
| `include_items` | boolean | N | 是否包含订单项详情。为true时会同步订单的所有商品信息，默认true |

#### 使用限制
- **仅支持单个订单同步**：每次请求只能同步一个订单，不支持批量同步
- 如需同步多个订单，请分别调用多次接口
- 建议在大批量同步时控制并发数量，避免对系统造成过大压力

#### 同步流程（异步）
1. 验证用户权限和订单ID有效性
2. 创建同步任务并立即返回任务ID
3. 后台异步执行：
   - 调用商城订单API获取完整订单信息：`GET /wp-json/bjt/v1/orders/{order_id}`
   - 将订单数据转换为CRM系统格式
   - 调用CRM API同步订单数据
   - 更新任务状态和结果

#### 成功响应（异步任务已创建）
```json
{
  "success": true,
  "data": {
    "task_id": "sync_task_1001_20250709153045",
    "order_id": 1001,
    "status": "pending",
    "created_at": "2025-07-09 15:30:45",
    "estimated_completion": "2025-07-09 15:31:00",
    "status_check_url": "/wp-json/bjt-phase2/v1/orders/sync-status/sync_task_1001_20250709153045"
  }
}
```

#### 任务状态说明
| 状态 | 描述 |
|------|------|
| `pending` | 任务已创建，等待执行 |
| `processing` | 正在同步中 |
| `completed` | 同步成功完成 |
| `failed` | 同步失败 |
| `cancelled` | 任务已取消 |

#### 失败响应

**订单不存在** (状态码: 404):
```json
{
  "success": false,
  "message": "订单不存在",
  "code": "order_not_found",
  "data": {
    "order_id": 1001
  }
}
```

**权限不足** (状态码: 403):
```json
{
  "success": false,
  "message": "没有权限同步订单到CRM",
  "code": "insufficient_permissions"
}
```

**订单已同步** (状态码: 409):
```json
{
  "success": false,
  "message": "订单已同步到CRM，如需重新同步请设置force_sync=true",
  "code": "order_already_synced",
  "data": {
    "order_id": 1001,
    "crm_order_id": "CRM-2023-001001",
    "last_sync_time": "2025-07-09 14:25:10"
  }
}
```

**CRM系统错误** (状态码: 502):
```json
{
  "success": false,
  "message": "CRM系统同步失败",
  "code": "crm_sync_error",
  "data": {
    "order_id": 1001,
    "crm_error": "Connection timeout to CRM system",
    "retry_suggested": true
  }
}
```

#### 使用示例

**基本单个订单异步同步**:
```javascript
// 1. 创建异步同步任务
const response = await fetch('/wp-json/bjt-phase2/v1/orders/sync-to-crm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    order_id: 1001
  })
});

const result = await response.json();
if (result.success) {
  console.log('同步任务已创建:', result.data.task_id);
  
  // 2. 查询任务状态
  const taskId = result.data.task_id;
  const statusResponse = await fetch(`/wp-json/bjt-phase2/v1/orders/sync-status/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  
  const statusResult = await statusResponse.json();
  console.log('任务状态:', statusResult.data.status);
}
```

**强制同步单个订单（异步）**:
```javascript
// 1. 创建强制同步任务
const response = await fetch('/wp-json/bjt-phase2/v1/orders/sync-to-crm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    order_id: 1001,
    force_sync: true,
    include_items: true
  })
});

const result = await response.json();
if (result.success) {
  // 2. 等待任务完成
  try {
    const syncResult = await waitForSyncComplete(result.data.task_id);
    console.log('同步成功:', syncResult);
  } catch (error) {
    console.error('同步失败:', error.message);
  }
}
```

**多个订单异步同步（通过多次调用实现）**:
```javascript
// 需要同步的订单ID列表
const orderIds = [1001, 1002, 1003];

// 并发控制：限制同时处理的订单数量
const batchSize = 3;
const taskResults = [];

// 1. 创建所有同步任务
for (let i = 0; i < orderIds.length; i += batchSize) {
  const batch = orderIds.slice(i, i + batchSize);
  
  const batchPromises = batch.map(orderId => 
    fetch('/wp-json/bjt-phase2/v1/orders/sync-to-crm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        order_id: orderId,
        include_items: true
      })
    }).then(res => res.json())
  );
  
  const batchResults = await Promise.all(batchPromises);
  taskResults.push(...batchResults);
  
  // 可选：在批次之间添加延迟
  if (i + batchSize < orderIds.length) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 2. 等待所有任务完成
const finalResults = [];
for (const taskResult of taskResults) {
  if (taskResult.success) {
    try {
      const syncResult = await waitForSyncComplete(taskResult.data.task_id);
      finalResults.push({
        order_id: taskResult.data.order_id,
        task_id: taskResult.data.task_id,
        status: 'completed',
        result: syncResult
      });
    } catch (error) {
      finalResults.push({
        order_id: taskResult.data.order_id,
        task_id: taskResult.data.task_id,
        status: 'failed',
        error: error.message
      });
    }
  } else {
    finalResults.push({
      order_id: taskResult.data?.order_id,
      status: 'failed',
      error: taskResult.message
    });
  }
}

console.log('所有订单同步完成:', finalResults);
```

---
### 7.2 GET `/orders/sync-status/{task_id}`

查询异步订单同步任务的状态和结果。

#### 路径参数
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `task_id` | string | Y | 同步任务ID，通过同步接口返回 |

#### 成功响应

**任务进行中**:
```json
{
  "success": true,
  "data": {
    "task_id": "sync_task_1001_20250709153045",
    "order_id": 1001,
    "status": "processing",
    "created_at": "2025-07-09 15:30:45",
    "started_at": "2025-07-09 15:30:50",
    "progress": "正在获取订单信息...",
    "estimated_completion": "2025-07-09 15:31:00"
  }
}
```

**任务完成**:
```json
{
  "success": true,
  "data": {
    "task_id": "sync_task_1001_20250709153045",
    "order_id": 1001,
    "status": "completed",
    "created_at": "2025-07-09 15:30:45",
    "started_at": "2025-07-09 15:30:50",
    "completed_at": "2025-07-09 15:31:15",
    "sync_result": {
      "order_number": "BJT-2023-1001",
      "crm_order_id": "CRM-2023-001001",
      "sync_time": "2025-07-09 15:31:15",
      "order_info": {
        "customer": {
          "name": "张三",
          "email": "zhangsan@example.com",
          "phone": "13800138000"
        },
        "total_amount": 1799.99,
        "currency": "CNY",
        "status": "processing",
        "items_count": 2,
        "created_at": "2025-07-09 14:20:30"
      },
      "crm_response": {
        "status": "success",
        "message": "Order synced successfully",
        "crm_order_url": "https://crm.example.com/orders/CRM-2023-001001"
      }
    }
  }
}
```

**任务失败**:
```json
{
  "success": true,
  "data": {
    "task_id": "sync_task_1001_20250709153045",
    "order_id": 1001,
    "status": "failed",
    "created_at": "2025-07-09 15:30:45",
    "started_at": "2025-07-09 15:30:50",
    "failed_at": "2025-07-09 15:31:10",
    "error": {
      "code": "crm_sync_error",
      "message": "CRM系统连接超时",
      "details": "Connection timeout to CRM system after 30 seconds"
    },
    "retry_count": 2,
    "max_retries": 3,
    "next_retry_at": "2025-07-09 15:35:00"
  }
}
```

#### 失败响应

**任务不存在** (状态码: 404):
```json
{
  "success": false,
  "message": "同步任务不存在",
  "code": "task_not_found",
  "data": {
    "task_id": "sync_task_1001_20250709153045"
  }
}
```

#### 使用示例

**查询任务状态**:
```javascript
const taskId = "sync_task_1001_20250709153045";
const response = await fetch(`/wp-json/bjt-phase2/v1/orders/sync-status/${taskId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('任务状态:', result.data.status);
```

**轮询任务状态直到完成**:
```javascript
async function waitForSyncComplete(taskId) {
  const maxWaitTime = 300000; // 5分钟
  const pollInterval = 2000;   // 2秒
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`/wp-json/bjt-phase2/v1/orders/sync-status/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    
    const result = await response.json();
    
    if (result.success && result.data.status === 'completed') {
      return result.data.sync_result;
    }
    
    if (result.success && result.data.status === 'failed') {
      throw new Error(`同步失败: ${result.data.error.message}`);
    }
    
    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('同步任务超时');
}

// 使用示例
try {
  const syncResult = await waitForSyncComplete('sync_task_1001_20250709153045');
  console.log('同步成功:', syncResult);
} catch (error) {
  console.error('同步失败:', error.message);
}
```

---
## 属性接口
### 8.1 GET `/parts/{part_number}`

根据料号 (Part Number, PN) 获取该零件/产品的完整属性信息，含多语言标题、描述、规格、图片等。

#### Path Param
| Param | 必填 | 类型 | 描述 |
|-------|------|------|------|
| `part_number` | Y | string | 料号，大小写不敏感 |

#### Query Param
| Param | 必填 | 类型 | 描述 |
|-------|------|------|------|
| `lang` | N | string | 返回语言：`zh` / `en`，默认 `zh` |

#### 示例请求
```http
GET /wp-json/bjt-phase2/v1/parts/AB123?lang=en
```

#### 响应
```json
{
  "success": true,
  "data": {
    "part_number": "AB123",
    "title": "High-Precision Pump",
    "description": "Industrial high-precision pump for ...",
    "product_line_id": 3,
    "image_url": "https://cdn.example.com/images/AB123.png",
    "specs": [
      { "name": "Power", "value": "220V" },
      { "name": "Flow",  "value": "1.8 L/min" }
    ],
    "extra_attributes": {
      "weight": "2.3kg",
      "dimension": "120×80×60mm",
      "material": "Stainless Steel"
    },
    "created_at": "2025-07-08 10:30:12",
    "updated_at": "2025-07-08 10:30:12"
  }
}
```

*若指定语言字段不存在，则自动回退到默认语言字段。*

---
## 错误码一览

| 错误码 | 描述 | 解决方案 |
| ------ | ---- | -------- |
| 400 | 请求参数错误 | 检查请求参数，确保符合规范。 |
| 401 | 未授权 | 请检查 JWT Token 或 Cookie。 |
| 403 | 权限不足 | 请联系管理员分配权限。 |
| 404 | 资源不存在 | 检查请求的资源路径和参数。 |
| 409 | 资源冲突 | 订单已同步到CRM，如需重新同步请设置force_sync=true。 |
| 500 | 服务器内部错误 | 请联系管理员。 |
| 502 | 网关错误 | CRM系统同步失败，请检查CRM系统连接或稍后重试。 |

### 订单同步接口特定错误码

| 错误码 | 描述 | 解决方案 |
| ------ | ---- | -------- |
| order_not_found | 订单不存在 | 检查订单ID是否正确。 |
| insufficient_permissions | 没有权限同步订单到CRM | 请联系管理员分配manage_orders权限。 |
| order_already_synced | 订单已同步到CRM | 如需重新同步请设置force_sync=true。 |
| crm_sync_error | CRM系统同步失败 | 检查CRM系统连接状态，或稍后重试。 |
| task_not_found | 同步任务不存在 | 检查任务ID是否正确，或任务可能已过期。 |
| task_creation_failed | 任务创建失败 | 系统繁忙，请稍后重试。 |
| task_timeout | 任务执行超时 | 任务执行时间过长，请稍后查询状态或重新同步。 |
| price_not_found | 价格信息不存在 | 检查料号是否正确，或联系管理员维护价格信息。 |
| inventory_not_found | 库存信息不存在 | 检查料号是否正确，或联系管理员维护库存信息。 |

---
## 变更记录

| 版本 | 日期 | 描述 |
| ---- | ---- | ---- |
| bjt-phase2/v1.2 | 2025-01-08 | 将订单同步接口改为异步模式，新增任务状态查询接口 `/orders/sync-status/{task_id}`，支持任务状态轮询和结果获取 |
| bjt-phase2/v1.1 | 2025-01-08 | 新增订单同步到CRM接口 `/orders/sync-to-crm`，支持主动调用商城订单API同步订单数据到CRM系统 |
| bjt-phase2/v1 | 2025-07-09 | version 0.1 |
