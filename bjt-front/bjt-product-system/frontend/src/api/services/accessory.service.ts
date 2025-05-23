import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';

// 配件模拟数据
const mockAccessories = [
  {
    id: 1,
    model: 'ACC-2023',
    brand: 'BJT',
    name_zh: '高压喷头',
    name_en: 'High Pressure Nozzle',
    part_number: 'ACC-HP-001',
    spec: '10mm diameter, stainless steel',
    voltage: '220V',
    frequency: '50Hz',
    image_url: 'https://example.com/accessories/nozzle.jpg',
    status: 'publish'
  },
  {
    id: 2,
    model: 'ACC-2024',
    brand: 'BJT',
    name_zh: '过滤器组件',
    name_en: 'Filter Assembly',
    part_number: 'ACC-FA-002',
    spec: 'HEPA filter, 99.97% efficiency',
    voltage: 'N/A',
    frequency: 'N/A',
    image_url: 'https://example.com/accessories/filter.jpg',
    status: 'publish'
  },
  {
    id: 3,
    model: 'ACC-2025',
    brand: 'BJT',
    name_zh: '控制面板',
    name_en: 'Control Panel',
    part_number: 'ACC-CP-003',
    spec: 'Touch screen, waterproof',
    voltage: '24V DC',
    frequency: 'N/A',
    image_url: 'https://example.com/accessories/panel.jpg',
    status: 'publish'
  }
];

// 配件子配件模拟数据
const mockAccessoryChildren = {
  1: [
    {
      id: 101,
      name_zh: '喷嘴头',
      name_en: 'Nozzle Tip',
      part_number: 'NT-001',
      quantity: 1,
      image_url: 'https://example.com/accessories/nozzle-tip.jpg'
    },
    {
      id: 102,
      name_zh: '连接器',
      name_en: 'Connector',
      part_number: 'CN-002',
      quantity: 2,
      image_url: 'https://example.com/accessories/connector.jpg'
    }
  ],
  2: [
    {
      id: 201,
      name_zh: '滤芯',
      name_en: 'Filter Element',
      part_number: 'FE-001',
      quantity: 1,
      image_url: 'https://example.com/accessories/filter-element.jpg'
    },
    {
      id: 202,
      name_zh: '滤框',
      name_en: 'Filter Frame',
      part_number: 'FF-002',
      quantity: 1,
      image_url: 'https://example.com/accessories/filter-frame.jpg'
    },
    {
      id: 203,
      name_zh: '密封圈',
      name_en: 'Sealing Ring',
      part_number: 'SR-003',
      quantity: 4,
      image_url: 'https://example.com/accessories/sealing-ring.jpg'
    }
  ]
};

// 配件接口
export interface Accessory {
  id: number;
  model: string;
  brand: string;
  name_zh?: string;
  name_en?: string;
  part_number: string;
  spec?: string;
  voltage?: string;
  frequency?: string;
  image_url?: string;
  status: string;
}

// 配件子配件接口
export interface AccessoryChild {
  id: number;
  name_zh?: string;
  name_en?: string;
  part_number: string;
  quantity: number;
  image_url?: string;
}

// 配件列表响应接口
export interface AccessoryListResponse {
  items: Accessory[];
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
}

// 配件子配件响应接口
export interface AccessoryChildrenResponse {
  items: Record<string, AccessoryChild[]>;
}

// 设备配件响应接口定义，兼容旧界面使用
export interface MachineAccessoriesResponse {
  items: any[];
  total: number;
}

// 配件服务类
export class AccessoryService extends BaseService<AccessoryListResponse> {
  constructor() {
    super('/accessories');
  }

  // 获取配件列表
  async getAccessories(params: any = {}): Promise<AccessoryListResponse> {
    return this.getData('', params);
  }

  // 获取设备配件（兼容旧的machinesService）
  async getMachineAccessories(machinePartNumber: string, params: {
    level?: number;
    lang?: string;
    region?: string;
  } = {}): Promise<MachineAccessoriesResponse> {
    if (this.useMockData) {
      await delay(300);
      
      // 返回兼容旧接口的数据格式
      return {
        items: [],
        total: 0
      };
    }
    
    try {
      const response = await ApiService.get(`/machines/${machinePartNumber}/accessories`, params);
      
      // 确保返回正确的数据格式
      if (!response || !response.data) {
        console.warn('Invalid response format from API');
        return {
          items: [],
          total: 0
        };
      }
      
      // 如果返回的是数组，转换为正确的格式
      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length
        };
      }
      
      // 如果返回的是对象，确保它有正确的格式
      return {
        items: response.data.items || [],
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error fetching machine accessories:', error);
      return {
        items: [],
        total: 0
      };
    }
  }

  // 获取配件详情
  async getAccessory(id: number): Promise<Accessory> {
    if (this.useMockData) {
      await delay(300);
      const accessory = mockAccessories.find(a => a.id === id);
      
      if (!accessory) {
        throw new Error(`Accessory with id ${id} not found`);
      }
      
      return accessory;
    }
    
    const response = await ApiService.get(this.getApiPath(`/${id}`));
    return response.data;
  }

  // 获取配件子配件
  async getAccessoryChildren(parentPartNumber: string, params: any = {}): Promise<AccessoryChildrenResponse> {
    if (this.useMockData) {
      await delay(300);
      
      let resolvedChildren: AccessoryChild[] = [];
      const numericKey = parseInt(parentPartNumber, 10);

      if (!isNaN(numericKey)) {
        if (numericKey === 1 && mockAccessoryChildren[1]) {
          resolvedChildren = mockAccessoryChildren[1];
        } else if (numericKey === 2 && mockAccessoryChildren[2]) {
          resolvedChildren = mockAccessoryChildren[2];
        }
      }

      return {
        items: resolvedChildren, 
        total: resolvedChildren.length,
      } as any; // Cast as any for now due to potential mock/real mismatch
    }
    
    const response = await ApiService.get(this.getApiPath(`/${parentPartNumber}/children`), params);
    
    if (response && response.data) {
      return response.data;
    }
    return { items: [], total: 0 } as any;
  }

  // 创建配件
  async createAccessory(data: Partial<Accessory>): Promise<Accessory> {
    if (this.useMockData) {
      await delay(300);
      
      const newId = Math.max(...mockAccessories.map(a => a.id)) + 1;
      const newAccessory = {
        id: newId,
        model: data.model || '',
        brand: data.brand || '',
        name_zh: data.name_zh,
        name_en: data.name_en,
        part_number: data.part_number || '',
        spec: data.spec,
        voltage: data.voltage,
        frequency: data.frequency,
        image_url: data.image_url,
        status: data.status || 'draft'
      };
      
      return newAccessory;
    }
    
    const response = await ApiService.post(this.getApiPath(''), data);
    return response.data;
  }

  // 更新配件
  async updateAccessory(id: number, data: Partial<Accessory>): Promise<Accessory> {
    if (this.useMockData) {
      await delay(300);
      
      const accessoryIndex = mockAccessories.findIndex(a => a.id === id);
      
      if (accessoryIndex === -1) {
        throw new Error(`Accessory with id ${id} not found`);
      }
      
      const updatedAccessory = {
        ...mockAccessories[accessoryIndex],
        ...data
      };
      
      return updatedAccessory;
    }
    
    const response = await ApiService.put(this.getApiPath(`/${id}`), data);
    return response.data;
  }

  // 删除配件
  async deleteAccessory(id: number): Promise<void> {
    if (this.useMockData) {
      await delay(300);
      return;
    }
    
    await ApiService.delete(this.getApiPath(`/${id}`));
  }

  // 实现抽象方法：获取模拟数据
  protected async getMockData(params: Record<string, any> = {}): Promise<AccessoryListResponse> {
    await delay(500);
    
    const page = params.page || 1;
    const perPage = params.per_page || 10;
    
    // 过滤数据
    let filteredAccessories = [...mockAccessories];
    
    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredAccessories = filteredAccessories.filter(accessory => 
        accessory.name_zh?.toLowerCase().includes(searchLower) ||
        accessory.name_en?.toLowerCase().includes(searchLower) ||
        accessory.model?.toLowerCase().includes(searchLower) ||
        accessory.part_number?.toLowerCase().includes(searchLower) ||
        accessory.brand?.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (params.status) {
      filteredAccessories = filteredAccessories.filter(accessory => accessory.status === params.status);
    }
    
    // 分页处理
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const items = filteredAccessories.slice(startIndex, endIndex);
    
    return {
      items,
      total: filteredAccessories.length,
      total_pages: Math.ceil(filteredAccessories.length / perPage),
      page,
      per_page: perPage
    };
  }
}

// 导出配件服务实例
export default new AccessoryService(); 