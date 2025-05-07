/**
 * 全局应用配置文件
 * 集中管理API URL、区域设置、用户角色等全局参数
 */

/**
 * API配置
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.bjt-packaging.com',
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK === 'true' || true,
  TIMEOUT: 8000, // 请求超时时间（毫秒）
  RETRY_COUNT: 2, // 请求失败重试次数
  VERSION: 'v1',  // API版本
  RATE_LIMIT: 100, // 每分钟允许的请求数
};

/**
 * 用户角色配置
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  CUSTOMER: 'customer',
  PARTNER: 'partner',
  GUEST: 'guest',
  
  // 角色权限映射
  PERMISSIONS: {
    admin: ['read', 'write', 'delete', 'manage_users', 'view_reports', 'manage_system'],
    sales: ['read', 'write_orders', 'view_customers', 'view_reports'],
    customer: ['read', 'place_orders', 'view_own_orders'],
    partner: ['read', 'place_orders', 'view_own_orders', 'special_pricing'],
    guest: ['read', 'browse_products'],
  },
  
  // 获取角色显示名称
  getRoleDisplayName: (role: string): string => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'sales': return 'Sales';
      case 'customer': return 'Customer';
      case 'partner': return 'Partner';
      default: return 'Guest';
    }
  },
  
  // 检查角色是否有特定权限
  hasPermission: (role: string, permission: string): boolean => {
    const permissions = USER_ROLES.PERMISSIONS[role as keyof typeof USER_ROLES.PERMISSIONS] || [];
    return permissions.includes(permission);
  }
};

/**
 * 区域配置
 */
export const REGIONS = {
  CN: 'cn',
  EU: 'eu',
  NA: 'na',
  AU: 'au',
  
  // 电子邮件域名映射到区域
  EMAIL_DOMAINS: {
    'eu': 'eu',
    'northamerica': 'na',
    'au': 'au',
  },
  
  // 区域名称映射
  NAMES: {
    cn: '中国',
    eu: 'Europe',
    na: 'North America',
    au: 'Australia',
  },
  
  // 区域到货币代码映射
  CURRENCY_CODES: {
    cn: 'CNY',
    eu: 'EUR',
    na: 'USD',
    au: 'AUD',
  },
  
  // 区域到货币符号映射
  CURRENCY_SYMBOLS: {
    cn: '¥',
    eu: '€',
    na: '$',
    au: 'A$',
  },
  
  // 区域到语言代码映射
  LANGUAGE_CODES: {
    cn: 'zh-CN',
    eu: 'en-GB',
    na: 'en-US',
    au: 'en-AU',
  },
};

/**
 * 语言配置
 */
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
  
  // 语言显示名称
  DISPLAY_NAMES: {
    'zh-CN': '中文',
    'en-US': 'English',
  },
  
  // 区域默认语言
  DEFAULT_FOR_REGION: {
    cn: 'zh-CN',
    eu: 'en-US',
    na: 'en-US',
    au: 'en-US',
  },
  
  // 日期格式
  DATE_FORMATS: {
    'zh-CN': 'YYYY-MM-DD',
    'en-US': 'MM/DD/YYYY',
  },
};

/**
 * 应用资产配置
 */
export const ASSETS: {
  BASE_URL: string;
  DEFAULT_IMAGE: string;
  LOGO: string;
  LOGO_SMALL: string;
  FAVICON: string;
  PRODUCTS: {
    BASE_PATH: string;
    MACHINES: string;
    CONSUMABLES: string;
    SPARE_PARTS: string;
    ACCESSORIES: string;
    PLACEHOLDER: string;
  };
  SPARE_PARTS: {
    BASE_PATH: string;
    PLACEHOLDER: string;
  };
  USER: {
    AVATAR_DEFAULT: string;
    BACKGROUNDS: string;
  };
  ICONS: {
    BASE_PATH: string;
    CART: string;
    USER: string;
    SETTINGS: string;
    LOGOUT: string;
    SEARCH: string;
    FILTER: string;
    SORT: string;
    ARROW_UP: string;
    ARROW_DOWN: string;
    ADD: string;
    REMOVE: string;
    WARNING: string;
    SUCCESS: string;
    ERROR: string;
    INFO: string;
  };
  getUrl: (path: string) => string;
  getProductImageUrl: (productId: string, productType?: string) => string;
  getSparePartImageUrl: (partId: string) => string;
  getSafeImageUrl: (path: string, fallbackPath?: string) => string;
} = {
  BASE_URL: import.meta.env.VITE_ASSETS_URL || '/assets',
  DEFAULT_IMAGE: '/images/default-product.png',
  LOGO: '/images/logo.png',
  LOGO_SMALL: '/images/logo-small.png',
  FAVICON: '/favicon.ico',
  
  // 产品图片路径
  PRODUCTS: {
    BASE_PATH: '/images/products',
    MACHINES: '/images/products/machines',
    CONSUMABLES: '/images/products/consumables',
    SPARE_PARTS: '/images/products/spare-parts',
    ACCESSORIES: '/images/products/accessories',
    PLACEHOLDER: '/images/placeholder-product.png',
  },
  
  // 备件图片路径
  SPARE_PARTS: {
    BASE_PATH: '/images/spare-parts',
    PLACEHOLDER: '/images/placeholder-part.png',
  },
  
  // 用户相关资源
  USER: {
    AVATAR_DEFAULT: '/images/avatar-default.png',
    BACKGROUNDS: '/images/user-backgrounds',
  },
  
  // 图标路径
  ICONS: {
    BASE_PATH: '/icons',
    CART: '/icons/cart.svg',
    USER: '/icons/user.svg',
    SETTINGS: '/icons/settings.svg',
    LOGOUT: '/icons/logout.svg',
    SEARCH: '/icons/search.svg',
    FILTER: '/icons/filter.svg',
    SORT: '/icons/sort.svg',
    ARROW_UP: '/icons/arrow-up.svg',
    ARROW_DOWN: '/icons/arrow-down.svg',
    ADD: '/icons/add.svg',
    REMOVE: '/icons/remove.svg',
    WARNING: '/icons/warning.svg',
    SUCCESS: '/icons/success.svg',
    ERROR: '/icons/error.svg',
    INFO: '/icons/info.svg',
  },
  
  // 根据路径获取完整资源URL
  getUrl: (path: string): string => {
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path; // 已经是完整URL
    }
    
    // 确保路径以斜杠开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${ASSETS.BASE_URL}${normalizedPath}`;
  },
  
  // 获取产品图片URL
  getProductImageUrl: (productId: string, productType: string = 'machines'): string => {
    let basePath = ASSETS.PRODUCTS.MACHINES;
    
    switch (productType.toLowerCase()) {
      case 'consumables':
        basePath = ASSETS.PRODUCTS.CONSUMABLES;
        break;
      case 'spare-parts':
      case 'spare_parts':
      case 'spareparts':
        basePath = ASSETS.PRODUCTS.SPARE_PARTS;
        break;
      case 'accessories':
        basePath = ASSETS.PRODUCTS.ACCESSORIES;
        break;
    }
    
    return `${ASSETS.BASE_URL}${basePath}/${productId}.jpg`;
  },
  
  // 获取备件图片URL
  getSparePartImageUrl: (partId: string): string => {
    return `${ASSETS.BASE_URL}${ASSETS.SPARE_PARTS.BASE_PATH}/${partId}.jpg`;
  },
  
  // 获取错误处理后的图片URL（带占位图逻辑）
  getSafeImageUrl: (path: string, fallbackPath: string = ASSETS.DEFAULT_IMAGE): string => {
    const img = new Image();
    img.src = ASSETS.getUrl(path);
    
    if (!path || path === '') {
      return ASSETS.getUrl(fallbackPath);
    }
    
    return ASSETS.getUrl(path);
  }
};

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_BUTTONS: 5,
};

/**
 * 价格配置
 */
export const PRICING = {
  VIP_DISCOUNT: 0.8, // VIP折扣率
  PARTNER_DISCOUNT: 0.85, // 合作伙伴折扣率
  REGULAR_DISCOUNT: 0.9, // 普通客户折扣率
  TAX_RATE: 0.13, // 增值税率
  SHIPPING_FEE: 50, // 默认运费
  FREE_SHIPPING_THRESHOLD: 5000, // 免运费门槛
};

/**
 * 通知配置
 */
export const NOTIFICATION = {
  AUTO_DISMISS_TIMEOUT: 5000, // 自动关闭通知时间（毫秒）
  MAX_NOTIFICATIONS: 5, // 最大通知数量
};

/**
 * 根据登录账号确定用户区域
 * @param email 用户邮箱
 * @returns 用户区域代码
 */
export const getUserRegionFromEmail = (email: string): string => {
  if (!email) return 'cn'; // 默认为中国区域
  
  const lowerEmail = email.toLowerCase();
  
  // 检查邮箱是否包含特定区域标识
  for (const [domain, region] of Object.entries(REGIONS.EMAIL_DOMAINS)) {
    if (lowerEmail.includes(domain)) {
      return region;
    }
  }
  
  return 'cn'; // 默认为中国区域
};

/**
 * 检查用户是否是VIP
 * @param email 用户邮箱
 * @returns 是否是VIP用户
 */
export const isVipUser = (email: string): boolean => {
  if (!email) return false;
  return email.toLowerCase().includes('vip');
};

/**
 * 获取区域对应的货币符号
 * @param region 区域代码
 * @returns 货币符号
 */
export const getCurrencySymbol = (region?: string): string => {
  if (!region) return '¥'; // 默认为人民币符号
  
  const lowerRegion = region.toLowerCase();
  return REGIONS.CURRENCY_SYMBOLS[lowerRegion as keyof typeof REGIONS.CURRENCY_SYMBOLS] || '¥';
};

/**
 * 获取区域对应的货币代码
 * @param region 区域代码
 * @returns 货币代码
 */
export const getCurrencyCode = (region?: string): string => {
  if (!region) return 'CNY'; // 默认为人民币代码
  
  const lowerRegion = region.toLowerCase();
  return REGIONS.CURRENCY_CODES[lowerRegion as keyof typeof REGIONS.CURRENCY_CODES] || 'CNY';
};

/**
 * 路由配置
 */
export const ROUTES = {
  // 主导航路由
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  MACHINES: '/machines',
  CONSUMABLES: '/consumables',
  SPARE_PARTS: '/spare-parts',
  ACCESSORIES: '/accessories',
  CART: '/cart',
  ORDER: '/order',
  ORDER_LIST: '/orders',
  PURCHASE_ORDER: '/po',
  
  // 详情页路由
  MACHINE_DETAIL: (id: string) => `/machines/${id}`,
  CONSUMABLE_DETAIL: (id: string) => `/consumables/${id}`,
  SPARE_PART_DETAIL: (id: string) => `/spare-parts/${id}`,
  ACCESSORY_DETAIL: (id: string) => `/accessories/${id}`,
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  
  // 管理路由
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  
  // 辅助功能
  getPath: (route: string, params?: Record<string, string>): string => {
    let path = route;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, encodeURIComponent(value));
      });
    }
    
    return path;
  },
  
  // 从路径中获取ID
  getIdFromPath: (path: string): string | null => {
    const parts = path.split('/');
    const id = parts[parts.length - 1];
    return id || null;
  }
};

export default {
  API_CONFIG,
  USER_ROLES,
  REGIONS,
  LANGUAGES,
  ASSETS,
  PAGINATION,
  PRICING,
  NOTIFICATION,
  getUserRegionFromEmail,
  isVipUser,
  getCurrencySymbol,
  getCurrencyCode,
  ROUTES,
}; 