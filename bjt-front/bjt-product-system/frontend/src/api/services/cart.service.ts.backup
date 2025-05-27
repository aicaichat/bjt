import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';
import { API_CONFIG } from '../../config/appConfig';

// 购物车项目模拟数据
const mockCartItems: CartItem[] = [
  {
    item_id: 1,
    product_type: 'machine',
    product_id: 1,
    part_number: 'MEY-001',
    quantity: 1,
    name: '气垫机 Pro - MEY系列',
    image_url: '/images/machines/MEY-001.jpg',
    unit_price: 15999.00,
    currency: 'CNY',
    line_total: 15999.00,
    inventory_status: 'in_stock',
    added_at: new Date().toISOString()
  },
  {
    item_id: 2,
    product_type: 'accessory',
    product_id: 1,
    part_number: 'ACC-2023',
    quantity: 2,
    name: '高压喷头',
    image_url: '/images/accessories/nozzle.jpg',
    unit_price: 199.00,
    currency: 'CNY',
    line_total: 398.00,
    inventory_status: 'in_stock',
    added_at: new Date().toISOString()
  }
];

// 购物车项目接口
export interface CartItem {
  item_id: number;
  product_type: 'machine' | 'accessory' | 'spare_part' | 'consumable';
  product_id: number;
  part_number: string;
  quantity: number;
  name: string;
  image_url?: string;
  unit_price: number;
  currency: string;
  line_total: number;
  inventory_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  added_at: string;
  properties?: Record<string, any>;
}

// 添加到购物车请求接口
export interface AddToCartRequest {
  product_type: 'machine' | 'accessory' | 'spare_part' | 'consumable';
  product_id: number;
  quantity: number;
  properties?: Record<string, any>;
}

// 更新购物车项目请求接口
export interface UpdateCartItemRequest {
  quantity: number;
}

// 购物车响应接口
export interface CartResponse {
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  cart_total: number;
  currency: string;
}

// 购物车服务类
export class CartService extends BaseService<CartResponse> {
  private useMockCart: boolean;
  
  constructor() {
    super('/cart');
    this.useMockCart = import.meta.env.VITE_USE_MOCK_CART === 'true';
  }

  /**
   * 获取购物车内容
   * @param params 查询参数
   */
  async getCart(params: {
    region?: string;
    lang?: string;
  } = {}): Promise<CartResponse> {
    if (this.useMockCart) {
      return this.getMockData(params);
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found, using mock data instead');
      return this.getMockData(params);
    }
    
    try {
      return this.getData('', params);
    } catch (error) {
      console.error('Error fetching cart data:', error);
      return this.getMockData(params);
    }
  }

  /**
   * 添加商品到购物车
   * @param data 添加商品请求数据
   */
  async addToCart(data: AddToCartRequest): Promise<CartItem> {
    if (this.useMockCart) {
      await delay(300);
      
      const newItemId = Math.max(...mockCartItems.map(item => item.item_id), 0) + 1;
      const mockItem: CartItem = {
        item_id: newItemId,
        product_type: data.product_type,
        product_id: data.product_id,
        part_number: `MOCK-${data.product_type}-${data.product_id}`,
        quantity: data.quantity,
        name: `模拟${data.product_type === 'machine' ? '设备' : 
               data.product_type === 'accessory' ? '配件' : 
               data.product_type === 'spare_part' ? '备件' : '耗材'}`,
        image_url: `/images/${data.product_type}s/mock.jpg`,
        unit_price: 999.00,
        currency: 'CNY',
        line_total: 999.00 * data.quantity,
        inventory_status: 'in_stock',
        added_at: new Date().toISOString(),
        properties: data.properties
      };
      
      return mockItem;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found, using mock data for addToCart');
      return this.addToCartMock(data);
    }
    
    try {
      const response = await ApiService.post(this.getApiPath('/items'), data);
      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return this.addToCartMock(data);
    }
  }

  /**
   * 模拟添加商品到购物车
   * @param data 添加商品请求数据
   */
  private async addToCartMock(data: AddToCartRequest): Promise<CartItem> {
    await delay(300);
    
    const newItemId = Math.max(...mockCartItems.map(item => item.item_id), 0) + 1;
    const mockItem: CartItem = {
      item_id: newItemId,
      product_type: data.product_type,
      product_id: data.product_id,
      part_number: `MOCK-${data.product_type}-${data.product_id}`,
      quantity: data.quantity,
      name: `模拟${data.product_type === 'machine' ? '设备' : 
             data.product_type === 'accessory' ? '配件' : 
             data.product_type === 'spare_part' ? '备件' : '耗材'}`,
      image_url: `/images/${data.product_type}s/mock.jpg`,
      unit_price: 999.00,
      currency: 'CNY',
      line_total: 999.00 * data.quantity,
      inventory_status: 'in_stock',
      added_at: new Date().toISOString(),
      properties: data.properties
    };
    
    return mockItem;
  }

  /**
   * 更新购物车项目
   * @param itemId 购物车项目ID
   * @param data 更新项目请求数据
   */
  async updateCartItem(itemId: number, data: UpdateCartItemRequest): Promise<CartItem> {
    if (this.useMockCart) {
      await delay(300);
      
      const itemIndex = mockCartItems.findIndex(item => item.item_id === itemId);
      if (itemIndex === -1) {
        throw new Error(`购物车项目 ${itemId} 不存在`);
      }
      
      const updatedItem = {
        ...mockCartItems[itemIndex],
        quantity: data.quantity,
        line_total: mockCartItems[itemIndex].unit_price * data.quantity
      };
      
      return updatedItem;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found, using mock data for updateCartItem');
      return this.updateCartItemMock(itemId, data);
    }
    
    try {
      const response = await ApiService.put(this.getApiPath(`/items/${itemId}`), data);
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return this.updateCartItemMock(itemId, data);
    }
  }

  /**
   * 模拟更新购物车项目
   * @param itemId 购物车项目ID
   * @param data 更新项目请求数据
   */
  private async updateCartItemMock(itemId: number, data: UpdateCartItemRequest): Promise<CartItem> {
    await delay(300);
    
    const itemIndex = mockCartItems.findIndex(item => item.item_id === itemId);
    if (itemIndex === -1) {
      throw new Error(`购物车项目 ${itemId} 不存在`);
    }
    
    const updatedItem = {
      ...mockCartItems[itemIndex],
      quantity: data.quantity,
      line_total: mockCartItems[itemIndex].unit_price * data.quantity
    };
    
    return updatedItem;
  }

  /**
   * 删除购物车项目
   * @param itemId 购物车项目ID
   */
  async removeCartItem(itemId: number): Promise<{ deleted: boolean; previous: CartItem }> {
    if (this.useMockCart) {
      await delay(300);
      
      const itemIndex = mockCartItems.findIndex(item => item.item_id === itemId);
      if (itemIndex === -1) {
        throw new Error(`购物车项目 ${itemId} 不存在`);
      }
      
      const deletedItem = mockCartItems[itemIndex];
      
      return {
        deleted: true,
        previous: deletedItem
      };
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found, using mock data for removeCartItem');
      return this.removeCartItemMock(itemId);
    }
    
    try {
      const response = await ApiService.delete(this.getApiPath(`/items/${itemId}`));
      return response.data;
    } catch (error) {
      console.error('Error removing cart item:', error);
      return this.removeCartItemMock(itemId);
    }
  }

  /**
   * 模拟删除购物车项目
   * @param itemId 购物车项目ID
   */
  private async removeCartItemMock(itemId: number): Promise<{ deleted: boolean; previous: CartItem }> {
    await delay(300);
    
    const itemIndex = mockCartItems.findIndex(item => item.item_id === itemId);
    if (itemIndex === -1) {
      throw new Error(`购物车项目 ${itemId} 不存在`);
    }
    
    const deletedItem = mockCartItems[itemIndex];
    
    return {
      deleted: true,
      previous: deletedItem
    };
  }

  /**
   * 清空购物车
   */
  async clearCart(): Promise<{ cleared: boolean; deleted_count: number }> {
    if (this.useMockCart) {
      await delay(300);
      
      return {
        cleared: true,
        deleted_count: mockCartItems.length
      };
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found, using mock data for clearCart');
      return this.clearCartMock();
    }
    
    try {
      const response = await ApiService.post(this.getApiPath('/clear'));
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return this.clearCartMock();
    }
  }

  /**
   * 模拟清空购物车
   */
  private async clearCartMock(): Promise<{ cleared: boolean; deleted_count: number }> {
    await delay(300);
    
    return {
      cleared: true,
      deleted_count: mockCartItems.length
    };
  }

  /**
   * 获取购物车摘要信息
   */
  async getCartSummary(): Promise<{
    item_count: number;
    total_quantity: number;
    cart_total: number;
    currency: string;
  }> {
    if (this.useMockCart) {
      await delay(300);
      
      const totalQuantity = mockCartItems.reduce((sum, item) => sum + item.quantity, 0);
      const cartTotal = mockCartItems.reduce((sum, item) => sum + item.line_total, 0);
      
      return {
        item_count: mockCartItems.length,
        total_quantity: totalQuantity,
        cart_total: cartTotal,
        currency: 'CNY'
      };
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found, using mock data for getCartSummary');
      return this.getCartSummaryMock();
    }
    
    try {
      const response = await ApiService.get(this.getApiPath('/summary'));
      return response.data;
    } catch (error) {
      console.error('Error getting cart summary:', error);
      return this.getCartSummaryMock();
    }
  }

  /**
   * 模拟获取购物车摘要信息
   */
  private async getCartSummaryMock(): Promise<{
    item_count: number;
    total_quantity: number;
    cart_total: number;
    currency: string;
  }> {
    await delay(300);
    
    const totalQuantity = mockCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = mockCartItems.reduce((sum, item) => sum + item.line_total, 0);
    
    return {
      item_count: mockCartItems.length,
      total_quantity: totalQuantity,
      cart_total: cartTotal,
      currency: 'CNY'
    };
  }

  /**
   * 实现抽象方法：获取模拟数据
   */
  protected async getMockData(params?: Record<string, any>): Promise<CartResponse> {
    await delay(300);
    
    const totalQuantity = mockCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = mockCartItems.reduce((sum, item) => sum + item.line_total, 0);
    
    return {
      items: [...mockCartItems],
      item_count: mockCartItems.length,
      total_quantity: totalQuantity,
      cart_total: cartTotal,
      currency: 'CNY'
    };
  }
}

// 导出购物车服务实例
export default new CartService(); 