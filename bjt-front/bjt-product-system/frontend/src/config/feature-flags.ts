// 功能开关配置
export const FEATURE_FLAGS = {
  // 智能单位制系统
  SMART_UNIT_SYSTEM: import.meta.env.VITE_ENABLE_SMART_UNITS === 'true',
  
  // 购物车字段增强
  CART_FIELD_ENHANCEMENT: import.meta.env.VITE_ENABLE_CART_ENHANCEMENT === 'true',
  
  // 调试模式 - 显示额外的调试信息
  DEBUG_MODE: import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true'
};

// 功能开关工具函数
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature] || false;
};

// 调试信息输出
export const debugLog = (message: string, data?: any) => {
  if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log(`[购物车系统] ${message}`, data || '');
  }
};

// 功能开关状态检查
export const getFeatureStatus = () => {
  return {
    smartUnitSystem: FEATURE_FLAGS.SMART_UNIT_SYSTEM,
    cartFieldEnhancement: FEATURE_FLAGS.CART_FIELD_ENHANCEMENT,
    debugMode: FEATURE_FLAGS.DEBUG_MODE,
    environment: import.meta.env.MODE
  };
}; 