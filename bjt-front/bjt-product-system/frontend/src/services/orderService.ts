import { mockCartItems, defaultShippingInfo, generateMockOrderId } from './mocks/orders.mocks';
import { API_CONFIG } from '../config/appConfig';
import { orderApi } from './api';

// Helper functions from mockService
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const shouldUseMockData = (): boolean => API_CONFIG.USE_MOCK_DATA;
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
 * OrderService - provides methods for order related operations
 * - Works with either mock data or API data based on appConfig settings
 * - Includes methods for getting order history, cart items, shipping info
 * - Methods for calculating order summary and submitting orders
 */
export class OrderService {
  /**
   * Get order history for the current user
   * @param filters Filter and pagination parameters
   * @returns Promise with paginated order list
   */
  async getOrders(filters: OrderListFilters = {}): Promise<ApiResponse<{
    items: Array<any>;
    totalItems: number;
    totalPages: number;
  }>> {
    if (shouldUseMockData()) {
      await delay(800);
      
      // Return mock order history
      return wrapResponse({
        items: [
          {
            id: 'ord-001',
            orderNumber: 'BJT-20231025-001',
            date: '2023-10-25',
            status: 'shipped',
            total: 12500,
            currency: 'CNY',
            items: 3
          },
          {
            id: 'ord-002',
            orderNumber: 'BJT-20230915-002',
            date: '2023-09-15',
            status: 'completed',
            total: 8300,
            currency: 'CNY',
            items: 2
          },
          {
            id: 'ord-003',
            orderNumber: 'BJT-20230730-003',
            date: '2023-07-30',
            status: 'processing',
            total: 15700,
            currency: 'CNY',
            items: 4
          }
        ],
        totalItems: 3,
        totalPages: 1
      });
    }
    
    try {
      // Real API implementation would go here
      // return await api.get('/orders', { params: filters });
      return wrapResponse({
        items: [],
        totalItems: 0,
        totalPages: 0
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Fallback to mock data if API fails
      return this.getOrders(filters);
    }
  }

  /**
   * Get items currently in the cart
   * @returns Promise with cart items
   */
  async getCartItems(): Promise<ApiResponse<any[]>> {
    if (shouldUseMockData()) {
      await delay(300);
      return wrapResponse(mockCartItems);
    }
    
    try {
      // In real implementation, we would fetch from the cart API
      // return await cartApi.getCart();
      return wrapResponse([]);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      // Fallback to mock data
      return wrapResponse(mockCartItems);
    }
  }

  /**
   * Get user's default shipping information
   * @returns Promise with shipping info
   */
  async getDefaultShippingInfo(): Promise<ApiResponse<any>> {
    if (shouldUseMockData()) {
      await delay(200);
      return wrapResponse(defaultShippingInfo);
    }
    
    try {
      // In real implementation, we would fetch from user profile or API
      // return await userApi.getShippingInfo();
      return wrapResponse({});
    } catch (error) {
      console.error("Error fetching shipping info:", error);
      // Fallback to mock data
      return wrapResponse(defaultShippingInfo);
    }
  }

  /**
   * Calculate order summary based on items in cart
   * @returns Promise with order summary including items, subtotal, shipping, tax and total
   */
  async calculateOrderSummary(): Promise<ApiResponse<OrderSummary>> {
    if (shouldUseMockData()) {
      await delay(500);
      return this.mockCalculateOrderSummary();
    }
    
    try {
      // In real implementation, we would call API
      // return await checkoutApi.calculateOrderSummary();
      return this.mockCalculateOrderSummary();
    } catch (error) {
      console.error("Error calculating order summary:", error);
      // Fallback to mock implementation
      return this.mockCalculateOrderSummary();
    }
  }
  
  /**
   * Helper method to calculate mock order summary
   * @returns Mock order summary response
   */
  private async mockCalculateOrderSummary(): Promise<ApiResponse<OrderSummary>> {
    const cartResponse = await this.getCartItems();
    const items = cartResponse.data;
    
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 150; // Free shipping over 5000
    const tax = Math.round(subtotal * 0.13); // 13% tax
    const discount = subtotal > 10000 ? Math.round(subtotal * 0.05) : 0; // 5% discount for orders over 10000
    
    const summary: OrderSummary = {
      items: items.map((item: any) => ({
        id: item.id,
        name: typeof item.name === 'object' ? item.name['zh-CN'] : item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        specs: item.specs
      })),
      subtotal,
      shipping,
      tax,
      discount,
      total: subtotal + shipping + tax - discount,
      currency: 'CNY'
    };
    
    return wrapResponse(summary);
  }

  /**
   * Submit an order with order data
   * @param orderData Order data including shipping info, payment method, etc.
   * @returns Promise with order confirmation
   */
  async submitOrder(orderData: any): Promise<ApiResponse<{ orderId: string }>> {
    if (shouldUseMockData()) {
      await delay(1200);
      // Generate mock order ID
      const orderId = generateMockOrderId();
      return wrapResponse({ orderId });
    }
    
    try {
      // In production, we would call the actual API
      // return await orderApi.submitOrder(orderData);
      return wrapResponse({ orderId: 'api-order-id' });
    } catch (error) {
      console.error("Error submitting order:", error);
      // Return mock order ID as fallback
      return wrapResponse({ orderId: generateMockOrderId() });
    }
  }
  
  /**
   * Cancel an existing order
   * @param orderId ID of the order to cancel
   * @returns Promise with success status
   */
  async cancelOrder(orderId: string): Promise<ApiResponse<{ success: boolean }>> {
    if (shouldUseMockData()) {
      await delay(800);
      return wrapResponse({ success: true });
    }
    
    try {
      // Real API implementation
      // return await orderApi.cancelOrder(orderId);
      return wrapResponse({ success: true });
    } catch (error) {
      console.error("Error canceling order:", error);
      return wrapResponse({ success: false });
    }
  }
  
  /**
   * Export purchase order document
   * @param orderId ID of the order to export
   * @returns Promise with file URL
   */
  async exportPO(orderId: string): Promise<ApiResponse<{ fileUrl: string }>> {
    if (shouldUseMockData()) {
      await delay(1000);
      return wrapResponse({ 
        fileUrl: `/mock-documents/purchase-order-${orderId}.pdf` 
      });
    }
    
    try {
      // Real API implementation
      // return await orderApi.exportPO(orderId);
      return wrapResponse({ fileUrl: '' });
    } catch (error) {
      console.error("Error exporting PO:", error);
      return wrapResponse({ 
        fileUrl: `/mock-documents/purchase-order-${orderId}.pdf` 
      });
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