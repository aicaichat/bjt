import { SparePart } from '../api/sparePartsApi';

// 创建符合SparePart接口的模拟数据
export const sparePartsMock: SparePart[] = [
  {
    id: 'SP001',
    name: 'Ceramic Blade',
    name_en: 'Ceramic Blade',
    code: '07A0105325',
    part_number: '07A0105325',
    description: '高品质陶瓷刀片，适用于LA-E4S气垫机',
    description_en: 'High quality ceramic blade for LA-E4S air pillow machine',
    type: 'consumable',
    is_consumable: 'Y',
    image_url: '/images/spare-parts/07A0105325.jpg',
    product_type: 'machine',
    app_model: ['LA-E4S'],
    app_sn: 'All',
    package_size: '10.0×5.0×2.0',
    package_size_imperial: '3.94×1.97×0.79',
    package_weight: 0.15,
    net_weight: 0.1,
    net_weight_imperial: 0.22,
    gross_weight: 0.15,
    gross_weight_imperial: 0.33,
    box_quantity: 1,
    spec: '陶瓷材质，耐磨损，使用寿命长',
    specs: {
      material: '陶瓷',
      type: '刀片',
      compatibility: 'LA-E4S'
    },
    category: 'blade',
    compatibility: ['LA-E4S'],
    prices: {
      currency: 'CNY',
      original_price: 120,
      current_price: 100,
      discount: 0.83,
      tiers: [
        { 
          quantity: 1, 
          price: 120
        },
        { 
          quantity: 6, 
          price: 110
        },
        { 
          quantity: 20, 
          price: 100
        }
      ]
    },
    inventory: {
      eu: 30,
      na: 40,
      au: 20,
      cn: 60
    },
    status: 'in_stock',
    replacement_interval: '500小时或3个月',
    warranty_period: '3个月'
  },
  {
    id: 'SP002',
    name: 'Upper Heating Module',
    name_en: 'Upper Heating Module',
    code: '14A01143',
    part_number: '14A01143',
    description: '气垫机上加热模块组件，适用于LA-E4C和LA-E4S型号',
    description_en: 'Upper heating module assembly for LA-E4C and LA-E4S air pillow machines',
    type: 'consumable',
    is_consumable: 'Y',
    image_url: '/images/spare-parts/14A01143.jpg',
    product_type: 'machine',
    app_model: ['LA-E4C', 'LA-E4S'],
    app_sn: 'All',
    package_size: '15.0×10.0×5.0',
    package_size_imperial: '5.91×3.94×1.97',
    package_weight: 0.45,
    net_weight: 0.38,
    net_weight_imperial: 0.84,
    gross_weight: 0.45,
    gross_weight_imperial: 0.99,
    box_quantity: 1,
    spec: '包含加热元件和温控组件',
    specs: {
      material: '金属/塑料',
      type: '加热模块',
      compatibility: 'LA-E4C, LA-E4S'
    },
    category: 'heating',
    compatibility: ['LA-E4C', 'LA-E4S'],
    prices: {
      currency: 'CNY',
      original_price: 350,
      current_price: 310,
      discount: 0.89,
      tiers: [
        { 
          quantity: 1, 
          price: 350
        },
        { 
          quantity: 4, 
          price: 330
        },
        { 
          quantity: 10, 
          price: 310
        }
      ]
    },
    inventory: {
      eu: 20,
      na: 25,
      au: 10,
      cn: 30
    },
    status: 'in_stock',
    replacement_interval: '1000小时或6个月',
    warranty_period: '6个月'
  },
  {
    id: 'SP003',
    name: 'Seamless Teflon Ring Belt',
    name_en: 'Seamless Teflon Ring Belt',
    code: '07A0101019',
    part_number: '07A0101019',
    description: '高耐热无缝特氟龙传动环带',
    description_en: 'High temperature resistant seamless Teflon ring belt',
    type: 'consumable',
    is_consumable: 'Y',
    image_url: '/images/spare-parts/07A0101019.jpg',
    product_type: 'machine',
    app_model: ['LA-E4C', 'LA-E4S'],
    app_sn: 'All',
    package_size: '12.0×12.0×2.0',
    package_size_imperial: '4.72×4.72×0.79',
    package_weight: 0.2,
    net_weight: 0.15,
    net_weight_imperial: 0.33,
    gross_weight: 0.2,
    gross_weight_imperial: 0.44,
    box_quantity: 1,
    spec: '特氟龙材质，耐高温，无接缝设计',
    specs: {
      material: '特氟龙',
      type: '传动带',
      compatibility: 'LA-E4C, LA-E4S'
    },
    category: 'belt',
    compatibility: ['LA-E4C', 'LA-E4S'],
    prices: {
      currency: 'CNY',
      original_price: 180,
      current_price: 150,
      discount: 0.83,
      tiers: [
        { 
          quantity: 1, 
          price: 180
        },
        { 
          quantity: 6, 
          price: 165
        },
        { 
          quantity: 15, 
          price: 150
        }
      ]
    },
    inventory: {
      eu: 25,
      na: 35,
      au: 15,
      cn: 45
    },
    status: 'in_stock',
    replacement_interval: '800小时或4个月',
    warranty_period: '3个月'
  },
  {
    id: 'SP004',
    name: 'Blower WS9290',
    name_en: 'Blower WS9290',
    code: '08A0105449',
    part_number: '08A0105449',
    description: 'WS9290型号鼓风机，用于LA-E4S气垫机',
    description_en: 'WS9290 model blower for LA-E4S air pillow machine',
    type: 'electronic',
    is_consumable: 'N',
    image_url: '/images/spare-parts/08A0105449.jpg',
    product_type: 'machine',
    app_model: ['LA-E4S'],
    app_sn: 'All',
    package_size: '18.0×12.0×8.0',
    package_size_imperial: '7.09×4.72×3.15',
    package_weight: 0.8,
    net_weight: 0.65,
    net_weight_imperial: 1.43,
    gross_weight: 0.8,
    gross_weight_imperial: 1.76,
    box_quantity: 1,
    spec: '低噪音设计，长寿命轴承',
    specs: {
      material: '金属/塑料',
      type: '鼓风机',
      compatibility: 'LA-E4S'
    },
    category: 'electrical',
    compatibility: ['LA-E4S'],
    prices: {
      currency: 'CNY',
      original_price: 420,
      current_price: 380,
      discount: 0.90,
      tiers: [
        { 
          quantity: 1, 
          price: 420
        },
        { 
          quantity: 3, 
          price: 400
        },
        { 
          quantity: 5, 
          price: 380
        }
      ]
    },
    inventory: {
      eu: 15,
      na: 20,
      au: 10,
      cn: 20
    },
    status: 'in_stock',
    replacement_interval: '3000小时或2年',
    warranty_period: '1年'
  },
  {
    id: 'SP005',
    name: 'Power Supply',
    name_en: 'Power Supply',
    code: '08A0105127',
    part_number: '08A0105127',
    description: 'LA-E4S气垫机专用电源模块',
    description_en: 'Power supply module for LA-E4S air pillow machine',
    type: 'electronic',
    is_consumable: 'N',
    image_url: '/images/spare-parts/08A0105127.jpg',
    product_type: 'machine',
    app_model: ['LA-E4S'],
    app_sn: 'All',
    package_size: '20.0×15.0×10.0',
    package_size_imperial: '7.87×5.91×3.94',
    package_weight: 1.2,
    net_weight: 0.95,
    net_weight_imperial: 2.09,
    gross_weight: 1.2,
    gross_weight_imperial: 2.65,
    box_quantity: 1,
    spec: '输入电压: 100-240V AC, 输出电压: 24V DC',
    specs: {
      material: '金属/塑料',
      type: '电源',
      compatibility: 'LA-E4S'
    },
    category: 'electrical',
    compatibility: ['LA-E4S'],
    prices: {
      currency: 'CNY',
      original_price: 580,
      current_price: 520,
      discount: 0.90,
      tiers: [
        { 
          quantity: 1, 
          price: 580
        },
        { 
          quantity: 3, 
          price: 550
        },
        { 
          quantity: 5, 
          price: 520
        }
      ]
    },
    inventory: {
      eu: 12,
      na: 18,
      au: 8,
      cn: 17
    },
    status: 'in_stock',
    replacement_interval: '5000小时或3年',
    warranty_period: '1年'
  },
  {
    id: 'SP-A001',
    name: '进料导向系统',
    name_en: 'Feeding Guide System',
    code: 'ACC-FGS-001',
    part_number: 'ACC-FGS-001',
    description: '标准型进料导向系统，提高膜卷进料稳定性',
    description_en: 'Standard feeding guide system to enhance film roll feeding stability',
    type: 'electronic',
    image_url: '/images/spare-parts/ACC-FGS-001.jpg',
    product_type: 'accessory',
    app_model: ['Standard'],
    app_sn: 'All',
    package_size: '25.0×15.0×10.0',
    package_size_imperial: '9.84×5.91×3.94',
    package_weight: 1.2,
    box_quantity: 1,
    spec: '标准型号，适用于各种标准气垫机型号',
    specs: {
      material: '铝合金/不锈钢',
      type: '进料系统',
      compatibility: '标准型气垫机'
    },
    category: 'feeding',
    compatibility: ['LA-E4S', 'LA-E5P'],
    prices: {
      base: 280,
      tier1: 260,
      tier2: 240,
      vip: 220,
      tiers: [
        { 
          range: '1-2', 
          price: 280,
          eu: 300,
          na: 305,
          au: 315,
          cn: 280
        },
        { 
          range: '3-5', 
          price: 260,
          eu: 280,
          na: 285,
          au: 295,
          cn: 260
        },
        { 
          range: '>5', 
          price: 240,
          eu: 260,
          na: 265,
          au: 275,
          cn: 240
        }
      ]
    },
    inventory: {
      total: 80,
      eu: 15,
      na: 20,
      au: 10,
      cn: 35
    },
    status: 'in_stock',
    warranty_period: '12个月'
  },
  {
    id: 'SP-A002',
    name: '高级进料导向系统',
    name_en: 'Premium Feeding Guide System',
    code: 'ACC-FGS-002',
    part_number: 'ACC-FGS-002',
    description: '高级型进料导向系统，带有自动张力调节功能',
    description_en: 'Premium feeding guide system with automatic tension adjustment',
    type: 'electronic',
    image_url: '/images/spare-parts/ACC-FGS-002.jpg',
    product_type: 'accessory',
    app_model: ['Premium'],
    app_sn: 'All',
    package_size: '28.0×18.0×12.0',
    package_size_imperial: '11.02×7.09×4.72',
    package_weight: 1.5,
    box_quantity: 1,
    spec: '高级型号，带自动张力调节功能',
    specs: {
      material: '铝合金/不锈钢/电子元件',
      type: '进料系统',
      compatibility: '中高端气垫机'
    },
    category: 'feeding',
    compatibility: ['LA-E5P', 'LA-E6P'],
    prices: {
      base: 380,
      tier1: 350,
      tier2: 320,
      vip: 300,
      tiers: [
        { 
          range: '1-2', 
          price: 380,
          eu: 400,
          na: 405,
          au: 415,
          cn: 380
        },
        { 
          range: '3-5', 
          price: 350,
          eu: 370,
          na: 375,
          au: 385,
          cn: 350
        },
        { 
          range: '>5', 
          price: 320,
          eu: 340,
          na: 345,
          au: 355,
          cn: 320
        }
      ]
    },
    inventory: {
      total: 60,
      eu: 12,
      na: 15,
      au: 8,
      cn: 25
    },
    status: 'in_stock',
    warranty_period: '12个月'
  },
  {
    id: 'SP-A003',
    name: '专业放膜架',
    name_en: 'Professional Film Stand',
    code: 'ACC-PFS-001',
    part_number: 'ACC-PFS-001',
    description: '专业级电动放膜架，支持多卷膜同时安装',
    description_en: 'Professional electric film stand supporting multiple film rolls',
    type: 'mechanical',
    image_url: '/images/spare-parts/ACC-PFS-001.jpg',
    product_type: 'accessory',
    app_model: ['Professional'],
    app_sn: 'All',
    package_size: '50.0×40.0×20.0',
    package_size_imperial: '19.69×15.75×7.87',
    package_weight: 8.5,
    box_quantity: 1,
    spec: '专业型号，电动控制，可同时安装2-3卷膜',
    specs: {
      material: '不锈钢/铝合金/电机',
      type: '放膜架',
      compatibility: '专业型气垫机'
    },
    category: 'stand',
    compatibility: ['LA-E6P', 'LA-E7P'],
    prices: {
      base: 680,
      tier1: 630,
      tier2: 580,
      vip: 550,
      tiers: [
        { 
          range: '1', 
          price: 680,
          eu: 720,
          na: 730,
          au: 750,
          cn: 680
        },
        { 
          range: '2-3', 
          price: 630,
          eu: 670,
          na: 680,
          au: 700,
          cn: 630
        },
        { 
          range: '>3', 
          price: 580,
          eu: 620,
          na: 630,
          au: 650,
          cn: 580
        }
      ]
    },
    inventory: {
      total: 40,
      eu: 8,
      na: 10,
      au: 5,
      cn: 17
    },
    status: 'in_stock',
    warranty_period: '18个月'
  },
  {
    id: 'SP-A004',
    name: '标准膜卷切换装置',
    name_en: 'Standard Film Roll Switcher',
    code: 'ACC-FRS-001',
    part_number: 'ACC-FRS-001',
    description: '标准型手动膜卷切换装置，适用于标准配置机器',
    description_en: 'Standard manual film roll switcher for standard machines',
    type: 'mechanical',
    image_url: '/images/spare-parts/ACC-FRS-001.jpg',
    product_type: 'accessory',
    app_model: ['Standard'],
    app_sn: 'All',
    package_size: '30.0×20.0×15.0',
    package_size_imperial: '11.81×7.87×5.91',
    package_weight: 2.2,
    box_quantity: 1,
    spec: '手动操作，简单可靠',
    specs: {
      material: '不锈钢/铝合金',
      type: '膜卷切换器',
      compatibility: '标准型气垫机'
    },
    category: 'switcher',
    compatibility: ['LA-E4S', 'LA-E5P'],
    prices: {
      base: 220,
      tier1: 200,
      tier2: 180,
      vip: 160,
      tiers: [
        { 
          range: '1-2', 
          price: 220,
          eu: 240,
          na: 245,
          au: 255,
          cn: 220
        },
        { 
          range: '3-5', 
          price: 200,
          eu: 220,
          na: 225,
          au: 235,
          cn: 200
        },
        { 
          range: '>5', 
          price: 180,
          eu: 200,
          na: 205,
          au: 215,
          cn: 180
        }
      ]
    },
    inventory: {
      total: 70,
      eu: 15,
      na: 18,
      au: 12,
      cn: 25
    },
    status: 'in_stock',
    warranty_period: '12个月'
  },
  {
    id: 'SP-A005',
    name: '高级自动膜卷切换器',
    name_en: 'Premium Auto Film Roll Switcher',
    code: 'ACC-FRS-002',
    part_number: 'ACC-FRS-002',
    description: '高级型自动膜卷切换装置，带有传感器检测',
    description_en: 'Premium automatic film roll switcher with sensor detection',
    type: 'electronic',
    image_url: '/images/spare-parts/ACC-FRS-002.jpg',
    product_type: 'accessory',
    app_model: ['Premium'],
    app_sn: 'All',
    package_size: '35.0×25.0×18.0',
    package_size_imperial: '13.78×9.84×7.09',
    package_weight: 3.5,
    box_quantity: 1,
    spec: '自动检测膜卷余量，自动切换新膜卷',
    specs: {
      material: '不锈钢/铝合金/电子元件',
      type: '膜卷切换器',
      compatibility: '中高端气垫机'
    },
    category: 'switcher',
    compatibility: ['LA-E5P', 'LA-E6P'],
    prices: {
      base: 450,
      tier1: 420,
      tier2: 390,
      vip: 370,
      tiers: [
        { 
          range: '1-2', 
          price: 450,
          eu: 480,
          na: 485,
          au: 495,
          cn: 450
        },
        { 
          range: '3-4', 
          price: 420,
          eu: 450,
          na: 455,
          au: 465,
          cn: 420
        },
        { 
          range: '>4', 
          price: 390,
          eu: 420,
          na: 425,
          au: 435,
          cn: 390
        }
      ]
    },
    inventory: {
      total: 55,
      eu: 12,
      na: 15,
      au: 8,
      cn: 20
    },
    status: 'in_stock',
    warranty_period: '12个月'
  },
  {
    id: 'ACC001',
    name: '打印头模块',
    name_en: 'Printer Head Module',
    code: 'ACC-PH100',
    part_number: 'ACC-PH100',
    description: '专用打印头模块，适用于标准型产品标签打印配件',
    description_en: 'Specialized printer head module for Standard model product label printer accessory',
    type: 'accessory',
    image_url: '/images/spare-parts/ACC-PH100.jpg',
    product_type: 'accessory',
    app_model: ['Standard'],
    app_sn: 'All',
    package_size: '8.0×6.0×3.0',
    package_size_imperial: '3.15×2.36×1.18',
    package_weight: 0.28,
    box_quantity: 1,
    spec: '热敏打印头，分辨率300DPI，支持多种标签尺寸',
    specs: {
      material: '合金/电子元件',
      type: '打印头模块',
      compatibility: 'Standard型号标签打印配件',
      resolution: '300DPI',
      print_width: '80mm'
    },
    category: 'printer',
    compatibility: ['Standard'],
    prices: {
      currency: 'CNY',
      original_price: 280,
      current_price: 240,
      discount: 0.85,
      tiers: [
        { 
          quantity: 2, 
          price: 280
        },
        { 
          quantity: 5, 
          price: 260
        },
        { 
          quantity: 10, 
          price: 240
        }
      ]
    },
    inventory: {
      eu: 15,
      na: 20,
      au: 10,
      cn: 20
    },
    status: 'in_stock',
    replacement_interval: '6个月或50000张标签',
    warranty_period: '6个月'
  },
  {
    id: 'ACC002',
    name: '高精度传感器套装',
    name_en: 'High Precision Sensor Kit',
    code: 'ACC-SK200',
    part_number: 'ACC-SK200',
    description: '高精度传感器套装，适用于Premium型号智能检测配件',
    description_en: 'High precision sensor kit for Premium model smart detection accessory',
    type: 'accessory',
    image_url: '/images/spare-parts/ACC-SK200.jpg',
    product_type: 'accessory',
    app_model: ['Premium'],
    app_sn: 'All',
    package_size: '12.0×10.0×4.0',
    package_size_imperial: '4.72×3.94×1.57',
    package_weight: 0.35,
    box_quantity: 1,
    spec: '包含光电传感器、压力传感器和温度传感器',
    specs: {
      material: '电子元件/精密金属',
      type: '传感器套装',
      compatibility: 'Premium型号智能检测配件',
      accuracy: '±0.01mm',
      voltage: 'DC 24V'
    },
    category: 'sensor',
    compatibility: ['Premium'],
    prices: {
      currency: 'CNY',
      original_price: 450,
      current_price: 400,
      discount: 0.89,
      tiers: [
        { 
          quantity: 2, 
          price: 450
        },
        { 
          quantity: 5, 
          price: 425
        },
        { 
          quantity: 10, 
          price: 400
        }
      ]
    },
    inventory: {
      eu: 10,
      na: 12,
      au: 8,
      cn: 10
    },
    status: 'in_stock',
    replacement_interval: '12个月或2000小时使用',
    warranty_period: '12个月'
  },
  {
    id: 'ACC003',
    name: '工业控制主板',
    name_en: 'Industrial Control Mainboard',
    code: 'ACC-MB300',
    part_number: 'ACC-MB300',
    description: '高性能工业控制主板，适用于Professional型号自动化控制配件',
    description_en: 'High-performance industrial control mainboard for Professional model automation control accessory',
    type: 'accessory',
    image_url: '/images/spare-parts/ACC-MB300.jpg',
    product_type: 'accessory',
    app_model: ['Professional'],
    app_sn: 'All',
    package_size: '20.0×15.0×5.0',
    package_size_imperial: '7.87×5.91×1.97',
    package_weight: 0.65,
    box_quantity: 1,
    spec: '工业级主控板，支持多接口扩展，内置防干扰设计',
    specs: {
      material: '多层PCB/电子元件',
      type: '控制主板',
      compatibility: 'Professional型号自动化控制配件',
      processor: 'ARM Cortex-M4',
      memory: '512KB Flash',
      interfaces: 'RS232/RS485/CAN/Ethernet'
    },
    category: 'control',
    compatibility: ['Professional'],
    prices: {
      currency: 'CNY',
      original_price: 680,
      current_price: 620,
      discount: 0.91,
      tiers: [
        { 
          quantity: 1, 
          price: 680
        },
        { 
          quantity: 3, 
          price: 650
        },
        { 
          quantity: 5, 
          price: 620
        }
      ]
    },
    inventory: {
      eu: 8,
      na: 10,
      au: 5,
      cn: 7
    },
    status: 'in_stock',
    replacement_interval: '24个月或5000小时使用',
    warranty_period: '18个月'
  },
  {
    id: 'ACC004',
    name: '标准型色带驱动齿轮组',
    name_en: 'Standard Ribbon Drive Gear Set',
    code: 'ACC-GS101',
    part_number: 'ACC-GS101',
    description: '标准型标签打印配件的色带驱动齿轮组',
    description_en: 'Ribbon drive gear set for Standard model label printer accessory',
    type: 'accessory',
    image_url: '/images/spare-parts/ACC-GS101.jpg',
    product_type: 'accessory',
    app_model: ['Standard'],
    app_sn: 'All',
    package_size: '7.0×7.0×3.0',
    package_size_imperial: '2.76×2.76×1.18',
    package_weight: 0.15,
    box_quantity: 1,
    spec: '高精度塑料齿轮组，确保色带平稳走带',
    specs: {
      material: '工程塑料',
      type: '齿轮组',
      compatibility: 'Standard型号标签打印配件',
      gear_count: '6件套'
    },
    category: 'mechanical',
    compatibility: ['Standard'],
    prices: {
      currency: 'CNY',
      original_price: 120,
      current_price: 100,
      discount: 0.83,
      tiers: [
        { 
          quantity: 3, 
          price: 120
        },
        { 
          quantity: 10, 
          price: 110
        },
        { 
          quantity: 20, 
          price: 100
        }
      ]
    },
    inventory: {
      eu: 20,
      na: 25,
      au: 15,
      cn: 25
    },
    status: 'in_stock',
    replacement_interval: '12个月或30000张标签',
    warranty_period: '6个月'
  },
  {
    id: 'ACC005',
    name: 'Integrated piping basket',
    name_en: 'Integrated piping basket',
    code: '60A04018',
    part_number: '60A04018',
    description: '集成管道篮，适用于气垫机和包装设备',
    description_en: 'Integrated piping basket for air cushion machines and packaging equipment',
    type: 'accessory',
    image_url: '/images/spare-parts/60A04018.jpg',
    product_type: 'accessory',
    app_model: ['ET1003'],
    app_sn: 'All',
    package_size: '50.0×50.0×38.0',
    package_size_imperial: '20.0×20.0×15.0',
    package_weight: 9.1,
    box_quantity: 1,
    spec: '集成管道系统，提高气流效率',
    specs: {
      material: '金属/工程塑料',
      type: '管道篮',
      compatibility: 'Lockedair系列设备',
      brand: 'Lockedair',
      model: 'ET1003',
      pallet_size: '1200×1200',
      pallet_size_imperial: '472×472',
      pallet_quantity: 5,
      pallet_height: '235.0',
      pallet_height_imperial: '93',
      gross_weight: 10.0,
      gross_weight_imperial: 22.0,
      total_pallet_weight: 181,
      total_pallet_weight_imperial: 400
    },
    category: 'piping',
    compatibility: ['ET1003'],
    prices: {
      currency: 'CNY',
      original_price: 480,
      current_price: 450,
      discount: 0.94,
      tiers: [
        { 
          quantity: 1, 
          price: 480
        },
        { 
          quantity: 3, 
          price: 460
        },
        { 
          quantity: 5, 
          price: 450
        }
      ]
    },
    inventory: {
      eu: 12,
      na: 15,
      au: 8,
      cn: 25
    },
    status: 'in_stock',
    replacement_interval: '24个月或5000小时使用',
    warranty_period: '12个月'
  },
  {
    id: 'ACC006',
    name: 'Simplicity Air Bubble Delivery System',
    name_en: 'Simplicity Air Bubble Delivery System',
    code: '60A04043',
    part_number: '60A04043',
    description: '简易气泡传送系统，适用于中小型包装线',
    description_en: 'Simplicity air bubble delivery system for small to medium packaging lines',
    type: 'accessory',
    image_url: '/images/spare-parts/60A04043.jpg',
    product_type: 'accessory',
    app_model: ['ET2002'],
    app_sn: 'All',
    package_size: '76.0×76.0×50.0',
    package_size_imperial: '30.0×30.0×20.0',
    package_weight: 10.9,
    box_quantity: 1,
    spec: '简易气泡传送系统，110V/50Hz',
    specs: {
      material: '金属/工程塑料',
      type: '传送系统',
      compatibility: 'Lockedair系列设备',
      brand: 'Lockedair',
      model: 'ET2002',
      voltage: '110',
      frequency: '50',
      pallet_size: '1200×1200',
      pallet_size_imperial: '472×472',
      pallet_quantity: 6,
      pallet_height: '330.0',
      pallet_height_imperial: '130',
      gross_weight: 11.8,
      gross_weight_imperial: 26.0,
      total_pallet_weight: 163,
      total_pallet_weight_imperial: 360
    },
    category: 'delivery',
    compatibility: ['ET2002'],
    prices: {
      currency: 'CNY',
      original_price: 650,
      current_price: 600,
      discount: 0.92,
      tiers: [
        { 
          quantity: 1, 
          price: 650
        },
        { 
          quantity: 3, 
          price: 620
        },
        { 
          quantity: 5, 
          price: 600
        }
      ]
    },
    inventory: {
      eu: 10,
      na: 12,
      au: 6,
      cn: 20
    },
    status: 'in_stock',
    replacement_interval: '24个月或4000小时使用',
    warranty_period: '12个月'
  },
  {
    id: 'ACC007',
    name: 'Lifting System',
    name_en: 'Lifting System',
    code: '60A04019',
    part_number: '60A04019',
    description: '升降系统，适用于气垫机和重型包装设备',
    description_en: 'Lifting system for air cushion machines and heavy packaging equipment',
    type: 'accessory',
    image_url: '/images/spare-parts/60A04019.jpg',
    product_type: 'accessory',
    app_model: ['LT9002'],
    app_sn: 'All',
    package_size: '50.0×50.0×38.0',
    package_size_imperial: '20.0×20.0×15.0',
    package_weight: 12.7,
    box_quantity: 1,
    spec: '重型升降系统，最大承重200kg',
    specs: {
      material: '钢铁/液压系统',
      type: '升降系统',
      compatibility: 'Lockedair系列设备',
      brand: 'Lockedair',
      model: 'LT9002',
      pallet_size: '1200×1200',
      pallet_size_imperial: '472×472',
      pallet_quantity: 7,
      pallet_height: '330.0',
      pallet_height_imperial: '130',
      gross_weight: 13.6,
      gross_weight_imperial: 30.0,
      total_pallet_weight: 272,
      total_pallet_weight_imperial: 600
    },
    category: 'lifting',
    compatibility: ['LT9002'],
    prices: {
      currency: 'CNY',
      original_price: 850,
      current_price: 800,
      discount: 0.94,
      tiers: [
        { 
          quantity: 1, 
          price: 850
        },
        { 
          quantity: 2, 
          price: 820
        },
        { 
          quantity: 4, 
          price: 800
        }
      ]
    },
    inventory: {
      eu: 8,
      na: 10,
      au: 5,
      cn: 15
    },
    status: 'in_stock',
    replacement_interval: '36个月或6000小时使用',
    warranty_period: '18个月'
  },
  {
    id: 'ACC008',
    name: 'Portable bench',
    name_en: 'Portable bench',
    code: '60A04005',
    part_number: '60A04005',
    description: '便携式工作台，适用于各类包装设备',
    description_en: 'Portable bench for various packaging equipment',
    type: 'accessory',
    image_url: '/images/spare-parts/60A04005.jpg',
    product_type: 'accessory',
    app_model: ['EC2005'],
    app_sn: 'All',
    package_size: '76.0×76.0×50.0',
    package_size_imperial: '30.0×30.0×20.0',
    package_weight: 14.5,
    box_quantity: 1,
    spec: '便携式工作台，可折叠，承重150kg',
    specs: {
      material: '铝合金/钢铁',
      type: '工作台',
      compatibility: 'Lockedair系列设备',
      brand: 'Lockedair',
      model: 'EC2005',
      pallet_size: '1200×1200',
      pallet_size_imperial: '472×472',
      pallet_quantity: 8,
      pallet_height: '235.0',
      pallet_height_imperial: '93',
      gross_weight: 15.4,
      gross_weight_imperial: 34.0,
      total_pallet_weight: 91,
      total_pallet_weight_imperial: 200
    },
    category: 'bench',
    compatibility: ['EC2005'],
    prices: {
      currency: 'CNY',
      original_price: 580,
      current_price: 550,
      discount: 0.95,
      tiers: [
        { 
          quantity: 1, 
          price: 580
        },
        { 
          quantity: 3, 
          price: 560
        },
        { 
          quantity: 5, 
          price: 550
        }
      ]
    },
    inventory: {
      eu: 15,
      na: 18,
      au: 10,
      cn: 25
    },
    status: 'in_stock',
    replacement_interval: '36个月',
    warranty_period: '24个月'
  },
  {
    id: 'ACC009',
    name: 'Roll winder',
    name_en: 'Roll winder',
    code: '60A11013',
    part_number: '60A11013',
    description: '卷筒绕线器，适用于各类气垫膜卷筒',
    description_en: 'Roll winder for various air cushion film rolls',
    type: 'accessory',
    image_url: '/images/spare-parts/60A11013.jpg',
    product_type: 'accessory',
    app_model: ['FR8003'],
    app_sn: 'All',
    package_size: '50.0×50.0×38.0',
    package_size_imperial: '20.0×20.0×15.0',
    package_weight: 16.3,
    box_quantity: 1,
    spec: '电动卷筒绕线器，110V/50Hz',
    specs: {
      material: '金属/工程塑料',
      type: '绕线器',
      compatibility: 'Lockedair系列设备',
      brand: 'Lockedair',
      model: 'FR8003',
      voltage: '110',
      frequency: '50',
      pallet_size: '1200×1200',
      pallet_size_imperial: '472×472',
      pallet_quantity: 4,
      pallet_height: '330.0',
      pallet_height_imperial: '130',
      gross_weight: 17.2,
      gross_weight_imperial: 38.0,
      total_pallet_weight: 227,
      total_pallet_weight_imperial: 500
    },
    category: 'winder',
    compatibility: ['FR8003'],
    prices: {
      currency: 'CNY',
      original_price: 720,
      current_price: 680,
      discount: 0.94,
      tiers: [
        { 
          quantity: 1, 
          price: 720
        },
        { 
          quantity: 2, 
          price: 700
        },
        { 
          quantity: 4, 
          price: 680
        }
      ]
    },
    inventory: {
      eu: 10,
      na: 12,
      au: 6,
      cn: 18
    },
    status: 'in_stock',
    replacement_interval: '24个月或4000小时使用',
    warranty_period: '12个月'
  }
];

export const sparePartTypes = [
  { value: 'blade', label: '刀片' },
  { value: 'heating', label: '加热元件' },
  { value: 'belt', label: '传动带' },
  { value: 'electrical', label: '电气零件' },
  { value: 'electronic', label: '电子零件' }
];

export const modelOptions = [
  { value: 'LA-E4S', label: 'LA-E4S 气垫机' },
  { value: 'LA-E4C', label: 'LA-E4C 气垫机' },
  { value: 'LA-E5P', label: 'LA-E5P 工业气垫机' },
  { value: 'LA-F2', label: 'LA-F2 气泡机' }
];

export const machineTypes = [
  'All Types',
  'Laser Components',
  'Optical Components',
  'Consumables',
  'Electronic Components',
  'Cooling System'
];

export const fetchModels = (productType: string): string[] => {
  if (productType === 'machine') {
    return ['LA-E4S', 'LA-E4C', 'LA-E5P', 'LA-E6P', 'LA-E7P'];
  } else if (productType === 'accessory') {
    return ['Standard', 'Premium', 'Professional'];
  }
  return [];
};

// 新增更多配件型号选项
export const accessoryModels = [
  { value: 'Standard', label: '标准型配件' },
  { value: 'Premium', label: '高级型配件' },
  { value: 'Professional', label: '专业型配件' },
  { value: 'ET1003', label: '集成管道篮' },
  { value: 'ET2002', label: '气泡传送系统' },
  { value: 'LT9002', label: '升降系统' },
  { value: 'EC2005', label: '便携式工作台' },
  { value: 'FR8003', label: '卷筒绕线器' }
];

// 修正getSparePartsFilterOptions以使用更新的accessoryModels
export const getSparePartsFilterOptions = () => {
  // 从模拟数据中提取机器型号
  const machineModels = [...new Set(
    sparePartsMock
      .filter(part => part.product_type === 'machine')
      .flatMap(part => Array.isArray(part.app_model) ? part.app_model : [])
  )];
  
  // 使用预定义的配件型号
  const filterOptions = {
    hostModels: machineModels,
    accessoryModels: accessoryModels.map(model => model.value),
    partTypes: [
      { id: "electrical", name: "电气零件" },
      { id: "mechanical", name: "机械零件" },
      { id: "electronic", name: "电子零件" },
      { id: "consumable", name: "耗材" },
      { id: "accessory", name: "配件" }
    ],
    categories: [...new Set(sparePartsMock.map(part => part.category))].map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1)
    }))
  };
  
  return filterOptions;
};

export default sparePartsMock; 