import { useMemo, useState, useEffect } from 'react';
import { useAuth, UnitSystem } from '../contexts/AuthContext';

export const useSmartUnitSystem = () => {
  const { getPreferredUnit } = useAuth();
  const [manualOverride, setManualOverride] = useState<UnitSystem | null>(null);
  
  // 获取最终的单位制偏好
  const preferredUnitSystem = useMemo((): UnitSystem => {
    // 1. 手动临时设置优先级最高
    if (manualOverride) {
      return manualOverride;
    }
    
    // 2. 用户账户设置
    const authPreference = getPreferredUnit?.();
    if (authPreference && ['metric', 'imperial'].includes(authPreference)) {
      return authPreference as UnitSystem;
    }
    
    // 3. 默认公制
    return 'metric';
  }, [manualOverride, getPreferredUnit]);
  
  // 智能字段选择 - 基于CSV标准字段映射
  const getSmartFieldKey = (baseField: string): string => {
    const fieldMappings: Record<string, Record<string, string>> = {
      // 包装尺寸字段
      'package_size': {
        metric: 'package_size_cm',
        imperial: 'package_size_inch'
      },
      // 重量字段  
      'net_weight': {
        metric: 'net_weight_kg',
        imperial: 'net_weight_lbs'
      },
      'gross_weight': {
        metric: 'gross_weight_kg', 
        imperial: 'gross_weight_lbs'
      },
      'pallet_gross_weight': {
        metric: 'pallet_gross_weight_kg',
        imperial: 'pallet_gross_weight_lbs'
      },
      // 托盘尺寸字段
      'pallet_size': {
        metric: 'pallet_size_cm',
        imperial: 'pallet_size_inch'
      },
      // 高度字段
      'stacking_height': {
        metric: 'stacking_height_cm',
        imperial: 'stacking_height_inch'
      },
      'pallet_height': {
        metric: 'pallet_height_cm',
        imperial: 'pallet_height_inch'
      },
      // 耗材特有字段
      'bubble_diameter': {
        metric: 'bubble_diameter_cm', 
        imperial: 'bubble_diameter_inch'
      },
      'film_width': {
        metric: 'film_width_cm',
        imperial: 'film_width_inch'
      },
      'bag_length': {
        metric: 'bag_length_cm',
        imperial: 'bag_length_inch'
      },
      'total_length': {
        metric: 'total_length_m',
        imperial: 'total_length_ft'
      },
      'tube_inner_diameter': {
        metric: 'tube_inner_diameter_cm',
        imperial: 'tube_inner_diameter_inch'
      },
      // 规格字段
      'spec': {
        metric: 'spec',
        imperial: 'spec_imperial'
      },
      'model': {
        metric: 'model_metric',
        imperial: 'model_imperial'
      },
      // 厚度字段
      'thickness': {
        metric: 'thickness_um',
        imperial: 'thickness_mil'
      }
    };
    
    const mapping = fieldMappings[baseField];
    return mapping ? mapping[preferredUnitSystem] : baseField;
  };
  
  // 临时切换单位制
  const setTemporaryUnit = (unit: UnitSystem | null) => {
    setManualOverride(unit);
    // 存储到sessionStorage，页面刷新后保持
    if (unit) {
      sessionStorage.setItem('temp_unit_override', unit);
    } else {
      sessionStorage.removeItem('temp_unit_override');
    }
  };
  
  // 初始化时恢复临时设置
  useEffect(() => {
    const tempUnit = sessionStorage.getItem('temp_unit_override') as UnitSystem | null;
    if (tempUnit && ['metric', 'imperial'].includes(tempUnit)) {
      setManualOverride(tempUnit);
    }
  }, []);
  
  // 获取字段对应的单位
  const getFieldUnit = (baseField: string): string => {
    const unitMappings: Record<string, Record<UnitSystem, string>> = {
      'package_size': { metric: 'cm', imperial: 'inch' },
      'net_weight': { metric: 'kg', imperial: 'lb' },
      'gross_weight': { metric: 'kg', imperial: 'lb' },
      'pallet_gross_weight': { metric: 'kg', imperial: 'lb' },
      'pallet_size': { metric: 'cm', imperial: 'inch' },
      'stacking_height': { metric: 'cm', imperial: 'inch' },
      'pallet_height': { metric: 'cm', imperial: 'inch' },
      'bubble_diameter': { metric: 'mm', imperial: 'inch' }, // ✅ 基于CSV：泡径用mm
      'film_width': { metric: 'cm', imperial: 'inch' },
      'bag_length': { metric: 'cm', imperial: 'inch' },
      'total_length': { metric: 'm', imperial: 'ft' },
      'tube_inner_diameter': { metric: 'cm', imperial: 'inch' },
      'thickness': { metric: 'μm / gsm', imperial: 'mil / lb' }, // ✅ 基于CSV标准
      'voltage': { metric: 'V', imperial: 'V' },
      'frequency': { metric: 'Hz', imperial: 'Hz' }
    };
    
    const mapping = unitMappings[baseField];
    return mapping ? mapping[preferredUnitSystem] : '';
  };
  
  return {
    preferredUnitSystem,
    getSmartFieldKey,
    getFieldUnit,
    setTemporaryUnit,
    isTemporaryOverride: !!manualOverride
  };
}; 