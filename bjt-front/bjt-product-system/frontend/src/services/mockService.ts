/**
 * 统一Mock数据服务系统
 * 集中管理所有模拟数据，确保一致性
 * 提供统一的接口获取模拟数据，便于未来替换为真实API
 */
import { API_CONFIG, ASSETS } from '../config/appConfig';
import { 
  getMockMachineParts, 
  getMockMachineAccessories
} from '../services/mocks/machines.mocks';
import { getAllMockSpareParts } from "../services/mocks/spareParts.mocks";
import { ProductLine } from './api';
import { SparePartFilterOptions } from '../types/spareParts';
import { MachinePartListData, MachinePart, MachineAccessory } from '../types/machines';

// Destructure for clarity and to avoid property access issues
const { USE_MOCK_DATA } = API_CONFIG;

// 模拟产品线数据
export const mockProductLines: ProductLine[] = [
  {
    id: 1,
    title_en: 'Packaging Machines',
    title_zh: '包装机械',
    description_en: 'High-quality packaging machines for various industrial applications.',
    description_zh: '适用于各种工业应用的高质量包装机械。',
    image_url: '/images/product-lines/packaging-machines.jpg',
    status: 'publish',
    sort_order: 1
  },
  {
    id: 2,
    title_en: 'Filling Solutions',
    title_zh: '灌装解决方案',
    description_en: 'Efficient filling solutions for liquids, powders and pastes.',
    description_zh: '液体、粉末和膏状物的高效灌装解决方案。',
    image_url: '/images/product-lines/filling-solutions.jpg',
    status: 'publish',
    sort_order: 2
  },
  {
    id: 3,
    title_en: 'Labeling Systems',
    title_zh: '标签系统',
    description_en: 'Precise labeling systems for product identification and branding.',
    description_zh: '用于产品标识和品牌推广的精确标签系统。',
    image_url: '/images/product-lines/labeling-systems.jpg',
    status: 'publish',
    sort_order: 3
  }
];

/**
 * 模拟网络延迟
 * @param ms 延迟毫秒数
 * @returns Promise对象
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 随机延迟以模拟实际网络情况
 * @param minMs 最小延迟毫秒数
 * @param maxMs 最大延迟毫秒数
 * @returns Promise对象
 */
const randomDelay = (minMs = 100, maxMs = 800) => {
  return delay(Math.random() * (maxMs - minMs) + minMs);
};

// Export to be used outside this module
export { randomDelay };

/**
 * 检查是否应该使用Mock数据
 * @returns 是否应该使用Mock数据
 */
export const shouldUseMockData = (): boolean => {
  return USE_MOCK_DATA;
};

/**
 * 随机模拟API错误
 * @param errorRate 错误率（0-1之间的数字）
 * @param errorTypes 可能的错误类型
 * @returns 如果触发错误则抛出异常
 */
const simulateRandomError = (errorRate = 0.0) => {
  if (Math.random() < errorRate) {
    const errorTypes = ['network', 'server', 'timeout', 'auth'];
    const randomErrorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    let error: Error & { status?: number } = new Error('服务器错误');
    switch (randomErrorType) {
      case 'network':
        error = new Error('网络连接失败，请检查您的网络');
        break;
      case 'server':
        error = new Error('服务器内部错误，请稍后重试');
        error.status = 500;
        break;
      case 'timeout':
        error = new Error('请求超时，请重试');
        break;
      case 'auth':
        error = new Error('认证失败，请重新登录');
        error.status = 401;
        break;
    }
    throw error;
  }
};

/**
 * 获取API响应包装器
 * 标准化所有模拟API返回的数据格式
 */
const wrapResponse = <T>(data: T, meta = {}) => {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      status: 'success',
      ...meta
    }
  };
};

/**
 * 机器设备相关的模拟数据服务
 */
export const MachinesMockService = {
  /**
   * 获取所有机器设备
   */
  getAllMachines: async (params = {}) => {
    await randomDelay();
    simulateRandomError();
    
    const machinePartData = getMockMachineParts(params);
    return wrapResponse(machinePartData.items, {
      total: machinePartData.total,
      page: machinePartData.page,
      pageSize: machinePartData.page_size,
      totalPages: machinePartData.total_pages,
      params
    });
  },

  /**
   * 获取指定机器设备的详情
   */
  getMachineById: async (id: string) => {
    await randomDelay(200, 500);
    simulateRandomError();
    
    const numericId = parseInt(id, 10);
    const machine = getMockMachineParts({}).items.find(machine => machine.id === numericId);
    if (!machine) {
      const error: Error & { status?: number } = new Error(`找不到ID为${id}的机器`);
      error.status = 404;
      throw error;
    }
    
    return wrapResponse(machine);
  },

  /**
   * 获取机器设备配件
   */
  getMachineAccessories: async (machineId: string, params = {}) => {
    await randomDelay();
    simulateRandomError();
    
    const numericMachineId = parseInt(machineId, 10);
    const machine = getMockMachineParts({}).items.find(machine => machine.id === numericMachineId);
    if (!machine) {
      const error: Error & { status?: number } = new Error(`找不到ID为${machineId}的机器`);
      error.status = 404;
      throw error;
    }
    
    // Use the new function to get accessories based on the machine's part number
    const accessories = getMockMachineAccessories(machine.part_number);
    
    return wrapResponse(accessories, {
      machineId,
      count: accessories.length,
      params
    });
  }
};

/**
 * 备件相关的模拟数据服务
 */
export const SparePartsMockService = {
  /**
   * 获取所有备件
   * @param params 查询参数
   */
  getAllSpareParts: async (params: any = {}) => {
    await randomDelay();
    simulateRandomError();
    
    let parts = getAllMockSpareParts();
    
    // Filter based on available SparePart properties
    // Remove filters for non-existent properties: type, product_type, category

    // Keep filtering by compatible model (app_model)
    if (params.model) {
      parts = parts.filter(part => 
        part.app_model?.toLowerCase().split(',').map(m => m.trim()).includes(params.model.toLowerCase())
      );
    }
    
    // Add filtering by is_consumable if needed (example)
    if (typeof params.is_consumable === 'boolean') {
      parts = parts.filter(part => part.is_consumable === params.is_consumable);
    }

    // Add filtering by search text (example on name or part number)
    if (params.searchText) {
      const searchTextLower = params.searchText.toLowerCase();
      parts = parts.filter(part => 
        part.name_en.toLowerCase().includes(searchTextLower) ||
        part.part_number.toLowerCase().includes(searchTextLower)
      );
    }

    // Apply分页
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedParts = parts.slice(startIndex, endIndex);
    
    // Note: Returning filter options here might be better suited for getSparePartsFilterOptions
    return wrapResponse(paginatedParts, {
      total: parts.length,
      page,
      pageSize,
      totalPages: Math.ceil(parts.length / pageSize),
      params 
    });
  },

  /**
   * 获取备件详情
   */
  getSparePartById: async (id: string) => {
    await randomDelay(200, 500);
    simulateRandomError();
    
    // Ensure comparison is string vs string
    const part = getAllMockSpareParts().find(part => String(part.id) === id);
    if (!part) {
      const error: Error & { status?: number } = new Error(`找不到ID为${id}的备件`);
      error.status = 404;
      throw error;
    }
    
    return wrapResponse(part);
  },

  /**
   * 获取备件筛选选项
   */
  getSparePartsFilterOptions: async () => {
    await randomDelay(50, 200);
    simulateRandomError();

    const allParts = getAllMockSpareParts(); 

    const hostModelsSet = new Set<string>();
    const accessoryModelsSet = new Set<string>();

    allParts.forEach(part => {
      const models = part.app_model?.split(',').map(m => m.trim()).filter(Boolean) || [];
      if (part.product_type === 'machine') {
        models.forEach(model => hostModelsSet.add(model));
      } else if (part.product_type === 'accessory') {
        models.forEach(model => accessoryModelsSet.add(model));
      }
      // Consider if a model could belong to both or if product_type can be other values.
    });

    // Define partTypes options, this should match the structure expected by FilterOptions in sparePartsApi.ts
    const partTypeOptions = [
      { id: 'true', name: 'Consumable' }, // Name should be the display text
      { id: 'false', name: 'Standard' }
    ];

    // Construct filter options to match the FilterOptions interface from sparePartsApi.ts
    // This object's type should effectively be FilterOptions
    const structuredFilterOptions = {
      hostModels: Array.from(hostModelsSet).sort(), 
      accessoryModels: Array.from(accessoryModelsSet).sort(), 
      partTypes: partTypeOptions,
      // categories: [] // Add this if FilterOptions in sparePartsApi.ts includes categories and they are needed.
    };

    return wrapResponse(structuredFilterOptions);
  }
};

/**
 * 耗材相关的模拟数据
 */
// 模拟耗材数据
const mockConsumables = [
  {
    id: '1',
    name: 'Standard Bubble Film',
    code: 'PL-001',
    model: 'MEX-10-20-10',
    image_url: ASSETS.getUrl('/images/products/consumables/PL-001.jpg'),
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.05mm',
      width: '200mm',
      length: '300mm',
      rollLength: '500m',
      compatibility: 'E5P/E4S',
      weight: '50g/m²'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 100,
        regionalPrices: { eu: 120, na: 100, au: 130, cn: 650 } 
      },
      { 
        range: '11-100', 
        price: 90,
        regionalPrices: { eu: 100, na: 90, au: 110, cn: 580 } 
      },
      { 
        range: '> 100', 
        price: 50,
        regionalPrices: { eu: 60, na: 50, au: 65, cn: 320 } 
      }
    ],
    inventory: { us: 1, au: 2, eu: 3, cn: 50 }
  },
  {
    id: '2',
    name: 'Cushioning Bubble Film',
    code: 'PL-002',
    model: 'MEX-10-20-13',
    image_url: ASSETS.getUrl('/images/products/consumables/PL-002.jpg'),
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.08mm',
      width: '300mm',
      length: '400mm',
      rollLength: '600m',
      compatibility: 'E5P/E4S',
      weight: '75g/m²'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 95,
        regionalPrices: { eu: 115, na: 95, au: 125, cn: 620 } 
      },
      { 
        range: '11-100', 
        price: 85,
        regionalPrices: { eu: 95, na: 85, au: 105, cn: 550 } 
      },
      { 
        range: '> 100', 
        price: 45,
        regionalPrices: { eu: 55, na: 45, au: 60, cn: 290 } 
      }
    ],
    inventory: { us: 2, au: 3, eu: 5, cn: 38 }
  },
  {
    id: '3',
    name: 'Anti-shock Bubble Film',
    code: 'PL-003',
    model: 'MEX-10-20-15',
    image_url: ASSETS.getUrl('/images/products/consumables/PL-003.jpg'),
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.10mm',
      width: '300mm',
      length: '450mm',
      rollLength: '450m',
      compatibility: 'E5P/E4S',
      weight: '100g/m²'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 110,
        regionalPrices: { eu: 130, na: 110, au: 140, cn: 700 } 
      },
      { 
        range: '11-100', 
        price: 100,
        regionalPrices: { eu: 120, na: 100, au: 130, cn: 650 } 
      },
      { 
        range: '> 100', 
        price: 60,
        regionalPrices: { eu: 70, na: 60, au: 75, cn: 390 } 
      }
    ],
    inventory: { us: 3, au: 2, eu: 4, cn: 26 }
  }
];

// 耗材选项数据
export const consumableOptions = {
  shapes: [
    { id: 'pillow', name: 'Pillow', image_url: ASSETS.getUrl('/images/icons/shape-pillow.svg') },
    { id: 'bubble', name: 'Bubble', image_url: ASSETS.getUrl('/images/icons/shape-bubble.svg') },
    { id: 'tube', name: 'Tube', image_url: ASSETS.getUrl('/images/icons/shape-tube.svg') }
  ],
  materials: [
    { id: 'hdpe', name: 'HDPE' },
    { id: 'ldpe', name: 'LDPE' },
    { id: 'nylon', name: 'Nylon' },
    { id: 'paper_pe', name: 'PAPER+PE' }
  ],
  models: [
    { id: 'all', name: 'ALL' },
    { id: 'la-e4s', name: 'LA-E4S' },
    { id: 'mex-10-20', name: 'MEX-10-20' },
    { id: 'lp-v1', name: 'LP-V1' }
  ],
  thicknesses: [
    { id: 'all', name: 'ALL' },
    { id: '0.05mm', name: '0.05mm' },
    { id: '0.08mm', name: '0.08mm' },
    { id: '0.10mm', name: '0.10mm' }
  ],
  weights: [
    { id: 'all', name: 'ALL' },
    { id: '50g', name: '50g/m²' },
    { id: '75g', name: '75g/m²' },
    { id: '100g', name: '100g/m²' }
  ],
  widths: [
    { id: 'all', name: 'ALL' },
    { id: '200mm', name: '200mm' },
    { id: '250mm', name: '250mm' },
    { id: '300mm', name: '300mm' }
  ],
  lengths: [
    { id: 'all', name: 'ALL' },
    { id: '300mm', name: '300mm' },
    { id: '350mm', name: '350mm' },
    { id: '400mm', name: '400mm' }
  ],
  modelExplodedViews: {
    'all': ASSETS.getUrl('/images/models/exploded-view-default.svg'),
    'la-e4s': ASSETS.getUrl('/images/models/LA-E4S-exploded-view.svg'),
    'mex-10-20': ASSETS.getUrl('/images/models/MEX-10-20-exploded-view.svg'),
    'lp-v1': ASSETS.getUrl('/images/models/LP-V1-exploded-view.svg')
  }
};

/**
 * 耗材相关的模拟数据服务
 */
export const ConsumablesMockService = {
  /**
   * 获取所有耗材
   * @param filters 筛选参数
   */
  getConsumables: async (filters: any = {}) => {
    await randomDelay(500); // 模拟网络延迟
    simulateRandomError();
    
    // 筛选逻辑
    let filteredProducts = [...mockConsumables];
    
    if (filters.material && filters.material !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.material.toLowerCase() === filters.material.toLowerCase()
      );
    }
    
    if (filters.shape && filters.shape !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.shape.toLowerCase() === filters.shape.toLowerCase()
      );
    }
    
    if (filters.thickness && filters.thickness !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.thickness === filters.thickness
      );
    }
    
    if (filters.width && filters.width !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.width === filters.width
      );
    }
    
    if (filters.length && filters.length !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.length === filters.length
      );
    }
    
    if (filters.model && filters.model !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.compatibility.includes(filters.model)
      );
    }
    
    if (filters.weight && filters.weight !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.specs.weight === filters.weight
      );
    }
    
    // 分页处理
    const page = filters.page || 1;
    const pageSize = filters.page_size || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return wrapResponse({
      items: paginatedProducts,
      total: filteredProducts.length,
      page: page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredProducts.length / pageSize)
    });
  },

  /**
   * 获取耗材选项
   */
  getConsumableOptions: async () => {
    await randomDelay(200);
    simulateRandomError();
    
    return wrapResponse(consumableOptions);
  }
};

/**
 * 购物车相关的模拟数据服务
 */
export const CartMockService = {
  /**
   * 获取购物车内容
   */
  getCart: async (userId: string) => {
    await randomDelay(200, 400);
    simulateRandomError();
    
    // 从本地存储获取购物车数据
    const cartData = localStorage.getItem(`cart_${userId}`);
    const cart = cartData ? JSON.parse(cartData) : { items: [], total: 0 };
    
    return wrapResponse(cart);
  },
  
  /**
   * 添加商品到购物车
   */
  addToCart: async (userId: string, item: any) => {
    await randomDelay(300, 600);
    simulateRandomError();
    
    // 从本地存储获取购物车数据
    const cartData = localStorage.getItem(`cart_${userId}`);
    const cart = cartData ? JSON.parse(cartData) : { items: [], total: 0 };
    
    // 检查商品是否已在购物车中
    const existingItemIndex = cart.items.findIndex((i: any) => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // 更新已有商品数量
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      // 添加新商品
      cart.items.push(item);
    }
    
    // 重新计算总价
    cart.total = cart.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
    
    // 保存到本地存储
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    
    return wrapResponse(cart);
  },
  
  /**
   * 更新购物车中商品数量
   */
  updateCartItem: async (userId: string, itemId: string, quantity: number) => {
    await randomDelay(200, 500);
    simulateRandomError();
    
    // 从本地存储获取购物车数据
    const cartData = localStorage.getItem(`cart_${userId}`);
    if (!cartData) {
      const error: Error & { status?: number } = new Error('购物车不存在');
      error.status = 404;
      throw error;
    }
    
    const cart = JSON.parse(cartData);
    
    // 查找商品
    const itemIndex = cart.items.findIndex((i: any) => i.id === itemId);
    if (itemIndex < 0) {
      const error: Error & { status?: number } = new Error('购物车中找不到该商品');
      error.status = 404;
      throw error;
    }
    
    // 更新数量
    if (quantity <= 0) {
      // 移除商品
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    // 重新计算总价
    cart.total = cart.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
    
    // 保存到本地存储
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    
    return wrapResponse(cart);
  },
  
  /**
   * 清空购物车
   */
  clearCart: async (userId: string) => {
    await randomDelay(100, 300);
    simulateRandomError();
    
    // 保存空购物车到本地存储
    localStorage.setItem(`cart_${userId}`, JSON.stringify({ items: [], total: 0 }));
    
    return wrapResponse({ items: [], total: 0 });
  }
};

/**
 * 订单相关的模拟数据服务
 */
export const OrderMockService = {
  /**
   * 创建订单
   */
  createOrder: async (userId: string, orderData: any) => {
    await randomDelay(500, 1000);
    simulateRandomError();
    
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const order = {
      id: orderId,
      userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // 保存订单到本地存储
    const ordersData = localStorage.getItem(`orders_${userId}`);
    const orders = ordersData ? JSON.parse(ordersData) : [];
    orders.push(order);
    localStorage.setItem(`orders_${userId}`, JSON.stringify(orders));
    
    // 清空购物车
    await CartMockService.clearCart(userId);
    
    return wrapResponse(order);
  },
  
  /**
   * 获取用户所有订单
   */
  getUserOrders: async (userId: string) => {
    await randomDelay(300, 700);
    simulateRandomError();
    
    // 从本地存储获取订单数据
    const ordersData = localStorage.getItem(`orders_${userId}`);
    const orders = ordersData ? JSON.parse(ordersData) : [];
    
    return wrapResponse(orders, {
      count: orders.length
    });
  },
  
  /**
   * 获取订单详情
   */
  getOrderById: async (userId: string, orderId: string) => {
    await randomDelay(200, 500);
    simulateRandomError();
    
    // 从本地存储获取订单数据
    const ordersData = localStorage.getItem(`orders_${userId}`);
    const orders = ordersData ? JSON.parse(ordersData) : [];
    
    // 查找订单
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) {
      const error: Error & { status?: number } = new Error(`找不到ID为${orderId}的订单`);
      error.status = 404;
      throw error;
    }
    
    return wrapResponse(order);
  }
};

/**
 * 产品线相关的模拟数据服务
 */
export const ProductLinesMockService = {
  /**
   * 获取所有产品线
   */
  getProductLines: async () => {
    await randomDelay(200, 500);
    return mockProductLines;
  }
};

// Default export for the mock service
const mockService = {
  randomDelay,
  getProductLines: ProductLinesMockService.getProductLines,
  // Add other mock services here to expose them through a single entry point
  ...MachinesMockService,
  ...SparePartsMockService,
  shouldUseMockData,
  delay,
  simulateRandomError,
  wrapResponse,
  ConsumablesMockService,
  CartMockService,
  OrderMockService,
  getMachines: async (filters: any = {}, page: number = 1, perPage: number = 10): Promise<MachinePartListData> => {
    console.log('[Mock] Fetching machines with filters:', filters, 'page:', page, 'perPage:', perPage);
    
    // Simulate API delay
    await randomDelay(); // Use the existing randomDelay helper
    simulateRandomError(); // Use the existing simulateRandomError helper

    // Call getMockMachineParts with filters and pagination parameters
    const machinePartData = getMockMachineParts({ ...filters, page, page_size: perPage });

    // The getMockMachineParts function already returns data in MachinePartListData format,
    // including items, total, page, page_size, and total_pages.
    // So, no need to re-calculate pagination here.
    return machinePartData;
  },
  getMachine: async (id: string | number): Promise<MachinePart | undefined> => {
    console.log('[Mock] Fetching machine part with ID:', id);
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    // Corrected: Find the part by its ID in the .items array
    const part = getMockMachineParts({}).items.find((p: MachinePart) => p.id === numericId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return part;
  },
  getAccessories: async (machineId: string): Promise<MachineAccessory[]> => {
    console.log('[Mock] Fetching accessories for machine ID:', machineId);
    // TODO: Implement logic to get accessories based on machineId/part_number using relations
    await new Promise(resolve => setTimeout(resolve, 200));
    return getMockMachineAccessories(machineId); // Return placeholder for now
  }
};

export default mockService; 