import { MachineProduct, MachineAccessory, AccessoryPart } from '../types/machines';

// 定义PriceTier和Inventory接口用于旧数据兼容
interface PriceTier {
  range: string;
  price: number;
  eu?: number;
  na?: number;
  au?: number;
  cn?: number;
}

interface Inventory {
  total: number;
  eu: number;
  na: number;
  au: number;
  cn: number;
}

// 统一的价格格式转换函数
const convertPriceFormat = (prices: any): { base: number; tier1: number; tier2: number; vip: number } => {
  return {
    base: prices.current || prices.base,
    tier1: prices.tiers?.[0]?.price || prices.tier1,
    tier2: prices.tiers?.[1]?.price || prices.tier2,
    vip: prices.tiers?.[2]?.price || prices.vip
  };
};

// 统一的库存格式转换函数
const convertInventoryFormat = (inventory: Inventory): Array<{region: string, amount: number}> => {
  return [
    { region: 'EU', amount: inventory.eu },
    { region: 'NA', amount: inventory.na },
    { region: 'AU', amount: inventory.au },
    { region: 'CN', amount: inventory.cn }
  ];
};

// 转换机器数据格式
const convertToMachineProduct = (oldMachine: any): MachineProduct => {
  return {
    id: oldMachine.id,
    model: oldMachine.model || oldMachine.code,
    name: oldMachine.name,
    subtitle: oldMachine.type || '',
    description: oldMachine.spec || '',
    image_url: oldMachine.image_url,
    specs: {
      "电压": oldMachine.voltage || '',
      "频率": oldMachine.frequency || '',
      "尺寸": oldMachine.package_size || '',
      "重量": `${oldMachine.net_weight || 0} kg`
    },
    inventory: convertInventoryFormat(oldMachine.inventory),
    prices: convertPriceFormat(oldMachine.prices),
    features: []
  };
};

// 原始的机器数据
const originalMachines = [
  {
    id: '1',
    name: 'Industrial class air pillow machine',
    name_en: 'Industrial class air pillow machine',
    code: 'LA-E5P',
    part_number: '60A01153',
    model: 'LA-E5P',
    type: 'Air Pillow Machine',
    image_url: '/images/machines/la-e5p.jpg',
    product_type: 'machine',
    brand: 'Lockedair',
    voltage: '110V',
    frequency: '50Hz',
    spec: 'Industrial class air pillow machine',
    spec_imperial: 'Industrial class air pillow machine',
    package_size: '50.0x50.0x50.0',
    package_size_imperial: '20.0x20.0x20.0',
    net_weight: 19.1,
    net_weight_imperial: 42.0,
    gross_weight: 20.9,
    gross_weight_imperial: 46.0,
    box_quantity: 1,
    pallet_size: '1200x1200',
    pallet_size_imperial: '472x472',
    pallet_quantity: 10,
    pallet_height: 300,
    pallet_height_imperial: 118,
    pallet_gross_weight: 998,
    pallet_gross_weight_imperial: 2200,
    prices: {
      current: 1999.99,
      original: 2499.99,
      tiers: [
        { range: '1-2', price: 1999.99, eu: 1799.99, na: 2199.99, au: 2399.99, cn: 1599.99 },
        { range: '3-5', price: 1899.99, eu: 1699.99, na: 2099.99, au: 2299.99, cn: 1499.99 },
        { range: '>5', price: 1799.99, eu: 1599.99, na: 1999.99, au: 2199.99, cn: 1399.99 }
      ]
    },
    inventory: {
      total: 110,
      eu: 30,
      na: 20,
      au: 10,
      cn: 50
    }
  },
  {
    id: '2',
    name: 'Industria class bubble machine',
    name_en: 'Industria class bubble machine',
    code: 'LA-F2',
    part_number: '60A01131',
    model: 'LA-F2',
    type: 'Bubble Machine',
    image_url: '/images/machines/la-f2.jpg',
    product_type: 'machine',
    brand: 'Lockedair',
    voltage: '110V',
    frequency: '50Hz',
    spec: 'Industria class bubble machine',
    spec_imperial: 'Industria class bubble machine',
    package_size: '80.0x80.0x80.0',
    package_size_imperial: '31.0x31.0x31.0',
    net_weight: 22.0,
    net_weight_imperial: 48.4,
    gross_weight: 22.7,
    gross_weight_imperial: 50.0,
    box_quantity: 1,
    pallet_size: '1200x1200',
    pallet_size_imperial: '472x472',
    pallet_quantity: 10,
    pallet_height: 300,
    pallet_height_imperial: 118,
    pallet_gross_weight: 998,
    pallet_gross_weight_imperial: 2200,
    prices: {
      current: 1799.99,
      original: 2299.99,
      tiers: [
        { range: '1-2', price: 1799.99, eu: 1599.99, na: 1999.99, au: 2199.99, cn: 1399.99 },
        { range: '3-5', price: 1699.99, eu: 1499.99, na: 1899.99, au: 2099.99, cn: 1299.99 },
        { range: '>5', price: 1599.99, eu: 1399.99, na: 1799.99, au: 1999.99, cn: 1199.99 }
      ]
    },
    inventory: {
      total: 95,
      eu: 25,
      na: 15,
      au: 8,
      cn: 47
    }
  },
  {
    id: '3',
    name: 'Starter class air cushion machine',
    name_en: 'Starter class air cushion machine',
    code: 'LA-E4C',
    part_number: '60A01113',
    model: 'LA-E4C',
    type: 'Air Cushion Machine',
    image_url: '/images/machines/la-e4c.jpg',
    product_type: 'machine',
    brand: 'Lockedair',
    voltage: '110V',
    frequency: '50Hz',
    spec: 'Starter class air cushion machine',
    spec_imperial: 'Starter class air cushion machine',
    package_size: '38.0x38.0x38.0',
    package_size_imperial: '15.0x15.0x15.0',
    net_weight: 9.1,
    net_weight_imperial: 20.0,
    gross_weight: 10.0,
    gross_weight_imperial: 22.0,
    box_quantity: 1,
    pallet_size: '1200x1200',
    pallet_size_imperial: '472x472',
    pallet_quantity: 10,
    pallet_height: 250,
    pallet_height_imperial: 98,
    pallet_gross_weight: 998,
    pallet_gross_weight_imperial: 2200,
    prices: {
      current: 999.99,
      original: 1299.99,
      tiers: [
        { range: '1-2', price: 999.99, eu: 899.99, na: 1099.99, au: 1199.99, cn: 799.99 },
        { range: '3-5', price: 899.99, eu: 799.99, na: 999.99, au: 1099.99, cn: 699.99 },
        { range: '>5', price: 799.99, eu: 699.99, na: 899.99, au: 999.99, cn: 599.99 }
      ]
    },
    inventory: {
      total: 145,
      eu: 40,
      na: 30,
      au: 15,
      cn: 60
    }
  }
];

// 原始的配件数据
const originalAccessories = [
  {
    id: 'acc-001',
    name: '标准电源线',
    name_en: 'Standard Power Cord',
    code: 'PWR-001',
    part_number: 'PWR-001',
    model: 'PWR-001',
    type: 'power_cord',
    image_url: '/images/accessories/power-cord.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: '220V',
    frequency: '50Hz',
    spec: '2.5m',
    spec_imperial: '8.2ft',
    package_size: '30x20x5cm',
    package_size_imperial: '11.8x7.9x2in',
    net_weight: 0.5,
    net_weight_imperial: 1.1,
    gross_weight: 0.6,
    gross_weight_imperial: 1.3,
    box_quantity: 20,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 400,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 240,
    pallet_gross_weight_imperial: 529,
    prices: {
      current: 15.99,
      original: 19.99,
      tiers: [
        { range: '1-9', price: 15.99 },
        { range: '10-49', price: 14.99 },
        { range: '50-99', price: 13.99 },
        { range: '100+', price: 12.99 }
      ]
    },
    inventory: {
      total: 1000,
      eu: 300,
      na: 300,
      au: 200,
      cn: 200
    }
  },
  {
    id: 'acc-002',
    name: '延长电源线',
    name_en: 'Extension Power Cord',
    code: 'PWR-002',
    part_number: 'PWR-002',
    model: 'PWR-002',
    type: 'power_cord',
    image_url: '/images/accessories/extension-cord.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: '220V',
    frequency: '50Hz',
    spec: '5m',
    spec_imperial: '16.4ft',
    package_size: '35x25x5cm',
    package_size_imperial: '13.8x9.8x2in',
    net_weight: 0.8,
    net_weight_imperial: 1.8,
    gross_weight: 0.9,
    gross_weight_imperial: 2,
    box_quantity: 15,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 300,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 270,
    pallet_gross_weight_imperial: 595,
    prices: {
      current: 24.99,
      original: 29.99,
      tiers: [
        { range: '1-9', price: 24.99 },
        { range: '10-49', price: 23.99 },
        { range: '50-99', price: 22.99 },
        { range: '100+', price: 21.99 }
      ]
    },
    inventory: {
      total: 800,
      eu: 250,
      na: 250,
      au: 150,
      cn: 150
    }
  },
  // 添加更多一级配件数据
  {
    id: 'acc-003',
    name: '气泡膜卷',
    name_en: 'Bubble Film Roll',
    code: 'BFR-001',
    part_number: 'BFR-001',
    model: 'BFR-001',
    type: 'film_roll',
    image_url: '/images/accessories/bubble-film.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    spec: '200m × 30cm',
    spec_imperial: '656ft × 12in',
    package_size: '35x35x30cm',
    package_size_imperial: '13.8x13.8x11.8in',
    net_weight: 5.0,
    net_weight_imperial: 11.0,
    prices: {
      current: 49.99,
      original: 59.99,
      tiers: [
        { range: '1-5', price: 49.99 },
        { range: '6-10', price: 45.99 },
        { range: '11+', price: 42.99 }
      ]
    },
    inventory: {
      total: 500,
      eu: 150,
      na: 150,
      au: 100,
      cn: 100
    }
  },
  {
    id: 'acc-004',
    name: '控制面板模块',
    name_en: 'Control Panel Module',
    code: 'CPM-001',
    part_number: 'CPM-001',
    model: 'CPM-001',
    type: 'control_module',
    image_url: '/images/accessories/control-panel.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: '12V',
    spec: '15cm × 10cm × 3cm',
    spec_imperial: '5.9in × 3.9in × 1.2in',
    package_size: '20x15x5cm',
    net_weight: 0.35,
    prices: {
      current: 79.99,
      original: 99.99,
      tiers: [
        { range: '1-3', price: 79.99 },
        { range: '4-6', price: 74.99 },
        { range: '7+', price: 69.99 }
      ]
    },
    inventory: {
      total: 300,
      eu: 75,
      na: 75,
      au: 75,
      cn: 75
    }
  }
];

// 转换配件为配件部件
const convertToAccessoryParts = (oldAccessory: any): AccessoryPart => {
  return {
    id: oldAccessory.id,
    part_number: oldAccessory.part_number,
    title: oldAccessory.name,
    specs: {
      "电压": oldAccessory.voltage || '',
      "频率": oldAccessory.frequency || '',
      "规格": oldAccessory.spec || '',
      "尺寸": oldAccessory.package_size || '',
      "重量": `${oldAccessory.net_weight || 0} kg`
    },
    spec: oldAccessory.spec || '',
    spec_imperial: oldAccessory.spec_imperial || '',
    prices: convertPriceFormat(oldAccessory.prices),
    inventory: convertInventoryFormat(oldAccessory.inventory || {
      total: 100,
      eu: 25,
      na: 25,
      au: 25,
      cn: 25
    })
  };
};

// 将配件分组为机器配件
const groupAccessoriesByType = (accessories: any[]): MachineAccessory[] => {
  const types = [...new Set(accessories.map(acc => acc.type))];
  
  return types.map((type, index) => {
    const typeAccessories = accessories.filter(acc => acc.type === type);
    
    return {
      id: `type-${index + 1}`,
      model: type,
      title: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      level: 1,
      image_url: typeAccessories[0]?.image_url || '',
      parts: typeAccessories.map(acc => convertToAccessoryParts(acc)),
      compatible_machines: ['1', '2', '3'] // 示例兼容机器
    };
  });
};

// 从原始数据生成符合类型的数据
export const mockMachines: MachineProduct[] = originalMachines.map(machine => convertToMachineProduct(machine));

// 生成一级配件数据
export const mockAccessories: MachineAccessory[] = groupAccessoriesByType(originalAccessories);

// 确保mockAccessories有足够的配件
const level1AccessoryIds = mockAccessories.map(acc => acc.id);

// 创建二级配件数据
export const mockLevel2Accessories: MachineAccessory[] = [
  {
    id: "PTR-001",
    model: "Printer Module",
    title: "打印模块",
    level: 2,
    image_url: "/images/accessories/printer-module.jpg",
    parts: [
      {
        id: "BJT-PTR-V1-2024",
        part_number: "BJT-PTR-V1-2024",
        title: "热敏打印模块",
        specs: {
          "电压": "220V/110V",
          "频率": "50/60Hz",
          "托盘尺寸": "30×25×15cm",
          "一托数量": "100件"
        },
        spec: "30×25×15cm, 0.5kg",
        spec_imperial: "11.8×9.8×5.9inch, 1.1lbs",
        prices: {
          base: 85,
          tier1: 80,
          tier2: 75,
          vip: 70
        },
        inventory: [
          {"region": "CN", "amount": 180},
          {"region": "EU", "amount": 25},
          {"region": "NA", "amount": 32},
          {"region": "AU", "amount": 15}
        ]
      }
    ],
    parent_id: level1AccessoryIds[0] // 连接到第一个一级配件
  },
  {
    id: "FILTER-001",
    model: "Air Filter",
    title: "空气过滤器",
    level: 2,
    image_url: "/images/accessories/air-filter.jpg",
    parts: [
      {
        id: "BJT-FLT-V1-2024",
        part_number: "BJT-FLT-V1-2024",
        title: "高效空气过滤器",
        specs: {
          "滤芯尺寸": "15×10×3cm",
          "过滤等级": "HEPA H13",
          "一托数量": "200件"
        },
        spec: "15×10×3cm, 0.2kg",
        spec_imperial: "5.9×3.9×1.2inch, 0.44lbs",
        prices: {
          base: 45,
          tier1: 40,
          tier2: 35,
          vip: 30
        },
        inventory: [
          {"region": "CN", "amount": 250},
          {"region": "EU", "amount": 50},
          {"region": "NA", "amount": 50},
          {"region": "AU", "amount": 30}
        ]
      }
    ],
    parent_id: level1AccessoryIds[0] // 连接到第一个一级配件
  },
  {
    id: "CABLE-001",
    model: "Connection Cable",
    title: "连接线组",
    level: 2,
    image_url: "/images/accessories/connection-cable.jpg",
    parts: [
      {
        id: "BJT-CBL-V1-2024",
        part_number: "BJT-CBL-V1-2024",
        title: "数据连接线组",
        specs: {
          "长度": "1.5m",
          "接口类型": "USB-C/DB9",
          "一托数量": "500件"
        },
        spec: "1.5m, 0.1kg",
        spec_imperial: "4.9ft, 0.22lbs",
        prices: {
          base: 25,
          tier1: 22,
          tier2: 20,
          vip: 18
        },
        inventory: [
          {"region": "CN", "amount": 300},
          {"region": "EU", "amount": 100},
          {"region": "NA", "amount": 100},
          {"region": "AU", "amount": 50}
        ]
      }
    ],
    parent_id: level1AccessoryIds[1] // 连接到第二个一级配件
  }
];

// 确保二级配件有ID
const level2AccessoryIds = mockLevel2Accessories.map(acc => acc.id);

// 创建三级配件数据
export const mockLevel3Accessories: MachineAccessory[] = [
  {
    id: "HD-001",
    model: "Print Head",
    title: "打印头核心",
    level: 3,
    image_url: "/images/accessories/print-head.jpg",
    parts: [
      {
        id: "BJT-HD-V1-2024",
        part_number: "BJT-HD-V1-2024",
        title: "热敏打印头核心",
        specs: {
          "电压": "24V",
          "频率": "N/A",
          "托盘尺寸": "15×10×5cm",
          "一托数量": "500件"
        },
        spec: "15×10×5cm, 0.05kg",
        spec_imperial: "5.9×3.9×2.0inch, 0.11lbs",
        prices: {
          base: 35,
          tier1: 30,
          tier2: 25,
          vip: 22
        },
        inventory: [
          {"region": "CN", "amount": 350},
          {"region": "EU", "amount": 60},
          {"region": "NA", "amount": 70},
          {"region": "AU", "amount": 40}
        ]
      }
    ],
    parent_id: level2AccessoryIds[0] // 连接到第一个二级配件
  },
  {
    id: "CTRL-001",
    model: "Control Board",
    title: "控制板",
    level: 3,
    image_url: "/images/accessories/control-board.jpg",
    parts: [
      {
        id: "BJT-CTRL-V1-2024",
        part_number: "BJT-CTRL-V1-2024",
        title: "打印控制板",
        specs: {
          "电压": "5V",
          "接口": "USB/SPI/I2C",
          "托盘尺寸": "15×10×5cm",
          "一托数量": "300件"
        },
        spec: "10×8×2cm, 0.05kg",
        spec_imperial: "3.9×3.1×0.8inch, 0.11lbs",
        prices: {
          base: 45,
          tier1: 40,
          tier2: 35,
          vip: 30
        },
        inventory: [
          {"region": "CN", "amount": 250},
          {"region": "EU", "amount": 40},
          {"region": "NA", "amount": 40},
          {"region": "AU", "amount": 20}
        ]
      }
    ],
    parent_id: level2AccessoryIds[0] // 连接到第一个二级配件
  }
];

// 确保三级配件有ID
const level3AccessoryIds = mockLevel3Accessories.map(acc => acc.id);

// 创建四级配件数据
export const mockLevel4Accessories: MachineAccessory[] = [
  {
    id: "CHIP-001",
    model: "Print Controller Chip",
    title: "打印控制芯片",
    level: 4,
    image_url: "/images/accessories/controller-chip.jpg",
    parts: [
      {
        id: "BJT-CHIP-V1-2024",
        part_number: "BJT-CHIP-V1-2024",
        title: "温度控制芯片",
        specs: {
          "工作电压": "3.3V",
          "封装类型": "SOIC-8",
          "一托数量": "1000件"
        },
        spec: "5mm×5mm, 0.001kg",
        spec_imperial: "0.2in×0.2in, 0.002lbs",
        prices: {
          base: 15,
          tier1: 12,
          tier2: 10,
          vip: 8
        },
        inventory: [
          {"region": "CN", "amount": 1000},
          {"region": "EU", "amount": 200},
          {"region": "NA", "amount": 200},
          {"region": "AU", "amount": 100}
        ]
      }
    ],
    parent_id: level3AccessoryIds[0] // 连接到第一个三级配件
  }
];

// 确保四级配件有ID
const level4AccessoryIds = mockLevel4Accessories.map(acc => acc.id);

// 创建五级配件数据
export const mockLevel5Accessories: MachineAccessory[] = [
  {
    id: "FIRMWARE-001",
    model: "Firmware Package",
    title: "固件包",
    level: 5,
    image_url: "/images/accessories/firmware.jpg",
    parts: [
      {
        id: "BJT-FW-V1-2024",
        part_number: "BJT-FW-V1-2024",
        title: "温控芯片固件包",
        specs: {
          "版本": "v1.2.5",
          "兼容性": "所有BJT-CHIP系列",
          "更新日期": "2024-01-15"
        },
        spec: "数字下载, 0kg",
        spec_imperial: "Digital download, 0lbs",
        prices: {
          base: 10,
          tier1: 8,
          tier2: 6,
          vip: 5
        },
        inventory: [
          {"region": "CN", "amount": 9999},
          {"region": "EU", "amount": 9999},
          {"region": "NA", "amount": 9999},
          {"region": "AU", "amount": 9999}
        ]
      }
    ],
    parent_id: level4AccessoryIds[0] // 连接到第一个四级配件
  }
];

// 添加备件数据
export const mockSpareParts = [
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
    prices: {
      base: 39.99,
      tier1: 36.99,
      tier2: 34.99,
      vip: 29.99
    }
  }
];

// 导出所有关联关系数据
export default {
  mockMachines,
  mockAccessories,
  mockLevel2Accessories,
  mockLevel3Accessories,
  mockLevel4Accessories,
  mockLevel5Accessories,
  mockSpareParts
}; 