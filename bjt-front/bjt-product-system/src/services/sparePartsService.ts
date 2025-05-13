import { HttpServiceInstance } from './apiService';

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
}

// Mock 数据
const mockSpareParts: SparePartProduct[] = [
  {
    id: 1,
    product_line_id: 1,
    model: 'SP-001',
    title_zh: '标准备件包',
    title_en: 'Standard Spare Parts Kit',
    description_zh: '包含基本维护和维修所需的所有备件。',
    description_en: 'Includes all spare parts needed for basic maintenance and repair.',
    image_url: '/images/spare-parts/SP-001.jpg',
    status: 'publish',
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  // ... 其他 mock 数据
];

// Mock 数据获取
const mockGetSpareParts = (filters: SparePartFilters): SparePartListData => {
  let filteredSpareParts = [...mockSpareParts];
  
  // 应用过滤条件
  if (filters.product_line_id) {
    filteredSpareParts = filteredSpareParts.filter(
      sparePart => sparePart.product_line_id === filters.product_line_id
    );
  }

  const page = filters.page || 1;
  const pageSize = filters.page_size || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedSpareParts = filteredSpareParts.slice(start, end);

  return {
    items: paginatedSpareParts,
    total: filteredSpareParts.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(filteredSpareParts.length / pageSize)
  };
};

// API 数据获取
const apiGetSpareParts = async (filters: SparePartFilters): Promise<SparePartListData> => {
  const response = await HttpServiceInstance.get<SparePartListData>('/spare-parts', {
    params: filters
  });
  return response.data;
};

export const sparePartsService = {
  // 获取备件列表
  async getSpareParts(filters: SparePartFilters): Promise<SparePartListData> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return mockGetSpareParts(filters);
    }
    return apiGetSpareParts(filters);
  }
}; 