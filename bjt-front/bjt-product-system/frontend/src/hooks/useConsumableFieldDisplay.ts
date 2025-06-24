import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CONSUMABLE_DISPLAY_CONFIG } from '../config/consumable-display-config';

/**
 * Consumable字段显示Hook
 * 支持智能单位制切换、多语言、条件显示
 * 遵循单位处理规范：单位在标题，内容纯数值
 */

// 添加Hook参数接口
interface UseConsumableFieldDisplayProps {
  shapesData?: any[]; // API返回的shapes数据
  materialsData?: any[]; // API返回的materials数据
}

// 更新Hook定义以接受字典数据
export const useConsumableFieldDisplay = ({ 
  shapesData = [], 
  materialsData = [] 
}: UseConsumableFieldDisplayProps = {}) => {
  const { getPreferredUnit } = useAuth(); // 获取用户单位制偏好
  const { t, i18n } = useTranslation(['consumables', 'common']);
  
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
    
    // 🔥 新增：形状字段的多语言处理 - 使用API字典数据
    if (fieldKey === 'shape') {
      const shapeCode = item.shape || item.bag_type;
      if (!shapeCode) {
        return '';
      }
      
      // 🚀 优先使用API字典数据
      if (shapesData && shapesData.length > 0) {
        const shapeInfo = shapesData.find((shape: any) => 
          shape.id === shapeCode || 
          shape.code === shapeCode
        );
        
        if (shapeInfo) {
          // 根据当前语言返回对应的名称
          if (i18n.language.startsWith('zh')) {
            return shapeInfo.name_zh || shapeInfo.name || shapeCode;
          } else {
            return shapeInfo.name_en || shapeInfo.name || shapeCode;
          }
        }
      }
      
      // 🔙 Fallback: 硬编码映射（向后兼容）
      const fallbackShapeMapping: Record<string, { name_zh: string; name_en: string }> = {
        'MEX': { name_zh: '气泡枕', name_en: 'Pillow' },
        'MEY': { name_zh: '开口气泡枕', name_en: 'Precut Air Pillow' },
        'MFB': { name_zh: '葫芦膜', name_en: 'Bubble' }, // 🔥 修正：从API数据显示MFB应该是"Bubble"而不是"paper Bubble"
        'MFC': { name_zh: '气枕膜', name_en: 'Tube' },
        'MFF': { name_zh: '气泡膜', name_en: 'Bubble' },
        'MEX-PAPER': { name_zh: '纸质气垫枕', name_en: 'paper air Pillow' },
        // 兼容性映射（处理直接使用英文名称的情况）
        'Pillow': { name_zh: '气泡枕', name_en: 'Pillow' },
        'Precut Air Pillow': { name_zh: '开口气泡枕', name_en: 'Precut Air Pillow' },
        'paper Bubble': { name_zh: '纸质气泡膜', name_en: 'paper Bubble' },
        'Tube': { name_zh: '气枕膜', name_en: 'Tube' },
        'Bubble': { name_zh: '葫芦膜', name_en: 'Bubble' }, // 🔥 修正：统一为"Bubble"
        'paper air Pillow': { name_zh: '纸质气垫枕', name_en: 'paper air Pillow' }
      };
      
      const fallbackInfo = fallbackShapeMapping[shapeCode];
      if (fallbackInfo) {
        // 根据当前语言返回对应的名称
        if (i18n.language.startsWith('zh')) {
          return fallbackInfo.name_zh;
        } else {
          return fallbackInfo.name_en;
        }
      }
      
      // 如果没找到映射，返回原始代码
      return String(shapeCode);
    }
    
    // 🔥 新增：材料字段的多语言处理 - 使用API字典数据
    if (fieldKey === 'material') {
      const materialCode = item.material;
      console.log('🔍 [Material Debug] Processing material:', {
        materialCode,
        materialsDataLength: materialsData?.length || 0,
        currentLanguage: i18n.language,
        materialsDataSample: materialsData?.slice(0, 2)
      });
      
      if (!materialCode) {
        console.log('❌ [Material Debug] No material code found');
        return '';
      }
      
      // 🚀 优先使用API字典数据
      if (materialsData && materialsData.length > 0) {
        const materialInfo = materialsData.find((material: any) => 
          material.id === materialCode || 
          material.code === materialCode
        );
        
        console.log('🔍 [Material Debug] Material lookup result:', {
          materialCode,
          materialInfo,
          found: !!materialInfo
        });
        
        if (materialInfo) {
          // 根据当前语言返回对应的名称
          if (i18n.language.startsWith('zh')) {
            const result = materialInfo.name_zh || materialInfo.name || materialCode;
            console.log('🇨🇳 [Material Debug] Chinese result:', result);
            return result;
          } else {
            const result = materialInfo.name_en || materialInfo.name || materialCode;
            console.log('🇺🇸 [Material Debug] English result:', result);
            return result;
          }
        } else {
          console.log('❌ [Material Debug] Material not found in dictionary');
        }
      } else {
        console.log('❌ [Material Debug] No materials data available');
      }
      
      // 🔙 Fallback: 硬编码映射（向后兼容）
      const fallbackMaterialMapping: Record<string, { name_zh: string; name_en: string }> = {
        'HDPE': { name_zh: 'HDPE', name_en: 'HDPE' },
        'LDPE': { name_zh: 'LDPE', name_en: 'LDPE' },
        'PAPER': { name_zh: '纸塑膜', name_en: 'PAPER' },
        'PAPER+PE': { name_zh: '纸塑复合', name_en: 'PAPER+PE' },
        'NYLON': { name_zh: '尼龙', name_en: 'NYLON' },
        'PAPE': { name_zh: 'PAPE共挤膜', name_en: 'PAPE' },
        '30% HDPE': { name_zh: '30% HDPE', name_en: '30% HDPE' },
        '50% HDPE': { name_zh: '50%回料HDPE', name_en: '50% HDPE' },
        '50% LDPE': { name_zh: '50% LDPE', name_en: '50% LDPE' }
      };
      
      const fallbackInfo = fallbackMaterialMapping[materialCode];
      if (fallbackInfo) {
        console.log('🔙 [Material Debug] Using fallback mapping:', {
          materialCode,
          fallbackInfo,
          language: i18n.language
        });
        // 根据当前语言返回对应的名称
        if (i18n.language.startsWith('zh')) {
          return fallbackInfo.name_zh;
        } else {
          return fallbackInfo.name_en;
        }
      }
      
      // 如果没找到映射，返回原始code
      console.log('❌ [Material Debug] No mapping found, returning raw code:', materialCode);
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