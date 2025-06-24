import HttpServiceInstance, { ApiResponse } from './apiService';

// 配件数据结构
export interface AccessoryProduct {
  id: number;
  product_line_id: number;
  model: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  image_url: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 分页数据结构
export interface AccessoryListData {
  items: AccessoryProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 过滤条件
export interface AccessoryFilters {
  page?: number;
  page_size?: number;
  lang?: string;
  region?: string;
  product_line_id?: number;
  machine_id?: string;
}

// 实际API调用
const apiGetAccessories = async (filters: AccessoryFilters): Promise<AccessoryListData> => {
  console.log('🔧 [accessoriesService] Fetching accessories from real API with filters:', filters);
  
  try {
    const endpoint = filters.machine_id ? `/machines/${filters.machine_id}/accessories` : '/accessories';
    // 移除 machine_id 过滤器，因为它已包含在 URL 中（如果存在）
    const { machine_id, ...apiFilters } = filters;

    const response = await HttpServiceInstance.get<AccessoryListData>(endpoint, {
      params: apiFilters
    });
    
    console.log('✅ [accessoriesService] Successfully fetched accessories from real API');
    return response.data;
  } catch (error) {
    console.error('❌ [accessoriesService] Error fetching accessories:', error);
    throw error;
  }
};

export const accessoriesService = {
  // 获取配件列表
  async getAccessories(filters: AccessoryFilters): Promise<AccessoryListData> {
    return apiGetAccessories(filters);
  },
  
  // 未来可以添加 getAccessoryDetail 等方法
}; 