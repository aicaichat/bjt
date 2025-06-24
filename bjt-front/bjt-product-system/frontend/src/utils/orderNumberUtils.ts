/**
 * 订单号统一管理工具
 * 订单号完全由后端API生成，前端只负责接收、处理和显示
 */

import { ORDER_CONFIG, OrderNumberValidator } from '../config/orderConfig';

export interface OrderNumberInfo {
  orderId: string;
  orderNumber: string;
  displayNumber: string;
  source: 'api' | 'unknown';
}

/**
 * 统一订单号管理器
 * 只处理后端返回的订单号，不生成订单号
 */
export class OrderNumberManager {
  
  /**
   * 从API响应中提取订单号信息
   * 使用严格验证，如果API没有返回有效订单号，抛出错误
   */
  static extractFromApiResponse(apiResponse: any): OrderNumberInfo {
    console.log('🔧 [OrderNumberManager] 从API响应提取订单号:', apiResponse);
    
    try {
      const { orderId, orderNumber } = OrderNumberValidator.extractFromApiResponse(apiResponse);
      
      const result: OrderNumberInfo = {
        orderId,
        orderNumber,
        displayNumber: orderNumber,
        source: 'api'
      };

      console.log('🔧 [OrderNumberManager] 提取结果:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderNumberManager] API响应提取失败:', error);
      throw error;
    }
  }

  /**
   * 从订单对象中提取订单号信息
   * 使用严格验证，确保数据完整性
   */
  static extractFromOrderObject(order: any): OrderNumberInfo {
    console.log('🔧 [OrderNumberManager] 从订单对象提取订单号:', order);
    
    if (!order || typeof order !== 'object') {
      throw new Error('订单对象无效');
    }
    
    // 使用配置的字段映射
    const orderNumber = order.orderNumber || order.order_number;
    const orderId = order.id || order.orderId || order.order_id;
    
    if (!orderId) {
      throw new Error(ORDER_CONFIG.ERROR_MESSAGES.MISSING_ORDER_ID);
    }
    
    if (!orderNumber) {
      throw new Error(ORDER_CONFIG.ERROR_MESSAGES.MISSING_ORDER_NUMBER);
    }
    
    // 验证订单号格式
    const validation = OrderNumberValidator.validate(orderNumber);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const result: OrderNumberInfo = {
      orderId: String(orderId),
      orderNumber: String(orderNumber),
      displayNumber: String(orderNumber),
      source: 'api'
    };

    console.log('🔧 [OrderNumberManager] 提取结果:', result);
    return result;
  }

  /**
   * 创建统一的订单数据结构
   * 订单号必须来自API响应或订单对象
   */
  static createUnifiedOrderData(params: {
    apiResponse?: any;
    orderObject?: any;
    orderItems: any[];
    customerInfo: any;
    shippingInfo: any;
    summary: any;
    source: string;
  }): any {
    const { apiResponse, orderObject, orderItems, customerInfo, shippingInfo, summary, source } = params;
   
    // 提取订单号信息
    let orderInfo: OrderNumberInfo;
    if (apiResponse) {
      orderInfo = this.extractFromApiResponse(apiResponse);
    } else if (orderObject) {
      orderInfo = this.extractFromOrderObject(orderObject);
    } else {
      throw new Error('必须提供 apiResponse 或 orderObject 来获取订单号。' + 
                     ORDER_CONFIG.ERROR_MESSAGES.FRONTEND_GENERATION_FORBIDDEN);
    }

    console.log('🔧 [OrderNumberManager] 创建统一订单数据:', {
      orderInfo,
      itemsCount: orderItems?.length || 0,
      source
    });

    return {
      id: orderInfo.orderId,
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      displayNumber: orderInfo.displayNumber,
      orderItems: orderItems || [],
      customerInfo: customerInfo || {},
      shippingInfo: shippingInfo || {},
      summary: summary || { subtotal: 0, shipping: 0, tax: 0, total: 0 },
      createdAt: new Date().toISOString(),
      source,
      orderNumberSource: orderInfo.source
    };
  }

  /**
   * 验证订单号格式
   */
  static validateOrderNumber(orderNumber: string): boolean {
    return OrderNumberValidator.validate(orderNumber).valid;
  }
  
  /**
   * 获取订单号格式说明
   */
  static getOrderNumberFormat(): string {
    return ORDER_CONFIG.ORDER_NUMBER.DESCRIPTION;
  }
}

// 导出便捷函数
export const extractOrderInfo = (data: any) => OrderNumberManager.extractFromApiResponse(data);
export const validateOrderNumber = (orderNumber: string) => OrderNumberManager.validateOrderNumber(orderNumber);
export const formatOrderNumber = (orderNumber: string): string => {
  if (!orderNumber) {
    return 'N/A';
  }
  return orderNumber;
}; 