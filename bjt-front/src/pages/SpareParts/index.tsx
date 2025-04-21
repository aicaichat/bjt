import React, { useState, useEffect, ChangeEvent, createRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllSpareParts, SparePart, getSparePartsFilterOptions } from '../../api/sparePartsApi';
import './SpareParts.css';

// 定义 Timeout 类型，避免使用 NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

const SparePartsPage: React.FC = () => {
  // 状态管理
  const [cart, setCart] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [currentPartType, setCurrentPartType] = useState('consumable');
  const [currentProductType, setCurrentProductType] = useState('machine');
  const [selectedModel, setSelectedModel] = useState('ALL');
  const [userAccountType, setUserAccountType] = useState('sales');
  const [activeNotification, setActiveNotification] = useState<HTMLDivElement | null>(null);
  const [notificationTimeout, setNotificationTimeout] = useState<Timeout | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  
  // API数据状态
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostModels, setHostModels] = useState<string[]>([]);
  const [accessoryModels, setAccessoryModels] = useState<string[]>([]);
  
  // 在组件首次渲染时从localStorage加载购物车数据并获取备件数据
  useEffect(() => {
    loadCart();
    loadSparePartsData();
    loadFilterOptions();
  }, []);
  
  // 在筛选条件变化时重新加载数据
  useEffect(() => {
    loadSparePartsData();
  }, [currentPartType, selectedModel]);
  
  // 加载备件数据
  const loadSparePartsData = async () => {
    try {
      setLoading(true);
      const data = await getAllSpareParts({
        consumable: currentPartType,
        model: selectedModel !== 'ALL' ? selectedModel : undefined
      });
      
      // 检查数据是否是数组，如果不是则创建空数组
      const partsArray = Array.isArray(data) ? data : [];
      setSpareParts(partsArray);
      
      if (!Array.isArray(data)) {
        console.error('API返回的备件数据不是数组格式:', data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load spare parts data:', err);
      setSpareParts([]);
      setError('加载备件数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      const options = await getSparePartsFilterOptions();
      
      // 验证返回的数据结构，如果不符合预期，则使用默认空数组
      const hostModelsList = Array.isArray(options?.hostModels) ? options.hostModels : [];
      const accessoryModelsList = Array.isArray(options?.accessoryModels) ? options.accessoryModels : [];
      
      setHostModels(hostModelsList);
      setAccessoryModels(accessoryModelsList);
      
      if (!options || !options.hostModels || !options.accessoryModels) {
        console.error('API返回的筛选选项数据结构不符合预期:', options);
      }
    } catch (err) {
      console.error('Failed to load filter options:', err);
      setHostModels([]);
      setAccessoryModels([]);
    }
  };
  
  // 加载购物车数据
  const loadCart = () => {
    const savedCart = localStorage.getItem('bjt_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (e) {
        console.error('Error loading cart:', e);
        setCart([]);
      }
    }
  };
  
  // 根据筛选条件显示备件列表
  const getFilteredParts = () => {
    // 确保即使 spareParts 是未定义或 null，也返回空数组
    return Array.isArray(spareParts) ? spareParts : [];
  };
  
  // 找到适合数量的价格区间
  const findPriceTier = (priceTiers: any[], quantity: number) => {
    // 如果没有价格区间，返回默认值
    if (!priceTiers || priceTiers.length === 0) {
      return { range: '1+', price: 0 };
    }
    
    // 遍历所有价格区间，找到数量适合的区间
    for (const tier of priceTiers) {
      const range = tier.range;
      
      if (range.includes('-')) {
        // 区间格式: "1-10"
        const [min, max] = range.split('-').map((n: string) => parseInt(n));
        if (quantity >= min && quantity <= max) {
          return tier;
        }
      } else if (range.includes('>')) {
        // 区间格式: ">100"
        const min = parseInt(range.replace('>', ''));
        if (quantity > min) {
          return tier;
        }
      } else {
        // 其他格式
        return tier;
      }
    }
    
    // 如果没有找到匹配的区间，返回最后一个区间（通常是最大数量）
    return priceTiers[priceTiers.length - 1];
  };

  // 获取产品详细信息
  const getProductDetails = (productId: string) => {
    // 在所有数据中查找产品
    let product = spareParts.find(p => p.id === productId);
    
    if (product) {
      return product; // 返回完整的产品对象，包括prices属性
    }
    
    // 如果未找到产品，返回默认值
    return {
      image_url: 'https://via.placeholder.com/120x120?text=Unknown',
      part_number: '未知',
      app_sn: '未知',
      package_size: '未知',
      package_weight: 0,
      prices: { 
        original: 0,
        current: 0,
        tiers: [{ range: '1+', price: 0 }]
      }
    };
  };
  
  // 添加到购物车
  const addToCart = (id: string, name: string, price: number, quantity: number) => {
    // 获取产品详情和价格梯度
    const product = getProductDetails(id);
    const priceTiers = product.prices?.tiers || [{ range: '1+', price: price }];
    
    // 检查是否已在购物车中
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
    if (existingItemIndex >= 0) {
      // 更新现有项
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      
      // 更新当前价格区间
      const newTier = findPriceTier(priceTiers, updatedCart[existingItemIndex].quantity);
      updatedCart[existingItemIndex].currentTier = newTier;
      updatedCart[existingItemIndex].price = newTier.price;
      
      // 更新小计
      updatedCart[existingItemIndex].subtotal = updatedCart[existingItemIndex].quantity * newTier.price;
      
      setCart(updatedCart);
    } else {
      // 找到适合数量的价格区间
      const initialTier = findPriceTier(priceTiers, quantity);
      
      // 添加新项
      const newItem = {
        id,
        name,
        basePrice: price,
        price: initialTier.price,
        currentTier: initialTier,
        quantity,
        subtotal: quantity * initialTier.price,
        priceTiers: priceTiers
      };
      
      setCart([...cart, newItem]);
    }
    
    // 保存到本地存储
    localStorage.setItem('bjt_cart', JSON.stringify(cart));
    
    // 显示添加成功通知
    showCartNotification(`${quantity} x ${name} 已添加到购物车`);
  };
  
  // 更新购物车项数量
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    newQuantity = parseInt(newQuantity.toString());
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    }
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    
    // 更新价格区间
    if (updatedCart[index].priceTiers) {
      const newTier = findPriceTier(updatedCart[index].priceTiers, newQuantity);
      updatedCart[index].currentTier = newTier;
      updatedCart[index].price = newTier.price;
      updatedCart[index].subtotal = newQuantity * newTier.price;
    } else {
      updatedCart[index].subtotal = newQuantity * updatedCart[index].price;
    }
    
    setCart(updatedCart);
    localStorage.setItem('bjt_cart', JSON.stringify(updatedCart));
  };
  
  // 从购物车中移除
  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
    localStorage.setItem('bjt_cart', JSON.stringify(updatedCart));
  };
  
  // 清空购物车
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('bjt_cart');
    setShowConfirmClear(false);
    showCartNotification('购物车已清空');
  };
  
  // 显示购物车通知
  const showCartNotification = (message: string, duration = 3000) => {
    // 如果已经有通知在显示，先清除它
    if (activeNotification) {
      document.body.removeChild(activeNotification);
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    
    // 通知内容
    const content = document.createElement('div');
    content.className = 'cart-notification-content';
    
    const icon = document.createElement('div');
    icon.className = 'cart-notification-icon';
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
    
    const text = document.createElement('div');
    text.className = 'cart-notification-text';
    text.textContent = message;
    
    content.appendChild(icon);
    content.appendChild(text);
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cart-notification-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
      closeNotification(notification);
    });
    
    // 进度条
    const progress = document.createElement('div');
    progress.className = 'cart-notification-progress';
    
    // 添加到通知元素
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    notification.appendChild(progress);
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 添加进度条动画
    progress.style.transition = `width ${duration}ms linear`;
    
    // 强制重绘
    notification.offsetHeight;
    
    // 开始进度条动画
    requestAnimationFrame(() => {
      notification.classList.add('show');
      progress.style.width = '0%';
    });
    
    // 设置自动关闭
    const timeout = setTimeout(() => {
      closeNotification(notification);
    }, duration);
    
    // 保存当前通知引用
    setActiveNotification(notification);
    setNotificationTimeout(timeout);
    
    return notification;
  };
  
  // 关闭通知
  const closeNotification = (notification: HTMLDivElement) => {
    if (!notification) return;
    
    notification.classList.remove('show');
    
    // 移除元素
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (activeNotification === notification) {
        setActiveNotification(null);
      }
    }, 300);
  };

  // 创建对数量输入框的引用
  const quantityRefs = React.useRef<Record<string, HTMLInputElement>>({});
  
  // 处理数量变化
  const handleQuantityChange = (
    id: number,
    event?: React.ChangeEvent<HTMLInputElement>,
    action?: 'increase' | 'decrease'
  ) => {
    const refKey = `quantity-${id}`;
    const input = quantityRefs.current[refKey];
    
    if (!input) {
      console.error(`No ref found for quantity input with id ${id}`);
      return;
    }
    
    let value = event ? parseInt(event.target.value) || 0 : parseInt(input.value) || 0;

    if (action === 'increase') {
      value += 1;
    } else if (action === 'decrease') {
      value = Math.max(0, value - 1);
    }

    // 更新输入框的值
    input.value = value.toString();

    // 更新state
    setQuantities((prev) => ({
      ...prev,
      [id]: value
    }));
  };
  
  // 计算购物车总价
  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // 处理图片加载错误
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.src = '/images/spare-parts/default.svg';
    img.onerror = null; // 防止循环触发
  };
  
  // 渲染备件列表
  const renderSpareParts = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">正在加载备件数据...</div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="retry-button" onClick={loadSparePartsData}>重新加载</button>
        </div>
      );
    }
    
    const filteredParts = getFilteredParts();
    
    if (filteredParts.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
          没有找到符合条件的备件
        </div>
      );
    }
    
    return filteredParts.map(part => {
      // 价格层级HTML
      const priceTiersHtml = part.prices?.tiers.map((tier: any, index: number) => {
        if (index === 0) {
          return (
            <div className="price-tier" key={index}>
              <span className="original-price">¥{part.prices?.original.toFixed(2)}</span>
              <span className="current-price">¥{tier.price.toFixed(2)}</span> ({tier.range})
            </div>
          );
        } else {
          return (
            <div className="price-tier" key={index}>
              ¥{tier.price.toFixed(2)} ({tier.range})
            </div>
          );
        }
      }) || [];
      
      // 库存地区HTML
      const inventoryLocationsHtml = part.inventory?.locations.map((location: any, index: number) => (
        <div key={index}>{location.code}: {location.count}</div>
      )) || [];
      
      // 为每个备件项生成一个唯一的引用key
      const refKey = `quantity-${part.id}`;
      const partId = Number(part.id);
      
      return (
        <div className="spare-part-item" key={part.id}>
          <div className="part-image">
            <img 
              src={part.image_url} 
              alt={part.name_cn} 
              onError={handleImageError}
            />
          </div>
          <div className="part-details">
            <div className="part-info">
              <h3>{part.name_cn}</h3>
              
              <div className="part-property">
                <span className="property-label">料号:</span>
                <span>{part.part_number}</span>
              </div>
              
              <div className="part-property">
                <span className="property-label">适配型号:</span>
                <span>{part.app_model}</span>
              </div>
              
              <div className="part-property">
                <span className="property-label">适配序列号:</span>
                <span>{part.app_sn}</span>
              </div>
              
              <div className="part-property">
                <span className="property-label">配件类型:</span>
                <span>{part.accessory_type || '-'}</span>
              </div>
              
              <div className="part-property">
                <span className="property-label">包装尺寸:</span>
                <span>{part.package_size}</span>
              </div>
              
              <div className="part-property">
                <span className="property-label">包装毛重:</span>
                <span>{part.package_weight} kg</span>
              </div>
            </div>
          </div>
          <div className="price-column">
            <div className="price-tiers">
              {priceTiersHtml}
            </div>
          </div>
          <div className="inventory-column">
            <div className="inventory-status">
              <div className={`inventory-badge inventory-${part.inventory?.status || 'medium'}`}>
                {part.inventory?.statusText || '适中'}
              </div>
            </div>
            {inventoryLocationsHtml}
          </div>
          <div className="part-actions">
            <div className="quantity-control">
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(partId, undefined, 'decrease')}
              >
                -
              </button>
              <input 
                type="number" 
                className={`quantity-input quantity-input-${part.id}`}
                min="1" 
                defaultValue="1" 
                max="999"
                onChange={(e) => handleQuantityChange(partId, e)}
                ref={el => {
                  if (el) quantityRefs.current[refKey] = el;
                }}
                data-id={part.id}
              />
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(partId, undefined, 'increase')}
              >
                +
              </button>
            </div>
            <button 
              className="add-to-cart" 
              onClick={() => {
                const quantity = quantities[partId] || 1;
                addToCart(part.id, part.name_cn, part.prices?.tiers[0].price || 0, quantity);
              }}
            >
              <span className="cart-icon-small">🛒</span> 添加
            </button>
          </div>
        </div>
      );
    });
  };
  
  // 渲染购物车项
  const renderCartItems = () => {
    if (cart.length === 0) {
      return <div className="empty-cart-message">购物车为空</div>;
    }
    
    return cart.map((item, index) => {
      // 获取产品的完整信息
      const productDetails = getProductDetails(item.id);
      
      // 获取当前价格区间
      const currentTier = item.currentTier;
      const tierText = currentTier ? ` (${currentTier.range})` : '';
      
      // 创建价格梯度HTML
      let tieredPricingHtml = null;
      if (item.priceTiers && item.priceTiers.length > 0) {
        tieredPricingHtml = (
          <div className="cart-item-tiers">
            {item.priceTiers.map((tier: any, i: number) => {
              // 高亮当前价格区间
              const isCurrentTier = currentTier && currentTier.range === tier.range;
              const tierClass = isCurrentTier ? 'tier-current' : '';
              
              return (
                <React.Fragment key={i}>
                  <span className={tierClass}>¥{tier.price} ({tier.range})</span>
                  {i < item.priceTiers.length - 1 && ' | '}
                </React.Fragment>
              );
            })}
          </div>
        );
      }
      
      return (
        <div className="cart-item" key={index}>
          <div className="cart-item-top">
            <img className="cart-item-img" src={productDetails.image_url} alt={item.name} />
            <div className="cart-item-main">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-sku">料号: {productDetails.part_number}</div>
              <div className="cart-item-price">¥{item.price}{tierText} × {item.quantity}</div>
              {tieredPricingHtml}
            </div>
          </div>
          <div className="cart-item-details">
            <div className="cart-item-detail">适配序列号: {productDetails.app_sn || '所有'}</div>
            <div className="cart-item-detail">包装尺寸: {productDetails.package_size || '-'}</div>
            <div className="cart-item-detail">包装毛重: {productDetails.package_weight || '-'} kg</div>
          </div>
          <div className="cart-item-controls">
            <div className="cart-item-qty">
              <button className="cart-qty-btn" onClick={() => updateCartItemQuantity(index, item.quantity - 1)}>-</button>
              <input 
                className="cart-qty-input" 
                type="number" 
                value={item.quantity} 
                onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value))} 
              />
              <button className="cart-qty-btn" onClick={() => updateCartItemQuantity(index, item.quantity + 1)}>+</button>
            </div>
            <button className="cart-item-remove" onClick={() => removeFromCart(index)}>×</button>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* 面包屑导航 */}
      <div className="breadcrumb">
        <Link to="/">首页</Link> &gt; <Link to="/products">产品中心</Link> &gt; <span>备件选择</span>
      </div>
      
      {/* 角色切换器 */}
      <div className="role-switcher">
        <div className="role-title">选择身份</div>
        <div className="role-buttons">
          <button
            className={`role-button ${userAccountType === 'customer' ? 'active' : ''}`}
            onClick={() => setUserAccountType('customer')}
          >
            普通客户
          </button>
          <button
            className={`role-button ${userAccountType === 'partner' ? 'active' : ''}`}
            onClick={() => setUserAccountType('partner')}
          >
            合作伙伴
          </button>
          <button
            className={`role-button ${userAccountType === 'sales' ? 'active' : ''}`}
            onClick={() => setUserAccountType('sales')}
          >
            销售人员
          </button>
        </div>
      </div>
      
      {/* 产品栏目标题 */}
      <div className="section-title">
        <div className="title-text">
          <h2>备件选择</h2>
          <p>选择完毕后请点击加入购物车</p>
        </div>
      </div>
      
      {/* 备件类型选择 */}
      <div className="tabs">
        <button 
          className={`tab-button ${currentPartType === 'consumable' ? 'active' : ''}`}
          onClick={() => setCurrentPartType('consumable')}
        >
          耗材配件
        </button>
        <button 
          className={`tab-button ${currentPartType === 'wearing' ? 'active' : ''}`}
          onClick={() => setCurrentPartType('wearing')}
        >
          易损配件
        </button>
        <button 
          className={`tab-button ${currentPartType === 'standard' ? 'active' : ''}`}
          onClick={() => setCurrentPartType('standard')}
        >
          标准配件
        </button>
      </div>
      
      {/* 主机型号筛选 */}
      <div className="filter-section">
        <div className="filter-title">主机型号</div>
        <div className="filter-options">
          <button 
            className={`filter-option ${selectedModel === 'ALL' ? 'active' : ''}`} 
            onClick={() => setSelectedModel('ALL')}
          >
            ALL
          </button>
          {hostModels.map((model, index) => (
            <button 
              key={index}
              className={`filter-option ${selectedModel === model ? 'active' : ''}`}
              onClick={() => setSelectedModel(model)}
            >
              {model}
            </button>
          ))}
        </div>
      </div>
      
      {/* 辅机型号筛选 */}
      <div className="filter-section">
        <div className="filter-title">辅机型号</div>
        <div className="filter-options">
          <button 
            className={`filter-option ${currentProductType === 'machine' ? 'active' : ''}`}
            onClick={() => setCurrentProductType('machine')}
          >
            ALL
          </button>
          {accessoryModels.map((model, index) => (
            <button 
              key={index}
              className={`filter-option ${currentProductType === model ? 'active' : ''}`}
              onClick={() => setCurrentProductType(model)}
            >
              {model}
            </button>
          ))}
        </div>
      </div>
      
      {/* 备件列表 */}
      <div className="spare-parts-list-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div>加载中...</div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">!</div>
            <div>{error}</div>
          </div>
        ) : getFilteredParts().length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>没有找到符合条件的备件</div>
          </div>
        ) : (
          <div className="spare-parts-grid">
            {renderSpareParts()}
          </div>
        )}
      </div>
      
      {/* 回到顶部按钮 */}
      <button 
        className="back-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
      
      {/* 购物车浮动按钮 */}
      <button 
        className="cart-float-btn"
        onClick={() => setShowCartModal(true)}
      >
        <div className="cart-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {cart.length > 0 && (
            <span className="cart-badge">{cart.length}</span>
          )}
        </div>
      </button>
      
      {/* 购物车预览 */}
      {showCartModal && (
        <div className="cart-preview active">
          <div className="cart-header">
            <div className="cart-title">购物车</div>
            <button className="close-cart" onClick={() => setShowCartModal(false)}>×</button>
          </div>
          <div className="cart-items">
            {renderCartItems()}
          </div>
          <div className="cart-footer">
            <div className="cart-total">
              <span>合计:</span>
              <span>¥{calculateCartTotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button 
                id="clear-cart-btn" 
                className="checkout-btn" 
                style={{ backgroundColor: '#e53935', width: 'auto', marginRight: '10px' }}
                onClick={() => setShowConfirmClear(true)}
              >
                清空购物车
              </button>
              <button className="checkout-btn">结算</button>
            </div>
            
            {/* 清空购物车确认面板 */}
            <div className={`cart-confirm ${showConfirmClear ? 'show' : ''}`}>
              <div className="cart-confirm-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div className="cart-confirm-title">确认清空购物车</div>
              <div className="cart-confirm-text">此操作将清空购物车中所有商品，且无法恢复。</div>
              <div className="cart-confirm-buttons">
                <button 
                  className="cart-confirm-button cart-confirm-cancel"
                  onClick={() => setShowConfirmClear(false)}
                >
                  取消
                </button>
                <button 
                  className="cart-confirm-button cart-confirm-proceed"
                  onClick={clearCart}
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SparePartsPage; 