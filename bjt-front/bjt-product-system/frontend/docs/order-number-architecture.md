# BJT产品系统 - 订单号管理架构

## 概述

本文档说明BJT产品系统中订单号的正确管理架构。**订单号完全由后端API生成**，前端只负责接收、处理和显示。

## 架构原则

### ✅ 正确做法
- 订单号由后端API统一生成
- 前端在提交订单时不包含订单号
- 前端从API响应中获取订单号
- API调用失败时直接报错，不生成临时订单号

### ❌ 错误做法
- 前端生成订单号
- 多个页面各自生成订单号
- API调用失败时生成临时订单号

## 订单号生成流程

```
1. 前端准备订单数据 (无订单号)
   ↓
2. 调用后端API提交订单
   ↓
3. 后端生成唯一订单号
   ↓
4. 后端返回包含订单号的响应
   ↓
5. 前端接收并显示订单号
```

## 核心组件

### 1. OrderNumberManager

**职责：** 只处理后端返回的订单号，不生成订单号

```typescript
export class OrderNumberManager {
  // ✅ 从API响应提取订单号
  static extractFromApiResponse(apiResponse: any): OrderNumberInfo
  
  // ✅ 从订单对象提取订单号  
  static extractFromOrderObject(order: any): OrderNumberInfo
  
  // ✅ 创建统一订单数据
  static createUnifiedOrderData(params: {...}): any
  
  // ✅ 验证订单号格式
  static validateOrderNumber(orderNumber: string): boolean
  
  // ❌ 已移除：不再生成订单号
  // static generateOrderNumber(): string
}
```

### 2. ApiAdapter

**职责：** 处理前后端数据格式转换，不涉及订单号生成

```typescript
export class ApiAdapter {
  // ✅ 转换前端数据为API格式（不包含订单号）
  static convertOrderToApiFormat(frontendOrderData: any): any
  
  // ✅ 转换API响应为前端格式（包含订单号）
  static convertApiResponseToFrontend(apiResponse: any): any
}
```

### 3. OrderContext

**职责：** 管理订单状态，通过API获取订单号

```typescript
const submitOrder = async (orderData: any): Promise<UnifiedOrderData> => {
  // 1. 调用API提交订单（不包含订单号）
  const apiResponse = await orderService.submitOrder(orderData);
  
  // 2. 从API响应提取订单号
  const orderInfo = OrderNumberManager.extractFromApiResponse(apiResponse);
  
  // 3. 创建统一订单数据
  const unifiedOrder = OrderNumberManager.createUnifiedOrderData({
    apiResponse,
    orderItems: orderData.items,
    customerInfo: orderData.customerInfo,
    // ...
  });
  
  return unifiedOrder;
};
```

## 错误处理

### API响应缺少订单号
```typescript
// 如果API响应中没有订单号，抛出错误
if (!orderNumber) {
  throw new Error('API响应中缺少订单号 (order_number)');
}
```

### API响应缺少订单ID
```typescript
// 如果API响应中没有订单ID，抛出错误
if (!orderId) {
  throw new Error('API响应中缺少订单ID (id)');
}
```

### 无效的订单对象
```typescript
// 如果传入无效的订单对象，抛出错误
if (!order || typeof order !== 'object') {
  throw new Error('无效的订单对象');
}
```

## 支持的订单号格式

系统支持多种后端可能返回的订单号格式：

1. **PO格式**: `PO-YYYYMMDDHHMM-XXXXXX`
   - 例如: `PO-202506231230-ABC123`

2. **ORD格式**: `ORD-YYYYMMDD-XXXXXX`  
   - 例如: `ORD-20250623-DEF456`

3. **其他格式**: `[A-Z0-9]{8,20}`
   - 例如: `ORDER123456789`

## 页面使用示例

### Order页面提交订单
```typescript
const handleSubmitOrder = async () => {
  const orderData = {
    customerInfo: { /* 客户信息 */ },
    items: [ /* 订单项目 */ ],
    summary: { /* 订单汇总 */ }
    // 注意：不包含订单号
  };
  
  try {
    const unifiedOrder = await submitOrder(orderData);
    // unifiedOrder.orderNumber 来自后端API
    navigate('/po', { state: { orderData: unifiedOrder } });
  } catch (error) {
    console.error('订单提交失败:', error.message);
  }
};
```

### PO页面显示订单号
```typescript
const POPage = () => {
  const location = useLocation();
  const orderData = location.state?.orderData;
  
  // 从传入的订单数据中提取订单号
  const orderInfo = OrderNumberManager.extractFromOrderObject(orderData);
  
  return (
    <div>
      <h2>采购订单: {orderInfo.orderNumber}</h2>
      {/* 其他内容 */}
    </div>
  );
};
```

### OrderList页面处理订单号
```typescript
const OrderListPage = () => {
  const handleViewDetails = (order) => {
    const orderInfo = OrderNumberManager.extractFromOrderObject(order);
    navigate('/po', { 
      state: { 
        orderData: {
          ...order,
          orderNumber: orderInfo.orderNumber
        }
      }
    });
  };
  
  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          订单号: {OrderNumberManager.formatForDisplay(order.orderNumber)}
          <button onClick={() => handleViewDetails(order)}>查看详情</button>
        </div>
      ))}
    </div>
  );
};
```

## 测试验证

使用测试页面验证架构正确性：
- 访问: `http://localhost:5173/test-backend-order-number.html`
- 运行各项测试确保：
  - OrderNumberManager不生成订单号
  - API适配器不包含订单号字段
  - 错误处理正确工作
  - 完整流程符合架构要求

## 总结

通过这个架构设计：

1. **数据一致性**: 订单号由后端统一生成，避免前端多处生成导致的不一致
2. **安全性**: 订单号生成逻辑在后端，前端无法伪造
3. **可维护性**: 订单号格式变更只需修改后端，前端自动适配
4. **错误处理**: 明确的错误处理机制，API问题时直接报错而非生成临时数据

这个架构确保了订单号管理的正确性和系统的整体稳定性。 