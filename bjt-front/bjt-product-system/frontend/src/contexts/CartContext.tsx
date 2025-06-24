import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem as OriginalCartItem } from '../api/services/cart.service';
import cartService from '../api/services/cart.service'; // 导入默认导出的cartService实例
import { useMockData } from '../config/env';
import { mergeNoEmpty } from '../utils/mergeUtils';
import { useAuth } from './AuthContext'; // 导入用户认证上下文

// 定义价格层级接口
export interface PriceTier {
  min: number;
  max: number | null;
  price: number;
  originalPrice?: number;
}

// 扩展CartItem接口，添加额外的UI需要的属性
export interface ExtendedCartItem extends OriginalCartItem {
  id: string;           // item_id的字符串版本
  code: string;         // 等同于part_number
  partNumber: string;   // 等同于part_number
  image: string;        // 等同于image_url，但保证不为undefined
  category: string;     // 等同于product_type
  productId: number;    // 等同于product_id
  priceTiers: PriceTier[];
  selected: boolean;
  originalPrice?: number;
  type: 'machine' | 'accessory' | 'consumable' | 'spare_part';  // 支持所有产品类型
  specs?: {
    partNumber: string;
    productName: string;
  };
  price: number;        // 对应于unit_price
  
  // 必选备件相关字段
  is_required?: boolean;
  parent_part_number?: string;
  
  // 备件完整字段信息
  name_zh?: string;
  name_en?: string;
  spec?: string;
  spec_imperial?: string;
  app_model?: string;
  app_sn?: string;
  is_consumable?: number; // 1=易损，2=非易损，3=隐藏
  unit?: string;
  status?: string;
  
  // 包装信息
  package_size_cm?: string | null;
  package_size_inch?: string | null;
  net_weight_kg?: number | null;
  net_weight_lbs?: number | null;
  gross_weight_kg?: number | null;
  gross_weight_lbs?: number | null;
  pcs_per_box?: number | string | null;
  pcs_per_pallet?: number | string | null;
  
  // 新增主层字段，便于购物车直接访问
  voltage?: string;
  frequency?: string;
  model?: string;
  
  // 定价和库存信息
  pricing?: any[];
  inventory?: any[];
  product_type: 'machine' | 'accessory' | 'spare_part' | 'consumable'; // 必需字段，与OriginalCartItem一致
}

// For backward compatibility, export ExtendedCartItem as CartItem for external use
export type CartItem = ExtendedCartItem;

// 将服务返回的CartItem转为UI使用的ExtendedCartItem
const mapServiceCartItemToUICartItem = (item: OriginalCartItem): ExtendedCartItem => {
  // 将product_type映射为type
  let type: 'machine' | 'accessory' | 'consumable' | 'spare_part';
  switch (item.product_type) {
    case 'machine':
      type = 'machine';
      break;
    case 'accessory':
      type = 'accessory';
      break;
    case 'consumable':
      type = 'consumable';
      break;
    case 'spare_part':
      type = 'spare_part';
      break;
    default:
      type = 'machine'; // 默认值
  }

  // 增强的名称获取逻辑，根据产品类型使用不同的策略
  const getDisplayName = (): string => {
    const props = item.properties || {};
    const itemAny = item as any; // 类型转换以访问扩展字段
    
    // 调试日志
    console.log('[CartContext.mapServiceCartItemToUICartItem] 商品名称映射调试:', {
      product_type: item.product_type,
      'item.name': item.name,
      'item.model': itemAny.model,
      'item.spec': itemAny.spec,
      'item.part_number': item.part_number,
      'props.name': props.name,
      'props.model': props.model,
      'props.spec': props.spec,
      'props.name_zh': props.name_zh,
      'props.name_en': props.name_en,
      'props.productName': props.productName
    });
    
    // 根据产品类型使用不同的名称获取策略
    switch (item.product_type) {
      case 'consumable':
        // 🔧 修复：耗材名称获取优先级，与CartFieldUnifier保持一致
        return itemAny.name_zh || 
               props.name_zh ||
               item.name || 
               props.name ||
               itemAny.product_name ||
               props.product_name ||
               // 耗材特殊：优先使用model相关字段作为名称
               itemAny.model ||
               props.model ||
               itemAny.model_metric ||
               props.model_metric ||
               itemAny.spec ||
               props.spec ||
               itemAny.code ||
               props.code ||
               item.part_number || 
               props.part_number ||
               `耗材-${itemAny.id || props.id || '未知'}`;
               
      case 'spare_part':
        // 备件名称获取优先级
        return props.name_zh || 
               props.name_en || 
               props.productName ||
               item.name || 
               props.name || 
               props.part_number || 
               item.part_number || 
               '备件';
               
      case 'accessory':
        // 配件名称获取优先级
        return props.name_zh || 
               props.name_en || 
               item.name || 
               props.name || 
               props.productName ||
               item.part_number || 
               '配件';
               
      case 'machine':
        // 主机名称获取优先级
        return props.name_zh || 
               props.name_en || 
               item.name || 
               props.name || 
               props.productName ||
               item.part_number || 
               '主机';
               
      default:
        // 默认名称获取逻辑
        return item.name || 
               props.name || 
               props.name_zh || 
               props.name_en || 
               props.productName ||
               item.part_number || 
               '商品';
    }
  };

  // 增强的图片获取逻辑
  const getDisplayImage = (): string => {
    const props = item.properties || {};
    
    // 图片获取优先级
    const imageUrl = props.image_url || 
                    item.image_url || 
                    props.image || 
                    (item as any).image || 
                    '';
                    
    // 如果有图片URL则返回，否则根据产品类型返回默认图片
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl;
    }
    
    // 根据产品类型返回默认图片
    switch (item.product_type) {
      case 'consumable':
        return '/images/consumables/default.jpg';
      case 'spare_part':
        return '/images/spare-parts/default.jpg';
      case 'accessory':
        return '/images/accessories/default.jpg';
      case 'machine':
        return '/images/machines/default.jpg';
      default:
        return '/images/placeholder.png';
    }
  };

  const displayName = getDisplayName();
  const displayImage = getDisplayImage();

  console.log('[CartContext.mapServiceCartItemToUICartItem] 最终映射结果:', {
    product_type: item.product_type,
    part_number: item.part_number,
    displayName,
    displayImage,
    originalName: item.name
  });

  return {
    ...item, // 保留原始CartItem的所有属性
    id: item.item_id.toString(),
    code: item.part_number,
    partNumber: item.part_number,
    image: displayImage,
    category: item.product_type,
    productId: item.product_id,
    priceTiers: [], // 默认为空数组
    selected: false,
    type: type,
    specs: {
      partNumber: item.part_number,
      productName: displayName
    },
    price: item.unit_price, // 将unit_price映射为price
    
    // 使用计算得到的显示名称，确保name字段正确
    name: displayName,
    
    // 必选备件相关字段 (从properties中提取)
    is_required: item.properties?.is_required || false,
    parent_part_number: item.properties?.parent_part_number,
    
    // 备件完整字段信息 (优先主层字段，其次properties)
    name_zh: (item as any).name_zh || item.properties?.name_zh || displayName,
    name_en: (item as any).name_en || item.properties?.name_en || displayName,
    spec: (item as any).spec || item.properties?.spec || '',
    spec_imperial: (item as any).spec_imperial || item.properties?.spec_imperial || '',
    app_model: (item as any).app_model || item.properties?.app_model || '',
    app_sn: (item as any).app_sn || item.properties?.app_sn || '',
    is_consumable: (item as any).is_consumable ?? item.properties?.is_consumable ?? 0,
    unit: (item as any).unit || item.properties?.unit || 'pcs',
    status: (item as any).status || item.properties?.status || 'publish',
    
    // 包装信息
    package_size_cm: (item as any).package_size_cm || item.properties?.package_size_cm || null,
    package_size_inch: (item as any).package_size_inch || item.properties?.package_size_inch || null,
    net_weight_kg: (item as any).net_weight_kg || item.properties?.net_weight_kg || null,
    net_weight_lbs: (item as any).net_weight_lbs || item.properties?.net_weight_lbs || null,
    gross_weight_kg: (item as any).gross_weight_kg || item.properties?.gross_weight_kg || null,
    gross_weight_lbs: (item as any).gross_weight_lbs || item.properties?.gross_weight_lbs || null,
    pcs_per_box: (item as any).pcs_per_box || item.properties?.pcs_per_box || null,
    pcs_per_pallet: (item as any).pcs_per_pallet || item.properties?.pcs_per_pallet || null,
    
    // 新增主层字段，优先主层，其次properties
    voltage: (item as any).voltage || item.properties?.voltage || '',
    frequency: (item as any).frequency || item.properties?.frequency || '',
    model: (item as any).model || item.properties?.model || '',
    
    // 定价和库存信息
    pricing: (item as any).pricing || item.properties?.pricing || [],
    inventory: (item as any).inventory || item.properties?.inventory || [],
    product_type: item.product_type
  };
};

// 定义购物车上下文接口
export interface CartContextType {
  items: ExtendedCartItem[];
  addItem: (item: ExtendedCartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearInvalidItems: () => Promise<void>;
  totalPrice: number;
  itemCount: number;
  selectedItems: ExtendedCartItem[];
  selectedCount: number;
  selectedTotal: number;
  toggleItemSelection: (id: string, selected: boolean) => void;
  selectAll: (selected: boolean) => void;
  isItemSelected: (id: string) => boolean;
  loading: boolean;
  syncError: string | null;
}

// 创建购物车上下文并提供默认值
export const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  clearInvalidItems: async () => {},
  totalPrice: 0,
  itemCount: 0,
  selectedItems: [],
  selectedCount: 0,
  selectedTotal: 0,
  toggleItemSelection: () => {},
  selectAll: () => {},
  isItemSelected: () => false,
  loading: false,
  syncError: null
});

interface CartProviderProps {
  children: ReactNode;
}

// 上下文提供者组件
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<ExtendedCartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // 获取用户认证状态
  const { user, isAuthenticated } = useAuth();
  
  // 本地 properties 缓存，part_number 为 key
  const cartPropertiesMap = React.useRef<Record<string, any>>({});
  
  // 用于跟踪当前用户ID，检测用户切换
  const currentUserIdRef = React.useRef<number | null>(null);
  
  // 从API加载购物车数据
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      console.log('🛒 [CartContext.fetchCart] Raw response:', response);
      
      // 使用现有的映射函数转换CartItem
      let extendedItems: ExtendedCartItem[] = (response.items || []).map(mapServiceCartItemToUICartItem);
      
      // 合并本地 properties 字段，使用产品类型+料号作为复合key
      const enhancedItems = extendedItems.map(item => {
        if (item.part_number) {
          const cacheKey = `${item.product_type}_${item.part_number}`;
          const localProps = cartPropertiesMap.current[cacheKey];
          if (localProps) {
            // 只用非空值合并 properties
            item.properties = mergeNoEmpty(item.properties || {}, localProps || {});
            item.name = localProps.name || item.name;
            item.image_url = localProps.image_url || item.image_url;
          }
        }
        return item;
      });
      
      setItems(enhancedItems);
      console.log('🛒 [CartContext.fetchCart] Cart loaded with', enhancedItems.length, 'items:', enhancedItems);
    } catch (error) {
      console.error('❌ [CartContext.fetchCart] Error fetching cart:', error);
      setSyncError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载购物车
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // 用户未认证时清空购物车
      setItems([]);
      setSelectedItemIds(new Set());
      cartPropertiesMap.current = {};
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 监听用户切换，当用户ID变化时清空购物车
  useEffect(() => {
    const newUserId = user?.id || null;
    
    // 如果这不是第一次加载，且用户ID发生了变化
    if (currentUserIdRef.current !== null && currentUserIdRef.current !== newUserId) {
      console.log('🔄 [CartContext] User changed from', currentUserIdRef.current, 'to', newUserId, '- clearing cart');
      
      // 清空购物车状态
      setItems([]);
      setSelectedItemIds(new Set());
      cartPropertiesMap.current = {};
      setSyncError(null);
      
      // 如果新用户已认证，重新加载购物车
      if (isAuthenticated && newUserId) {
        fetchCart();
      }
    }
    
    // 更新当前用户ID引用
    currentUserIdRef.current = newUserId;
  }, [user?.id, isAuthenticated]);
  
  // 添加商品到购物车
  const addItem = async (newItem: ExtendedCartItem) => {
    try {
      setLoading(true);
      console.log('🛒 [CartContext.addItem] Starting with newItem:', newItem);
      
      // 增强的 properties 处理，确保不同产品类型的属性正确保存
      const enhancedProperties = {
        // 基本产品信息 - 确保所有产品类型都有这些基础字段
        productName: newItem.name,
        name: newItem.name,
        part_number: newItem.part_number,
        image_url: newItem.image_url,
        image: newItem.image_url,
        price: newItem.unit_price,
        unit_price: newItem.unit_price,
        currency: newItem.currency,
        product_type: newItem.product_type,
        
        // 根据产品类型添加特定属性
        ...(newItem.product_type === 'consumable' && {
          // 耗材特有属性
          name_zh: newItem.name_zh || newItem.name,
          name_en: newItem.name_en || newItem.name,
          material: (newItem.properties as any)?.material || (newItem as any).material,
          width: (newItem.properties as any)?.width || (newItem as any).width,
          length: (newItem.properties as any)?.length || (newItem as any).length,
          thickness: (newItem.properties as any)?.thickness || (newItem as any).thickness,
          rollLength: (newItem.properties as any)?.rollLength || (newItem as any).rollLength,
          shape: (newItem.properties as any)?.shape || (newItem as any).shape,
          code: (newItem.properties as any)?.code || newItem.part_number,
          specs: (newItem.properties as any)?.specs
        }),
        ...(newItem.product_type === 'spare_part' && {
          // 备件特有属性
          name_zh: newItem.name_zh || newItem.name,
          name_en: newItem.name_en || newItem.name,
          spec: newItem.spec,
          spec_imperial: newItem.spec_imperial,
          app_model: newItem.app_model,
          app_sn: newItem.app_sn,
          is_consumable: newItem.is_consumable,
          unit: newItem.unit,
          pcs_per_box: newItem.pcs_per_box,
          required_parts: (newItem.properties as any)?.required_parts,
          required_quantity: (newItem.properties as any)?.required_quantity,
          package_size_cm: newItem.package_size_cm,
          package_size_inch: newItem.package_size_inch,
          net_weight_kg: newItem.net_weight_kg,
          net_weight_lbs: newItem.net_weight_lbs
        }),
        // 从原始properties中复制其他信息，但不覆盖上面的关键字段
        ...(newItem.properties || {}),
        // 确保关键字段不被覆盖
        id: newItem.product_id,
        productId: newItem.product_id
      };

      // 准备添加购物车请求数据
      const addToCartRequest = {
        product_type: newItem.product_type,
        product_id: newItem.product_id,
        part_number: newItem.part_number,
        quantity: newItem.quantity,
        properties: enhancedProperties
      };

      console.log('🛒 [CartContext.addItem] Enhanced properties for', newItem.product_type, ':', enhancedProperties);
      console.log('🛒 [CartContext.addItem] Calling cartService.addToCart with:', addToCartRequest);
      
      // 调用购物车服务
      const result = await cartService.addToCart(addToCartRequest);
      console.log('🛒 [CartContext.addItem] cartService.addToCart result:', result);
      
      // 缓存 properties，使用产品类型+料号作为复合key，避免不同类型商品互相覆盖
      if (newItem.part_number) {
        const cacheKey = `${newItem.product_type}_${newItem.part_number}`;
        cartPropertiesMap.current[cacheKey] = enhancedProperties;
        console.log('🛒 [CartContext.addItem] Cached properties with key:', cacheKey);
      } else {
        console.warn('[CartContext.addItem] part_number is empty, skip caching properties:', newItem);
      }
      
      // 重新获取购物车数据
      console.log('🛒 [CartContext.addItem] Fetching updated cart...');
      await fetchCart();
      console.log('🛒 [CartContext.addItem] Cart updated successfully');
      
    } catch (error) {
      console.error('❌ [CartContext.addItem] Failed to add item to cart:', error);
      console.error('❌ [CartContext.addItem] Error details:', {
        error,
        newItem: {
          product_type: newItem.product_type,
          part_number: newItem.part_number,
          name: newItem.name,
          product_id: newItem.product_id
        }
      });
      setSyncError('Failed to add item to cart');
      setLoading(false);
      throw error; // 重新抛出错误，让调用方处理
    }
  };
  
  // 从购物车移除商品
  const removeItem = async (itemId: string) => {
    console.log('🛒 [CartContext.removeItem] Removing item:', itemId);
    try {
      const numericId = parseInt(itemId);
      if (isNaN(numericId)) {
        console.error('🛒 [CartContext.removeItem] Invalid item ID:', itemId);
        return;
      }
      
      await cartService.removeCartItem(numericId);
      console.log('🛒 [CartContext.removeItem] Item removed successfully, refreshing cart');
      
      // 立即刷新购物车状态
      await refreshCart();
    } catch (error) {
      console.error('🛒 [CartContext.removeItem] Error removing item:', error);
      // 可以在这里添加用户提示
    }
  };
  
  // 更新购物车商品数量
  const updateQuantity = async (itemId: string, quantity: number) => {
    console.log('🛒 [CartContext.updateQuantity] Updating quantity for item:', itemId, 'to:', quantity);
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    
    try {
      const numericId = parseInt(itemId);
      if (isNaN(numericId)) {
        console.error('🛒 [CartContext.updateQuantity] Invalid item ID:', itemId);
        return;
      }
      
      await cartService.updateCartItem(numericId, { quantity });
      console.log('🛒 [CartContext.updateQuantity] Quantity updated successfully, refreshing cart');
      
      // 立即刷新购物车状态
      await refreshCart();
    } catch (error) {
      console.error('🛒 [CartContext.updateQuantity] Error updating quantity:', error);
      // 可以在这里添加用户提示
    }
  };
  
  // 清空购物车
  const clearCart = async () => {
    console.log('🛒 [CartContext.clearCart] Clearing cart');
    try {
      await cartService.clearCart();
      console.log('🛒 [CartContext.clearCart] Cart cleared successfully, refreshing cart');
      
      // 立即刷新购物车状态
      await refreshCart();
    } catch (error) {
      console.error('🛒 [CartContext.clearCart] Error clearing cart:', error);
      // 可以在这里添加用户提示
    }
  };
  
  // 切换商品选中状态
  const toggleItemSelection = (id: string, selected: boolean) => {
    setSelectedItemIds(current => {
      const updated = new Set(current);
      if (selected) {
        updated.add(id);
      } else {
        updated.delete(id);
      }
      return updated;
    });
  };
  
  // 全选/取消全选
  const selectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(items.map(item => item.id.toString()));
      setSelectedItemIds(allIds);
    } else {
      setSelectedItemIds(new Set());
    }
  };
  
  // 判断商品是否被选中
  const isItemSelected = (id: string) => selectedItemIds.has(id);
  
  // 计算派生值
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  const selectedItems = items.filter(item => selectedItemIds.has(item.id.toString()));
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const selectedTotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // 根据商品类型获取图片
  const getProductImage = (item: ExtendedCartItem): string => {
    if (item.image_url) return item.image_url;
    if (item.image) return item.image;
    
    // 根据产品类型返回默认图片
    switch (item.product_type) {
      case 'machine':
        return '/images/machines/default.jpg';
      case 'accessory':
        return '/images/accessories/default.jpg';
      case 'spare_part':
        return '/images/spare-parts/default.jpg';
      case 'consumable':
        return '/images/consumables/default.jpg';
      default:
        return '/images/placeholder.png';
    }
  };

  // 添加刷新购物车的方法
  const refreshCart = async () => {
    console.log('🛒 [CartContext.refreshCart] Refreshing cart data');
    try {
      const cartData = await cartService.getCart();
      // 使用现有的映射函数转换CartItem
      let extendedItems: ExtendedCartItem[] = (cartData.items || []).map(mapServiceCartItemToUICartItem);
      
      // 合并本地 properties 字段，使用产品类型+料号作为复合key
      extendedItems = extendedItems.map(item => {
        if (item.part_number) {
          const cacheKey = `${item.product_type}_${item.part_number}`;
          const localProps = cartPropertiesMap.current[cacheKey];
          if (localProps) {
            // 只用非空值合并 properties
            item.properties = mergeNoEmpty(item.properties || {}, localProps || {});
            item.name = localProps.name || item.name;
            item.image_url = localProps.image_url || item.image_url;
          }
        }
        return item;
      });
      
      setItems(extendedItems);
      console.log('🛒 [CartContext.refreshCart] Cart refreshed with', extendedItems.length, 'items');
    } catch (error) {
      console.error('🛒 [CartContext.refreshCart] Error refreshing cart:', error);
    }
  };
  
  // 修复购物车显示问题
  const clearInvalidItems = async () => {
    console.log('🔧 [CartContext.clearInvalidItems] Starting cart display fixes');
    try {
      setLoading(true);
      
      // 找出显示有问题的商品
      const problemItems = items.filter(item => {
        // 检查是否缺少必要的显示信息
        const hasDisplayIssues = !item.name || item.name === 'Invalid Type' || 
                                !item.image_url || item.image_url.includes('placeholder');
        return hasDisplayIssues;
      });
      
      if (problemItems.length === 0) {
        console.log('✅ [CartContext.clearInvalidItems] No display issues found');
        setSyncError('购物车显示正常，无需修复');
        setTimeout(() => setSyncError(null), 2000);
        return;
      }
      
      console.log(`🔧 [CartContext.clearInvalidItems] Found ${problemItems.length} items with display issues:`, 
        problemItems.map(item => ({ 
          part_number: item.part_number, 
          name: item.name, 
          product_type: item.product_type 
        }))
      );
      
      // 重新获取购物车数据以修复显示
      await fetchCart();
      
      setSyncError(`已修复 ${problemItems.length} 个商品的显示问题`);
      setTimeout(() => setSyncError(null), 3000);
      
    } catch (error) {
      console.error('❌ [CartContext.clearInvalidItems] Error fixing cart display:', error);
      setSyncError('修复购物车显示时出错');
    } finally {
      setLoading(false);
    }
  };
  
  const contextValue: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearInvalidItems,
    totalPrice,
    itemCount,
    selectedItems,
    selectedCount,
    selectedTotal,
    toggleItemSelection,
    selectAll,
    isItemSelected,
    loading,
    syncError
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// 使用购物车上下文的自定义钩子
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 