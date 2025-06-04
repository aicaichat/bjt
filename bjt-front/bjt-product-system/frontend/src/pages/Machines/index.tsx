import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button, Select, InputNumber, Tabs, Tag, Tooltip, Divider, Row, Col } from 'antd';
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

export interface ConsumableSpecs {
  material?: string | null;
  shape?: string | null;
  thickness?: string | null; // e.g., "25 μm"
  width?: string | null; // e.g., "200 cm"
  length?: string | null; // e.g., "500 m"
  rollLength?: string | null; // e.g., "700 m"
  compatibility?: string | null;
}

const MachinesPage: React.FC = () => {
  const { t, i18n } = useTranslation('machines');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 从URL参数获取category
  const category = searchParams.get('category') || '1';
  
  // Utility functions
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
    return true; // Simplified permission check
  };

  const safeToLocaleString = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
  };

  const getStockStatus = (quantity: number) => {
    if (quantity > 10) return { status: t('stockStatus.sufficient'), color: 'green' };
    if (quantity > 0) return { status: t('stockStatus.low'), color: 'orange' };
    return { status: t('stockStatus.outOfStock'), color: 'red' };
  };
  
  // Define REGIONS inside the component to access t function
  const REGIONS = {
    CN: { nameCn: t('regions.china'), nameEn: 'China' },
    US: { nameCn: t('regions.usa'), nameEn: 'United States' },
    EU: { nameCn: t('regions.europe'), nameEn: 'Europe' },
    ASIA: { nameCn: t('regions.asia'), nameEn: 'Asia' }
  };
  
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
  const isSales = user && (user.role === 'admin' || user.role === 'sales');
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
            const mockMachines: MachinePart[] = [
              {
                id: 1,
                product_line_id: 1,
                model: 'LA-E4S',
                voltage: '220V',
                image_url: '/images/machines/LA-E4S.jpg',
                part_number: '60A01140',
                name_zh: t('models.E4S.nameZh'),
                name_en: t('models.E4S.nameEn'),
                brand: 'Lockedair',
                spec: t('models.E4S.spec'),
                spec_imperial: t('models.E4S.specImperial'),
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
                model_title_zh: t('models.E4S.titleZh'),
                model_title_en: t('models.E4S.titleEn'),
                model_description_zh: t('models.E4S.descriptionZh'),
                model_description_en: t('models.E4S.descriptionEn'),
                model_explosion_diagram_pdf: '/documents/LA-E4S-diagram.pdf',
                model_type: t('models.E4S.type'),
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
                name_zh: t('models.E5P.nameZh'),
                name_en: t('models.E5P.nameEn'),
                brand: 'Lockedair',
                spec: t('models.E5P.spec'),
                spec_imperial: t('models.E5P.specImperial'),
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
                model_title_zh: t('models.E5P.titleZh'),
                model_title_en: t('models.E5P.titleEn'),
                model_description_zh: t('models.E5P.descriptionZh'),
                model_description_en: t('models.E5P.descriptionEn'),
                model_explosion_diagram_pdf: '/documents/LA-E5P-diagram.pdf',
                model_type: t('models.E5P.type'),
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
              net_weight_kg: item.net_weight_kg || 0,
              net_weight_lbs: item.net_weight_lbs || 0,
              gross_weight_kg: item.gross_weight_kg || 0,
              gross_weight_lbs: item.gross_weight_lbs || 0,
              spec: item.spec || '',
              spec_imperial: item.spec_imperial || '',
              description_zh: item.description_zh || '',
              description_en: item.description_en || '',
              is_required: item.is_required || false,
              parent_id: item.parent_id || '',
              children: item.children || [],
              parts: (item.parts || []).map((part: any) => ({
                id: part.id || '',
                part_number: part.part_number || '',
                title: part.name || '',
                specs: {
                  spec: part.spec || '',
                  voltage: part.voltage || '',
                  frequency: part.frequency || '',
                  package_size_cm: part.package_size_cm || '',
                  package_size_inch: part.package_size_inch || '',
                  pcs_per_box: part.pcs_per_box || '',
                  pallet_size_cm: part.pallet_size_cm || '',
                  pallet_size_inch: part.pallet_size_inch || '',
                  pcs_per_pallet: part.pcs_per_pallet || '',
                  net_weight_kg: part.net_weight_kg || 0,
                  net_weight_lbs: part.net_weight_lbs || 0,
                  gross_weight_kg: part.gross_weight_kg || 0,
                  gross_weight_lbs: part.gross_weight_lbs || 0
                },
                spec: part.spec || '',
                spec_imperial: part.spec_imperial || '',
                prices: {
                  base: part.pricing?.base_price || 0,
                  tier1: part.pricing?.tier1_price || 0,
                  tier2: part.pricing?.tier2_price || 0,
                  vip: part.pricing?.vip_price || 0
                },
                inventory: (part.inventory || []).map((inv: any) => ({
                  region: inv.region || '',
                  amount: inv.amount || 0,
                  reserved: inv.reserved || 0
                }))
              }))
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
  const getRegionInventory = (product: MachinePart, region: string): number => {
    const regionInventory = product.inventory?.find(inv => inv.region === region);
    return regionInventory ? regionInventory.quantity : 0;
  };

  // 过滤产品
  const filteredMachines = React.useMemo(() => {
    if (!Array.isArray(machines)) return [];
    return machines.filter(machine => {
      // 型号筛选
      const modelMatch = filterType === 'all' || machine.model === filterType;
      // 电压筛选
      const voltageMatch = selectedVoltage === 'ALL' || !selectedVoltage || machine.voltage === selectedVoltage;
      return modelMatch && voltageMatch;
    });
  }, [machines, filterType, selectedVoltage]);

  const modelOptions = React.useMemo(() => {
    if (!Array.isArray(machines)) return [];
    const uniqueModels = Array.from(new Set(machines.map(m => m.model).filter(Boolean)));
    return [
      { value: 'all', label: t('filters.allModels') },
      ...uniqueModels.map(model => ({
        value: model,
        label: model
      }))
    ];
  }, [machines, t]);

  // 添加到购物车
  const handleAddToCart = async (product: MachinePart | MachineAccessory, productType: 'machine' | 'accessory' = 'machine') => {
    try {
      const quantity = quantities[product.id] || 1;

      // 验证配件选择
      if (productType === 'accessory') {
        const accessory = product as MachineAccessory;
        
        // 检查必选配件
        if (accessory.is_required) {
          const currentLevel = accessory.level;
          const requiredAccessories = currentLevel === 1 ? accessories :
            currentLevel === 2 ? level2Accessories :
            currentLevel === 3 ? level3Accessories :
            currentLevel === 4 ? level4Accessories : level5Accessories;
            
          const selectedRequiredAccessories = requiredAccessories.filter(acc => 
            acc.is_required && selectedAccessories[`level${currentLevel}`] === acc.id
          );
          
          if (selectedRequiredAccessories.length < requiredAccessories.filter(acc => acc.is_required).length) {
            showErrorToast(
              t('errors.requiredAccessories'),
              t('errors.selectAllRequired')
            );
            return;
          }
        }
        
        // 检查父级配件
        if (accessory.parent_id) {
          const parentLevel = accessory.level - 1;
          const parentId = selectedAccessories[`level${parentLevel}`];
          
          if (!parentId || parentId !== accessory.parent_id) {
            showErrorToast(
              t('errors.invalidSelection'),
              t('errors.selectParentFirst')
            );
            return;
          }
        }
      }

      // 创建购物车项
      const cartItem = {
        ...product,
        properties: productType === 'machine'
          ? {
              part_number: (product as MachinePart).part_number || (product as MachinePart).model || `MACHINE-${product.id}`,
              model: (product as MachinePart).model || '',
              name_zh: (product as MachinePart).name_zh || '',
              name_en: (product as MachinePart).name_en || '',
              voltage: (product as MachinePart).voltage || '',
              spec: (product as MachinePart).spec || '',
              spec_imperial: (product as MachinePart).spec_imperial || '',
              brand: (product as MachinePart).brand || '',
              unit: (product as MachinePart).unit || 'pcs',
              pcs_per_box: (product as MachinePart).pcs_per_box?.toString() || '',
              pcs_per_pallet: (product as MachinePart).pcs_per_pallet?.toString() || '',
              package_size_cm: (product as MachinePart).package_size_cm || '',
              package_size_inch: (product as MachinePart).package_size_inch || '',
              pallet_size_cm: (product as MachinePart).pallet_size_cm || '',
              pallet_size_inch: (product as MachinePart).pallet_size_inch || '',
              net_weight_kg: (product as MachinePart).net_weight_kg?.toString() || '',
              net_weight_lbs: (product as MachinePart).net_weight_lbs?.toString() || '',
              gross_weight_kg: (product as MachinePart).gross_weight_kg?.toString() || '',
              gross_weight_lbs: (product as MachinePart).gross_weight_lbs?.toString() || '',
              image_url: product.image_url || ''
            }
          : {
              part_number: (product as MachineAccessory).part_number || (product as MachineAccessory).model || `ACCESSORY-${product.id}`,
              model: (product as MachineAccessory).model || '',
              name_zh: (product as MachineAccessory).title_zh || (product as MachineAccessory).title || '',
              name_en: (product as MachineAccessory).title_en || (product as MachineAccessory).title || '',
              voltage: (product as MachineAccessory).voltage || (product as MachineAccessory).parts?.[0]?.specs?.voltage || '',
              frequency: (product as MachineAccessory).frequency || (product as MachineAccessory).parts?.[0]?.specs?.frequency || '',
              spec: (product as MachineAccessory).parts?.[0]?.spec || '',
              spec_imperial: (product as MachineAccessory).parts?.[0]?.spec_imperial || '',
              pcs_per_box: (product as MachineAccessory).pcs_per_box?.toString() || (product as MachineAccessory).parts?.[0]?.specs?.pcs_per_box || '',
              pcs_per_pallet: (product as MachineAccessory).pcs_per_pallet?.toString() || (product as MachineAccessory).parts?.[0]?.specs?.pcs_per_pallet || '',
              package_size_cm: (product as MachineAccessory).package_size_cm || (product as MachineAccessory).parts?.[0]?.specs?.package_size_cm || '',
              package_size_inch: (product as MachineAccessory).package_size_inch || (product as MachineAccessory).parts?.[0]?.specs?.package_size_inch || '',
              pallet_size_cm: (product as MachineAccessory).pallet_size_cm || (product as MachineAccessory).parts?.[0]?.specs?.pallet_size_cm || '',
              pallet_size_inch: (product as MachineAccessory).pallet_size_inch || (product as MachineAccessory).parts?.[0]?.specs?.pallet_size_inch || '',
              net_weight_kg: (product as MachineAccessory).net_weight_kg?.toString() || (product as MachineAccessory).parts?.[0]?.specs?.net_weight_kg || '',
              net_weight_lbs: (product as MachineAccessory).net_weight_lbs?.toString() || (product as MachineAccessory).parts?.[0]?.specs?.net_weight_lbs || '',
              gross_weight_kg: (product as MachineAccessory).gross_weight_kg?.toString() || (product as MachineAccessory).parts?.[0]?.specs?.gross_weight_kg || '',
              gross_weight_lbs: (product as MachineAccessory).gross_weight_lbs?.toString() || (product as MachineAccessory).parts?.[0]?.specs?.gross_weight_lbs || '',
              image_url: product.image_url || ''
            },
        id: product.id.toString(),
        quantity,
        selected: true,
        type: productType,
        added_at: new Date().toISOString(),
        partNumber: product.part_number || product.model || `${productType.toUpperCase()}-${product.id}`,
        productName: productType === 'machine'
          ? getMachineName(product as MachinePart)
          : (product as MachineAccessory).title_zh || (product as MachineAccessory).title,
        price: productType === 'machine'
          ? (product as MachinePart).prices?.[0]?.tiers?.[0]?.base_price || 0
          : (product as MachineAccessory).parts?.[0]?.prices?.base || 0,
        code: product.part_number || product.model || `${productType.toUpperCase()}-${product.id}`,
        image: product.image_url || '',
        category: productType === 'machine' ? t('categories.machine') : t('categories.accessory'),
        productId: Number(product.id),
        priceTiers: productType === 'machine'
          ? (product as MachinePart).prices?.[0]?.tiers?.map(t => ({
              min: t.min_quantity,
              max: t.max_quantity,
              price: t.base_price
            })) || []
          : (product as MachineAccessory).parts?.[0]?.prices
            ? [
                { min: 1, max: 4, price: (product as MachineAccessory).parts![0].prices!.base },
                { min: 5, max: 9, price: (product as MachineAccessory).parts![0].prices!.tier1 },
                { min: 10, max: null, price: (product as MachineAccessory).parts![0].prices!.tier2 }
              ]
            : [],
        item_id: Number(product.id),
        product_id: Number(product.id),
        part_number: product.part_number || product.model || `${productType.toUpperCase()}-${product.id}`,
        name: productType === 'machine'
          ? getMachineName(product as MachinePart)
          : (product as MachineAccessory).title_zh || (product as MachineAccessory).title,
        image_url: product.image_url || '',
        unit_price: productType === 'machine'
          ? (product as MachinePart).prices?.[0]?.tiers?.[0]?.base_price || 0
          : (product as MachineAccessory).parts?.[0]?.prices?.base || 0,
        currency: getCurrencySymbol(userRegion),
        line_total: (productType === 'machine'
          ? (product as MachinePart).prices?.[0]?.tiers?.[0]?.base_price || 0
          : (product as MachineAccessory).parts?.[0]?.prices?.base || 0) * quantity,
        inventory_status: 'in_stock' as const,
        product_type: productType,
        parent_id: productType === 'accessory' ? (product as MachineAccessory).parent_id : undefined,
        level: productType === 'accessory' ? (product as MachineAccessory).level : undefined
      };

      await addItem(cartItem);

      // 处理必选配件
      if (productType === 'accessory') {
        const accessory = product as MachineAccessory;
        if (accessory.is_required) {
          await addRequiredPartsToCartForAccessory(accessory, quantity, accessory.level);
        }
      }

      // 显示成功提示
      const productName = productType === 'machine' 
        ? getMachineName(product as MachinePart) 
        : (product as MachineAccessory).title_zh || (product as MachineAccessory).title;
        
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
      
      let errorMessage = err.message || t('errors.systemError');
      if (err.message?.includes('part_number')) {
        errorMessage = t('errors.missingPartNumber');
      } else if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        errorMessage = t('errors.authExpired');
      } else if (err.message?.includes('400')) {
        errorMessage = t('errors.invalidRequest');
      }
      
      showErrorToast(t('errors.addToCartFailed'), errorMessage);
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
    try {
      // Validate required accessories
      const currentLevelAccessories = level === 1 ? accessories :
        level === 2 ? level2Accessories :
        level === 3 ? level3Accessories :
        level === 4 ? level4Accessories : level5Accessories;
      
      const selectedAccessory = currentLevelAccessories.find(acc => acc.id === accessoryId);
      
      if (selectedAccessory?.is_required) {
        const requiredAccessories = currentLevelAccessories.filter(acc => acc.is_required);
        const selectedRequiredAccessories = requiredAccessories.filter(acc => 
          selectedAccessories[`level${level}`] === acc.id
        );
        
        if (selectedRequiredAccessories.length < requiredAccessories.length) {
          showErrorToast(
            t('errors.requiredAccessories'),
            t('errors.selectAllRequired')
          );
          return;
        }
      }

      // Update selection state
      setSelectedAccessories(prev => ({
        ...prev,
        [`level${level}`]: accessoryId
      }));
      
      setSelectedAccessoryNames(prev => ({
        ...prev,
        [`level${level}`]: accessoryName
      }));

      // Clear higher level selections
      for (let i = level + 1; i <= 5; i++) {
        const accessoryDiv = document.getElementById(`accessory-level-${i}`);
        if (accessoryDiv) {
          accessoryDiv.style.display = 'none';
        }
      }

      // Clear higher level selection states
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

      // Update context message
      const nextLevel = level + 1;
      if (nextLevel <= 5) {
        const contextMessage = document.getElementById(`level${nextLevel}-context-message`);
        if (contextMessage) {
          let contextText = `${accessoryName} ${t('accessories.compatible')}`;
          if (level > 1) {
            contextText = `${t('accessories.level')} ${level} ${accessoryName} ${t('accessories.subCompatible')}`;
          }
          contextMessage.textContent = contextText;
        }
      }

      // Get child accessories data
      if (selectedAccessory?.children?.length > 0) {
        const nextLevelAccessories = selectedAccessory.children.map(child => ({
          ...child,
          level: nextLevel
        }));
        
        switch (nextLevel) {
          case 2:
            setLevel2Accessories(nextLevelAccessories);
            break;
          case 3:
            setLevel3Accessories(nextLevelAccessories);
            break;
          case 4:
            setLevel4Accessories(nextLevelAccessories);
            break;
          case 5:
            setLevel5Accessories(nextLevelAccessories);
            break;
        }
        
        // Show next level accessory area
        const nextLevelDiv = document.getElementById(`accessory-level-${nextLevel}`);
        if (nextLevelDiv) {
          nextLevelDiv.style.display = 'block';
        }
      }
    } catch (err: any) {
      console.error(`❌ [handleAccessorySelection] Failed to process level ${level} accessories:`, err);
      showErrorToast(
        t('errors.processingFailed'),
        err.message || t('errors.unknownError')
      );
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
                    aria-label={`${t('actions.selectMachine')} ${machine.part_number}`}
                  />
                  <span className="text-sm font-medium">{t('actions.selectMachine')}</span>
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
                      <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.model')}:</strong>
                      <span className="text-gray-800 font-medium">{machine.model}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.voltage')}:</strong>
                      <span className="text-gray-800 font-medium">{machine.voltage ? t('voltages.' + machine.voltage) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.pcsPerBox')}:</strong>
                      <span className="text-gray-800 font-medium">{machine.pcs_per_box !== null && machine.pcs_per_box !== undefined ? machine.pcs_per_box : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.pcsPerPallet')}:</strong>
                      <span className="text-gray-800 font-medium">{machine.pcs_per_pallet !== null && machine.pcs_per_pallet !== undefined ? machine.pcs_per_pallet : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.palletSize')}:</strong>
                      <span className="text-gray-800 font-medium">
                        {unitSystem === 'metric' 
                          ? (machine.pallet_size_cm || 'N/A')
                          : (machine.pallet_size_inch || 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.packSize')}:</strong>
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
                        info(t('noSpecPdf'));
                      }
                    }}
                    className="bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white border-gray-300 transition-colors duration-200"
                  >
                    {t('specDetails')}
                  </Button>
                  
                  <Tooltip
                    title={
                      <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                          <InfoCircleOutlined className="text-blue-500 mr-2" />
                          <span className="font-bold text-gray-800 text-sm">{t('moreInfo')}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">{t('tableHeaders.packSize')}:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' ? (machine.package_size_cm || t('pending')) : (machine.package_size_inch || t('pending'))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">{t('tableHeaders.netWeight')}:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.net_weight_kg !== null && machine.net_weight_kg !== undefined ? `${machine.net_weight_kg} kg` : t('pending'))
                                : (machine.net_weight_lbs !== null && machine.net_weight_lbs !== undefined ? `${machine.net_weight_lbs} lbs` : t('pending'))
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">{t('tableHeaders.palletHeight')}:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.pallet_height_cm !== null && machine.pallet_height_cm !== undefined ? `${machine.pallet_height_cm} cm` : t('pending'))
                                : (machine.pallet_height_inch !== null && machine.pallet_height_inch !== undefined ? `${machine.pallet_height_inch} inch` : t('pending'))
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">{t('tableHeaders.palletGrossWeight')}:</span>
                            <span className="text-gray-800 font-semibold text-xs bg-purple-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.pallet_gross_weight_kg !== null && machine.pallet_gross_weight_kg !== undefined ? `${machine.pallet_gross_weight_kg} kg` : t('pending'))
                                : (machine.pallet_gross_weight_lbs !== null && machine.pallet_gross_weight_lbs !== undefined ? `${machine.pallet_gross_weight_lbs} lbs` : t('pending'))
                              }
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                          <span className="text-xs text-gray-500">{t('hoverDetails')}</span>
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
                      {t('moreInfo')}
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {/* Column 3: Price, Stock, Actions */}
              <div className="w-full md:w-1/5 md:pl-6 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0">
                <div className="mb-4">
                  <div className="font-medium text-sm text-gray-600 mb-2">
                    {t('tableHeaders.price')} ({getCurrencySymbol(userRegion)}):
                  </div>
                  
                  {/* 主显示最低价 */}
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {getCurrencySymbol(userRegion)}
                    {machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0
                      ? formatPrice(
                          Math.min(...machine.prices[0].tiers.map(tier => tier.base_price || 0))
                        )
                      : 0}
                    <span className="text-base text-gray-500 font-normal ml-2">
                      {t('pricing.from')}
                    </span>
                  </div>
                  
                  {/* 梯度价格列表 */}
                  {machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {machine.prices[0].tiers.map((tier, index) => (
                        <div key={`machine-${machine.id}-price-tier-${index}-${tier.min_quantity}-${tier.max_quantity}`} className="mb-1">
                          {getCurrencySymbol(userRegion)}{formatPrice(tier.base_price)}（{tier.min_quantity}-{tier.max_quantity || '+'}{t('pricing.pieces')}）
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {isSales && (
                  <div className="mb-4">
                    <div className="font-medium text-sm text-gray-600 mb-2">
                      {t('tableHeaders.stock')}:
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
                    {canAddToCart ? t('addToCart') : t('noPermissionAdd')}
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
          text={t('loading')} 
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
          {t('error')}
        </h3>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          {error || t('error')}
        </p>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()} 
          className="bg-blue-500 hover:bg-blue-600 border-none"
        >
          {t('retry')}
        </Button>
      </div>
    );
  };

  // 渲染配件路径导航
  const renderAccessoryPath = (level: number) => {
    const pathItems = [];
    
    // Add host machine
    if (selectedMachine) {
      const machine = machines.find(m => m.id.toString() === selectedMachine);
      if (machine) {
        pathItems.push(
          <div key={`machine-path-${level}-${machine.id}-${machine.part_number}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-1">{t('path.machine')}</span>
            <span className="text-gray-800">{getMachineName(machine)}</span>
          </div>
        );
      }
    }
    
    // Add accessories for each level
    for (let i = 1; i < level; i++) {
      const accessoryId = selectedAccessories[`level${i}`];
      const accessoryName = selectedAccessoryNames[`level${i}`];
      
      if (accessoryId && accessoryName) {
        pathItems.push(
          <div key={`accessory-level-${level}-path-${i}-${accessoryId}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-1">
              {t('accessories.level')} {i}
            </span>
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
              {t(`machines.accessories.level${level}`)}
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
        <h1 className="text-xl font-bold mb-4 text-gray-800">{t('pageTitle')}</h1>
        
        <div className="flex flex-wrap gap-4">
          {/* Voltage Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              {t('filters.voltage')}
            </label>
            <Select
              value={selectedVoltage}
              onChange={(value: string) => setSelectedVoltage(value)}
              style={{ width: 120 }}
              className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
              options={[
                { value: 'ALL', label: t('filters.all') },
                { value: '220V', label: '220V' },
                { value: '110V', label: '110V' }
              ]}
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              {t('filters.model')}
            </label>
            <Select
              value={filterType}
              onChange={(value: string) => setFilterType(value)}
              style={{ width: 180 }}
              className="bg-white text-gray-900 border-gray-300 hover:border-blue-500"
              options={modelOptions}
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
              {t('accessories.title')} 
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded">{t('accessories.level1')}</span>
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
            {t('actions.close')}
          </Button>
        </div>
        
        <div className="accessory-content">
          {/* 添加主机信息显示 */}
          {selectedMachine && (
            <div className="bg-white p-3 rounded-lg shadow-sm mb-4 flex items-center border border-gray-200">
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-2">{t('path.machine')}</span>
              <span className="text-gray-800">
                {(() => {
                  const machine = machines.find(m => m.id.toString() === selectedMachine);
                  return machine ? getMachineName(machine) : t('unknownMachine');
                })()}
              </span>
              <span className="mx-2 text-gray-400">
                <RightOutlined style={{ fontSize: '10px' }} />
              </span>
              <span className="text-blue-600 font-medium">{t('accessories.level1')}</span>
            </div>
          )}
          
          {accessoriesLoading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text={t('loading')} 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {accessories
                .filter(accessory => {
                  const accVoltage = accessory.voltage || (accessory.parts && accessory.parts[0] && accessory.parts[0].specs && accessory.parts[0].specs.voltage);
                  return selectedVoltage === 'ALL' || !selectedVoltage || !accVoltage || accVoltage === selectedVoltage;
                })
                .map((accessory, index) => (
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
                          <span className="text-sm font-medium">{t('actions.selectAccessory')}</span>
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
                              <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.model')}:</strong>
                              <span className="text-gray-800 font-medium">{accessory.model}</span>
                            </div>
                            <div className="flex items-center">
                              <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.voltage')}:</strong>
                              <span className="text-gray-800 font-medium">{accessory.voltage ? t('voltages.' + accessory.voltage) : 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.frequency')}:</strong>
                              <span className="text-gray-800 font-medium">{accessory.frequency || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.packSize')}:</strong>
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
                          <div className="font-medium text-sm text-gray-600 mb-2">
                            {t('tableHeaders.priceRange')} ({getCurrencySymbol(userRegion)}):
                          </div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold text-green-600">
                              {getCurrencySymbol(userRegion)}
                              {accessory.parts && accessory.parts[0] && accessory.parts[0].prices
                                ? formatPrice(
                                    Math.min(
                                      ...['base', 'tier1', 'tier2']
                                        .map(key => accessory.parts[0].prices?.[key] ?? Infinity)
                                        .filter(v => typeof v === 'number' && v > 0)
                                    )
                                  )
                                : 0}
                            </span>
                            <span className="text-base text-gray-500 font-normal">{t('pricing.from')}</span>
                          </div>
                          {accessory.parts && accessory.parts[0] && accessory.parts[0].prices && (
                            <div className="rounded bg-green-50 px-3 py-2 text-xs text-green-800 space-y-1 border border-green-100">
                              {[
                                { min: 1, max: 4, price: accessory.parts[0].prices.base },
                                { min: 5, max: 9, price: accessory.parts[0].prices.tier1 },
                                { min: 10, max: null, price: accessory.parts[0].prices.tier2 }
                              ]
                                .filter(tier => tier.price && tier.price > 0)
                                .map((tier, idx) => (
                                  <div key={`accessory-${accessory.id}-price-tier-${idx}`}>
                                    <span className="font-semibold">{getCurrencySymbol(userRegion)}{formatPrice(tier.price)}</span>
                                    <span className="ml-2 text-gray-500">
                                      ({tier.min}-{tier.max || '+'}{t('pricing.pieces')})
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {isSales && accessory.parts && accessory.parts[0] && accessory.parts[0].inventory && (
                          <div className="mb-4">
                            <div className="font-medium text-sm text-gray-600 mb-2">{t('tableHeaders.stock')}:</div>
                            <div className="flex flex-wrap gap-1">
                              {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
                                const regionInventory = accessory.parts[0].inventory.find(inv => inv.region === regionKey);
                                const amount = regionInventory ? regionInventory.amount : 0;
                                const stockStatus = getStockStatus(amount);
                                return (
                                  <Tag
                                    key={`${accessory.id}-inventory-${regionKey}`}
                                    color={stockStatus.color}
                                    className="text-xs"
                                  >
                                    {REGIONS[regionKey].nameCn}: {amount}
                                  </Tag>
                                );
                              })}
                            </div>
                          </div>
                        )}

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
                              handleAddToCart(accessory, 'accessory');
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 transition-colors duration-200"
                            size="small"
                          >
                            {t('addToCart')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {accessories.length === 0 && (
                <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                  <div className="text-content-light mb-2 text-lg">{t('noAccessories')}</div>
                  <div className="text-content-light text-sm">{t('chooseOther')}</div>
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