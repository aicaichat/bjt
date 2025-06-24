import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';
import { API_CONFIG } from '../../config/appConfig';

// 购物车项目模拟数据 - 改为可变数组
let mockCartItems: CartItem[] = [
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
  part_number?: string;
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
    // 默认使用真实API，除非明确设置为mock
    this.useMockCart = import.meta.env.VITE_USE_MOCK_CART === 'true';
    console.log('🛒 [CartService] Initialized with useMockCart:', this.useMockCart);
  }

  /**
   * 获取购物车内容
   * @param params 查询参数
   */
  async getCart(params: {
    region?: string;
    lang?: string;
  } = {}): Promise<CartResponse> {
    console.log('🛒 [CartService.getCart] Called with params:', params);
    
    if (this.useMockCart) {
      console.log('🛒 [CartService.getCart] Using mock data');
      return this.getMockData(params);
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('🛒 [CartService.getCart] No authentication token found, using mock data instead');
      return this.getMockData(params);
    }
    
    try {
      console.log('🛒 [CartService.getCart] Calling real API');
      const result = await this.getData('', params);
      console.log('🛒 [CartService.getCart] Real API response:', result);
      return result;
    } catch (error) {
      console.error('🛒 [CartService.getCart] Error fetching cart data:', error);
      console.log('🛒 [CartService.getCart] Falling back to mock data');
      return this.getMockData(params);
    }
  }

  /**
   * 添加商品到购物车
   * @param data 添加商品请求数据
   */
  async addToCart(data: AddToCartRequest): Promise<CartItem> {
    console.log('🛒 [CartService.addToCart] Called with data:', data);
    
    if (this.useMockCart) {
      console.log('🛒 [CartService.addToCart] Using mock implementation');
      return this.addToCartMock(data);
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('🛒 [CartService.addToCart] No authentication token found, using mock data for addToCart');
      return this.addToCartMock(data);
    }
    
    try {
      console.log('🛒 [CartService.addToCart] Calling real API');
      const response = await ApiService.post(this.getApiPath('/items'), data);
      console.log('🛒 [CartService.addToCart] Real API response:', response);
      return response.data;
    } catch (error) {
      console.error('🛒 [CartService.addToCart] Error adding item to cart:', error);
      console.log('🛒 [CartService.addToCart] Falling back to mock implementation');
      return this.addToCartMock(data);
    }
  }

  /**
   * 模拟添加商品到购物车 - 使用真实产品数据
   * @param data 添加商品请求数据
   */
  private async addToCartMock(data: AddToCartRequest): Promise<CartItem> {
    await delay(100); // 优化：减少延迟提升响应速度
    
    const properties = data.properties || {};
    const newItemId = Math.max(...mockCartItems.map(item => item.item_id), 0) + 1;
    
    const realItem: CartItem = {
      item_id: newItemId,
      product_type: data.product_type,
      product_id: data.product_id,
      part_number: data.part_number || properties.part_number || `MOCK-${data.product_type}-${data.product_id}`,
      quantity: data.quantity,
      name: properties.productName || properties.name || properties.name_zh || properties.name_en || `模拟${data.product_type === 'machine' ? '设备' : data.product_type === 'accessory' ? '配件' : data.product_type === 'spare_part' ? '备件' : '耗材'}`,
      image_url: properties.image_url || properties.image || `/images/${data.product_type}s/mock.jpg`,
      unit_price: properties.price || properties.unit_price || 999.00,
      currency: properties.currency || 'CNY',
      line_total: (properties.price || properties.unit_price || 999.00) * data.quantity,
      inventory_status: 'in_stock',
      added_at: new Date().toISOString(),
      properties: properties
    };
    
    console.log('🛒 [CartService.addToCartMock] 调试商品名称字段:');
    console.log('  - properties.name_zh:', properties.name_zh);
    console.log('  - properties.name_en:', properties.name_en);
    console.log('  - properties.productName:', properties.productName);
    console.log('  - properties.name:', properties.name);
    console.log('  - realItem.name:', realItem.name);
    console.log('  - realItem.properties:', JSON.stringify(realItem.properties, null, 2));
    
    console.log('🛒 [CartService.addToCartMock] Created real cart item:', realItem);
    
    // 🔥 **强化去重逻辑** - 检查是否已存在相同的产品
    // 使用多重条件确保去重准确性
    const existingItemIndex = mockCartItems.findIndex(item => {
      // 主要条件：料号和产品类型必须完全匹配
      const samePartNumber = item.part_number === realItem.part_number;
      const sameProductType = item.product_type === realItem.product_type;
      
      // 辅助条件：如果料号为空或默认值，则使用product_id匹配
      const sameProductId = item.product_id === realItem.product_id;
      
      // 如果料号有效且不是默认生成的，优先使用料号匹配
      if (realItem.part_number && !realItem.part_number.startsWith('MOCK-')) {
        return samePartNumber && sameProductType;
      }
      
      // 如果料号无效，使用product_id和产品类型匹配
      return sameProductId && sameProductType;
    });
    
    if (existingItemIndex >= 0) {
      // 如果已存在，更新数量
      const existingItem = mockCartItems[existingItemIndex];
      existingItem.quantity += data.quantity;
      existingItem.line_total = existingItem.unit_price * existingItem.quantity;
      existingItem.added_at = new Date().toISOString();
      
      // 🔥 **更新商品信息** - 使用最新的properties信息
      if (properties && Object.keys(properties).length > 0) {
        existingItem.properties = { ...existingItem.properties, ...properties };
        existingItem.name = properties.productName || properties.name || properties.name_zh || properties.name_en || existingItem.name;
        existingItem.image_url = properties.image_url || properties.image || existingItem.image_url;
      }
      
      console.log('🛒 [CartService.addToCartMock] Updated existing item quantity:', existingItem);
      console.log('🛒 [CartService.addToCartMock] Duplicate prevented for part_number:', realItem.part_number);
      return existingItem;
    } else {
      // 如果不存在，添加新项目
      mockCartItems.push(realItem);
      console.log('🛒 [CartService.addToCartMock] Added new item to cart, total items:', mockCartItems.length);
      console.log('🛒 [CartService.addToCartMock] Current cart items:', mockCartItems.map(item => ({ 
        part_number: item.part_number, 
        product_type: item.product_type, 
        quantity: item.quantity 
      })));
      return realItem;
    }
  }

  /**
   * 更新购物车项目
   * @param itemId 购物车项目ID
   * @param data 更新项目请求数据
   */
  async updateCartItem(itemId: number, data: UpdateCartItemRequest): Promise<CartItem> {
    console.log('🛒 [CartService.updateCartItem] Called with itemId:', itemId, 'data:', data);
    
    if (this.useMockCart) {
      console.log('🛒 [CartService.updateCartItem] Using mock implementation');
      return this.updateCartItemMock(itemId, data);
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('🛒 [CartService.updateCartItem] No authentication token found, using mock data for updateCartItem');
      return this.updateCartItemMock(itemId, data);
    }
    
    try {
      console.log('🛒 [CartService.updateCartItem] Calling real API');
      const response = await ApiService.put(this.getApiPath(`/items/${itemId}`), data);
      console.log('🛒 [CartService.updateCartItem] Real API response:', response);
      return response.data;
    } catch (error) {
      console.error('🛒 [CartService.updateCartItem] Error updating cart item:', error);
      console.log('🛒 [CartService.updateCartItem] Falling back to mock implementation');
      return this.updateCartItemMock(itemId, data);
    }
  }

  /**
   * 模拟更新购物车项目 - 真正修改mock数据
   * @param itemId 购物车项目ID
   * @param data 更新项目请求数据
   */
  private async updateCartItemMock(itemId: number, data: UpdateCartItemRequest): Promise<CartItem> {
    await delay(300);
    
    const itemIndex = mockCartItems.findIndex(item => item.item_id === itemId);
    if (itemIndex === -1) {
      throw new Error(`购物车项目 ${itemId} 不存在`);
    }
    
    // 真正更新mock数据
    mockCartItems[itemIndex] = {
      ...mockCartItems[itemIndex],
      quantity: data.quantity,
      line_total: mockCartItems[itemIndex].unit_price * data.quantity
    };
    
    console.log('🛒 [CartService.updateCartItemMock] Updated item in mock cart:', mockCartItems[itemIndex]);
    
    return mockCartItems[itemIndex];
  }

  /**
   * 删除购物车项目
   * @param itemId 购物车项目ID
   */
  async removeCartItem(itemId: number): Promise<{ deleted: boolean; previous: CartItem }> {
    console.log('🛒 [CartService.removeCartItem] Called with itemId:', itemId);
    
    if (this.useMockCart) {
      console.log('🛒 [CartService.removeCartItem] Using mock implementation');
      return this.removeCartItemMock(itemId);
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('🛒 [CartService.removeCartItem] No authentication token found, using mock data for removeCartItem');
      return this.removeCartItemMock(itemId);
    }
    
    try {
      console.log('🛒 [CartService.removeCartItem] Calling real API');
      const response = await ApiService.delete(this.getApiPath(`/items/${itemId}`));
      console.log('🛒 [CartService.removeCartItem] Real API response:', response);
      return response.data;
    } catch (error) {
      console.error('🛒 [CartService.removeCartItem] Error removing cart item:', error);
      console.log('🛒 [CartService.removeCartItem] Falling back to mock implementation');
      return this.removeCartItemMock(itemId);
    }
  }

  /**
   * 模拟删除购物车项目 - 真正从mock数据中删除
   * @param itemId 购物车项目ID
   */
  private async removeCartItemMock(itemId: number): Promise<{ deleted: boolean; previous: CartItem }> {
    await delay(300);
    
    const itemIndex = mockCartItems.findIndex(item => item.item_id === itemId);
    if (itemIndex === -1) {
      throw new Error(`购物车项目 ${itemId} 不存在`);
    }
    
    // 真正从mock数据中删除
    const deletedItem = mockCartItems[itemIndex];
    mockCartItems.splice(itemIndex, 1);
    
    console.log('🛒 [CartService.removeCartItemMock] Removed item from mock cart, new length:', mockCartItems.length);
    
    return {
      deleted: true,
      previous: deletedItem
    };
  }

  /**
   * 清空购物车
   */
  async clearCart(): Promise<{ cleared: boolean; deleted_count: number }> {
    console.log('🛒 [CartService.clearCart] Called');
    
    if (this.useMockCart) {
      console.log('🛒 [CartService.clearCart] Using mock implementation');
      return this.clearCartMock();
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('🛒 [CartService.clearCart] No authentication token found, using mock data for clearCart');
      return this.clearCartMock();
    }
    
    try {
      console.log('🛒 [CartService.clearCart] Calling real API');
      const response = await ApiService.post(this.getApiPath('/clear'));
      console.log('🛒 [CartService.clearCart] Real API response:', response);
      return response.data;
    } catch (error) {
      console.error('🛒 [CartService.clearCart] Error clearing cart:', error);
      console.log('🛒 [CartService.clearCart] Falling back to mock implementation');
      return this.clearCartMock();
    }
  }

  /**
   * 模拟清空购物车 - 真正清空mock数据
   */
  private async clearCartMock(): Promise<{ cleared: boolean; deleted_count: number }> {
    await delay(300);
    
    const deletedCount = mockCartItems.length;
    // 真正清空mock数据
    mockCartItems.length = 0;
    
    console.log('🛒 [CartService.clearCartMock] Cleared mock cart, deleted count:', deletedCount);
    
    return {
      cleared: true,
      deleted_count: deletedCount
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
    
    console.log('🛒 [CartService.getMockData] Returning mock cart with', mockCartItems.length, 'items');
    
    return {
      items: [...mockCartItems], // 返回副本
      item_count: mockCartItems.length,
      total_quantity: totalQuantity,
      cart_total: cartTotal,
      currency: 'CNY'
    };
  }
}

// 导出购物车服务实例
export default new CartService(); 