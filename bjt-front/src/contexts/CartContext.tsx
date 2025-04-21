import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// 定义购物车商品类型
export interface CartItem {
  id: number;
  model: string;
  type: 'machine' | 'accessory' | 'consumable' | 'spare';
  typeLabel: string;
  image_url: string;
  sku: string;
  price: number;
  originalPrice?: number;
  properties: Record<string, string>;
  quantity: number;
  checked: boolean;
}

// 购物车上下文接口
interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  cartCount: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, 'checked' | 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  toggleItemCheck: (id: number) => void;
  toggleAllCheck: (checked: boolean) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
}

// 创建购物车上下文
const CartContext = createContext<CartContextType | undefined>(undefined);

// 购物车提供者Props
interface CartProviderProps {
  children: ReactNode;
}

// 本地存储键名
const CART_STORAGE_KEY = 'bjt_cart';

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // 购物车商品状态
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // 购物车打开状态
  const [isCartOpen, setIsCartOpen] = useState(false);
  // 商品总数
  const [cartCount, setCartCount] = useState(0);
  // 总价
  const [totalPrice, setTotalPrice] = useState(0);

  // 初始化时从本地存储加载购物车数据
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // 当购物车变化时更新本地存储
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      
      // 更新购物车计数
      const count = cartItems.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
      
      // 更新总价
      const total = cartItems.reduce((sum, item) => {
        return item.checked ? sum + (item.price * item.quantity) : sum;
      }, 0);
      setTotalPrice(total);
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems]);

  // 添加到购物车
  const addToCart = (item: Omit<CartItem, 'checked' | 'quantity'>) => {
    setCartItems(prevItems => {
      // 检查是否已存在相同商品
      const existingItemIndex = prevItems.findIndex(i => i.id === item.id);
      
      if (existingItemIndex !== -1) {
        // 如果存在，增加数量
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // 否则添加新商品
        return [...prevItems, { ...item, quantity: 1, checked: true }];
      }
    });
  };

  // 从购物车移除
  const removeFromCart = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // 更新商品数量
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // 切换商品选中状态
  const toggleItemCheck = (id: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // 切换全选状态
  const toggleAllCheck = (checked: boolean) => {
    setCartItems(prevItems => 
      prevItems.map(item => ({ ...item, checked }))
    );
  };

  // 清空购物车
  const clearCart = () => {
    setCartItems([]);
  };

  // 切换购物车显示状态
  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  // 关闭购物车
  const closeCart = () => {
    setIsCartOpen(false);
  };

  // 提供上下文值
  const value: CartContextType = {
    cartItems,
    isCartOpen,
    cartCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleItemCheck,
    toggleAllCheck,
    clearCart,
    toggleCart,
    closeCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 自定义hook，用于在组件中获取购物车上下文
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 