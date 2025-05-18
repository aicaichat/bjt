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
    return HttpAdminService.get(ADMIN_API_ENDPOINTS.PRODUCT_LINES, { params });
  }

  static async getProductLine(id: string): Promise<ApiResponse<AdminProductLine>> {
    return HttpAdminService.get(`${ADMIN_API_ENDPOINTS.PRODUCT_LINES}/${id}`);
  }

  static async createProductLine(data: Partial<AdminProductLine>): Promise<ApiResponse<AdminProductLine>> {
    return HttpAdminService.post(ADMIN_API_ENDPOINTS.PRODUCT_LINES, data);
  }

  static async updateProductLine(id: string, data: Partial<AdminProductLine>): Promise<ApiResponse<AdminProductLine>> {
    return HttpAdminService.put(`${ADMIN_API_ENDPOINTS.PRODUCT_LINES}/${id}`, data);
  }

  static async deleteProductLine(id: string): Promise<ApiResponse<void>> {
    return HttpAdminService.delete(`${ADMIN_API_ENDPOINTS.PRODUCT_LINES}/${id}`);
  }

  // 主机型号管理
  static async getHostModels(params?: any): Promise<PaginatedResponse<AdminHostModel>> {
    return HttpAdminService.get(ADMIN_API_ENDPOINTS.HOST_MODELS, { params });
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
    return HttpAdminService.get(ADMIN_API_ENDPOINTS.PARTS, { params });
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
    return HttpAdminService.get(ADMIN_API_ENDPOINTS.USERS, { params });
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