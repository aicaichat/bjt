import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
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

  const hasItems = items.length > 0;
  const allSelected = hasItems && items.every(item => isItemSelected(item.id));

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
    if (window.confirm('确定要清空购物车吗？')) {
      clearCart();
    }
  };

  return (
    <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="cart-sidebar-header">
        <h3 className="cart-sidebar-title">购物车</h3>
        <button className="cart-sidebar-close" onClick={onClose}>×</button>
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
              <span>全选</span>
            </div>
            
            <div className="cart-sidebar-items">
              {items.map(item => (
                <div key={item.id} className="cart-sidebar-item">
                  <div className="cart-item-checkbox">
                    <div 
                      className={`cart-checkbox ${isItemSelected(item.id) ? 'checked' : ''}`}
                      onClick={() => handleToggleItem(item.id)}
                    >
                      {isItemSelected(item.id) && <span className="checkbox-tick">✓</span>}
                    </div>
                  </div>
                  
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.name}</div>
                    <div className="cart-item-sku">SKU: {item.code}</div>
                    <div className="cart-item-price">¥{(item.price || 0).toFixed(2)}</div>
                    
                    <div className="cart-item-properties">
                      {item.properties && Object.entries(item.properties).map(([key, value]) => (
                        <div key={key} className="cart-item-property">
                          {key}: {value}
                        </div>
                      ))}
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
                        onClick={() => removeItem(item.id)}
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
          <span className="cart-sidebar-price">¥{(selectedTotal || 0).toFixed(2)}</span>
        </div>
        
        <div className="cart-sidebar-actions">
          <button 
            className="cart-sidebar-clear"
            onClick={handleClearCart}
            disabled={!hasItems}
          >
            清空购物车
          </button>
          
          <Link 
            to="/cart" 
            className={`cart-sidebar-checkout ${!hasItems ? 'disabled' : ''}`}
            onClick={onClose}
          >
            去结算
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar; 