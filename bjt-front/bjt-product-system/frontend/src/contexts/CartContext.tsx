import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem as ApiCartItem, CartItemSpecs } from '../services/api';

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

// 本地存储键
const CART_STORAGE_KEY = 'bjt-cart';

// 上下文提供者组件
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    // 设置一个短暂的延迟，模拟加载过程
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);
  
  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(item => 
        item.id === newItem.id && 
        JSON.stringify(item.specs) === JSON.stringify(newItem.specs));
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        return updatedItems;
      } else {
        // Add new item if it doesn't exist
        return [...currentItems, newItem];
      }
    });
  };
  
  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
    setSelectedItemIds(current => {
      const updated = new Set(current);
      updated.delete(id);
      return updated;
    });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
    setSelectedItemIds(new Set());
  };
  
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
  
  const selectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(items.map(item => item.id.toString()));
      setSelectedItemIds(allIds);
    } else {
      setSelectedItemIds(new Set());
    }
  };
  
  const isItemSelected = (id: string) => selectedItemIds.has(id);
  
  // Calculate derived values
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

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 