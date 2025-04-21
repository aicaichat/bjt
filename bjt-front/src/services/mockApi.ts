import { Product, CartItem, User, CartItemSpecs } from './api';

// 模拟的本地存储键
const CART_STORAGE_KEY = 'bjt_mock_cart';

// 模拟产品数据
const mockProducts: Product[] = [
  {
    id: 'LP-V1',
    code: 'LP-V1',
    name: '气垫机 V1型',
    partNumber: 'BJT-LP-V1-2024',
    palletSize: '120 × 80 × 160 cm',
    palletQuantity: '24件',
    category: 'machine',
    inventory: {
      EU: 20,
      AU: 20,
      DE: 10
    },
    pricing: [
      { range: '1-10', price: 100 },
      { range: '11-100', price: 90 },
      { range: '> 100', price: 50 }
    ],
    details: {
      packageSize: '60 × 40 × 35 cm',
      grossWeight: '15 kg',
      palletHeight: '190 cm',
      otherSpecs: '详见规格PDF'
    }
  },
  {
    id: 'LP-F1',
    code: 'LP-F1',
    name: '气垫机 F1型',
    partNumber: 'BJT-LP-F1-2024',
    palletSize: '110 × 75 × 145 cm',
    palletQuantity: '20件',
    category: 'machine',
    inventory: {
      EU: 15,
      AU: 15,
      DE: 8
    },
    pricing: [
      { range: '1-10', price: 120 },
      { range: '11-100', price: 110 },
      { range: '> 100', price: 95 }
    ],
    details: {
      packageSize: '55 × 35 × 30 cm',
      grossWeight: '12 kg',
      palletHeight: '180 cm',
      otherSpecs: '详见规格PDF'
    }
  },
  {
    id: 'LP-P1',
    code: 'LP-P1',
    name: '气垫机 P1型',
    partNumber: 'BJT-LP-P1-2024',
    palletSize: '125 × 85 × 155 cm',
    palletQuantity: '22件',
    category: 'machine',
    inventory: {
      EU: 12,
      AU: 18,
      DE: 5
    },
    pricing: [
      { range: '1-10', price: 150 },
      { range: '11-100', price: 130 },
      { range: '> 100', price: 110 }
    ],
    details: {
      packageSize: '65 × 45 × 38 cm',
      grossWeight: '18 kg',
      palletHeight: '185 cm',
      otherSpecs: '详见规格PDF'
    }
  },
  // 配件
  {
    id: 'ACC-FS-01',
    code: 'Floor-Stand',
    name: '地面支架组件',
    model: 'FS-V2',
    partNumber: 'BJT-FS-V2-2024',
    palletSize: '90 × 70 × 120 cm',
    palletQuantity: '16件',
    category: 'accessory',
    inventory: {
      EU: 25,
      AU: 20,
      DE: 15
    },
    pricing: [
      { range: '1-10', price: 45 },
      { range: '11-50', price: 40 },
      { range: '> 50', price: 35 }
    ],
    details: {
      packageSize: '40 × 30 × 20 cm',
      grossWeight: '5 kg',
      palletHeight: '125 cm',
      otherSpecs: '适用于所有LP系列气垫机'
    }
  },
  {
    id: 'ACC-TS-01',
    code: 'Table-Stand',
    name: '桌面支架组件',
    model: 'TS-V1',
    partNumber: 'BJT-TS-V1-2024',
    palletSize: '80 × 60 × 110 cm',
    palletQuantity: '20件',
    category: 'accessory',
    inventory: {
      EU: 30,
      AU: 25,
      DE: 18
    },
    pricing: [
      { range: '1-10', price: 35 },
      { range: '11-50', price: 30 },
      { range: '> 50', price: 25 }
    ],
    details: {
      packageSize: '35 × 25 × 15 cm',
      grossWeight: '3 kg',
      palletHeight: '115 cm',
      otherSpecs: '适用于所有LP系列气垫机'
    }
  }
];

// 模拟用户数据
const mockUsers = [
  {
    id: 'usr-001',
    username: 'admin',
    password: 'admin123', // 注意：真实环境中密码应当加密存储
    name: '管理员',
    email: 'admin@example.com',
    role: 'admin'
  },
  {
    id: 'usr-002',
    username: 'user',
    password: 'user123',
    name: '普通用户',
    email: 'user@example.com',
    role: 'user'
  }
];

// 辅助函数：从本地存储获取购物车
const getCartFromStorage = (): CartItem[] => {
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  if (cartData) {
    try {
      return JSON.parse(cartData);
    } catch (e) {
      console.error('Error parsing cart data:', e);
      return [];
    }
  }
  return [];
};

// 辅助函数：将购物车保存到本地存储
const saveCartToStorage = (cart: CartItem[]): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟产品API
export const mockProductApi = {
  // 获取产品列表
  getProducts: async (): Promise<Product[]> => {
    await delay(300); // 模拟网络延迟
    return [...mockProducts];
  },
  
  // 获取产品详情
  getProductById: async (id: string): Promise<Product> => {
    await delay(200);
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  },
  
  // 查询产品库存
  getProductInventory: async (id: string) => {
    await delay(150);
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product.inventory;
  },
  
  // 获取产品价格
  getProductPricing: async (id: string) => {
    await delay(150);
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product.pricing;
  }
};

// 模拟购物车API
export const mockCartApi = {
  // 获取购物车
  getCart: async (): Promise<CartItem[]> => {
    await delay(200);
    return getCartFromStorage();
  },
  
  // 添加商品到购物车
  addToCart: async (
    productId: string, 
    quantity: number, 
    voltage?: string, 
    specs?: CartItemSpecs, 
    type?: 'machine' | 'accessory'
  ): Promise<void> => {
    await delay(250);
    
    const product = mockProducts.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    const cart = getCartFromStorage();
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    // 默认规格和类型
    const defaultSpecs = {
      model: product.model || 'N/A',
      partNumber: product.partNumber,
      productName: product.name || product.code,
      voltage: voltage || 'N/A',
      frequency: '50Hz',
      palletSize: product.palletSize,
      palletQty: product.palletQuantity
    };
    
    const itemSpecs = specs || defaultSpecs;
    const itemType = type || (product.category || 'machine');
    
    if (existingItemIndex >= 0) {
      // 更新已有商品数量
      cart[existingItemIndex].quantity += quantity;
    } else {
      // 添加新商品
      cart.push({
        id: productId,
        name: product.name || product.code,
        price: product.pricing[0].price,
        quantity,
        specs: itemSpecs,
        type: itemType,
        image: `https://via.placeholder.com/100x100?text=${productId}`
      });
    }
    
    saveCartToStorage(cart);
  },
  
  // 更新购物车商品数量
  updateCartItem: async (itemId: string, quantity: number): Promise<void> => {
    await delay(200);
    
    const cart = getCartFromStorage();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error(`Item with ID ${itemId} not found in cart`);
    }
    
    cart[itemIndex].quantity = quantity;
    saveCartToStorage(cart);
  },
  
  // 从购物车移除商品
  removeFromCart: async (itemId: string): Promise<void> => {
    await delay(200);
    
    const cart = getCartFromStorage();
    const updatedCart = cart.filter(item => item.id !== itemId);
    
    saveCartToStorage(updatedCart);
  },
  
  // 清空购物车
  clearCart: async (): Promise<void> => {
    await delay(150);
    saveCartToStorage([]);
  },
  
  // 获取购物车总计
  getCartSummary: async () => {
    await delay(200);
    
    const cart = getCartFromStorage();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      totalItems,
      totalAmount
    };
  }
};

// 模拟订单API
export const mockOrderApi = {
  // 创建订单
  createOrder: async (orderData: any) => {
    await delay(500);
    // 创建订单成功后清空购物车
    saveCartToStorage([]);
    
    return {
      orderId: `ORD-${Date.now()}`,
      status: 'created',
      createdAt: new Date().toISOString(),
      ...orderData
    };
  },
  
  // 获取订单列表
  getOrders: async () => {
    await delay(300);
    // 模拟没有历史订单
    return [];
  },
  
  // 获取订单详情
  getOrderById: async (id: string) => {
    await delay(250);
    // 模拟订单不存在
    throw new Error(`Order with ID ${id} not found`);
  }
};

// 模拟认证API
export const mockAuthApi = {
  // 登录
  login: async (username: string, password: string): Promise<{user: User, token: string}> => {
    await delay(500); // 模拟网络延迟
    
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    // 生成模拟token
    const token = `mock-token-${Date.now()}-${user.id}`;
    
    // 存储token和用户信息
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }));
    
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  },
  
  // 登出
  logout: async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
  
  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    await delay(200);
    
    const userData = localStorage.getItem('auth_user');
    if (!userData) {
      throw new Error('未登录');
    }
    
    return JSON.parse(userData);
  },
  
  // 刷新token
  refreshToken: async (): Promise<{token: string}> => {
    await delay(300);
    
    const userData = localStorage.getItem('auth_user');
    if (!userData) {
      throw new Error('未登录');
    }
    
    const user = JSON.parse(userData);
    const token = `mock-token-${Date.now()}-${user.id}`;
    
    localStorage.setItem('auth_token', token);
    
    return { token };
  }
};

export default {
  productApi: mockProductApi,
  cartApi: mockCartApi,
  orderApi: mockOrderApi,
  authApi: mockAuthApi
}; 