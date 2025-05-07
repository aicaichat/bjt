// src/services/machinesService.ts
import HttpService from '../api/httpService';
import { MachineProduct, MachineAccessory, APIResponse, PaginatedResponse } from '../types/machines';
import { useMockData } from '../config/env';
import { mockMachines, mockAccessories, mockLevel2Accessories, mockLevel3Accessories, mockLevel4Accessories, mockLevel5Accessories } from '../mock/machinesMock';

const BASE_PATH = '/wp-json/bjt/v1';

// 模拟网络延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const machinesService = {
  /**
   * 获取设备列表
   */
  getMachines: async (params: {
    region?: string;
    lang?: string;
    page?: number;
    page_size?: number;
    category?: string;
  } = {}): Promise<PaginatedResponse<MachineProduct>> => {
    if (useMockData) {
      await delay();
      const page = params.page || 1;
      const pageSize = params.page_size || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const items = mockMachines.slice(start, end);
      
      return {
        success: true,
        data: {
          items,
          total: mockMachines.length,
          page,
          page_size: pageSize,
          total_pages: Math.ceil(mockMachines.length / pageSize)
        }
      };
    }
    
    return HttpService.get(`${BASE_PATH}/machines`, { params });
  },

  /**
   * 获取设备详情
   */
  getMachine: async (machineId: string, params: {
    region?: string;
    lang?: string;
  } = {}): Promise<APIResponse<MachineProduct>> => {
    if (useMockData) {
      await delay();
      const machine = mockMachines.find(m => m.id === machineId);
      
      if (!machine) {
        throw new Error('Machine not found');
      }
      
      return {
        success: true,
        data: machine
      };
    }
    
    return HttpService.get(`${BASE_PATH}/machines/${machineId}`, { params });
  },

  /**
   * 获取设备配件
   */
  getMachineAccessories: async (machineId: string, params: {
    level?: number;
    region?: string;
    lang?: string;
  } = {}): Promise<APIResponse<{ items: MachineAccessory[], total: number }>> => {
    if (useMockData) {
      await delay();
      
      let accessories;
      // 根据level参数返回不同级别的配件数据
      const level = params.level || 1;
      
      switch(level) {
        case 1:
          accessories = mockAccessories;
          break;
        case 2:
          accessories = mockLevel2Accessories;
          break;
        case 3:
          accessories = mockLevel3Accessories;
          break;
        case 4:
          accessories = mockLevel4Accessories;
          break;
        case 5:
          accessories = mockLevel5Accessories;
          break;
        default:
          accessories = mockAccessories;
      }
      
      return {
        success: true,
        data: {
          items: accessories,
          total: accessories.length
        }
      };
    }
    
    return HttpService.get(`${BASE_PATH}/machines/${machineId}/accessories`, { params });
  },

  /**
   * 获取配件及其关联配件
   */
  getAccessories: async (params: {
    parent_id?: string;
    machine_id?: string;
    level?: number;
    region?: string;
    lang?: string;
  } = {}): Promise<APIResponse<{ items: MachineAccessory[], total: number }>> => {
    if (useMockData) {
      await delay();
      
      let accessories;
      // 根据level参数返回不同级别的配件数据
      const level = params.level || 1;
      
      switch(level) {
        case 1:
          accessories = mockAccessories;
          break;
        case 2:
          accessories = mockLevel2Accessories.filter(acc => 
            params.parent_id ? acc.parent_id === params.parent_id : true
          );
          break;
        case 3:
          accessories = mockLevel3Accessories.filter(acc => 
            params.parent_id ? acc.parent_id === params.parent_id : true
          );
          break;
        case 4:
          accessories = mockLevel4Accessories.filter(acc => 
            params.parent_id ? acc.parent_id === params.parent_id : true
          );
          break;
        case 5:
          accessories = mockLevel5Accessories.filter(acc => 
            params.parent_id ? acc.parent_id === params.parent_id : true
          );
          break;
        default:
          accessories = mockAccessories;
      }
      
      // 如果指定了machine_id，过滤只返回适配该机器的配件
      if (params.machine_id) {
        accessories = accessories.filter(acc => 
          acc.compatible_machines?.includes(params.machine_id as string)
        );
      }
      
      return {
        success: true,
        data: {
          items: accessories,
          total: accessories.length
        }
      };
    }
    
    return HttpService.get(`${BASE_PATH}/accessories`, { params });
  },

  /**
   * 添加到购物车
   */
  addToCart: async (data: {
    product_id: string;
    product_type: 'machine' | 'accessory' | 'consumable' | 'spare';
    quantity: number;
    voltage?: string;
    properties?: Record<string, string>;
  }): Promise<APIResponse<{cart_count: number, item_id: string, summary: any}>> => {
    if (useMockData) {
      await delay();
      // 模拟添加到购物车的响应
      return {
        success: true,
        data: {
          cart_count: Math.floor(Math.random() * 5) + 1, // 1-5之间的随机数
          item_id: `cart_item_${Date.now()}`,
          summary: {
            count: Math.floor(Math.random() * 5) + 1,
            total: data.quantity * 10000, // 简单计算
            currency: "¥",
            currency_code: "CNY"
          }
        }
      };
    }
    
    return HttpService.post(`${BASE_PATH}/cart/add`, data);
  }
};

export default machinesService;