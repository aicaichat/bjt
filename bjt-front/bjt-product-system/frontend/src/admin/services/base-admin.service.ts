import HttpAdminService from '../api/httpAdminService';
import { PaginatedResponseAdapter } from '../../api/adapters/api-adapter';

export abstract class BaseAdminService<T> {
  protected readonly baseUrl: string;
  protected readonly adapter: PaginatedResponseAdapter<T>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.adapter = new PaginatedResponseAdapter<T>();
  }

  protected async getPaginatedData(
    path: string = '', 
    params: Record<string, any> = {}
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await HttpAdminService.get(`${this.baseUrl}${path}`, { params });
    return this.adapter.fromApiResponse(response);
  }

  protected async getSingleItem(id: number): Promise<T> {
    const response = await HttpAdminService.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  protected async createItem(data: Partial<T>): Promise<T> {
    const response = await HttpAdminService.post(this.baseUrl, data);
    return response.data;
  }

  protected async updateItem(id: number, data: Partial<T>): Promise<T> {
    const response = await HttpAdminService.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  protected async deleteItem(id: number): Promise<void> {
    await HttpAdminService.delete(`${this.baseUrl}/${id}`);
  }
} 