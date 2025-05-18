// API配置
const isDevelopment = import.meta.env.DEV;

// 基础URL
// Ensure VITE_API_BASE_URL is set to the full base path in your .env files or docker-compose environment, 
// e.g., http://localhost:8080/wp-json/bjt/v1/
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost';

// 确保 API 基础 URL 不以斜杠结尾
export const getBaseUrl = () => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return baseUrl;
};

// 调试模式
export const DEBUG = (import.meta.env.VITE_DEBUG === 'true') || false;

// 通用请求头
export const getDefaultHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

// 添加认证令牌（如果有）
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    return {
      ...getDefaultHeaders(),
      'Authorization': `Bearer ${token}`
    };
  }
  
  return getDefaultHeaders();
};

// 超时设置（毫秒）
export const REQUEST_TIMEOUT = 30000; // 30秒

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接错误，请检查您的网络连接。',
  SERVER_ERROR: '服务器错误，请稍后重试。',
  TIMEOUT_ERROR: '请求超时，请稍后重试。',
  UNAUTHORIZED: '您的登录已过期，请重新登录。',
  FORBIDDEN: '您没有权限执行此操作。',
  NOT_FOUND: '请求的资源不存在。',
  VALIDATION_ERROR: '提交的数据有误，请检查并重试。',
  DEFAULT: '发生错误，请稍后重试。'
};

// 根据HTTP状态码获取错误消息
export const getErrorMessage = (status: number): string => {
  switch (status) {
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 422:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.DEFAULT;
  }
};

// 用于开发模式的日志函数
export const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

export default {
  API_BASE_URL,
  getDefaultHeaders,
  getAuthHeaders,
  REQUEST_TIMEOUT,
  ERROR_MESSAGES,
  getErrorMessage,
  DEBUG,
  logDebug
}; 