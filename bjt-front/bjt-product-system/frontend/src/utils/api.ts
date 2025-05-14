import axios from 'axios';
import { message } from 'antd';

// 使用相对路径，确保请求通过Nginx代理
const baseURL = '/wp-json/bjt/v1';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    if (response?.data?.message) {
      message.error(response.data.message);
    } else {
      message.error('Network error, please try again later');
    }
    return Promise.reject(error);
  }
);

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface ProductLine {
  id: number;
  code: string;
  name_cn: string;
  name_en: string;
  description_cn: string;
  description_en: string;
  image_url: string | null;
  status: 'publish' | 'draft' | 'trash';
  menu_order: number;
  created_at: string;
  updated_at: string;
  products_count: number;
}

export interface ProductLineListResponse {
  items: ProductLine[];
  total: number;
  page: number;
  page_size: number;
}

const productLineAPI = {
  // 获取产品线列表
  getList: (params: PaginationParams & {
    status?: string;
    search?: string;
    lang?: string;
  }) => {
    return api.get<any, APIResponse<ProductLineListResponse>>('/product-lines', { params });
  },

  // 获取产品线详情
  getDetail: (id: number, lang?: string) => {
    return api.get<any, APIResponse<ProductLine>>(`/product-lines/${id}`, {
      params: { lang },
    });
  },

  // 创建产品线
  create: (data: Partial<ProductLine>) => {
    return api.post<any, APIResponse<ProductLine>>('/product-lines', data);
  },

  // 更新产品线
  update: (id: number, data: Partial<ProductLine>) => {
    return api.put<any, APIResponse<ProductLine>>(`/product-lines/${id}`, data);
  },

  // 删除产品线
  delete: (id: number, force?: boolean) => {
    return api.delete<any, APIResponse<void>>(`/product-lines/${id}`, {
      params: { force },
    });
  },

  // 批量操作
  batch: (ids: number[], action: 'delete' | 'trash' | 'restore' | 'publish' | 'draft') => {
    return api.post<any, APIResponse<{ updated: number; action: string }>>('/product-lines/batch', {
      ids,
      action,
    });
  },
};

export default {
  productLine: productLineAPI,
}; 