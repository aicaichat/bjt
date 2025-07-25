import apiService from './apiService';
import type {
  RepairTicket,
  CreateRepairTicketRequest,
  UpdateRepairTicketRequest,
  RepairTicketListParams,
  RepairTicketListResponse,
  RepairTicketDetailResponse,
  Warehouse,
  Technician,
  FileUploadResponse,
  RepairTicketStats,
  RepairTicketActivity
} from '../types/repair.types';

/**
 * 维修工单服务类
 */
export class RepairService {
  private baseUrl = '/repair-tickets';

  /**
   * 获取维修工单列表
   */
  async getRepairTickets(params: RepairTicketListParams): Promise<RepairTicketListResponse> {
    try {
      const response = await apiService.get<RepairTicketListResponse>(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repair tickets:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取维修工单详情
   */
  async getRepairTicketDetail(id: number): Promise<RepairTicketDetailResponse> {
    try {
      const response = await apiService.get<RepairTicketDetailResponse>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repair ticket detail:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 创建维修工单
   */
  async createRepairTicket(request: CreateRepairTicketRequest): Promise<RepairTicketDetailResponse> {
    try {
      const response = await apiService.post<RepairTicketDetailResponse>(this.baseUrl, request);
      return response.data;
    } catch (error) {
      console.error('Failed to create repair ticket:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 更新维修工单
   */
  async updateRepairTicket(id: number, request: UpdateRepairTicketRequest): Promise<RepairTicketDetailResponse> {
    try {
      const response = await apiService.put<RepairTicketDetailResponse>(`${this.baseUrl}/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update repair ticket:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 删除维修工单
   */
  async deleteRepairTicket(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete repair ticket:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 批量操作维修工单
   */
  async batchUpdateRepairTickets(ids: number[], action: string, data?: any): Promise<{ success: boolean; data: any }> {
    try {
      if (!ids || ids.length === 0) {
        throw new Error('No repair ticket IDs provided');
      }

      const response = await apiService.post(`${this.baseUrl}/batch`, {
        ids,
        action,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Failed to batch update repair tickets:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 上传附件
   */
  async uploadAttachment(ticketId: number, file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticket_id', ticketId.toString());

      const response = await apiService.post<FileUploadResponse>('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 删除附件
   */
  async deleteAttachment(ticketId: number, attachmentId: number): Promise<{ success: boolean }> {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid repair ticket ID');
      }

      if (!attachmentId || attachmentId <= 0) {
        throw new Error('Invalid attachment ID');
      }

      const response = await apiService.delete<{ success: boolean }>(`${this.baseUrl}/${ticketId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取仓库列表
   */
  async getWarehouses(): Promise<{ success: boolean; data: Warehouse[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Warehouse[] }>('/warehouses');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取技术员列表
   */
  async getTechnicians(warehouseId?: number): Promise<{ success: boolean; data: Technician[] }> {
    try {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const response = await apiService.get<{ success: boolean; data: Technician[] }>('/technicians', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 分配工单到仓库和技术员
   */
  async assignRepairTicket(ticketId: number, warehouseId: number, technicianId: number): Promise<RepairTicket> {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid repair ticket ID');
      }

      const response = await apiService.post<RepairTicket>(`${this.baseUrl}/${ticketId}/assign`, {
        warehouse_id: warehouseId,
        technician_id: technicianId
      });

      return response.data;
    } catch (error) {
      console.error('Failed to assign repair ticket:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取维修工单统计
   */
  async getRepairTicketStats(): Promise<{ success: boolean; data: RepairTicketStats }> {
    try {
      const response = await apiService.get<{ success: boolean; data: RepairTicketStats }>(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repair ticket stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取维修工单活动日志
   */
  async getRepairTicketActivity(ticketId: number): Promise<{ success: boolean; data: RepairTicketActivity[] }> {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid repair ticket ID');
      }

      const response = await apiService.get<{ success: boolean; data: RepairTicketActivity[] }>(`${this.baseUrl}/${ticketId}/activity`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repair ticket activity:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 导出维修工单
   */
  async exportRepairTickets(params: RepairTicketListParams = {}): Promise<Blob> {
    try {
      const response = await apiService.get(`${this.baseUrl}/export`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export repair tickets:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(ticketId: number, type: 'email' | 'sms', recipients: string[], message: string): Promise<{ success: boolean; data: void }> {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid repair ticket ID');
      }

      const response = await apiService.post(`${this.baseUrl}/${ticketId}/notifications`, {
        type,
        recipients,
        message
      });

      return response.data;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 验证维修工单数据
   */
  private validateRepairTicketData(data: CreateRepairTicketRequest): string[] {
    const errors: string[] = [];

    if (!data.title || data.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!data.description || data.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!data.customer_name || data.customer_name.trim() === '') {
      errors.push('Customer name is required');
    }

    if (!data.customer_email || data.customer_email.trim() === '') {
      errors.push('Customer email is required');
    }

    if (!data.customer_phone || data.customer_phone.trim() === '') {
      errors.push('Customer phone is required');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.customer_email && !emailRegex.test(data.customer_email)) {
      errors.push('Invalid email format');
    }

    // 验证电话格式
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (data.customer_phone && !phoneRegex.test(data.customer_phone)) {
      errors.push('Invalid phone format');
    }

    return errors;
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    if (error.response) {
      return new Error(error.response.data.message || '服务器错误');
    } else if (error.request) {
      return new Error('网络连接失败');
    } else {
      return new Error('请求失败');
    }
  }

  /**
   * 格式化维修工单显示数据
   */
  formatRepairTicketForDisplay(ticket: RepairTicket): RepairTicket {
    return {
      ...ticket,
      created_at: new Date(ticket.created_at).toLocaleString('zh-CN'),
      updated_at: new Date(ticket.updated_at).toLocaleString('zh-CN'),
      assigned_at: ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString('zh-CN') : undefined,
      completed_at: ticket.completed_at ? new Date(ticket.completed_at).toLocaleString('zh-CN') : undefined,
    };
  }
}

export const repairService = new RepairService(); 