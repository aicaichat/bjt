import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthHeaders, API_BASE_URL, REQUEST_TIMEOUT, getErrorMessage, logDebug } from '../api/config';
import notificationService from './notificationService';
import { decodeUtf8Unicode } from '../utils/string';
import { authService } from './auth';

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
 * 递归解码API返回的中文Unicode转义序列
 * @param data 需要解码的数据
 * @returns 解码后的数据
 */
export function decodeChineseFromApi(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // 处理字符串
  if (typeof data === 'string') {
    // 1. 处理\uXXXX格式的Unicode转义序列
    if (data.includes('\\u')) {
      try {
        // 使用JSON.parse解码Unicode转义序列
        return JSON.parse(`"${data.replace(/"/g, '\\"')}"`);
      } catch {
        // 如果解析失败，尝试正则替换
        return data.replace(/\\u([0-9a-fA-F]{4})/g, (_, codePoint) => 
          String.fromCodePoint(parseInt(codePoint, 16))
        );
      }
    }
    // 2. 对于已经被部分解码但显示为乱码的情况，可能无法完全修复
    return data;
  }

  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => decodeChineseFromApi(item));
  }

  // 处理对象
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = decodeChineseFromApi(data[key]);
      }
    }
    return result;
  }

  return data;
}

/**
 * API服务
 */
class ApiService {
  private axios: AxiosInstance;
  private authErrorHandled: boolean = false;

  constructor() {
    // 创建axios实例，设置基础配置
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: getAuthHeaders()
    });

    // 请求拦截器
    this.axios.interceptors.request.use(
      (config) => {
        // 从localStorage获取token并添加到请求头
        const token = localStorage.getItem('auth_token');
        if (!config.headers) {
          config.headers = {} as any;
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`[ApiService] Adding auth header for ${config.method?.toUpperCase()} ${config.url}`);
          console.log(`[ApiService] Token (first 15 chars): ${token.substring(0, 15)}...`);
        } else {
          console.warn(`[ApiService] No auth_token found for ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        // 🔧 修复：为所有API请求添加防CDN缓存头，特别是购物车相关的动态请求
        const timestamp = Date.now();
        const browserInfo = navigator.userAgent.slice(0, 20);
        
        // 购物车相关API或所有POST/PUT/DELETE请求需要绕过CDN缓存
        const isCartAPI = config.url?.includes('/cart') || false;
        const isDynamicRequest = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '');
        
        if (isCartAPI || isDynamicRequest) {
          // 添加防缓存HTTP头
          config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          config.headers['Pragma'] = 'no-cache';  // HTTP/1.0 兼容
          config.headers['Expires'] = '0';
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          config.headers['X-Cache-Buster'] = `${timestamp}_${browserInfo.slice(0, 10)}`;
          
          console.log(`[ApiService] Applied anti-cache headers for ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        // 为GET请求添加时间戳参数防止CDN缓存（特别是购物车状态查询）
        if (config.method?.toLowerCase() === 'get' && isCartAPI) {
          const separator = config.url?.includes('?') ? '&' : '?';
          config.url += `${separator}_t=${timestamp}&_cb=${encodeURIComponent(browserInfo.slice(0, 10))}`;
          console.log(`[ApiService] Added cache-busting params to GET ${config.url}`);
        }
        
        // 为spare-parts API添加更详细的日志
        if (config.url?.includes('spare-parts')) {
          console.log(`[ApiService] Making spare parts request: ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`, 
            config.params ? `params: ${JSON.stringify(config.params)}` : '');
          
          // 额外检查Authorization头
          if (config.headers?.Authorization) {
            const authHeader = String(config.headers.Authorization);
            console.log(`[ApiService] Spare parts request using Authorization: ${authHeader.substring(0, 15)}...`);
          } else {
            console.warn(`[ApiService] Spare parts request missing Authorization header!`);
          }
        } else {
          console.log(`[ApiService] Making request: ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`, 
            config.params ? `params: ${JSON.stringify(config.params)}` : '');
        }
        
        return config;
      },
      (error) => {
        console.error(`[ApiService] Request interceptor error:`, error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[ApiService] Response received for ${response.config.method?.toUpperCase()} ${response.config.url}:`, 
          response.status, response.statusText);
        
        // 为spare-parts API添加更详细的日志
        if (response.config.url?.includes('spare-parts')) {
          console.log(`[ApiService] Spare parts response success:`, response.status);
          console.log(`[ApiService] Spare parts response data structure:`, 
            Object.keys(response.data).length ? Object.keys(response.data) : 'Empty response');
        }
        
        // 处理中文编码问题
        if (response.data) {
          response.data = decodeChineseFromApi(response.data);
        }
        
        // 标准化响应格式
        const formattedResponse = this.formatResponse(response);
        return formattedResponse as any;
      },
      async (error: AxiosError) => {
        console.error(`[ApiService] Response error:`, error.message);
        console.error(`[ApiService] Response status:`, error.response?.status, error.response?.statusText);
        
        // 为spare-parts API错误添加更详细的日志
        if (error.config?.url?.includes('spare-parts')) {
          console.error(`[ApiService] Spare parts API error:`, error.message);
          console.error(`[ApiService] Spare parts error response:`, error.response?.data);
          console.error(`[ApiService] Request details:`, {
            url: error.config.url,
            method: error.config.method,
            headers: error.config.headers,
            params: error.config.params,
            data: error.config.data
          });
        }
        
        const apiError = createApiError(error);
        
        // 处理认证错误
        if (apiError.type === ApiErrorType.AUTHENTICATION && !this.authErrorHandled) {
          console.warn(`[ApiService] Authentication error detected, attempting token refresh...`);
          this.authErrorHandled = true;
          
          try {
            // 尝试刷新token
            const refreshSuccess = await authService.refreshToken();
            
            if (refreshSuccess) {
              console.log(`[ApiService] Token refreshed successfully, retrying original request...`);
              // 重试原始请求
              const originalRequest = error.config;
              if (originalRequest) {
                // 更新请求头中的token
                const authHeader = authService.getAuthHeader();
                if ('Authorization' in authHeader) {
                  originalRequest.headers.set('Authorization', authHeader.Authorization as string);
                }
                return this.axios(originalRequest);
              }
            } else {
              console.warn(`[ApiService] Token refresh failed, handling session expiration...`);
              // 显示通知
              notificationService.error('Session expired', 'Please login again to continue');
              
              // 清除本地存储并重定向到登录页面
              authService.logout();
              
              // 如果不是登录页面，则跳转到登录页面
              if (window.location.pathname !== '/login') {
                // 添加延迟以确保通知显示
                console.log(`[ApiService] Redirecting to login page in 2 seconds...`);
                setTimeout(() => {
                  window.location.href = '/login';
                }, 2000);
              }
            }
          } catch (refreshError) {
            console.error(`[ApiService] Error during token refresh:`, refreshError);
            // 如果刷新失败，执行登出操作
            authService.logout();
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
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
    // First check if the response content type indicates JSON with UTF-8 encoding
    const contentType = response.headers?.['content-type'] || '';
    const isUtf8Json = contentType.includes('application/json') && contentType.includes('charset=utf-8');
    
    console.log(`[ApiService] Response content type: ${contentType}, isUtf8Json: ${isUtf8Json}`);
    
    // Process the entire response data to fix encoding issues
    const processedData = decodeChineseFromApi(response.data);
    
    if (processedData && typeof processedData === 'object') {
      // 检查是否已经符合标准格式
      if (processedData.data !== undefined && processedData.meta !== undefined) {
        return processedData as ApiResponse;
      }
      
      // 检查WordPress REST API格式
      if (processedData.code && processedData.message) {
        // 处理WordPress错误响应
        if (processedData.code === 'rest_forbidden') {
          throw new Error('Authentication required');
        }
        
        return {
          data: processedData,
          meta: {
            status: 'error',
            message: processedData.message,
            code: processedData.code,
            timestamp: new Date().toISOString(),
          }
        };
      }
      
      // 转换为标准格式
      return {
        data: processedData.data || processedData,
        meta: {
          status: 'success',
          timestamp: new Date().toISOString(),
          ...(processedData.meta || {}),
        },
      };
    }
    
    // 非对象响应直接封装
    return {
      data: processedData,
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
    return !!localStorage.getItem('auth_token');
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
        localStorage.setItem('auth_token', response.data.token);
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

// 导出单例实例
export default new ApiService(); 