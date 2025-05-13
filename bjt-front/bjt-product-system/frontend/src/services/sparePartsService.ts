import HttpServiceInstance, { ApiResponse } from './apiService';
import { delay } from '../utils/delay'; // 假设存在 delay 工具

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
  product_line_id?: number; // 示例过滤
  machine_id?: string; // 示例：获取特定机器相关的备件
}

// Mock 数据获取
const mockGetSpareParts = async (filters: SparePartFilters): Promise<SparePartListData> => {
  await delay(300); // 模拟延迟
  console.log('Using MOCK spare parts data with filters:', filters);
  
  // 在这里可以添加更复杂的 mock 筛选逻辑
  const mockItems: SparePartProduct[] = [
    // 示例 Mock 数据
    {
      id: 201,
      product_line_id: 1,
      model: 'SP-MOTOR-01',
      title_zh: '主电机',
      title_en: 'Main Motor',
      description_zh: 'LA-E4S 的替换主电机。',
      description_en: 'Replacement main motor for LA-E4S.',
      image_url: '/mock-images/sp-motor-01.jpg',
      status: 'publish',
      sort_order: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 202,
      product_line_id: 1,
      model: 'SP-BELT-02',
      title_zh: '传送带',
      title_en: 'Conveyor Belt',
      description_zh: '标准传送带替换件。',
      description_en: 'Standard conveyor belt replacement.',
      image_url: '/mock-images/sp-belt-02.jpg',
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
const apiGetSpareParts = async (filters: SparePartFilters): Promise<SparePartListData> => {
  // 检查是否有 machine_id 用于特定端点，否则使用通用端点
  // 注意：后端 API 可能需要不同的端点或参数来获取与特定机器关联的备件
  const endpoint = filters.machine_id ? `/machines/${filters.machine_id}/spare-parts` : '/spare-parts'; // 端点可能需要根据实际 API 调整
  const { machine_id, ...apiFilters } = filters;

  const response = await HttpServiceInstance.get<SparePartListData>(endpoint, {
    params: apiFilters
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
  },
  
  // 未来可以添加 getSparePartDetail 等方法
}; 