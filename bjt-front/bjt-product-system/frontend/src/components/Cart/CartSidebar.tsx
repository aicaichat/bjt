import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '../../config/appConfig';
import { CartFieldUnifier } from '../../utils/CartFieldUnifier';
import { CartSidebarProductDetails } from './UnifiedProductDetails';
import './CartSidebar.css';
import './UnifiedProductDetails.css';

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
  
  // 当前语言设置
  const currentLanguage: 'zh' | 'en' = i18n.language === 'en' ? 'en' : 'zh';

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
                      })()} alt={CartFieldUnifier.getProductName(item, currentLanguage)} />
                    </div>
                    
                    <div className="cart-item-details">
                      <div className="cart-item-title">
                        {CartFieldUnifier.getProductName(item, currentLanguage)}
                      </div>
                      
                      {/* 🎯 使用统一的产品详情组件 - 强制刷新 */}
                      <CartSidebarProductDetails 
                        key={`${item.id}-${Date.now()}`} // 🔧 强制重新渲染
                        item={item} 
                        language={currentLanguage} 
                        preferredUnit={preferredUnit}
                      />
                      
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