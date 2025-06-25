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

// 🚀 添加缓存接口
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

/**
 * 购物车API服务 - 优化版本
 */
class CartApiService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private pendingRequests = new Map<string, Promise<any>>();

  // 🚀 缓存管理方法
  private getCacheKey(method: string, params?: any): string {
    return `${method}_${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // 🚀 防重复请求
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * 获取购物车数据 - 优化版本
   * @returns 购物车数据
   */
  async getCart(): Promise<ApiResponse<CartResponse>> {
    const cacheKey = this.getCacheKey('getCart');
    
    // 🚀 优先从缓存获取
    const cached = this.getFromCache<ApiResponse<CartResponse>>(cacheKey);
    if (cached) {
      console.log('🚀 [CartApiService] Using cached cart data');
      return cached;
    }

    // 🚀 防重复请求
    return this.deduplicateRequest(cacheKey, async () => {
      console.log('🚀 [CartApiService] Fetching fresh cart data');
      const response = await apiService.get<CartResponse>('/cart');
      
      // 🚀 缓存结果
      this.setCache(cacheKey, response, this.CACHE_TTL);
      return response;
    });
  }
  
  /**
   * 添加商品到购物车 - 优化版本
   * @param item 商品数据
   * @returns 添加后的购物车数据
   */
  async addToCart(item: CartApiItem): Promise<ApiResponse<CartResponse>> {
    console.log('🚀 [CartApiService] Adding to cart:', item);
    
    try {
      const response = await apiService.post<CartResponse>('/cart/add', item);
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      
      return response;
    } catch (error) {
      console.error('🚀 [CartApiService] Add to cart failed:', error);
      throw error;
    }
  }

  /**
   * 批量添加商品到购物车 - 新增优化方法
   * @param items 商品数组
   * @returns 添加后的购物车数据
   */
  async addMultipleToCart(items: CartApiItem[]): Promise<ApiResponse<CartResponse>> {
    console.log('🚀 [CartApiService] Batch adding to cart:', items.length, 'items');
    
    try {
      const response = await apiService.post<CartResponse>('/cart/batch-add', { items });
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      
      return response;
    } catch (error) {
      console.error('🚀 [CartApiService] Batch add to cart failed:', error);
      throw error;
    }
  }
  
  /**
   * 同步购物车数据到服务器 - 优化版本
   * @param data 购物车数据
   * @returns 同步后的购物车数据
   */
  async syncCart(data: CartSyncRequest): Promise<ApiResponse<CartResponse>> {
    console.log('🚀 [CartApiService] Syncing cart:', data);
    
    try {
      const response = await apiService.post<CartResponse>('/cart/sync', data);
      
      // 🚀 更新缓存
      const cacheKey = this.getCacheKey('getCart');
      this.setCache(cacheKey, response, this.CACHE_TTL);
      
      return response;
    } catch (error) {
      console.error('🚀 [CartApiService] Cart sync failed:', error);
      throw error;
    }
  }
  
  /**
   * 从购物车中移除商品 - 优化版本
   * @param itemId 商品ID
   * @returns 移除后的购物车数据
   */
  async removeFromCart(itemId: string): Promise<ApiResponse<CartResponse>> {
    console.log('🚀 [CartApiService] Removing from cart:', itemId);
    
    try {
      const response = await apiService.delete<CartResponse>(`/cart/item/${itemId}`);
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      
      return response;
    } catch (error) {
      console.error('🚀 [CartApiService] Remove from cart failed:', error);
      throw error;
    }
  }
  
  /**
   * 更新购物车中的商品数量 - 优化版本
   * @param itemId 商品ID
   * @param quantity 新数量
   * @returns 更新后的购物车数据
   */
  async updateQuantity(itemId: string, quantity: number): Promise<ApiResponse<CartResponse>> {
    console.log('🚀 [CartApiService] Updating quantity:', itemId, quantity);
    
    try {
      const response = await apiService.put<CartResponse>(`/cart/item/${itemId}`, { quantity });
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      
      return response;
    } catch (error) {
      console.error('🚀 [CartApiService] Update quantity failed:', error);
      throw error;
    }
  }
  
  /**
   * 清空购物车 - 优化版本
   * @returns 清空后的购物车数据
   */
  async clearCart(): Promise<ApiResponse<CartResponse>> {
    console.log('🚀 [CartApiService] Clearing cart');
    
    try {
      const response = await apiService.delete<CartResponse>('/cart');
      
      // 🚀 清除所有缓存
      this.clearAllCache();
      
      return response;
    } catch (error) {
      console.error('🚀 [CartApiService] Clear cart failed:', error);
      throw error;
    }
  }

  // 🚀 缓存管理方法
  private invalidateCartCache(): void {
    const cartCacheKey = this.getCacheKey('getCart');
    this.cache.delete(cartCacheKey);
    console.log('🚀 [CartApiService] Cart cache invalidated');
  }

  private clearAllCache(): void {
    this.cache.clear();
    console.log('🚀 [CartApiService] All cache cleared');
  }

  // 🚀 获取缓存状态（用于调试）
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例实例
export default new CartApiService(); 