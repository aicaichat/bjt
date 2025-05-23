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
}

class AdminPartService extends BaseAdminService<AdminPart> {
  private httpService = HttpAdminService;

  constructor() {
    super(ADMIN_API_ENDPOINTS.PARTS);
  }

  async getParts(params: PartParams = {}): Promise<PaginatedResponse<AdminPart>> {
    // Extract host_model_id first
    const { host_model_id, ...restParams } = params;
    
    // Filter out undefined and null values from remaining params
    const filteredParams = Object.fromEntries(
      Object.entries(restParams).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    // Set default values
    const queryParams = {
      page: 1,
      page_size: 10,
      ...filteredParams
    };
    
    // Determine which URL to use based on host_model_id
    let url;
    
    if (host_model_id) {
      // If we're fetching parts for a specific host model
      url = ADMIN_API_ENDPOINTS.HOST_MODEL_PARTS.replace(':id', host_model_id);
    } else {
      // Otherwise get all parts
      url = ADMIN_API_ENDPOINTS.PARTS;
    }
    
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const response = await this.httpService.get<any>(`${url}${queryString ? `?${queryString}` : ''}`);
    
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

  async getPart(id: string, hostModelId?: string): Promise<AdminPart> {
    let url;
    if (hostModelId) {
      url = ADMIN_API_ENDPOINTS.PART
        .replace(':modelId', hostModelId)
        .replace(':id', id);
    } else {
      url = `${ADMIN_API_ENDPOINTS.PARTS}/${id}`;
    }
    
    const response = await this.httpService.get<any>(url);
    return response.data;
  }

  async createPart(data: Partial<AdminPart>, hostModelId?: string): Promise<AdminPart> {
    let url;
    if (hostModelId) {
      url = ADMIN_API_ENDPOINTS.HOST_MODEL_PARTS.replace(':id', hostModelId);
    } else {
      url = ADMIN_API_ENDPOINTS.PARTS;
    }
    
    const response = await this.httpService.post<any>(url, data);
    return response.data;
  }

  async updatePart(id: string, data: Partial<AdminPart>, hostModelId?: string): Promise<AdminPart> {
    let url;
    if (hostModelId) {
      url = ADMIN_API_ENDPOINTS.PART
        .replace(':modelId', hostModelId)
        .replace(':id', id);
    } else {
      url = `${ADMIN_API_ENDPOINTS.PARTS}/${id}`;
    }
    
    const response = await this.httpService.put<any>(url, data);
    return response.data;
  }

  async deletePart(id: string, hostModelId?: string): Promise<void> {
    let url;
    if (hostModelId) {
      url = ADMIN_API_ENDPOINTS.PART
        .replace(':modelId', hostModelId)
        .replace(':id', id);
    } else {
      url = `${ADMIN_API_ENDPOINTS.PARTS}/${id}`;
    }
    
    await this.httpService.delete<any>(url);
  }
}

export default new AdminPartService(); 