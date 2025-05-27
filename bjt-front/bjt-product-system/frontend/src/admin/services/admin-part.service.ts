import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';
import { AdminPart } from '../types/admin-models.types';
import HttpAdminService from '../api/httpAdminService';
import { PaginatedResponse } from '../types';

export interface PartParams {
  page?: number;
  page_size?: number;
  search?: string;
  host_model_id?: string;
  status?: string;
  product_line_id?: number;
}

class AdminPartService extends BaseAdminService<AdminPart> {
  private httpService = HttpAdminService;

  constructor() {
    super(ADMIN_API_ENDPOINTS.PARTS);
  }

  async getParts(params: PartParams = {}): Promise<PaginatedResponse<AdminPart>> {
    // Filter out undefined, null, and empty string values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    
    // Set default values
    const queryParams: any = {
      page: 1,
      per_page: 10, // 后端使用 per_page 而不是 page_size
      ...filteredParams
    };
    
    // 如果有 host_model_id，需要根据后端API调整为正确的参数名
    if (queryParams.host_model_id) {
      // 根据后端BJT_Machine_Part_Controller，使用model参数代表主机型号代码
      // 这里需要通过host_model_id查找对应的model代码，暂时保持原样
      // TODO: 实现ID到model代码的转换
      queryParams.model = queryParams.host_model_id;
      delete queryParams.host_model_id;
    }
    
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const url = ADMIN_API_ENDPOINTS.PARTS;
    const fullUrl = `${url}${queryString ? `?${queryString}` : ''}`;
    
    // Debug log for search functionality
    console.log('AdminPartService.getParts:', {
      originalParams: params,
      filteredParams,
      queryParams,
      fullUrl
    });
    
    const response = await this.httpService.get<any>(fullUrl);
    
    const paginatedResponse: PaginatedResponse<AdminPart> = {
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
        paginatedResponse.page_size = response.data.per_page || 10; // 对应后端的 per_page
        paginatedResponse.total_pages = response.data.total_pages || 1;
      } else {
        const items = response.data.data || response.data;
        paginatedResponse.items = Array.isArray(items) ? items : [];
        paginatedResponse.total = paginatedResponse.items.length;
      }
    }
    
    return paginatedResponse;
  }

  async getPart(id: string, hostModelId?: string): Promise<AdminPart> {
    const url = ADMIN_API_ENDPOINTS.PART.replace(':id', id);
    
    const response = await this.httpService.get<AdminPart>(url);
    return response.data;
  }

  async createPart(data: Partial<AdminPart>, hostModelId?: string): Promise<AdminPart> {
    const url = ADMIN_API_ENDPOINTS.PARTS;
    
    const response = await this.httpService.post<any>(url, data);
    return response.data;
  }

  async updatePart(id: string, data: Partial<AdminPart>, hostModelId?: string): Promise<AdminPart> {
    const url = ADMIN_API_ENDPOINTS.PART.replace(':id', id);
    
    const response = await this.httpService.put<any>(url, data);
    return response.data;
  }

  async deletePart(id: string, hostModelId?: string): Promise<void> {
    const url = ADMIN_API_ENDPOINTS.PART.replace(':id', id);
    
    await this.httpService.delete<any>(url);
  }
}

export default new AdminPartService(); 