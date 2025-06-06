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
  const [selectedVoltage, setSelectedVoltage] = useState<string>('ALL');
  
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
        
        // 修复数据验证逻辑 - 检查更多可能的数据结构
        let hostModelsData = null;
        
        if (data && data.success && Array.isArray(data.data)) {
          hostModelsData = data.data;
        } else if (data && Array.isArray(data.data)) {
          hostModelsData = data.data;
        } else if (data && data.success && data.data && Array.isArray(data.data.items)) {
          hostModelsData = data.data.items;
        } else if (data && Array.isArray(data)) {
          hostModelsData = data;
        } else if (data && data.items && Array.isArray(data.items)) {
          hostModelsData = data.items;
        }
        
        if (hostModelsData && hostModelsData.length > 0) {
          console.log('✅ [fetchHostModels] Using API data:', hostModelsData);
          
          // 转换主机型号数据的PDF URL
          const transformedHostModels = hostModelsData.map((hostModel: any) => {
            const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', '');
            
            const getAbsolutePdfUrl = (pdfUrl: string | null) => {
              if (!pdfUrl) return null;
              if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
                return pdfUrl; // Already absolute
              }
              if (pdfUrl.startsWith('/')) {
                // 清理路径：移除多余的前缀
                let cleanPath = pdfUrl;
                if (cleanPath.startsWith('/frontend/public')) {
                  cleanPath = cleanPath.replace('/frontend/public', '');
                }
                return serverBaseUrl + cleanPath;
              }
              return pdfUrl;
            };
            
            return {
              ...hostModel,
              spec_pdf: getAbsolutePdfUrl(hostModel.spec_pdf),
              explosion_diagram_pdf: getAbsolutePdfUrl(hostModel.explosion_diagram_pdf)
            };
          });
          
          console.log('🔍 [fetchHostModels] Host models with PDF info:', transformedHostModels.map(h => ({
            id: h.id,
            model: h.model,
            code: h.code,
            title_zh: h.title_zh,
            spec_pdf: h.spec_pdf,
            explosion_diagram_pdf: h.explosion_diagram_pdf,
            hasPdf: !!(h.spec_pdf || h.explosion_diagram_pdf)
          })));
          setHostModels(transformedHostModels);
          return;
        } else {
          console.log('⚠️ [fetchHostModels] API returned empty data, trying mock data');
        }
      }
      
      // 如果API失败或返回空数据，使用Mock数据
      console.log('⚠️ [fetchHostModels] API failed or returned empty data, using mock data');
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
    console.log('🚀 [fetchMachines] Starting API call with params:', {
      category,
      currentLanguage,
      filterRegion,
      selectedVoltage,
      currentPage,
      pageSize
    });
    
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
          const apiUrl = `${baseUrl}/machineparts?page=${currentPage}&per_page=${pageSize}&product_line_id=${category}&lang=${currentLanguage}`;
          
          console.log('🌐 [fetchWithRetry] Making API request:', {
            apiUrl,
            retryCount,
            token: localStorage.getItem('auth_token') ? 'exists' : 'missing'
          });
          
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('📥 [fetchWithRetry] API response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
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
              
              // Transform API fields to frontend interface
              const transformedMachines = machinesData.map((machine: any) => {
                // Convert relative image URLs to absolute URLs
                const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', '');
                
                const getAbsoluteImageUrl = (imageUrl: string | null) => {
                  if (!imageUrl) return null;
                  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    return imageUrl; // Already absolute
                  }
                  if (imageUrl.startsWith('/')) {
                    // 修复：正确处理不同的上传路径
                    // 开发环境下使用开发服务器，生产环境使用API服务器
                    return serverBaseUrl + imageUrl; // Convert relative to absolute
                  }
                  return imageUrl; // Assume it's a valid URL
                };

                return {
                  ...machine,
                  image_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.image_url),
                  model_image1_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.model_image1_url),
                  model_image2_url: getAbsoluteImageUrl(machine.image2_url) || getAbsoluteImageUrl(machine.model_image2_url),
                  // 修复PDF字段映射 - 确保spec_pdf字段被正确保存
                  spec_pdf: getAbsoluteImageUrl(machine.spec_pdf),
                  explosion_diagram_pdf: getAbsoluteImageUrl(machine.explosion_diagram_pdf),
                  model_explosion_diagram_pdf: getAbsoluteImageUrl(machine.spec_pdf) || getAbsoluteImageUrl(machine.explosion_diagram_pdf) || getAbsoluteImageUrl(machine.model_explosion_diagram_pdf)
                };
              });
              
              console.log('🔄 [fetchMachines] Image URL transformation sample:', {
                originalImageFields: machinesData.slice(0, 2).map((m: any) => ({
                  id: m.id,
                  image1_url: m.image1_url,
                  image2_url: m.image2_url,
                  image_url: m.image_url,
                  explosion_diagram_pdf: m.explosion_diagram_pdf,
                  spec_pdf: m.spec_pdf
                })),
                transformedImageFields: transformedMachines.slice(0, 2).map((m: any) => ({
                  id: m.id,
                  image_url: m.image_url,
                  model_image1_url: m.model_image1_url,
                  model_image2_url: m.model_image2_url,
                  spec_pdf: m.spec_pdf,
                  explosion_diagram_pdf: m.explosion_diagram_pdf,
                  model_explosion_diagram_pdf: m.model_explosion_diagram_pdf
                })),
                serverBaseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', ''),
                isDev: import.meta.env.DEV,
                actualBaseUrl: import.meta.env.DEV ? 'http://localhost:5173' : (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', '')
              });

              // 增强调试：显示完整的原始机器数据
              console.log('🔍 [fetchMachines] Raw API machines data (first 2):', machinesData.slice(0, 2));
              console.log('🔍 [fetchMachines] All machine IDs and PDF fields:', machinesData.map(m => ({
                id: m.id,
                code: m.code,
                title_zh: m.title_zh,
                spec_pdf: m.spec_pdf,
                explosion_diagram_pdf: m.explosion_diagram_pdf,
                image1_url: m.image1_url
              })));

              setMachines(transformedMachines);
              
              // 调试：显示所有机器的图片URL情况
              console.log('🔍 [DEBUG] All machines image URLs:', transformedMachines.map(m => ({
                id: m.id,
                part_number: m.part_number,
                image_url: m.image_url,
                model_image1_url: m.model_image1_url,
                spec_pdf: (m as any).spec_pdf,
                explosion_diagram_pdf: (m as any).explosion_diagram_pdf,
                model_explosion_diagram_pdf: m.model_explosion_diagram_pdf,
                hasValidImageUrl: !!(m.image_url && m.image_url !== DEFAULT_IMAGE),
                hasValidPdf: !!((m as any).spec_pdf || (m as any).explosion_diagram_pdf || m.model_explosion_diagram_pdf)
              })));
              
              setTotal(transformedMachines.length);
              setCurrentPage(1);
              setPageSize(10);
              setTotalPages(Math.ceil(transformedMachines.length / 10));
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

          // Transform API fields to frontend interface for main response
          const transformedItems = data.data.items.map((machine: any) => {
            // Convert relative image URLs to absolute URLs
            const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', '');
            
            const getAbsoluteImageUrl = (imageUrl: string | null) => {
              if (!imageUrl) return null;
              if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl; // Already absolute
              }
              if (imageUrl.startsWith('/')) {
                // 修复：正确处理不同的上传路径
                // 开发环境下使用开发服务器，生产环境使用API服务器
                return serverBaseUrl + imageUrl; // Convert relative to absolute
              }
              return imageUrl; // Assume it's a valid URL
            };

            return {
              ...machine,
              image_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.image_url),
              model_image1_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.model_image1_url),
              model_image2_url: getAbsoluteImageUrl(machine.image2_url) || getAbsoluteImageUrl(machine.model_image2_url),
              // 修复PDF字段映射 - 确保spec_pdf字段被正确保存
              spec_pdf: getAbsoluteImageUrl(machine.spec_pdf),
              explosion_diagram_pdf: getAbsoluteImageUrl(machine.explosion_diagram_pdf),
              model_explosion_diagram_pdf: getAbsoluteImageUrl(machine.spec_pdf) || getAbsoluteImageUrl(machine.explosion_diagram_pdf) || getAbsoluteImageUrl(machine.model_explosion_diagram_pdf)
            };
          });

          console.log('🔄 [fetchMachines] Image URL transformation sample:', {
            originalImageFields: data.data.items.slice(0, 2).map((m: any) => ({
              id: m.id,
              image1_url: m.image1_url,
              image2_url: m.image2_url,
              image_url: m.image_url,
              explosion_diagram_pdf: m.explosion_diagram_pdf,
              spec_pdf: m.spec_pdf
            })),
            transformedImageFields: transformedItems.slice(0, 2).map((m: any) => ({
              id: m.id,
              image_url: m.image_url,
              model_image1_url: m.model_image1_url,
              model_image2_url: m.model_image2_url,
              spec_pdf: m.spec_pdf,
              explosion_diagram_pdf: m.explosion_diagram_pdf,
              model_explosion_diagram_pdf: m.model_explosion_diagram_pdf
            })),
            serverBaseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', ''),
            isDev: import.meta.env.DEV,
            actualBaseUrl: import.meta.env.DEV ? 'http://localhost:5173' : (import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1').replace('/wp-json/bjt/v1', '')
          });

          setMachines(transformedItems);
          
          // 调试：显示所有机器的图片URL情况
          console.log('🔍 [DEBUG] All machines image URLs:', transformedItems.map(m => ({
            id: m.id,
            part_number: m.part_number,
            image_url: m.image_url,
            model_image1_url: m.model_image1_url,
            spec_pdf: (m as any).spec_pdf,
            explosion_diagram_pdf: (m as any).explosion_diagram_pdf,
            model_explosion_diagram_pdf: m.model_explosion_diagram_pdf,
            hasValidImageUrl: !!(m.image_url && m.image_url !== DEFAULT_IMAGE),
            hasValidPdf: !!((m as any).spec_pdf || (m as any).explosion_diagram_pdf || m.model_explosion_diagram_pdf)
          })));
          
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
            
            // 新的数据转换逻辑：正确处理嵌套层级结构
            const flattenAccessoriesByLevel = (items: any[], targetLevel: number = 1) => {
              const result: MachineAccessory[] = [];
              
              console.log('🔍 [flattenAccessoriesByLevel] Input items:', items);
              console.log('🔍 [flattenAccessoriesByLevel] Target level:', targetLevel);
              
              const processItems = (itemsList: any[], parentId?: string) => {
                itemsList.forEach((item: any, index: number) => {
                  console.log(`🔍 [processItems] Processing item ${index}:`, {
                    id: item.id,
                    part_number: item.part_number,
                    level: item.level,
                    name: item.name,
                    hasChildren: item.children?.length > 0
                  });
                  
                  // 检查是否为目标层级的配件
                  if (item.level === targetLevel) {
                    console.log(`✅ [processItems] Found target level ${targetLevel} item:`, item.part_number);
                    
                    // ✅ 修复：递归转换子级数据
                    const convertChildren = (childrenData: any[]): MachineAccessory[] => {
                      if (!childrenData || !Array.isArray(childrenData) || childrenData.length === 0) {
                        return [];
                      }
                      
                      return childrenData.map((child: any) => ({
                        id: String(child.id || child.part_number || ''),
                        product_line_id: child.product_line_id,
                        model: child.model || '',
                        brand: child.brand || '',
                        part_number: child.part_number || '',
                        name_zh: child.name || child.name_zh || '',
                        name_en: child.name || child.name_en || '',
                        title: child.name || child.title || '',
                        title_zh: child.name || child.title_zh || '',
                        title_en: child.name || child.title_en || '',
                        spec: child.spec || '',
                        spec_imperial: child.spec_imperial || '',
                        voltage: child.voltage || '',
                        frequency: child.frequency || '',
                        package_size_cm: child.package_size_cm || '',
                        package_size_inch: child.package_size_inch || '',
                        net_weight_kg: child.net_weight_kg ? parseFloat(child.net_weight_kg) : undefined,
                        net_weight_lbs: child.net_weight_lbs ? parseFloat(child.net_weight_lbs) : undefined,
                        gross_weight_kg: child.gross_weight_kg ? parseFloat(child.gross_weight_kg) : undefined,
                        gross_weight_lbs: child.gross_weight_lbs ? parseFloat(child.gross_weight_lbs) : undefined,
                        pcs_per_box: child.pcs_per_box ? parseInt(child.pcs_per_box) : undefined,
                        pallet_size_cm: child.pallet_size_cm || '',
                        pallet_size_inch: child.pallet_size_inch || '',
                        pcs_per_pallet: child.pcs_per_pallet ? parseInt(child.pcs_per_pallet) : undefined,
                        pallet_height_cm: child.pallet_height_cm ? parseFloat(child.pallet_height_cm) : undefined,
                        pallet_height_inch: child.pallet_height_inch ? parseFloat(child.pallet_height_inch) : undefined,
                        pallet_gross_weight_kg: child.pallet_gross_weight_kg ? parseFloat(child.pallet_gross_weight_kg) : undefined,
                        pallet_gross_weight_lbs: child.pallet_gross_weight_lbs ? parseFloat(child.pallet_gross_weight_lbs) : undefined,
                        image_url: child.image_url || '/images/placeholder.jpg',
                        level: child.level || (targetLevel + 1),
                        parts: [],
                        parent_id: item.id || item.part_number,
                        compatible_machines: [],
                        child_accessories: [],
                        children: convertChildren(child.children), // 递归转换子级
                        status: child.status || 'publish',
                        unit: child.unit || 'pcs',
                        created_at: child.created_at,
                        updated_at: child.updated_at,
                        is_required: false
                      }));
                    };
                    
                    // 正确映射API字段到MachineAccessory类型
                    const convertedAccessory: MachineAccessory = {
                      id: String(item.id || item.part_number || ''),
                      product_line_id: item.product_line_id,
                      model: item.model || '',
                      brand: item.brand || '',
                      part_number: item.part_number || '',
                      name_zh: item.name || item.name_zh || '', // API返回name字段
                      name_en: item.name || item.name_en || '', // API返回name字段
                      title: item.name || item.title || '', // 修复字段映射：使用name字段
                      title_zh: item.name || item.title_zh || '',
                      title_en: item.name || item.title_en || '',
                      spec: item.spec || '',
                      spec_imperial: item.spec_imperial || '',
                      voltage: item.voltage || '',
                      frequency: item.frequency || '',
                      package_size_cm: item.package_size_cm || '',
                      package_size_inch: item.package_size_inch || '',
                      net_weight_kg: item.net_weight_kg ? parseFloat(item.net_weight_kg) : undefined,
                      net_weight_lbs: item.net_weight_lbs ? parseFloat(item.net_weight_lbs) : undefined,
                      gross_weight_kg: item.gross_weight_kg ? parseFloat(item.gross_weight_kg) : undefined,
                      gross_weight_lbs: item.gross_weight_lbs ? parseFloat(item.gross_weight_lbs) : undefined,
                      pcs_per_box: item.pcs_per_box ? parseInt(item.pcs_per_box) : undefined,
                      pallet_size_cm: item.pallet_size_cm || '',
                      pallet_size_inch: item.pallet_size_inch || '',
                      pcs_per_pallet: item.pcs_per_pallet ? parseInt(item.pcs_per_pallet) : undefined,
                      pallet_height_cm: item.pallet_height_cm ? parseFloat(item.pallet_height_cm) : undefined,
                      pallet_height_inch: item.pallet_height_inch ? parseFloat(item.pallet_height_inch) : undefined,
                      pallet_gross_weight_kg: item.pallet_gross_weight_kg ? parseFloat(item.pallet_gross_weight_kg) : undefined,
                      pallet_gross_weight_lbs: item.pallet_gross_weight_lbs ? parseFloat(item.pallet_gross_weight_lbs) : undefined,
                      image_url: item.image_url || '/images/placeholder.jpg',
                      level: item.level || targetLevel,
                      parts: [], // 初始化为空数组
                      parent_id: parentId,
                      compatible_machines: [],
                      child_accessories: [],
                      children: convertChildren(item.children), // ✅ 修复：保存转换后的子级数据
                      status: item.status || 'publish',
                      unit: item.unit || 'pcs',
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      is_required: false
                    };
                    
                    result.push(convertedAccessory);
                    console.log(`✅ [processItems] Successfully converted and added accessory:`, {
                      id: convertedAccessory.id,
                      part_number: convertedAccessory.part_number,
                      title: convertedAccessory.title,
                      level: convertedAccessory.level,
                      childrenCount: convertedAccessory.children.length // ✅ 显示子级数量
                    });
                  } else {
                    console.log(`⏭️ [processItems] Skipping item (level ${item.level} != ${targetLevel}):`, item.part_number);
                  }
                  
                  // 递归处理子级
                  if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                    console.log(`🔍 [processItems] Processing ${item.children.length} children for item ${item.part_number}`);
                    processItems(item.children, item.id || item.part_number);
                  }
                });
              };
              
              processItems(items);
              console.log(`🔍 [flattenAccessoriesByLevel] Final result count for level ${targetLevel}:`, result.length);
              console.log(`🔍 [flattenAccessoriesByLevel] Final result items:`, result.map(r => ({ 
                part_number: r.part_number, 
                title: r.title, 
                level: r.level,
                childrenCount: r.children.length // ✅ 显示每个配件的子级数量
              })));
              return result;
            };
            
            // 提取Level 1配件
            const level1Accessories = flattenAccessoriesByLevel(accessoriesData, 1);
            console.log('🔍 [loadAccessories] Level 1 accessories extracted:', level1Accessories);
            console.log('🔍 [loadAccessories] Level 1 accessories count:', level1Accessories.length);
            console.log('🔍 [loadAccessories] Level 1 accessories part numbers:', level1Accessories.map(a => a.part_number));
            
            if (!isCancelled) {
              console.log('🔄 [loadAccessories] Setting accessories state with', level1Accessories.length, 'items');
              setAccessories(level1Accessories);
              
              // 立即验证设置是否成功
              console.log('✅ [loadAccessories] State should be updated with accessories');
              
              // 显示配件区域
              const accessoryDiv = document.getElementById('accessory-level-1');
              if (accessoryDiv) {
                accessoryDiv.style.display = 'block';
              }
              
              // 更新上一次选择的机器引用
              previousMachineRef.current = selectedMachine;
              setAutoLoadedAccessories(true);
              
              console.log('✅ [loadAccessories] Level 1 accessories set successfully, count:', level1Accessories.length);
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

  // 处理电压选择
  const handleVoltageChange = (value: string) => {
    setSelectedVoltage(value);
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
        
        // 显示成功加载下一级配件的提示
        success(
          t('accessories.nextLevelLoaded') || '下一级配件已加载',
          t('accessories.nextLevelLoadedDesc', { 
            level: nextLevel, 
            count: nextLevelAccessories.length 
          }) || `已为您加载了 ${nextLevelAccessories.length} 个${nextLevel}级配件选项`
        );
      } else {
        // 当没有下一级配件时的提醒消息
        if (nextLevel <= 5) {
          info(
            t('accessories.noNextLevel') || '配件选择完成',
            t('accessories.noNextLevelDesc', { 
              name: accessoryName,
              level: level 
            }) || `${accessoryName} 没有更多子级配件，您已完成所有必要的配件选择。`
          );
        } else {
          success(
            t('accessories.allLevelsComplete') || '所有配件选择完成',
            t('accessories.allLevelsCompleteDesc') || '您已完成全部5级配件的选择，可以添加到购物车了。'
          );
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
                      console.log('❌ [Image Error] Failed to load image:', {
                        originalSrc: target.src,
                        machineId: machine.id,
                        machinePartNumber: machine.part_number,
                        originalImageFields: {
                          image1_url: (machine as any).image1_url,
                          image_url: machine.image_url,
                          model_image1_url: machine.model_image1_url
                        },
                        willFallback: target.src !== DEFAULT_IMAGE,
                        defaultImage: DEFAULT_IMAGE
                      });
                      if (target.src !== DEFAULT_IMAGE) {
                        target.src = DEFAULT_IMAGE;
                      }
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('✅ [Image Loaded] Successfully loaded image:', {
                        src: target.src,
                        machineId: machine.id,
                        machinePartNumber: machine.part_number,
                        isDefault: target.src === DEFAULT_IMAGE
                      });
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
                  {/* 临时调试按钮 */}
                  <button 
                    onClick={async () => {
                      console.log('🔍 [DEBUG] Machine data:', machine);
                      
                      // 检查图片文件是否存在
                      if (machine.image_url) {
                        try {
                          const imgResponse = await fetch(machine.image_url, { method: 'HEAD' });
                          console.log(`🔍 [DEBUG] Image file check for ${machine.image_url}:`, {
                            exists: imgResponse.ok,
                            status: imgResponse.status,
                            statusText: imgResponse.statusText
                          });
                        } catch (error) {
                          console.log(`❌ [DEBUG] Image file check failed for ${machine.image_url}:`, error);
                        }
                      }
                      
                      // 检查PDF文件是否存在
                      if (machine.model_explosion_diagram_pdf) {
                        try {
                          const pdfResponse = await fetch(machine.model_explosion_diagram_pdf, { method: 'HEAD' });
                          console.log(`🔍 [DEBUG] PDF file check for ${machine.model_explosion_diagram_pdf}:`, {
                            exists: pdfResponse.ok,
                            status: pdfResponse.status,
                            statusText: pdfResponse.statusText
                          });
                        } catch (error) {
                          console.log(`❌ [DEBUG] PDF file check failed for ${machine.model_explosion_diagram_pdf}:`, error);
                        }
                      }
                      
                      alert(`机器数据已输出到控制台\n图片URL: ${machine.image_url}\nPDF: ${machine.model_explosion_diagram_pdf}\n\n文件存在性检查结果请查看控制台`);
                    }}
                    className="ml-2 text-xs bg-yellow-400 text-black px-2 py-1 rounded"
                  >
                    调试
                  </button>
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
                  {/* 规格说明按钮 - 放在前面，和主机一样 */}
                  <Button 
                    size="small"
                    icon={<InfoCircleOutlined />}
                    onClick={() => {
                      // 从主机型号表中查找对应的PDF - 改进匹配逻辑
                      const hostModel = hostModels.find(model => {
                        // 优先策略1: ID匹配（如果主机型号表中有对应的机器ID）
                        if ((model as any).machine_id === machine.id) return true;
                        if ((model as any).part_number === machine.part_number) return true;
                        
                        // 优先策略2: 精确完整匹配
                        if (model.model === machine.model) return true;
                        if ((model as any).code === machine.model) return true;
                        if (model.title_zh === machine.name_zh) return true;
                        if (model.title_en === machine.name_en) return true;
                        
                        // 策略3: 去除版本号和测试后缀的匹配 - 更严格的匹配
                        const cleanMachineModel = machine.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                        const cleanHostModel = model.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                        const cleanHostCode = (model as any).code?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                        
                        // 更严格的匹配：只有当清理后的字符串完全相同且长度大于3时才匹配
                        if (cleanMachineModel && cleanHostModel && cleanMachineModel.length > 3 && cleanMachineModel === cleanHostModel) return true;
                        if (cleanMachineModel && cleanHostCode && cleanMachineModel.length > 3 && cleanMachineModel === cleanHostCode) return true;
                        
                        // 策略4: 基础型号匹配 (例如 LA-E4S) - 但要求更精确
                        const baseMachineModel = machine.model?.split(/[\s\(]/)[0]; // 取第一部分
                        const baseHostModel = model.model?.split(/[\s\(]/)[0];
                        const baseHostCode = (model as any).code?.split(/[\s\(]/)[0];
                        
                        // 只有当基础型号长度大于4且完全匹配时才认为匹配
                        if (baseMachineModel && baseHostModel && baseMachineModel.length > 4 && baseMachineModel === baseHostModel) return true;
                        if (baseMachineModel && baseHostCode && baseMachineModel.length > 4 && baseMachineModel === baseHostCode) return true;
                        
                        return false;
                      });
                      
                      console.log('🔍 [Machine PDF Debug] Looking for host model PDF:', {
                        machine_id: machine.id,
                        machine_model: machine.model,
                        machine_name_zh: machine.name_zh,
                        machine_part_number: machine.part_number,
                        available_host_models: hostModels.map(h => ({
                          id: h.id,
                          model: h.model,
                          code: (h as any).code, // 添加code字段显示
                          title_zh: h.title_zh,
                          title_en: h.title_en,
                          spec_pdf: (h as any).spec_pdf,
                          explosion_diagram_pdf: (h as any).explosion_diagram_pdf
                        })),
                        found_host_model: hostModel,
                        host_model_pdf: hostModel ? (hostModel as any).spec_pdf || (hostModel as any).explosion_diagram_pdf : null,
                        matching_details: {
                          exact_model_match: hostModels.some(h => h.model === machine.model),
                          exact_code_match: hostModels.some(h => (h as any).code === machine.model), // 添加code匹配检查
                          exact_title_zh_match: hostModels.some(h => h.title_zh === machine.name_zh),
                          clean_model_match: hostModels.some(h => {
                            const cleanMachineModel = machine.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                            const cleanHostModel = h.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                            return cleanMachineModel === cleanHostModel;
                          }),
                          clean_code_match: hostModels.some(h => {
                            const cleanMachineModel = machine.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                            const cleanHostCode = (h as any).code?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                            return cleanMachineModel === cleanHostCode;
                          }),
                          base_model_match: hostModels.some(h => {
                            const baseMachineModel = machine.model?.split(/[\s\(]/)[0];
                            const baseHostModel = h.model?.split(/[\s\(]/)[0];
                            return baseMachineModel === baseHostModel;
                          })
                        }
                      });
                      
                      // 详细匹配过程调试
                      console.log('🔍 [Machine PDF Debug] Detailed matching process:', {
                        machine_model: machine.model,
                        step_by_step_checks: hostModels.map(h => ({
                          host_id: h.id,
                          host_model: h.model,
                          host_code: (h as any).code,
                          host_title_zh: h.title_zh,
                          host_title_en: h.title_en,
                          host_spec_pdf: (h as any).spec_pdf,
                          host_explosion_pdf: (h as any).explosion_diagram_pdf,
                          checks: {
                            exact_model: h.model === machine.model,
                            exact_code: (h as any).code === machine.model,
                            exact_title_zh: h.title_zh === machine.name_zh,
                            exact_title_en: h.title_en === machine.name_en,
                            clean_model: (() => {
                              const cleanMachineModel = machine.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                              const cleanHostModel = h.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                              return cleanMachineModel === cleanHostModel;
                            })(),
                            clean_code: (() => {
                              const cleanMachineModel = machine.model?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                              const cleanHostCode = (h as any).code?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
                              return cleanMachineModel === cleanHostCode;
                            })(),
                            base_model: (() => {
                              const baseMachineModel = machine.model?.split(/[\s\(]/)[0];
                              const baseHostModel = h.model?.split(/[\s\(]/)[0];
                              return baseMachineModel === baseHostModel;
                            })()
                          },
                          is_match: h === hostModel
                        }))
                      });
                      
                      const pdfUrl = hostModel ? 
                        (hostModel as any).spec_pdf || 
                        (hostModel as any).explosion_diagram_pdf ||
                        (hostModel as any).model_explosion_diagram_pdf : null;
                      
                      if (pdfUrl && !pdfUrl.includes('placeholder')) {
                        // 修复PDF URL转换逻辑
                        let absolutePdfUrl = pdfUrl;
                        
                        // 修复基础URL计算
                        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
                        let serverBaseUrl = '';
                        
                        if (!pdfUrl.startsWith('http')) {
                          
                          if (apiBaseUrl.includes('/wp-json/bjt/v1')) {
                            serverBaseUrl = apiBaseUrl.replace('/wp-json/bjt/v1', '');
                          } else {
                            // 如果API URL格式不对，使用默认值
                            serverBaseUrl = 'http://localhost:8080';
                          }
                          
                          // 修复：当VITE_API_URL是相对路径时的处理
                          if (!serverBaseUrl || serverBaseUrl === '') {
                            // 使用当前窗口的origin作为基础URL
                            serverBaseUrl = window.location.origin;
                          }
                          
                          // 清理路径：移除多余的前缀
                          let cleanPath = pdfUrl;
                          if (cleanPath.startsWith('/frontend/public')) {
                            cleanPath = cleanPath.replace('/frontend/public', '');
                          }
                          if (!cleanPath.startsWith('/')) {
                            cleanPath = '/' + cleanPath;
                          }
                          
                          absolutePdfUrl = serverBaseUrl + cleanPath;
                        }
                        
                        console.log('✅ [Machine PDF Debug] Opening PDF:', {
                          original_pdf_url: pdfUrl,
                          cleaned_pdf_url: absolutePdfUrl,
                          api_base_url: import.meta.env.VITE_API_URL,
                          calculated_server_base: serverBaseUrl,
                          env_check: {
                            VITE_API_URL: import.meta.env.VITE_API_URL,
                            DEV: import.meta.env.DEV,
                            MODE: import.meta.env.MODE
                          }
                        });
                        
                        window.open(absolutePdfUrl, '_blank');
                      } else {
                        info(t('noSpecPdf') || '暂无规格说明文档');
                        console.warn('🔍 [Machine PDF Debug] No valid PDF found for machine:', {
                          machine_part_number: machine.part_number,
                          machine_model: machine.model,
                          host_model_found: !!hostModel,
                          pdf_url: pdfUrl
                        });
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
                            <span className="text-gray-600 font-medium text-xs">
                              包装尺寸 {unitSystem === 'metric' ? 'cm' : 'inch'}:
                            </span>
                            <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' ? (machine.package_size_cm || t('pending')) : (machine.package_size_inch || t('pending'))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">
                              单件净重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:
                            </span>
                            <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.net_weight_kg !== null && machine.net_weight_kg !== undefined ? `${machine.net_weight_kg} kg` : t('pending'))
                                : (machine.net_weight_lbs !== null && machine.net_weight_lbs !== undefined ? `${machine.net_weight_lbs} lbs` : t('pending'))
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">
                              打托高度 {unitSystem === 'metric' ? 'cm' : 'inch'}:
                            </span>
                            <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                              {unitSystem === 'metric' 
                                ? (machine.pallet_height_cm !== null && machine.pallet_height_cm !== undefined ? `${machine.pallet_height_cm} cm` : t('pending'))
                                : (machine.pallet_height_inch !== null && machine.pallet_height_inch !== undefined ? `${machine.pallet_height_inch} inch` : t('pending'))
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 font-medium text-xs">
                              整托毛重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:
                            </span>
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

  // 渲染配件部分 - 支持完整的多语言和详细信息展示
  const renderAccessory = (accessory: MachineAccessory, level: number, index: number) => {
    const accessoryPart = accessory.parts?.[0];
    const partSpecs = accessoryPart?.specs;
    const partPrices = accessoryPart?.prices;
    const partInventory = accessoryPart?.inventory;

    // 添加调试信息
    console.log('🔍 [renderAccessory] Accessory data:', {
      accessory,
      accessoryPart,
      partSpecs,
      level,
      index
    });

    // 尝试从多个位置获取数据的工具函数
    const getFieldValue = (field: string) => {
      // 首先尝试从 partSpecs 获取
      if (partSpecs && partSpecs.hasOwnProperty(field)) {
        const value = partSpecs[field];
        console.log(`✅ [getFieldValue] Found ${field} in partSpecs:`, value);
        if (value === null || value === undefined || value === '') {
          return 'N/A';
        }
        return value;
      }
      // 然后尝试从 accessoryPart 获取
      if (accessoryPart && (accessoryPart as any).hasOwnProperty(field)) {
        const value = (accessoryPart as any)[field];
        console.log(`✅ [getFieldValue] Found ${field} in accessoryPart:`, value);
        if (value === null || value === undefined || value === '') {
          return 'N/A';
        }
        return value;
      }
      // 最后尝试从 accessory 根级别获取
      if ((accessory as any).hasOwnProperty(field)) {
        const value = (accessory as any)[field];
        console.log(`✅ [getFieldValue] Found ${field} in accessory root:`, value);
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

    // 获取级别对应的颜色
    const getLevelColor = (level: number) => {
      const colors = {
        1: 'blue',
        2: 'green',
        3: 'yellow',
        4: 'orange',
        5: 'red'
      };
      return colors[level as keyof typeof colors] || 'blue';
    };

    const levelColor = getLevelColor(level);

    return (
      <div key={`accessory-level-${level}-${accessory.id}-${accessoryPart?.part_number || 'no-part'}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 mb-4 overflow-hidden">
        <div className="flex flex-col md:flex-row p-6">
          {/* Column 1: Image & Selection */}
          <div className="w-full md:w-1/5 flex flex-col items-center md:items-start mb-6 md:mb-0 md:pr-6">
            <div className="relative mb-4">
              <img 
                src={accessory.image_url || DEFAULT_IMAGE} 
                alt={accessory.title}
                className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== DEFAULT_IMAGE) {
                    target.src = DEFAULT_IMAGE;
                  }
                }}
              />
            </div>
            <label className={`inline-flex items-center cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-${levelColor}-500 hover:text-white transition-colors duration-200`}>
              <input 
                type="radio" 
                name={`accessory-level-${level}`}
                className={`form-radio text-${levelColor}-500 mr-2`}
                checked={selectedAccessories[`level${level}`] === accessory.id.toString()}
                onChange={() => handleAccessorySelection(level, accessory.id.toString(), accessory.title)}
              />
              <span className="text-sm font-medium">
                {accessory.children && accessory.children.length > 0 
                  ? `选择并展开 (${accessory.children.length})` 
                  : (t('actions.selectAccessory') || '选择配件')
                }
              </span>
            </label>
          </div>

          {/* Column 2: Info & Specs */}
          <div className="w-full md:w-3/5 md:px-6">
            <div className="mb-4">
              <span className={`inline-block bg-${levelColor}-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm`}>
                {accessory.part_number || accessoryPart?.part_number || accessory.model || accessory.id}
              </span>
              {/* ✅ 添加子级指示器 */}
              {accessory.children && accessory.children.length > 0 && (
                <span className="ml-2 inline-block bg-orange-100 text-orange-700 px-2 py-1 text-xs font-medium rounded-lg border border-orange-200">
                  🔗 {accessory.children.length} 个子配件
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{accessory.title}</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.model') || '型号'}:</strong>
                  <span className="text-gray-800 font-medium">{accessory.model || getFieldValue('model')}</span>
                </div>
                {/* 只有当电气配件时才显示电压 */}
                {isElectricalAccessory() && getFieldValue('voltage') !== 'N/A' && (
                  <div className="flex items-center">
                    <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.voltage') || '电压(V)'}:</strong>
                    <span className="text-gray-800 font-medium">{getFieldValue('voltage')}</span>
                  </div>
                )}
                {/* 频率字段强调显示，只有当电气配件时才显示 */}
                {isElectricalAccessory() && getFieldValue('frequency') !== 'N/A' && (
                  <div className="flex items-center frequency-highlight px-3 py-2 rounded-lg border-l-4 border-yellow-400 col-span-2">
                    <strong className="w-24 text-gray-700 font-bold text-yellow-800">⚡ {t('tableHeaders.frequency') || '频率(Hz)'}:</strong>
                    <span className="text-yellow-900 font-bold text-lg ml-2">{getFieldValue('frequency')}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <strong className="w-24 text-gray-600 font-medium">{t('specs.packageSize') || '包装尺寸'}:</strong>
                  <span className="text-gray-800 font-medium">
                    {unitSystem === 'metric' 
                      ? getFieldValue('package_size_cm')
                      : getFieldValue('package_size_inch')
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <strong className="w-24 text-gray-600 font-medium">{t('specs.pcsPerBox') || '单箱数量'}:</strong>
                  <span className="text-gray-800 font-medium">{getFieldValue('pcs_per_box')}</span>
                </div>
                <div className="flex items-center">
                  <strong className="w-24 text-gray-600 font-medium">{t('specs.palletSize') || '托盘尺寸'}:</strong>
                  <span className="text-gray-800 font-medium">
                    {unitSystem === 'metric' 
                      ? getFieldValue('pallet_size_cm')
                      : getFieldValue('pallet_size_inch')
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <strong className="w-24 text-gray-600 font-medium">{t('specs.pcsPerPallet') || '一托数量'}:</strong>
                  <span className="text-gray-800 font-medium">{getFieldValue('pcs_per_pallet')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {/* 规格说明按钮 - 放在前面，和主机一样 */}
              <Button 
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  // 尝试从多个字段获取PDF链接，扩展查找范围
                  const pdfUrl = getFieldValue('spec_pdf') || 
                               // 尝试直接从accessory对象获取（如果API返回了这些字段）
                               (accessory as any).spec_pdf ||
                               getFieldValue('explosion_diagram_pdf') ||
                               (accessory as any).explosion_diagram_pdf ||
                               getFieldValue('model_explosion_diagram_pdf') || 
                               getFieldValue('pdf_url') ||
                               getFieldValue('spec_document');
                  
                  console.log('🔍 [PDF Debug] Trying to open PDF:', {
                    accessory_id: accessory.id,
                    part_number: accessory.part_number,
                    found_pdf_url: pdfUrl,
                    getFieldValue_spec_pdf: getFieldValue('spec_pdf'),
                    accessory_any_spec_pdf: (accessory as any).spec_pdf,
                    getFieldValue_explosion_pdf: getFieldValue('explosion_diagram_pdf'),
                    accessory_any_explosion_pdf: (accessory as any).explosion_diagram_pdf,
                    accessory_image_url: accessory.image_url
                  });
                  
                  if (pdfUrl && !pdfUrl.includes('placeholder')) {
                    window.open(pdfUrl, '_blank');
                  } else {
                    info(t('noSpecPdf') || '暂无规格说明文档');
                    console.warn('🔍 [PDF Debug] No valid PDF found for accessory:', accessory.part_number);
                  }
                }}
                className="bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white border-gray-300 transition-colors duration-200"
              >
                {t('specDetails') || '规格说明'}
              </Button>
              
              <Tooltip
                title={
                  <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                      <InfoCircleOutlined className="text-blue-500 mr-2" />
                      <span className="font-bold text-gray-800 text-sm">{t('tooltip.accessoryDetailInfo') || '配件详细信息'}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">📦 包装尺寸 {unitSystem === 'metric' ? 'cm' : 'inch'}:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' ? getFieldValue('package_size_cm') : getFieldValue('package_size_inch')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">⚖️ 单件净重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('net_weight_kg') !== 'N/A' ? `${getFieldValue('net_weight_kg')} kg` : 'N/A')
                            : (getFieldValue('net_weight_lbs') !== 'N/A' ? `${getFieldValue('net_weight_lbs')} lbs` : 'N/A')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">📊 单件毛重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-orange-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('gross_weight_kg') !== 'N/A' ? `${getFieldValue('gross_weight_kg')} kg` : 'N/A')
                            : (getFieldValue('gross_weight_lbs') !== 'N/A' ? `${getFieldValue('gross_weight_lbs')} lbs` : 'N/A')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">📏 打托高度 {unitSystem === 'metric' ? 'cm' : 'inch'}:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('pallet_height_cm') !== 'N/A' ? `${getFieldValue('pallet_height_cm')} cm` : 'N/A')
                            : (getFieldValue('pallet_height_inch') !== 'N/A' ? `${getFieldValue('pallet_height_inch')} inch` : 'N/A')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium text-xs">🏗️ 整托毛重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:</span>
                        <span className="text-gray-800 font-semibold text-xs bg-purple-50 px-2 py-1 rounded">
                          {unitSystem === 'metric' 
                            ? (getFieldValue('pallet_gross_weight_kg') !== 'N/A' ? `${getFieldValue('pallet_gross_weight_kg')} kg` : 'N/A')
                            : (getFieldValue('pallet_gross_weight_lbs') !== 'N/A' ? `${getFieldValue('pallet_gross_weight_lbs')} lbs` : 'N/A')
                          }
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                      <span className="text-xs text-gray-500">💡 {t('tooltip.hoverInfo') || '悬停查看详细规格信息'}</span>
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
                  className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-300 transition-colors duration-200"
                >
                  {t('buttons.moreInfo') || '更多信息'}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Column 3: Price, Stock, Actions */}
          <div className="w-full md:w-1/5 md:pl-6 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0">
            {/* Price */}
            <div className="mb-4">
              <div className="font-medium text-sm text-gray-600 mb-2">
                {t('tableHeaders.price') || '价格'} ({getCurrencySymbol(userRegion)}):
              </div>
              
              <div className="text-2xl font-bold text-green-600 mb-2">
                {getCurrencySymbol(userRegion)}{formatPrice(partPrices?.base || 0)}
                <span className="text-base text-gray-500 font-normal ml-2">
                  {t('pricing.from') || '起价'}
                </span>
              </div>
            </div>
            
            {/* Inventory (Sales View) */}
            {isSales && partInventory && partInventory.length > 0 && (
              <div className="mb-4">
                <div className="font-medium text-sm text-gray-600 mb-2">
                  {t('tableHeaders.stock') || '库存'}:
                </div>
                <div className="flex flex-wrap gap-1">
                  {partInventory.map((inv, invIndex) => {
                    const stockStatus = getStockStatus(inv.amount);
                    // 尝试映射区域名称，如果没有找到就使用原始名称
                    const regionKey = inv.region.toUpperCase();
                    const regionName = REGIONS[regionKey as keyof typeof REGIONS]?.nameCn || inv.region;
                    return (
                      <Tag 
                        key={`accessory-${accessory.id}-level-${level}-index-${index}-inventory-${inv.region}-${invIndex}`}
                        color={stockStatus.color}
                        className="text-xs"
                      >
                        {regionName}: {inv.amount}
                      </Tag>
                    );
                  })}
                </div>
               </div>
             )}
            
            {/* 如果没有真实库存数据但是是销售用户，显示Mock库存 */}
            {isSales && (!partInventory || partInventory.length === 0) && (
              <div className="mb-4">
                <div className="font-medium text-sm text-gray-600 mb-2">
                  {t('tableHeaders.stock') || '库存'}:
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
                    // Mock库存数据
                    const mockStock = Math.floor(Math.random() * 50) + 10; // 10-60之间的随机数
                    const stockStatus = getStockStatus(mockStock);
                    return (
                      <Tag 
                        key={`accessory-${accessory.id}-level-${level}-index-${index}-mock-inventory-${regionKey}`}
                        color={stockStatus.color}
                        className="text-xs"
                      >
                        {REGIONS[regionKey].nameCn}: {mockStock}
                      </Tag>
                    );
                  })}
                </div>
               </div>
             )}
             
            {/* 非销售账号也显示库存状态（但不显示具体数量） */}
            {!isSales && partInventory && partInventory.length > 0 && (
              <div className="mb-4">
                <div className="font-medium text-sm text-gray-600 mb-2">
                  {t('inventory.status') || '库存状态'}:
                </div>
                <div className="text-xs">
                  {(() => {
                    const totalStock = partInventory.reduce((total, inv) => total + inv.amount, 0);
                    const stockStatus = getStockStatus(totalStock);
                    return (
                      <Tag color={stockStatus.color} className="text-xs">
                        {totalStock > 100 ? t('inventory.abundant') || '库存充足' :
                         totalStock > 10 ? t('inventory.adequate') || '库存充裕' :
                         totalStock > 0 ? t('inventory.lowStock') || '库存偏低' :
                         t('inventory.outOfStock') || '暂时缺货'}
                      </Tag>
                    );
                  })()}
                </div>
               </div>
             )}
             
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-2">
                <Button 
                  icon={<MenuOutlined />}
                  onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                  disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                  size="small"
                  className="hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                />
                <InputNumber
                  min={1}
                  value={quantities[accessory.id.toString()] || 1}
                  onChange={(value: number | null) => handleQuantityChange(accessory.id.toString(), value as number)}
                  className="w-16 text-center"
                  size="small"
                />
                <Button 
                  icon={<PlusOutlined />}
                  onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) + 1)}
                  size="small"
                  className="hover:border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                />
              </div>
              
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleAddToCart(accessory, 'accessory')}
                className={`w-full bg-${levelColor}-500 hover:bg-${levelColor}-600 border-${levelColor}-500 hover:border-${levelColor}-600 text-white font-medium py-2 h-10 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}
                size="large"
              >
                {t('addToCart') || '加入购物车'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <label className="mb-1 text-sm font-medium text-label">
              {t('machines.filters.voltage')}
            </label>
            <Select
              value={selectedVoltage}
              onChange={handleVoltageChange}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={[
                { value: 'ALL', label: t('filters.allVoltages') || '全部电压' },
                { value: '110V', label: '110V' },
                { value: '220V', label: '220V' }
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
                  const shouldShow = selectedVoltage === 'ALL' || !selectedVoltage || !accVoltage || accVoltage === selectedVoltage;
                  
                  console.log(`🔍 [Filter Debug] Accessory ${accessory.part_number}:`, {
                    accessoryVoltage: accVoltage,
                    selectedVoltage: selectedVoltage,
                    shouldShow: shouldShow,
                    title: accessory.title
                  });
                  
                  return shouldShow;
                })
                .map((accessory, index) => renderAccessory(accessory, 1, index))}
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
      
      {/* Level 2 Accessories */}
      <div id="accessory-level-2" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              {t('accessories.title')} 
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded">{t('accessories.level2')}</span>
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
            {t('actions.close')}
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(2)}
          
          {level2Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text={t('loading.accessories') || '加载配件中...'} 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level2Accessories
                .filter(accessory => {
                  const accVoltage = accessory.voltage || (accessory.parts && accessory.parts[0] && accessory.parts[0].specs && accessory.parts[0].specs.voltage);
                  return selectedVoltage === 'ALL' || !selectedVoltage || !accVoltage || accVoltage === selectedVoltage;
                })
                .map((accessory, index) => renderAccessory(accessory, 2, index))}
              {level2Accessories.length === 0 && (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-gray-200">
                  <div className="text-gray-500 mb-2 text-lg">{t('noAccessories')}</div>
                  <div className="text-gray-500 text-sm">{t('chooseOther')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level 3 Accessories */}
      <div id="accessory-level-3" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              {t('accessories.title')} 
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500 text-white rounded">{t('accessories.level3')}</span>
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
            {t('actions.close')}
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(3)}
          
          {level3Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text={t('loading.accessories') || '加载配件中...'} 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level3Accessories
                .filter(accessory => {
                  const accVoltage = accessory.voltage || (accessory.parts && accessory.parts[0] && accessory.parts[0].specs && accessory.parts[0].specs.voltage);
                  return selectedVoltage === 'ALL' || !selectedVoltage || !accVoltage || accVoltage === selectedVoltage;
                })
                .map((accessory, index) => renderAccessory(accessory, 3, index))}
              {level3Accessories.length === 0 && (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-gray-200">
                  <div className="text-gray-500 mb-2 text-lg">{t('noAccessories')}</div>
                  <div className="text-gray-500 text-sm">{t('chooseOther')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level 4 Accessories */}
      <div id="accessory-level-4" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              {t('accessories.title')} 
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500 text-white rounded">{t('accessories.level4')}</span>
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
            {t('actions.close')}
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(4)}
          
          {level4Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text={t('loading.accessories') || '加载配件中...'} 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level4Accessories
                .filter(accessory => {
                  const accVoltage = accessory.voltage || (accessory.parts && accessory.parts[0] && accessory.parts[0].specs && accessory.parts[0].specs.voltage);
                  return selectedVoltage === 'ALL' || !selectedVoltage || !accVoltage || accVoltage === selectedVoltage;
                })
                .map((accessory, index) => renderAccessory(accessory, 4, index))}
              {level4Accessories.length === 0 && (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-gray-200">
                  <div className="text-gray-500 mb-2 text-lg">{t('noAccessories')}</div>
                  <div className="text-gray-500 text-sm">{t('chooseOther')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level 5 Accessories */}
      <div id="accessory-level-5" className="accessory-level mt-6" style={{display: 'none'}}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              {t('accessories.title')} 
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded">{t('accessories.level5')}</span>
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
            {t('actions.close')}
          </Button>
        </div>
        
        <div className="accessory-content">
          {renderAccessoryPath(5)}
          
          {level5Loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
              <LoadingState 
                size="medium" 
                text={t('loading.accessories') || '加载配件中...'} 
                type="spinner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {level5Accessories
                .filter(accessory => {
                  const accVoltage = accessory.voltage || (accessory.parts && accessory.parts[0] && accessory.parts[0].specs && accessory.parts[0].specs.voltage);
                  return selectedVoltage === 'ALL' || !selectedVoltage || !accVoltage || accVoltage === selectedVoltage;
                })
                .map((accessory, index) => renderAccessory(accessory, 5, index))}
              {level5Accessories.length === 0 && (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-gray-200">
                  <div className="text-gray-500 mb-2 text-lg">{t('noAccessories')}</div>
                  <div className="text-gray-500 text-sm">{t('chooseOther')}</div>
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