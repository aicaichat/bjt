import React, { useState, useEffect, ChangeEvent, createRef, useRef, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import sparePartsApi, { SparePart, FilterOptions } from '../../api/sparePartsApi';
import AuthContext from '../../contexts/AuthContext';
import { CartContext, ExtendedCartItem } from '../../contexts/CartContext';
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
  const { t } = useTranslation(['spareParts', 'translation']);
  
  // Get cart context
  const { items, addItem, removeItem, clearCart, updateQuantity } = useContext(CartContext);
  
  // 状态管理
  const [showCartModal, setShowCartModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
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
  const [selectedIsConsumable, setSelectedIsConsumable] = useState<boolean | null>(null);
  
  // 添加tooltip状态管理
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedSparePartForTooltip, setSelectedSparePartForTooltip] = useState<SparePart | null>(null);
  const [isMouseTracking, setIsMouseTracking] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const authContext = useContext(AuthContext);
  // Handle the case where context might be undefined
  const user = authContext?.user || null;
  // 增强userRole获取逻辑，优先从authContext获取，如果不存在则从localStorage获取
  let userRole = user?.role || 'customer';
  const userRegion = user?.region || 'EU';
  
  // 从localStorage再次验证用户角色，确保权限一致
  useEffect(() => {
    try {
      const authData = localStorage.getItem('user');
      if (authData) {
        const userData = JSON.parse(authData);
        if (userData && userData.role && userData.role !== userRole) {
          console.log(`用户角色不一致: AuthContext=${userRole}, localStorage=${userData.role}`);
          // 优先使用localStorage中的角色，因为它可能是最新的
          userRole = userData.role;
        }
      }
    } catch (err) {
      console.error('Error validating user role from localStorage:', err);
    }
  }, []);
  
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
  
  // 创建一个包装函数用于按钮点击事件
  const handleReloadData = useCallback(() => {
    loadSparePartsData(0, 2);
  }, []);
  
  // 创建一个包装函数用于筛选选项重新加载
  const handleReloadFilterOptions = useCallback(() => {
    loadFilterOptions(0, 2);
  }, []);
  
  // 在组件首次渲染时从localStorage加载购物车数据并获取备件数据
  useEffect(() => {
    // 设置默认的型号数据
    setHostModels(['LA-E4S', 'LA-E5P', 'TM-200', 'TM-300', 'PM-100', 'PM-200', 'ACB-100', 'ACB-200']);
    setAccessoryModels(['FS-001', 'FS-002', 'FB-100', 'FB-200']);
    
    loadSparePartsData();
    loadFilterOptions();
    fetchModels(currentProductType); // 初始化时加载当前产品类型的型号
  }, []);
  
  // 在筛选条件变化时重新加载数据
  useEffect(() => {
    loadSparePartsData();
  }, [selectedIsConsumable, currentProductType, selectedModel]);
  
  // 加载备件数据
  const loadSparePartsData = async (retryCount = 0, maxRetries = 2) => {
    console.log(`Starting loadSparePartsData (attempt ${retryCount + 1}/${maxRetries + 1}) with filters:`, { selectedIsConsumable, currentProductType, selectedModel });
    setLoading(true);
    setError(null);
    
    try {
      // 使用新的API接口获取数据
      console.log("Calling sparePartsApi.getAllSpareParts()");
      const response = await sparePartsApi.getAllSpareParts();
      
      // 添加调试日志
      console.log('API response received:', response);
      
      // 增强的响应验证
      if (!response) {
        console.error('API response is null or undefined');
        throw new Error('No response received from API');
      }
      
      if (!response.data) {
        console.error('API response missing data property:', response);
        throw new Error('Invalid API response format: missing data property');
      }
      
      // 验证数据是数组
      const data: SparePart[] = response.data;
      console.log(`Received ${data.length} spare parts items`);
      
      // 本地过滤数据
      let filteredData = [...data];
      
      // 根据部件类型筛选 (使用 is_consumable boolean)
      if (selectedIsConsumable !== null) {
        filteredData = filteredData.filter(part => part.is_consumable === selectedIsConsumable);
        console.log(`Filtered by is_consumable=${selectedIsConsumable}: ${filteredData.length} items remaining`);
      }
      
      // 根据产品类型筛选（机器/配件）
      if (currentProductType && currentProductType !== 'all') {
        filteredData = filteredData.filter(part => {
          // 1. 如果部件有明确的product_type属性，直接使用
          if (part.product_type) {
            return part.product_type === currentProductType;
          }
          
          // 2. 如果没有product_type但有product_line_id，则根据product_line_id判断
          // 产品线ID 1-4对应机器设备，5-8对应配件
          if (part.product_line_id) {
            if (currentProductType === 'machine' && part.product_line_id <= 4) {
              return true;
            }
            if (currentProductType === 'accessory' && part.product_line_id > 4) {
              return true;
            }
            return false;
          }
          
          // 3. 如果都没有，根据part_number的前两位字符判断
          // 假设1开头的是机器，2开头的是配件（根据实际情况调整）
          if (part.part_number) {
            const prefix = part.part_number.substring(0, 2);
            if (currentProductType === 'machine' && prefix.startsWith('1')) {
              return true;
            }
            if (currentProductType === 'accessory' && prefix.startsWith('2')) {
              return true;
            }
          }
          
          // 4. 如果无法确定，则默认显示（可以根据实际需求调整）
          return false;
        });
        console.log(`Filtered by product_type '${currentProductType}': ${filteredData.length} items remaining`);
      }
      
      // 根据型号筛选
      if (selectedModel) {
        filteredData = filteredData.filter(part => {
          try {
            if (!part.app_model) return false;
            
            // 处理不同类型的app_model
            let models: string[] = [];
            
            if (Array.isArray(part.app_model)) {
              models = part.app_model;
            } else if (typeof part.app_model === 'string') {
              models = part.app_model.split(',').map(m => m.trim());
            }
            
            return models.includes(selectedModel);
          } catch (e) {
            console.warn(`Could not process app_model for part ${part.id || 'unknown'}:`, e);
            return false;
          }
        });
        console.log(`Filtered by model '${selectedModel}': ${filteredData.length} items remaining`);
      }
      
      setSpareParts(filteredData);
    } catch (err) {
      console.error(`Error loading spare parts data (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      
      // 如果还有重试次数，则进行重试
      if (retryCount < maxRetries) {
        console.log(`Retrying in 1 second (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        setTimeout(() => {
          loadSparePartsData(retryCount + 1, maxRetries);
        }, 1000);
        return;
      }
      
      // 增强错误处理 - 检查授权错误
      if (err instanceof Error) {
        const errorMessage = err.message || 'Failed to load spare parts data';
        
        // 检查是否为授权错误
        if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('token')) {
          setError('Authentication error. Please log in again.');
          
          // 在开发环境添加额外的错误信息
          if (process.env.NODE_ENV === 'development') {
            console.error('Authentication error details:', err);
          }
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
      console.log(`Finished loadSparePartsData (attempt ${retryCount + 1}/${maxRetries + 1}), loading state set to false`);
    }
  };
  
  // 加载筛选选项
  const loadFilterOptions = async (retryCount = 0, maxRetries = 2) => {
    try {
      // 不传参数，获取所有筛选选项
      console.log(`Calling sparePartsApi.getSparePartsFilterOptions() (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const options = await sparePartsApi.getSparePartsFilterOptions();
      
      // 添加响应验证
      if (!options) {
        console.error('Filter options response is null or undefined');
        throw new Error('No filter options received from API');
      }
      
      // 存储来自API的型号列表，但首先确保它们不是空的
      const updatedHostModels = options.hostModels && options.hostModels.length > 0 
        ? options.hostModels 
        : hostModels; // 保留现有主机型号
        
      const updatedAccessoryModels = options.accessoryModels && options.accessoryModels.length > 0
        ? options.accessoryModels
        : accessoryModels; // 保留现有配件型号
      
      setHostModels(updatedHostModels);
      setAccessoryModels(updatedAccessoryModels);
      setFilterOptions(options);
      
      // 记录日志
      console.log('Filter options loaded:', {
        hostModels: updatedHostModels.length,
        accessoryModels: updatedAccessoryModels.length,
        partTypes: options.partTypes?.length || 0
      });
    } catch (err) {
      console.error(`Error loading filter options (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      
      // 如果还有重试次数，则进行重试
      if (retryCount < maxRetries) {
        console.log(`Retrying in 1 second (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        setTimeout(() => {
          loadFilterOptions(retryCount + 1, maxRetries);
        }, 1000);
        return;
      }
      
      // 使用默认值
      console.warn('Using default filter options values');
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
    let product = spareParts.find(p => p.id.toString() === productId);
    
    if (product) {
      return product; // 返回完整的产品对象，包括prices属性
    }
    
    // 如果未找到产品，返回默认值
    return {
      image_url: 'https://via.placeholder.com/120x120?text=Unknown',
      part_number: t('defaultValues.unknown', {ns: 'spareParts'}),
      app_sn: t('defaultValues.unknown', {ns: 'spareParts'}),
      package_size: t('defaultValues.unknown', {ns: 'spareParts'}),
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
      id: sparePart.id.toString(), // Ensure id is string for CartItem
      name: sparePart.name_en, // Use name_en from canonical type
      code: sparePart.part_number, // Use part_number from canonical type
      partNumber: sparePart.part_number,
      image: sparePart.image_url || '/images/spare-parts/default.svg', // Provide default for null image
      category: sparePart.product_type === 'machine' ? 'Machine Parts' : 'Accessory Parts', // Use product_type
      productId: sparePart.id, // Keep as number for productId
      price: calculateFinalPrice(sparePart), // Use the calculated final price
      quantity: quantity,
      selected: true,
      priceTiers: sparePart.prices.map(p => ({ // Map from common.PriceTier to CartContext.PriceTier
        min: p.tiers[0].min_quantity, // Changed from minQuantity to min
        max: p.tiers[0].max_quantity || null, // Changed from maxQuantity to max
        price: p.tiers[0].base_price
        // originalPrice: p.tiers[0].original_price, // Optional: if needed by CartContext.PriceTier
      })),
      currentPrice: calculateFinalPrice(sparePart),
      properties: {
        spec: sparePart.spec,
        pcsPerBox: sparePart.pcs_per_box,
        model: Array.isArray(sparePart.app_model) ? sparePart.app_model.join(', ') : sparePart.app_model || '',
        // Ensure 'type' and 'productType' are NOT here if they cause the old tags to show
      },
      specs: {}
    };

    // Add to cart context
    addItem(cartItem as unknown as ExtendedCartItem); // Use type assertion carefully
    
    // Show notification
    showCartNotification(t('cart.cartCleared', {ns: 'spareParts'}));
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
    id: string | number,
    event?: React.ChangeEvent<HTMLInputElement>,
    action?: 'increase' | 'decrease'
  ) => {
    const stringId = String(id); // Convert id to string for consistent usage with quantities object
    let newValue = quantities[stringId] || 1;
    
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
      [stringId]: newValue
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
  
  // 处理规格鼠标进入事件
  const handleSpecMouseEnter = (e: React.MouseEvent, sparePart: SparePart) => {
    setSelectedSparePartForTooltip(sparePart);
    setTooltipPos({
      left: e.clientX + 10,
      top: e.clientY + 10
    });
    setIsMouseTracking(true);
    setShowTooltip(true);
  };

  // 处理规格鼠标离开事件
  const handleSpecMouseLeave = () => {
    setTimeout(() => {
      if (!isTooltipHovered) {
        setShowTooltip(false);
        setIsMouseTracking(false);
      }
    }, 100);
  };
  
  // 处理鼠标进入工具提示
  const handleTooltipMouseEnter = () => {
    setIsTooltipHovered(true);
  };
  
  // 处理鼠标离开工具提示
  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false);
    setShowTooltip(false);
    setSelectedSparePartForTooltip(null);
  };
  
  // 关闭当前tooltip
  const closeTooltip = () => {
    setShowTooltip(false);
    setSelectedSparePartForTooltip(null);
  };
  
  // 在现有useEffect后添加新的useEffect以监听鼠标移动
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

  // 添加新的useEffect用于鼠标移动跟踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseTracking && showTooltip) {
        setTooltipPos({
          left: e.clientX + 10,
          top: e.clientY + 10
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMouseTracking, showTooltip]);
  
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
  
  // 渲染产品表格
  const renderSpareParts = (): React.ReactNode => {
    const filteredParts = getFilteredParts();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-10 bg-card rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-content font-medium">{t('loading', {ns: 'spareParts'})}</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-10 bg-card rounded-lg shadow-md border border-error/20">
          <div className="text-error text-3xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-content-light mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleReloadData} 
              className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              {t('error.retry', {ns: 'spareParts'})}
            </button>
            
            <button 
              onClick={() => {
                localStorage.removeItem('auth_token');
                navigate('/login');
              }} 
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              重新登录
            </button>
          </div>
        </div>
      );
    }
    
    if (filteredParts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-lg shadow-md">
          <svg className="h-16 w-16 text-content-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-title">{t('error.noResults', {ns: 'spareParts'})}</h3>
          <p className="mt-2 text-content-light">{t('error.tryAgain', {ns: 'spareParts'})}</p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button 
              onClick={() => {
                setSelectedModel('');
                setSelectedIsConsumable(null);
                // 重新加载数据
                setTimeout(() => handleReloadData(), 100);
              }}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              {t('filters.reset', {ns: 'spareParts'})}
            </button>
            
            <button 
              onClick={handleReloadData}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              仅重试
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {filteredParts.map((part) => (
          <div 
            key={part.id} 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden"
          >
            {/* 产品标题区 */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs font-bold rounded">{part.part_number}</span>
                  <h3 className="text-xl font-semibold text-gray-800 mt-1">{part.name_en}</h3>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${part.is_consumable ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {part.is_consumable ? '耗材' : '非耗材'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 产品内容区 */}
            <div className="p-4 flex flex-col md:flex-row gap-6">
              {/* 左侧：图片 */}
              <div className="w-full md:w-1/6 flex items-center justify-center">
                <img 
                  src={part.image_url || '/images/spare-parts/default.svg'} 
                  alt={part.name_en} 
                  className="w-28 h-28 object-contain border border-gray-200 rounded bg-gray-50 p-2"
                  onError={handleImageError}
                />
              </div>
              
              {/* 中间：规格信息 */}
              <div className="w-full md:w-3/6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">产品规格</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="text-xs text-gray-500">规格</div>
                    <div className="font-medium">{part.spec || '暂无数据'}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="text-xs text-gray-500">装箱数量</div>
                    <div className="font-medium">{part.pcs_per_box || '暂无数据'}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-100 sm:col-span-2">
                    <div className="text-xs text-gray-500">适用型号</div>
                    <div className="font-medium">{Array.isArray(part.app_model) ? part.app_model.join(', ') : part.app_model || '暂无数据'}</div>
                  </div>
                </div>
                
                <button 
                  className="text-xs inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors cursor-help"
                  onMouseEnter={(e) => handleSpecMouseEnter(e, part)}
                  onMouseLeave={handleSpecMouseLeave}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  更多规格详情
                </button>
              </div>
              
              {/* 右侧：价格和操作 */}
              <div className="w-full md:w-2/6 flex flex-col">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">价格:</h4>
                  {/* 阶梯价格展示 - 改为灰色背景独立行项目 */}
                  {part.prices && Array.isArray(part.prices) && part.prices
                    .filter(priceItem => priceItem.region.toLowerCase() === currentUser.region.toLowerCase())
                    .map((priceItem, priceIndex) => (
                      priceItem.tiers && priceItem.tiers.map((tier, tierIndex) => {
                        // 计算价格显示
                        const basePrice = tier.base_price;
                        // 应用用户折扣
                        const finalPrice = basePrice * currentUser.discount;
                        
                        // 创建价格区间显示字符串
                        const rangeText = tier.max_quantity 
                          ? `${tier.min_quantity}-${tier.max_quantity}` 
                          : `${tier.min_quantity}+`;
                        
                        return (
                          <div 
                            key={`${priceIndex}-${tierIndex}`} 
                            className="flex justify-between items-center bg-gray-100 rounded p-3 text-sm mb-2"
                          >
                            <span className="text-gray-600">{rangeText}:</span>
                            <span className="font-bold text-black text-lg">
                              {getCurrencySymbol(currentUser.region)}{finalPrice.toFixed(2)}
                            </span>
                          </div>
                        );
                      })
                    ))
                  }
                  
                  {/* 如果没有价格数据，显示默认信息 */}
                  {(!part.prices || !Array.isArray(part.prices) || part.prices.length === 0) && (
                    <div className="bg-gray-100 p-3 text-center text-gray-500 rounded mb-4">价格信息暂无</div>
                  )}

                  {/* 库存信息 - 仅对管理员和销售角色显示 */}
                  {(userRole === 'admin' || userRole === 'sales') && part.inventory && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">库存:</h4>
                      <div className="bg-gray-100 p-3 rounded">
                        {/* 处理库存可能是对象或数组的情况 */}
                        {Array.isArray(part.inventory) ? (
                          // 处理库存数组格式
                          <div className="space-y-2">
                            {part.inventory.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.region.toUpperCase()}:</span>
                                <span className="text-green-500 font-medium">{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // 处理库存对象格式
                          <div className="space-y-2">
                            {typeof (part.inventory as Inventory).cn !== 'undefined' && (
                              <div className="flex justify-between">
                                <span>CN:</span>
                                <span className="text-green-500 font-medium">
                                  {(part.inventory as Inventory).cn}
                                </span>
                              </div>
                            )}
                            {typeof (part.inventory as Inventory).na !== 'undefined' && (
                              <div className="flex justify-between">
                                <span>US:</span>
                                <span className="text-green-500 font-medium">
                                  {(part.inventory as Inventory).na}
                                </span>
                              </div>
                            )}
                            {typeof (part.inventory as Inventory).eu !== 'undefined' && (
                              <div className="flex justify-between">
                                <span>EU:</span>
                                <span className="text-green-500 font-medium">
                                  {(part.inventory as Inventory).eu}
                                </span>
                              </div>
                            )}
                            {typeof (part.inventory as Inventory).au !== 'undefined' && (
                              <div className="flex justify-between">
                                <span>AU:</span>
                                <span className="text-green-500 font-medium">
                                  {(part.inventory as Inventory).au}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <div className="flex-none w-1/3 pr-2">
                      <input 
                        type="number" 
                        min="1" 
                        value={quantities[String(part.id)] || 1} 
                        onChange={(e) => { e.stopPropagation(); handleQuantityChange(String(part.id), e); }}
                        className="w-full text-center border border-gray-300 rounded-md py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(part, quantities[String(part.id)] || 1); }}
                      className="flex-grow py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      加入购物车
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 获取区域库存状态
  const getInventoryStatus = (part: SparePart): string => {
    // 获取当前区域的库存
    let regionStock = 0;
    
    if (!part.inventory) {
      return t('inventory.noInfo', {ns: 'spareParts'});
    }
    
    if (Array.isArray(part.inventory)) {
      // 数组格式的库存
      const regionInventory = part.inventory.find(
        item => item.region.toLowerCase() === currentUser.region.toLowerCase()
      );
      regionStock = regionInventory?.quantity || 0;
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
    
    // 确保返回字符串而不是对象
    if (regionStock <= 0) return String(t('inventory.outOfStock', {ns: 'spareParts'}));
    if (regionStock < 5) return String(t('inventory.lowStock', {ns: 'spareParts'}));
    if (regionStock < 20) return String(t('inventory.inStock', {ns: 'spareParts'}));
    return String(t('inventory.highStock', {ns: 'spareParts'}));
  };
  
  // 处理确认清空购物车
  const handleConfirmClearCart = () => {
    clearCart();
    setShowConfirmClear(false);
    showCartNotification(t('cart.cartCleared', {ns: 'spareParts'}));
  };
  
  // 渲染购物车项
  const renderCartItems = () => {
    if (items.length === 0) {
      return <div className="empty-cart-message">{t('cart.empty', {ns: 'spareParts'})}</div>;
    }
    
    // Filter items to only show spare parts
    const sparePartItems = items.filter(item => 
      item.category === 'Machine Parts' || item.category === 'Accessory Parts' || item.properties?.productType === 'machine' || item.properties?.productType === 'accessory'
    );
    
    if (sparePartItems.length === 0) {
      return <div className="empty-cart-message">{t('cart.empty', {ns: 'spareParts'})}</div>;
    }
    
    return sparePartItems.map((item, index) => {
      return (
        <div className="cart-item" key={item.id}>
          <div className="cart-item-top">
            <img className="cart-item-img" src={item.image || '/images/spare-parts/default.svg'} alt={item.name} />
            <div className="cart-item-main">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-sku">{t('cart.sku', {ns: 'spareParts'})}: {item.code}</div>
              <div className="cart-item-price-tiers">
                {item.priceTiers && item.priceTiers.length > 0 ? (
                  item.priceTiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="cart-price-tier-entry">
                      <span>
                        {tier.min} 
                        {(tier.max && tier.max > tier.min) ? `-${tier.max}` : '+'}
                        : {getCurrencySymbol(userRegion)} {tier.price.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="cart-item-price">
                    {getCurrencySymbol(userRegion)} {(item.price * item.quantity).toFixed(2)}
                  </div>
                )}
              </div>
              {/* Tiered Price Display END */}

            </div>
          </div>
          <div className="cart-item-details">
            {item.properties?.spec && (
              <div className="cart-item-detail">
                <strong>{t('specs.spec', {ns: 'spareParts'})}:</strong> {item.properties.spec}
              </div>
            )}
            {item.properties?.pcsPerBox !== undefined && item.properties?.pcsPerBox !== null && (
              <div className="cart-item-detail">
                <strong>{t('specs.pcsPerBox', {ns: 'spareParts'})}:</strong> {item.properties.pcsPerBox}
              </div>
            )}
            {item.properties?.model && (
              <div className="cart-item-detail">
                <strong>{t('specs.compatibleModels', {ns: 'spareParts'})}:</strong> {item.properties.model}
              </div>
            )}
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
      
      // 获取筛选选项
      console.log(`Getting filter options for ${productType}`);
      const options = await sparePartsApi.getSparePartsFilterOptions();
      console.log(`Received filter options for ${productType}:`, options);
      
      if (options) {
        // 设置型号数据
        if (productType === 'machine') {
          // 有选项数据时才更新，防止清空已有数据
          if (Array.isArray(options.hostModels)) {
            setHostModels(options.hostModels);
            console.log(`Set ${options.hostModels.length} host models:`, options.hostModels);
          } else {
            console.warn('Host models is not an array:', options.hostModels);
          }
        } else if (productType === 'accessory') {
          // 有选项数据时才更新，防止清空已有数据
          if (Array.isArray(options.accessoryModels)) {
            setAccessoryModels(options.accessoryModels);
            console.log(`Set ${options.accessoryModels.length} accessory models:`, options.accessoryModels);
          } else {
            console.warn('Accessory models is not an array:', options.accessoryModels);
          }
        }
      } else {
        console.error('No options returned from API');
        // 保留当前值而不是清空
      }
      
      // 重置已选型号
      setSelectedModel('');
      
      // 当切换产品类型时，重新加载数据
      loadSparePartsData();
    } catch (err) {
      console.error(`Error fetching models for ${productType}:`, err);
      
      // 更详细的错误处理，但保持当前值
      if (err instanceof Error) {
        const errorMessage = err.message || `Failed to fetch models for ${productType}`;
        console.warn(errorMessage);
        
        // 可以选择显示轻量级的错误提示
        // showCartNotification(`Error: ${errorMessage}`, 3000);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add a helper function at the top of the component
  const formatPrice = (price: any): string => {
    if (price === undefined || price === null) return '0.00';
    if (typeof price === 'string') {
      // 尝试解析字符串为数字
      try {
        return parseFloat(price).toFixed(2);
      } catch (e) {
        return '0.00';
      }
    }
    if (typeof price === 'object') {
      // 如果是对象，返回默认值
      return '0.00';
    }
    return parseFloat(price).toFixed(2);
  };
  
  // 安全渲染函数 - 确保渲染的总是字符串，而不是对象
  const safeRender = (content: any): string => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'number' || typeof content === 'boolean') return String(content);
    if (typeof content === 'object') return JSON.stringify(content);
    return String(content);
  };

  // 用于渲染库存状态的函数
  const renderStockStatus = (status: any): string => {
    // 无论输入是什么，都返回简单的文本
    return t('inventory.inStock', {ns: 'spareParts', defaultValue: 'In Stock'});
  };
  
  // 渲染主页面
  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-lg shadow-sm border border-border mb-6">
          <div>
            <h1 className="text-xl font-bold text-title">{t('title', {ns: 'spareParts'})}</h1>
            <p className="text-sm text-content-light">{t('subtitle', {ns: 'spareParts'})}</p>
          </div>
          <div className="flex mt-3 sm:mt-0">
            <button 
              className="bg-primary text-white px-4 py-2 rounded-md flex items-center hover:bg-primary-dark transition-colors"
              onClick={() => setShowCartModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              {t('cart.viewCart', {ns: 'spareParts'})} {items.length > 0 && `(${items.length})`}
            </button>
          </div>
        </div>

        {/* 开发调试面板 - 仅在开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-3 rounded-md mb-4 text-xs font-mono overflow-x-auto">
            <details>
              <summary className="font-semibold cursor-pointer">调试信息</summary>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="text-gray-700">
                  <strong>加载状态:</strong> {loading ? '加载中...' : '空闲'}
                </div>
                <div className="text-gray-700">
                  <strong>错误状态:</strong> {error || '无错误'}
                </div>
                <div className="text-gray-700">
                  <strong>数据项数:</strong> {Array.isArray(spareParts) ? spareParts.length : 0}
                </div>
                <div className="text-gray-700">
                  <strong>已选型号:</strong> {selectedModel || '无'}
                </div>
                <div className="text-gray-700">
                  <strong>当前产品类型:</strong> {currentProductType || '无'}
                </div>
                <div className="text-gray-700">
                  <strong>耗材类型筛选:</strong> {selectedIsConsumable === null ? '全部' : selectedIsConsumable ? '耗材' : '非耗材'}
                </div>
                <div className="text-gray-700">
                  <strong>可用筛选配置:</strong> {filterOptions ? '已加载' : '未加载'}
                </div>
                <div className="text-gray-700">
                  <strong>机器型号:</strong> {hostModels?.length || 0} 项
                </div>
                <div className="text-gray-700">
                  <strong>配件型号:</strong> {accessoryModels?.length || 0} 项
                </div>
                <div className="text-gray-700">
                  <strong>用户信息:</strong> {userRole}, 区域: {userRegion}
                </div>
                <div className="mt-2">
                  <button 
                    onClick={handleReloadData} 
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    重新加载数据
                  </button>
                  <button 
                    onClick={handleReloadFilterOptions} 
                    className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    重新加载筛选项
                  </button>
                  <button 
                    onClick={() => console.log('筛选选项:', filterOptions, '备件数据:', spareParts)} 
                    className="ml-2 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                  >
                    控制台输出数据
                  </button>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Filter Container */}
        <div className="bg-card p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-medium text-title">{t('filters.title', {ns: 'spareParts'})}</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-label mb-2">{t('filters.label.productType', {ns: 'spareParts'})}:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentProductType('machine')}
                  className={`px-4 py-2 rounded text-sm ${currentProductType === 'machine' ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
                >
                  {t('productTypes.machine', {ns: 'spareParts'})}
                </button>
                <button
                  onClick={() => setCurrentProductType('accessory')}
                  className={`px-4 py-2 rounded text-sm ${currentProductType === 'accessory' ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
                >
                  {t('productTypes.accessory', {ns: 'spareParts'})}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-label mb-2">{t('filters.label.model', {ns: 'spareParts'})}:</label>
              <select
                className="block w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">{t('filters.model.allModels', {ns: 'spareParts'})}</option>
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
            
            <div>
              <label className="block text-sm font-medium text-label mb-2">{t('filters.label.partType', {ns: 'spareParts'})}:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedIsConsumable(null)}
                  className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === null ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
                >
                  {t('filters.partType.allTypes', {ns: 'spareParts'})}
                </button>
                <button
                  onClick={() => setSelectedIsConsumable(true)}
                  className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === true ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
                >
                  {t('filters.partType.consumables', {ns: 'spareParts'})}
                </button>
                <button
                  onClick={() => setSelectedIsConsumable(false)}
                  className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === false ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
                >
                  {t('filters.partType.nonConsumables', {ns: 'spareParts'})}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Content */}
        {renderSpareParts()}
      </div>
      
      {/* Cart Modal */}
      <div className={`cart-preview ${showCartModal ? 'active' : ''}`}>
        <div className="cart-modal">
          <div className="cart-modal-backdrop" onClick={() => setShowCartModal(false)}></div>
          <div className="cart-modal-content">
            <div className="cart-modal-header">
              <h3>{t('cart.title', {ns: 'spareParts'})}</h3>
              <button className="cart-modal-close" onClick={() => setShowCartModal(false)}>×</button>
            </div>
            <div className="cart-modal-body">
              {renderCartItems()}
            </div>
            {items.length > 0 && (
              <div className="cart-modal-footer">
                <div className="cart-total-line">
                  <span>{t('cart.total', {ns: 'spareParts'})}:</span>
                  <span className="cart-grand-total">¥{calculateCartTotal().toFixed(2)}</span>
                </div>
                <div className="cart-actions">
                  <button className="cart-clear-btn" onClick={() => setShowConfirmClear(true)}>
                    {t('cart.clear', {ns: 'spareParts'})}
                  </button>
                  <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                    {t('cart.checkout', {ns: 'spareParts'})}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notifications */}
      <div className={`cart-notification ${activeNotification ? 'show' : ''}`}>
        {/* ... (existing notification code) */}
      </div>
      
      {/* Confirmation Dialog */}
      <div className={`cart-confirm ${showConfirmClear ? 'show' : ''}`}>
        {/* ... (existing confirmation dialog code) */}
      </div>
      
      {/* Tooltip component */}
      {showTooltip && selectedSparePartForTooltip && (
        <div 
          ref={tooltipRef}
          className="fixed bg-white shadow-lg rounded-lg p-4 z-[1000] border border-gray-200 min-w-[250px] max-w-[350px] pointer-events-auto"
          style={{ 
            left: `${tooltipPos.left}px`, 
            top: `${tooltipPos.top}px`, 
            transform: 'translate(0, 0)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <h4 className="text-md font-semibold mb-2">{selectedSparePartForTooltip.name_en}</h4>
          <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
            {/* 根据用户区域选择显示英制或公制单位 */}
            {currentUser.region === 'na' || currentUser.region === 'au' ? (
              // 显示英制单位 (NA, AU区域)
              <>
                {selectedSparePartForTooltip.package_size_inch && (
                  <>
                    <div className="text-gray-600">包装尺寸:</div>
                    <div>{selectedSparePartForTooltip.package_size_inch} (inch)</div>
                  </>
                )}
                {selectedSparePartForTooltip.net_weight_lbs !== null && (
                  <>
                    <div className="text-gray-600">单件净重:</div>
                    <div>{selectedSparePartForTooltip.net_weight_lbs} (lbs)</div>
                  </>
                )}
                {selectedSparePartForTooltip.gross_weight_lbs !== null && (
                  <>
                    <div className="text-gray-600">单件毛重:</div>
                    <div>{selectedSparePartForTooltip.gross_weight_lbs} (lbs)</div>
                  </>
                )}
              </>
            ) : (
              // 显示公制单位 (CN, EU等其他区域)
              <>
                {selectedSparePartForTooltip.package_size_cm && (
                  <>
                    <div className="text-gray-600">包装尺寸:</div>
                    <div>{selectedSparePartForTooltip.package_size_cm} (cm)</div>
                  </>
                )}
                {selectedSparePartForTooltip.net_weight_kg !== null && (
                  <>
                    <div className="text-gray-600">单件净重:</div>
                    <div>{selectedSparePartForTooltip.net_weight_kg} (kg)</div>
                  </>
                )}
                {selectedSparePartForTooltip.gross_weight_kg !== null && (
                  <>
                    <div className="text-gray-600">单件毛重:</div>
                    <div>{selectedSparePartForTooltip.gross_weight_kg} (kg)</div>
                  </>
                )}
              </>
            )}
            {selectedSparePartForTooltip.pcs_per_box !== null && (
              <>
                <div className="text-gray-600">装箱数量:</div>
                <div>{selectedSparePartForTooltip.pcs_per_box}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SparePartsPage;