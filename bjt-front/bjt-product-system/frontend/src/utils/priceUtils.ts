import { PRICING } from '../config/appConfig';
import { getCurrencySymbol, getCurrencyCode } from './regionUtils';

/**
 * 安全地应用toLocaleString方法，处理undefined/null/对象值
 * @param value 需要格式化的值
 * @param locale 区域设置
 * @param options 格式化选项
 * @returns 格式化后的字符串
 */
export const safeToLocaleString = (
  value: any,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  // 如果值是对象，返回一个描述字符串而不是尝试格式化对象
  if (value !== null && typeof value === 'object') {
    return '[Object]';
  }
  
  // 如果值无效，返回安全的默认值
  if (value === undefined || value === null || isNaN(Number(value))) {
    return options?.minimumFractionDigits ? '0.00' : '0';
  }
  
  try {
    return Number(value).toLocaleString(locale, options);
  } catch (error) {
    console.error('Error formatting price:', error);
    // 如果格式化失败，返回简单的字符串表示
    return options?.minimumFractionDigits ? Number(value).toFixed(options.minimumFractionDigits) : String(value);
  }
};

/**
 * 格式化价格
 * @param price 价格
 * @param region 区域代码
 * @param options 格式化选项
 * @returns 格式化后的价格字符串
 */
export const formatPrice = (
  price: number,
  region: string = 'cn',
  options: {
    includeCurrency?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    style?: 'decimal' | 'currency';
  } = {}
): string => {
  const {
    includeCurrency = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    style = includeCurrency ? 'currency' : 'decimal',
  } = options;

  if (isNaN(price) || price === null || price === undefined) {
    return includeCurrency ? `${getCurrencySymbol(region)}0.00` : '0.00';
  }

  // 根据区域获取对应的语言代码
  const languageCode = region === 'cn' ? 'zh-CN' : region === 'eu' ? 'en-GB' : 'en-US';

  try {
    const formatter = new Intl.NumberFormat(languageCode, {
      style,
      currency: getCurrencyCode(region),
      minimumFractionDigits,
      maximumFractionDigits,
    });

    return formatter.format(price);
  } catch (error) {
    // 回退到基本格式化
    const formattedPrice = price.toFixed(maximumFractionDigits);
    return includeCurrency ? `${getCurrencySymbol(region)}${formattedPrice}` : formattedPrice;
  }
};

/**
 * 安全的货币格式化函数
 */
export function formatCurrency(value: any, currency: string = 'USD', locale: string = 'en-US'): string {
  return safeToLocaleString(value, locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * 安全价格转换函数，返回数字而不是格式化字符串
 */
export function safeParsePrice(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // 尝试解析字符串价格
  try {
    // 移除所有非数字和小数点字符
    const cleanValue = String(value).replace(/[^\d.-]/g, '');
    return parseFloat(cleanValue) || 0;
  } catch (error) {
    console.error('Error parsing price:', error);
    return 0;
  }
}

/**
 * 计算折扣价格
 * @param originalPrice 原始价格
 * @param discountRate 折扣率 (0-1)
 * @returns 折扣后价格
 */
export const calculateDiscountedPrice = (originalPrice: number, discountRate: number): number => {
  if (isNaN(originalPrice) || originalPrice <= 0 || discountRate <= 0) {
    return 0;
  }
  // 四舍五入到2位小数
  return Math.round(originalPrice * discountRate * 100) / 100;
};

/**
 * 计算含税价格
 * @param price 价格
 * @param includesTax 价格是否已包含税
 * @param taxRate 税率 (默认使用配置中的税率)
 * @returns 含税价格
 */
export const calculatePriceWithTax = (
  price: number,
  includesTax: boolean = false,
  taxRate: number = PRICING.TAX_RATE
): number => {
  if (isNaN(price) || price <= 0) {
    return 0;
  }

  if (includesTax) {
    return price; // 价格已包含税
  }

  // 四舍五入到2位小数
  return Math.round(price * (1 + taxRate) * 100) / 100;
};

/**
 * 计算不含税价格
 * @param priceWithTax 含税价格
 * @param taxRate 税率 (默认使用配置中的税率)
 * @returns 不含税价格
 */
export const calculatePriceWithoutTax = (
  priceWithTax: number,
  taxRate: number = PRICING.TAX_RATE
): number => {
  if (isNaN(priceWithTax) || priceWithTax <= 0) {
    return 0;
  }

  // 四舍五入到2位小数
  return Math.round((priceWithTax / (1 + taxRate)) * 100) / 100;
};

/**
 * 计算总价
 * @param prices 价格数组
 * @returns 总价
 */
export const calculateTotal = (prices: number[]): number => {
  if (!Array.isArray(prices) || prices.length === 0) {
    return 0;
  }

  // 过滤掉非数字，并求和
  const validPrices = prices.filter(price => !isNaN(price) && price !== null && price !== undefined);
  return validPrices.reduce((sum, price) => sum + price, 0);
};

/**
 * 计算商品总价
 * @param items 商品数组，每个商品包含价格和数量
 * @returns 总价
 */
export const calculateItemsTotal = (
  items: Array<{ price: number; quantity: number }>
): number => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  // 计算每个商品的小计，并求和
  return items.reduce((total, item) => {
    const itemPrice = isNaN(item.price) ? 0 : item.price;
    const quantity = isNaN(item.quantity) ? 0 : item.quantity;
    return total + itemPrice * quantity;
  }, 0);
};

/**
 * 计算运费
 * @param orderTotal 订单总金额
 * @param region 区域
 * @param weight 重量(kg)
 * @returns 运费
 */
export const calculateShippingFee = (
  orderTotal: number,
  region: string = 'cn',
  weight: number = 0
): number => {
  // 如果订单总额超过免运费门槛，则免运费
  if (orderTotal >= PRICING.FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  // 基础运费
  let baseFee = PRICING.SHIPPING_FEE;

  // 根据区域调整运费
  switch (region.toLowerCase()) {
    case 'eu':
      baseFee *= 1.5;
      break;
    case 'na':
      baseFee *= 2;
      break;
    case 'au':
      baseFee *= 2.5;
      break;
    default:
      // 中国区域使用基础运费
      break;
  }

  // 根据重量调整运费
  if (weight > 10) {
    // 超过10kg，每增加1kg增加运费5%
    const additionalWeight = weight - 10;
    baseFee += baseFee * (additionalWeight * 0.05);
  }

  // 四舍五入到2位小数
  return Math.round(baseFee * 100) / 100;
};

/**
 * 获取价格等级描述
 * @param price 价格
 * @param region 区域
 * @returns 价格等级描述
 */
export const getPriceTier = (price: number, region: string = 'cn'): string => {
  // 不同区域的价格等级范围不同
  let lowThreshold = 100;
  let mediumThreshold = 500;

  switch (region.toLowerCase()) {
    case 'eu':
      lowThreshold = 150;
      mediumThreshold = 750;
      break;
    case 'na':
      lowThreshold = 200;
      mediumThreshold = 1000;
      break;
    case 'au':
      lowThreshold = 250;
      mediumThreshold = 1250;
      break;
    default:
      // 使用默认阈值
      break;
  }

  if (price < lowThreshold) return '经济';
  if (price < mediumThreshold) return '中档';
  return '高档';
};

/**
 * 导出所有价格工具函数
 */
export default {
  formatPrice,
  calculateDiscountedPrice,
  calculatePriceWithTax,
  calculatePriceWithoutTax,
  calculateTotal,
  calculateItemsTotal,
  calculateShippingFee,
  getPriceTier,
  safeToLocaleString,
}; 