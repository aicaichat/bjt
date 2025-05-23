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
  LOGIN: '/wp-json/bjt/v1/auth/login',
  LOGOUT: '/wp-json/bjt/v1/auth/logout',
  CURRENT_ADMIN: '/wp-json/bjt/v1/user/me',
  
  // Product management
  PRODUCT_LINES: '/wp-json/bjt/v1/product-lines',
  HOST_MODELS: '/wp-json/bjt/v1/machines',
  
  // Parts management
  PARTS: '/wp-json/bjt/v1/spare-parts',
  HOST_MODEL_PARTS: '/wp-json/bjt/v1/machines/:id/spare-parts',
  PART: '/wp-json/bjt/v1/machines/:modelId/spare-parts/:id',
  
  // Other resources
  RELATIONS: '/wp-json/bjt/v1/relations',
  ACCESSORY_MODELS: '/wp-json/bjt/v1/accessory-models',
  ACCESSORIES: '/wp-json/bjt/v1/accessories',
  CONSUMABLES: '/wp-json/bjt/v1/consumables',
  SHAPES: '/wp-json/bjt/v1/shapes',
  MATERIALS: '/wp-json/bjt/v1/materials',
  USERS: '/wp-json/bjt/v1/users',
  SETTINGS: '/wp-json/bjt/v1/settings'
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