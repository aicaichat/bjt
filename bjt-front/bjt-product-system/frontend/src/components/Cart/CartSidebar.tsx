import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '../../config/appConfig';
import './CartSidebar.css';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    toggleItemSelection, 
    selectAll, 
    selectedTotal,
    isItemSelected,
    clearCart
  } = useCart();
  const { user } = useAuth();
  const preferredUnit = user?.preferred_unit || 'metric';
  const { t, i18n } = useTranslation(['spareParts', 'cart']);

  const hasItems = items.length > 0;
  const allSelected = hasItems && items.every(item => isItemSelected(item.id));

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 处理全选
  const handleSelectAll = () => {
    selectAll(!allSelected);
  };

  // 处理数量减少
  const handleDecreaseQuantity = (id: string, quantity: number) => {
    if (quantity > 1) {
      updateQuantity(id, quantity - 1);
    }
  };

  // 处理数量增加
  const handleIncreaseQuantity = (id: string, quantity: number) => {
    updateQuantity(id, quantity + 1);
  };

  // 处理单个商品选择状态切换
  const handleToggleItem = (id: string) => {
    toggleItemSelection(id, !isItemSelected(id));
  };

  // 处理清空购物车
  const handleClearCart = () => {
    setShowClearConfirm(true);
  };
  const handleConfirmClear = () => {
    clearCart();
    setShowClearConfirm(false);
  };
  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  // 阶梯价计算函数
  const getTieredPrice = (item: any) => {
    if (!item.priceTiers || item.priceTiers.length === 0) return item.price || 0;
    const qty = item.quantity || 1;
    const tier = item.priceTiers.find((t: { min: number; max: number | null; price: number }) => {
      if (t.max === null) return qty >= t.min;
      return qty >= t.min && qty <= t.max;
    });
    return tier ? tier.price : item.price || 0;
  };

  // 属性key到i18n key映射
  const propertyKeyMap: Record<string, string> = {
    part_number: 'partNumber',
    model: 'model',
    voltage: 'voltage',
    frequency: 'frequency',
    spec: 'spec',
    spec_imperial: 'specImperial',
    pcs_per_box: 'pcsPerBox',
    pcs_per_pallet: 'pcsPerPallet',
    package_size_cm: 'packageSize',
    package_size_inch: 'packageSize',
    pallet_size_cm: 'palletSize',
    pallet_size_inch: 'palletSize',
    net_weight_kg: 'netWeight',
    net_weight_lbs: 'netWeight',
    gross_weight_kg: 'grossWeight',
    gross_weight_lbs: 'grossWeight',
    brand: 'brand',
    unit: 'unit'
  };
  const getLabel = (key: string, t: any) => t(`products.properties.${propertyKeyMap[key] || key}`, key);
  const getValue = (value: any, t: any) => value && value !== 'N/A' && value !== 'Not Specified' ? value : t('products.defaultValues.notAvailable');

  // 渲染耗材详细信息
  const renderConsumableDetails = (item: any) => {
    const props = item.properties || {};
    
    return (
      <div className="consumable-details">
        <div className="detail-row">
          <span className="label">{getLabel('partNumber', t)}:</span>
          <span className="value">{getValue(props.part_number || item.part_number || props.code || item.code, t)}</span>
        </div>
        <div className="detail-row">
          <span className="label">{getLabel('brand', t)}:</span>
          <span className="value">{getValue(props.brand || item.brand, t)}</span>
        </div>
        <div className="detail-row">
          <span className="label">{getLabel('model', t)}:</span>
          <span className="value">
            {preferredUnit === 'metric' ? (getValue(props.model, t)) : (getValue(props.model_imperial || item.model_imperial || props.model || item.model, t))}
          </span>
        </div>
        <div className="detail-row">
          <span className="label">{getLabel('spec', t)}:</span>
          <span className="value">
            {preferredUnit === 'metric' ? (getValue(props.spec, t)) : (getValue(props.spec_imperial || item.spec_imperial || props.spec || item.spec, t))}
          </span>
        </div>
        {/* 耗材特有字段 */}
        {(props.material || (props.specs && props.specs.material)) && (
          <div className="detail-row">
            <span className="label">{getLabel('material', t)}:</span>
            <span className="value">{getValue(props.material || props.specs?.material || item.material, t)}</span>
          </div>
        )}
        {(props.width || (props.specs && props.specs.width)) && (
          <div className="detail-row">
            <span className="label">{getLabel('width', t)}:</span>
            <span className="value">{getValue(props.width || props.specs?.width || item.width, t)}</span>
          </div>
        )}
        {(props.length || (props.specs && props.specs.length)) && (
          <div className="detail-row">
            <span className="label">{getLabel('length', t)}:</span>
            <span className="value">{getValue(props.length || props.specs?.length || item.length, t)}</span>
          </div>
        )}
        {(props.rollLength || (props.specs && props.specs.rollLength)) && (
          <div className="detail-row">
            <span className="label">{getLabel('rollLength', t)}:</span>
            <span className="value">{getValue(props.rollLength || props.specs?.rollLength || item.rollLength, t)}</span>
          </div>
        )}
        {(props.thickness || (props.specs && props.specs.thickness)) && (
          <div className="detail-row">
            <span className="label">{getLabel('thickness', t)}:</span>
            <span className="value">{getValue(props.thickness || props.specs?.thickness || item.thickness, t)}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="label">{getLabel('productId', t)}:</span>
          <span className="value">{getValue(props.id || item.product_id || item.id, t)}</span>
        </div>
      </div>
    );
  };

  // 渲染备件详细信息
  const renderSparePartDetails = (item: any) => {
    const props = item.properties || {};
    const specs = item.specs || {};
    
    // 解析必选备件信息
    const parseRequiredParts = (
      requiredParts: string | string[] | null | undefined,
      requiredQuantity: string | string[] | null | undefined
    ): { part_number: string; quantity: number }[] => {
      if (!requiredParts || !requiredQuantity) {
        return [];
      }

      let partNumbers: string[] = [];
      let quantities: number[] = [];

      if (typeof requiredParts === 'string') {
        partNumbers = requiredParts.split(',').map(p => p.trim()).filter(p => p);
      } else if (Array.isArray(requiredParts)) {
        partNumbers = requiredParts.map(p => String(p).trim()).filter(p => p);
      } else {
        return [];
      }

      if (typeof requiredQuantity === 'string') {
        quantities = requiredQuantity.split(',').map(q => parseInt(q.trim(), 10)).filter(q => !isNaN(q));
      } else if (Array.isArray(requiredQuantity)) {
        quantities = requiredQuantity.map(q => parseInt(String(q).trim(), 10)).filter(q => !isNaN(q));
      } else {
        return [];
      }

      if (partNumbers.length !== quantities.length) {
        console.warn('必选备件料号和数量不匹配:', { requiredParts, requiredQuantity });
        return [];
      }

      return partNumbers.map((part_number, index) => ({
        part_number,
        quantity: quantities[index]
      }));
    };

    const requiredParts = parseRequiredParts(props.required_parts, props.required_quantity);
    
    return (
      <div className="spare-part-details">
        {/* 基本信息 */}
        <div className="detail-section">
          <div className="detail-row">
            <span className="label">{getLabel('partNumber', t)}:</span>
            <span className="value">{getValue(props.part_number || item.part_number, t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('model', t)}:</span>
            <span className="value">{getValue(props.model || specs.model || item.model || t('defaultValues.notAvailable'), t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('productId', t)}:</span>
            <span className="value">{getValue(props.product_id || item.product_id || item.id, t)}</span>
          </div>
        </div>

        {/* 适配信息 */}
        {(props.app_model || specs.app_model) && (
          <div className="detail-section">
            <div className="detail-row">
              <span className="label">{getLabel('appModel', t)}:</span>
              <span className="value app-model">{getValue(props.app_model || specs.app_model || item.app_model, t)}</span>
            </div>
          </div>
        )}

        {(props.app_sn || specs.app_sn) && (
          <div className="detail-row">
            <span className="label">{getLabel('appSn', t)}:</span>
            <span className="value app-sn">{getValue(props.app_sn || specs.app_sn || item.app_sn, t)}</span>
          </div>
        )}

        {/* 规格信息 */}
        <div className="detail-section">
          <div className="detail-row">
            <span className="label">{getLabel('spec', t)}:</span>
            <span className="value">
              {preferredUnit === 'metric' 
                ? getValue(props.spec || specs.spec || item.spec || t('defaultValues.notAvailable'), t)
                : getValue(props.spec_imperial || specs.spec_imperial || item.spec_imperial || t('defaultValues.notAvailable'), t)
              }
            </span>
          </div>
        </div>

        {/* 包装信息 */}
        {(props.pcs_per_box || specs.pcs_per_box) && (
          <div className="detail-row">
            <span className="label">{getLabel('pcsPerBox', t)}:</span>
            <span className="value">{getValue(props.pcs_per_box || specs.pcs_per_box || item.pcs_per_box, t)}</span>
          </div>
        )}

        {(props.unit || specs.unit) && (
          <div className="detail-row">
            <span className="label">{getLabel('unit', t)}:</span>
            <span className="value">{getValue(props.unit || specs.unit || item.unit, t)}</span>
          </div>
        )}

        {/* 易损件标识 */}
        {(props.is_consumable !== undefined || specs.is_consumable !== undefined) && (
          <div className="detail-row">
            <span className="label">{getLabel('type', t)}:</span>
            <span className="value">
              <span className="consumable-badge">
                {(props.is_consumable || specs.is_consumable) ? t('fields.consumable') : t('fields.standardPart')}
              </span>
            </span>
          </div>
        )}

        {/* 必选备件信息 */}
        {requiredParts.length > 0 && (
          <div className="detail-section">
            <div className="detail-row">
              <span className="label">{getLabel('requiredParts', t)}:</span>
              <span className="value">
                <div className="required-parts-list">
                  {requiredParts.map((reqPart, index) => (
                    <div key={index} className="required-part-item">
                      <span className="required-part-number">{reqPart.part_number}</span>
                      <span className="required-part-quantity">×{reqPart.quantity}</span>
                    </div>
                  ))}
                </div>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染主机详细信息
  const renderMachineDetails = (item: any) => {
    const props = item.properties || {};
    return (
      <div className="spare-part-details">
        <div className="detail-section">
          <div className="detail-row">
            <span className="label">{getLabel('partNumber', t)}:</span>
            <span className="value">{getValue(props.part_number || item.part_number, t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('model', t)}:</span>
            <span className="value">{getValue(props.model || item.model || t('defaultValues.notAvailable'), t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('voltage', t)}:</span>
            <span className="value">{getValue(props.voltage || item.voltage, t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('pcsPerBox', t)}:</span>
            <span className="value">{getValue(props.pcs_per_box || item.pcs_per_box, t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('pcsPerPallet', t)}:</span>
            <span className="value">{getValue(props.pcs_per_pallet || item.pcs_per_pallet, t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('packageSize', t)}:</span>
            <span className="value">{getValue(props.package_size_cm || item.package_size_cm, t)}</span>
          </div>
          <div className="detail-row">
            <span className="label">{getLabel('palletSize', t)}:</span>
            <span className="value">{getValue(props.pallet_size_cm || item.pallet_size_cm, t)}</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染配件详细信息
  const renderAccessoryDetails = (item: any) => {
    const getFieldValue = (field: string): string => {
      // 从item根级别获取
      if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
        return String(item[field]);
      }
      
      // 从properties获取
      if (item.properties && item.properties[field] !== undefined && item.properties[field] !== null && item.properties[field] !== '') {
        return String(item.properties[field]);
      }
      
      return '';
    };

    return (
      <div className="accessory-details">
        <div className="detail-row">
          <span className="detail-label">{t('properties.model', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('model') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.partNumber', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('part_number') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">PRODUCTID:</span>
          <span className="detail-value">
            {getFieldValue('product_id') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.voltage', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('voltage') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.frequency', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('frequency') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.pcsPerBox', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('pcs_per_box') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.pcsPerPallet', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('pcs_per_pallet') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.packageSizeCm', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('package_size_cm') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.packageSizeInch', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('package_size_inch') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.palletSizeCm', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('pallet_size_cm') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('properties.palletSizeInch', { ns: 'spareParts' })}:</span>
          <span className="detail-value">
            {getFieldValue('pallet_size_inch') || t('defaultValues.notAvailable', { ns: 'spareParts' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 背景遮罩 */}
      {isOpen && (
        <div className="cart-sidebar-overlay" onClick={onClose}></div>
      )}
      
      {/* 购物车侧边栏 */}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-sidebar-header">
          <h3 className="cart-sidebar-title">{t('shoppingCart', {ns: 'cart'})}</h3>
          <button className="cart-sidebar-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="cart-sidebar-body">
          {hasItems ? (
            <>
              <div className="cart-sidebar-select-all">
                <div 
                  className={`cart-checkbox ${allSelected ? 'checked' : ''}`}
                  onClick={handleSelectAll}
                >
                  {allSelected && <span className="checkbox-tick">✓</span>}
                </div>
                <span>{t('selectAll', {ns: 'cart'})}</span>
              </div>
              
              <div className="cart-sidebar-items">
                {items.map(item => (
                  <div key={item.id} className="cart-sidebar-item">
                    <div className="cart-item-checkbox">
                      <input
                        type="checkbox"
                        checked={isItemSelected(item.id)}
                        onChange={(e) => toggleItemSelection(item.id, e.target.checked)}
                      />
                    </div>
                    
                    <div className="cart-item-image">
                      <img src={(() => {
                        // 优先从 properties 取图片，再从 item 本身取
                        const props = item.properties || {};
                        return props.image_url || 
                               item.image_url || 
                               props.image || 
                               item.image || 
                               ASSETS.DEFAULT_IMAGE;
                      })()} alt={(() => {
                        // 获取商品名称用于 alt 属性
                        const props = item.properties || {};
                        if (i18n.language === 'zh') {
                          return props.name_zh || 
                                 item.name_zh || 
                                 props.name || 
                                 item.name ||
                                 props.code ||
                                 item.code ||
                                 props.part_number ||
                                 item.part_number ||
                                 item.id ||
                                 '商品';
                        } else {
                          return props.name_en || 
                                 item.name_en || 
                                 props.name || 
                                 item.name ||
                                 props.code ||
                                 item.code ||
                                 props.part_number ||
                                 item.part_number ||
                                 item.id ||
                                 'Product';
                        }
                      })()} />
                    </div>
                    
                    <div className="cart-item-details">
                      <div className="cart-item-title">{
                        (() => {
                          // 更强的商品名称获取逻辑，确保耗材名称能正确显示
                          const getDisplayName = (): string => {
                            const props = item.properties || {};
                            
                            if (i18n.language === 'zh') {
                              // 中文优先级：name_zh -> name -> code -> part_number -> id
                              return props.name_zh || 
                                     item.name_zh || 
                                     props.name || 
                                     item.name ||
                                     props.code ||
                                     item.code ||
                                     props.part_number ||
                                     item.part_number ||
                                     String(item.id) ||
                                     '商品';
                            } else {
                              // 英文优先级：name_en -> name -> code -> part_number -> id
                              return props.name_en || 
                                     item.name_en || 
                                     props.name || 
                                     item.name ||
                                     props.code ||
                                     item.code ||
                                     props.part_number ||
                                     item.part_number ||
                                     String(item.id) ||
                                     'Product';
                            }
                          };
                          
                          const displayName = getDisplayName();
                          
                          return displayName;
                        })()
                      }</div>
                      {/* 根据产品类型显示详细信息 */}
                      {item.product_type === 'consumable' && renderConsumableDetails(item)}
                      {item.product_type === 'spare_part' && renderSparePartDetails(item)}
                      {item.product_type === 'accessory' && renderAccessoryDetails(item)}
                      {["machine", "host", "设备"].includes(item.product_type) && renderMachineDetails(item)}
                      
                      <div className="cart-item-price">
                        <div className="unit-price">{t('unitPrice', {ns: 'cart'})}: ¥{getTieredPrice(item).toFixed(2)}</div>
                        <div className="subtotal">{t('subtotal', {ns: 'cart'})}: ¥{(getTieredPrice(item) * item.quantity).toFixed(2)}</div>
                      </div>
                      
                      <div className="cart-item-actions">
                        <div className="cart-item-quantity">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => handleIncreaseQuantity(item.id, item.quantity)}
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          className="cart-item-remove"
                          style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                          onClick={() => removeItem(item.id)}
                          title={t('remove', {ns: 'cart'})}
                        >
                          <span role="img" aria-label="delete">🗑️</span> {t('remove', {ns: 'cart'})}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="cart-empty">
              <p>{t('cart.emptyCartMessage', {ns: 'cart'})}</p>
            </div>
          )}
        </div>
        
        <div className="cart-sidebar-footer">
          <div className="cart-sidebar-total">
            <span>{t('total', {ns: 'cart'})}:</span>
            <span className="cart-sidebar-price">¥{(selectedTotal || 0).toFixed(2)}</span>
          </div>
          
          <div className="cart-sidebar-actions">
            <button
              className={`cart-sidebar-clear-btn${!hasItems ? ' disabled' : ''}`}
              onClick={handleClearCart}
              disabled={!hasItems}
              style={{
                border: '1px solid #ff4d4f',
                color: !hasItems ? '#ccc' : '#ff4d4f',
                background: 'transparent',
                cursor: !hasItems ? 'not-allowed' : 'pointer',
                borderRadius: 4,
                padding: '6px 16px',
                marginRight: 8
              }}
            >
              {t('clearCart', {ns: 'cart'})}
            </button>
            
            <Link 
              to="/cart" 
              className={`cart-sidebar-checkout-btn ${!hasItems ? 'disabled' : ''}`}
              onClick={onClose}
            >
              {t('checkout', {ns: 'cart'})}
            </Link>
          </div>
          {/* 清空购物车确认弹窗 */}
          {showClearConfirm && (
            <div className="cart-clear-confirm-modal">
              <div className="cart-clear-confirm-content">
                <div className="cart-clear-confirm-title">{t('cart.clearConfirmTitle', {ns: 'cart'})}</div>
                <div className="cart-clear-confirm-actions">
                  <button className="cart-clear-cancel-btn" onClick={handleCancelClear}>{t('cart.cancel', {ns: 'cart'})}</button>
                  <button className="cart-clear-confirm-btn" onClick={handleConfirmClear}>{t('cart.confirm', {ns: 'cart'})}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar; 