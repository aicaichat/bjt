import apiService from './apiService';
import { ApiResponse } from './apiService';
import { CartItem } from '../contexts/CartContext';

// 购物车API接口
export interface CartApiItem {
  id: string;
  quantity: number;
  productId: number;
  specs?: Record<string, any>;
}

export interface CartSyncRequest {
  items: CartApiItem[];
  userId?: string;
}

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
}

/**
 * 购物车API服务
 */
class CartApiService {
  /**
   * 获取购物车数据
   * @returns 购物车数据
   */
  async getCart(): Promise<ApiResponse<CartResponse>> {
    return apiService.get<CartResponse>('/cart');
  }
  
  /**
   * 同步购物车数据到服务器
   * @param data 购物车数据
   * @returns 同步后的购物车数据
   */
  async syncCart(data: CartSyncRequest): Promise<ApiResponse<CartResponse>> {
    return apiService.post<CartResponse>('/cart/sync', data);
  }
  
  /**
   * 添加商品到购物车
   * @param item 商品数据
   * @returns 添加后的购物车数据
   */
  async addToCart(item: CartApiItem): Promise<ApiResponse<CartResponse>> {
    return apiService.post<CartResponse>('/cart/add', item);
  }
  
  /**
   * 从购物车中移除商品
   * @param itemId 商品ID
   * @returns 移除后的购物车数据
   */
  async removeFromCart(itemId: string): Promise<ApiResponse<CartResponse>> {
    return apiService.delete<CartResponse>(`/cart/item/${itemId}`);
  }
  
  /**
   * 更新购物车中的商品数量
   * @param itemId 商品ID
   * @param quantity 新数量
   * @returns 更新后的购物车数据
   */
  async updateQuantity(itemId: string, quantity: number): Promise<ApiResponse<CartResponse>> {
    return apiService.put<CartResponse>(`/cart/item/${itemId}`, { quantity });
  }
  
  /**
   * 清空购物车
   * @returns 清空后的购物车数据
   */
  async clearCart(): Promise<ApiResponse<CartResponse>> {
    return apiService.delete<CartResponse>('/cart');
  }
}

// 导出单例实例
export default new CartApiService(); 