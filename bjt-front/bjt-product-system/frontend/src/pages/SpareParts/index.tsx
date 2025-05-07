import React, { useState, useEffect, ChangeEvent, createRef, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import sparePartsApi, { SparePart, FilterOptions } from '../../api/sparePartsApi';
import AuthContext from '../../contexts/AuthContext';
import { CartContext, CartItem } from '../../contexts/CartContext';
import { getUserRegionFromEmail, isVipUser, getCurrencySymbol, PRICING } from '../../config/appConfig';
import './SpareParts.css';

// 定义 Timeout 类型，避免使用 NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

// 定义库存接口以兼容实际数据结构
interface Inventory {
  total: number;
  eu: number;
  na: number;
  au: number;
  cn: number;
}

// 定义价格区间接口以兼容实际数据结构
interface PriceTier {
  range: string;
  price: number;
  eu?: number;
  na?: number;
  au?: number;
  cn?: number;
}

// 定义价格接口以兼容实际数据结构
interface Prices {
  base: number;
  tier1: number;
  tier2: number;
  vip: number;
  tiers: PriceTier[];
}

// 定义过滤选项接口别名以兼容代码
type SparePartsFilterOptions = FilterOptions;

const SparePartsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Get cart context
  const { items, addItem, removeItem, clearCart, updateQuantity } = useContext(CartContext);
  
  // 状态管理
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
  const getRoleDisplayName = (role: string): string => {
    const roles: Record<string, string> = {
      'admin': t('roles.admin', 'Admin'),
      'sales': t('roles.sales', 'Sales'),
      'customer': t('roles.customer', 'Customer'),
      'partner': t('roles.partner', 'Partner'),
      'guest': t('roles.guest', 'Guest')
    };
    
    return roles[role] || roles['guest'];
  };
  
  // 在组件首次渲染时从localStorage加载购物车数据并获取备件数据
  useEffect(() => {
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
      // 使用新的API接口获取数据
      const response = await sparePartsApi.getAllSpareParts();
      
      // 添加调试日志
      console.log('API response received');
      
      // 增强的响应验证
      if (!response) {
        console.error('API response is null or undefined');
        throw new Error('No response received from API');
      }
      
      if (!response.data) {
        console.error('API response missing data property:', response);
        throw new Error('Invalid API response format: missing data property');
      }
      
      if (!Array.isArray(response.data)) {
        console.error('API response data is not an array:', response.data);
        throw new Error('Invalid API response format: data is not an array');
      }
      
      const data = response.data;
      console.log(`Received ${data.length} spare parts items`);
      
      // 本地过滤数据
      let filteredData = [...data];
      
      // 根据部件类型筛选 (consumable, electronic, mechanical)
      if (currentPartType && currentPartType !== 'all') {
        filteredData = filteredData.filter(part => part.type === currentPartType);
        console.log(`Filtered by part type '${currentPartType}': ${filteredData.length} items remaining`);
      }
      
      // 根据产品类型筛选
      if (currentProductType && currentProductType !== 'all') {
        filteredData = filteredData.filter(part => part.product_type === currentProductType);
        console.log(`Filtered by product type '${currentProductType}': ${filteredData.length} items remaining`);
      }
      
      // 增强型号筛选 - 更健壮的类型检查
      if (selectedModel && selectedModel !== 'all' && selectedModel !== '') {
        filteredData = filteredData.filter(part => {
          // 首先检查属性是否存在
          if (!part.app_model) return false;
          
          // 如果是数组，直接检查包含关系
          if (Array.isArray(part.app_model)) {
            return part.app_model.includes(selectedModel);
          }
          
          // 如果是字符串，拆分为数组后检查
          if (typeof part.app_model === 'string') {
            return part.app_model.split(',')
              .map(m => m.trim())
              .includes(selectedModel);
          }
          
          // 其他类型，尝试转换为字符串后检查
          try {
            const modelString = String(part.app_model);
            return modelString.split(',')
              .map(m => m.trim())
              .includes(selectedModel);
          } catch (e) {
            console.warn(`Could not process app_model for part ${part.id || 'unknown'}:`, e);
            return false;
          }
        });
        console.log(`Filtered by model '${selectedModel}': ${filteredData.length} items remaining`);
      }
      
      setSpareParts(filteredData);
    } catch (err) {
      console.error('Error loading spare parts data:', err);
      
      // 增强错误处理 - 检查授权错误
      if (err instanceof Error) {
        const errorMessage = err.message || 'Failed to load spare parts data';
        
        // 检查是否为授权错误
        if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('token')) {
          setError('Authentication error. Please log in again.');
          
          // 可选：重定向到登录页
          // setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to load spare parts data. Please try again later.');
      }
      
      // 设置空数组以避免进一步的错误
      setSpareParts([]);
    } finally {
      setLoading(false);
      console.log("Finished loadSparePartsData, loading state set to false");
    }
  };
  
  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      // 不传参数，获取所有筛选选项
      const options = await sparePartsApi.getSparePartsFilterOptions();
      
      // 添加响应验证
      if (!options) {
        console.error('Filter options response is null or undefined');
        return;
      }
      
      setFilterOptions(options);
      console.log('Filter options loaded successfully:', options);
    } catch (err) {
      console.error('Error loading filter options:', err);
      
      // 记录错误但不阻止页面渲染
      // 可以选择显示用户提示，但不中断主要功能
      if (err instanceof Error) {
        console.warn(`Filter options error: ${err.message}`);
      }
    }
  };
  
  // 根据筛选条件过滤备件
  const getFilteredParts = () => {
    // 确保 spareParts 不是 null 或 undefined
    if (!Array.isArray(spareParts)) return [];
    
    let filteredResults = [...spareParts];
    
    // 根据选定的型号进行筛选
    if (selectedModel && selectedModel !== 'all' && selectedModel !== '') {
      filteredResults = filteredResults.filter(part => {
        // 检查app_model是否存在
        if (!part.app_model) return false;
        
        // 如果是数组，直接查找
        if (Array.isArray(part.app_model)) {
          return part.app_model.includes(selectedModel);
        }
        
        // 如果是字符串（兼容旧数据），转换为数组后查找
        const modelString = String(part.app_model);
        return modelString.split(',')
          .map(m => m.trim())
          .includes(selectedModel);
      });
    }
    
    return filteredResults;
  };
  
  // 找到适合数量的价格区间
  const findPriceTier = (priceTiers: any[], quantity: number) => {
    // 如果没有价格区间，返回默认值
    if (!priceTiers || !Array.isArray(priceTiers) || priceTiers.length === 0) {
      return { range: '1+', price: 0 };
    }
    
    // 遍历所有价格区间，找到数量适合的区间
    for (const tier of priceTiers) {
      // 确保tier和tier.range存在且是字符串
      if (!tier || !tier.range || typeof tier.range !== 'string') {
        continue;
      }
      
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

  // Calculate the total price based on pricing tiers and quantity
  const calculateTotalPrice = (pricing: any, quantity: number): number => {
    if (!pricing || !pricing.tiers || !Array.isArray(pricing.tiers)) {
      return (pricing?.basePrice || 0) * quantity;
    }
    
    // Find the appropriate price tier based on quantity
    const tier = findPriceTier(pricing.tiers, quantity);
    
    // Get the price based on user's region if available
    const region = currentUser.region.toLowerCase();
    let price = tier.price;
    
    if (region === 'eu' && typeof tier.eu === 'number') {
      price = tier.eu;
    } else if (region === 'na' && typeof tier.na === 'number') {
      price = tier.na;
    } else if (region === 'au' && typeof tier.au === 'number') {
      price = tier.au;
    } else if (region === 'cn' && typeof tier.cn === 'number') {
      price = tier.cn;
    }
    
    // Apply user's discount
    price = price * currentUser.discount;
    
    // Calculate total price by multiplying by quantity
    return price * quantity;
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
      part_number: t('spareParts.defaultValues.unknown'),
      app_sn: t('spareParts.defaultValues.unknown'),
      package_size: t('spareParts.defaultValues.unknown'),
      package_weight: 0,
      prices: { 
        original: 0,
        current: 0,
        tiers: [{ range: '1+', price: 0 }]
      }
    };
  };
  
  // 添加到购物车
  const addToCart = (sparePart: SparePart, quantity = 1) => {
    // Create a cart item from the spare part
    const cartItem = {
      id: sparePart.id,
      name: sparePart.name,
      code: sparePart.part_number,
      partNumber: sparePart.part_number,
      image: sparePart.image_url,
      category: sparePart.category || 'spare part',
      productId: Number(sparePart.id),
      price: (sparePart.prices as unknown as Prices).base,
      quantity: quantity,
      selected: true,
      priceTiers: [
        {
          min: 1,
          max: 99999,
          price: (sparePart.prices as unknown as Prices).base
        }
      ],
      properties: { 
        type: sparePart.type,
        productType: sparePart.product_type,
        model: Array.isArray(sparePart.app_model) ? sparePart.app_model[0] : String(sparePart.app_model || '')
      },
      specs: {}
    };

    // Add to cart context
    addItem(cartItem);
    
    // Show notification
    showCartNotification(`已添加 ${quantity} 个 ${sparePart.name} 到购物车`);
  };
  
  // 显示购物车通知
  const showCartNotification = (message: string, duration = 3000) => {
    // 如果已经有通知在显示，先清除它
    if (activeNotification) {
      try {
        // 检查元素是否仍然存在于DOM中
        if (document.body.contains(activeNotification)) {
          document.body.removeChild(activeNotification);
        }
        if (notificationTimeout) {
          clearTimeout(notificationTimeout);
        }
      } catch (error) {
        console.error('Error removing previous notification:', error);
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
      try {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (activeNotification === notification) {
          setActiveNotification(null);
        }
      } catch (error) {
        console.error('Error removing notification:', error);
        // 确保无论如何都清除状态引用
        if (activeNotification === notification) {
          setActiveNotification(null);
        }
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
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    // 确保价格数据存在
    if (!part.prices) {
      return 0;
    }
    
    // 从实际数据结构中获取基础价格
    const prices = part.prices as unknown as Prices;
    let basePrice = prices.base || 0;
    
    // 根据用户区域调整价格
    if (prices.tiers && prices.tiers.length > 0) {
      const tier = prices.tiers[0];
      const region = currentUser.region.toLowerCase();
      
      // 根据用户区域获取价格
      if (region === 'eu' && typeof tier.eu === 'number') {
        basePrice = tier.eu;
      } else if (region === 'na' && typeof tier.na === 'number') {
        basePrice = tier.na;
      } else if (region === 'au' && typeof tier.au === 'number') {
        basePrice = tier.au;
      } else if (region === 'cn' && typeof tier.cn === 'number') {
        basePrice = tier.cn;
      } else {
        basePrice = tier.price;
      }
    }
    
    // 应用用户折扣
    return basePrice * currentUser.discount;
  };

  // 处理点击备件行时的操作
  const handlePartClick = (part: SparePart) => {
    // 如果备件有适用型号信息且是数组
    if (part && part.app_model && Array.isArray(part.app_model) && part.app_model.length > 0) {
      // 获取第一个适用型号
      const firstModel = part.app_model[0];
      // 更新选定的型号
      setSelectedModel(firstModel);
      console.log(`Updated selected model to: ${firstModel} from part ${part.name_en}`);
    }
  };
  
  const renderSpareParts = (): React.ReactNode => {
    const filteredParts = getFilteredParts();
    
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('spareParts.loading')}</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadSparePartsData} className="retry-button">
            {t('spareParts.error.retry')}
          </button>
        </div>
      );
    }
    
    if (filteredParts.length === 0) {
      return <div className="no-results">{t('spareParts.error.noResults')}</div>;
    }
    
    return (
      <>
        <table className="spare-parts-table">
          <thead>
            <tr>
              <th>{t('spareParts.table.image')}</th>
              <th>{t('spareParts.table.code')}</th>
              <th>{t('spareParts.table.specs')}</th>
              <th>{t('spareParts.table.price')}</th>
              {(user?.role === 'sales' || user?.role === 'admin') && <th>{t('spareParts.table.inventory')}</th>}
              <th>{t('spareParts.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => {
              const finalPrice = calculateFinalPrice(part);
              const prices = part.prices as unknown as Prices;
              
              return (
                <tr
                  key={part.id}
                  className="spare-part-row"
                  onClick={() => handlePartClick(part)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="part-image-cell">
                    <img src={part.image_url} alt={part.name_en} className="part-image" onError={handleImageError} />
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
                        <p><strong>{t('spareParts.specs.serialNumber')}:</strong> {part.app_sn}</p>
                        <p><strong>{t('products.specs.palletQty')}:</strong> {part.box_quantity || t('spareParts.defaultValues.notAvailable')}</p>
                      </div>
                      <span className="view-more">{t('spareParts.table.viewMore')}</span>
                    </div>
                  </td>
                  <td className="part-price-cell">
                    <div className="price-tiers">
                      <div className="current-price">
                        {getCurrencySymbol(currentUser.region)} {finalPrice.toFixed(2)}
                      </div>
                      {prices.tiers && prices.tiers.map((tier, index) => (
                        <div key={index} className="price-tier">
                          <span>{tier.range}: {getCurrencySymbol(currentUser.region)} {
                            (user?.region === 'eu' && tier.eu ? tier.eu : 
                             user?.region === 'na' && tier.na ? tier.na :
                             user?.region === 'au' && tier.au ? tier.au :
                             user?.region === 'cn' && tier.cn ? tier.cn : 
                             tier.price).toFixed(2)
                          }</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  {(user?.role === 'sales' || user?.role === 'admin') && (
                    <td className="part-inventory-cell">
                      <div className="inventory-info">
                        {Array.isArray(part.inventory) ? (
                          part.inventory.map((inv, idx) => (
                            <div key={idx}>{inv.region}: {inv.amount}</div>
                          ))
                        ) : (
                          <>
                            <div>EU: {(part.inventory as unknown as Inventory).eu}</div>
                            <div>NA: {(part.inventory as unknown as Inventory).na}</div>
                            <div>AU: {(part.inventory as unknown as Inventory).au}</div>
                            <div>CN: {(part.inventory as unknown as Inventory).cn}</div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="part-actions-cell">
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn"
                        onClick={(e) => {
                          e.stopPropagation();
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
                          e.stopPropagation();
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value) && value > 0) {
                            setQuantities({...quantities, [part.id]: value});
                          }
                        }}
                        className="quantity-input"
                      />
                      <button 
                        className="quantity-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newQty = (quantities[part.id] || 1) + 1;
                          setQuantities({...quantities, [part.id]: newQty});
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(part, quantities[part.id] || 1);
                      }}
                    >
                      {t('spareParts.table.addToCart')}
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
              <p><strong>{t('spareParts.specs.packageSize')}:</strong> {selectedPart.package_size}</p>
              <p><strong>{t('spareParts.specs.packageSizeImperial')}:</strong> {selectedPart.package_size_imperial || t('spareParts.defaultValues.notAvailable')}</p>
              <p><strong>{t('spareParts.specs.weight')}:</strong> {selectedPart.package_weight || t('spareParts.defaultValues.notAvailable')}</p>
              <p><strong>{t('spareParts.specs.weightImperial')}:</strong> {selectedPart.package_weight ? (selectedPart.package_weight * 2.20462).toFixed(2) : t('spareParts.defaultValues.notAvailable')}</p>
              <p><strong>{t('spareParts.specs.serialNumber')}:</strong> {selectedPart.app_sn}</p>
              <p><strong>{t('spareParts.specs.compatibleModels')}:</strong> {selectedPart.app_model}</p>
              <p><strong>{t('spareParts.specs.specifications')}:</strong> {selectedPart.spec}</p>
            </div>
          </div>
        )}
      </>
    );
  };
  
  // 获取区域库存状态
  const getInventoryStatus = (part: SparePart): string => {
    // 获取当前区域的库存
    let regionStock = 0;
    
    if (!part.inventory) {
      return t('spareParts.inventory.noInfo');
    }
    
    if (Array.isArray(part.inventory)) {
      // 数组格式的库存
      const regionInventory = part.inventory.find(
        item => item.region.toLowerCase() === currentUser.region.toLowerCase()
      );
      regionStock = regionInventory?.amount || 0;
    } else if (typeof part.inventory === 'object') {
      // 对象格式的库存
      const region = currentUser.region.toLowerCase();
      const inventory = part.inventory as Inventory;
      
      if (region === 'eu' && typeof inventory.eu === 'number') {
        regionStock = inventory.eu;
      } else if (region === 'na' && typeof inventory.na === 'number') {
        regionStock = inventory.na;
      } else if (region === 'au' && typeof inventory.au === 'number') {
        regionStock = inventory.au;
      } else if (region === 'cn' && typeof inventory.cn === 'number') {
        regionStock = inventory.cn;
      }
    }
    
    if (regionStock <= 0) return t('spareParts.inventory.outOfStock');
    if (regionStock < 5) return t('spareParts.inventory.lowStock');
    if (regionStock < 20) return t('spareParts.inventory.inStock');
    return t('spareParts.inventory.highStock');
  };
  
  // 处理确认清空购物车
  const handleConfirmClearCart = () => {
    clearCart();
    setShowConfirmClear(false);
    showCartNotification(t('spareParts.cart.cartCleared'));
  };
  
  // 渲染购物车项
  const renderCartItems = () => {
    if (items.length === 0) {
      return <div className="empty-cart-message">{t('spareParts.cart.empty')}</div>;
    }
    
    // Filter items to only show spare parts
    const sparePartItems = items.filter(item => 
      item.category === 'spare part' || item.properties?.productType === 'machine' || item.properties?.productType === 'accessory'
    );
    
    if (sparePartItems.length === 0) {
      return <div className="empty-cart-message">{t('spareParts.cart.empty')}</div>;
    }
    
    return sparePartItems.map((item, index) => {
      return (
        <div className="cart-item" key={index}>
          <div className="cart-item-top">
            <img className="cart-item-img" src={item.image} alt={item.name} />
            <div className="cart-item-main">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-sku">{t('spareParts.cart.sku')}: {item.partNumber}</div>
              <div className="cart-item-price">
                {getCurrencySymbol(userRegion)} {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          </div>
          <div className="cart-item-details">
            <div className="cart-item-detail">{t('spareParts.specs.serialNumber')}: {item.properties?.serialNumber || '-'}</div>
            <div className="cart-item-detail">{t('spareParts.specs.packageSize')}: {item.properties?.packageSize || '-'}</div>
            <div className="cart-item-detail">{t('spareParts.specs.model')}: {item.properties?.model || '-'}</div>
          </div>
          <div className="cart-item-controls">
            <div className="cart-item-qty">
              <button className="cart-qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }}>-</button>
              <input 
                className="cart-qty-input" 
                type="number" 
                value={item.quantity} 
                onChange={(e) => { e.stopPropagation(); updateQuantity(item.id, parseInt(e.target.value) || 1); }} 
              />
              <button className="cart-qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}>+</button>
            </div>
            <button className="cart-item-remove" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>×</button>
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
      const options = await sparePartsApi.getSparePartsFilterOptions();
      console.log(`Received filter options for ${productType}:`, options);
      
      if (options) {
        if (productType === 'machine') {
          setHostModels(options.hostModels || []);
          console.log(`Set host models:`, options.hostModels);
        } else if (productType === 'accessory') {
          setAccessoryModels(options.accessoryModels || []);
          console.log(`Set accessory models:`, options.accessoryModels);
        }
      } else {
        console.error('No options returned from API');
        if (productType === 'machine') {
          setHostModels([]);
        } else if (productType === 'accessory') {
          setAccessoryModels([]);
        }
      }
      
      // 重置已选型号为空字符串
      setSelectedModel('');
      
      // 当切换产品类型时，重新加载数据
      loadSparePartsData();
      
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching models for ${productType}:`, err);
      
      // 更详细的错误处理
      if (err instanceof Error) {
        const errorMessage = err.message || `Failed to fetch models for ${productType}`;
        console.warn(errorMessage);
        
        // 可以选择显示轻量级的错误提示
        // showCartNotification(`Error: ${errorMessage}`, 3000);
      }
      
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
          <h1>{t('spareParts.title')}</h1>
        </div>

        <div className="filter-container">
          <div className="filter-row">
            <span className="filter-label">{t('spareParts.filters.label.productType')}:</span>
            <div className="product-type-buttons">
              <button
                className={currentProductType === 'machine' ? 'active' : ''}
                onClick={() => {
                  setCurrentProductType('machine');
                  fetchModels('machine');
                  // If current part type is 'accessory', reset it to 'consumable' since accessory parts
                  // are only available for accessory product type
                  if (currentPartType === 'accessory') {
                    setCurrentPartType('consumable');
                  }
                }}
              >
                {t('spareParts.filters.productType.machine')}
              </button>
              <button
                className={currentProductType === 'accessory' ? 'active' : ''}
                onClick={() => {
                  setCurrentProductType('accessory');
                  fetchModels('accessory');
                }}
              >
                {t('spareParts.filters.productType.accessory')}
              </button>
            </div>
          </div>
          
          <div className="filter-row">
            <span className="filter-label">{t('spareParts.filters.label.model')}:</span>
            <select
              className="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">{t('spareParts.filters.model.allModels')}</option>
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
            <span className="filter-label">{t('spareParts.filters.label.partType')}:</span>
            <div className="part-type-buttons">
              <button
                className={currentPartType === 'consumable' ? 'active' : ''}
                onClick={() => setCurrentPartType('consumable')}
              >
                {t('spareParts.filters.partType.consumable')}
              </button>
              <button
                className={currentPartType === 'electronic' ? 'active' : ''}
                onClick={() => setCurrentPartType('electronic')}
              >
                {t('spareParts.filters.partType.electronic')}
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
                <h3>{t('spareParts.cart.title')}</h3>
                <button className="cart-modal-close" onClick={() => setShowCartModal(false)}>×</button>
              </div>
              <div className="cart-modal-body">
                {renderCartItems()}
              </div>
              {items.length > 0 && (
                <div className="cart-modal-footer">
                  <div className="cart-total-line">
                    <span>{t('spareParts.cart.total')}:</span>
                    <span className="cart-grand-total">¥{calculateCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="cart-actions">
                    <button className="cart-clear-btn" onClick={() => setShowConfirmClear(true)}>
                      {t('spareParts.cart.clear')}
                    </button>
                    <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                      {t('spareParts.cart.checkout')}
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
              <h4>{t('spareParts.cart.confirmClear')}</h4>
              <p>{t('spareParts.cart.confirmClearMessage')}</p>
              <div className="confirm-dialog-actions">
                <button className="btn-cancel" onClick={() => setShowConfirmClear(false)}>
                  {t('spareParts.cart.cancel')}
                </button>
                <button className="btn-confirm" onClick={handleConfirmClearCart}>
                  {t('spareParts.cart.confirm')}
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