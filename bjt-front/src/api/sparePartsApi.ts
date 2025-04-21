import axios from 'axios';

const API_BASE_URL = '/wp-json/bjt/v1';

// 备件类型接口定义
export interface SparePart {
  id: string;
  part_number: string;
  name_cn: string;
  name_en: string;
  consumable: string;
  package_size: string;
  package_weight: number;
  app_model: string;
  app_sn: string;
  image_url: string;
  status: string;
  accessory_type?: string;
  inventory?: {
    status: 'high' | 'medium' | 'low';
    statusText: string;
    locations: Array<{code: string, count: number}>;
  };
  prices?: {
    original: number;
    current: number;
    tiers: Array<{range: string, price: number}>;
  };
}

// 备件模拟数据
const MOCK_SPARE_PARTS: SparePart[] = [
  {
    id: '1',
    part_number: 'SP-001',
    name_cn: '气缸套',
    name_en: 'Cylinder Sleeve',
    consumable: 'consumable',
    package_size: '30×20×10cm',
    package_weight: 1.5,
    app_model: 'LA-E4S, LA-E5P',
    app_sn: 'SN2021-2023',
    image_url: '/images/spare-parts/cylinder.svg',
    status: 'active',
    inventory: {
      status: 'high',
      statusText: '充足',
      locations: [
        { code: 'SH', count: 35 },
        { code: 'BJ', count: 22 }
      ]
    },
    prices: {
      original: 299.00,
      current: 259.00,
      tiers: [
        { range: '1-9', price: 259.00 },
        { range: '10-49', price: 239.00 },
        { range: '50+', price: 219.00 }
      ]
    }
  },
  {
    id: '2',
    part_number: 'SP-002',
    name_cn: '空气滤清器',
    name_en: 'Air Filter',
    consumable: 'consumable',
    package_size: '25×25×5cm',
    package_weight: 0.8,
    app_model: 'LA-E4S, LA-E5P, LP-V1',
    app_sn: 'ALL',
    image_url: '/images/spare-parts/filter.svg',
    status: 'active',
    inventory: {
      status: 'medium',
      statusText: '适中',
      locations: [
        { code: 'SH', count: 18 },
        { code: 'BJ', count: 12 }
      ]
    },
    prices: {
      original: 129.00,
      current: 99.00,
      tiers: [
        { range: '1-9', price: 99.00 },
        { range: '10-49', price: 89.00 },
        { range: '50+', price: 79.00 }
      ]
    }
  },
  {
    id: '3',
    part_number: 'SP-003',
    name_cn: '控制面板',
    name_en: 'Control Panel',
    consumable: 'non-consumable',
    package_size: '40×30×10cm',
    package_weight: 2.2,
    app_model: 'LP-V1, LP-F1',
    app_sn: 'SN2022+',
    image_url: '/images/spare-parts/control-panel.svg',
    status: 'active',
    accessory_type: '电子部件',
    inventory: {
      status: 'low',
      statusText: '紧缺',
      locations: [
        { code: 'SH', count: 5 },
        { code: 'BJ', count: 3 }
      ]
    },
    prices: {
      original: 999.00,
      current: 899.00,
      tiers: [
        { range: '1-4', price: 899.00 },
        { range: '5-19', price: 849.00 },
        { range: '20+', price: 799.00 }
      ]
    }
  }
];

// 模拟筛选选项数据
const MOCK_FILTER_OPTIONS = {
  hostModels: ['LA-E4S', 'LA-E5P', 'LP-V1', 'LP-F1'],
  accessoryModels: ['MC-A1', 'MC-B2', 'MC-C3'],
  partTypes: ['consumable', 'non-consumable'],
  locations: ['SH', 'BJ', 'GZ']
};

// 获取所有备件 - 返回模拟数据
export const getAllSpareParts = async (filters?: {
  consumable?: string;
  model?: string;
}) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // 应用筛选条件
    let filteredParts = [...MOCK_SPARE_PARTS];
    
    if (filters?.consumable) {
      filteredParts = filteredParts.filter(part => part.consumable === filters.consumable);
    }
    
    if (filters?.model && filters.model !== undefined) {
      filteredParts = filteredParts.filter(part => part.app_model.includes(filters.model as string));
    }
    
    return filteredParts;
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    return [];
  }
};

// 获取单个备件详情 - 返回模拟数据
export const getSparePartById = async (id: string) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const part = MOCK_SPARE_PARTS.find(p => p.id === id);
    if (!part) {
      throw new Error(`Spare part with ID ${id} not found`);
    }
    return part;
  } catch (error) {
    console.error(`Error fetching spare part with ID ${id}:`, error);
    throw error;
  }
};

// 获取备件的必选备件 - 返回模拟数据
export const getRequiredSpareParts = async (partNumber: string) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 400));
  
  try {
    // 简单逻辑：返回不同的备件
    return MOCK_SPARE_PARTS.filter(p => p.part_number !== partNumber).slice(0, 2);
  } catch (error) {
    console.error(`Error fetching required spare parts for ${partNumber}:`, error);
    return [];
  }
};

// 获取适用于特定主机型号的备件 - 返回模拟数据
export const getSparePartsByHostModel = async (hostModel: string) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 400));
  
  try {
    return MOCK_SPARE_PARTS.filter(p => p.app_model.includes(hostModel));
  } catch (error) {
    console.error(`Error fetching spare parts for host model ${hostModel}:`, error);
    return [];
  }
};

// 获取可用的备件筛选选项 - 返回模拟数据
export const getSparePartsFilterOptions = async () => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    return MOCK_FILTER_OPTIONS;
  } catch (error) {
    console.error('Error fetching spare parts filter options:', error);
    return { hostModels: [], accessoryModels: [], partTypes: [], locations: [] };
  }
};

// 提交备件购物车 - 模拟提交
export const submitSparePartsOrder = async (orderData: {
  customerInfo: any;
  items: Array<{part_number: string, quantity: number}>;
}) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    // 模拟订单确认响应
    return {
      success: true,
      orderId: `ORD-${Date.now()}`,
      items: orderData.items,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error submitting spare parts order:', error);
    throw error;
  }
}; 