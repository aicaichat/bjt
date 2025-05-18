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
      total_amount: 16397.00,
      currency: 'CNY',
      shipping_address: {
        name: '张三',
        phone: '13800138000',
        address: '北京市海淀区科技园路100号',
        postal_code: '100081'
      },
      billing_address: {
        name: '张三',
        phone: '13800138000',
        address: '北京市海淀区科技园路100号',
        postal_code: '100081'
      },
      payment_method: 'alipay',
      items: [
        {
          order_item_id: 5001,
          product_type: 'machine',
          product_id: 1,
          part_number: 'MEY-001',
          name: '气垫机 Pro - MEY系列',
          quantity: 1,
          unit_price: 15999.00,
          line_total: 15999.00
        },
        {
          order_item_id: 5002,
          product_type: 'accessory',
          product_id: 1,
          part_number: 'ACC-2023',
          name: '高压喷头',
          quantity: 2,
          unit_price: 199.00,
          line_total: 398.00
        }
      ],
      notes: '请尽快发货，谢谢！',
      created_at: '2023-05-15T08:30:00Z',
      updated_at: '2023-05-15T08:30:00Z'
    },
    {
      id: 1002,
      order_number: 'BJT-2023-1002',
      user_id: 1,
      status: 'completed',
      total_amount: 599.00,
      currency: 'CNY',
      shipping_address: {
        name: '张三',
        phone: '13800138000',
        address: '北京市海淀区科技园路100号',
        postal_code: '100081'
      },
      billing_address: {
        name: '张三',
        phone: '13800138000',
        address: '北京市海淀区科技园路100号',
        postal_code: '100081'
      },
      payment_method: 'wechat',
      items: [
        {
          order_item_id: 5003,
          product_type: 'consumable',
          product_id: 3,
          part_number: 'CON-2025',
          name: '过滤纸',
          quantity: 10,
          unit_price: 59.90,
          line_total: 599.00
        }
      ],
      notes: '',
      created_at: '2023-04-20T13:45:00Z',
      updated_at: '2023-04-20T14:30:00Z'
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
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      return this.getMockData(params);
    }
    
    return this.getData('', params);
  }

  /**
   * 获取订单详情
   */
  async getOrder(id: number, params: {
    lang?: string;
  } = {}): Promise<Order> {
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
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
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
      await delay(500);
      
      const newOrder: Order = {
        id: Date.now(),
        order_number: `BJT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        user_id: 1, // 模拟当前用户ID
        status: 'pending_payment',
        total_amount: 0, // 将根据实际情况计算
        currency: 'CNY',
        shipping_address: data.shipping_address,
        billing_address: data.billing_address || data.shipping_address,
        payment_method: data.payment_method,
        items: [], // 将从购物车中获取
        notes: data.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 模拟从购物车获取商品
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
      
      mockOrdersData.items.push(newOrder);
      mockOrdersData.total = mockOrdersData.items.length;
      
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
    if (import.meta.env.VITE_USE_MOCK_ORDERS === 'true') {
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