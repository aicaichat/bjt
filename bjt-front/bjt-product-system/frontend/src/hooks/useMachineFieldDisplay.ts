/**
 * 机器页面字段显示Hook
 * 基于耗材页面成功经验，使用getPreferredUnit()实现智能单位制切换
 * 
 * 核心功能：
 * 1. 智能单位制切换（基于AuthContext的getPreferredUnit()）
 * 2. 遵循单位处理规范：getLocalizedValue()返回纯数值，getFieldLabel()返回包含单位的标题
 * 3. 支持多语言字段映射
 * 4. 实现复合尺寸格式处理（如"75*35*45"）
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { MachinePart } from '../types/machines';
import { 
  MACHINE_FIELD_CONFIGS, 
  MACHINE_DISPLAY_SCENARIOS, 
  MACHINE_FIELD_LABELS,
  MACHINE_FEATURE_FLAGS,
  MachineFieldConfig,
  MachineDisplayScenario
} from '../config/machine-display-config';

// 字段显示结果接口
export interface MachineFieldDisplayResult {
  key: string;
  label: string;        // 包含单位的标题
  value: string;        // 纯数值内容
  rawValue: any;        // 原始数据值
  dataType: string;     // 数据类型
  isEmpty: boolean;     // 是否为空值
  fieldConfig: MachineFieldConfig;
}

// Hook配置接口
export interface UseMachineFieldDisplayOptions {
  scenario?: string;    // 显示场景：productCard, tooltip, cart, po
  enableDebug?: boolean; // 是否启用调试模式
}

/**
 * 机器页面字段显示Hook
 * 基于AuthContext的getPreferredUnit()实现智能单位制切换
 */
export const useMachineFieldDisplay = (options: UseMachineFieldDisplayOptions = {}) => {
  const { i18n } = useTranslation();
  const { getPreferredUnit } = useAuth();
  
  const {
    scenario = 'productCard',
    enableDebug = MACHINE_FEATURE_FLAGS.ENABLE_DEBUG_INFO
  } = options;

  // 获取用户首选单位制（基于AuthContext）
  const preferredUnit = getPreferredUnit(); // 'metric' | 'imperial'
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
  
  if (enableDebug) {
    console.log('[useMachineFieldDisplay] 初始化配置:', {
      scenario,
      preferredUnit,
      currentLanguage,
      enableSmartUnitSystem: MACHINE_FEATURE_FLAGS.ENABLE_SMART_UNIT_SYSTEM
    });
  }

  /**
   * 格式化复合尺寸值（如"75*35*45"）
   * 保持原有格式，不添加单位后缀
   */
  const formatCompositeDimension = (dimensionStr: string): string => {
    if (!dimensionStr || typeof dimensionStr !== 'string') {
      return '';
    }
    
    // 支持各种分隔符格式：75*35*45, 29.5x13.8x17.7, 120*100*110
    const cleanDimension = dimensionStr.trim();
    
    // 验证是否为有效的尺寸格式
    const dimensionPattern = /^[\d.]+[\*x×][\d.]+[\*x×]?[\d.]*$/;
    if (dimensionPattern.test(cleanDimension)) {
      return cleanDimension; // 返回纯尺寸值，不含单位
    }
    
    // 如果是单一数值
    const singleNumberPattern = /^\d+(\.\d+)?$/;
    if (singleNumberPattern.test(cleanDimension)) {
      return cleanDimension;
    }
    
    return cleanDimension;
  };

  /**
   * 获取本地化字段值（纯数值，无单位）
   * 遵循单位处理规范：返回纯数值内容
   */
  const getLocalizedValue = (machine: MachinePart, fieldConfig: MachineFieldConfig): string => {
    const { key, unitConfig, formatType, dataType } = fieldConfig;
    
    let targetField = key;
    let rawValue: any;

    // 智能单位制字段选择
    if (unitConfig && MACHINE_FEATURE_FLAGS.ENABLE_SMART_UNIT_SYSTEM) {
      const isImperial = preferredUnit === 'imperial';
      targetField = isImperial ? unitConfig.imperial : unitConfig.metric;
      
      if (enableDebug) {
        console.log(`[getLocalizedValue] 智能单位制选择:`, {
          originalField: key,
          preferredUnit,
          selectedField: targetField,
          metricField: unitConfig.metric,
          imperialField: unitConfig.imperial
        });
      }
    }

    // 获取原始值
    rawValue = machine[targetField];
    
    // 空值处理
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '';
    }

    // 根据格式类型处理数值
    switch (formatType) {
      case 'dimension':
        // 尺寸类型：支持复合格式，返回纯数值/尺寸
        if (dataType === 'composite') {
          return formatCompositeDimension(String(rawValue));
        }
        return String(rawValue);
        
      case 'weight':
      case 'quantity':
        // 重量和数量类型：返回纯数值
        if (typeof rawValue === 'number') {
          return rawValue.toString();
        }
        const numValue = parseFloat(String(rawValue));
        return isNaN(numValue) ? String(rawValue) : numValue.toString();
        
      default:
        // 默认处理：字符串直接返回，数值转换为字符串
        return String(rawValue);
    }
  };

  /**
   * 获取字段标签（包含单位的标题）
   * 遵循单位处理规范：返回包含单位的标题
   */
  const getFieldLabel = (fieldConfig: MachineFieldConfig): string => {
    const { key, unitConfig } = fieldConfig;
    
    let targetField = key;
    
    // 智能单位制标签选择
    if (unitConfig && MACHINE_FEATURE_FLAGS.ENABLE_SMART_UNIT_SYSTEM) {
      const isImperial = preferredUnit === 'imperial';
      targetField = isImperial ? unitConfig.imperial : unitConfig.metric;
    }
    
    // 从标签配置中获取本地化标签
    const labelConfig = MACHINE_FIELD_LABELS[currentLanguage];
    const label = labelConfig?.[targetField] || targetField;
    
    if (enableDebug) {
      console.log(`[getFieldLabel] 标签生成:`, {
        originalField: key,
        targetField,
        currentLanguage,
        label
      });
    }
    
    return label;
  };

  /**
   * 格式化单个字段显示
   */
  const formatFieldDisplay = (machine: MachinePart, fieldConfig: MachineFieldConfig): MachineFieldDisplayResult => {
    const value = getLocalizedValue(machine, fieldConfig);
    const label = getFieldLabel(fieldConfig);
    const rawValue = machine[fieldConfig.key];
    const isEmpty = !value || value === '';
    
    const result: MachineFieldDisplayResult = {
      key: fieldConfig.key,
      label,
      value,
      rawValue,
      dataType: fieldConfig.dataType,
      isEmpty,
      fieldConfig
    };
    
    if (enableDebug) {
      console.log(`[formatFieldDisplay] 字段格式化结果:`, result);
    }
    
    return result;
  };

  /**
   * 获取场景配置
   */
  const getScenarioConfig = (scenarioName: string): MachineDisplayScenario => {
    const scenarioConfig = MACHINE_DISPLAY_SCENARIOS[scenarioName];
    if (!scenarioConfig) {
      console.warn(`[useMachineFieldDisplay] 未找到场景配置: ${scenarioName}`);
      return MACHINE_DISPLAY_SCENARIOS.productCard; // 默认配置
    }
    return scenarioConfig;
  };

  /**
   * 格式化机器所有字段（基于场景）
   */
  const formatMachineFields = useMemo(() => {
    return (machine: MachinePart, scenarioName: string = scenario): MachineFieldDisplayResult[] => {
      if (!machine) {
        console.warn('[formatMachineFields] 机器数据为空');
        return [];
      }

      const scenarioConfig = getScenarioConfig(scenarioName);
      
      const formattedFields = scenarioConfig.fields.map(fieldConfig => {
        try {
          return formatFieldDisplay(machine, fieldConfig);
        } catch (error) {
          console.error(`[formatMachineFields] 字段格式化失败: ${fieldConfig.key}`, error);
          return {
            key: fieldConfig.key,
            label: fieldConfig.key,
            value: '',
            rawValue: null,
            dataType: fieldConfig.dataType,
            isEmpty: true,
            fieldConfig
          };
        }
      });

      if (enableDebug) {
        console.log(`[formatMachineFields] 场景 ${scenarioName} 格式化完成:`, {
          machineId: machine.id,
          fieldsCount: formattedFields.length,
          emptyFieldsCount: formattedFields.filter(f => f.isEmpty).length
        });
      }

      return formattedFields;
    };
  }, [scenario, preferredUnit, currentLanguage, enableDebug]);

  /**
   * 格式化单个字段（便捷方法）
   */
  const formatSingleField = useMemo(() => {
    return (machine: MachinePart, fieldKey: string): MachineFieldDisplayResult | null => {
      const fieldConfig = MACHINE_FIELD_CONFIGS[fieldKey];
      if (!fieldConfig) {
        console.warn(`[formatSingleField] 未找到字段配置: ${fieldKey}`);
        return null;
      }
      
      return formatFieldDisplay(machine, fieldConfig);
    };
  }, [preferredUnit, currentLanguage, enableDebug]);

  /**
   * 验证字段显示标准
   * 检查是否符合"标题含单位，内容纯数值"的规范
   */
  const validateDisplayStandard = (fields: MachineFieldDisplayResult[]): { 
    isValid: boolean; 
    issues: string[] 
  } => {
    const issues: string[] = [];
    
    fields.forEach(field => {
      // 检查标题是否包含适当的单位信息
      if (field.fieldConfig.unitConfig) {
        const hasUnitInLabel = /(kg|lbs|cm|inch|件|pcs|\(|\))/.test(field.label);
        if (!hasUnitInLabel) {
          issues.push(`字段 ${field.key} 的标题缺少单位信息`);
        }
      }
      
      // 检查值是否为纯数值（排除复合尺寸格式）
      if (field.value && field.fieldConfig.formatType !== 'dimension') {
        const hasUnitInValue = /(kg|lbs|cm|inch|件|pcs)$/.test(field.value);
        if (hasUnitInValue) {
          issues.push(`字段 ${field.key} 的值包含单位，造成重复显示`);
        }
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // 返回Hook接口
  return {
    // 核心格式化方法
    formatMachineFields,
    formatSingleField,
    
    // 便捷方法
    getLocalizedValue: (machine: MachinePart, fieldKey: string) => {
      const fieldConfig = MACHINE_FIELD_CONFIGS[fieldKey];
      return fieldConfig ? getLocalizedValue(machine, fieldConfig) : '';
    },
    
    getFieldLabel: (fieldKey: string) => {
      const fieldConfig = MACHINE_FIELD_CONFIGS[fieldKey];
      return fieldConfig ? getFieldLabel(fieldConfig) : fieldKey;
    },
    
    // 配置信息
    currentConfig: {
      scenario,
      preferredUnit,
      currentLanguage,
      enableSmartUnitSystem: MACHINE_FEATURE_FLAGS.ENABLE_SMART_UNIT_SYSTEM
    },
    
    // 场景配置
    getScenarioConfig,
    availableScenarios: Object.keys(MACHINE_DISPLAY_SCENARIOS),
    
    // 工具方法
    formatCompositeDimension,
    validateDisplayStandard,
    
    // 调试信息
    debugInfo: enableDebug ? {
      fieldConfigs: MACHINE_FIELD_CONFIGS,
      scenarios: MACHINE_DISPLAY_SCENARIOS,
      labels: MACHINE_FIELD_LABELS[currentLanguage]
    } : undefined
  };
}; 