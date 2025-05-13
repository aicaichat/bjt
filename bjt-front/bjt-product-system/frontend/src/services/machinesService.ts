// src/services/machinesService.ts
import HttpServiceInstance, { ApiResponse } from './apiService';
import { MachineProduct, MachineAccessory, MachineListData, MachinePart, MachinePartListData } from '../types/machines';
// import { useMockData } from '../config/env'; // 移除旧的导入
import { getMockMachineAccessories, getMockMachineParts } from "../services/mocks/machines.mocks";
import { delay } from '../utils/delay';
// Explicitly import the type again to potentially help TS inference
import type { MachinePartListData as ExplicitMachinePartListData } from '../types/machines';

// const BASE_PATH = '/wp-json/bjt/v1'; // Removed BASE_PATH

export const machinesService = {
  /**
   * 获取设备列表 (Now fetches Machine Parts)
   */
  getMachines: async (params: {
    region?: string;
    lang?: string;
    page?: number;
    page_size?: number;
    category?: string; // Note: Category filter not implemented in mock yet
    voltage?: string; // Added voltage filter possibility
    product_line_id?: number | string; // Added product_line_id filter possibility
  } = {}): Promise<MachinePartListData> => { // Updated return type
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用新的环境变量判断
      await delay(300);
      const page = params.page || 1;
      const pageSize = params.page_size || 10;
      // Call getMockMachineParts - passing relevant filters
      const mockData: ExplicitMachinePartListData = getMockMachineParts(
        { 
          voltage: params.voltage,
          product_line_id: params.product_line_id ? Number(params.product_line_id) : undefined // Pass product_line_id to mock
        }, 
        page, 
        pageSize
      );
      return mockData;

      // Removed old logic:
      // const start = (page - 1) * pageSize;
      // const end = start + pageSize;
      // const items = mockMachines.slice(start, end);
      // return {
      //   items,
      //   total: mockMachines.length,
      //   page,
      //   page_size: pageSize,
      //   total_pages: Math.ceil(mockMachines.length / pageSize)
      // };
    }
    
    // Assuming the API endpoint /machines now returns MachinePartListData
    const responseUntyped = await HttpServiceInstance.get(`/machines`, params);
    // Adjust type assertion if necessary based on actual API response structure
    const response = responseUntyped as ApiResponse<MachinePartListData>; 
    return response.data;
  },

  /**
   * 获取设备详情 (Now fetches Machine Part Detail)
   * Note: Mock currently fetches all and filters, inefficient.
   */
  getMachine: async (machineId: string, params: {
    region?: string;
    lang?: string;
  } = {}): Promise<MachinePart> => { // Updated return type
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用新的环境变量判断
      await delay(300);
      // Fetch all mock parts (inefficient, TODO: add getMockMachinePartById)
      // Explicitly type the result using the aliased import
      const allPartsData: ExplicitMachinePartListData = getMockMachineParts({}, 1, 1000); // Fetch large page size
      const machine = allPartsData.items.find(m => m.id.toString() === machineId);

      if (!machine) {
        throw new Error('Machine part not found in mock data');
      }
      
      return machine;
      // Removed old logic:
      // const machine = mockMachines.find(m => m.id.toString() === machineId);
      // if (!machine) {
      //   throw new Error('Machine not found in mock data');
      // }
      // return machine;
    }
    
    // Assuming API endpoint /machines/{id} now returns a MachinePart
    const response: ApiResponse<MachinePart> = await HttpServiceInstance.get<MachinePart>(`/machines/${machineId}`, params);
    return response.data;
  },

  /**
   * 获取设备配件
   */
  getMachineAccessories: async (machineId: string, params: {
    level?: number;
    region?: string;
    lang?: string;
    parent_id?: string | number;
    machine_id?: string | number;
  } = {}): Promise<{ items: MachineAccessory[], total: number }> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用新的环境变量判断
      await delay(300);
      
      // Fetch accessories based on parent part number (or machine if no parent)
      // Assuming machineId corresponds to a part_number for the top level
      const parentIdentifier = params.parent_id || machineId;
      let accessories = getMockMachineAccessories(parentIdentifier as string);
      
      // Original filtering logic based on machine_id might still be relevant
      // if the mock data doesn't perfectly reflect the relations table.
      if (params.machine_id) {
        accessories = accessories.filter(acc => 
          acc.compatible_machines?.includes(params.machine_id as string)
        );
      }
      
      return {
        items: accessories,
        total: accessories.length
      };
    }
    
    const response: ApiResponse<{ items: MachineAccessory[], total: number }> = await HttpServiceInstance.get(`/machines/${machineId}/accessories`, params);
    return response.data;
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
  } = {}): Promise<{ items: MachineAccessory[], total: number }> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用新的环境变量判断
      await delay(300);
      
      // Fetch accessories based on parent_id if provided, otherwise return empty array
      const parentIdentifier = params.parent_id;
      let accessories: MachineAccessory[] = [];
      if (parentIdentifier) {
        accessories = getMockMachineAccessories(parentIdentifier as string);
      } else {
        console.warn('getAccessories called without parent_id in mock mode, returning empty.');
      }

      // Original filtering logic based on machine_id might still be relevant
      if (params.machine_id) {
        accessories = accessories.filter(acc => 
          acc.compatible_machines?.includes(params.machine_id as string)
        );
      }
      
      return {
        items: accessories,
        total: accessories.length
      };
    }
    
    const response: ApiResponse<{ items: MachineAccessory[], total: number }> = await HttpServiceInstance.get(`/accessories`, params);
    return response.data;
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
  }): Promise<{cart_count: number, item_id: string, summary: any}> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用新的环境变量判断
      await delay(300);
      // 模拟添加到购物车的响应
      return {
        cart_count: Math.floor(Math.random() * 5) + 1, // 1-5之间的随机数
        item_id: `cart_item_${Date.now()}`,
        summary: {
          count: Math.floor(Math.random() * 5) + 1,
          total: data.quantity * 10000, // 简单计算
          currency: "¥",
          currency_code: "CNY"
        }
      };
    }
    
    const response: ApiResponse<{cart_count: number, item_id: string, summary: any}> = await HttpServiceInstance.post(`/cart/add`, data);
    return response.data;
  }
};

export default machinesService;