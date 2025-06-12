import { DEFAULT_REGION } from './env';

export interface Region {
  code: string;
  nameCn: string;
  nameEn: string;
  currencySymbol: string;
  voltage: string;
}

// Export regions configuration
export const REGIONS: Record<string, Region> = {
  CN: {
    code: 'CN',
    nameCn: '中国',
    nameEn: 'China',
    currencySymbol: '¥',
    voltage: '220V',
  },
  EU: {
    code: 'EU',
    nameCn: '欧洲',
    nameEn: 'Europe',
    currencySymbol: '€',
    voltage: '220V',
  },
  NA: {
    code: 'NA',
    nameCn: '北美',
    nameEn: 'North America',
    currencySymbol: '$',
    voltage: '110V',
  },
  AU: {
    code: 'AU',
    nameCn: '澳洲',
    nameEn: 'Australia',
    currencySymbol: 'A$',
    voltage: '220V',
  }
};

// Default voltage based on region
export const getDefaultVoltageByRegion = (region: string = DEFAULT_REGION): string => {
  switch(region) {
    case 'NA':
      return REGIONS.NA.voltage;
    case 'CN':
    case 'EU':
    case 'AU':
    default:
      return REGIONS.CN.voltage;
  }
};

// Inventory thresholds
export const INVENTORY_THRESHOLDS = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 5,
  MEDIUM_STOCK: 20
};

// Inventory status classes
export const getStockStatus = (amount: number) => {
  if (amount <= INVENTORY_THRESHOLDS.OUT_OF_STOCK) {
    return { className: 'out-of-stock', colorClass: 'inventory-low' };
  } else if (amount <= INVENTORY_THRESHOLDS.LOW_STOCK) {
    return { className: 'low-stock', colorClass: 'inventory-low' };
  } else if (amount <= INVENTORY_THRESHOLDS.MEDIUM_STOCK) {
    return { className: 'medium-stock', colorClass: 'inventory-medium' };
  } else {
    return { className: 'high-stock', colorClass: 'inventory-high' };
  }
};

// Currency symbol by region
export const getCurrencySymbol = (region: string = DEFAULT_REGION): string => {
  return REGIONS[region]?.currencySymbol || REGIONS[DEFAULT_REGION].currencySymbol;
};

// 图片基础路径
export const IMAGE_BASE_URL = '/images';

// 图片路径
export const IMAGES = {
  LOGO: `${IMAGE_BASE_URL}/logo-1.webp`,
  LOGO_FOOTER: `${IMAGE_BASE_URL}/logo-footer.webp`,
  BARCODE: `${IMAGE_BASE_URL}/barcode.webp`,
} as const;

// 应用常量配置
export const APP_CONFIG = {
  name: 'BJT产品管理系统',
  version: '1.0.0',
  description: 'BJT Product Management System',
  author: 'BJT Team'
};

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/wp-json/bjt/v1',
  timeout: 10000,
  retryAttempts: 3
};

export const UI_CONFIG = {
  pageSize: 20,
  maxPageSize: 100,
  debounceDelay: 300,
  animationDuration: 200
};

export const STORAGE_KEYS = {
  token: 'bjt_token',
  user: 'bjt_user',
  language: 'bjt_language',
  theme: 'bjt_theme',
  cart: 'bjt_cart'
};

export const ROUTES = {
  home: '/',
  login: '/login',
  machines: '/machines',
  accessories: '/accessories',
  consumables: '/consumables',
  spareParts: '/spare-parts',
  cart: '/cart',
  orders: '/orders',
  profile: '/profile',
  admin: '/admin'
};

export const LANGUAGES = {
  zh: '中文',
  en: 'English'
};

export const CURRENCIES = {
  CNY: '人民币',
  USD: '美元',
  EUR: '欧元'
};

export default {
  APP_CONFIG,
  API_CONFIG,
  UI_CONFIG,
  STORAGE_KEYS,
  ROUTES,
  LANGUAGES,
  CURRENCIES
}; 