// 统一的产品接口定义，供Order、OrderList和PO页面使用
export interface UnifiedProduct {
  id: string;
  code?: string;
  sku?: string;
  model?: string;
  model_imperial?: string; // 英制型号信息
  name: string | { [key: string]: string };
  spec?: string; // 单数形式的规格信息
  specs?: string | Record<string, string>; // 复数形式的规格信息
  spec_imperial?: string; // 英制规格信息
  properties?: Record<string, string>;
  unit?: string;
  quantity: number;
  price: number;
  unit_price?: number; // Order页面使用
  amount?: number;
  image?: string;
  image_url?: string; // Order页面使用
  type?: string;
  product_type?: string; // Order页面使用
  brand?: string;
  category?: string;
  part_number?: string;
  item_id?: number;
  product_id?: number;
  shippingInfo?: any; // 可能的运输信息
  detailInfo?: {
    title: string;
    sections: Array<{
      title?: string;
      properties: Array<{
        label: string;
        value: string;
      }>;
    }>;
  };
}

// 订单基本信息接口
export interface UnifiedOrder {
  id: string;
  orderNumber?: string;
  order_number?: string; // API格式
  date: string;
  created_at?: string; // API格式
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  total: number;
  total_amount?: number; // API格式
  paymentMethod: string;
  payment_method?: string; // API格式
  shippingInfo: string | any;
  shipping_address?: any; // API格式
  items: UnifiedProduct[];
  language?: 'zh' | 'en'; // 语言标识
}

// 客户信息接口
export interface CustomerInfo {
  companyName: string;
  contactName: string;
  address: string;
  phone: string;
  email: string;
}

// 运输信息接口
export interface ShippingInfo {
  address: string;
  contactName: string;
  phone: string;
  notes: string;
}

// 订单汇总接口
export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
}

// PO页面数据传递接口
export interface POData {
  orderId?: string;
  orderNumber?: string; // 真实的订单号
  orderItems: UnifiedProduct[];
  customerInfo: CustomerInfo;
  shippingInfo: ShippingInfo;
  summary: OrderSummary;
}

// PO页面location state接口
export interface POLocationState {
  poData: POData;
  source?: string; // 数据来源标识
  autoPrint?: boolean;
  originalOrderId?: string; // 原始订单ID
  action?: string; // 操作类型
  timestamp?: number; // 时间戳
} 