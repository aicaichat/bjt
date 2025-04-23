/**
 * 统一的Mock数据服务
 * 为整个应用提供一致的模拟数据访问接口
 */

import mockData, { exportAllMockData, importMockData } from './mockData';
import { useMockData } from '../config/env';
import { Product, ProductLine, User } from './api';
import { MockOrder } from './mockData/ordersMock';
import { MachineProduct } from '../types/machines';
import { Consumable } from './mockData/consumablesMock';
import { SparePart } from './mockData/sparePartsMock';

// 模拟网络延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock服务类
 * 提供统一的模拟数据访问接口
 */
class MockService {
  // 标记是否使用模拟数据
  private enabled: boolean = useMockData;

  /**
   * 设置是否启用模拟数据
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 判断是否启用了模拟数据
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取所有模拟数据
   */
  getAllData() {
    return mockData;
  }

  /**
   * 导出所有模拟数据
   */
  exportData() {
    return exportAllMockData();
  }

  /**
   * 导入模拟数据
   * @param data 需要导入的数据
   */
  importData(data: any) {
    return importMockData(data);
  }

  /**
   * 获取所有产品
   * @param options 过滤选项
   */
  async getProducts(options: any = {}) {
    if (!this.enabled) return null;
    await delay();
    
    let products = [...mockData.products];
    
    // 应用过滤条件
    if (options.category) {
      products = products.filter((p: Product) => p.category_id === options.category);
    }
    
    // 应用分页
    if (options.page && options.per_page) {
      const start = (options.page - 1) * options.per_page;
      const end = start + options.per_page;
      products = products.slice(start, end);
    }
    
    return {
      success: true,
      data: products,
      total: products.length
    };
  }

  /**
   * 获取单个产品详情
   * @param id 产品ID
   */
  async getProduct(id: number | string) {
    if (!this.enabled) return null;
    await delay();
    
    const product = mockData.products.find((p: Product) => p.id === id);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    return {
      success: true,
      data: product
    };
  }

  /**
   * 获取所有产品线
   */
  async getProductLines() {
    if (!this.enabled) return null;
    await delay();
    
    return {
      success: true,
      data: mockData.productLines,
      total: mockData.productLines.length
    };
  }

  /**
   * 获取单个产品线详情
   * @param id 产品线ID
   */
  async getProductLine(id: number) {
    if (!this.enabled) return null;
    await delay();
    
    const productLine = mockData.productLines.find((pl: ProductLine) => pl.id === id);
    
    if (!productLine) {
      return {
        success: false,
        message: 'Product line not found'
      };
    }
    
    return {
      success: true,
      data: productLine
    };
  }

  /**
   * 获取所有机器
   * @param options 过滤选项
   */
  async getMachines(options: any = {}) {
    if (!this.enabled) return null;
    await delay();
    
    let machines = [...mockData.machines];
    
    // 应用过滤条件
    if (options.region) {
      machines = machines.filter((m: MachineProduct) => 
        m.inventory.some(inv => inv.region === options.region)
      );
    }
    
    // 应用分页
    if (options.page && options.page_size) {
      const start = (options.page - 1) * options.page_size;
      const end = start + options.page_size;
      const items = machines.slice(start, end);
      
      return {
        success: true,
        data: {
          items,
          total: machines.length,
          page: options.page,
          page_size: options.page_size,
          total_pages: Math.ceil(machines.length / options.page_size)
        }
      };
    }
    
    return {
      success: true,
      data: {
        items: machines,
        total: machines.length,
        page: 1,
        page_size: machines.length,
        total_pages: 1
      }
    };
  }

  /**
   * 获取机器配件
   * @param machineId 机器ID
   * @param options 过滤选项
   */
  async getMachineAccessories(machineId: string, options: any = {}) {
    if (!this.enabled) return null;
    await delay();
    
    // 根据level参数返回不同级别的配件数据
    const level = options.level || 1;
    
    let accessories;
    switch(level) {
      case 1:
        accessories = mockData.accessories.level1;
        break;
      case 2:
        accessories = mockData.accessories.level2;
        break;
      case 3:
        accessories = mockData.accessories.level3;
        break;
      case 4:
        accessories = mockData.accessories.level4;
        break;
      case 5:
        accessories = mockData.accessories.level5;
        break;
      default:
        accessories = mockData.accessories.level1;
    }
    
    return {
      success: true,
      data: {
        items: accessories,
        total: accessories.length
      }
    };
  }

  /**
   * 获取所有用户
   */
  async getUsers() {
    if (!this.enabled) return null;
    await delay();
    
    return {
      success: true,
      data: mockData.users,
      total: mockData.users.length
    };
  }

  /**
   * 获取用户详情
   * @param id 用户ID
   */
  async getUser(id: string) {
    if (!this.enabled) return null;
    await delay();
    
    const user = mockData.users.find((u: User) => u.id === id);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      data: user
    };
  }

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   */
  async login(username: string, password: string) {
    if (!this.enabled) return null;
    await delay();
    
    // 在实际应用中，这里会有密码验证
    // 这里为了简化，假设所有用户的密码都是 '123456'
    if (password !== '123456') {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    const user = mockData.users.find((u: User) => u.username === username);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      data: {
        user,
        token: 'mock-jwt-token-' + Date.now()
      }
    };
  }

  /**
   * 获取订单列表
   * @param options 过滤选项
   */
  async getOrders(options: any = {}) {
    if (!this.enabled) return null;
    await delay();
    
    let orders = [...mockData.orders];
    
    // 应用过滤条件
    if (options.userId) {
      orders = orders.filter((o: MockOrder) => o.userId === options.userId);
    }
    
    if (options.status) {
      orders = orders.filter((o: MockOrder) => o.status === options.status);
    }
    
    // 应用分页
    if (options.page && options.per_page) {
      const start = (options.page - 1) * options.per_page;
      const end = start + options.per_page;
      orders = orders.slice(start, end);
    }
    
    return {
      success: true,
      data: orders,
      total: orders.length
    };
  }

  /**
   * 获取订单详情
   * @param id 订单ID
   */
  async getOrder(id: string) {
    if (!this.enabled) return null;
    await delay();
    
    const order = mockData.orders.find((o: MockOrder) => o.id === id);
    
    if (!order) {
      return {
        success: false,
        message: 'Order not found'
      };
    }
    
    return {
      success: true,
      data: order
    };
  }

  /**
   * 创建订单
   * @param orderData 订单数据
   */
  async createOrder(orderData: any) {
    if (!this.enabled) return null;
    await delay();
    
    // 生成新订单ID
    const orderId = 'ord-' + Date.now();
    
    // 生成订单号
    const today = new Date();
    const orderNumber = `BJT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    // 创建订单对象
    const newOrder = {
      id: orderId,
      orderNumber,
      orderDate: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };
    
    // 添加到订单列表中
    // 注意：由于mockData是常量，这里实际上并不会改变原始数据
    // 在实际应用中，这里应该将新订单添加到数据存储中
    
    return {
      success: true,
      data: newOrder
    };
  }

  /**
   * 获取耗材列表
   * @param options 过滤选项
   */
  async getConsumables(options: any = {}) {
    if (!this.enabled) return null;
    await delay();
    
    let consumables = [...mockData.consumables];
    
    // 应用过滤条件
    if (options.category) {
      consumables = consumables.filter((c: Consumable) => c.category === options.category);
    }
    
    if (options.compatibility) {
      consumables = consumables.filter((c: Consumable) => 
        c.compatibility.includes(options.compatibility)
      );
    }
    
    // 应用分页
    if (options.page && options.per_page) {
      const start = (options.page - 1) * options.per_page;
      const end = start + options.per_page;
      consumables = consumables.slice(start, end);
    }
    
    return {
      success: true,
      data: consumables,
      total: consumables.length
    };
  }

  /**
   * 获取备件列表
   * @param options 过滤选项
   */
  async getSpareParts(options: any = {}) {
    if (!this.enabled) return null;
    await delay();
    
    let spareParts = [...mockData.spareParts];
    
    // 应用过滤条件
    if (options.category) {
      spareParts = spareParts.filter((sp: SparePart) => sp.category === options.category);
    }
    
    if (options.compatibility) {
      spareParts = spareParts.filter((sp: SparePart) => 
        sp.compatibility.includes(options.compatibility)
      );
    }
    
    // 应用分页
    if (options.page && options.per_page) {
      const start = (options.page - 1) * options.per_page;
      const end = start + options.per_page;
      spareParts = spareParts.slice(start, end);
    }
    
    return {
      success: true,
      data: spareParts,
      total: spareParts.length
    };
  }
}

// 创建并导出单例实例
const mockService = new MockService();

export default mockService; 