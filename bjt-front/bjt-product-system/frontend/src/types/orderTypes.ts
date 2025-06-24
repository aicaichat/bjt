/**
 * 统一订单数据类型定义
 * 确保Order、OrderList、PO页面使用相同的数据结构
 */

import { UnifiedProduct } from './product.types';

// 基础订单信息
export interface BaseOrderInfo {
  id: string | number;
  orderId: string;
  orderNumber: string; // 统一业务订单号 PO-YYYYMMDDHHMM-XXXXXX
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

// 订单状态枚举
export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PROCESSING = 'processing', 
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

// 订单状态显示映射
export const ORDER_STATUS_LABELS = {
  [OrderStatus.PENDING_PAYMENT]: '待付款',
  [OrderStatus.PROCESSING]: '处理中',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDED]: '已退款',
  [OrderStatus.FAILED]: '失败'
};

// 客户信息
export interface CustomerInfo {
  companyName: string;
  contactName: string;
  address: string;
  phone: string;
  email: string;
  country?: string;
  notes?: string;
}

// 运输信息
export interface ShippingInfo {
  address: string;
  contactName: string;
  phone: string;
  notes?: string;
}

// 订单项目
export interface OrderItem {
  id: string | number;
  productId: string | number;
  code: string; // part_number
  sku: string;
  name: string;
  nameZh?: string;
  nameEn?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  specs?: Record<string, any>;
  properties?: Record<string, any>;
  image?: string;
  type: ProductType;
  model?: string;
  brand?: string;
  description?: string;
  category?: string;
}

// 产品类型
export enum ProductType {
  MACHINE = 'machine',
  SPARE_PART = 'spare_part',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable'
}

// 订单汇总
export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  currency: string;
}

// 完整订单数据
export interface UnifiedOrderData {
  id: string; // 数据库ID
  orderNumber: string; // 统一业务订单号 ORD-YYYYMMDD-XXXXXX
  customerInfo: CustomerInfo;
  shippingInfo: ShippingInfo;
  orderItems: UnifiedProduct[];
  summary: OrderSummary;
  createdAt: string;
  status: OrderStatus;
}

// API响应格式
export interface OrderApiResponse {
  success: boolean;
  data: {
    id: string | number;
    order_number: string;
    user_id: number;
    total_amount: number;
    currency: string;
    status: string;
    shipping_address?: string; // JSON string
    billing_address?: string; // JSON string
    payment_method?: string;
    created_at: string;
    updated_at?: string;
    items?: any[];
  };
  message?: string;
}

// 订单列表项
export interface OrderListItem extends BaseOrderInfo {
  customerName: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  lastUpdated: string;
}

// 订单列表响应
export interface OrderListResponse {
  items: OrderListItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// 订单筛选条件
export interface OrderFilters {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

// PO页面数据
export interface POPageData extends UnifiedOrderData {
  // PO特有字段
  poNumber: string; // 等同于orderNumber
  generatedAt: string;
  validUntil?: string;
  terms?: string;
  
  // 显示控制
  showPrices: boolean;
  showImages: boolean;
  language: 'zh' | 'en';
}

// Excel导出数据
export interface ExcelExportData {
  orderInfo: BaseOrderInfo;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  summary: OrderSummary;
  exportedAt: string;
  exportedBy?: string;
}

// 页面间传递的数据
export interface PageTransferData {
  source: 'order' | 'orderlist' | 'po';
  orderData: UnifiedOrderData;
  timestamp: string;
  context?: Record<string, any>;
} 