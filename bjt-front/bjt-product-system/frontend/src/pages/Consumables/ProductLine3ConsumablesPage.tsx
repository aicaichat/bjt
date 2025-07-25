import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, Button, Select, Tabs, Tag, Tooltip, Modal } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, FilterOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';

// 导入现代化UI组件
import { 
  LoadingState, 
  ConfirmDialog, 
  CartAnimation, 
  useToastNotifications
} from '../../components/ui';

// 🎯 导入智能购物车组件
import { SmartAddToCartButton } from '../../components/Cart/SmartAddToCartButton';

// 导入服务和类型
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  consumablesService,
  ConsumableProduct, 
  ConsumableFilters,
  ConsumableListData,
  FilterOptionsType,
  FilterOptionItem
} from '../../services/consumablesService';
import { DEFAULT_REGION } from '../../config/env';
import { REGIONS, getCurrencySymbol } from '../../config/constants';
import { ASSETS } from '../../config/appConfig';
import { ExtendedCartItem } from '../../contexts/CartContext';

// 导入样式文件
import './Consumables.css';
import './consumables.scss';

// 🎯 工具函数
const cleanImageUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/:\//g, '://');
};

const isPaperMaterial = (material: string): boolean => {
  if (!material) return false;
  const paperKeywords = ['paper', 'kraft', '纸', '牛皮纸', 'cardboard'];
  return paperKeywords.some(keyword => 
    material.toLowerCase().includes(keyword.toLowerCase())
  );
};

// 🎯 Tooltip字段组件
const TooltipField: React.FC<{
  label: string;
  value: any;
  unit?: string;
  isImportant?: boolean;
}> = ({ label, value, unit, isImportant = false }) => {
  if (!value && value !== 0) return null;
  
  return (
    <div className={`tooltip-field ${isImportant ? 'important' : ''}`}>
      <span className="tooltip-label">{label}:</span>
      <span className="tooltip-value">
        {value}{unit && ` ${unit}`}
      </span>
    </div>
  );
};

// 🎯 耗材Tooltip内容组件
const ConsumableTooltipContent: React.FC<{
  product: ConsumableProduct;
  isImperialUnit: boolean;
  onClose?: () => void;
}> = ({ product, isImperialUnit, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedProduct, setDetailedProduct] = useState<ConsumableProduct | null>(null);
  
  // 获取详细产品信息
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const response = await fetch(`${baseUrl}/consumables/${product.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        
        const data = await response.json();
        setDetailedProduct(data.success ? data.data : data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
        setDetailedProduct(product); // 降级到基础产品信息
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [product]);
  
  if (loading) {
    return (
      <div className="tooltip-loading">
        <Spin size="small" />
        <span>加载产品详情...</span>
      </div>
    );
  }
  
  if (error && !detailedProduct) {
    return (
      <div className="tooltip-error">
        <span>加载失败，请重试</span>
      </div>
    );
  }
  
  const currentProduct = detailedProduct || product;
  const fieldSuffix = isImperialUnit ? '_imp' : '_met';
  
  // 获取规格数据
  const getSpecValue = (field: string) => {
    return (currentProduct as any)[`${field}${fieldSuffix}`] || (currentProduct as any)[field];
  };
  
  const width = getSpecValue('width');
  const basisWeight = getSpecValue('basis_weight');
  const thickness = getSpecValue('thickness');
  const ribCount = (currentProduct as any).rib_count;
  const reinforcement = (currentProduct as any).reinforcement;
  const material = currentProduct.specs?.material || '';
  const appModel = currentProduct.app_model || '';
  
  // 单位标签
  const widthUnit = isImperialUnit ? 'inch' : 'cm';
  const weightUnit = isImperialUnit ? '#' : 'gsm';
  const thicknessUnit = isImperialUnit ? 'mil' : 'mm';
  
  return (
    <div className="consumables-tooltip-content">
      <div className="tooltip-header">
        <h4 className="tooltip-title">{currentProduct.name}</h4>
        {onClose && (
          <button className="tooltip-close" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="tooltip-body">
        <div className="tooltip-grid">
          {/* 左列：核心规格 */}
          <div className="tooltip-column">
            <div className="tooltip-section">
              <h5 className="tooltip-section-title">核心规格</h5>
              <TooltipField label="适用机型" value={appModel} isImportant />
              <TooltipField label="宽度" value={width} unit={widthUnit} isImportant />
              <TooltipField label="筋数" value={ribCount} isImportant />
              <TooltipField label="Reinforcement" value={reinforcement} />
              <TooltipField label="材质" value={material} />
            </div>
            
            <div className="tooltip-section">
              <h5 className="tooltip-section-title">托盘配置</h5>
              <TooltipField 
                label="托盘装载量" 
                value={(currentProduct as any).pallet_loading} 
                unit="卷"
              />
              <TooltipField 
                label="托盘尺寸" 
                value={currentProduct.pallet_size_cm}
              />
            </div>
          </div>
          
          {/* 右列：包装信息 */}
          <div className="tooltip-column">
            <div className="tooltip-section">
              <h5 className="tooltip-section-title">包装信息</h5>
              <TooltipField 
                label="包装规格" 
                value={currentProduct.package_type}
              />
              <TooltipField 
                label="每箱数量" 
                value={currentProduct.pcs_per_box}
                unit="个"
              />
              <TooltipField 
                label="每托盘箱数" 
                value={(currentProduct as any).boxes_per_pallet}
                unit="箱"
              />
            </div>
            
            <div className="tooltip-section">
              <h5 className="tooltip-section-title">技术参数</h5>
              <TooltipField 
                label={isPaperMaterial(material) ? "克重" : "厚度"} 
                value={basisWeight || thickness} 
                unit={isPaperMaterial(material) ? weightUnit : thicknessUnit}
                isImportant
              />
              <TooltipField 
                label="产品编号" 
                value={currentProduct.part_number}
              />
              <TooltipField 
                label="品牌" 
                value={currentProduct.brand}
              />
            </div>
          </div>
        </div>
      </div>
      
      {currentProduct.image_url && (
        <div className="tooltip-image">
          <img 
            src={cleanImageUrl(currentProduct.image_url)} 
            alt={currentProduct.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = ASSETS.PRODUCTS.PLACEHOLDER;
            }}
          />
        </div>
      )}
    </div>
  );
};

// 产品线3耗材页面
const ProductLine3ConsumablesPage: React.FC = () => {
  const { t, i18n } = useTranslation(['consumables', 'common']);
  const navigate = useNavigate();
  const { user, getPreferredUnit } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 基础页面状态
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 数据状态
  const [consumables, setConsumables] = useState<ConsumableProduct[]>([]);
  const [allConsumables, setAllConsumables] = useState<ConsumableProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType | null>(null);
  
  // 购物车状态
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  
  // 分页状态
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // 筛选状态 - 产品线3：适用机型、宽度、筋数、Reinforcement、克重
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedRibCount, setSelectedRibCount] = useState<string>('all');
  const [selectedReinforcement, setSelectedReinforcement] = useState<string>('all');
  const [selectedBasisWeight, setSelectedBasisWeight] = useState<string>('all');
  
  // 模态框状态
  const [selectedProduct, setSelectedProduct] = useState<ConsumableProduct | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // UI辅助状态
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const currentLanguage = i18n.language;
  const isSales = user && (user.role === 'admin' || user.role === 'sales');
  const userRegion = user?.region || 'CN';
  
  // 获取用户偏好单位制
  const preferredUnit = getPreferredUnit();
  const isImperialUnit = preferredUnit === 'imperial';
  
  // 筛选后的耗材数据
  const filteredConsumables = useMemo(() => {
    if (!allConsumables?.length) {
      return [];
    }
    
    const normalize = (v: any) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');
    const extractNumber = (value: string | number | undefined | null): number | undefined => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'number') return value;
      const numValue = parseFloat(String(value));
      return isNaN(numValue) ? undefined : numValue;
    };
    
    return allConsumables.filter((item) => {
      // 1. 适用机型筛选
      if (selectedModel !== 'all') {
        const appModels = (item.app_model || '').split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
        const matches = appModels.some(m => normalize(m) === normalize(selectedModel));
        if (!matches) {
          return false;
        }
      }
      
      // 2. 宽度筛选（支持公英制）
      if (selectedWidth !== 'all') {
        const fieldSuffix = isImperialUnit ? '_imp' : '_met';
        const itemWidth = extractNumber(item[`width${fieldSuffix}` as keyof typeof item] as any);
        const targetWidth = extractNumber(selectedWidth);
        if (itemWidth === undefined || targetWidth === undefined || 
            Math.abs(itemWidth - targetWidth) > 0.01) {
          return false;
        }
      }
      
      // 3. 筋数筛选
      if (selectedRibCount !== 'all') {
        const itemRibCount = extractNumber((item as any).rib_count);
        const targetRibCount = extractNumber(selectedRibCount);
        if (itemRibCount === undefined || targetRibCount === undefined || 
            itemRibCount !== targetRibCount) {
          return false;
        }
      }
      
      // 4. Reinforcement筛选
      if (selectedReinforcement !== 'all') {
        const itemReinforcement = normalize((item as any).reinforcement || '');
        const targetReinforcement = normalize(selectedReinforcement);
        if (itemReinforcement !== targetReinforcement) {
          return false;
        }
      }
      
      // 5. 克重筛选（支持公英制）
      if (selectedBasisWeight !== 'all') {
        const fieldSuffix = isImperialUnit ? '_imp' : '_met';
        const itemBasisWeight = extractNumber(item[`basis_weight${fieldSuffix}` as keyof typeof item] as any) ||
                               extractNumber(item[`thickness${fieldSuffix}` as keyof typeof item] as any);
        const targetBasisWeight = extractNumber(selectedBasisWeight);
        if (itemBasisWeight === undefined || targetBasisWeight === undefined || 
            Math.abs(itemBasisWeight - targetBasisWeight) > 0.01) {
          return false;
        }
      }
      
      return true;
    });
  }, [allConsumables, selectedModel, selectedWidth, selectedRibCount, selectedReinforcement, selectedBasisWeight, isImperialUnit]);
  
  // 获取API数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const apiUrl = `${baseUrl}/consumables?page=1&per_page=1000&status=publish&product_line=3`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        let consumablesData = [];
        let filterOptionsData = null;
        
        if (data.success && data.data) {
          if (Array.isArray(data.data.items)) {
            consumablesData = data.data.items;
            filterOptionsData = data.data.filterOptions;
          } else if (Array.isArray(data.data)) {
            consumablesData = data.data;
          }
        } else if (Array.isArray(data)) {
          consumablesData = data;
        }
        
        setAllConsumables(consumablesData);
        setFilterOptions(filterOptionsData);
        setLoading(false);
        
      } catch (err: any) {
        setError(err.message || '加载耗材数据失败');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 更新显示数据
  useEffect(() => {
    const pageSize = 10;
    const total = filteredConsumables.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    
    if (currentPage > pages) {
      setCurrentPage(1);
      return;
    }
    
    const paged = filteredConsumables.slice((currentPage-1)*pageSize, currentPage*pageSize);
    setConsumables(paged);
    setTotalItems(total);
    setTotalPages(pages);
    
    // 初始化数量状态
    const initialQuantities = paged.reduce((acc, item) => {
      acc[item.id] = 1;
      return acc;
    }, {} as Record<string, number>);
    setQuantities(initialQuantities);
  }, [filteredConsumables, currentPage]);
  
  // 处理筛选器变化
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setCurrentPage(1);
  };
  
  const handleWidthChange = (value: string) => {
    setSelectedWidth(value);
    setCurrentPage(1);
  };
  
  const handleRibCountChange = (value: string) => {
    setSelectedRibCount(value);
    setCurrentPage(1);
  };
  
  const handleReinforcementChange = (value: string) => {
    setSelectedReinforcement(value);
    setCurrentPage(1);
  };
  
  const handleBasisWeightChange = (value: string) => {
    setSelectedBasisWeight(value);
    setCurrentPage(1);
  };
  
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedWidth('all');
    setSelectedRibCount('all');
    setSelectedReinforcement('all');
    setSelectedBasisWeight('all');
    setCurrentPage(1);
  };
  
  // 购物车相关函数
  const handleQuantityChange = (itemId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: value
    }));
  };
  
  const getCurrencySymbolByRegion = (region?: string): string => {
    return getCurrencySymbol(region || userRegion);
  };
  
  const addToCart = async (itemId: string, buttonElement?: HTMLElement) => {
    const item = consumables.find(c => c.id === itemId);
    if (!item) return;
    
    const quantity = quantities[itemId] || 1;
    const resolvedName = item.name || item.code || item.part_number || item.id || 'N/A';
    const image_url = item.image_url || ASSETS.PRODUCTS.PLACEHOLDER;
    const regionalPrice = getRegionalPrice(item, quantity);
    
    try {
      const cartItem: ExtendedCartItem = {
        item_id: parseInt(itemId) || 0,
        product_type: 'consumable',
        product_id: parseInt(itemId) || 0,
        part_number: item.part_number || item.code || item.id,
        quantity,
        name: resolvedName,
        image_url,
        unit_price: regionalPrice,
        currency: getCurrencySymbolByRegion(),
        line_total: regionalPrice * quantity,
        inventory_status: 'in_stock',
        added_at: new Date().toISOString(),
        id: itemId,
        code: item.code || item.part_number || item.id,
        partNumber: item.part_number || item.code || item.id,
        image: image_url,
        category: 'consumable',
        productId: parseInt(itemId) || 0,
        selected: false,
        type: 'consumable',
        price: regionalPrice,
        priceTiers: [],
        specs: { 
          partNumber: item.part_number || item.code || item.id, 
          productName: resolvedName 
        },
        properties: {
          name: resolvedName,
          part_number: item.part_number || item.code || item.id,
          image_url
        }
      };
      
      await addItem(cartItem);
      success(`已添加 ${quantity} 个 ${resolvedName} 到购物车`);
    } catch (error) {
      showErrorToast('添加到购物车失败');
    }
  };
  
  // 获取库存状态
  const getStockStatus = (quantity: number) => {
    if (quantity > 10) return { status: t('stockStatus.sufficient') || '库存充足', color: 'green' };
    if (quantity > 0) return { status: t('stockStatus.low') || '库存紧张', color: 'orange' };
    return { status: t('stockStatus.outOfStock') || '暂时缺货', color: 'red' };
  };
  
  // 获取区域库存
  const getRegionInventory = (product: ConsumableProduct, region: string): number => {
    const inventory = product.inventory || {};
    return inventory[region] || 0;
  };
  
  // 获取区域价格
  const getRegionalPrice = (product: ConsumableProduct, quantity: number): number => {
    const basePrice = product.pricing?.[0]?.price || 0;
    return basePrice * quantity;
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = ASSETS.PRODUCTS.PLACEHOLDER;
  };
  
  // 生成筛选选项
  const generateFilterOptions = (fieldName: string, useUnitSystem: boolean = false) => {
    const fieldSuffix = useUnitSystem ? (isImperialUnit ? '_imp' : '_met') : '';
    const fieldKey = `${fieldName}${fieldSuffix}`;
    
    const values = new Set<string>();
    allConsumables.forEach(item => {
      const value = (item as any)[fieldKey];
      if (value !== undefined && value !== null && value !== '') {
        values.add(String(value));
      }
    });
    
    return Array.from(values)
      .sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      })
      .map(value => ({ value, label: value }));
  };
  
  // 渲染筛选器
  const renderFilters = () => {
    const models = (filterOptions?.models || []).filter(item => item && item.id && (item.name_zh || item.name));
    const modelOptions = [
      { value: 'all', label: '全部机型' },
      ...models.map(model => ({
        value: model.id,
        label: model.name_zh || model.name || model.id
      }))
    ];
    
    const widthOptions = [
      { value: 'all', label: '全部宽度' },
      ...generateFilterOptions('width', true)
    ];
    
    const ribCountOptions = [
      { value: 'all', label: '全部筋数' },
      ...generateFilterOptions('rib_count', false)
    ];
    
    const reinforcementOptions = [
      { value: 'all', label: '全部Reinforcement' },
      ...generateFilterOptions('reinforcement', false)
    ];
    
    const basisWeightOptions = [
      { value: 'all', label: '全部克重' },
      ...generateFilterOptions('basis_weight', true)
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 适用机型 */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            适用机型
          </label>
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
            options={modelOptions}
          />
        </div>
        
        {/* 宽度 */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            宽度 {isImperialUnit ? '(inch)' : '(cm)'}
          </label>
          <Select
            value={selectedWidth}
            onChange={handleWidthChange}
            className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
            options={widthOptions}
          />
        </div>
        
        {/* 筋数 */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            筋数
          </label>
          <Select
            value={selectedRibCount}
            onChange={handleRibCountChange}
            className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
            options={ribCountOptions}
          />
        </div>
        
        {/* Reinforcement */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            Reinforcement
          </label>
          <Select
            value={selectedReinforcement}
            onChange={handleReinforcementChange}
            className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
            options={reinforcementOptions}
          />
        </div>
        
        {/* 克重 */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            克重 {isImperialUnit ? '(#)' : '(gsm)'}
          </label>
          <Select
            value={selectedBasisWeight}
            onChange={handleBasisWeightChange}
            className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
            options={basisWeightOptions}
          />
        </div>
      </div>
    );
  };
  
  // 渲染耗材产品列表
  const renderConsumablesList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-20">
          <ErrorMessage message={error} />
        </div>
      );
    }
    
    if (!consumables.length) {
      return (
        <div className="text-center py-20">
          <p className="text-gray-500">暂无耗材数据</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {consumables.map((item, index) => {
          const fieldSuffix = isImperialUnit ? '_imp' : '_met';
          const width = (item as any)[`width${fieldSuffix}`] || (item as any).width;
          const basisWeight = (item as any)[`basis_weight${fieldSuffix}`] || (item as any).basis_weight;
          const ribCount = (item as any).rib_count;
          const reinforcement = (item as any).reinforcement;
          
          const currentInventory = getRegionInventory(item, userRegion);
          const stockStatus = getStockStatus(currentInventory);
          const isOutOfStock = currentInventory <= 0;
          
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="flex">
                {/* 左列：产品图片 (1/4) */}
                <div className="w-1/4 p-6">
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden group">
                    <img
                      src={cleanImageUrl(item.image_url) || ASSETS.PRODUCTS.PLACEHOLDER}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={handleImageError}
                    />
                  </div>
                </div>
                
                {/* 中列：产品信息 (1/2) */}
                <div className="w-1/2 p-6 border-r border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {item.specs?.material || ''}
                      </p>
                    </div>
                    
                    {/* Tooltip按钮 */}
                    <Tooltip
                      title={
                        <ConsumableTooltipContent
                          product={item}
                          isImperialUnit={isImperialUnit}
                        />
                      }
                      placement="left"
                      overlayClassName="consumables-custom-tooltip"
                      overlayStyle={{ maxWidth: '600px' }}
                    >
                      <Button
                        type="text"
                        icon={<InfoCircleOutlined />}
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        size="small"
                      />
                    </Tooltip>
                  </div>
                  
                  {/* 产品规格 */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    {width && (
                      <div className="flex items-center">
                        <span className="text-gray-500 w-16">宽度:</span>
                        <span className="font-medium text-gray-900">
                          {width} {isImperialUnit ? 'inch' : 'cm'}
                        </span>
                      </div>
                    )}
                    {ribCount && (
                      <div className="flex items-center">
                        <span className="text-gray-500 w-16">筋数:</span>
                        <span className="font-medium text-gray-900">{ribCount}</span>
                      </div>
                    )}
                    {reinforcement && (
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20">Reinforcement:</span>
                        <span className="font-medium text-gray-900">{reinforcement}</span>
                      </div>
                    )}
                    {basisWeight && (
                      <div className="flex items-center">
                        <span className="text-gray-500 w-16">克重:</span>
                        <span className="font-medium text-gray-900">
                          {basisWeight} {isImperialUnit ? '#' : 'gsm'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 库存状态 */}
                  <div className="mb-4">
                    <Tag 
                      color={stockStatus.color}
                      className="px-3 py-1 text-xs font-medium"
                    >
                      {stockStatus.status}
                    </Tag>
                    {currentInventory > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        库存: {currentInventory}
                      </span>
                    )}
                  </div>
                  
                  {/* 价格层级显示 */}
                  {item.pricing && item.pricing.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">价格层级:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.pricing.slice(0, 3).map((tier, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {(tier as any).min_quantity || 1}+: {getCurrencySymbolByRegion()}{tier.price}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 右列：价格和操作 (1/4) */}
                <div className="w-1/4 p-6 flex flex-col justify-between">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {getCurrencySymbolByRegion()}{getRegionalPrice(item, quantities[item.id] || 1).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      总价 (x{quantities[item.id] || 1})
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      单价: {getCurrencySymbolByRegion()}{(item.pricing?.[0]?.price || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  {/* 数量选择器 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        size="small"
                        onClick={() => handleQuantityChange(item.id, Math.max(1, (quantities[item.id] || 1) - 1))}
                        disabled={isOutOfStock || (quantities[item.id] || 1) <= 1}
                        className="w-8 h-8 flex items-center justify-center p-0"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {quantities[item.id] || 1}
                      </span>
                      <Button
                        size="small"
                        onClick={() => handleQuantityChange(item.id, Math.min(currentInventory, (quantities[item.id] || 1) + 1))}
                        disabled={isOutOfStock || (quantities[item.id] || 1) >= currentInventory}
                        className="w-8 h-8 flex items-center justify-center p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="space-y-2">
                    <SmartAddToCartButton
                      product={item as unknown as ExtendedCartItem}
                      productType="consumables"
                      onAddToCart={() => addToCart(item.id)}
                      disabled={isOutOfStock}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ShoppingCartOutlined className="mr-2" />
                      {isOutOfStock ? '缺货' : '加入购物车'}
                    </SmartAddToCartButton>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">产品线3 - 胶带机耗材</h1>
              <p className="text-gray-600 mt-1">为您的胶带机选择合适的耗材</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                单位制: {isImperialUnit ? '英制' : '公制'}
              </div>
              <span className="text-sm text-gray-500">
                共 {totalItems} 个产品
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选器 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FilterOutlined className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">产品筛选</h3>
                  <p className="text-sm text-gray-600">选择适用机型、宽度、筋数、Reinforcement和克重</p>
                </div>
              </div>
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleResetFilters}
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                重置筛选
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            {renderFilters()}
          </div>
        </div>
        
        {/* 产品列表 */}
        {renderConsumablesList()}
        
        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* 产品详情模态框 */}
      <Modal
        title="产品详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex gap-6">
              <img
                src={selectedProduct.image_url || ASSETS.PRODUCTS.PLACEHOLDER}
                alt={selectedProduct.name}
                className="w-48 h-48 object-cover rounded-lg"
                onError={handleImageError}
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-4">{selectedProduct.specs?.material || ''}</p>
                <div className="space-y-2">
                  <div>价格: {getCurrencySymbolByRegion()}{(selectedProduct.pricing?.[0]?.price || 0).toFixed(2)}</div>
                  <div>库存: {getRegionInventory(selectedProduct, userRegion)}</div>
                  <div>适用机型: {selectedProduct.app_model}</div>
                  {(selectedProduct as any).width && (
                    <div>宽度: {(selectedProduct as any)[`width${isImperialUnit ? '_imp' : '_met'}`] || (selectedProduct as any).width} {isImperialUnit ? 'inch' : 'cm'}</div>
                  )}
                  {(selectedProduct as any).rib_count && (
                    <div>筋数: {(selectedProduct as any).rib_count}</div>
                  )}
                  {(selectedProduct as any).reinforcement && (
                    <div>Reinforcement: {(selectedProduct as any).reinforcement}</div>
                  )}
                  {(selectedProduct as any).basis_weight && (
                    <div>克重: {(selectedProduct as any)[`basis_weight${isImperialUnit ? '_imp' : '_met'}`] || (selectedProduct as any).basis_weight} {isImperialUnit ? '#' : 'gsm'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductLine3ConsumablesPage; 