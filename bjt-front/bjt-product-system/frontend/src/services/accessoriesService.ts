import HttpServiceInstance, { ApiResponse } from './apiService';
import { delay } from '../utils/delay'; // 假设存在 delay 工具

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
  product_line_id?: number; // 示例过滤
  machine_id?: string; // 示例：获取特定机器的配件
}

// Mock 数据获取
const mockGetAccessories = async (filters: AccessoryFilters): Promise<AccessoryListData> => {
  await delay(300); // 模拟延迟
  console.log('Using MOCK accessories data with filters:', filters);
  
  // 在这里可以添加更复杂的 mock 筛选逻辑
  const mockItems: AccessoryProduct[] = [
    // 示例 Mock 数据
    {
      id: 101,
      product_line_id: 1,
      model: 'ACC-STD-01',
      title_zh: '标准底座',
      title_en: 'Standard Base',
      description_zh: '适用于 LA-E4S 的标准底座。',
      description_en: 'Standard base compatible with LA-E4S.',
      image_url: '/mock-images/acc-std-01.jpg',
      status: 'publish',
      sort_order: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 102,
      product_line_id: 1,
      model: 'ACC-EXT-02',
      title_zh: '延长臂',
      title_en: 'Extension Arm',
      description_zh: '增加机器操作范围。',
      description_en: 'Increases the operational range of the machine.',
      image_url: '/mock-images/acc-ext-02.jpg',
      status: 'publish',
      sort_order: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const page = filters.page || 1;
  const pageSize = filters.page_size || 10;
  const total = mockItems.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = mockItems.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages
  };
};

// 实际API调用
const apiGetAccessories = async (filters: AccessoryFilters): Promise<AccessoryListData> => {
  const endpoint = filters.machine_id ? `/machines/${filters.machine_id}/accessories` : '/accessories';
  // 移除 machine_id 过滤器，因为它已包含在 URL 中（如果存在）
  const { machine_id, ...apiFilters } = filters;

  const response = await HttpServiceInstance.get<AccessoryListData>(endpoint, {
    params: apiFilters
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
  },
  
  // 未来可以添加 getAccessoryDetail 等方法
}; 