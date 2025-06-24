/**
 * 统一产品数据类型定义
 * 用于在购物车、PO页面、OrderList之间传递完整的产品信息
 */

export interface UnifiedProductBase {
  // 基础标识
  id: string | number;
  code: string;
  sku: string;
  part_number: string;
  
  // 基本信息
  name: string | { [key: string]: string };
  name_zh?: string;  // 🔧 中文名称
  name_en?: string;  // 🔧 英文名称
  quantity: number;
  price: number;
  unit_price?: number;
  amount?: number;
  
  // 产品详情
  model: string;
  brand: string;
  type: string;
  unit?: string;
  
  // 规格信息
  spec?: string;
  specs?: string | object;
  spec_imperial?: string;
  
  // 扩展信息
  properties?: { [key: string]: any };
  description?: string;
  category?: string;
  subcategory?: string;
  
  // 显示信息
  image?: string;
  image_url?: string;
}

export interface CartProduct extends UnifiedProductBase {
  // 购物车特有字段
  selected?: boolean;
  inventory?: number;
  maxQuantity?: number;
}

export interface OrderProduct extends UnifiedProductBase {
  // 订单特有字段
  order_item_id?: number;
  target_type?: string;
  target_id?: string;
  item_type?: string;
  item_id?: string;
  item_name?: string;
  currency?: string;
}

export interface POProduct extends UnifiedProductBase {
  // PO页面显示用的完整产品信息
  // 继承所有基础字段，无额外字段
}

/**
 * 产品数据转换器
 * 负责在不同数据结构之间转换，确保信息完整性
 */
export class ProductDataConverter {
  
  /**
   * 从API订单项转换为统一产品格式
   */
  static fromOrderItem(orderItem: any): OrderProduct {
    console.log('🔧 [ProductDataConverter] 转换订单项:', orderItem);
    
    // 🔧 修复：优先提取多语言名称
    let productName = orderItem.item_name || orderItem.name;
    let nameZh = orderItem.name_zh;
    let nameEn = orderItem.name_en;
    
    // 如果name是对象格式，提取多语言字段
    if (typeof productName === 'object' && productName) {
      nameZh = productName['zh-CN'] || productName['zh'] || nameZh;
      nameEn = productName['en-US'] || productName['en'] || nameEn;
      productName = nameZh || nameEn || JSON.stringify(productName);
    }
    
    // 自动补全 name_zh / name_en 字段（避免语言错位）
    const isChineseText = (txt: string) => /[\u4e00-\u9fff]/.test(txt);

    if (!nameZh && productName && typeof productName === 'string' && isChineseText(productName)) {
      nameZh = productName;
    }
    if (!nameEn && productName && typeof productName === 'string' && !isChineseText(productName)) {
      nameEn = productName;
    }
    
    // 🔧 修复：确保规格信息完整
    const specInfo = orderItem.spec || orderItem.specs || '';
    const specImperial = orderItem.spec_imperial || '';
    
    const convertedProduct = {
      // 基础标识 - 优先使用最完整的字段
      id: orderItem.order_item_id || orderItem.id || orderItem.item_id,
      code: orderItem.item_id || orderItem.part_number || orderItem.code || orderItem.sku,
      sku: orderItem.item_id || orderItem.sku || orderItem.part_number || orderItem.code,
      part_number: orderItem.item_id || orderItem.part_number || orderItem.code,
      
      // 基本信息 - 🔧 修复：保留多语言字段
      name: productName,
      name_zh: nameZh,
      name_en: nameEn,
      quantity: parseInt(orderItem.quantity) || 1,
      price: parseFloat(orderItem.price || orderItem.unit_price) || 0,
      unit_price: parseFloat(orderItem.price || orderItem.unit_price) || 0,
      amount: (parseFloat(orderItem.price || orderItem.unit_price) || 0) * (parseInt(orderItem.quantity) || 1),
      
      // 产品详情
      model: orderItem.model || orderItem.item_name || '',
      brand: orderItem.brand || 'Lockedair',
      type: orderItem.item_type || orderItem.type || 'product',
      unit: orderItem.unit || 'pcs',
      
      // 规格信息 - 🔧 修复：保持API返回的完整信息
      spec: specInfo,
      specs: orderItem.specs || specInfo,
      spec_imperial: specImperial,
      
      // 扩展信息 - 🔧 修复：保留所有properties信息
      properties: {
        ...this.parseProperties(orderItem.properties),
        // 确保多语言名称在properties中也可用
        name_zh: nameZh,
        name_en: nameEn,
        productName: productName,
        // 保留其他重要字段
        model: orderItem.model,
        brand: orderItem.brand,
        spec: specInfo,
        spec_imperial: specImperial
      },
      description: orderItem.description || orderItem.item_description || '',
      category: orderItem.category || '',
      subcategory: orderItem.subcategory || '',
      
      // 显示信息
      image: orderItem.image || orderItem.image_url || '',
      image_url: orderItem.image || orderItem.image_url || '',
      
      // 订单特有字段
      order_item_id: orderItem.order_item_id,
      target_type: orderItem.target_type,
      target_id: orderItem.target_id,
      item_type: orderItem.item_type,
      item_id: orderItem.item_id,
      item_name: orderItem.item_name,
      currency: orderItem.currency || 'CNY'
    };
    
    console.log('🔧 [ProductDataConverter] 转换结果:', {
      原始: {
        id: orderItem.id,
        item_id: orderItem.item_id,
        name: orderItem.name,
        item_name: orderItem.item_name,
        model: orderItem.model,
        spec: orderItem.spec
      },
      转换后: {
        id: convertedProduct.id,
        code: convertedProduct.code,
        name: convertedProduct.name,
        name_zh: convertedProduct.name_zh,
        name_en: convertedProduct.name_en,
        model: convertedProduct.model,
        spec: convertedProduct.spec
      }
    });
    
    return convertedProduct;
  }
  
  /**
   * 从购物车项转换为统一产品格式
   */
  static fromCartItem(cartItem: any): CartProduct {
    return {
      // 基础标识
      id: cartItem.id,
      code: cartItem.code || cartItem.sku || cartItem.part_number,
      sku: cartItem.sku || cartItem.code || cartItem.part_number,
      part_number: cartItem.part_number || cartItem.code || cartItem.sku,
      
      // 基本信息
      name: cartItem.name,
      quantity: cartItem.quantity,
      price: cartItem.price || cartItem.unit_price,
      unit_price: cartItem.unit_price || cartItem.price,
      amount: (cartItem.price || cartItem.unit_price) * cartItem.quantity,
      
      // 产品详情
      model: cartItem.model || '',
      brand: cartItem.brand || '',
      type: cartItem.type || 'product',
      unit: cartItem.unit || 'pcs',
      
      // 规格信息
      spec: cartItem.spec || '',
      specs: cartItem.specs || cartItem.spec || '',
      spec_imperial: cartItem.spec_imperial || '',
      
      // 扩展信息
      properties: this.parseProperties(cartItem.properties),
      description: cartItem.description || '',
      category: cartItem.category || '',
      subcategory: cartItem.subcategory || '',
      
      // 显示信息
      image: cartItem.image || cartItem.image_url || '',
      image_url: cartItem.image || cartItem.image_url || '',
      
      // 购物车特有字段
      selected: cartItem.selected,
      inventory: cartItem.inventory,
      maxQuantity: cartItem.maxQuantity
    };
  }
  
  /**
   * 转换为PO页面使用的产品格式
   */
  static toPOProduct(product: UnifiedProductBase): POProduct {
    return {
      ...product,
      // 确保所有必需字段都存在
      spec: product.spec || '',
      specs: product.specs || product.spec || '',
      model: product.model || '',
      brand: product.brand || '',
      properties: product.properties || {}
    };
  }
  
  /**
   * 解析properties字段，处理字符串和对象格式
   */
  private static parseProperties(properties: any): { [key: string]: any } {
    if (!properties) return {};
    
    if (typeof properties === 'string') {
      try {
        return JSON.parse(properties);
      } catch {
        return {};
      }
    }
    
    if (typeof properties === 'object') {
      return properties;
    }
    
    return {};
  }
  
  /**
   * 验证产品数据完整性
   */
  static validateProduct(product: UnifiedProductBase): { isValid: boolean; missingFields: string[] } {
    const requiredFields = ['id', 'name', 'quantity', 'price'];
    const missingFields = requiredFields.filter(field => !product[field]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
} 