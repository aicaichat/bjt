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
    
    return Promise.reject({
      message: getErrorMessage(error.response?.status || 0),
      status: error.response?.status || 0,
      data: error.response?.data
    });
  }
);

// HTTP service class
class HttpAdminService {
  // GET request
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosAdminInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // POST request
  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosAdminInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PUT request
  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosAdminInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE request
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosAdminInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PATCH request
  static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axiosAdminInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default HttpAdminService; 