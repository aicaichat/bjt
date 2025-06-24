// src/services/machinesService.ts
import HttpServiceInstance, { ApiResponse } from './apiService';
import { MachineProduct, MachineAccessory, MachineListData, MachinePart, MachinePartListData } from '../types/machines';

export const machinesService = {
  /**
   * 获取主机料号列表 (Host Parts List)
   */
  getMachines: async (params: {
    region?: string;
    lang?: string;
    page?: number;
    page_size?: number;
    category?: string;
    voltage?: string;
    product_line_id?: number | string;
  } = {}): Promise<MachinePartListData> => {
    console.log('🔧 [machinesService] Fetching machines from real API with params:', params);
    
    try {
      const responseUntyped = await HttpServiceInstance.get(`/machineparts`, params);
      const response = responseUntyped as ApiResponse<MachinePartListData>; 
      console.log('✅ [machinesService] Successfully fetched machines from real API');
      return response.data;
    } catch (error) {
      console.error('❌ [machinesService] Error fetching machines:', error);
      throw error;
    }
  },

  /**
   * 获取主机料号详情 (Host Part Detail)
   */
  getMachine: async (machineId: string, params: {
    region?: string;
    lang?: string;
  } = {}): Promise<MachinePart> => {
    console.log('🔧 [machinesService] Fetching machine detail from real API:', machineId);
    
    try {
      const response: ApiResponse<MachinePart> = await HttpServiceInstance.get<MachinePart>(`/machineparts/${machineId}`, params);
      console.log('✅ [machinesService] Successfully fetched machine detail from real API');
      return response.data;
    } catch (error) {
      console.error('❌ [machinesService] Error fetching machine detail:', error);
      throw error;
    }
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
    console.log('🔧 [machinesService] Fetching machine accessories from real API:', machineId);
    
    try {
      const response: ApiResponse<{ items: MachineAccessory[], total: number }> = await HttpServiceInstance.get(`/machines/${machineId}/accessories`, params);
      console.log('✅ [machinesService] Successfully fetched machine accessories from real API');
      return response.data;
    } catch (error) {
      console.error('❌ [machinesService] Error fetching machine accessories:', error);
      throw error;
    }
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
    console.log('🔧 [machinesService] Fetching accessories from real API with params:', params);
    
    try {
      const response: ApiResponse<{ items: MachineAccessory[], total: number }> = await HttpServiceInstance.get(`/accessories`, params);
      console.log('✅ [machinesService] Successfully fetched accessories from real API');
      return response.data;
    } catch (error) {
      console.error('❌ [machinesService] Error fetching accessories:', error);
      throw error;
    }
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
    console.log('🔧 [machinesService] Adding to cart via real API:', data);
    
    try {
      const response: ApiResponse<{cart_count: number, item_id: string, summary: any}> = await HttpServiceInstance.post(`/cart/add`, data);
      console.log('✅ [machinesService] Successfully added to cart via real API');
      return response.data;
    } catch (error) {
      console.error('❌ [machinesService] Error adding to cart:', error);
      throw error;
    }
  }
};

export default machinesService;