import axios, { AxiosInstance } from 'axios';

// 创建 axios 实例
export const HttpServiceInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
HttpServiceInstance.interceptors.request.use(
  (config) => {
    // 在这里可以添加认证信息等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
HttpServiceInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 在这里可以统一处理错误
    return Promise.reject(error);
  }
); 