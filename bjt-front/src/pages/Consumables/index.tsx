import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Consumables.css';
import { productApi, cartApi } from '../../services/api';
import { mockProductApi, mockCartApi } from '../../services/mockApi';

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

// 模拟当前用户数据
const mockCurrentUser = {
  id: 'user1',
  username: 'testuser',
  role: 'customer', // 可选值: 'admin', 'sales', 'customer', 'partner'
  discount: 0.9, // 折扣率，仅对customer和partner生效
  name: '测试用户',
  email: 'test@example.com'
};

// 模拟产品数据，与mockup/4.html保持一致
const mockConsumables = [
  {
    id: '1',
    name: '标准气泡膜',
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
      { range: '1-10', price: 100 },
      { range: '11-100', price: 90 },
      { range: '> 100', price: 50 }
    ],
    inventory: { us: 1, au: 2, eu: 3 }
  },
  {
    id: '2',
    name: '缓冲气泡膜',
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
      { range: '1-10', price: 95 },
      { range: '11-100', price: 85 },
      { range: '> 100', price: 45 }
    ],
    inventory: { us: 2, au: 3, eu: 5 }
  },
  {
    id: '3',
    name: '防震气泡膜',
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
      { range: '1-10', price: 110 },
      { range: '11-100', price: 100 },
      { range: '> 100', price: 60 }
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
  // 状态定义
  const [consumables, setConsumables] = useState(mockConsumables);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  // 添加当前用户状态
  const [currentUser, setCurrentUser] = useState(mockCurrentUser);
  
  // 筛选条件状态
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('metric');
  const [selectedShape, setSelectedShape] = useState<string>('pillow');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  
  // 显示模型使用区域状态
  const [showModelUsage, setShowModelUsage] = useState<boolean>(false);
  
  // 显示形状尺寸示意图状态
  const [showShapeDimension, setShowShapeDimension] = useState<boolean>(true);

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
      case 'admin': return '管理员';
      case 'sales': return '销售人员';
      case 'customer': return '普通客户';
      case 'partner': return '合作伙伴';
      default: return '访客';
    }
  };

  // 根据用户类型和数量计算价格
  const calculatePrice = (price: number, quantity: number) => {
    let finalPrice = price;
    
    // 根据用户角色应用不同的价格策略
    if (currentUser.role === 'admin') {
      // 管理员看到成本价
      finalPrice = price * 0.7; // 假设成本是70%的售价
    } else if (currentUser.role === 'sales') {
      // 销售人员看到标准价格
      finalPrice = price;
    } else if (currentUser.role === 'customer' || currentUser.role === 'partner') {
      // 普通客户和合作伙伴看到折扣价
      finalPrice = price * (currentUser.discount || 1);
    }
    
    return finalPrice;
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
      
      // 应用用户折扣
      const finalPrice = calculatePrice(priceInfo.price, quantity);
      
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
      alert(`已添加 ${quantity} 件 ${item.name} 到购物车`);
      
      // 重置商品数量
      setQuantities(prev => ({
        ...prev,
        [itemId]: 1
      }));
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('添加到购物车失败，请稍后再试');
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
    setShowModelUsage(false);
  };

  // 应用筛选条件
  const handleApplyFilters = () => {
    // 在实际应用中，这里会根据筛选条件从API获取数据
    // 在当前模拟环境中，我们已经有了固定的mockConsumables数据
    console.log('应用筛选条件', {
      model: selectedModel,
      unit: selectedUnit,
      shape: selectedShape,
      material: selectedMaterial,
      thickness: selectedThickness,
      weight: selectedWeight,
      width: selectedWidth,
      length: selectedLength
    });
  };

  // 加载中状态显示
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载耗材数据...</p>
      </div>
    );
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="error-container">
        <h2>出错了</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <>
      <div className="consumables-page">
        <div className="breadcrumb">
          <Link to="/">首页</Link> &gt; <Link to="/products">产品中心</Link> &gt; <span>耗材选择</span>
        </div>
        
        <div className="top-bar">
          <div className="top-bar-content">
            <img src={infoIconPlaceholder} alt="Info" />
            <span>请根据您的需要，选择合适的耗材。用户可选不同材质和尺寸的气泡袋。</span>
          </div>
        </div>
        
        <div className="user-info-bar">
          <div className="container">
            <div className="user-role">
              <span>当前身份：</span>
              <span className="role-badge">{getRoleDisplayName(currentUser.role)}</span>
            </div>
            
            <div className="role-switcher">
              <button 
                className={`role-btn ${currentUser.role === 'customer' ? 'active' : ''}`} 
                onClick={() => setCurrentUser({...mockCurrentUser, role: 'customer'})}
              >
                普通客户
              </button>
              <button 
                className={`role-btn ${currentUser.role === 'partner' ? 'active' : ''}`}
                onClick={() => setCurrentUser({...mockCurrentUser, role: 'partner'})}
              >
                合作伙伴
              </button>
              <button 
                className={`role-btn ${currentUser.role === 'sales' ? 'active' : ''}`}
                onClick={() => setCurrentUser({...mockCurrentUser, role: 'sales'})}
              >
                销售人员
              </button>
            </div>
          </div>
        </div>
        
        <div className="section-title">
          <div className="title-text">
            <h2>耗材选择</h2>
            <p>根据您的应用场景选择特定的耗材配件</p>
          </div>
        </div>
        
        <div className="filter-container">
          <div className="filter-section">
            <div className="filter-group">
              <label>适用机型：</label>
              <select value={selectedModel} onChange={handleModelChange}>
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              <button className="btn-help" onClick={() => setShowModelUsage(!showModelUsage)}>?</button>
            </div>
            
            <div className="filter-group">
              <label>单位：</label>
              <div className="unit-selector">
                <button 
                  className={`unit-btn ${selectedUnit === 'metric' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('metric')}
                >
                  公制
                </button>
                <button 
                  className={`unit-btn ${selectedUnit === 'imperial' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('imperial')}
                >
                  英制
                </button>
              </div>
            </div>
            
            {showModelUsage && (
              <div className="model-usage-popup">
                <div className="popup-header">
                  <h3>机型适用关系说明</h3>
                  <button className="close-popup" onClick={() => setShowModelUsage(false)}>×</button>
                </div>
                <div className="popup-content">
                  <p>LA-E4S: 仅支持标准规格的气泡膜材料</p>
                  <p>MEX-10-20: 支持全系列材料，但不同规格有特殊要求</p>
                  <p>LP-V1: 支持所有材料和规格</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="filter-section">
            <h3>形状</h3>
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
                显示尺寸示意图
              </label>
            </div>
            
            {showShapeDimension && (
              <div className="shape-dimension">
                <img src={dimensionGuidePlaceholder} alt="尺寸图示" />
              </div>
            )}
          </div>
          
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>材料：</label>
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
                <label>{selectedMaterial === 'paper_pe' ? '克重：' : '厚度：'}</label>
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
                <label>宽度：</label>
                <select value={selectedWidth} onChange={handleWidthChange}>
                  {widths.map(width => (
                    <option key={width.id} value={width.id}>{width.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>长度：</label>
                <select value={selectedLength} onChange={handleLengthChange}>
                  {lengths.map(length => (
                    <option key={length.id} value={length.id}>{length.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="btn-reset" onClick={handleResetFilters}>重置</button>
            <button className="btn-apply" onClick={handleApplyFilters}>应用筛选</button>
          </div>
        </div>
        
        <div className="products-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>图片</th>
                <th>产品代码</th>
                <th>规格</th>
                <th>价格</th>
                {(currentUser.role === 'sales' || currentUser.role === 'admin') && <th>库存</th>}
                <th>操作</th>
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
                        <div className="specs-label">材料:</div>
                        <div className="specs-value">{item.specs.material}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">形状:</div>
                        <div className="specs-value">{item.specs.shape}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">厚度:</div>
                        <div className="specs-value">{item.specs.thickness}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">宽度:</div>
                        <div className="specs-value">{item.specs.width}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">长度:</div>
                        <div className="specs-value">{item.specs.length}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">卷长:</div>
                        <div className="specs-value">{item.specs.rollLength}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">兼容性:</div>
                        <div className="specs-value">{item.specs.compatibility}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.pricing.map((price, idx) => (
                      <div key={idx} className="price-tier">
                        <span className="price-range">{price.range}:</span>
                        <span className="price-value">
                          ¥{calculatePrice(price.price, quantities[item.id] || 1).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </td>
                  {/* 只有销售人员和管理员可以看到库存 */}
                  {(currentUser.role === 'sales' || currentUser.role === 'admin') && (
                    <td>
                      us:{item.inventory.us}, au:{item.inventory.au}, eu:{item.inventory.eu}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>X</span>
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
          
          {/* 价格说明（仅针对普通客户和合作伙伴） */}
          {(currentUser.role === 'customer' || currentUser.role === 'partner') && (
            <div className="price-disclaimer">
              * 显示的价格已包含您的会员折扣，最终价格可能会根据订单总量和其他因素调整。
            </div>
          )}
        </div>
      </div>
    </>
  );
} 