/**
 * 🛒 BJT购物车缓存管理器
 * 统一管理localStorage，避免缓存冲突
 */

export interface CacheConfig {
  prefix: string;
  version: string;
  ttl: number; // 缓存过期时间(毫秒)
}

export class BJTCacheManager {
  private static instance: BJTCacheManager;
  private config: CacheConfig;
  
  private constructor() {
    this.config = {
      prefix: 'bjt_v2_',
      version: '2.0.0',
      ttl: 24 * 60 * 60 * 1000 // 24小时
    };
  }
  
  static getInstance(): BJTCacheManager {
    if (!BJTCacheManager.instance) {
      BJTCacheManager.instance = new BJTCacheManager();
    }
    return BJTCacheManager.instance;
  }
  
  /**
   * 🔧 清理所有旧版本缓存
   */
  clearLegacyCache(): void {
    const legacyKeys = [
      'bjt_mock_cart',
      'cart_admin', 
      'cart_user',
      'cart-api-cache',
      'cart-data-cache',
      'cart-summary-cache',
      'bjt-cart-cache',
      'auth_token',
      'user_data',
      'jwt_token',
      'auth_user',
      'cartBugFixFlags',
      'feature_flags',
      'api_cache',
      'session_cache',
      'temp_cache'
    ];
    
    let clearedCount = 0;
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🧹 清理旧缓存: ${key}`);
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`🎉 清理完成，共清理 ${clearedCount} 个旧缓存项`);
  }
  
  /**
   * 🔧 生成标准化的缓存key
   */
  private generateKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }
  
  /**
   * 🔧 设置缓存（带过期时间）
   */
  setCache(key: string, value: any, customTTL?: number): void {
    try {
      const cacheData = {
        value,
        timestamp: Date.now(),
        ttl: customTTL || this.config.ttl,
        version: this.config.version
      };
      
      const cacheKey = this.generateKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log(`💾 缓存已保存: ${cacheKey}`);
    } catch (error) {
      console.error('❌ 缓存保存失败:', error);
      // 如果localStorage满了，清理过期缓存后重试
      this.cleanExpiredCache();
      try {
        const cacheData = {
          value,
          timestamp: Date.now(),
          ttl: customTTL || this.config.ttl,
          version: this.config.version
        };
        localStorage.setItem(this.generateKey(key), JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('❌ 缓存重试失败:', retryError);
      }
    }
  }
  
  /**
   * 🔧 获取缓存
   */
  getCache(key: string): any {
    try {
      const cacheKey = this.generateKey(key);
      const cacheData = localStorage.getItem(cacheKey);
      
      if (!cacheData) {
        return null;
      }
      
      const parsed = JSON.parse(cacheData);
      
      // 检查版本兼容性
      if (parsed.version !== this.config.version) {
        console.warn(`🔄 缓存版本不匹配，清理: ${cacheKey}`);
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      // 检查是否过期
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        console.log(`⏰ 缓存已过期，清理: ${cacheKey}`);
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.error('❌ 缓存读取失败:', error);
      return null;
    }
  }
  
  /**
   * 🔧 删除指定缓存
   */
  removeCache(key: string): void {
    const cacheKey = this.generateKey(key);
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ 缓存已删除: ${cacheKey}`);
  }
  
  /**
   * 🔧 清理所有过期缓存
   */
  cleanExpiredCache(): void {
    const currentTime = Date.now();
    let cleanedCount = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.prefix)) {
        try {
          const cacheData = JSON.parse(localStorage.getItem(key)!);
          if (currentTime - cacheData.timestamp > cacheData.ttl) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // 无效的缓存数据，直接删除
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理过期缓存: ${cleanedCount} 项`);
    }
  }
  
  /**
   * 🔧 获取缓存统计信息
   */
  getCacheStats(): {
    total: number;
    bjtCaches: number;
    totalSize: number;
    expired: number;
  } {
    let total = 0;
    let bjtCaches = 0;
    let totalSize = 0;
    let expired = 0;
    const currentTime = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          
          if (key.startsWith(this.config.prefix)) {
            bjtCaches++;
            try {
              const cacheData = JSON.parse(value);
              if (currentTime - cacheData.timestamp > cacheData.ttl) {
                expired++;
              }
            } catch (error) {
              expired++;
            }
          }
        }
      }
    }
    
    return { total, bjtCaches, totalSize, expired };
  }
  
  /**
   * 🔧 购物车专用缓存方法
   */
  setCartCache(cartData: any): void {
    this.setCache('cart', cartData, 30 * 60 * 1000); // 30分钟过期
  }
  
  getCartCache(): any {
    return this.getCache('cart');
  }
  
  clearCartCache(): void {
    this.removeCache('cart');
  }
  
  /**
   * 🔧 认证专用缓存方法
   */
  setAuthCache(token: string, userInfo: any): void {
    this.setCache('auth_token', token, 24 * 60 * 60 * 1000); // 24小时
    this.setCache('user_info', userInfo, 24 * 60 * 60 * 1000);
  }
  
  getAuthToken(): string | null {
    return this.getCache('auth_token');
  }
  
  getUserInfo(): any {
    return this.getCache('user_info');
  }
  
  clearAuthCache(): void {
    this.removeCache('auth_token');
    this.removeCache('user_info');
  }
  
  /**
   * 🛒 购物车问题诊断和修复
   */
  fixCartIssues(): { fixed: boolean; issues: string[] } {
    const issues: string[] = [];
    let fixed = false;

    try {
      console.log('🛒 开始检查购物车相关问题...');

      // 1. 检查认证冲突
      const authKeys = ['auth_token', 'jwt_token', 'user_data', 'auth_user', 'bjt_user_auth'];
      const foundAuthKeys = authKeys.filter(key => localStorage.getItem(key));
      
      if (foundAuthKeys.length > 1) {
        issues.push(`认证缓存冲突: 发现多个认证键 ${foundAuthKeys.join(', ')}`);
        // 保留第一个，删除其余
        foundAuthKeys.slice(1).forEach(key => {
          localStorage.removeItem(key);
          console.log(`🧹 清理冲突认证缓存: ${key}`);
        });
        fixed = true;
      }

      // 2. 检查token有效性
      const token = localStorage.getItem('auth_token') || localStorage.getItem('jwt_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expiry = new Date(payload.exp * 1000);
          const now = new Date();
          
          if (expiry < now) {
            issues.push(`认证token已过期: ${expiry.toLocaleString()}`);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('jwt_token');
            fixed = true;
          }
        } catch (error) {
          issues.push('认证token格式无效');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('jwt_token');
          fixed = true;
        }
      }

      // 3. 检查购物车缓存冲突
      const cartKeys = [
        'bjt_mock_cart', 'cart_admin', 'cart_user', 
        'cart-api-cache', 'bjt-cart-cache', 'cart-data-cache'
      ];
      const foundCartKeys = cartKeys.filter(key => localStorage.getItem(key));
      
      if (foundCartKeys.length > 1) {
        issues.push(`购物车缓存冲突: 发现多个购物车缓存 ${foundCartKeys.join(', ')}`);
        // 优先保留最新的，删除其余
        foundCartKeys.slice(1).forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          console.log(`🧹 清理冲突购物车缓存: ${key}`);
        });
        fixed = true;
      }

      // 4. 检查Mock模式干扰
      const mockCart = localStorage.getItem('bjt_mock_cart');
      if (mockCart) {
        try {
          const mockData = JSON.parse(mockCart);
          if (Array.isArray(mockData) && mockData.length > 0) {
            issues.push('检测到Mock购物车数据，可能干扰真实API');
            localStorage.removeItem('bjt_mock_cart');
            fixed = true;
          }
        } catch (error) {
          // Mock数据格式错误，直接删除
          localStorage.removeItem('bjt_mock_cart');
          fixed = true;
        }
      }

      // 5. 检查功能开关冲突
      const flagKeys = ['cartBugFixFlags', 'feature_flags'];
      flagKeys.forEach(key => {
        const flagData = localStorage.getItem(key);
        if (flagData) {
          try {
            const flags = JSON.parse(flagData);
            if (flags.USE_MOCK_CART === true) {
              issues.push(`${key}: 启用了Mock购物车模式`);
              delete flags.USE_MOCK_CART;
              localStorage.setItem(key, JSON.stringify(flags));
              fixed = true;
            }
          } catch (error) {
            issues.push(`${key}: 功能开关格式错误`);
            localStorage.removeItem(key);
            fixed = true;
          }
        }
      });

      // 6. 设置修复标记
      if (fixed) {
        this.setCache('cart_fix_applied', {
          timestamp: Date.now(),
          version: this.config.version,
          issues_fixed: issues.length,
          auto_fixed: true
        }, 7 * 24 * 60 * 60 * 1000); // 7天过期
      }

      console.log(`🛒 购物车问题检查完成: ${issues.length} 个问题, ${fixed ? '已修复' : '无需修复'}`);
      
      return { fixed, issues };
    } catch (error) {
      console.error(`❌ 购物车问题修复失败: ${error}`);
      return { fixed: false, issues: [`修复过程出错: ${error.message}`] };
    }
  }

  /**
   * 🔧 初始化方法 - 在应用启动时调用
   */
  initialize(): void {
    console.log('🚀 BJT缓存管理器初始化...');
    
    // 清理旧版本缓存
    this.clearLegacyCache();
    
    // 清理过期缓存
    this.cleanExpiredCache();
    
    // 🛒 自动修复购物车问题
    const cartFixResult = this.fixCartIssues();
    if (cartFixResult.fixed) {
      console.log('🎉 自动修复了购物车问题:', cartFixResult.issues);
    }
    
    // 输出统计信息
    const stats = this.getCacheStats();
    console.log('📊 缓存统计:', stats);
    
    console.log('✅ BJT缓存管理器初始化完成');
  }
}

// 导出单例实例
export const cacheManager = BJTCacheManager.getInstance(); 