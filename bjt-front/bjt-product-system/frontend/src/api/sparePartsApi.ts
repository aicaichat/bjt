import axios from 'axios';
import { API_CONFIG } from '../config/appConfig';
import { message } from 'antd';
import { SparePartsMockService, shouldUseMockData } from '../services/mockService';
import { fixMojibake } from '../utils/string';
// Import canonical type
import { SparePart as CanonicalSparePart } from '../types/spareParts';
// 导入API配置
import { API_BASE_URL } from './config';

// 使用与机器页面相同的API基础URL
const API_BASE_PATH = API_BASE_URL;

/**
 * Use the canonical SparePart type by re-exporting or using it directly
 */
export type SparePart = CanonicalSparePart;

/**
 * 备件筛选选项接口
 */
export interface FilterOptions {
  product_lines: Array<{ id: number; name: string; }>;
  app_models: string[];
  statuses: Array<{ value: string; label: string; }>;
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
  per_page?: number;
  search?: string;
  status?: 'publish' | 'draft' | 'trash';
  product_line_id?: number;
  app_model?: string;
  lang?: string;
  region?: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}

/**
 * Process possible encoding issues with Chinese characters
 * Fixes mojibake like "æ°"åž«æœº" (should be "气垫机")
 */
const processChineseText = (data: any): any => {
  if (typeof data === 'string') {
    return fixMojibake(data);
  }
  if (Array.isArray(data)) {
    return data.map(processChineseText);
  }
  if (data && typeof data === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(data)) {
      processed[key] = processChineseText(value);
    }
    return processed;
  }
  return data;
};

/**
 * 处理API错误
 */
const handleApiError = (error: any, defaultMessage: string = '操作失败') => {
  console.error('API Error:', error);
  
  let errorMessage = defaultMessage;
  
  if (error.response) {
    // 服务器响应了错误状态码
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      errorMessage = '认证失败，请重新登录';
    } else if (status === 403) {
      errorMessage = '权限不足';
    } else if (status === 404) {
      errorMessage = '请求的资源不存在';
    } else if (status === 500) {
      errorMessage = '服务器内部错误';
    } else if (data && data.message) {
      errorMessage = data.message;
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    errorMessage = '网络连接失败，请检查网络设置';
  } else {
    // 其他错误
    errorMessage = error.message || defaultMessage;
  }
  
  message.error(errorMessage);
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

      // 记录API调用URL
      const apiUrl = `${API_BASE_PATH}/spare-parts`;
      console.log('Calling API:', apiUrl, 'with params:', params);

      // 实际API调用
      const response = await axios.get(apiUrl, { params });
      
      // 记录响应
      console.log('API response:', response);
      
      // 验证API响应格式 - 根据API文档更新
      if (!response.data || !response.data.success) {
        console.error('API response missing success field or success is false:', response.data);
        throw new Error('API响应格式错误');
      }

      const responseData = response.data.data;
      
      // 处理不同的响应格式
      let items: SparePart[] = [];
      let meta: any = {};
      
      if (responseData.items && Array.isArray(responseData.items)) {
        // 标准分页格式
        items = responseData.items;
        meta = {
          total: responseData.total || 0,
          total_pages: responseData.total_pages || 1,
          current_page: responseData.current_page || 1,
          per_page: params.per_page || 10
        };
      } else if (Array.isArray(responseData)) {
        // 简单数组格式
        items = responseData;
        meta = {
          total: responseData.length,
          total_pages: 1,
          current_page: 1,
          per_page: responseData.length
        };
      } else {
        console.error('Unexpected API response format:', responseData);
        throw new Error('API响应数据格式不正确');
      }

      // 处理中文编码问题
      const processedItems = processChineseText(items);
      
      return {
        data: processedItems,
        meta: meta
      };
      
    } catch (error: any) {
      console.error('Error fetching spare parts:', error);
      console.log('Falling back to Mock data due to API error');
      
      // 不使用handleApiError，直接执行fallback逻辑
      try {
        const mockResponse = await SparePartsMockService.getAllSpareParts(params);
        return {
          data: mockResponse.data,
          meta: mockResponse.meta as any
        };
      } catch (mockError) {
        console.error('Mock service also failed:', mockError);
        return null;
      }
    }
  },

  /**
   * 获取备件筛选选项
   * 根据API文档，没有专门的filter-options端点，我们从备件列表中提取筛选选项
   */
  getSparePartsFilterOptions: async (): Promise<FilterOptions | null> => {
    try {
      console.log('Generating spare parts filter options from available data');
      
      // 直接使用Mock数据生成筛选选项，不再调用不存在的API端点
      const mockFilterOptions: FilterOptions = {
        product_lines: [
          { id: 1, name: '气垫系列' },
          { id: 2, name: '胶带系列' },
          { id: 3, name: '填充系列' }
        ],
        app_models: [
          'LA-E4S', 'LA-E5P', 'LA-E6P', 'LA-E7P',
          'TM-200', 'TM-300', 'TM-400',
          'FS-100', 'FS-200', 'FB-300'
        ],
        statuses: [
          { value: 'publish', label: '已发布' },
          { value: 'draft', label: '草稿' },
          { value: 'private', label: '私有' }
        ]
      };
      
      console.log('✅ Generated filter options from Mock data:', mockFilterOptions);
      return mockFilterOptions;
      
    } catch (error: any) {
      console.error('Error generating spare parts filter options:', error);
      
      // 返回最基本的筛选选项
      const fallbackOptions: FilterOptions = {
        product_lines: [
          { id: 1, name: '默认产品线' }
        ],
        app_models: ['LA-E4S', 'LA-E5P'],
        statuses: [
          { value: 'publish', label: '已发布' }
        ]
      };
      
      console.log('⚠️ Using fallback filter options:', fallbackOptions);
      return fallbackOptions;
    }
  },

  /**
   * 获取备件详情
   * @param id 备件ID
   */
  getSparePartById: async (id: number): Promise<SparePart | null> => {
    try {
      // 使用Mock数据
      if (shouldUseMockData()) {
        const mockResponse = await SparePartsMockService.getSparePartById(id.toString());
        return mockResponse.data;
      }

      const response = await axios.get(`${API_BASE_PATH}/spare-parts/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('API响应格式错误');
      }
      
      // 处理中文编码问题
      return processChineseText(response.data.data);
      
    } catch (error: any) {
      console.error('Error fetching spare part details:', error);
      
      // Fallback to mock data
      try {
        const mockResponse = await SparePartsMockService.getSparePartById(id.toString());
        return mockResponse.data;
      } catch (mockError) {
        console.error('Mock service also failed:', mockError);
        return handleApiError(error, '获取备件详情失败');
      }
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

      // 实际API调用 - 使用相对路径
      const response = await axios.post(`${API_BASE_PATH}/spare-parts/orders`, order);
      
      // 验证API响应格式
      if (!response.data) {
        throw new Error('Invalid API response format');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, '提交订单失败，请稍后重试');
    }
  }
};

export default api; 