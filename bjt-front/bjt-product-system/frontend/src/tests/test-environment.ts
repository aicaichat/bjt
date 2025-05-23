/**
 * 测试环境配置
 * 为Node.js环境模拟浏览器API
 */

// Mock localStorage
export class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Mock fetch API
export class MockFetch {
  static async fetch(url: string, options?: RequestInit): Promise<Response> {
    // 模拟API响应延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // 根据URL返回不同的模拟数据
    if (url.includes('/product-lines')) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: 1,
              name_zh: '气垫机产品线',
              name_en: 'Air Cushion Machine Line',
              description_zh: '高效包装解决方案',
              description_en: 'Efficient packaging solutions'
            }
          ],
          total: 1
        }
      }), {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
    }
    
    if (url.includes('/machines')) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: 1,
              code: 'BJT-M001',
              title_zh: '标准气垫机',
              title_en: 'Standard Air Cushion Machine',
              type: 'automatic',
              product_line_id: 1,
              status: 'publish'
            }
          ],
          total: 1,
          page: 1,
          page_size: 10
        }
      }), {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
    }
    
    if (url.includes('/cart')) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [],
          total: 0,
          subtotal: 0,
          shipping: 0,
          tax: 0
        }
      }), {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
    }
    
    // 默认返回404
    return new Response(JSON.stringify({
      success: false,
      error: 'Not Found'
    }), {
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  }
}

// Mock console methods for testing
export class MockConsole {
  private logs: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];

  log(...args: any[]): void {
    this.logs.push(args.map(arg => String(arg)).join(' '));
  }

  error(...args: any[]): void {
    this.errors.push(args.map(arg => String(arg)).join(' '));
  }

  warn(...args: any[]): void {
    this.warnings.push(args.map(arg => String(arg)).join(' '));
  }

  clear(): void {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }
}

// 设置测试环境
export function setupTestEnvironment(): void {
  // Mock localStorage
  if (typeof global !== 'undefined') {
    (global as any).localStorage = new MockLocalStorage();
    (global as any).sessionStorage = new MockLocalStorage();
  }
  
  // Mock fetch
  if (typeof global !== 'undefined' && !global.fetch) {
    (global as any).fetch = MockFetch.fetch;
    (global as any).Response = Response;
    (global as any).Headers = Headers;
  }
  
  // Mock window object
  if (typeof global !== 'undefined' && !global.window) {
    (global as any).window = {
      localStorage: new MockLocalStorage(),
      sessionStorage: new MockLocalStorage(),
      location: {
        href: 'http://localhost:5173',
        origin: 'http://localhost:5173',
        pathname: '/',
        search: '',
        hash: ''
      },
      document: {
        getElementById: () => null,
        createElement: () => ({}),
        body: {}
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval
    };
  }
  
  // Mock process.memoryUsage for performance testing
  if (typeof process !== 'undefined' && !process.memoryUsage) {
    (process as any).memoryUsage = () => ({
      rss: 50 * 1024 * 1024,
      heapTotal: 30 * 1024 * 1024,
      heapUsed: 20 * 1024 * 1024,
      external: 5 * 1024 * 1024,
      arrayBuffers: 1 * 1024 * 1024
    });
  }
  
  // Mock performance API
  if (typeof global !== 'undefined' && !global.performance) {
    (global as any).performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntriesByName: () => [],
      getEntriesByType: () => []
    };
  }
}

// 清理测试环境
export function teardownTestEnvironment(): void {
  if (typeof global !== 'undefined') {
    // 清理localStorage
    if (global.localStorage && typeof global.localStorage.clear === 'function') {
      global.localStorage.clear();
    }
    
    // 清理sessionStorage
    if (global.sessionStorage && typeof global.sessionStorage.clear === 'function') {
      global.sessionStorage.clear();
    }
  }
}

// 创建测试用的React Context
export function createMockContext<T>(defaultValue: T): {
  Provider: ({ children, value }: { children: any; value?: T }) => any;
  Consumer: any;
  useContext: () => T;
} {
  let currentValue = defaultValue;
  
  return {
    Provider: ({ children, value = defaultValue }) => {
      currentValue = value;
      return children;
    },
    Consumer: null,
    useContext: () => currentValue
  };
}

// 创建测试用的异步延迟函数
export function createTestDelay(min: number = 10, max: number = 100): () => Promise<void> {
  return () => new Promise(resolve => {
    const delay = Math.random() * (max - min) + min;
    setTimeout(resolve, delay);
  });
}

// 测试数据生成器
export class TestDataGenerator {
  static generateMachine(overrides: Partial<any> = {}): any {
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      code: `BJT-M${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      title_zh: '测试机器',
      title_en: 'Test Machine',
      type: 'automatic',
      product_line_id: 1,
      status: 'publish',
      image_url: '/images/test-machine.jpg',
      price: Math.floor(Math.random() * 50000) + 10000,
      ...overrides
    };
  }
  
  static generateAccessory(overrides: Partial<any> = {}): any {
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      name_zh: '测试配件',
      name_en: 'Test Accessory',
      parent_id: null,
      level: 1,
      price: Math.floor(Math.random() * 5000) + 500,
      ...overrides
    };
  }
  
  static generateCartItem(overrides: Partial<any> = {}): any {
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      product_id: Math.floor(Math.random() * 100) + 1,
      name: '测试商品',
      quantity: Math.floor(Math.random() * 5) + 1,
      price: Math.floor(Math.random() * 10000) + 1000,
      ...overrides
    };
  }
  
  static generateUser(overrides: Partial<any> = {}): any {
    return {
      id: 1,
      name: '测试用户',
      email: 'test@example.com',
      role: 'customer',
      region: 'CN',
      vipLevel: 1,
      permissions: ['view_products'],
      ...overrides
    };
  }
}

// 导出所有功能
export {
  MockLocalStorage as localStorage,
  MockFetch as fetch,
  MockConsole as console
};

// 自动设置测试环境
setupTestEnvironment(); 