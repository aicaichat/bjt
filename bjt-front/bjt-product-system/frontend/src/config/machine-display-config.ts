/**
 * 机器页面字段显示配置
 * 基于耗材页面成功经验，实现标准化字段映射和智能单位制切换
 * 
 * 核心原则：标题包含单位，内容显示纯数值，避免重复
 */

import { MachinePart } from '../types/machines';

// 字段显示配置接口
export interface MachineFieldConfig {
  key: string;
  required: boolean;
  dataType: 'string' | 'number' | 'composite';
  unitConfig?: {
    metric: string;    // 公制字段名
    imperial: string;  // 英制字段名
  };
  conditionalDisplay?: (machine: MachinePart) => boolean;
  formatType?: 'dimension' | 'weight' | 'quantity' | 'default';
}

// 机器页面显示场景配置
export interface MachineDisplayScenario {
  name: string;
  description: string;
  fields: MachineFieldConfig[];
}

/**
 * 机器页面字段配置表
 * 严格按照单位显示标准：标题含单位，内容纯数值
 */
export const MACHINE_FIELD_CONFIGS: Record<string, MachineFieldConfig> = {
  // 基础信息字段（无单位）
  model: {
    key: 'model',
    required: true,
    dataType: 'string'
  },
  part_number: {
    key: 'part_number', 
    required: true,
    dataType: 'string'
  },
  voltage: {
    key: 'voltage',
    required: true,
    dataType: 'string'
  },
  
  // 重量字段（智能单位制）
  net_weight: {
    key: 'net_weight',
    required: true,
    dataType: 'number',
    unitConfig: {
      metric: 'net_weight_kg',
      imperial: 'net_weight_lbs'
    },
    formatType: 'weight'
  },
  gross_weight: {
    key: 'gross_weight',
    required: true, 
    dataType: 'number',
    unitConfig: {
      metric: 'gross_weight_kg',
      imperial: 'gross_weight_lbs'
    },
    formatType: 'weight'
  },
  pallet_gross_weight: {
    key: 'pallet_gross_weight',
    required: false,
    dataType: 'number',
    unitConfig: {
      metric: 'pallet_gross_weight_kg',
      imperial: 'pallet_gross_weight_lbs'
    },
    formatType: 'weight'
  },
  
  // 尺寸字段（智能单位制 + 复合格式）
  package_size: {
    key: 'package_size',
    required: true,
    dataType: 'composite',
    unitConfig: {
      metric: 'package_size_cm',
      imperial: 'package_size_inch'
    },
    formatType: 'dimension'
  },
  pallet_size: {
    key: 'pallet_size',
    required: false,
    dataType: 'composite',
    unitConfig: {
      metric: 'pallet_size_cm',
      imperial: 'pallet_size_inch'
    },
    formatType: 'dimension'
  },
  
  // 高度字段（智能单位制）
  pallet_height: {
    key: 'pallet_height',
    required: false,
    dataType: 'number',
    unitConfig: {
      metric: 'pallet_height_cm',
      imperial: 'pallet_height_inch'
    },
    formatType: 'dimension'
  },
  
  // 数量字段
  pcs_per_box: {
    key: 'pcs_per_box',
    required: true,
    dataType: 'number',
    formatType: 'quantity'
  },
  pcs_per_pallet: {
    key: 'pcs_per_pallet',
    required: false,
    dataType: 'number', 
    formatType: 'quantity'
  }
};

/**
 * 机器页面显示场景配置
 * 定义不同使用场景下需要显示的字段
 */
export const MACHINE_DISPLAY_SCENARIOS: Record<string, MachineDisplayScenario> = {
  // 主要产品卡片显示
  productCard: {
    name: 'product_card',
    description: '机器产品卡片主要信息显示',
    fields: [
      MACHINE_FIELD_CONFIGS.model,
      MACHINE_FIELD_CONFIGS.part_number,
      MACHINE_FIELD_CONFIGS.voltage,
      MACHINE_FIELD_CONFIGS.pcs_per_box,
      MACHINE_FIELD_CONFIGS.pcs_per_pallet,
      MACHINE_FIELD_CONFIGS.package_size,
      MACHINE_FIELD_CONFIGS.pallet_size
    ]
  },
  
  // Tooltip详细信息显示
  tooltip: {
    name: 'tooltip',
    description: 'Tooltip悬浮框详细信息显示',
    fields: [
      MACHINE_FIELD_CONFIGS.package_size,
      MACHINE_FIELD_CONFIGS.net_weight,
      MACHINE_FIELD_CONFIGS.gross_weight,
      MACHINE_FIELD_CONFIGS.pallet_size,
      MACHINE_FIELD_CONFIGS.pallet_height,
      MACHINE_FIELD_CONFIGS.pallet_gross_weight,
      MACHINE_FIELD_CONFIGS.pcs_per_box,
      MACHINE_FIELD_CONFIGS.pcs_per_pallet
    ]
  },
  
  // 购物车显示
  cart: {
    name: 'cart',
    description: '购物车中的机器信息显示',
    fields: [
      MACHINE_FIELD_CONFIGS.model,
      MACHINE_FIELD_CONFIGS.part_number,
      MACHINE_FIELD_CONFIGS.voltage,
      MACHINE_FIELD_CONFIGS.package_size,
      MACHINE_FIELD_CONFIGS.net_weight,
      MACHINE_FIELD_CONFIGS.pcs_per_box
    ]
  },
  
  // PO页面显示
  po: {
    name: 'po',
    description: 'PO页面的机器信息显示',
    fields: [
      MACHINE_FIELD_CONFIGS.model,
      MACHINE_FIELD_CONFIGS.part_number,
      MACHINE_FIELD_CONFIGS.voltage,
      MACHINE_FIELD_CONFIGS.package_size,
      MACHINE_FIELD_CONFIGS.net_weight,
      MACHINE_FIELD_CONFIGS.pcs_per_box,
      MACHINE_FIELD_CONFIGS.pallet_size
    ]
  }
};

/**
 * 功能开关配置
 * 支持渐进式升级，确保不影响现有功能
 */
export const MACHINE_FEATURE_FLAGS = {
  // 是否启用新的标准化字段显示
  ENABLE_STANDARDIZED_DISPLAY: import.meta.env.VITE_ENABLE_MACHINE_STANDARD_DISPLAY === 'true',
  
  // 是否启用智能单位制切换
  ENABLE_SMART_UNIT_SYSTEM: import.meta.env.VITE_ENABLE_SMART_UNIT_SYSTEM !== 'false',
  
  // 是否显示调试信息
  ENABLE_DEBUG_INFO: import.meta.env.DEV,
  
  // 是否启用性能监控
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERF_MONITORING === 'true'
};

/**
 * 字段标签映射配置
 * 支持多语言和智能单位制
 */
export const MACHINE_FIELD_LABELS = {
  zh: {
    // 基础字段
    model: '型号',
    part_number: '料号',
    voltage: '电压',
    image_url: '产品图片',  // 🔴 从"图片"改为"产品图片"
    name: '名称',
    
    // 重量字段（智能单位制）- 修正单位标准
    net_weight_kg: '单件净重(kg)',
    net_weight_lbs: '单件净重(lb)',  // 🔴 从"(lbs)"改为"(lb)"
    gross_weight_kg: '单件毛重(kg)',
    gross_weight_lbs: '单件毛重(lb)',  // 🔴 从"(lbs)"改为"(lb)"
    pallet_gross_weight_kg: '整托毛重(kg)',
    pallet_gross_weight_lbs: '整托毛重(lb)',  // 🔴 从"(lbs)"改为"(lb)"
    
    // 尺寸字段（智能单位制）
    package_size_cm: '包装尺寸(cm)',
    package_size_inch: '包装尺寸(inch)',
    pallet_size_cm: '托盘尺寸(cm)',
    pallet_size_inch: '托盘尺寸(inch)',
    pallet_height_cm: '打托高度(cm)',
    pallet_height_inch: '打托高度(inch)',
    
    // 数量字段
    pcs_per_box: '单箱数量',
    pcs_per_pallet: '一托数量',
    
    // 配件特有字段
    frequency: '频率'  // 🔴 从"频率Hz"改为"频率"
  },
  en: {
    // 基础字段
    model: 'Model',
    part_number: 'Part No.',
    voltage: 'Voltage',
    image_url: 'Product Image',  // 🔴 从"Image"改为"Product Image"
    name: 'Item',  // 🔴 从"Name"改为"Item"
    
    // 重量字段（智能单位制）- 修正英文名称和单位标准
    net_weight_kg: 'Net Weight(kg)',
    net_weight_lbs: 'Net Weight(lb)',  // 🔴 从"(lbs)"改为"(lb)"
    gross_weight_kg: 'Gross Weight(kg)',
    gross_weight_lbs: 'Gross Weight(lb)',  // 🔴 从"(lbs)"改为"(lb)"
    pallet_gross_weight_kg: 'GW per Pallet(kg)',  // 🔴 从"Pallet GW(kg)"改为"GW per Pallet(kg)"
    pallet_gross_weight_lbs: 'GW per Pallet(lb)',  // 🔴 从"Pallet GW(lbs)"改为"GW per Pallet(lb)"
    
    // 尺寸字段（智能单位制）- 修正英文名称
    package_size_cm: 'Packaging Dim.(cm)',  // 🔴 从"Package Size(cm)"改为"Packaging Dim.(cm)"
    package_size_inch: 'Packaging Dim.(inch)',  // 🔴 从"Package Size(inch)"改为"Packaging Dim.(inch)"
    pallet_size_cm: 'Pallet Size(cm)',
    pallet_size_inch: 'Pallet Size(inch)',
    pallet_height_cm: 'Pallet Height(cm)',
    pallet_height_inch: 'Pallet Height(inch)',
    
    // 数量字段 - 修正英文名称
    pcs_per_box: 'Qty per Carton',  // 🔴 从"Qty per Box"改为"Qty per Carton"
    pcs_per_pallet: 'Packs per Pallet',  // 🔴 从"Qty per Pallet"改为"Packs per Pallet"
    
    // 配件特有字段
    frequency: 'Frequency'
  }
};

/**
 * 默认显示配置
 */
export const DEFAULT_MACHINE_DISPLAY_CONFIG = {
  scenario: 'productCard',
  language: 'zh',
  unitSystem: 'metric',
  enableConditionalDisplay: true,
  enableSmartUnitSystem: MACHINE_FEATURE_FLAGS.ENABLE_SMART_UNIT_SYSTEM
};

export interface MachineDisplayFields {
  // 主机商品列表字段
  machineList: {
    model: string;        // 型号
    voltage: string;      // 电压
    image: string;        // 图片
    partNumber: string;   // 料号
    name: string;         // 名称
    pcsPerBox: string;    // 单箱数量
    palletSize: string;   // 托盘尺寸(cm/inch自动切换)
    pcsPerPallet: string; // 一托数量
  };
  
  // 配件商品列表字段
  accessoryList: {
    image: string;        // 产品图片
    model: string;        // 型号
    partNumber: string;   // 料号
    name: string;         // 产品名称
    voltage: string;      // 电压V
    frequency: string;    // 频率Hz
    pcsPerBox: string;    // 单箱数量
    palletSize: string;   // 托盘尺寸(cm/inch自动切换)
    pcsPerPallet: string; // 一托数量
  };
  
  // Tooltip字段(主机和配件共用)
  tooltip: {
    packageSize: string;      // 包装尺寸(cm/inch自动切换)
    netWeight: string;        // 单件净重(kg/lbs自动切换)
    palletHeight: string;     // 打托高度(cm/inch自动切换)
    palletGrossWeight: string;// 整托毛重(kg/lbs自动切换)
  };
  
  // 购物车字段
  cart: {
    // 主机购物车字段
    machine: MachineDisplayFields['machineList'];
    // 配件购物车字段  
    accessory: MachineDisplayFields['accessoryList'];
  };
}

// 字段映射配置
export const MACHINE_FIELD_MAPPING = {
  // 公英制单位映射
  metric: {
    palletSize: 'pallet_size_cm',
    palletSizeUnit: 'cm',
    packageSize: 'package_size_cm', 
    packageSizeUnit: 'cm',
    netWeight: 'net_weight_kg',
    netWeightUnit: 'kg',
    palletHeight: 'pallet_height_cm',
    palletHeightUnit: 'cm',
    palletGrossWeight: 'pallet_gross_weight_kg',
    palletGrossWeightUnit: 'kg'
  },
  imperial: {
    palletSize: 'pallet_size_inch',
    palletSizeUnit: 'inch', 
    packageSize: 'package_size_inch',
    packageSizeUnit: 'inch',
    netWeight: 'net_weight_lbs',
    netWeightUnit: 'lbs',
    palletHeight: 'pallet_height_inch', 
    palletHeightUnit: 'inch',
    palletGrossWeight: 'pallet_gross_weight_lbs',
    palletGrossWeightUnit: 'lbs'
  }
} as const;

// 主机页面JSON标准字段映射 (基于output/all-pages-display-fields.json)
export const MACHINE_JSON_FIELDS = {
  // 机器页面商品列表展示字段
  machineList: [
    "型号",      // model
    "电压",      // voltage  
    "产品图片",   // 🔴 从"图片"改为"产品图片"
    "料号",      // part_number
    "名称",      // name
    "单箱数量",   // pcs_per_box
    "托盘尺寸cm", // pallet_size_cm
    "托盘尺寸inch", // pallet_size_inch
    "一托数量"    // pcs_per_pallet
  ],
  
  // 机器页面购物车展示字段
  machineCart: [
    "型号",      // model
    "电压",      // voltage
    "产品图片",   // 🔴 从"图片"改为"产品图片"
    "料号",      // part_number
    "名称",      // name
    "单箱数量",   // pcs_per_box
    "托盘尺寸cm", // pallet_size_cm
    "托盘尺寸inch", // pallet_size_inch
    "一托数量"    // pcs_per_pallet
  ],
  
  // 机器页面Tooltip展示字段
  machineTooltip: [
    "包装尺寸cm",   // package_size_cm
    "包装尺寸inch", // package_size_inch
    "单件净重kg",   // net_weight_kg
    "单件净重lb",   // net_weight_lbs - 🔴 修正显示名单位
    "打托高度cm",   // pallet_height_cm
    "打托高度inch", // pallet_height_inch
    "整托毛重kg",   // pallet_gross_weight_kg
    "整托毛重lb"    // pallet_gross_weight_lbs - 🔴 修正显示名单位
  ]
} as const;

// 配件页面JSON标准字段映射
export const ACCESSORY_JSON_FIELDS = {
  // 配件页面商品列表展示字段
  accessoryList: [
    "产品图片",     // image
    "型号",        // model
    "料号",        // part_number
    "名称",        // 🔴 从"产品名称"改为"名称"
    "电压",        // 🔴 从"电压V"改为"电压"
    "频率",        // 🔴 从"频率Hz"改为"频率"
    "单箱数量",     // pcs_per_box
    "托盘尺寸cm",   // pallet_size_cm
    "托盘尺寸inch", // pallet_size_inch
    "一托数量"      // pcs_per_pallet
  ],
  
  // 配件页面购物车展示字段
  accessoryCart: [
    "产品图片",     // image
    "型号",        // model
    "料号",        // part_number
    "名称",        // 🔴 从"产品名称"改为"名称"
    "电压",        // 🔴 从"电压V"改为"电压"
    "频率",        // 🔴 从"频率Hz"改为"频率"
    "单箱数量"      // pcs_per_box
  ],
  
  // 配件页面Tooltip展示字段
  accessoryTooltip: [
    "包装尺寸cm",   // package_size_cm
    "包装尺寸inch", // package_size_inch
    "单件净重kg",   // net_weight_kg
    "单件净重lb",   // net_weight_lbs - 🔴 修正显示名单位
    "打托高度cm",   // pallet_height_cm
    "打托高度inch", // pallet_height_inch
    "整托毛重kg",   // pallet_gross_weight_kg
    "整托毛重lb"    // pallet_gross_weight_lbs - 🔴 修正显示名单位
  ]
} as const;

// 字段显示优先级配置
export const FIELD_DISPLAY_PRIORITY = {
  // 必要字段 - 必须显示
  required: [
    'model',        // 型号
    'voltage',      // 电压
    'image',        // 图片
    'partNumber',   // 料号
    'name',         // 名称/产品名称
    'pcsPerBox'     // 单箱数量
  ],
  
  // 重要字段 - 优先显示
  important: [
    'palletSize',     // 托盘尺寸
    'pcsPerPallet',   // 一托数量
    'frequency'       // 频率(仅配件)
  ],
  
  // 辅助字段 - Tooltip显示
  auxiliary: [
    'packageSize',        // 包装尺寸
    'netWeight',         // 单件净重
    'palletHeight',      // 打托高度
    'palletGrossWeight'  // 整托毛重
  ]
} as const; 