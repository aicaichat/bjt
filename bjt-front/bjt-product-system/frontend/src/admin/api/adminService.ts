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
    // 前端安全检查：只允许admin账号
    if (username !== 'admin') {
      return {
        success: false,
        message: '访问被拒绝：只有管理员账号可以登录后台管理系统',
        data: { token: '' }
      };
    }

    try {
      // 调用后端API进行验证，传递login_type参数表明这是后台管理登录
      const response = await HttpAdminService.post<{ token: string; user?: any }>(
        ADMIN_API_ENDPOINTS.LOGIN, 
        { 
          username, 
          password,
          login_type: 'admin_login' // 明确标识为后台管理登录
        }
      );
      
      // 额外验证：检查响应中的用户信息
      if (response.success && response.data) {
        // 如果后端返回了用户信息，再次确认是管理员
        const user = response.data.user;
        if (user && user.username && user.username !== 'admin') {
          return {
            success: false,
            message: '用户验证失败：非管理员账号',
            data: { token: '' }
          };
        }
        
        // 验证用户角色
        if (user && user.role && user.role.toLowerCase() !== 'admin') {
          return {
            success: false,
            message: '用户验证失败：用户角色不足',
            data: { token: '' }
          };
        }
        
        // 验证登录类型
        if (user && user.login_type && user.login_type !== 'admin_login') {
          return {
            success: false,
            message: '登录类型验证失败',
            data: { token: '' }
          };
        }
        
        // 验证通过，返回成功响应（只返回token部分）
        return {
          success: response.success,
          message: response.message,
          data: { token: response.data.token || '' }
        };
      }
      
      return {
        success: false,
        message: response.message || '登录失败',
        data: { token: '' }
      };
    } catch (error: any) {
      // 包装错误响应
      return {
        success: false,
        message: error.message || '登录失败',
        data: { token: '' }
      };
    }
  }

  static async logout(): Promise<ApiResponse<void>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.LOGOUT);
  }

  static async getCurrentAdmin(): Promise<ApiResponse<User>> {
    return HttpAdminService.get(ADMIN_API_ENDPOINTS.CURRENT_ADMIN);
  }
}

export default AdminService;