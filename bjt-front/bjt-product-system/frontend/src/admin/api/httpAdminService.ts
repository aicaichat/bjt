import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import adminConfig from './adminConfig';

const {
  API_BASE_URL,
  getAdminAuthHeaders,
  REQUEST_TIMEOUT,
  getErrorMessage,
  DEBUG,
  logDebug
} = adminConfig;

// 标准API响应接口
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string | number;
}

// Create Axios instance
const axiosAdminInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: getAdminAuthHeaders()
});

// Request interceptor
axiosAdminInstance.interceptors.request.use(
  (config) => {
    const authHeaders = getAdminAuthHeaders();
    for (const key in authHeaders) {
      if (authHeaders.hasOwnProperty(key)) {
        config.headers[key] = authHeaders[key as keyof typeof authHeaders];
      }
    }
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosAdminInstance.interceptors.response.use(
  (response) => {
    // Check if response has the expected format
    if (response.data && typeof response.data === 'object') {
      // If response doesn't have success property, wrap it in a standard format
      if (typeof response.data.success === 'undefined') {
        response.data = {
          success: true,
          data: response.data
        };
      }
    }
    return response;
  },
  (error: AxiosError) => {
    if (DEBUG) {
      logDebug('Admin API Error:', error);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    
    const errorResponse = error.response?.data as ApiResponse<any> | undefined;
    
    // If the error response has the expected format, use it
    if (errorResponse && typeof errorResponse.success === 'boolean') {
      return Promise.reject(errorResponse);
    }
    
    // Otherwise, create a standardized error response
    return Promise.reject({
      success: false,
      message: getErrorMessage(error.response?.status || 0),
      code: error.response?.status || 'UNKNOWN_ERROR',
      data: error.response?.data
    });
  }
);

// HTTP service class
class HttpAdminService {
  // GET request
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosAdminInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // POST request
  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosAdminInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PUT request
  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosAdminInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE request
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosAdminInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PATCH request
  static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosAdminInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default HttpAdminService; 