import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Consumables.css';
import { productApi, cartApi } from '../../services/api';
import { mockProductApi, mockCartApi } from '../../services/mockApi';

// Define interface for regional prices
interface RegionPrices {
  eu: number;
  na: number;
  au: number;
  cn: number;
}

// 替换为本地占位图片路径
const placeholderImage = '/images/placeholders/placeholder-80x80.svg';
const shapePlaceholderImage = '/images/placeholders/placeholder-80x60.svg';
const dimensionGuidePlaceholder = '/images/placeholders/placeholder-480x220.svg';
const infoIconPlaceholder = '/images/placeholders/placeholder-24x24.svg';

// 使用环境变量或配置决定是否使用模拟API
const USE_MOCK_API = true; // 设置为true强制使用模拟API进行开发

// 根据配置选择使用真实API还是模拟API
const apiService = {
  product: USE_MOCK_API ? mockProductApi : productApi,
  cart: USE_MOCK_API ? mockCartApi : cartApi
};

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

// 模拟产品数据，与mockup/4.html保持一致
const mockConsumables = [
  {
    id: '1',
    name: 'Standard Bubble Film',
    code: 'PL-001',
    model: 'MEX-10-20-10',
    image: placeholderImage,
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.05mm',
      width: '200mm',
      length: '300mm',
      rollLength: '500m',
      compatibility: 'E5P/E4S'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 100,
        regionalPrices: { eu: 120, na: 100, au: 130, cn: 650 } 
      },
      { 
        range: '11-100', 
        price: 90,
        regionalPrices: { eu: 100, na: 90, au: 110, cn: 580 } 
      },
      { 
        range: '> 100', 
        price: 50,
        regionalPrices: { eu: 60, na: 50, au: 65, cn: 320 } 
      }
    ],
    inventory: { us: 1, au: 2, eu: 3 }
  },
  {
    id: '2',
    name: 'Cushioning Bubble Film',
    code: 'PL-002',
    model: 'MEX-10-20-13',
    image: placeholderImage,
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.08mm',
      width: '300mm',
      length: '400mm',
      rollLength: '600m',
      compatibility: 'E5P/E4S'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 95,
        regionalPrices: { eu: 115, na: 95, au: 125, cn: 620 } 
      },
      { 
        range: '11-100', 
        price: 85,
        regionalPrices: { eu: 95, na: 85, au: 105, cn: 550 } 
      },
      { 
        range: '> 100', 
        price: 45,
        regionalPrices: { eu: 55, na: 45, au: 60, cn: 290 } 
      }
    ],
    inventory: { us: 2, au: 3, eu: 5 }
  },
  {
    id: '3',
    name: 'Anti-shock Bubble Film',
    code: 'PL-003',
    model: 'MEX-10-20-15',
    image: placeholderImage,
    specs: {
      material: 'HDPE',
      shape: 'Pillow',
      thickness: '0.10mm',
      width: '300mm',
      length: '450mm',
      rollLength: '450m',
      compatibility: 'E5P/E4S'
    },
    pricing: [
      { 
        range: '1-10', 
        price: 110,
        regionalPrices: { eu: 130, na: 110, au: 140, cn: 700 } 
      },
      { 
        range: '11-100', 
        price: 100,
        regionalPrices: { eu: 120, na: 100, au: 130, cn: 650 } 
      },
      { 
        range: '> 100', 
        price: 60,
        regionalPrices: { eu: 70, na: 60, au: 75, cn: 390 } 
      }
    ],
    inventory: { us: 3, au: 2, eu: 4 }
  }
];

// 形状选项，与mockup/4.html中保持一致
const shapes = [
  { id: 'pillow', name: 'Pillow', image: shapePlaceholderImage },
  { id: 'bubble', name: 'Bubble', image: shapePlaceholderImage },
  { id: 'tube', name: 'Tube', image: shapePlaceholderImage }
];

// 材料选项，与mockup/4.html中保持一致
const materials = [
  { id: 'hdpe', name: 'HDPE' },
  { id: 'ldpe', name: 'LDPE' },
  { id: 'nylon', name: 'Nylon' },
  { id: 'paper_pe', name: 'PAPER+PE' }
];

// 模型选项，与mockup/4.html中保持一致
const models = [
  { id: 'all', name: 'ALL' },
  { id: 'model1', name: 'LA-E4S' },
  { id: 'model2', name: 'MEX-10-20' },
  { id: 'model3', name: 'LP-V1' }
];

// 厚度选项，与mockup/4.html中保持一致
const thicknesses = [
  { id: 'all', name: 'ALL' },
  { id: 'thickness1', name: '0.05mm' },
  { id: 'thickness2', name: '0.08mm' },
  { id: 'thickness3', name: '0.10mm' }
];

// 重量选项，当材料为PAPER+PE时使用
const weights = [
  { id: 'all', name: 'ALL' },
  { id: 'weight1', name: '50g/m²' },
  { id: 'weight2', name: '75g/m²' },
  { id: 'weight3', name: '100g/m²' }
];

// 宽度选项，与mockup/4.html中保持一致
const widths = [
  { id: 'all', name: 'ALL' },
  { id: 'width1', name: '200mm' },
  { id: 'width2', name: '250mm' },
  { id: 'width3', name: '300mm' }
];

// 长度选项，与mockup/4.html中保持一致
const lengths = [
  { id: 'all', name: 'ALL' },
  { id: 'length1', name: '300mm' },
  { id: 'length2', name: '350mm' },
  { id: 'length3', name: '400mm' }
];

export default function ConsumablesPage() {
  const navigate = useNavigate();
  // 状态定义
  const [consumables, setConsumables] = useState(mockConsumables);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    username: '',
    role: 'customer',
    discount: 0.9,
    name: '',
    email: '',
    region: 'cn'
  });
  
  // 筛选条件状态
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('metric');
  const [selectedShape, setSelectedShape] = useState<string>('pillow');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  const [selectedPartType, setSelectedPartType] = useState<string>('consumables');
  
  // 显示模型使用区域状态
  const [showModelUsage, setShowModelUsage] = useState<boolean>(false);
  
  // 显示形状尺寸示意图状态
  const [showShapeDimension, setShowShapeDimension] = useState<boolean>(true);

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

  // Get regional price based on user role and region
  const getRegionalPrice = (priceInfo: any) => {
    if (!priceInfo.regionalPrices) return priceInfo.price;
    
    const region = currentUser.region;
    let price = priceInfo.regionalPrices[region] || priceInfo.price;
    
    // Apply role-based pricing
    if (currentUser.role === 'admin') {
      // Admin sees cost price (70% of standard price)
      return price * 0.7;
    } else if (currentUser.role === 'sales') {
      // Sales personnel see standard price
      return price;
    } else if (currentUser.role === 'customer' || currentUser.role === 'partner') {
      // Check if VIP customer
      if (isVipUser(currentUser.email)) {
        return price * 0.8; // VIP 享受20%折扣
      }
      // 普通客户或合作伙伴看到折扣价
      return price * (currentUser.discount || 1);
    }
    
    return price;
  };

  // 初始化数量状态
  useEffect(() => {
    const quantitiesInit: {[key: string]: number} = {};
    consumables.forEach((item) => {
      quantitiesInit[item.id] = 1;
    });
    setQuantities(quantitiesInit);
  }, [consumables]);

  // 加载购物车数据
  useEffect(() => {
    const fetchCart = async () => {
      try {
        // 直接从localStorage获取购物车数据
        const cartData = localStorage.getItem('bjt_cart');
        if (cartData) {
          setCartItems(JSON.parse(cartData));
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        setCartItems([]);
      }
    };

    fetchCart();
  }, []);

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

  // 更新数量
  const handleQuantityChange = (itemId: string, value: string) => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 1) return;
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: newValue
    }));
  };

  // 添加到购物车
  const addToCart = async (itemId: string) => {
    try {
      const item = consumables.find(c => c.id === itemId);
      if (!item) return;
      
      const quantity = quantities[itemId] || 1;
      
      // 获取最终价格（考虑用户角色和数量）
      const priceInfo = item.pricing.find(p => {
        const range = p.range.replace(/\s+/g, '');
        if (range.includes('-')) {
          const [min, max] = range.split('-').map(Number);
          return quantity >= min && quantity <= max;
        } else if (range.startsWith('>')) {
          const min = parseInt(range.substring(1), 10);
          return quantity > min;
        }
        return false;
      }) || item.pricing[0];
      
      // 使用区域价格计算最终价格
      const finalPrice = getRegionalPrice(priceInfo);
      
      // 添加购物车项到本地存储
      let cartItems = [];
      try {
        // 尝试获取现有购物车数据
        const cartData = localStorage.getItem('bjt_cart');
        if (cartData) {
          cartItems = JSON.parse(cartData);
        }
      } catch (err) {
        console.error('Error parsing cart data:', err);
        cartItems = [];
      }

      // 检查商品是否已在购物车中
      const existingItemIndex = cartItems.findIndex((cartItem: any) => cartItem.id === itemId);

      if (existingItemIndex !== -1) {
        // 更新已有商品的数量
        cartItems[existingItemIndex].quantity += quantity;
        // 也要更新价格（考虑数量阶梯）
        cartItems[existingItemIndex].price = finalPrice;
      } else {
        // 添加新商品到购物车
        cartItems.push({
          id: itemId,
          name: item.name,
          price: finalPrice,
          quantity: quantity,
          specs: {
            model: item.model,
            partNumber: item.code,
            productName: item.name
          },
          type: 'accessory',
          image: item.image
        });
      }

      // 保存到本地存储
      localStorage.setItem('bjt_cart', JSON.stringify(cartItems));
      
      // 更新购物车显示
      setCartItems(cartItems);
      
      // 显示添加成功的通知
      alert(`Added ${quantity} ${item.name} to cart`);
      
      // 重置商品数量
      setQuantities(prev => ({
        ...prev,
        [itemId]: 1
      }));
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart. Please try again later.');
    }
  };

  // 切换显示购物车模态框
  const toggleCartModal = () => {
    setShowCartModal(prev => !prev);
  };

  // 计算购物车中的物品总数
  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // 处理模型变更
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
    // 根据mockup/4.html，选择模型后显示使用区域
    setShowModelUsage(event.target.value !== 'all');
  };

  // 处理单位变更
  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
  };

  // 处理形状变更
  const handleShapeChange = (value: string) => {
    setSelectedShape(value);
  };

  // 处理材料变更
  const handleMaterialChange = (value: string) => {
    setSelectedMaterial(value);
  };

  // 处理厚度变更
  const handleThicknessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedThickness(event.target.value);
  };

  // 处理重量变更
  const handleWeightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeight(event.target.value);
  };

  // 处理宽度变更
  const handleWidthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWidth(event.target.value);
  };

  // 处理长度变更
  const handleLengthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLength(event.target.value);
  };

  // 处理部件类型变更
  const handlePartTypeChange = (type: string) => {
    setSelectedPartType(type);
  };

  // 重置筛选条件
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedUnit('metric');
    setSelectedShape('pillow');
    setSelectedMaterial('hdpe');
    setSelectedThickness('all');
    setSelectedWeight('all');
    setSelectedWidth('all');
    setSelectedLength('all');
    setSelectedPartType('consumables');
    setShowModelUsage(false);
  };

  // 应用筛选条件
  const handleApplyFilters = () => {
    // 在实际应用中，这里会根据筛选条件从API获取数据
    // 在当前模拟环境中，我们已经有了固定的mockConsumables数据
    console.log('Applied filters', {
      model: selectedModel,
      unit: selectedUnit,
      shape: selectedShape,
      material: selectedMaterial,
      thickness: selectedThickness,
      weight: selectedWeight,
      width: selectedWidth,
      length: selectedLength,
      partType: selectedPartType
    });
  };

  // 加载中状态显示
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading consumables data...</p>
      </div>
    );
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="consumables-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &gt; <Link to="/products">Products</Link> &gt; <span>Consumables</span>
        </div>
        
        <div className="top-bar">
          <div className="top-bar-content">
            <img src={infoIconPlaceholder} alt="Info" />
            <span>Please select the appropriate consumables for your needs. You can choose different materials and sizes of bubble bags.</span>
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
        
        <div className="section-title">
          <div className="title-text">
            <h2>Consumables Selection</h2>
            <p>Select specific consumable accessories based on your application scenario</p>
          </div>
        </div>
        
        <div className="filter-container">
          <div className="filter-section">
            <div className="filter-group">
              <label>Machine Model:</label>
              <select value={selectedModel} onChange={handleModelChange}>
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              <button className="btn-help" onClick={() => setShowModelUsage(!showModelUsage)}>?</button>
            </div>
            
            <div className="filter-group">
              <label>Units:</label>
              <div className="unit-selector">
                <button 
                  className={`unit-btn ${selectedUnit === 'metric' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('metric')}
                >
                  Metric
                </button>
                <button 
                  className={`unit-btn ${selectedUnit === 'imperial' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('imperial')}
                >
                  Imperial
                </button>
              </div>
            </div>
            
            {showModelUsage && (
              <div className="model-usage-popup">
                <div className="popup-header">
                  <h3>Machine Compatibility Information</h3>
                  <button className="close-popup" onClick={() => setShowModelUsage(false)}>×</button>
                </div>
                <div className="popup-content">
                  <p>LA-E4S: Only supports standard bubble film materials</p>
                  <p>MEX-10-20: Supports all series materials with specific requirements for different specifications</p>
                  <p>LP-V1: Supports all materials and specifications</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="filter-section">
            <h3>Shape</h3>
            <div className="shape-selector">
              {shapes.map(shape => (
                <div key={shape.id} className="shape-option">
                  <input 
                    type="radio"
                    id={`shape-${shape.id}`}
                    name="shape"
                    checked={selectedShape === shape.id}
                    onChange={() => handleShapeChange(shape.id)}
                  />
                  <label htmlFor={`shape-${shape.id}`} className="shape-label">
                    <img src={shape.image} alt={shape.name} />
                    <span>{shape.name}</span>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="shape-dimension-toggle">
              <label>
                <input 
                  type="checkbox" 
                  checked={showShapeDimension} 
                  onChange={() => setShowShapeDimension(!showShapeDimension)}
                />
                Show Dimension Guide
              </label>
            </div>
            
            {showShapeDimension && (
              <div className="shape-dimension">
                <img src={dimensionGuidePlaceholder} alt="Dimension Guide" />
              </div>
            )}
          </div>
          
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>Material:</label>
                <div className="material-selector">
                  {materials.map(material => (
                    <button 
                      key={material.id}
                      className={`material-btn ${selectedMaterial === material.id ? 'active' : ''}`}
                      onClick={() => handleMaterialChange(material.id)}
                    >
                      {material.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>{selectedMaterial === 'paper_pe' ? 'Weight:' : 'Thickness:'}</label>
                <select 
                  value={selectedMaterial === 'paper_pe' ? selectedWeight : selectedThickness}
                  onChange={selectedMaterial === 'paper_pe' ? handleWeightChange : handleThicknessChange}
                >
                  {(selectedMaterial === 'paper_pe' ? weights : thicknesses).map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Width:</label>
                <select value={selectedWidth} onChange={handleWidthChange}>
                  {widths.map(width => (
                    <option key={width.id} value={width.id}>{width.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Length:</label>
                <select value={selectedLength} onChange={handleLengthChange}>
                  {lengths.map(length => (
                    <option key={length.id} value={length.id}>{length.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="btn-reset" onClick={handleResetFilters}>Reset</button>
            <button className="btn-apply" onClick={handleApplyFilters}>Apply Filters</button>
          </div>
          
          <div className="filter-section">
            <h3>Part Type</h3>
            <div className="part-type-buttons">
              <button
                className={`part-type-button ${selectedPartType === 'consumables' ? 'active' : ''}`}
                onClick={() => handlePartTypeChange('consumables')}
              >
                Consumables
              </button>
              <button
                className={`part-type-button ${selectedPartType === 'non-consumables' ? 'active' : ''}`}
                onClick={() => handlePartTypeChange('non-consumables')}
              >
                Non-Consumables
              </button>
            </div>
          </div>
        </div>
        
        <div className="products-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Code</th>
                <th>Specifications</th>
                <th>Price</th>
                {(currentUser.role === 'sales' || currentUser.role === 'admin') && <th>Inventory</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumables.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img src={item.image || placeholderImage} alt={item.name} className="product-image" />
                  </td>
                  <td>
                    <div className="product-code">{item.code}</div>
                    <div className="product-name">{item.name}</div>
                    <div className="product-model">{item.model}</div>
                  </td>
                  <td>
                    <div className="specs-table">
                      <div className="specs-row">
                        <div className="specs-label">Material:</div>
                        <div className="specs-value">{item.specs.material}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Shape:</div>
                        <div className="specs-value">{item.specs.shape}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Thickness:</div>
                        <div className="specs-value">{item.specs.thickness}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Width:</div>
                        <div className="specs-value">{item.specs.width}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Length:</div>
                        <div className="specs-value">{item.specs.length}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Roll Length:</div>
                        <div className="specs-value">{item.specs.rollLength}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Compatible:</div>
                        <div className="specs-value">{item.specs.compatibility}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.pricing.map((price, idx) => (
                      <div key={idx} className="price-tier">
                        <span className="price-range">{price.range}:</span>
                        <span className="price-value">
                          {getCurrencySymbol()}{getRegionalPrice(price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </td>
                  {/* 只有销售人员和管理员可以看到库存 */}
                  {(currentUser.role === 'sales' || currentUser.role === 'admin') && (
                    <td>
                      US:{item.inventory.us}, AU:{item.inventory.au}, EU:{item.inventory.eu}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Qty:</span>
                      <input 
                        type="number" 
                        className="quantity-input" 
                        value={quantities[item.id] || 1} 
                        min="1"
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      />
                      <button 
                        className="btn-add"
                        onClick={() => addToCart(item.id)}
                      >
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* 价格说明（根据不同用户角色显示不同内容） */}
          {currentUser.role === 'customer' && isVipUser(currentUser.email) && (
            <div className="price-disclaimer">
              * VIP Member Pricing: Displayed prices include your special 20% VIP discount and are shown in {getCurrencySymbol()} for your region ({currentUser.region.toUpperCase()}). 
              Final prices may be adjusted based on total order quantity.
            </div>
          )}
          {currentUser.role === 'customer' && !isVipUser(currentUser.email) && (
            <div className="price-disclaimer">
              * Displayed prices include your 10% member discount and are shown in {getCurrencySymbol()} for your region ({currentUser.region.toUpperCase()}). 
              Final prices may be adjusted based on total order quantity and other factors.
            </div>
          )}
          {currentUser.role === 'partner' && (
            <div className="price-disclaimer">
              * Partner Pricing: Displayed prices include your 15% partner discount and are shown in {getCurrencySymbol()} for your region ({currentUser.region.toUpperCase()}). 
              Final prices may be adjusted based on total order quantity.
            </div>
          )}
          {currentUser.role === 'sales' && (
            <div className="price-disclaimer">
              * Prices are shown in {getCurrencySymbol()} for region {currentUser.region.toUpperCase()}. 
              Customer prices will be calculated with applicable discounts. VIP customers receive 20% discount.
            </div>
          )}
          {currentUser.role === 'admin' && (
            <div className="price-disclaimer">
              * Admin view: Displaying cost prices in {getCurrencySymbol()} for region {currentUser.region.toUpperCase()}.
            </div>
          )}
        </div>
      </div>
    </>
  );
} 