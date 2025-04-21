import axios, { AxiosResponse } from 'axios';

// WordPress API配置
const API_BASE_URL = import.meta.env?.VITE_API_URL || 
                    (window as any).ENV_API_URL || 
                    'https://api.bjt-system.com/wp-json/wp/v2';

// 产品线接口
export interface ProductLine {
  id: number;
  title_en: string;
  title_cn: string;
  description_en: string;
  description_cn: string;
  subitem1_en: string;
  subitem1_cn: string;
  subitem2_en: string;
  subitem2_cn: string;
  subitem3_en: string;
  subitem3_cn: string;
  image_url: string;
  status: string;
  menu_order: number;
}

// 产品接口
export interface Product {
  id: number;
  title_en: string;
  title_cn: string;
  description_en: string;
  description_cn: string;
  image_url: string;
  price: number;
  category_id: number;
  type: string;
  sku: string;
  stock_status: 'in_stock' | 'out_of_stock' | 'backorder';
  features_en?: string[];
  features_cn?: string[];
  specifications?: Record<string, string>;
  status: string;
}

// 购物车规格类型
export interface CartItemSpecs {
  model?: string;
  partNumber?: string;
  productName?: string;
  voltage?: string;
  frequency?: string;
  palletSize?: string;
  palletQty?: string;
}

// 购物车项类型
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  specs?: CartItemSpecs;
  type?: 'machine' | 'accessory';
  image?: string;
}

// 用户接口类型
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // 根据实际后端API地址调整
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 在发送请求前做些什么，例如添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 处理响应错误
    if (error.response) {
      // 服务器返回错误码
      console.error('API Error:', error.response.status, error.response.data);
      
      // 处理401未授权错误
      if (error.response.status === 401) {
        // 可以在这里处理登出逻辑
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // 请求已发出但未收到响应
      console.error('No response received:', error.request);
    } else {
      // 请求设置时发生错误
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API服务
const apiService = {
  // 获取所有产品线
  getProductLines: async (): Promise<ProductLine[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/product-lines`, {
        params: {
          status: 'publish',
          orderby: 'menu_order',
          order: 'asc',
          per_page: 100
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product lines:', error);
      throw error;
    }
  },

  // 获取单个产品线
  getProductLine: async (id: number): Promise<ProductLine> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/product-lines/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product line with ID ${id}:`, error);
      throw error;
    }
  },

  // 获取产品
  getProducts: async (params: { 
    category_id?: number, 
    type?: string,
    page?: number,
    per_page?: number
  } = {}): Promise<Product[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: {
          ...params,
          status: 'publish',
          orderby: 'menu_order',
          order: 'asc',
          per_page: params.per_page || 20
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  // 获取单个产品
  getProduct: async (id: number): Promise<Product> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product with ID ${id}:`, error);
      throw error;
    }
  }
};

// 为兼容旧代码，导出产品相关API
export const productApi = {
  getProducts: apiService.getProducts,
  getProduct: apiService.getProduct,
  // 添加其他可能需要的方法以保持向后兼容
  getProductById: async (id: string | number): Promise<Product> => {
    return apiService.getProduct(Number(id));
  }
};

// 购物车相关API
export const cartApi = {
  // 获取购物车
  getCart: (): Promise<CartItem[]> => {
    return api.get('/cart');
  },
  
  // 添加商品到购物车
  addToCart: (
    productId: string, 
    quantity: number, 
    voltage?: string, 
    specs?: CartItemSpecs, 
    type?: 'machine' | 'accessory'
  ): Promise<void> => {
    return api.post('/cart/items', { productId, quantity, voltage, specs, type });
  },
  
  // 更新购物车商品数量
  updateCartItem: (itemId: string, quantity: number): Promise<void> => {
    return api.put(`/cart/items/${itemId}`, { quantity });
  },
  
  // 从购物车移除商品
  removeFromCart: (itemId: string): Promise<void> => {
    return api.delete(`/cart/items/${itemId}`);
  },
  
  // 清空购物车
  clearCart: (): Promise<void> => {
    return api.delete('/cart');
  },
  
  // 获取购物车总计
  getCartSummary: () => {
    return api.get('/cart/summary');
  }
};

// 订单相关API
export const orderApi = {
  // 创建订单
  createOrder: (orderData: any) => {
    return api.post('/orders', orderData);
  },
  
  // 获取订单列表
  getOrders: () => {
    return api.get('/orders');
  },
  
  // 获取订单详情
  getOrderById: (id: string) => {
    return api.get(`/orders/${id}`);
  }
};

// 认证相关API
export const authApi = {
  // 登录
  login: (username: string, password: string): Promise<{user: User, token: string}> => {
    return api.post('/auth/login', { username, password });
  },
  
  // 登出
  logout: (): Promise<void> => {
    return api.post('/auth/logout');
  },
  
  // 获取当前用户信息
  getCurrentUser: (): Promise<User> => {
    return api.get('/auth/me');
  },
  
  // 刷新token
  refreshToken: (): Promise<{token: string}> => {
    return api.post('/auth/refresh-token');
  }
};

export default apiService; 