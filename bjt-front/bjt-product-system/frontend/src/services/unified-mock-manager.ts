/**
 * 统一Mock数据管理器
 * 整合现有的分散Mock数据，提供统一的Mock切换和数据访问接口
 */

import { mockData } from './mockData';
import { 
  MachineListData, 
  AccessoryListData, 
  ConsumableListData, 
  SparePartListData,
  CartData,
  Order,
  UserInfo
} from '@/types/api.types';

// Mock数据类型枚举
export enum MockDataType {
  MACHINES = 'machines',
  ACCESSORIES = 'accessories', 
  CONSUMABLES = 'consumables',
  SPARE_PARTS = 'spareParts',
  CART = 'cart',
  ORDERS = 'orders',
  USERS = 'users',
  PRODUCT_LINES = 'productLines'
}

// Mock配置接口
interface MockConfig {
  enabled: boolean;
  dataSource: 'local' | 'mockApi' | 'hybrid';
  responseDelay: number;
  errorRate: number; // 0-1之间，模拟网络错误概率
}

/**
 * 统一Mock管理器
 */
export class UnifiedMockManager {
  private static instance: UnifiedMockManager;
  private config: MockConfig;
  private mockDataCache: Map<string, any> = new Map();

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): UnifiedMockManager {
    if (!UnifiedMockManager.instance) {
      UnifiedMockManager.instance = new UnifiedMockManager();
    }
    return UnifiedMockManager.instance;
  }

  /**
   * 检查Mock是否启用 - 强制禁用Mock数据
   */
  public isEnabled(): boolean {
    // 强制禁用所有Mock数据，只使用真实API
    console.log('🔧 [UnifiedMockManager] Mock数据已被强制禁用，只使用真实API');
    return false;
  }

  /**
   * 启用/禁用Mock数据
   */
  public setEnabled(enabled: boolean): void {
    localStorage.setItem('USE_MOCK_DATA', enabled.toString());
    this.config.enabled = enabled;
    
    // 清除缓存
    this.mockDataCache.clear();
    
    console.log(`Mock数据已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 获取Mock数据
   */
  public getMockData<T>(type: MockDataType): T {
    const cacheKey = `${type}_data`;
    
    if (this.mockDataCache.has(cacheKey)) {
      return this.mockDataCache.get(cacheKey);
    }
    
    let data: T;
    
    switch (type) {
      case MockDataType.MACHINES:
        data = this.getMachinesMockData() as T;
        break;
      case MockDataType.ACCESSORIES:
        data = this.getAccessoriesMockData() as T;
        break;
      case MockDataType.CONSUMABLES:
        data = this.getConsumablesMockData() as T;
        break;
      case MockDataType.SPARE_PARTS:
        data = this.getSparePartsMockData() as T;
        break;
      case MockDataType.CART:
        data = this.getCartMockData() as T;
        break;
      case MockDataType.ORDERS:
        data = this.getOrdersMockData() as T;
        break;
      case MockDataType.USERS:
        data = this.getUsersMockData() as T;
        break;
      case MockDataType.PRODUCT_LINES:
        data = this.getProductLinesMockData() as T;
        break;
      default:
        throw new Error(`未知的Mock数据类型: ${type}`);
    }
    
    this.mockDataCache.set(cacheKey, data);
    return data;
  }

  /**
   * 创建Mock服务代理
   */
  public createMockService<T extends object>(realService: T, serviceName: string): T {
    if (!this.isEnabled()) {
      return realService;
    }

    return new Proxy(realService, {
      get: (target, prop: string | symbol) => {
        const methodName = prop.toString();
        
        // 如果是Mock方法，返回Mock实现
        if (this.hasMockImplementation(serviceName, methodName)) {
          return this.getMockImplementation(serviceName, methodName);
        }
        
        // 否则返回原始方法
        return target[prop as keyof T];
      }
    });
  }

  /**
   * 模拟网络延迟和错误
   */
  public async simulateNetworkConditions<T>(data: T): Promise<T> {
    // 模拟网络延迟
    if (this.config.responseDelay > 0) {
      const delay = this.config.responseDelay + Math.random() * 100; // 添加随机延迟
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // 模拟网络错误
    if (Math.random() < this.config.errorRate) {
      throw new Error('Mock网络错误: 连接超时');
    }
    
    return data;
  }

  /**
   * 获取设备Mock数据
   */
  private getMachinesMockData(): MachineListData {
    // 整合来自 mockData.products 的数据
    const products = mockData.products || [];
    
    return {
      items: products.map(product => ({
        id: product.id,
        code: product.code,
        title_zh: product.name_zh || product.name,
        title_en: product.name_en || product.name,
        product_line_id: product.product_line_id || 1,
        type: product.type || 'automatic',
        image_url: product.image_url || '/images/default-machine.jpg',
        status: 'publish',
        sort_order: product.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      total: products.length,
      page: 1,
      per_page: 10,
      total_pages: Math.ceil(products.length / 10)
    };
  }

  /**
   * 获取配件Mock数据
   */
  private getAccessoriesMockData(): AccessoryListData {
    // 从现有mock数据中提取配件数据
    const accessories = [
      {
        id: 1,
        product_line_id: 1,
        model: 'BJT-A001',
        brand: 'BJT',
        part_number: 'ACC-001',
        name: '标准配件套装',
        spec: '220V/50Hz',
        spec_imperial: '110V/60Hz',
        image_url: '/images/accessory1.jpg',
        status: 'publish' as const,
        unit: 'set',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return {
      items: accessories,
      total: accessories.length,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
  }

  /**
   * 获取耗材Mock数据
   */
  private getConsumablesMockData(): ConsumableListData {
    // 从 mockData.consumables 获取数据
    const consumables = mockData.consumables || [];
    
    return {
      items: consumables.map(item => ({
        id: item.id,
        product_line_id: item.product_line_id || 1,
        code: item.code,
        name: item.name,
        brand: item.brand || 'BJT',
        specs: {
          material: item.material || 'PE',
          shape: item.shape || 'bubble',
          thickness: {
            metric: item.thickness_metric || '20µm',
            imperial: item.thickness_imperial || '0.8mil'
          },
          width: {
            metric: item.width_metric || '300mm',
            imperial: item.width_imperial || '12in'
          },
          length: {
            metric: item.length_metric || '150m',
            imperial: item.length_imperial || '492ft'
          },
          compatibility: item.compatibility || []
        },
        package_type: item.package_type || 'roll',
        image_url: item.image_url || '/images/default-consumable.jpg',
        status: 'publish'
      })),
      total: consumables.length,
      total_pages: Math.ceil(consumables.length / 10),
      current_page: 1
    };
  }

  /**
   * 获取备件Mock数据
   */
  private getSparePartsMockData(): SparePartListData {
    const spareParts = [
      {
        id: 1,
        product_line_id: 1,
        part_number: 'SP-001',
        name: '密封圈',
        app_model: 'BJT-M001,BJT-M002',
        is_consumable: true,
        image_url: '/images/spare-part1.jpg',
        spec: 'NBR材质，耐温-40°C到120°C',
        spec_imperial: 'NBR Material, Temperature Range -40°F to 248°F',
        app_sn: 'SN001,SN002',
        status: 'publish',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return {
      items: spareParts,
      total: spareParts.length,
      total_pages: 1,
      current_page: 1
    };
  }

  /**
   * 获取购物车Mock数据
   */
  private getCartMockData(): CartData {
    return {
      items: [],
      item_count: 0,
      total_quantity: 0,
      cart_total: 0,
      currency: 'CNY'
    };
  }

  /**
   * 获取订单Mock数据
   */
  private getOrdersMockData(): Order[] {
    const orders = mockData.orders || [];
    return orders.map(order => ({
      ...order,
      id: order.id,
      order_number: order.order_number || `ORD-${order.id}`,
      user_id: order.user_id || 1,
      status: order.status || 'pending_payment',
      total_amount: order.total_amount || 0,
      currency: order.currency || 'CNY',
      shipping_address: order.shipping_address || {
        name: '张三',
        phone: '13800138000',
        address: '测试地址'
      },
      billing_address: order.billing_address || {
        name: '张三',
        phone: '13800138000',
        address: '测试地址'
      },
      payment_method: order.payment_method || 'credit_card',
      items: order.items || [],
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString()
    }));
  }

  /**
   * 获取用户Mock数据
   */
  private getUsersMockData(): UserInfo[] {
    const users = mockData.users || [];
    return users.map(user => ({
      ...user,
      role: user.role || 'CUSTOMER',
      region: user.region || 'CN'
    }));
  }

  /**
   * 获取产品线Mock数据
   */
  private getProductLinesMockData() {
    return mockData.productLines || [];
  }

  /**
   * 检查是否有Mock实现
   */
  private hasMockImplementation(serviceName: string, methodName: string): boolean {
    const mockImplementations = {
      'MachineService': ['getMachines', 'getMachineById'],
      'AccessoryService': ['getAccessories', 'getMachineAccessories'],
      'ConsumableService': ['getConsumables'],
      'SparePartService': ['getSpareParts'],
      'CartService': ['getCart', 'addToCart', 'updateCartItem', 'removeCartItem'],
      'OrderService': ['getOrders', 'createOrder', 'getOrderById']
    };

    return mockImplementations[serviceName]?.includes(methodName) || false;
  }

  /**
   * 获取Mock实现
   */
  private getMockImplementation(serviceName: string, methodName: string) {
    return async (...args: any[]) => {
      console.log(`🎭 Mock ${serviceName}.${methodName} 被调用:`, args);
      
      // 根据服务名和方法名返回对应的Mock数据
      switch (`${serviceName}.${methodName}`) {
        case 'MachineService.getMachines':
          return this.simulateNetworkConditions(
            this.getMockData<MachineListData>(MockDataType.MACHINES)
          );
          
        case 'AccessoryService.getAccessories':
          return this.simulateNetworkConditions(
            this.getMockData<AccessoryListData>(MockDataType.ACCESSORIES)
          );
          
        case 'ConsumableService.getConsumables':
          return this.simulateNetworkConditions(
            this.getMockData<ConsumableListData>(MockDataType.CONSUMABLES)
          );
          
        case 'SparePartService.getSpareParts':
          return this.simulateNetworkConditions(
            this.getMockData<SparePartListData>(MockDataType.SPARE_PARTS)
          );
          
        case 'CartService.getCart':
          return this.simulateNetworkConditions(
            this.getMockData<CartData>(MockDataType.CART)
          );
          
        default:
          throw new Error(`未实现的Mock方法: ${serviceName}.${methodName}`);
      }
    };
  }

  /**
   * 加载配置
   */
  private loadConfig(): MockConfig {
    const defaultConfig: MockConfig = {
      enabled: false,
      dataSource: 'local',
      responseDelay: 100,
      errorRate: 0.02 // 2%的错误率
    };

    try {
      const savedConfig = localStorage.getItem('mock_config');
      if (savedConfig) {
        return { ...defaultConfig, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.warn('加载Mock配置失败，使用默认配置:', error);
    }

    return defaultConfig;
  }

  /**
   * 保存配置
   */
  public saveConfig(config: Partial<MockConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('mock_config', JSON.stringify(this.config));
  }

  /**
   * 获取当前配置
   */
  public getConfig(): MockConfig {
    return { ...this.config };
  }

  /**
   * 重置Mock数据
   */
  public resetMockData(): void {
    this.mockDataCache.clear();
    console.log('Mock数据缓存已清除');
  }

  /**
   * 生成统计报告
   */
  public generateReport(): object {
    return {
      enabled: this.isEnabled(),
      config: this.getConfig(),
      cacheSize: this.mockDataCache.size,
      availableDataTypes: Object.values(MockDataType),
      dataStats: {
        machines: this.getMockData<MachineListData>(MockDataType.MACHINES).total,
        accessories: this.getMockData<AccessoryListData>(MockDataType.ACCESSORIES).total,
        consumables: this.getMockData<ConsumableListData>(MockDataType.CONSUMABLES).total,
        spareParts: this.getMockData<SparePartListData>(MockDataType.SPARE_PARTS).total,
        orders: this.getMockData<Order[]>(MockDataType.ORDERS).length,
        users: this.getMockData<UserInfo[]>(MockDataType.USERS).length
      }
    };
  }
}

// 导出单例实例
export const mockManager = UnifiedMockManager.getInstance();

// 导出便捷方法
export const isMockEnabled = () => mockManager.isEnabled();
export const enableMock = () => mockManager.setEnabled(true);
export const disableMock = () => mockManager.setEnabled(false);
export const getMockData = <T>(type: MockDataType): T => mockManager.getMockData<T>(type);
export const createMockService = <T extends object>(service: T, name: string): T => 
  mockManager.createMockService(service, name); 