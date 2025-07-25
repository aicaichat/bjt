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
import ProductTypeCard from '../../components/Consumables/ProductTypeCard';

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

// 导入样式文件
import './Consumables.css';
import './consumables.scss';

// 添加tooltip相关的工具函数
function cleanImageUrl(url: string | undefined | null): string {
  if (!url) return ASSETS.PRODUCTS.PLACEHOLDER;
  
  // 移除可能的控制字符
  const cleanUrl = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // 如果是相对路径，转换为绝对路径
  if (cleanUrl.startsWith('/')) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    return `${baseUrl}${cleanUrl}`;
  }
  
  return cleanUrl;
}

const isPaperMaterial = (materialId: string): boolean => {
  const paperMaterials = ['paper', 'kraft', 'cardboard', '纸', '牛皮纸', '纸板'];
  return paperMaterials.some(material => 
    materialId.toLowerCase().includes(material.toLowerCase())
  );
};

// Tooltip组件接口
interface ConsumableTooltipContentProps {
  item: ConsumableProduct;
  userRegion: string;
}

// Tooltip字段组件
const TooltipField = ({ fieldKey, label, value }: { fieldKey: string; label: string; value: string }) => {
  const isNumeric = !isNaN(Number(value)) && value !== '';
  
  return (
    <div className="tooltip-field" data-field={fieldKey}>
      <div className="tooltip-field-label">{label}</div>
      <div className={`tooltip-field-value ${isNumeric ? 'numeric' : 'text'}`} data-field-type={isNumeric ? 'numeric' : 'text'}>
        {value}
      </div>
    </div>
  );
};

// 主要的Tooltip内容组件
const ConsumableTooltipContent: React.FC<ConsumableTooltipContentProps> = ({ item, userRegion }) => {
  const { t, i18n } = useTranslation(['consumables', 'common']);
  const { user, getPreferredUnit } = useAuth();
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 获取用户偏好单位制
  const preferredUnit = getPreferredUnit();
  const isImperialUnit = preferredUnit === 'imperial';
  
  // 获取详细数据
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!item.id) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const apiUrl = `${baseUrl}/consumables/${item.id}`;
        
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
        console.log('🔍 Tooltip详细数据:', data);
        
        if (data.success && data.data) {
          setDetailData(data.data);
        } else if (data.id) {
          setDetailData(data);
        }
      } catch (error) {
        console.error('❌ 获取tooltip详细数据失败:', error);
        // 使用原始数据作为备用
        setDetailData(item);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetailData();
  }, [item.id]);
  
  // 使用详细数据或原始数据
  const displayData = detailData || item;
  
  // 安全获取字段值的函数
  const safeGet = (field: string, fallback: string = 'N/A'): string => {
    const value = displayData?.[field];
    
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    const stringValue = String(value).trim();
    
    if (stringValue === '' || stringValue === 'null' || stringValue === 'undefined') {
      return fallback;
    }
    
    return stringValue;
  };
  
  // 判断是否应该显示气泡直径
  const shouldShowBubbleDiameter = (): boolean => {
    const material = safeGet('material', '').toLowerCase();
    return material.includes('bubble') || material.includes('气泡');
  };
  
  // 判断是否应该显示某个字段
  const shouldShowField = (fieldName: string): boolean => {
    const value = safeGet(fieldName, '');
    return value !== 'N/A' && value !== '' && value !== '0';
  };
  
  if (loading) {
    return (
      <div className="consumable-tooltip loading">
        <div className="tooltip-header">
          <div className="product-image">
            <img src={cleanImageUrl(item.image_url)} alt={item.name} />
          </div>
          <div className="product-title">
            <h4>{item.name}</h4>
            <div className="product-code">{item.code || item.id}</div>
          </div>
        </div>
        <div className="tooltip-content-grid">
          <div className="loading-content">
            <Spin size="small" />
            <span>加载详细信息...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consumable-tooltip">
      {/* 产品标题和图片 */}
      <div className="tooltip-header">
        <div className="product-image">
          <img 
            src={cleanImageUrl(displayData.image_url)} 
            alt={displayData.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = ASSETS.PRODUCTS.PLACEHOLDER;
            }}
          />
        </div>
        <div className="product-title">
          <h4>{displayData.name}</h4>
          <div className="product-code">{displayData.code || displayData.id}</div>
        </div>
      </div>

      {/* 字段网格布局 - 重新设计为紧凑布局 */}
      <div className="tooltip-content-grid">
        {/* 左栏：核心规格信息 */}
        <div className="left-column">
          {/* 核心规格信息 - 最重要，放在最上方 */}
          <div className="specs-summary-card">
            <h5 className="section-title">
              <span className="title-icon">📐</span>
              {t('tooltip.coreSpecs', 'Core Specifications')}
            </h5>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">{t('tooltip.material', 'Material')}</span>
                <span className="spec-value">{safeGet('material', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">
                  {isPaperMaterial(safeGet('material', ''))
                    ? (
                        isImperialUnit
                          ? t('tooltip.weight.imperial', 'Basis Weight(lb)')
                          : t('tooltip.weight.metric', 'Basis Weight(gsm)')
                      )
                    : (
                        isImperialUnit
                          ? t('tooltip.thickness.imperial', 'Thickness(mil)')
                          : t('tooltip.thickness.metric', 'Thickness(μm)')
                      )}
                </span>
                <span className="spec-value">
                  {(() => {
                    if (isImperialUnit) {
                      const thicknessImp = safeGet('thickness_imp', '');
                      const thickness = safeGet('thickness', '');
                      return thicknessImp !== 'N/A' && thicknessImp !== '' ? thicknessImp : 
                             (thickness !== 'N/A' && thickness !== '' ? thickness : 'N/A');
                    } else {
                      const thicknessMet = safeGet('thickness_met', '');
                      const thickness = safeGet('thickness', '');
                      return thicknessMet !== 'N/A' && thicknessMet !== '' ? thicknessMet : 
                             (thickness !== 'N/A' && thickness !== '' ? thickness : 'N/A');
                    }
                  })()}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">
                  {isImperialUnit ? 
                    t('tooltip.dimensions.imperial', 'Dimensions(inch)') : 
                    t('tooltip.dimensions.metric', 'Dimensions(cm)')
                  }
                </span>
                <span className="spec-value">
                  {(() => {
                    const width = isImperialUnit ? 
                      safeGet('width_imp', safeGet('width', '')) : 
                      safeGet('width_met', safeGet('width', ''));
                    const length = isImperialUnit ? 
                      safeGet('length_imp', safeGet('length', '')) : 
                      safeGet('length_met', safeGet('length', ''));
                    
                    if (width !== 'N/A' && length !== 'N/A' && width !== '' && length !== '') {
                      return `${width} × ${length}`;
                    } else if (width !== 'N/A' && width !== '') {
                      return `W: ${width}`;
                    } else if (length !== 'N/A' && length !== '') {
                      return `L: ${length}`;
                    }
                    return 'N/A';
                  })()}
                </span>
              </div>
              {shouldShowBubbleDiameter() && (
                <div className="spec-item">
                  <span className="spec-label">
                    {isImperialUnit ? 
                      t('tooltip.bubbleDiameter.imperial', 'Bubble Diameter(inch)') : 
                      t('tooltip.bubbleDiameter.metric', 'Bubble Diameter(cm)')
                    }
                  </span>
                  <span className="spec-value">
                    {(() => {
                      if (isImperialUnit) {
                        const bubbleDiameterImp = safeGet('bubble_diameter_imp', '');
                        const bubbleDiameter = safeGet('bubble_diameter', '');
                        return bubbleDiameterImp !== 'N/A' && bubbleDiameterImp !== '' ? bubbleDiameterImp : 
                               (bubbleDiameter !== 'N/A' && bubbleDiameter !== '' ? bubbleDiameter : 'N/A');
                      } else {
                        const bubbleDiameterMet = safeGet('bubble_diameter_met', '');
                        const bubbleDiameter = safeGet('bubble_diameter', '');
                        return bubbleDiameterMet !== 'N/A' && bubbleDiameterMet !== '' ? bubbleDiameterMet : 
                               (bubbleDiameter !== 'N/A' && bubbleDiameter !== '' ? bubbleDiameter : 'N/A');
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 托盘配置信息 - 简化显示 */}
          <div className="pallet-configs-card">
            <h5 className="section-title">
              <span className="title-icon">🏗️</span>
              {t('tooltip.palletConfigs', 'Pallet Configurations')}
            </h5>
            <div className="pallet-configs-compact">
              {/* 配置A */}
              {(() => {
                const pcsA = safeGet('pcs_per_pallet_a', '');
                const weightA = safeGet(isImperialUnit ? 'pallet_gross_weight_a_lbs' : 'pallet_gross_weight_a_kg', '');
                const heightA = safeGet(isImperialUnit ? 'pallet_height_a_inch' : 'pallet_height_a_cm', '');
                
                if (pcsA !== 'N/A' && pcsA !== '' && weightA !== 'N/A' && weightA !== '') {
                  const rollsLabel = t('tooltip.units.rolls');
                  const weightLabel = t('tooltip.units.weight');
                  const heightLabel = t('tooltip.units.height');
                  const weightUnit = isImperialUnit ? 'lb' : 'kg';
                  const heightUnit = isImperialUnit ? 'inch' : 'cm';
                  
                  // 格式化数值
                  const formattedWeight = weightA ? parseFloat(weightA).toFixed(2) : 'N/A';
                  const formattedHeight = heightA ? parseFloat(heightA).toFixed(2) : 'N/A';
                  
                  return (
                    <div className="pallet-config-row">
                      <span className="config-label">{t('tooltip.configA', 'Configuration A')}</span>
                      <div className="config-values">
                        <span className="config-item">
                          <span className="config-value">{pcsA}</span> <span className="config-unit">rolls</span>
                        </span>
                        <span className="config-item">
                          <span className="config-value">{formattedWeight}</span> <span className="config-unit">{weightUnit}</span>
                        </span>
                        {heightA !== 'N/A' && heightA !== '' && (
                          <span className="config-item">
                            <span className="config-value">{formattedHeight}</span> <span className="config-unit">{heightUnit}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* 配置B */}
              {(() => {
                const pcsB = safeGet('pcs_per_pallet_b', '');
                const weightB = safeGet(isImperialUnit ? 'pallet_gross_weight_b_lbs' : 'pallet_gross_weight_b_kg', '');
                const heightB = safeGet(isImperialUnit ? 'pallet_height_b_inch' : 'pallet_height_b_cm', '');
                
                if (pcsB !== 'N/A' && pcsB !== '' && weightB !== 'N/A' && weightB !== '') {
                  const weightUnit = isImperialUnit ? 'lb' : 'kg';
                  const heightUnit = isImperialUnit ? 'inch' : 'cm';
                  
                  // 格式化数值
                  const formattedWeight = weightB ? parseFloat(weightB).toFixed(2) : 'N/A';
                  const formattedHeight = heightB ? parseFloat(heightB).toFixed(2) : 'N/A';
                  
                  return (
                    <div className="pallet-config-row">
                      <span className="config-label">{t('tooltip.configB', 'Configuration B')}</span>
                      <div className="config-values">
                        <span className="config-item">
                          <span className="config-value">{pcsB}</span> <span className="config-unit">rolls</span>
                        </span>
                        <span className="config-item">
                          <span className="config-value">{formattedWeight}</span> <span className="config-unit">{weightUnit}</span>
                        </span>
                        {heightB !== 'N/A' && heightB !== '' && (
                          <span className="config-item">
                            <span className="config-value">{formattedHeight}</span> <span className="config-unit">{heightUnit}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* 右栏：包装信息和技术参数 */}
        <div className="right-column">
          {/* 包装信息 */}
          <div className="package-info-card">
            <h5 className="section-title">
              <span className="title-icon">📦</span>
              {t('tooltip.packageInfo', 'Package Information')}
            </h5>
            <div className="package-details">
              <div className="package-row">
                <span className="package-label">{t('tooltip.packageType', 'Package Type')}</span>
                <span className="package-value">{safeGet('package_type', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
              <div className="package-row">
                <span className="package-label">
                  {isImperialUnit ? 
                    t('tooltip.rollLength.imperial', 'Roll Length(ft)') : 
                    t('tooltip.rollLength.metric', 'Roll Length(m)')
                  }
                </span>
                <span className="package-value">
                  {isImperialUnit ? 
                    safeGet('roll_length_ft', safeGet('roll_length', '')) : 
                    safeGet('roll_length_m', safeGet('roll_length', ''))
                  }
                </span>
              </div>
              <div className="package-row">
                <span className="package-label">{t('tooltip.rollsPerCase', 'Rolls per Case')}</span>
                <span className="package-value">{safeGet('rolls_per_case', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
              <div className="package-row">
                <span className="package-label">
                  {isImperialUnit ? 
                    t('tooltip.caseWeight.imperial', 'Case Weight(lb)') : 
                    t('tooltip.caseWeight.metric', 'Case Weight(kg)')
                  }
                </span>
                <span className="package-value">
                  {isImperialUnit ? 
                    safeGet('case_weight_lbs', safeGet('case_weight', '')) : 
                    safeGet('case_weight_kg', safeGet('case_weight', ''))
                  }
                </span>
              </div>
            </div>
          </div>

          {/* 技术参数 */}
          <div className="tech-params-card">
            <h5 className="section-title">
              <span className="title-icon">⚙️</span>
              {t('tooltip.techParams', 'Technical Parameters')}
            </h5>
            <div className="tech-params-compact">
              <div className="tech-param-row">
                <span className="param-label">{t('tooltip.printable', 'Printable')}</span>
                <span className="param-value">{safeGet('printable', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
              <div className="tech-param-row">
                <span className="param-label">{t('tooltip.antiStatic', 'Anti-static')}</span>
                <span className="param-value">{safeGet('anti_static', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
              <div className="tech-param-row">
                <span className="param-label">{t('tooltip.temperature', 'Temperature Range')}</span>
                <span className="param-value">{safeGet('temperature_range', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
              <div className="tech-param-row">
                <span className="param-label">{t('tooltip.shelfLife', 'Shelf Life')}</span>
                <span className="param-value">{safeGet('shelf_life', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 产品线2耗材页面
const ProductLine2ConsumablesPage: React.FC = () => {
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
  
  // 筛选状态 - 产品线2特有：只有产品类型和适用机型
  const [selectedProductType, setSelectedProductType] = useState<string>('ALL');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  
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
  
  // 根据产品特征确定功能分类
  const getProductFunctionType = (item: ConsumableProduct): string => {
    const material = (item.specs?.material || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const productType = (item as any).product_type || '';
    
    // 填充类产品
    if (material.includes('填充') || name.includes('填充') || 
        material.includes('void') || name.includes('void') ||
        material.includes('碎纸') || name.includes('碎纸') ||
        productType.includes('VOID_FILL') || productType.includes('SHREDDED')) {
      return 'FILLING';
    }
    
    // 缓冲类产品
    if (material.includes('缓冲') || name.includes('缓冲') ||
        material.includes('蜂窝') || name.includes('蜂窝') ||
        material.includes('皱纹') || name.includes('皱纹') ||
        material.includes('honeycomb') || name.includes('honeycomb') ||
        material.includes('crinkle') || name.includes('crinkle') ||
        productType.includes('HONEYCOMB') || productType.includes('CRINKLE')) {
      return 'CUSHIONING';
    }
    
    // 包裹类产品
    if (material.includes('包裹') || name.includes('包裹') ||
        material.includes('牛皮纸') || name.includes('牛皮纸') ||
        material.includes('kraft') || name.includes('kraft') ||
        material.includes('折叠') || name.includes('折叠') ||
        material.includes('fanfold') || name.includes('fanfold') ||
        productType.includes('KRAFT') || productType.includes('FANFOLD')) {
      return 'WRAPPING';
    }
    
    // 默认根据其他特征判断
    if (material.includes('纸垫') || material.includes('纸板') || 
        material.includes('瓦楞') || material.includes('薄纸') ||
        productType.includes('PAPER') || productType.includes('CARDBOARD') ||
        productType.includes('CORRUGATED') || productType.includes('TISSUE')) {
      return 'WRAPPING';
    }
    
    // 默认返回填充类
    return 'FILLING';
  };
  
  // 筛选后的耗材数据
  const filteredConsumables = useMemo(() => {
    if (!allConsumables?.length) {
      return [];
    }
    
    const normalize = (v: any) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');
    
    return allConsumables.filter((item) => {
      // 1. 适用机型筛选
      if (selectedModel !== 'all') {
        const appModels = (item.app_model || '').split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
        const matches = appModels.some(m => normalize(m) === normalize(selectedModel));
        if (!matches) {
          return false;
        }
      }
      
      // 2. 产品功能类型筛选
      if (selectedProductType !== 'ALL') {
        const itemFunctionType = getProductFunctionType(item);
        if (itemFunctionType !== selectedProductType) {
          return false;
        }
      }
      
      return true;
    });
  }, [allConsumables, selectedModel, selectedProductType]);
  
  // 获取API数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const apiUrl = `${baseUrl}/consumables?page=1&per_page=1000&status=publish&product_line=2`;
        
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
  const handleProductTypeChange = (type: string) => {
    setSelectedProductType(type);
    setCurrentPage(1);
  };
  
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setCurrentPage(1);
  };
  
  const handleResetFilters = () => {
    setSelectedProductType('ALL');
    setSelectedModel('all');
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
  
  // 获取区域价格
  const getRegionalPrice = (product: ConsumableProduct, quantity: number): number => {
    const pricing = product.pricing?.[0];
    if (!pricing) return 0;
    
    // 简化价格计算，直接返回基础价格
    return pricing.price || 0;
  };

  // 处理图片加载错误
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = ASSETS.PRODUCTS.PLACEHOLDER;
  };

  // 添加购物车功能
  const addToCart = async (itemId: string, buttonElement?: HTMLElement) => {
    const item = consumables.find(c => c.id === itemId);
    if (!item) return;
    
    const quantity = quantities[itemId] || 1;
    
    try {
      await addItem({
        id: item.id,
        name: item.name,
        price: item.pricing?.[0]?.price || 0,
        quantity: quantity,
        image: item.image_url || ASSETS.PRODUCTS.PLACEHOLDER,
        type: 'consumable' as const,
        code: item.code || item.id,
        partNumber: item.part_number || item.id,
        category: 'consumables',
        productId: parseInt(item.id) || 0,
        inventory: Array.isArray(item.inventory) ? item.inventory : [],
        pricing: Array.isArray(item.pricing) ? item.pricing : [],
        // ExtendedCartItem必需字段
        priceTiers: [],
        selected: false,
        product_type: 'consumable' as const,
        product: item
      });
      
      success(`${item.name} 已添加到购物车`);
      
      // 购物车动画效果
      if (buttonElement) {
        // 这里可以添加动画效果
      }
    } catch (error) {
      console.error('添加到购物车失败:', error);
      showErrorToast('添加到购物车失败，请重试');
    }
  };

  // 获取库存状态
  const getStockStatus = (quantity: number) => {
    if (quantity > 10) return { status: '库存充足', color: 'green' };
    if (quantity > 0) return { status: '库存紧张', color: 'orange' };
    return { status: '暂时缺货', color: 'red' };
  };

  // 获取区域库存
  const getRegionInventory = (product: ConsumableProduct, region: string): number => {
    return product.inventory?.[region] || 0;
  };

  // 渲染产品类型筛选器
  const renderProductTypeFilter = () => {
    const counts = {
      ALL: allConsumables.length,
      FILLING: allConsumables.filter(item => getProductFunctionType(item) === 'FILLING').length,
      CUSHIONING: allConsumables.filter(item => getProductFunctionType(item) === 'CUSHIONING').length,
      WRAPPING: allConsumables.filter(item => getProductFunctionType(item) === 'WRAPPING').length,
    };

    const productTypes = [
      { value: 'ALL', label: t('productLine2.filter.allTypes'), image: '' },
      { value: 'FILLING', label: t('productLine2.filter.filling'), image: '/images/product-types/fill.png' },
      { value: 'CUSHIONING', label: t('productLine2.filter.cushioning'), image: '/images/product-types/cushion.png' },
      { value: 'WRAPPING', label: t('productLine2.filter.wrapping'), image: '/images/product-types/wrap.png' },
    ];

    return (
      <div className="flex flex-wrap gap-6">
        {productTypes.map(pt => (
          <ProductTypeCard
            key={pt.value}
            value={pt.value}
            label={pt.label}
            count={counts[pt.value as keyof typeof counts] || 0}
            imageSrc={pt.image}
            selected={selectedProductType === pt.value}
            onSelect={handleProductTypeChange}
          />
        ))}
      </div>
    );
  };

  // 渲染适用机型筛选器
  const renderModelFilter = () => {
    const models = [
      { 
        value: 'all', 
        label: t('productLine2.filter.allModels'), 
        image: '',
        description: t('productLine2.filter.allModelsDesc', '全部机型')
      },
      { 
        value: 'P100', 
        label: 'P100系列', 
        image: '/images/product-models/p100.png',
        description: '入门级纸垫机'
      },
      { 
        value: 'P200', 
        label: 'P200系列', 
        image: '/images/product-models/p200.png',
        description: '标准型纸垫机'
      },
      { 
        value: 'P300', 
        label: 'P300系列', 
        image: '/images/product-models/p300.png',
        description: '专业级纸垫机'
      },
      { 
        value: 'P400', 
        label: 'P400系列', 
        image: '/images/product-models/p400.png',
        description: '高端型纸垫机'
      },
      { 
        value: 'P500', 
        label: 'P500系列', 
        image: '/images/product-models/p500.png',
        description: '旗舰级纸垫机'
      },
    ];

    // 获取当前选中的型号信息
    const selectedModelInfo = models.find(model => model.value === selectedModel);

    return (
      <div className="model-filter-section mb-6">
        <label className="mb-3 text-base font-semibold text-gray-700 block">
          {t('productLine2.filter.compatibleModel')}
        </label>
        
        {/* 下拉框选择器 */}
        <div className="mb-6">
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            className="w-full max-w-md"
            size="large"
            placeholder="请选择适用机型"
            style={{ fontSize: '16px' }}
          >
            {models.map(model => (
              <Select.Option key={model.value} value={model.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.label}</span>
                  {model.description && model.value !== 'all' && (
                    <span className="text-gray-500 text-sm">{model.description}</span>
                  )}
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 选中型号的图片展示 */}
        {selectedModelInfo && selectedModelInfo.image && selectedModel !== 'all' && (
          <div className="selected-model-display bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 shadow-md transition-all duration-300">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={selectedModelInfo.image}
                    alt={selectedModelInfo.label}
                    className="w-40 h-40 object-contain rounded-xl bg-white shadow-lg border-2 border-white transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/product-models/placeholder.png';
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    ✓
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    已选择
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedModelInfo.label}
                </h3>
                <p className="text-gray-600 text-lg mb-4">
                  {selectedModelInfo.description}
                </p>
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium">
                    显示适用于此机型的耗材产品
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染耗材产品列表 - 使用与产品线1一致的布局
  const renderConsumablesList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <LoadingState 
            size="large" 
            text="正在加载产品数据..." 
            type="spinner"
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="text-red-500 text-4xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">数据加载失败</h3>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <Button 
            type="primary"
            onClick={() => window.location.reload()} 
            className="flex items-center px-6 py-3 shadow-lg"
          >
            <ReloadOutlined className="mr-2" />
            重新加载
          </Button>
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
          const userRegion = user?.region || 'CN';
          const stockStatus = getStockStatus(getRegionInventory(item, userRegion));
          const totalStock = Object.values(item.inventory || {}).reduce((sum, qty) => sum + (qty || 0), 0);
          
          return (
            <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* 产品图片 */}
                  <div className="lg:w-1/4 flex-shrink-0">
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-inner">
                      <img
                        src={item.image_url || ASSETS.PRODUCTS.PLACEHOLDER}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                    </div>
                  </div>
                  
                  {/* 产品信息 */}
                  <div className="lg:w-1/2 flex-1">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.name}</h3>
                      <p className="text-gray-600 text-base leading-relaxed">{(item as any).description || item.specs?.material || ''}</p>
                    </div>

                    {/* 产品规格信息 - 使用与产品线1一致的样式 */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600 font-medium">材质</span>
                          <span className="text-gray-900 font-semibold">{item.specs?.material || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600 font-medium">适用机型</span>
                          <span className="text-gray-900 font-semibold">{item.app_model || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 更多信息按钮 */}
                    <div>
                      <Tooltip
                        title={<ConsumableTooltipContent item={item} userRegion={userRegion} />}
                        placement="topRight"
                        classNames={{ tooltip: "consumables-custom-tooltip" }}
                        color="white"
                        arrow={false}
                        trigger="hover"
                        destroyOnHidden={false}
                        mouseEnterDelay={0.1}
                        mouseLeaveDelay={0.1}
                        styles={{
                          root: {
                            maxWidth: 'min(600px, 90vw)',
                            zIndex: 10000
                          }
                        }}
                      >
                        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200 font-medium text-sm">
                          <InfoCircleOutlined className="mr-2" />
                          查看详细规格
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* 价格与操作区域 */}
                  <div className="lg:w-1/4 flex flex-col justify-between">
                    {/* 价格展示 */}
                    <div className="mb-4">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-600 mb-1">起始价格</div>
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {getCurrencySymbolByRegion()}{(item.pricing?.[0]?.price || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">最低订购量</div>
                      </div>

                      {/* 梯级价格表 */}
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-medium text-gray-700 mb-2 sticky top-0 bg-gray-50">价格阶梯</div>
                        {item.pricing?.slice(0, 3).map((price, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">{price.range || `${idx + 1}+`}</span>
                            <span className="font-bold text-green-600">
                              {getCurrencySymbolByRegion()}{(price.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 库存信息 */}
                    <div className={`stock-info ${stockStatus.color === 'green' ? 'high-stock' : stockStatus.color === 'orange' ? 'low-stock' : 'out-stock'} mb-4`}>
                      <div className="stock-header">
                        <span className="stock-label">库存状态</span>
                        <span className="stock-status-text">
                          {stockStatus.color === 'green' ? '✓ 充足' : 
                           stockStatus.color === 'orange' ? '⚠ 紧张' : 
                           '✗ 缺货'}
                        </span>
                      </div>
                      <div className="stock-details">
                        <div className="total-stock">
                          总库存: <span className="stock-number">{totalStock}</span>
                        </div>
                      </div>
                    </div>

                    {/* 购买操作 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-0 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex-1">
                          <button 
                            onClick={() => handleQuantityChange(item.id, Math.max(1, (quantities[item.id] || 1) - 1))}
                            disabled={(quantities[item.id] || 1) <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 border-r border-gray-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input 
                            type="number" 
                            min="1" 
                            value={quantities[item.id] || 1} 
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="flex-1 text-center border-0 py-1 text-sm focus:ring-0 focus:outline-none bg-white text-gray-900"
                          />
                          <button 
                            onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 border-l border-gray-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <SmartAddToCartButton
                          product={item}
                          productType="consumables"
                          onAddToCart={() => addToCart(item.id)}
                          disabled={false}
                          className="w-full h-12 font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                          <ShoppingCartOutlined className="mr-2" />
                          {t('productLine2.buttons.addToCart')}
                        </SmartAddToCartButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('productLine2.title')}</h1>
              <p className="text-gray-600 mt-1">{t('productLine2.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {t('productLine2.totalProducts', { count: totalItems })}
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
                  <h3 className="text-lg font-semibold text-gray-900">{t('productLine2.filter.title')}</h3>
                  <p className="text-sm text-gray-600">{t('productLine2.filter.description')}</p>
                </div>
              </div>
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleResetFilters}
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                {t('productLine2.filter.reset')}
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-8">
            {/* 产品类型筛选器 */}
            <div className="product-type-section">
              <label className="mb-3 text-base font-semibold text-gray-700 block">
                {t('productLine2.filter.productType')}
              </label>
              {renderProductTypeFilter()}
            </div>
            
            {/* 适用机型筛选器 */}
            {renderModelFilter()}
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
                type="default"
                icon={<span>&lt;</span>}
              >
                {t('productLine2.pagination.previous')}
              </Button>
              
              <span className="text-sm text-gray-600">
                {t('productLine2.pagination.pageInfo', { current: currentPage, total: totalPages })}
              </span>
              
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                type="default"
                icon={<span>&gt;</span>}
              >
                {t('productLine2.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* 产品详情模态框 */}
      <Modal
        title={t('productLine2.productDetails.title')}
        open={detailModalVisible}
        onCancel={closeDetailModal}
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
                <p className="text-gray-600 mb-4">{(selectedProduct as any).description || selectedProduct.specs?.material || ''}</p>
                <div className="space-y-2">
                  <div>{t('productLine2.productDetails.price')}: {getCurrencySymbolByRegion()}{(selectedProduct.pricing?.[0]?.price || 0).toFixed(2)}</div>
                  <div>{t('productLine2.productDetails.inventory')}: {getRegionInventory(selectedProduct, userRegion)}</div>
                  <div>{t('productLine2.productDetails.compatibleModel')}: {selectedProduct.app_model}</div>
                  <div>{t('productLine2.productDetails.material')}: {selectedProduct.specs?.material || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductLine2ConsumablesPage; 