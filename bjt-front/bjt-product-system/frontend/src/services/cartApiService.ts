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
      
      // 🔧 修复：为购物车获取请求添加防CDN缓存参数
      const timestamp = Date.now();
      const cacheBuster = Math.random().toString(36).substr(2, 9);
      
      const response = await apiService.get<CartResponse>(`/cart?_t=${timestamp}&_cb=${cacheBuster}`, {}, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache-Buster': `cart_get_${timestamp}_${cacheBuster}`
        }
      });
      
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
      // 🔧 修复：为购物车动态请求添加强制刷新头，绕过CDN缓存
      const antiCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Buster': `cart_add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const response = await apiService.post<CartResponse>('/cart/add', item, {
        headers: antiCacheHeaders
      });
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      this.forceClearCDNCache();
      
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
      // 🔧 修复：为购物车删除请求添加强制刷新头，绕过CDN缓存
      const antiCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Buster': `cart_remove_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const response = await apiService.delete<CartResponse>(`/cart/item/${itemId}`, {
        headers: antiCacheHeaders
      });
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      this.forceClearCDNCache();
      
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
      // 🔧 修复：为购物车更新请求添加强制刷新头，绕过CDN缓存
      const antiCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Buster': `cart_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const response = await apiService.put<CartResponse>(`/cart/item/${itemId}`, { quantity }, {
        headers: antiCacheHeaders
      });
      
      // 🚀 清除相关缓存
      this.invalidateCartCache();
      this.forceClearCDNCache();
      
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
      // 🔧 修复：为购物车清空请求添加强制刷新头，绕过CDN缓存
      const antiCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Buster': `cart_clear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const response = await apiService.delete<CartResponse>('/cart', {
        headers: antiCacheHeaders
      });
      
      // 🚀 清除所有缓存
      this.clearAllCache();
      this.forceClearCDNCache();
      
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

  // 🔧 修复：强制清除CDN缓存的方法
  private forceClearCDNCache(): void {
    try {
      // 清除浏览器缓存
      const cacheKeys = [
        'cart-api-cache',
        'cart-data-cache',
        'cart-summary-cache',
        'bjt-cart-cache'
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // 发送缓存清除信号给服务器
      const cacheClearUrl = '/cart/cache-clear';
      const timestamp = Date.now();
      
      // 使用image标签触发缓存清除请求（绕过CORS）
      const img = new Image();
      img.src = `${cacheClearUrl}?t=${timestamp}&action=clear&source=frontend`;
      img.style.display = 'none';
      document.body.appendChild(img);
      
      // 清理
      setTimeout(() => {
        if (img.parentNode) {
          img.parentNode.removeChild(img);
        }
      }, 1000);
      
      console.log('🚀 [CartApiService] Force cleared CDN cache');
    } catch (error) {
      console.warn('🚀 [CartApiService] Failed to clear CDN cache:', error);
    }
  }
}

// 导出单例实例
export default new CartApiService(); 