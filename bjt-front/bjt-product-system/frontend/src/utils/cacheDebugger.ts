/**
 * 缓存调试工具
 * 用于诊断耗材页面下拉框的缓存问题
 */

export class CacheDebugger {
  private static instance: CacheDebugger;
  
  public static getInstance(): CacheDebugger {
    if (!CacheDebugger.instance) {
      CacheDebugger.instance = new CacheDebugger();
    }
    return CacheDebugger.instance;
  }
  
  /**
   * 检测浏览器信息
   */
  public getBrowserInfo() {
    const ua = navigator.userAgent;
    const browsers = {
      chrome: ua.includes('Chrome') && !ua.includes('Edge'),
      firefox: ua.includes('Firefox'),
      safari: ua.includes('Safari') && !ua.includes('Chrome'),
      edge: ua.includes('Edge'),
      ie: ua.includes('MSIE') || ua.includes('Trident/')
    };
    
    const activeBrowser = Object.keys(browsers).find(key => browsers[key as keyof typeof browsers]);
    
    return {
      userAgent: ua,
      browser: activeBrowser || 'unknown',
      isChrome: browsers.chrome,
      browserFingerprint: ua.slice(0, 20)
    };
  }
  
  /**
   * 记录缓存操作
   */
  public logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'clear', details: any) {
    const browserInfo = this.getBrowserInfo();
    const timestamp = new Date().toISOString();
    
    console.group(`🔧 [缓存${operation === 'hit' ? '命中' : operation === 'miss' ? '未命中' : operation === 'set' ? '设置' : '清空'}]`);
    console.log('时间:', timestamp);
    console.log('浏览器:', browserInfo.browser);
    console.log('详情:', details);
    console.groupEnd();
    
    // 存储到sessionStorage用于跨页面调试
    const logKey = `cache_debug_${Date.now()}`;
    try {
      sessionStorage.setItem(logKey, JSON.stringify({
        operation,
        timestamp,
        browserInfo,
        details
      }));
    } catch (e) {
      console.warn('无法存储调试信息到sessionStorage:', e);
    }
  }
  
  /**
   * 获取调试历史
   */
  public getDebugHistory() {
    const history = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('cache_debug_')) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            history.push(JSON.parse(value));
          }
        } catch (e) {
          console.warn('解析调试信息失败:', e);
        }
      }
    }
    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  /**
   * 清空调试历史
   */
  public clearDebugHistory() {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('cache_debug_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('🧹 清空了缓存调试历史');
  }
  
  /**
   * 生成缓存报告
   */
  public generateCacheReport() {
    const history = this.getDebugHistory();
    const browserInfo = this.getBrowserInfo();
    
    const report = {
      浏览器信息: browserInfo,
      总操作数: history.length,
      操作统计: history.reduce((acc, item) => {
        acc[item.operation] = (acc[item.operation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      时间范围: history.length > 0 ? {
        开始: history[0].timestamp,
        结束: history[history.length - 1].timestamp
      } : null,
      详细历史: history
    };
    
    console.group('📊 缓存调试报告');
    console.table(report.操作统计);
    console.log('完整报告:', report);
    console.groupEnd();
    
    return report;
  }
  
  /**
   * 检测可能的缓存问题
   */
  public detectCacheIssues() {
    const history = this.getDebugHistory();
    const issues = [];
    
    // 检查是否有过多的缓存命中（可能是旧数据）
    const hitCount = history.filter(h => h.operation === 'hit').length;
    const totalCount = history.length;
    
    if (hitCount / totalCount > 0.8) {
      issues.push({
        type: 'high_cache_hit_ratio',
        description: '缓存命中率过高，可能存在旧数据问题',
        suggestion: '考虑清空缓存或缩短缓存时间'
      });
    }
    
    // 检查浏览器特定问题
    const browserInfo = this.getBrowserInfo();
    if (!browserInfo.isChrome) {
      issues.push({
        type: 'non_chrome_browser',
        description: `当前浏览器 (${browserInfo.browser}) 可能存在缓存行为差异`,
        suggestion: '建议与Chrome浏览器对比测试'
      });
    }
    
    return issues;
  }
}

// 导出单例实例
export const cacheDebugger = CacheDebugger.getInstance(); 