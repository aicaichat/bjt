import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_TIMEOUT, useMockData } from '../config/env';
import { mockProductLines } from './mockService';

// 临时变量，最终会被移除，防止代码出错
const API_BASE_URL_LOCAL_UNUSED = API_BASE_URL; 

// 拦截器处理函数
const responseSuccessInterceptor = (response: AxiosResponse) => {
  // 针对WordPress REST API的特殊处理
  if (response.data && response.data.success === false) {
    // 这是业务逻辑错误，将其转换为正确的错误处理流程
    return Promise.reject(new Error(response.data.message || 'API Error'));
  }
  
  // 返回数据，可以根据项目需求做进一步处理
  return response.data;
};

const responseErrorInterceptor = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Error: No response received', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Error:', error.message);
  }
  
  // 将错误对象传递给后续的 catch 处理
  return Promise.reject(error);
};

// 创建API实例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 添加请求拦截器 - 例如添加认证令牌
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 尝试从本地存储获取令牌
    const token = localStorage.getItem('token');
    
    // 如果存在令牌，则添加到请求头
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
api.interceptors.response.use(
  responseSuccessInterceptor,
  responseErrorInterceptor
);

// API服务
export interface ProductLine {
  id: number;
  title_en: string;
  title_zh: string;
  description_en: string;
  description_zh: string;
  image_url: string;
  status: string;
  sort_order: number;
}

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

export interface CartItemSpecs {
  model?: string;
  partNumber?: string;
  productName?: string;
  voltage?: string;
  frequency?: string;
  palletSize?: string;
  palletQty?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  specs?: CartItemSpecs;
  type?: 'machine' | 'accessory';
  image?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

interface LoginApiResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expires_in?: number;
    user: BackendUser;
  } | null;
}

// 主API服务对象
const apiService = {
  // 获取产品线列表
  getProductLines: async (): Promise<ProductLine[]> => {
    try {
      if (useMockData) {
        console.log('Using mock data for product lines');
        return mockProductLines;
      }
      
      // Use real API - 只有useMockData为false时才会执行以下代码
      console.log('Using real API for product lines: /product-lines');
      // Uses the 'api' instance, so baseURL is http://localhost:8080/wp-json/bjt/v1
      // The backend controller for product-lines uses 'sort_order ASC, id DESC' by default.
      // Parameters 'orderby' and 'order' are not used by the backend for this endpoint.
      const productLinesData: ProductLine[] = await api.get('/product-lines', {
        params: {
          status: 'publish',
          per_page: 100 // Fetch up to 100 items, pagination UI can be added later
        }
      });
      return productLinesData;
    } catch (error) {
      // 如果在使用模拟数据模式下依然到达这里，返回模拟数据作为备选方案
      if (useMockData) {
        console.warn('Error occurred but using mock data as fallback', error);
        return mockProductLines;
      }
      console.error('Failed to fetch product lines:', error);
      throw error;
    }
  },

  // 获取单个产品线
  getProductLine: async (id: number): Promise<ProductLine> => {
    try {
      if (useMockData) {
        const line = mockProductLines.find(line => line.id === id);
        if (line) return line;
        throw new Error(`Mock product line with ID ${id} not found`);
      }

      const response: ProductLine = await api.get(`/product-lines/${id}`); // Changed to use 'api' instance
      return response;
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
      const response = await axios.get(`${API_BASE_URL_LOCAL_UNUSED}/products`, {
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
      const response = await axios.get(`${API_BASE_URL_LOCAL_UNUSED}/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product with ID ${id}:`, error);
      throw error;
    }
  }
};

// Authentication API service
export const authApi = {
  login: async (username: string, password: string): Promise<{ user: BackendUser, token: string }> => {
    try {
      const axiosFullResponse = await api.post<LoginApiResponse>('/auth/login', { username, password });
      
      const effectivePayload = axiosFullResponse.data as any as { token: string; expires_in?: number; user: BackendUser; success?: boolean; message?: string };

      console.log('[DEBUG] authApi.login: effectivePayload (axiosFullResponse.data):', JSON.stringify(effectivePayload, null, 2));
      if (effectivePayload) {
        console.log('[DEBUG] authApi.login: effectivePayload.token:', effectivePayload.token);
        console.log('[DEBUG] authApi.login: effectivePayload.user (type):', typeof effectivePayload.user);
        console.log('[DEBUG] authApi.login: effectivePayload.success (if present):', effectivePayload.success);
        console.log('[DEBUG] authApi.login: effectivePayload.message (if present):', effectivePayload.message);
      } else {
        console.log('[DEBUG] authApi.login: effectivePayload is null or undefined');
      }

      if (effectivePayload && effectivePayload.token && effectivePayload.user) {
        localStorage.setItem('token', effectivePayload.token);
        return { user: effectivePayload.user, token: effectivePayload.token };
      } else {
        throw new Error(effectivePayload?.message || 'Login failed: Processed response did not contain token or user data.');
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'An unknown login error occurred';
      console.error('Login API call failed:', errorMessage, error.response?.data);
      throw new Error(errorMessage);
    }
  },
  // TODO: Add other auth methods like logout, register if they hit the backend
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
  },

  // 导出订单PO文档
  exportPO: (orderId: string, format: 'pdf' | 'excel' = 'pdf') => {
    return api.get(`/orders/${orderId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  },

  // 取消订单
  cancelOrder: (orderId: string) => {
    return api.put(`/orders/${orderId}/cancel`);
  },

  // 重新下单
  reorder: (orderId: string) => {
    return api.post(`/orders/${orderId}/reorder`);
  }
};

export default apiService; 