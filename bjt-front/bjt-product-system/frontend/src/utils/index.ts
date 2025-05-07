/**
 * 项目工具函数导出
 * 集中导出所有工具函数，方便引用
 */

// 导入工具函数模块
import * as regionUtilsFunctions from './regionUtils';
import regionUtilsDefault from './regionUtils';
import * as priceUtilsFunctions from './priceUtils';
import priceUtilsDefault from './priceUtils';

// 区域和语言工具函数
export { 
  getUserRegionFromEmail,
  isVipUser,
  getUserDiscountRate,
  getCurrencySymbol,
  getCurrencyCode,
  getRegionName,
  getDefaultLanguageForRegion,
  getLanguageDisplayName,
  getDateFormatForLanguage,
  getInventoryForRegion,
  isProductAvailableInRegion,
  getInventoryStatusText,
} from './regionUtils';

// 价格相关工具函数
export {
  formatPrice,
  calculateDiscountedPrice,
  calculatePriceWithTax,
  calculatePriceWithoutTax,
  calculateTotal,
  calculateItemsTotal,
  calculateShippingFee,
  getPriceTier,
} from './priceUtils';

// 导出命名空间对象
export const regionUtils = regionUtilsDefault;
export const priceUtils = priceUtilsDefault;

// 工具函数组合模块
export default {
  // 区域工具
  region: regionUtilsDefault,
  
  // 价格工具
  price: priceUtilsDefault,
}; 