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
        // 直接使用API返回的数据，只需要映射code到model
        const mappedItems = response.data.map((item: any) => ({
          ...item,
          model: item.code, // API返回code，前端使用model
        }));
        paginatedResponse.items = mappedItems;
        paginatedResponse.total = mappedItems.length;
      } else if (response.data.items) {
        // 映射分页数据中的items
        const mappedItems = response.data.items.map((item: any) => ({
          ...item,
          model: item.code, // API返回code，前端使用model
        }));
        paginatedResponse.items = mappedItems;
        paginatedResponse.total = response.data.total || mappedItems.length;
        paginatedResponse.page = response.data.page || 1;
        paginatedResponse.page_size = response.data.page_size || 10;
        paginatedResponse.total_pages = response.data.total_pages || 1;
      } else {
        const items = response.data.data || response.data;
        const mappedItems = Array.isArray(items) ? items.map((item: any) => ({
          ...item,
          model: item.code, // API返回code，前端使用model
        })) : [];
        paginatedResponse.items = mappedItems;
        paginatedResponse.total = mappedItems.length;
      }
    }
    
    return paginatedResponse;
  }

  async getHostModel(id: string): Promise<AdminHostModel> {
    const url = `${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`;
    const response = await this.httpService.get<any>(url);
    
    // API返回的数据已经是正确格式，只需要映射code到model
    const apiData = response.data;
    const mappedData: AdminHostModel = {
      ...apiData,
      model: apiData.code, // API返回code，前端使用model
    };
    
    console.log('AdminHostModelService.getHostModel - Original API data:', apiData);
    console.log('AdminHostModelService.getHostModel - Mapped data:', mappedData);
    
    return mappedData;
  }

  async createHostModel(data: Partial<AdminHostModel>): Promise<AdminHostModel> {
    // 根据PHP控制器代码，API期望的字段映射：
    // - code (必填，映射到数据库的model字段)
    // - name_cn (必填，映射到数据库的title_zh字段)
    // - name_en (必填，映射到数据库的title_en字段)
    // - product_line_id (必填)
    const submitData = {
      code: data.model || data.code, // API期望code字段
      name_cn: data.title_zh || '', // API期望name_cn，映射到数据库title_zh
      name_en: data.title_en || '', // API期望name_en，映射到数据库title_en
      product_line_id: Number(data.product_line_id) || 1, // 必填字段，确保是数字类型
      description_zh: data.description_zh || '',
      description_en: data.description_en || '',
      type: data.type || '',
      image1_url: data.image1_url || '',
      image2_url: data.image2_url || '',
      explosion_diagram_pdf: data.explosion_diagram_pdf || '',
      spec_pdf: data.spec_pdf || '',
      status: data.status || 'publish', // 必填字段，设置默认值
      sort_order: Number(data.sort_order) || 0, // 确保是数字类型
    };
    
    // 过滤掉完全空的字符串，但保留必填字段
    const requiredFields = ['code', 'name_cn', 'name_en', 'product_line_id', 'status', 'sort_order'];
    const finalData = Object.fromEntries(
      Object.entries(submitData).filter(([key, value]) => {
        return requiredFields.includes(key) || (value !== '' && value !== null && value !== undefined);
      })
    );
    
    console.log('AdminHostModelService.createHostModel - Input data:', data);
    console.log('AdminHostModelService.createHostModel - Submit data:', submitData);
    console.log('AdminHostModelService.createHostModel - Final data:', finalData);
    
    const response = await this.httpService.post<any>(ADMIN_API_ENDPOINTS.HOST_MODELS, finalData);
    return response.data;
  }

  async updateHostModel(id: string, data: Partial<AdminHostModel>): Promise<AdminHostModel> {
    // 根据实际API响应，使用正确的字段映射
    const submitData = {
      code: data.model || data.code, // API使用code字段
      title_zh: data.title_zh, // API使用title_zh，不是name_cn
      title_en: data.title_en, // API使用title_en，不是name_en
      product_line_id: data.product_line_id,
      description_zh: data.description_zh,
      description_en: data.description_en,
      type: data.type,
      image1_url: data.image1_url,
      image2_url: data.image2_url,
      explosion_diagram_pdf: data.explosion_diagram_pdf,
      spec_pdf: data.spec_pdf,
      status: data.status || 'publish',
      sort_order: data.sort_order || 0,
    };
    
    console.log('AdminHostModelService.updateHostModel - Input data:', data);
    console.log('AdminHostModelService.updateHostModel - Mapped data:', submitData);
    
    const url = `${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`;
    const response = await this.httpService.put<any>(url, submitData);
    return response.data;
  }

  async deleteHostModel(id: string): Promise<void> {
    const url = `${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`;
    await this.httpService.delete<any>(url);
  }
}

export default new AdminHostModelService(); 