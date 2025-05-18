import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';

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
    stock: 120
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
    stock: 85
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
    stock: 200
  }
];

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
}

// 耗材列表响应接口
export interface ConsumableListResponse {
  items: Consumable[];
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
}

// 耗材服务类
export class ConsumableService extends BaseService<ConsumableListResponse> {
  constructor() {
    super('/consumables');
  }

  // 获取耗材列表
  async getConsumables(params: any = {}): Promise<ConsumableListResponse> {
    return this.getData('', params);
  }

  // 获取耗材详情
  async getConsumable(id: number): Promise<Consumable> {
    if (this.useMockData) {
      await delay(300);
      const consumable = mockConsumables.find(c => c.id === id);
      
      if (!consumable) {
        throw new Error(`Consumable with id ${id} not found`);
      }
      
      return consumable;
    }
    
    const response = await ApiService.get(this.getApiPath(`/${id}`));
    return response.data;
  }

  // 创建耗材
  async createConsumable(data: Partial<Consumable>): Promise<Consumable> {
    if (this.useMockData) {
      await delay(300);
      
      const newId = Math.max(...mockConsumables.map(c => c.id)) + 1;
      const newConsumable = {
        id: newId,
        model: data.model || '',
        brand: data.brand || '',
        name_zh: data.name_zh,
        name_en: data.name_en,
        part_number: data.part_number || '',
        spec: data.spec,
        image_url: data.image_url,
        status: data.status || 'draft',
        unit: data.unit || 'piece',
        unit_price: data.unit_price || 0,
        stock: data.stock || 0
      };
      
      return newConsumable as Consumable;
    }
    
    const response = await ApiService.post(this.getApiPath(''), data);
    return response.data;
  }

  // 更新耗材
  async updateConsumable(id: number, data: Partial<Consumable>): Promise<Consumable> {
    if (this.useMockData) {
      await delay(300);
      
      const consumableIndex = mockConsumables.findIndex(c => c.id === id);
      
      if (consumableIndex === -1) {
        throw new Error(`Consumable with id ${id} not found`);
      }
      
      const updatedConsumable = {
        ...mockConsumables[consumableIndex],
        ...data
      };
      
      return updatedConsumable;
    }
    
    const response = await ApiService.put(this.getApiPath(`/${id}`), data);
    return response.data;
  }

  // 删除耗材
  async deleteConsumable(id: number): Promise<void> {
    if (this.useMockData) {
      await delay(300);
      return;
    }
    
    await ApiService.delete(this.getApiPath(`/${id}`));
  }

  // 更新库存
  async updateStock(id: number, quantity: number): Promise<Consumable> {
    if (this.useMockData) {
      await delay(300);
      
      const consumableIndex = mockConsumables.findIndex(c => c.id === id);
      
      if (consumableIndex === -1) {
        throw new Error(`Consumable with id ${id} not found`);
      }
      
      const updatedConsumable = {
        ...mockConsumables[consumableIndex],
        stock: quantity
      };
      
      return updatedConsumable;
    }
    
    const response = await ApiService.put(this.getApiPath(`/${id}/stock`), { stock: quantity });
    return response.data;
  }

  // 实现抽象方法：获取模拟数据
  protected async getMockData(params: Record<string, any> = {}): Promise<ConsumableListResponse> {
    await delay(500);
    
    const page = params.page || 1;
    const perPage = params.per_page || 10;
    
    // 过滤数据
    let filteredConsumables = [...mockConsumables];
    
    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredConsumables = filteredConsumables.filter(consumable => 
        consumable.name_zh?.toLowerCase().includes(searchLower) ||
        consumable.name_en?.toLowerCase().includes(searchLower) ||
        consumable.model?.toLowerCase().includes(searchLower) ||
        consumable.part_number?.toLowerCase().includes(searchLower) ||
        consumable.brand?.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (params.status) {
      filteredConsumables = filteredConsumables.filter(consumable => consumable.status === params.status);
    }
    
    // 分页处理
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const items = filteredConsumables.slice(startIndex, endIndex);
    
    return {
      items,
      total: filteredConsumables.length,
      total_pages: Math.ceil(filteredConsumables.length / perPage),
      page,
      per_page: perPage
    };
  }
}

// 导出耗材服务实例
export default new ConsumableService(); 