/**
 * 标准API响应接口
 */
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

/**
 * 分页API响应接口
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  message?: string;
  code?: number;
} 