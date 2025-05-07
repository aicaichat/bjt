import { REGIONS, LANGUAGES, PRICING } from '../config/appConfig';

/**
 * 根据电子邮件获取用户的区域代码
 * @param email 用户电子邮件
 * @returns 区域代码
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
  
  // 检查常见域名后缀
  if (lowerEmail.endsWith('.cn')) return 'cn';
  if (lowerEmail.endsWith('.eu')) return 'eu';
  if (lowerEmail.endsWith('.us') || lowerEmail.endsWith('.com')) return 'na';
  if (lowerEmail.endsWith('.au')) return 'au';
  
  return 'cn'; // 默认为中国区域
};

/**
 * 检查用户是否是VIP
 * @param email 用户电子邮件
 * @returns 是否是VIP用户
 */
export const isVipUser = (email: string): boolean => {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  return lowerEmail.includes('vip') || lowerEmail.includes('premium');
};

/**
 * 根据用户信息获取折扣率
 * @param isVip 是否是VIP用户
 * @param role 用户角色
 * @returns 折扣率 (0-1)
 */
export const getUserDiscountRate = (isVip: boolean, role: string): number => {
  if (isVip) return PRICING.VIP_DISCOUNT;
  if (role === 'partner') return PRICING.PARTNER_DISCOUNT;
  return PRICING.REGULAR_DISCOUNT;
};

/**
 * 计算折扣价格
 * @param price 原始价格
 * @param discountRate 折扣率 (0-1)
 * @returns 折扣后价格
 */
export const calculateDiscountedPrice = (price: number, discountRate: number): number => {
  return +(price * discountRate).toFixed(2);
};

/**
 * 计算含税价格
 * @param price 价格
 * @param taxRate 税率 (0-1)
 * @returns 含税价格
 */
export const calculatePriceWithTax = (price: number, taxRate: number = PRICING.TAX_RATE): number => {
  return +(price * (1 + taxRate)).toFixed(2);
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
 * 获取区域名称
 * @param region 区域代码
 * @returns 区域名称
 */
export const getRegionName = (region: string): string => {
  const lowerRegion = region.toLowerCase();
  return REGIONS.NAMES[lowerRegion as keyof typeof REGIONS.NAMES] || '未知区域';
};

/**
 * 获取区域的默认语言
 * @param region 区域代码
 * @returns 语言代码
 */
export const getDefaultLanguageForRegion = (region: string): string => {
  const lowerRegion = region.toLowerCase();
  return LANGUAGES.DEFAULT_FOR_REGION[lowerRegion as keyof typeof LANGUAGES.DEFAULT_FOR_REGION] || 'zh-CN';
};

/**
 * 获取语言的显示名称
 * @param language 语言代码
 * @returns 语言显示名称
 */
export const getLanguageDisplayName = (language: string): string => {
  return LANGUAGES.DISPLAY_NAMES[language as keyof typeof LANGUAGES.DISPLAY_NAMES] || 'Unknown';
};

/**
 * 获取语言的日期格式
 * @param language 语言代码
 * @returns 日期格式
 */
export const getDateFormatForLanguage = (language: string): string => {
  return LANGUAGES.DATE_FORMATS[language as keyof typeof LANGUAGES.DATE_FORMATS] || 'YYYY-MM-DD';
};

/**
 * 获取用户区域的库存状态
 * @param inventory 库存对象
 * @param region 用户区域
 * @returns 用户所在区域的库存数量
 */
export const getInventoryForRegion = (inventory: any, region: string): number => {
  // 处理新的库存格式（对象）
  if (typeof inventory === 'object' && !Array.isArray(inventory)) {
    return inventory[region.toLowerCase()] || 0;
  }
  
  // 处理旧的库存格式（数组）
  if (Array.isArray(inventory)) {
    const regionInventory = inventory.find(item => item.region === region);
    return regionInventory ? regionInventory.amount : 0;
  }
  
  return 0;
};

/**
 * 检查产品在用户区域是否有库存
 * @param inventory 库存对象
 * @param region 用户区域
 * @returns 是否有库存
 */
export const isProductAvailableInRegion = (inventory: any, region: string): boolean => {
  return getInventoryForRegion(inventory, region) > 0;
};

/**
 * 获取产品库存状态描述
 * @param inventory 库存对象
 * @param region 用户区域
 * @returns 库存状态描述
 */
export const getInventoryStatusText = (inventory: any, region: string): string => {
  const count = getInventoryForRegion(inventory, region);
  
  if (count <= 0) return '缺货';
  if (count < 5) return '库存紧张';
  if (count < 20) return '库存充足';
  return '库存丰富';
};

/**
 * 地区化的价格格式化
 * @param price 价格
 * @param region 区域代码
 * @param includeCurrency 是否包含货币符号
 * @returns 格式化后的价格字符串
 */
export const formatPrice = (price: number, region: string = 'cn', includeCurrency: boolean = true): string => {
  const currencySymbol = getCurrencySymbol(region);
  const formatter = new Intl.NumberFormat(region === 'cn' ? 'zh-CN' : 'en-US', {
    style: includeCurrency ? 'currency' : 'decimal',
    currency: getCurrencyCode(region),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(price);
};

/**
 * 导出所有区域工具函数
 */
export default {
  getUserRegionFromEmail,
  isVipUser,
  getUserDiscountRate,
  calculateDiscountedPrice,
  calculatePriceWithTax,
  getCurrencySymbol,
  getCurrencyCode,
  getRegionName,
  getDefaultLanguageForRegion,
  getLanguageDisplayName,
  getDateFormatForLanguage,
  getInventoryForRegion,
  isProductAvailableInRegion,
  getInventoryStatusText,
  formatPrice,
}; 