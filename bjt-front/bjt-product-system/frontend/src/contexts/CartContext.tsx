import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem as OriginalCartItem } from '../api/services/cart.service';
import cartService from '../api/services/cart.service'; // 导入默认导出的cartService实例
import { useMockData } from '../config/env';

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
  pcs_per_box?: number | string | null;
  pcs_per_pallet?: number | string | null;
  
  // 新增主层字段，便于购物车直接访问
  voltage?: string;
  frequency?: string;
  model?: string;
  
  // 定价和库存信息
  pricing?: any[];
  inventory?: any[];
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

  return {
    ...item, // 保留原始CartItem的所有属性
    id: item.item_id.toString(),
    code: item.part_number,
    partNumber: item.part_number,
    image: item.image_url || '',
    category: item.product_type,
    productId: item.product_id,
    priceTiers: [], // 默认为空数组
    selected: false,
    type: type,
    specs: {
      partNumber: item.part_number,
      productName: item.name
    },
    price: item.unit_price, // 将unit_price映射为price
    
    // 必选备件相关字段 (从properties中提取)
    is_required: item.properties?.is_required || false,
    parent_part_number: item.properties?.parent_part_number,
    
    // 备件完整字段信息 (从properties中提取或使用默认值)
    name_zh: item.properties?.name_zh || item.name,
    name_en: item.properties?.name_en || item.name,
    spec: item.properties?.spec || '',
    spec_imperial: item.properties?.spec_imperial || '',
    app_model: item.properties?.app_model || '',
    app_sn: item.properties?.app_sn || '',
    is_consumable: item.properties?.is_consumable || false,
    unit: item.properties?.unit || 'pcs',
    status: item.properties?.status || 'publish',
    
    // 包装信息
    package_size_cm: item.properties?.package_size_cm || null,
    package_size_inch: item.properties?.package_size_inch || null,
    net_weight_kg: item.properties?.net_weight_kg || null,
    net_weight_lbs: item.properties?.net_weight_lbs || null,
    gross_weight_kg: item.properties?.gross_weight_kg || null,
    gross_weight_lbs: item.properties?.gross_weight_lbs || null,
    pcs_per_box: item.properties?.pcs_per_box || null,
    pcs_per_pallet: item.properties?.pcs_per_pallet || null,
    
    // 新增主层字段，便于购物车直接访问
    voltage: item.properties?.voltage || '',
    frequency: item.properties?.frequency || '',
    model: item.properties?.model || '',
    
    // 定价和库存信息
    pricing: item.properties?.pricing || [],
    inventory: item.properties?.inventory || []
  };
};

// 定义购物车上下文接口
export interface CartContextType {
  items: ExtendedCartItem[];
  addItem: (item: ExtendedCartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
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
  
  // 本地 properties 缓存，part_number 为 key
  const cartPropertiesMap = React.useRef<Record<string, any>>({});
  
  // 从API加载购物车数据
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      let cartItems = response.items.map(mapServiceCartItemToUICartItem);
      // 合并本地 properties 字段，key 用 part_number
      cartItems = cartItems.map(item => {
        const key = item.part_number || item.code;
        const localProps = key ? cartPropertiesMap.current[key] : undefined;
        if (localProps) {
          item.properties = { ...localProps, ...(item.properties || {}) };
        }
        return item;
      });
      setItems(cartItems);
      setSyncError(null);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setSyncError('Failed to load cart data');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载购物车
  useEffect(() => {
    fetchCart();
  }, []);
  
  // 添加商品到购物车
  const addItem = async (newItem: ExtendedCartItem) => {
    try {
      setLoading(true);
      console.log('🛒 [CartContext.addItem] Starting with newItem:', newItem);
      // 准备添加购物车请求数据，确保包含所有必需字段和产品信息
      const addToCartRequest = {
        product_type: newItem.product_type, // 使用原始的 product_type
        product_id: newItem.product_id,     // 使用原始的 product_id
        part_number: newItem.part_number,   // 使用原始的 part_number
        quantity: newItem.quantity,
        properties: {
          // 基本产品信息
          productName: newItem.name,
          name: newItem.name,
          part_number: newItem.part_number,
          image_url: newItem.image_url,
          image: newItem.image_url,
          price: newItem.unit_price,
          unit_price: newItem.unit_price,
          currency: newItem.currency,
          // 从原始properties中复制所有其他信息
          ...(newItem.properties || {}),
          // 确保关键字段不被覆盖
          id: newItem.product_id,
          productId: newItem.product_id
        }
      };
      // 本地缓存 properties，key 用 part_number
      if (newItem.part_number) {
        cartPropertiesMap.current[newItem.part_number] = addToCartRequest.properties;
      }
      console.log('🛒 [CartContext.addItem] Calling cartService.addToCart with:', addToCartRequest);
      await cartService.addToCart(addToCartRequest);
      console.log('🛒 [CartContext.addItem] cartService.addToCart completed, fetching updated cart...');
      // 重新获取购物车数据
      await fetchCart();
      console.log('🛒 [CartContext.addItem] Cart updated successfully');
    } catch (error) {
      console.error('❌ [CartContext.addItem] Failed to add item to cart:', error);
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
      // 合并本地 properties 字段，key 用 part_number
      extendedItems = extendedItems.map(item => {
        const key = item.part_number || item.code;
        const localProps = key ? cartPropertiesMap.current[key] : undefined;
        if (localProps) {
          item.properties = { ...localProps, ...(item.properties || {}) };
        }
        return item;
      });
      setItems(extendedItems);
      console.log('🛒 [CartContext.refreshCart] Cart refreshed with', extendedItems.length, 'items');
    } catch (error) {
      console.error('🛒 [CartContext.refreshCart] Error refreshing cart:', error);
    }
  };
  
  const contextValue: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
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