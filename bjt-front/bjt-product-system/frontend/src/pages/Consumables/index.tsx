import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, message, Button, Select, InputNumber, Tabs, Tag, Pagination, Tooltip, Popover } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart, PriceTier } from '../../contexts/CartContext';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  consumablesService,
  ConsumableProduct,
  ConsumableFilters,
  ConsumableListData,
  FilterOptionsType
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
  const [searchParams] = useSearchParams();
  
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
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType | null>(null);
  
  // 筛选条件状态
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedShape, setSelectedShape] = useState<string>('pillow');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  const [showModelUsage, setShowModelUsage] = useState<boolean>(false);

  // 获取用户区域
  const userRegion = user?.region || DEFAULT_REGION;

  // 获取耗材数据
  useEffect(() => {
    const fetchConsumables = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const categoryFilter = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;

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
          lang: navigator.language.startsWith('zh') ? 'zh' : 'en',
          category_id: categoryFilter
        };
        
        const consumableData = await consumablesService.getConsumables(filters);
        console.log('ConsumableData received in Page:', JSON.stringify(consumableData, null, 2));
        
        setConsumables(consumableData.items);
        setTotalItems(consumableData.total);
        setTotalPages(consumableData.total_pages);
        setCurrentPage(consumableData.page);
        setFilterOptions(consumableData.filterOptions);
        
        // 初始化数量状态
        const initialQuantities: Record<string, number> = {};
        consumableData.items.forEach(item => {
          initialQuantities[item.id] = 1;
        });
        setQuantities(initialQuantities);

      } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : t('error.systemError');
        console.error('Failed to fetch consumables:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsumables();
  }, [selectedModel, selectedShape, selectedMaterial, selectedThickness, 
      selectedWeight, selectedWidth, selectedLength, currentPage, userRegion, t, searchParams]);
  
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
  
  // 渲染产品表格
  const renderConsumablesTable = () => {
    return (
      <div className="grid grid-cols-1 gap-4">
        {consumables.map((item) => (
          <div 
            key={item.id} 
            className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-border text-content"
          >
            <div className="flex flex-col md:flex-row p-4">
              {/* 列1: 图片 */}
              <div className="w-full md:w-1/6 flex items-center justify-center md:justify-start mb-4 md:mb-0">
                <img 
                  src={item.image_url || placeholderImage} 
                  alt={item.name} 
                  className="w-24 h-24 object-contain border border-border rounded bg-card-alt p-1 hover:border-brand-accent transition-colors"
                />
              </div>

              {/* 列2: 信息与规格 */}
              <div className="w-full md:w-3/6 md:px-4">
                <div className="mb-1">
                  <span className="inline-block bg-brand-primary text-gray-800 px-2 py-1 text-xs font-bold rounded">{item.code}</span>
                  <h3 className="text-lg font-semibold text-title mt-1">{item.name}</h3>
                  {item.model && (
                    <div className="text-sm text-content-light">
                      <span>({item.model})</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 my-2">
                  <span className="inline-flex items-center px-2 py-1 bg-background rounded text-xs">
                    <strong className="text-label mr-1">材料:</strong> 
                    <span className="text-content">{item.specs.material}</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-background rounded text-xs">
                    <strong className="text-label mr-1">形状:</strong> 
                    <span className="text-content">{item.specs.shape}</span>
                  </span>
                  {item.specs.thickness && (
                    <span className="inline-flex items-center px-2 py-1 bg-background rounded text-xs">
                      <strong className="text-label mr-1">厚度:</strong> 
                      <span className="text-content">{item.specs.thickness}</span>
                    </span>
                  )}
                </div>

                <div className="bg-card-alt rounded-md p-3 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex">
                      <strong className="w-20 text-label">宽度:</strong>
                      <span className="text-content">{item.specs.width}</span>
                    </div>
                    <div className="flex">
                      <strong className="w-20 text-label">长度:</strong>
                      <span className="text-content">{item.specs.length}</span>
                    </div>
                    {item.specs.rollLength && (
                      <div className="flex">
                        <strong className="w-20 text-label">卷长:</strong>
                        <span className="text-content">{item.specs.rollLength}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button 
                    size="small"
                    icon={<InfoCircleOutlined />}
                    className="bg-secondary-light text-secondary hover:bg-secondary"
                    onClick={() => {
                      const pdfUrl = (item.specs as any).pdfUrl || '#'; // Add type assertion and placeholder
                      if (pdfUrl !== '#') {
                        window.open(pdfUrl, '_blank');
                      }
                    }}
                    disabled={!(item.specs as any).pdfUrl} // Add type assertion
                  >
                    规格详情 (PDF)
                  </Button>

                  <Popover
                    title={`${item.name} - 更多信息`}
                    content={
                      <div className="order-info-popover">
                        {/* 材质信息 */}
                        <div className="section">
                          <h4>材质信息</h4>
                          <div className="info-grid">
                            <div>
                              <strong>厚度/克重:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).thicknessMil || 'N/A') : ((item.specs as any).thickness || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'mil/#' : 'um/gsm'})</span>
                            </div>
                            <div>
                              <strong>膜宽:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).filmWidthInch || 'N/A') : ((item.specs as any).filmWidthCm || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                            <div>
                              <strong>袋长:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).bagLengthInch || 'N/A') : ((item.specs as any).bagLengthCm || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                            <div>
                              <strong>总长:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).totalLengthFt || 'N/A') : ((item.specs as any).totalLengthM || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'ft' : 'm'})</span>
                            </div>
                          </div>
                        </div>

                        {/* 包装属性 */}
                        <div className="section">
                          <h4>包装属性 (Package Info)</h4>
                          <div className="info-grid">
                             <div>
                              <strong>包装方式:</strong> 
                              <span>{((item.specs as any).packagingMethod || 'N/A')}</span>
                            </div>
                            <div>
                              <strong>包装尺寸:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).packageSizeInch || 'N/A') : ((item.specs as any).packageSizeCm || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                            <div>
                              <strong>单件净重:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).netWeightLbs || 'N/A') : ((item.specs as any).netWeightKg || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'})</span>
                            </div>
                            <div>
                              <strong>托盘尺寸:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? 'N/A' : (((item.specs as any).palletSizeCm || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                          </div>
                        </div>

                        {/* 打托属性 */}
                        <div className="section">
                          <h4>打托属性 (Pallet Info)</h4>
                          <div className="info-grid-pallet">
                            {/* 一托卷数 A */}
                            <div><strong>一托卷数A:</strong> <span>{((item.specs as any).rollsPerPalletA || 'N/A')}</span></div>
                            <div>
                              <strong>整托毛重A:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? (((item.specs as any).palletWeightALbs || 'N/A')) : (((item.specs as any).palletWeightAKg || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'})</span>
                            </div>
                            <div>
                              <strong>打托高度A:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? (((item.specs as any).palletHeightAInch || 'N/A')) : (((item.specs as any).palletHeightACm || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                            
                            {/* 一托卷数 B */}
                            <div><strong>一托卷数B:</strong> <span>{((item.specs as any).rollsPerPalletB || 'N/A')}</span></div>
                            <div>
                              <strong>整托毛重B:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? (((item.specs as any).palletWeightBLbs || 'N/A')) : (((item.specs as any).palletWeightBKg || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'})</span>
                            </div>
                            <div>
                              <strong>打托高度B:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? (((item.specs as any).palletHeightBInch || 'N/A')) : (((item.specs as any).palletHeightBCm || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                            
                            {/* 一托卷数 C */}
                            <div><strong>一托卷数C:</strong> <span>{((item.specs as any).rollsPerPalletC || 'N/A')}</span></div>
                            <div>
                              <strong>整托毛重C:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? (((item.specs as any).palletWeightCLbs || 'N/A')) : (((item.specs as any).palletWeightCKg || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'})</span>
                            </div>
                            <div>
                              <strong>打托高度C:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? (((item.specs as any).palletHeightCInch || 'N/A')) : (((item.specs as any).palletHeightCCm || 'N/A'))} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>

                            {/* 纸筒内径 */}
                            <div className="full-width">
                              <strong>纸筒内径:</strong> 
                              <span>{userRegion === 'na' || userRegion === 'au' ? ((item.specs as any).tubeDiameterInch || 'N/A') : ((item.specs as any).tubeDiameterCm || 'N/A')} ({userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    trigger="hover"
                    placement="right"
                    overlayClassName="order-info-popover-container wide-popover"
                  >
                    <Button 
                      size="small"
                      icon={<InfoCircleOutlined />}
                      className="bg-accent-light text-accent hover:bg-accent"
                    >
                      更多信息
                    </Button>
                  </Popover>
                </div>
              </div>

              {/* 列3: 价格与操作 */}
              <div className="w-full md:w-2/6 flex flex-col justify-between mt-4 md:mt-0 md:pl-4 md:border-l md:border-border">
                <div>
                  <h4 className="font-medium text-sm text-label mb-2">价格:</h4>
                  <div className="space-y-1">
                    {item.pricing.map((price, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-background rounded px-3 py-1 text-sm hover:bg-brand-light transition-colors">
                        <span className="text-content-light">{price.range}:</span>
                        <span className="font-semibold text-brand-primary">
                          {getCurrencySymbolByRegion()}{getRegionalPrice(item, parseInt(price.range.replace(/[^0-9]/g, '') || '1')).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* 库存信息（仅管理员/销售可见） */}
                  {(user?.role === 'sales' || user?.role === 'admin') && (
                    <div className="mt-3 bg-background p-2 rounded border border-border">
                      <h4 className="font-medium text-sm text-label mb-1">库存:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(item.inventory).map(([region, count]) => (
                          <div key={region} className="flex justify-between items-center px-2 py-1 rounded border border-border">
                            <span className="font-medium">{region.toUpperCase()}:</span>
                            <span className={`font-medium ${count > 0 ? 'text-success' : 'text-error'}`}>
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="w-20">
                    <InputNumber
                      min={1}
                      value={quantities[item.id] || 1}
                      onChange={(value) => handleQuantityChange(item.id, Number(value || 1))}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    type="primary"
                    onClick={() => addToCart(item.id)}
                    className="flex-grow ml-3 h-10"
                    icon={<ShoppingCartOutlined />}
                  >
                    加入购物车
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
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
  const shapes = filterOptions?.shapes || [];
  const materials = filterOptions?.materials || [];
  const models = filterOptions?.models || [];
  const thicknesses = filterOptions?.thicknesses || [];
  const weights = filterOptions?.weights || [];
  const widths = filterOptions?.widths || [];
  const lengths = filterOptions?.lengths || [];
  const modelExplodedViews = filterOptions?.modelExplodedViews || {};
  
  return (
    <div className="consumables-page">
      <div className="container">
        <div className="section-title">
          <div className="title-text">
            <h2>{t('title', 'Consumable Products')}</h2>
            <p>{t('subtitle', 'BJT Bubble Films, Cushioning Bags and Other Products')}</p>
          </div>
          <div className="ml-auto flex items-center">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={toggleCartModal}
              className="flex items-center"
            >
              {t('button.cart', 'View Cart')}
            </Button>
          </div>
        </div>
        
        <div className="filter-container">
          {/* 优化筛选区标题 */}
          <div className="mb-4 flex items-center">
            <FilterOutlined className="mr-2 text-brand-primary" />
            <h3 className="text-lg font-semibold m-0 text-title">{t('filter.title', 'Product Filters')}</h3>
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
              className="ml-auto text-sm"
              size="small"
            >
              {t('button.reset', 'Reset')}
            </Button>
          </div>

          <div className="filter-section">
            <div className="filter-group">
              <label className="block text-sm font-medium mb-2 text-label">{t('filter.machine', 'Machine Model')}:</label>
              <div className="flex items-center">
                <Select 
                  value={selectedModel} 
                  onChange={(value) => setSelectedModel(value)}
                  style={{ width: '100%', maxWidth: '300px' }}
                  className="mr-2"
                >
                {models.map(model => (
                    <Option key={model.id} value={model.id}>{model.name}</Option>
                  ))}
                </Select>
                <Tooltip title={t('help.machineModel', 'Select the machine model to filter compatible consumables')}>
                  <Button type="text" shape="circle" icon={<InfoCircleOutlined />} />
                </Tooltip>
              </div>
            </div>
          </div>
          
          <div className="filter-section">
            <h3 className="text-base font-medium mb-3 text-label">{t('filter.shape', 'Shape')}</h3>
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
                  <label htmlFor={`shape-${shape.id}`} className="shape-label bg-card shadow-sm hover:shadow-md transition-shadow">
                    <img src={shape.image_url || shapePlaceholderImage} alt={shape.name} className="object-contain h-14 w-20" />
                    <span className="mt-2 font-medium text-sm">{shape.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="filter-section">
            <div className="filter-row mb-3">
              <div className="filter-group">
                <label className="block text-sm font-medium mb-2 text-label">{t('filter.material', 'Material')}:</label>
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
              <div className="dimensions-filters grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-7/12">
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{selectedMaterial === 'paper_pe' ? t('filter.weight', 'Weight') : t('filter.thickness', 'Thickness')}:</label>
                  <Select 
                    value={selectedMaterial === 'paper_pe' ? selectedWeight : selectedThickness}
                    onChange={selectedMaterial === 'paper_pe' ? (value) => setSelectedWeight(value) : (value) => setSelectedThickness(value)}
                    style={{ width: '100%' }}
                  >
                    {(selectedMaterial === 'paper_pe' ? weights : thicknesses).map(item => (
                      <Option key={item.id} value={item.id}>{item.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{t('filter.width', 'Width')}:</label>
                  <Select
                    value={selectedWidth}
                    onChange={(value) => setSelectedWidth(value)}
                    style={{ width: '100%' }}
                  >
                    {widths.map(width => (
                      <Option key={width.id} value={width.id}>{width.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{t('filter.length', 'Length')}:</label>
                  <Select
                    value={selectedLength}
                    onChange={(value) => setSelectedLength(value)}
                    style={{ width: '100%' }}
                  >
                    {lengths.map(length => (
                      <Option key={length.id} value={length.id}>{length.name}</Option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="dimension-image w-full md:w-5/12 flex justify-center items-center">
                <img 
                  src={selectedModel && modelExplodedViews[selectedModel as keyof typeof modelExplodedViews] 
                      ? modelExplodedViews[selectedModel as keyof typeof modelExplodedViews] 
                      : dimensionGuidePlaceholder} 
                  alt={t('filter.dimensions', 'Product Dimensions')} 
                  className="object-contain max-h-60 border border-border rounded p-2 bg-card"
                />
              </div>
            </div>
          </div>
          
          <div className="filter-actions flex justify-end mt-4">
            <Button 
              type="primary" 
              onClick={handleApplyFilters} 
              className="btn-apply"
            >
              {t('button.apply', 'Apply Filters')}
            </Button>
          </div>
        </div>
        
        <div className="products-container">
          {/* 表格式布局 */}
          {renderConsumablesTable()}
          
          {consumables.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-title">{t('noProducts.title', '没有找到符合条件的产品')}</h3>
              <p className="mt-2 text-content-light">{t('noProducts.message', '请尝试调整筛选条件')}</p>
              <Button type="primary" onClick={handleResetFilters} className="mt-4">
                {t('button.resetFilters', '重置筛选条件')}
                  </Button>
                </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
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
    </div>
  );
}

export default ConsumablesPage; 