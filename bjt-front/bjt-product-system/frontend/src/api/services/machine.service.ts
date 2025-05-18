import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';

// 模拟设备数据
const mockMachines = [
  {
    id: 1,
    code: "MEY-001",
    title_zh: "气垫机 Pro - MEY系列",
    title_en: "Air Cushion Machine Pro - MEY Series",
    description_zh: "气垫机产品描述（中文）",
    description_en: "Air Cushion Machine description (English)",
    product_line_id: 1,
    type: "气垫机",
    image_url: "/images/machines/MEY-001.jpg",
    image2_url: "/images/machines/MEY-001-2.jpg",
    explosion_diagram_pdf: "/docs/MEY-001-diagram.pdf",
    status: "publish" as 'publish' | 'draft' | 'trash',
    sort_order: 10
  },
  {
    id: 2,
    code: "MEY-002",
    title_zh: "气垫机 Pro - MEY系列 2代",
    title_en: "Air Cushion Machine Pro - MEY Series 2",
    description_zh: "气垫机2代产品描述（中文）",
    description_en: "Air Cushion Machine 2 description (English)",
    product_line_id: 1,
    type: "气垫机",
    image_url: "/images/machines/MEY-002.jpg",
    image2_url: "/images/machines/MEY-002-2.jpg",
    explosion_diagram_pdf: "/docs/MEY-002-diagram.pdf",
    status: "publish" as 'publish' | 'draft' | 'trash',
    sort_order: 20
  },
  {
    id: 3,
    code: "MEY-003",
    title_zh: "气垫机 Lite - MEY系列",
    title_en: "Air Cushion Machine Lite - MEY Series",
    description_zh: "气垫机轻量版产品描述（中文）",
    description_en: "Air Cushion Machine Lite description (English)",
    product_line_id: 1,
    type: "气垫机",
    image_url: "/images/machines/MEY-003.jpg",
    image2_url: "/images/machines/MEY-003-2.jpg",
    explosion_diagram_pdf: "/docs/MEY-003-diagram.pdf",
    status: "publish" as 'publish' | 'draft' | 'trash',
    sort_order: 30
  }
];

// 模拟设备配件数据
const mockMachineAccessories = [
  {
    id: "FS-001",
    model: "Floor Stand",
    title: "地面支架组件",
    level: 1,
    image_url: "/images/accessories/FS-001.jpg",
    parts: [
      {
        id: "BJT-FS-V2-2024",
        part_number: "BJT-FS-V2-2024",
        title: "标准地面支架",
        specs: {
          "电压": "N/A",
          "频率": "N/A",
          "托盘尺寸": "90×70×120cm",
          "一托数量": "16件"
        },
        spec: "90×70×120cm, 7.8kg",
        spec_imperial: "35.4×27.6×47.2inch, 17.2lbs"
      }
    ]
  },
  {
    id: "PH-001",
    model: "Print Head",
    title: "打印头组件",
    level: 1,
    image_url: "/images/accessories/PH-001.jpg",
    parts: [
      {
        id: "BJT-PH-300P-2024",
        part_number: "BJT-PH-300P-2024",
        title: "标准打印头",
        specs: {
          "电压": "24V",
          "功率": "60W",
          "尺寸": "55×45×10mm"
        },
        spec: "55×45×10mm, 0.6kg",
        spec_imperial: "2.2×1.8×0.4inch, 1.3lbs"
      }
    ]
  }
];

/**
 * 设备接口定义
 */
export interface Machine {
  id: number;
  code: string;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  product_line_id: number;
  type: string;
  image_url?: string;
  image2_url?: string;
  explosion_diagram_pdf?: string;
  status: 'publish' | 'draft' | 'trash';
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 设备配件部件接口定义
 */
export interface MachineAccessoryPart {
  id: string;
  part_number: string;
  title: string;
  specs: Record<string, string>;
  spec: string;
  spec_imperial: string;
}

/**
 * 设备配件接口定义
 */
export interface MachineAccessory {
  id: string;
  model: string;
  title: string;
  level: number;
  image_url: string;
  parts: MachineAccessoryPart[];
}

/**
 * 设备配件响应接口定义
 */
export interface MachineAccessoriesResponse {
  items: MachineAccessory[];
  total: number;
}

/**
 * 设备列表响应接口定义
 */
export interface MachineListResponse {
  items: Machine[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 设备服务类
 */
export class MachineService extends BaseService<MachineListResponse> {
  constructor() {
    super('/machines');
  }

  /**
   * 获取设备列表
   * @param params 查询参数
   */
  async getMachines(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    product_line_id?: number;
    type?: string;
  } = {}): Promise<MachineListResponse> {
    return this.getData('', params);
  }

  /**
   * 获取设备详情
   * @param id 设备ID
   * @param params 查询参数
   */
  async getMachine(id: number, params: {
    lang?: string;
  } = {}): Promise<Machine> {
    try {
      if (this.useMockData) {
        const machine = mockMachines.find(m => m.id === id);
        if (!machine) {
          throw new Error(`Machine with ID ${id} not found`);
        }
        return {
          ...machine,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      const response = await ApiService.get(this.getApiPath(`/${id}`), params);
      return response.data;
    } catch (error) {
      console.error(`Error getting machine with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取设备配件
   * @param machineId 设备ID
   * @param params 查询参数
   */
  async getMachineAccessories(machineId: number, params: {
    level?: number;
    lang?: string;
    region?: string;
  } = {}): Promise<MachineAccessoriesResponse> {
    try {
      if (this.useMockData) {
        // 模拟延迟
        await delay(300);
        
        // 过滤配件级别
        let accessories = [...mockMachineAccessories];
        if (params.level) {
          accessories = accessories.filter(acc => acc.level === params.level);
        }
        
        return {
          items: accessories,
          total: accessories.length
        };
      }

      const response = await ApiService.get(this.getApiPath(`/${machineId}/accessories`), params);
      return response.data;
    } catch (error) {
      console.error(`Error getting accessories for machine ${machineId}:`, error);
      throw error;
    }
  }

  /**
   * 创建设备
   * @param data 设备数据
   */
  async createMachine(data: Partial<Machine>): Promise<Machine> {
    try {
      if (this.useMockData) {
        const newMachine = {
          ...data,
          id: Math.max(...mockMachines.map(m => m.id)) + 1,
          status: data.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Machine;
        
        return newMachine;
      }

      const response = await ApiService.post(this.getApiPath(''), data);
      return response.data;
    } catch (error) {
      console.error('Error creating machine:', error);
      throw error;
    }
  }

  /**
   * 更新设备
   * @param id 设备ID
   * @param data 设备数据
   */
  async updateMachine(id: number, data: Partial<Machine>): Promise<Machine> {
    try {
      if (this.useMockData) {
        const machineIndex = mockMachines.findIndex(m => m.id === id);
        if (machineIndex === -1) {
          throw new Error(`Machine with ID ${id} not found`);
        }
        
        const updatedMachine = {
          ...mockMachines[machineIndex],
          ...data,
          updated_at: new Date().toISOString()
        } as Machine;
        
        return updatedMachine;
      }

      const response = await ApiService.put(this.getApiPath(`/${id}`), data);
      return response.data;
    } catch (error) {
      console.error(`Error updating machine with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除设备
   * @param id 设备ID
   */
  async deleteMachine(id: number): Promise<void> {
    try {
      if (this.useMockData) {
        const machineIndex = mockMachines.findIndex(m => m.id === id);
        if (machineIndex === -1) {
          throw new Error(`Machine with ID ${id} not found`);
        }
        
        // 在真实实现中，这里会删除设备
        return;
      }

      await ApiService.delete(this.getApiPath(`/${id}`));
    } catch (error) {
      console.error(`Error deleting machine with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取模拟数据
   * @param params 查询参数
   */
  protected async getMockData(params: Record<string, any> = {}): Promise<MachineListResponse> {
    // 模拟延迟
    await delay(300);
    
    // 过滤数据
    let filteredMachines = [...mockMachines];
    
    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredMachines = filteredMachines.filter(machine => 
        machine.title_zh?.toLowerCase().includes(searchLower) ||
        machine.title_en?.toLowerCase().includes(searchLower) ||
        machine.code?.toLowerCase().includes(searchLower) ||
        machine.description_zh?.toLowerCase().includes(searchLower) ||
        machine.description_en?.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (params.status) {
      filteredMachines = filteredMachines.filter(machine => machine.status === params.status);
    }
    
    // 产品线过滤
    if (params.product_line_id) {
      filteredMachines = filteredMachines.filter(machine => 
        machine.product_line_id === params.product_line_id
      );
    }
    
    // 类型过滤
    if (params.type) {
      filteredMachines = filteredMachines.filter(machine => 
        machine.type === params.type
      );
    }
    
    // 分页处理
    const page = Number(params.page) || 1;
    const pageSize = Number(params.per_page) || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedMachines = filteredMachines.slice(start, end);
    
    // 添加时间戳
    const items = paginatedMachines.map(machine => ({
      ...machine,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return {
      items,
      total: filteredMachines.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredMachines.length / pageSize)
    };
  }
}

// 导出单例实例
export default new MachineService(); 