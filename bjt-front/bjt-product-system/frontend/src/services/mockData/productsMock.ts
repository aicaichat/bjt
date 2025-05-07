import { Product } from '../api';

// 产品模拟数据
export const mockProducts: Product[] = [
  {
    id: 1,
    title_en: 'Air Cushion Machine LP-V1',
    title_cn: '气垫机 V1型',
    description_en: 'Professional air cushion machine for efficient packaging protection.',
    description_cn: '专业气垫机，提供高效包装保护。',
    image_url: '/images/shop/LP-V1.jpg',
    price: 100,
    category_id: 1,
    type: 'machine',
    sku: 'BJT-LP-V1-2024',
    stock_status: 'in_stock',
    features_en: [
      'High efficiency operation',
      'Easy to use interface',
      'Compatible with various film types',
      'Low noise design'
    ],
    features_cn: [
      '高效运行',
      '易用界面',
      '兼容多种膜类型',
      '低噪音设计'
    ],
    specifications: {
      'Voltage': '220V/110V',
      'Power': '250W',
      'Dimensions': '560 x 350 x 334 mm',
      'Weight': '13.5 kg',
      'Film width': '200mm - 400mm'
    },
    status: 'publish'
  },
  {
    id: 2,
    title_en: 'Air Cushion Machine LP-F1',
    title_cn: '气垫机 F1型',
    description_en: 'Standard air cushion machine with reliable performance.',
    description_cn: '标准气垫机，性能可靠。',
    image_url: '/images/shop/LP-F1.jpg',
    price: 120,
    category_id: 1,
    type: 'machine',
    sku: 'BJT-LP-F1-2024',
    stock_status: 'in_stock',
    features_en: [
      'Stable performance',
      'Compact design',
      'Energy efficient',
      'Multiple film settings'
    ],
    features_cn: [
      '性能稳定',
      '紧凑设计',
      '节能高效',
      '多种膜设置'
    ],
    specifications: {
      'Voltage': '220V/110V',
      'Power': '200W',
      'Dimensions': '520 x 320 x 300 mm',
      'Weight': '12 kg',
      'Film width': '200mm - 350mm'
    },
    status: 'publish'
  },
  {
    id: 3,
    title_en: 'Paper Cushion Machine MFA-P1',
    title_cn: '纸垫机 P1型',
    description_en: 'Eco-friendly paper cushion solution for sustainable packaging.',
    description_cn: '环保纸垫解决方案，可持续包装选择。',
    image_url: '/images/shop/MFA-P1.jpg',
    price: 150,
    category_id: 2,
    type: 'machine',
    sku: 'BJT-MFA-P1-2024',
    stock_status: 'in_stock',
    features_en: [
      'Environmentally friendly',
      'Uses recycled paper',
      'Adjustable cushion density',
      'Low maintenance'
    ],
    features_cn: [
      '环保设计',
      '使用回收纸',
      '可调节垫密度',
      '低维护成本'
    ],
    specifications: {
      'Voltage': '220V/110V',
      'Power': '350W',
      'Dimensions': '680 x 480 x 450 mm',
      'Weight': '42 kg',
      'Paper width': '380mm'
    },
    status: 'publish'
  },
  {
    id: 4,
    title_en: 'Water Activated Tape Machine TBY-M1',
    title_cn: '水胶带机 M1型',
    description_en: 'Professional water activated tape dispensing system.',
    description_cn: '专业水激活胶带分配系统。',
    image_url: '/images/shop/TBY-M1.jpg',
    price: 90,
    category_id: 3,
    type: 'machine',
    sku: 'BJT-TBY-M1-2024',
    stock_status: 'in_stock',
    features_en: [
      'Electronic tape length control',
      'Water tank with level indicator',
      'Accommodates various tape widths',
      'Quiet operation'
    ],
    features_cn: [
      '电子胶带长度控制',
      '带水位指示器的水箱',
      '适应多种胶带宽度',
      '静音操作'
    ],
    specifications: {
      'Voltage': '220V/110V',
      'Power': '150W',
      'Dimensions': '340 x 280 x 230 mm',
      'Weight': '9.8 kg',
      'Tape width': '36mm - 72mm'
    },
    status: 'publish'
  },
  {
    id: 5,
    title_en: 'Floor Stand Accessory',
    title_cn: '地面支架配件',
    description_en: 'Sturdy floor stand for air cushion machines.',
    description_cn: '坚固的气垫机地面支架。',
    image_url: '/images/shop/FS-001.jpg',
    price: 45,
    category_id: 4,
    type: 'accessory',
    sku: 'BJT-FS-V2-2024',
    stock_status: 'in_stock',
    features_en: [
      'Stable design',
      'Height adjustable',
      'Compatible with all LP series',
      'Includes mounting hardware'
    ],
    features_cn: [
      '稳定设计',
      '高度可调',
      '兼容所有LP系列',
      '包含安装硬件'
    ],
    specifications: {
      'Material': 'Steel',
      'Dimensions': '90 x 70 x 120 cm',
      'Weight': '7.8 kg',
      'Finish': 'Powder coated'
    },
    status: 'publish'
  },
  {
    id: 6,
    title_en: 'Table Stand Accessory',
    title_cn: '桌面支架配件',
    description_en: 'Compact table stand for air cushion machines.',
    description_cn: '紧凑的气垫机桌面支架。',
    image_url: '/images/shop/TS-001.jpg',
    price: 35,
    category_id: 4,
    type: 'accessory',
    sku: 'BJT-TS-V1-2024',
    stock_status: 'in_stock',
    features_en: [
      'Space saving design',
      'Non-slip surface',
      'Compatible with all LP series',
      'Easy assembly'
    ],
    features_cn: [
      '节省空间设计',
      '防滑表面',
      '兼容所有LP系列',
      '易于组装'
    ],
    specifications: {
      'Material': 'Steel/ABS',
      'Dimensions': '80 x 60 x 110 cm',
      'Weight': '3.5 kg',
      'Finish': 'Powder coated'
    },
    status: 'publish'
  }
]; 