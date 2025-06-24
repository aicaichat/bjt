// frontend/src/config/cartDisplayFields.ts

// 🎯 Based on: docs/购物车系统实施指南/02-字段映射标准.md
// This configuration centralizes the display logic for different product types across cart, order, and sidebar components.

// 🏷️ 字段显示场景定义
export type DisplayScenario = 'cart_list' | 'cart_sidebar' | 'order_page' | 'tooltip';

// 🔧 机器/主机字段配置
export const MACHINE_FIELDS = {
  cart_list: [
    'part_number',
    'model', 
    'voltage',
    'pcs_per_box',
    'pcs_per_pallet',
    'package_size_cm', // 智能单位制
    'pallet_size_cm',  // 智能单位制
    'net_weight_kg',   // 智能单位制
  ],
  cart_sidebar: [
    'part_number',
    'model',
    'voltage',
    'frequency',
    'pcs_per_box',
    'pcs_per_pallet',
    'package_size_cm', // 智能单位制
    'pallet_size_cm',  // 智能单位制
  ],
  order_page: [
    'model',
    'voltage',
    'part_number',
    'name',
    'pcs_per_box',
    'pallet_size_cm', // 智能单位制
    'pcs_per_pallet',
  ],
  tooltip: [
    'package_size_cm', // 智能单位制
    'net_weight_kg',   // 智能单位制
    'stacking_height_cm', // 智能单位制
    'pallet_gross_weight_kg', // 智能单位制
  ]
};

// 🧴 耗材字段配置
export const CONSUMABLE_FIELDS = {
  cart_list: [
    'part_number',
    'brand',
    'model_metric',    // 智能单位制
    'spec',           // 智能单位制 (公制英制切换)
    'film_width_cm',  // 智能单位制
    'bubble_diameter_mm', // 智能单位制
    'pcs_per_box',
  ],
  cart_sidebar: [
    'part_number',
    'brand',
    'model_metric',    // 智能单位制
    'spec',           // 智能单位制 (公制英制切换)
    'material',
    'film_width_cm',  // 智能单位制
    'bag_length_cm',  // 智能单位制
    'total_length_m', // 智能单位制
    'thickness_um',   // 智能单位制
    'product_id',
  ],
  order_page: [
    'app_model',
    'part_number',
    'name',           // 🔧 耗材名称（使用model_metric作为回退）
    'model',          // 🔧 修复：使用model字段，支持公英制智能切换 (model/model_metric)
    'spec',           // 智能单位制 (公制英制切换)
    'bubble_diameter_mm', // 智能单位制
    'pcs_per_box',
  ],
  tooltip: [
    'material',
    'thickness_um',   // 智能单位制
    'film_width_cm',  // 智能单位制
    'bag_length_cm',  // 智能单位制
    'total_length_m', // 智能单位制
    'package_size_cm', // 智能单位制
    'net_weight_kg',  // 智能单位制
  ]
};

// 🔧 备件字段配置
export const SPARE_PART_FIELDS = {
  cart_list: [
    'part_number',
    'model',
    'spec',           // 智能单位制 (公制英制切换)
    'app_model',
    'pcs_per_box',
  ],
  cart_sidebar: [
    'app_model',
    'is_consumable',
    'part_number',
    'name',           // 🔧 修复：使用name字段，让CartFieldUnifier智能选择
    'spec',           // 智能单位制 (公制英制切换)
    'app_sn',
    'unit',
    'pcs_per_box',
    'package_size_cm', // 智能单位制
    'net_weight_kg',   // 智能单位制
  ],
  order_page: [
    'app_model',
    'part_number',
    'name',           // 🔧 修复：使用name字段，让CartFieldUnifier智能选择
    'spec',           // 智能单位制 (公制英制切换)
    'app_sn',
    'package_size_cm', // 智能单位制 (自动切换到package_size_inch)
    'unit',
    'net_weight_kg',   // 智能单位制 (自动切换到net_weight_lbs)
    'pcs_per_box',
  ],
  tooltip: [
    'package_size_cm', // 智能单位制
    'net_weight_kg',   // 智能单位制
  ]
};

// ⚙️ 配件字段配置
export const ACCESSORY_FIELDS = {
  cart_list: [
    'part_number',
    'model',
    'voltage',
    'frequency',
    'pcs_per_box',
    'pcs_per_pallet',
    'package_size_cm', // 智能单位制
    'net_weight_kg',   // 智能单位制
    'pallet_size_cm',  // 智能单位制
  ],
  cart_sidebar: [
    'model',
    'part_number',
    'product_id',
    'voltage',
    'frequency',
    'pcs_per_box',
    'pcs_per_pallet',
    'package_size_cm', // 智能单位制
    'net_weight_kg',   // 智能单位制
    'pallet_size_cm',  // 智能单位制
  ],
  order_page: [
    'model',
    'part_number',
    'name',              // 🔧 修复：使用通用name字段，支持智能多语言
    'voltage',           // 🔧 修复：使用标准voltage字段
    'frequency',         // 🔧 修复：使用标准frequency字段
    'package_size_cm',   // 🔧 修复：添加缺失的包装尺寸字段
    'pcs_per_box',
  ],
  tooltip: [
    'package_size_cm', // 智能单位制
    'net_weight_kg',   // 智能单位制
    'stacking_height_cm', // 智能单位制
    'pallet_gross_weight_kg', // 智能单位制
  ]
};

// 🗂️ 产品类型字段映射
export const PRODUCT_TYPE_FIELDS = {
  machine: MACHINE_FIELDS,
  host: MACHINE_FIELDS,      // 主机别名
  设备: MACHINE_FIELDS,       // 中文别名
  consumable: CONSUMABLE_FIELDS,
  耗材: CONSUMABLE_FIELDS,    // 中文别名
  spare_part: SPARE_PART_FIELDS,
  spare: SPARE_PART_FIELDS,  // 备件别名
  备件: SPARE_PART_FIELDS,    // 中文别名
  accessory: ACCESSORY_FIELDS,
  配件: ACCESSORY_FIELDS,     // 中文别名
};

// 🎯 便捷获取函数
export const getFieldsForProductType = (
  productType: string,
  scenario: DisplayScenario
): string[] => {
  const fields = PRODUCT_TYPE_FIELDS[productType as keyof typeof PRODUCT_TYPE_FIELDS];
  if (!fields) {
    console.warn(`Unknown product type: ${productType}, falling back to spare_part`);
    return PRODUCT_TYPE_FIELDS.spare_part[scenario] || [];
  }
  return fields[scenario] || [];
};

// 🔄 向后兼容的导出（为了不破坏现有的Order页面）
export const MACHINE_CART_FIELDS = MACHINE_FIELDS.order_page;
export const CONSUMABLE_CART_FIELDS = CONSUMABLE_FIELDS.order_page;
export const SPARE_PART_CART_FIELDS = SPARE_PART_FIELDS.order_page;
export const ACCESSORY_CART_FIELDS = ACCESSORY_FIELDS.order_page;

export const PRODUCT_TYPE_FIELD_MAP = {
  machine: MACHINE_CART_FIELDS,
  host: MACHINE_CART_FIELDS,
  设备: MACHINE_CART_FIELDS,
  consumable: CONSUMABLE_CART_FIELDS,
  spare_part: SPARE_PART_CART_FIELDS,
  accessory: ACCESSORY_CART_FIELDS,
}; 