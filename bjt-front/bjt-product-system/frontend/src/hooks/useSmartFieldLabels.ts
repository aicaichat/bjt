import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSmartUnitSystem } from './useSmartUnitSystem';
import { CART_FIELD_CONFIGS, FIELD_UNIT_MAPPINGS } from './useSmartFieldMapping';

export const useSmartFieldLabels = () => {
  const { preferredUnitSystem } = useSmartUnitSystem();
  const { t } = useTranslation(['products', 'cart']);
  
  // 生成带单位的智能标签
  const getSmartLabel = useCallback((baseKey: string): string => {
    // 使用简化的翻译逻辑，与CartList中的getLabel保持一致
    let baseLabel: string;
    
    // 尝试从cart命名空间获取翻译
    try {
      const cartTranslation = t(`cart:fields.${baseKey}`);
      if (cartTranslation && cartTranslation !== `cart:fields.${baseKey}`) {
        baseLabel = cartTranslation;
      } else {
        throw new Error('Translation not found');
      }
    } catch (e) {
      // 如果翻译失败，使用默认标签映射
      const defaultLabels: Record<string, string> = {
        partNumber: '料号',
        part_number: '料号',
        model: '型号',
        voltage: '电压',
        frequency: '频率',
        spec: '规格',
        specImperial: '规格(英制)',
        pcsPerBox: '单箱数量',
        pcs_per_box: '单箱数量',
        pcsPerPallet: '一托数量',
        pcs_per_pallet: '一托数量',
        packageSize: '包装尺寸',
        package_size: '包装尺寸',
        palletSize: '托盘尺寸',
        pallet_size: '托盘尺寸',
        netWeight: '净重',
        net_weight: '净重',
        grossWeight: '毛重',
        gross_weight: '毛重',
        brand: '品牌',
        unit: '单位',
        compatibleModel: '适配机型',
        app_model: '适配机型',
        applicableSN: '适配序列号',
        app_sn: '适配序列号',
        filmWidth: '膜宽',
        film_width: '膜宽',
        bubbleDiameter: '气泡直径',
        bubble_diameter: '气泡直径'
      };
      baseLabel = defaultLabels[baseKey] || baseKey;
    }
    
    const fieldConfig = CART_FIELD_CONFIGS[baseKey as keyof typeof CART_FIELD_CONFIGS];
    
    if (!fieldConfig || !('unitConfig' in fieldConfig)) {
      return baseLabel; // 无单位制配置的字段直接返回基础标签
    }
    
    // 获取当前单位制对应的字段名
    const isImperial = preferredUnitSystem === 'imperial';
    const targetFieldName = isImperial ? 
      fieldConfig.unitConfig.imperial : 
      fieldConfig.unitConfig.metric;
    
    // 获取单位
    const unit = FIELD_UNIT_MAPPINGS[targetFieldName as keyof typeof FIELD_UNIT_MAPPINGS];
    
    return unit ? `${baseLabel}(${unit})` : baseLabel;
  }, [preferredUnitSystem, t]);
  
  // 获取字段对应的单位（不包含标签）
  const getFieldUnit = useCallback((baseKey: string): string => {
    const fieldConfig = CART_FIELD_CONFIGS[baseKey as keyof typeof CART_FIELD_CONFIGS];
    
    if (!fieldConfig || !('unitConfig' in fieldConfig)) {
      return '';
    }
    
    const isImperial = preferredUnitSystem === 'imperial';
    const targetFieldName = isImperial ? 
      fieldConfig.unitConfig.imperial : 
      fieldConfig.unitConfig.metric;
    
    return FIELD_UNIT_MAPPINGS[targetFieldName as keyof typeof FIELD_UNIT_MAPPINGS] || '';
  }, [preferredUnitSystem]);
  
  return { 
    getSmartLabel, 
    getFieldUnit,
    preferredUnitSystem 
  };
}; 