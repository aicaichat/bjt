import axios from 'axios';
import { API_CONFIG } from '../config/appConfig';
import { message } from 'antd';
import { SparePartsMockService, shouldUseMockData } from '../services/mockService';

// Destructure for clarity and to avoid property access issues
const { BASE_URL } = API_CONFIG;

/**
 * 备件接口定义
 */
export interface SparePart {
  id: string;
  name: string;
  name_en: string;
  code: string;
  part_number: string;
  description: string;
  type: string;
  image_url: string;
  product_type: string;
  app_model: string[] | string;
  app_sn?: string;
  package_size?: string;
  package_size_imperial?: string;
  package_weight?: number;
  box_quantity?: number;
  spec?: string;
  specs?: {[key: string]: string};
  category: string;
  compatibility?: string[];
  prices: {
    currency: string;
    original_price: number;
    current_price: number;
    discount?: number;
    tiers?: {
      quantity: number;
      price: number;
    }[];
  };
  inventory: {
    eu: number;
    na: number;
    au: number;
    cn: number;
  } | { region: string; amount: number; }[];
}

/**
 * 备件筛选选项接口
 */
export interface FilterOptions {
  hostModels: string[];
  accessoryModels: string[];
  partTypes: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
}

/**
 * 备件订单接口
 */
export interface SparePartsOrder {
  id?: string;
  userId: string;
  items: {
    partId: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  status?: string;
  createdAt?: string;
}

/**
 * 分页查询参数接口
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  type?: string;
  product_type?: string;
  model?: string;
  category?: string;
  [key: string]: any;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 处理API错误
 */
const handleApiError = (error: any, defaultMessage: string): null => {
  // 检查是否有自定义错误消息
  const errorMessage = error.response?.data?.message || error.message || defaultMessage;
  
  // 记录错误
  console.error(`API Error: ${defaultMessage}`, error);
  
  // 显示错误消息
  message.error(errorMessage);
  
  // 对特定错误码进行处理
  const statusCode = error.response?.status;
  if (statusCode === 401 || statusCode === 403) {
    // 可以在这里处理授权错误，例如重定向到登录页
    // window.location.href = '/login';
  }
  
  return null;
};

/**
 * 备件API服务
 */
const api = {
  /**
   * 获取备件列表
   * @param params 查询参数
   */
  getAllSpareParts: async (params: QueryParams = {}): Promise<PaginatedResponse<SparePart> | null> => {
    try {
      // 使用Mock数据
      if (shouldUseMockData()) {
        const response = await SparePartsMockService.getAllSpareParts(params);
        return {
          data: response.data,
          meta: response.meta as any
        };
      }

      // 实际API调用
      const response = await axios.get(`${BASE_URL}/spare-parts`, { params });
      
      // 验证API响应格式
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid API response format');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, '获取备件列表失败，请稍后重试');
    }
  },

  /**
   * 获取备件筛选选项
   */
  getSparePartsFilterOptions: async (): Promise<FilterOptions | null> => {
    try {
      // 使用Mock数据
      if (shouldUseMockData()) {
        const response = await SparePartsMockService.getSparePartsFilterOptions();
        return response.data;
      }

      // 实际API调用
      const response = await axios.get(`${BASE_URL}/spare-parts/filter-options`);
      
      // 验证API响应格式
      if (!response.data || !response.data.data || typeof response.data.data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, '获取筛选选项失败，请稍后重试');
    }
  },

  /**
   * 获取单个备件详情
   * @param id 备件ID
   */
  getSparePartById: async (id: string): Promise<SparePart | null> => {
    try {
      // 使用Mock数据
      if (shouldUseMockData()) {
        const response = await SparePartsMockService.getSparePartById(id);
        return response.data;
      }

      // 实际API调用
      const response = await axios.get(`${BASE_URL}/spare-parts/${id}`);
      
      // 验证API响应格式
      if (!response.data || !response.data.data || typeof response.data.data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, `获取备件详情失败，请稍后重试`);
    }
  },

  /**
   * 提交备件订单
   * @param order 订单数据
   */
  submitSparePartsOrder: async (order: SparePartsOrder): Promise<{ success: boolean; orderId: string } | null> => {
    try {
      // 使用Mock数据
      if (shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          success: true,
          orderId: `SPO-${Date.now()}`
        };
      }

      // 实际API调用
      const response = await axios.post(`${BASE_URL}/spare-parts/orders`, order);
      
      // 验证API响应格式
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, '提交订单失败，请稍后重试');
    }
  }
};

export default api; 