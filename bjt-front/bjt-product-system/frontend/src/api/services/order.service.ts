import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';

// 订单模拟数据
const mockOrdersData: OrderListResponse = {
  items: [
    {
      id: 1001,
      order_number: 'BJT-2023-1001',
      user_id: 1,
      status: 'processing',
      total_amount: 150.00,
      currency: 'CNY',
      shipping_address: {
        name: 'John Doe',
        phone: '13057101000',
        address: 'daf',
        postal_code: '100081'
      },
      billing_address: {
        name: 'John Doe',
        phone: '13057101000',
        address: 'daf',
        postal_code: '100081'
      },
      payment_method: 'Bank Transfer',
      items: [
        {
          order_item_id: 5001,
          product_type: 'machine',
          product_id: 1,
          part_number: '1231313131313',
          name: 'LA ESS test',
          quantity: 1,
          unit_price: 2500.00,
          line_total: 2500.00,
          properties: {
            model: 'LA-ESS V1.1',
            description: 'partNumber: 1231313131313, productName: LA ESS test | 220V',
            brand: 'Lockedair'
          }
        },
        {
          order_item_id: 5002,
          product_type: 'accessory',
          product_id: 2,
          part_number: '60A10002',
          name: 'ET1003 Air Cushion Delivery System',
          quantity: 1,
          unit_price: 1200.00,
          line_total: 1200.00,
          properties: {
            model: 'ET1003',
            description: 'partNumber: 60A10002, productName: ET1003 Air Cushion Delivery System | 110V, 50Hz',
            brand: 'Lockedair'
          }
        },
        {
          order_item_id: 5003,
          product_type: 'accessory',
          product_id: 3,
          part_number: '90R01258',
          name: 'MEX-RH30-13-20-13-L',
          quantity: 1,
          unit_price: 45.50,
          line_total: 45.50,
          properties: {
            model: 'MEX-RH30-13-20-13-L',
            description: 'partNumber: 90R01258, productName: Not Found',
            brand: 'Lockedair'
          }
        },
        {
          order_item_id: 5004,
          product_type: 'accessory',
          product_id: 4,
          part_number: '90R01312',
          name: 'MEX-H-13-20-13-L',
          quantity: 10,
          unit_price: 35.80,
          line_total: 358.00,
          properties: {
            model: 'MEX-H-13-20-13-L',
            description: 'partNumber: 90R01312, productName: Not Found',
            brand: 'Lockedair'
          }
        },
        {
          order_item_id: 5005,
          product_type: 'accessory',
          product_id: 5,
          part_number: '09A0101107',
          name: 'Panel Flexible Flat Cable',
          quantity: 16,
          unit_price: 0.00,
          line_total: 0.00,
          properties: {
            model: 'N/A',
            description: 'partNumber: 09A0101107, productName: Panel Flexible Flat Cable',
            brand: 'N/A'
          }
        }
      ],
      notes: '',
      created_at: '2025-06-22T08:30:00Z',
      updated_at: '2025-06-22T08:30:00Z'
    },
    {
      id: 1002,
      order_number: 'BJT-2023-1002',
      user_id: 1,
      status: 'completed',
      total_amount: 2900.00,
      currency: 'CNY',
      shipping_address: {
        name: 'Hangzhou Bingjia Tech. Co., Ltd.',
        phone: '13800138000',
        address: 'daf',
        postal_code: '100081'
      },
      billing_address: {
        name: 'Hangzhou Bingjia Tech. Co., Ltd.',
        phone: '13800138000',
        address: 'daf',
        postal_code: '100081'
      },
      payment_method: 'Bank Transfer',
      items: [
        {
          order_item_id: 5006,
          product_type: 'consumable',
          product_id: 6,
          part_number: 'CON-2025',
          name: '过滤纸',
          quantity: 10,
          unit_price: 59.90,
          line_total: 599.00,
          properties: {
            model: 'Standard',
            description: '高质量过滤纸，适用于空气过滤系统',
            brand: 'BJT'
          }
        }
      ],
      notes: '',
      created_at: '2025-06-22T13:45:00Z',
      updated_at: '2025-06-22T14:30:00Z'
    }
  ],
  total: 2,
  total_pages: 1,
  page: 1,
  per_page: 10
};

// 地址接口
export interface Address {
  name: string;
  phone: string;
  address: string;
  postal_code?: string;
  country?: string;
  province?: string;
  city?: string;
}

// 订单项目接口
export interface OrderItem {
  order_item_id: number;
  product_type: 'machine' | 'accessory' | 'spare_part' | 'consumable';
  product_id: number;
  part_number: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  properties?: Record<string, any>;
}

// 订单状态类型
export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';

// 订单接口
export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 订单列表响应接口
export interface OrderListResponse {
  items: Order[];
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
}

// 创建订单请求接口
export interface CreateOrderRequest {
  shipping_address: Address;
  billing_address?: Address;
  payment_method: string;
  cart_region?: string;
  cart_lang?: string;
  notes?: string;
  items?: OrderItem[]; // 🔧 添加订单项目支持
  total_amount?: number; // 🔧 添加总金额支持
}

// 更新订单状态请求接口
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

/**
 * 订单服务类
 */
export class OrderService extends BaseService<OrderListResponse, CreateOrderRequest> {
  constructor() {
    super('/orders');
  }

  /**
   * 获取订单列表
   */
  async getOrders(params: {
    page?: number;
    perPage?: number;
    status?: OrderStatus;
    search?: string;
    orderby?: string;
  } = {}): Promise<OrderListResponse> {
    // 🔧 修复：使用真实API数据而不是Mock数据
    const forceMock = false; // 修复：禁用强制Mock模式，使用真实API
    
    if (forceMock || import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      console.log('🔍 [OrderService] 使用Mock数据获取订单列表');
      console.log('🔍 [OrderService] 请求参数:', params);
      return this.getMockData(params);
    }
    
    console.log('🔍 [OrderService] 调用真实API获取订单数据');
    console.log('🔍 [OrderService] 请求参数:', params);
    
    try {
      const result = await this.getData('', params);
      console.log('🔍 [OrderService] API响应结果:', result);
      return result;
    } catch (error) {
      console.error('🔍 [OrderService] API调用失败:', error);
      // API调用失败时返回Mock数据作为备选
      console.log('🔍 [OrderService] API失败，使用Mock数据作为备选');
      return this.getMockData(params);
    }
  }

  /**
   * 获取订单详情
   */
  async getOrder(id: number, params: {
    lang?: string;
  } = {}): Promise<Order> {
    // 🔧 修复：使用真实API数据
    const forceMock = false; // 修复：禁用强制Mock模式，使用真实API
    
    if (forceMock || import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      await delay(300);
      
      const order = mockOrdersData.items.find(o => o.id === id);
      
      if (!order) {
        throw new Error(`Order with ID ${id} not found`);
      }
      
      return order;
    }
    
    // 对于真实API调用，需要特殊处理返回类型
    const response = await ApiService.get(this.getApiPath(`/${id}`), this.addCommonParams(params));
    return response.data as Order;
  }

  /**
   * 创建订单
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    // 🔧 修复：使用真实API数据
    const forceMock = false; // 修复：禁用强制Mock模式，使用真实API
    
    if (forceMock || import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      console.log('🔧 [OrderService] 使用Mock模式创建订单');
      console.log('🔧 [OrderService] 创建订单请求数据:', data);
      
      await delay(500);
      
      const newOrder: Order = {
        id: Date.now(),
        order_number: `BJT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        user_id: 1, // 模拟当前用户ID
        status: 'pending_payment',
        total_amount: data.total_amount || 0, // 🔧 使用传入的总金额
        currency: 'CNY',
        shipping_address: data.shipping_address,
        billing_address: data.billing_address || data.shipping_address,
        payment_method: data.payment_method,
        items: data.items || [], // 🔧 使用传入的订单项目
        notes: data.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🔧 [OrderService] 创建的新订单基础信息:', newOrder);
      
      // 🔧 如果没有传入订单项目，使用默认的mock数据
      if (!data.items || data.items.length === 0) {
        const mockItems: OrderItem[] = [
          {
            order_item_id: newOrder.id * 1000 + 1,
            product_type: 'accessory',
            product_id: 2,
            part_number: 'ACC-2024',
            name: '过滤器组件',
            quantity: 1,
            unit_price: 149.00,
            line_total: 149.00
          }
        ];
        
        newOrder.items = mockItems;
        newOrder.total_amount = mockItems.reduce((sum, item) => sum + item.line_total, 0);
      }
      
      // 🔧 将新订单添加到mock数据中
      mockOrdersData.items.unshift(newOrder); // 使用unshift添加到开头
      mockOrdersData.total = mockOrdersData.items.length;
      
      console.log('🔧 [OrderService] 创建Mock订单成功:', newOrder);
      
      return newOrder;
    }
    
    return this.postData('', data as any) as Promise<Order>;
  }

  /**
   * 更新订单状态
   * @param id 订单ID
   * @param data 更新状态请求数据
   */
  async updateOrderStatus(id: number, data: UpdateOrderStatusRequest): Promise<Order> {
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      await delay(300);
      
      const orderIndex = mockOrdersData.items.findIndex(o => o.id === id);
      if (orderIndex === -1) {
        throw new Error(`订单 ${id} 不存在`);
      }
      
      const updatedOrder = {
        ...mockOrdersData.items[orderIndex],
        status: data.status,
        updated_at: new Date().toISOString()
      };
      
      return updatedOrder as Order;
    }
    
    const response = await ApiService.put(this.getApiPath(`/${id}`), data);
    return response.data;
  }

  /**
   * 取消订单
   * @param id 订单ID
   */
  async cancelOrder(id: number): Promise<Order> {
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      await delay(300);
      
      const orderIndex = mockOrdersData.items.findIndex(o => o.id === id);
      if (orderIndex === -1) {
        throw new Error(`订单 ${id} 不存在`);
      }
      
      const cancelledOrder = {
        ...mockOrdersData.items[orderIndex],
        status: 'cancelled',
        updated_at: new Date().toISOString()
      };
      
      return cancelledOrder as Order;
    }
    
    const response = await ApiService.put(this.getApiPath(`/${id}/cancel`));
    return response.data;
  }

  /**
   * 导出订单PO文档
   * @param id 订单ID
   * @param format 导出格式
   */
  async exportPO(id: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    // 🔧 修复：使用真实API数据
    const forceMock = false; // 修复：禁用强制Mock模式，使用真实API
    
    if (forceMock || import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      await delay(500);
      
      // 模拟返回一个空Blob
      return new Blob(['Mock PO Document'], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel' });
    }
    
    const response = await ApiService.get(this.getApiPath(`/${id}/po`), {
      params: { format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * 重新下单
   * @param id 原订单ID
   */
  async reorder(id: number): Promise<Order> {
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      await delay(500);
      
      const order = mockOrdersData.items.find(o => o.id === id);
      if (!order) {
        throw new Error(`订单 ${id} 不存在`);
      }
      
      const newId = Math.max(...mockOrdersData.items.map(o => o.id)) + 1;
      const orderNumber = `BJT-${new Date().getFullYear()}-${newId}`;
      const now = new Date().toISOString();
      
      // 复制原订单商品但分配新的order_item_id
      const newItems = order.items.map((item, index) => ({
        ...item,
        order_item_id: newId * 1000 + index + 1
      }));
      
      const newOrder: Order = {
        id: newId,
        order_number: orderNumber,
        user_id: order.user_id,
        status: 'pending_payment',
        total_amount: order.total_amount,
        currency: order.currency,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        payment_method: order.payment_method,
        items: newItems,
        notes: `重新下单，原订单号: ${order.order_number}`,
        created_at: now,
        updated_at: now
      };
      
      return newOrder;
    }
    
    const response = await ApiService.post(this.getApiPath(`/${id}/reorder`));
    return response.data;
  }

  /**
   * 获取Mock数据
   */
  protected async getMockData(params: Record<string, any> = {}): Promise<OrderListResponse> {
    await delay(300);
    
    // 复制一份模拟数据，以免修改原始数据
    const mockData = JSON.parse(JSON.stringify(mockOrdersData)) as OrderListResponse;
    
    // 处理分页
    const page = params.page || 1;
    const perPage = params.perPage || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    // 处理筛选
    let filteredItems = [...mockData.items];
    
    // 按状态筛选
    if (params.status) {
      filteredItems = filteredItems.filter(order => order.status === params.status);
    }
    
    // 按搜索关键词筛选
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredItems = filteredItems.filter(order => 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      );
    }
    
    // 处理排序
    if (params.orderby) {
      const [field, direction] = params.orderby.split('.');
      const isDesc = direction === 'desc';
      
      filteredItems.sort((a, b) => {
        if (field === 'created_at') {
          return isDesc 
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        
        if (field === 'total_amount') {
          return isDesc 
            ? b.total_amount - a.total_amount
            : a.total_amount - b.total_amount;
        }
        
        return 0;
      });
    }
    
    // 更新分页信息
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      total: filteredItems.length,
      total_pages: Math.ceil(filteredItems.length / perPage),
      page,
      per_page: perPage
    };
  }
}

// 导出订单服务实例
export default new OrderService(); 