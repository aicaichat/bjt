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