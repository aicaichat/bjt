/**
 * RMA Service
 * 退货/售后API服务
 */

import apiService from './apiService';
import type {
  RMARequest,
  CreateRMARequest,
  UpdateRMARequest,
  RMAListParams,
  RMAListResponse,
  RMADetailResponse,
  CreateRMACommentRequest,
  RMAComment,
  APIResponse,
  PaginatedResponse,
} from '../types/rma.types';

class RMAService {
  private baseURL = '/rma';

  /**
   * 获取RMA列表
   */
  async getRMAList(params: RMAListParams = {}): Promise<RMAListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const url = queryParams.toString() 
        ? `${this.baseURL}?${queryParams.toString()}`
        : this.baseURL;

      const response = await apiService.get<RMAListResponse['data']>(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch RMA list:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取RMA详情
   */
  async getRMADetail(id: number | string): Promise<RMADetailResponse> {
    try {
      // 处理空值或undefined
      if (id === null || id === undefined) {
        throw new Error('Invalid RMA ID: ID cannot be null or undefined');
      }
      
      // 处理创建页面的特殊情况
      if (id === 'create') {
        throw new Error('Invalid RMA ID: "create" is not a valid RMA ID, use RMA creation endpoint instead');
      }
      
      // 处理字符串类型的特殊情况
      if (typeof id === 'string') {
        const trimmedId = id.trim();
        if (trimmedId === '' || trimmedId === 'undefined' || trimmedId === 'null') {
          throw new Error(`Invalid RMA ID: "${trimmedId}" is not a valid ID`);
        }
      }
      
      // 确保ID是有效的数字
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid RMA ID: "${id}" cannot be converted to a valid number`);
      }

      const response = await apiService.get<RMARequest>(`${this.baseURL}/${numericId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch RMA detail:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 创建RMA申请
   */
  async createRMA(data: CreateRMARequest): Promise<APIResponse<RMARequest>> {
    try {
      const response = await apiService.post<RMARequest>(this.baseURL, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to create RMA:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 更新RMA
   */
  async updateRMA(id: number, data: UpdateRMARequest): Promise<APIResponse<RMARequest>> {
    try {
      const response = await apiService.put<RMARequest>(`${this.baseURL}/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update RMA:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取RMA留言列表
   */
  async getRMAComments(rmaId: number | string): Promise<APIResponse<RMAComment[]>> {
    try {
      // 确保ID是有效的数字
      const numericId = typeof rmaId === 'string' ? parseInt(rmaId, 10) : rmaId;
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Invalid RMA ID');
      }

      const response = await apiService.get<RMAComment[]>(`${this.baseURL}/${numericId}/comments`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch RMA comments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 创建RMA留言
   */
  async createRMAComment(rmaId: number, data: CreateRMACommentRequest): Promise<APIResponse<RMAComment>> {
    try {
      const response = await apiService.post<RMAComment>(`${this.baseURL}/${rmaId}/comments`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to create RMA comment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 上传附件
   */
  async uploadAttachment(rmaId: number, file: File): Promise<APIResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.post<{ url: string }>(
        `${this.baseURL}/${rmaId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取用户的RMA统计
   */
  async getRMAStats(): Promise<APIResponse<any>> {
    try {
      const response = await apiService.get<any>(`${this.baseURL}/stats`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch RMA stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 批量操作RMA
   */
  async batchUpdateRMA(ids: number[], action: string, data?: any): Promise<APIResponse<any>> {
    try {
      const response = await apiService.post<any>(`${this.baseURL}/batch`, {
        ids,
        action,
        data,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to batch update RMA:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 导出RMA数据
   */
  async exportRMA(params: RMAListParams = {}): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const url = queryParams.toString() 
        ? `${this.baseURL}/export?${queryParams.toString()}`
        : `${this.baseURL}/export`;

      // 注意：导出功能需要特殊处理，因为apiService返回的是标准格式
      // 这里暂时返回一个空的Blob，实际实现时需要调整
      const response = await apiService.get<any>(url);
      return new Blob([JSON.stringify(response.data)], { type: 'application/json' });
    } catch (error) {
      console.error('Failed to export RMA data:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 处理API错误
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('An unknown error occurred');
  }

  /**
   * 格式化RMA数据（用于显示）
   */
  formatRMAForDisplay(rma: RMARequest): RMARequest {
    return {
      ...rma,
      // 格式化日期
      created_at: new Date(rma.created_at).toLocaleString('zh-CN'),
      updated_at: new Date(rma.updated_at).toLocaleString('zh-CN'),
      // 格式化金额
      total_refund_amount: Number(rma.total_refund_amount),
    };
  }

  /**
   * 验证RMA数据
   */
  validateRMAData(data: CreateRMARequest): string[] {
    const errors: string[] = [];

    if (!data.order_id) {
      errors.push('订单ID不能为空');
    }

    if (!data.reason_category) {
      errors.push('退货原因不能为空');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('至少需要选择一个商品');
    }

    data.items?.forEach((item, index) => {
      if (!item.part_number) {
        errors.push(`第${index + 1}个商品的零件号不能为空`);
      }
      if (!item.product_name) {
        errors.push(`第${index + 1}个商品的名称不能为空`);
      }
      if (item.quantity_to_return <= 0) {
        errors.push(`第${index + 1}个商品的退货数量必须大于0`);
      }
      if (item.quantity_to_return > item.quantity_ordered) {
        errors.push(`第${index + 1}个商品的退货数量不能超过订购数量`);
      }
    });

    return errors;
  }
}

// 创建单例实例
const rmaService = new RMAService();

export default rmaService;
export { RMAService }; 