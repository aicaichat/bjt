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
   * 获取主机料号列表 (Host Parts List)
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
    // 添加调试输出
    console.log('🔍 [machinesService] Environment variables check:', {
      VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
      shouldUseMock: import.meta.env.VITE_USE_MOCK_DATA === 'true',
      allEnvVars: import.meta.env
    });
    
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用环境变量判断
      console.log('✅ [machinesService] Using MOCK data mode');
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
      console.log('📦 [machinesService] Mock data returned:', mockData);
      return mockData;
    }
    
    console.log('⚠️ [machinesService] Using REAL API mode');
    // 🔧 使用正确的 /machineparts 端点（返回wp_bjt_parts数据，包含part_number字段）
    const responseUntyped = await HttpServiceInstance.get(`/machineparts`, params);
    // Adjust type assertion if necessary based on actual API response structure
    const response = responseUntyped as ApiResponse<MachinePartListData>; 
    return response.data;
  },

  /**
   * 获取主机料号详情 (Host Part Detail)
   * Note: Mock currently fetches all and filters, inefficient.
   */
  getMachine: async (machineId: string, params: {
    region?: string;
    lang?: string;
  } = {}): Promise<MachinePart> => { // Updated return type
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用环境变量判断
      await delay(300);
      // Fetch all mock parts (inefficient, TODO: add getMockMachinePartById)
      // Explicitly type the result using the aliased import
      const allPartsData: ExplicitMachinePartListData = getMockMachineParts({}, 1, 1000); // Fetch large page size
      const machine = allPartsData.items.find(m => m.id.toString() === machineId);

      if (!machine) {
        throw new Error('Machine part not found in mock data');
      }
      
      return machine;
    }
    
    // 🔧 使用正确的 /machineparts 端点（返回wp_bjt_parts数据，包含part_number字段）
    const response: ApiResponse<MachinePart> = await HttpServiceInstance.get<MachinePart>(`/machineparts/${machineId}`, params);
    return response.data;
  },

  /**
   * 获取主机配件
   */
  getMachineAccessories: async (machineId: string, params: {
    level?: number;
    region?: string;
    lang?: string;
    parent_id?: string | number;
    machine_id?: string | number;
  } = {}): Promise<{ items: MachineAccessory[], total: number }> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用环境变量判断
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
    
    // 这里API路径保持不变，因为这个接口是针对主机料号获取配件的
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
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用环境变量判断
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
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') { // 使用环境变量判断
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