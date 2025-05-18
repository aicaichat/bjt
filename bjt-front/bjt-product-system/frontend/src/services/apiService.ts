import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/appConfig';
import notificationService from './notificationService';

// API响应标准格式
export interface ApiResponse<T = any> {
  data: T;
  meta: {
    status: string;
    message?: string;
    code?: number | string;
    timestamp?: string;
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

// API错误类型
export enum ApiErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

// API错误接口
export interface ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>; // 表单错误
  details?: string;
  timestamp?: string;
  traceId?: string;
}

/**
 * 创建API错误
 * @param error 原始错误
 * @returns 标准化的API错误
 */
export const createApiError = (error: any): ApiError => {
  const apiError: ApiError = new Error(
    error.response?.data?.message || error.message || 'Unknown error'
  ) as ApiError;

  apiError.name = 'ApiError';
  apiError.type = ApiErrorType.UNKNOWN;
  apiError.details = error.response?.data?.details;
  apiError.timestamp = error.response?.data?.timestamp || new Date().toISOString();
  apiError.traceId = error.response?.data?.traceId;
  apiError.errors = error.response?.data?.errors;

  // 根据HTTP状态码或特定错误代码确定错误类型
  if (error.response) {
    // 服务器返回了错误响应
    apiError.status = error.response.status;

    switch (error.response.status) {
      case 400:
        apiError.type = ApiErrorType.VALIDATION;
        break;
      case 401:
        apiError.type = ApiErrorType.AUTHENTICATION;
        break;
      case 403:
        apiError.type = ApiErrorType.AUTHORIZATION;
        break;
      case 404:
        apiError.type = ApiErrorType.NOT_FOUND;
        break;
      case 408:
        apiError.type = ApiErrorType.TIMEOUT;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        apiError.type = ApiErrorType.SERVER;
        break;
      default:
        apiError.type = ApiErrorType.UNKNOWN;
    }
  } else if (error.request) {
    // 发送了请求，但没有收到响应
    apiError.type = ApiErrorType.NETWORK;
    apiError.message = 'Network error: Could not connect to server';
  } else if (error.code === 'ECONNABORTED') {
    // 请求超时
    apiError.type = ApiErrorType.TIMEOUT;
    apiError.message = 'Request timeout';
  } else {
    // 在设置请求时出错
    apiError.type = ApiErrorType.UNKNOWN;
  }

  return apiError;
};

/**
 * API服务
 */
class ApiService {
  private axios: AxiosInstance;
  private defaultConfig: AxiosRequestConfig;
  private authErrorHandled: boolean = false;

  constructor() {
    // Destructure for clarity and to avoid property access issues
    const { BASE_URL, TIMEOUT } = API_CONFIG;
    
    this.defaultConfig = {
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    this.axios = axios.create(this.defaultConfig);

    // 请求拦截器
    this.axios.interceptors.request.use(
      (config) => {
        // 从localStorage获取token并添加到请求头
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => {
        // 标准化响应格式
        const formattedResponse = this.formatResponse(response);
        return formattedResponse as any;
      },
      (error: AxiosError) => {
        const apiError = createApiError(error);
        
        // 处理特定错误类型
        if (apiError.type === ApiErrorType.AUTHENTICATION && !this.authErrorHandled) {
          this.authErrorHandled = true;
          
          // 显示通知
          notificationService.error('Session expired', 'Please login again to continue');
          
          // 清除本地存储并重定向到登录页面
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // 如果不是登录页面，则跳转到登录页面
          if (window.location.pathname !== '/login') {
            // 添加延迟以确保通知显示
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
          
          // 重置标志（延迟）
          setTimeout(() => {
            this.authErrorHandled = false;
          }, 5000);
        }
        
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * 标准化响应格式
   * @param response Axios响应
   * @returns 标准化的API响应
   */
  private formatResponse(response: AxiosResponse): ApiResponse {
    if (response.data && typeof response.data === 'object') {
      // 检查是否已经符合标准格式
      if (response.data.data !== undefined && response.data.meta !== undefined) {
        return response.data as ApiResponse;
      }
      
      // 检查WordPress REST API格式
      if (response.data.code && response.data.message) {
        // 处理WordPress错误响应
        if (response.data.code === 'rest_forbidden') {
          throw new Error('Authentication required');
        }
        
        return {
          data: response.data,
          meta: {
            status: 'error',
            message: response.data.message,
            code: response.data.code,
            timestamp: new Date().toISOString(),
          }
        };
      }
      
      // 转换为标准格式
      return {
        data: response.data.data || response.data,
        meta: {
          status: 'success',
          timestamp: new Date().toISOString(),
          ...(response.data.meta || {}),
        },
      };
    }
    
    // 非对象响应直接封装
    return {
      data: response.data,
      meta: {
        status: 'success',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 发送GET请求
   * @param url API端点
   * @param params 查询参数
   * @param config 请求配置
   * @returns 标准化的API响应
   */
  async get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axios.get<T>(url, { ...config, params });
      return response as unknown as ApiResponse<T>;
    } catch (error) {
      this.handleError(error as ApiError);
      throw error;
    }
  }

  /**
   * 发送POST请求
   * @param url API端点
   * @param data 请求数据
   * @param config 请求配置
   * @returns 标准化的API响应
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axios.post<T>(url, data, config);
      return response as unknown as ApiResponse<T>;
    } catch (error) {
      this.handleError(error as ApiError);
      throw error;
    }
  }

  /**
   * 发送PUT请求
   * @param url API端点
   * @param data 请求数据
   * @param config 请求配置
   * @returns 标准化的API响应
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axios.put<T>(url, data, config);
      return response as unknown as ApiResponse<T>;
    } catch (error) {
      this.handleError(error as ApiError);
      throw error;
    }
  }

  /**
   * 发送DELETE请求
   * @param url API端点
   * @param config 请求配置
   * @returns 标准化的API响应
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axios.delete<T>(url, config);
      return response as unknown as ApiResponse<T>;
    } catch (error) {
      this.handleError(error as ApiError);
      throw error;
    }
  }

  /**
   * 发送PATCH请求
   * @param url API端点
   * @param data 请求数据
   * @param config 请求配置
   * @returns 标准化的API响应
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axios.patch<T>(url, data, config);
      return response as unknown as ApiResponse<T>;
    } catch (error) {
      this.handleError(error as ApiError);
      throw error;
    }
  }

  /**
   * 处理API错误
   * @param error API错误
   */
  private handleError(error: ApiError): void {
    // 根据错误类型显示不同的通知
    switch (error.type) {
      case ApiErrorType.NETWORK:
        notificationService.error('网络错误', '无法连接到服务器，请检查您的网络连接');
        break;
      case ApiErrorType.SERVER:
        notificationService.error('服务器错误', '服务器出现问题，请稍后再试');
        break;
      case ApiErrorType.TIMEOUT:
        notificationService.error('请求超时', '服务器响应时间过长，请稍后再试');
        break;
      case ApiErrorType.VALIDATION:
        notificationService.warning('验证错误', error.message || '请检查您提交的数据');
        break;
      case ApiErrorType.NOT_FOUND:
        notificationService.warning('资源不存在', '您请求的资源不存在');
        break;
      // 认证和授权错误在拦截器中处理
    }
  }

  /**
   * 检查用户是否已登录
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }

  /**
   * 登录并保存令牌
   */
  async login(username: string, password: string): Promise<any> {
    try {
      const response = await this.post('/auth/login', { username, password });
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  }

  /**
   * 注销
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

// 导出单例实例
export default new ApiService(); 