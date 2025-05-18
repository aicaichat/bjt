import { API_BASE_URL, getDefaultHeaders, REQUEST_TIMEOUT, ERROR_MESSAGES, getErrorMessage, DEBUG, logDebug } from '../../api/config';

// Admin-specific auth headers
export const getAdminAuthHeaders = () => {
  const adminToken = localStorage.getItem('admin_token');
  
  if (adminToken) {
    return {
      ...getDefaultHeaders(),
      'Authorization': `Bearer ${adminToken}`
    };
  }
  
  return getDefaultHeaders();
};

// Admin-specific API URLs
export const ADMIN_API_ENDPOINTS = {
  // 认证相关
  LOGIN: '/admin/auth/login',
  LOGOUT: '/admin/auth/logout',
  CURRENT_ADMIN: '/admin/auth/me',
  
  // 产品线管理
  PRODUCT_LINES: '/product-lines',
  
  // 主机型号管理
  HOST_MODELS: '/host-models',
  
  // 零件管理
  PARTS: '/parts',
  
  // 关系管理
  RELATIONS: '/relations',
  
  // 配件型号管理
  ACCESSORY_MODELS: '/accessory-models',
  
  // 配件管理
  ACCESSORIES: '/accessories',
  
  // 耗材管理
  CONSUMABLES: '/consumables',
  
  // 形状管理
  SHAPES: '/shapes',
  
  // 材料管理
  MATERIALS: '/materials',
  
  // 规格管理
  SPECIFICATIONS: '/specifications',
  
  // 用户管理
  USERS: '/users',
  
  // 角色管理
  ROLES: '/roles',
  
  // 权限管理
  PERMISSIONS: '/permissions',
  
  // 媒体管理
  MEDIA: '/media',
} as const;

export default {
  API_BASE_URL,
  getDefaultHeaders,
  getAdminAuthHeaders,
  REQUEST_TIMEOUT,
  ERROR_MESSAGES,
  getErrorMessage,
  DEBUG,
  logDebug,
  ADMIN_API_ENDPOINTS
}; 