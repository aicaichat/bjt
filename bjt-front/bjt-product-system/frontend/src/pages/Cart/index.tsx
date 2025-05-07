import React, { useState, useEffect } from 'react';
import './Cart.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useNotification } from '../../contexts/NotificationContext';
import { ShoppingCartOutlined, HeartOutlined, DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { safeToLocaleString } from '../../utils/priceUtils';

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
  priceTiers?: {
    minQuantity: number;
    maxQuantity?: number;
    price: number;
  }[];
  description?: string;
}

// 默认图片，当产品图片加载失败时使用
const defaultProductImage = '/assets/images/product-placeholder.png';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const notification = useNotification();
  
  // 从Context获取购物车数据
  const { 
    items = [], // 提供默认值防止undefined.length错误
    removeItem, 
    updateQuantity,
    addItem,
    toggleItemSelection, 
    selectAll,
    isItemSelected,
    selectedTotal,
    loading: cartLoading,
    clearCart
  } = useCart();
  
  // 本地状态
  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [allSelected, setAllSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从Context更新本地购物车数据
  useEffect(() => {
    if (items && items.length > 0) {
      // 将Context购物车数据转换为显示格式
      const displayItems = items.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code || '',
        image: item.image || '',
        price: item.price,
        originalPrice: item.originalPrice,
        category: item.category || '',
        properties: item.properties || {},
        quantity: item.quantity,
        selected: isItemSelected(item.id),
        priceTiers: generateMockPriceTiers(item.price, item.originalPrice),
        description: ''
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
  
  // 检查是否有从订单页返回的物品
  useEffect(() => {
    if (location.state && location.state.returnedItems && location.state.returnedItems.length > 0) {
      const returnedItems = location.state.returnedItems;
      
      // 清空现有购物车并添加返回的物品
      // 这样可以确保购物车内容与订单页一致
      if (returnedItems.length > 0) {
        // 清空购物车
        clearCart();
        
        // 将返回的物品添加到购物车
        returnedItems.forEach((item: any) => {
          // Parse stringified objects if needed
          let specs = item.specs;
          if (typeof specs === 'string' && specs) {
            try {
              specs = JSON.parse(specs);
            } catch (e) {
              console.error('Error parsing specs JSON:', e);
              // Keep as string if parsing fails
            }
          }
          
          // Handle any other stringified complex objects
          let shippingInfo = item.shippingInfo;
          if (typeof shippingInfo === 'string' && shippingInfo) {
            try {
              shippingInfo = JSON.parse(shippingInfo);
            } catch (e) {
              console.error('Error parsing shippingInfo JSON:', e);
              // Keep as string if parsing fails
            }
          }
          
          addItem({
            id: item.id,
            name: item.name,
            code: item.code || '',
            image: item.image || '',
            price: item.price,
            category: item.category || '',
            properties: item.properties || {},
            quantity: item.quantity,
            // 添加CartItem接口所需的额外属性
            partNumber: item.partNumber || '',
            productId: item.productId || 0, 
            priceTiers: item.priceTiers || [],
            selected: true, // 默认选中返回的物品
            specs: specs || {}
          });
        });
        
        // 显示成功通知
        notification.success(
          t('cart.notifications.itemsRestored', { defaultValue: '购物车已恢复' }),
          t('cart.notifications.itemsRestoredMessage', { defaultValue: '从订单页返回的商品已添加到购物车' })
        );
      }
      
      // 清除 location state 以避免重复处理
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addItem, notification, t, clearCart]);
  
  // 生成模拟价格层级数据，在实际项目中，这部分数据应该由后端提供
  const generateMockPriceTiers = (currentPrice: number, originalPrice?: number) => {
    const tiers = [
      // 当前价格 (1-10数量)
      {
        minQuantity: 1,
        maxQuantity: 10,
        price: currentPrice
      },
      // 中等数量折扣 (11-50)
      {
        minQuantity: 11,
        maxQuantity: 50,
        price: Math.round(currentPrice * 0.9 * 100) / 100
      },
      // 大量折扣 (>50)
      {
        minQuantity: 51,
        price: Math.round(currentPrice * 0.8 * 100) / 100
      }
    ];
    
    return tiers;
  };
  
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
    updateQuantity(id, parseInt(String(quantity), 10));
    
    // 更新本地数据
    const updatedItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    
    setCartItems(updatedItems);
  };
  
  // 删除商品
  const deleteItem = (id: string) => {
    try {
      // 同步到Context
      removeItem(id);
      
      // 更新本地数据
      const updatedItems = cartItems.filter(item => item.id !== id);
      setCartItems(updatedItems);
      setAllSelected(updatedItems.length > 0 && updatedItems.every(item => item.selected));
      
      // 显示成功通知
      notification.success(
        t('cart.notifications.itemRemoved', { defaultValue: '商品已移除' }),
        t('cart.notifications.itemRemovedMessage', { defaultValue: '商品已从购物车中移除' })
      );
    } catch (err) {
      setError(t('cart.errors.removeItemFailed', { defaultValue: '移除商品失败' }));
    }
  };
  
  // 批量删除所选商品
  const batchDeleteItems = () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      notification.warning(t('cart.messages.noItemsSelected', { defaultValue: '请先选择商品' }));
      return;
    }
    
    try {
      // 逐个删除选中的商品
      selectedItems.forEach(item => removeItem(item.id));
      
      // 更新本地数据
      const updatedItems = cartItems.filter(item => !item.selected);
      setCartItems(updatedItems);
      
      // 显示成功通知
      notification.success(
        t('cart.notifications.itemsRemoved', { defaultValue: '商品已批量移除' }),
        t('cart.notifications.batchRemoveMessage', { defaultValue: '所选商品已从购物车中移除' })
      );
    } catch (err) {
      setError(t('cart.errors.batchRemoveFailed', { defaultValue: '批量移除商品失败' }));
    }
  };
  
  // 更新订单摘要
  const updateOrderSummary = (items: CartItemDisplay[]) => {
    if (!items) return;
    
    let count = 0;
    let price = 0;
    
    items.forEach(item => {
      if (item.selected) {
        count += item.quantity;
        
        // 根据数量确定应用的价格层级
        let appliedPrice = item.price;
        if (item.priceTiers && item.priceTiers.length > 0) {
          for (const tier of item.priceTiers) {
            if (item.quantity >= tier.minQuantity && 
                (!tier.maxQuantity || item.quantity <= tier.maxQuantity)) {
              appliedPrice = tier.price;
              break;
            }
          }
        }
        
        price += appliedPrice * item.quantity;
      }
    });
    
    setSelectedCount(count);
    setTotalPrice(price);
  };
  
  // 图片加载错误处理
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultProductImage;
  };
  
  // 提交订单
  const handleSubmitOrder = () => {
    // 过滤出被选中的商品
    const selectedItems = cartItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      notification.warning(
        t('cart.messages.selectAtLeastOne', { defaultValue: '请至少选择一件商品' })
      );
      return;
    }
    
    // 将选中商品转为提交格式
    const orderItems = selectedItems.map(item => {
      // 根据数量确定应用的价格层级
      let appliedPrice = item.price;
      if (item.priceTiers && item.priceTiers.length > 0) {
        for (const tier of item.priceTiers) {
          if (item.quantity >= tier.minQuantity && 
              (!tier.maxQuantity || item.quantity <= tier.maxQuantity)) {
            appliedPrice = tier.price;
            break;
          }
        }
      }
      
      return {
        id: item.id,
        name: item.name,
        code: item.code,
        image: item.image,
        category: item.category,
        properties: item.properties,
        price: appliedPrice,
        quantity: item.quantity,
        subtotal: appliedPrice * item.quantity
      };
    });
    
    // 导航到订单确认页，并传递订单信息
    navigate('/order', { 
      state: { 
        orderItems,
        totalAmount: totalPrice,
        fromCart: true // Add a flag to indicate navigation came from cart
      } 
    });
  };
  
  // 获取商品类型对应的标签样式
  const getCategoryTagClass = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('machine') || lowerCategory.includes('主机')) {
      return 'tag-machine';
    } else if (lowerCategory.includes('accessory') || lowerCategory.includes('配件')) {
      return 'tag-accessory';
    } else if (lowerCategory.includes('consumable') || lowerCategory.includes('耗材')) {
      return 'tag-consumable';
    } else if (lowerCategory.includes('spare') || lowerCategory.includes('备件')) {
      return 'tag-spare';
    }
    return 'tag-accessory'; // 默认
  };
  
  // 渲染属性信息
  const renderProperties = (properties?: Record<string, string>) => {
    if (!properties) return null;
    
    return (
      <div className="cart-item-properties">
        {Object.entries(properties).map(([key, value], index) => (
          <div key={index} className="property-item">
            <span className="property-label">{key}：</span>
            <span className="property-value">{value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  // 显示加载状态
  if (cartLoading) {
    return <Loading tip={t('loading.cart', { defaultValue: '正在加载购物车...' })} fullPage nested />;
  }
  
  // 显示错误状态
  if (error) {
    return (
      <ErrorMessage 
        message={t('cart.errors.title', { defaultValue: '出错了' })}
        description={error}
        showRetry={true}
        onRetry={() => setError(null)}
        showGoHome={true}
      />
    );
  }
  
  // 购物车为空时的显示
  if (cartItems.length === 0) {
    return renderEmptyCart();
  }
  
  // 渲染空购物车
  function renderEmptyCart() {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <h1>{t('cart.title', { defaultValue: '保存订单记录' })}</h1>
          <p>{t('cart.subtitle', { defaultValue: '超级管理员可看到所有账号的订单信息' })}</p>
        </div>
        <div className="cart-empty">
          <div className="empty-icon">
            <ShoppingCartOutlined />
          </div>
          <p>{t('cart.empty.message', { defaultValue: '购物车是空的' })}</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
          >
            {t('cart.empty.continueShopping', { defaultValue: '继续购物' })}
          </button>
        </div>
      </div>
    );
  }
  
  // 渲染购物车控制
  const renderCartControls = () => (
    <div className="cart-controls">
      <div className="select-all">
        <div 
          className={`checkbox-custom ${allSelected ? 'checked' : ''}`}
          onClick={toggleSelectAll}
        ></div>
      </div>
      <div className="select-all-text">
        <a href="#" onClick={(e) => { e.preventDefault(); toggleSelectAll(); }}>
          {allSelected ? 
            t('cart.controls.unselectAll', { defaultValue: '取消全选' }) : 
            t('cart.controls.selectAll', { defaultValue: '全选' })}
        </a>
      </div>
      <div className="cart-operations">
        <span onClick={batchDeleteItems}>
          <DeleteOutlined style={{ marginRight: 5 }} />
          <span className="button-text">{t('cart.controls.batchDelete', { defaultValue: '批量删除' })}</span>
        </span>
      </div>
    </div>
  );
  
  // 渲染商品项
  const renderCartItem = (item: CartItemDisplay) => {
    // 确定当前应用的价格层级
    let appliedTier = item.priceTiers ? item.priceTiers[0] : undefined;
    if (item.priceTiers) {
      for (const tier of item.priceTiers) {
        if (item.quantity >= tier.minQuantity && 
            (!tier.maxQuantity || item.quantity <= tier.maxQuantity)) {
          appliedTier = tier;
          break;
        }
      }
    }
    
    // 格式化价格显示，添加千位分隔符
    const formatPrice = (price: number) => {
      return safeToLocaleString(price, 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    
    return (
      <div className="cart-item" key={item.id}>
        <div className="cart-item-check">
          <div 
            className={`checkbox-custom ${item.selected ? 'checked' : ''}`}
            onClick={() => toggleItemCheck(item.id)}
          ></div>
        </div>
        <div className="cart-item-image">
          <img 
            src={item.image} 
            alt={`${item.name} 产品图片`}
            onError={handleImageError}
          />
        </div>
        <div className="cart-item-info">
          <div className="cart-item-name">
            {item.name} 
            <span className={`item-type-tag ${getCategoryTagClass(item.category)}`}>
              {item.category}
            </span>
            <div className="info-tooltip">
              i
              <div className="tooltip-content">
                <div className="tooltip-title">{item.name} 详细信息</div>
                <div className="tooltip-section">
                  {Object.entries(item.properties || {}).map(([key, value], index) => (
                    <div className="tooltip-property" key={index}>
                      <span className="tooltip-property-label">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {renderProperties(item.properties)}
          <div className="cart-item-actions">
            <button className="cart-item-action-btn">
              <span style={{ marginRight: 5 }}>📄</span> 规格说明
            </button>
            <button 
              className="cart-item-action-btn action-delete"
              onClick={() => deleteItem(item.id)}
            >
              <span style={{ marginRight: 5 }}>🗑️</span> 删除
            </button>
          </div>
        </div>
        <div className="cart-item-price-quantity">
          <div className="cart-item-quantity">
            <div className="quantity-control">
              <button 
                className="quantity-btn decrease"
                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <MinusOutlined />
              </button>
              <input 
                type="text" 
                className="quantity-input" 
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    handleUpdateQuantity(item.id, val);
                  }
                }}
              />
              <button 
                className="quantity-btn increase"
                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>
          <div className="cart-item-price">
            <div className="price-tiers">
              {item.priceTiers && item.priceTiers.map((tier, index) => (
                <div 
                  key={index} 
                  className="price-tier"
                  style={{
                    fontWeight: appliedTier === tier ? 'bold' : 'normal'
                  }}
                >
                  {index === 0 && item.originalPrice && (
                    <span className="original-price">¥{formatPrice(item.originalPrice)}</span>
                  )}
                  <span className="current-price">¥{formatPrice(tier.price)}</span>
                  {' '}
                  ({tier.minQuantity}
                  {tier.maxQuantity ? `-${tier.maxQuantity}` : '+'})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染购物车总结
  const renderCartSummary = () => (
    <div className="cart-summary">
      <div className="summary-info">
        <div className="summary-row">
          <div className="summary-label">已选商品:</div>
          <div className="summary-value" id="selected-count">{selectedCount} 件</div>
        </div>
        <div className="summary-row">
          <div className="summary-label">商品总额:</div>
          <div className="summary-value" id="selected-total">
            ¥ {safeToLocaleString(totalPrice, 'en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
      </div>
      <button 
        className="submit-order-btn"
        onClick={handleSubmitOrder}
        disabled={selectedCount === 0}
      >
        {t('cart.summary.submitOrder', { defaultValue: '提交订单' })}
      </button>
    </div>
  );
  
  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>{t('cart.title', { defaultValue: '保存订单记录' })}</h1>
        <p>{t('cart.subtitle', { defaultValue: '超级管理员可看到所有账号的订单信息' })}</p>
      </div>
      <div className="cart-content">
        {renderCartControls()}
        <div className="cart-list">
          {cartItems.map(renderCartItem)}
        </div>
        {renderCartSummary()}
      </div>
    </div>
  );
};

export default CartPage;