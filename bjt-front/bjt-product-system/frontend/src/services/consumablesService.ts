import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { APIResponse, PaginatedResponse } from '../types/common';
import { API_CONFIG, ASSETS } from '../config/appConfig';

// Destructure for clarity and to avoid property access issues
const { USE_MOCK_DATA } = API_CONFIG;

// 耗材接口定义
export interface ConsumableProduct {
  id: string;
  name: string;
  code: string;
  model: string;
  image_url: string;
  specs: {
    material: string;
    shape: string;
    thickness?: string;
    weight?: string;
    width: string;
    length: string;
    rollLength?: string;
    compatibility: string;
  };
  pricing: Array<{
    range: string;
    price: number;
    regionalPrices: {
      eu: number;
      na: number;
      au: number;
      cn: number;
    };
  }>;
  inventory: Record<string, number>;
}

// 筛选参数接口
export interface ConsumableFilters {
  model?: string;
  shape?: string;
  material?: string;
  thickness?: string;
  weight?: string;
  width?: string;
  length?: string;
  page?: number;
  page_size?: number;
  region?: string;
  lang?: string;
}

// 模拟耗材数据
const mockConsumables: ConsumableProduct[] = [
  {
    id: '1',
    name: 'Standard Bubble Film',
    code: 'PL-001',
    model: 'MEX-10-20-10',
    image_url: ASSETS.getUrl('/images/products/consumables/PL-001.jpg'),
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.05mm',
      width: '200mm',
      length: '300mm',
      rollLength: '500m',
      compatibility: 'E5P/E4S'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 100,
        regionalPrices: { eu: 120, na: 100, au: 130, cn: 650 } 
      },
      { 
        range: '11-100', 
        price: 90,
        regionalPrices: { eu: 100, na: 90, au: 110, cn: 580 } 
      },
      { 
        range: '> 100', 
        price: 50,
        regionalPrices: { eu: 60, na: 50, au: 65, cn: 320 } 
      }
    ],
    inventory: { us: 1, au: 2, eu: 3, cn: 50 }
  },
  {
    id: '2',
    name: 'Cushioning Bubble Film',
    code: 'PL-002',
    model: 'MEX-10-20-13',
    image_url: ASSETS.getUrl('/images/products/consumables/PL-002.jpg'),
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.08mm',
      width: '300mm',
      length: '400mm',
      rollLength: '600m',
      compatibility: 'E5P/E4S'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 95,
        regionalPrices: { eu: 115, na: 95, au: 125, cn: 620 } 
      },
      { 
        range: '11-100', 
        price: 85,
        regionalPrices: { eu: 95, na: 85, au: 105, cn: 550 } 
      },
      { 
        range: '> 100', 
        price: 45,
        regionalPrices: { eu: 55, na: 45, au: 60, cn: 290 } 
      }
    ],
    inventory: { us: 2, au: 3, eu: 5, cn: 38 }
  },
  {
    id: '3',
    name: 'Anti-shock Bubble Film',
    code: 'PL-003',
    model: 'MEX-10-20-15',
    image_url: ASSETS.getUrl('/images/products/consumables/PL-003.jpg'),
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.10mm',
      width: '300mm',
      length: '450mm',
      rollLength: '450m',
      compatibility: 'E5P/E4S'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 110,
        regionalPrices: { eu: 130, na: 110, au: 140, cn: 700 } 
      },
      { 
        range: '11-100', 
        price: 100,
        regionalPrices: { eu: 120, na: 100, au: 130, cn: 650 } 
      },
      { 
        range: '> 100', 
        price: 60,
        regionalPrices: { eu: 70, na: 60, au: 75, cn: 390 } 
      }
    ],
    inventory: { us: 3, au: 2, eu: 4, cn: 26 }
  }
];

// 选项数据
export const consumableOptions = {
  shapes: [
    { id: 'pillow', name: 'Pillow', image_url: ASSETS.getUrl('/images/icons/shape-pillow.svg') },
    { id: 'bubble', name: 'Bubble', image_url: ASSETS.getUrl('/images/icons/shape-bubble.svg') },
    { id: 'tube', name: 'Tube', image_url: ASSETS.getUrl('/images/icons/shape-tube.svg') }
  ],
  materials: [
    { id: 'hdpe', name: 'HDPE' },
    { id: 'ldpe', name: 'LDPE' },
    { id: 'nylon', name: 'Nylon' },
    { id: 'paper_pe', name: 'PAPER+PE' }
  ],
  models: [
    { id: 'all', name: 'ALL' },
    { id: 'la-e4s', name: 'LA-E4S' },
    { id: 'mex-10-20', name: 'MEX-10-20' },
    { id: 'lp-v1', name: 'LP-V1' }
  ],
  thicknesses: [
    { id: 'all', name: 'ALL' },
    { id: '0.05mm', name: '0.05mm' },
    { id: '0.08mm', name: '0.08mm' },
    { id: '0.10mm', name: '0.10mm' }
  ],
  weights: [
    { id: 'all', name: 'ALL' },
    { id: '50g', name: '50g/m²' },
    { id: '75g', name: '75g/m²' },
    { id: '100g', name: '100g/m²' }
  ],
  widths: [
    { id: 'all', name: 'ALL' },
    { id: '200mm', name: '200mm' },
    { id: '250mm', name: '250mm' },
    { id: '300mm', name: '300mm' }
  ],
  lengths: [
    { id: 'all', name: 'ALL' },
    { id: '300mm', name: '300mm' },
    { id: '350mm', name: '350mm' },
    { id: '400mm', name: '400mm' }
  ],
  modelExplodedViews: {
    'all': ASSETS.getUrl('/images/models/exploded-view-default.svg'),
    'la-e4s': ASSETS.getUrl('/images/models/LA-E4S-exploded-view.svg'),
    'mex-10-20': ASSETS.getUrl('/images/models/MEX-10-20-exploded-view.svg'),
    'lp-v1': ASSETS.getUrl('/images/models/LP-V1-exploded-view.svg')
  }
};

// 延迟函数，用于模拟网络请求
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟API调用
const mockGetConsumables = async (filters: ConsumableFilters): Promise<PaginatedResponse<ConsumableProduct>> => {
  await delay(500); // 模拟网络延迟
  
  // 筛选逻辑
  let filteredProducts = [...mockConsumables];
  
  if (filters.material && filters.material !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.material.toLowerCase() === filters.material!.toLowerCase()
    );
  }
  
  if (filters.shape && filters.shape !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.shape.toLowerCase() === filters.shape!.toLowerCase()
    );
  }
  
  if (filters.thickness && filters.thickness !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.thickness === filters.thickness
    );
  }
  
  if (filters.weight && filters.weight !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.weight === filters.weight
    );
  }
  
  if (filters.width && filters.width !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.width === filters.width
    );
  }
  
  if (filters.length && filters.length !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.length === filters.length
    );
  }
  
  if (filters.model && filters.model !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.specs.compatibility.includes(filters.model!)
    );
  }
  
  // 分页处理
  const page = filters.page || 1;
  const pageSize = filters.page_size || 10;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  return {
    success: true,
    data: {
      items: paginatedProducts,
      total: filteredProducts.length,
      page: page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredProducts.length / pageSize)
    }
  };
};

// 实际API调用
const apiGetConsumables = async (filters: ConsumableFilters): Promise<PaginatedResponse<ConsumableProduct>> => {
  try {
    const params = new URLSearchParams();
    
    // 添加所有筛选参数
    if (filters.model && filters.model !== 'all') params.append('model', filters.model);
    if (filters.shape && filters.shape !== 'all') params.append('shape', filters.shape);
    if (filters.material && filters.material !== 'all') params.append('material', filters.material);
    if (filters.thickness && filters.thickness !== 'all') params.append('thickness', filters.thickness);
    if (filters.weight && filters.weight !== 'all') params.append('weight', filters.weight);
    if (filters.width && filters.width !== 'all') params.append('width', filters.width);
    if (filters.length && filters.length !== 'all') params.append('length', filters.length);
    
    // 添加分页参数
    params.append('page', String(filters.page || 1));
    params.append('page_size', String(filters.page_size || 10));
    
    // 添加语言和区域参数
    if (filters.lang) params.append('lang', filters.lang);
    if (filters.region) params.append('region', filters.region);
    
    const response = await axios.get(`${API_BASE_URL}/consumables`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch consumables:', error);
    throw error;
  }
};

// 导出服务
const consumablesService = {
  // 获取耗材列表
  getConsumables: async (filters: ConsumableFilters): Promise<PaginatedResponse<ConsumableProduct>> => {
    return USE_MOCK_DATA ? mockGetConsumables(filters) : apiGetConsumables(filters);
  },
  
  // 获取筛选选项
  getConsumableOptions: () => {
    return consumableOptions;
  }
};

export default consumablesService; 