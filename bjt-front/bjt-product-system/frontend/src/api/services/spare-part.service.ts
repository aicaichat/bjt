import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';

// 模拟备件数据
const mockSpareParts = [
  {
    id: 1,
    part_number: "BJT-SP-001-2024",
    name: "连接器",
    description: "标准连接器，适用于MEY系列设备",
    price: 25.99,
    stock_quantity: 120,
    image_url: "/images/spare-parts/connector.jpg",
    status: 1,
    app_model: "MEY-001,MEY-002"
  },
  {
    id: 2,
    part_number: "BJT-SP-002-2024",
    name: "密封圈",
    description: "高耐磨密封圈，延长设备使用寿命",
    price: 12.50,
    stock_quantity: 200,
    image_url: "/images/spare-parts/seal-ring.jpg",
    status: 1,
    app_model: "MEY-001,MEY-003"
  },
  {
    id: 3,
    part_number: "BJT-SP-003-2024",
    name: "控制板",
    description: "主控制电路板，适用于MEY系列设备",
    price: 89.99,
    stock_quantity: 30,
    image_url: "/images/spare-parts/control-board.jpg",
    status: 1,
    app_model: "MEY-002,MEY-003"
  }
];

// 备件接口定义
export interface SparePart {
  id: number;
  part_number: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  status: 'publish' | 'draft' | 'trash';
  created_at: string;
  updated_at: string;
  compatible_models?: CompatibleModel[];
}

// 兼容型号接口定义
export interface CompatibleModel {
  id: number;
  model_name: string;
  title: string;
  type: string;
  image_url: string;
}

// 序列号信息接口定义
export interface SerialNumberInfo {
  type: 'range' | 'prefix' | 'exact';
  value: string;
  range_start?: string;
  range_end?: string;
}

// 备件兼容性接口定义
export interface SparePartCompatibility {
  id: number;
  part_number: string;
  name: string;
  compatible_models: CompatibleModel[];
  serial_number_info?: SerialNumberInfo[];
}

// 备件列表响应接口定义
export interface SparePartListResponse {
  items: SparePart[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 备件服务类
export class SparePartService extends BaseService<SparePartListResponse> {
  constructor() {
    super('/spare-parts');
  }

  /**
   * 获取备件列表
   * @param params 查询参数
   */
  async getSpareParts(params: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<SparePartListResponse> {
    return this.getData('', params);
  }

  /**
   * 获取单个备件详情
   * @param id 备件ID
   */
  async getSparePart(id: number): Promise<SparePart> {
    if (this.useMockData) {
      const sparePart = mockSpareParts.find((part: any) => part.id === id);
      if (!sparePart) {
        throw new Error(`Spare part with id ${id} not found`);
      }
      
      // 转换为API格式
      return {
        ...sparePart,
        status: (sparePart.status as any) === 1 ? 'publish' : 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const response = await ApiService.get(this.getApiPath(`/${id}`));
    return response.data;
  }

  /**
   * 创建备件
   * @param data 备件数据
   */
  async createSparePart(data: Partial<SparePart>): Promise<SparePart> {
    if (this.useMockData) {
      const newSparePart = {
        ...data,
        id: Math.max(...mockSpareParts.map((part: any) => part.id)) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: data.status || 'draft'
      } as SparePart;
      
      return newSparePart;
    }

    const response = await ApiService.post(this.getApiPath(''), data);
    return response.data;
  }

  /**
   * 更新备件
   * @param id 备件ID
   * @param data 备件数据
   */
  async updateSparePart(id: number, data: Partial<SparePart>): Promise<SparePart> {
    if (this.useMockData) {
      const index = mockSpareParts.findIndex((part: any) => part.id === id);
      if (index === -1) {
        throw new Error(`Spare part with id ${id} not found`);
      }
      
      const updatedSparePart = {
        ...mockSpareParts[index],
        ...data,
        updated_at: new Date().toISOString(),
        status: data.status || mockSpareParts[index].status
      } as SparePart;
      
      return updatedSparePart;
    }

    const response = await ApiService.put(this.getApiPath(`/${id}`), data);
    return response.data;
  }

  /**
   * 删除备件
   * @param id 备件ID
   */
  async deleteSparePart(id: number): Promise<void> {
    if (this.useMockData) {
      const index = mockSpareParts.findIndex((part: any) => part.id === id);
      if (index === -1) {
        throw new Error(`Spare part with id ${id} not found`);
      }
      
      return;
    }

    await ApiService.delete(this.getApiPath(`/${id}`));
  }

  /**
   * 获取备件兼容性信息
   * @param id 备件ID
   * @param lang 语言
   */
  async getSparePartCompatibility(id: number, lang: string = 'en'): Promise<SparePartCompatibility> {
    if (this.useMockData) {
      const sparePart = mockSpareParts.find((part: any) => part.id === id);
      if (!sparePart) {
        throw new Error(`Spare part with id ${id} not found`);
      }
      
      // 模拟兼容性数据
      return {
        id: sparePart.id,
        part_number: sparePart.part_number,
        name: sparePart.name,
        compatible_models: [
          {
            id: 1,
            model_name: 'BJT-100',
            title: 'Professional Juicer BJT-100',
            type: 'juicer',
            image_url: '/images/models/bjt-100.jpg'
          },
          {
            id: 2,
            model_name: 'BJT-200',
            title: 'Commercial Juicer BJT-200',
            type: 'juicer',
            image_url: '/images/models/bjt-200.jpg'
          }
        ],
        serial_number_info: [
          {
            type: 'range',
            value: 'SN Range',
            range_start: 'BJT100001',
            range_end: 'BJT100999'
          },
          {
            type: 'prefix',
            value: 'BJT2'
          }
        ]
      };
    }

    const response = await ApiService.get(this.getApiPath(`/${id}/compatibility`), { params: { lang } });
    return response.data;
  }

  /**
   * 获取备件价格
   * @param ids 备件ID数组
   */
  async getSparePartPrices(ids: number[]): Promise<Record<number, number>> {
    if (this.useMockData) {
      return ids.reduce((acc, id) => {
        const sparePart = mockSpareParts.find((part: any) => part.id === id);
        if (sparePart) {
          acc[id] = sparePart.price;
        }
        return acc;
      }, {} as Record<number, number>);
    }

    const response = await ApiService.post(this.getApiPath('/prices'), { ids });
    return response.data;
  }

  /**
   * 获取备件库存
   * @param ids 备件ID数组
   */
  async getSparePartStocks(ids: number[]): Promise<Record<number, number>> {
    if (this.useMockData) {
      return ids.reduce((acc, id) => {
        const sparePart = mockSpareParts.find((part: any) => part.id === id);
        if (sparePart) {
          acc[id] = sparePart.stock_quantity;
        }
        return acc;
      }, {} as Record<number, number>);
    }

    const response = await ApiService.post(this.getApiPath('/stocks'), { ids });
    return response.data;
  }

  /**
   * 获取模拟数据
   * @param params 查询参数
   */
  protected async getMockData(params: Record<string, any> = {}): Promise<SparePartListResponse> {
    // 从模拟数据中获取备件列表
    let filteredParts = [...mockSpareParts];
    
    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredParts = filteredParts.filter((part: any) => 
        part.name.toLowerCase().includes(searchLower) || 
        part.part_number.toLowerCase().includes(searchLower) ||
        part.description.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (params.status) {
      filteredParts = filteredParts.filter((part: any) => {
        const statusValue = part.status === 1 ? 'publish' : 'draft';
        return statusValue === params.status;
      });
    }
    
    // 排序
    if (params.sort_by) {
      const sortField = params.sort_by as keyof SparePart;
      const sortOrder = params.sort_order === 'desc' ? -1 : 1;
      
      filteredParts.sort((a: any, b: any) => {
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });
    }
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.page_size || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedParts = filteredParts.slice(start, end);
    
    // 转换为API格式
    const items = paginatedParts.map((part: any) => ({
      ...part,
      status: part.status === 1 ? 'publish' : 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    return {
      items,
      total: filteredParts.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredParts.length / pageSize)
    };
  }
} 