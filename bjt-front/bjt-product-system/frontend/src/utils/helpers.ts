/**
 * 工具函数库 - 提供全局通用工具函数
 */

/**
 * 模拟网络延迟
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 格式化货币显示
 * @param amount 金额
 * @param currency 货币符号
 * @param decimals 小数位数
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (amount: number, currency: string = '¥', decimals: number = 2): string => {
  return `${currency}${amount.toFixed(decimals)}`;
};

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模式，默认为 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date | string, format: string = 'YYYY-MM-DD'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的新对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 截断长文本并添加省略号
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * 从查询字符串中获取参数值
 * @param name 参数名
 * @param url 可选的URL，默认为当前页面URL
 * @returns 参数值或null
 */
export const getQueryParam = (name: string, url?: string): string | null => {
  const urlToSearch = url || window.location.href;
  const params = new URLSearchParams(urlToSearch.split('?')[1]);
  return params.get(name);
};

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖包装后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流包装后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 检查对象是否为空
 * @param obj 要检查的对象
 * @returns 是否为空对象
 */
export const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

export default {
  delay,
  formatCurrency,
  formatDate,
  deepClone,
  truncateText,
  getQueryParam,
  debounce,
  throttle,
  isEmptyObject
}; 