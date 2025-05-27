import HttpAdminService from '../api/httpAdminService';
import { PaginatedResponseAdapter } from '../../api/adapters/api-adapter';
import { ApiResponse } from '../api/httpAdminService';

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export abstract class BaseAdminService<T> {
  protected readonly baseUrl: string;
  protected readonly adapter: PaginatedResponseAdapter<T>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.adapter = new PaginatedResponseAdapter<T>();
  }

  /**
   * 获取分页数据
   */
  protected async getPaginatedData(
    path: string = '', 
    params: Record<string, any> = {}
  ): Promise<PaginatedResponse<T>> {
    const response = await HttpAdminService.get<PaginatedResponse<T>>(`${this.baseUrl}${path}`, { params });
    
    if (!response.success) {
      throw new Error(response.message || '获取数据失败');
    }
    
    return response.data;
  }

  /**
   * 获取单个项目
   */
  protected async getSingleItem(id: number | string): Promise<T> {
    const response = await HttpAdminService.get<T>(`${this.baseUrl}/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || '获取数据失败');
    }
    
    return response.data;
  }

  /**
   * 创建项目
   */
  protected async createItem(data: Partial<T>): Promise<T> {
    const response = await HttpAdminService.post<T>(this.baseUrl, data);
    
    if (!response.success) {
      throw new Error(response.message || '创建失败');
    }
    
    return response.data;
  }

  /**
   * 更新项目
   */
  protected async updateItem(id: number | string, data: Partial<T>): Promise<T> {
    const response = await HttpAdminService.put<T>(`${this.baseUrl}/${id}`, data);
    
    if (!response.success) {
      throw new Error(response.message || '更新失败');
    }
    
    return response.data;
  }

  /**
   * 删除项目
   */
  protected async deleteItem(id: number | string): Promise<void> {
    const response = await HttpAdminService.delete<void>(`${this.baseUrl}/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || '删除失败');
    }
  }
} 