import React from 'react';
import { useCartDisplayEnhancer, ProductType } from '../../hooks/useCartDisplayEnhancer';
import { FEATURE_FLAGS, debugLog } from '../../config/feature-flags';

interface SmartAddToCartButtonProps {
  product: any;
  productType: ProductType;
  onAddToCart: (product: any) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showEnhancedInfo?: boolean; // 是否显示增强信息
}

export const SmartAddToCartButton: React.FC<SmartAddToCartButtonProps> = ({
  product,
  productType,
  onAddToCart,
  children,
  className = '',
  disabled = false,
  showEnhancedInfo = false
}) => {
  const enhancedProduct = useCartDisplayEnhancer(product, productType);
  
  const handleClick = () => {
    // 🔑 关键：始终传递原始数据给现有的处理函数，保持完全兼容
    onAddToCart(product);
    
    // 调试信息
    debugLog('添加商品到购物车', {
      productType,
      originalData: product,
      enhancedData: enhancedProduct,
      smartFields: enhancedProduct?._display
    });
  };
  
  return (
    <button 
      onClick={handleClick}
      disabled={disabled}
      className={`add-to-cart-btn ${className}`}
      type="button"
      data-add-to-cart-anchor={product?.id != null ? String(product.id) : undefined}
      data-product-type={productType}
      data-enhanced={FEATURE_FLAGS.CART_FIELD_ENHANCEMENT ? 'true' : 'false'}
      title={enhancedProduct?._unitContext ? 
        `当前单位制: ${enhancedProduct._unitContext.preferredUnitSystem === 'metric' ? '公制' : '英制'}` : 
        undefined
      }
    >
      {children || '添加到购物车'}
      
      {/* 可选的增强信息显示 */}
      {showEnhancedInfo && FEATURE_FLAGS.CART_FIELD_ENHANCEMENT && enhancedProduct?._display && (
        <div className="enhanced-info-tooltip">
          {Object.entries(enhancedProduct._display).map(([field, data]: [string, any]) => (
            <div key={field} className="enhanced-field">
              <span className="field-label">{enhancedProduct._labels[field]?.zh}:</span>
              <span className="field-value">{data.formatted} {data.unit}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
};

// 向后兼容的包装器组件
export const AddToCartButton: React.FC<SmartAddToCartButtonProps> = (props) => {
  // 如果功能开关关闭，可以在这里回退到原始组件
  if (!FEATURE_FLAGS.SMART_UNIT_SYSTEM && !FEATURE_FLAGS.CART_FIELD_ENHANCEMENT) {
    // 回退到基础按钮
    return (
      <button 
        type="button"
        onClick={() => props.onAddToCart(props.product)}
        disabled={props.disabled}
        className={`add-to-cart-btn ${props.className || ''}`}
        data-add-to-cart-anchor={props.product?.id != null ? String(props.product.id) : undefined}
        data-product-type={props.productType}
      >
        {props.children || '添加到购物车'}
      </button>
    );
  }
  
  return <SmartAddToCartButton {...props} />;
}; 