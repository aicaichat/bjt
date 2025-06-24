import HttpServiceInstance, { ApiResponse } from './apiService';

// 备件数据结构
export interface SparePartProduct {
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
  // 根据数据库结构可能需要添加更多字段，如 required_parts, required_quantity 等
}

// 分页数据结构
export interface SparePartListData {
  items: SparePartProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 过滤条件
export interface SparePartFilters {
  page?: number;
  page_size?: number;
  lang?: string;
  region?: string;
  product_line_id?: number;
  machine_id?: string;
}

// 实际API调用
const apiGetSpareParts = async (filters: SparePartFilters): Promise<SparePartListData> => {
  console.log('🔧 [sparePartsService] Fetching spare parts from real API with filters:', filters);
  
  try {
    // 检查是否有 machine_id 用于特定端点，否则使用通用端点
    const endpoint = filters.machine_id ? `/machines/${filters.machine_id}/spare-parts` : '/spare-parts';
    const { machine_id, ...apiFilters } = filters;

    const response = await HttpServiceInstance.get<SparePartListData>(endpoint, {
      params: apiFilters
    });
    
    console.log('✅ [sparePartsService] Successfully fetched spare parts from real API');
    return response.data;
  } catch (error) {
    console.error('❌ [sparePartsService] Error fetching spare parts:', error);
    throw error;
  }
};

export const sparePartsService = {
  // 获取备件列表
  async getSpareParts(filters: SparePartFilters): Promise<SparePartListData> {
    return apiGetSpareParts(filters);
  },
  
  // 未来可以添加 getSparePartDetail 等方法
}; 