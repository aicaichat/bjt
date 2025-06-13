import React from 'react';
import { SmartFieldLabel } from './SmartFieldLabel';
import { SmartFieldValue } from './SmartFieldValue';

export const SmartFieldRow: React.FC<{
  product: any;
  fieldKey: string;
  label?: string;
  precision?: number;
  className?: string;
}> = ({ 
  product, 
  fieldKey, 
  label,
  precision = 2,
  className = ''
}) => {
  return (
    <div className={`smart-field-row flex justify-between ${className}`}>
      <SmartFieldLabel fieldKey={fieldKey} className="field-label">
        {label}
      </SmartFieldLabel>
      <SmartFieldValue 
        product={product} 
        fieldKey={fieldKey} 
        precision={precision}
        className="field-value"
      />
    </div>
  );
}; 