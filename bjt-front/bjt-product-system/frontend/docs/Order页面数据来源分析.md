# Order页面数据来源分析

## 📋 页面概述

**重要澄清**：`http://localhost:5173/orders` 对应的是 **OrderList页面**，而不是订单确认页面。这是一个订单管理界面，显示用户的历史订单列表。

## 🔄 数据获取流程

### 1. 数据来源优先级
OrderList页面按以下优先级获取数据：

```typescript
// 1. 首先尝试真实API
const response = await orderService.getOrders({
  page: currentPage,
  perPage: 20,
  status: currentTab === 'all' ? undefined : currentTab,
  search: searchValue || undefined
});

// 2. API失败时使用本地存储
const savedOrdersJson = localStorage.getItem('orders');

// 3. 最后使用硬编码Mock数据
const mockOrders = [/* 预定义的订单数据 */];
```

### 2. 真实API数据源
- **API端点**：通过 `orderService.getOrders()` 调用
- **后端路径**：`/wp-json/bjt/v1/orders`
- **环境变量控制**：`VITE_USE_MOCK_ORDERS`（当前未设置，默认使用真实API）

### 3. 本地存储数据
- **存储位置**：`localStorage.getItem('orders')`
- **用途**：保存用户之前创建的订单数据
- **格式**：JSON字符串，包含Order[]数组

### 4. Mock数据
当API调用失败且本地存储为空时，使用预定义的模拟订单：

```typescript
const mockOrders: Order[] = [
  {
    id: 'BJT20231015001',
    orderNumber: 'BJT20231015001',
    date: '2023-10-15 14:30:25',
    status: 'shipped',
    total: 234670,
    items: [
      {
        part_number: '60A01143', // LA-E4S V2.0主机
        name: 'LA-E4S V2.0主机-标准版',
        price: 100000,
        quantity: 2
      },
      // ... 更多商品
    ]
  },
  // ... 更多订单
];
```

## 📊 数据格式转换

### API响应格式处理
系统支持多种API响应格式：

```typescript
// 格式1: 直接返回数据
response = { items: [...], total: 10 }

// 格式2: 包装在data属性中
response = { data: { items: [...], total: 10 } }

// 格式3: 其他嵌套格式
// 系统会自动检测并适配
```

### 数据字段映射
API数据转换为UI组件需要的格式：

```typescript
const convertedOrders: Order[] = ordersData.items.map((apiOrder: any) => ({
  id: String(apiOrder.id || apiOrder.order_number),
  orderNumber: apiOrder.order_number,
  date: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleDateString() : '',
  status: mapApiStatusToUIStatus(apiOrder.status),
  total: apiOrder.total_amount || 0,
  paymentMethod: apiOrder.payment_method || '其他',
  shippingInfo: formatAddressInfo(apiOrder.shipping_address),
  items: (apiOrder.items || []).map((item: any) => ({
    id: String(item.order_item_id || item.id),
    part_number: item.part_number || `unknown-${Date.now()}`,
    name: item.name,
    specs: item.part_number || '',
    price: item.unit_price || 0,
    quantity: item.quantity || 0
  }))
}));
```

## 🔧 状态映射

### API状态到UI状态
```typescript
const statusMap = {
  'pending': 'pending',      // 待处理
  'processing': 'paid',      // 已支付
  'shipped': 'shipped',      // 已发货
  'delivered': 'completed',  // 已完成
  'completed': 'completed',  // 已完成
  'cancelled': 'cancelled'   // 已取消
};
```

## 🎯 当前显示的数据

基于您提供的截图和控制台日志，当前Order页面显示的数据特征：

### 1. **数据来源判断**
- 显示了多个订单记录
- 包含真实的料号（如60A01143, 60A01142等）
- 有完整的订单信息（订单号、日期、状态、金额）

### 2. **可能的数据源**
- **最可能**：Mock数据（因为API调用可能失败，回退到预定义的模拟数据）
- **次可能**：本地存储数据（用户之前创建的订单）
- **最不可能**：真实API数据（因为需要后端支持和用户认证）

### 3. **验证方法**
要确定具体的数据来源，可以：

1. **检查控制台日志**：
   ```
   console.log('API调用失败，使用模拟数据', apiError);
   ```

2. **检查本地存储**：
   ```javascript
   localStorage.getItem('orders')
   ```

3. **检查API响应**：
   ```
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/wp-json/bjt/v1/orders
   ```

## 📋 结论

**Order页面（`/orders`）显示的订单数据来源**：

1. **主要来源**：预定义的Mock数据（硬编码在OrderList组件中）
2. **辅助来源**：本地存储的订单数据
3. **理想来源**：后端API数据（需要认证和后端支持）

这些订单数据包含了真实的产品料号和详细信息，主要用于演示和测试目的。如果需要显示真实的用户订单数据，需要：

1. 确保用户已登录并有有效的认证token
2. 后端API正常运行并返回用户的真实订单数据
3. 处理API调用的错误情况和数据格式转换

## 🔍 调试建议

如果需要切换到真实API数据：

1. **检查用户认证状态**
2. **验证API端点可用性**
3. **查看网络请求和响应**
4. **检查控制台错误日志**
5. **确认数据格式匹配** 