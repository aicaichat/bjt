import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem as ApiCartItem, CartItemSpecs } from '../services/api';
import { cartService, CartItem as ServiceCartItem } from '../api/services';
import { useMockData } from '../config/env';

// 定义价格层级接口
export interface PriceTier {
  min: number;
  max: number | null;
  price: number;
  originalPrice?: number;
}

// 扩展CartItem接口，添加额外的属性
export interface CartItem extends ApiCartItem {
  code: string;
  partNumber: string;
  image: string;
  category: string;
  productId: number;
  priceTiers: PriceTier[];
  properties?: {
    [key: string]: string;
  };
  selected: boolean;
  originalPrice?: number;
}

// 将服务返回的CartItem转为UI使用的CartItem
const mapServiceCartItemToUICartItem = (item: ServiceCartItem): CartItem => {
  return {
    id: item.item_id.toString(),
    name: item.name,
    price: item.unit_price,
    quantity: item.quantity,
    code: item.part_number,
    partNumber: item.part_number,
    image: item.image_url || '',
    category: item.product_type,
    productId: item.product_id,
    priceTiers: [], // 默认为空数组
    selected: false,
    type: item.product_type === 'machine' ? 'machine' : 'accessory',
    properties: item.properties || {},
    specs: {
      partNumber: item.part_number,
      productName: item.name
    }
  };
};

// 定义购物车上下文接口
export interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  itemCount: number;
  selectedItems: CartItem[];
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
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // 从API加载购物车数据
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      const cartItems = response.items.map(mapServiceCartItemToUICartItem);
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
  const addItem = async (newItem: CartItem) => {
    try {
      setLoading(true);
      
      // 准备添加购物车请求数据
      await cartService.addToCart({
        product_type: newItem.type === 'machine' ? 'machine' : 'accessory',
        product_id: newItem.productId,
        quantity: newItem.quantity,
        properties: newItem.properties
      });
      
      // 重新获取购物车数据
      await fetchCart();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      setSyncError('Failed to add item to cart');
      setLoading(false);
    }
  };
  
  // 从购物车移除商品
  const removeItem = async (id: string) => {
    try {
      setLoading(true);
      await cartService.removeCartItem(Number(id));
      
      // 移除选中状态
      setSelectedItemIds(current => {
        const updated = new Set(current);
        updated.delete(id);
        return updated;
      });
      
      // 重新获取购物车数据
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      setSyncError('Failed to remove item from cart');
      setLoading(false);
    }
  };
  
  // 更新购物车商品数量
  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }
    
    try {
      setLoading(true);
      await cartService.updateCartItem(Number(id), { quantity });
      
      // 重新获取购物车数据
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart item quantity:', error);
      setSyncError('Failed to update cart item quantity');
      setLoading(false);
    }
  };
  
  // 清空购物车
  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      
      // 清空选中状态
      setSelectedItemIds(new Set());
      
      // 重新获取购物车数据
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      setSyncError('Failed to clear cart');
      setLoading(false);
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