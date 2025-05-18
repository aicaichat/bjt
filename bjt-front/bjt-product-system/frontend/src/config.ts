// API配置
export const API_CONFIG = {
  // API基础URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/wp-json/bjt/v1',
  
  // 是否使用Mock数据
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  
  // 是否开启调试模式
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  
  // 图片基础URL
  IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_BASE_URL || '',
  
  // 基础URL
  BASE_URL: import.meta.env.VITE_BASE_URL || '',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 重试次数
  RETRY_COUNT: 3,
  
  // 重试延迟（毫秒）
  RETRY_DELAY: 1000,
  
  // 分页默认值
  DEFAULT_PAGE_SIZE: 10,
  
  // 最大页面大小
  MAX_PAGE_SIZE: 100,
  
  // 缓存时间（毫秒）
  CACHE_TIME: 5 * 60 * 1000, // 5分钟
  
  // 是否启用请求缓存
  ENABLE_CACHE: true,
  
  // 是否启用请求日志
  ENABLE_LOGGING: true
}; 