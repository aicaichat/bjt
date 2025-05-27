import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
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

  // 渲染耗材详细信息
  const renderConsumableDetails = (item: any) => {
    const props = item.properties || {};
    
    return (
      <div className="consumable-details">
        <div className="detail-row">
          <span className="label">料号:</span>
          <span className="value">{props.part_number || item.part_number}</span>
        </div>
        <div className="detail-row">
          <span className="label">品牌:</span>
          <span className="value">{props.brand || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="label">型号:</span>
          <span className="value">
            {preferredUnit === 'metric' ? props.model : (props.model_imperial || props.model)}
          </span>
        </div>
        <div className="detail-row">
          <span className="label">规格:</span>
          <span className="value">
            {preferredUnit === 'metric' ? props.spec : (props.spec_imperial || props.spec)}
          </span>
        </div>
        {(props.bubble_diameter_met || props.bubble_diameter_imp) && (
          <div className="detail-row">
            <span className="label">泡径:</span>
            <span className="value">
              {preferredUnit === 'metric' 
                ? `${props.bubble_diameter_met} cm` 
                : `${props.bubble_diameter_imp} inch`}
            </span>
          </div>
        )}
        {props.pcs_per_box && (
          <div className="detail-row">
            <span className="label">单箱数量:</span>
            <span className="value">{props.pcs_per_box}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="label">产品ID:</span>
          <span className="value">{props.id || item.product_id}</span>
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
      requiredParts: string | null | undefined,
      requiredQuantity: string | null | undefined
    ): { part_number: string; quantity: number }[] => {
      if (!requiredParts || !requiredQuantity) {
        return [];
      }

      const partNumbers = requiredParts.split(',').map(p => p.trim()).filter(p => p);
      const quantities = requiredQuantity.split(',').map(q => parseInt(q.trim(), 10)).filter(q => !isNaN(q));

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
            <span className="label">料号:</span>
            <span className="value">{props.part_number || item.part_number}</span>
          </div>
          <div className="detail-row">
            <span className="label">型号:</span>
            <span className="value">{props.model || specs.model}</span>
          </div>
          <div className="detail-row">
            <span className="label">产品ID:</span>
            <span className="value">{props.product_id || item.product_id}</span>
          </div>
        </div>

        {/* 适配信息 */}
        {(props.app_model || specs.app_model) && (
          <div className="detail-section">
            <div className="detail-row">
              <span className="label">适配机型:</span>
              <span className="value app-model">{props.app_model || specs.app_model}</span>
            </div>
          </div>
        )}

        {(props.app_sn || specs.app_sn) && (
          <div className="detail-row">
            <span className="label">适配序列号:</span>
            <span className="value app-sn">{props.app_sn || specs.app_sn}</span>
          </div>
        )}

        {/* 规格信息 */}
        <div className="detail-section">
          <div className="detail-row">
            <span className="label">规格:</span>
            <span className="value">
              {preferredUnit === 'metric' 
                ? (props.spec || specs.spec)
                : (props.spec_imperial || specs.spec_imperial || props.spec || specs.spec)
              }
            </span>
          </div>
        </div>

        {/* 包装信息 */}
        {(props.pcs_per_box || specs.pcs_per_box) && (
          <div className="detail-row">
            <span className="label">单箱数量:</span>
            <span className="value">{props.pcs_per_box || specs.pcs_per_box}</span>
          </div>
        )}

        {(props.unit || specs.unit) && (
          <div className="detail-row">
            <span className="label">单位:</span>
            <span className="value">{props.unit || specs.unit}</span>
          </div>
        )}

        {/* 易损件标识 */}
        {(props.is_consumable !== undefined || specs.is_consumable !== undefined) && (
          <div className="detail-row">
            <span className="label">类型:</span>
            <span className="value">
              <span className="consumable-badge">
                {(props.is_consumable || specs.is_consumable) ? '易损件' : '标准备件'}
              </span>
            </span>
          </div>
        )}

        {/* 必选备件信息 */}
        {requiredParts.length > 0 && (
          <div className="detail-section">
            <div className="detail-row">
              <span className="label">必选备件:</span>
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
                    <img src={item.properties?.image_url || item.image} alt={item.name} />
                  </div>
                  
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.name}</div>
                    {item.product_type === 'consumable' && renderConsumableDetails(item)}
                    {item.product_type === 'spare_part' && renderSparePartDetails(item)}
                    <div className="cart-item-price">
                      <div className="unit-price">单价: ¥{getTieredPrice(item).toFixed(2)}</div>
                      <div className="subtotal">小计: ¥{(getTieredPrice(item) * item.quantity).toFixed(2)}</div>
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
                        title="删除"
                      >
                        <span role="img" aria-label="delete">🗑️</span> 删除
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
        {/* 清空购物车确认弹窗 */}
        {showClearConfirm && (
          <div className="cart-clear-confirm-modal">
            <div className="cart-clear-confirm-content">
              <div className="cart-clear-confirm-title">确定要清空购物车吗？</div>
              <div className="cart-clear-confirm-actions">
                <button className="cart-clear-cancel-btn" onClick={handleCancelClear}>取消</button>
                <button className="cart-clear-confirm-btn" onClick={handleConfirmClear}>确定</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar; 