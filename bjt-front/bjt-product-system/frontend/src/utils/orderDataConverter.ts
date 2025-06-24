import { 
  UnifiedOrderData, 
  OrderApiResponse, 
  OrderListItem, 
  POPageData, 
  ExcelExportData,
  CustomerInfo,
  OrderItem,
  OrderSummary,
  OrderStatus,
  ProductType,
  PageTransferData
} from '../types/orderTypes';
import { OrderNumberManager } from './orderNumberUtils';

/**
 * 订单数据转换器
 * 负责在不同页面和数据格式之间进行统一转换
 */
export class OrderDataConverter {
  
  /**
   * 将API响应转换为统一订单数据格式
   */
  static fromApiResponse(apiResponse: OrderApiResponse): UnifiedOrderData {
    console.log('🔧 [OrderDataConverter] 转换API响应为统一格式:', apiResponse);
    
    const orderInfo = OrderNumberManager.extractFromApiResponse(apiResponse);
    
    // 解析地址信息
    const shippingAddress = this.parseAddressJson(apiResponse.data.shipping_address);
    const billingAddress = this.parseAddressJson(apiResponse.data.billing_address);
    
    // 转换订单项目
    const items = this.convertApiItemsToOrderItems(apiResponse.data.items || []);
    
    // 计算汇总信息
    const summary = this.calculateSummaryFromItems(items, apiResponse.data.currency);
    
    const unifiedData: UnifiedOrderData = {
      // 基础信息
      id: apiResponse.data.id,
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      status: this.mapApiStatusToOrderStatus(apiResponse.data.status),
      createdAt: apiResponse.data.created_at,
      updatedAt: apiResponse.data.updated_at,
      
      // 客户信息（优先使用运输地址）
      customerInfo: shippingAddress || this.createEmptyCustomerInfo(),
      
      // 订单项目和汇总
      items,
      summary,
      
      // 扩展信息
      paymentMethod: apiResponse.data.payment_method,
      shippingAddress,
      billingAddress,
      region: 'CN', // 默认区域
      language: 'zh' // 默认语言
    };
    
    console.log('✅ [OrderDataConverter] 转换完成:', unifiedData);
    return unifiedData;
  }
  
  /**
   * 将统一订单数据转换为API请求格式
   */
  static toApiRequest(orderData: UnifiedOrderData): any {
    console.log('🔧 [OrderDataConverter] 转换统一格式为API请求:', orderData);
    
    const apiRequest = {
      order_number: orderData.orderNumber,
      shipping_address: JSON.stringify(orderData.shippingAddress || orderData.customerInfo),
      billing_address: JSON.stringify(orderData.billingAddress || orderData.customerInfo),
      payment_method: orderData.paymentMethod || 'bank_transfer',
      items: orderData.items.map(item => ({
        product_id: item.productId,
        product_type: item.type,
        part_number: item.code,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal
      })),
      summary: orderData.summary,
      notes: orderData.notes || '',
      cart_region: orderData.region || 'CN',
      cart_lang: orderData.language || 'zh'
    };
    
    console.log('✅ [OrderDataConverter] API请求格式:', apiRequest);
    return apiRequest;
  }
  
  /**
   * 将统一订单数据转换为订单列表项
   */
  static toOrderListItem(orderData: UnifiedOrderData): OrderListItem {
    return {
      id: orderData.id,
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      customerName: orderData.customerInfo.companyName || orderData.customerInfo.contactName,
      totalAmount: orderData.summary.total,
      currency: orderData.summary.currency,
      itemCount: orderData.items.length,
      lastUpdated: orderData.updatedAt || orderData.createdAt
    };
  }
  
  /**
   * 将统一订单数据转换为PO页面数据
   */
  static toPOPageData(orderData: UnifiedOrderData, options: {
    showPrices?: boolean;
    showImages?: boolean;
    language?: 'zh' | 'en';
  } = {}): POPageData {
    return {
      ...orderData,
      poNumber: orderData.orderNumber, // PO号等同于订单号
      generatedAt: new Date().toISOString(),
      validUntil: this.calculateValidUntil(orderData.createdAt),
      terms: '付款条件：30天内付款',
      showPrices: options.showPrices ?? true,
      showImages: options.showImages ?? true,
      language: options.language ?? 'zh'
    };
  }
  
  /**
   * 将统一订单数据转换为Excel导出数据
   */
  static toExcelExportData(orderData: UnifiedOrderData, exportedBy?: string): ExcelExportData {
    return {
      orderInfo: {
        id: orderData.id,
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        status: orderData.status,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt
      },
      customerInfo: orderData.customerInfo,
      items: orderData.items,
      summary: orderData.summary,
      exportedAt: new Date().toISOString(),
      exportedBy
    };
  }
  
  /**
   * 创建页面间传递数据
   */
  static createPageTransferData(
    source: 'order' | 'orderlist' | 'po',
    orderData: UnifiedOrderData,
    context?: Record<string, any>
  ): PageTransferData {
    return {
      source,
      orderData,
      timestamp: new Date().toISOString(),
      context
    };
  }
  
  /**
   * 从页面传递数据中提取订单数据
   */
  static fromPageTransferData(transferData: PageTransferData): UnifiedOrderData {
    // 验证数据完整性
    this.validateOrderData(transferData.orderData);
    return transferData.orderData;
  }
  
  /**
   * 合并订单数据（用于数据更新）
   */
  static mergeOrderData(baseData: UnifiedOrderData, updateData: Partial<UnifiedOrderData>): UnifiedOrderData {
    return {
      ...baseData,
      ...updateData,
      // 特殊处理嵌套对象
      customerInfo: updateData.customerInfo ? 
        { ...baseData.customerInfo, ...updateData.customerInfo } : 
        baseData.customerInfo,
      summary: updateData.summary ? 
        { ...baseData.summary, ...updateData.summary } : 
        baseData.summary,
      items: updateData.items || baseData.items,
      updatedAt: new Date().toISOString()
    };
  }
  
  // === 私有辅助方法 ===
  
  /**
   * 解析地址JSON字符串
   */
  private static parseAddressJson(addressJson?: string): CustomerInfo | null {
    if (!addressJson) return null;
    
    try {
      const parsed = JSON.parse(addressJson);
      return {
        companyName: parsed.companyName || parsed.company_name || '',
        contactName: parsed.contactName || parsed.contact_name || '',
        address: parsed.address || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
        country: parsed.country || '',
        notes: parsed.notes || ''
      };
    } catch (error) {
      console.warn('⚠️ [OrderDataConverter] 解析地址JSON失败:', error);
      return null;
    }
  }
  
  /**
   * 转换API订单项目为统一格式
   */
  private static convertApiItemsToOrderItems(apiItems: any[]): OrderItem[] {
    return apiItems.map(item => {
      // 🔧 修复：为model字段提供默认值处理
      const model = item.model || item.app_model || item.name || item.item_name || '-';
      
      // 🔧 修复：为brand字段提供默认值处理
      const brand = item.brand || 'Lockedair';
      
      // 🔧 修复：为spec字段提供更好的默认值处理
      const spec = item.spec || item.description || item.specs || '';
      
      console.log('🔧 [OrderDataConverter] 处理订单项目字段:', {
        itemId: item.id || item.order_item_id,
        原始model: item.model,
        原始brand: item.brand,
        原始spec: item.spec,
        处理后model: model,
        处理后brand: brand,
        处理后spec: spec
      });
      
      return {
        id: item.id || item.order_item_id,
        productId: item.product_id || item.target_id,
        code: item.part_number || item.item_id,
        sku: item.part_number || item.item_id,
        name: item.name || item.item_name,
        nameZh: item.name_zh,
        nameEn: item.name_en,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unit_price || item.price) || 0,
        lineTotal: parseFloat(item.line_total || item.price * item.quantity) || 0,
        currency: item.currency || 'CNY',
        specs: item.specs || item.properties || {},
        properties: item.properties || {},
        image: item.image,
        type: this.mapApiProductType(item.product_type || item.item_type),
        model: model,
        brand: brand,
        description: spec,
        category: item.category
      };
    });
  }
  
  /**
   * 从订单项目计算汇总信息
   */
  private static calculateSummaryFromItems(items: OrderItem[], currency = 'CNY'): OrderSummary {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = 0; // 暂时设为0，后续可根据业务需求计算
    const tax = subtotal * 0.13; // 假设13%税率
    const total = subtotal + shipping + tax;
    
    return {
      subtotal,
      shipping,
      tax,
      total,
      currency
    };
  }
  
  /**
   * 映射API状态到订单状态枚举
   */
  private static mapApiStatusToOrderStatus(apiStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'pending_payment': OrderStatus.PENDING_PAYMENT,
      'processing': OrderStatus.PROCESSING,
      'shipped': OrderStatus.SHIPPED,
      'completed': OrderStatus.COMPLETED,
      'cancelled': OrderStatus.CANCELLED,
      'refunded': OrderStatus.REFUNDED,
      'failed': OrderStatus.FAILED
    };
    
    return statusMap[apiStatus] || OrderStatus.PENDING_PAYMENT;
  }
  
  /**
   * 映射API产品类型
   */
  private static mapApiProductType(apiType: string): ProductType {
    const typeMap: Record<string, ProductType> = {
      'machine': ProductType.MACHINE,
      'host': ProductType.MACHINE,
      'spare_part': ProductType.SPARE_PART,
      'accessory': ProductType.ACCESSORY,
      'consumable': ProductType.CONSUMABLE
    };
    
    return typeMap[apiType] || ProductType.MACHINE;
  }
  
  /**
   * 创建空的客户信息
   */
  private static createEmptyCustomerInfo(): CustomerInfo {
    return {
      companyName: '',
      contactName: '',
      address: '',
      phone: '',
      email: '',
      country: '',
      notes: ''
    };
  }
  
  /**
   * 计算有效期（默认30天）
   */
  private static calculateValidUntil(createdAt: string): string {
    const created = new Date(createdAt);
    const validUntil = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后
    return validUntil.toISOString().split('T')[0]; // 返回YYYY-MM-DD格式
  }
  
  /**
   * 验证订单数据完整性
   */
  private static validateOrderData(orderData: UnifiedOrderData): void {
    if (!orderData.orderNumber) {
      throw new Error('订单号不能为空');
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('订单项目不能为空');
    }
    
    if (!orderData.customerInfo.companyName && !orderData.customerInfo.contactName) {
      throw new Error('客户信息不完整');
    }
  }
}

export default OrderDataConverter; 