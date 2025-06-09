import React from 'react';
import { useConsumableFieldDisplay } from '../hooks/useConsumableFieldDisplay';
import { ConsumableProduct } from '../services/consumablesService';
import { CONSUMABLE_DISPLAY_CONFIG } from '../config/consumable-display-config';

// 单个字段显示组件
interface ConsumableFieldProps {
  item: ConsumableProduct;
  fieldKey: string;
  className?: string;
  showLabel?: boolean;
}

export const ConsumableField: React.FC<ConsumableFieldProps> = ({ 
  item, 
  fieldKey, 
  className = "", 
  showLabel = true 
}) => {
  const { getLocalizedValue, shouldShowField, getFieldLabel } = useConsumableFieldDisplay();
  
  if (!shouldShowField(item, fieldKey)) {
    return null;
  }
  
  const value = getLocalizedValue(item, fieldKey);  // 获取纯数值内容
  const label = getFieldLabel(fieldKey);            // 获取包含单位的标题
  
  if (!value) {
    return null;
  }
  
  return (
    <div className={`consumable-field ${className}`}>
      {showLabel && <span className="field-label">{label}:</span>}
      <span className="field-value">{value}</span>
    </div>
  );
};

// 产品图片字段显示组件
interface ConsumableImageProps {
  item: ConsumableProduct;
  alt?: string;
  className?: string;
}

export const ConsumableImage: React.FC<ConsumableImageProps> = ({ 
  item, 
  alt, 
  className = "" 
}) => {
  const { getLocalizedValue } = useConsumableFieldDisplay();
  
  const imageUrl = getLocalizedValue(item, 'image_url');
  const imageName = getLocalizedValue(item, 'name') || alt || 'Product Image';
  
  if (!imageUrl) {
    return (
      <div className={`consumable-image-placeholder ${className}`}>
        <span>No Image</span>
      </div>
    );
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={imageName} 
      className={`consumable-image ${className}`}
    />
  );
};

// 多字段显示组件
interface ConsumableFieldsProps {
  item: ConsumableProduct;
  fieldKeys: string[];
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
}

export const ConsumableFields: React.FC<ConsumableFieldsProps> = ({ 
  item, 
  fieldKeys, 
  className = "",
  layout = 'vertical'
}) => {
  const fields = fieldKeys.map((fieldKey, index) => (
    <ConsumableField 
      key={`${fieldKey}-${index}`}
      item={item} 
      fieldKey={fieldKey}
      className={`field-${fieldKey}`}
    />
  )).filter(Boolean);
  
  if (fields.length === 0) {
    return null;
  }
  
  return (
    <div className={`consumable-fields consumable-fields--${layout} ${className}`}>
      {fields}
    </div>
  );
};

// 商品列表字段显示组件
export const ConsumableProductList: React.FC<{ item: ConsumableProduct; className?: string }> = ({ 
  item, 
  className = "" 
}) => {
  return (
    <ConsumableFields 
      item={item}
      fieldKeys={CONSUMABLE_DISPLAY_CONFIG.STANDARD_FIELDS.PRODUCT_LIST}
      className={`product-list-fields ${className}`}
      layout="grid"
    />
  );
};

// 购物车字段显示组件
export const ConsumableCartItem: React.FC<{ item: ConsumableProduct; className?: string }> = ({ 
  item, 
  className = "" 
}) => {
  return (
    <ConsumableFields 
      item={item}
      fieldKeys={CONSUMABLE_DISPLAY_CONFIG.STANDARD_FIELDS.CART}
      className={`cart-item-fields ${className}`}
      layout="horizontal"
    />
  );
};

// Tooltip字段显示组件
export const ConsumableTooltip: React.FC<{ item: ConsumableProduct; className?: string }> = ({ 
  item, 
  className = "" 
}) => {
  return (
    <ConsumableFields 
      item={item}
      fieldKeys={CONSUMABLE_DISPLAY_CONFIG.STANDARD_FIELDS.TOOLTIP}
      className={`tooltip-fields ${className}`}
      layout="vertical"
    />
  );
};

// PO页字段显示组件
export const ConsumablePOPage: React.FC<{ item: ConsumableProduct; className?: string }> = ({ 
  item, 
  className = "" 
}) => {
  return (
    <ConsumableFields 
      item={item}
      fieldKeys={CONSUMABLE_DISPLAY_CONFIG.STANDARD_FIELDS.PO_PAGE}
      className={`po-page-fields ${className}`}
      layout="horizontal"
    />
  );
};

// 条件字段显示示例
export const ConsumableBubbleDiameter: React.FC<{ item: ConsumableProduct; className?: string }> = ({ 
  item, 
  className = "" 
}) => {
  const { shouldShowField } = useConsumableFieldDisplay();
  
  // 泡径字段只在气泡相关形状时显示
  if (!shouldShowField(item, 'bubble_diameter')) {
    return null;
  }
  
  return (
    <ConsumableField 
      item={item}
      fieldKey="bubble_diameter"
      className={`bubble-diameter-field ${className}`}
    />
  );
}; 