import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, Button, Select, InputNumber, Tabs, Tag, Tooltip, Modal } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, FilterOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';

// 导入现代化UI组件
import { 
  LoadingState, 
  ConfirmDialog, 
  CartAnimation, 
  useToastNotifications
} from '../../components/ui';

// 导入SQL Mock数据服务
import { useConsumables, useShapes, useMaterials } from '../../hooks/useMockData';
import MockServiceStatus from '../../components/MockServiceStatus';

// 原有导入 (保留作为备用)
import { useAuth } from '../../contexts/AuthContext';
import { useCart, ExtendedCartItem } from '../../contexts/CartContext';
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

// 判断是否为纸质材料
const isPaperMaterial = (materialId: string): boolean => {
  return materialId === 'PAPER' || materialId === 'paper_pe' || materialId.toLowerCase().includes('paper');
};

const ConsumablesPage: React.FC = () => {
  const { t, i18n } = useTranslation('consumables');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 获取当前语言
  const currentLanguage = i18n.language || 'zh';
  
  // 所有状态定义 - 必须在组件顶部，不能有条件调用
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
  const [selectedShape, setSelectedShape] = useState<string>('MEX');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  const [showModelUsage, setShowModelUsage] = useState<boolean>(false);
  
  // 详细信息Modal状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ConsumableProduct | null>(null);
  
  // 添加状态来跟踪当前选中形状的尺寸图片
  const [currentDimensionImage, setCurrentDimensionImage] = useState<string>(dimensionGuidePlaceholder);

  // 现代化UI状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'default' | 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: () => {},
    loading: false
  });
  
  const [cartAnimation, setCartAnimation] = useState<{
    isActive: boolean;
    startElement: HTMLElement | null;
    targetElement: HTMLElement | null;
    productImage?: string;
    productName?: string;
  }>({
    isActive: false,
    startElement: null,
    targetElement: null
  });

  // 获取用户区域
  const userRegion = user?.region || DEFAULT_REGION;

  // 在组件开始处添加ref
  const cartButtonRef = useRef<HTMLElement>(null);
  
  // 使用useCallback稳定回调函数引用
  const handleConsumablesSuccess = useCallback((data: any) => {
    console.log('✅ 耗材页面数据加载成功:', data);
  }, []);
  
  const handleConsumablesError = useCallback((error: string) => {
    console.error('❌ 耗材页面数据加载失败:', error);
  }, []);
  
  // SQL Mock数据服务Hook
  const { 
    data: mockConsumablesData, 
    loading: mockLoading, 
    error: mockError 
  } = useConsumables({
    page: 1,
    pageSize: 20,
    shape: 'all',
    material: 'all'
  }, {
    onSuccess: handleConsumablesSuccess,
    onError: handleConsumablesError
  });
  
  // 获取形状和材料数据
  const { data: shapesData } = useShapes();
  
  const { data: materialsData } = useMaterials();
  
  // 初始化默认尺寸图片
  useEffect(() => {
    if (filterOptions?.shapes && filterOptions.shapes.length > 0) {
      // 查找默认选中形状(MEX)的image_url2
      const defaultShape = filterOptions.shapes.find(shape => shape.id === selectedShape);
      if (defaultShape && defaultShape.image_url2) {
        setCurrentDimensionImage(defaultShape.image_url2);
      }
    }
  }, [filterOptions?.shapes, selectedShape]);

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
        console.log('🔍 Debug - FilterOptions shapes:', consumableData.filterOptions?.shapes);
        
        setConsumables(consumableData.items);
        setTotalItems(consumableData.total || 0);
        setTotalPages(Math.max(1, consumableData.total_pages || 1));
        setCurrentPage(Math.max(1, consumableData.page || 1));
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
    // 安全检查输入参数
    if (!product || !product.pricing || !Array.isArray(product.pricing) || isNaN(quantity) || quantity < 1) {
      return 0;
    }

    // 找到适用的价格区间
    const pricing = product.pricing.find(p => {
      if (!p || !p.range) return false;
      
      if (p.range.includes('-')) {
        const [min, max] = p.range.split('-').map(n => parseInt(n));
        if (isNaN(min) || isNaN(max)) return false;
        return quantity >= min && quantity <= max;
      } else if (p.range.includes('>')) {
        const min = parseInt(p.range.replace('>', '').trim());
        if (isNaN(min)) return false;
        return quantity > min;
      } else {
        const rangeValue = parseInt(p.range);
        if (isNaN(rangeValue)) return false;
        return rangeValue === quantity;
      }
    });
    
    if (!pricing) return 0;
    
    // 获取适用区域的价格
    const region = userRegion.toLowerCase();
    const price = pricing.regionalPrices?.[region as keyof typeof pricing.regionalPrices] || pricing.price || 0;
    
    // 确保返回有效数字
    return isNaN(price) ? 0 : Number(price);
  };
  
  // 处理数量变更
  const handleQuantityChange = (itemId: string, value: number) => {
    // 安全检查：确保value是有效数字且大于等于1
    const safeValue = isNaN(value) ? 1 : Math.max(1, Math.floor(value));
    setQuantities(prev => ({
      ...prev,
      [itemId]: safeValue
    }));
  };
  
  // 添加到购物车 - 参考备件页面的实现
  const addToCart = async (itemId: string, buttonElement?: HTMLElement) => {
    if (!quantities[itemId] || quantities[itemId] < 1) {
      warning(t('warning.selectQuantity', 'Please select quantity'));
      return;
    }

    const product = consumables.find(p => p.id === itemId);
    if (!product) {
      showErrorToast(t('error.productNotFound', 'Product not found'));
      return;
    }

    try {
      const quantity = quantities[itemId];
      
      // 准备购物车项目数据 - 简化版本，只包含必需字段
      const cartItem: ExtendedCartItem = {
        // OriginalCartItem 必需字段
        item_id: parseInt(itemId) || 0,
        product_type: 'consumable',
        product_id: parseInt(itemId) || 0,
        part_number: product.code,
        quantity: quantity,
        name: product.name,
        image_url: product.image_url || '/images/placeholder.png',
        unit_price: getRegionalPrice(product, quantity),
        currency: getCurrencySymbolByRegion(),
        line_total: getRegionalPrice(product, quantity) * quantity,
        inventory_status: 'in_stock',
        added_at: new Date().toISOString(),
        
        // ExtendedCartItem 额外字段
        id: itemId,
        code: product.code,
        partNumber: product.code,
        image: product.image_url || '/images/placeholder.png',
        category: 'consumable',
        productId: parseInt(itemId) || 0,
        priceTiers: product.pricing?.map(p => {
          const minQty = parseInt(p.range.split('-')[0] || '1') || 1;
          const maxQty = p.range.includes('+') ? null : (parseInt(p.range.split('-')[1] || '999999') || 999999);
          return {
            min: minQty,
            max: maxQty,
            price: p.regionalPrices?.cn || p.price || 0
          };
        }) || [],
        selected: false,
        type: 'consumable',
        specs: {
          partNumber: product.code,
          productName: product.name
        },
        price: getRegionalPrice(product, quantity),
        properties: {
          model: product.model,
          model_imperial: product.model_imperial || '',
          spec: product.spec || '',
          spec_imperial: product.spec_imperial || '',
          bubble_diameter_met: product.bubble_diameter_met ?? '',
          bubble_diameter_imp: product.bubble_diameter_imp ?? '',
          pcs_per_box: product.pcs_per_box ?? '',
          brand: product.brand || '',
          part_number: product.code,
          image_url: product.image_url,
          id: product.id,
          width: product.specs?.width || '',
          length: product.specs?.length || '',
          thickness: product.specs?.thickness || '',
          weight: product.specs?.weight || '',
          rollLength: product.specs?.rollLength || '',
          compatibility: product.specs?.compatibility || '',
          material: product.specs?.material || '',
          shape: product.specs?.shape || '',
          // 可按需补充其它字段
        }
      };
      
      await addItem(cartItem);
      
      // 触发购物车动画
      if (buttonElement && cartButtonRef.current) {
        setCartAnimation({
          isActive: true,
          startElement: buttonElement,
          targetElement: cartButtonRef.current,
          productImage: product.image_url || '/images/placeholder.png',
          productName: product.name
        });
      }
      
      // 显示成功通知 - 使用现代化Toast
      success(t('cart.added', '商品已成功添加到购物车'));
      
      // 重置数量
      setQuantities(prev => ({
        ...prev,
        [itemId]: 0,
      }));
      
    } catch (error) {
      console.error('Add to cart error:', error);
      
      // 使用现代化错误通知
      let errorMessage = '添加到购物车失败';
      if (error instanceof Error) {
        if (error.message?.includes('part_number')) {
          errorMessage = '产品料号信息缺失，请刷新页面重试';
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          errorMessage = '认证失效，请刷新页面重新登录';
        } else if (error.message?.includes('400')) {
          errorMessage = '请求参数错误，请检查产品信息';
        }
      }
      
      showErrorToast('添加失败', errorMessage);
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
    
    // 查找选中形状的image_url2并更新尺寸图片
    const selectedShapeData = shapesData?.find(shape => shape.id === value);
    if (selectedShapeData && selectedShapeData.image_url2) {
      setCurrentDimensionImage(selectedShapeData.image_url2);
    } else {
      // 如果没有image_url2，回退到默认图片
      setCurrentDimensionImage(dimensionGuidePlaceholder);
    }
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
    setSelectedShape('MEX');
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

  // 处理图片错误
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = placeholderImage;
  };

  // 显示产品详细信息
  const showProductDetail = (product: ConsumableProduct) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  // 关闭详细信息Modal
  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedProduct(null);
  };

  // 渲染产品表格 - 参考备件页面的现代化UI
  const renderConsumablesTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-16 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
          <LoadingState 
            size="large" 
            text={t('loading', 'Loading data...')} 
            type="spinner"
          />
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
          <Button 
            type="primary"
            onClick={() => window.location.reload()} 
            className="flex items-center"
          >
            <ReloadOutlined className="mr-2" />
            {t('error.retry', '重试')}
          </Button>
        </div>
      );
    }

    if (consumables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-lg shadow-md">
          <svg className="h-16 w-16 text-content-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-title">{t('noProducts.title', '没有找到符合条件的产品')}</h3>
          <p className="mt-2 text-content-light">{t('noProducts.message', '请尝试调整筛选条件')}</p>
          <Button type="primary" onClick={handleResetFilters} className="mt-4">
            {t('button.resetFilters', '重置筛选条件')}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {consumables.map((item) => (
          <div 
            key={item.id} 
            className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border text-content overflow-hidden"
          >
            <div className="flex flex-col md:flex-row p-6">
              {/* 列1: 图片 */}
              <div className="w-full md:w-1/6 flex items-center justify-center md:justify-start mb-4 md:mb-0">
                <div className="relative">
                  <img 
                    src={item.image_url || placeholderImage} 
                    alt={item.name} 
                    className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-card-alt p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                    onError={handleImageError}
                  />
                </div>
              </div>

              {/* 列2: 信息与规格 */}
              <div className="w-full md:w-3/6 md:px-4">
                <div className="mb-4">
                  <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{item.code}</span>
                  <h3 className="text-xl font-bold text-title mt-2 leading-tight line-clamp-2">{item.name}</h3>
                  {item.model && (
                    <div className="text-sm text-content-light mt-1">
                      <span>型号: {item.model}</span>
                    </div>
                  )}
                  {/* 可选显示 productId */}
                  <div className="text-xs text-content-light mt-1 opacity-60">ID: {item.id}</div>
                </div>

                {/* 规格信息（公制/英制自动切换） */}
                <div className="bg-card-alt rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">宽度:</strong>
                      <span className="text-content font-medium ml-2">
                        {userRegion === 'na' || userRegion === 'au' ? 
                          (item.specs?.width ? item.specs.width + ' inch' : 'N/A') : 
                          (item.specs?.width ? item.specs.width : 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">长度:</strong>
                      <span className="text-content font-medium ml-2">
                        {userRegion === 'na' || userRegion === 'au' ? 
                          (item.specs?.length ? item.specs.length + ' inch' : 'N/A') : 
                          (item.specs?.length ? item.specs.length : 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">卷长:</strong>
                      <span className="text-content font-medium ml-2">{item.specs?.rollLength || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">材质:</strong>
                      <span className="text-content font-medium ml-2">{item.specs?.material || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => showProductDetail(item)}
                    className="bg-accent-light text-accent hover:bg-accent"
                  >
                    更多信息
                  </Button>
                </div>
              </div>

              {/* 列3: 价格与操作 */}
              <div className="w-full md:w-2/6 flex flex-col justify-between mt-4 md:mt-0 md:pl-4 md:border-l md:border-border">
                <div>
                  <h4 className="font-medium text-sm text-label mb-2">价格:</h4>
                  <div className="space-y-1">
                    {item.pricing.map((price, idx) => {
                      const quantity = parseInt(price.range.replace(/[^0-9]/g, '') || '1') || 1;
                      const priceValue = getRegionalPrice(item, quantity);
                      const displayPrice = isNaN(priceValue) ? 0 : priceValue;
                      
                      return (
                        <div key={idx} className="flex justify-between items-center bg-background rounded px-3 py-1 text-sm hover:bg-brand-light transition-colors">
                          <span className="text-content-light">{price.range}:</span>
                          <span className="font-semibold text-brand-primary">
                            {getCurrencySymbolByRegion()}{displayPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 库存信息（仅管理员/销售可见） */}
                  {(user?.role === 'sales' || user?.role === 'admin') && (
                    <div className="mt-3 bg-background p-2 rounded border border-border">
                      <h4 className="font-medium text-sm text-label mb-1">库存:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(item.inventory).map(([region, count]) => (
                          <div key={region} className="flex justify-between items-center px-2 py-1 rounded border border-border">
                            <span className="font-medium">{region.toUpperCase()}:</span>
                            <span className={`font-medium ${(count || 0) > 0 ? 'text-success' : 'text-error'}`}>
                              {isNaN(count) ? 0 : count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  {/* 自定义数量选择器 */}
                  <div className="quantity-selector-container">
                    <label className="quantity-label">数量:</label>
                    <div className="quantity-selector">
                      <button 
                        className="quantity-btn quantity-decrease"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                        disabled={(quantities[item.id] || 1) <= 1}
                        type="button"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={quantities[item.id] || 1}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                        max="9999"
                      />
                      <button 
                        className="quantity-btn quantity-increase"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="primary"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => addToCart(item.id, e.currentTarget)}
                    className="cart-add-button"
                    icon={<ShoppingCartOutlined />}
                    size="large"
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
  
  // 获取筛选选项
  const shapes = filterOptions?.shapes || [];
  const materials = filterOptions?.materials || [];
  const models = filterOptions?.models || [];
  const thicknesses = filterOptions?.thicknesses || [];
  const weights = filterOptions?.weights || [];
  const widths = filterOptions?.widths || [];
  const lengths = filterOptions?.lengths || [];
  const modelExplodedViews = filterOptions?.modelExplodedViews || {};
  
  // 调试日志
  console.log('🔍 Debug - Current shapes data:', shapes);
  shapes.forEach((shape, index) => {
    console.log(`🔍 Shape ${index}:`, {
      id: shape.id,
      name: shape.name,
      image_url: shape.image_url,
      hasImageUrl: !!shape.image_url
    });
  });
  
  // 条件性渲染 - 加载中状态
  if (loading) {
    return (
      <div className="consumables-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h3>{t('loading', 'Loading data...')}</h3>
            <p>{t('loading.description', 'Please wait while we fetch the product information.')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 条件性渲染 - 错误状态
  if (error) {
    return (
      <div className="consumables-page">
        <div className="container">
          <div className="error-container">
            <h3>{t('error.title', 'Error')}</h3>
            <p>{error}</p>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              {t('error.retry', 'Retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="consumables-page">
      {/* SQL Mock服务状态组件 */}
      <MockServiceStatus position="top-right" compact={true} hidden={true} />
      
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
              className="flex items-center cart-button"
              ref={cartButtonRef}
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
                  onChange={(value: string) => setSelectedModel(value)}
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
                  <label className="block text-sm font-medium mb-2 text-label">{isPaperMaterial(selectedMaterial) ? t('filter.weight', 'Weight') : t('filter.thickness', 'Thickness')}:</label>
                  <Select 
                    value={isPaperMaterial(selectedMaterial) ? selectedWeight : selectedThickness}
                    onChange={isPaperMaterial(selectedMaterial) ? (value: string) => setSelectedWeight(value) : (value: string) => setSelectedThickness(value)}
                    style={{ width: '100%' }}
                  >
                    {(isPaperMaterial(selectedMaterial) ? weights : thicknesses).map(item => (
                      <Option key={item.id} value={item.id}>{item.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{t('filter.width', 'Width')}:</label>
                  <Select
                    value={selectedWidth}
                    onChange={(value: string) => setSelectedWidth(value)}
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
                    onChange={(value: string) => setSelectedLength(value)}
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
                  src={currentDimensionImage} 
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
          
          {totalPages > 1 && !isNaN(totalPages) && !isNaN(currentPage) && (
            <div className="flex justify-center mt-6">
              <div className="pagination">
                <button 
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    // 确保page是有效数字且在合理范围内
                    if (isNaN(page) || page < 1 || page > totalPages) {
                      return null;
                    }
                    return (
                      <button
                        key={`page-${page}`}
                        className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  }).filter(Boolean)}
                </div>
                <button 
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 购物车动画组件 */}
      <CartAnimation
        isActive={cartAnimation.isActive}
        startElement={cartAnimation.startElement}
        targetElement={cartAnimation.targetElement}
        productImage={cartAnimation.productImage}
        productName={cartAnimation.productName}
        onComplete={() => setCartAnimation({
          isActive: false,
          startElement: null,
          targetElement: null
        })}
      />
      
      {/* 确认对话框组件 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      
      {/* 产品详细信息Modal */}
      <Modal
        title={selectedProduct ? `${selectedProduct.name} - 详细信息` : '产品详细信息'}
        open={detailModalVisible}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            关闭
          </Button>,
          selectedProduct && (
            <Button 
              key="addToCart" 
              type="primary" 
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                addToCart(selectedProduct.id);
                closeDetailModal();
              }}
            >
              加入购物车
            </Button>
          )
        ]}
        width={800}
        className="product-detail-modal"
      >
        {selectedProduct && (
          <div className="product-detail-content">
            {/* 产品基本信息 */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-full md:w-1/3">
                <img 
                  src={selectedProduct.image_url || placeholderImage}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-contain border border-border rounded-lg bg-card-alt p-4"
                  onError={handleImageError}
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="mb-4">
                  <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg mb-2">
                    {selectedProduct.code}
                  </span>
                  <h3 className="text-xl font-bold text-title mb-2">{selectedProduct.name}</h3>
                  {selectedProduct.model && (
                    <p className="text-content-light mb-2">型号: {selectedProduct.model}</p>
                  )}
                  <p className="text-xs text-content-light opacity-60">产品ID: {selectedProduct.id}</p>
                </div>
                
                {/* 价格信息 */}
                <div className="bg-card-alt rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-sm text-label mb-2">价格信息:</h4>
                  <div className="space-y-2">
                    {selectedProduct.pricing.map((price, idx) => {
                      const quantity = parseInt(price.range.replace(/[^0-9]/g, '') || '1') || 1;
                      const priceValue = getRegionalPrice(selectedProduct, quantity);
                      const displayPrice = isNaN(priceValue) ? 0 : priceValue;
                      
                      return (
                        <div key={idx} className="flex justify-between items-center bg-background rounded px-3 py-2">
                          <span className="text-content-light">{price.range}:</span>
                          <span className="font-semibold text-brand-primary text-lg">
                            {getCurrencySymbolByRegion()}{displayPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 详细规格 */}
            <div className="bg-card-alt rounded-lg p-4 mb-4">
              <h4 className="font-medium text-base text-label mb-3">详细规格:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label font-medium">宽度:</span>
                    <span className="text-content">
                      {userRegion === 'na' || userRegion === 'au' ? 
                        (selectedProduct.specs?.width ? selectedProduct.specs.width + ' inch' : 'N/A') : 
                        (selectedProduct.specs?.width ? selectedProduct.specs.width : 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">长度:</span>
                    <span className="text-content">
                      {userRegion === 'na' || userRegion === 'au' ? 
                        (selectedProduct.specs?.length ? selectedProduct.specs.length + ' inch' : 'N/A') : 
                        (selectedProduct.specs?.length ? selectedProduct.specs.length : 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">卷长:</span>
                    <span className="text-content">{selectedProduct.specs?.rollLength || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">材质:</span>
                    <span className="text-content">{selectedProduct.specs?.material || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label font-medium">厚度:</span>
                    <span className="text-content">{selectedProduct.specs?.thickness || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">形状:</span>
                    <span className="text-content">{selectedProduct.specs?.shape || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">兼容性:</span>
                    <span className="text-content">{selectedProduct.specs?.compatibility || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 库存信息（仅管理员/销售可见） */}
            {(user?.role === 'sales' || user?.role === 'admin') && (
              <div className="bg-card-alt rounded-lg p-4">
                <h4 className="font-medium text-base text-label mb-3">库存信息:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(selectedProduct.inventory).map(([region, count]) => (
                    <div key={region} className="bg-background rounded-lg p-3 text-center">
                      <div className="text-sm text-label font-medium mb-1">{region.toUpperCase()}</div>
                      <div className={`text-lg font-bold ${(count || 0) > 0 ? 'text-success' : 'text-error'}`}>
                        {isNaN(count) ? 0 : count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ConsumablesPage; 