import React, { useState, useEffect, ChangeEvent, createRef, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSpareParts, SparePart, getSparePartsFilterOptions, SparePartsFilterOptions } from '../../api/sparePartsApi';
import AuthContext from '../../contexts/AuthContext';
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

const SparePartsPage = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [cart, setCart] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [currentPartType, setCurrentPartType] = useState('consumable');
  const [currentProductType, setCurrentProductType] = useState('machine');
  const [selectedModel, setSelectedModel] = useState('');
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const authContext = useContext(AuthContext);
  // Handle the case where context might be undefined
  const user = authContext?.user || null;
  const userRole = user?.role || 'customer';
  const userRegion = user?.region || 'EU';
  
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
    // Make sure we have a user with a region
    if (!currentUser || !currentUser.region) {
      return '¥'; // Default to CNY
    }
    
    const region = currentUser.region.toLowerCase();
    switch(region) {
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
    console.log("Starting loadSparePartsData with filters:", { currentPartType, currentProductType, selectedModel });
    setLoading(true);
    setError(null);
    
    try {
      // 构建查询参数，确保将当前产品类型正确传递
      const params: any = {};
      
      // Only add parameters if they have values
      if (currentPartType) {
        params.consumable = currentPartType;
      }
      
      if (currentProductType) {
        params.product_type = currentProductType;
      }
      
      // 只有在选择了特定型号时才添加型号参数
      if (selectedModel && selectedModel !== 'ALL' && selectedModel !== '') {
        params.model = selectedModel;
      }
      
      // 添加调试日志
      console.log('API params:', params);
      
      // 使用新的API接口获取数据
      const data = await getAllSpareParts(params);
      
      // 添加调试日志
      console.log('API response data:', data);
      console.log('API response length:', data.length);
      
      setSpareParts(data);
    } catch (err) {
      console.error('Error loading spare parts data:', err);
      setError('Failed to load spare parts data. Please try again later.');
    } finally {
      setLoading(false);
      console.log("Finished loadSparePartsData, loading state set to false");
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
    
    // 添加调试信息
    console.log('Filtering parts with criteria:', {
      currentPartType,
      currentProductType,
      selectedModel
    });
    
    let filteredResults = [...spareParts];
    
    // 根据部件类型筛选 (consumable, electronic, mechanical)
    if (currentPartType && currentPartType !== 'all') {
      if (currentPartType === 'electronic') {
        // 对于non-consumable选项，匹配electronic或mechanical类型
        filteredResults = filteredResults.filter(part => 
          part.type === 'electronic' || part.type === 'mechanical'
        );
      } else {
        // 对于consumable选项，直接匹配
        filteredResults = filteredResults.filter(part => part.type === currentPartType);
      }
      console.log(`After filtering by part type ${currentPartType}, found ${filteredResults.length} results`);
    }
    
    // 根据产品类型筛选 (machine, accessory)
    if (currentProductType && currentProductType !== 'all') {
      filteredResults = filteredResults.filter(part => part.product_type === currentProductType);
      console.log(`After filtering by product type ${currentProductType}, found ${filteredResults.length} results`);
    }
    
    // 根据型号筛选
    if (selectedModel && selectedModel !== 'all' && selectedModel !== '') {
      filteredResults = filteredResults.filter(part => {
        // 分割app_model字段并检查是否包含所选型号
        const models = part.app_model.split(/,\s*/);
        return models.some(m => m.trim() === selectedModel);
      });
      console.log(`After filtering by model ${selectedModel}, found ${filteredResults.length} results`);
    }
    
    return filteredResults;
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
  const handleSpecMouseEnter = (e: React.MouseEvent, part: SparePart) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY + 5
    });
    setSelectedPart(part);
    setShowTooltip(true);
  };
  
  const handleSpecMouseLeave = () => {
    setShowTooltip(false);
    // 添加短延迟以便更平滑地处理从单元格到工具提示的移动
    setTimeout(() => {
      if (!tooltipHovered) {
        setSelectedPart(null);
      }
    }, 300);
  };
  
  // 处理鼠标进入工具提示
  const handleTooltipMouseEnter = () => {
    setTooltipHovered(true);
  };
  
  // 处理鼠标离开工具提示
  const handleTooltipMouseLeave = () => {
    setTooltipHovered(false);
    setShowTooltip(false);
    setSelectedPart(null);
  };
  
  // 关闭当前tooltip
  const closeTooltip = () => {
    setShowTooltip(false);
    setSelectedPart(null);
  };
  
  // 点击外部关闭tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTooltip && tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        closeTooltip();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTooltip) {
        closeTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTooltip]);
  
  // Calculate the final price based on the user's region and the quantity
  const calculateFinalPrice = (part: SparePart): number => {
    const quantity = quantities[part.id] || 1;
    let price = part.prices.current; // Default to current price
    
    // Find the appropriate price tier
    const tier = part.prices.tiers.find(t => {
      const range = t.range;
      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        return quantity >= min && quantity <= max;
      } else if (range.includes('>')) {
        const min = parseInt(range.replace('>', ''));
        return quantity > min;
      }
      return false;
    });
    
    if (tier) {
      // Get price based on user region
      if (user?.region) {
        const region = user.region.toLowerCase();
        if (region === 'eu') return tier.eu;
        if (region === 'na') return tier.na;
        if (region === 'au') return tier.au;
        if (region === 'cn') return tier.cn;
      }
      return tier.price;
    }
    
    return price;
  };

  // 添加到购物车的处理函数
  const handleAddToCart = (part: SparePart, quantity: number, price: number) => {
    addToCart(part.id, part.name_en, price, quantity);
  };
  
  const renderSpareParts = (): React.ReactNode => {
    const filteredParts = getFilteredParts();
    
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <p>加载失败: {error}</p>
          <button onClick={loadSparePartsData} className="retry-button">
            重试
          </button>
        </div>
      );
    }
    
    if (filteredParts.length === 0) {
      return <div className="no-results">没有符合条件的备件</div>;
    }
    
    return (
      <>
        <table className="spare-parts-table">
          <thead>
            <tr>
              <th>图片</th>
              <th>产品编码</th>
              <th>规格</th>
              <th>价格</th>
              {(user?.role === 'sales' || user?.role === 'admin') && <th>库存</th>}
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => {
              const finalPrice = calculateFinalPrice(part);
              return (
                <tr key={part.id} className="spare-part-row">
                  <td className="part-image-cell">
                    <img src={part.image_url} alt={part.name_en} className="part-image" />
                  </td>
                  <td className="part-code-cell">
                    <div className="part-code">{part.part_number}</div>
                    <div className="part-name">{part.name_en}</div>
                  </td>
                  <td 
                    className="part-specs-cell" 
                    onMouseEnter={(e) => handleSpecMouseEnter(e, part)}
                    onMouseLeave={handleSpecMouseLeave}
                  >
                    <div className="spec-preview">
                      <div className="spec-summary">
                        <p><strong>Spec.:</strong> {part.spec}</p>
                        <p><strong>适配序列号:</strong> {part.app_sn}</p>
                        <p><strong>单箱数量:</strong> {part.box_quantity || 'N/A'}</p>
                      </div>
                      <span className="view-more">查看更多规格</span>
                    </div>
                  </td>
                  <td className="part-price-cell">
                    <div className="price-tiers">
                      <div className="current-price">
                        {getCurrencySymbol()} {finalPrice.toFixed(2)}
                      </div>
                      {part.prices.tiers.map((tier, index) => (
                        <div key={index} className="price-tier">
                          <span>{tier.range}: {getCurrencySymbol()} {
                            (user?.region === 'eu' ? tier.eu : 
                             user?.region === 'na' ? tier.na :
                             user?.region === 'au' ? tier.au :
                             user?.region === 'cn' ? tier.cn : 
                             tier.price).toFixed(2)
                          }</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  {(user?.role === 'sales' || user?.role === 'admin') && (
                    <td className="part-inventory-cell">
                      <div className="inventory-info">
                        <div>EU: {part.inventory.eu}</div>
                        <div>NA: {part.inventory.na}</div>
                        <div>AU: {part.inventory.au}</div>
                        <div>CN: {part.inventory.cn}</div>
                      </div>
                    </td>
                  )}
                  <td className="part-actions-cell">
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn"
                        onClick={() => {
                          const newQty = Math.max(1, (quantities[part.id] || 1) - 1);
                          setQuantities({...quantities, [part.id]: newQty});
                        }}
                        disabled={(quantities[part.id] || 1) <= 1}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={quantities[part.id] || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value) && value > 0) {
                            setQuantities({...quantities, [part.id]: value});
                          }
                        }}
                        className="quantity-input"
                      />
                      <button 
                        className="quantity-btn"
                        onClick={() => {
                          const newQty = (quantities[part.id] || 1) + 1;
                          setQuantities({...quantities, [part.id]: newQty});
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(part, quantities[part.id] || 1, finalPrice)}
                    >
                      Add to Cart
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {showTooltip && selectedPart && (
          <div 
            ref={tooltipRef}
            className="spec-tooltip" 
            style={{ 
              top: tooltipPos.top, 
              left: tooltipPos.left 
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <h4>
              {selectedPart.name_en}
              <button className="tooltip-close" onClick={closeTooltip}>×</button>
            </h4>
            <div className="tooltip-content">
              <p><strong>包装尺寸 cm:</strong> {selectedPart.package_size}</p>
              <p><strong>包装尺寸 inch:</strong> {selectedPart.package_size_imperial || 'N/A'}</p>
              <p><strong>单件净重 kg:</strong> {selectedPart.package_weight}</p>
              <p><strong>单件净重 lbs:</strong> {(selectedPart.package_weight * 2.20462).toFixed(2)}</p>
              <p><strong>适配序列号:</strong> {selectedPart.app_sn}</p>
              <p><strong>适用型号:</strong> {selectedPart.app_model}</p>
              <p><strong>规格描述:</strong> {selectedPart.spec}</p>
            </div>
          </div>
        )}
      </>
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
    
    switch(userRegion) {
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
    console.log(`Fetching models for product type: ${productType}`);
    try {
      setLoading(true);
      // 根据产品类型获取不同的型号列表
      const options = await getSparePartsFilterOptions(productType);
      console.log(`Received filter options for ${productType}:`, options);
      
      if (productType === 'machine') {
        setHostModels(options.hostModels || []);
        console.log(`Set host models:`, options.hostModels);
      } else if (productType === 'accessory') {
        setAccessoryModels(options.accessoryModels || []);
        console.log(`Set accessory models:`, options.accessoryModels);
      }
      
      // 重置已选型号为空字符串
      setSelectedModel('');
      
      // 当切换产品类型时，重新加载数据
      loadSparePartsData();
      
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching models for ${productType}:`, err);
      // When there's an error loading models, keep the page usable with empty model list
      if (productType === 'machine') {
        setHostModels([]);
      } else if (productType === 'accessory') {
        setAccessoryModels([]);
      }
      setLoading(false);
    }
  };

  // 渲染主页面
  return (
    <div className="spare-parts-container">
      <div className="user-info-bar">
        {/* ... existing code ... */}
      </div>
      
      <div className="spare-parts-page">
        <div className="page-header">
          <h1>Spare Parts</h1>
        </div>

        <div className="filter-container">
          <div className="filter-row">
            <span className="filter-label">商品类型:</span>
            <div className="product-type-buttons">
              <button
                className={currentProductType === 'machine' ? 'active' : ''}
                onClick={() => {
                  setCurrentProductType('machine');
                  fetchModels('machine');
                }}
              >
                主机
              </button>
              <button
                className={currentProductType === 'accessory' ? 'active' : ''}
                onClick={() => {
                  setCurrentProductType('accessory');
                  fetchModels('accessory');
                }}
              >
                配件
              </button>
            </div>
          </div>
          
          <div className="filter-row">
            <span className="filter-label">适用型号:</span>
            <select
              className="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">所有型号</option>
              {currentProductType === 'machine' ? (
                hostModels.map((model, index) => (
                  <option key={index} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                accessoryModels.map((model, index) => (
                  <option key={index} value={model}>
                    {model}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="filter-row">
            <span className="filter-label">备件类型:</span>
            <div className="part-type-buttons">
              <button
                className={currentPartType === 'consumable' ? 'active' : ''}
                onClick={() => setCurrentPartType('consumable')}
              >
                Consumable
              </button>
              <button
                className={currentPartType === 'electronic' ? 'active' : ''}
                onClick={() => setCurrentPartType('electronic')}
              >
                Non-consumable
              </button>
            </div>
          </div>
        </div>

        <div className="spare-parts-list">
          {renderSpareParts()}
        </div>

        {/* 购物车弹窗 */}
        {showCartModal && (
          <div className="cart-modal">
            <div className="cart-modal-backdrop" onClick={() => setShowCartModal(false)}></div>
            <div className="cart-modal-content">
              <div className="cart-modal-header">
                <h3>Shopping Cart</h3>
                <button className="cart-modal-close" onClick={() => setShowCartModal(false)}>×</button>
              </div>
              <div className="cart-modal-body">
                {renderCartItems()}
              </div>
              {cart.length > 0 && (
                <div className="cart-modal-footer">
                  <div className="cart-total-line">
                    <span>Total:</span>
                    <span className="cart-grand-total">¥{calculateCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="cart-actions">
                    <button className="cart-clear-btn" onClick={() => setShowConfirmClear(true)}>
                      Clear Cart
                    </button>
                    <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 确认清空购物车 */}
        {showConfirmClear && (
          <div className="confirm-dialog">
            <div className="confirm-dialog-backdrop"></div>
            <div className="confirm-dialog-content">
              <h4>Clear Cart?</h4>
              <p>Are you sure you want to remove all items from your cart?</p>
              <div className="confirm-dialog-actions">
                <button className="btn-cancel" onClick={() => setShowConfirmClear(false)}>
                  Cancel
                </button>
                <button className="btn-confirm" onClick={clearCart}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SparePartsPage;