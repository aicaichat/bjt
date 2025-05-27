import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';
import { AdminHostModel } from '../types/admin-models.types';
import HttpAdminService, { ApiResponse } from '../api/httpAdminService';
import { PaginatedResponse } from '../types';

export interface HostModelParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  product_line_id?: number;
}

export class AdminHostModelService extends BaseAdminService<AdminHostModel> {
  private httpService = HttpAdminService;

  constructor() {
    super(ADMIN_API_ENDPOINTS.HOST_MODELS);
  }

  async getHostModels(params: HostModelParams = {}): Promise<PaginatedResponse<AdminHostModel>> {
    // Filter out undefined, null, and empty string values  
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    
    // Set default values
    const queryParams = {
      page: 1,
      page_size: 10,
      ...filteredParams
    };
    
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const fullUrl = `${ADMIN_API_ENDPOINTS.HOST_MODELS}${queryString ? `?${queryString}` : ''}`;
    
    // Debug log for search functionality
    console.log('AdminHostModelService.getHostModels:', {
      originalParams: params,
      filteredParams,
      queryParams,
      fullUrl
    });
    
    const response = await this.httpService.get<any>(fullUrl);
    
    const paginatedResponse: PaginatedResponse<AdminHostModel> = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
    
    if (response.success && response.data) {
      // Process the API response
      if (Array.isArray(response.data)) {
        paginatedResponse.items = response.data;
        paginatedResponse.total = response.data.length;
      } else if (response.data.items) {
        paginatedResponse.items = response.data.items;
        paginatedResponse.total = response.data.total || response.data.items.length;
        paginatedResponse.page = response.data.page || 1;
        paginatedResponse.page_size = response.data.page_size || 10;
        paginatedResponse.total_pages = response.data.total_pages || 1;
      } else {
        const items = response.data.data || response.data;
        paginatedResponse.items = Array.isArray(items) ? items : [];
        paginatedResponse.total = paginatedResponse.items.length;
      }
    }
    
    return paginatedResponse;
  }

  async getHostModel(id: string): Promise<AdminHostModel> {
    const url = `${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`;
    const response = await this.httpService.get<any>(url);
    return response.data;
  }

  async createHostModel(data: Partial<AdminHostModel>): Promise<AdminHostModel> {
    const response = await this.httpService.post<any>(ADMIN_API_ENDPOINTS.HOST_MODELS, data);
    return response.data;
  }

  async updateHostModel(id: string, data: Partial<AdminHostModel>): Promise<AdminHostModel> {
    const url = `${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`;
    const response = await this.httpService.put<any>(url, data);
    return response.data;
  }

  async deleteHostModel(id: string): Promise<void> {
    const url = `${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`;
    await this.httpService.delete<any>(url);
  }
}

export default new AdminHostModelService(); 