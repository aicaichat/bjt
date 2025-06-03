import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button, Select, InputNumber, Tabs, Tag, Tooltip } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, PlusOutlined, ExclamationCircleOutlined, ReloadOutlined, RightOutlined, MenuOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import MockServiceStatus from '../../components/MockServiceStatus';

// 导入现代化UI组件
import { 
  LoadingState, 
  ConfirmDialog, 
  CartAnimation, 
  useToastNotifications 
} from '../../components/ui';

// 导入类型定义
import { MachineProduct, MachineListData, MachineAccessory, MachinePart, MachinePartListData } from '../../types/machines';
import { PriceTier, InventoryData } from '../../types/common';

import './Machines.css';
import './accessibility.css';

const { Option } = Select;
const { TabPane } = Tabs;

// 默认图片 - 灰色背景带X的SVG
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEw4OCA4OE00MCA4OEw4OCA0MCIgc3Ryb2tlPSIjOTdBM0IzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2Zz4K';

// 常量定义
const DEFAULT_REGION = 'CN';

// 区域常量
const REGIONS = {
  CN: { nameCn: '中国', nameEn: 'China' },
  US: { nameCn: '美国', nameEn: 'United States' },
  EU: { nameCn: '欧洲', nameEn: 'Europe' },
  ASIA: { nameCn: '亚洲', nameEn: 'Asia' }
};

// 工具函数
const getCurrencySymbol = (region: string): string => {
  switch (region) {
    case 'CN': return '¥';
    case 'US': return '$';
    case 'EU': return '€';
    default: return '¥';
  }
};

const safeTextContent = (text: string): string => {
  if (!text) return '';
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
};

const hasPermission = (permission: string): boolean => {
  return true; // 简化权限检查
};

const safeToLocaleString = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toLocaleString();
};

const getStockStatus = (quantity: number) => {
  if (quantity > 10) return { status: '充足', color: 'green' };
  if (quantity > 0) return { status: '低库存', color: 'orange' };
  return { status: '缺货', color: 'red' };
};

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
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 从URL参数获取category
  const category = searchParams.get('category') || '1';
  
  // 机器相关状态
  const [machines, setMachines] = useState<MachinePart[]>([]);
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
  
  // 主机型号相关状态
  const [hostModels, setHostModels] = useState<Array<{ id: number; model: string; title_zh: string; title_en: string; type?: string }>>([]);
  const [hostModelsLoading, setHostModelsLoading] = useState(false);
  
  // 用户交互相关状态
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationProduct, setNotificationProduct] = useState<string>('');
  const [notificationQuantity, setNotificationQuantity] = useState<number>(1);
  const [cartCount, setCartCount] = useState<number>(0);
  
  // 根据用户偏好设置单位制
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    user?.preferred_unit || 'metric'
  );

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
  const canAddToCart = true;
  const userRegion = filterRegion || user?.region || DEFAULT_REGION;
  
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const getMachineName = (machine: MachinePart): string => {
    const name = currentLanguage === 'zh' ? machine.name_zh : machine.name_en;
    if (!name) {
      const fallbackName = currentLanguage === 'zh' ? machine.name_en : machine.name_zh;
      return safeTextContent(fallbackName || machine.model || 'N/A');
    }
    return safeTextContent(name);
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
        }
      }
      
      // 如果API失败，使用Mock数据
      console.log('⚠️ [fetchHostModels] API failed, using mock data');
      const mockHostModels = [
          { id: 1, model: 'LA-E4S', title_zh: '气垫机E4S', title_en: 'Air Cushion E4S', type: '小型' },
          { id: 2, model: 'LA-E5P', title_zh: '气垫机E5P', title_en: 'Air Cushion E5P', type: '中型' },
          { id: 3, model: 'LA-E6L', title_zh: '气垫机E6L', title_en: 'Air Cushion E6L', type: '大型' }
        ];
      setHostModels(mockHostModels);
    } catch (error) {
      console.error('❌ [fetchHostModels] Failed to fetch host models:', error);
      
      // 使用默认Mock数据
      const defaultMockHostModels = [
        { id: 1, model: 'LA-E4S', title_zh: '气垫机E4S', title_en: 'Air Cushion E4S', type: '小型' },
        { id: 2, model: 'LA-E5P', title_zh: '气垫机E5P', title_en: 'Air Cushion E5P', type: '中型' },
        { id: 3, model: 'LA-E6L', title_zh: '气垫机E6L', title_en: 'Air Cushion E6L', type: '大型' }
      ];
      setHostModels(defaultMockHostModels);
    } finally {
      setHostModelsLoading(false);
    }
  };

  // 获取机器数据 - 使用真实API
  const fetchMachines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Try auto-login if no token
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
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
        if (!loginData.success || !loginData.data?.access_token) {
          throw new Error('Auto-login failed');
        }
        localStorage.setItem('auth_token', loginData.data.access_token);
      }

      // Fetch machines with retry logic
      const fetchWithRetry = async (retryCount = 0) => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
          const response = await fetch(`${baseUrl}/machineparts?page=${currentPage}&per_page=${pageSize}&product_line_id=${category}&lang=${currentLanguage}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 401 && retryCount < 3) {
            // Try to refresh token
            const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
            });
            
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data?.access_token) {
              localStorage.setItem('auth_token', refreshData.data.access_token);
              return fetchWithRetry(retryCount + 1);
            }
          }

          const data = await response.json();
          console.log('API raw response:', data); // Debug log
          console.log('API response structure:', {
            success: data.success,
            hasData: !!data.data,
            dataType: typeof data.data,
            isArray: Array.isArray(data.data),
            hasItems: !!(data.data && data.data.items),
            itemsType: typeof (data.data && data.data.items),
            itemsIsArray: Array.isArray(data.data && data.data.items),
            firstItem: data.data && data.data.items && data.data.items[0] || null
          });

          if (!data.success) {
            throw new Error(data.message || 'Failed to fetch machines');
          }

          // Handle the actual response format
          if (!data.data || !Array.isArray(data.data.items)) {
            // Try alternative response formats
            let machinesData = null;
            
            if (Array.isArray(data.data)) {
              // Direct array format
              machinesData = data.data;
            } else if (Array.isArray(data)) {
              // Root level array
              machinesData = data;
            } else if (data.items && Array.isArray(data.items)) {
              // Items at root level
              machinesData = data.items;
            }
            
            if (machinesData && machinesData.length > 0) {
              console.log('✅ Using alternative API response format:', machinesData);
              setMachines(machinesData);
              setTotal(machinesData.length);
              setCurrentPage(1);
              setPageSize(10);
              setTotalPages(Math.ceil(machinesData.length / 10));
              return;
            }
            
            // If all formats fail, fallback to mock data but log the issue
            console.warn('API response invalid, using fallback mock data');
            const mockMachines: Machine[] = [
              {
                id: 1,
                product_line_id: 1,
                model: 'LA-E4S',
                voltage: '220V',
                image_url: '/images/machines/LA-E4S.jpg',
                part_number: '60A01140',
                name_zh: 'LA-E4S主机-标准版',
                name_en: 'LA-E4S Host-Standard',
                brand: 'Lockedair',
                spec: 'Business Class Air Cushion Pillow & Bubble System,AC220V',
                spec_imperial: 'Business Class Air Cushion Pillow & Bubble System,AC220V',
                package_size_cm: '75*35*45cm',
                package_size_inch: '29.5*13.8*17.7in',
                net_weight_kg: 25.5,
                net_weight_lbs: 56.2,
                gross_weight_kg: 30.2,
                gross_weight_lbs: 66.6,
                pcs_per_box: 1,
                pallet_size_cm: '120*100*110cm',
                pallet_size_inch: '47.2*39.4*43.3in',
                pcs_per_pallet: 20,
                pallet_height_cm: 110,
                pallet_height_inch: 43.3,
                pallet_gross_weight_kg: 604,
                pallet_gross_weight_lbs: 1331.2,
                status: 'publish',
                unit: 'pcs',
                created_at: '2025-05-21 05:01:05',
                updated_at: '2025-05-21 05:01:05',
                model_title_zh: 'LA-E4S商用气垫制造机',
                model_title_en: 'LA-E4S Business Air Cushion Machine',
                model_description_zh: '商用级气垫枕和气泡系统，220V交流电源',
                model_description_en: 'Business class air cushion pillow and bubble system, AC220V',
                model_explosion_diagram_pdf: '/documents/LA-E4S-diagram.pdf',
                model_type: '商用',
                model_image1_url: '/images/models/LA-E4S-1.jpg',
                model_image2_url: '/images/models/LA-E4S-2.jpg',
                inventory: [
                  { region: 'CN', quantity: 50, warehouse: 'main', reserved: 5 },
                  { region: 'US', quantity: 30, warehouse: 'main', reserved: 2 },
                  { region: 'EU', quantity: 20, warehouse: 'main', reserved: 2 }
                ],
                prices: [
                  {
                    region: 'CN',
                    currency: 'CNY',
                    tiers: [
                      { min_quantity: 1, max_quantity: 4, base_price: 15800, discount_rate: null },
                      { min_quantity: 5, max_quantity: 9, base_price: 14800, discount_rate: 6.3 },
                      { min_quantity: 10, max_quantity: null, base_price: 13800, discount_rate: 12.7 }
                    ]
                  }
                ]
              },
              {
                id: 2,
                product_line_id: 1,
                model: 'LA-E5P',
                voltage: '220V',
                image_url: '/images/machines/LA-E5P.jpg',
                part_number: '60A01150',
                name_zh: 'LA-E5P主机-精密版',
                name_en: 'LA-E5P Host-Precision',
                brand: 'Lockedair',
                spec: 'Precision Air Cushion System,AC220V',
                spec_imperial: 'Precision Air Cushion System,AC220V',
                package_size_cm: '80*40*50cm',
                package_size_inch: '31.5*15.7*19.7in',
                net_weight_kg: 32.0,
                net_weight_lbs: 70.5,
                gross_weight_kg: 38.5,
                gross_weight_lbs: 84.9,
                pcs_per_box: 1,
                pallet_size_cm: '120*100*120cm',
                pallet_size_inch: '47.2*39.4*47.2in',
                pcs_per_pallet: 16,
                pallet_height_cm: 120,
                pallet_height_inch: 47.2,
                pallet_gross_weight_kg: 616,
                pallet_gross_weight_lbs: 1357.6,
                status: 'publish',
                unit: 'pcs',
                created_at: '2025-05-21 05:01:05',
                updated_at: '2025-05-21 05:01:05',
                model_title_zh: 'LA-E5P精密气垫制造机',
                model_title_en: 'LA-E5P Precision Air Cushion Machine',
                model_description_zh: '精密级气垫系统，220V交流电源',
                model_description_en: 'Precision air cushion system, AC220V',
                model_explosion_diagram_pdf: '/documents/LA-E5P-diagram.pdf',
                model_type: '精密',
                model_image1_url: '/images/models/LA-E5P-1.jpg',
                model_image2_url: '/images/models/LA-E5P-2.jpg',
                inventory: [
                  { region: 'CN', quantity: 35, warehouse: 'main', reserved: 3 },
                  { region: 'US', quantity: 25, warehouse: 'main', reserved: 2 },
                  { region: 'EU', quantity: 15, warehouse: 'main', reserved: 1 }
                ],
                prices: [
                  {
                    region: 'CN',
                    currency: 'CNY',
                    tiers: [
                      { min_quantity: 1, max_quantity: 4, base_price: 22800, discount_rate: null },
                      { min_quantity: 5, max_quantity: 9, base_price: 21800, discount_rate: 4.4 },
                      { min_quantity: 10, max_quantity: null, base_price: 20800, discount_rate: 8.8 }
                    ]
                  }
                ]
              }
            ];
            setMachines(mockMachines);
            setTotal(mockMachines.length);
            setCurrentPage(1);
            setPageSize(10);
            setTotalPages(1);
            return;
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
          const apiUrl = `${baseUrl}/relations/${machinePartNumber}/accessories?lang=${currentLanguage}&region=${filterRegion}&max_levels=5`;
          
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
          
          if (jsonData.success && jsonData.data && jsonData.data.accessories) {
            const accessoriesData = jsonData.data.accessories;
            
            // 转换为前端需要的格式
            const convertedAccessories: MachineAccessory[] = accessoriesData.map((item: any) => ({
              id: item.id || '',
              model: item.model || '',
              title: item.name || '',
              level: 1, // 一级配件
              image_url: item.image_url || '',
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
            showErrorToast('加载配件失败');
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
  }, [selectedMachine, machines, currentLanguage, filterRegion]);

  // 处理数量变更
  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities({
      ...quantities,
      [productId]: value
    });
  };
  
  // 隐藏购物车通知
  const hideCartNotification = () => {
    setShowNotification(false);
  };

  // 格式化价格
  const formatPrice = (price: number): string => {
    return safeToLocaleString(price);
  };

  // 获取区域库存
  const getRegionInventory = (product: Machine, region: string): number => {
    const regionInventory = product.inventory?.find(inv => inv.region === region);
    return regionInventory ? regionInventory.quantity : 0;
  };

  // 过滤产品
  const filteredMachines = React.useMemo(() => {
    if (!Array.isArray(machines)) {
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
    
    return filtered;
  }, [machines, filterType, currentLanguage]);

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
    
    // 设置对应级别的加载状态
    let setLoadingState: React.Dispatch<React.SetStateAction<boolean>> = () => {};
    if (level === 1) setLoadingState = setLevel2Loading; 
    else if (level === 2) setLoadingState = setLevel3Loading;
    else if (level === 3) setLoadingState = setLevel4Loading;
    else if (level === 4) setLoadingState = setLevel5Loading;

    try {
      setLoadingState(true);
      
      let convertedAccessories: MachineAccessory[] = [];
      
      if (childrenData.length === 0) {
        console.log(`🔍 [handleAccessorySelection] No children accessories found for ${accessoryName}`);
        info(`${accessoryName} 没有下级配件`);
        // 继续执行，设置空数组以显示"无可用配件"提示
      } else {
        console.log(`🔍 [handleAccessorySelection] Using cached children data for level ${nextLevel}:`, childrenData);
        
        // 转换子配件数据为前端格式
        convertedAccessories = childrenData.map((item: any) => ({
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
      }
      
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
          // 总是显示下级配件区域，无论是否有配件
          nextDiv.style.display = 'block';
          
          // 更新上下文消息
          const contextMessage = document.getElementById(`level${nextLevel}-context-message`);
          if (contextMessage) {
            if (convertedAccessories.length === 0) {
              contextMessage.textContent = `${accessoryName} 没有下级适配件`;
            } else {
              let contextText = `${accessoryName} 的适配配件`;
              if (level > 1) contextText = `${level}级配件 ${accessoryName} 的下级适配件`;
              contextMessage.textContent = contextText;
            }
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

  // 渲染机器表格
  const renderMachinesTable = () => {
    return (
      <div className="grid grid-cols-1 gap-6">
        {filteredMachines.map(machine => (
          <div 
            key={`machine-${machine.id}-${machine.part_number}`} 
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row p-6">
              {/* Column 1: Image & Selection */}
              <div className="w-full md:w-1/5 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                <div className="relative mb-4">
                  <img 
                    src={machine.image_url || DEFAULT_IMAGE} 
                    alt={machine.part_number}
                    className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== DEFAULT_IMAGE) {
                        target.src = DEFAULT_IMAGE;
                      }
                    }}
                  />
                </div>
                <label className="inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors duration-200">
                  <input 
                    type="radio" 
                    name="machine" 
                    className="form-radio text-blue-500 mr-2"
                    checked={selectedMachine === machine.id.toString()}
                    onChange={() => handleMachineSelection(machine.id)}
                    aria-label={`选择主机 ${machine.part_number}`}
                  />
                  <span className="text-sm font-medium">选择主机</span>
                </label>
              </div>
                
              {/* Column 2: Info & Specs */}
              <div className="w-full md:w-3/5 md:px-6">
                <div className="mb-4">
                  <span className="inline-block bg-blue-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{machine.part_number}</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{getMachineName(machine)}</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">型号:</strong>
                      <span className="text-gray-800 font-medium">{machine.model}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">电压:</strong>
                      <span className="text-gray-800 font-medium">{machine.voltage || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">单箱数量:</strong>
                      <span className="text-gray-800 font-medium">{machine.pcs_per_box !== null && machine.pcs_per_box !== undefined ? machine.pcs_per_box : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">一托数量:</strong>
                      <span className="text-gray-800 font-medium">{machine.pcs_per_pallet !== null && machine.pcs_per_pallet !== undefined ? machine.pcs_per_pallet : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">托盘尺寸:</strong>
                      <span className="text-gray-800 font-medium">
                        {unitSystem === 'metric' 
                          ? (machine.pallet_size_cm || 'N/A')
                          : (machine.pallet_size_inch || 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
                      <span className="text-gray-800 font-medium">
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
                        info('暂无规格详情PDF文件');
                      }
                    }}
                    className="bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white border-gray-300 transition-colors duration-200"
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
                    overlayStyle={{ 
                      maxWidth: '350px',
                      zIndex: 1000
                    }}
                    color="white"
                    arrow={true}
                  >
                    <Button 
                      size="small"
                      icon={<InfoCircleOutlined />}
                      className="bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-300 transition-colors duration-200"
                    >
                      更多信息
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {/* Column 3: Price, Stock, Actions */}
              <div className="w-full md:w-1/5 md:pl-6 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0">
                <div className="mb-4">
                  <div className="font-medium text-sm text-gray-600 mb-2">
                    价格 ({getCurrencySymbol(userRegion)}):
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {getCurrencySymbol(userRegion)}{formatPrice((machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0) ? machine.prices[0].tiers[0].base_price : 0)}
                  </div>
                  
                  {machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0 && (
                    <div className="text-xs text-gray-500">
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
                    <div className="font-medium text-sm text-gray-600 mb-2">
                      库存:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
                        const stockStatus = getStockStatus(getRegionInventory(machine, regionKey.toString()));
                        return (
                          <Tag 
                            key={`${machine.id}-inventory-${regionKey}`}
                            color={stockStatus.color}
                            className="text-xs"
                          >
                            {REGIONS[regionKey].nameCn}: {getRegionInventory(machine, regionKey.toString())}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-2">
                    <Button 
                      icon={<MenuOutlined />}
                      onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) - 1)}
                      disabled={(quantities[machine.id.toString()] || 1) <= 1}
                      size="small"
                      className="hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                    />
                    <InputNumber
                      min={1}
                      value={quantities[machine.id.toString()] || 1}
                      onChange={(value: number | null) => handleQuantityChange(machine.id.toString(), value as number)}
                      className="w-16 text-center"
                      size="small"
                    />
                    <Button 
                      icon={<PlusOutlined />}
                      onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) + 1)}
                      size="small"
                      className="hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
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
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 h-10 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    size="large"
                  >
                    {canAddToCart ? '加入购物车' : '无权限添加'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 显示加载状态
  const showLoading = () => {
    return (
      <div className="flex justify-center items-center p-16 bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300">
        <LoadingState 
          size="large" 
          text="加载机器中..." 
          type="spinner"
        />
      </div>
    );
  };

  // 显示错误状态
  const showErrorState = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300">
        <ExclamationCircleOutlined className="text-red-500 text-4xl mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          加载失败
        </h3>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          {error || '系统错误'}
        </p>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()} 
          className="bg-blue-500 hover:bg-blue-600 border-none"
        >
          重试
        </Button>
      </div>
    );
  };

  // 渲染配件路径导航
  const renderAccessoryPath = (level: number) => {
    const pathItems = [];
    
    // 添加主机
    if (selectedMachine) {
      const machine = machines.find(m => m.id.toString() === selectedMachine);
      if (machine) {
        pathItems.push(
          <div key={`machine-path-${level}-${machine.id}-${machine.part_number}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-1">主机</span>
            <span className="text-gray-800">{getMachineName(machine)}</span>
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
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-1">{i}级配件</span>
            <span className="text-gray-800">{accessoryName}</span>
          </div>
        );
      }
    }
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4 flex flex-wrap items-center border border-gray-200 transition-colors duration-300">
        {pathItems.map((item, index) => (
          <React.Fragment key={`path-level-${level}-item-${index}`}>
            {item}
            {index < pathItems.length - 1 && (
              <span className="mx-2 text-gray-400">
                <RightOutlined style={{ fontSize: '10px' }} />
              </span>
            )}
          </React.Fragment>
        ))}
        {pathItems.length > 0 && (
          <>
            <span className="mx-2 text-gray-400">
              <RightOutlined style={{ fontSize: '10px' }} />
            </span>
            <span className={`font-medium ${
              level === 2 ? 'text-green-600' :
              level === 3 ? 'text-yellow-600' :
              level === 4 ? 'text-orange-600' :
              level === 5 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {level === 2 ? '二级配件' :
               level === 3 ? '三级配件' :
               level === 4 ? '四级配件' :
               level === 5 ? '五级配件' : '配件'}
            </span>
          </>
        )}
      </div>
    );
  };

  // 为配件添加必选备件到购物车（简化版本）
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
    
    // 这是一个简化版本，可以根据需要扩展
    // TODO: 实现完整的必选备件逻辑
    console.log('📝 [addRequiredPartsToCartForAccessory] Simplified version - skipping required parts processing');
  };

  // Return the main component JSX
  return (
    <div className="machines-page min-h-screen bg-gray-50 text-gray-900">
      {/* SQL Mock服务状态组件 */}
      <MockServiceStatus position="top-right" compact={true} hidden={true} />
      
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 text-gray-900 border border-gray-200 transition-colors duration-300">
        <h1 className="text-xl font-bold mb-4 text-gray-800">机器设备</h1>
        
        <div className="flex flex-wrap gap-4">
          {/* Unit System Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              {currentLanguage === 'zh' ? '单位制' : 'Unit System'}
            </label>
            <Select
              value={unitSystem}
              onChange={(value: 'metric' | 'imperial') => setUnitSystem(value)}
              style={{ width: 120 }}
              className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
              options={[
                { value: 'metric', label: currentLanguage === 'zh' ? '公制' : 'Metric' },
                { value: 'imperial', label: currentLanguage === 'zh' ? '英制' : 'Imperial' }
              ]}
            />
          </div>
          
          {/* Voltage Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              电压
            </label>
            <Select
              value={selectedVoltage}
              onChange={(value: string) => setSelectedVoltage(value)}
              style={{ width: 120 }}
              className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
              options={[
                { value: '220V', label: '220V' },
                { value: '110V', label: '110V' }
              ]}
            />
          </div>
          
          {/* Region Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              区域
            </label>
            <Select
              value={filterRegion}
              onChange={(value: string) => setFilterRegion(value)}
              style={{ width: 120 }}
              className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
              options={Object.keys(REGIONS).map(key => ({
                value: key,
                label: REGIONS[key as keyof typeof REGIONS].nameCn
              }))}
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              {currentLanguage === 'zh' ? '料号筛选' : 'Part Number'}
            </label>
            <Select
              value={filterType}
              onChange={(value: string) => setFilterType(value)}
              style={{ width: 180 }}
              className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
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
      <main className="mb-8">
        {loading ? showLoading() : error ? showErrorState() : renderMachinesTable()}
      </main>
      
      {/* Accessories Section */}
      <div id="accessory-level-1" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              配件选择 
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded">一级配件</span>
            </h2>
            <span id="level1-context-message" className="text-sm text-gray-500"></span>
          </div>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-1');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}
            className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          >
            关闭
          </Button>
        </div>
        
        <div className="accessory-content">
          {/* 添加主机信息显示 */}
          {selectedMachine && (
            <div className="bg-white p-3 rounded-lg shadow-sm mb-4 flex items-center border border-gray-200">
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-2">主机</span>
              <span className="text-gray-800">
                {(() => {
                  const machine = machines.find(m => m.id.toString() === selectedMachine);
                  return machine ? getMachineName(machine) : '未知主机';
                })()}
              </span>
              <span className="mx-2 text-gray-400">
                <RightOutlined style={{ fontSize: '10px' }} />
              </span>
              <span className="text-blue-600 font-medium">一级配件</span>
            </div>
          )}
          
          {accessoriesLoading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text="加载配件中..." 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {accessories.map((accessory, index) => (
                <div key={`accessory-level-1-${accessory.id}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row p-6">
                    {/* Accessory Image & Selection */}
                    <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                      <div className="relative mb-4">
                        <img 
                          src={accessory.image_url || DEFAULT_IMAGE} 
                          alt={accessory.title}
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <label className="inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors duration-200">
                        <input 
                          type="radio" 
                          name="accessory-level-1"
                          className="form-radio text-blue-500 mr-2"
                          checked={selectedAccessories['level1'] === accessory.id.toString()}
                          onChange={() => {
                            handleAccessorySelection(1, accessory.id.toString(), accessory.title);
                          }}
                        />
                        <span className="text-sm font-medium">选择配件</span>
                      </label>
                    </div>

                    {/* Accessory Info */}
                    <div className="w-full md:w-1/2 md:px-6">
                      <div className="mb-4">
                        <span className="inline-block bg-blue-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{accessory.parts?.[0]?.part_number || accessory.model}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{accessory.title}</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">型号:</strong>
                            <span className="text-gray-800 font-medium">{accessory.model}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">电压:</strong>
                            <span className="text-gray-800 font-medium">{accessory.voltage || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">频率:</strong>
                            <span className="text-gray-800 font-medium">{accessory.frequency || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
                            <span className="text-gray-800 font-medium">
                              {unitSystem === 'metric' 
                                ? (accessory.package_size_cm || 'N/A')
                                : (accessory.package_size_inch || 'N/A')
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <Tooltip
                          title={
                            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                              <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                                <InfoCircleOutlined className="text-green-500 mr-2" />
                                <span className="font-bold text-gray-800 text-sm">配件详细信息</span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">📦 包装尺寸:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                                    {unitSystem === 'metric' ? (accessory.package_size_cm || 'N/A') : (accessory.package_size_inch || 'N/A')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">📊 单箱数量:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                                    {accessory.pcs_per_box || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">🏗️ 托盘尺寸:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                                    {unitSystem === 'metric' ? (accessory.pallet_size_cm || 'N/A') : (accessory.pallet_size_inch || 'N/A')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">📏 一托数量:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-purple-50 px-2 py-1 rounded">
                                    {accessory.pcs_per_pallet || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                                <span className="text-xs text-gray-500">💡 悬停查看详细规格信息</span>
                              </div>
                            </div>
                          }
                          placement="topRight"
                          overlayStyle={{ 
                            maxWidth: '350px',
                            zIndex: 1000
                          }}
                          color="white"
                          arrow={true}
                        >
                          <Button 
                            size="small"
                            icon={<InfoCircleOutlined />}
                            className="bg-green-100 text-green-600 hover:bg-green-500 hover:text-white border-green-300 transition-colors duration-200"
                          >
                            更多信息
                          </Button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Accessory Price & Actions */}
                    <div className="w-full md:w-1/4 flex flex-col justify-between md:pl-6 mt-6 md:mt-0">
                      <div className="mb-4">
                        {accessory.parts?.[0]?.prices ? (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm font-medium text-gray-600 mb-2">价格信息</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">基础价:</span>
                                <span className="font-bold text-blue-600">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.base}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm text-gray-600">价格待询</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="small"
                            icon={<MenuOutlined />}
                            onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                            disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                            className="bg-gray-100 border-gray-300 hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
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
                            className="bg-gray-100 border-gray-300 hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                          />
                        </div>
                        
                        <Button 
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => {
                            success('配件已添加到购物车');
                          }}
                          className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 transition-colors duration-200"
                          size="small"
                        >
                          加入购物车
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {accessories.length === 0 && (
                <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                  <div className="text-content-light mb-2 text-lg">💭 当前主机无可用配件</div>
                  <div className="text-content-light text-sm">请选择其他主机或联系客服咨询</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Level 2 Accessories Section */}
      <div id="accessory-level-2" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              配件选择 
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded">二级配件</span>
            </h2>
            <span id="level2-context-message" className="text-sm text-gray-500"></span>
          </div>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-2');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}
            className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          >
            关闭
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(2)}
          
          {level2Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text="加载配件中..." 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level2Accessories.map((accessory, index) => (
                <div key={`accessory-level-2-${accessory.id}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row p-6">
                    {/* Accessory Image & Selection */}
                    <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                      <div className="relative mb-4">
                        <img 
                          src={accessory.image_url || DEFAULT_IMAGE} 
                          alt={accessory.title}
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <label className="inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-green-500 hover:text-white transition-colors duration-200">
                        <input 
                          type="radio" 
                          name="accessory-level-2"
                          className="form-radio text-green-500 mr-2"
                          checked={selectedAccessories['level2'] === accessory.id.toString()}
                          onChange={() => {
                            handleAccessorySelection(2, accessory.id.toString(), accessory.title);
                          }}
                        />
                        <span className="text-sm font-medium">选择配件</span>
                      </label>
                    </div>

                    {/* Accessory Info */}
                    <div className="w-full md:w-1/2 md:px-6">
                      <div className="mb-4">
                        <span className="inline-block bg-green-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{accessory.parts?.[0]?.part_number || accessory.model}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{accessory.title}</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">型号:</strong>
                            <span className="text-gray-800 font-medium">{accessory.model}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">电压:</strong>
                            <span className="text-gray-800 font-medium">{accessory.voltage || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">频率:</strong>
                            <span className="text-gray-800 font-medium">{accessory.frequency || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
                            <span className="text-gray-800 font-medium">
                              {unitSystem === 'metric' 
                                ? (accessory.package_size_cm || 'N/A')
                                : (accessory.package_size_inch || 'N/A')
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accessory Price & Actions */}
                    <div className="w-full md:w-1/4 flex flex-col justify-between md:pl-6 mt-6 md:mt-0">
                      <div className="mb-4">
                        {accessory.parts?.[0]?.prices ? (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm font-medium text-gray-600 mb-2">价格信息</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">基础价:</span>
                                <span className="font-bold text-green-600">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.base}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm text-gray-600">价格待询</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="small"
                            icon={<MenuOutlined />}
                            onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                            disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                            className="bg-gray-100 border-gray-300 hover:border-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200"
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
                            className="bg-gray-100 border-gray-300 hover:border-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200"
                          />
                        </div>
                        
                        <Button 
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => {
                            success('配件已添加到购物车');
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 transition-colors duration-200"
                          size="small"
                        >
                          加入购物车
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {level2Accessories.length === 0 && (
                <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                  <div className="text-content-light mb-2 text-lg">💭 当前配件无下级适配件</div>
                  <div className="text-content-light text-sm">此配件已是最终选择，可直接添加到购物车</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level 3 Accessories Section */}
      <div id="accessory-level-3" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              配件选择 
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500 text-white rounded">三级配件</span>
            </h2>
            <span id="level3-context-message" className="text-sm text-gray-500"></span>
          </div>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-3');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}
            className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          >
            关闭
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(3)}
          
          {level3Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text="加载配件中..." 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level3Accessories.map((accessory, index) => (
                <div key={`accessory-level-3-${accessory.id}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row p-6">
                    {/* Accessory Image & Selection */}
                    <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                      <div className="relative mb-4">
                        <img 
                          src={accessory.image_url || DEFAULT_IMAGE} 
                          alt={accessory.title}
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <label className="inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-yellow-500 hover:text-white transition-colors duration-200">
                        <input 
                          type="radio" 
                          name="accessory-level-3"
                          className="form-radio text-yellow-500 mr-2"
                          checked={selectedAccessories['level3'] === accessory.id.toString()}
                          onChange={() => {
                            handleAccessorySelection(3, accessory.id.toString(), accessory.title);
                          }}
                        />
                        <span className="text-sm font-medium">选择配件</span>
                      </label>
                    </div>

                    {/* Accessory Info */}
                    <div className="w-full md:w-1/2 md:px-6">
                      <div className="mb-4">
                        <span className="inline-block bg-yellow-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{accessory.parts?.[0]?.part_number || accessory.model}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{accessory.title}</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">型号:</strong>
                            <span className="text-gray-800 font-medium">{accessory.model}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">电压:</strong>
                            <span className="text-gray-800 font-medium">{accessory.voltage || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">频率:</strong>
                            <span className="text-gray-800 font-medium">{accessory.frequency || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
                            <span className="text-gray-800 font-medium">
                              {unitSystem === 'metric' 
                                ? (accessory.package_size_cm || 'N/A')
                                : (accessory.package_size_inch || 'N/A')
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accessory Price & Actions */}
                    <div className="w-full md:w-1/4 flex flex-col justify-between md:pl-6 mt-6 md:mt-0">
                      <div className="mb-4">
                        {accessory.parts?.[0]?.prices ? (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm font-medium text-gray-600 mb-2">价格信息</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">基础价:</span>
                                <span className="font-bold text-yellow-600">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.base}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm text-gray-600">价格待询</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="small"
                            icon={<MenuOutlined />}
                            onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                            disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                            className="bg-gray-100 border-gray-300 hover:border-yellow-500 hover:bg-yellow-500 hover:text-white transition-colors duration-200"
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
                            className="bg-gray-100 border-gray-300 hover:border-yellow-500 hover:bg-yellow-500 hover:text-white transition-colors duration-200"
                          />
                        </div>
                        
                        <Button 
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => {
                            success('配件已添加到购物车');
                          }}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600 transition-colors duration-200"
                          size="small"
                        >
                          加入购物车
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {level3Accessories.length === 0 && (
                <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                  <div className="text-content-light mb-2 text-lg">💭 当前配件无下级适配件</div>
                  <div className="text-content-light text-sm">此配件已是最终选择，可直接添加到购物车</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level 4 Accessories Section */}
      <div id="accessory-level-4" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              配件选择 
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500 text-white rounded">四级配件</span>
            </h2>
            <span id="level4-context-message" className="text-sm text-gray-500"></span>
          </div>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-4');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}
            className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          >
            关闭
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(4)}
          
          {level4Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text="加载配件中..." 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level4Accessories.map((accessory, index) => (
                <div key={`accessory-level-4-${accessory.id}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row p-6">
                    {/* Accessory Image & Selection */}
                    <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                      <div className="relative mb-4">
                        <img 
                          src={accessory.image_url || DEFAULT_IMAGE} 
                          alt={accessory.title}
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <label className="inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition-colors duration-200">
                        <input 
                          type="radio" 
                          name="accessory-level-4"
                          className="form-radio text-orange-500 mr-2"
                          checked={selectedAccessories['level4'] === accessory.id.toString()}
                          onChange={() => {
                            handleAccessorySelection(4, accessory.id.toString(), accessory.title);
                          }}
                        />
                        <span className="text-sm font-medium">选择配件</span>
                      </label>
                    </div>

                    {/* Accessory Info */}
                    <div className="w-full md:w-1/2 md:px-6">
                      <div className="mb-4">
                        <span className="inline-block bg-orange-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{accessory.parts?.[0]?.part_number || accessory.model}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{accessory.title}</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">型号:</strong>
                            <span className="text-gray-800 font-medium">{accessory.model}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">电压:</strong>
                            <span className="text-gray-800 font-medium">{accessory.voltage || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">频率:</strong>
                            <span className="text-gray-800 font-medium">{accessory.frequency || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
                            <span className="text-gray-800 font-medium">
                              {unitSystem === 'metric' 
                                ? (accessory.package_size_cm || 'N/A')
                                : (accessory.package_size_inch || 'N/A')
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Accessory Price & Actions */}
                      <div className="w-full md:w-1/4 flex flex-col justify-between md:pl-6 mt-6 md:mt-0">
                        <div className="mb-4">
                          {accessory.parts?.[0]?.prices ? (
                            <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                              <div className="text-sm font-medium text-gray-600 mb-2">价格信息</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">基础价:</span>
                                  <span className="font-bold text-orange-600">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.base}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                              <div className="text-sm text-gray-600">价格待询</div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="small"
                              icon={<MenuOutlined />}
                              onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                              disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                              className="bg-gray-100 border-gray-300 hover:border-orange-500 hover:bg-orange-500 hover:text-white transition-colors duration-200"
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
                              className="bg-gray-100 border-gray-300 hover:border-orange-500 hover:bg-orange-500 hover:text-white transition-colors duration-200"
                            />
                          </div>
                          
                          <Button 
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            onClick={() => {
                              success('配件已添加到购物车');
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 transition-colors duration-200"
                            size="small"
                          >
                            加入购物车
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {level4Accessories.length === 0 && (
                <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                  <div className="text-content-light mb-2 text-lg">💭 当前配件无下级适配件</div>
                  <div className="text-content-light text-sm">此配件已是最终选择，可直接添加到购物车</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level 5 Accessories Section */}
      <div id="accessory-level-5" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              配件选择 
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded">五级配件</span>
            </h2>
            <span id="level5-context-message" className="text-sm text-gray-500"></span>
          </div>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-5');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}
            className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          >
            关闭
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(5)}
          
          {level5Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text="加载配件中..." 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level5Accessories.map((accessory, index) => (
                <div key={`accessory-level-5-${accessory.id}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row p-6">
                    {/* Accessory Image & Selection */}
                    <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
                      <div className="relative mb-4">
                        <img 
                          src={accessory.image_url || DEFAULT_IMAGE} 
                          alt={accessory.title}
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <label className="inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-200">
                        <input 
                          type="radio" 
                          name="accessory-level-5"
                          className="form-radio text-red-500 mr-2"
                          checked={selectedAccessories['level5'] === accessory.id.toString()}
                          onChange={() => {
                            // 五级配件不会再有下级配件，所以只更新选择状态
                            setSelectedAccessories(prev => ({
                              ...prev,
                              level5: accessory.id.toString()
                            }));
                            setSelectedAccessoryNames(prev => ({
                              ...prev,
                              level5: accessory.title
                            }));
                          }}
                        />
                        <span className="text-sm font-medium">选择配件</span>
                      </label>
                    </div>

                    {/* Accessory Info */}
                    <div className="w-full md:w-1/2 md:px-6">
                      <div className="mb-4">
                        <span className="inline-block bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{accessory.parts?.[0]?.part_number || accessory.model}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{accessory.title}</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">型号:</strong>
                            <span className="text-gray-800 font-medium">{accessory.model}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">电压:</strong>
                            <span className="text-gray-800 font-medium">{accessory.voltage || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">频率:</strong>
                            <span className="text-gray-800 font-medium">{accessory.frequency || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <strong className="w-24 text-gray-600 font-medium">包装尺寸:</strong>
                            <span className="text-gray-800 font-medium">
                              {unitSystem === 'metric' 
                                ? (accessory.package_size_cm || 'N/A')
                                : (accessory.package_size_inch || 'N/A')
                              }
                            </span>
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
                                    {unitSystem === 'metric' ? (accessory.package_size_cm || 'N/A') : (accessory.package_size_inch || 'N/A')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">📊 单箱数量:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                                    {accessory.pcs_per_box || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">🏗️ 托盘尺寸:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                                    {unitSystem === 'metric' ? (accessory.pallet_size_cm || 'N/A') : (accessory.pallet_size_inch || 'N/A')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600 font-medium text-xs">📏 一托数量:</span>
                                  <span className="text-gray-800 font-semibold text-xs bg-purple-50 px-2 py-1 rounded">
                                    {accessory.pcs_per_pallet || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                                <span className="text-xs text-gray-500">💡 悬停查看详细规格信息</span>
                              </div>
                            </div>
                          }
                          placement="topRight"
                          overlayStyle={{ 
                            maxWidth: '350px',
                            zIndex: 1000
                          }}
                          color="white"
                          arrow={true}
                        >
                          <Button 
                            size="small"
                            icon={<InfoCircleOutlined />}
                            className="bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-300 transition-colors duration-200"
                          >
                            更多信息
                          </Button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Accessory Price & Actions */}
                    <div className="w-full md:w-1/4 flex flex-col justify-between md:pl-6 mt-6 md:mt-0">
                      <div className="mb-4">
                        {accessory.parts?.[0]?.prices ? (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm font-medium text-gray-600 mb-2">价格信息</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">基础价:</span>
                                <span className="font-bold text-red-600">{getCurrencySymbol(userRegion)}{accessory.parts[0].prices.base}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="text-sm text-gray-600">价格待询</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="small"
                            icon={<MenuOutlined />}
                            onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                            disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                            className="bg-gray-100 border-gray-300 hover:border-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
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
                            className="bg-gray-100 border-gray-300 hover:border-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
                          />
                        </div>
                        
                        <Button 
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => {
                            success('配件已添加到购物车');
                          }}
                          className="w-full bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 transition-colors duration-200"
                          size="small"
                        >
                          加入购物车
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {level5Accessories.length === 0 && (
                <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                  <div className="text-content-light mb-2 text-lg">💭 当前配件无下级适配件</div>
                  <div className="text-content-light text-sm">此配件已是最终选择，可直接添加到购物车</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachinesPage; 