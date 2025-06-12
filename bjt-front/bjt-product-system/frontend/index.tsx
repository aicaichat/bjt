// src/pages/Machines/index.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button, Select, InputNumber, Tabs, Tag, Tooltip } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, PlusOutlined, ExclamationCircleOutlined, ReloadOutlined, RightOutlined, MenuOutlined, DeleteOutlined, MinusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { cartService, accessoryService } from '../../api/services';
import { useMockData, DEFAULT_REGION } from '../../config/env';
import MockServiceStatus from '../../components/MockServiceStatus';
import { getStockStatus } from '../../utils/stock';
import { runFullAuthTest } from '../../utils/authTest'; // 导入认证测试工具
import { fetchRequiredPartsFullInfo, createRequiredPartCartItem } from '../../utils/requiredPartsUtils';
import { RequiredPartsDisplay } from '../../components/RequiredPartsDisplay';

// 导入现代化UI组件
import { 
  LoadingState, 
  ConfirmDialog, 
  CartAnimation, 
  useToastNotifications 
} from '../../components/ui';

// 导入SQL Mock数据服务
import { useMachines, useAccessories } from '../../hooks/useMockData';

// 导入类型定义
import { MachineProduct, MachineListData, MachineAccessory, MachinePart, MachinePartListData } from '../../types/machines';
import { REGIONS, getDefaultVoltageByRegion, getCurrencySymbol } from '../../config/constants';
import { safeToLocaleString } from '../../utils/priceUtils';
import { delay } from '../../utils/delay';
import { safeTextContent } from '../../utils/string';
import { PriceTier, InventoryData } from '../../types/common';

import './Machines.css';
import './accessibility.css';
import { API_BASE_URL } from '../../api/config';

const { Option } = Select;
const { TabPane } = Tabs;

interface RefreshResponse {
  success: boolean;
  data?: {
    access_token: string;
  };
}

interface Machine {
  id: number;
  product_line_id: number;
  model: string;
  voltage: string;
  image_url: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  brand: string;
  spec: string;
  spec_imperial: string;
  package_size_cm: string;
  package_size_inch: string;
  net_weight_kg: number;
  net_weight_lbs: number;
  gross_weight_kg: number;
  gross_weight_lbs: number;
  pcs_per_box: number;
  pallet_size_cm: string;
  pallet_size_inch: string;
  pcs_per_pallet: number;
  pallet_height_cm: number;
  pallet_height_inch: number;
  pallet_gross_weight_kg: number;
  pallet_gross_weight_lbs: number;
  status: string;
  unit: string;
  created_at: string;
  updated_at: string;
  model_title_zh: string;
  model_title_en: string;
  model_description_zh: string;
  model_description_en: string;
  model_explosion_diagram_pdf: string;
  model_type: string;
  model_image1_url: string;
  model_image2_url: string;
  inventory: InventoryData[];
  prices: PriceTier[];
}

const MachinesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 从URL参数获取category
  const category = searchParams.get('category') || '1';
  
  // 调试输出
  console.log('Environment check:', {
    VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
    useMockDataCondition: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    category: category
  });
  
  // 添加认证状态调试信息
  useEffect(() => {
    console.log('🔍 [MachinesPage] Authentication Debug Info:');
    console.log('- User object:', user);
    console.log('- User authenticated:', !!user);
    console.log('- LocalStorage auth_token:', localStorage.getItem('auth_token'));
    console.log('- LocalStorage user:', localStorage.getItem('user'));
  }, [user]);
  
  // 使用useCallback稳定回调函数引用
  const handleMachinesSuccess = useCallback((data: any) => {
    console.log('✅ 机器页面数据加载成功:', data);
  }, []);
  
  const handleMachinesError = useCallback((errorMsg: string) => {
    console.error('❌ 机器页面数据加载失败:', errorMsg);
  }, []);
  
  // SQL Mock数据服务Hook
  const { 
    data: mockMachinesData, 
    loading: mockLoading, 
    error: mockError 
  } = useMachines({
    category: 1, // 气垫系列
    page: 1,
    pageSize: 20
  }, {
    onSuccess: handleMachinesSuccess,
    onError: handleMachinesError
  });
  
  // 机器相关状态
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>(DEFAULT_REGION);
  const [selectedVoltage, setSelectedVoltage] = useState<string>('220V');
  
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
  
  // 移除旧的购物车通知状态
  // const [cartNotification, setCartNotification] = useState<{ message: string; visible: boolean; type: 'success' | 'error' }>({
  //   message: '',
  //   visible: false,
  //   type: 'success'
  // });
  
  // 主机型号相关状态
  const [hostModels, setHostModels] = useState<Array<{ id: number; model: string; title_zh: string; title_en: string; type?: string }>>([]);
  const [hostModelsLoading, setHostModelsLoading] = useState(false);
  
  // 用户交互相关状态
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationProduct, setNotificationProduct] = useState<string>('');
  const [notificationQuantity, setNotificationQuantity] = useState<number>(1);
  const [cartCount, setCartCount] = useState<number>(0);
  
  // 根据用户偏好设置单位制，如果用户未设置则默认为公制
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    user?.preferred_unit || 'metric'
  );

  // 当用户信息变化时，更新单位制设置
  useEffect(() => {
    if (user?.preferred_unit) {
      setUnitSystem(user.preferred_unit);
    }
  }, [user?.preferred_unit]);
  
  // 配件相关状态
  const [accessories, setAccessories] = useState<MachineAccessory[]>([]);
  const [accessoriesLoading, setAccessoriesLoading] = useState<boolean>(false);
  const [selectedAccessories, setSelectedAccessories] = useState<Record<string, string>>({});
  const [selectedAccessoryNames, setSelectedAccessoryNames] = useState<Record<string, string>>({});
  const [level2Accessories, setLevel2Accessories] = useState<MachineAccessory[]>([]);
  const [level3Accessories, setLevel3Accessories] = useState<MachineAccessory[]>([]);
  const [level4Accessories, setLevel4Accessories] = useState<MachineAccessory[]>([]);
  const [level5Accessories, setLevel5Accessories] = useState<MachineAccessory[]>([]);
  const [level2Loading, setLevel2Loading] = useState<boolean>(false);
  const [level3Loading, setLevel3Loading] = useState<boolean>(false);
  const [level4Loading, setLevel4Loading] = useState<boolean>(false);
  const [level5Loading, setLevel5Loading] = useState<boolean>(false);
  const [autoLoadedAccessories, setAutoLoadedAccessories] = useState<boolean>(false);
  
  // 使用ref来跟踪上一次选择的机器，避免不必要的重复加载
  const previousMachineRef = useRef<string>('');
  
  // 判断用户角色和权限
  const isSales = user && hasPermission('viewInventory');
  const isAdmin = user && hasPermission('viewAdmin');
  const canViewPrices = user && hasPermission('viewPrices');
  const canAddToCart = true; // 为所有用户开放购物车功能
  const isVIP = user && (user.role === 'admin' || user.role === 'sales');
  const userRegion = filterRegion || user?.region || DEFAULT_REGION;
  
  // 修改默认视图为表格模式
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const getMachineName = (machine: MachinePart): string => {
    // First get the appropriate field based on current language
    const name = currentLanguage === 'zh' ? machine.name_zh : machine.name_en;
    
    // If the selected language field is empty, fall back to the other language
    if (!name) {
      const fallbackName = currentLanguage === 'zh' ? machine.name_en : machine.name_zh;
      return safeTextContent(fallbackName || machine.model || 'N/A');
    }
    
    // Use safeTextContent to handle any encoding issues
    return safeTextContent(name);
  };

  const getMachineDescription = (machine: MachinePart): string => {
    // First get the appropriate field based on current language
    const desc = currentLanguage === 'zh' ? machine.model_description_zh : machine.model_description_en;
    
    // If the selected language field is empty, fall back to the other language
    if (!desc) {
      const fallbackDesc = currentLanguage === 'zh' ? machine.model_description_en : machine.model_description_zh;
      return safeTextContent(fallbackDesc || '');
    }
    
    // Use safeTextContent to handle any encoding issues
    return safeTextContent(desc);
  };

  // 获取主机型号数据的函数
  const fetchHostModels = async () => {
    if (!category) return;
    
    setHostModelsLoading(true);
    try {
      console.log('🔍 [fetchHostModels] Fetching host models for product line:', category);
      
      // 使用与其他API一致的WordPress API URL格式
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
      const apiUrl = `${baseUrl}/host-models?product_line_id=${category}&lang=${currentLanguage}&status=publish`;
      
      console.log('🔍 [fetchHostModels] API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      console.log('🔍 [fetchHostModels] API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [fetchHostModels] API response data:', data);
        
        if (data && data.success && Array.isArray(data.data)) {
          console.log('✅ [fetchHostModels] Using API data:', data.data);
          setHostModels(data.data);
          return;
        } else if (data && Array.isArray(data.data)) {
          console.log('✅ [fetchHostModels] Using API data (alternative structure):', data.data);
          setHostModels(data.data);
          return;
        } else {
          console.log('⚠️ [fetchHostModels] API returned empty data or no published models found');
        }
      } else {
        console.log('⚠️ [fetchHostModels] API request failed:', response.status, response.statusText);
      }
      
      // API失败或无数据时，显示空列表而非Mock数据
      // 这确保只显示真实的、已发布状态的主机型号
      console.log('📋 [fetchHostModels] No published host models available, showing empty list');
      setHostModels([]);
      
    } catch (error) {
      console.error('❌ [fetchHostModels] Failed to fetch host models:', error);
      
      // 错误时也显示空列表，不使用Mock数据
      // 这确保用户只看到真实的、已发布的主机型号
      console.log('📋 [fetchHostModels] Error occurred, showing empty list to ensure data integrity');
      setHostModels([]);
    } finally {
      setHostModelsLoading(false);
    }
  };

  // 获取机器数据
  const fetchMachines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        // Try auto-login if no token
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'password123'
          }),
        });
        
        const loginData = await loginResponse.json();
        if (!loginData.success || !loginData.data?.token) {
          throw new Error('Auto-login failed');
        }
        localStorage.setItem('token', loginData.data.token);
      }

      // Fetch machines with retry logic
      const fetchWithRetry = async (retryCount = 0) => {
        try {
          const response = await fetch(`${API_BASE_URL}/machineparts?page=1&per_page=10&status=publish`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.status === 401 && retryCount < 3) {
            // Try to refresh token
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
            });
            
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data?.token) {
              localStorage.setItem('token', refreshData.data.token);
              return fetchWithRetry(retryCount + 1);
            }
          }

          const data = await response.json();
          console.log('API raw response:', data); // Debug log

          if (!data.success) {
            throw new Error(data.message || 'Failed to fetch machines');
          }

          // Handle the actual response format
          if (!data.data || !Array.isArray(data.data.items)) {
            throw new Error('Invalid response format');
          }

          setMachines(data.data.items);
          setTotal(data.data.total);
          setCurrentPage(data.data.page);
          setPageSize(data.data.per_page);
          setTotalPages(data.data.total_pages);
        } catch (error) {
          if (retryCount < 3) {
            return fetchWithRetry(retryCount + 1);
          }
          throw error;
        }
      };

      await fetchWithRetry();
    } catch (error) {
      console.error('Error fetching machines:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch machines');
    } finally {
      setLoading(false);
    }
  };
  
  // 当有机器被选中时自动加载其配件
  useEffect(() => {
    fetchMachines();
    fetchHostModels();
  }, [category, currentLanguage, filterRegion, selectedVoltage]);
  
  // 当选择机器变化时，自动加载配件
  useEffect(() => {
    if (selectedMachine && selectedMachine !== previousMachineRef.current) {
      console.log('🔧 [useEffect] Machine selection changed:', {
        selectedMachine,
        previousMachine: previousMachineRef.current
      });
      
      // 立即清除之前的配件状态
      setAccessories([]);
      setLevel2Accessories([]);
      setLevel3Accessories([]);
      setLevel4Accessories([]);
      setLevel5Accessories([]);
      
      let isCancelled = false;
      
      const loadAccessories = async () => {
        setAccessoriesLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          
          // 获取选中机器的信息
          const selectedMachineData = machines.find(m => m.id.toString() === selectedMachine);
          const machinePartNumber = selectedMachineData?.part_number || selectedMachine;
          
          console.log('🔍 [loadAccessories] Loading accessories for machine:', machinePartNumber);
          
          // 使用与其他API一致的WordPress API URL格式
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
          const apiUrl = `${baseUrl}/relations/${machinePartNumber}/accessories?lang=${currentLanguage}&region=${filterRegion}&max_levels=5&status=publish`;
          
          console.log('🔍 [loadAccessories] API URL:', apiUrl);
          
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
          
          const jsonData = await response.json();
          console.log('✅ [loadAccessories] Multi-level accessories loaded:', jsonData);
          console.log('🔍 [loadAccessories] Raw API response structure:', {
            success: jsonData.success,
            hasData: !!jsonData.data,
            hasAccessories: !!(jsonData.data && jsonData.data.accessories),
            accessoriesCount: jsonData.data?.accessories?.length || 0,
            firstAccessoryRaw: jsonData.data?.accessories?.[0] || null
          });
          
          if (jsonData.success && jsonData.data && jsonData.data.accessories) {
            const accessoriesData = jsonData.data.accessories;
            
            // 详细检查第一个配件的数据结构
            if (accessoriesData.length > 0) {
              const firstItem = accessoriesData[0];
              console.log('🔍 [loadAccessories] First accessory detailed structure:', {
                id: firstItem.id,
                model: firstItem.model,
                name: firstItem.name,
                part_number: firstItem.part_number,
                voltage: firstItem.voltage,
                frequency: firstItem.frequency,
                package_size_cm: firstItem.package_size_cm,
                package_size_inch: firstItem.package_size_inch,
                pcs_per_box: firstItem.pcs_per_box,
                pallet_size_cm: firstItem.pallet_size_cm,
                pallet_size_inch: firstItem.pallet_size_inch,
                pcs_per_pallet: firstItem.pcs_per_pallet,
                allKeys: Object.keys(firstItem),
                fullObject: firstItem
              });
              
              // 检查是否有其他可能的字段名称
              console.log('🔍 [loadAccessories] Checking for alternative field names:', {
                // 可能的包装尺寸字段
                packageSize: firstItem.packageSize,
                package_size: firstItem.package_size,
                packaging_size: firstItem.packaging_size,
                // 可能的托盘尺寸字段
                palletSize: firstItem.palletSize,
                pallet_size: firstItem.pallet_size,
                // 可能的数量字段
                pcsPerBox: firstItem.pcsPerBox,
                pieces_per_box: firstItem.pieces_per_box,
                qty_per_box: firstItem.qty_per_box,
                pcsPerPallet: firstItem.pcsPerPallet,
                pieces_per_pallet: firstItem.pieces_per_pallet,
                qty_per_pallet: firstItem.qty_per_pallet,
                // 可能的频率字段
                freq: firstItem.freq,
                hz: firstItem.hz
              });
            }
            
            // 转换为前端需要的格式
            const convertedAccessories: MachineAccessory[] = accessoriesData.map((item: any) => ({
              id: item.id || '',
              model: item.model || '',
              title: item.name || '',
              level: 1, // 一级配件
              image_url: item.image_url || '',
              // 在根级别保存这些字段，便于访问
              part_number: item.part_number || '',
              voltage: item.voltage || '',
              frequency: item.frequency || '',
              package_size_cm: item.package_size_cm || '',
              package_size_inch: item.package_size_inch || '',
              pcs_per_box: item.pcs_per_box || '',
              pallet_size_cm: item.pallet_size_cm || '',
              pallet_size_inch: item.pallet_size_inch || '',
              pcs_per_pallet: item.pcs_per_pallet || '',
              parts: [{
                id: item.id || '',
                part_number: item.part_number || '',
                title: item.name || '',
                specs: {
                  spec: item.spec || '',
                  voltage: item.voltage || '',
                  frequency: item.frequency || '',
                  package_size_cm: item.package_size_cm || '',
                  package_size_inch: item.package_size_inch || '',
                  pcs_per_box: item.pcs_per_box || '',
                  pallet_size_cm: item.pallet_size_cm || '',
                  pallet_size_inch: item.pallet_size_inch || '',
                  pcs_per_pallet: item.pcs_per_pallet || ''
                },
                spec: item.spec || '',
                spec_imperial: item.spec_imperial || '',
                prices: {
                  base: item.pricing?.base_price || 0,
                  tier1: 0,
                  tier2: 0,
                  vip: 0
                },
                inventory: item.inventory || []
              }],
              children: item.children || [] // 保存子配件数据供后续使用
            }));
            
            console.log('🔍 [loadAccessories] Converted accessories:', {
              count: convertedAccessories.length,
              accessories: convertedAccessories
            });
            
            if (!isCancelled) {
              setAccessories(convertedAccessories);
              
              // 显示配件区域
              const accessoryDiv = document.getElementById('accessory-level-1');
              if (accessoryDiv) {
                accessoryDiv.style.display = 'block';
              }
              
              // 更新上一次选择的机器引用
              previousMachineRef.current = selectedMachine;
              setAutoLoadedAccessories(true);
            }
          } else {
            console.warn('⚠️ [loadAccessories] No accessories data in response:', jsonData);
            if (!isCancelled) {
              setAccessories([]);
            }
          }
          
        } catch (error) {
          console.error('❌ [loadAccessories] Failed to load accessories:', error);
          if (!isCancelled) {
            setAccessories([]);
            showErrorToast('加载配件失败', (error as Error).message);
          }
        } finally {
          if (!isCancelled) {
            setAccessoriesLoading(false);
          }
        }
      };
      
      loadAccessories();
      
      return () => {
        isCancelled = true;
      };
    }
  }, [selectedMachine, machines, currentLanguage, filterRegion]); // 添加必要的依赖项
  
  // 过滤产品
  const filteredMachines = React.useMemo(() => {
    // Ensure machines is always an array before filtering
    if (!Array.isArray(machines)) {
      console.warn('⚠️ [filteredMachines] machines is not an array:', machines);
      return [];
    }
    
    let filtered = machines;
    if (filterType !== 'all') {
      filtered = machines.filter(machine => {
        if (!machine) return false;
        const name = getMachineName(machine).toLowerCase();
        const identifier = machine.part_number?.toLowerCase() || '';
        return identifier.includes(filterType.toLowerCase()) || 
               name.includes(filterType.toLowerCase());
      });
    }
    
    // Check for duplicate IDs
    const ids = filtered.map(m => m.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.warn('⚠️ [filteredMachines] Duplicate machine IDs detected:', {
        totalMachines: ids.length,
        uniqueIds: uniqueIds.size,
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        machines: filtered
      });
    }
    
    return filtered;
  }, [machines, filterType, currentLanguage]);
  
  // 格式化日期
  const formatDate = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `今日 ${hours}:${minutes}`;
  };
  
  // 格式化价格
  const formatPrice = (price: number): string => {
    return safeToLocaleString(price);
  };
  
  // 获取区域库存
  const getRegionInventory = (product: MachinePart, region: string): number => {
    const regionInventory = product.inventory?.find(inv => inv.region === region);
    return regionInventory ? regionInventory.quantity : 0;
  };
  
  // 处理数量变更
  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities({
      ...quantities,
      [productId]: value
    });
  };
  
  // 渲染购物车通知
  const renderCartNotification = () => {
    if (!showNotification) return null;
    
    return (
      <div 
        className="cart-notification" 
        role="alert" 
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="notification-icon" aria-hidden="true">
          <ShoppingCartOutlined />
        </div>
        <div className="notification-content">
          <div className="notification-title">
            {notificationProduct} {t('machines.notification.added')}
          </div>
          <div className="notification-details">
            {t('machines.notification.quantity')}: {notificationQuantity}
          </div>
        </div>
        <button 
          className="notification-close" 
          onClick={hideCartNotification}
          aria-label={t('buttons.close')}
        >
          {t('buttons.close')}
        </button>
        <div className="notification-actions">
          <button 
            className="go-to-cart-btn" 
            onClick={goToCart}
            aria-label={t('buttons.checkout')}
          >
            <ShoppingCartOutlined aria-hidden="true" /> {t('buttons.checkout')}
          </button>
        </div>
      </div>
    );
  };

  // 隐藏购物车通知
  const hideCartNotification = () => {
    setShowNotification(false);
  };
  
  // 验证配件关联关系的函数
  const validateAccessoryRelationship = (
    accessory: MachineAccessory, 
    level: number
  ): boolean => {
    console.log('🔍 [validateAccessoryRelationship] Validating relationship for:', {
      accessory: accessory.title,
      accessoryId: accessory.id,
      level,
      selectedMachine,
      selectedAccessories
    });

    // 1. 验证是否选择了主机
    if (!selectedMachine) {
      console.warn('⚠️ [validateAccessoryRelationship] No machine selected');
      return false;
    }

    // 2. 验证主机关联关系
    const selectedMachineData = machines.find(m => m.id.toString() === selectedMachine);
    if (!selectedMachineData) {
      console.warn('⚠️ [validateAccessoryRelationship] Selected machine not found');
      return false;
    }

    // 3. 验证配件级别关联关系
    if (level > 1) {
      // 对于二级及以上配件，需要验证与上级配件的关联关系
      const parentLevelKey = `level${level - 1}`;
      const parentAccessoryId = selectedAccessories[parentLevelKey];
      
      if (!parentAccessoryId) {
        console.warn('⚠️ [validateAccessoryRelationship] Parent accessory not selected for level', level);
        return false;
      }

      // 这里可以添加更详细的parent-child关系验证
      // 目前简化为检查是否有上级配件选择
      console.log('✅ [validateAccessoryRelationship] Parent accessory found:', parentAccessoryId);
    }

    // 4. 验证配件是否属于当前选择的配件链路
    console.log('✅ [validateAccessoryRelationship] Relationship validation passed');
    return true;
  };

  // 为配件添加必选备件到购物车
  const addRequiredPartsToCartForAccessory = async (
    mainAccessory: MachineAccessory, 
    mainQuantity: number,
    level: number
  ) => {
    console.log('📋 [addRequiredPartsToCartForAccessory] Starting for:', {
      accessory: mainAccessory.title,
      accessoryId: mainAccessory.id,
      level,
      mainQuantity
    });

    // 1. 验证关联关系
    if (!validateAccessoryRelationship(mainAccessory, level)) {
      console.warn('⚠️ [addRequiredPartsToCartForAccessory] Relationship validation failed, skipping required parts');
      return;
    }

    // 2. 获取配件的必选备件信息
    const accessoryPart = mainAccessory.parts?.[0];
    const partNumber = accessoryPart?.part_number || 
                      (mainAccessory as any).part_number ||
                      mainAccessory.model;

    if (!partNumber) {
      console.warn('⚠️ [addRequiredPartsToCartForAccessory] No part number found for accessory');
      return;
    }

    console.log('🔍 [addRequiredPartsToCartForAccessory] Fetching required parts for part number:', partNumber);

    try {
      // 3. 通过API获取配件的必选备件信息
      const response = await fetch(`/wp-json/bjt/v1/accessories?part_number=${partNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        console.warn('⚠️ [addRequiredPartsToCartForAccessory] Failed to fetch accessory details from API');
        return;
      }

      const accessoryData = await response.json();
      console.log('📦 [addRequiredPartsToCartForAccessory] Fetched accessory data from API:', accessoryData);

      // 4. 从API响应中获取必选备件信息
      let requiredPartsInfo: Array<{part_number: string, quantity: number}> = [];

      // API返回的是一个包含items数组的响应
      if (accessoryData.items && accessoryData.items.length > 0) {
        const accessoryItem = accessoryData.items[0]; // 取第一个匹配的配件
        if (accessoryItem.required_parts && Array.isArray(accessoryItem.required_parts)) {
          requiredPartsInfo = accessoryItem.required_parts;
        }
      }

      if (requiredPartsInfo.length === 0) {
        console.log('📝 [addRequiredPartsToCartForAccessory] No required parts found for accessory from API');
        return;
      }

      console.log('📋 [addRequiredPartsToCartForAccessory] Found required parts from API:', {
        part_number: partNumber,
        required_parts_info: requiredPartsInfo,
        mainQuantity
      });

      // 5. 转换为必选备件工具函数需要的格式
      const requiredPartsString = requiredPartsInfo.map(p => p.part_number).join(',');
      const requiredQuantityString = requiredPartsInfo.map(p => p.quantity.toString()).join(',');

      // 6. 使用现有的必选备件工具函数
      const requiredPartsFullInfo = await fetchRequiredPartsFullInfo(
        requiredPartsString,
        requiredQuantityString,
        partNumber
      );

      console.log('📦 [addRequiredPartsToCartForAccessory] Fetched required parts full info:', requiredPartsFullInfo);

      const addedParts = [];
      const failedParts = [];

      // 7. 添加每个必选备件到购物车
      for (const requiredPart of requiredPartsFullInfo) {
        try {
          const totalQuantity = requiredPart.quantity * mainQuantity;
          const cartItem = createRequiredPartCartItem(requiredPart, totalQuantity);
          
          await addItem(cartItem);
          addedParts.push(requiredPart.part_number);
          console.log(`➕ [addRequiredPartsToCartForAccessory] Added required part: ${requiredPart.part_number}`);
        } catch (error) {
          failedParts.push(requiredPart.part_number);
          console.error(`❌ [addRequiredPartsToCartForAccessory] Failed to add required part ${requiredPart.part_number}:`, error);
        }
      }

      if (addedParts.length > 0) {
        console.log('✅ [addRequiredPartsToCartForAccessory] Successfully added required parts:', addedParts);
        info(`已自动添加 ${addedParts.length} 个必选备件到购物车`);
      }

      if (failedParts.length > 0) {
        console.warn('⚠️ [addRequiredPartsToCartForAccessory] Failed to add some required parts:', failedParts);
        warning(`${failedParts.length} 个必选备件添加失败`);
      }
    } catch (error) {
      console.error('❌ [addRequiredPartsToCartForAccessory] Error processing required parts:', error);
      showErrorToast('处理必选备件失败', (error as Error).message);
    }
  };

  // 添加到购物车
  const handleAddToCart = async (product: MachinePart | MachineAccessory, productType: 'machine' | 'accessory' = 'machine') => {
    try {
      const isMachineProduct = (p: MachinePart | MachineAccessory): p is MachinePart => productType === 'machine';
      
      // 确定后端产品类型映射
      let backendProductType: 'machine' | 'accessory' | 'spare_part' | 'consumable';
      if (productType === 'machine') {
        backendProductType = 'machine';
      } else {
        backendProductType = 'accessory';
      }

      const quantity = quantities[product.id] || 1;
      let partNumber: string;
      let properties: any = {};
      let itemSpecs: any = {};

      if (isMachineProduct(product)) {
        // 强化part_number提取逻辑，添加多个fallback选项
        partNumber = product.part_number || 
                    (product as any).partNumber || 
                    (product as any).code || 
                    product.model || 
                    `MACHINE-${product.id}`;
        
        console.log('🔍 [handleAddToCart] Machine partNumber extracted:', partNumber);
        
        properties = {
          'part_number': partNumber, // 使用提取的partNumber
          'model': product.model,
          'voltage': product.voltage,
          'spec': product.spec,
          'spec_imperial': product.spec_imperial,
          'selected_voltage': selectedVoltage
        };
        itemSpecs = {
          'part_number': partNumber, // 使用提取的partNumber
          'model': product.model,
          'voltage': product.voltage,
          'spec': product.spec,
          'spec_imperial': product.spec_imperial,
          'net_weight_kg': product.net_weight_kg,
          'partNumber': partNumber, // 使用提取的partNumber
          'productName': getMachineName(product)
        };
      } else {
        const accessory = product as MachineAccessory;
        const accessoryPart = accessory.parts?.[0];
        const partSpecs = accessoryPart?.specs;
        
        console.log('🔍 [handleAddToCart] Processing accessory product:', {
          accessory,
          accessoryPart,
          partSpecs,
          accessoryModel: accessory.model
        });
        
        // 强化配件part_number提取逻辑，添加多个fallback选项
        partNumber = accessoryPart?.part_number || 
                    (accessory as any).part_number ||
                    (accessory as any).partNumber ||
                    (accessory as any).code ||
                    accessory.model || 
                    `ACCESSORY-${accessory.id}`;
        
        console.log('🔍 [handleAddToCart] Accessory partNumber extracted:', partNumber);
        
        if (partSpecs) {
          properties = { 
            ...partSpecs,
            'part_number': partNumber // 确保part_number在properties中
          };
          itemSpecs = {
            ...partSpecs,
            'part_number': partNumber,
            'partNumber': partNumber,
            'productName': accessory.title
          };
        } else {
          // 如果没有partSpecs，创建基本的properties
          properties = {
            'part_number': partNumber,
            'model': accessory.model,
            'title': accessory.title
          };
          itemSpecs = {
            'part_number': partNumber,
            'partNumber': partNumber,
            'productName': accessory.title
          };
        }
      }

      // 确保part_number不为空 - 强化检查
      if (!partNumber || partNumber.trim() === '') {
        console.error('❌ [handleAddToCart] partNumber is empty after all fallbacks!', {
          product,
          productType,
          isMachine: isMachineProduct(product),
          productPartNumber: isMachineProduct(product) ? (product as MachinePart).part_number : 'N/A',
          accessoryPartNumber: !isMachineProduct(product) ? (product as MachineAccessory).parts?.[0]?.part_number : 'N/A',
          extractedPartNumber: partNumber,
          allProductFields: Object.keys(product)
        });
        
        // 作为最后的fallback，使用产品ID
        partNumber = `FALLBACK-${productType.toUpperCase()}-${product.id}`;
        console.warn('⚠️ [handleAddToCart] Using fallback part number:', partNumber);
        
        // 更新properties中的part_number
        properties['part_number'] = partNumber;
        itemSpecs['part_number'] = partNumber;
        itemSpecs['partNumber'] = partNumber;
      }

      const productName = isMachineProduct(product) ? getMachineName(product) : product.title;
      const productCode = partNumber;
      const productImage = product.image_url || '';
      const productCategory = productType === 'machine' ? '设备' : '配件';
      const productIdNum = typeof product.id === 'number' ? product.id : parseInt(product.id, 10);
      
      let price = 0;
      let priceTiers: any[] = [];

      if (isMachineProduct(product)) {
        if (product.prices && product.prices.length > 0 && product.prices[0].tiers && product.prices[0].tiers.length > 0) {
          price = product.prices[0].tiers[0].base_price;
          priceTiers = product.prices[0].tiers.map(t => ({ 
            min: t.min_quantity, 
            max: t.max_quantity, 
            base_price: t.base_price,
            discount_rate: t.discount_rate
          }));
        } else {
          price = 0; 
          priceTiers = [];
        }
      } else {
        const accessory = product as MachineAccessory;
        const accessoryPrices = accessory.parts?.[0]?.prices;
        if (accessoryPrices) {
          price = accessoryPrices.base || 0;
          priceTiers = [
            { min: 1, max: 4, base_price: accessoryPrices.base },
            { min: 5, max: 9, base_price: accessoryPrices.tier1 },
            { min: 10, max: null, base_price: accessoryPrices.tier2 }
          ];
        } else {
          price = 0;
          priceTiers = [];
        }
      }

      console.log('🛒 [handleAddToCart] Calling addItem with data:', {
        productName,
        productCode,
        productIdNum,
        quantity,
        price,
        backendProductType,
        properties
      });

      // 只调用 addItem，它会内部处理 cartService.addToCart 调用
      await addItem({
        // 原始CartItem字段
        item_id: productIdNum,
        product_type: backendProductType, // 修复类型错误
        product_id: productIdNum,
        part_number: productCode,
        quantity: quantity,
        name: productName,
        image_url: productImage,
        unit_price: price,
        currency: getCurrencySymbol(userRegion),
        line_total: price * quantity,
        inventory_status: 'in_stock',
        added_at: new Date().toISOString(),
        
        // ExtendedCartItem字段
        id: product.id.toString(),
        code: productCode,
        partNumber: productCode,
        image: productImage,
        category: productCategory,
        productId: productIdNum,
        price: price,
        selected: true,
        priceTiers: priceTiers,
        type: productType,
        specs: {
          partNumber: productCode,
          productName: productName
        },
        properties: properties
      });

      // 🔥 **关键逻辑：配件必选备件处理**
      if (productType === 'accessory') {
        console.log('🔍 [handleAddToCart] Processing accessory, checking for required parts...');
        console.log('🔍 [handleAddToCart] Accessory details:', {
          accessory: product,
          accessoryId: product.id,
          accessoryTitle: (product as MachineAccessory).title,
          accessoryModel: (product as MachineAccessory).model,
          selectedAccessories,
          selectedMachine
        });
        
        // 确定配件的级别
        let accessoryLevel = 1;
        
        // 通过selectedAccessories状态确定当前配件的级别
        for (let level = 1; level <= 5; level++) {
          const levelKey = `level${level}`;
          if (selectedAccessories[levelKey] === product.id.toString()) {
            accessoryLevel = level;
            break;
          }
        }
        
        console.log('📍 [handleAddToCart] Determined accessory level:', accessoryLevel);
        console.log('📍 [handleAddToCart] Selected accessories state:', selectedAccessories);
        
        // 调用必选备件处理函数
        try {
          await addRequiredPartsToCartForAccessory(
            product as MachineAccessory,
            quantity,
            accessoryLevel
          );
          console.log('✅ [handleAddToCart] Required parts processing completed');
        } catch (error) {
          console.error('❌ [handleAddToCart] Required parts processing failed:', error);
        }
      } else {
        console.log('📝 [handleAddToCart] Product is not accessory, skipping required parts processing');
      }
      
      setNotificationProduct(productName);
      setNotificationQuantity(quantity);
      setShowNotification(true);
      setTimeout(hideCartNotification, 3000);
      success(t('messages.addedToCart'));

    } catch (err: any) {
      console.error('❌ [handleAddToCart] Error details:', {
        error: err,
        message: err.message,
        stack: err.stack,
        product: product,
        productType: productType
      });
      
      // 提供更详细的错误信息
      let errorMessage = err.message || t('errors.systemError');
      if (err.message?.includes('part_number')) {
        errorMessage = '产品料号信息缺失，请刷新页面重试或联系技术支持';
      } else if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        errorMessage = '认证失效，请刷新页面重新登录';
      } else if (err.message?.includes('400')) {
        errorMessage = '请求参数错误，请检查产品信息';
      }
      
      showErrorToast('添加到购物车失败', errorMessage);
    }
  };
  
  // 处理机器选择
  const handleMachineSelection = async (machineId: string | number) => {
    const currentMachineIdStr = typeof machineId === 'number' ? machineId.toString() : machineId;
    setSelectedMachine(currentMachineIdStr);
    setSelectedAccessories({});
    setSelectedAccessoryNames({});
    
    // 清理所有级别的配件状态
    setAccessories([]);
    setLevel2Accessories([]);
    setLevel3Accessories([]);
    setLevel4Accessories([]);
    setLevel5Accessories([]);
    
    // 隐藏所有配件区域
    for (let i = 1; i <= 5; i++) {
      const accessoryDiv = document.getElementById(`accessory-level-${i}`);
      if (accessoryDiv) {
        accessoryDiv.style.display = 'none';
      }
    }
    
    setAutoLoadedAccessories(false); // Reset auto-load flag
    previousMachineRef.current = ''; // Reset previous machine reference
    
    // The rest of the accessory loading is now handled by the useEffect hook that watches selectedMachine
  };
  
  // 查看配件详情
  const handleViewAccessory = (accessoryId: string) => {
    // 实现查看配件详情功能
  };
  
  // 查看产品详情
  const handleViewDetails = (machineId: string) => {
    // 可以跳转到详情页
    navigate(`/product-detail/${machineId}`);
  };
  
  // 前往购物车
  const goToCart = () => {
    navigate('/cart');
  };
  
  // 渲染机器表格
  const renderMachinesTable = () => {
    return (
      <div className="grid grid-cols-1 gap-6">
          {filteredMachines.map(machine => (
          <div 
            key={`machine-${machine.id}-${machine.part_number}`} 
            className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border text-content overflow-hidden"
          >
            <div className="flex flex-col md:flex-row p-6">
              {/* Column 1: Image & Selection */}
              <div className="w-full md:w-1/5 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                <div className="relative mb-4">
                  <img 
                    src={machine.image_url || '/images/placeholder.jpg'} 
                    alt={machine.part_number}
                    className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-card-alt p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                  />
                </div>
                <label className="inline-flex items-center cursor-pointer bg-card-alt px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200">
                  <input 
                    type="radio" 
                    name="machine" 
                    className="form-radio text-primary mr-2"
                    checked={selectedMachine === machine.id.toString()}
                    onChange={() => handleMachineSelection(machine.id)}
                    aria-label={`${t('machines.tableHeaders.selection')} ${machine.part_number}`}
                  />
                  <span className="text-sm font-medium">选择主机</span>
                </label>
              </div>
                
              {/* Column 2: Info & Specs */}
              <div className="w-full md:w-3/5 md:px-6">
                <div className="mb-4">
                  <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{machine.part_number}</span>
                  <h3 className="text-xl font-bold text-title mt-2 leading-tight">{getMachineName(machine)}</h3>
                </div>
                
                <div className="bg-card-alt rounded-lg p-4 mt-3 shadow-sm">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <strong className="w-24 text-label font-medium">型号:</strong>
                      <span className="text-content font-medium">{machine.model}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-label font-medium">电压:</strong>
                      <span className="text-content font-medium">{machine.voltage || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-label font-medium">单箱数量:</strong>
                      <span className="text-content font-medium">{machine.pcs_per_box !== null && machine.pcs_per_box !== undefined ? machine.pcs_per_box : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-label font-medium">一托数量:</strong>
                      <span className="text-content font-medium">{machine.pcs_per_pallet !== null && machine.pcs_per_pallet !== undefined ? machine.pcs_per_pallet : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-label font-medium">托盘尺寸:</strong>
                      <span className="text-content font-medium">
                        {unitSystem === 'metric' 
                          ? (machine.pallet_size_cm || 'N/A')
                          : (machine.pallet_size_inch || 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-label font-medium">包装尺寸:</strong>
                      <span className="text-content font-medium">
                        {unitSystem === 'metric' 
                          ? (machine.package_size_cm || 'N/A')
                          : (machine.package_size_inch || 'N/A')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button 
                    size="small"
                    icon={<InfoCircleOutlined />}
                    onClick={() => {
                      if (machine.model_explosion_diagram_pdf) {
                        window.open(machine.model_explosion_diagram_pdf, '_blank');
                      } else {
                        info(t('noSpecDetailsPdf') || '暂无规格详情PDF文件');
                      }
                    }}
                    className="bg-secondary-light text-secondary hover:bg-secondary hover:text-white border-secondary transition-colors duration-200"
                  >
                    规格详情
                  </Button>
                  
                  <Tooltip
                    title={
                      <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                          <InfoCircleOutlined className="text-blue-500 mr-2" />
                          <span className="font-bold text-gray-800 text-sm">产品详细信息</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">📦 包装尺寸:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' ? (machine.package_size_cm || '待补充') : (machine.package_size_inch || '待补充')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">⚖️ 单件净重:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.net_weight_kg !== null && machine.net_weight_kg !== undefined ? `${machine.net_weight_kg} kg` : '待补充')
                                : (machine.net_weight_lbs !== null && machine.net_weight_lbs !== undefined ? `${machine.net_weight_lbs} lbs` : '待补充')
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">📏 打托高度:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.pallet_height_cm !== null && machine.pallet_height_cm !== undefined ? `${machine.pallet_height_cm} cm` : '待补充')
                                : (machine.pallet_height_inch !== null && machine.pallet_height_inch !== undefined ? `${machine.pallet_height_inch} inch` : '待补充')
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">🏗️ 整托毛重:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-purple-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.pallet_gross_weight_kg !== null && machine.pallet_gross_weight_kg !== undefined ? `${machine.pallet_gross_weight_kg} kg` : '待补充')
                                : (machine.pallet_gross_weight_lbs !== null && machine.pallet_gross_weight_lbs !== undefined ? `${machine.pallet_gross_weight_lbs} lbs` : '待补充')
                              }
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                          <span className="text-xs text-gray-500">💡 悬停查看详细规格信息</span>
                        </div>
                      </div>
                    }
                    placement="topRight"
                    styles={{ 
                      root: {
                        maxWidth: '350px',
                        zIndex: 1000
                      }
                    }}
                    classNames={{ root: "custom-tooltip" }}
                    color="white"
                    arrow={true}
                  >
                    <Button 
                      size="small"
                      icon={<InfoCircleOutlined />}
                      className="bg-accent-light text-accent hover:bg-accent hover:text-white border-accent transition-colors duration-200"
                    >
                      更多信息
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {/* Column 3: Price, Stock, Actions */}
              <div className="w-full md:w-1/5 md:pl-6 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0">
                <div className="mb-4">
                  <div className="font-medium text-sm text-label mb-2">
                    价格 ({getCurrencySymbol(userRegion)}):
                  </div>
                  
                  <div className="text-2xl font-bold text-price mb-2">
                    {getCurrencySymbol(userRegion)}{formatPrice((machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0) ? machine.prices[0].tiers[0].base_price : 0)}
                  </div>
                  
                  {machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0 && (
                    <div className="text-xs text-content-light">
                      {machine.prices[0].tiers.map((tier, index) => (
                        <div key={`machine-${machine.id}-price-tier-${index}-${tier.min_quantity}-${tier.max_quantity}`} className="mb-1">
                          {getCurrencySymbol(userRegion)}{formatPrice(tier.base_price)} ({tier.min_quantity}-{tier.max_quantity || '+'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {isSales && (
                  <div className="mb-4">
                    <div className="font-medium text-sm text-label mb-2">
                      库存:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => (
                        <Tag 
                          key={`${machine.id}-inventory-${regionKey}`}
                          color={getStockStatus(getRegionInventory(machine, regionKey)).colorClass}
                          className="text-xs"
                        >
                          {REGIONS[regionKey].nameCn}: {getRegionInventory(machine, regionKey)}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-card-alt rounded-lg p-2">
                    <Button 
                      icon={<MenuOutlined />}
                      onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) - 1)}
                      disabled={(quantities[machine.id.toString()] || 1) <= 1}
                      size="small"
                      style={{
                        backgroundColor: '#f3f4f6',
                        borderColor: '#d1d5db',
                        color: '#374151'
                      }}
                      className="hover:border-primary hover:bg-primary hover:text-white transition-colors duration-200"
                    />
                    <InputNumber
                      min={1}
                      value={quantities[machine.id.toString()] || 1}
                      onChange={(value: number | null) => handleQuantityChange(machine.id.toString(), value as number)}
                      className="w-16 text-center quantity-input-field"
                      size="small"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#333333',
                        borderColor: '#d1d5db'
                      }}
                    />
                    <Button 
                      icon={<PlusOutlined />}
                      onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) + 1)}
                      size="small"
                      style={{
                        backgroundColor: '#f3f4f6',
                        borderColor: '#d1d5db',
                        color: '#374151'
                      }}
                      className="hover:border-primary hover:bg-primary hover:text-white transition-colors duration-200"
                    />
                  </div>
                  
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => {
                      console.log('🛒 [Button Click] Add to cart button clicked for machine:', machine.id, machine.part_number);
                      handleAddToCart(machine, 'machine');
                    }}
                    disabled={!canAddToCart}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 h-10 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    size="large"
                  >
                    {canAddToCart ? t('buttons.addToCart') : '无权限添加'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 处理配件选择
  const handleAccessorySelection = async (level: number, accessoryId: string, accessoryName: string) => {
    setSelectedAccessories(prev => ({
      ...prev,
      [`level${level}`]: accessoryId
    }));
    setSelectedAccessoryNames(prev => ({
      ...prev,
      [`level${level}`]: accessoryName
    }));
    
    // 隐藏更高级别的配件区域
    for (let i = level + 1; i <= 5; i++) {
      const accessoryDiv = document.getElementById(`accessory-level-${i}`);
      if (accessoryDiv) {
        accessoryDiv.style.display = 'none';
      }
    }
    
    // 清除更高级别的选择状态
    setSelectedAccessories(prev => {
      const newState = { ...prev };
      for (let i = level + 1; i <= 5; i++) {
        if (newState[`level${i}`]) delete newState[`level${i}`];
      }
      return newState;
    });
    
    setSelectedAccessoryNames(prev => {
      const newState = { ...prev };
      for (let i = level + 1; i <= 5; i++) {
        if (newState[`level${i}`]) delete newState[`level${i}`];
      }
      return newState;
    });
    
    const nextLevel = level + 1;
    if (nextLevel <= 5) {
      const contextMessage = document.getElementById(`level${nextLevel}-context-message`);
      if (contextMessage) {
        let contextText = `${accessoryName} 的适配配件`;
        if (level > 1) contextText = `${level}级配件 ${accessoryName} 的下级适配件`;
        contextMessage.textContent = contextText;
      }
    }
    
    // 获取选中配件的子配件数据
    let currentLevelAccessories: MachineAccessory[] = [];
    if (level === 1) currentLevelAccessories = accessories;
    else if (level === 2) currentLevelAccessories = level2Accessories;
    else if (level === 3) currentLevelAccessories = level3Accessories;
    else if (level === 4) currentLevelAccessories = level4Accessories;

    const selectedAccessoryObject = currentLevelAccessories.find(acc => acc.id === accessoryId);

    if (!selectedAccessoryObject) {
      console.error(`Could not find selected accessory object for ID: ${accessoryId} at level ${level}`);
      showErrorToast('配件选择失败', '无法找到选中的配件信息');
      return;
    }

    // 检查是否有子配件数据
    const childrenData = (selectedAccessoryObject as any).children || [];
    
    if (childrenData.length === 0) {
      info(`${accessoryName} 没有下级配件`);
      return;
    }

    // 设置对应级别的加载状态
    let setLoadingState: React.Dispatch<React.SetStateAction<boolean>> = () => {};
    if (level === 1) setLoadingState = setLevel2Loading; 
    else if (level === 2) setLoadingState = setLevel3Loading;
    else if (level === 3) setLoadingState = setLevel4Loading;
    else if (level === 4) setLoadingState = setLevel5Loading;

    try {
      setLoadingState(true);
      
      console.log(`🔍 [handleAccessorySelection] Using cached children data for level ${nextLevel}:`, childrenData);
      
      // 转换子配件数据为前端格式
      const convertedAccessories: MachineAccessory[] = childrenData.map((item: any) => ({
        id: item.id || '',
        model: item.model || '',
        title: item.name || '',
        level: nextLevel,
        image_url: item.image_url || '',
        // 在根级别保存这些字段，便于访问
        part_number: item.part_number || '',
        voltage: item.voltage || '',
        frequency: item.frequency || '',
        package_size_cm: item.package_size_cm || '',
        package_size_inch: item.package_size_inch || '',
        pcs_per_box: item.pcs_per_box || '',
        pallet_size_cm: item.pallet_size_cm || '',
        pallet_size_inch: item.pallet_size_inch || '',
        pcs_per_pallet: item.pcs_per_pallet || '',
        parts: [{
          id: item.id || '',
          part_number: item.part_number || '',
          title: item.name || '',
          specs: {
            spec: item.spec || '',
            voltage: item.voltage || '',
            frequency: item.frequency || '',
            package_size_cm: item.package_size_cm || '',
            package_size_inch: item.package_size_inch || '',
            pcs_per_box: item.pcs_per_box || '',
            pallet_size_cm: item.pallet_size_cm || '',
            pallet_size_inch: item.pallet_size_inch || '',
            pcs_per_pallet: item.pcs_per_pallet || ''
          },
          spec: item.spec || '',
          spec_imperial: item.spec_imperial || '',
          prices: {
            base: item.pricing?.base_price || 0,
            tier1: 0,
            tier2: 0,
            vip: 0
          },
          inventory: item.inventory || []
        }],
        children: item.children || [] // 保存更深层级的子配件数据
      }));
      
      console.log('🔍 [handleAccessorySelection] Converted child accessories:', {
        level: nextLevel,
        count: convertedAccessories.length,
        accessories: convertedAccessories
      });
      
      // 设置对应级别的配件数据
      let setNextLevelAccessories: React.Dispatch<React.SetStateAction<MachineAccessory[]>> = () => {};
      let nextLevelDivId = '';

      if (level === 1) { 
        setNextLevelAccessories = setLevel2Accessories; 
        nextLevelDivId = 'accessory-level-2'; 
      } else if (level === 2) { 
        setNextLevelAccessories = setLevel3Accessories; 
        nextLevelDivId = 'accessory-level-3'; 
      } else if (level === 3) { 
        setNextLevelAccessories = setLevel4Accessories; 
        nextLevelDivId = 'accessory-level-4'; 
      } else if (level === 4) { 
        setNextLevelAccessories = setLevel5Accessories; 
        nextLevelDivId = 'accessory-level-5'; 
      }

      if (setNextLevelAccessories && nextLevelDivId) {
        setNextLevelAccessories(convertedAccessories);
        const nextDiv = document.getElementById(nextLevelDivId);
        if (nextDiv) {
          if (convertedAccessories.length > 0) {
            nextDiv.style.display = 'block';
          } else {
            nextDiv.style.display = 'none';
            info(`${accessoryName} 没有下级配件`);
          }
        }
      }
    } catch (err: any) {
      console.error(`❌ [handleAccessorySelection] Failed to process level ${nextLevel} accessories:`, err);
      showErrorToast('处理配件数据失败', err.message || '处理配件数据失败');
    } finally {
      setLoadingState(false);
    }
  };

  // 处理电压选择
  const handleVoltageChange = (voltage: string) => {
    setSelectedVoltage(voltage);
  };

  // 渲染配件路径导航
  const renderAccessoryPath = (level: number) => {
    // 只有二级及以上配件才需要显示路径
    if (level < 2) return null;
    
    const pathItems = [];
    
    // 添加主机
    if (selectedMachine) {
      const machine = machines.find(m => m.id.toString() === selectedMachine);
      if (machine) {
        pathItems.push(
          <div key={`machine-path-${level}-${machine.id}-${machine.part_number}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-background rounded mr-1">主机</span>
            <span className="text-content">{getMachineName(machine)}</span>
            </div>
        );
      }
    }
    
    // 添加各级配件
    for (let i = 1; i < level; i++) {
      const accessoryId = selectedAccessories[`level${i}`];
      const accessoryName = selectedAccessoryNames[`level${i}`];
      
      if (accessoryId && accessoryName) {
        pathItems.push(
          <div key={`accessory-level-${level}-path-${i}-${accessoryId}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-background rounded mr-1">{i}级配件</span>
            <span className="text-content">{accessoryName}</span>
          </div>
        );
      }
    }
    
    return (
      <div className="bg-card p-3 rounded-lg shadow-sm mb-4 flex flex-wrap items-center border border-border transition-colors duration-300">
        {pathItems.map((item, index) => (
          <React.Fragment key={`path-level-${level}-item-${index}`}>
            {item}
            {index < pathItems.length - 1 && (
              <span className="mx-2 text-content-light">
                <RightOutlined style={{ fontSize: '10px' }} />
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // 显示加载状态
  const showLoading = () => {
    return (
      <div className="flex justify-center items-center p-16 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
        <LoadingState 
          size="large" 
          text={t('loading.machines')} 
          type="spinner"
        />
      </div>
    );
  };

  // 显示错误状态
  const showErrorState = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
        <ExclamationCircleOutlined className="text-error text-4xl mb-4" />
        <h3 className="text-lg font-semibold text-title mb-2">
          {t('errors.loadingFailed')}
        </h3>
        <p className="text-content mb-4 text-center max-w-md">
          {error || t('errors.systemError')}
        </p>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
            onClick={() => window.location.reload()} 
          className="bg-primary hover:bg-primary-dark border-none"
          >
          {t('buttons.retry')}
        </Button>
      </div>
    );
  };

  // 显示配件部分
  const showAccessoryLevels = () => {
    return (
      <>
        <div id="accessory-level-1" className="accessory-level accessory-level-1 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded">一级配件</span>
              </h2>
              <span id="level1-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-1');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {accessoriesLoading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <LoadingState 
                  size="medium" 
                  text="加载配件中..." 
                  type="spinner"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {accessories.map((accessory, index) => renderAccessory(accessory, 1, index))}
                {accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <div className="text-content-light">无可用配件</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-2" className="accessory-level accessory-level-2 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-white rounded">二级配件</span>
              </h2>
              <span id="level2-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-2');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(2)}
            
            {level2Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <LoadingState 
                  size="medium" 
                  text="加载配件中..." 
                  type="spinner"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {level2Accessories.map((accessory, index) => renderAccessory(accessory, 2, index))}
                {level2Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <div className="text-content-light">无可用配件</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-3" className="accessory-level accessory-level-3 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-accent text-white rounded">三级配件</span>
              </h2>
              <span id="level3-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-3');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(3)}
            
            {level3Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <LoadingState 
                  size="medium" 
                  text="加载配件中..." 
                  type="spinner"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {level3Accessories.map((accessory, index) => renderAccessory(accessory, 3, index))}
                {level3Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <div className="text-content-light">无可用配件</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-4" className="accessory-level accessory-level-4 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-warning text-white rounded">四级配件</span>
              </h2>
              <span id="level4-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-4');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(4)}
            
            {level4Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <LoadingState 
                  size="medium" 
                  text="加载配件中..." 
                  type="spinner"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {level4Accessories.map((accessory, index) => renderAccessory(accessory, 4, index))}
                {level4Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <div className="text-content-light">无可用配件</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-5" className="accessory-level accessory-level-5 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-error text-white rounded">五级配件</span>
              </h2>
              <span id="level5-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-5');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(5)}
            
            {level5Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <LoadingState 
                  size="medium" 
                  text="加载配件中..." 
                  type="spinner"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {level5Accessories.map((accessory, index) => renderAccessory(accessory, 5, index))}
                {level5Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <div className="text-content-light">无可用配件</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // 渲染配件部分
  const renderAccessory = (accessory: MachineAccessory, level: number, index: number) => {
    const accessoryPart = accessory.parts?.[0];
    const partSpecs = accessoryPart?.specs;
    
    console.log('🔍 [renderAccessory] Accessory data:', {
      accessory,
      accessoryPart,
      partSpecs,
      level,
      index
    });

    const getFieldValue = (field: string) => {
      // 首先尝试从 partSpecs 获取
      if (partSpecs && partSpecs.hasOwnProperty(field)) {
        const value = partSpecs[field];
        console.log(`✅ [getFieldValue] Found ${field} in partSpecs:`, value);
        // 检查是否为null、undefined或空字符串
        if (value === null || value === undefined || value === '') {
          return 'N/A';
        }
        return value;
      }
      // 然后尝试从 accessoryPart 获取
      if (accessoryPart && (accessoryPart as any).hasOwnProperty(field)) {
        const value = (accessoryPart as any)[field];
        console.log(`✅ [getFieldValue] Found ${field} in accessoryPart:`, value);
        // 检查是否为null、undefined或空字符串
        if (value === null || value === undefined || value === '') {
          return 'N/A';
        }
        return value;
      }
      // 最后尝试从 accessory 根级别获取
      if ((accessory as any).hasOwnProperty(field)) {
        const value = (accessory as any)[field];
        console.log(`✅ [getFieldValue] Found ${field} in accessory root:`, value);
        // 检查是否为null、undefined或空字符串
        if (value === null || value === undefined || value === '') {
          return 'N/A';
        }
        return value;
      }
      console.log(`❌ [getFieldValue] Field ${field} not found in any location`);
      return 'N/A';
    };

    // 检查是否为电气配件（有电压或频率信息）
    const isElectricalAccessory = () => {
      const voltage = getFieldValue('voltage');
      const frequency = getFieldValue('frequency');
      return voltage !== 'N/A' || frequency !== 'N/A';
    };

    // 🔥 **新增：必选备件显示组件**
    const RequiredPartsSection = () => {
      const [requiredPartsData, setRequiredPartsData] = React.useState<{
        requiredParts: string;
        requiredQuantity: string;
      } | null>(null);
      const [loading, setLoading] = React.useState(false);

      React.useEffect(() => {
        const fetchRequiredParts = async () => {
          const partNumber = accessoryPart?.part_number || 
                            (accessory as any).part_number ||
                            accessory.model;

          if (!partNumber) {
            console.log('📝 [RequiredPartsSection] No part number found, skipping required parts fetch');
            return;
          }

          setLoading(true);
          try {
            console.log('🔍 [RequiredPartsSection] Fetching required parts for:', partNumber);
            
            const response = await fetch(`/wp-json/bjt/v1/accessories?part_number=${partNumber}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            });

            if (!response.ok) {
              console.warn('⚠️ [RequiredPartsSection] API request failed:', response.status);
              return;
            }

            const data = await response.json();
            console.log('📦 [RequiredPartsSection] API response:', data);

            if (data.items && data.items.length > 0) {
              const accessoryItem = data.items[0];
              if (accessoryItem.required_parts && Array.isArray(accessoryItem.required_parts)) {
                const requiredParts = accessoryItem.required_parts.map((p: {part_number: string, quantity: number}) => p.part_number).join(',');
                const requiredQuantity = accessoryItem.required_parts.map((p: {part_number: string, quantity: number}) => p.quantity.toString()).join(',');
                
                console.log('✅ [RequiredPartsSection] Found required parts:', {
                  requiredParts,
                  requiredQuantity
                });
                
                setRequiredPartsData({
                  requiredParts,
                  requiredQuantity
                });
              } else {
                console.log('📝 [RequiredPartsSection] No required parts found in API response');
              }
            }
          } catch (error) {
            console.error('❌ [RequiredPartsSection] Error fetching required parts:', error);
          } finally {
            setLoading(false);
          }
        };

        fetchRequiredParts();
      }, [accessoryPart?.part_number, accessory.model]);

      if (loading) {
        return (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-sm text-orange-600">正在加载必选备件信息...</div>
          </div>
        );
      }

      if (!requiredPartsData) {
        return null;
      }

      return (
        <div className="mt-4">
          <RequiredPartsDisplay 
            requiredParts={requiredPartsData.requiredParts}
            requiredQuantity={requiredPartsData.requiredQuantity}
            className="border border-orange-200 rounded-lg"
          />
        </div>
      );
    };

    return (
      <div key={`accessory-level-${level}-${accessory.id}-${accessoryPart?.part_number || 'no-part'}-${index}`} className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border text-content mb-4 overflow-hidden">
        <div className="flex flex-col md:flex-row p-6">
          {/* Column 1: Image & Selection */}
          <div className="w-full md:w-1/5 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
            <div className="relative mb-4">
              <img 
                src={accessory.image_url || '/images/placeholder.jpg'} 
                alt={accessory.title}
                className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-card-alt p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
              />
            </div>
            <label className="inline-flex items-center cursor-pointer bg-card-alt px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200">
              <input 
                type="radio" 
                name={`accessory-level-${level}`}
                className="form-radio text-primary mr-2"
                checked={selectedAccessories[`level${level}`] === accessory.id.toString()}
                onChange={() => handleAccessorySelection(level, accessory.id.toString(), accessory.title)}
              />
              <span className="text-sm font-medium">选择配件</span>
            </label>
          </div>

          {/* Column 2: Info & Specs */}
          <div className="w-full md:w-3/5 md:px-6">
            <div className="mb-4">
              <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{accessoryPart?.part_number || accessory.model}</span>
              <h3 className="text-xl font-bold text-title mt-2 leading-tight">{accessory.title}</h3>
            </div>

            <div className="bg-card-alt rounded-lg p-4 mt-3 shadow-sm">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <strong className="w-24 text-label font-medium">型号:</strong>
                  <span className="text-content font-medium">{accessory.model || getFieldValue('model')}</span>
                </div>
                {/* 只有当电气配件时才显示电压 */}
                {isElectricalAccessory() && getFieldValue('voltage') !== 'N/A' && (
                  <div className="flex items-center">
                    <strong className="w-24 text-label font-medium">电压(V):</strong>
                    <span className="text-content font-medium">{getFieldValue('voltage')}</span>
                  </div>
                )}
                {/* 频率字段强调显示，只有当电气配件时才显示 */}
                {isElectricalAccessory() && getFieldValue('frequency') !== 'N/A' && (
                  <div className="flex items-center frequency-highlight px-3 py-2 rounded-lg border-l-4 border-yellow-400 col-span-2">
                    <strong className="w-24 text-label font-bold text-yellow-800">⚡ 频率(Hz):</strong>
                    <span className="text-yellow-900 font-bold text-lg ml-2">{getFieldValue('frequency')}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <strong className="w-24 text-label font-medium">包装尺寸:</strong>
                  <span className="text-content font-medium">
                    {unitSystem === 'metric' 
                      ? getFieldValue('package_size_cm')
                      : getFieldValue('package_size_inch')
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <strong className="w-24 text-label font-medium">单箱数量:</strong>
                  <span className="text-content font-medium">{getFieldValue('pcs_per_box')}</span>
                </div>
                <div className="flex items-center">
                  <strong className="w-24 text-label font-medium">托盘尺寸:</strong>
                  <span className="text-content font-medium">
                    {unitSystem === 'metric' 
                      ? getFieldValue('pallet_size_cm')
                      : getFieldValue('pallet_size_inch')
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <strong className="w-24 text-label font-medium">一托数量:</strong>
                  <span className="text-content font-medium">{getFieldValue('pcs_per_pallet')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Tooltip
                title={
                  <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                      <InfoCircleOutlined className="text-blue-500 mr-2" />
                      <span className="font-bold text-gray-800 text-sm">配件详细信息</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">📦 包装尺寸:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' ? getFieldValue('package_size_cm') : getFieldValue('package_size_inch')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">⚖️ 单件净重:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('net_weight_kg') !== 'N/A' ? `${getFieldValue('net_weight_kg')} kg` : 'N/A')
                            : (getFieldValue('net_weight_lbs') !== 'N/A' ? `${getFieldValue('net_weight_lbs')} lbs` : 'N/A')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">📊 单件毛重:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-orange-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('gross_weight_kg') !== 'N/A' ? `${getFieldValue('gross_weight_kg')} kg` : 'N/A')
                            : (getFieldValue('gross_weight_lbs') !== 'N/A' ? `${getFieldValue('gross_weight_lbs')} lbs` : 'N/A')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">📏 打托高度:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('pallet_height_cm') !== 'N/A' ? `${getFieldValue('pallet_height_cm')} cm` : 'N/A')
                            : (getFieldValue('pallet_height_inch') !== 'N/A' ? `${getFieldValue('pallet_height_inch')} inch` : 'N/A')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">🏗️ 整托毛重:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-purple-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('pallet_gross_weight_kg') !== 'N/A' ? `${getFieldValue('pallet_gross_weight_kg')} kg` : 'N/A')
                            : (getFieldValue('pallet_gross_weight_lbs') !== 'N/A' ? `${getFieldValue('pallet_gross_weight_lbs')} lbs` : 'N/A')
                          }
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                      <span className="text-xs text-gray-500">💡 悬停查看详细规格信息</span>
                    </div>
                  </div>
                }
                placement="topRight"
                styles={{ 
                  root: {
                    maxWidth: '350px',
                    zIndex: 1000
                  }
                }}
                classNames={{ root: "custom-tooltip" }}
                color="white"
                arrow={true}
              >
                <Button 
                  size="small"
                  icon={<InfoCircleOutlined />}
                  className="bg-accent-light text-accent hover:bg-accent hover:text-white border-accent transition-colors duration-200"
                >
                  更多信息
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Column 3: Pricing & Actions */}
          <div className="w-full md:w-1/5 flex flex-col justify-between md:pl-6 mt-6 md:mt-0">
            <div className="mb-4">
              {accessory.parts?.[0]?.prices ? (
                <div className="bg-card-alt rounded-lg p-3 shadow-sm">
                  <div className="text-sm font-medium text-label mb-2">价格信息</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-label">基础价:</span>
                      <span className="font-bold text-primary">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-label">5-9件:</span>
                      <span className="font-bold text-accent">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.tier1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-label">10+件:</span>
                      <span className="font-bold text-success">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.tier2}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card-alt rounded-lg p-3 shadow-sm">
                  <div className="text-sm text-label">价格待询</div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button 
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                  disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                  className="bg-card-alt border-border hover:border-primary hover:bg-primary hover:text-white transition-colors duration-200"
                />
                <InputNumber
                  min={1}
                  value={quantities[accessory.id.toString()] || 1}
                  onChange={(value: number | null) => handleQuantityChange(accessory.id.toString(), value as number)}
                  className="w-16 text-center"
                  size="small"
                />
                <Button 
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) + 1)}
                  className="bg-card-alt border-border hover:border-primary hover:bg-primary hover:text-white transition-colors duration-200"
                />
              </div>
              
              <Button 
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleAddToCart(accessory, 'accessory')}
                className="w-full bg-primary hover:bg-primary-dark border-primary hover:border-primary-dark transition-colors duration-200"
                size="small"
              >
                加入购物车
              </Button>
            </div>
          </div>
        </div>

        {/* 🔥 必选备件显示区域 */}
        <RequiredPartsSection />
      </div>
    );
  };

  const renderTieredPricing = (pricing: PriceTier) => {
    if (!pricing || !pricing.tiers) return null;
    
    return pricing.tiers.map((tier, index) => (
      <div key={index} className="text-sm">
        {tier.min_quantity}-{tier.max_quantity || '∞'}: {tier.base_price} {pricing.currency}
        {tier.discount_rate ? ` (${tier.discount_rate}% off)` : ''}
      </div>
    ));
  };

  // Return the main component JSX
  return (
    <div className="machines-page min-h-screen bg-background text-content">
      {/* 面包屑导航 */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm">
            {/* 面包屑导航内容 */}
          </nav>
        </div>
      </div>

      {/* SQL Mock服务状态组件 */}
      <MockServiceStatus position="top-right" compact={true} hidden={true} />
      
      <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
      {renderCartNotification()}
      
      {/* Filter Section */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6 text-content border border-border transition-colors duration-300">
        <h1 className="text-xl font-bold mb-4 text-title">{t('machines.pageTitle')}</h1>
        
        <div className="flex flex-wrap gap-4">
          {/* Unit System Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {currentLanguage === 'zh' ? '单位制' : 'Unit System'}
            </label>
            <Select
              value={unitSystem}
              onChange={(value: 'metric' | 'imperial') => setUnitSystem(value)}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={[
                { value: 'metric', label: currentLanguage === 'zh' ? '公制' : 'Metric' },
                { value: 'imperial', label: currentLanguage === 'zh' ? '英制' : 'Imperial' }
              ]}
            />
          </div>
          
          {/* Voltage Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {t('machines.filters.voltage')}
            </label>
            <Select
              value={selectedVoltage}
              onChange={handleVoltageChange}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={[
                { value: '220V', label: '220V' },
                { value: '110V', label: '110V' }
              ]}
            />
          </div>
          
          {/* Region Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {t('machines.filters.region')}
            </label>
            <Select
              value={filterRegion}
              onChange={(value: string) => setFilterRegion(value)}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={Object.keys(REGIONS).map(key => ({
                value: key,
                label: REGIONS[key as keyof typeof REGIONS].nameCn
              }))}
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {currentLanguage === 'zh' ? '料号筛选' : 'Part Number'}
            </label>
            <Select
              value={filterType}
              onChange={(value: string) => setFilterType(value)}
              style={{ width: 180 }}
              className="bg-input text-content border-border hover:border-primary"
              loading={hostModelsLoading}
              options={[
                { value: 'all', label: currentLanguage === 'zh' ? '全部料号' : 'All Part Numbers' },
                ...hostModels.map(model => ({
                  value: model.model,
                  label: currentLanguage === 'zh' ? model.title_zh : model.title_en
                }))
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main id="main-content" className="mb-8" tabIndex={-1}>
        {loading ? showLoading() : error ? showErrorState() : renderMachinesTable()}
      </main>
      
      {/* Accessories Sections */}
      {showAccessoryLevels()}
      
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

export default MachinesPage;