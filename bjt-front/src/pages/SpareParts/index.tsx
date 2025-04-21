import React, { useState, useEffect, ChangeEvent, createRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSpareParts, SparePart, getSparePartsFilterOptions } from '../../api/sparePartsApi';
import './SpareParts.css';

// 定义 Timeout 类型，避免使用 NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

// 根据登录账号确定用户区域
const getUserRegionFromEmail = (email: string) => {
  if (email.includes('eu')) return 'eu';
  if (email.includes('au')) return 'au';
  if (email.includes('northamerica')) return 'na';
  return 'cn'; // 默认为中国区域
};

// 检查用户是否是VIP
const isVipUser = (email: string) => {
  return email.toLowerCase().includes('vip');
};

const SparePartsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [cart, setCart] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [currentPartType, setCurrentPartType] = useState('consumable');
  const [currentProductType, setCurrentProductType] = useState('machine');
  const [selectedModel, setSelectedModel] = useState('ALL');
  const [activeNotification, setActiveNotification] = useState<HTMLDivElement | null>(null);
  const [notificationTimeout, setNotificationTimeout] = useState<Timeout | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // 用户数据状态
  const [currentUser, setCurrentUser] = useState({
    id: '',
    username: '',
    role: 'customer',
    discount: 0.9,
    name: '',
    email: '',
    region: 'cn'
  });
  
  // API数据状态
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostModels, setHostModels] = useState<string[]>([]);
  const [accessoryModels, setAccessoryModels] = useState<string[]>([]);
  
  // 检查用户身份验证
  useEffect(() => {
    const authData = localStorage.getItem('user');
    
    if (!authData) {
      // 未登录，重定向到登录页面
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(authData);
      const userEmail = userData.email || '';
      const isVip = isVipUser(userEmail);
      
      // 设置用户数据
      setCurrentUser({
        id: userData.id || 'guest',
        username: userData.username || userData.name || 'Guest User',
        role: userData.role || 'customer',
        // VIP用户有更高的折扣, 伙伴关系次之
        discount: isVip ? 0.8 : userData.role === 'partner' ? 0.85 : 0.9,
        name: userData.name || userData.displayName || 'Guest User',
        email: userEmail,
        region: getUserRegionFromEmail(userEmail)
      });
    } catch (err) {
      console.error('Error parsing auth data:', err);
      navigate('/login');
    }
  }, [navigate]);
  
  // 获取用户角色的显示名称
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'sales': return 'Sales';
      case 'customer': return 'Customer';
      case 'partner': return 'Partner';
      default: return 'Guest';
    }
  };
  
  // Get the currency symbol based on user's region
  const getCurrencySymbol = () => {
    switch(currentUser.region) {
      case 'eu': return '€';
      case 'na': return '$';
      case 'au': return 'A$';
      case 'cn': return '¥';
      default: return '¥';
    }
  };
  
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
  
  // 更新数量输入框
  const handleQuantityChange = (
    id: string,
    event?: React.ChangeEvent<HTMLInputElement>,
    action?: 'increase' | 'decrease'
  ) => {
    let newValue = quantities[id] || 1;
    
    if (action === 'increase') {
      newValue += 1;
    } else if (action === 'decrease') {
      newValue = Math.max(1, newValue - 1);
    } else if (event) {
      const inputValue = parseInt(event.target.value);
      newValue = isNaN(inputValue) ? 1 : Math.max(1, inputValue);
    }
    
    setQuantities({
      ...quantities,
      [id]: newValue
    });
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
    const filteredParts = getFilteredParts();
    
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading spare parts...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-state">
          <div className="error-icon">!</div>
          <p>{error}</p>
        </div>
      );
    }
    
    if (filteredParts.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p>No spare parts found matching your criteria.</p>
        </div>
      );
    }
    
    return (
      <>
        <div className="spare-parts-list-header">
          <div className="list-header-image">Image</div>
          <div className="list-header-details">Part Details</div>
          <div className="list-header-pricing">Pricing & Actions</div>
        </div>
        <div className="spare-parts-list">
          {filteredParts.map((part) => (
            <div key={part.id} className="spare-part-item">
              <div className="part-image">
                <img 
                  src={part.image_url} 
                  alt={part.name_cn || part.part_number} 
                  onError={handleImageError}
                />
              </div>
              
              <div className="part-content">
                <div className="part-details">
                  <h3 className="part-name">{part.name_cn || part.part_number}</h3>
                  <div className="part-specs">
                    <div className="spec-item">
                      <span className="spec-label">Part Number:</span>
                      <span className="spec-value">{part.part_number}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Compatible:</span>
                      <span className="spec-value">{part.app_model || 'Universal'}</span>
                    </div>
                    
                    {/* Only show inventory for sales and admin */}
                    {(currentUser.role === 'sales' || currentUser.role === 'admin') && (
                      <div className="spec-item inventory">
                        <span className="spec-label">Inventory:</span>
                        <span className="spec-value">
                          {part.inventory?.total || part.inventory?.status || 'Not available'}
                        </span>
                      </div>
                    )}
                    
                    <div className="spec-item">
                      <span className="spec-label">Package:</span>
                      <span className="spec-value">{part.package_size}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Weight:</span>
                      <span className="spec-value">{part.package_weight}kg</span>
                    </div>
                  </div>
                </div>
                
                <div className="part-pricing">
                  <div className="price-tiers">
                    {/* Display price tiers with role-based pricing and regional currency */}
                    {part.prices && part.prices.tiers ? (
                      part.prices.tiers.map((tier: any, index: number) => (
                        <div key={index} className="price-tier">
                          <span className="tier-range">{tier.range}:</span>
                          <span className="tier-price">
                            {getCurrencySymbol()}{tier.price.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="price-tier">
                        <span className="tier-price">
                          {getCurrencySymbol()}{(part.prices?.current || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="part-actions">
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn minus"
                        onClick={() => handleQuantityChange(part.id, undefined, 'decrease')}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantities[part.id] || 1}
                        onChange={(e) => handleQuantityChange(part.id, e)}
                        className="quantity-input"
                      />
                      <button 
                        className="quantity-btn plus"
                        onClick={() => handleQuantityChange(part.id, undefined, 'increase')}
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => addToCart(
                        part.id,
                        part.name_cn || part.part_number,
                        part.prices?.current || part.prices?.tiers?.[0]?.price || 0,
                        quantities[part.id] || 1
                      )}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
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
    <div className="spare-parts-page">
      {/* 显示添加到购物车的通知 */}
      <div className="cart-notifications" id="cart-notifications"></div>
      
      <div className="breadcrumb">
        <Link to="/">Home</Link> &gt; <Link to="/products">Products</Link> &gt; <span>Spare Parts</span>
      </div>
      
      <div className="top-bar">
        <div className="top-bar-content">
          <span>Please find and select the spare parts you need.</span>
        </div>
      </div>
      
      <div className="user-info-bar">
        <div className="container">
          <div className="user-info">
            <span className="user-label">User:</span>
            <span className="user-value">{currentUser.name || currentUser.username}</span>
            <span className="role-badge">{getRoleDisplayName(currentUser.role)}</span>
            {isVipUser(currentUser.email) && (
              <span className="vip-badge">VIP</span>
            )}
          </div>
          <div className="user-actions">
            <div className="user-email">
              <span className="email-label">Email:</span>
              <span className="email-value">{currentUser.email}</span>
            </div>
            <button 
              className="btn-logout" 
              onClick={() => {
                localStorage.removeItem('user');
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="container" style={{ marginTop: '10px' }}>
          <div className="user-role">
            <span>Region:</span>
            <span className="role-badge">{currentUser.region.toUpperCase()}</span>
            <span className="currency-label">Currency: {getCurrencySymbol()}</span>
            {isVipUser(currentUser.email) && (
              <span className="discount-badge">Discount: 20%</span>
            )}
            {!isVipUser(currentUser.email) && currentUser.role === 'partner' && (
              <span className="discount-badge">Discount: 15%</span>
            )}
            {!isVipUser(currentUser.email) && currentUser.role === 'customer' && (
              <span className="discount-badge">Discount: 10%</span>
            )}
          </div>
        </div>
      </div>
      
      <h1 className="page-title">Spare Parts & Accessories</h1>
      
      <div className="filter-container">
        {/* 备件类型选择 */}
        <div className="filter-section">
          <h3>Part Type</h3>
          <div className="part-type-buttons">
            <button
              className={`part-type-button ${currentPartType === 'consumable' ? 'active' : ''}`}
              onClick={() => setCurrentPartType('consumable')}
            >
              Consumables
            </button>
            <button
              className={`part-type-button ${currentPartType === 'electronic' ? 'active' : ''}`}
              onClick={() => setCurrentPartType('electronic')}
            >
              Electronics
            </button>
            <button
              className={`part-type-button ${currentPartType === 'mechanical' ? 'active' : ''}`}
              onClick={() => setCurrentPartType('mechanical')}
            >
              Mechanical
            </button>
          </div>
        </div>
        
        {/* 产品类型选择 */}
        <div className="filter-section">
          <h3>Product Type</h3>
          <div className="product-type-buttons">
            <button
              className={`product-type-button ${currentProductType === 'machine' ? 'active' : ''}`}
              onClick={() => setCurrentProductType('machine')}
            >
              Machines
            </button>
            <button
              className={`product-type-button ${currentProductType === 'accessory' ? 'active' : ''}`}
              onClick={() => setCurrentProductType('accessory')}
            >
              Accessories
            </button>
          </div>
        </div>
        
        {/* 模型选择 */}
        <div className="filter-section">
          <h3>Machine Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
          >
            <option value="ALL">All Models</option>
            {currentProductType === 'machine' ? (
              hostModels.map((model, index) => (
                <option key={index} value={model}>{model}</option>
              ))
            ) : (
              accessoryModels.map((model, index) => (
                <option key={index} value={model}>{model}</option>
              ))
            )}
          </select>
        </div>
      </div>
      
      {/* 备件列表 */}
      <div className="spare-parts-list-container">
        {renderSpareParts()}
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
    </div>
  );
};

export default SparePartsPage; 