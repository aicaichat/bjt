import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  API_BASE_URL, 
  getAuthHeaders, 
  REQUEST_TIMEOUT, 
  getErrorMessage 
} from './config';

// 创建Axios实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: getAuthHeaders()
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 请求前刷新认证头，确保使用最新的令牌
    const authHeaders = getAuthHeaders(); // Get auth headers
    for (const key in authHeaders) { // Iterate and assign
      if (authHeaders.hasOwnProperty(key)) {
        config.headers[key] = authHeaders[key as keyof typeof authHeaders];
      }
    }
    // Ensure Content-Type is set if not already, or override if needed
    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    console.error('[DEBUG] Axios Interceptor Raw Error:', JSON.stringify(error, null, 2));
    // 处理响应错误
    if (error.response) {
      // 服务器响应了，但是状态码不在2xx范围
      const status = error.response.status;
      console.error(`[DEBUG] Axios Interceptor: Error with response. Status: ${status}`, error.response.data);
      
      // 如果返回401未授权，可以在这里处理登出逻辑
      if (status === 401) {
        // 清除本地存储的令牌
        localStorage.removeItem('auth_token');
        // 如果需要，可以在这里重定向到登录页面
        // window.location.href = '/login';
      }
      
      // 获取错误消息
      const errorMessage = getErrorMessage(status);
      
      // 构造自定义错误对象
      return Promise.reject({
        message: errorMessage,
        status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('[DEBUG] Axios Interceptor: No response received. error.request:', error.request);
      return Promise.reject({
        message: 'No response received from server.',
        status: 0
      });
    } else {
      // 在设置请求时发生了错误
      console.error('[DEBUG] Axios Interceptor: Error setting up request. error.message:', error.message);
      return Promise.reject({
        message: error.message,
        status: 0
      });
    }
  }
);

// HTTP服务类
class HttpService {
  // GET请求
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // POST请求
  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PUT请求
  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE请求
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PATCH请求
  static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default HttpService; 