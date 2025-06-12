import React from 'react';
import { useSmartUnitSystem } from '../../hooks/useSmartUnitSystem';
import { SmartCartItemCard } from './SmartCartItemCard';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS, debugLog } from '../../config/feature-flags';

interface CartItem {
  id: string;
  product: any;
  productType: 'machines' | 'consumables' | 'spareParts' | 'accessories';
  quantity: number;
  selected?: boolean;
}

interface SmartSidebarCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleSelection?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
  selectedTotal?: { count: number; total: number };
}

export const SmartSidebarCart: React.FC<SmartSidebarCartProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelection,
  onSelectAll,
  onCheckout,
  isOpen,
  onClose,
  selectedTotal
}) => {
  const { 
    preferredUnitSystem, 
    setTemporaryUnit, 
    isTemporaryOverride 
  } = useSmartUnitSystem();
  const { t, i18n } = useTranslation(['cart', 'products']);
  
  const isCurrentLanguageZh = i18n.language === 'zh' || i18n.language === 'zh-CN';
  const hasItems = cartItems.length > 0;
  const allSelected = hasItems && cartItems.every(item => item.selected);
  
  // 切换单位制
  const handleUnitToggle = () => {
    const newUnit = preferredUnitSystem === 'metric' ? 'imperial' : 'metric';
    setTemporaryUnit(newUnit);
    
    debugLog('切换单位制', {
      from: preferredUnitSystem,
      to: newUnit,
      isTemporaryOverride: true
    });
  };
  
  // 重置为账户设置
  const handleResetUnit = () => {
    setTemporaryUnit(null);
    debugLog('重置单位制到账户设置');
  };
  
  // 全选/取消全选
  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll(!allSelected);
      debugLog('切换全选状态', { allSelected: !allSelected });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="smart-sidebar-cart">
      {/* 购物车标题栏 */}
      <div className="cart-header">
        <h3 className="cart-title">
          {isCurrentLanguageZh ? '购物车' : 'Shopping Cart'}
          {hasItems && (
            <span className="item-count">({cartItems.length})</span>
          )}
        </h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      
      {/* 智能单位制控制器 */}
      {FEATURE_FLAGS.SMART_UNIT_SYSTEM && (
        <div className="unit-system-controls">
          <div className="unit-toggle-section">
            <button 
              onClick={handleUnitToggle}
              className="unit-toggle-btn"
              title={isCurrentLanguageZh ? 
                `当前: ${preferredUnitSystem === 'metric' ? '公制' : '英制'}，点击切换` :
                `Current: ${preferredUnitSystem === 'metric' ? 'Metric' : 'Imperial'}, click to toggle`
              }
            >
              <span className="unit-icon">
                {preferredUnitSystem === 'metric' ? '📏' : '📐'}
              </span>
              <span className="unit-text">
                {isCurrentLanguageZh ? 
                  (preferredUnitSystem === 'metric' ? '公制' : '英制') :
                  (preferredUnitSystem === 'metric' ? 'Metric' : 'Imperial')
                }
              </span>
            </button>
            
            {isTemporaryOverride && (
              <button 
                onClick={handleResetUnit}
                className="reset-unit-btn"
                title={isCurrentLanguageZh ? '恢复账户设置' : 'Reset to account setting'}
              >
                {isCurrentLanguageZh ? '重置' : 'Reset'}
              </button>
            )}
          </div>
          
          {isTemporaryOverride && (
            <div className="override-indicator">
              <small>
                {isCurrentLanguageZh ? '临时切换' : 'Temporary override'}
              </small>
            </div>
          )}
        </div>
      )}
      
      {/* 购物车内容 */}
      <div className="cart-content">
        {!hasItems ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <p className="empty-message">
              {isCurrentLanguageZh ? '购物车是空的' : 'Your cart is empty'}
            </p>
          </div>
        ) : (
          <>
            {/* 全选控制 */}
            {onSelectAll && (
              <div className="select-all-section">
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                  <span className="select-all-label">
                    {isCurrentLanguageZh ? '全选' : 'Select All'}
                  </span>
                </label>
              </div>
            )}
            
            {/* 商品列表 */}
            <div className="cart-items">
              {cartItems.map(item => (
                <SmartCartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  onToggleSelection={onToggleSelection}
                  showSmartFields={FEATURE_FLAGS.CART_FIELD_ENHANCEMENT}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* 购物车底部操作区 */}
      {hasItems && (
        <div className="cart-footer">
          {/* 选中商品统计 */}
          {selectedTotal && (
            <div className="selected-summary">
              <div className="selected-count">
                {isCurrentLanguageZh ? '已选' : 'Selected'}: {selectedTotal.count}
              </div>
              {selectedTotal.total > 0 && (
                <div className="selected-total">
                  {isCurrentLanguageZh ? '小计' : 'Subtotal'}: ${selectedTotal.total.toFixed(2)}
                </div>
              )}
            </div>
          )}
          
          {/* 结算按钮 */}
          <button 
            onClick={onCheckout}
            className="checkout-btn"
            disabled={selectedTotal ? selectedTotal.count === 0 : false}
          >
            {isCurrentLanguageZh ? '去结算' : 'Checkout'}
          </button>
        </div>
      )}
    </div>
  );
};

// 向后兼容的包装器
export const SidebarCart: React.FC<SmartSidebarCartProps> = (props) => {
  // 如果功能开关关闭，仍然使用Smart版本但禁用增强功能
  return <SmartSidebarCart {...props} />;
}; 