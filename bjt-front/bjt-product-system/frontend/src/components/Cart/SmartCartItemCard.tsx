import React from 'react';
import { useCartDisplayEnhancer, ProductType, getSmartFieldValue } from '../../hooks/useCartDisplayEnhancer';
import { useSmartUnitSystem } from '../../hooks/useSmartUnitSystem';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS, debugLog } from '../../config/feature-flags';
import './SmartCartItemCard.css';
import { getSimpleProductName } from '../../utils/simpleProductName';

interface CartItem {
  id: string;
  product: any;
  productType: ProductType;
  quantity: number;
  selected?: boolean;
}

interface SmartCartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleSelection?: (id: string, selected: boolean) => void;
  showSmartFields?: boolean; // 是否显示智能字段
}

export const SmartCartItemCard: React.FC<SmartCartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelection,
  showSmartFields = true
}) => {
  const { t, i18n } = useTranslation(['cart', 'products']);
  const { preferredUnitSystem, accountUnitSetting } = useSmartUnitSystem();
  const isTemporaryOverride = preferredUnitSystem !== accountUnitSetting;
  const enhancedProduct = useCartDisplayEnhancer(item.product, item.productType);
  
  const isCurrentLanguageZh = i18n.language === 'zh' || i18n.language === 'zh-CN';
  
  // 获取产品基本信息（统一使用 getSimpleProductName，确保中英文与fallback一致）
  const getProductName = () => {
    const lang: 'zh' | 'en' = isCurrentLanguageZh ? 'zh' : 'en';
    return getSimpleProductName(enhancedProduct ?? item.product, lang);
  };
  
  const getProductImage = () => {
    return enhancedProduct?.image_url || 
           item.product?.image_url || 
           '/images/default-product.png';
  };
  
  const getPartNumber = () => {
    return enhancedProduct?.part_number || 
           item.product?.part_number || 
           item.product?.code || 
           '';
  };
  
  // 渲染智能字段
  const renderSmartFields = () => {
    if (!showSmartFields || !FEATURE_FLAGS.CART_FIELD_ENHANCEMENT || !enhancedProduct?._display) {
      return null;
    }
    
    const fields = Object.keys(enhancedProduct._display);
    if (fields.length === 0) return null;
    
    return (
      <div className="smart-fields">
        {fields.map(baseField => {
          const fieldData = getSmartFieldValue(enhancedProduct, baseField);
          if (!fieldData) return null;
          
          return (
            <div key={baseField} className="smart-field-row">
              <span className="field-label">
                {isCurrentLanguageZh ? fieldData.label.zh : fieldData.label.en}:
              </span>
              <span className="field-value">
                {fieldData.formatted} {fieldData.unit}
              </span>
            </div>
          );
        })}
        
        {/* 单位制切换提示 */}
        {isTemporaryOverride && (
          <div className="unit-override-indicator">
            <small className="text-muted">
              {isCurrentLanguageZh ? '(临时切换单位制)' : '(Temporary unit override)'}
            </small>
          </div>
        )}
      </div>
    );
  };
  
  // 渲染基础信息
  const renderBasicInfo = () => (
    <div className="basic-info">
      <div className="product-name">{getProductName()}</div>
      {getPartNumber() && (
        <div className="part-number">
          <span className="label">
            {isCurrentLanguageZh ? '料号' : 'Part No.'}:
          </span>
          <span className="value">{getPartNumber()}</span>
        </div>
      )}
      
      {/* 产品类型特有字段 */}
      {item.productType === 'consumables' && enhancedProduct?.app_model && (
        <div className="applicable-machine">
          <span className="label">
            {isCurrentLanguageZh ? '适用机型' : 'Applicable Machine'}:
          </span>
          <span className="value">{enhancedProduct.app_model}</span>
        </div>
      )}
      
      {item.productType === 'machines' && enhancedProduct?.voltage && (
        <div className="voltage">
          <span className="label">
            {isCurrentLanguageZh ? '电压' : 'Voltage'}:
          </span>
          <span className="value">{enhancedProduct.voltage}V</span>
        </div>
      )}
    </div>
  );
  
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    onUpdateQuantity(item.id, newQuantity);
    
    debugLog('更新商品数量', {
      itemId: item.id,
      oldQuantity: item.quantity,
      newQuantity,
      productType: item.productType
    });
  };
  
  const handleRemove = () => {
    onRemoveItem(item.id);
    debugLog('删除购物车商品', { itemId: item.id, productType: item.productType });
  };
  
  const handleToggleSelection = () => {
    if (onToggleSelection) {
      onToggleSelection(item.id, !item.selected);
    }
  };
  
  return (
    <div className={`smart-cart-item ${item.selected ? 'selected' : ''}`}>
      {/* 选择框 */}
      {onToggleSelection && (
        <div className="selection-checkbox">
          <input
            type="checkbox"
            checked={item.selected || false}
            onChange={handleToggleSelection}
          />
        </div>
      )}
      
      {/* 商品图片 */}
      <div className="product-image">
        <img 
          src={getProductImage()} 
          alt={getProductName()}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/default-product.png';
          }}
        />
      </div>
      
      {/* 商品信息 */}
      <div className="product-info">
        {renderBasicInfo()}
        {renderSmartFields()}
      </div>
      
      {/* 数量控制 */}
      <div className="quantity-controls">
        <button 
          className="quantity-btn decrease"
          onClick={() => handleQuantityChange(-1)}
          disabled={item.quantity <= 1}
        >
          -
        </button>
        <span className="quantity-display">{item.quantity}</span>
        <button 
          className="quantity-btn increase"
          onClick={() => handleQuantityChange(1)}
        >
          +
        </button>
      </div>
      
      {/* 删除按钮 */}
      <div className="item-actions">
        <button 
          className="remove-btn"
          onClick={handleRemove}
          title={isCurrentLanguageZh ? '删除商品' : 'Remove item'}
        >
          {isCurrentLanguageZh ? '删除' : 'Remove'}
        </button>
      </div>
    </div>
  );
};

// 向后兼容的包装器
export const CartItemCard: React.FC<SmartCartItemCardProps> = (props) => {
  // 如果功能开关关闭，可以回退到原始逻辑
  if (!FEATURE_FLAGS.SMART_UNIT_SYSTEM && !FEATURE_FLAGS.CART_FIELD_ENHANCEMENT) {
    // 这里可以渲染原始的CartItemCard逻辑
    // 为了演示，我们仍然使用Smart版本但禁用增强功能
    return <SmartCartItemCard {...props} showSmartFields={false} />;
  }
  
  return <SmartCartItemCard {...props} />;
}; 