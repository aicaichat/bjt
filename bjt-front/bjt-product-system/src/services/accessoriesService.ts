import { HttpServiceInstance } from './apiService';

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
}

// Mock 数据
const mockAccessories: AccessoryProduct[] = [
  {
    id: 1,
    product_line_id: 1,
    model: 'ACC-001',
    title_zh: '标准配件包',
    title_en: 'Standard Accessory Kit',
    description_zh: '包含基本维护和操作所需的所有配件。',
    description_en: 'Includes all accessories needed for basic maintenance and operation.',
    image_url: '/images/accessories/ACC-001.jpg',
    status: 'publish',
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  // ... 其他 mock 数据
];

// Mock 数据获取
const mockGetAccessories = (filters: AccessoryFilters): AccessoryListData => {
  let filteredAccessories = [...mockAccessories];
  
  // 应用过滤条件
  if (filters.product_line_id) {
    filteredAccessories = filteredAccessories.filter(
      accessory => accessory.product_line_id === filters.product_line_id
    );
  }

  const page = filters.page || 1;
  const pageSize = filters.page_size || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedAccessories = filteredAccessories.slice(start, end);

  return {
    items: paginatedAccessories,
    total: filteredAccessories.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(filteredAccessories.length / pageSize)
  };
};

// API 数据获取
const apiGetAccessories = async (filters: AccessoryFilters): Promise<AccessoryListData> => {
  const response = await HttpServiceInstance.get<AccessoryListData>('/accessories', {
    params: filters
  });
  return response.data;
};

export const accessoriesService = {
  // 获取配件列表
  async getAccessories(filters: AccessoryFilters): Promise<AccessoryListData> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return mockGetAccessories(filters);
    }
    return apiGetAccessories(filters);
  }
}; 