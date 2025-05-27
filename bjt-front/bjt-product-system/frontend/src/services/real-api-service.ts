/**
 * 真实API服务
 * 用于与localhost:8080的真实API服务器通信
 */

import { API_CONFIG } from '../config/mock-config';
import type { 
  MachineListData, 
  AccessoryListData, 
  ConsumableListData, 
  SparePartListData 
} from '../types/api.types';

export class RealApiService {
  private static instance: RealApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_CONFIG.REAL_API_BASE_URL;
    console.log('🌐 真实API服务已初始化，服务器地址:', this.baseUrl);
  }

  public static getInstance(): RealApiService {
    if (!RealApiService.instance) {
      RealApiService.instance = new RealApiService();
    }
    return RealApiService.instance;
  }

  /**
   * 通用HTTP请求方法
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API请求: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API响应: ${url}`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ API请求失败: ${url}`, error);
      
      // 如果是网络错误，提供友好的错误信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`无法连接到API服务器 (${this.baseUrl})。请确保后端服务正在运行。`);
      }
      
      throw error;
    }
  }

  /**
   * 获取产品线数据
   */
  public async getProductLines(): Promise<any[]> {
    return await this.request<any[]>(API_CONFIG.API_ENDPOINTS.productLines);
  }

  /**
   * 获取主机列表数据
   */
  public async getMachines(params?: {
    category?: number;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<MachineListData> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.append('category', params.category.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const endpoint = `${API_CONFIG.API_ENDPOINTS.machines}?${searchParams.toString()}`;
    return await this.request<MachineListData>(endpoint);
  }

  /**
   * 获取配件列表数据
   */
  public async getAccessories(params?: {
    machineId?: string;
    category?: number;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<AccessoryListData> {
    const searchParams = new URLSearchParams();
    
    if (params?.machineId) searchParams.append('machineId', params.machineId);
    if (params?.category) searchParams.append('category', params.category.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const endpoint = `${API_CONFIG.API_ENDPOINTS.accessories}?${searchParams.toString()}`;
    return await this.request<AccessoryListData>(endpoint);
  }

  /**
   * 获取耗材列表数据
   */
  public async getConsumables(params?: {
    category?: number;
    shape?: string;
    material?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<ConsumableListData> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.append('category', params.category.toString());
    if (params?.shape) searchParams.append('shape', params.shape);
    if (params?.material) searchParams.append('material', params.material);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const endpoint = `${API_CONFIG.API_ENDPOINTS.consumables}?${searchParams.toString()}`;
    return await this.request<ConsumableListData>(endpoint);
  }

  /**
   * 获取备件列表数据
   */
  public async getSpareParts(params?: {
    machineModel?: string;
    isConsumable?: boolean;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<SparePartListData> {
    const searchParams = new URLSearchParams();
    
    if (params?.machineModel) searchParams.append('machineModel', params.machineModel);
    if (params?.isConsumable !== undefined) searchParams.append('isConsumable', params.isConsumable.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const endpoint = `${API_CONFIG.API_ENDPOINTS.spareParts}?${searchParams.toString()}`;
    return await this.request<SparePartListData>(endpoint);
  }

  /**
   * 获取形状筛选数据
   */
  public async getShapes(): Promise<any[]> {
    return await this.request<any[]>(API_CONFIG.API_ENDPOINTS.shapes);
  }

  /**
   * 获取材料筛选数据
   */
  public async getMaterials(): Promise<any[]> {
    return await this.request<any[]>(API_CONFIG.API_ENDPOINTS.materials);
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return await this.request<{ status: string; timestamp: string }>('/api/health');
  }

  /**
   * 获取API信息
   */
  public async getApiInfo(): Promise<{ version: string; description: string }> {
    return await this.request<{ version: string; description: string }>('/api/info');
  }
}

// 导出单例实例
export const realApiService = RealApiService.getInstance(); 