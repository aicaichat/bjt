import React, { useState, useEffect } from 'react';
import './Cart.css';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

// 定义类型
interface CartItemDisplay {
  id: string;
  name: string;
  code: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  properties?: Record<string, string>;
  quantity: number;
  selected: boolean;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 从Context获取购物车数据
  const { 
    items = [], // 提供默认值防止undefined.length错误
    removeItem, 
    updateQuantity, 
    toggleItemSelection, 
    selectAll,
    isItemSelected,
    selectedTotal
  } = useCart();
  
  // 本地状态
  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [allSelected, setAllSelected] = useState(false);

  // 从Context更新本地购物车数据
  useEffect(() => {
    if (items && items.length > 0) {
      // 将Context购物车数据转换为显示格式
      const displayItems: CartItemDisplay[] = items.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code || '',
        image: item.image || '',
        price: item.price,
        originalPrice: item.originalPrice,
        category: item.category || '',
        properties: item.properties || {},
        quantity: item.quantity,
        selected: isItemSelected(item.id)
      }));
      
      setCartItems(displayItems);
      setAllSelected(items.length > 0 && items.every(item => isItemSelected(item.id)));
      updateOrderSummary(displayItems);
    } else {
      setCartItems([]);
      setSelectedCount(0);
      setTotalPrice(0);
    }
  }, [items, isItemSelected]);
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    
    // 同步到Context
    selectAll(newAllSelected);
    
    // 更新本地数据
    setCartItems(prev => 
      prev.map(item => ({ ...item, selected: newAllSelected }))
    );
    
    // 更新订单摘要在Context中自动完成
  };
  
  // 切换选中状态
  const toggleItemCheck = (id: string) => {
    // 同步到Context
    toggleItemSelection(id, !isItemSelected(id));
    
    // 更新本地数据
    const updatedItems = cartItems.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    
    setCartItems(updatedItems);
    setAllSelected(updatedItems.every(item => item.selected));
  };
  
  // 更新商品数量
  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    // 同步到Context
    updateQuantity(id, quantity);
    
    // 更新本地数据
    const updatedItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    
    setCartItems(updatedItems);
  };
  
  // 删除商品
  const deleteItem = (id: string) => {
    // 同步到Context
    removeItem(id);
    
    // 更新本地数据
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    setAllSelected(updatedItems.length > 0 && updatedItems.every(item => item.selected));
  };
  
  // 更新订单摘要
  const updateOrderSummary = (items: CartItemDisplay[]) => {
    if (!items) return;
    
    let count = 0;
    let price = 0;
    
    items.forEach(item => {
      if (item.selected) {
        count++;
        price += item.price * item.quantity;
      }
    });
    
    setSelectedCount(count);
    setTotalPrice(price);
  };
  
  // 提交订单
  const handleSubmitOrder = () => {
    // 过滤出被选中的商品
    const selectedItems = cartItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      alert('请至少选择一个商品');
      return;
    }
    
    // 将选中商品转为提交格式
    const orderItems = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      image: item.image,
      category: item.category,
      properties: item.properties,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));
    
    // 导航到订单确认页，并传递订单信息
    navigate('/order', { 
      state: { 
        orderItems,
        totalAmount: totalPrice 
      } 
    });
  };
  
  // 渲染属性信息
  const renderProperties = (properties?: Record<string, string>) => {
    if (!properties) return null;
    
    return (
      <div className="cart-item-properties">
        {Object.entries(properties).slice(0, 3).map(([key, value], index) => (
          <div key={index} className="property-item">
            <span className="property-label">{key}：</span>
            <span className="property-value">{value}</span>
          </div>
        ))}
        {Object.keys(properties).length > 3 && (
          <div className="property-more">...</div>
        )}
      </div>
    );
  };
  
  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>购物车</h1>
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <p>购物车中没有商品</p>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/machines')}
            >
              继续购物
            </button>
          </div>
        ) : (
          <>
            <div className="cart-controls">
              <div className="select-all">
                <input 
                  type="checkbox" 
                  id="select-all"
                  checked={allSelected} 
                  onChange={toggleSelectAll}
                />
                <label htmlFor="select-all">全选</label>
              </div>
              <div className="cart-operations">
                <span className="delete-selected">批量删除</span>
                <span className="add-to-favorites">移入收藏夹</span>
              </div>
            </div>
            
            <div className="cart-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-check">
                    <input 
                      type="checkbox" 
                      checked={item.selected} 
                      onChange={() => toggleItemCheck(item.id)}
                    />
                  </div>
                  
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  
                  <div className="cart-item-info">
                    <div className="cart-item-name">
                      <h3>{item.name}</h3>
                      <div className="cart-item-type">{item.category}</div>
                    </div>
                    
                    <div className="cart-item-sku">料号: {item.code}</div>
                    
                    {renderProperties(item.properties)}
                    
                    <div className="cart-item-actions">
                      <span className="action-favorite">收藏</span>
                      <span 
                        className="action-delete"
                        onClick={() => deleteItem(item.id)}
                      >
                        删除
                      </span>
                    </div>
                  </div>
                  
                  <div className="cart-item-price-quantity">
                    <div className="cart-item-price">
                      <span className="current-price">¥{item.price.toFixed(2)}</span>
                      {item.originalPrice && (
                        <span className="original-price">¥{item.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    
                    <div className="cart-item-quantity">
                      <button 
                        className="quantity-decrease"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={item.quantity}
                        min="1"
                        onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                      />
                      <button 
                        className="quantity-increase"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="cart-item-subtotal">
                      <span className="subtotal-label">小计：</span>
                      <span className="subtotal-value">¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="summary-info">
                <div className="selected-count">已选商品<span>{selectedCount}</span>件</div>
                <div className="total-price">合计：<span>¥{totalPrice.toFixed(2)}</span></div>
              </div>
              <button 
                className="submit-order-btn"
                onClick={handleSubmitOrder}
                disabled={selectedCount === 0}
              >
                提交订单
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;