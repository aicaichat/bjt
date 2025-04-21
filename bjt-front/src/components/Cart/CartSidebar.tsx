import React from 'react';
import { Link } from 'react-router-dom';
import { useCart, CartItem } from '../../contexts/CartContext';
import './CartSidebar.css';

const CartSidebar: React.FC = () => {
  const { 
    cartItems, 
    isCartOpen, 
    totalPrice, 
    removeFromCart, 
    updateQuantity, 
    toggleItemCheck, 
    toggleAllCheck, 
    clearCart, 
    closeCart 
  } = useCart();

  const isAllSelected = cartItems.length > 0 && cartItems.every(item => item.checked);

  // 处理全选
  const handleSelectAll = () => {
    toggleAllCheck(!isAllSelected);
  };

  // 处理数量减少
  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  // 处理数量增加
  const handleIncreaseQuantity = (item: CartItem) => {
    updateQuantity(item.id, item.quantity + 1);
  };

  // 处理清空购物车
  const handleClearCart = () => {
    if (window.confirm('确定要清空购物车吗？')) {
      clearCart();
    }
  };

  return (
    <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
      <div className="cart-sidebar-header">
        <h3 className="cart-sidebar-title">购物车</h3>
        <button className="cart-sidebar-close" onClick={closeCart}>×</button>
      </div>
      
      <div className="cart-sidebar-body">
        {cartItems.length > 0 ? (
          <>
            <div className="cart-sidebar-select-all">
              <div 
                className={`cart-checkbox ${isAllSelected ? 'checked' : ''}`}
                onClick={handleSelectAll}
              >
                {isAllSelected && <span className="checkbox-tick">✓</span>}
              </div>
              <span>全选</span>
            </div>
            
            <div className="cart-sidebar-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-sidebar-item">
                  <div className="cart-item-checkbox">
                    <div 
                      className={`cart-checkbox ${item.checked ? 'checked' : ''}`}
                      onClick={() => toggleItemCheck(item.id)}
                    >
                      {item.checked && <span className="checkbox-tick">✓</span>}
                    </div>
                  </div>
                  
                  <div className="cart-item-image">
                    <img src={item.image_url} alt={item.model} />
                  </div>
                  
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.model}</div>
                    <div className="cart-item-sku">SKU: {item.sku}</div>
                    <div className="cart-item-price">¥{item.price.toFixed(2)}</div>
                    
                    <div className="cart-item-properties">
                      {Object.entries(item.properties).map(([key, value]) => (
                        <div key={key} className="cart-item-property">
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                    
                    <div className="cart-item-actions">
                      <div className="cart-item-quantity">
                        <button 
                          className="quantity-btn"
                          onClick={() => handleDecreaseQuantity(item)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => handleIncreaseQuantity(item)}
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <p>购物车还是空的哦，快去挑选商品吧！</p>
          </div>
        )}
      </div>
      
      <div className="cart-sidebar-footer">
        <div className="cart-sidebar-total">
          <span>合计:</span>
          <span className="cart-sidebar-price">¥{totalPrice.toFixed(2)}</span>
        </div>
        
        <div className="cart-sidebar-actions">
          <button 
            className="cart-sidebar-clear"
            onClick={handleClearCart}
            disabled={cartItems.length === 0}
          >
            清空购物车
          </button>
          
          <Link 
            to="/cart" 
            className={`cart-sidebar-checkout ${cartItems.length === 0 ? 'disabled' : ''}`}
            onClick={closeCart}
          >
            去结算
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar; 