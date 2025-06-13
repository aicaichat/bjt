// Vite 环境变量配置
// 用于启用消费品页面字段标准化功能和购物车智能系统

// 在开发环境中设置这些变量
if (typeof window !== 'undefined') {
  // 临时在运行时设置这些变量（仅用于开发测试）
  window.VITE_ENABLE_STANDARD_FIELDS = 'true';
  window.VITE_ENABLE_SMART_UNITS = 'true';
  window.VITE_ENABLE_MULTILANG = 'true';
  window.VITE_USE_STANDARDIZED_FIELDS = 'true';
  
  // 购物车智能系统功能开关
  window.VITE_ENABLE_CART_ENHANCEMENT = 'true';
  window.VITE_DEBUG = 'true';
  window.VITE_ENABLE_SMART_UNIT_SYSTEM = 'true';
  window.VITE_USE_MOCK_CART = 'true';
}

export const defaultEnvConfig = {
  VITE_ENABLE_STANDARD_FIELDS: 'true',
  VITE_ENABLE_SMART_UNITS: 'true', 
  VITE_ENABLE_MULTILANG: 'true',
  VITE_USE_STANDARDIZED_FIELDS: 'true',
  
  // 购物车智能系统功能开关
  VITE_ENABLE_CART_ENHANCEMENT: 'true',
  VITE_DEBUG: 'true',
  VITE_ENABLE_SMART_UNIT_SYSTEM: 'true',
  VITE_USE_MOCK_CART: 'true'
}; 