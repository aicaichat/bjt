/**
 * 维修工单系统类型定义
 */

// 维修工单状态
export type RepairTicketStatus = 
  | 'pending'      // 待处理
  | 'assigned'     // 已分配
  | 'in_progress'  // 处理中
  | 'waiting_parts' // 等待配件
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'rejected';    // 已拒绝

// 优先级
export type RepairPriority = 
  | 'low'     // 低
  | 'normal'  // 普通
  | 'high'    // 高
  | 'urgent'; // 紧急

// 问题类型
export type RepairIssueType = 
  | 'hardware_failure'    // 硬件故障
  | 'software_issue'      // 软件问题
  | 'maintenance'         // 维护保养
  | 'installation'        // 安装调试
  | 'training'           // 培训支持
  | 'calibration'        // 校准服务
  | 'upgrade'            // 升级服务
  | 'other';             // 其他

// 附件类型
export interface RepairAttachment {
  id: number;
  ticket_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  uploaded_by: number;
  uploaded_at: string;
}

// 维修工单基本信息
export interface RepairTicket {
  id: number;
  ticket_number: string;          // 工单编号
  title: string;                  // 工单标题
  description: string;            // 问题描述
  issue_type: RepairIssueType;    // 问题类型
  priority: RepairPriority;       // 优先级
  status: RepairTicketStatus;     // 状态
  
  // 客户信息
  customer_name: string;          // 客户姓名
  customer_email: string;         // 客户邮箱
  customer_phone: string;         // 客户电话
  company_name?: string;          // 公司名称
  
  // 设备信息
  device_model?: string;          // 设备型号
  device_serial?: string;         // 设备序列号
  device_location?: string;       // 设备位置
  purchase_date?: string;         // 购买日期
  warranty_status?: 'in_warranty' | 'out_of_warranty' | 'extended'; // 保修状态
  
  // 分配信息
  assigned_warehouse?: string;    // 分配仓库
  assigned_technician?: number;   // 分配技术员ID
  technician_name?: string;       // 技术员姓名
  technician_email?: string;      // 技术员邮箱
  
  // 时间信息
  created_at: string;
  updated_at: string;
  assigned_at?: string;           // 分配时间
  completed_at?: string;          // 完成时间
  
  // 附件
  attachments?: RepairAttachment[];
  
  // 备注
  customer_notes?: string;        // 客户备注
  internal_notes?: string;        // 内部备注
  resolution_notes?: string;      // 解决方案备注
  
  // 提交方式
  submission_method: 'online' | 'admin'; // 提交方式
  
  // 地理位置（移动端提交时）
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
}

// 创建维修工单请求
export interface CreateRepairTicketRequest {
  title: string;
  description: string;
  issue_type: RepairIssueType;
  priority: RepairPriority;
  
  // 客户信息
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name?: string;
  
  // 设备信息
  device_model?: string;
  device_serial?: string;
  device_location?: string;
  purchase_date?: string;
  warranty_status?: 'in_warranty' | 'out_of_warranty' | 'extended';
  
  // 备注
  customer_notes?: string;
  
  // 提交方式
  submission_method: 'online' | 'admin';
  
  // 地理位置
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
  
  // 附件（文件上传后的文件ID）
  attachment_ids?: number[];
}

// 更新维修工单请求
export interface UpdateRepairTicketRequest {
  title?: string;
  description?: string;
  issue_type?: RepairIssueType;
  priority?: RepairPriority;
  status?: RepairTicketStatus;
  
  // 分配信息
  assigned_warehouse?: string;
  assigned_technician?: number;
  
  // 备注
  internal_notes?: string;
  resolution_notes?: string;
}

// 维修工单列表参数
export interface RepairTicketListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: RepairTicketStatus;
  issue_type?: RepairIssueType;
  priority?: RepairPriority;
  assigned_warehouse?: string;
  assigned_technician?: number;
  date_from?: string;
  date_to?: string;
  submission_method?: 'online' | 'admin';
}

// 维修工单列表响应
export interface RepairTicketListResponse {
  success: boolean;
  data: {
    items: RepairTicket[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// 维修工单详情响应
export interface RepairTicketDetailResponse {
  success: boolean;
  data: RepairTicket;
}

// 仓库信息
export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
}

// 技术员信息
export interface Technician {
  id: number;
  name: string;
  email: string;
  phone: string;
  warehouse_id: number;
  warehouse_name: string;
  specialties: string[];
  is_active: boolean;
}

// 文件上传响应
export interface FileUploadResponse {
  success: boolean;
  data: {
    id: number;
    filename: string;
    original_name: string;
    file_size: number;
    mime_type: string;
    file_url: string;
  };
}

// 通用API响应
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 维修工单统计
export interface RepairTicketStats {
  total: number;
  by_status: Record<RepairTicketStatus, number>;
  by_priority: Record<RepairPriority, number>;
  by_issue_type: Record<RepairIssueType, number>;
  by_warehouse: Record<string, number>;
  avg_resolution_time: number; // 平均解决时间（小时）
  pending_count: number;
  overdue_count: number;
}

// 维修工单活动日志
export interface RepairTicketActivity {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name: string;
  action: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
} 