import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '../../config/appConfig';
import './CartSidebar.css';
import { getSimpleProductName } from '../../utils/simpleProductName';

interface EnhancedCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// 基于字段映射标准的字段配置
const CART_FIELD_CONFIGS = {
  // 机器字段配置 - 基于官方标准
  machines: {
    // 购物车显示字段 (9个)
    model: { 
      key: 'model', 
      displayName: { zh: '型号', en: 'Model' }, 
      priority: 1,
      unitConfig: { metric: 'model', imperial: 'model_imperial' }
    },
    voltage: { key: 'voltage', displayName: { zh: '电压', en: 'Voltage' }, priority: 2, unit: 'V' },
    part_number: { key: 'part_number', displayName: { zh: '料号', en: 'Part No.' }, priority: 3 },
    pcs_per_box: { key: 'pcs_per_box', displayName: { zh: '单箱数量', en: 'Qty per Carton' }, priority: 4 },
    pallet_size: { 
      key: 'pallet_size', 
      displayName: { zh: '托盘尺寸', en: 'Pallet Size' }, 
      priority: 5,
      unitConfig: { metric: 'pallet_size_cm', imperial: 'pallet_size_inch' }
    },
    pcs_per_pallet: { key: 'pcs_per_pallet', displayName: { zh: '一托数量', en: 'Packs per Pallet' }, priority: 6 },
    // Tooltip字段
    package_size: { 
      key: 'package_size', 
      displayName: { zh: '包装尺寸', en: 'Package Size' }, 
      unitConfig: { metric: 'package_size_cm', imperial: 'package_size_inch' }
    },
    net_weight: { 
      key: 'net_weight', 
      displayName: { zh: '单件净重', en: 'Net Weight' }, 
      unitConfig: { metric: 'net_weight_kg', imperial: 'net_weight_lbs' }
    }
  },
  
  // 耗材字段配置 - 基于官方标准
  consumables: {
    // 购物车显示字段 (12个)
    app_model: { key: 'app_model', displayName: { zh: '适用机型', en: 'Applicable Machine' }, priority: 1 },
    part_number: { key: 'part_number', displayName: { zh: '料号', en: 'Part No.' }, priority: 2 },
    model: { 
      key: 'model', 
      displayName: { zh: '型号', en: 'Model' }, 
      priority: 3,
      unitConfig: { metric: 'model_metric', imperial: 'model_imperial' }
    },
    spec: { 
      key: 'spec', 
      displayName: { zh: '规格', en: 'Spec.' }, 
      unitConfig: { metric: 'spec', imperial: 'spec_imperial' },
      priority: 4
    },
    bubble_diameter: { 
      key: 'bubble_diameter', 
      displayName: { zh: '泡径', en: 'Bubble Dia.' }, 
      priority: 5,
      unitConfig: { metric: 'bubble_diameter_cm', imperial: 'bubble_diameter_inch' }
    },
    pcs_per_box: { key: 'pcs_per_box', displayName: { zh: '单箱数量', en: 'Qty per Carton' }, priority: 6 },
    // Tooltip字段
    material: { key: 'material', displayName: { zh: '材质', en: 'Material' } },
    thickness: { 
      key: 'thickness', 
      displayName: { zh: '厚度/克重', en: 'Thickness/Basis Weight' },
      unitConfig: { metric: 'thickness_um', imperial: 'thickness_mil' }
    },
    film_width: { 
      key: 'film_width', 
      displayName: { zh: '宽度', en: 'Width' },
      unitConfig: { metric: 'film_width_cm', imperial: 'film_width_inch' }
    },
    bag_length: { 
      key: 'bag_length', 
      displayName: { zh: '袋长', en: 'Perforation' },
      unitConfig: { metric: 'bag_length_cm', imperial: 'bag_length_inch' }
    },
    total_length: { 
      key: 'total_length', 
      displayName: { zh: '总长', en: 'Length' },
      unitConfig: { metric: 'total_length_m', imperial: 'total_length_ft' }
    }
  },
  
  // 备件字段配置 - 基于官方标准 🔧 修复：使用智能单位制字段配置
  spare_parts: {
    // 购物车显示字段 (8个) - 智能单位制版本
    app_model: { key: 'app_model', displayName: { zh: '适用机型', en: 'Applicable Machine' }, priority: 1 },
    part_number: { key: 'part_number', displayName: { zh: '料号', en: 'Part No.' }, priority: 2 },
    name: { key: 'name', displayName: { zh: '名称', en: 'Item' }, priority: 3 },
    spec: { key: 'spec', displayName: { zh: '规格', en: 'Spec.' }, priority: 4, unitConfig: { metric: 'spec', imperial: 'spec_imperial' } },
    app_sn: { key: 'app_sn', displayName: { zh: '适配序列号', en: 'Applicable SN.' }, priority: 5 },
    package_size: { 
      key: 'package_size', 
      displayName: { zh: '包装尺寸', en: 'Package Size' }, 
      priority: 6,
      unitConfig: { metric: 'package_size_cm', imperial: 'package_size_inch' }
    },
    unit: { key: 'unit', displayName: { zh: '单位', en: 'Unit' }, priority: 7 },
    net_weight: { 
      key: 'net_weight', 
      displayName: { zh: '单件净重', en: 'Net Weight' }, 
      priority: 8,
      unitConfig: { metric: 'net_weight_kg', imperial: 'net_weight_lbs' }
    },
    pcs_per_box: { key: 'pcs_per_box', displayName: { zh: '单箱数量', en: 'Qty per Carton' }, priority: 9 }
  },
  
  // 配件字段配置 - 基于官方标准
  accessories: {
    // 购物车显示字段 (7个)
    model: { 
      key: 'model', 
      displayName: { zh: '型号', en: 'Model' }, 
      priority: 1,
      unitConfig: { metric: 'model', imperial: 'model_imperial' }
    },
    part_number: { key: 'part_number', displayName: { zh: '料号', en: 'Part No.' }, priority: 2 },
    voltage: { key: 'voltage', displayName: { zh: '电压', en: 'Voltage' }, priority: 3, unit: 'V' },
    frequency: { key: 'frequency', displayName: { zh: '频率', en: 'Frequency' }, priority: 4, unit: 'Hz' },
    pcs_per_box: { key: 'pcs_per_box', displayName: { zh: '单箱数量', en: 'Qty per Carton' }, priority: 5 }
  }
};

// 单位映射表 - 基于CSV标准
const FIELD_UNIT_MAPPINGS = {
  // 重量字段
  'net_weight_kg': 'kg',
  'net_weight_lbs': 'lb',  // 修正：CSV使用"lb"而不是"lbs"
  'pallet_gross_weight_kg': 'kg',
  'pallet_gross_weight_lbs': 'lb',
  
  // 尺寸字段
  'package_size_cm': 'cm',
  'package_size_inch': 'inch',
  'pallet_size_cm': 'cm',
  'pallet_size_inch': 'inch',
  
  // 长度字段
  'film_width_cm': 'cm',
  'film_width_inch': 'inch',
  'bag_length_cm': 'cm',
  'bag_length_inch': 'inch',
  'total_length_m': 'm',
  'total_length_ft': 'ft',
  
  // 直径字段
  'bubble_diameter_cm': 'mm',  // 修正：CSV中泡径单位是mm
  'bubble_diameter_inch': 'inch',
  
  // 厚度字段
  'thickness_um': 'μm / gsm',  // 修正：使用CSV标准单位符号
  'thickness_mil': 'mil / lb'  // 修正：使用CSV标准单位
};

// 获取字段对应的单位
const getFieldUnit = (fieldName: string): string => {
  return FIELD_UNIT_MAPPINGS[fieldName] || '';
};

const EnhancedCartSidebar: React.FC<EnhancedCartSidebarProps> = ({ isOpen, onClose }) => {
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
  const { user, getPreferredUnit } = useAuth();
  const { t, i18n } = useTranslation(['spareParts', 'cart']);

  const hasItems = items.length > 0;
  const allSelected = hasItems && items.every(item => isItemSelected(item.id));

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 智能单位制系统 - 基于用户偏好
  const preferredUnitSystem = useMemo((): 'metric' | 'imperial' => {
    const authPreference = getPreferredUnit?.();
    if (authPreference && ['metric', 'imperial'].includes(authPreference)) {
      return authPreference as 'metric' | 'imperial';
    }
    return 'metric'; // 默认公制
  }, [getPreferredUnit]);

  // 智能标签生成 - 基于字段映射标准
  const getSmartLabel = (baseKey: string, productType: string): string => {
    const config = CART_FIELD_CONFIGS[productType]?.[baseKey];
    if (!config) return baseKey;
    
    const baseLabel = i18n.language === 'zh' ? config.displayName.zh : config.displayName.en;
    
    if (!config.unitConfig) {
      // 无单位制配置的字段，如果有固定单位则添加
      if (config.unit) {
        return `${baseLabel}(${config.unit})`;
      }
      return baseLabel;
    }
    
    // 有单位制配置的字段，根据用户偏好选择单位
    const targetField = preferredUnitSystem === 'imperial' ? 
      config.unitConfig.imperial : 
      config.unitConfig.metric;
    
    const unit = getFieldUnit(targetField);
    return unit ? `${baseLabel}(${unit})` : baseLabel;
  };

  // 智能字段映射 - 基于用户偏好选择字段
  const getSmartFieldMapping = (fieldKey: string, productType: string, product: any) => {
    const config = CART_FIELD_CONFIGS[productType]?.[fieldKey];
    if (!config?.unitConfig) return fieldKey;
    
    const isImperial = preferredUnitSystem === 'imperial';
    const targetField = isImperial ? 
      config.unitConfig.imperial : 
      config.unitConfig.metric;
    
    // 检查目标字段是否存在且有值
    if (product[targetField] !== undefined && 
        product[targetField] !== null &&
        product[targetField] !== '') {
      return targetField;
    }
    
    // 如果目标字段不存在，尝试另一个单位制的字段
    const fallbackField = isImperial ? 
      config.unitConfig.metric : 
      config.unitConfig.imperial;
    
    if (product[fallbackField] !== undefined && 
        product[fallbackField] !== null &&
        product[fallbackField] !== '') {
      return fallbackField;
    }
    
    return fieldKey;
  };

  // 获取产品类型
  const getProductType = (item: any): string => {
    if (item.product_type) {
      // 标准化产品类型名称
      switch (item.product_type.toLowerCase()) {
        case 'machine':
        case 'host':
        case '设备':
          return 'machines';
        case 'consumable':
          return 'consumables';
        case 'spare_part':
          return 'spare_parts';
        case 'accessory':
          return 'accessories';
        default:
          return 'machines';
      }
    }
    return 'machines';
  };

  // 渲染智能字段行
  const renderSmartFieldRow = (item: any, fieldKey: string) => {
    const productType = getProductType(item);
    const actualField = getSmartFieldMapping(fieldKey, productType, item);
    const label = getSmartLabel(fieldKey, productType);
    
    // 🔧 特殊处理name字段 - 使用智能名称获取逻辑
    let value;
    if (fieldKey === 'name') {
      value = getDisplayName(item);
    } else {
      value = item[actualField] || item.properties?.[actualField];
    }
    
    if (!value || value === 'N/A' || value === '') return null;
    
    return (
      <div key={fieldKey} className="detail-row">
        <span className="label">{label}:</span>
        <span className="value">{value}</span>
      </div>
    );
  };

  // 渲染产品详细信息 - 基于字段映射标准
  const renderProductDetails = (item: any) => {
    const productType = getProductType(item);
    const config = CART_FIELD_CONFIGS[productType];
    
    if (!config) return null;

    // 获取优先级排序的字段 - 🔧 修复：显示所有字段
    const priorityFields = Object.keys(config)
      .filter(key => config[key].priority)
      .sort((a, b) => config[a].priority - config[b].priority);
      // .slice(0, 6); // 🔧 移除限制：显示所有11个字段

    return (
      <div className="product-details">
        {priorityFields.map(fieldKey => renderSmartFieldRow(item, fieldKey))}
      </div>
    );
  };

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

  // 获取商品名称
  const getDisplayName = (item: any): string => {
    return getSimpleProductName(
      { ...item, ...(item.properties ?? {}) },
      i18n.language.startsWith('zh') ? 'zh' : 'en'
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
                      <img 
                        src={item.properties?.image_url || item.image_url || ASSETS.DEFAULT_IMAGE} 
                        alt={getDisplayName(item)} 
                      />
                    </div>
                    
                    <div className="cart-item-details">
                      <div className="cart-item-title">{getDisplayName(item)}</div>
                      
                      {/* 使用智能字段显示 */}
                      {renderProductDetails(item)}
                      
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

export default EnhancedCartSidebar; 