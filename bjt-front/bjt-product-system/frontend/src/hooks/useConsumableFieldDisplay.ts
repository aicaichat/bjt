import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CONSUMABLE_DISPLAY_CONFIG } from '../config/consumable-display-config';
import { useMaterials } from './useMockData';

/**
 * Consumable字段显示Hook
 * 支持智能单位制切换、多语言、条件显示
 * 遵循单位处理规范：单位在标题，内容纯数值
 */
export const useConsumableFieldDisplay = () => {
  const { getPreferredUnit } = useAuth(); // 获取用户单位制偏好
  const { t, i18n } = useTranslation();
  const { data: materialsData } = useMaterials(); // 获取材料数据
  
  const preferred_unit = getPreferredUnit(); // 获取偏好单位制
  
  // 智能单位制显示 - 基于用户偏好设置，返回纯数值
  const getSmartUnitValue = (item: any, fieldKey: string): string => {
    const unitConfig = CONSUMABLE_DISPLAY_CONFIG.UNIT_FIELDS[fieldKey];
    if (!unitConfig) {
      const value = item[fieldKey];
      return value !== null && value !== undefined && value !== '' ? String(value) : '';
    }
    
    // 基于用户单位制偏好，而非地区判断
    const isImperial = preferred_unit === 'imperial';
    const targetField = isImperial ? unitConfig.imperial : unitConfig.metric;
    const primaryValue = item[targetField];
    
    // Fallback机制：如果首选单位制的值不存在，使用另一个单位制的值
    if (primaryValue !== null && primaryValue !== undefined && primaryValue !== '') {
      // 复合尺寸格式处理
      if (unitConfig.fieldType === 'dimension') {
        return formatCompositeDimension(String(primaryValue));
      }
      // 数字类型直接转换为字符串，字符串类型直接返回（都不带单位）
      return typeof primaryValue === 'number' ? String(primaryValue) : String(primaryValue);
    }
    
    const fallbackField = isImperial ? unitConfig.metric : unitConfig.imperial;
    const fallbackValue = item[fallbackField];
    
    if (fallbackValue !== null && fallbackValue !== undefined && fallbackValue !== '') {
      if (unitConfig.fieldType === 'dimension') {
        return formatCompositeDimension(String(fallbackValue));
      }
      return typeof fallbackValue === 'number' ? String(fallbackValue) : String(fallbackValue);
    }
    
    return '';
  };
  
  // 获取本地化字段值 - 返回纯内容，不包含单位
  const getLocalizedValue = (item: any, fieldKey: string): string => {
    // 多语言字段处理
    if (fieldKey === 'name') {
      const locale = i18n.language;
      // 根据接口，使用name字段（这是英文名称新增需求对应的字段）
      const value = item.name || item[`name_${locale}`];
      return value ? String(value) : '';
    }
    
    // 🔥 新增：材料字段的多语言处理
    if (fieldKey === 'material') {
      const materialCode = item.material;
      if (!materialCode || !materialsData) {
        return materialCode ? String(materialCode) : '';
      }
      
      // 根据材料code查找对应的材料数据
      const materialInfo = materialsData.find((material: any) => 
        material.code === materialCode || material.id === materialCode
      );
      
      if (materialInfo) {
        // 根据当前语言返回对应的名称
        if (i18n.language.startsWith('zh')) {
          return materialInfo.name_zh || materialInfo.name_en || materialCode;
        } else {
          return materialInfo.name_en || materialInfo.name_zh || materialCode;
        }
      }
      
      // 如果没找到材料信息，返回原始code
      return String(materialCode);
    }
    
    // 智能单位制字段处理 - 只返回纯数值
    if (CONSUMABLE_DISPLAY_CONFIG.UNIT_FIELDS[fieldKey]) {
      return getSmartUnitValue(item, fieldKey);
    }
    
    // 特殊字段映射处理
    const fieldMapping: Record<string, string> = {
      'code': 'part_number',  // 料号对应part_number字段
      'image_url': 'image_url',
      'id': 'id',
      'pcs_per_box': 'pcs_per_box'
    };
    
    const actualField = fieldMapping[fieldKey] || fieldKey;
    const value = item[actualField];
    return value !== null && value !== undefined && value !== '' ? String(value) : '';
  };
  
  // 检查字段是否应该显示
  const shouldShowField = (item: any, fieldKey: string): boolean => {
    // 检查条件显示规则
    const conditionalConfig = CONSUMABLE_DISPLAY_CONFIG.CONDITIONAL_FIELDS[fieldKey];
    if (conditionalConfig && !conditionalConfig.condition(item)) {
      return false;
    }
    
    // 其他字段默认显示（如果有值）
    const value = getLocalizedValue(item, fieldKey);
    return value !== '';
  };
  
  // 获取字段显示标签 - 包含单位信息，使用翻译文件
  const getFieldLabel = (fieldKey: string): string => {
    const isImperial = preferred_unit === 'imperial';
    
    // 🔥 修复：使用翻译文件中的标签，支持带单位的字段
    const unitSystem = isImperial ? 'imperial' : 'metric';
    
    // 首先尝试获取带单位的翻译
    const withUnitKey = `consumable.fieldsWithUnits.${unitSystem}.${fieldKey}`;
    const withUnitTranslation = t(withUnitKey);
    
    // 如果翻译存在（不等于key本身），返回带单位的翻译
    if (withUnitTranslation && withUnitTranslation !== withUnitKey) {
      return withUnitTranslation;
    }
    
    // 否则使用基础字段翻译
    const basicKey = `consumable.fields.${fieldKey}`;
    const basicTranslation = t(basicKey);
    
    // 如果基础翻译存在，返回基础翻译
    if (basicTranslation && basicTranslation !== basicKey) {
      return basicTranslation;
    }
    
    // 最后的fallback：返回字段key的友好形式
    return fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // ❌ 废弃：不再需要getUnitText，单位已在标题中
  // 保留此方法为了向后兼容，但返回空字符串
  const getUnitText = (fieldKey: string): string => {
    return ''; // 单位现在在标题中，内容不显示单位
  };
  
  return {
    getLocalizedValue,     // 返回纯内容值，无单位
    shouldShowField,       // 检查字段是否应显示
    getFieldLabel,         // 返回包含单位的标题（使用翻译文件）
    getSmartUnitValue,     // 返回智能选择的纯数值
    getUnitText,           // 兼容性：返回空字符串
    isImperial: preferred_unit === 'imperial'
  };
};

// 复合尺寸格式处理工具函数
const formatCompositeDimension = (dimensionStr: string): string => {
  if (!dimensionStr) return '';
  
  // 常见尺寸格式处理
  const formats = [
    /^(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)$/, // 21*21*42
    /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/, // 21x21x42  
    /^(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)$/, // 21×21×42
    /^(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)$/, // 21*30 (二维)
    /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/, // 21x30 (二维)
  ];
  
  // 检查是否匹配已知格式，直接返回纯尺寸值（不加单位）
  for (const format of formats) {
    if (format.test(dimensionStr)) {
      return dimensionStr;  // 返回如"21*21*42"，不加单位
    }
  }
  
  // 单一数值
  if (/^\d+(?:\.\d+)?$/.test(dimensionStr)) {
    return dimensionStr;  // 返回如"50"，不加单位
  }
  
  // 其他格式直接返回
  return dimensionStr;
}; 