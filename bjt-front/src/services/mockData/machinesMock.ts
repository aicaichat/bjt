// src/services/mockData/machinesMock.ts
import { MachineProduct, MachineAccessory } from '../../types/machines';

export const mockMachines: MachineProduct[] = [
  {
    id: "MEY-001",
    model: "MEY",
    name: "气垫机 Pro - MEY系列",
    subtitle: "高效气泡缓冲包装解决方案",
    image_url: "/images/shop/MEY.jpg",
    specs: {
      "电压": "220V/110V",
      "功率": "250W",
      "尺寸": "560 x 350 x 334 mm",
      "重量": "13.5 kg"
    },
    inventory: [
      {"region": "CN", "amount": 245},
      {"region": "EU", "amount": 78},
      {"region": "NA", "amount": 120},
      {"region": "AU", "amount": 46}
    ],
    prices: {
      base: 12800,
      tier1: 12000,
      tier2: 11500,
      vip: 11000
    }
  },
  {
    id: "MFA-002",
    model: "MFA",
    name: "纸垫机 标准版 - MFA系列",
    subtitle: "环保型纸质缓冲填充包装方案",
    image_url: "/images/shop/MFA.jpg",
    specs: {
      "电压": "220V/110V",
      "功率": "350W",
      "尺寸": "680 x 480 x 450 mm",
      "重量": "42 kg"
    },
    inventory: [
      {"region": "CN", "amount": 189},
      {"region": "EU", "amount": 56},
      {"region": "NA", "amount": 85},
      {"region": "AU", "amount": 29}
    ],
    prices: {
      base: 9800,
      tier1: 9200,
      tier2: 8800,
      vip: 8500
    }
  },
  {
    id: "TBY-003",
    model: "TBY",
    name: "水胶带机 - TBY系列",
    subtitle: "环保水激活胶带封箱系统",
    image_url: "/images/shop/TBY.jpg",
    specs: {
      "电压": "220V/110V",
      "功率": "150W",
      "尺寸": "340 x 280 x 230 mm",
      "重量": "9.8 kg"
    },
    inventory: [
      {"region": "CN", "amount": 156},
      {"region": "EU", "amount": 42},
      {"region": "NA", "amount": 68},
      {"region": "AU", "amount": 21}
    ],
    prices: {
      base: 5600,
      tier1: 5200,
      tier2: 4900,
      vip: 4700
    }
  }
];

// 一级配件
export const mockAccessories: MachineAccessory[] = [
  {
    id: "FS-001",
    model: "Floor Stand",
    title: "地面支架组件",
    level: 1,
    image_url: "/images/shop/FS-001.jpg",
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
        spec_imperial: "35.4×27.6×47.2inch, 17.2lbs",
        prices: {
          base: 85,
          tier1: 75,
          tier2: 65,
          vip: 55
        },
        inventory: [
          {"region": "CN", "amount": 156},
          {"region": "EU", "amount": 16},
          {"region": "NA", "amount": 24},
          {"region": "AU", "amount": 12}
        ]
      }
    ]
  },
  {
    id: "TS-001",
    model: "Table Stand",
    title: "桌面支架组件",
    level: 1,
    image_url: "/images/shop/TS-001.jpg",
    parts: [
      {
        id: "BJT-TS-V1-2024",
        part_number: "BJT-TS-V1-2024",
        title: "标准桌面支架",
        specs: {
          "电压": "N/A",
          "频率": "N/A",
          "托盘尺寸": "80×60×110cm",
          "一托数量": "20件"
        },
        spec: "80×60×110cm, 3.5kg",
        spec_imperial: "31.5×23.6×43.3inch, 7.7lbs",
        prices: {
          base: 75,
          tier1: 65,
          tier2: 55,
          vip: 50
        },
        inventory: [
          {"region": "CN", "amount": 180},
          {"region": "EU", "amount": 20},
          {"region": "NA", "amount": 30},
          {"region": "AU", "amount": 15}
        ]
      }
    ]
  },
  {
    id: "PH-001",
    model: "Print Head",
    title: "打印头组件",
    level: 1,
    image_url: "/images/shop/PH-001.jpg",
    parts: [
      {
        id: "BJT-PH-V1-2024",
        part_number: "BJT-PH-V1-2024",
        title: "标准打印头",
        specs: {
          "电压": "220V/110V",
          "频率": "50/60Hz",
          "托盘尺寸": "40×30×20cm",
          "一托数量": "50件"
        },
        spec: "40×30×20cm, 0.8kg",
        spec_imperial: "15.7×11.8×7.9inch, 1.8lbs",
        prices: {
          base: 120,
          tier1: 110,
          tier2: 100,
          vip: 90
        },
        inventory: [
          {"region": "CN", "amount": 220},
          {"region": "EU", "amount": 35},
          {"region": "NA", "amount": 42},
          {"region": "AU", "amount": 18}
        ]
      }
    ]
  }
];

// 二级配件 - 打印头的二级配件
export const mockLevel2Accessories: MachineAccessory[] = [
  {
    id: "PTR-001",
    model: "Printer Module",
    title: "打印模块",
    level: 2,
    image_url: "/images/shop/PTR-001.jpg",
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
    ]
  },
  {
    id: "SEN-001",
    model: "Sensor Unit",
    title: "传感器单元",
    level: 2,
    image_url: "/images/shop/SEN-001.jpg",
    parts: [
      {
        id: "BJT-SEN-V1-2024",
        part_number: "BJT-SEN-V1-2024",
        title: "光电传感器",
        specs: {
          "电压": "5V",
          "频率": "N/A",
          "托盘尺寸": "20×15×10cm",
          "一托数量": "200件"
        },
        spec: "20×15×10cm, 0.1kg",
        spec_imperial: "7.9×5.9×3.9inch, 0.2lbs",
        prices: {
          base: 45,
          tier1: 40,
          tier2: 35,
          vip: 30
        },
        inventory: [
          {"region": "CN", "amount": 250},
          {"region": "EU", "amount": 40},
          {"region": "NA", "amount": 45},
          {"region": "AU", "amount": 25}
        ]
      }
    ]
  }
];

// 三级配件 - 打印模块的三级配件
export const mockLevel3Accessories: MachineAccessory[] = [
  {
    id: "HD-001",
    model: "Print Head",
    title: "打印头核心",
    level: 3,
    image_url: "/images/shop/HD-001.jpg",
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
    ]
  },
  {
    id: "CTRL-001",
    model: "Controller",
    title: "控制电路板",
    level: 3,
    image_url: "/images/shop/CTRL-001.jpg",
    parts: [
      {
        id: "BJT-CTRL-V1-2024",
        part_number: "BJT-CTRL-V1-2024",
        title: "打印控制电路",
        specs: {
          "电压": "5V",
          "频率": "N/A",
          "托盘尺寸": "12×8×3cm",
          "一托数量": "800件"
        },
        spec: "12×8×3cm, 0.03kg",
        spec_imperial: "4.7×3.1×1.2inch, 0.07lbs",
        prices: {
          base: 28,
          tier1: 25,
          tier2: 22,
          vip: 20
        },
        inventory: [
          {"region": "CN", "amount": 400},
          {"region": "EU", "amount": 70},
          {"region": "NA", "amount": 80},
          {"region": "AU", "amount": 45}
        ]
      }
    ]
  }
];

// 四级配件 - 控制电路板的四级配件
export const mockLevel4Accessories: MachineAccessory[] = [
  {
    id: "MCU-001",
    model: "MCU Module",
    title: "微控制器模块",
    level: 4,
    image_url: "/images/shop/MCU-001.jpg",
    parts: [
      {
        id: "BJT-MCU-V1-2024",
        part_number: "BJT-MCU-V1-2024",
        title: "STM32微控制器",
        specs: {
          "电压": "3.3V",
          "频率": "72MHz",
          "托盘尺寸": "10×6×2cm",
          "一托数量": "1000件"
        },
        spec: "10×6×2cm, 0.01kg",
        spec_imperial: "3.9×2.4×0.8inch, 0.02lbs",
        prices: {
          base: 18,
          tier1: 16,
          tier2: 14,
          vip: 12
        },
        inventory: [
          {"region": "CN", "amount": 500},
          {"region": "EU", "amount": 100},
          {"region": "NA", "amount": 120},
          {"region": "AU", "amount": 60}
        ]
      }
    ]
  },
  {
    id: "PWR-001",
    model: "Power Circuit",
    title: "电源电路",
    level: 4,
    image_url: "/images/shop/PWR-001.jpg",
    parts: [
      {
        id: "BJT-PWR-V1-2024",
        part_number: "BJT-PWR-V1-2024",
        title: "稳压电源电路",
        specs: {
          "电压": "5V/3.3V",
          "频率": "N/A",
          "托盘尺寸": "8×5×1.5cm",
          "一托数量": "1200件"
        },
        spec: "8×5×1.5cm, 0.008kg",
        spec_imperial: "3.1×2.0×0.6inch, 0.018lbs",
        prices: {
          base: 12,
          tier1: 10,
          tier2: 9,
          vip: 8
        },
        inventory: [
          {"region": "CN", "amount": 600},
          {"region": "EU", "amount": 120},
          {"region": "NA", "amount": 140},
          {"region": "AU", "amount": 80}
        ]
      }
    ]
  }
];

// 五级配件 - 微控制器模块的五级配件
export const mockLevel5Accessories: MachineAccessory[] = [
  {
    id: "CPU-001",
    model: "CPU Core",
    title: "CPU核心",
    level: 5,
    image_url: "/images/shop/CPU-001.jpg",
    parts: [
      {
        id: "BJT-CPU-V1-2024",
        part_number: "BJT-CPU-V1-2024",
        title: "ARM Cortex-M3 CPU核心",
        specs: {
          "电压": "3.3V",
          "频率": "72MHz",
          "托盘尺寸": "5×3×1cm",
          "一托数量": "2000件"
        },
        spec: "5×3×1cm, 0.005kg",
        spec_imperial: "2.0×1.2×0.4inch, 0.011lbs",
        prices: {
          base: 8,
          tier1: 7,
          tier2: 6,
          vip: 5
        },
        inventory: [
          {"region": "CN", "amount": 800},
          {"region": "EU", "amount": 150},
          {"region": "NA", "amount": 180},
          {"region": "AU", "amount": 100}
        ]
      }
    ]
  },
  {
    id: "MEM-001",
    model: "Memory Module",
    title: "内存模块",
    level: 5,
    image_url: "/images/shop/MEM-001.jpg",
    parts: [
      {
        id: "BJT-MEM-V1-2024",
        part_number: "BJT-MEM-V1-2024",
        title: "Flash内存模块",
        specs: {
          "电压": "1.8V",
          "频率": "N/A",
          "托盘尺寸": "4×2.5×0.8cm",
          "一托数量": "3000件"
        },
        spec: "4×2.5×0.8cm, 0.003kg",
        spec_imperial: "1.6×1.0×0.3inch, 0.007lbs",
        prices: {
          base: 6,
          tier1: 5,
          tier2: 4.5,
          vip: 4
        },
        inventory: [
          {"region": "CN", "amount": 1000},
          {"region": "EU", "amount": 200},
          {"region": "NA", "amount": 220},
          {"region": "AU", "amount": 120}
        ]
      }
    ]
  }
];

// 修改machinesService.ts中的getMachineAccessories方法以支持多级配件
// 这部分需要在src/services/machinesService.ts中实现