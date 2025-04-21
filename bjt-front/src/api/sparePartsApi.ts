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
export const mockSpareParts: SparePart[] = [
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
  },
  {
    id: "sp007",
    part_number: "BJT-SP-007",
    name_cn: "真空泵组件",
    name_en: "Vacuum Pump Assembly",
    package_size: "28x22x18cm",
    package_size_imperial: "11x8.6x7.1in",
    package_weight: 2.6,
    app_model: "LP-V1, LP-F1",
    app_sn: "LP-V1-*, LP-F1-*",
    spec_imperial: "Rated Power: 180W, Vacuum: -90kPa",
    spec: "额定功率: 180W, 真空度: -90kPa",
    image_url: "/images/spare-parts/vacuum-pump.jpg",
    status: "active",
    box_quantity: 4,
    inventory: {
      total: 85,
      eu: 25,
      na: 32,
      au: 8,
      cn: 20
    },
    prices: {
      original: 680,
      current: 620,
      tiers: [
        { range: "1-5", price: 620, eu: 80, na: 90, au: 95, cn: 620 },
        { range: "6-20", price: 590, eu: 75, na: 85, au: 90, cn: 590 },
        { range: ">20", price: 550, eu: 70, na: 80, au: 85, cn: 550 }
      ]
    },
    product_type: "accessory",
    is_consumable: false,
    type: "mechanical",
    created_at: "2023-05-05T08:30:00Z",
    updated_at: "2023-09-15T11:20:00Z"
  },
  {
    id: "sp008",
    part_number: "BJT-SP-008",
    name_cn: "电磁阀组件",
    name_en: "Solenoid Valve Assembly",
    package_size: "15x12x8cm",
    package_size_imperial: "5.9x4.7x3.1in",
    package_weight: 0.85,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "DC24V, 8W, 0-0.8MPa",
    spec: "DC24V, 8W, 0-0.8MPa",
    image_url: "/images/spare-parts/solenoid-valve.jpg",
    status: "active",
    box_quantity: 10,
    inventory: {
      total: 120,
      eu: 35,
      na: 42,
      au: 18,
      cn: 25
    },
    prices: {
      original: 320,
      current: 280,
      tiers: [
        { range: "1-5", price: 280, eu: 35, na: 40, au: 45, cn: 280 },
        { range: "6-20", price: 260, eu: 32, na: 38, au: 42, cn: 260 },
        { range: ">20", price: 240, eu: 30, na: 35, au: 40, cn: 240 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "mechanical",
    created_at: "2023-04-18T10:15:00Z",
    updated_at: "2023-10-05T09:30:00Z"
  },
  {
    id: "sp009",
    part_number: "BJT-SP-009",
    name_cn: "光电传感器",
    name_en: "Photoelectric Sensor",
    package_size: "10x8x5cm",
    package_size_imperial: "3.9x3.1x2in",
    package_weight: 0.15,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "NPN NO/NC, 10-30VDC, Detection Range: 2-30cm",
    spec: "NPN NO/NC, 10-30VDC, 检测范围: 2-30cm",
    image_url: "/images/spare-parts/photoelectric-sensor.jpg",
    status: "active",
    box_quantity: 20,
    inventory: {
      total: 180,
      eu: 45,
      na: 65,
      au: 25,
      cn: 45
    },
    prices: {
      original: 120,
      current: 105,
      tiers: [
        { range: "1-5", price: 105, eu: 14, na: 16, au: 18, cn: 105 },
        { range: "6-20", price: 95, eu: 12, na: 14, au: 16, cn: 95 },
        { range: ">20", price: 85, eu: 10, na: 12, au: 14, cn: 85 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "electronic",
    created_at: "2023-03-22T14:40:00Z",
    updated_at: "2023-10-12T16:20:00Z"
  },
  {
    id: "sp010",
    part_number: "BJT-SP-010",
    name_cn: "热敏打印头",
    name_en: "Thermal Print Head",
    package_size: "12x8x3cm",
    package_size_imperial: "4.7x3.1x1.2in",
    package_weight: 0.18,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "Resolution: 8 dots/mm, Width: 54mm, Lifespan: 50km",
    spec: "分辨率: 8点/毫米, 宽度: 54mm, 寿命: 50km",
    image_url: "/images/spare-parts/thermal-head.jpg",
    status: "active",
    box_quantity: 10,
    inventory: {
      total: 90,
      eu: 25,
      na: 30,
      au: 15,
      cn: 20
    },
    prices: {
      original: 420,
      current: 380,
      tiers: [
        { range: "1-5", price: 380, eu: 48, na: 52, au: 56, cn: 380 },
        { range: "6-20", price: 350, eu: 45, na: 48, au: 52, cn: 350 },
        { range: ">20", price: 320, eu: 42, na: 45, au: 48, cn: 320 }
      ]
    },
    product_type: "machine",
    is_consumable: true,
    type: "consumable",
    created_at: "2023-05-10T11:25:00Z",
    updated_at: "2023-10-18T13:40:00Z"
  },
  {
    id: "sp011",
    part_number: "BJT-SP-011",
    name_cn: "步进电机",
    name_en: "Stepper Motor",
    package_size: "18x15x10cm",
    package_size_imperial: "7.1x5.9x3.9in",
    package_weight: 0.95,
    app_model: "LP-V1, LP-F1",
    app_sn: "LP-V1-*, LP-F1-*",
    spec_imperial: "2-phase, 1.8°/step, 2.5A, 3.6V, Holding Torque: 1.8N·m",
    spec: "2相, 1.8°/步, 2.5A, 3.6V, 保持转矩: 1.8N·m",
    image_url: "/images/spare-parts/stepper-motor.jpg",
    status: "active",
    box_quantity: 8,
    inventory: {
      total: 75,
      eu: 20,
      na: 25,
      au: 10,
      cn: 20
    },
    prices: {
      original: 280,
      current: 250,
      tiers: [
        { range: "1-5", price: 250, eu: 32, na: 36, au: 40, cn: 250 },
        { range: "6-20", price: 230, eu: 30, na: 34, au: 38, cn: 230 },
        { range: ">20", price: 210, eu: 28, na: 32, au: 36, cn: 210 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "mechanical",
    created_at: "2023-04-15T09:20:00Z",
    updated_at: "2023-10-22T11:30:00Z"
  },
  {
    id: "sp012",
    part_number: "BJT-SP-012",
    name_cn: "热封条",
    name_en: "Heat Sealing Bar",
    package_size: "35x5x3cm",
    package_size_imperial: "13.8x2x1.2in",
    package_weight: 0.48,
    app_model: "LP-F1",
    app_sn: "LP-F1-*",
    spec_imperial: "Width: 2mm, 110V/220V compatible, Length: 30cm",
    spec: "宽度: 2mm, 110V/220V兼容, 长度: 30cm",
    image_url: "/images/spare-parts/sealing-bar.jpg",
    status: "active",
    box_quantity: 5,
    inventory: {
      total: 60,
      eu: 15,
      na: 20,
      au: 10,
      cn: 15
    },
    prices: {
      original: 180,
      current: 160,
      tiers: [
        { range: "1-5", price: 160, eu: 22, na: 26, au: 28, cn: 160 },
        { range: "6-20", price: 150, eu: 20, na: 24, au: 26, cn: 150 },
        { range: ">20", price: 140, eu: 18, na: 22, au: 24, cn: 140 }
      ]
    },
    product_type: "machine",
    is_consumable: true,
    type: "consumable",
    created_at: "2023-05-20T13:45:00Z",
    updated_at: "2023-10-25T15:15:00Z"
  },
  {
    id: "sp013",
    part_number: "BJT-SP-013",
    name_cn: "温控器",
    name_en: "Temperature Controller",
    package_size: "12x10x6cm",
    package_size_imperial: "4.7x3.9x2.4in",
    package_weight: 0.25,
    app_model: "LP-V1, LP-F1",
    app_sn: "LP-V1-*, LP-F1-*",
    spec_imperial: "PID Control, 100-240VAC, Range: 0-400°C, K-type TC",
    spec: "PID控制, 100-240VAC, 范围: 0-400°C, K型热电偶",
    image_url: "/images/spare-parts/temp-controller.jpg",
    status: "active",
    box_quantity: 10,
    inventory: {
      total: 85,
      eu: 20,
      na: 30,
      au: 15,
      cn: 20
    },
    prices: {
      original: 320,
      current: 290,
      tiers: [
        { range: "1-5", price: 290, eu: 38, na: 42, au: 45, cn: 290 },
        { range: "6-20", price: 270, eu: 35, na: 39, au: 42, cn: 270 },
        { range: ">20", price: 250, eu: 32, na: 36, au: 39, cn: 250 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "electronic",
    created_at: "2023-04-22T10:30:00Z",
    updated_at: "2023-10-30T12:45:00Z"
  },
  {
    id: "sp014",
    part_number: "BJT-SP-014",
    name_cn: "过滤器组件",
    name_en: "Filter Assembly",
    package_size: "20x15x10cm",
    package_size_imperial: "7.9x5.9x3.9in",
    package_weight: 0.65,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "Filtration: 5μm, Max Pressure: 1.0MPa, Flow Rate: 2000L/min",
    spec: "过滤精度: 5μm, 最大压力: 1.0MPa, 流量: 2000L/min",
    image_url: "/images/spare-parts/filter-assembly.jpg",
    status: "active",
    box_quantity: 6,
    inventory: {
      total: 95,
      eu: 25,
      na: 35,
      au: 15,
      cn: 20
    },
    prices: {
      original: 210,
      current: 190,
      tiers: [
        { range: "1-5", price: 190, eu: 25, na: 28, au: 30, cn: 190 },
        { range: "6-20", price: 175, eu: 23, na: 26, au: 28, cn: 175 },
        { range: ">20", price: 160, eu: 21, na: 24, au: 26, cn: 160 }
      ]
    },
    product_type: "machine",
    is_consumable: true,
    type: "consumable",
    created_at: "2023-05-15T11:35:00Z",
    updated_at: "2023-11-02T14:20:00Z"
  },
  {
    id: "sp015",
    part_number: "BJT-SP-015",
    name_cn: "触摸屏显示器",
    name_en: "Touch Screen Display",
    package_size: "25x20x8cm",
    package_size_imperial: "9.8x7.9x3.1in",
    package_weight: 0.75,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "7-inch, 800x480 Resolution, Capacitive Touch",
    spec: "7英寸, 800x480分辨率, 电容触摸",
    image_url: "/images/spare-parts/touch-screen.jpg",
    status: "active",
    box_quantity: 4,
    inventory: {
      total: 65,
      eu: 15,
      na: 25,
      au: 10,
      cn: 15
    },
    prices: {
      original: 580,
      current: 520,
      tiers: [
        { range: "1-5", price: 520, eu: 68, na: 75, au: 80, cn: 520 },
        { range: "6-20", price: 490, eu: 64, na: 70, au: 75, cn: 490 },
        { range: ">20", price: 460, eu: 60, na: 65, au: 70, cn: 460 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "electronic",
    created_at: "2023-04-18T14:25:00Z",
    updated_at: "2023-11-05T16:35:00Z"
  },
  {
    id: "sp016",
    part_number: "BJT-SP-016",
    name_cn: "压力传感器",
    name_en: "Pressure Sensor",
    package_size: "10x8x6cm",
    package_size_imperial: "3.9x3.1x2.4in",
    package_weight: 0.12,
    app_model: "LP-V1, LP-F1",
    app_sn: "LP-V1-*, LP-F1-*",
    spec_imperial: "Range: 0-1.6MPa, Output: 4-20mA, Accuracy: ±0.5%",
    spec: "量程: 0-1.6MPa, 输出: 4-20mA, 精度: ±0.5%",
    image_url: "/images/spare-parts/pressure-sensor.jpg",
    status: "active",
    box_quantity: 15,
    inventory: {
      total: 110,
      eu: 30,
      na: 40,
      au: 15,
      cn: 25
    },
    prices: {
      original: 180,
      current: 160,
      tiers: [
        { range: "1-5", price: 160, eu: 22, na: 24, au: 26, cn: 160 },
        { range: "6-20", price: 150, eu: 20, na: 22, au: 24, cn: 150 },
        { range: ">20", price: 140, eu: 18, na: 20, au: 22, cn: 140 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "electronic",
    created_at: "2023-05-05T09:50:00Z",
    updated_at: "2023-11-08T11:40:00Z"
  },
  {
    id: "sp017",
    part_number: "BJT-SP-017",
    name_cn: "风扇冷却组件",
    name_en: "Cooling Fan Assembly",
    package_size: "15x15x8cm",
    package_size_imperial: "5.9x5.9x3.1in",
    package_weight: 0.35,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "DC24V, 0.35A, 120x120x38mm, 3000RPM",
    spec: "DC24V, 0.35A, 120x120x38mm, 3000RPM",
    image_url: "/images/spare-parts/cooling-fan.jpg",
    status: "active",
    box_quantity: 10,
    inventory: {
      total: 130,
      eu: 35,
      na: 45,
      au: 20,
      cn: 30
    },
    prices: {
      original: 150,
      current: 130,
      tiers: [
        { range: "1-5", price: 130, eu: 18, na: 20, au: 22, cn: 130 },
        { range: "6-20", price: 120, eu: 16, na: 18, au: 20, cn: 120 },
        { range: ">20", price: 110, eu: 14, na: 16, au: 18, cn: 110 }
      ]
    },
    product_type: "machine",
    is_consumable: false,
    type: "mechanical",
    created_at: "2023-04-12T13:15:00Z",
    updated_at: "2023-11-10T15:25:00Z"
  },
  {
    id: "sp018",
    part_number: "BJT-SP-018",
    name_cn: "气管接头套件",
    name_en: "Pneumatic Fitting Kit",
    package_size: "20x15x10cm",
    package_size_imperial: "7.9x5.9x3.9in",
    package_weight: 0.48,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "Sizes: 4mm, 6mm, 8mm, Straight/Elbow/T-shape",
    spec: "规格: 4mm, 6mm, 8mm, 直通/弯头/三通",
    image_url: "/images/spare-parts/pneumatic-fittings.jpg",
    status: "active",
    box_quantity: 8,
    inventory: {
      total: 150,
      eu: 40,
      na: 50,
      au: 25,
      cn: 35
    },
    prices: {
      original: 120,
      current: 105,
      tiers: [
        { range: "1-5", price: 105, eu: 15, na: 16, au: 18, cn: 105 },
        { range: "6-20", price: 95, eu: 13, na: 14, au: 16, cn: 95 },
        { range: ">20", price: 85, eu: 11, na: 12, au: 14, cn: 85 }
      ]
    },
    product_type: "accessory",
    is_consumable: false,
    type: "mechanical",
    created_at: "2023-05-18T10:40:00Z",
    updated_at: "2023-11-12T12:50:00Z"
  },
  {
    id: "sp019",
    part_number: "BJT-SP-019",
    name_cn: "电源适配器",
    name_en: "Power Adapter",
    package_size: "18x12x8cm",
    package_size_imperial: "7.1x4.7x3.1in",
    package_weight: 0.65,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "Input: 100-240VAC, Output: 24VDC, 5A, 120W",
    spec: "输入: 100-240VAC, 输出: 24VDC, 5A, 120W",
    image_url: "/images/spare-parts/power-adapter.jpg",
    status: "active",
    box_quantity: 6,
    inventory: {
      total: 90,
      eu: 25,
      na: 30,
      au: 15,
      cn: 20
    },
    prices: {
      original: 250,
      current: 220,
      tiers: [
        { range: "1-5", price: 220, eu: 28, na: 32, au: 34, cn: 220 },
        { range: "6-20", price: 200, eu: 26, na: 30, au: 32, cn: 200 },
        { range: ">20", price: 180, eu: 24, na: 28, au: 30, cn: 180 }
      ]
    },
    product_type: "accessory",
    is_consumable: false,
    type: "electronic",
    created_at: "2023-04-25T11:55:00Z",
    updated_at: "2023-11-15T13:30:00Z"
  },
  {
    id: "sp020",
    part_number: "BJT-SP-020",
    name_cn: "维修工具套件",
    name_en: "Maintenance Tool Kit",
    package_size: "35x25x15cm",
    package_size_imperial: "13.8x9.8x5.9in",
    package_weight: 1.8,
    app_model: "LP-V1, LP-F1, LP-E4S",
    app_sn: "LP-V1-*, LP-F1-*, LP-E4S-*",
    spec_imperial: "Includes Screwdrivers, Hex Keys, Pliers, Cleaning Tools",
    spec: "包含螺丝刀、内六角扳手、钳子、清洁工具",
    image_url: "/images/spare-parts/tool-kit.jpg",
    status: "active",
    box_quantity: 4,
    inventory: {
      total: 60,
      eu: 15,
      na: 20,
      au: 10,
      cn: 15
    },
    prices: {
      original: 320,
      current: 280,
      tiers: [
        { range: "1-5", price: 280, eu: 36, na: 40, au: 42, cn: 280 },
        { range: "6-20", price: 260, eu: 34, na: 38, au: 40, cn: 260 },
        { range: ">20", price: 240, eu: 32, na: 36, au: 38, cn: 240 }
      ]
    },
    product_type: "accessory",
    is_consumable: false,
    type: "mechanical",
    created_at: "2023-05-10T15:20:00Z",
    updated_at: "2023-11-18T17:40:00Z"
  },
  {
    id: "sp021",
    part_number: "BJT-SP-021",
    name_cn: "高强度封口胶带",
    name_en: "Heavy-Duty Sealing Tape",
    package_size: "15x15x10cm",
    package_size_imperial: "5.9x5.9x3.9in",
    package_weight: 0.8,
    app_model: "LP-F1",
    app_sn: "LP-F1-*",
    spec_imperial: "Width: 48mm, Length: 50m/roll, 2 rolls/pack",
    spec: "宽度: 48mm, 长度: 50m/卷, 2卷/包",
    image_url: "/images/spare-parts/sealing-tape.jpg",
    status: "active",
    box_quantity: 10,
    inventory: {
      total: 200,
      eu: 50,
      na: 70,
      au: 30,
      cn: 50
    },
    prices: {
      original: 85,
      current: 75,
      tiers: [
        { range: "1-5", price: 75, eu: 10, na: 12, au: 14, cn: 75 },
        { range: "6-20", price: 70, eu: 9, na: 11, au: 13, cn: 70 },
        { range: ">20", price: 65, eu: 8, na: 10, au: 12, cn: 65 }
      ]
    },
    product_type: "accessory",
    is_consumable: true,
    type: "consumable",
    created_at: "2023-04-15T13:40:00Z",
    updated_at: "2023-11-20T14:50:00Z"
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
export async function getSparePartsFilterOptions(productType?: string): Promise<SparePartsFilterOptions> {
  try {
    // 实际应用中，应该通过API获取
    // 例如：const response = await axios.get(`${API_BASE_URL}/spare-parts/filters?product_type=${productType}`);
    
    // 模拟从数据库获取数据
    await new Promise(resolve => setTimeout(resolve, 300)); // 模拟API延迟
    
    // 模拟主机型号数据 (从 host_models 表中获取)
    const hostModels = ['LP-V1', 'LP-F1', 'LP-E4S', 'LP-D2', 'LP-A5'];
    
    // 模拟配件型号数据 (从 accessory_models 表中获取)
    const accessoryModels = ['FS-01', 'TS-01', 'MC-01', 'TP-02', 'TR-03', 'HP-01', 'HP-02'];
    
    // 定义备件类型
    const partTypes = [
      { id: 'consumable', name: '耗材' },
      { id: 'non-consumable', name: '非耗材' }
    ];
    
    return {
      hostModels,
      accessoryModels,
      partTypes
    };
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