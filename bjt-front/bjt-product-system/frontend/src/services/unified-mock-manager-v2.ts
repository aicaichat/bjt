/**
 * 统一Mock管理器 V2 - 完整版本
 * 整合所有分散的Mock数据源，提供统一的数据访问接口
 * 支持环境切换、数据缓存、错误处理等高级功能
 */

// === 导入所有Mock数据源 ===
import { getMockMachineParts, getMockMachineAccessories } from './mocks/machines.mocks';
import { getAllMockSpareParts } from './mocks/spareParts.mocks';
import { getMockConsumables } from './mocks/consumables.mocks';
import { getAccessoryModelByCode } from './mocks/accessories.mocks';
import { mockOrderItems, mockCartItems } from './mocks/orders.mocks';
import { mockPrices } from './mocks/prices.mocks';
import { mockInventory } from './mocks/inventory.mocks';
import { mockProductLines } from './mockService';

// === 类型定义 ===
export enum MockDataType {
  MACHINES = 'machines',
  ACCESSORIES = 'accessories',
  CONSUMABLES = 'consumables',
  SPARE_PARTS = 'spareParts',
  ORDERS = 'orders',
  PRICES = 'prices',
  INVENTORY = 'inventory',
  PRODUCT_LINES = 'productLines',
  CART = 'cart',
  USERS = 'users'
}

export enum MockEnvironment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  DEMO = 'demo',
  PRODUCTION = 'production'
}

export interface MockManagerConfig {
  environment: MockEnvironment;
  enableCaching: boolean;
  cacheTimeout: number; // 毫秒
  networkDelay: boolean;
  minDelay: number;
  maxDelay: number;
  errorSimulation: boolean;
  errorRate: number; // 0-1之间
}

export interface MockSource {
  type: MockDataType;
  source: string;
  lastUpdated: Date;
  dataCount: number;
  isActive: boolean;
}

// === 统一Mock管理器类 ===
export class UnifiedMockManagerV2 {
  private static instance: UnifiedMockManagerV2;
  private config: MockManagerConfig;
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private dataSources: Map<MockDataType, MockSource> = new Map();
  private errorLog: Array<{ timestamp: Date; error: string; type: MockDataType }> = [];

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeDataSources();
    this.logInfo('统一Mock管理器V2已初始化');
  }

  // === 单例模式 ===
  public static getInstance(): UnifiedMockManagerV2 {
    if (!UnifiedMockManagerV2.instance) {
      UnifiedMockManagerV2.instance = new UnifiedMockManagerV2();
    }
    return UnifiedMockManagerV2.instance;
  }

  // === 配置管理 ===
  public setConfig(config: Partial<MockManagerConfig>): void {
    this.config = { ...this.config, ...config };
    this.logInfo(`配置已更新: ${JSON.stringify(config)}`);
  }

  public getConfig(): MockManagerConfig {
    return { ...this.config };
  }

  private getDefaultConfig(): MockManagerConfig {
    return {
      environment: MockEnvironment.DEVELOPMENT,
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5分钟
      networkDelay: true,
      minDelay: 100,
      maxDelay: 500,
      errorSimulation: false,
      errorRate: 0.05 // 5%错误率
    };
  }

  // === 数据源管理 ===
  private initializeDataSources(): void {
    const sources: Array<{ type: MockDataType; source: string }> = [
      { type: MockDataType.MACHINES, source: 'services/mocks/machines.mocks.ts' },
      { type: MockDataType.ACCESSORIES, source: 'services/mocks/accessories.mocks.ts' },
      { type: MockDataType.CONSUMABLES, source: 'services/mocks/consumables.mocks.ts' },
      { type: MockDataType.SPARE_PARTS, source: 'services/mocks/spareParts.mocks.ts' },
      { type: MockDataType.ORDERS, source: 'services/mocks/orders.mocks.ts' },
      { type: MockDataType.PRICES, source: 'services/mocks/prices.mocks.ts' },
      { type: MockDataType.INVENTORY, source: 'services/mocks/inventory.mocks.ts' },
      { type: MockDataType.PRODUCT_LINES, source: 'services/mockService.ts' }
    ];

    sources.forEach(({ type, source }) => {
      this.dataSources.set(type, {
        type,
        source,
        lastUpdated: new Date(),
        dataCount: 0,
        isActive: true
      });
    });
  }

  // === 核心数据获取方法 ===
  public async getMockData<T>(type: MockDataType, params?: any): Promise<T> {
    try {
      // 检查数据源是否激活
      const dataSource = this.dataSources.get(type);
      if (!dataSource?.isActive) {
        throw new Error(`数据源 ${type} 未激活`);
      }

      // 错误模拟
      if (this.config.errorSimulation && Math.random() < this.config.errorRate) {
        throw new Error(`模拟网络错误 - ${type}`);
      }

      // 缓存检查
      const cacheKey = this.getCacheKey(type, params);
      if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
        this.logDebug(`从缓存获取数据: ${type}`);
        return this.dataCache.get(cacheKey)!.data;
      }

      // 网络延迟模拟
      if (this.config.networkDelay) {
        await this.simulateNetworkDelay();
      }

      // 获取数据
      const data = await this.fetchMockData<T>(type, params);

      // 更新缓存
      if (this.config.enableCaching) {
        this.dataCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      // 更新数据源信息
      if (dataSource && Array.isArray(data)) {
        dataSource.dataCount = data.length;
        dataSource.lastUpdated = new Date();
      }

      this.logDebug(`成功获取Mock数据: ${type}, 参数: ${JSON.stringify(params)}`);
      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logError(`获取Mock数据失败: ${type}`, errorMessage);
      throw error;
    }
  }

  // === 具体数据获取实现 ===
  private async fetchMockData<T>(type: MockDataType, params?: any): Promise<T> {
    switch (type) {
      case MockDataType.MACHINES:
        return getMockMachineParts(params) as T;

      case MockDataType.ACCESSORIES:
        if (params?.machineId) {
          return getMockMachineAccessories(params.machineId) as T;
        }
        return getAccessoryModelByCode(params?.modelCode) as T;

      case MockDataType.CONSUMABLES:
        return getMockConsumables() as T;

      case MockDataType.SPARE_PARTS:
        return getAllMockSpareParts() as T;

      case MockDataType.ORDERS:
        return mockOrderItems as T;

      case MockDataType.PRICES:
        return mockPrices as T;

      case MockDataType.INVENTORY:
        return mockInventory as T;

      case MockDataType.PRODUCT_LINES:
        return mockProductLines as T;

      case MockDataType.CART:
        return mockCartItems as T;

      case MockDataType.USERS:
        return this.getUsersMockData() as T;

      default:
        throw new Error(`不支持的Mock数据类型: ${type}`);
    }
  }

  // === 特殊数据类型的处理 ===
  private getCartMockData(): any {
    return {
      items: [],
      total: 0,
      subtotal: 0,
      shipping: 0,
      tax: 0,
      currency: 'CNY'
    };
  }

  private getUsersMockData(): any {
    return [
      {
        id: 'user-1',
        name: '测试用户',
        email: 'test@bjt.com',
        role: 'customer',
        region: 'CN'
      }
    ];
  }

  // === 缓存管理 ===
  private getCacheKey(type: MockDataType, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${type}_${paramString}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.dataCache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return (now - cached.timestamp) < this.config.cacheTimeout;
  }

  public clearCache(): void {
    this.dataCache.clear();
    this.logInfo('缓存已清空');
  }

  // === 网络延迟模拟 ===
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // === 数据源管理方法 ===
  public getDataSources(): MockSource[] {
    return Array.from(this.dataSources.values());
  }

  public toggleDataSource(type: MockDataType, isActive: boolean): void {
    const source = this.dataSources.get(type);
    if (source) {
      source.isActive = isActive;
      this.logInfo(`数据源 ${type} ${isActive ? '已激活' : '已禁用'}`);
    }
  }

  // === 统计和监控 ===
  public getStats(): {
    totalRequests: number;
    cacheHitRate: number;
    errorCount: number;
    activeDataSources: number;
  } {
    const totalDataSources = this.dataSources.size;
    const activeDataSources = Array.from(this.dataSources.values())
      .filter(source => source.isActive).length;

    return {
      totalRequests: this.dataCache.size,
      cacheHitRate: 0.85, // 模拟值
      errorCount: this.errorLog.length,
      activeDataSources
    };
  }

  public getErrorLog(): Array<{ timestamp: Date; error: string; type: MockDataType }> {
    return [...this.errorLog];
  }

  // === 调试和管理方法 ===
  public async testAllDataSources(): Promise<{ type: MockDataType; status: 'success' | 'error'; message?: string }[]> {
    const results: { type: MockDataType; status: 'success' | 'error'; message?: string }[] = [];

    for (const [type] of this.dataSources) {
      try {
        await this.getMockData(type);
        results.push({ type, status: 'success' });
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误';
        results.push({ type, status: 'error', message });
      }
    }

    return results;
  }

  public resetManager(): void {
    this.dataCache.clear();
    this.errorLog.length = 0;
    this.config = this.getDefaultConfig();
    this.initializeDataSources();
    this.logInfo('Mock管理器已重置');
  }

  // === 环境切换 ===
  public switchEnvironment(environment: MockEnvironment): void {
    this.config.environment = environment;
    this.clearCache();
    
    // 根据环境调整配置
    switch (environment) {
      case MockEnvironment.TESTING:
        this.config.networkDelay = false;
        this.config.errorSimulation = true;
        this.config.errorRate = 0.1;
        break;
      case MockEnvironment.DEMO:
        this.config.networkDelay = true;
        this.config.minDelay = 200;
        this.config.maxDelay = 800;
        this.config.errorSimulation = false;
        break;
      case MockEnvironment.PRODUCTION:
        this.config.enableCaching = false;
        this.config.networkDelay = false;
        this.config.errorSimulation = false;
        break;
    }

    this.logInfo(`已切换到${environment}环境`);
  }

  // === 数据导入导出 ===
  public async exportAllData(): Promise<{ [key: string]: any }> {
    const exportData: { [key: string]: any } = {};

    for (const [type] of this.dataSources) {
      try {
        exportData[type] = await this.getMockData(type);
      } catch (error) {
        this.logError(`导出数据失败: ${type}`, error instanceof Error ? error.message : '未知错误');
      }
    }

    return exportData;
  }

  // === 日志方法 ===
  private logInfo(message: string): void {
    if (this.config.environment === MockEnvironment.DEVELOPMENT) {
      console.log(`[UnifiedMockManager] ${message}`);
    }
  }

  private logDebug(message: string): void {
    if (this.config.environment === MockEnvironment.DEVELOPMENT) {
      console.debug(`[UnifiedMockManager] ${message}`);
    }
  }

  private logError(message: string, error: string): void {
    console.error(`[UnifiedMockManager] ${message}: ${error}`);
    this.errorLog.push({
      timestamp: new Date(),
      error: `${message}: ${error}`,
      type: MockDataType.MACHINES // 默认类型
    });
  }
}

// === 导出单例实例 ===
export const unifiedMockManager = UnifiedMockManagerV2.getInstance();

// === 便捷方法 ===
export const getMockData = <T>(type: MockDataType, params?: any): Promise<T> => {
  return unifiedMockManager.getMockData<T>(type, params);
};

export const switchMockEnvironment = (environment: MockEnvironment): void => {
  unifiedMockManager.switchEnvironment(environment);
};

export const getMockStats = () => {
  return unifiedMockManager.getStats();
}; 