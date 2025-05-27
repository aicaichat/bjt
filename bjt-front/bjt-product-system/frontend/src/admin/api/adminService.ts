import HttpAdminService from './httpAdminService';
import { ADMIN_API_ENDPOINTS } from './adminConfig';
import type { 
  AdminProductLine,
  AdminHostModel,
  AdminPart,
  FrontendHostModel as HostModel, 
  FrontendPart as Part, 
  FrontendUser as User,
  ApiResponse,
  PaginatedResponse
} from '../types';

// 管理员服务类
class AdminService {
  // 产品线管理
  static async getProductLines(params?: any): Promise<PaginatedResponse<AdminProductLine>> {
    const response = await HttpAdminService.get<any>(ADMIN_API_ENDPOINTS.PRODUCT_LINES, { params });
    
    const paginatedResponse: PaginatedResponse<AdminProductLine> = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
    
    // Handle different pagination response formats
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        // 如果直接返回数组
        paginatedResponse.items = response.data;
        paginatedResponse.total = response.data.length;
      } else if (response.data.items) {
        // 如果返回标准分页格式
        paginatedResponse.items = response.data.items;
        paginatedResponse.total = response.data.total || response.data.items.length;
        paginatedResponse.page = response.data.page || 1;
        paginatedResponse.page_size = response.data.page_size || 10;
        paginatedResponse.total_pages = response.data.total_pages || 1;
      } else {
        // 如果是其他格式，尝试提取items
        const items = response.data.data || response.data;
        paginatedResponse.items = Array.isArray(items) ? items : [];
        paginatedResponse.total = paginatedResponse.items.length;
      }
    }
    
    return paginatedResponse;
  }

  static async getProductLine(id: string): Promise<ApiResponse<AdminProductLine>> {
    const response = await HttpAdminService.get<any>(`${ADMIN_API_ENDPOINTS.PRODUCT_LINES}/${id}`);
    return response;
  }

  static async createProductLine(data: Partial<AdminProductLine>): Promise<ApiResponse<AdminProductLine>> {
    const response = await HttpAdminService.post<any>(ADMIN_API_ENDPOINTS.PRODUCT_LINES, data);
    return response;
  }

  static async updateProductLine(id: string, data: Partial<AdminProductLine>): Promise<ApiResponse<AdminProductLine>> {
    const response = await HttpAdminService.put<any>(`${ADMIN_API_ENDPOINTS.PRODUCT_LINES}/${id}`, data);
    return response;
  }

  static async deleteProductLine(id: string): Promise<ApiResponse<void>> {
    return HttpAdminService.delete<void>(`${ADMIN_API_ENDPOINTS.PRODUCT_LINES}/${id}`);
  }

  // 主机型号管理
  static async getHostModels(params?: any): Promise<PaginatedResponse<AdminHostModel>> {
    const response = await HttpAdminService.get<any>(ADMIN_API_ENDPOINTS.HOST_MODELS, { params });
    
    const paginatedResponse: PaginatedResponse<AdminHostModel> = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
    
    if (response.success && response.data) {
      // 同样处理不同的分页响应格式
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

  static async getHostModel(id: string): Promise<ApiResponse<AdminHostModel>> {
    return HttpAdminService.get(`${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`);
  }

  static async createHostModel(data: Partial<AdminHostModel>): Promise<ApiResponse<AdminHostModel>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.HOST_MODELS, data);
  }

  static async updateHostModel(id: string, data: Partial<AdminHostModel>): Promise<ApiResponse<AdminHostModel>> {
    return HttpAdminService.put(`${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`, data);
  }

  static async deleteHostModel(id: string): Promise<ApiResponse<void>> {
    return HttpAdminService.delete(`${ADMIN_API_ENDPOINTS.HOST_MODELS}/${id}`);
  }

  // 零件管理
  static async getParts(params?: any): Promise<PaginatedResponse<AdminPart>> {
    const response = await HttpAdminService.get<any>(ADMIN_API_ENDPOINTS.PARTS, { params });
    
    const paginatedResponse: PaginatedResponse<AdminPart> = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
    
    if (response.success && response.data) {
      // 同样处理不同的分页响应格式
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

  static async getPart(id: string): Promise<ApiResponse<AdminPart>> {
    return HttpAdminService.get(`${ADMIN_API_ENDPOINTS.PARTS}/${id}`);
  }

  static async createPart(data: Partial<AdminPart>): Promise<ApiResponse<AdminPart>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.PARTS, data);
  }

  static async updatePart(id: string, data: Partial<AdminPart>): Promise<ApiResponse<AdminPart>> {
    return HttpAdminService.put(`${ADMIN_API_ENDPOINTS.PARTS}/${id}`, data);
  }

  static async deletePart(id: string): Promise<ApiResponse<void>> {
    return HttpAdminService.delete(`${ADMIN_API_ENDPOINTS.PARTS}/${id}`);
  }

  // 用户管理
  static async getUsers(params?: any): Promise<PaginatedResponse<User>> {
    const response = await HttpAdminService.get<any>(ADMIN_API_ENDPOINTS.USERS, { params });
    
    const paginatedResponse: PaginatedResponse<User> = {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
    
    if (response.success && response.data) {
      // 同样处理不同的分页响应格式
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

  static async getUser(id: string): Promise<ApiResponse<User>> {
    return HttpAdminService.get(`${ADMIN_API_ENDPOINTS.USERS}/${id}`);
  }

  static async createUser(data: Partial<User>): Promise<ApiResponse<User>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.USERS, data);
  }

  static async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return HttpAdminService.put(`${ADMIN_API_ENDPOINTS.USERS}/${id}`, data);
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    return HttpAdminService.delete(`${ADMIN_API_ENDPOINTS.USERS}/${id}`);
  }

  // 管理员认证
  static async login(username: string, password: string): Promise<ApiResponse<{ token: string }>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.LOGIN, { username, password });
  }

  static async logout(): Promise<ApiResponse<void>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.LOGOUT);
  }

  static async getCurrentAdmin(): Promise<ApiResponse<User>> {
    return HttpAdminService.get(ADMIN_API_ENDPOINTS.CURRENT_ADMIN);
  }
}

export default AdminService;