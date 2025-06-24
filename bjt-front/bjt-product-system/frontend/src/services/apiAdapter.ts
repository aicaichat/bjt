import { OrderNumberManager } from '../utils/orderNumberUtils';

/**
 * API适配器 - 处理前后端数据格式转换和字段映射
 */
export class ApiAdapter {
  
  /**
   * 转换前端订单数据为后端API格式
   */
  static convertOrderToApiFormat(frontendOrderData: any): any {
    console.log('🔧 [ApiAdapter] 转换前端订单数据为API格式:', frontendOrderData);
    
    // 🔧 修复：正确映射地址字段名
    const shippingData = frontendOrderData.shipping || frontendOrderData.customerInfo;
    const billingData = frontendOrderData.billing || frontendOrderData.customerInfo;
    
    // 订单号由后端生成，前端不需要提供
    const apiOrderData = {
      // 🔧 修复：使用正确的后端字段名
      shipping_address: shippingData,
      billing_address: billingData,
      payment_method: frontendOrderData.payment?.method || 'bank_transfer',
      items: frontendOrderData.items?.map((item: any) => {
        // 🔧 修复：正确提取价格字段，支持多种字段名
        const unitPrice = item.unitPrice || item.unit_price || item.price || 0;
        const quantity = item.quantity || 1;
        const lineTotal = item.lineTotal || item.line_total || (unitPrice * quantity);
        
        console.log('🔧 [ApiAdapter] 处理商品:', {
          name: item.name,
          unitPrice,
          quantity,
          lineTotal,
          originalItem: item
        });
        
        return {
          product_id: item.id || item.productId,
          product_type: item.type || 'product',
          part_number: item.code || item.sku || item.part_number,
          name: item.name,
          quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          specs: item.specs || item.properties
        };
      }) || [],
      summary: {
        subtotal: frontendOrderData.summary?.subtotal || 0,
        shipping: frontendOrderData.summary?.shipping || 0,
        tax: frontendOrderData.summary?.tax || 0,
        total: frontendOrderData.summary?.total || 0
      },
      notes: frontendOrderData.note || '',
      cart_region: frontendOrderData.region || 'CN',
      cart_lang: frontendOrderData.language || 'zh'
    };
    
    console.log('🔧 [ApiAdapter] 转换后的API格式:', apiOrderData);
    console.log('🔧 [ApiAdapter] 地址数据:', {
      shipping_address: apiOrderData.shipping_address,
      billing_address: apiOrderData.billing_address
    });
    return apiOrderData;
  }
  
  /**
   * 转换后端API响应为前端格式
   */
  static convertApiResponseToFrontend(apiResponse: any): any {
    console.log('🔧 [ApiAdapter] 转换API响应为前端格式:', apiResponse);
    
    // 处理订单号字段映射
    const orderInfo = OrderNumberManager.extractFromApiResponse(apiResponse);
    
    const frontendData = {
      id: apiResponse.data?.id || apiResponse.id,
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber, // 前端统一使用 orderNumber
      status: apiResponse.data?.status || apiResponse.status,
      total: apiResponse.data?.total_amount || apiResponse.total,
      createdAt: apiResponse.data?.created_at || apiResponse.created_at,
      // 处理运输信息
      shippingInfo: this.convertShippingInfo(apiResponse.data?.shipping_info || apiResponse.shipping_info),
      // 处理订单项目
      items: this.convertOrderItems(apiResponse.data?.items || apiResponse.items || [])
    };
    
    console.log('🔧 [ApiAdapter] 转换后的前端格式:', frontendData);
    return frontendData;
  }
  
  /**
   * 转换运输信息格式
   */
  private static convertShippingInfo(apiShippingInfo: any): any {
    if (!apiShippingInfo) return null;
    
    return {
      companyName: apiShippingInfo.company_name || apiShippingInfo.companyName,
      contactName: apiShippingInfo.contact_name || apiShippingInfo.contactName,
      address: apiShippingInfo.address,
      phone: apiShippingInfo.phone,
      email: apiShippingInfo.email,
      country: apiShippingInfo.country,
      notes: apiShippingInfo.notes
    };
  }
  
  /**
   * 转换订单项目格式
   */
  private static convertOrderItems(apiItems: any[]): any[] {
    if (!Array.isArray(apiItems)) return [];
    
    return apiItems.map(item => ({
      id: item.id || item.product_id,
      code: item.part_number || item.code,
      sku: item.part_number || item.sku,
      name: item.name,
      name_zh: item.name_zh,          // 🔑 中文名称（后端已提供）
      name_en: item.name_en,          // 🔑 英文名称（后端已提供）
      quantity: item.quantity,
      price: item.unit_price || item.price,
      total: item.line_total || ((item.unit_price || item.price) * item.quantity),
      specs: item.specs || item.properties,
      type: item.product_type || 'product'
    }));
  }
  
  /**
   * 处理API错误响应
   */
  static handleApiError(error: any): Error {
    console.error('🔧 [ApiAdapter] 处理API错误:', error);
    
    if (error.response) {
      // HTTP错误响应
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 401:
          return new Error('认证失败，请重新登录');
        case 403:
          return new Error('权限不足，无法执行此操作');
        case 404:
          return new Error('请求的资源不存在');
        case 422:
          return new Error(`数据验证失败: ${message}`);
        case 500:
          return new Error('服务器内部错误，请稍后重试');
        default:
          return new Error(`请求失败: ${message}`);
      }
    } else if (error.request) {
      // 网络错误
      return new Error('网络连接失败，请检查网络连接');
    } else {
      // 其他错误
      return new Error(error.message || '未知错误');
    }
  }
  
  /**
   * 验证API响应格式
   */
  static validateApiResponse(response: any): boolean {
    console.log('🔧 [ApiAdapter] 验证API响应格式:', response);
    
    // 检查基本响应结构
    if (!response) {
      console.error('❌ [ApiAdapter] 响应为空');
      return false;
    }
    
    // 检查是否有数据字段
    if (!response.data && !response.id) {
      console.warn('⚠️ [ApiAdapter] 响应缺少数据字段');
    }
    
    return true;
  }
}

/**
 * 增强的订单服务适配器
 */
export class OrderApiAdapter extends ApiAdapter {
  
  /**
   * 提交订单到后端API
   */
  static async submitOrder(orderData: any): Promise<any> {
    console.log('🔧 [OrderApiAdapter] 提交订单到后端API');
    console.log('🔧 [OrderApiAdapter] 原始订单数据:', orderData);
    
    try {
      // 转换为API格式
      const apiOrderData = this.convertOrderToApiFormat(orderData);
      console.log('🔧 [OrderApiAdapter] 转换后的API数据:', apiOrderData);
      
      // 获取认证token
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      console.log('🔧 [OrderApiAdapter] 使用认证token:', token ? '存在' : '不存在');
      
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1'}/orders`;
      console.log('🔧 [OrderApiAdapter] API URL:', apiUrl);
      console.log('🔧 [OrderApiAdapter] 发送的请求体:', JSON.stringify(apiOrderData, null, 2));
      
      // 调用API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiOrderData)
      });
      
      console.log('🔧 [OrderApiAdapter] 响应状态:', response.status, response.statusText);
      
      // 读取响应内容
      const responseText = await response.text();
      console.log('🔧 [OrderApiAdapter] 原始响应内容:', responseText);
      
      if (!response.ok) {
        console.error('❌ [OrderApiAdapter] API请求失败');
        console.error('❌ 状态码:', response.status);
        console.error('❌ 状态文本:', response.statusText);
        console.error('❌ 响应内容:', responseText);
        
        // 尝试解析错误响应
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          console.error('❌ 解析后的错误数据:', errorData);
        } catch (parseError) {
          console.error('❌ 无法解析错误响应为JSON:', parseError);
        }
        
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      // 解析成功响应
      let apiResponse;
      try {
        apiResponse = JSON.parse(responseText);
        console.log('✅ [OrderApiAdapter] 解析后的API响应:', apiResponse);
      } catch (parseError) {
        console.error('❌ [OrderApiAdapter] 无法解析成功响应为JSON:', parseError);
        throw new Error('API响应格式无效');
      }
      
      // 验证响应
      if (!this.validateApiResponse(apiResponse)) {
        throw new Error('API响应格式无效');
      }
      
      // 转换为前端格式
      const frontendResult = this.convertApiResponseToFrontend(apiResponse);
      console.log('✅ [OrderApiAdapter] 最终返回的前端格式:', frontendResult);
      return frontendResult;
      
    } catch (error) {
      console.error('❌ [OrderApiAdapter] 订单提交过程中发生错误:', error);
      throw this.handleApiError(error);
    }
  }
  
  /**
   * 获取订单列表
   */
  static async getOrders(filters: any = {}): Promise<any> {
    console.log('🔧 [OrderApiAdapter] 获取订单列表');
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key].toString());
        }
      });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1'}/orders?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const apiResponse = await response.json();
      
      // 转换订单列表
      const orders = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      const convertedOrders = orders.map(order => this.convertApiResponseToFrontend({ data: order }));
      
      return {
        items: convertedOrders,
        total: apiResponse.total || orders.length,
        totalPages: apiResponse.total_pages || 1
      };
      
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

export default ApiAdapter; 