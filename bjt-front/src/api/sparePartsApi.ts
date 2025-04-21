import axios from 'axios';

const API_BASE_URL = '/wp-json/bjt/v1';

// 定义备件数据接口，根据数据库设计
export interface SparePart {
  id: string;
  type: 'consumable' | 'electronic' | 'mechanical';
  product_type: 'machine' | 'accessory';
  part_number: string;
  name_cn: string;
  name_en: string;
  package_size: string;
  package_size_imperial?: string;
  package_weight: number;
  app_model: string;
  app_sn: string;
  spec_imperial?: string;
  spec: string;
  image_url: string;
  status: string;
  box_quantity?: number;
  inventory: {
    total: number;
    eu: number;
    na: number;
    au: number;
    cn: number;
    status?: string;
  };
  prices: {
    original: number;
    current: number;
    tiers: {
      range: string;
      price: number;
      eu: number;
      na: number;
      au: number;
      cn: number;
    }[];
  };
  created_at: string;
  updated_at: string;
  is_consumable: boolean;
}

// 定义API参数接口
export interface SparePartsQueryParams {
  consumable?: string;
  model?: string;
  product_type?: string;
}

// 定义筛选选项接口
export interface SparePartsFilterOptions {
  hostModels: string[];
  accessoryModels: string[];
  partTypes: { id: string; name: string }[];
}

// Mock数据：备件列表
const mockSpareParts: SparePart[] = [
  {
    id: "SP1001",
    type: "consumable",
    product_type: "machine",
    part_number: "07A0101001",
    name_cn: "Air Cushion Film Roll",
    name_en: "Air Cushion Film Roll",
    package_size: "30x30x40cm",
    package_size_imperial: "30x30x40cm",
    package_weight: 5.2,
    app_model: "LP-V1, LP-F1",
    app_sn: "20001-30000",
    spec_imperial: "ACFR-25-400-01",
    spec: "ACFR-25-400-01",
    image_url: "/images/spare-parts/film-roll.jpg",
    status: "publish",
    box_quantity: 10,
    inventory: {
      total: 120,
      eu: 30,
      na: 45,
      au: 15,
      cn: 30
    },
    prices: {
      original: 180,
      current: 150,
      tiers: [
        { range: "1-5", price: 150, eu: 180, na: 150, au: 195, cn: 980 },
        { range: "6-20", price: 140, eu: 170, na: 140, au: 180, cn: 900 },
        { range: ">20", price: 130, eu: 160, na: 130, au: 170, cn: 850 }
      ]
    },
    created_at: "2023-05-15T08:30:00Z",
    updated_at: "2023-08-20T14:20:00Z",
    is_consumable: true
  },
  {
    id: "SP1002",
    type: "electronic",
    product_type: "machine",
    part_number: "07A0102002",
    name_cn: "Main Control Board",
    name_en: "Main Control Board",
    package_size: "20x15x5cm",
    package_size_imperial: "20x15x5cm",
    package_weight: 0.8,
    app_model: "LP-V1",
    app_sn: "All",
    spec_imperial: "MCB-V21-15-05",
    spec: "MCB-V21-15-05",
    image_url: "/images/spare-parts/control-board.jpg",
    status: "publish",
    box_quantity: 20,
    inventory: {
      total: 50,
      eu: 12,
      na: 20,
      au: 8,
      cn: 10
    },
    prices: {
      original: 350,
      current: 320,
      tiers: [
        { range: "1-2", price: 320, eu: 380, na: 320, au: 420, cn: 2100 },
        { range: "3-10", price: 300, eu: 360, na: 300, au: 390, cn: 1950 },
        { range: ">10", price: 280, eu: 340, na: 280, au: 370, cn: 1820 }
      ]
    },
    created_at: "2023-04-10T10:45:00Z",
    updated_at: "2023-09-05T16:30:00Z",
    is_consumable: false
  },
  {
    id: "SP1003",
    type: "mechanical",
    product_type: "machine",
    part_number: "07A0103003",
    name_cn: "Air Pump Assembly",
    name_en: "Air Pump Assembly",
    package_size: "25x20x15cm",
    package_size_imperial: "25x20x15cm",
    package_weight: 2.3,
    app_model: "LP-V1, LP-F1",
    app_sn: "All",
    spec_imperial: "APA-120-220-V2",
    spec: "APA-120-220-V2",
    image_url: "/images/spare-parts/air-pump.jpg",
    status: "publish",
    box_quantity: 5,
    inventory: {
      total: 35,
      eu: 8,
      na: 12,
      au: 5,
      cn: 10
    },
    prices: {
      original: 220,
      current: 200,
      tiers: [
        { range: "1-3", price: 200, eu: 240, na: 200, au: 260, cn: 1300 },
        { range: "4-10", price: 180, eu: 220, na: 180, au: 240, cn: 1170 },
        { range: ">10", price: 170, eu: 200, na: 170, au: 220, cn: 1100 }
      ]
    },
    created_at: "2023-03-22T09:15:00Z",
    updated_at: "2023-10-12T11:20:00Z",
    is_consumable: false
  },
  {
    id: "SP1004",
    type: "consumable",
    product_type: "accessory",
    part_number: "07A0104004",
    name_cn: "Thermal Paper Roll",
    name_en: "Thermal Paper Roll",
    package_size: "10x10x15cm",
    package_size_imperial: "10x10x15cm",
    package_weight: 0.5,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "All",
    spec_imperial: "TPR-08-30-R1",
    spec: "TPR-08-30-R1",
    image_url: "/images/spare-parts/thermal-paper.jpg",
    status: "publish",
    box_quantity: 50,
    inventory: {
      total: 200,
      eu: 50,
      na: 70,
      au: 30,
      cn: 50
    },
    prices: {
      original: 25,
      current: 20,
      tiers: [
        { range: "1-10", price: 20, eu: 24, na: 20, au: 26, cn: 130 },
        { range: "11-50", price: 18, eu: 22, na: 18, au: 24, cn: 120 },
        { range: ">50", price: 15, eu: 18, na: 15, au: 20, cn: 100 }
      ]
    },
    created_at: "2023-06-05T13:40:00Z",
    updated_at: "2023-11-01T09:30:00Z",
    is_consumable: true
  },
  {
    id: "SP1005",
    type: "mechanical",
    product_type: "accessory",
    part_number: "07A0105325",
    name_cn: "Ceramic Blade",
    name_en: "Ceramic Blade",
    package_size: "15x10x5cm",
    package_size_imperial: "15x10x5cm",
    package_weight: 0.6,
    app_model: "LP-F1",
    app_sn: "25001-40000",
    spec_imperial: "CBM-05-SS-F1",
    spec: "CBM-05-SS-F1",
    image_url: "/images/spare-parts/cutting-blade.jpg",
    status: "publish",
    box_quantity: 30,
    inventory: {
      total: 80,
      eu: 20,
      na: 30,
      au: 10,
      cn: 20
    },
    prices: {
      original: 85,
      current: 75,
      tiers: [
        { range: "1-5", price: 75, eu: 90, na: 75, au: 100, cn: 490 },
        { range: "6-20", price: 70, eu: 85, na: 70, au: 92, cn: 450 },
        { range: ">20", price: 65, eu: 78, na: 65, au: 85, cn: 420 }
      ]
    },
    created_at: "2023-05-20T11:25:00Z",
    updated_at: "2023-10-25T15:45:00Z",
    is_consumable: false
  },
  {
    id: "SP1006",
    type: "electronic",
    product_type: "accessory",
    part_number: "07A0101019",
    name_cn: "Seamless Teflon Ring Belt",
    name_en: "Seamless Teflon Ring Belt",
    package_size: "22x18x5cm",
    package_size_imperial: "22x18x5cm",
    package_weight: 0.7,
    app_model: "LP-V1, LP-F1",
    app_sn: "All",
    spec_imperial: "STRB-70-50-190",
    spec: "STRB-70-50-190",
    image_url: "/images/spare-parts/lcd-screen.jpg",
    status: "publish",
    box_quantity: 15,
    inventory: {
      total: 40,
      eu: 10,
      na: 15,
      au: 5,
      cn: 10
    },
    prices: {
      original: 120,
      current: 110,
      tiers: [
        { range: "1-3", price: 110, eu: 130, na: 110, au: 140, cn: 720 },
        { range: "4-10", price: 100, eu: 120, na: 100, au: 130, cn: 650 },
        { range: ">10", price: 90, eu: 110, na: 90, au: 120, cn: 580 }
      ]
    },
    created_at: "2023-04-15T14:55:00Z",
    updated_at: "2023-11-10T10:15:00Z",
    is_consumable: false
  }
];

// Mock数据：筛选选项
const mockFilterOptions: SparePartsFilterOptions = {
  hostModels: ["LP-V1", "LP-F1", "LP-E4S"],
  accessoryModels: ["Standard", "Premium", "Professional"],
  partTypes: [
    { id: "consumable", name: "Consumables" },
    { id: "electronic", name: "Electronics" },
    { id: "mechanical", name: "Mechanical" }
  ]
};

// 实际API调用函数
export async function getAllSpareParts(params?: SparePartsQueryParams): Promise<SparePart[]> {
  try {
    // 实际环境中应该调用后端API
    // const response = await axios.get('/api/spare-parts', { params });
    // return response.data;
    
    // 模拟API调用，添加筛选逻辑
    return new Promise((resolve) => {
      // 模拟网络延迟
      setTimeout(() => {
        let results = [...mockSpareParts];
        
        // 根据备件类型筛选
        if (params?.consumable) {
          if (params.consumable === 'consumable') {
            results = results.filter(part => part.type === 'consumable');
          } else if (params.consumable === 'non-consumable') {
            results = results.filter(part => part.type !== 'consumable');
          }
        }
        
        // 根据机器型号筛选
        if (params?.model) {
          results = results.filter(part => part.app_model.includes(params.model as string));
        }
        
        // 根据产品类型筛选
        if (params?.product_type) {
          results = results.filter(part => part.product_type === params.product_type);
        }
        
        resolve(results);
      }, 500); // 模拟0.5秒网络延迟
    });
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    throw error;
  }
}

// 获取筛选选项
export async function getSparePartsFilterOptions(): Promise<SparePartsFilterOptions> {
  try {
    // 实际环境中应该调用后端API
    // const response = await axios.get('/api/spare-parts/filter-options');
    // return response.data;
    
    // 模拟API调用
    return new Promise((resolve) => {
      // 模拟网络延迟
      setTimeout(() => {
        resolve(mockFilterOptions);
      }, 300); // 模拟0.3秒网络延迟
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
}

// 根据ID获取备件详情
export async function getSparePartById(id: string): Promise<SparePart | null> {
  try {
    // 实际环境中应该调用后端API
    // const response = await axios.get(`/api/spare-parts/${id}`);
    // return response.data;
    
    // 模拟API调用
    return new Promise((resolve) => {
      // 模拟网络延迟
      setTimeout(() => {
        const part = mockSpareParts.find(p => p.id === id) || null;
        resolve(part);
      }, 300); // 模拟0.3秒网络延迟
    });
  } catch (error) {
    console.error(`Error fetching spare part with ID ${id}:`, error);
    throw error;
  }
}

// 获取备件的必选备件 - 返回模拟数据
export const getRequiredSpareParts = async (partNumber: string) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 400));
  
  try {
    // 简单逻辑：返回不同的备件
    return mockSpareParts.filter(p => p.part_number !== partNumber).slice(0, 2);
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
    return mockSpareParts.filter(p => p.app_model.includes(hostModel));
  } catch (error) {
    console.error(`Error fetching spare parts for host model ${hostModel}:`, error);
    return [];
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