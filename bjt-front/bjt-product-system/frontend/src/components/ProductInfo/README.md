# 统一产品信息查询机制

## 概述

为了解决系统中反复出现的 "invalid name" 或图片不存在的问题，我们设计了一个统一的产品信息查询机制。通过 `part_number`（料号）和自动类型识别，从四个料号表中获取完整的产品信息。

## 核心特性

- **🔍 自动类型识别**: 根据料号格式自动识别产品类型（主机/配件/备件/耗材）
- **📦 批量查询**: 支持一次查询多个产品的信息
- **💾 智能缓存**: 5分钟缓存机制，减少重复API调用
- **🌐 多语言支持**: 支持中英文切换
- **🔄 降级策略**: API失败时自动回退
- **🎨 统一UI组件**: 提供可重用的ProductCard组件

## 料号类型识别规则

```typescript
// 主机：60A01xxx
if (partNumber.match(/^60A01\d{3}$/)) {
  return 'host';
}

// 配件：60Axxxxx（除主机外的60A开头）
if (partNumber.match(/^60A\d{5}$/) && !partNumber.match(/^60A01\d{3}$/)) {
  return 'accessory';
}

// 耗材：包含字母和数字的组合，或包含短横线，或长度大于10
if (partNumber.match(/^[A-Z]{2,3}\d+/) || partNumber.includes('-') || partNumber.length > 10) {
  return 'consumable';
}

// 其他情况默认为备件
return 'spare_part';
```

## 使用方法

### 1. Hook 方式使用

#### 单个产品信息查询

```tsx
import { useProductInfo } from '../../hooks/useProductInfo';

const MyComponent = () => {
  const { productInfo, loading, error } = useProductInfo('60A01143');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  
  return (
    <div>
      <h3>{productInfo?.name_zh}</h3>
      <img src={productInfo?.image_url} alt={productInfo?.name_zh} />
      <p>料号: {productInfo?.part_number}</p>
      <p>规格: {productInfo?.spec}</p>
    </div>
  );
};
```

#### 批量产品信息查询

```tsx
import { useBatchProductInfo } from '../../hooks/useProductInfo';

const OrderList = () => {
  const partNumbers = ['60A01143', '60A04038', '08A0105795'];
  const { products, notFoundPartNumbers, loading } = useBatchProductInfo(partNumbers);

  return (
    <div>
      {products.map(product => (
        <div key={product.part_number}>
          <h3>{product.name_zh}</h3>
          <p>类型: {product.product_type}</p>
        </div>
      ))}
      {notFoundPartNumbers.length > 0 && (
        <div>未找到的料号: {notFoundPartNumbers.join(', ')}</div>
      )}
    </div>
  );
};
```

#### 简化的Hook

```tsx
import { useProductDisplayName, useProductImage } from '../../hooks/useProductInfo';

const ProductItem = ({ partNumber }: { partNumber: string }) => {
  const displayName = useProductDisplayName(partNumber);
  const imageUrl = useProductImage(partNumber);

  return (
    <div>
      <img src={imageUrl} alt={displayName} />
      <span>{displayName}</span>
    </div>
  );
};
```

### 2. ProductCard 组件使用

```tsx
import { ProductCard } from '../../components/ProductInfo';

const OrderItems = ({ items }: { items: Array<{part_number: string, quantity: number, price: number}> }) => {
  return (
    <div>
      {items.map(item => (
        <ProductCard 
          key={item.part_number}
          partNumber={item.part_number}
          quantity={item.quantity}
          price={item.price}
          showPrice={true}
          showQuantity={true}
          showSpecs={true}
          size="medium"
          onClick={() => console.log('产品被点击')}
        />
      ))}
    </div>
  );
};
```

### 3. 直接使用 Service

```tsx
import productInfoService from '../../services/productInfoService';

const MyService = {
  async getProductInfo(partNumber: string) {
    const productInfo = await productInfoService.getProductInfo(partNumber, 'zh');
    return productInfo;
  },

  async getBatchProductInfo(partNumbers: string[]) {
    const result = await productInfoService.getBatchProductInfo(partNumbers, 'zh');
    return result;
  },

  // 预加载常用产品
  async preloadCommonProducts() {
    const commonPartNumbers = ['60A01143', '60A01141', '60A04038'];
    await productInfoService.preloadProducts(commonPartNumbers);
  }
};
```

## ProductCard 组件 Props

```typescript
interface ProductCardProps {
  partNumber: string;           // 必填：产品料号
  quantity?: number;            // 可选：数量，默认1
  price?: number;              // 可选：价格
  showPrice?: boolean;         // 可选：是否显示价格，默认false
  showQuantity?: boolean;      // 可选：是否显示数量，默认true
  showSpecs?: boolean;         // 可选：是否显示规格，默认true
  size?: 'small' | 'medium' | 'large'; // 可选：尺寸，默认medium
  onClick?: () => void;        // 可选：点击回调
  className?: string;          // 可选：额外CSS类名
}
```

## 产品信息数据结构

```typescript
interface ProductInfo {
  id: string;                  // 产品ID
  part_number: string;         // 料号
  name_zh: string;            // 中文名称
  name_en: string;            // 英文名称
  image_url: string;          // 图片URL（包含默认图片处理）
  spec?: string;              // 规格参数（公制）
  spec_imperial?: string;     // 规格参数（英制）
  product_type: 'host' | 'accessory' | 'spare_part' | 'consumable';
  product_line_id?: number;   // 产品线ID
  brand?: string;             // 品牌
  voltage?: string;           // 电压
  frequency?: string;         // 频率
  unit?: string;              // 单位
  status?: string;            // 状态
}
```

## 缓存机制

- **缓存时间**: 5分钟
- **缓存策略**: 基于料号的键值对缓存
- **自动清理**: 过期缓存自动清理
- **手动清理**: 可调用 `productInfoService.clearCache()` 手动清理

## 错误处理

1. **料号不存在**: Hook 返回 null，组件显示错误状态
2. **API 失败**: 自动尝试其他类型的API
3. **网络错误**: Hook 返回错误信息
4. **图片加载失败**: 自动使用默认占位图

## 性能优化建议

1. **预加载**: 在应用启动时预加载常用产品信息
2. **批量查询**: 对于列表页面，使用批量查询而非单个查询
3. **缓存利用**: 充分利用5分钟缓存，避免重复查询
4. **懒加载**: 对于大列表，可结合虚拟滚动使用

## 迁移指南

### 从旧的方式迁移

**之前的代码**:
```tsx
// 原来需要手动处理各种数据格式
const formatSpecs = (specs: any) => {
  // 复杂的格式化逻辑...
};

const OrderItem = ({ item }) => (
  <div>
    <img src={item.image || defaultImage} />
    <span>{item.name || 'Unknown'}</span>
    <span>{formatSpecs(item.specs)}</span>
  </div>
);
```

**现在的代码**:
```tsx
// 现在只需要传入料号即可
const OrderItem = ({ partNumber, quantity, price }) => (
  <ProductCard 
    partNumber={partNumber}
    quantity={quantity}
    price={price}
    showPrice={true}
  />
);
```

## 最佳实践

1. **统一使用料号**: 在所有数据传递中使用 `part_number` 作为产品的唯一标识
2. **组件复用**: 优先使用 `ProductCard` 组件，而不是自定义产品显示逻辑
3. **错误处理**: 总是处理加载状态和错误状态
4. **性能考虑**: 对于大量产品，使用批量查询Hook

这个机制彻底解决了系统中产品信息不一致的问题，提供了统一、可靠的产品信息获取方式。 