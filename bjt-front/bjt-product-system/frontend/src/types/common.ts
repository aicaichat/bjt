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

/**
 * Represents a tiered pricing structure for a product in a specific region.
 */
export interface PriceTier {
    region: string;
    currency: string;
    tiers: Array<{
        min_quantity: number;
        max_quantity: number | null;
        base_price: number;
        discount_rate: number | null;
    }>;
}

/**
 * Represents inventory data for a product in a specific warehouse and region.
 */
export interface InventoryData {
    region: string;
    warehouse: string;
    quantity: number;
    reserved: number;
} 