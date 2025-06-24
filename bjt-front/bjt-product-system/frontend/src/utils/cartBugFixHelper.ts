import { isCartFixEnabled } from '../config/bugFixFlags';

// 购物车Bug修复工具类
// 采用装饰器模式，不修改现有代码，只增强功能
export class CartBugFixHelper {
  
  // ============ P0级修复：数据完整性 ============
  
  /**
   * 修复ProductID显示缺失问题
   * 安全策略：不修改原始数据，只在显示时进行修复
   */
  static getProductId(item: any): string {
    if (!isCartFixEnabled('fixProductIdDisplay')) {
      return item.product_id || item.id || '';
    }
    
    // 修复逻辑：多层级回退策略
    return item.product_id || 
           item.id || 
           item.sku || 
           item.part_number || 
           `AUTO-${Date.now()}` ||
           'N/A';
  }
  
  /**
   * 修复Excel数据错乱问题
   * 安全策略：数据标准化，不修改源数据
   */
  static normalizeExcelData(products: any[]): any[] {
    if (!isCartFixEnabled('fixExcelDataCorruption')) {
      return products;
    }
    
    return products.map(product => ({
      ...product,
      // 确保基础字段存在
      id: this.getProductId(product),
      name: this.getProductName(product),
      part_number: product.part_number || product.sku || product.code || '',
      model: product.model || '',
      price: typeof product.price === 'number' ? product.price : 0,
      quantity: typeof product.quantity === 'number' ? product.quantity : 1,
    }));
  }
  
  // ============ P1级修复：字段映射和显示 ============
  
  /**
   * 修复产品名称显示问题
   * 安全策略：智能回退，保证总有有效显示
   */
  static getProductName(item: any, language: string = 'zh'): string {
    if (!isCartFixEnabled('fixFieldNameMapping')) {
      return item.name || '';
    }
    
    // 多语言名称处理
    if (typeof item.name === 'object' && item.name) {
      const langKey = language === 'en' ? 'en-US' : 'zh-CN';
      return item.name[langKey] || item.name['zh-CN'] || item.name['en-US'] || '';
    }
    
    // 字符串名称或回退策略
    return item.name || 
           item.model || 
           item.part_number || 
           item.sku || 
           'Unknown Product';
  }
  
  /**
   * 修复字段标签国际化问题
   * 安全策略：标准化字段映射，不影响原有逻辑
   */
  static getFieldLabel(fieldKey: string, language: string = 'zh'): string {
    if (!isCartFixEnabled('fixI18nConsistency')) {
      return fieldKey;
    }
    
    const fieldMap = {
      zh: {
        productId: '产品ID',
        partNumber: '料号', 
        model: '型号',
        specs: '规格',
        applicableModel: '适用机型',
        bubbleDiameter: '泡径',
        weight: '净重',
        brand: '品牌',
        quantity: '数量',
        price: '价格'
      },
      en: {
        productId: 'Product ID',
        partNumber: 'Part Number',
        model: 'Model', 
        specs: 'Specifications',
        applicableModel: 'Applicable Model',
        bubbleDiameter: 'Bubble Diameter',
        weight: 'Net Weight',
        brand: 'Brand',
        quantity: 'Quantity',
        price: 'Price'
      }
    };
    
    const langMap = fieldMap[language] || fieldMap['zh'];
    return langMap[fieldKey] || fieldKey;
  }
  
  /**
   * 修复规格信息显示缺失
   * 安全策略：智能提取和格式化，不修改源数据
   */
  static getSpecsDisplay(item: any): string {
    if (!isCartFixEnabled('fixSpecsDisplay')) {
      return item.specs || '';
    }
    
    const specs = [];
    
    // 从specs字段提取
    if (item.specs) {
      if (typeof item.specs === 'string') {
        specs.push(item.specs);
      } else if (typeof item.specs === 'object') {
        Object.entries(item.specs).forEach(([key, value]) => {
          if (value && value !== 'N/A') {
            specs.push(`${key}: ${value}`);
          }
        });
      }
    }
    
    // 从properties字段提取关键规格
    if (item.properties) {
      if (item.properties.voltage) {
        specs.push(`${item.properties.voltage}V`);
      }
      if (item.properties.frequency) {
        specs.push(`${item.properties.frequency}Hz`);
      }
      if (item.properties.applicable_model) {
        specs.push(`适用: ${item.properties.applicable_model}`);
      }
    }
    
    return specs.join(' | ') || '暂无规格信息';
  }
  
  // ============ P2级修复：格式化和优化 ============
  
  /**
   * 修复单位显示问题
   * 安全策略：非破坏性格式化
   */
  static normalizeUnit(unit: string): string {
    if (!isCartFixEnabled('fixUnitNormalization')) {
      return unit;
    }
    
    return unit
      .replace(/lbs$/, 'lb')           // lbs -> lb
      .replace(/inches?$/, 'inch')     // inches -> inch
      .replace(/cms?$/, 'cm')          // cms -> cm
      .trim();
  }
  
  /**
   * 修复重复字段显示
   * 安全策略：去重和优化显示
   */
  static deduplicateFields(fields: string[]): string[] {
    if (!isCartFixEnabled('fixDuplicateFields')) {
      return fields;
    }
    
    // 去重并保持顺序
    const seen = new Set();
    return fields.filter(field => {
      if (seen.has(field)) {
        return false;
      }
      seen.add(field);
      return true;
    });
  }
  
  // ============ 实用工具方法 ============
  
  /**
   * 安全的数值格式化
   */
  static formatPrice(price: any, currency: string = 'CNY'): string {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    
    try {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(numPrice);
    } catch (error) {
      return `¥${numPrice.toFixed(2)}`;
    }
  }
  
  /**
   * 安全的数量格式化
   */
  static formatQuantity(quantity: any): number {
    const numQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity) || 1;
    return Math.max(1, numQuantity); // 确保数量至少为1
  }
  
  /**
   * 检查项目是否需要修复
   */
  static needsFixing(item: any): boolean {
    const issues = [];
    
    if (!item.product_id && !item.id) issues.push('missing_product_id');
    if (!item.name) issues.push('missing_name');
    if (!item.part_number && !item.sku) issues.push('missing_part_number');
    
    return issues.length > 0;
  }
  
  /**
   * 生成修复报告
   */
  static generateFixReport(items: any[]): {
    totalItems: number;
    fixedItems: number;
    issues: string[];
  } {
    const report = {
      totalItems: items.length,
      fixedItems: 0,
      issues: [] as string[]
    };
    
    items.forEach((item, index) => {
      if (this.needsFixing(item)) {
        report.fixedItems++;
        report.issues.push(`Item ${index}: ${this.getProductName(item)} has data issues`);
      }
    });
    
    return report;
  }
}

// 便捷的全局修复函数
export const applyCartBugFixes = {
  productId: CartBugFixHelper.getProductId,
  productName: CartBugFixHelper.getProductName,
  fieldLabel: CartBugFixHelper.getFieldLabel,
  specs: CartBugFixHelper.getSpecsDisplay,
  unit: CartBugFixHelper.normalizeUnit,
  price: CartBugFixHelper.formatPrice,
  quantity: CartBugFixHelper.formatQuantity,
}; 