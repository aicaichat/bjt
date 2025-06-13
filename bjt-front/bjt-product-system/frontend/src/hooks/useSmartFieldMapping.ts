import { useCallback } from 'react';
import { useSmartUnitSystem } from './useSmartUnitSystem';

// 购物车字段配置表
export const CART_FIELD_CONFIGS = {
  // 机器字段
  'net_weight': {
    key: 'net_weight',
    unitConfig: {
      metric: 'net_weight_kg',
      imperial: 'net_weight_lbs'
    },
    priority: 'high',
    scenarios: ['cart-page', 'sidebar-cart', 'cart-tooltip']
  },
  
  'package_size': {
    key: 'package_size',
    unitConfig: {
      metric: 'package_size_cm',
      imperial: 'package_size_inch'
    },
    priority: 'high',
    scenarios: ['cart-tooltip']
  },
  
  'pallet_size': {
    key: 'pallet_size',
    unitConfig: {
      metric: 'pallet_size_cm',
      imperial: 'pallet_size_inch'
    },
    priority: 'medium',
    scenarios: ['cart-page', 'sidebar-cart']
  },
  
  'stacking_height': {
    key: 'stacking_height',
    unitConfig: {
      metric: 'stacking_height_cm',
      imperial: 'stacking_height_inch'
    },
    priority: 'medium',
    scenarios: ['cart-tooltip']
  },
  
  'pallet_gross_weight': {
    key: 'pallet_gross_weight',
    unitConfig: {
      metric: 'pallet_gross_weight_kg',
      imperial: 'pallet_gross_weight_lbs'
    },
    priority: 'medium',
    scenarios: ['cart-tooltip']
  },
  
  // 耗材字段
  'film_width': {
    key: 'film_width',
    unitConfig: {
      metric: 'film_width_cm',
      imperial: 'film_width_inch'
    },
    priority: 'high',
    scenarios: ['cart-page', 'sidebar-cart', 'cart-tooltip']
  },
  
  'bag_length': {
    key: 'bag_length',
    unitConfig: {
      metric: 'bag_length_cm',
      imperial: 'bag_length_inch'
    },
    priority: 'high',
    scenarios: ['cart-tooltip']
  },
  
  'total_length': {
    key: 'total_length',
    unitConfig: {
      metric: 'total_length_m',
      imperial: 'total_length_ft'
    },
    priority: 'medium',
    scenarios: ['cart-tooltip']
  },
  
  'bubble_diameter': {
    key: 'bubble_diameter',
    unitConfig: {
      metric: 'bubble_diameter_cm',
      imperial: 'bubble_diameter_inch'
    },
    priority: 'high',
    scenarios: ['cart-page', 'sidebar-cart']
  },
  
  'thickness': {
    key: 'thickness',
    unitConfig: {
      metric: 'thickness_um',
      imperial: 'thickness_mil'
    },
    priority: 'high',
    scenarios: ['cart-tooltip']
  },
  
  'core_diameter': {
    key: 'core_diameter',
    unitConfig: {
      metric: 'core_diameter_cm',
      imperial: 'core_diameter_inch'
    },
    priority: 'low',
    scenarios: ['cart-tooltip']
  },
  
  // 备件字段
  'spec': {
    key: 'spec',
    unitConfig: {
      metric: 'spec',
      imperial: 'spec_imperial'
    },
    priority: 'high',
    scenarios: ['cart-page', 'sidebar-cart']
  },
  
  // 配件字段（无需单位制转换）
  'voltage': {
    key: 'voltage',
    priority: 'high',
    scenarios: ['cart-page', 'sidebar-cart']
  },
  
  'frequency': {
    key: 'frequency',
    priority: 'medium',
    scenarios: ['cart-page', 'sidebar-cart']
  }
} as const;

// 字段单位映射表
export const FIELD_UNIT_MAPPINGS = {
  // 重量字段
  'net_weight_kg': 'kg',
  'net_weight_lbs': 'lbs',
  'gross_weight_kg': 'kg',
  'gross_weight_lbs': 'lbs',
  'pallet_gross_weight_kg': 'kg',
  'pallet_gross_weight_lbs': 'lbs',
  
  // 尺寸字段
  'package_size_cm': 'cm',
  'package_size_inch': 'inch',
  'pallet_size_cm': 'cm',
  'pallet_size_inch': 'inch',
  'stacking_height_cm': 'cm',
  'stacking_height_inch': 'inch',
  'pallet_height_cm': 'cm',
  'pallet_height_inch': 'inch',
  
  // 耗材字段
  'film_width_cm': 'cm',
  'film_width_inch': 'inch',
  'bag_length_cm': 'cm',
  'bag_length_inch': 'inch',
  'total_length_m': 'm',
  'total_length_ft': 'ft',
  'bubble_diameter_cm': 'cm',
  'bubble_diameter_inch': 'inch',
  'thickness_um': 'μm',
  'thickness_mil': 'mil',
  'core_diameter_cm': 'cm',
  'core_diameter_inch': 'inch',
  
  // 电气字段（无需单位制转换）
  'voltage': 'V',
  'frequency': 'Hz',
  
  // 规格字段（通常不需要单位）
  'spec': '',
  'spec_imperial': ''
} as const;

export const useSmartFieldMapping = () => {
  const { preferredUnitSystem } = useSmartUnitSystem();
  
  // 根据用户偏好自动选择字段
  const getSmartFieldMapping = useCallback((fieldKey: string, product: any) => {
    const fieldConfig = CART_FIELD_CONFIGS[fieldKey as keyof typeof CART_FIELD_CONFIGS];
    if (!fieldConfig || !('unitConfig' in fieldConfig)) return fieldKey;
    
    const isImperial = preferredUnitSystem === 'imperial';
    const targetField = isImperial ? 
      fieldConfig.unitConfig.imperial : 
      fieldConfig.unitConfig.metric;
    
    // 检查目标字段是否存在且有值
    if (product[targetField] !== undefined && 
        product[targetField] !== null &&
        product[targetField] !== '') {
      return targetField;
    }
    
    // 如果目标字段不存在，尝试另一个单位制的字段
    const fallbackField = isImperial ? 
      fieldConfig.unitConfig.metric : 
      fieldConfig.unitConfig.imperial;
    
    if (product[fallbackField] !== undefined && 
        product[fallbackField] !== null &&
        product[fallbackField] !== '') {
      return fallbackField;
    }
    
    // 都不存在则返回基础字段名
    return fieldKey;
  }, [preferredUnitSystem]);
  
  // 获取字段对应的单位
  const getFieldUnit = useCallback((fieldName: string): string => {
    return FIELD_UNIT_MAPPINGS[fieldName as keyof typeof FIELD_UNIT_MAPPINGS] || '';
  }, []);
  
  return { getSmartFieldMapping, getFieldUnit, preferredUnitSystem };
}; 