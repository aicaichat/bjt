import ApiService, { ApiResponse, ApiError, ApiErrorType } from '../../services/apiService';
import { API_CONFIG } from '../../config/appConfig';
import { ApiAdapter, BaseApiAdapter } from '../adapters/api-adapter';

/**
 * 基础服务类
 * 提供统一的API调用方式，处理Mock数据和真实API之间的切换
 */
export abstract class BaseService<T, R = any> {
  protected readonly useMockData: boolean;
  protected readonly baseUrl: string;
  protected readonly adapter: ApiAdapter<T, R>;

  /**
   * 构造函数
   * @param baseUrl API基础路径
   * @param adapter 数据适配器，用于转换API响应
   */
  constructor(baseUrl: string, adapter?: ApiAdapter<T, R>) {
    this.useMockData = API_CONFIG.USE_MOCK_DATA;
    this.baseUrl = baseUrl;
    this.adapter = adapter || new DefaultAdapter<T, R>();
  }

  /**
   * 获取API路径
   * @param path 相对路径
   * @returns 完整API路径
   */
  protected getApiPath(path: string): string {
    // 确保路径以斜杠开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * 处理API响应
   * @param response API响应
   * @returns 处理后的数据
   */
  protected handleResponse(response: ApiResponse<any>): T {
    return this.adapter.fromApiResponse(response);
  }

  /**
   * 准备请求数据
   * @param data 原始数据
   * @returns 处理后的请求数据
   */
  protected prepareRequestData(data: T): R {
    return this.adapter.toApiRequest(data);
  }

  /**
   * 添加通用参数
   * @param params 原始参数
   * @returns 添加通用参数后的参数
   */
  protected addCommonParams(params: Record<string, any> = {}): Record<string, any> {
    // 获取当前语言
    const currentLang = document.documentElement.lang || 'zh';
    
    // 如果参数中没有指定语言，则添加当前语言
    if (!params.lang) {
      params.lang = currentLang === 'zh' ? 'zh' : 'en';
    }
    
    return params;
  }

  /**
   * 获取Mock数据
   * 子类需要实现此方法以提供Mock数据
   * @param params 查询参数
   */
  protected abstract getMockData(params?: Record<string, any>): Promise<T>;

  /**
   * 获取数据
   * 根据环境变量决定使用Mock数据还是真实API
   * @param path API路径
   * @param params 查询参数
   */
  protected async getData(path: string, params?: Record<string, any>): Promise<T> {
    try {
      // 添加通用参数
      const enhancedParams = this.addCommonParams(params);

      // 根据环境变量决定使用Mock数据还是真实API
      if (this.useMockData) {
        console.log(`[Mock] Getting data from mock for ${path}`);
        return await this.getMockData(enhancedParams);
      }

      // 使用真实API
      console.log(`[API] Getting data from API for ${path}`);
      const response = await ApiService.get(this.getApiPath(path), enhancedParams);
      return this.handleResponse(response);
    } catch (error) {
      const apiError = error as ApiError;
      
      // 如果是认证错误，尝试使用模拟数据
      if (apiError.type === ApiErrorType.AUTHENTICATION) {
        console.warn('Authentication error, falling back to mock data');
        return this.getMockData(params);
      }
      
      throw error;
    }
  }

  /**
   * 提交数据
   * @param path API路径
   * @param data 请求数据
   * @param params 查询参数
   */
  protected async postData(path: string, data: T, params?: Record<string, any>): Promise<any> {
    try {
      // 添加通用参数
      const enhancedParams = this.addCommonParams(params);

      // 准备请求数据
      const requestData = this.prepareRequestData(data);

      // 如果使用Mock数据，则模拟成功响应
      if (this.useMockData) {
        console.log(`[Mock] Posting data to mock for ${path}`, data);
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true, data: { id: Date.now() } };
      }

      // 使用真实API
      console.log(`[API] Posting data to API for ${path}`, requestData);
      const response = await ApiService.post(this.getApiPath(path), requestData, { params: enhancedParams });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      
      // 如果是认证错误，尝试使用模拟数据
      if (apiError.type === ApiErrorType.AUTHENTICATION) {
        console.warn('Authentication error, falling back to mock data');
        return this.getMockData(params);
      }
      
      throw error;
    }
  }

  /**
   * 更新数据
   * @param path API路径
   * @param data 请求数据
   * @param params 查询参数
   */
  protected async putData(path: string, data: T, params?: Record<string, any>): Promise<any> {
    try {
      // 添加通用参数
      const enhancedParams = this.addCommonParams(params);

      // 准备请求数据
      const requestData = this.prepareRequestData(data);

      // 如果使用Mock数据，则模拟成功响应
      if (this.useMockData) {
        console.log(`[Mock] Putting data to mock for ${path}`, data);
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
      }

      // 使用真实API
      console.log(`[API] Putting data to API for ${path}`, requestData);
      const response = await ApiService.put(this.getApiPath(path), requestData, { params: enhancedParams });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      
      // 如果是认证错误，尝试使用模拟数据
      if (apiError.type === ApiErrorType.AUTHENTICATION) {
        console.warn('Authentication error, falling back to mock data');
        return this.getMockData(params);
      }
      
      throw error;
    }
  }

  /**
   * 删除数据
   * @param path API路径
   * @param params 查询参数
   */
  protected async deleteData(path: string, params?: Record<string, any>): Promise<any> {
    try {
      // 添加通用参数
      const enhancedParams = this.addCommonParams(params);

      // 如果使用Mock数据，则模拟成功响应
      if (this.useMockData) {
        console.log(`[Mock] Deleting data from mock for ${path}`);
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
      }

      // 使用真实API
      console.log(`[API] Deleting data from API for ${path}`);
      const response = await ApiService.delete(this.getApiPath(path), { params: enhancedParams });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      
      // 如果是认证错误，尝试使用模拟数据
      if (apiError.type === ApiErrorType.AUTHENTICATION) {
        console.warn('Authentication error, falling back to mock data');
        return this.getMockData(params);
      }
      
      throw error;
    }
  }
}

/**
 * 默认适配器
 * 当没有提供适配器时使用
 */
class DefaultAdapter<T, R = any> extends BaseApiAdapter<T, R> {
  fromApiResponse(response: ApiResponse<any>): T {
    // 如果响应有data字段，则返回data
    if (response && response.data !== undefined) {
      return response.data as unknown as T;
    }
    // 否则返回整个响应
    return response as unknown as T;
  }
} 