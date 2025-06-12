import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { Consumable as ConsumableType, ConsumableListData } from '../../types/consumables';
import { ApiAdapter } from '../adapters/api-adapter';
import { ASSETS } from '../../config/appConfig';

// 耗材模拟数据
const mockConsumables = [
  {
    id: 1,
    model: 'CON-2023',
    brand: 'BJT',
    name_zh: '打印墨水',
    name_en: 'Printing Ink',
    part_number: 'CON-INK-001',
    spec: '500ml, Black',
    image_url: 'https://example.com/consumables/ink.jpg',
    status: 'publish',
    unit: 'bottle',
    unit_price: 199.00,
    stock: 120,
    specs: {
      material: 'HDPE',
      shape: 'pillow',
      thickness: '0.08mm',
      width: '250mm',
      length: '350mm'
    },
    pricing: [
      { min_quantity: 1, max_quantity: 10, price: 199.00 },
      { min_quantity: 11, max_quantity: 100, price: 179.00 },
      { min_quantity: 101, max_quantity: null, price: 159.00 }
    ]
  },
  {
    id: 2,
    model: 'CON-2024',
    brand: 'BJT',
    name_zh: '清洗液',
    name_en: 'Cleaning Solution',
    part_number: 'CON-CLS-002',
    spec: '1L, Transparent',
    image_url: 'https://example.com/consumables/cleaning.jpg',
    status: 'publish',
    unit: 'bottle',
    unit_price: 149.00,
    stock: 85,
    specs: {
      material: 'LDPE',
      shape: 'bubble',
      thickness: '0.10mm',
      width: '300mm',
      length: '400mm'
    },
    pricing: [
      { min_quantity: 1, max_quantity: 10, price: 149.00 },
      { min_quantity: 11, max_quantity: 100, price: 129.00 },
      { min_quantity: 101, max_quantity: null, price: 109.00 }
    ]
  },
  {
    id: 3,
    model: 'CON-2025',
    brand: 'BJT',
    name_zh: '过滤纸',
    name_en: 'Filter Paper',
    part_number: 'CON-FP-003',
    spec: '100pcs/pack, 10×10cm',
    image_url: 'https://example.com/consumables/filter-paper.jpg',
    status: 'publish',
    unit: 'pack',
    unit_price: 59.00,
    stock: 200,
    specs: {
      material: 'PAPER+PE',
      shape: 'tube',
      thickness: '0.05mm',
      width: '200mm',
      length: '300mm'
    },
    pricing: [
      { min_quantity: 1, max_quantity: 10, price: 59.00 },
      { min_quantity: 11, max_quantity: 100, price: 49.00 },
      { min_quantity: 101, max_quantity: null, price: 39.00 }
    ]
  }
];

// 模拟的filterOptions数据，包含真实的图片URL
const mockFilterOptions = {
  shapes: [
    { 
      id: 'pillow', 
      code: 'pillow',
      name: 'Pillow', 
      image_url: '/images/MEX/values/MEX.png',
      image_url2: '/images/MEX/values/MEX-2.png'
    },
    { 
      id: 'bubble', 
      code: 'bubble',
      name: 'Bubble', 
      image_url: '/images/MFB/values/MFB.png',
      image_url2: '/images/MFB/values/MFB-2.png'
    },
    { 
      id: 'tube', 
      code: 'tube',
      name: 'Tube', 
      image_url: '/images/MFC/values/MFC.png',
      image_url2: '/images/MFC/values/MFC-2.png'
    }
  ],
  materials: [
    { id: 'hdpe', code: 'hdpe', name: 'HDPE' },
    { id: 'ldpe', code: 'ldpe', name: 'LDPE' },
    { id: 'nylon', code: 'nylon', name: 'Nylon' },
    { id: 'paper_pe', code: 'paper_pe', name: 'PAPER+PE' }
  ],
  models: [
    { id: 'all', code: 'all', name: 'ALL' },
    { id: 'la-e4s', code: 'la-e4s', name: 'LA-E4S' },
    { id: 'mex-10-20', code: 'mex-10-20', name: 'MEX-10-20' },
    { id: 'lp-v1', code: 'lp-v1', name: 'LP-V1' }
  ],
  thicknesses: [
    { id: 'all', code: 'all', name: 'ALL' },
    { id: '0.05mm', code: '0.05mm', name: '0.05mm' },
    { id: '0.08mm', code: '0.08mm', name: '0.08mm' },
    { id: '0.10mm', code: '0.10mm', name: '0.10mm' }
  ],
  weights: [
    { id: 'all', code: 'all', name: 'ALL' },
    { id: '50g', code: '50g', name: '50g/m²' },
    { id: '75g', code: '75g', name: '75g/m²' },
    { id: '100g', code: '100g', name: '100g/m²' }
  ],
  widths: [
    { id: 'all', code: 'all', name: 'ALL' },
    { id: '200mm', code: '200mm', name: '200mm' },
    { id: '250mm', code: '250mm', name: '250mm' },
    { id: '300mm', code: '300mm', name: '300mm' }
  ],
  lengths: [
    { id: 'all', code: 'all', name: 'ALL' },
    { id: '300mm', code: '300mm', name: '300mm' },
    { id: '350mm', code: '350mm', name: '350mm' },
    { id: '400mm', code: '400mm', name: '400mm' }
  ]
};

// 耗材接口
export interface Consumable {
  id: number;
  model: string;
  brand: string;
  name_zh?: string;
  name_en?: string;
  part_number: string;
  spec?: string;
  image_url?: string;
  status: string;
  unit: string;
  unit_price: number;
  stock: number;
  specs?: {
    material?: string;
    shape?: string;
    thickness?: string;
    width?: string;
    length?: string;
  };
  pricing?: Array<{
    min_quantity: number;
    max_quantity: number | null;
    price: number;
  }>;
}

// 耗材列表响应接口
export interface ConsumableListResponse {
  items: Consumable[];
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
  filterOptions?: any;
}

// 默认适配器
class DefaultAdapter<T, R = any> implements ApiAdapter<T, R> {
  fromApiResponse(response: any): T {
    return response.data;
  }

  toApiRequest(data: T): R {
    return data as unknown as R;
  }
}

// 耗材服务类
export class ConsumableService extends BaseService<ConsumableListData> {
  constructor() {
    super('consumables', new DefaultAdapter<ConsumableListData>());
  }

  // 获取耗材列表
  async getConsumables(params: {
    page?: number;
    per_page?: number;
    product_line_id?: number;
    region?: string;
    lang?: string;
    model?: string;
    material?: string;
    bag_type?: string;
    shape?: string;
    thickness?: string;
    weight?: string;
    width?: string;
    length?: string;
  }): Promise<ConsumableListData> {
    // 模拟数据处理
    const page = params.page || 1;
    const per_page = params.per_page || 10;
    
    // 过滤数据
    let filteredData = [...mockConsumables];
    
    if (params.material && params.material !== 'all') {
      filteredData = filteredData.filter(item => 
        item.specs?.material?.toLowerCase() === params.material?.toLowerCase()
      );
    }
    
    if (params.shape && params.shape !== 'all') {
      filteredData = filteredData.filter(item => 
        item.specs?.shape?.toLowerCase() === params.shape?.toLowerCase()
      );
    }
    
    // 分页
    const total = filteredData.length;
    const total_pages = Math.ceil(total / per_page);
    const startIndex = (page - 1) * per_page;
    const items = filteredData.slice(startIndex, startIndex + per_page);
    
    // 转换为ConsumableType格式
    const transformedItems: ConsumableType[] = items.map(item => ({
      id: item.id,
      product_line_id: 1, // 默认产品线ID
      code: item.part_number,
      name: item.name_en || item.name_zh || '',
      model: item.model,
      status: item.status,
      part_number: item.part_number,
      image_url: item.image_url || ASSETS.getUrl(ASSETS.DEFAULT_IMAGE),
      specs: {
        material: item.specs?.material,
        shape: item.specs?.shape,
        thickness: item.specs?.thickness,
        width: item.specs?.width,
        length: item.specs?.length
      },
      pricing: (item.pricing || []).map(p => ({
        range: p.max_quantity ? `${p.min_quantity}-${p.max_quantity}` : `${p.min_quantity}+`,
        price: p.price,
        min_quantity: p.min_quantity,
        max_quantity: p.max_quantity
      })),
      inventory: { [params.region || 'CN']: item.stock }
    }));
    
    return {
      items: transformedItems,
      total,
      total_pages,
      page,
      page_size: per_page,
      filterOptions: mockFilterOptions as any // 临时使用any类型
    };
  }

  // 获取单个耗材详情
  async getConsumable(id: number | string, params: {
    region?: string;
    lang?: string;
  } = {}): Promise<ConsumableType> {
    const response = await ApiService.get<ConsumableType>(`${this.baseUrl}/${id}`, params);
    return response.data;
  }

  // 获取耗材价格
  async getConsumablePrices(id: number | string, params: {
    region?: string;
    quantity?: number;
  } = {}): Promise<any> {
    const response = await ApiService.get(`${this.baseUrl}/${id}/prices`, params);
    return response.data;
  }

  // 获取耗材库存
  async getConsumableInventory(id: number | string, params: {
    region?: string;
  } = {}): Promise<any> {
    const response = await ApiService.get(`${this.baseUrl}/${id}/inventory`, params);
    return response.data;
  }

  // 检查耗材兼容性
  async checkCompatibility(id: number | string, params: {
    model: string;
  }): Promise<any> {
    const response = await ApiService.get(`${this.baseUrl}/${id}/compatibility-check`, params);
    return response.data;
  }

  // 创建耗材
  async createConsumable(data: Partial<ConsumableType>): Promise<ConsumableType> {
    const response = await ApiService.post<ConsumableType>(this.baseUrl, data);
    return response.data;
  }

  // 更新耗材
  async updateConsumable(id: number, data: Partial<ConsumableType>): Promise<ConsumableType> {
    const response = await ApiService.put<ConsumableType>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // 删除耗材
  async deleteConsumable(id: number): Promise<void> {
    await ApiService.delete(`${this.baseUrl}/${id}`);
  }

  // 更新库存
  async updateStock(id: number, quantity: number): Promise<ConsumableType> {
    const response = await ApiService.put<ConsumableType>(`${this.baseUrl}/${id}/stock`, { stock: quantity });
    return response.data;
  }

  // 实现基类要求的getMockData方法
  protected async getMockData(params: Record<string, any> = {}): Promise<ConsumableListData> {
    // 返回模拟数据
    return this.getConsumables(params);
  }
}

// Export a singleton instance
export const consumableService = new ConsumableService(); 