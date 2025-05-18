import HttpAdminService from '../api/httpAdminService';

/**
 * HTTP响应接口
 */
interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

/**
 * 基础服务类，提供基本的HTTP请求方法
 */
export class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 发送GET请求
   * @param path 请求路径
   * @param params 请求参数
   * @returns 请求结果
   */
  async get<T>(path: string = '', params: Record<string, any> = {}): Promise<T> {
    const response = await HttpAdminService.get<HttpResponse<T>>(`${this.baseUrl}${path}`, { params });
    return response.data;
  }

  /**
   * 发送POST请求
   * @param path 请求路径
   * @param data 请求数据
   * @returns 请求结果
   */
  async post<T>(path: string = '', data: any): Promise<T> {
    const response = await HttpAdminService.post<HttpResponse<T>>(`${this.baseUrl}${path}`, data);
    return response.data;
  }

  /**
   * 发送PUT请求
   * @param path 请求路径
   * @param data 请求数据
   * @returns 请求结果
   */
  async put<T>(path: string = '', data: any): Promise<T> {
    const response = await HttpAdminService.put<HttpResponse<T>>(`${this.baseUrl}${path}`, data);
    return response.data;
  }

  /**
   * 发送DELETE请求
   * @param path 请求路径
   * @returns 请求结果
   */
  async delete<T = any>(path: string = ''): Promise<T> {
    const response = await HttpAdminService.delete<HttpResponse<T>>(`${this.baseUrl}${path}`);
    return response.data;
  }

  /**
   * 发送PATCH请求
   * @param path 请求路径
   * @param data 请求数据
   * @returns 请求结果
   */
  async patch<T>(path: string = '', data: any): Promise<T> {
    const response = await HttpAdminService.patch<HttpResponse<T>>(`${this.baseUrl}${path}`, data);
    return response.data;
  }
} 