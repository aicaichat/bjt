import React, { useState, useEffect, ChangeEvent, createRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSpareParts, SparePart, getSparePartsFilterOptions, SparePartsFilterOptions } from '../../api/sparePartsApi';
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
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  
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
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostModels, setHostModels] = useState<string[]>([]);
  const [accessoryModels, setAccessoryModels] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<SparePartsFilterOptions | null>(null);
  
  // 添加tooltip状态管理
  const [tooltipVisible, setTooltipVisible] = useState<{ [key: string]: boolean }>({});
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
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
    fetchModels(currentProductType); // 初始化时加载当前产品类型的型号
  }, []);
  
  // 在筛选条件变化时重新加载数据
  useEffect(() => {
    loadSparePartsData();
  }, [currentPartType, currentProductType, selectedModel]);
  
  // 加载备件数据
  const loadSparePartsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用新的API接口获取数据
      const data = await getAllSpareParts({
        consumable: currentPartType,
        model: selectedModel !== 'ALL' ? selectedModel : undefined,
        product_type: currentProductType
      });
      
      setSpareParts(data);
    } catch (err) {
      console.error('Error loading spare parts data:', err);
      setError('Failed to load spare parts data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      // 不传参数，获取所有筛选选项
      const options = await getSparePartsFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error loading filter options:', err);
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
  
  // 根据筛选条件过滤备件
  const getFilteredParts = () => {
    // 确保 spareParts 不是 null 或 undefined
    if (!Array.isArray(spareParts)) return [];
    
    return spareParts;
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
  
  // 根据库存数量确定库存级别
  const getInventoryLevel = (quantity: number): string => {
    if (quantity > 30) return 'high';
    if (quantity > 10) return 'medium';
    return 'low';
  };
  
  // 处理规格悬浮提示
  const handleSpecMouseEnter = (e: React.MouseEvent, partId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left,
      y: rect.bottom + 10
    });
    setTooltipVisible(prev => ({
      ...prev,
      [partId]: true
    }));
  };
  
  const handleSpecMouseLeave = (partId: string) => {
    setTooltipVisible(prev => ({
      ...prev,
      [partId]: false
    }));
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
      <table className="products-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Product Code</th>
            <th>Specifications</th>
            <th>Price</th>
            {(currentUser.role === 'sales' || currentUser.role === 'admin') && <th>Inventory</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredParts.map((part) => (
            <tr key={part.id}>
              <td>
                <img 
                  src={part.image_url} 
                  alt={part.name_cn} 
                  className="product-image"
                  onError={handleImageError}
                />
              </td>
              <td>
                <div className="product-name">{part.name_cn}</div>
                <div className="product-model">{part.app_model}</div>
              </td>
              <td>
                <div className="product-code">{part.part_number}</div>
              </td>
              <td>
                <div 
                  className="specs-info"
                  onMouseEnter={(e) => handleSpecMouseEnter(e, part.id)}
                  onMouseLeave={() => handleSpecMouseLeave(part.id)}
                >
                  <div className="specs-row">
                    <div className="specs-label">Spec:</div>
                    <div className="specs-value">{currentUser.region === 'na' || currentUser.region === 'au' ? part.spec_imperial : part.spec}</div>
                  </div>
                  <div className="specs-row">
                    <div className="specs-label">适配序列号:</div>
                    <div className="specs-value">{part.app_sn}</div>
                  </div>
                  
                  <div className="tooltip-hint">
                    <span className="tooltip-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </span>
                    <span className="tooltip-text">悬浮查看详细规格</span>
                  </div>
                  
                  {/* 规格信息悬浮提示 */}
                  {tooltipVisible[part.id] && (
                    <div className="specs-tooltip" style={{ 
                      position: 'fixed',
                      left: `${tooltipPosition.x}px`, 
                      top: `${tooltipPosition.y}px` 
                    }}>
                      <div className="tooltip-header">产品详细规格</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span className="tooltip-value">{part.package_size}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span className="tooltip-value">
                          {part.package_size_imperial || (() => {
                            try {
                              const dimensions = part.package_size.split('×');
                              if (dimensions.length === 3) {
                                return `${Math.round(parseFloat(dimensions[0]) / 2.54 * 10) / 10} × ${Math.round(parseFloat(dimensions[1]) / 2.54 * 10) / 10} × ${Math.round(parseFloat(dimensions[2]) / 2.54 * 10) / 10}`;
                              }
                              return part.package_size;
                            } catch (e) {
                              return part.package_size;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span className="tooltip-value">{part.package_weight}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span className="tooltip-value">{Math.round(part.package_weight * 2.2046 * 100) / 100}</span>
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td>
                {part.prices.tiers.map((tier, index) => {
                  let price = tier.price;
                  switch(currentUser.region) {
                    case 'eu': price = tier.eu; break;
                    case 'na': price = tier.na; break;
                    case 'au': price = tier.au; break;
                    case 'cn': price = tier.cn; break;
                  }
                  
                  return (
                    <div key={index} className="price-tier">
                      <span className="price-range">{tier.range}:</span>
                      <span className="price-value">
                        {getCurrencySymbol()}{price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </td>
              {/* 只有销售人员和管理员可以看到库存 */}
              {(currentUser.role === 'sales' || currentUser.role === 'admin') && (
                <td>
                  <div className="inventory-container">
                    <div className="inventory-item">
                      <span className="inventory-region">EU:</span>
                      <span className={`inventory-value ${getInventoryLevel(part.inventory.eu)}`}>{part.inventory.eu}</span>
                    </div>
                    <div className="inventory-item">
                      <span className="inventory-region">NA:</span>
                      <span className={`inventory-value ${getInventoryLevel(part.inventory.na)}`}>{part.inventory.na}</span>
                    </div>
                    <div className="inventory-item">
                      <span className="inventory-region">AU:</span>
                      <span className={`inventory-value ${getInventoryLevel(part.inventory.au)}`}>{part.inventory.au}</span>
                    </div>
                    <div className="inventory-item">
                      <span className="inventory-region">CN:</span>
                      <span className={`inventory-value ${getInventoryLevel(part.inventory.cn)}`}>{part.inventory.cn}</span>
                    </div>
                  </div>
                </td>
              )}
              <td>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Qty:</span>
                  <input 
                    type="number" 
                    className="quantity-input" 
                    value={quantities[part.id] || 1} 
                    min="1"
                    onChange={(e) => handleQuantityChange(part.id, e)}
                  />
                  <button 
                    className="btn-add"
                    onClick={() => addToCart(
                      part.id,
                      part.name_cn,
                      getPriceForRegion(part),
                      quantities[part.id] || 1
                    )}
                  >
                    Add
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  // 获取区域对应的价格
  const getPriceForRegion = (part: SparePart): number => {
    const quantity = quantities[part.id] || 1;
    const tier = part.prices.tiers.find(t => {
      const range = t.range.replace(/[^\d-]/g, '');
      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        return quantity >= min && quantity <= max;
      } else {
        const min = parseInt(range.replace('>', ''));
        return quantity > min;
      }
    }) || part.prices.tiers[0];
    
    switch(currentUser.region) {
      case 'eu': return tier.eu;
      case 'na': return tier.na;
      case 'au': return tier.au;
      case 'cn': return tier.cn;
      default: return tier.price;
    }
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

  // 用于获取不同产品类型的型号
  const fetchModels = async (productType: string) => {
    try {
      setLoading(true);
      // 根据产品类型获取不同的型号列表
      const options = await getSparePartsFilterOptions(productType);
      
      if (productType === 'machine') {
        setHostModels(options.hostModels);
      } else if (productType === 'accessory') {
        setAccessoryModels(options.accessoryModels);
      }
      
      // 重置已选型号为空
      setSelectedModel('');
      setLoading(false);
    } catch (err) {
      console.error(`Error loading ${productType} models:`, err);
      setError(`Failed to load ${productType} models. Please try again later.`);
      setLoading(false);
    }
  };

  // 处理产品类型变更
  const handleProductTypeChange = (type: string) => {
    setCurrentProductType(type);
    fetchModels(type);
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
      
      <h1 className="page-title">Spare Parts & Accessories</h1>
      
      {/* 筛选区域 */}
      <div className="filter-container">
        {/* 产品类型选择（主机或配件） */}
        <div className="filter-section">
          <h3>产品类型</h3>
          <div className="product-type-buttons">
            <button 
              className={`product-type-button ${currentProductType === 'machine' ? 'active' : ''}`} 
              onClick={() => handleProductTypeChange('machine')}
            >
              主机
            </button>
            <button 
              className={`product-type-button ${currentProductType === 'accessory' ? 'active' : ''}`} 
              onClick={() => handleProductTypeChange('accessory')}
            >
              配件
            </button>
          </div>
        </div>
        
        {/* 型号选择 */}
        <div className="filter-section">
          <h3>适用机型</h3>
          <div className="model-select-container">
            <select 
              className="model-select" 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">所有型号</option>
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
            {loading && <span className="loading-indicator">加载中...</span>}
          </div>
        </div>
        
        {/* 备件类型选择 */}
        <div className="filter-section">
          <h3>备件类型</h3>
          <div className="part-type-buttons">
            <button 
              className={`part-type-button ${currentPartType === '' ? 'active' : ''}`} 
              onClick={() => setCurrentPartType('')}
            >
              全部
            </button>
            <button 
              className={`part-type-button ${currentPartType === 'consumable' ? 'active' : ''}`} 
              onClick={() => setCurrentPartType('consumable')}
            >
              消耗品
            </button>
            <button 
              className={`part-type-button ${currentPartType === 'non-consumable' ? 'active' : ''}`} 
              onClick={() => setCurrentPartType('non-consumable')}
            >
              非消耗品
            </button>
          </div>
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