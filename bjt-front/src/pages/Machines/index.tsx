import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Machines.css';
import { useCart } from '../../contexts/CartContext';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';

// 定义产品规格类型
interface ProductSpecs {
  partNumber: string;
  voltage: string;
  [key: string]: string;
}

// 定义区域价格类型
interface RegionPrices {
  EU: { base: number; tier1: number; tier2: number; vip: number };
  NA: { base: number; tier1: number; tier2: number; vip: number };
  AU: { base: number; tier1: number; tier2: number; vip: number };
  CN: { base: number; tier1: number; tier2: number; vip: number };
}

// Define the MachineProduct interface
interface MachineProduct {
  id: string;
  name: string;
  image_url: string;
  subtitle?: string;
  specs: Record<string, string>;
  inventory: Array<{region: string, amount: number}>;
  prices: {
    base: number;
    tier1: number;
    tier2: number;
    vip: number;
  };
}

const MachinesPage: React.FC = () => {
  // 使用购物车上下文
  const { addToCart: addItemToCart } = useCart();
  // 使用认证上下文
  const { user } = useAuth();
  
  // 状态管理
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedAccessories, setSelectedAccessories] = useState<{ [key: number]: string }>({});
  const [selectedVoltage, setSelectedVoltage] = useState<string>('220V');
  const [cartCount, setCartCount] = useState<number>(0);
  const [showCartNotificationFlag, setShowCartNotificationFlag] = useState<boolean>(false);
  const [notificationProduct, setNotificationProduct] = useState<string>('');
  const [notificationQuantity, setNotificationQuantity] = useState<number>(1);
  // Add state for quantities
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({
    'lpv1': 1,
    'lpf1': 1,
    'floorStand': 1,
    'tableStand': 1,
    'printHead': 1,
    'mainBoard': 1,
    'thermalPaper': 1,
    'ribbon': 1
  });
  
  // 判断用户角色
  const isSales = user && (user.role === UserRole.SALES || user.role === UserRole.ADMIN);
  const isAdmin = user && user.role === UserRole.ADMIN;
  // 使用VIP相关字段
  const isVIP = user && (user.vipLevel ? user.vipLevel >= 2 : user.type === 'vip');
  // 获取用户所在区域
  const userRegion = user?.region || 'CN'; // 默认为中国区

  // 获取基于用户区域的货币符号
  const getCurrencySymbol = (region: string): string => {
    switch(region) {
      case 'NA': return '$';
      case 'EU': return '€';
      case 'AU': return 'A$';
      default: return '¥';
    }
  };

  // 获取用户区域的价格
  const getRegionalPrice = (prices: RegionPrices): { 
    base: number; 
    tier1: number; 
    tier2: number; 
    vip: number;
    symbol: string;
  } => {
    let regionData;
    switch(userRegion) {
      case 'NA':
        regionData = prices.NA;
        break;
      case 'EU':
        regionData = prices.EU;
        break;
      case 'AU':
        regionData = prices.AU;
        break;
      default:
        regionData = prices.CN;
    }
    return {
      ...regionData,
      symbol: getCurrencySymbol(userRegion)
    };
  };

  // 定义各产品在不同区域的价格
  const lpv1Prices: RegionPrices = {
    EU: { base: 1650, tier1: 1550, tier2: 1500, vip: 1450 },
    NA: { base: 1800, tier1: 1700, tier2: 1650, vip: 1580 },
    AU: { base: 2400, tier1: 2250, tier2: 2150, vip: 2050 },
    CN: { base: 12800, tier1: 12000, tier2: 11500, vip: 11000 }
  };

  const lpf1Prices: RegionPrices = {
    EU: { base: 1250, tier1: 1180, tier2: 1120, vip: 1080 },
    NA: { base: 1380, tier1: 1300, tier2: 1250, vip: 1200 },
    AU: { base: 1800, tier1: 1700, tier2: 1600, vip: 1550 },
    CN: { base: 9800, tier1: 9200, tier2: 8800, vip: 8500 }
  };

  const floorStandPrices: RegionPrices = {
    EU: { base: 11, tier1: 10, tier2: 8.5, vip: 7.5 },
    NA: { base: 12, tier1: 11, tier2: 9, vip: 8 },
    AU: { base: 16, tier1: 14, tier2: 12, vip: 11 },
    CN: { base: 85, tier1: 75, tier2: 65, vip: 55 }
  };

  const tableStandPrices: RegionPrices = {
    EU: { base: 10, tier1: 8.5, tier2: 7, vip: 6 },
    NA: { base: 11, tier1: 9, tier2: 7.5, vip: 6.5 },
    AU: { base: 14, tier1: 12, tier2: 10, vip: 9 },
    CN: { base: 75, tier1: 65, tier2: 55, vip: 50 }
  };

  // Add function to handle quantity changes
  const handleQuantityChange = (product: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [product]: value
    }));
  };

  // 处理机器选择
  const handleMachineSelection = (machineId: string) => {
    setSelectedMachine(machineId);
    
    // 显示一级配件
    const level1 = document.getElementById('accessory-level-1');
    if (level1) level1.style.display = 'block';
    
    // 更新上下文消息
    const contextMessage = document.getElementById('level1-context-message');
    if (contextMessage) {
      contextMessage.textContent = `下方列出的是 ${machineId.toUpperCase()} 的适配件`;
    }
    
    // 隐藏其他级别
    for (let i = 2; i <= 5; i++) {
      const container = document.getElementById(`accessory-level-${i}`);
      if (container) {
        container.style.display = 'none';
      }
    }
  };

  // 处理配件选择
  const handleAccessorySelection = (level: number, accessoryId: string, accessoryName: string) => {
    // 显示下一级配件
    const nextLevel = document.getElementById(`accessory-level-${level + 1}`);
    if (nextLevel) nextLevel.style.display = 'block';
    
    // 更新上下文消息
    const contextMessage = document.getElementById(`level${level + 1}-context-message`);
    if (contextMessage) {
      contextMessage.textContent = `下方列出的是 ${accessoryName} 的下级适配件`;
    }
    
    // 隐藏更高级别
    for (let i = level + 2; i <= 5; i++) {
      const container = document.getElementById(`accessory-level-${i}`);
      if (container) {
        container.style.display = 'none';
      }
    }
  };

  // 处理电压选择
  const handleVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedVoltage(e.target.value);
    
    // 更新显示的电压值
    document.querySelectorAll('.accessory-spec-item').forEach(item => {
      if (item.textContent?.includes('电压:')) {
        const label = item.querySelector('strong');
        if (label) {
          const parent = item.parentElement;
          const newElm = document.createElement('span');
          newElm.className = 'accessory-spec-item';
          newElm.innerHTML = `<strong>电压:</strong> ${e.target.value}`;
          if (parent && item) {
            parent.replaceChild(newElm, item);
          }
        }
      }
    });
  };

  // 添加到购物车
  const addToCart = (productType: string, productId: string) => {
    // Get the quantity from state
    const quantity = quantities[productId] || 1;
    
    // 获取产品名称和价格
    let productName = '';
    let price = 0;
    let specs: ProductSpecs = {
      partNumber: '',
      voltage: ''
    };
    let image_url = '';
    
    // 根据产品ID获取详细信息
    if (productId === 'lpv1') {
      productName = 'LP-V1气垫机';
      const prices = getRegionalPrice(lpv1Prices);
      price = prices.base;
      image_url = '/images/products/lpv1.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-LP-V1-2024',
        voltage: selectedVoltage
      };
    } else if (productId === 'lpf1') {
      productName = 'LP-F1气垫机';
      const prices = getRegionalPrice(lpf1Prices);
      price = prices.base;
      image_url = '/images/products/lpf1.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-LP-F1-2024',
        voltage: selectedVoltage
      };
    } else if (productId === 'floor-stand') {
      productName = '地面支架组件';
      const prices = getRegionalPrice(floorStandPrices);
      price = prices.base;
      image_url = '/images/accessories/floor-stand.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-FS-V2-2024',
        voltage: 'N/A'
      };
    } else if (productId === 'table-stand') {
      productName = '桌面支架组件';
      const prices = getRegionalPrice(tableStandPrices);
      price = prices.base;
      image_url = '/images/accessories/table-stand.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-TS-V1-2024',
        voltage: 'N/A'
      };
    } else if (productId === 'printhead') {
      productName = '热敏打印头组件';
      const printHeadPrices: RegionPrices = {
        EU: { base: 220, tier1: 200, tier2: 180, vip: 170 },
        NA: { base: 240, tier1: 220, tier2: 190, vip: 180 },
        AU: { base: 300, tier1: 280, tier2: 250, vip: 230 },
        CN: { base: 2200, tier1: 2000, tier2: 1800, vip: 1700 }
      };
      const prices = getRegionalPrice(printHeadPrices);
      price = prices.base;
      image_url = '/images/accessories/printhead.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-TH-300P-2024',
        voltage: selectedVoltage
      };
    } else if (productId === 'controller') {
      productName = '主控制板';
      const controllerPrices: RegionPrices = {
        EU: { base: 180, tier1: 165, tier2: 150, vip: 140 },
        NA: { base: 200, tier1: 180, tier2: 160, vip: 150 },
        AU: { base: 250, tier1: 230, tier2: 210, vip: 190 },
        CN: { base: 1800, tier1: 1650, tier2: 1500, vip: 1400 }
      };
      const prices = getRegionalPrice(controllerPrices);
      price = prices.base;
      image_url = '/images/accessories/controller.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-MCB-200-2024',
        voltage: selectedVoltage
      };
    } else if (productId === 'paper') {
      productName = '热敏标签纸卷（5卷装）';
      const paperPrices: RegionPrices = {
        EU: { base: 32, tier1: 28, tier2: 25, vip: 22 },
        NA: { base: 35, tier1: 30, tier2: 28, vip: 25 },
        AU: { base: 45, tier1: 40, tier2: 36, vip: 32 },
        CN: { base: 320, tier1: 280, tier2: 250, vip: 220 }
      };
      const prices = getRegionalPrice(paperPrices);
      price = prices.base;
      image_url = '/images/consumables/paper.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-TP-40x30-700-2024',
        voltage: 'N/A'
      };
    } else if (productId === 'ribbon') {
      productName = '热转印色带（2卷装）';
      const ribbonPrices: RegionPrices = {
        EU: { base: 28, tier1: 25, tier2: 22, vip: 20 },
        NA: { base: 30, tier1: 28, tier2: 24, vip: 22 },
        AU: { base: 40, tier1: 36, tier2: 32, vip: 28 },
        CN: { base: 280, tier1: 250, tier2: 220, vip: 190 }
      };
      const prices = getRegionalPrice(ribbonPrices);
      price = prices.base;
      image_url = '/images/consumables/ribbon.jpg'; // 请确保路径正确
      specs = {
        partNumber: 'BJT-TR-110-300-2024',
        voltage: 'N/A'
      };
    }
    
    // 创建购物车项并添加到上下文
    for (let i = 0; i < quantity; i++) {
      const typeMap: Record<string, 'machine' | 'accessory' | 'consumable' | 'spare'> = {
        'machine': 'machine',
        'accessory': 'accessory',
        'consumable': 'consumable',
        'part': 'spare'
      };
      
      const typeLabelMap: Record<string, string> = {
        'machine': '设备',
        'accessory': '配件',
        'consumable': '耗材',
        'part': '备件'
      };
      
      addItemToCart({
        id: Math.random(), // 临时使用随机数作为唯一ID
        model: productName,
        type: typeMap[productType] || 'accessory',
        typeLabel: typeLabelMap[productType] || '配件',
        image_url: image_url || 'https://via.placeholder.com/120x100',
        sku: specs.partNumber as string || '',
        price: price,
        originalPrice: price,
        properties: { 
          ...specs,
          '选择的电压': selectedVoltage
        }
      });
    }
    
    // Update notification with the correct quantity
    setNotificationProduct(productName);
    setNotificationQuantity(quantity);
    setShowCartNotificationFlag(true);
  };
  
  // 显示购物车通知
  const showCartNotification = (productName: string, quantity: number) => {
    setNotificationProduct(productName);
    setNotificationQuantity(quantity);
    setShowCartNotificationFlag(true);
    
    // 3秒后自动隐藏通知
    setTimeout(() => {
      setShowCartNotificationFlag(false);
    }, 3000);
  };
  
  // 初始化
  useEffect(() => {
    // 默认选中第一个机器并显示其配件
    handleMachineSelection('lpv1');
  }, []);

  // 获取库存状态颜色和类名
  const getStockStatus = (amount: number) => {
    if (amount <= 0) {
      return { className: 'out-of-stock', colorClass: 'inventory-low' };
    } else if (amount <= 5) {
      return { className: 'low-stock', colorClass: 'inventory-low' };
    } else if (amount <= 20) {
      return { className: 'medium-stock', colorClass: 'inventory-medium' };
    } else {
      return { className: 'high-stock', colorClass: 'inventory-high' };
    }
  };

  // 格式化日期为 '今日 HH:MM' 格式
  const formatDate = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `今日 ${hours}:${minutes}`;
  };

  // Implement the getProductName function
  const getProductName = (product: MachineProduct): string => {
    return product.name || product.id;
  };

  // Fix the renderProduct function
  const renderProduct = (product: MachineProduct) => {
    const formatPrice = (price: number): string => {
      return price.toLocaleString();
    };

    // Get the correct price based on regional settings
    const productPrices = {
      basePrice: product.prices.base,
      tier1Price: product.prices.tier1,
      tier2Price: product.prices.tier2,
      vipPrice: product.prices.vip
    };

    return (
      <div className="product-card" key={product.id}>
        <div className="product-inner">
          <div className="product-header">
            <h3>{getProductName(product)}</h3>
            {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
          </div>
          <div className="product-body">
            <div className="product-image">
              <img src={product.image_url} alt={product.name} />
            </div>
            <div className="product-specs">
              {Object.entries(product.specs).map(([key, value]) => (
                <div className="spec-item" key={key}>
                  <span className="spec-label">{key}:</span>
                  <span className="spec-value">{value}</span>
                </div>
              ))}
            </div>
            {isSales && (
              <div className="product-inventory">
                <div className="inventory-regions">
                  <div className="product-inventory-title">库存状态</div>
                  <div className="inventory-region">
                    <span className="region-label">EU</span>
                    <span className={`region-value ${parseInt('24') < 10 ? 'low-stock' : ''}`}>24台</span>
                  </div>
                  <div className="inventory-region">
                    <span className="region-label">AU</span>
                    <span className={`region-value ${parseInt('18') < 10 ? 'low-stock' : ''}`}>18台</span>
                  </div>
                  <div className="inventory-region">
                    <span className="region-label">DE</span>
                    <span className={`region-value ${parseInt('15') < 10 ? 'low-stock' : ''}`}>15台</span>
                  </div>
                </div>
              </div>
            )}
            <div className="product-pricing">
              <h4>价格信息</h4>
              <div className="price-tiers">
                <div className="price-tier">
                  <span className="tier-label">标准价 (1-4台)</span>
                  <span className="tier-price">
                    <span className="price-currency">{getCurrencySymbol(userRegion)}</span>
                    <span className="price-amount">{formatPrice(productPrices.basePrice)}</span>
                  </span>
                </div>
                <div className="price-tier">
                  <span className="tier-label">批发价 (5-9台)</span>
                  <span className="tier-price">
                    <span className="price-currency">{getCurrencySymbol(userRegion)}</span>
                    <span className="price-amount">{formatPrice(productPrices.tier1Price)}</span>
                  </span>
                </div>
                <div className="price-tier">
                  <span className="tier-label">批发价 (10+台)</span>
                  <span className="tier-price">
                    <span className="price-currency">{getCurrencySymbol(userRegion)}</span>
                    <span className="price-amount">{formatPrice(productPrices.tier2Price)}</span>
                  </span>
                </div>
                {isVIP && (
                  <div className="vip-price">
                    <span>VIP 价格</span>
                    <span>
                      <span className="price-currency">{getCurrencySymbol(userRegion)}</span>
                      <span className="price-amount">{formatPrice(productPrices.vipPrice)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="product-footer">
            <button className="btn-primary" onClick={() => handleAddToCart(product)}>
              添加到购物车
            </button>
            <button className="btn-link" onClick={() => showProductDetails(product)}>
              查看详情
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Define these functions if they don't exist
  const handleAddToCart = (product: MachineProduct) => {
    // Implement add to cart logic
    console.log('Adding to cart:', product);
    // Example implementation:
    addToCart('machine', product.id);
  };

  const showProductDetails = (product: MachineProduct) => {
    // Implement show details logic
    console.log('Showing details for:', product);
  };

  return (
    <div className="machines-page">
      {/* 面包屑导航 */}
      <div className="breadcrumb">
        <a href="/">首页</a> &gt; <span>气垫机选型</span>
      </div>

      {/* 购物车通知 */}
      <div className={`cart-notification ${showCartNotificationFlag ? 'show' : ''}`}>
        <div className="cart-notification-content">
          <div className="cart-notification-icon">✓</div>
          <div className="cart-notification-text">
            已添加 {notificationQuantity} 个 {notificationProduct} 到购物车
          </div>
          <button 
            className="cart-notification-close"
            onClick={() => setShowCartNotificationFlag(false)}
          >
            ×
          </button>
        </div>
        <div className="cart-notification-progress"></div>
      </div>

      {/* 机器选择部分 */}
      <div className="section-title">
        气垫机型号选择
      </div>

      <div className="product-list">
        {/* LP-V1 气垫机 */}
        <div className="product-item" data-product-id="lpv1">
          <div className="product-selector">
            <input 
              type="radio" 
              id="lpv1" 
              name="machine" 
              className="machine-radio"
              checked={selectedMachine === 'lpv1'}
              onChange={() => handleMachineSelection('lpv1')}
            />
          </div>
          <div className="product-info">
            <div className="product-code">LP-V1</div>
            <div className="product-description">
              <div>全自动触摸屏标签打印贴标一体机</div>
              <div className="product-details">
                <span className="product-detail-item"><strong>料号:</strong> BJT-LP-V1-2024</span>
                <span className="product-detail-item"><strong>尺寸:</strong> 400×300×350mm</span>
                <span className="product-detail-item"><strong>重量:</strong> 15kg</span>
                <span className="product-detail-item"><strong>功率:</strong> 120W</span>
                <span className="product-detail-item"><strong>托盘尺寸:</strong> 120×80×160cm</span>
                <span className="product-detail-item"><strong>一托数量:</strong> 24件</span>
              </div>
              <div className="more-info-section">
                <a href="#specifications" className="specification-link">规格详情</a>
                <span className="tooltip">
                  <a href="#more-info" className="more-info-link">更多信息</a>
                  <div className="tooltip-content">
                    <div className="tooltip-title">LP-V1详细信息</div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">包装尺寸 cm:</span>
                      <span>45×35×40</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">包装尺寸 inch:</span>
                      <span>17.7×13.8×15.7</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">单件净重 kg:</span>
                      <span>15</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">单件净重 lbs:</span>
                      <span>33.1</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">打托高度 cm:</span>
                      <span>160</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">打托高度 inch:</span>
                      <span>63</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">整托毛重 kg:</span>
                      <span>385</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">整托毛重 lbs:</span>
                      <span>848.8</span>
                    </div>
                  </div>
                </span>
              </div>
            </div>
            {isSales && (
              <div className="product-inventory">
                <div className="inventory-regions">
                  <div className="product-inventory-title">库存状态</div>
                  <div className="inventory-region">
                    <span className="region-label">EU</span>
                    <span className={`region-value ${parseInt('24') < 10 ? 'low-stock' : ''}`}>24台</span>
                  </div>
                  <div className="inventory-region">
                    <span className="region-label">AU</span>
                    <span className={`region-value ${parseInt('18') < 10 ? 'low-stock' : ''}`}>18台</span>
                  </div>
                  <div className="inventory-region">
                    <span className="region-label">DE</span>
                    <span className={`region-value ${parseInt('15') < 10 ? 'low-stock' : ''}`}>15台</span>
                  </div>
                </div>
              </div>
            )}
            <div className="product-pricing">
              <div className="price-tiers">
                {(() => {
                  const prices = getRegionalPrice(lpv1Prices);
                  return (
                    <>
                      <div className="price-title">价格信息</div>
                      <div className="base-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base.toLocaleString()}</span></span>
                        <span className="quantity-range">1-4台</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1.toLocaleString()}</span></span>
                        <span className="quantity-range">5-9台</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2.toLocaleString()}</span></span>
                        <span className="quantity-range">10+台</span>
                      </div>
                      {isVIP && (
                        <div className="vip-price">
                          <span>VIP 价格</span>
                          <span>
                            <span className="price-currency">{prices.symbol}</span>
                            <span className="price-amount">{prices.vip.toLocaleString()}</span>
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <img 
              src="/images/placeholders/placeholder.svg" 
              alt="LP-V1" 
              className="product-image"
            />
            <div className="product-actions">
              <input
                type="number"
                min="1"
                value={quantities.lpv1} 
                className="quantity-input"
                onChange={(e) => handleQuantityChange('lpv1', parseInt(e.target.value) || 1)} 
              />
              <button className="btn-add" onClick={() => addToCart('machine', 'lpv1')}>
                加入购物车
              </button>
            </div>
          </div>
        </div>
        
        {/* LP-F1 气垫机 */}
        <div className="product-item" data-product-id="lpf1">
          <div className="product-selector">
            <input 
              type="radio" 
              id="lpf1" 
              name="machine" 
              className="machine-radio"
              checked={selectedMachine === 'lpf1'}
              onChange={() => handleMachineSelection('lpf1')}
            />
          </div>
          <div className="product-info">
            <div className="product-code">LP-F1</div>
            <div className="product-description">
              <div>工业级快速贴标机</div>
              <div className="product-details">
                <span className="product-detail-item"><strong>料号:</strong> BJT-LP-F1-2024</span>
                <span className="product-detail-item"><strong>尺寸:</strong> 350×250×300mm</span>
                <span className="product-detail-item"><strong>重量:</strong> 12kg</span>
                <span className="product-detail-item"><strong>功率:</strong> 90W</span>
                <span className="product-detail-item"><strong>托盘尺寸:</strong> 110×75×145cm</span>
                <span className="product-detail-item"><strong>一托数量:</strong> 20件</span>
              </div>
              <div className="more-info-section">
                <a href="#specifications" className="specification-link">规格详情</a>
                <span className="tooltip">
                  <a href="#more-info" className="more-info-link">更多信息</a>
                  <div className="tooltip-content">
                    <div className="tooltip-title">LP-F1详细信息</div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">包装尺寸 cm:</span>
                      <span>40×30×35</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">包装尺寸 inch:</span>
                      <span>15.7×11.8×13.8</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">单件净重 kg:</span>
                      <span>12</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">单件净重 lbs:</span>
                      <span>26.5</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">打托高度 cm:</span>
                      <span>145</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">打托高度 inch:</span>
                      <span>57.1</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">整托毛重 kg:</span>
                      <span>268</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">整托毛重 lbs:</span>
                      <span>590.8</span>
                    </div>
                  </div>
                </span>
              </div>
            </div>
            {isSales && (
              <div className="product-inventory">
                <div className="inventory-regions">
                  <div className="product-inventory-title">库存状态</div>
                  <div className="inventory-region">
                    <span className="region-label">EU</span>
                    <span className={`region-value ${parseInt('20') < 10 ? 'low-stock' : ''}`}>20台</span>
                  </div>
                  <div className="inventory-region">
                    <span className="region-label">AU</span>
                    <span className={`region-value ${parseInt('15') < 10 ? 'low-stock' : ''}`}>15台</span>
                  </div>
                  <div className="inventory-region">
                    <span className="region-label">DE</span>
                    <span className={`region-value ${parseInt('10') < 10 ? 'low-stock' : ''}`}>10台</span>
                  </div>
                </div>
              </div>
            )}
            <div className="product-pricing">
              <div className="price-tiers">
                {(() => {
                  const prices = getRegionalPrice(lpf1Prices);
                  return (
                    <>
                      <div className="price-title">价格信息</div>
                      <div className="base-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base.toLocaleString()}</span></span>
                        <span className="quantity-range">1-4台</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1.toLocaleString()}</span></span>
                        <span className="quantity-range">5-9台</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2.toLocaleString()}</span></span>
                        <span className="quantity-range">10+台</span>
                      </div>
                      {isVIP && (
                        <div className="vip-price">
                          <span>VIP 价格</span>
                          <span>
                            <span className="price-currency">{prices.symbol}</span>
                            <span className="price-amount">{prices.vip.toLocaleString()}</span>
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <img 
              src="/images/placeholders/placeholder.svg" 
              alt="LP-F1" 
              className="product-image"
            />
            <div className="product-actions">
              <input
                type="number"
                min="1"
                value={quantities.lpf1} 
                className="quantity-input"
                onChange={(e) => handleQuantityChange('lpf1', parseInt(e.target.value) || 1)} 
              />
              <button className="btn-add" onClick={() => addToCart('machine', 'lpf1')}>
                加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 配件选择部分 - 第一级 */}
      <div id="accessory-level-1" className="accessory-level-1">
        <div className="section-title">
          配件选择 <span className="level-indicator">- 一级配件</span>
          <span id="level1-context-message" className="dynamic-note">下方列出的是 LP-V1 的适配件</span>
        </div>

        {/* 电压筛选 */}
        <div className="voltage-options-section">
          <div className="filter-title">电压选择:</div>
          <div className="voltage-options">
            <label className="voltage-option">
              <input
                type="radio"
                name="voltage" 
                value="220V"
                checked={selectedVoltage === '220V'}
                onChange={handleVoltageChange}
              />
              <span>220V</span>
            </label>
            <label className="voltage-option">
              <input
                type="radio"
                name="voltage" 
                value="110V"
                checked={selectedVoltage === '110V'}
                onChange={handleVoltageChange}
              />
              <span>110V</span>
            </label>
          </div>
        </div>
        
        <div className="product-list">
          {/* 地面支架 */}
          <div className="product-item" data-product-id="floor-stand">
            <div className="product-selector">
              <input 
                type="radio" 
                id="floor-stand" 
                name="accessory-level-1" 
                className="accessory-radio" 
                onChange={() => handleAccessorySelection(1, 'floor-stand', '地面支架')}
              />
            </div>
            <div className="product-info">
              <div className="product-code">Floor Stand</div>
              <div className="product-description">
                <div className="accessory-name">地面支架组件</div>
                <div className="accessory-specs">
                  <span className="frequency-spec"><strong>频率:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>料号:</strong> BJT-FS-V2-2024</span>
                  <span className="accessory-spec-item"><strong>电压:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>托盘尺寸:</strong> 90×70×120cm</span>
                  <span className="accessory-spec-item"><strong>一托数量:</strong> 16件</span>
                </div>
                <div className="more-info-section">
                  <a href="#specifications" className="specification-link">规格详情</a>
                  <span className="tooltip">
                    <a href="#more-info" className="more-info-link">更多信息</a>
                    <div className="tooltip-content">
                      <div className="tooltip-title">地面支架详细信息</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span>95×75×25</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span>37.4×29.5×9.8</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span>7.8</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span>17.2</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 cm:</span>
                        <span>120</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 inch:</span>
                        <span>47.2</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 kg:</span>
                        <span>145</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 lbs:</span>
                        <span>319.7</span>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              {isSales && (
                <div className="product-inventory">
                  <div className="inventory-regions">
                    <div className="product-inventory-title">库存状态</div>
                    <div className="inventory-region">
                      <span className="region-label">EU</span>
                      <span className={`region-value ${parseInt('16') < 10 ? 'low-stock' : ''}`}>16个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">AU</span>
                      <span className={`region-value ${parseInt('12') < 10 ? 'low-stock' : ''}`}>12个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">DE</span>
                      <span className={`region-value ${parseInt('8') < 10 ? 'low-stock' : ''}`}>8个</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="product-pricing">
                {(() => {
                  const prices = getRegionalPrice(floorStandPrices);
                  return (
                    <div className="price-tiers">
                      <div className="price-title">价格信息</div>
                      <div className="base-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base}</span></span>
                        <span className="quantity-range">1-5个</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1}</span></span>
                        <span className="quantity-range">6-20个</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2}</span></span>
                        <span className="quantity-range">20+个</span>
                      </div>
                      {isVIP && (
                        <div className="vip-price">
                          <span>VIP价</span>
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.vip}</span></span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <img 
                src="/images/placeholders/placeholder.svg" 
                alt="地面支架" 
                className="product-image"
              />
              <div className="product-actions">
                <input
                  type="number"
                  min="1"
                  value={quantities.floorStand} 
                  className="quantity-input"
                  onChange={(e) => handleQuantityChange('floorStand', parseInt(e.target.value) || 1)} 
                />
                <button className="btn-add" onClick={() => addToCart('accessory', 'floor-stand')}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
          
          {/* 桌面支架 */}
          <div className="product-item" data-product-id="table-stand">
            <div className="product-selector">
              <input 
                type="radio" 
                id="table-stand" 
                name="accessory-level-1" 
                className="accessory-radio"
                onChange={() => handleAccessorySelection(1, 'table-stand', '桌面支架')}
              />
            </div>
            <div className="product-info">
              <div className="product-code">Table Stand</div>
              <div className="product-description">
                <div className="accessory-name">桌面支架组件</div>
                <div className="accessory-specs">
                  <span className="frequency-spec"><strong>频率:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>料号:</strong> BJT-TS-V1-2024</span>
                  <span className="accessory-spec-item"><strong>电压:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>托盘尺寸:</strong> 80×60×110cm</span>
                  <span className="accessory-spec-item"><strong>一托数量:</strong> 20件</span>
                </div>
                <div className="more-info-section">
                  <a href="#specifications" className="specification-link">规格详情</a>
                  <span className="tooltip">
                    <a href="#more-info" className="more-info-link">更多信息</a>
                    <div className="tooltip-content">
                      <div className="tooltip-title">桌面支架详细信息</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span>65×55×20</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span>25.6×21.7×7.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span>3.5</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span>7.7</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 cm:</span>
                        <span>110</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 inch:</span>
                        <span>43.3</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 kg:</span>
                        <span>84</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 lbs:</span>
                        <span>185.2</span>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              {isSales && (
                <div className="product-inventory">
                  <div className="inventory-regions">
                    <div className="product-inventory-title">库存状态</div>
                    <div className="inventory-region">
                      <span className="region-label">EU</span>
                      <span className={`region-value ${parseInt('20') < 10 ? 'low-stock' : ''}`}>20个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">AU</span>
                      <span className={`region-value ${parseInt('15') < 10 ? 'low-stock' : ''}`}>15个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">DE</span>
                      <span className={`region-value ${parseInt('10') < 10 ? 'low-stock' : ''}`}>10个</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="product-pricing">
                {(() => {
                  const prices = getRegionalPrice(tableStandPrices);
                  return (
                    <div className="price-tiers">
                      <div className="price-title">价格信息</div>
                      <div className="base-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base}</span></span>
                        <span className="quantity-range">1-5个</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1}</span></span>
                        <span className="quantity-range">6-20个</span>
                      </div>
                      <div className="tier-price">
                        <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2}</span></span>
                        <span className="quantity-range">20+个</span>
                      </div>
                      {isVIP && (
                        <div className="vip-price">
                          <span>VIP价</span>
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.vip}</span></span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <img 
                src="/images/placeholders/placeholder.svg" 
                alt="桌面支架" 
                className="product-image"
              />
              <div className="product-actions">
                <input
                  type="number"
                  min="1"
                  value={quantities.tableStand} 
                  className="quantity-input"
                  onChange={(e) => handleQuantityChange('tableStand', parseInt(e.target.value) || 1)} 
                />
                <button className="btn-add" onClick={() => addToCart('accessory', 'table-stand')}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 配件选择部分 - 第二级 */}
      <div id="accessory-level-2" className="accessory-level-2">
        <div className="section-title">
          配件选择 <span className="level-indicator">- 二级配件</span>
          <span id="level2-context-message" className="dynamic-note"></span>
        </div>

        <div className="product-list">
          {/* 打印头 */}
          <div className="product-item" data-product-id="printhead">
            <div className="product-selector">
              <input 
                type="radio" 
                id="printhead" 
                name="accessory-level-2" 
                className="accessory-radio" 
                onChange={() => handleAccessorySelection(2, 'printhead', '打印头')}
              />
            </div>
            <div className="product-info">
              <div className="product-code">Print House</div>
              <div className="product-description">
                <div className="accessory-name">热敏打印头组件</div>
                <div className="accessory-specs">
                  <span className="frequency-spec"><strong>频率:</strong> 50Hz</span>
                  <span className="accessory-spec-item"><strong>料号:</strong> BJT-TH-300P-2024</span>
                  <span className="accessory-spec-item"><strong>电压:</strong> {selectedVoltage}</span>
                  <span className="accessory-spec-item"><strong>托盘尺寸:</strong> 50×40×20cm</span>
                  <span className="accessory-spec-item"><strong>一托数量:</strong> 100件</span>
                </div>
                <div className="more-info-section">
                  <a href="#specifications" className="specification-link">规格详情</a>
                  <span className="tooltip">
                    <a href="#more-info" className="more-info-link">更多信息</a>
                    <div className="tooltip-content">
                      <div className="tooltip-title">打印头详细信息</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span>55×45×10</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span>21.7×17.7×3.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span>0.6</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span>1.3</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 cm:</span>
                        <span>20</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 inch:</span>
                        <span>7.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 kg:</span>
                        <span>80</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 lbs:</span>
                        <span>176.4</span>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              {isSales && (
                <div className="product-inventory">
                  <div className="inventory-regions">
                    <div className="product-inventory-title">库存状态</div>
                    <div className="inventory-region">
                      <span className="region-label">EU</span>
                      <span className={`region-value ${parseInt('30') < 10 ? 'low-stock' : ''}`}>30个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">AU</span>
                      <span className={`region-value ${parseInt('25') < 10 ? 'low-stock' : ''}`}>25个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">DE</span>
                      <span className={`region-value ${parseInt('20') < 10 ? 'low-stock' : ''}`}>20个</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="product-pricing">
                <div className="price-tiers">
                  <div className="price-title">价格信息</div>
                  {(() => {
                    const printHeadPrices: RegionPrices = {
                      EU: { base: 220, tier1: 200, tier2: 180, vip: 170 },
                      NA: { base: 240, tier1: 220, tier2: 190, vip: 180 },
                      AU: { base: 300, tier1: 280, tier2: 250, vip: 230 },
                      CN: { base: 2200, tier1: 2000, tier2: 1800, vip: 1700 }
                    };
                    const prices = getRegionalPrice(printHeadPrices);
                    return (
                      <>
                        <div className="base-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base.toLocaleString()}</span></span>
                          <span className="quantity-range">1-5个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1.toLocaleString()}</span></span>
                          <span className="quantity-range">6-20个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2.toLocaleString()}</span></span>
                          <span className="quantity-range">20+个</span>
                        </div>
                        {isVIP && (
                          <div className="vip-price">
                            <span>VIP价</span>
                            <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.vip.toLocaleString()}</span></span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <img
                src="/images/placeholders/placeholder.svg" 
                alt="打印头" 
                className="product-image"
              />
              <div className="product-actions">
                <input
                  type="number"
                  min="1"
                  value={quantities.printHead} 
                  className="quantity-input"
                  onChange={(e) => handleQuantityChange('printHead', parseInt(e.target.value) || 1)} 
                />
                <button className="btn-add" onClick={() => addToCart('accessory', 'printhead')}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
          
          {/* 主控制板 */}
          <div className="product-item" data-product-id="controller">
            <div className="product-selector">
              <input 
                type="radio" 
                id="controller" 
                name="accessory-level-2" 
                className="accessory-radio" 
                onChange={() => handleAccessorySelection(2, 'controller', '主控制板')}
              />
            </div>
            <div className="product-info">
              <div className="product-code">Control Board</div>
              <div className="product-description">
                <div className="accessory-name">主控制板</div>
                <div className="accessory-specs">
                  <span className="frequency-spec"><strong>频率:</strong> 50Hz</span>
                  <span className="accessory-spec-item"><strong>料号:</strong> BJT-MCB-200-2024</span>
                  <span className="accessory-spec-item"><strong>电压:</strong> {selectedVoltage}</span>
                  <span className="accessory-spec-item"><strong>托盘尺寸:</strong> 40×30×15cm</span>
                  <span className="accessory-spec-item"><strong>一托数量:</strong> 200件</span>
                </div>
                <div className="more-info-section">
                  <a href="#specifications" className="specification-link">规格详情</a>
                  <span className="tooltip">
                    <a href="#more-info" className="more-info-link">更多信息</a>
                    <div className="tooltip-content">
                      <div className="tooltip-title">主控制板详细信息</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span>35×30×5</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span>13.8×11.8×2.0</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span>0.3</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span>0.7</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 cm:</span>
                        <span>15</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 inch:</span>
                        <span>5.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 kg:</span>
                        <span>100</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 lbs:</span>
                        <span>220.5</span>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              {isSales && (
                <div className="product-inventory">
                  <div className="inventory-regions">
                    <div className="product-inventory-title">库存状态</div>
                    <div className="inventory-region">
                      <span className="region-label">EU</span>
                      <span className={`region-value ${parseInt('25') < 10 ? 'low-stock' : ''}`}>25个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">AU</span>
                      <span className={`region-value ${parseInt('20') < 10 ? 'low-stock' : ''}`}>20个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">DE</span>
                      <span className={`region-value ${parseInt('15') < 10 ? 'low-stock' : ''}`}>15个</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="product-pricing">
                <div className="price-tiers">
                  <div className="price-title">价格信息</div>
                  {(() => {
                    const controllerPrices: RegionPrices = {
                      EU: { base: 180, tier1: 165, tier2: 150, vip: 140 },
                      NA: { base: 200, tier1: 180, tier2: 160, vip: 150 },
                      AU: { base: 250, tier1: 230, tier2: 210, vip: 190 },
                      CN: { base: 1800, tier1: 1650, tier2: 1500, vip: 1400 }
                    };
                    const prices = getRegionalPrice(controllerPrices);
                    return (
                      <>
                        <div className="base-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base.toLocaleString()}</span></span>
                          <span className="quantity-range">1-5个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1.toLocaleString()}</span></span>
                          <span className="quantity-range">6-20个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2.toLocaleString()}</span></span>
                          <span className="quantity-range">20+个</span>
                        </div>
                        {isVIP && (
                          <div className="vip-price">
                            <span>VIP价</span>
                            <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.vip.toLocaleString()}</span></span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <img
                src="/images/placeholders/placeholder.svg" 
                alt="主控制板" 
                className="product-image"
              />
              <div className="product-actions">
                <input
                  type="number"
                  min="1"
                  value={quantities.mainBoard} 
                  className="quantity-input"
                  onChange={(e) => handleQuantityChange('mainBoard', parseInt(e.target.value) || 1)} 
                />
                <button className="btn-add" onClick={() => addToCart('accessory', 'controller')}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 配件选择部分 - 第三级 */}
      <div id="accessory-level-3" className="accessory-level-3">
        <div className="section-title">
          配件选择 <span className="level-indicator">- 三级配件</span>
          <span id="level3-context-message" className="dynamic-note"></span>
        </div>

        <div className="product-list">
          {/* 热敏标签纸 */}
          <div className="product-item" data-product-id="paper">
            <div className="product-selector">
              <input 
                type="radio" 
                id="paper" 
                name="accessory-level-3" 
                className="accessory-radio" 
                onChange={() => handleAccessorySelection(3, 'paper', '热敏标签纸')}
              />
            </div>
            <div className="product-info">
              <div className="product-code">Thermal Paper</div>
              <div className="product-description">
                <div className="accessory-name">热敏标签纸卷（5卷装）</div>
                <div className="accessory-specs">
                  <span className="frequency-spec"><strong>频率:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>料号:</strong> BJT-TP-40x30-700-2024</span>
                  <span className="accessory-spec-item"><strong>电压:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>托盘尺寸:</strong> 45×35×20cm</span>
                  <span className="accessory-spec-item"><strong>一托数量:</strong> 50套</span>
                </div>
                <div className="more-info-section">
                  <a href="#specifications" className="specification-link">规格详情</a>
                  <span className="tooltip">
                    <a href="#more-info" className="more-info-link">更多信息</a>
                    <div className="tooltip-content">
                      <div className="tooltip-title">热敏标签纸详细信息</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span>48×38×25</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span>18.9×15.0×9.8</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span>2.8</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span>6.2</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 cm:</span>
                        <span>20</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 inch:</span>
                        <span>7.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 kg:</span>
                        <span>160</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 lbs:</span>
                        <span>352.7</span>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              {isSales && (
                <div className="product-inventory">
                  <div className="inventory-regions">
                    <div className="product-inventory-title">库存状态</div>
                    <div className="inventory-region">
                      <span className="region-label">EU</span>
                      <span className={`region-value ${parseInt('40') < 10 ? 'low-stock' : ''}`}>40个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">AU</span>
                      <span className={`region-value ${parseInt('35') < 10 ? 'low-stock' : ''}`}>35个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">DE</span>
                      <span className={`region-value ${parseInt('25') < 10 ? 'low-stock' : ''}`}>25个</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="product-pricing">
                <div className="price-tiers">
                  <div className="price-title">价格信息</div>
                  {(() => {
                    const paperPrices: RegionPrices = {
                      EU: { base: 32, tier1: 28, tier2: 25, vip: 22 },
                      NA: { base: 35, tier1: 30, tier2: 28, vip: 25 },
                      AU: { base: 45, tier1: 40, tier2: 36, vip: 32 },
                      CN: { base: 320, tier1: 280, tier2: 250, vip: 220 }
                    };
                    const prices = getRegionalPrice(paperPrices);
                    return (
                      <>
                        <div className="base-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base.toLocaleString()}</span></span>
                          <span className="quantity-range">1-10个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1.toLocaleString()}</span></span>
                          <span className="quantity-range">11-50个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2.toLocaleString()}</span></span>
                          <span className="quantity-range">50+个</span>
                        </div>
                        {isVIP && (
                          <div className="vip-price">
                            <span>VIP价</span>
                            <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.vip.toLocaleString()}</span></span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <img
                src="/images/placeholders/placeholder.svg" 
                alt="热敏标签纸" 
                className="product-image"
              />
              <div className="product-actions">
                <input
                  type="number"
                  min="1"
                  value={quantities.thermalPaper} 
                  className="quantity-input"
                  onChange={(e) => handleQuantityChange('thermalPaper', parseInt(e.target.value) || 1)} 
                />
                <button className="btn-add" onClick={() => addToCart('accessory', 'paper')}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
          
          {/* 色带 */}
          <div className="product-item" data-product-id="ribbon">
            <div className="product-selector">
              <input 
                type="radio" 
                id="ribbon" 
                name="accessory-level-3" 
                className="accessory-radio" 
                onChange={() => handleAccessorySelection(3, 'ribbon', '色带')}
              />
            </div>
            <div className="product-info">
              <div className="product-code">Thermal Ribbon</div>
              <div className="product-description">
                <div className="accessory-name">热转印色带（2卷装）</div>
                <div className="accessory-specs">
                  <span className="frequency-spec"><strong>频率:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>料号:</strong> BJT-TR-110-300-2024</span>
                  <span className="accessory-spec-item"><strong>电压:</strong> N/A</span>
                  <span className="accessory-spec-item"><strong>托盘尺寸:</strong> 35×25×15cm</span>
                  <span className="accessory-spec-item"><strong>一托数量:</strong> 100套</span>
                </div>
                <div className="more-info-section">
                  <a href="#specifications" className="specification-link">规格详情</a>
                  <span className="tooltip">
                    <a href="#more-info" className="more-info-link">更多信息</a>
                    <div className="tooltip-content">
                      <div className="tooltip-title">热转印色带详细信息</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 cm:</span>
                        <span>38×28×15</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">包装尺寸 inch:</span>
                        <span>15.0×11.0×5.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 kg:</span>
                        <span>1.5</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">单件净重 lbs:</span>
                        <span>3.3</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 cm:</span>
                        <span>15</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">打托高度 inch:</span>
                        <span>5.9</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 kg:</span>
                        <span>180</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">整托毛重 lbs:</span>
                        <span>396.8</span>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              {isSales && (
                <div className="product-inventory">
                  <div className="inventory-regions">
                    <div className="product-inventory-title">库存状态</div>
                    <div className="inventory-region">
                      <span className="region-label">EU</span>
                      <span className={`region-value ${parseInt('35') < 10 ? 'low-stock' : ''}`}>35个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">AU</span>
                      <span className={`region-value ${parseInt('30') < 10 ? 'low-stock' : ''}`}>30个</span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">DE</span>
                      <span className={`region-value ${parseInt('20') < 10 ? 'low-stock' : ''}`}>20个</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="product-pricing">
                <div className="price-tiers">
                  <div className="price-title">价格信息</div>
                  {(() => {
                    const ribbonPrices: RegionPrices = {
                      EU: { base: 28, tier1: 25, tier2: 22, vip: 20 },
                      NA: { base: 30, tier1: 28, tier2: 24, vip: 22 },
                      AU: { base: 40, tier1: 36, tier2: 32, vip: 28 },
                      CN: { base: 280, tier1: 250, tier2: 220, vip: 190 }
                    };
                    const prices = getRegionalPrice(ribbonPrices);
                    return (
                      <>
                        <div className="base-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.base.toLocaleString()}</span></span>
                          <span className="quantity-range">1-10个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier1.toLocaleString()}</span></span>
                          <span className="quantity-range">11-50个</span>
                        </div>
                        <div className="tier-price">
                          <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.tier2.toLocaleString()}</span></span>
                          <span className="quantity-range">50+个</span>
                        </div>
                        {isVIP && (
                          <div className="vip-price">
                            <span>VIP价</span>
                            <span><span className="price-currency">{prices.symbol}</span><span className="price-amount">{prices.vip.toLocaleString()}</span></span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <img
                src="/images/placeholders/placeholder.svg" 
                alt="色带" 
                className="product-image"
              />
              <div className="product-actions">
                <input
                  type="number"
                  min="1"
                  value={quantities.ribbon} 
                  className="quantity-input"
                  onChange={(e) => handleQuantityChange('ribbon', parseInt(e.target.value) || 1)} 
                />
                <button className="btn-add" onClick={() => addToCart('accessory', 'ribbon')}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachinesPage;