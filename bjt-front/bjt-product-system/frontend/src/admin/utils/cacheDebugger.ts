/**
 * 管理页面缓存调试工具
 * 专门用于诊断耗材管理页面的下拉框缓存问题
 */

export class AdminCacheDebugger {
  private static instance: AdminCacheDebugger;
  
  public static getInstance(): AdminCacheDebugger {
    if (!AdminCacheDebugger.instance) {
      AdminCacheDebugger.instance = new AdminCacheDebugger();
    }
    return AdminCacheDebugger.instance;
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
      browserFingerprint: ua.slice(0, 20),
      supportsFetch: typeof fetch !== 'undefined',
      supportsLocalStorage: typeof localStorage !== 'undefined'
    };
  }
  
  /**
   * 记录下拉框数据加载
   */
  public logDropdownLoad(dropdownType: string, dataCount: number, source: 'api' | 'cache' | 'fallback') {
    const browserInfo = this.getBrowserInfo();
    const timestamp = new Date().toISOString();
    
    console.group(`🔽 [下拉框${dropdownType}]`);
    console.log('时间:', timestamp);
    console.log('浏览器:', browserInfo.browser);
    console.log('数据来源:', source);
    console.log('数据条数:', dataCount);
    console.log('浏览器指纹:', browserInfo.browserFingerprint);
    console.groupEnd();
    
    // 存储到sessionStorage用于跨页面调试
    const logKey = `admin_dropdown_debug_${Date.now()}`;
    try {
      sessionStorage.setItem(logKey, JSON.stringify({
        dropdownType,
        dataCount,
        source,
        timestamp,
        browserInfo
      }));
    } catch (e) {
      console.warn('无法存储下拉框调试信息到sessionStorage:', e);
    }
  }
  
  /**
   * 记录API调用
   */
  public logApiCall(apiName: string, params: any, cacheInfo?: any) {
    const browserInfo = this.getBrowserInfo();
    const timestamp = new Date().toISOString();
    
    console.group(`🌐 [API调用-${apiName}]`);
    console.log('时间:', timestamp);
    console.log('浏览器:', browserInfo.browser);
    console.log('参数:', params);
    if (cacheInfo) {
      console.log('缓存信息:', cacheInfo);
    }
    console.groupEnd();
  }
  
  /**
   * 检查状态一致性
   */
  public checkStateConsistency(states: Record<string, any>) {
    const browserInfo = this.getBrowserInfo();
    
    console.group('🔍 [状态一致性检查]');
    console.log('浏览器:', browserInfo.browser);
    console.log('当前状态:');
    
    Object.entries(states).forEach(([key, value]) => {
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      const valueLength = Array.isArray(value) ? value.length : 
                         typeof value === 'string' ? value.length : 'N/A';
      
      console.log(`  ${key}: ${valueType} (${valueLength})`);
    });
    
    console.groupEnd();
    
    return {
      browserInfo,
      stateSnapshot: states,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 生成缓存问题报告
   */
  public generateDropdownReport() {
    const history = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('admin_dropdown_debug_')) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            history.push(JSON.parse(value));
          }
        } catch (e) {
          console.warn('解析下拉框调试信息失败:', e);
        }
      }
    }
    
    const browserInfo = this.getBrowserInfo();
    
    // 按下拉框类型分组分析
    const byDropdownType = history.reduce((acc, item) => {
      if (!acc[item.dropdownType]) {
        acc[item.dropdownType] = [];
      }
      acc[item.dropdownType].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    // 检测异常情况
    const issues: any[] = [];
    
    Object.entries(byDropdownType).forEach(([type, records]) => {
      const dataCounts = (records as any[]).map(r => r.dataCount);
      const uniqueCounts = [...new Set(dataCounts)];
      
      if (uniqueCounts.length > 1) {
        issues.push({
          type: 'inconsistent_data_count',
          dropdownType: type,
          description: `${type}下拉框数据条数不一致: ${uniqueCounts.join(', ')}`,
          records: (records as any[]).slice(-3) // 最近3条记录
        });
      }
      
      const sources = (records as any[]).map(r => r.source);
      const cacheRatio = sources.filter(s => s === 'cache').length / sources.length;
      
      if (cacheRatio > 0.8) {
        issues.push({
          type: 'high_cache_usage',
          dropdownType: type,
          description: `${type}下拉框缓存使用率过高: ${(cacheRatio * 100).toFixed(1)}%`,
          suggestion: '可能存在缓存问题，建议检查数据刷新机制'
        });
      }
    });
    
    const report = {
      浏览器信息: browserInfo,
      检查时间: new Date().toISOString(),
      总记录数: history.length,
      下拉框类型: Object.keys(byDropdownType),
      发现问题: issues,
      详细数据: byDropdownType
    };
    
    console.group('📊 下拉框缓存报告');
    console.table(Object.keys(byDropdownType).map(type => ({
      下拉框类型: type,
      记录数: byDropdownType[type].length,
      最近数据条数: byDropdownType[type].slice(-1)[0]?.dataCount || 0,
      最近数据源: byDropdownType[type].slice(-1)[0]?.source || 'unknown'
    })));
    
    if (issues.length > 0) {
      console.warn('发现问题:', issues);
    } else {
      console.log('✅ 未发现明显问题');
    }
    
    console.groupEnd();
    
    return report;
  }
  
  /**
   * 清空调试历史
   */
  public clearDebugHistory() {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('admin_dropdown_debug_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('🧹 清空了管理页面下拉框调试历史');
  }
}

// 导出单例实例
export const adminCacheDebugger = AdminCacheDebugger.getInstance();

// 添加到全局对象用于控制台调试
if (typeof window !== 'undefined') {
  (window as any).adminCacheDebugger = adminCacheDebugger;
} 