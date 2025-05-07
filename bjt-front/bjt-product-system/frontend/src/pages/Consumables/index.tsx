import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, message, Button, Select, InputNumber, Tabs, Tag, Pagination } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useCart, PriceTier } from '../../contexts/CartContext';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import consumablesService, { 
  ConsumableProduct, 
  ConsumableFilters,
  consumableOptions
} from '../../services/consumablesService';
import { DEFAULT_REGION } from '../../config/env';
import { REGIONS, getCurrencySymbol } from '../../config/constants';
import { ASSETS } from '../../config/appConfig';
import './Consumables.css';

const { Option } = Select;

// Define interface for regional prices
interface RegionPrices {
  eu: number;
  na: number;
  au: number;
  cn: number;
}

// 替换为ASSETS配置中的占位图片路径
const placeholderImage = ASSETS.getUrl('/images/placeholders/placeholder-80x80.svg');
const shapePlaceholderImage = ASSETS.getUrl('/images/placeholders/placeholder-80x60.svg');
const dimensionGuidePlaceholder = ASSETS.getUrl('/images/placeholders/placeholder-480x220.svg');
const infoIconPlaceholder = ASSETS.getUrl('/images/icons/info-icon.svg');

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

const ConsumablesPage: React.FC = () => {
  const { t } = useTranslation('consumables');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  // 状态定义
  const [consumables, setConsumables] = useState<ConsumableProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // 筛选条件状态
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('metric');
  const [selectedShape, setSelectedShape] = useState<string>('pillow');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  const [showModelUsage, setShowModelUsage] = useState<boolean>(false);
  
  // 修改tooltip状态管理
  const [showSpecTooltip, setShowSpecTooltip] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [activeItem, setActiveItem] = useState<ConsumableProduct | null>(null);
  const [tooltipHovered, setTooltipHovered] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 获取用户区域
  const userRegion = user?.region || DEFAULT_REGION;

  // 获取耗材数据
  useEffect(() => {
    const fetchConsumables = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 构建筛选参数
        const filters: ConsumableFilters = {
          model: selectedModel,
          shape: selectedShape,
          material: selectedMaterial,
          thickness: selectedThickness === 'all' ? undefined : selectedThickness,
          weight: selectedWeight === 'all' ? undefined : selectedWeight,
          width: selectedWidth === 'all' ? undefined : selectedWidth,
          length: selectedLength === 'all' ? undefined : selectedLength,
          page: currentPage,
          page_size: 10,
          region: userRegion,
          lang: navigator.language.startsWith('zh') ? 'zh' : 'en'
        };
        
        const response = await consumablesService.getConsumables(filters);
        
        if (response.success) {
          setConsumables(response.data.items);
          setTotalItems(response.data.total);
          setTotalPages(response.data.total_pages);
          
          // 初始化数量状态
          const initialQuantities: Record<string, number> = {};
          response.data.items.forEach(item => {
            initialQuantities[item.id] = 1;
          });
          setQuantities(initialQuantities);
        } else {
          setError(t('error.failedToLoad'));
        }
      } catch (err) {
        console.error('Failed to fetch consumables:', err);
        setError(t('error.systemError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsumables();
  }, [selectedModel, selectedShape, selectedMaterial, selectedThickness, 
      selectedWeight, selectedWidth, selectedLength, currentPage, userRegion, t]);
  
  // 获取购物车数据
  useEffect(() => {
    const fetchCart = async () => {
      try {
        // 这里应该使用购物车上下文或API获取购物车数据
        // 暂时不实现
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    };
    
    fetchCart();
  }, []);
  
  // 获取货币符号
  const getCurrencySymbolByRegion = (region: string = userRegion): string => {
    return REGIONS[region]?.currencySymbol || REGIONS.CN.currencySymbol;
  };
  
  // 获取区域价格
  const getRegionalPrice = (product: ConsumableProduct, quantity: number = 1): number => {
    // 找到适用的价格区间
    const pricing = product.pricing.find(p => {
      if (p.range.includes('-')) {
        const [min, max] = p.range.split('-').map(n => parseInt(n));
        return quantity >= min && quantity <= max;
      } else if (p.range.includes('>')) {
        const min = parseInt(p.range.replace('>', '').trim());
        return quantity > min;
      } else {
        return parseInt(p.range) === quantity;
      }
    });
    
    if (!pricing) return 0;
    
    // 获取适用区域的价格
    const region = userRegion.toLowerCase();
    return pricing.regionalPrices[region as keyof typeof pricing.regionalPrices] || pricing.price;
  };
  
  // 处理数量变更
  const handleQuantityChange = (itemId: string, value: number) => {
    if (value < 1) return;
    setQuantities(prev => ({
      ...prev,
      [itemId]: value
    }));
  };
  
  // 添加到购物车
  const addToCart = async (itemId: string) => {
    try {
      const product = consumables.find(p => p.id === itemId);
      if (!product) return;
      
      const quantity = quantities[itemId] || 1;
      
      // 创建价格层级数据
      const priceTiers: PriceTier[] = product.pricing.map(tier => {
        // 解析价格范围
        let min = 1;
        let max: number | null = null;
        
        if (tier.range.includes('-')) {
          const parts = tier.range.split('-').map(part => parseInt(part.trim()));
          min = parts[0];
          max = parts[1];
        } else if (tier.range.includes('>')) {
          min = parseInt(tier.range.replace('>', '').trim());
          max = null;
        } else {
          min = parseInt(tier.range);
          max = min;
        }
        
        return {
          min,
          max,
          price: tier.regionalPrices[userRegion.toLowerCase() as keyof RegionPrices] || tier.price
        };
      });
      
      // 添加到购物车上下文
      if (addItem) {
        addItem({
          id: product.id,
          code: product.code,
          name: product.name,
          price: getRegionalPrice(product, quantity),
          quantity: quantity,
          specs: {
            model: product.model,
            productName: product.name,
          },
          partNumber: product.code,
          category: 'consumables',
          productId: parseInt(product.id),
          selected: true,
          image: product.image_url,
          priceTiers: priceTiers
        });
      }
      
      message.success(t('cart.added'));
    } catch (err) {
      console.error('Failed to add to cart:', err);
      message.error(t('error.systemError'));
    }
  };
  
  // 切换购物车模态框
  const toggleCartModal = () => {
    setShowCartModal(!showCartModal);
  };
  
  // 处理型号变更
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };
  
  // 处理单位变更
  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
  };
  
  // 处理形状变更
  const handleShapeChange = (value: string) => {
    setSelectedShape(value);
  };
  
  // 处理材质变更
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
  
  // 重置筛选
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedUnit('metric');
    setSelectedShape('pillow');
    setSelectedMaterial('hdpe');
    setSelectedThickness('all');
    setSelectedWeight('all');
    setSelectedWidth('all');
    setSelectedLength('all');
    
    // 重置后自动应用筛选
    setCurrentPage(1);
  };
  
  // 应用筛选
  const handleApplyFilters = () => {
    // 重置页码并触发数据加载
    setCurrentPage(1);
  };
  
  // 处理规格点击
  const handleSpecClick = (e: React.MouseEvent, item: ConsumableProduct) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    });
    
    setActiveItem(item);
    setShowSpecTooltip(true);
  };
  
  // 鼠标进入提示框
  const handleTooltipMouseEnter = () => {
    setTooltipHovered(true);
  };
  
  // 鼠标离开提示框
  const handleTooltipMouseLeave = () => {
    setTooltipHovered(false);
    setTimeout(() => {
      if (!tooltipHovered) closeTooltip();
    }, 300);
  };
  
  // 关闭提示框
  const closeTooltip = () => {
    setShowSpecTooltip(false);
    setActiveItem(null);
    setTooltipHovered(false);
  };
  
  // 处理点击和键盘事件
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSpecTooltip && tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        closeTooltip();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSpecTooltip) {
        closeTooltip();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSpecTooltip]);
  
  // 加载中状态显示
  if (loading) {
    return <Loading tip={t('loading', 'Loading data...')} fullPage={true} />;
  }
  
  // 错误状态显示
  if (error) {
    return (
      <ErrorMessage
        message={t('error.title', 'Error')}
        description={error}
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // 获取筛选选项
  const { shapes, materials, models, thicknesses, weights, widths, lengths, modelExplodedViews } = consumableOptions;
  
  return (
    <div className="consumables-page">
      <div className="container">
        <div className="section-title">
          <div className="title-text">
            <h2>{t('title', 'Consumable Products')}</h2>
            <p>{t('subtitle', 'BJT Bubble Films, Cushioning Bags and Other Products')}</p>
          </div>
        </div>
        
        <div className="filter-container">
          <div className="filter-section">
            <div className="filter-group">
              <label>{t('filter.machine', 'Machine Model')}:</label>
              <select value={selectedModel} onChange={handleModelChange}>
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              <button className="btn-help" onClick={() => setShowModelUsage(!showModelUsage)}>?</button>
            </div>
            
            <div className="filter-group">
              <label>{t('filter.units')}:</label>
              <div className="unit-selector">
                <button 
                  className={`unit-btn ${selectedUnit === 'metric' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('metric')}
                >
                  {t('units.metric', 'Metric')}
                </button>
                <button 
                  className={`unit-btn ${selectedUnit === 'imperial' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('imperial')}
                >
                  {t('units.imperial', 'Imperial')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="filter-section">
            <h3>{t('filter.shape', 'Shape')}</h3>
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
                    <img src={shape.image_url || shapePlaceholderImage} alt={shape.name} />
                    <span>{shape.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>{t('filter.material', 'Material')}:</label>
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
            
            <div className="dimensions-container">
              <div className="dimensions-filters">
                <div className="filter-group vertical">
                  <label>{selectedMaterial === 'paper_pe' ? t('filter.weight', 'Weight') : t('filter.thickness', 'Thickness')}:</label>
                  <select 
                    value={selectedMaterial === 'paper_pe' ? selectedWeight : selectedThickness}
                    onChange={selectedMaterial === 'paper_pe' ? handleWeightChange : handleThicknessChange}
                  >
                    {(selectedMaterial === 'paper_pe' ? weights : thicknesses).map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group vertical">
                  <label>{t('filter.width', 'Width')}:</label>
                  <select value={selectedWidth} onChange={handleWidthChange}>
                    {widths.map(width => (
                      <option key={width.id} value={width.id}>{width.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group vertical">
                  <label>{t('filter.length', 'Length')}:</label>
                  <select value={selectedLength} onChange={handleLengthChange}>
                    {lengths.map(length => (
                      <option key={length.id} value={length.id}>{length.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="dimension-image">
                <img 
                  src={selectedModel && modelExplodedViews[selectedModel as keyof typeof modelExplodedViews] 
                      ? modelExplodedViews[selectedModel as keyof typeof modelExplodedViews] 
                      : dimensionGuidePlaceholder} 
                  alt={t('filter.dimensions', 'Product Dimensions')} 
                />
              </div>
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="btn-reset" onClick={handleResetFilters}>{t('button.reset', 'Reset')}</button>
            <button className="btn-apply" onClick={handleApplyFilters}>{t('button.apply', 'Apply Filters')}</button>
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
                {(user?.role === 'sales' || user?.role === 'admin') && <th>Inventory</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumables.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img src={item.image_url || placeholderImage} alt={item.name} className="product-image" />
                  </td>
                  <td>
                    <div className="product-code">{item.code}</div>
                    <div className="product-name">{item.name}</div>
                    <div className="product-model">{item.model}</div>
                  </td>
                  <td>
                    <div 
                      className="specs-table" 
                      onClick={(e) => handleSpecClick(e, item)}
                    >
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
                        <div className="specs-value">{item.specs.thickness || 'N/A'}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Width:</div>
                        <div className="specs-value">{item.specs.width}</div>
                      </div>
                      <div className="specs-row">
                        <div className="specs-label">Length:</div>
                        <div className="specs-value">{item.specs.length}</div>
                      </div>
                      {item.specs.rollLength && (
                        <div className="specs-row">
                          <div className="specs-label">Roll Length:</div>
                          <div className="specs-value">{item.specs.rollLength}</div>
                        </div>
                      )}
                      <div className="specs-row">
                        <div className="specs-label">Compatible:</div>
                        <div className="specs-value">{String(item.specs.compatibility)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.pricing.map((price, idx) => (
                      <div key={idx} className="price-tier">
                        <span className="price-range">{price.range}:</span>
                        <span className="price-value">
                          {getCurrencySymbolByRegion()}{getRegionalPrice(item, parseInt(price.range.replace(/[^0-9]/g, '') || '1')).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </td>
                  {(user?.role === 'sales' || user?.role === 'admin') && (
                    <td>
                      {Object.entries(item.inventory).map(([region, count]) => (
                        <div key={region}>{region.toUpperCase()}: {count}</div>
                      ))}
                    </td>
                  )}
                  <td>
                    <div className="product-actions">
                      <InputNumber
                        min={1}
                        value={quantities[item.id] || 1}
                        onChange={(value) => handleQuantityChange(item.id, Number(value || 1))}
                        className="quantity-input"
                      />
                      <Button 
                        type="primary"
                        onClick={() => addToCart(item.id)}
                        className="btn-add"
                      >
                        Add
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* 移动设备卡片式布局 */}
          <div className="mobile-cards">
            {consumables.map((item) => (
              <div key={item.id} className="product-card">
                <div className="product-card-header">
                  <img 
                    src={item.image_url || placeholderImage} 
                    alt={item.name} 
                    className="product-card-image" 
                  />
                  <div className="product-card-title">
                    <div className="product-card-code">{item.code}</div>
                    <div className="product-card-name">{item.name}</div>
                  </div>
                </div>
                
                <div 
                  className="product-card-specs"
                  onClick={(e) => handleSpecClick(e, item)}
                >
                  <div className="product-card-spec">
                    <span className="product-card-spec-label">Material:</span>
                    <span>{item.specs.material}</span>
                  </div>
                  <div className="product-card-spec">
                    <span className="product-card-spec-label">Shape:</span>
                    <span>{item.specs.shape}</span>
                  </div>
                  <div className="product-card-spec">
                    <span className="product-card-spec-label">Thickness:</span>
                    <span>{item.specs.thickness || 'N/A'}</span>
                  </div>
                  <div className="product-card-spec">
                    <span className="product-card-spec-label">Width:</span>
                    <span>{item.specs.width}</span>
                  </div>
                  <div className="product-card-spec">
                    <span className="product-card-spec-label">Length:</span>
                    <span>{item.specs.length}</span>
                  </div>
                  <div className="product-card-spec">
                    <span className="product-card-spec-label">Compatible:</span>
                    <span>{String(item.specs.compatibility)}</span>
                  </div>
                </div>
                
                <div className="product-card-price">
                  {item.pricing.map((price, idx) => (
                    <div key={idx}>
                      <span>{price.range}: </span>
                      <span>{getCurrencySymbolByRegion()}{getRegionalPrice(item, parseInt(price.range.replace(/[^0-9]/g, '') || '1')).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="product-card-actions">
                  <InputNumber
                    min={1}
                    value={quantities[item.id] || 1}
                    onChange={(value) => handleQuantityChange(item.id, Number(value || 1))}
                    className="product-card-quantity"
                  />
                  <Button 
                    type="primary"
                    onClick={() => addToCart(item.id)}
                    className="product-card-add"
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination-container">
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={10}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </div>
      
      {showSpecTooltip && activeItem && (
        <div 
          className="spec-tooltip"
          ref={tooltipRef}
          style={{ 
            top: tooltipPosition.top, 
            left: tooltipPosition.left 
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <h4>
            {activeItem.name} Specifications
            <button className="tooltip-close" onClick={closeTooltip}>×</button>
          </h4>
          <div className="tooltip-content">
            <div className="tooltip-section">
              <h5>Product Specifications</h5>
              <p><strong>Material:</strong> {activeItem.specs.material}</p>
              <p><strong>Shape:</strong> {activeItem.specs.shape}</p>
              <p><strong>Thickness (um/gsm):</strong> {activeItem.specs.thickness || 'N/A'}</p>
              <p><strong>Thickness (mil/#):</strong> {selectedUnit === 'imperial' ? 
                (parseFloat(activeItem.specs.thickness || '0') * 0.03937).toFixed(3) + ' mil' : 
                (activeItem.specs.thickness || 'N/A')}</p>
              <p><strong>Width (cm):</strong> {(parseFloat(activeItem.specs.width || '0') / 10).toFixed(1)}</p>
              <p><strong>Width (inch):</strong> {(parseFloat(activeItem.specs.width || '0') / 25.4).toFixed(2)}</p>
              <p><strong>Length (cm):</strong> {(parseFloat(activeItem.specs.length || '0') / 10).toFixed(1)}</p>
              <p><strong>Length (inch):</strong> {(parseFloat(activeItem.specs.length || '0') / 25.4).toFixed(2)}</p>
              {activeItem.specs.rollLength && (
                <>
                  <p><strong>Roll Length (m):</strong> {activeItem.specs.rollLength}</p>
                  <p><strong>Roll Length (ft):</strong> {(parseFloat(activeItem.specs.rollLength || '0') * 3.28084).toFixed(0)}</p>
                </>
              )}
              <p><strong>Compatible With:</strong> {String(activeItem.specs.compatibility)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsumablesPage; 