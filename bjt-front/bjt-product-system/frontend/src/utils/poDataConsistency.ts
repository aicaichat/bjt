/**
 * PO页面数据一致性工具
 * 确保OrderList到PO页面的数据流转保持完全一致
 */

import { OrderNumberManager } from './orderNumberUtils';
import { UnifiedProduct, CustomerInfo, ShippingInfo, OrderSummary } from '../types/product.types';
import { ProductDataConverter } from '../types/unified-product.types';

export interface PODataConsistencyResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any;
}

export class PODataConsistencyManager {
  
  /**
   * 验证从OrderList传递到PO页面的数据完整性
   */
  static validateOrderListToPOData(orderData: any): PODataConsistencyResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('🔧 [PODataConsistency] 开始验证OrderList数据:', orderData);
    
    // 1. 验证订单号
    if (!orderData.order_number && !orderData.orderNumber) {
      errors.push('缺少订单号 (order_number 或 orderNumber)');
    }
    
    // 2. 验证订单ID
    if (!orderData.id && !orderData.orderId) {
      errors.push('缺少订单ID (id 或 orderId)');
    }
    
    // 3. 验证商品数据
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('缺少商品数据或商品列表为空');
    } else {
      orderData.items.forEach((item: any, index: number) => {
        if (!item.code && !item.part_number && !item.id) {
          errors.push(`商品 ${index + 1} 缺少产品代码`);
        }
        if (!item.name && !item.product_name) {
          warnings.push(`商品 ${index + 1} 缺少产品名称`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`商品 ${index + 1} 数量无效`);
        }
        if (!item.price && !item.unit_price) {
          warnings.push(`商品 ${index + 1} 缺少价格信息`);
        }
      });
    }
    
    // 4. 验证客户信息
    const hasCustomerInfo = orderData.customer_info || 
                           orderData.user_info || 
                           orderData.billing_address ||
                           orderData.shippingInfo ||
                           orderData.shipping_address;
    
    if (!hasCustomerInfo) {
      warnings.push('缺少客户信息，将使用默认值');
    }
    
    // 5. 验证总金额
    if (!orderData.total && !orderData.total_amount) {
      warnings.push('缺少订单总金额');
    }
    
    const isValid = errors.length === 0;
    
    console.log('🔧 [PODataConsistency] 验证结果:', {
      isValid,
      errorsCount: errors.length,
      warningsCount: warnings.length
    });
    
    return {
      isValid,
      errors,
      warnings,
      data: orderData
    };
  }
  
  /**
   * 标准化OrderList数据为PO页面格式
   */
  static standardizeOrderDataForPO(orderData: any): any {
    console.log('🔧 [PODataConsistency] 开始标准化订单数据');
    
    try {
      // 1. 提取并标准化客户信息
      const customerInfo = this.extractCustomerInfo(orderData);
      
      // 2. 提取并标准化运输信息
      const shippingInfo = this.extractShippingInfo(orderData);
      
      // 3. 标准化商品数据
      const standardizedItems = this.standardizeOrderItems(orderData.items || []);
      
      // 4. 计算订单汇总
      const summary = this.calculateOrderSummary(standardizedItems, orderData);
      
      // 5. 使用OrderNumberManager创建统一数据结构
      const poData = OrderNumberManager.createUnifiedOrderData({
        orderObject: orderData,
        orderItems: standardizedItems,
        customerInfo,
        shippingInfo: {
          ...shippingInfo,
          company: customerInfo.companyName,
          email: customerInfo.email,
          country: ''
        },
        summary,
        source: 'order_list_standardized'
      });
      
      console.log('🔧 [PODataConsistency] 标准化完成:', {
        orderNumber: poData.orderNumber,
        customerInfo: poData.customerInfo,
        itemsCount: poData.orderItems.length,
        total: poData.summary.total
      });
      
      return poData;
      
    } catch (error) {
      console.error('🔧 [PODataConsistency] 标准化失败:', error);
      throw new Error(`数据标准化失败: ${error.message}`);
    }
  }
  
  /**
   * 提取客户信息
   */
  private static extractCustomerInfo(orderData: any): CustomerInfo {
    const customerInfo: CustomerInfo = {
      companyName: '',
      contactName: '',
      address: '',
      phone: '',
      email: ''
    };
    
    // 定义可能包含客户信息的字段
    const customerSources = [
      orderData.customer_info,
      orderData.user_info,
      orderData.billing_address,
      orderData.shipping_address,
      orderData.shippingInfo
    ];
    
    // 从各个来源提取客户信息，优先级从高到低
    for (const source of customerSources) {
      if (source && typeof source === 'object') {
        // 公司名称
        if (!customerInfo.companyName) {
          customerInfo.companyName = source.companyName || 
                                   source.company_name || 
                                   source.company || '';
        }
        
        // 联系人
        if (!customerInfo.contactName) {
          customerInfo.contactName = source.contactName || 
                                    source.contact_name || 
                                    source.name || 
                                    source.recipient_name || '';
        }
        
        // 地址
        if (!customerInfo.address) {
          customerInfo.address = source.address || '';
        }
        
        // 电话
        if (!customerInfo.phone) {
          customerInfo.phone = source.phone || 
                               source.contact_phone || '';
        }
        
        // 邮箱
        if (!customerInfo.email) {
          customerInfo.email = source.email || '';
        }
      } else if (typeof source === 'string' && source.includes('|')) {
        // 处理字符串格式的运输信息
        const parts = source.split('|').map(s => s.trim());
        if (!customerInfo.address && parts[0]) customerInfo.address = parts[0];
        if (!customerInfo.contactName && parts[1]) customerInfo.contactName = parts[1];
        if (!customerInfo.phone && parts[2]) customerInfo.phone = parts[2];
      }
    }
    
    // 提供默认值
    if (!customerInfo.companyName) customerInfo.companyName = 'Customer Company';
    if (!customerInfo.contactName) customerInfo.contactName = 'Customer Contact';
    if (!customerInfo.address) customerInfo.address = 'Customer Address';
    if (!customerInfo.phone) customerInfo.phone = 'Customer Phone';
    
    console.log('🔧 [PODataConsistency] 提取的客户信息:', customerInfo);
    
    return customerInfo;
  }
  
  /**
   * 提取运输信息
   */
  private static extractShippingInfo(orderData: any): ShippingInfo {
    const shippingInfo: ShippingInfo = {
      address: '',
      contactName: '',
      phone: '',
      notes: ''
    };
    
    const shippingData = orderData.shippingInfo || 
                        orderData.shipping_address || 
                        orderData.shipping_info;
    
    if (shippingData && typeof shippingData === 'object') {
      shippingInfo.address = shippingData.address || '';
      shippingInfo.contactName = shippingData.name || 
                                shippingData.contactName || 
                                shippingData.contact_name || 
                                shippingData.recipient_name || '';
      shippingInfo.phone = shippingData.phone || 
                          shippingData.contact_phone || '';
      shippingInfo.notes = shippingData.notes || 
                          shippingData.note || '';
    } else if (typeof shippingData === 'string' && shippingData.includes('|')) {
      const parts = shippingData.split('|').map(s => s.trim());
      shippingInfo.address = parts[0] || '';
      shippingInfo.contactName = parts[1] || '';
      shippingInfo.phone = parts[2] || '';
      shippingInfo.notes = parts[3] || '';
    }
    
    console.log('🔧 [PODataConsistency] 提取的运输信息:', shippingInfo);
    
    return shippingInfo;
  }
  
  /**
   * 标准化商品数据
   */
  private static standardizeOrderItems(items: any[]): UnifiedProduct[] {
    if (!Array.isArray(items)) {
      console.warn('🔧 [PODataConsistency] 商品数据不是数组，返回空数组');
      return [];
    }
    
    return items.map((item, index) => {
      console.log(`🔧 [PODataConsistency] 标准化商品 ${index + 1}:`, item);
      
      // 使用ProductDataConverter进行标准化转换
      try {
        const orderProduct = ProductDataConverter.fromOrderItem(item);
        const poProduct = ProductDataConverter.toPOProduct(orderProduct);
        
        // 验证转换结果
        const validation = ProductDataConverter.validateProduct(poProduct);
        if (!validation.isValid) {
          console.warn(`🔧 [PODataConsistency] 商品 ${index + 1} 数据不完整:`, validation.missingFields);
        }
        
        return poProduct;
      } catch (error) {
        console.error(`🔧 [PODataConsistency] 商品 ${index + 1} 转换失败:`, error);
        
        // 提供基本的备用转换
        return {
          id: item.id || item.product_id || `item_${index}`,
          code: item.code || item.part_number || item.sku || '',
          sku: item.sku || item.code || item.part_number || '',
          name: item.name || item.product_name || 'Unknown Product',
          quantity: parseInt(String(item.quantity)) || 1,
          price: parseFloat(String(item.price || item.unit_price)) || 0,
          model: item.model || '',
          spec: item.spec || '',
          specs: item.specs || item.spec || '',
          brand: item.brand || 'Lockedair',
          properties: item.properties || {},
          spec_imperial: item.spec_imperial || ''
        } as UnifiedProduct;
      }
    });
  }
  
  /**
   * 计算订单汇总
   */
  private static calculateOrderSummary(items: UnifiedProduct[], orderData: any): OrderSummary {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // 尝试从原始数据获取总金额，如果没有则使用计算值
    const originalTotal = orderData.total || orderData.total_amount || subtotal;
    
    const summary: OrderSummary = {
      subtotal,
      shipping: 0,
      tax: 0,
      total: originalTotal
    };
    
    console.log('🔧 [PODataConsistency] 计算的订单汇总:', summary);
    
    return summary;
  }
  
  /**
   * 验证PO页面数据与原始OrderList数据的一致性
   */
  static validatePODataConsistency(originalOrder: any, poData: any): PODataConsistencyResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('🔧 [PODataConsistency] 验证PO数据一致性');
    
    // 1. 验证订单号一致性
    const originalOrderNumber = originalOrder.order_number || originalOrder.orderNumber;
    const poOrderNumber = poData.orderNumber;
    
    if (originalOrderNumber !== poOrderNumber) {
      errors.push(`订单号不一致: ${originalOrderNumber} → ${poOrderNumber}`);
    }
    
    // 2. 验证商品数量一致性
    const originalItemsCount = originalOrder.items?.length || 0;
    const poItemsCount = poData.orderItems?.length || 0;
    
    if (originalItemsCount !== poItemsCount) {
      errors.push(`商品数量不一致: ${originalItemsCount} → ${poItemsCount}`);
    }
    
    // 3. 验证总金额一致性
    const originalTotal = originalOrder.total || originalOrder.total_amount || 0;
    const poTotal = poData.summary?.total || 0;
    
    if (Math.abs(originalTotal - poTotal) > 0.01) {
      warnings.push(`总金额可能不一致: ${originalTotal} → ${poTotal}`);
    }
    
    // 4. 验证客户信息完整性
    const customerInfo = poData.customerInfo;
    if (!customerInfo?.companyName || customerInfo.companyName === 'Customer Company') {
      warnings.push('客户公司名称可能使用了默认值');
    }
    
    if (!customerInfo?.contactName || customerInfo.contactName === 'Customer Contact') {
      warnings.push('客户联系人可能使用了默认值');
    }
    
    const isValid = errors.length === 0;
    
    console.log('🔧 [PODataConsistency] 一致性验证结果:', {
      isValid,
      errorsCount: errors.length,
      warningsCount: warnings.length
    });
    
    return {
      isValid,
      errors,
      warnings,
      data: poData
    };
  }
} 