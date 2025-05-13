import { HttpServiceInstance } from './apiService';

// 主机型号数据结构
export interface MachineProduct {
  id: number;
  product_line_id: number;
  model: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  type: string;
  image1_url: string;
  image2_url: string;
  explosion_diagram_pdf: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 分页数据结构
export interface MachineListData {
  items: MachineProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 过滤条件
export interface MachineFilters {
  page?: number;
  page_size?: number;
  lang?: string;
  region?: string;
  product_line_id?: number;
  type?: string;
}

// Mock 数据
const mockMachines: MachineProduct[] = [
  {
    id: 1,
    product_line_id: 1,
    model: 'LA-E4S',
    title_zh: '气垫机E4S',
    title_en: 'Air Cushion E4S',
    description_zh: '高效率小型气垫机，适合小规模包装工作。',
    description_en: 'High-efficiency small air cushion machine suitable for small-scale packaging work.',
    type: '小型',
    image1_url: '/images/shop/LA-E4S.jpg',
    image2_url: '/images/shop/LA-E5P.jpg',
    explosion_diagram_pdf: '/pdfs/models/LA-E4S.pdf',
    status: 'publish',
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  // ... 其他 mock 数据
];

// Mock 数据获取
const mockGetMachines = (filters: MachineFilters): MachineListData => {
  let filteredMachines = [...mockMachines];
  
  // 应用过滤条件
  if (filters.product_line_id) {
    filteredMachines = filteredMachines.filter(
      machine => machine.product_line_id === filters.product_line_id
    );
  }
  
  if (filters.type) {
    filteredMachines = filteredMachines.filter(
      machine => machine.type === filters.type
    );
  }

  const page = filters.page || 1;
  const pageSize = filters.page_size || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedMachines = filteredMachines.slice(start, end);

  return {
    items: paginatedMachines,
    total: filteredMachines.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(filteredMachines.length / pageSize)
  };
};

// API 数据获取
const apiGetMachines = async (filters: MachineFilters): Promise<MachineListData> => {
  const response = await HttpServiceInstance.get<MachineListData>('/machines', {
    params: filters
  });
  return response.data;
};

export const machinesService = {
  // 获取主机型号列表
  async getMachines(filters: MachineFilters): Promise<MachineListData> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return mockGetMachines(filters);
    }
    return apiGetMachines(filters);
  }
}; 