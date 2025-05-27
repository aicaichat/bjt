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
  // Authentication routes
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  CURRENT_ADMIN: '/user/me',
  
  // Product management
  PRODUCT_LINES: '/product-lines',
  HOST_MODELS: '/machines',
  
  // Parts management - 根据后端实际端点调整
  PARTS: '/machineparts',
  HOST_MODEL_PARTS: '/machineparts',
  PART: '/machineparts/:id',
  
  // Other resources
  RELATIONS: '/relations',
  ACCESSORY_MODELS: '/accessory-models',
  ACCESSORIES: '/accessories',
  CONSUMABLES: '/consumables',
  SHAPES: '/shapes',
  MATERIALS: '/materials',
  USERS: '/users',
  SETTINGS: '/settings'
};

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