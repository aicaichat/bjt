import { ApiResponse } from '../../services/apiService';

/**
 * API适配器接口
 * 定义了所有API适配器必须实现的方法
 */
export interface ApiAdapter<T, R> {
  /**
   * 将后端API响应转换为前端所需格式
   * @param response 后端API响应
   * @returns 前端格式的数据
   */
  fromApiResponse(response: any): T;
  
  /**
   * 将前端数据转换为API请求格式
   * @param data 前端数据
   * @returns API请求格式的数据
   */
  toApiRequest(data: T): R;
}

/**
 * 基础API适配器
 * 提供默认实现，可以被特定实体的适配器继承
 */
export abstract class BaseApiAdapter<T, R = any> implements ApiAdapter<T, R> {
  /**
   * 默认从API响应转换
   * @param response API响应
   * @returns 转换后的数据
   */
  fromApiResponse(response: ApiResponse<any>): T {
    // 默认实现，直接返回data部分
    return response.data as unknown as T;
  }
  
  /**
   * 默认转换为API请求
   * @param data 前端数据
   * @returns API请求格式
   */
  toApiRequest(data: T): R {
    // 默认实现，直接返回数据
    return data as unknown as R;
  }
}

/**
 * 分页响应适配器
 * 处理分页数据的转换
 */
export class PaginatedResponseAdapter<T> extends BaseApiAdapter<{
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  private itemAdapter?: ApiAdapter<T, any>;
  
  constructor(itemAdapter?: ApiAdapter<T, any>) {
    super();
    this.itemAdapter = itemAdapter;
  }
  
  fromApiResponse(response: ApiResponse<any>): {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  } {
    // 处理BJT API的分页响应格式
    const data = response.data;
    
    // 如果响应已经是标准格式
    if (data.items && typeof data.total === 'number') {
      // 如果有项目适配器，转换每个项目
      if (this.itemAdapter) {
        return {
          ...data,
          items: data.items.map((item: any) => this.itemAdapter!.fromApiResponse({ data: item }))
        };
      }
      return data;
    }
    
    // 处理可能的其他格式
    // 例如，如果API返回的是数组而不是对象
    if (Array.isArray(data)) {
      const items = this.itemAdapter 
        ? data.map(item => this.itemAdapter!.fromApiResponse({ data: item }))
        : data;
        
      return {
        items,
        total: items.length,
        page: 1,
        page_size: items.length,
        total_pages: 1
      };
    }
    
    // 如果是其他格式，尝试提取分页信息
    return {
      items: this.extractItems(data),
      total: this.extractTotal(data),
      page: this.extractPage(data),
      page_size: this.extractPageSize(data),
      total_pages: this.extractTotalPages(data)
    };
  }
  
  /**
   * 从响应中提取项目列表
   */
  protected extractItems(data: any): T[] {
    // 尝试各种可能的字段名
    const itemsField = ['items', 'data', 'results', 'content', 'records'].find(field => Array.isArray(data[field]));
    
    if (itemsField) {
      const items = data[itemsField];
      return this.itemAdapter 
        ? items.map((item: any) => this.itemAdapter!.fromApiResponse({ data: item }))
        : items;
    }
    
    // 如果找不到，返回空数组
    console.warn('Could not extract items from API response', data);
    return [];
  }
  
  /**
   * 从响应中提取总数
   */
  protected extractTotal(data: any): number {
    // 尝试各种可能的字段名
    const totalField = ['total', 'totalElements', 'totalItems', 'count'].find(field => typeof data[field] === 'number');
    
    if (totalField) {
      return data[totalField];
    }
    
    // 如果找不到，返回项目数量
    const items = this.extractItems(data);
    return items.length;
  }
  
  /**
   * 从响应中提取当前页码
   */
  protected extractPage(data: any): number {
    // 尝试各种可能的字段名
    const pageField = ['page', 'pageNumber', 'current'].find(field => typeof data[field] === 'number');
    
    if (pageField) {
      return data[pageField];
    }
    
    return 1;
  }
  
  /**
   * 从响应中提取每页大小
   */
  protected extractPageSize(data: any): number {
    // 尝试各种可能的字段名
    const pageSizeField = ['page_size', 'pageSize', 'size', 'limit'].find(field => typeof data[field] === 'number');
    
    if (pageSizeField) {
      return data[pageSizeField];
    }
    
    // 如果找不到，返回项目数量
    const items = this.extractItems(data);
    return items.length;
  }
  
  /**
   * 从响应中提取总页数
   */
  protected extractTotalPages(data: any): number {
    // 尝试各种可能的字段名
    const totalPagesField = ['total_pages', 'totalPages', 'pages'].find(field => typeof data[field] === 'number');
    
    if (totalPagesField) {
      return data[totalPagesField];
    }
    
    // 如果找不到，计算总页数
    const total = this.extractTotal(data);
    const pageSize = this.extractPageSize(data);
    
    return pageSize > 0 ? Math.ceil(total / pageSize) : 1;
  }
} 