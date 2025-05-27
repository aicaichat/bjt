export * from './admin-models.types';

// 导出管理后台使用的API类型
export type { ApiResponse } from '../api/httpAdminService';

// 定义分页响应结构
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Re-exporting generic types from the main types directory
// Adjust path if your main types/index.ts is elsewhere or re-exports differently.
export type { 
    User as FrontendUser, // Renaming to avoid conflict if AdminUser is defined
    ProductLine as FrontendProductLine,
    HostModel as FrontendHostModel,
    Part as FrontendPart 
} from '../../types'; // This path assumes admin/types is one level below src, then up to src/types 