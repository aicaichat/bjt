// API配置
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// 检查是否强制使用代理
const useProxy = import.meta.env.VITE_USE_PROXY === 'true';

// 基础URL配置
// 优先级：环境变量 > 环境检测 > 默认值
export const API_BASE_URL = (() => {
  // 1. 如果设置了VITE_API_URL环境变量，直接使用
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. 生产环境：使用相对路径（由Nginx代理）
  if (isProduction) {
    return '/wp-json/bjt/v1';
  }
  
  // 3. 开发环境且启用代理时使用相对路径
  if (isDevelopment && useProxy) {
    return '/wp-json/bjt/v1';
  }
  
  // 4. 默认：直接访问后端服务器
  return 'http://localhost:8080/wp-json/bjt/v1';
})();

console.log('🔧 API配置信息:', {
  isDevelopment,
  useProxy,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_USE_PROXY: import.meta.env.VITE_USE_PROXY,
  finalApiBaseUrl: API_BASE_URL
});

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

// 获取认证头
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
export const REQUEST_TIMEOUT = 30000;

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

// 调试日志
export const logDebug = (...args: any[]) => {
  if (DEBUG) {
    console.log('[API Debug]', ...args);
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