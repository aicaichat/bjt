import axios from 'axios';
import { API_CONFIG } from '../config/appConfig';
import { message } from 'antd';
import { SparePartsMockService, shouldUseMockData } from '../services/mockService';
import { fixMojibake } from '../utils/string';
// Import canonical type
import { SparePart as CanonicalSparePart } from '../types/spareParts';

// Use a relative path for API calls so they go through Vite's proxy
const API_BASE_PATH = '/wp-json/bjt/v1';

/**
 * Use the canonical SparePart type by re-exporting or using it directly
 */
export type SparePart = CanonicalSparePart;

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
 * Process possible encoding issues with Chinese characters
 * Fixes mojibake like "æ°"åž«æœº" (should be "气垫机")
 */
const processChineseText = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => processChineseText(item));
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = processChineseText(data[key]);
      }
    }
    return result;
  }

  if (typeof data === 'string') {
    // Check if this looks like mojibake (garbled text from encoding issues)
    if (/[\u00e0-\u00ff]{2,}/.test(data)) {
      try {
        return fixMojibake(data);
      } catch (e) {
        console.warn('Failed to fix Chinese text:', data);
      }
    }
  }

  return data;
};

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

      // 记录API调用URL
      const apiUrl = `${API_BASE_PATH}/spare-parts`;
      console.log('Calling API:', apiUrl, 'with params:', params);

      // 实际API调用 - 使用相对路径
      const response = await axios.get(apiUrl, { params });
      
      // 记录响应
      console.log('API response:', response);
      
      // 验证API响应格式 - 更新以匹配实际API格式
      if (!response.data || !response.data.success) {
        console.error('API response missing success property:', response.data);
        throw new Error('Invalid API response format: missing success property');
      }
      
      if (!response.data.data || !response.data.data.items) {
        console.error('API response missing data.items property:', response.data);
        throw new Error('Invalid API response format: missing data.items property');
      }
      
      // 从嵌套的items中提取数据并处理可能的中文编码问题
      const items = processChineseText(response.data.data.items);
      
      if (!Array.isArray(items)) {
        console.error('API response data.items is not an array:', items);
        throw new Error('Invalid API response format: data.items is not an array');
      }
      
      // 转换为前端期望的格式
      return {
        data: items,
        meta: {
          total: response.data.data.total || items.length,
          page: response.data.data.page || 1,
          pageSize: response.data.data.per_page || 10,
          totalPages: response.data.data.total_pages || 1
        }
      };
    } catch (error: any) {
      console.error('Detailed API error:', error);
      console.error('API request failed. Status:', error.response?.status, 'Data:', error.response?.data);
      return handleApiError(error, '获取备件列表失败，请稍后重试');
    }
  },

  /**
   * 获取备件筛选选项
   */
  getSparePartsFilterOptions: async (): Promise<FilterOptions | null> => {
    try {
      console.log('Requesting spare parts filter options from API');
      const response = await axios.get(`${API_BASE_PATH}/spare-parts/filter-options`);
      console.log('Filter options response:', response.data);
      
      // Process the response data to fix any Chinese encoding issues
      return processChineseText(response.data);
    } catch (error) {
      console.error('Error fetching spare parts filter options:', error);
      console.log('Falling back to generating filter options from spare parts data');
      
      // Fallback: 从备件数据中提取过滤选项
      try {
        // 获取所有备件数据
        const allPartsResponse = await api.getAllSpareParts();
        if (!allPartsResponse) {
          console.warn('No response from getAllSpareParts, using default models');
          return {
            hostModels: ['LA-E4S', 'LA-E5P', 'TM-200', 'TM-300'],
            accessoryModels: ['FS-001', 'FS-002', 'FB-100'],
            partTypes: [
              { id: 'consumable', name: '耗材' },
              { id: 'non-consumable', name: '非耗材' }
            ]
          };
        }
        const parts = allPartsResponse.data || [];
        
        // 提取唯一的主机型号和配件型号
        const hostModels: string[] = [];
        const accessoryModels: string[] = [];
        
        // 从数据中提取所有唯一的型号
        parts.forEach(part => {
          if (!part.app_model) return;
          
          let models: string[] = [];
          
          // 处理不同类型的app_model
          if (Array.isArray(part.app_model)) {
            models = part.app_model;
          } else if (typeof part.app_model === 'string') {
            models = part.app_model.split(',').map(m => m.trim());
          }
          
          // 确定部件类型（机器或配件）
          let isMachine = false;
          
          // 1. 如果部件有明确的product_type属性，直接使用
          if (part.product_type) {
            isMachine = part.product_type === 'machine';
          }
          // 2. 如果没有product_type但有product_line_id，则根据product_line_id判断
          // 产品线ID 1-4对应机器设备，5-8对应配件
          else if (part.product_line_id) {
            isMachine = part.product_line_id <= 4;
          }
          // 3. 如果都没有，根据part_number的前两位字符判断
          else if (part.part_number) {
            const prefix = part.part_number.substring(0, 2);
            isMachine = prefix.startsWith('1');
          }
          
          // 根据产品类型添加到相应的数组
          models.forEach(model => {
            if (model) {
              if (isMachine) {
                if (!hostModels.includes(model)) {
                  hostModels.push(model);
                }
              } else {
                if (!accessoryModels.includes(model)) {
                  accessoryModels.push(model);
                }
              }
            }
          });
        });
        
        console.log('Generated filter options:', { 
          host_models: hostModels, 
          accessory_models: accessoryModels 
        });
        
        // 返回提取的过滤选项
        return {
          hostModels,
          accessoryModels,
          partTypes: [
            { id: 'consumable', name: '耗材' },
            { id: 'non-consumable', name: '非耗材' }
          ]
        };
      } catch (fallbackError) {
        console.error('Fallback extraction failed:', fallbackError);
        // 返回默认值以防止UI崩溃
        return {
          hostModels: ['LA-E4S', 'LA-E5P', 'TM-200', 'TM-300'],
          accessoryModels: ['FS-001', 'FS-002', 'FB-100'],
          partTypes: [
            { id: 'consumable', name: '耗材' },
            { id: 'non-consumable', name: '非耗材' }
          ]
        };
      }
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

      // 实际API调用 - 使用相对路径
      const response = await axios.get(`${API_BASE_PATH}/spare-parts/${id}`);
      
      // 验证API响应格式 - 更新以匹配实际API格式
      if (!response.data || !response.data.success) {
        console.error('API response missing success property:', response.data);
        throw new Error('Invalid API response format: missing success property');
      }
      
      if (!response.data.data) {
        console.error('API response missing data property:', response.data);
        throw new Error('Invalid API response format: missing data property');
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