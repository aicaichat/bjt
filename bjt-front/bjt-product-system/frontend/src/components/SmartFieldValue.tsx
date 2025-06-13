import React, { useMemo } from 'react';
import { useSmartFieldMapping } from '../hooks/useSmartFieldMapping';

export interface SmartFieldValueProps {
  product: any;
  fieldKey: string;
  precision?: number;
  className?: string;
}

export const SmartFieldValue: React.FC<SmartFieldValueProps> = React.memo(({ 
  product, 
  fieldKey, 
  precision = 2,
  className = ''
}) => {
  const { getSmartFieldMapping, preferredUnitSystem } = useSmartFieldMapping();
  
  // 使用 useMemo 确保当单位制变化时重新计算
  const { targetField, rawValue, displayValue } = useMemo(() => {
    const targetField = getSmartFieldMapping(fieldKey, product);
    
    // 尝试从多个可能的字段获取值
    let rawValue = product[targetField];
    
    // 如果目标字段没有值，尝试从properties中获取
    if ((rawValue === undefined || rawValue === null || rawValue === '') && product.properties) {
      rawValue = product.properties[targetField];
    }
    
    // 如果还是没有值，尝试原始字段名
    if ((rawValue === undefined || rawValue === null || rawValue === '') && targetField !== fieldKey) {
      rawValue = product[fieldKey] || (product.properties && product.properties[fieldKey]);
    }
    
    // 如果没有值，返回空
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return { targetField, rawValue, displayValue: 'N/A' };
    }
    
    // 显示纯净数值（不包含单位）
    let displayValue: string;
    if (typeof rawValue === 'number') {
      displayValue = rawValue.toFixed(precision);
    } else if (typeof rawValue === 'string') {
      // 处理字符串类型的数据
      if (rawValue === 'N/A' || rawValue.toLowerCase() === 'n/a') {
        displayValue = 'N/A';
      } else {
        displayValue = rawValue;
      }
    } else {
      displayValue = String(rawValue);
    }
    
    return { targetField, rawValue, displayValue };
  }, [fieldKey, product, precision, getSmartFieldMapping, preferredUnitSystem]);
  
  return (
    <span 
      className={`smart-field-value ${className}`} 
      data-field={targetField}
      data-unit-system={preferredUnitSystem}
      key={`${fieldKey}-${preferredUnitSystem}-${targetField}`}
    >
      {displayValue}
    </span>
  );
}); 