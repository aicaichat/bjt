import { useMemo } from 'react';
import { useSmartUnitSystem } from './useSmartUnitSystem';
import { useTranslation } from 'react-i18next';

export type ProductType = 'machines' | 'consumables' | 'spareParts' | 'accessories';

export const useCartDisplayEnhancer = (originalData: any, productType: ProductType) => {
  const { preferredUnitSystem, getSmartFieldKey, getFieldUnit } = useSmartUnitSystem();
  const { t } = useTranslation(['cart', 'products']);
  
  // 产品类型字段配置 - 基于字段映射标准
  const fieldConfigs = useMemo(() => ({
    machines: {
      cartFields: ['model', 'voltage', 'image_url', 'part_number', 'name', 'pcs_per_box', 'pallet_size', 'pcs_per_pallet'],
      smartFields: ['pallet_size', 'package_size', 'net_weight'] // 智能单位制字段
    },
    consumables: {
      cartFields: ['app_model', 'name_en', 'image_url', 'part_number', 'model', 'spec', 'bubble_diameter', 'product_id', 'pcs_per_box'],
      smartFields: ['model', 'spec', 'bubble_diameter', 'package_size', 'net_weight'] // 智能单位制字段
    },
    spareParts: {
      cartFields: ['app_model', 'image_url', 'part_number', 'name_en', 'spec', 'app_sn', 'package_size', 'unit', 'net_weight', 'pcs_per_box'],
      smartFields: ['package_size', 'net_weight'] // 智能单位制字段
    },
    accessories: {
      cartFields: ['image_url', 'model', 'part_number', 'product_name', 'voltage_v', 'frequency_hz', 'pcs_per_box'],
      smartFields: ['package_size', 'net_weight'] // 智能单位制字段
    }
  }), []);
  
  // 生成增强后的显示数据
  const enhancedData = useMemo(() => {
    if (!originalData) return null;
    
    const config = fieldConfigs[productType];
    if (!config) return originalData;
    
    const enhanced = { ...originalData };
    
    // 添加智能单位制字段的显示数据
    enhanced._display = {};
    
    config.smartFields.forEach(baseField => {
      const smartKey = getSmartFieldKey(baseField);
      const value = originalData[smartKey];
      
      if (value !== undefined && value !== null && value !== '') {
        enhanced._display[baseField] = {
          value,
          unit: getFieldUnit(baseField),
          formatted: formatFieldValue(value, baseField, preferredUnitSystem),
          originalKey: smartKey
        };
      }
    });
    
    // 添加字段标签的多语言显示
    enhanced._labels = {};
    config.cartFields.forEach(field => {
      enhanced._labels[field] = getFieldLabel(field, productType);
    });
    
    // 添加单位制上下文信息
    enhanced._unitContext = {
      preferredUnitSystem,
      isTemporaryOverride: false // 将在组件中更新
    };
    
    return enhanced;
  }, [originalData, productType, preferredUnitSystem]);
  
  return enhancedData;
};

// 字段值格式化函数
const formatFieldValue = (value: any, field: string, unitSystem: 'metric' | 'imperial'): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  if (typeof value === 'number') {
    // 重量字段保留2位小数
    if (field.includes('weight')) {
      return value.toFixed(2);
    }
    // 其他数值字段保留1位小数
    return value.toFixed(1);
  }
  
  // 尺寸字段格式化（支持复合尺寸）
  if (field.includes('size') && typeof value === 'string') {
    // 支持 "21*21*42", "21x21x42", "21×21×42" 格式
    return value.replace(/[×]/g, '*').replace(/[x]/g, '*');
  }
  
  return String(value);
};

// 字段标签获取函数 - 基于CSV标准
const getFieldLabel = (field: string, productType: string): { zh: string; en: string } => {
  // 基于CSV标准的字段标签映射
  const labels: Record<string, { zh: string; en: string }> = {
    // 通用字段
    model: { zh: '型号', en: 'Model' },
    voltage: { zh: '电压', en: 'Voltage' },
    image_url: { zh: '产品图片', en: 'Product Image' },
    part_number: { zh: '料号', en: 'Part No.' },
    name: { zh: '名称', en: 'Item' },
    name_en: { zh: '名称', en: 'Item' },
    product_name: { zh: '名称', en: 'Item' },
    pcs_per_box: { zh: '单箱数量', en: 'Qty per Carton' },
    unit: { zh: '单位', en: 'Unit' },
    
    // 尺寸重量字段
    package_size: { zh: '包装尺寸', en: 'Package Size' },
    pallet_size: { zh: '托盘尺寸', en: 'Pallet Size' },
    net_weight: { zh: '单件净重', en: 'Net Weight' },
    pcs_per_pallet: { zh: '一托数量', en: 'Packs per Pallet' },
    
    // 耗材特有字段
    app_model: { zh: '适用机型', en: 'Applicable Machine' },
    spec: { zh: '规格描述', en: 'Spec.' },
    bubble_diameter: { zh: '泡径', en: 'Bubble Dia.' },
    product_id: { zh: '产品ID', en: 'Product ID' },
    
    // 备件特有字段
    app_sn: { zh: '适配序列号', en: 'Applicable SN.' },
    
    // 配件特有字段
    voltage_v: { zh: '电压', en: 'Voltage' },
    frequency_hz: { zh: '频率', en: 'Frequency' }
  };
  
  return labels[field] || { zh: field, en: field };
};

// 获取字段显示值的工具函数
export const getSmartFieldValue = (
  enhancedData: any, 
  baseField: string, 
  fallbackValue?: any
): {
  value: any;
  unit: string;
  formatted: string;
  label: { zh: string; en: string };
} | null => {
  if (!enhancedData?._display || !enhancedData._display[baseField]) {
    // 如果没有智能字段数据，尝试使用fallback
    if (fallbackValue !== undefined) {
      return {
        value: fallbackValue,
        unit: '',
        formatted: String(fallbackValue || ''),
        label: enhancedData?._labels?.[baseField] || { zh: baseField, en: baseField }
      };
    }
    return null;
  }
  
  const displayData = enhancedData._display[baseField];
  const label = enhancedData._labels?.[baseField] || { zh: baseField, en: baseField };
  
  return {
    ...displayData,
    label
  };
}; 