// 备件模拟数据
export interface SparePart {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  category: 'electrical' | 'mechanical' | 'electronic' | 'other';
  image_url: string;
  compatibility: string[];
  specifications: Record<string, string>;
  inventory: SparePartInventory[];
  prices: SparePartPrices;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  replacement_interval?: string;
  warranty_period?: string;
}

export interface SparePartInventory {
  region: string;
  amount: number;
}

export interface SparePartPrices {
  base: number;
  tier1: number;
  tier2: number;
  vip: number;
}

export const mockSpareParts: SparePart[] = [
  {
    id: 'SP-LP-001',
    code: 'LP-HEATER',
    name: '加热元件套装',
    name_en: 'Heater Element Assembly',
    description: 'LP系列气垫机标准加热元件套装，包含温控传感器',
    description_en: 'Standard heater element assembly for LP series air cushion machines, includes temperature sensor',
    category: 'electrical',
    image_url: '/images/shop/sp-heater.jpg',
    compatibility: ['LP-V1', 'LP-F1', 'LP-P1', 'MEY-001'],
    specifications: {
      'Voltage': '220V/110V',
      'Power': '200W',
      'Temperature range': '120-180°C',
      'Dimensions': '120 × 35 × 25mm',
      'Weight': '180g'
    },
    inventory: [
      { region: 'CN', amount: 150 },
      { region: 'EU', amount: 60 },
      { region: 'NA', amount: 80 },
      { region: 'AU', amount: 40 }
    ],
    prices: {
      base: 85,
      tier1: 80,
      tier2: 75,
      vip: 70
    },
    status: 'in_stock',
    replacement_interval: '2000小时或1年',
    warranty_period: '6个月'
  },
  {
    id: 'SP-LP-002',
    code: 'LP-MOTOR',
    name: '传动电机',
    name_en: 'Drive Motor',
    description: 'LP系列气垫机用高性能传动电机，低噪音长寿命设计',
    description_en: 'High-performance drive motor for LP series air cushion machines, low noise and long life design',
    category: 'electrical',
    image_url: '/images/shop/sp-motor.jpg',
    compatibility: ['LP-V1', 'LP-F1', 'MEY-001'],
    specifications: {
      'Voltage': '24V DC',
      'Power': '60W',
      'Speed': '0-120RPM',
      'Dimensions': '90 × 80 × 75mm',
      'Weight': '450g'
    },
    inventory: [
      { region: 'CN', amount: 120 },
      { region: 'EU', amount: 45 },
      { region: 'NA', amount: 65 },
      { region: 'AU', amount: 30 }
    ],
    prices: {
      base: 150,
      tier1: 140,
      tier2: 130,
      vip: 120
    },
    status: 'in_stock',
    replacement_interval: '5000小时或2年',
    warranty_period: '1年'
  },
  {
    id: 'SP-LP-003',
    code: 'LP-CONTROL',
    name: '控制电路板',
    name_en: 'Control Circuit Board',
    description: 'LP系列气垫机主控电路板，控制所有机器功能',
    description_en: 'Main control circuit board for LP series air cushion machines, controls all machine functions',
    category: 'electronic',
    image_url: '/images/shop/sp-pcb.jpg',
    compatibility: ['LP-V1', 'LP-F1', 'LP-P1', 'MEY-001'],
    specifications: {
      'Input voltage': '220V/110V',
      'Output voltage': '5V/12V/24V',
      'Dimensions': '180 × 120 × 20mm',
      'Weight': '220g',
      'Processor': 'ARM Cortex-M3'
    },
    inventory: [
      { region: 'CN', amount: 90 },
      { region: 'EU', amount: 40 },
      { region: 'NA', amount: 50 },
      { region: 'AU', amount: 25 }
    ],
    prices: {
      base: 280,
      tier1: 260,
      tier2: 240,
      vip: 220
    },
    status: 'in_stock',
    warranty_period: '1年'
  },
  {
    id: 'SP-MFA-001',
    code: 'MFA-CUTTER',
    name: '裁切刀具组件',
    name_en: 'Cutting Blade Assembly',
    description: 'MFA系列纸垫机裁切刀具组件，高强度刀刃，精确切割',
    description_en: 'Cutting blade assembly for MFA series paper cushion machines, high-strength blade for precise cutting',
    category: 'mechanical',
    image_url: '/images/shop/sp-blade.jpg',
    compatibility: ['MFA-002'],
    specifications: {
      'Material': '高速钢',
      'Hardness': 'HRC 60-62',
      'Edge length': '420mm',
      'Dimensions': '450 × 35 × 1.5mm',
      'Weight': '350g'
    },
    inventory: [
      { region: 'CN', amount: 100 },
      { region: 'EU', amount: 50 },
      { region: 'NA', amount: 60 },
      { region: 'AU', amount: 30 }
    ],
    prices: {
      base: 120,
      tier1: 110,
      tier2: 100,
      vip: 90
    },
    status: 'in_stock',
    replacement_interval: '100000次切割或6个月',
    warranty_period: '3个月'
  },
  {
    id: 'SP-TBY-001',
    code: 'TBY-PUMP',
    name: '水泵组件',
    name_en: 'Water Pump Assembly',
    description: 'TBY系列水胶带机用水泵组件，包含过滤器和水位传感器',
    description_en: 'Water pump assembly for TBY series water activated tape machines, includes filter and water level sensor',
    category: 'mechanical',
    image_url: '/images/shop/sp-pump.jpg',
    compatibility: ['TBY-003'],
    specifications: {
      'Voltage': '12V DC',
      'Power': '15W',
      'Flow rate': '1.2L/min',
      'Dimensions': '75 × 60 × 55mm',
      'Weight': '280g'
    },
    inventory: [
      { region: 'CN', amount: 80 },
      { region: 'EU', amount: 35 },
      { region: 'NA', amount: 45 },
      { region: 'AU', amount: 20 }
    ],
    prices: {
      base: 95,
      tier1: 90,
      tier2: 85,
      vip: 80
    },
    status: 'in_stock',
    replacement_interval: '3000小时或1年',
    warranty_period: '6个月'
  }
]; 