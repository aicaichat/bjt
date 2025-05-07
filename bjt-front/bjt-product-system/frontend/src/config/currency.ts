/**
 * 货币符号配置
 * 根据不同区域显示不同的货币符号
 */
interface CurrencySymbols {
  [key: string]: string;
}

export const CURRENCY_SYMBOLS: CurrencySymbols = {
  'cn': '¥',
  'CN': '¥',
  'eu': '€',
  'EU': '€',
  'na': '$',
  'NA': '$',
  'us': '$',
  'US': '$',
  'au': 'A$',
  'AU': 'A$',
  'default': '$'
};

/**
 * 根据区域获取货币符号
 * @param region 区域代码
 * @returns 对应的货币符号
 */
export const getCurrencySymbol = (region: string = 'default'): string => {
  return CURRENCY_SYMBOLS[region] || CURRENCY_SYMBOLS.default;
};

export default {
  getCurrencySymbol,
  CURRENCY_SYMBOLS
}; 