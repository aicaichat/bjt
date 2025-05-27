# 购物车必选备件完整字段展示实现方案

## 概述

本文档详细说明如何在BJT产品管理系统的购物车中实现必选备件的完整字段展示，确保必选备件按照备件API接口的完整规范进行显示。

## 1. 当前问题分析

### 1.1 现状
- 必选备件在购物车中显示信息不完整
- 缺少备件的技术规格、包装信息、库存等关键字段
- 用户无法获得足够的产品信息进行决策

### 1.2 目标
- 必选备件显示完整的备件字段信息
- 提供与普通备件相同级别的详细信息
- 保持良好的用户体验和视觉区分

## 2. 技术实现方案

### 2.1 数据获取增强

#### 修改必选备件获取逻辑
```typescript
// frontend/src/utils/requiredPartsUtils.ts

export interface RequiredPartFullInfo {
  // 基础信息
  id: number;
  product_line_id: number;
  part_number: string;
  name_zh: string;
  name_en: string;
  model: string | null;
  is_consumable: boolean;
  image_url: string;
  spec: string;
  spec_imperial: string;
  app_model: string;
  app_sn: string;
  unit: string;
  status: string;
  
  // 包装信息
  package_size_cm: string | null;
  package_size_inch: string | null;
  net_weight_kg: number | null;
  net_weight_lbs: number | null;
  gross_weight_kg: number | null;
  gross_weight_lbs: number | null;
  pcs_per_box: number | null;
  
  // 必选备件特有
  quantity: number;
  parent_part_number: string;
  
  // 定价和库存 (如果API支持)
  pricing?: PricingTier[];
  inventory?: InventoryInfo[];
}

// 获取必选备件完整信息
export async function fetchRequiredPartsFullInfo(
  requiredParts: string,
  requiredQuantity: string,
  parentPartNumber: string
): Promise<RequiredPartFullInfo[]> {
  if (!requiredParts || !requiredQuantity) return [];
  
  const partNumbers = requiredParts.split(',').map(p => p.trim());
  const quantities = requiredQuantity.split(',').map(q => parseInt(q.trim()));
  
  const promises = partNumbers.map(async (partNumber, index) => {
    try {
      // 调用备件详情API获取完整信息
      const response = await fetch(`/wp-json/bjt/v1/spare-parts/${partNumber}`);
      const sparePartData = await response.json();
      
      if (sparePartData.success && sparePartData.data) {
        return {
          ...sparePartData.data,
          quantity: quantities[index] || 1,
          parent_part_number: parentPartNumber
        } as RequiredPartFullInfo;
      }
      
      // 如果备件API失败，尝试配件API
      const accessoryResponse = await fetch(`/wp-json/bjt/v1/accessories/${partNumber}`);
      const accessoryData = await accessoryResponse.json();
      
      if (accessoryData.success && accessoryData.data) {
        return {
          ...accessoryData.data,
          quantity: quantities[index] || 1,
          parent_part_number: parentPartNumber,
          // 配件字段映射到备件字段
          name_zh: accessoryData.data.name_zh || accessoryData.data.title_zh,
          name_en: accessoryData.data.name_en || accessoryData.data.title_en,
          is_consumable: false,
          app_model: accessoryData.data.model || '',
          app_sn: '',
          unit: accessoryData.data.unit || 'pcs'
        } as RequiredPartFullInfo;
      }
      
      throw new Error(`Part ${partNumber} not found`);
    } catch (error) {
      console.warn(`Failed to fetch full info for ${partNumber}:`, error);
      
      // 返回基础信息作为fallback
      return {
        id: 0,
        product_line_id: 1,
        part_number: partNumber,
        name_zh: `备件 ${partNumber}`,
        name_en: `Part ${partNumber}`,
        model: null,
        is_consumable: false,
        image_url: '',
        spec: '',
        spec_imperial: '',
        app_model: '',
        app_sn: '',
        unit: 'pcs',
        status: 'publish',
        package_size_cm: null,
        package_size_inch: null,
        net_weight_kg: null,
        net_weight_lbs: null,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: null,
        quantity: quantities[index] || 1,
        parent_part_number: parentPartNumber
      } as RequiredPartFullInfo;
    }
  });
  
  return Promise.all(promises);
}
```

### 2.2 购物车逻辑更新

#### 修改添加到购物车的逻辑
```typescript
// frontend/src/hooks/useCart.ts

export const useCart = () => {
  const addToCart = async (
    item: SparePart | AccessoryModel | HostModel,
    quantity: number = 1
  ) => {
    try {
      // 1. 添加主要商品
      const mainCartItem = createCartItem(item, quantity);
      dispatch({ type: 'ADD_ITEM', payload: mainCartItem });
      
      // 2. 处理必选备件
      if (item.required_parts && item.required_quantity) {
        // 获取必选备件完整信息
        const requiredPartsFullInfo = await fetchRequiredPartsFullInfo(
          item.required_parts,
          item.required_quantity,
          item.part_number
        );
        
        // 添加必选备件到购物车
        for (const requiredPart of requiredPartsFullInfo) {
          const requiredCartItem = createRequiredPartCartItem(
            requiredPart,
            requiredPart.quantity * quantity
          );
          
          dispatch({ type: 'ADD_ITEM', payload: requiredCartItem });
        }
        
        // 显示必选备件添加提示
        showRequiredPartsNotification(requiredPartsFullInfo);
      }
      
      showSuccessMessage(`${getItemDisplayName(item)} 已添加到购物车`);
    } catch (error) {
      console.error('添加到购物车失败:', error);
      showErrorMessage('添加到购物车失败，请重试');
    }
  };
  
  return { addToCart };
};

// 创建必选备件购物车项目
function createRequiredPartCartItem(
  requiredPart: RequiredPartFullInfo,
  totalQuantity: number
): CartItem {
  return {
    id: `required_${requiredPart.part_number}_${Date.now()}`,
    part_number: requiredPart.part_number,
    name_zh: requiredPart.name_zh,
    name_en: requiredPart.name_en,
    quantity: totalQuantity,
    type: 'spare_part',
    is_required: true,
    parent_part_number: requiredPart.parent_part_number,
    
    // 完整的备件字段
    image_url: requiredPart.image_url,
    spec: requiredPart.spec,
    spec_imperial: requiredPart.spec_imperial,
    app_model: requiredPart.app_model,
    app_sn: requiredPart.app_sn,
    is_consumable: requiredPart.is_consumable,
    unit: requiredPart.unit,
    status: requiredPart.status,
    
    // 包装信息
    package_size_cm: requiredPart.package_size_cm,
    package_size_inch: requiredPart.package_size_inch,
    net_weight_kg: requiredPart.net_weight_kg,
    net_weight_lbs: requiredPart.net_weight_lbs,
    gross_weight_kg: requiredPart.gross_weight_kg,
    gross_weight_lbs: requiredPart.gross_weight_lbs,
    pcs_per_box: requiredPart.pcs_per_box,
    
    // 定价和库存
    pricing: requiredPart.pricing || [],
    inventory: requiredPart.inventory || []
  };
}
```

### 2.3 UI组件实现

#### 必选备件购物车项目组件
```tsx
// frontend/src/components/Cart/RequiredPartCartItem.tsx

import React from 'react';
import { CartItem } from '../../types/cart';

interface RequiredPartCartItemProps {
  item: CartItem & { is_required: true };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
}

export const RequiredPartCartItem: React.FC<RequiredPartCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  language = 'zh'
}) => {
  const displayName = language === 'zh' ? item.name_zh : item.name_en;
  const displaySpec = language === 'zh' ? item.spec : item.spec_imperial;
  
  return (
    <div className="required-part-cart-item border-l-4 border-orange-400 bg-orange-50 p-4 rounded-lg mb-3">
      {/* 必选备件标识 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
          必选备件 Required Part
        </span>
        <span className="text-xs text-gray-500">
          配套: {item.parent_part_number}
        </span>
      </div>
      
      <div className="flex gap-4">
        {/* 产品图片 */}
        <div className="w-24 h-24 flex-shrink-0">
          <img
            src={item.image_url || '/images/placeholder-spare-part.jpg'}
            alt={displayName}
            className="w-full h-full object-cover rounded-lg border"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder-spare-part.jpg';
            }}
          />
        </div>
        
        {/* 产品详细信息 */}
        <div className="flex-1 min-w-0">
          {/* 基础信息 */}
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 text-base mb-1">
              {displayName}
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">料号:</span> {item.part_number}
            </p>
            {displaySpec && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">规格:</span> {displaySpec}
              </p>
            )}
          </div>
          
          {/* 适用信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {item.app_model && (
              <div className="text-sm">
                <span className="text-gray-500">适用机型:</span>
                <span className="text-gray-700 ml-1">{item.app_model}</span>
              </div>
            )}
            {item.app_sn && (
              <div className="text-sm">
                <span className="text-gray-500">序列号:</span>
                <span className="text-gray-700 ml-1">{item.app_sn}</span>
              </div>
            )}
          </div>
          
          {/* 包装信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-3">
            {item.package_size_cm && (
              <div>
                <span className="text-gray-500">包装:</span>
                <span className="ml-1">{item.package_size_cm}cm</span>
              </div>
            )}
            {item.net_weight_kg && (
              <div>
                <span className="text-gray-500">净重:</span>
                <span className="ml-1">{item.net_weight_kg}kg</span>
              </div>
            )}
            {item.gross_weight_kg && (
              <div>
                <span className="text-gray-500">毛重:</span>
                <span className="ml-1">{item.gross_weight_kg}kg</span>
              </div>
            )}
            {item.pcs_per_box && (
              <div>
                <span className="text-gray-500">装箱:</span>
                <span className="ml-1">{item.pcs_per_box}{item.unit}</span>
              </div>
            )}
          </div>
          
          {/* 标签 */}
          <div className="flex gap-2">
            {item.is_consumable && (
              <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                耗材 Consumable
              </span>
            )}
            <span className="inline-block text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              {item.unit}
            </span>
          </div>
        </div>
        
        {/* 数量和操作 */}
        <div className="flex flex-col items-end gap-3 min-w-[120px]">
          {/* 数量控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={item.quantity <= 1}
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
            >
              +
            </button>
          </div>
          
          {/* 价格信息 */}
          {item.pricing && item.pricing.length > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                ¥{item.pricing[0].price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                单价 / {item.unit}
              </div>
            </div>
          )}
          
          {/* 删除按钮 */}
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
            title="移除必选备件"
          >
            移除
          </button>
        </div>
      </div>
      
      {/* 库存信息 */}
      {item.inventory && item.inventory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">库存状态:</span>
            <div className="mt-1 flex gap-4">
              {item.inventory.map((inv, index) => (
                <span key={index} className={`px-2 py-1 rounded-full text-xs ${
                  inv.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                  inv.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {inv.region}: {inv.quantity}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 购物车列表组件更新
```tsx
// frontend/src/components/Cart/CartList.tsx

import React from 'react';
import { CartItem } from './CartItem';
import { RequiredPartCartItem } from './RequiredPartCartItem';
import { CartItem as CartItemType } from '../../types/cart';

interface CartListProps {
  items: CartItemType[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
}

export const CartList: React.FC<CartListProps> = ({
  items,
  onUpdateQuantity,
  onRemove,
  language = 'zh'
}) => {
  // 分组显示：主要商品和必选备件
  const mainItems = items.filter(item => !item.is_required);
  const requiredItems = items.filter(item => item.is_required);
  
  return (
    <div className="cart-list space-y-6">
      {/* 主要商品 */}
      {mainItems.length > 0 && (
        <div className="main-items">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            主要商品 ({mainItems.length})
          </h3>
          <div className="space-y-4">
            {mainItems.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 必选备件 */}
      {requiredItems.length > 0 && (
        <div className="required-items">
          <h3 className="text-lg font-semibold text-orange-700 mb-4 border-b border-orange-200 pb-2">
            必选备件 Required Parts ({requiredItems.length})
          </h3>
          <div className="space-y-3">
            {requiredItems.map(item => (
              <RequiredPartCartItem
                key={item.id}
                item={item as CartItemType & { is_required: true }}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                language={language}
              />
            ))}
          </div>
          
          {/* 必选备件说明 */}
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-orange-600 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-1">关于必选备件</h4>
                <p className="text-sm text-orange-700">
                  必选备件是配套主要商品使用的必需组件，建议与主要商品一起购买以确保设备正常运行。
                  这些备件已根据主商品数量自动计算所需数量。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 空购物车状态 */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">购物车为空</h3>
          <p className="text-gray-500">添加一些产品到购物车开始购买</p>
        </div>
      )}
    </div>
  );
};
```

## 3. 类型定义更新

```typescript
// frontend/src/types/cart.ts

export interface CartItem {
  id: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  quantity: number;
  type: 'host' | 'accessory' | 'spare_part';
  is_required?: boolean;
  parent_part_number?: string;
  
  // 备件完整字段信息
  image_url?: string;
  spec?: string;
  spec_imperial?: string;
  app_model?: string;
  app_sn?: string;
  is_consumable?: boolean;
  unit?: string;
  status?: string;
  
  // 包装信息
  package_size_cm?: string | null;
  package_size_inch?: string | null;
  net_weight_kg?: number | null;
  net_weight_lbs?: number | null;
  gross_weight_kg?: number | null;
  gross_weight_lbs?: number | null;
  pcs_per_box?: number | null;
  
  // 定价和库存信息
  pricing?: PricingTier[];
  inventory?: InventoryInfo[];
}

export interface PricingTier {
  range: string;
  price: number;
  regionalPricing?: RegionalPricing[];
}

export interface RegionalPricing {
  region: string;
  price: number;
  currency: string;
}

export interface InventoryInfo {
  region: string;
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}
```

## 4. 实施步骤

### 4.1 第一阶段：数据获取增强
1. 更新 `requiredPartsUtils.ts` 文件
2. 实现 `fetchRequiredPartsFullInfo` 函数
3. 测试API调用和数据映射

### 4.2 第二阶段：购物车逻辑更新
1. 修改 `useCart` hook
2. 更新 `createRequiredPartCartItem` 函数
3. 测试必选备件添加流程

### 4.3 第三阶段：UI组件实现
1. 创建 `RequiredPartCartItem` 组件
2. 更新 `CartList` 组件
3. 更新类型定义

### 4.4 第四阶段：测试和优化
1. 端到端测试
2. 性能优化
3. 错误处理完善

## 5. 预期效果

实施完成后，必选备件在购物车中将显示：

1. **完整的产品信息**：料号、名称、规格、适用机型等
2. **详细的包装信息**：尺寸、重量、装箱数量等
3. **清晰的视觉区分**：橙色边框和背景突出显示
4. **关联关系标识**：显示配套的主商品料号
5. **库存和定价信息**：如果API支持，显示实时库存和价格

这将为用户提供与普通备件相同级别的详细信息，提升购物体验和决策质量。 