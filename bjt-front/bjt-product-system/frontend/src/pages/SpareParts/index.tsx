import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Button, Input, Select, Spin, Alert, Card, Row, Col, Tag, Space, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { ASSETS } from '../../config/appConfig';
import { API_BASE_URL } from '../../api/config';
import { parseRequiredParts } from '../../utils/requiredPartsUtils';
// 🆕 统一产品名称工具
import { getSimpleProductName } from '../../utils/simpleProductName';

// 导入现代化UI组件
import { 
  LoadingState, 
  ConfirmDialog, 
  CartAnimation, 
  useToastNotifications 
} from '../../components/ui';

// 🎯 导入智能购物车组件
import { SmartAddToCartButton } from '../../components/Cart/SmartAddToCartButton';

// 导入必选备件显示组件
import { RequiredPartsDisplay } from '../../components/RequiredPartsDisplay';

// 导入备件详细信息Tooltip组件
import { SparePartTooltip } from '../../components/SparePartTooltip';

// 导入格式化工具函数
import { 
  formatCompositeDimension, 
  formatConsumableStatus, 
  formatWeight, 
  formatQuantity, 
  formatAppModel, 
  safeStringRender 
} from '../../utils/formatUtils';

// 导入筛选验证工具
import { filterValidationService } from '../../utils/filterValidation';

// 导入独立的筛选调试工具
// import { debugFilter, quickDataOverview, filterDebugger } = useDebugFilter('/wp-json/bjt/v1/spare-parts');

// 导入SQL Mock数据服务
import { useSpareParts } from '../../hooks/useMockData';
import MockServiceStatus from '../../components/MockServiceStatus';

// 导入类型定义
import { SparePart } from '../../types/spareParts';
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

// 定义本地过滤选项接口，兼容旧代码
interface LocalFilterOptions {
  accessoryModels: string[];
  partTypes: Array<{ id: string; name: string; }>;
}

// 定义过滤选项接口别名以兼容代码
type SparePartsFilterOptions = LocalFilterOptions;

// 添加缺失的状态变量
const SparePartsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['spareParts', 'translation']);
  
  // 获取当前语言
  const currentLanguage = i18n.language || 'zh';
  
  // 统一名称显示将在真正渲染时用 <ProductName /> 组件完成，逻辑层不再调用工具函数。
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 使用 useAuth hook 获取用户偏好单位制
  const { user, getPreferredUnit } = useAuth();
  
  // 创建兼容的 currentUser 对象，基于 useAuth 的 user
  const currentUser = user ? {
    id: user.id || 'guest',
    username: user.username || 'Guest User',
    role: user.role || 'customer',
    discount: user.role === 'partner' ? 0.85 : user.role === 'admin' ? 0.8 : 0.9,
    name: user.username || 'Guest User',
    email: user.email || '',
    region: user.region || 'cn'
  } : {
    id: 'guest',
    username: 'Guest User',
    role: 'customer',
    discount: 0.9,
    name: 'Guest User',
    email: '',
    region: 'cn'
  };
  
  // 使用useCallback稳定回调函数引用
  const handleSparePartsSuccess = useCallback((data: any) => {
    console.log('✅ Spare parts page data loaded successfully:', data);
  }, []);
  
  const handleSparePartsError = useCallback((error: string) => {
    console.error('❌ Spare parts page data loading failed:', error);
  }, []);
  
  // SQL Mock数据服务Hook
  const { 
    data: mockSparePartsData, 
    loading: mockLoading, 
    error: mockError 
  } = useSpareParts({
    page: 1,
    pageSize: 20,
    search: ''
  }, {
    onSuccess: handleSparePartsSuccess,
    onError: handleSparePartsError
  });
  
  // Get cart context
  const { items, addItem, removeItem, clearCart, updateQuantity } = useContext(CartContext);
  
  // 状态管理
  const [showCartModal, setShowCartModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [currentProductType, setCurrentProductType] = useState('all'); // 修复：初始值改为'all'，不应用筛选
  const [selectedModel, setSelectedModel] = useState('');
  const [activeNotification, setActiveNotification] = useState<HTMLDivElement | null>(null);
  const [notificationTimeout, setNotificationTimeout] = useState<Timeout | null>(null);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  
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
  
  // 用户数据状态
  // const [currentUser, setCurrentUser] = useState({
  //   id: '',
  //   username: '',
  //   role: 'customer',
  //   discount: 0.9,
  //   name: '',
  //   email: '',
  //   region: 'cn'
  // });
  
  // API数据状态
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<SparePartsFilterOptions | null>(null);
  // 定义易耗类型状态：null=全部，1=易耗，2=非易耗
  const [selectedIsConsumable, setSelectedIsConsumable] = useState<number | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize] = useState<number>(50); // 每页显示数量
  
  // 添加产品类型和型号过滤选项状态
  const [productTypes, setProductTypes] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: String(t('filters.allProductTypes', { ns: 'spareParts' }) || '全部产品类型') }
  ]);
  
  // 分开管理主机型号和配件型号
  const [hostModels, setHostModels] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }
  ]);
  const [accessoryModels, setAccessoryModels] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }
  ]);
  
  // 当前显示的型号列表（根据产品类型动态切换）
  const [currentModels, setCurrentModels] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }
  ]);
  
  // 添加tooltip状态管理
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedSparePartForTooltip, setSelectedSparePartForTooltip] = useState<SparePart | null>(null);
  const [isMouseTracking, setIsMouseTracking] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const authContext = useContext(AuthContext);
  // Handle the case where context might be undefined
  // const user = authContext?.user || null; // 删除这行，使用useAuth hook的user
  // 增强userRole获取逻辑，优先从useAuth hook获取
  let userRole = user?.role || 'customer';
  const userRegion = user?.region || 'EU';
  
  // 从localStorage再次验证用户角色，确保权限一致
  useEffect(() => {
    try {
      const authData = localStorage.getItem('user');
      if (authData) {
        const userData = JSON.parse(authData);
        if (userData && userData.role && userData.role !== userRole) {
          console.log(`User role inconsistency: AuthContext=${userRole}, localStorage=${userData.role}`);
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
      
      // 用户数据现在由 useAuth hook 管理，这里只做验证
      console.log('✅ User data validated from localStorage');
    } catch (err) {
      console.error('Error parsing auth data:', err);
      navigate('/login');
    }
  }, []); // Remove navigate from dependencies
  
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
  
  // 创建一个包装函数用于筛选选项重新加载
  const handleReloadFilterOptions = useCallback(() => {
    loadFilterOptions(0, 2);
  }, []);
  
  // 在组件首次渲染时从localStorage加载购物车数据并获取备件数据
  useEffect(() => {
    loadSparePartsData();
    loadFilterOptions();
    // 初始化时根据当前产品类型加载对应型号
    loadModelsForProductType(currentProductType);
  }, []);
  
  // 在产品类型变化时重新加载模型
  useEffect(() => {
    loadModelsForProductType(currentProductType);
  }, [currentProductType]);
  
  // 在组件首次渲染时进行环境检查和初始化
  useEffect(() => {
    // 初始化加载备件数据
    loadSparePartsData();
    loadFilterOptions();
  }, []);
  
  // 加载备件数据
  const loadSparePartsData = async (retryCount = 0, maxRetries = 2) => {
    console.log(`🔄 [loadSparePartsData] Starting (attempt ${retryCount + 1}/${maxRetries + 1}) - FRONTEND_FILTERING_ONLY:`, {
      strategy: 'FRONTEND_FILTERING_ONLY', // 只使用前端筛选，API不筛选
      note: '获取所有基础数据，在前端进行筛选'
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the current token
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }
      const currentToken: string = storedToken;

      const baseUrl = API_BASE_URL;
      
      // 🔧 前端筛选策略：API只获取基础数据，不传递任何筛选参数
      const queryParams = new URLSearchParams();
      queryParams.append('per_page', '1000'); // 获取足够多的数据
      queryParams.append('status', 'publish'); // 只获取已发布的数据
      queryParams.append('exclude_hidden', 'false'); // 🔧 包含隐藏备件，让前端自己筛选
      
      console.log('🔧 [loadSparePartsData] 使用纯前端筛选策略：API获取所有备件包括隐藏的');
      
      const url = `${baseUrl}/spare-parts?${queryParams.toString()}`;
      
      console.log('🔍 [loadSparePartsData] Request URL:', url);
      console.log('🔍 [loadSparePartsData] Query params (minimal):', Object.fromEntries(queryParams));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.status === 401) {
        // Token expired, redirect to login
        if (retryCount < maxRetries) {
          navigate('/login');
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      console.log('✅ [loadSparePartsData] Response received:', jsonData);
      
      // Ensure we always get an array
      let sparePartsData: SparePart[] = [];
      
      if (jsonData && Array.isArray(jsonData)) {
        sparePartsData = jsonData;
      } else if (jsonData && jsonData.success && jsonData.data && jsonData.data.items && Array.isArray(jsonData.data.items)) {
        sparePartsData = jsonData.data.items;
      } else if (jsonData && jsonData.success && jsonData.data && Array.isArray(jsonData.data)) {
        sparePartsData = jsonData.data;
      } else if (jsonData && jsonData.data && jsonData.data.items && Array.isArray(jsonData.data.items)) {
        sparePartsData = jsonData.data.items;
      } else if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
        sparePartsData = jsonData.data;
      } else if (jsonData && jsonData.data && jsonData.data.results && Array.isArray(jsonData.data.results)) {
        sparePartsData = jsonData.data.results;
      } else if (jsonData && jsonData.items && Array.isArray(jsonData.items)) {
        sparePartsData = jsonData.items;
      } else {
        sparePartsData = [];
      }
      
      console.log(`📦 [loadSparePartsData] 原始数据加载完成: ${sparePartsData.length} 条`);
      
      // 🔍 快速数据质量检查
      if (sparePartsData.length > 0) {
        const sample = sparePartsData[0];
        console.log('📋 数据样本:', {
          part_number: sample.part_number,
          name: sample.name_zh || sample.name_en,
          app_model: sample.app_model,
          is_consumable: sample.is_consumable,
          product_type: sample.product_type,
          product_line_id: sample.product_line_id
        });
        
        // 统计基础字段
        const stats = {
          withAppModel: sparePartsData.filter(p => p.app_model).length,
          isConsumableValues: {} as Record<string, number>
        };
        
        sparePartsData.forEach(part => {
          const ic = String(part.is_consumable);
          stats.isConsumableValues[ic] = (stats.isConsumableValues[ic] || 0) + 1;
        });
        
        console.log('📊 数据统计:', {
          总数: sparePartsData.length,
          有app_model: stats.withAppModel,
          is_consumable分布: stats.isConsumableValues
        });
      } else {
        console.warn('⚠️ API返回了空数据数组');
      }
      
      // 设置原始数据（未筛选）
      setSpareParts(sparePartsData);
      updateAccessoryModels(sparePartsData);
      
      // 前端分页处理（在筛选之后）
      setTotalItems(sparePartsData.length);
      setTotalPages(Math.max(1, Math.ceil(sparePartsData.length / pageSize)));
      
    } catch (err) {
      console.error(`Error loading spare parts data from API (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      
      // 如果是第一次尝试且是API错误，尝试重试
      if (retryCount < maxRetries) {
        console.log(`Retrying API call (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return loadSparePartsData(retryCount + 1, maxRetries);
      }
      
      // 如果所有重试都失败，显示错误信息
      const errorMessage = err instanceof Error ? err.message : String(t('defaultValues.unknownError', { ns: 'spareParts' }) || 'Unknown error');
      setError(String(t('error.loadingData', { ns: 'spareParts', message: errorMessage }) || `Failed to load spare parts data: ${errorMessage}`));
      setSpareParts([]);
      
      // 可选：作为最后的fallback，使用Mock数据
      if (retryCount >= maxRetries) {
        console.log('All API retries failed, using Mock data as final fallback...');
        try {
          const { getAllMockSpareParts } = await import('../../services/mocks/spareParts.mocks');
          const mockParts = getAllMockSpareParts();
          console.log('🔍 [loadSparePartsData] Fallback Mock data loaded:', mockParts.length, 'items');
          setSpareParts(mockParts);
          setError(String(t('error.apiConnectionFailed', { ns: 'spareParts' }) || 'API connection failed, displaying sample data'));
        } catch (mockError) {
          console.error('Even Mock data fallback failed:', mockError);
          setError(String(t('error.loadingDataGeneral', { ns: 'spareParts' }) || 'Unable to load spare parts data, please check network connection or contact technical support'));
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 新增：动态更新配件模型集合
  const updateAccessoryModels = (sparePartsData: SparePart[]) => {
    // 只取配件类的备件
    const accessoryParts = sparePartsData.filter(
      part => part.product_type === 'accessory' || (part.product_line_id && part.product_line_id !== 1)
    );
    // 收集所有app_model，支持字符串和数组
    const modelSet = new Set<string>();
    accessoryParts.forEach(part => {
      if (Array.isArray(part.app_model)) {
        part.app_model.forEach(m => m && modelSet.add(m.trim()));
      } else if (typeof part.app_model === 'string') {
        part.app_model.split(',').forEach(m => m && modelSet.add(m.trim()));
      }
    });
    
    // 更新配件型号列表（保留现有API获取的数据，补充从备件数据提取的型号）
    const extractedModels = Array.from(modelSet).map(m => ({ value: m, label: m }));
    console.log('📦 [updateAccessoryModels] Extracted models from spare parts data:', extractedModels.length);
    
    // 如果配件型号列表为空或只有默认项，用提取的数据填充
    if (accessoryModels.length <= 1 && extractedModels.length > 0) {
      const newAccessoryModels = [
        { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
        ...extractedModels
      ];
      setAccessoryModels(newAccessoryModels);
      console.log('✅ [updateAccessoryModels] Updated accessory models from spare parts data');
    }
  };
  
  // 加载筛选选项
  const loadFilterOptions = async (retryCount = 0, maxRetries = 2) => {
    try {
      console.log(`🔄 [loadFilterOptions] Loading filter options from API (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
      
      // 调用新的筛选选项API端点
      const response = await fetch(`${baseUrl}/spare-parts/filter-options?lang=${currentLanguage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      console.log('🔍 [loadFilterOptions] API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Filter options API request failed with status ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log('✅ [loadFilterOptions] Filter options received:', jsonData);

      if (jsonData.success && jsonData.data) {
        const filterData = jsonData.data;
        
        // 处理主机型号
        if (filterData.hostModels && Array.isArray(filterData.hostModels)) {
          const hostModelOptions = [
            { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
            ...filterData.hostModels.map(model => ({
              value: model,
              label: model
            }))
          ];
          setHostModels(hostModelOptions);
          console.log('✅ [loadFilterOptions] Host models loaded:', hostModelOptions.length - 1);
        }

        // 处理配件型号
        if (filterData.accessoryModels && Array.isArray(filterData.accessoryModels)) {
          const accessoryModelOptions = [
            { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
            ...filterData.accessoryModels.map(model => ({
            value: model,
            label: model
          }))
          ];
          setAccessoryModels(accessoryModelOptions);
          console.log('✅ [loadFilterOptions] Accessory models loaded:', accessoryModelOptions.length - 1);
        }
        
        // 设置产品类型选项（根据partTypes构建产品类型选项）
        const productTypeOptions = [
          { value: 'all', label: String(t('filters.allProductTypes', { ns: 'spareParts' }) || '全部产品类型') },
          { value: 'machine', label: String(t('productTypes.machine', { ns: 'spareParts' }) || '主机') },
          { value: 'accessory', label: String(t('productTypes.accessory', { ns: 'spareParts' }) || '配件') }
        ];
        setProductTypes(productTypeOptions);
        
        // 根据当前产品类型设置当前显示的型号列表
        if (currentProductType === 'machine') {
          const hostModelsList = filterData.hostModels 
            ? [{ value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
               ...filterData.hostModels.map(model => ({ value: model, label: model }))]
            : [{ value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }];
          setCurrentModels(hostModelsList);
        } else if (currentProductType === 'accessory') {
          const accessoryModelsList = filterData.accessoryModels
            ? [{ value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
               ...filterData.accessoryModels.map(model => ({ value: model, label: model }))]
            : [{ value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }];
          setCurrentModels(accessoryModelsList);
        } else {
          // 合并所有型号
          const allModelOptions = [
            { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
            ...(filterData.hostModels || []).map(model => ({ value: model, label: model })),
            ...(filterData.accessoryModels || []).map(model => ({ value: model, label: model }))
          ];
          setCurrentModels(allModelOptions);
        }

        console.log('✅ [loadFilterOptions] Filter options processed successfully:', {
          hostModels: filterData.hostModels?.length || 0,
          accessoryModels: filterData.accessoryModels?.length || 0,
          partTypes: filterData.partTypes?.length || 0
        });
        
      } else {
        console.warn('⚠️ [loadFilterOptions] Invalid response format:', jsonData);
        throw new Error('Invalid filter options response format');
      }
      
    } catch (error) {
      console.error(`❌ [loadFilterOptions] Failed to load filter options (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 [loadFilterOptions] Retrying in 1 second...`);
        setTimeout(() => loadFilterOptions(retryCount + 1, maxRetries), 1000);
      } else {
        console.error('❌ [loadFilterOptions] All retry attempts failed, using fallback options');
        
        // 使用备用筛选选项
        const fallbackProductTypes = [
          { value: 'all', label: String(t('filters.allProductTypes', { ns: 'spareParts' }) || 'All Product Types') },
          { value: 'machine', label: String(t('productTypes.machine', { ns: 'spareParts' }) || 'Machine') },
          { value: 'accessory', label: String(t('productTypes.accessory', { ns: 'spareParts' }) || 'Accessory') }
        ];
        
        const fallbackHostModels = [
          { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
          { value: 'LA-E4S', label: currentLanguage === 'zh' ? '气垫机E4S' : 'Air Cushion E4S' },
          { value: 'LA-E5P', label: currentLanguage === 'zh' ? '气垫机E5P' : 'Air Cushion E5P' },
          { value: 'LA-E6L', label: currentLanguage === 'zh' ? '气垫机E6L' : 'Air Cushion E6L' }
        ];
        
        const fallbackAccessoryModels = [
          { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
          { value: 'EC402', label: currentLanguage === 'zh' ? 'EC402 大支架' : 'EC402 Big Bracket' },
          { value: 'EC401', label: currentLanguage === 'zh' ? 'EC401 小支架' : 'EC401 Small Bracket' },
          { value: 'EC403', label: currentLanguage === 'zh' ? 'EC403 配件' : 'EC403 Accessory' },
          { value: 'EC404', label: currentLanguage === 'zh' ? 'EC404 配件' : 'EC404 Accessory' }
        ];
        
        setProductTypes(fallbackProductTypes);
        setHostModels(fallbackHostModels);
        setAccessoryModels(fallbackAccessoryModels);
        setCurrentModels(fallbackHostModels); // 默认显示主机型号
        
        console.log('✅ [loadFilterOptions] Fallback options loaded');
        
        // 只在真正的网络错误或严重错误时显示错误提示
        if (error instanceof Error && !error.message.includes('Invalid response format')) {
          showErrorToast(String(t('error.loadFilterOptionsFailed', { ns: 'spareParts' }) || 'Failed to load filter options'), error.message);
        }
      }
    }
  };
  
  // 标准化处理函数，移除引号、空格，转为小写
  const normalize = (v: string): string => {
    if (!v) return '';
    return v.toString()
      .toLowerCase()
      .replace(/['"]/g, '') // 移除所有引号
      .replace(/\s+/g, '')  // 移除所有空格
      .trim();
  };
  
  // 根据筛选条件过滤备件 - 主要前端筛选逻辑
  const getFilteredParts = () => {
    console.log(`🔍 [getFilteredParts] 开始前端筛选:`, {
      selectedModel,
      currentProductType,
      selectedIsConsumable,
      totalParts: spareParts.length,
      strategy: 'FRONTEND_FILTERING'
    });

    if (!spareParts || spareParts.length === 0) {
      console.log('⚠️ [getFilteredParts] 没有基础数据');
      return [];
    }

    console.log('🔧 [getFilteredParts] 执行前端筛选逻辑...');
    
    // 🔧 基础过滤：除非明确筛选is_consumable=0，否则过滤掉隐藏的备件
    let baseFilteredParts = spareParts;
    if (selectedIsConsumable !== 0) {
      baseFilteredParts = spareParts.filter(part => part.is_consumable !== 0);
      console.log(`📊 [基础数据] 过滤隐藏备件: ${spareParts.length} → ${baseFilteredParts.length} 条`);
    } else {
      console.log(`📊 [基础数据] 保留隐藏备件（调试模式）: ${spareParts.length} 条`);
    }
    
    console.log(`📊 [基础数据] 起始数据量: ${baseFilteredParts.length} 条（已过滤不展示备件）`);

    let filteredParts = [...baseFilteredParts];

    // 1. 型号筛选
    if (selectedModel && selectedModel !== 'all' && selectedModel !== '') {
      console.log(`🔍 [getFilteredParts] 应用型号筛选: ${selectedModel}`);
      const beforeCount = filteredParts.length;
      
      filteredParts = filteredParts.filter(part => {
        if (!part.app_model) {
          console.log(`⚠️ [型号筛选] ${part.part_number}: app_model为空`);
          return false;
        }
        
        const normalizedSelectedModel = normalize(selectedModel);
        
        if (Array.isArray(part.app_model)) {
          const match = part.app_model.some(model => {
            const normalizedModel = normalize(model);
            const isMatch = normalizedModel === normalizedSelectedModel;
            console.log(`🔍 [型号匹配] ${part.part_number}: "${model}" vs "${selectedModel}" → ${isMatch}`);
            return isMatch;
          });
          if (match) {
            console.log(`✅ [型号筛选] ${part.part_number}: 匹配成功 ${JSON.stringify(part.app_model)}`);
          }
          return match;
        } else {
          const modelString = String(part.app_model);
          const modelArray = modelString.replace(/['"]/g, '').split(',').map(m => m.trim()).filter(m => m.length > 0);
          console.log(`🔍 [型号解析] ${part.part_number}: "${part.app_model}" → [${modelArray.join(', ')}]`);
          
          const match = modelArray.some(model => {
            const normalizedModel = normalize(model);
            const isMatch = normalizedModel === normalizedSelectedModel;
            console.log(`🔍 [型号匹配] ${part.part_number}: "${model}" vs "${selectedModel}" → ${isMatch}`);
            return isMatch;
          });
          if (match) {
            console.log(`✅ [型号筛选] ${part.part_number}: 匹配成功 "${part.app_model}"`);
          }
          return match;
        }
      });
      
      console.log(`📊 [型号筛选] ${selectedModel}: ${beforeCount} → ${filteredParts.length} 条`);
    }

    // 🚨 移除产品类型筛选逻辑 - 产品类型只影响适配机型选项，不筛选备件列表
    // 备件页面显示所有备件，不按照product_type筛选
    console.log(`ℹ️ [产品类型] 当前选择: ${currentProductType} (仅影响适配机型选项，不筛选备件列表)`);

    // 2. 易损性筛选
    if (selectedIsConsumable !== null && selectedIsConsumable !== undefined) {
      console.log(`🔍 [getFilteredParts] 应用易损性筛选: ${selectedIsConsumable}`);
      const beforeCount = filteredParts.length;
      
      filteredParts = filteredParts.filter(part => {
        return Number(part.is_consumable) === Number(selectedIsConsumable);
      });
      
      console.log(`📊 [易损性筛选] ${selectedIsConsumable}: ${beforeCount} → ${filteredParts.length} 条`);
    }

    // 记录筛选后的结果样本
    const sampleData = filteredParts.slice(0, 3).map(part => ({
      part_number: part.part_number,
      name: part.name_zh || part.name_en,
      app_model: part.app_model,
      is_consumable: part.is_consumable,
      product_type: part.product_type,
      product_line_id: part.product_line_id
    }));

    console.log(`✅ [getFilteredParts] 前端筛选完成:`, {
      原始数据: spareParts.length,
      筛选后: filteredParts.length,
      筛选条件: { selectedModel, selectedIsConsumable },
      产品类型选择: currentProductType + ' (仅影响适配机型选项)',
      样本数据: sampleData
    });

    return filteredParts;
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
  
  // 新增：获取完整备件详情
  async function fetchSparePartDetail(idOrPartNumber: string) {
    const baseUrl = API_BASE_URL;
    let url = '';
    if (/^\d+$/.test(idOrPartNumber)) {
      url = `${baseUrl}/spare-parts/${idOrPartNumber}`;
    } else {
      url = `${baseUrl}/spare-parts?part_number=${idOrPartNumber}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch spare part detail');
    const data = await response.json();
    if (data.success && data.data) {
      if (Array.isArray(data.data)) return data.data[0];
      return data.data;
    }
    if (Array.isArray(data)) return data[0];
    return data;
  }
  
  // 修改 addToCart
  const addToCart = async (sparePart: SparePart, quantity = 1) => {
    console.log('🛒 [SpareParts.addToCart] Starting with:', { 
      id: sparePart.id, 
      part_number: sparePart.part_number, 
      name: sparePart.name_zh || sparePart.name_en, 
      quantity 
    });
    
    try {
      // 1. 获取完整商品信息
      console.log('🛒 [SpareParts.addToCart] Step 1: Fetching spare part detail...');
      const fullSparePart = await fetchSparePartDetail(String(sparePart.id || sparePart.part_number));
      console.log('✅ [SpareParts.addToCart] Step 1 completed, full spare part:', fullSparePart);
      
      // 2. 添加主商品到购物车
      console.log('🛒 [SpareParts.addToCart] Step 2: Adding main spare part to cart...');
      await addMainSparePartToCart(fullSparePart, quantity);
      console.log('✅ [SpareParts.addToCart] Step 2 completed');
      
      // 3. 添加必选件到购物车
      console.log('🛒 [SpareParts.addToCart] Step 3: Adding required parts to cart...');
      await addRequiredPartsToCart(fullSparePart, quantity);
      console.log('✅ [SpareParts.addToCart] Step 3 completed');
      
      // 4. 成功消息
      console.log('🛒 [SpareParts.addToCart] Step 4: Showing success message...');
      const requiredParts = parseRequiredParts(fullSparePart.required_parts, fullSparePart.required_quantity);
      if (requiredParts.length > 0) {
        success(String(t('success.addedToCartWithRequired', { ns: 'spareParts', count: requiredParts.length }) || `备件已添加到购物车，同时自动添加了 ${requiredParts.length} 个必选备件`));
      } else {
        success(String(t('success.addedToCart', { ns: 'spareParts' }) || '备件已添加到购物车'));
      }
      console.log('✅ [SpareParts.addToCart] All steps completed successfully');
      
    } catch (err: any) {
      console.error('❌ [SpareParts.addToCart] Error occurred at some step:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        sparePart: { 
          id: sparePart.id, 
          part_number: sparePart.part_number, 
          name: sparePart.name_zh || sparePart.name_en 
        },
        quantity: quantity
      });
      
      // 提供更详细的错误信息
      let errorTitle = String(t('error.addToCartFailed', { ns: 'spareParts' }) || '添加到购物车失败');
      let errorMessage = err?.message || 'Unknown error occurred';
      
      // 分析错误类型
      if (err?.message?.includes('part_number') || err?.message?.includes('料号')) {
        errorMessage = String(t('error.partNumberMissing', { ns: 'spareParts' }) || '产品料号信息缺失，请刷新页面重试或联系技术支持');
      } else if (err?.message?.includes('401') || err?.message?.includes('unauthorized') || err?.message?.includes('认证')) {
        errorMessage = String(t('error.authenticationFailed', { ns: 'spareParts' }) || '认证失效，请刷新页面重新登录');
      } else if (err?.message?.includes('400') || err?.message?.includes('参数')) {
        errorMessage = String(t('error.parameterError', { ns: 'spareParts' }) || '请求参数错误，请检查产品信息');
      } else if (err?.message?.includes('500') || err?.message?.includes('服务器')) {
        errorMessage = '服务器内部错误，请稍后重试或联系管理员';
      } else if (err?.message?.includes('network') || err?.message?.includes('网络')) {
        errorMessage = '网络连接错误，请检查网络连接后重试';
      } else if (!err?.message || err?.message === '') {
        errorMessage = '未知错误，请重试或联系技术支持';
      }
      
      // 使用 showErrorToast 显示错误
      showErrorToast(errorTitle, errorMessage);
      console.error('❌ [SpareParts.addToCart] Final error details:', { errorTitle, errorMessage, originalError: err });
    }
  };

  /**
   * 🧪 临时测试函数：为特定备件添加模拟的必选备件数据
   * 这是为了测试必选备件功能，实际应该从数据库获取
   */
  const getTestRequiredParts = (sparePart: SparePart): { required_parts: string | null; required_quantity: string | null } => {
    // 为8A保险丝添加测试必选备件 - 使用实际存在的备件料号
    if (sparePart.part_number === '08A0105795') {
      console.log('🧪 [getTestRequiredParts] Adding test required parts for 8A fuse');
      return {
        required_parts: '11A0103002,11A0101003', // 平垫圈, 内六角圆柱头螺钉
        required_quantity: '2,1'
      };
    }
    
    // 为去皱硅胶添加测试数据
    if (sparePart.part_number === '01A0101038') {
      console.log('🧪 [getTestRequiredParts] Adding test required parts for wrinkle remover');
      return {
        required_parts: '11A0103002', // 平垫圈
        required_quantity: '1'
      };
    }
    
    // 为陶瓷刀片添加测试数据
    if (sparePart.part_number === '07A0105325') {
      console.log('🧪 [getTestRequiredParts] Adding test required parts for ceramic blade');
      return {
        required_parts: '11A0103157,11A0101002', // 尼龙垫圈, 内六角圆柱头螺钉
        required_quantity: '1,2'
      };
    }
    
    // 返回原始数据，处理undefined类型
    return {
      required_parts: sparePart.required_parts ?? null,
      required_quantity: sparePart.required_quantity ?? null
    };
  };

  /**
   * 根据料号查找备件信息
   */
  const findSparePartByPartNumber = (partNumber: string): SparePart | null => {
    console.log(`🔍 [findSparePartByPartNumber] Looking for part: ${partNumber}`);
    console.log(`📦 [findSparePartByPartNumber] Available parts:`, spareParts.map(p => p.part_number).slice(0, 10));
    
    const found = spareParts.find(part => 
      part.part_number === partNumber ||
      part.part_number?.toLowerCase() === partNumber.toLowerCase()
    ) || null;
    
    if (found) {
      console.log(`✅ [findSparePartByPartNumber] Found part:`, found.part_number, found.name_zh);
    } else {
      console.log(`❌ [findSparePartByPartNumber] Part not found: ${partNumber}`);
      console.log(`📋 [findSparePartByPartNumber] All available part numbers:`, spareParts.map(p => p.part_number));
    }
    
    return found;
  };

  /**
   * 添加主备件到购物车
   */
  const addMainSparePartToCart = async (sparePart: SparePart, quantity: number) => {
    // 提取备件特有的属性
    const sparePartProperties = {
      // 基本信息
      part_number: sparePart.part_number,
      productName: sparePart.name_zh || sparePart.name_en,
      name_zh: sparePart.name_zh,
      name_en: sparePart.name_en,
      model: sparePart.model,
      image_url: sparePart.image_url,
      
      // 规格信息
      spec: sparePart.spec,
      spec_imperial: sparePart.spec_imperial,
      
      // 适配信息
      app_model: sparePart.app_model,
      app_sn: sparePart.app_sn,
      
      // 包装信息
      pcs_per_box: sparePart.pcs_per_box,
      unit: sparePart.unit,
      
      // 产品属性
      is_consumable: sparePart.is_consumable,
      product_type: 'spare_part',
      
      // 必选备件信息
      required_parts: sparePart.required_parts,
      required_quantity: sparePart.required_quantity,
      
      // 包装规格
      package_size_cm: sparePart.package_size_cm,
      package_size_inch: sparePart.package_size_inch,
      net_weight_kg: sparePart.net_weight_kg,
      net_weight_lbs: sparePart.net_weight_lbs
    };

    // 确保part_number不为空 - 强化检查
    let partNumber = sparePart.part_number || 
                    (sparePart as any).partNumber || 
                    (sparePart as any).code || 
                    sparePart.model || 
                    `SPARE-${sparePart.id}`;
    
    if (!partNumber || partNumber.trim() === '') {
      console.error('❌ [addMainSparePartToCart] partNumber is empty after all fallbacks!', {
        sparePart,
        quantity,
        sparePartPartNumber: sparePart.part_number,
        extractedPartNumber: partNumber,
        allSparePartFields: Object.keys(sparePart)
      });
      
      // 作为最后的fallback，使用产品ID
      partNumber = `FALLBACK-SPARE-${sparePart.id}`;
      console.warn('⚠️ [addMainSparePartToCart] Using fallback part number:', partNumber);
    }

    const productName = sparePart.name_zh || sparePart.name_en || sparePart.model || 'Unknown Spare Part';
    const productImage = sparePart.image_url || '/images/spare-parts/default.svg';
    const productIdNum = typeof sparePart.id === 'number' ? sparePart.id : parseInt(sparePart.id, 10);
    
    // 计算价格
    const unitPrice = calculateFinalPrice(sparePart);
    
    let priceTiers: any[] = [];
    // 处理价格层级
    if (sparePart.prices && sparePart.prices.length > 0) {
      const priceData = sparePart.prices[0];
      if (priceData.tiers && priceData.tiers.length > 0) {
        priceTiers = priceData.tiers.map(t => ({ 
          min: t.min_quantity, 
          max: t.max_quantity, 
          base_price: t.base_price,
          discount_rate: t.discount_rate || 0
        }));
      }
    }

    console.log('🛒 [addMainSparePartToCart] Calling addItem with spare part data:', {
      productName,
      partNumber,
      productIdNum,
      quantity,
      unitPrice,
      sparePartProperties
    });

    // 构建购物车项目
    const cartItem: ExtendedCartItem = {
      // 基本购物车字段
      item_id: productIdNum,
      product_type: 'spare_part',
      product_id: productIdNum,
      part_number: partNumber,
      quantity: quantity,
      name: productName,
      image_url: productImage,
      unit_price: unitPrice,
      currency: getCurrencySymbol(userRegion),
      line_total: unitPrice * quantity,
      inventory_status: 'in_stock',
      added_at: new Date().toISOString(),
      
      // 扩展字段
      id: sparePart.id.toString(),
      code: partNumber,
      partNumber: partNumber,
      image: productImage,
      category: '备件',
      productId: productIdNum,
      price: unitPrice,
      selected: true,
      priceTiers: priceTiers,
      type: 'spare_part',
      
      // 备件特有属性
      properties: sparePartProperties,
      specs: {
        partNumber: partNumber,
        productName: productName
      }
    };

    // 调用 addItem，它会内部处理 cartService.addToCart 调用
    await addItem(cartItem);
  };

  /**
   * 添加必选备件到购物车
   */
  const addRequiredPartsToCart = async (mainSparePart: SparePart, mainQuantity: number) => {
    // 检查是否有必选备件
    if (!mainSparePart.required_parts || !mainSparePart.required_quantity) {
      console.log('📝 [addRequiredPartsToCart] No required parts found');
      return;
    }
    
    console.log('📋 [addRequiredPartsToCart] Processing required parts for:', {
      part_number: mainSparePart.part_number,
      required_parts: mainSparePart.required_parts,
      required_quantity: mainSparePart.required_quantity,
      mainQuantity
    });
    
    try {
      // 使用新的工具函数获取必选备件完整信息
      const { fetchRequiredPartsFullInfo, createRequiredPartCartItem } = await import('../../utils/requiredPartsUtils');
      
      const requiredPartsFullInfo = await fetchRequiredPartsFullInfo(
        mainSparePart.required_parts,
        mainSparePart.required_quantity,
        mainSparePart.part_number
      );
      
      console.log('📦 [addRequiredPartsToCart] Fetched required parts full info:', requiredPartsFullInfo);
      
      const addedParts: string[] = [];
      const failedParts: string[] = [];
      
      for (const requiredPart of requiredPartsFullInfo) {
        try {
          // 检查购物车中是否已存在该必选备件
          const existingCartItem = items.find(item => 
            item.part_number === requiredPart.part_number && 
            item.product_type === 'spare_part'
          );
          
          if (existingCartItem) {
            // 如果已存在，增加数量
            console.log(`📦 [addRequiredPartsToCart] Updating quantity for existing part: ${requiredPart.part_number}`);
            await updateQuantity(String(existingCartItem.item_id), existingCartItem.quantity + (requiredPart.quantity * mainQuantity));
          } else {
            // 如果不存在，创建新的必选备件购物车项目
            console.log(`➕ [addRequiredPartsToCart] Adding new required part: ${requiredPart.part_number}`);
            
            const requiredCartItem = createRequiredPartCartItem(
              requiredPart,
              requiredPart.quantity * mainQuantity
            );
            
            // 添加到购物车
            await addItem(requiredCartItem);
          }
          
          addedParts.push(`${requiredPart.name_zh || requiredPart.name_en} (${requiredPart.quantity * mainQuantity}个)`);
          
        } catch (error) {
          console.error(`❌ [addRequiredPartsToCart] Failed to add required part ${requiredPart.part_number}:`, error);
          failedParts.push(requiredPart.part_number);
        }
      }
      
      // 显示必选备件添加结果
      if (addedParts.length > 0) {
        console.log('✅ [addRequiredPartsToCart] Successfully added required parts:', addedParts);
        info(String(t('success.requiredPartsAdded', { ns: 'spareParts', parts: addedParts.join(', ') }) || `自动添加必选备件: ${addedParts.join(', ')}`));
      }
      
      if (failedParts.length > 0) {
        console.warn('⚠️ [addRequiredPartsToCart] Failed to add some required parts:', failedParts);
        showErrorToast(String(t('error.partialRequiredParts', { ns: 'spareParts' }) || '部分必选备件添加失败'), String(t('error.failedRequiredParts', { ns: 'spareParts', parts: failedParts.join(', ') }) || `以下必选备件未能添加: ${failedParts.join(', ')}`));
      }
      
    } catch (error) {
      console.error('❌ [addRequiredPartsToCart] Error processing required parts:', error);
      showErrorToast(String(t('error.requiredPartsProcessing', { ns: 'spareParts' }) || '必选备件处理失败'), String(t('error.requiredPartsInfo', { ns: 'spareParts' }) || '无法获取必选备件信息，请重试'));
    }
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
    // 防止无限循环：只有当当前src不是默认图片时才设置默认图片
    if (img.src !== `${window.location.origin}/images/spare-parts/default.svg`) {
      img.src = '/images/spare-parts/default.svg';
      img.onerror = null; // 防止循环触发
    }
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
        <div className="flex justify-center items-center p-16 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
          <LoadingState 
            size="large" 
            text={String(t('loading.text', {ns: 'spareParts'}) || 'Loading...')} 
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
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => loadSparePartsData()} 
              className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
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
                setTimeout(() => loadSparePartsData(), 100);
              }}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              {t('filters.reset', {ns: 'spareParts'})}
            </button>
            
            <button 
              onClick={() => loadSparePartsData()}
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
      <>
        <div className="grid grid-cols-1 gap-6">
          {filteredParts.map((part) => (
            <div 
              key={`spare-part-${part.id}-${part.part_number}`} 
              className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border text-content overflow-hidden"
            >
              <div className="flex flex-col md:flex-row p-6">
                {/* Column 1: Image & Basic Info */}
                <div className="w-full md:w-1/5 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                  <div className="relative mb-4">
                    <img 
                      src={part.image_url || ASSETS.DEFAULT_IMAGE} 
                      alt={part.name_en || part.part_number}
                      className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-card-alt p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${part.is_consumable === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {formatConsumableStatus(part.is_consumable, currentLanguage as 'zh' | 'en')}
                    </span>
                  </div>
                </div>
                  
                {/* Column 2: Product Details & Specs */}
                <div className="w-full md:w-3/5 md:px-6">
                  <div className="mb-4">
                    <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{part.part_number}</span>
                    <h3 className="text-xl font-bold text-title mt-2 leading-tight line-clamp-2">
                      {(() => {
                        // 根据当前语言选择显示的名称
                        const displayName = currentLanguage === 'zh' 
                          ? (part.name_zh || part.name_en || part.model || String(t('defaultValues.defaultPartName', { ns: 'spareParts' }) || '备件名称'))
                          : (part.name_en || part.name_zh || part.model || String(t('defaultValues.defaultPartName', { ns: 'spareParts' }) || 'Spare Part'));
                        
                        console.log('🔍 [renderSpareParts] Part name display:', {
                          partId: part.id,
                          partNumber: part.part_number,
                          currentLanguage,
                          name_zh: part.name_zh,
                          name_en: part.name_en,
                          model: part.model,
                          displayName
                        });
                        
                        return displayName;
                      })()}
                    </h3>
                  </div>
                  
                  <div className="bg-card-alt rounded-lg p-4 mt-3 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {/* 适配机型 - 重要字段，优先显示 */}
                      <div className="flex items-start sm:col-span-2">
                        <strong className="w-28 text-label font-medium flex-shrink-0 mr-3">{String(t('table.columns.compatibility', { ns: 'spareParts' }) || '适配机型')}:</strong>
                        <span className="text-content font-medium line-clamp-2 flex-1">
                          {formatAppModel(part.app_model) || '通用型号'}
                        </span>
                      </div>
                      
                      {/* 规格参数 - 根据用户地区智能显示公制或英制 */}
                      <div className="flex items-start sm:col-span-2">
                        <strong className="w-28 text-label font-medium flex-shrink-0 mr-3">{String(t('fields.specifications', { ns: 'spareParts' }) || 'Spec.')}:</strong>
                        <span className="text-content font-medium line-clamp-2 flex-1">
                          {(() => {
                            // 使用 AuthContext 的 getPreferredUnit() 方法
                            const unitSystem = getPreferredUnit();
                            
                            if (unitSystem === 'metric') {
                              // 优先显示公制规格，如果为空则fallback到英制
                              const spec = part.spec?.trim();
                              if (spec && spec !== '' && spec !== 'null') {
                                return spec;
                              }
                              
                              const specImperial = part.spec_imperial?.trim();
                              if (specImperial && specImperial !== '' && specImperial !== 'null') {
                                return specImperial;
                              }
                            } else {
                              // 优先显示英制规格，如果为空则fallback到公制
                              const specImperial = part.spec_imperial?.trim();
                              if (specImperial && specImperial !== '' && specImperial !== 'null') {
                                return specImperial;
                              }
                              
                              const spec = part.spec?.trim();
                              if (spec && spec !== '' && spec !== 'null') {
                                return spec;
                              }
                            }
                            
                            // 如果两个规格都为空，显示友好提示
                            return String(t('defaultValues.contactServiceSpecs', { ns: 'spareParts' }) || 'Please contact service for specification details');
                          })()}
                        </span>
                      </div>
                      
                      
                      {/* 适配序列号 */}
                      <div className="flex items-start">
                        <strong className="w-28 text-label font-medium flex-shrink-0 mr-3">{String(t('fields.compatibleSerialNumber', { ns: 'spareParts' }) || 'Serial No.')}:</strong>
                        <span className="text-content font-medium line-clamp-1 flex-1">
                          {(() => {
                            console.log('🔍 [renderSpareParts] Part app_sn data:', {
                              partId: part.id,
                              partNumber: part.part_number,
                              app_sn: part.app_sn,
                              app_snType: typeof part.app_sn
                            });
                            
                            // 检查app_sn字段是否有有效值
                            const appSn = part.app_sn?.trim?.() || part.app_sn;
                            
                            if (appSn && appSn !== '' && appSn !== 'null' && appSn !== null) {
                              return appSn;
                            }
                            
                            // 如果序列号为空，显示通用
                            return String(t('defaultValues.universal', { ns: 'spareParts' }) || 'Universal');
                          })()}
                        </span>
                      </div>
                      
                      {/* 单箱数量 */}
                      <div className="flex items-center">
                        <strong className="w-28 text-label font-medium flex-shrink-0 mr-3">
                          {String(t('fields.pcsPerBox', { ns: 'spareParts' }) || (currentLanguage === 'zh' ? '单箱数量(件)' : 'Qty per Carton(pcs)'))}:
                        </strong>
                        <span className="text-content font-medium flex-1">
                          {(() => {
                            console.log('🔍 [renderSpareParts] Part pcs_per_box data:', {
                              partId: part.id,
                              partNumber: part.part_number,
                              pcs_per_box: part.pcs_per_box,
                              pcs_per_boxType: typeof part.pcs_per_box
                            });
                            
                            return part.pcs_per_box !== null && part.pcs_per_box !== undefined && part.pcs_per_box > 0 
                              ? String(part.pcs_per_box)  // 只显示纯数值
                              : '1';
                          })()}
                        </span>
                      </div>
                      
                      {/* ProductId - 修复翻译和布局 */}
                      <div className="flex items-center">
                        <strong className="w-28 text-label font-medium flex-shrink-0 mr-3">
                          {String(t('fields.productId', { ns: 'spareParts' }) || (currentLanguage === 'zh' ? '产品ID' : 'Product ID'))}:
                        </strong>
                        <span className="text-content font-medium flex-1">
                          {part.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <div className="info-buttons-container">
                      <Tooltip
                        title={
                          <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                            <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                              <InfoCircleOutlined className="text-blue-500 mr-2" />
                              <span className="font-bold text-gray-800 text-sm">{String(t('details.title', { ns: 'spareParts' }) || 'Spare Part Details')}</span>
                            </div>
                            <div className="space-y-2">
                              {/* 适配序列号 - 第1个必需字段 */}
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600 font-medium text-xs">
                                  🔗 {String(t('details.properties.appSn', { ns: 'spareParts' }) || 'Compatible Serial Number')}:
                                </span>
                                <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                                  {part.app_sn || String(t('defaultValues.universal', { ns: 'spareParts' }) || 'Universal')}
                                </span>
                              </div>
                              
                              {/* 包装尺寸 - 第2个必需字段，智能显示单位制 */}
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600 font-medium text-xs">
                                  📦 {(() => {
                                    // 使用 AuthContext 的 getPreferredUnit() 方法
                                    const unitSystem = getPreferredUnit();
                                    if (unitSystem === 'metric') {
                                      return String(t('details.properties.packageSizeCm', { ns: 'spareParts' }) || (currentLanguage === 'zh' ? '包装尺寸(cm)' : 'Package Size(cm)'));
                                    } else {
                                      return String(t('details.properties.packageSizeInch', { ns: 'spareParts' }) || (currentLanguage === 'zh' ? '包装尺寸(inch)' : 'Package Size(inch)'));
                                    }
                                  })()}:
                                </span>
                                <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                                  {(() => {
                                    // 使用 AuthContext 的 getPreferredUnit() 方法
                                    const unitSystem = getPreferredUnit();
                                    if (unitSystem === 'metric') {
                                      return formatCompositeDimension(part.package_size_cm) || 
                                             formatCompositeDimension(part.package_size_inch) || 
                                             String(t('defaultValues.contactService', { ns: 'spareParts' }) || 'Please contact service');
                                    } else {
                                      return formatCompositeDimension(part.package_size_inch) || 
                                             formatCompositeDimension(part.package_size_cm) || 
                                             String(t('defaultValues.contactService', { ns: 'spareParts' }) || 'Please contact service');
                                    }
                                  })()}
                                </span>
                              </div>
                              
                              {/* 单件净重 - 第3个必需字段，智能显示单位制 */}
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600 font-medium text-xs">
                                  ⚖️ {(() => {
                                    // 使用 AuthContext 的 getPreferredUnit() 方法
                                    const unitSystem = getPreferredUnit();
                                    if (unitSystem === 'metric') {
                                      return String(t('details.properties.netWeightKg', { ns: 'spareParts' }) || (currentLanguage === 'zh' ? '净重(kg)' : 'Net Weight(kg)'));
                                    } else {
                                      return String(t('details.properties.netWeightLbs', { ns: 'spareParts' }) || (currentLanguage === 'zh' ? '净重(lbs)' : 'Net Weight(lbs)'));
                                    }
                                  })()}:
                                </span>
                                <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                                  {(() => {
                                    // 使用 AuthContext 的 getPreferredUnit() 方法
                                    const unitSystem = getPreferredUnit();
                                    if (unitSystem === 'metric') {
                                      return formatWeight(part.net_weight_kg) || 
                                             formatWeight(part.net_weight_lbs) || 
                                             String(t('defaultValues.contactService', { ns: 'spareParts' }) || 'Please contact service');
                                    } else {
                                      return formatWeight(part.net_weight_lbs) || 
                                             formatWeight(part.net_weight_kg) || 
                                             String(t('defaultValues.contactService', { ns: 'spareParts' }) || 'Please contact service');
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                              <span className="text-xs text-gray-500">💡 悬停查看详细规格信息</span>
                            </div>
                          </div>
                        }
                        placement="top"
                        overlayStyle={{ maxWidth: '350px', zIndex: 1000 }}
                        overlayClassName="custom-tooltip"
                        color="white"
                        arrow={true}
                      >
                        <button className="more-info-btn">
                          <InfoCircleOutlined />
                          {String(t('moreInfo.specsDetail', { ns: 'spareParts' }) || '更多规格详情')}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Column 3: Price, Stock, Actions */}
                <div className="w-full md:w-1/5 md:pl-6 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0">
                  <div className="mb-4">
                    <div className="font-medium text-sm text-label mb-2">
                      {String(t('table.columns.price', { ns: 'spareParts' }) || '价格')} ({getCurrencySymbol(userRegion)}):
                    </div>
                    
                    {/* 价格展示 */}
                    {(() => {
                      // 安全地获取当前用户区域的价格数据
                      const userRegion = currentUser?.region?.toLowerCase() || 'cn';
                      const regionPrices = part.prices && Array.isArray(part.prices) 
                        ? part.prices.find(priceItem => priceItem.region.toLowerCase() === userRegion)
                        : null;
                      
                      if (!regionPrices || !regionPrices.tiers || !Array.isArray(regionPrices.tiers)) {
                        return (
                          <div className="text-lg font-bold text-content-light">
                            {getCurrencySymbol(currentUser.region)}0.00
                          </div>
                        );
                      }
                      
                      // 显示第一个价格阶梯作为主要价格
                      const firstTier = regionPrices.tiers[0];
                      const basePrice = firstTier?.base_price || 0;
                      const userDiscount = currentUser?.discount || 1;
                      const finalPrice = basePrice * userDiscount;
                      
                      return (
                        <div>
                          <div className="text-2xl font-bold text-price mb-2">
                            {getCurrencySymbol(currentUser.region)}{finalPrice.toFixed(2)}
                          </div>
                          
                          {regionPrices.tiers.length > 1 && (
                            <div className="text-xs text-content-light">
                              {regionPrices.tiers.slice(0, 2).map((tier, index) => {
                                const tierPrice = (tier.base_price || 0) * userDiscount;
                                const rangeText = tier.max_quantity 
                                  ? `${tier.min_quantity}-${tier.max_quantity}` 
                                  : `${tier.min_quantity}+`;
                                return (
                                  <div key={`spare-part-${part.id}-price-tier-${index}`} className="mb-1">
                                    {getCurrencySymbol(currentUser.region)}{tierPrice.toFixed(2)} ({rangeText})
                                  </div>
                                );
                              })}
                              {regionPrices.tiers.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{regionPrices.tiers.length - 2}{String(t('pricing.tiers', { ns: 'spareParts' }) || '个价格阶梯')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* 库存信息 - 仅销售和管理员可见 */}
                  {(userRole === 'admin' || userRole === 'sales') && part.inventory && (
                    <div className="mb-4">
                      <div className="font-medium text-sm text-label mb-2">
                        {String(t('table.columns.stock', { ns: 'spareParts' }) || '库存')}:
                      </div>
                      <div className="bg-card-alt rounded-lg p-2">
                        {(() => {
                          if (Array.isArray(part.inventory)) {
                            const displayInventory = part.inventory.slice(0, 2);
                            return (
                              <div className="space-y-1">
                                {displayInventory.map((item, index) => (
                                  <div key={`spare-part-${part.id}-inventory-${index}`} className="flex justify-between text-xs">
                                    <span className="text-label">{item.region?.toUpperCase() || 'N/A'}:</span>
                                    <span className="text-content font-medium">
                                      {item.quantity || 0}
                                    </span>
                                  </div>
                                ))}
                                {part.inventory.length > 2 && (
                                  <div className="text-xs text-content-light text-center">
                                    +{part.inventory.length - 2}{String(t('inventory.regions', { ns: 'spareParts' }) || '个区域')}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (part.inventory && typeof part.inventory === 'object') {
                            const inventory = part.inventory as Inventory;
                            const regions = [
                              { key: 'cn', label: 'CN', value: inventory.cn },
                              { key: 'na', label: 'US', value: inventory.na }
                            ].filter(region => typeof region.value !== 'undefined').slice(0, 2);
                            
                            return (
                              <div className="space-y-1">
                                {regions.map((region) => (
                                  <div key={`spare-part-${part.id}-inventory-${region.key}`} className="flex justify-between text-xs">
                                    <span className="text-label">{region.label}:</span>
                                    <span className="text-content font-medium">
                                      {region.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-center text-content-light text-xs">
                                {String(t('inventory.noInfo', { ns: 'spareParts' }) || '库存信息暂无')}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 bg-card-alt rounded-lg p-2">
                      <button 
                        onClick={() => handleQuantityChange(String(part.id), undefined, 'decrease')}
                        disabled={(quantities[String(part.id)] || 1) <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-button text-content border border-border rounded hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        value={quantities[String(part.id)] || 1} 
                        onChange={(e) => { e.stopPropagation(); handleQuantityChange(String(part.id), e); }}
                        className="w-20 text-center border border-border rounded py-1 text-sm focus:ring-1 focus:ring-primary focus:border-primary bg-input text-content"
                      />
                      <button 
                        onClick={() => handleQuantityChange(String(part.id), undefined, 'increase')}
                        className="w-8 h-8 flex items-center justify-center bg-button text-content border border-border rounded hover:bg-button-hover transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* 必选备件显示 */}
                    <RequiredPartsDisplay
                      requiredParts={part.required_parts}
                      requiredQuantity={part.required_quantity}
                      className="mb-4"
                      language={currentLanguage as 'zh' | 'en'}
                    />
                    
                    {/* 🎯 智能购物车按钮 - 替换备件按钮 */}
                    <SmartAddToCartButton
                      product={part}
                      productType="spareParts"
                      onAddToCart={() => addToCart(part, quantities[String(part.id)] || 1)}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 h-10 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {String(t('actions.addToCart', { ns: 'spareParts' }) || '加入购物车')}
                    </SmartAddToCartButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 分页组件 */}
        {totalPages > 1 && !isNaN(totalPages) && !isNaN(currentPage) && (
          <div className="flex justify-center mt-8">
            <div className="pagination">
              <button 
                className="pagination-button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {String(t('pagination.previous', { ns: 'spareParts' }) || '上一页')}
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
                {String(t('pagination.next', { ns: 'spareParts' }) || '下一页')}
              </button>
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
    success(t('cart.cartCleared', {ns: 'spareParts'}));
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
              <button className="cart-qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(String(item.id), item.quantity - 1); }}>-</button>
              <input 
                className="cart-qty-input" 
                type="number" 
                value={item.quantity} 
                onChange={(e) => { e.stopPropagation(); updateQuantity(String(item.id), parseInt(e.target.value) || 1); }} 
              />
              <button className="cart-qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(String(item.id), item.quantity + 1); }}>+</button>
            </div>
            <button className="cart-item-remove" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>×</button>
          </div>
        </div>
      );
    });
  };

  // 用于获取不同产品类型的型号
  const fetchModels = async (productType: string) => {
    // 已被 loadModelsForProductType 替代，保留为兼容性
    console.log('⚠️ [fetchModels] Deprecated function called, redirecting to loadModelsForProductType');
    return loadModelsForProductType(productType);
  };
  
  // 动态加载对应产品类型的型号列表
  const loadModelsForProductType = async (productType: string) => {
    console.log('🔄 [loadModelsForProductType] Loading models for product type:', productType);
    
    try {
      if (productType === 'machine') {
        // 如果主机型号为空或只有默认项，则从API加载
        if (hostModels.length <= 1) {
          console.log('📡 [loadModelsForProductType] Loading host models from API...');
          await fetchHostModels();
        }
        setCurrentModels(hostModels);
        console.log('✅ [loadModelsForProductType] Switched to host models:', hostModels.length);
      } else if (productType === 'accessory') {
        // 如果配件型号为空或只有默认项，则从API加载
        if (accessoryModels.length <= 1) {
          console.log('📡 [loadModelsForProductType] Loading accessory models from API...');
          await fetchAccessoryModels();
        }
        setCurrentModels(accessoryModels);
        console.log('✅ [loadModelsForProductType] Switched to accessory models:', accessoryModels.length);
      } else {
        // 'all' 或其他情况，合并显示所有型号
        let allModels = [
          { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }
        ];
        
        // 如果筛选选项还未加载，先尝试加载
        if (hostModels.length <= 1 && accessoryModels.length <= 1) {
          console.log('📡 [loadModelsForProductType] Loading all models from filter options API...');
          await loadFilterOptions();
          // 使用加载后的 currentModels
          return;
        } else {
          // 合并现有的主机和配件型号
          allModels = [
            ...allModels,
            ...hostModels.filter(m => m.value !== 'all'),
            ...accessoryModels.filter(m => m.value !== 'all')
          ];
        }
        
        setCurrentModels(allModels);
        console.log('✅ [loadModelsForProductType] Switched to all models:', allModels.length);
      }
    } catch (error) {
      console.error('❌ [loadModelsForProductType] Error loading models:', error);
      // 使用备用数据
      const fallbackModels = [
          { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') }
        ];
        
      if (productType === 'machine') {
        fallbackModels.push(
          { value: 'LA-E4S', label: currentLanguage === 'zh' ? '气垫机E4S' : 'Air Cushion E4S' },
          { value: 'LA-E5P', label: currentLanguage === 'zh' ? '气垫机E5P' : 'Air Cushion E5P' },
          { value: 'LA-E6L', label: currentLanguage === 'zh' ? '气垫机E6L' : 'Air Cushion E6L' }
        );
        setHostModels(fallbackModels);
      } else if (productType === 'accessory') {
        fallbackModels.push(
          { value: 'EC402', label: currentLanguage === 'zh' ? 'EC402 大支架' : 'EC402 Big Bracket' },
          { value: 'EC401', label: currentLanguage === 'zh' ? 'EC401 小支架' : 'EC401 Small Bracket' },
          { value: 'EC403', label: currentLanguage === 'zh' ? 'EC403 配件' : 'EC403 Accessory' },
          { value: 'EC404', label: currentLanguage === 'zh' ? 'EC404 配件' : 'EC404 Accessory' }
        );
        setAccessoryModels(fallbackModels);
      }
      
      setCurrentModels(fallbackModels);
    }
  };

  // 获取主机型号列表
  const fetchHostModels = async () => {
    console.log('🔄 [fetchHostModels] Starting to fetch host models...');
    
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
      const apiEndpoint = `${baseUrl}/host-models?lang=${currentLanguage}&status=publish&product_line_id=1`;
      
      console.log('📡 [fetchHostModels] API endpoint:', apiEndpoint);
      
      const response = await fetch(apiEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Host models API failed: ${response.status}`);
      }

      const jsonData = await response.json();
      console.log('✅ [fetchHostModels] API response:', jsonData);
      
      let modelsData: any[] = [];
      
      // 处理不同的响应格式
      if (jsonData.success && jsonData.data && Array.isArray(jsonData.data)) {
        modelsData = jsonData.data;
      } else if (jsonData.success && jsonData.data && jsonData.data.items && Array.isArray(jsonData.data.items)) {
          modelsData = jsonData.data.items;
      } else if (Array.isArray(jsonData)) {
        modelsData = jsonData;
      }
      
      if (modelsData.length > 0) {
        const hostModelsList = [
          { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
          ...modelsData.map((model: any) => ({
            value: model.model || model.code || model.name || model.id || String(model),
            label: currentLanguage === 'zh' 
              ? (model.title_zh || model.name_zh || model.title || model.name || model.model)
              : (model.title_en || model.name_en || model.title || model.name || model.model)
          }))
        ];
        
        setHostModels(hostModelsList);
        console.log('✅ [fetchHostModels] Host models loaded:', hostModelsList.length);
      } else {
        throw new Error('No host models data found');
      }
    } catch (error) {
      console.error('❌ [fetchHostModels] Error:', error);
      
      // 使用备用主机型号数据
      const fallbackHostModels = [
        { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
        { value: 'LA-E4S', label: currentLanguage === 'zh' ? '气垫机E4S' : 'Air Cushion E4S' },
        { value: 'LA-E5P', label: currentLanguage === 'zh' ? '气垫机E5P' : 'Air Cushion E5P' },
        { value: 'LA-E6L', label: currentLanguage === 'zh' ? '气垫机E6L' : 'Air Cushion E6L' }
      ];
      
      setHostModels(fallbackHostModels);
      console.log('⚠️ [fetchHostModels] Using fallback host models:', fallbackHostModels.length);
    }
  };

  // 获取配件型号列表
  const fetchAccessoryModels = async () => {
    console.log('🔄 [fetchAccessoryModels] Starting to fetch accessory models...');
    
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
      const apiEndpoint = `${baseUrl}/accessory-models?lang=${currentLanguage}&status=publish&per_page=100`;
      
      console.log('📡 [fetchAccessoryModels] API endpoint:', apiEndpoint);
      
      const response = await fetch(apiEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Accessory models API failed: ${response.status}`);
      }

      const jsonData = await response.json();
      console.log('✅ [fetchAccessoryModels] API response:', jsonData);
      
      let modelsData: any[] = [];
      
      // 处理不同的响应格式
      if (jsonData.success && jsonData.data && Array.isArray(jsonData.data)) {
        modelsData = jsonData.data;
      } else if (jsonData.success && jsonData.data && jsonData.data.items && Array.isArray(jsonData.data.items)) {
        modelsData = jsonData.data.items;
      } else if (Array.isArray(jsonData)) {
        modelsData = jsonData;
      }
      
      if (modelsData.length > 0) {
        const accessoryModelsList = [
          { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
          ...modelsData.map((model: any) => ({
            value: model.model || model.code || model.name || model.id || String(model),
            label: currentLanguage === 'zh' 
              ? (model.title_zh || model.name_zh || model.title || model.name || model.model)
              : (model.title_en || model.name_en || model.title || model.name || model.model)
          }))
        ];
        
        setAccessoryModels(accessoryModelsList);
        console.log('✅ [fetchAccessoryModels] Accessory models loaded:', accessoryModelsList.length);
      } else {
        throw new Error('No accessory models data found');
      }
    } catch (error) {
      console.error('❌ [fetchAccessoryModels] Error:', error);
      
      // 使用备用配件型号数据
      const fallbackAccessoryModels = [
        { value: 'all', label: String(t('filters.allModels', { ns: 'spareParts' }) || '全部型号') },
        { value: 'EC402', label: currentLanguage === 'zh' ? 'EC402 大支架' : 'EC402 Big Bracket' },
        { value: 'EC401', label: currentLanguage === 'zh' ? 'EC401 小支架' : 'EC401 Small Bracket' },
        { value: 'EC403', label: currentLanguage === 'zh' ? 'EC403 配件' : 'EC403 Accessory' },
        { value: 'EC404', label: currentLanguage === 'zh' ? 'EC404 配件' : 'EC404 Accessory' }
      ];
      
      setAccessoryModels(fallbackAccessoryModels);
      console.log('⚠️ [fetchAccessoryModels] Using fallback accessory models:', fallbackAccessoryModels.length);
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
  
  // 添加缺失的状态变量
  const [filterRegion, setFilterRegion] = useState<string>(userRegion || 'CN');
  const [category, setCategory] = useState<string>('all'); // 修复：与currentProductType保持一致
  const [selectedVoltage, setSelectedVoltage] = useState<string>('220V');
  
  // 在筛选条件变化时重新加载数据
  useEffect(() => {
    console.log('🔍 [useEffect] Filter change detected:', {
      selectedIsConsumable,
      currentProductType,
      selectedModel
    });
    
    // 重置到第一页并重新加载数据
    setCurrentPage(1);
    loadSparePartsData();
  }, [selectedIsConsumable, currentProductType, selectedModel]);
  
  // 🔍 调试功能：手动触发筛选验证
  // const handleManualValidation = useCallback(async () => {
  //   console.log('🔍 [Manual Validation] Starting comprehensive filter validation...');
  //   // ... 大量的验证代码已移除 ...
  // }, [selectedModel, selectedIsConsumable, currentProductType]);
  
  // 🔍 验证数据库数据一致性
  // const validateDatabaseConsistency = async (validationService: any, filters: any) => {
  //   // ... 验证代码已移除 ...
  // };
  
  // 渲染主页面
  return (
    <div className="spare-parts-page bg-background min-h-screen p-6">
      {/* SQL Mock服务状态组件 */}
      <MockServiceStatus position="top-right" compact={true} hidden={true} />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-lg shadow-sm border border-border mb-6">
          <div className="spare-parts-header">
            <h1 className="text-xl font-bold text-title">{t('title', {ns: 'spareParts'})}</h1>
            <p className="text-sm text-content-light">{t('subtitle', {ns: 'spareParts'})}</p>
          </div>
          
          {/* 移除调试按钮区域 */}
        </div>
      </div>
      
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
                onClick={() => {
                  setCurrentProductType('all');
                  setSelectedModel('all'); // 重置机型选择
                  loadModelsForProductType('all'); // 加载对应的机型选项
                }}
                data-product-type="all"
                className={`px-4 py-2 rounded text-sm ${currentProductType === 'all' ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
              >
                {t('filters.allProductTypes', {ns: 'spareParts'})}
              </button>
              <button
                onClick={() => {
                  setCurrentProductType('machine');
                  setSelectedModel('all'); // 重置机型选择
                  loadModelsForProductType('machine'); // 加载主机机型选项
                }}
                data-product-type="machine"
                className={`px-4 py-2 rounded text-sm ${currentProductType === 'machine' ? 'bg-primary text-white' : 'bg-background text-content border border-border hover:bg-brand-light'}`}
              >
                {t('productTypes.machine', {ns: 'spareParts'})}
              </button>
              <button
                onClick={() => {
                  setCurrentProductType('accessory');
                  setSelectedModel('all'); // 重置机型选择
                  loadModelsForProductType('accessory'); // 加载配件机型选项
                }}
                data-product-type="accessory"
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
              data-filter="model"
              name="model"
            >
              <option value="">{t('filters.model.allModels', {ns: 'spareParts'})}</option>
              {currentModels.map((model) => (
                <option key={model.value} value={model.value}>{model.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-label mb-2">{t('filters.label.partType', {ns: 'spareParts'})}:</label>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setSelectedIsConsumable(null)}
                data-consumable="null"
                className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === null ? 'bg-primary text-white' : 'bg-background text-content border border-gray-300'}`}
              >
                  {String(t('filters.allTypes', { ns: 'spareParts' }) || '全部类型')}
              </button>
              <button
                  onClick={() => setSelectedIsConsumable(1)}
                  data-consumable="1"
                  className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === 1 ? 'bg-primary text-white' : 'bg-background text-content border border-gray-300'}`}
              >
                  {String(t('filters.consumable', { ns: 'spareParts' }) || '易损')}
              </button>
              <button
                  onClick={() => setSelectedIsConsumable(2)}
                  data-consumable="2"
                  className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === 2 ? 'bg-primary text-white' : 'bg-background text-content border border-gray-300'}`}
              >
                  {String(t('filters.nonConsumable', { ns: 'spareParts' }) || '非易损')}
              </button>
              {/* 🔧 添加隐藏类型选项用于调试数据 */}
              {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={() => setSelectedIsConsumable(0)}
                    data-consumable="0"
                    className={`px-4 py-2 rounded text-sm ${selectedIsConsumable === 0 ? 'bg-primary text-white' : 'bg-background text-content border border-gray-300'}`}
                >
                    {String('隐藏(调试)')}
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto spare-parts-main-content">
        {/* Content */}
        <div className="spare-parts-list-container">
          {renderSpareParts()}
        </div>
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
      {activeNotification && (
        <div className={`cart-notification ${activeNotification ? 'show' : ''}`}>
          <div className="cart-notification-content">
            <div className="cart-notification-icon">
              🛒
            </div>
            <div className="cart-notification-text">
              {String(t('cart.addedToCart', { ns: 'spareParts' }) || '商品已添加到购物车')}
            </div>
            <button 
              className="cart-notification-close"
              onClick={() => setActiveNotification(null)}
            >
              ×
            </button>
          </div>
          <div className="cart-notification-progress"></div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <div className={`cart-confirm ${showConfirmClear ? 'show' : ''}`}>
        <div className="cart-confirm-content">
          <div className="cart-confirm-icon">
            ⚠️
          </div>
          <div className="cart-confirm-title">
            {String(t('cart.confirmClearTitle', { ns: 'spareParts' }) || '确认清空购物车')}
          </div>
          <div className="cart-confirm-text">
            {String(t('cart.confirmClearMessage', { ns: 'spareParts' }) || '此操作将清空购物车中所有商品，且无法恢复。确定要继续吗？')}
          </div>
          <div className="cart-confirm-buttons">
            <button 
              className="cart-confirm-button cart-confirm-cancel"
              onClick={() => setShowConfirmClear(false)}
            >
              {String(t('cart.cancel', { ns: 'spareParts' }) || '取消')}
            </button>
            <button 
              className="cart-confirm-button cart-confirm-proceed"
              onClick={handleConfirmClearCart}
            >
              {String(t('cart.confirmClear', { ns: 'spareParts' }) || '确认清空')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Tooltip component */}
      <SparePartTooltip
        sparePart={selectedSparePartForTooltip}
        position={tooltipPos}
        visible={showTooltip}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
        language={currentLanguage as 'zh' | 'en'}
        userRegion={currentUser.region}
      />
      
      {/* 现代化UI组件 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        loading={confirmDialog.loading}
      />
      
      <CartAnimation
        isActive={cartAnimation.isActive}
        startElement={cartAnimation.startElement}
        targetElement={cartAnimation.targetElement}
        productImage={cartAnimation.productImage}
        productName={cartAnimation.productName}
        onComplete={() => setCartAnimation(prev => ({ ...prev, isActive: false }))}
      />
    </div>
  );
};

export default SparePartsPage;