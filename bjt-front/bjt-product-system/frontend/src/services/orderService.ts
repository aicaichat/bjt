import { API_CONFIG } from '../config/appConfig';
import { OrderApiAdapter } from './apiAdapter';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const wrapResponse = <T>(data: T, meta = {}) => {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      status: 'success',
      ...meta
    }
  };
};

/**
 * OrderSummary interface - defines the structure of order summary data
 */
export interface OrderSummary {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    specs?: Record<string, string>;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  currency: string;
}

/**
 * OrderListFilters interface - defines possible filters for order list
 */
export interface OrderListFilters {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 订单服务类 - 完全使用API适配器确保前后端字段映射正确
 */
export class OrderService {
  
  /**
   * Get list of orders with filters - 使用API适配器
   */
  async getOrders(filters: OrderListFilters = {}): Promise<ApiResponse<{
    items: Array<any>;
    totalItems: number;
    totalPages: number;
  }>> {
    try {
      console.log('🔧 [OrderService] 使用API适配器获取订单列表:', filters);
      
      // 使用API适配器
      const result = await OrderApiAdapter.getOrders(filters);
      
      return wrapResponse({
        items: result.items,
        totalItems: result.total,
        totalPages: result.totalPages
      });
      
    } catch (error) {
      console.error("❌ [OrderService] 获取订单列表失败:", error);
      throw error;
    }
  }

  /**
   * Get cart items - 使用API适配器
   */
  async getCartItems(): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔧 [OrderService] 使用API适配器获取购物车...');
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      
      // 调用购物车API
      const response = await fetch(`${API_CONFIG.BASE_URL}/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取购物车失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [OrderService] 成功获取购物车:', data);
      
      const cartItems = data.success ? data.data : (Array.isArray(data) ? data : []);
      return wrapResponse(cartItems);
      
    } catch (error) {
      console.error("❌ [OrderService] 获取购物车失败:", error);
      throw error;
    }
  }

  /**
   * Get user's default shipping information - 使用API适配器
   */
  async getDefaultShippingInfo(): Promise<ApiResponse<any>> {
    try {
      console.log('🔧 [OrderService] 使用API适配器获取运输信息...');
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/shipping-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取运输信息失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [OrderService] 成功获取运输信息:', data);
      
      return wrapResponse(data.success ? data.data : data);
      
    } catch (error) {
      console.error("❌ [OrderService] 获取运输信息失败:", error);
      throw error;
    }
  }

  /**
   * Calculate order summary - 使用API适配器
   */
  async calculateOrderSummary(): Promise<ApiResponse<OrderSummary>> {
    try {
      console.log('🔧 [OrderService] 使用API适配器计算订单汇总...');
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/checkout/calculate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`计算订单汇总失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [OrderService] 成功计算订单汇总:', data);
      
      return wrapResponse(data.success ? data.data : data);
      
    } catch (error) {
      console.error("❌ [OrderService] 计算订单汇总失败:", error);
      throw error;
    }
  }

  /**
   * Submit an order - 使用API适配器
   */
  async submitOrder(orderData: any): Promise<ApiResponse<{ orderId: string; orderNumber: string }>> {
    console.log('🔧 [OrderService] 使用API适配器提交订单:', orderData);
    
    try {
      // 使用API适配器提交订单
      const result = await OrderApiAdapter.submitOrder(orderData);
      
      console.log('✅ [OrderService] 订单提交成功:', result);
      
      return wrapResponse({ 
        orderId: result.id || result.orderId,
        orderNumber: result.orderNumber
      });
      
    } catch (error) {
      console.error("❌ [OrderService] 订单提交失败:", error);
      throw error;
    }
  }
  
  /**
   * Cancel an existing order - 使用API适配器
   */
  async cancelOrder(orderId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      console.log('🔧 [OrderService] 使用API适配器取消订单:', orderId);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`取消订单失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [OrderService] 成功取消订单:', data);
      
      return wrapResponse({ success: data.success || true });
      
    } catch (error) {
      console.error("❌ [OrderService] 取消订单失败:", error);
      throw error;
    }
  }
  
  /**
   * Export purchase order document - 使用API适配器
   */
  async exportPO(orderId: string): Promise<ApiResponse<{ fileUrl: string }>> {
    try {
      console.log('🔧 [OrderService] 使用API适配器导出PO:', orderId);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('缺少认证token');
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/export`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`导出PO失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [OrderService] 成功导出PO:', data);
      
      return wrapResponse({ 
        fileUrl: data.success ? data.data?.fileUrl : data.fileUrl 
      });
      
    } catch (error) {
      console.error("❌ [OrderService] 导出PO失败:", error);
      throw error;
    }
  }
}

// Define ApiResponse interface
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    status: string;
    [key: string]: any;
  };
}

// Export order service instance
export default new OrderService();