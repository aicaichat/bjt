import React from 'react';
import { useSmartFieldLabels } from '../hooks/useSmartFieldLabels';

export const SmartFieldLabel: React.FC<{
  fieldKey: string;
  children?: React.ReactNode;
  className?: string;
}> = ({ fieldKey, children, className = '' }) => {
  const { getSmartLabel, preferredUnitSystem } = useSmartFieldLabels();
  
  const label = getSmartLabel(fieldKey);
  
  return (
    <span 
      className={`smart-field-label ${className}`}
      key={`${fieldKey}-${preferredUnitSystem}`}
    >
      {children || label}
    </span>
  );
}; 