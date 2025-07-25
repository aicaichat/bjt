/**
 * RMA (Return Merchandise Authorization) Types
 * 退货/售后相关类型定义
 */

// RMA状态枚举
export type RMAStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'completed' | 'cancelled';

// RMA优先级枚举
export type RMAPriority = 'low' | 'normal' | 'high' | 'urgent';

// 留言类型枚举
export type RMACommentType = 'comment' | 'status_change' | 'system_log';

// 商品状况枚举
export type ProductCondition = 'new' | 'used' | 'damaged' | 'defective';

// 退货原因分类
export type ReturnReasonCategory = 
  | 'quality_issue'      // 质量问题
  | 'wrong_item'         // 发错商品
  | 'damaged_shipping'   // 运输损坏
  | 'not_as_described'   // 与描述不符
  | 'defective'          // 产品缺陷
  | 'customer_change'    // 客户改变主意
  | 'other';             // 其他原因

// 附件信息
export interface RMAAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

// RMA商品项目
export interface RMAItem {
  id: number;
  order_item_id: number;
  part_number: string;
  product_name: string;
  quantity_ordered: number;
  quantity_to_return: number;
  unit_price: number;
  refund_amount: number;
  return_reason?: string;
  condition_received?: ProductCondition;
  created_at: string;
}

// RMA留言
export interface RMAComment {
  id: number;
  rma_id: number;
  user_id: number;
  comment_type: RMACommentType;
  content: string;
  attachments: RMAAttachment[];
  is_internal: boolean;
  metadata: Record<string, any>;
  created_at: string;
  // 扩展字段（前端使用）
  user_name?: string;
  user_role?: string;
}

// RMA主要数据结构
export interface RMARequest {
  id: number;
  rma_number: string;
  order_id: number;
  order_number: string;
  user_id: number;
  status: RMAStatus;
  reason_category: ReturnReasonCategory;
  reason_detail?: string;
  total_refund_amount: number;
  warehouse?: string;
  priority: RMAPriority;
  assigned_to?: number;
  attachments: RMAAttachment[];
  metadata: Record<string, any>;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  items: RMAItem[];
  comments?: RMAComment[];
  
  // 扩展字段（前端使用）
  customer_name?: string;
  assigned_to_name?: string;
}

// 创建RMA请求的数据结构
export interface CreateRMARequest {
  order_id: number;
  reason_category: ReturnReasonCategory;
  reason_detail?: string;
  warehouse?: string;
  priority?: RMAPriority;
  items: Array<{
    order_item_id: number;
    part_number: string;
    product_name: string;
    quantity_ordered: number;
    quantity_to_return: number;
    unit_price: number;
    refund_amount: number;
    return_reason?: string;
  }>;
  attachments?: RMAAttachment[];
  metadata?: Record<string, any>;
}

// 更新RMA请求的数据结构
export interface UpdateRMARequest {
  status?: RMAStatus;
  priority?: RMAPriority;
  assigned_to?: number;
  admin_notes?: string;
  metadata?: Record<string, any>;
}

// RMA列表查询参数
export interface RMAListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: RMAStatus;
  order_id?: number;
  user_id?: number;
  assigned_to?: number;
  priority?: RMAPriority;
  date_from?: string;
  date_to?: string;
}

// RMA列表响应数据
export interface RMAListResponse {
  success: boolean;
  data: {
    items: RMARequest[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  message?: string;
}

// RMA详情响应数据
export interface RMADetailResponse {
  success: boolean;
  data: RMARequest;
  message?: string;
}

// 创建留言请求
export interface CreateRMACommentRequest {
  content: string;
  comment_type?: RMACommentType;
  is_internal?: boolean;
  attachments?: RMAAttachment[];
  metadata?: Record<string, any>;
}

// RMA统计数据
export interface RMAStats {
  total: number;
  pending: number;
  processing: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

// RMA表单数据（用于创建退货申请）
export interface RMAFormData {
  order_id: number;
  reason_category: ReturnReasonCategory;
  reason_detail: string;
  selected_items: Array<{
    order_item_id: number;
    part_number: string;
    product_name: string;
    quantity_ordered: number;
    quantity_to_return: number;
    unit_price: number;
    return_reason: string;
  }>;
  attachments: File[];
}

// 状态显示配置
export type RMAStatusConfig = {
  [key in RMAStatus]: {
    color: 'default' | 'processing' | 'success' | 'error' | 'warning';
    text: string;
    icon?: string;
  };
};

// 优先级显示配置
export type RMAPriorityConfig = {
  [key in RMAPriority]: {
    color: 'default' | 'processing' | 'success' | 'error' | 'warning';
    text: string;
    icon?: string;
  };
};

// 退货原因显示配置
export type ReturnReasonConfig = {
  [key in ReturnReasonCategory]: {
    text: string;
    description?: string;
  };
};

// API响应基础结构
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

// 错误响应结构
export interface APIErrorResponse {
  success: false;
  message: string;
  code: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  per_page: number;
}

// 分页响应数据
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 所有类型已在上面单独导出，无需额外的导出声明 