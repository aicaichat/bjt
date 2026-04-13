import React, { useEffect, useState, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import ThumbnailGallery from '../../components/ThumbnailGallery';
import '../../styles/thumbnail-gallery.css';
import '../../styles/machine-compare-alignment.css';
import {
  ShoppingCartOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  DeleteOutlined,
  FileImageOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import MockServiceStatus from '../../components/MockServiceStatus';

// 🔥 新增：导航历史记录Hook
import { useNavigationHistory } from '../../hooks/useNavigationHistory';

// 导入现代化UI组件
import { 
  LoadingState, 
  ConfirmDialog, 
  CartAnimation, 
  useToastNotifications 
} from '../../components/ui';

// 🎯 导入智能购物车组件
import { SmartAddToCartButton } from '../../components/Cart/SmartAddToCartButton';

// 导入类型定义
import { MachineProduct, MachineListData, MachineAccessory, MachinePart, MachinePartListData } from '../../types/machines';
import { PriceTier, InventoryData } from '../../types/common';

// 本地类型定义
interface AccessoryWithChildren extends MachineAccessory {
  children?: AccessoryWithChildren[];
  relation_id: string | number;
}

interface FlattenedAccessory extends MachineAccessory {
  level: number;
  relation_id: string | number;
  hierarchyPath: string;
  uniqueKey: string;
  children: []; // 展开后清空children
}

// Figma 像素级精确覆盖层（保持现有类名，覆盖为 Figma 精确值）
import '../../styles/figma-exact/machines-exact-override.css';
import { MachineCompareFigmaTable } from './components/MachineCompareFigmaTable';
import { MsFigmaPagination } from './components/MsFigmaPagination';

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

// 统一产品名称工具
import { getSimpleProductName } from '../../utils/simpleProductName';
import { findHostModelForMachinePart, openMachineSpecificationPdf, type HostModelRow } from './hostModelPdf';

/** 顶部对比图：Figma 导出 1x/2x PNG 放在 public/static，文件名与此一致；未配置时由本地静态图兜底 */
/** 默认对比示意图：Figma 参数对比表（无热点；可被 machine-model-compare API 覆盖） */
const DEFAULT_COMPARE_DIAGRAM = '/static/machine-model-compare-table.png';

/** 外链 diagram 加载失败时的 UTF-8 占位（避免 base64 中文乱码） */
const COMPARE_DIAGRAM_ERROR_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300" viewBox="0 0 900 300"><rect width="900" height="300" fill="#f3f4f6"/><text x="450" y="155" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#64748b">无法加载对比示意图，请检查后台图片地址或网络后刷新</text></svg>`
  );

function normalizeMachineGalleryUrls(
  machine: Record<string, unknown>,
  abs: (u: string | null) => string | null
): string[] {
  const raw = machine.gallery_image_urls;
  if (Array.isArray(raw) && raw.length > 0) {
    const out: string[] = [];
    for (const u of raw) {
      if (typeof u !== 'string') continue;
      const a = abs(u);
      if (a && !out.includes(a)) out.push(a);
    }
    if (out.length > 0) return out;
  }
  const out: string[] = [];
  const push = (u: unknown) => {
    if (u == null || typeof u !== 'string') return;
    const a = abs(u);
    if (a && !out.includes(a)) out.push(a);
  };
  push(machine.image_url);
  push(machine.image1_url);
  push(machine.host_image1_url);
  push(machine.host_image2_url);
  push(machine.model_image1_url);
  push(machine.model_image2_url);
  return out;
}

const ProductLine1Page: React.FC = () => {
  const { t, i18n } = useTranslation(['machines', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 🔥 新增：导航历史记录Hook - 自动记录用户访问此页面
  useNavigationHistory();
  
  // 固定为产品线1（气垫机）- 不再从URL参数获取
  const category = '1';
  
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
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [selectedVoltage, setSelectedVoltage] = useState<string>('ALL');
  const [compareDiagramSrc, setCompareDiagramSrc] = useState<string>(DEFAULT_COMPARE_DIAGRAM);

  // 主机型号相关状态
  const [hostModels, setHostModels] = useState<Array<{ id: number; model: string; title_zh: string; title_en: string; type?: string }>>([]);
  const [hostModelsLoading, setHostModelsLoading] = useState(false);
  
  // 用户交互相关状态
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // 删除: const [showNotification, setShowNotification] = useState<boolean>(false);
  // 删除: const [notificationProduct, setNotificationProduct] = useState<string>('');
  // 删除: const [notificationQuantity, setNotificationQuantity] = useState<number>(1);
  // 删除: const [cartCount, setCartCount] = useState<number>(0);
  
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
  
  // ✅ 新增：强制重新渲染的状态
  const [forceRender, setForceRender] = useState<number>(0);

  const [introductionModalOpen, setIntroductionModalOpen] = useState(false);
  const [introductionModalText, setIntroductionModalText] = useState('');
  const introductionDialogRef = useRef<HTMLDialogElement | null>(null);
  /** 列表卡「更多信息」弹出层（每机一行，一次只开一个） */
  const [moreInfoOpenId, setMoreInfoOpenId] = useState<string | null>(null);
  /** 配件卡「更多信息」 */
  const [accessoryMoreInfoKey, setAccessoryMoreInfoKey] = useState<string | null>(null);
  /** 机型对比折叠（替代 Ant Collapse） */
  const [compareSectionOpen, setCompareSectionOpen] = useState(true);

  useEffect(() => {
    const d = introductionDialogRef.current;
    if (!d) return;
    if (introductionModalOpen) {
      if (!d.open) d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [introductionModalOpen]);

  useEffect(() => {
    if (moreInfoOpenId == null && accessoryMoreInfoKey == null) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (moreInfoOpenId != null) {
        const m = t.closest('[data-ms-moreinfo-root]');
        if (m?.getAttribute('data-ms-moreinfo-root') === moreInfoOpenId) return;
        setMoreInfoOpenId(null);
      }
      if (accessoryMoreInfoKey != null) {
        const a = t.closest('[data-ms-accessory-moreinfo]');
        if (a?.getAttribute('data-ms-accessory-moreinfo') === accessoryMoreInfoKey) return;
        setAccessoryMoreInfoKey(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreInfoOpenId(null);
        setAccessoryMoreInfoKey(null);
      }
    };
    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreInfoOpenId, accessoryMoreInfoKey]);
  
  // ✅ 修复：将currentLanguage改为真正的状态
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>(
    i18n.language.startsWith('zh') ? 'zh' : 'en'
  );
  
  // ✅ 新增：监听i18n语言变化并更新状态
  useEffect(() => {
    const newLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
    if (newLanguage !== currentLanguage) {
      console.log('🌐 [Language State Update] i18n language changed:', {
        'old_currentLanguage': currentLanguage,
        'new_i18n.language': i18n.language,
        'new_currentLanguage': newLanguage
      });
      setCurrentLanguage(newLanguage);
    }
  }, [i18n.language, currentLanguage]);
  
  // 判断用户角色和权限
  const isSales = user && (user.role === 'admin' || user.role === 'sales');
  const canAddToCart = true;
  const userRegion = user?.region || filterRegion || DEFAULT_REGION;
  
  // ✅ 调试：监控语言变化
  console.log('🌐 [Language Debug] Current language state:', {
    'i18n.language': i18n.language,
    'currentLanguage': currentLanguage,
    'forceRender': forceRender
  });

  // 现代化通知功能
  const toastNotifications = useToastNotifications();
  const showSuccessToast = toastNotifications.success;
  const showInfoToast = toastNotifications.info;

  // 1. 添加cartAnimation状态
  const [cartAnimation, setCartAnimation] = useState({
    isActive: false,
    startElement: null,
    targetElement: null,
    productImage: '',
    productName: ''
  });


  /**
   * 获取主机名称（多语言）——统一由 getSimpleProductName 处理
   */
  const getMachineName = (machine: MachinePart): string => {
    return safeTextContent(
      getSimpleProductName(machine, currentLanguage.startsWith('zh') ? 'zh' : 'en')
    );
  };

  /**
   * 获取配件名称（多语言）——统一由 getSimpleProductName 处理
   */
  const getAccessoryName = (accessory: MachineAccessory): string => {
    return safeTextContent(
      getSimpleProductName(accessory, currentLanguage.startsWith('zh') ? 'zh' : 'en')
    );
  };

  // ✅ 新增：获取配件名称，支持多语言切换
  const getAccessoryNameDebug = (accessory: MachineAccessory, context: string = ''): string => {
    console.log(`🔍 [getAccessoryNameDebug][${context}] Called with:`, {
      accessoryId: accessory.id,
      'i18n.language': i18n.language,
      currentLanguage,
      forceRender,
      title_zh: accessory.title_zh,
      title_en: accessory.title_en,
      name_zh: accessory.name_zh,
      name_en: accessory.name_en,
      timestamp: new Date().toISOString()
    });
    
    // ✅ 修复：根据当前语言选择对应的数据库字段
    let name: string;
    
    if (currentLanguage === 'zh') {
      // 中文模式：使用中文字段
      name = accessory.title_zh || accessory.name_zh || '';
    } else {
      // 英文模式：使用英文字段
      name = accessory.title_en || accessory.name_en || '';
    }
    
    // ✅ 修复：移除回退机制，避免语言混乱
    // 如果当前语言的字段为空，显示提示信息而不是回退到另一种语言
    if (!name) {
      const fallbackMessage = currentLanguage === 'zh' ? '名称待翻译' : 'Name translation pending';
      console.log('🔍 [getAccessoryNameDebug] No name found for current language, using fallback message:', fallbackMessage);
      return safeTextContent(fallbackMessage);
    }
    
    console.log('🔍 [getAccessoryNameDebug] Selected name:', {
      name,
      language: currentLanguage,
      usedFallback: false
    });
    
    return safeTextContent(name);
  };

  // 获取主机型号数据的函数
  const fetchHostModels = async () => {
    if (!category) return;
    
    setHostModelsLoading(true);
    
    // ✅ 强制清理主机型号状态，防止显示缓存的旧数据
    setHostModels([]);
    
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
          console.log('⚠️ [fetchHostModels] API returned empty data or no published models found');
        }
      } else {
        console.log('⚠️ [fetchHostModels] API request failed:', response.status, response.statusText);
      }

      // API失败或无数据时，显示空列表而非Mock数据
      // 这确保只显示真实的、已发布状态的主机型号
      if (!hostModels || hostModels.length === 0) {
        console.log('📋 [fetchHostModels] No published host models available, showing empty list');
        setHostModels([]);
      }
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

    console.log('🚀 [fetchMachines] Starting API call with params:', {
      category,
      currentLanguage,
      filterRegion,
      selectedVoltage,
      filterType,
      currentPage,
      pageSize
    });
    
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
          const qp = new URLSearchParams({
            page: String(currentPage),
            per_page: String(pageSize),
            product_line_id: String(category),
            lang: currentLanguage,
            status: 'publish',
          });
          if (filterType !== 'all') {
            qp.set('model', filterType);
          }
          if (selectedVoltage && selectedVoltage !== 'ALL') {
            qp.set('voltage', selectedVoltage);
          }
          const apiUrl = `${baseUrl}/machineparts?${qp.toString()}`;
          
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

                const mapped = {
                  ...machine,
                  image_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.image_url),
                  model_image1_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.model_image1_url),
                  model_image2_url: getAbsoluteImageUrl(machine.image2_url) || getAbsoluteImageUrl(machine.model_image2_url),
                  // 修复PDF字段映射 - 确保spec_pdf字段被正确保存
                  spec_pdf: getAbsoluteImageUrl(machine.spec_pdf),
                  explosion_diagram_pdf: getAbsoluteImageUrl(machine.explosion_diagram_pdf),
                  model_explosion_diagram_pdf: getAbsoluteImageUrl(machine.spec_pdf) || getAbsoluteImageUrl(machine.explosion_diagram_pdf) || getAbsoluteImageUrl(machine.model_explosion_diagram_pdf)
                };
                return {
                  ...mapped,
                  gallery_image_urls: normalizeMachineGalleryUrls({ ...machine, ...mapped }, getAbsoluteImageUrl),
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
              setTotalPages(Math.max(1, Math.ceil(transformedMachines.length / pageSize)));
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

            const mapped = {
              ...machine,
              image_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.image_url),
              model_image1_url: getAbsoluteImageUrl(machine.image1_url) || getAbsoluteImageUrl(machine.model_image1_url),
              model_image2_url: getAbsoluteImageUrl(machine.image2_url) || getAbsoluteImageUrl(machine.model_image2_url),
              // 修复PDF字段映射 - 确保spec_pdf字段被正确保存
              spec_pdf: getAbsoluteImageUrl(machine.spec_pdf),
              explosion_diagram_pdf: getAbsoluteImageUrl(machine.explosion_diagram_pdf),
              model_explosion_diagram_pdf: getAbsoluteImageUrl(machine.spec_pdf) || getAbsoluteImageUrl(machine.explosion_diagram_pdf) || getAbsoluteImageUrl(machine.model_explosion_diagram_pdf)
            };
            return {
              ...mapped,
              gallery_image_urls: normalizeMachineGalleryUrls({ ...machine, ...mapped }, getAbsoluteImageUrl),
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
    let cancelled = false;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
    const siteOrigin = apiBase.replace(/\/wp-json\/bjt\/v1\/?$/, '');

    (async () => {
      try {
        const res = await fetch(
          `${apiBase}/machine-model-compare?product_line_id=${encodeURIComponent(category)}`
        );
        const json = await res.json();
        if (cancelled) return;
        const raw =
          json?.success && json?.data?.diagram_url ? String(json.data.diagram_url).trim() : '';
        if (!raw) {
          setCompareDiagramSrc(DEFAULT_COMPARE_DIAGRAM);
          return;
        }
        const absolute =
          raw.startsWith('http://') || raw.startsWith('https://')
            ? raw
            : raw.startsWith('/')
              ? `${siteOrigin}${raw}`
              : raw;
        setCompareDiagramSrc(absolute);
      } catch {
        if (!cancelled) setCompareDiagramSrc(DEFAULT_COMPARE_DIAGRAM);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    fetchHostModels();
  }, [category, currentLanguage]);

  useEffect(() => {
    fetchMachines();
  }, [
    category,
    currentLanguage,
    filterRegion,
    selectedVoltage,
    currentPage,
    pageSize,
    filterType,
  ]);

  // ✅ 新增：监听语言变化，强制重新渲染配件路径
  useEffect(() => {
    setCurrentPage(1);
    console.log('🔄 [Language Change] Clearing cached accessory names for language switch:', {
      currentLanguage,
      selectedAccessoriesCount: Object.keys(selectedAccessories).length,
      selectedAccessoryNamesCount: Object.keys(selectedAccessoryNames).length
    });
    
    // 当语言切换时，清空缓存的配件名称，但保留选择状态
    // 这样renderAccessoryPath函数会动态重新计算配件名称
    if (Object.keys(selectedAccessoryNames).length > 0) {
      console.log('🔄 [Language Change] Clearing selectedAccessoryNames cache');
      setSelectedAccessoryNames({});
    }
    
    // ✅ 强制重新渲染所有组件
    setForceRender(prev => prev + 1);
    console.log('🔄 [Language Change] Force re-render triggered');
  }, [currentLanguage]); // 只监听语言变化

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
          
          if (jsonData.success && jsonData.data && jsonData.data.accessories) {
            const accessoriesData = jsonData.data.accessories;
            
            // ✅ 新增：过滤掉占位符数据（missing开头的数据）
            const filterMissingData = (items: any[]): any[] => {
              if (!Array.isArray(items)) return [];
              
              return items
                .filter(item => {
                  // 过滤掉ID或part_number以"missing"开头的占位符数据
                  const isMissingData = 
                    (item.id && String(item.id).toLowerCase().startsWith('missing')) ||
                    (item.part_number && String(item.part_number).toLowerCase().startsWith('missing'));
                  
                  if (isMissingData) {
                    console.log('🚫 [filterMissingData] 过滤掉占位符数据:', {
                      id: item.id,
                      part_number: item.part_number,
                      name: item.name
                    });
                    return false;
                  }
                  return true;
                })
                .map(item => ({
                  ...item,
                  // 递归过滤子配件中的占位符数据
                  children: item.children ? filterMissingData(item.children) : []
                }));
            };
            
            // 应用过滤器
            const filteredAccessoriesData = filterMissingData(accessoriesData);
            console.log('✅ [loadAccessories] 已过滤占位符数据，剩余配件数量:', filteredAccessoriesData.length);
            
            // ✅ 新增：专门的层级结构分析函数
            const analyzeAccessoryHierarchy = (items: any[], depth: number = 0) => {
              const indent = '  '.repeat(depth);
              console.log(`${indent}📊 [analyzeAccessoryHierarchy] Analyzing ${items.length} items at depth ${depth}:`);
              
              items.forEach((item: any, index: number) => {
                const isTarget = item.part_number === '14A01246';
                console.log(`${indent}${index + 1}. ${isTarget ? '🎯 ' : ''}${item.part_number} (${item.name}) - Level ${item.level}`, {
                  id: item.id,
                  hasChildren: !!item.children,
                  childrenCount: item.children?.length || 0,
                  allKeys: Object.keys(item)
                });
                
                if (isTarget) {
                  console.log(`${indent}   🎯 [FOUND 14A01246] Full details:`, {
                    fullObject: item,
                    parent_context: `Found at depth ${depth}, index ${index}`,
                    children_analysis: item.children ? {
                      count: item.children.length,
                      children_details: item.children.map((child: any, childIndex: number) => ({
                        childIndex,
                        id: child.id,
                        part_number: child.part_number,
                        name: child.name,
                        level: child.level
                      }))
                    } : 'No children'
                  });
                }
                
                // 递归分析子配件
                if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                  analyzeAccessoryHierarchy(item.children, depth + 1);
                }
              });
            };
            
            console.log('🔍 [loadAccessories] Starting complete hierarchy analysis:');
            analyzeAccessoryHierarchy(filteredAccessoriesData);
            
            // ✅ 新增：查找14A01246在所有层级中的位置
            const findItemInHierarchy = (items: any[], targetPartNumber: string, path: string[] = []): any => {
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const currentPath = [...path, `${item.part_number}(L${item.level})`];
                
                if (item.part_number === targetPartNumber) {
                  console.log(`🎯 [findItemInHierarchy] Found ${targetPartNumber} at path:`, currentPath.join(' > '));
                  return {
                    item,
                    path: currentPath,
                    depth: path.length,
                    parentItem: path.length > 0 ? items : null
                  };
                }
                
                if (item.children && Array.isArray(item.children)) {
                  const found = findItemInHierarchy(item.children, targetPartNumber, currentPath);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const found14A01246 = findItemInHierarchy(filteredAccessoriesData, '14A01246');
            if (found14A01246) {
              console.log('🎯 [loadAccessories] 14A01246 location analysis:', found14A01246);
            } else {
              console.warn('⚠️ [loadAccessories] 14A01246 not found in hierarchy!');
            }
            
            // 新的数据转换逻辑：正确处理嵌套层级结构
            const flattenAccessoriesByLevel = (items: any[], targetLevel: number = 1) => {
              const result: MachineAccessory[] = [];
              
              console.log('🔍 [flattenAccessoriesByLevel] Input items:', items);
              console.log('🔍 [flattenAccessoriesByLevel] Target level:', targetLevel);
              
              // ✅ 新增：针对14A01246的特殊调试
              const targetPart = items.find(item => item.part_number === '14A01246');
              if (targetPart) {
                console.log('🎯 [DEBUG] Found 14A01246 in input data:', {
                  id: targetPart.id,
                  part_number: targetPart.part_number,
                  name: targetPart.name,
                  level: targetPart.level,
                  hasChildren: !!targetPart.children,
                  childrenCount: targetPart.children?.length || 0,
                  childrenData: targetPart.children,
                  allProperties: Object.keys(targetPart)
                });
                
                if (targetPart.children && targetPart.children.length > 0) {
                  console.log('🎯 [DEBUG] 14A01246 children details:', targetPart.children.map((child: any, index: number) => ({
                    index,
                    id: child.id,
                    part_number: child.part_number,
                    name: child.name,
                    level: child.level,
                    hasGrandChildren: !!child.children,
                    grandChildrenCount: child.children?.length || 0
                  })));
                }
              } else {
                console.warn('⚠️ [DEBUG] 14A01246 not found in input data');
                console.log('🔍 [DEBUG] Available part numbers:', items.map(item => item.part_number));
              }
              
              const processItems = (itemsList: any[], parentId?: string) => {
                itemsList.forEach((item: any, index: number) => {
                  // ✅ 特殊标记14A01246的处理
                  const isTarget14A01246 = item.part_number === '14A01246';
                  
                  console.log(`🔍 [processItems] Processing item ${index}${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}:`, {
                    id: item.id,
                    part_number: item.part_number,
                    level: item.level,
                    name: item.name,
                    hasChildren: item.children?.length > 0,
                    childrenCount: item.children?.length || 0,
                    childrenData: item.children // ✅ 显示原始子数据
                  });
                  
                  // ✅ 针对14A01246的详细分析
                  if (isTarget14A01246) {
                    console.log('🎯 [processItems] Detailed analysis for 14A01246:', {
                      targetLevel,
                      itemLevel: item.level,
                      willBeProcessed: item.level === targetLevel,
                      childrenExists: !!item.children,
                      childrenIsArray: Array.isArray(item.children),
                      childrenLength: item.children?.length || 0,
                      childrenRawData: item.children
                    });
                  }
                  
                  // 检查是否为目标层级的配件
                  if (item.level === targetLevel) {
                    console.log(`✅ [processItems] Found target level ${targetLevel} item${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}:`, item.part_number);
                    
                    // ✅ 修复：递归转换子级数据，确保子级数据完整
                    const convertChildren = (childrenData: any[]): MachineAccessory[] => {
                      if (!childrenData || !Array.isArray(childrenData) || childrenData.length === 0) {
                        console.log(`⚠️ [convertChildren] No children data for ${item.part_number}${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}`);
                        return [];
                      }
                      
                      console.log(`🔍 [convertChildren] Converting ${childrenData.length} children for ${item.part_number}${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}:`, childrenData);
                      
                      return childrenData.map((child: any) => {
                        console.log(`🔍 [convertChildren] Converting child${isTarget14A01246 ? ' of 14A01246 🎯' : ''}:`, {
                          id: child.id,
                          part_number: child.part_number,
                          name: child.name,
                          level: child.level,
                          hasGrandChildren: child.children?.length > 0
                        });
                        
                        const convertedChild: MachineAccessory = {
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
                          image_url: child.image_url || DEFAULT_IMAGE,
                          explosion_diagram_pdf: child.explosion_diagram_pdf || '',
                          spec_pdf: child.spec_pdf || '',
                          level: child.level || (targetLevel + 1),
                          parts: [],
                          parent_id: item.id || item.part_number,
                          compatible_machines: [],
                          child_accessories: [],
                          children: convertChildren(child.children), // ✅ 递归转换更深层级的子配件
                          status: child.status || 'publish',
                          unit: child.unit || 'pcs',
                          created_at: child.created_at,
                          updated_at: child.updated_at,
                          is_required: false
                        };
                        
                        console.log(`✅ [convertChildren] Converted child${isTarget14A01246 ? ' of 14A01246 🎯' : ''}:`, {
                          id: convertedChild.id,
                          part_number: convertedChild.part_number,
                          title: convertedChild.title,
                          level: convertedChild.level,
                          childrenCount: convertedChild.children.length
                        });
                        
                        return convertedChild;
                      });
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
                      image_url: item.image_url || DEFAULT_IMAGE,
                      explosion_diagram_pdf: item.explosion_diagram_pdf || '',
                      spec_pdf: item.spec_pdf || '',
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
                    console.log(`✅ [processItems] Successfully converted and added accessory${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}:`, {
                      id: convertedAccessory.id,
                      part_number: convertedAccessory.part_number,
                      title: convertedAccessory.title,
                      level: convertedAccessory.level,
                      childrenCount: convertedAccessory.children.length, // ✅ 显示子级数量
                      childrenDetails: convertedAccessory.children.map(c => ({ // ✅ 显示子级详情
                        part_number: c.part_number,
                        title: c.title,
                        level: c.level
                      }))
                    });
                  } else {
                    console.log(`⏭️ [processItems] Skipping item (level ${item.level} != ${targetLevel})${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}:`, item.part_number);
                  }
                  
                  // ✅ 重要：无论是否是目标层级，都要递归处理子级，确保所有层级的数据都被处理
                  if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                    console.log(`🔍 [processItems] Processing ${item.children.length} children for item ${item.part_number}${isTarget14A01246 ? ' 🎯 (14A01246)' : ''}`);
                    processItems(item.children, item.id || item.part_number);
                  }
                });
              };
              
              processItems(items);
              
              // ✅ 新增：验证14A01246是否在最终结果中
              const found14A01246 = result.find(r => r.part_number === '14A01246');
              if (found14A01246) {
                console.log('🎯 [DEBUG] 14A01246 in final result:', {
                  id: found14A01246.id,
                  part_number: found14A01246.part_number,
                  title: found14A01246.title,
                  level: found14A01246.level,
                  childrenCount: found14A01246.children.length,
                  childrenPartNumbers: found14A01246.children.map(c => c.part_number)
                });
              } else {
                console.warn('⚠️ [DEBUG] 14A01246 NOT FOUND in final result!');
              }
              
              console.log(`🔍 [flattenAccessoriesByLevel] Final result count for level ${targetLevel}:`, result.length);
              console.log(`🔍 [flattenAccessoriesByLevel] Final result items:`, result.map(r => ({ 
                part_number: r.part_number, 
                title: r.title, 
                level: r.level,
                childrenCount: r.children.length, // ✅ 显示每个配件的子级数量
                childrenPartNumbers: r.children.map(c => c.part_number) // ✅ 显示子级料号
              })));
              return result;
            };
            
            // 提取Level 1配件
            const level1Accessories = flattenAccessoriesByLevel(filteredAccessoriesData, 1);
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
                // Smooth scroll to the newly revealed Level-1 accessory section
                accessoryDiv.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
              
              // 更新上一次选择的机器引用
              previousMachineRef.current = selectedMachine;
              setAutoLoadedAccessories(true);
              
              // ✅ 新增：显示配件加载成功提示
              if (level1Accessories.length > 0) {
                const selectedMachineData = machines.find(m => m.id.toString() === selectedMachine);
                const machineName = selectedMachineData ? getMachineName(selectedMachineData) : t('unknownMachine');
                
                success(
                  t('accessories.level1Loaded') || '一级配件已加载',
                  t('accessories.level1LoadedDesc', { 
                    machineName: machineName,
                    count: level1Accessories.length 
                  }) || `已为主机 ${machineName} 加载了 ${level1Accessories.length} 个一级配件选项`
                );
              }
              
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
            showErrorToast(t('errors.accessoryLoadFailed') || '加载配件失败');
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
    setCurrentPage(1);
  };

  // ✅ 新增：单位处理函数
  const getFieldWithUnit = (fieldKey: string, unitType?: 'weight' | 'size' | 'voltage' | 'frequency') => {
    // 按优先级顺序查找翻译
    let baseLabel = t(`tableHeaders.${fieldKey}`) || t(`fields.${fieldKey}`) || fieldKey;
    
    if (unitType) {
      let unitLabel = '';
      switch (unitType) {
        case 'weight':
          unitLabel = unitSystem === 'metric' 
            ? t('units.kg') || 'kg'
            : t('units.lbs') || 'lbs';
          break;
        case 'size':
          unitLabel = unitSystem === 'metric' 
            ? t('units.cm') || 'cm'
            : t('units.inch') || 'inch';
          break;
        case 'voltage':
          unitLabel = t('units.V') || 'V';
          break;
        case 'frequency':
          unitLabel = t('units.Hz') || 'Hz';
          break;
        default:
          unitLabel = '';
      }
      return `${baseLabel}(${unitLabel})`;
    }
    return baseLabel;
  };

  // ✅ 新增：从数据中去除单位的函数
  const removeUnitFromValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toString();
    
    const strValue = value.toString();
    // 去除常见的单位后缀
    return strValue
      .replace(/\s*(cm|inch|in|kg|lbs|g|lb|V|Hz)$/i, '')
      .trim();
  };

  /** 筛选由 machineparts API（model / voltage）与分页完成 */
  const filteredMachines = machines;

  /** 型号选项来自 host-models API，与后端数据源一致 */
  const modelOptions = React.useMemo(() => {
    if (!Array.isArray(hostModels) || hostModels.length === 0) {
      return [{ value: 'all', label: t('filters.allModels') }];
    }
    const uniqueModels = Array.from(new Set(hostModels.map(h => h.model).filter(Boolean))) as string[];
    uniqueModels.sort();
    return [
      { value: 'all', label: t('filters.allModels') },
      ...uniqueModels.map(model => ({ value: model, label: model })),
    ];
  }, [hostModels, t]);

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
              image_url: product.image_url || DEFAULT_IMAGE
            }
          : {
              part_number: (product as MachineAccessory).part_number || (product as MachineAccessory).model || `ACCESSORY-${product.id}`,
              model: (product as MachineAccessory).model || '',
              name_zh: getAccessoryName(product as MachineAccessory),
              name_en: getAccessoryName(product as MachineAccessory),
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
              image_url: product.image_url || DEFAULT_IMAGE
            },
        id: product.id.toString(),
        quantity,
        selected: true,
        type: productType,
        added_at: new Date().toISOString(),
        partNumber: product.part_number || product.model || `${productType.toUpperCase()}-${product.id}`,
        productName: productType === 'machine'
          ? getMachineName(product as MachinePart)
          : getAccessoryName(product as MachineAccessory),
        price: productType === 'machine'
          ? (product as MachinePart).prices?.[0]?.tiers?.[0]?.base_price || 0
          : (product as MachineAccessory).parts?.[0]?.prices?.base || 0,
        code: product.part_number || product.model || `${productType.toUpperCase()}-${product.id}`,
        image: product.image_url || DEFAULT_IMAGE,
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
          : getAccessoryName(product as MachineAccessory),
        image_url: product.image_url || DEFAULT_IMAGE,
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
        : getAccessoryName(product as MachineAccessory);
        
      // 2. 加入购物车飞入动画：起点为当前「加入购物车」按钮，终点为顶栏或悬浮购物车图标
      const dataProductTypeAttr = productType === 'machine' ? 'machines' : 'accessories';
      const startEl = document.querySelector(
        `[data-add-to-cart-anchor="${String(product.id)}"][data-product-type="${dataProductTypeAttr}"]`
      ) as HTMLElement | null;
      const cartIcon =
        (document.querySelector('.anticon-shopping-cart') ||
          document.querySelector('.shopping-cart-icon')) as HTMLElement | null;
      setCartAnimation({
        isActive: true,
        startElement: startEl,
        targetElement: cartIcon,
        productImage: product.image_url || DEFAULT_IMAGE,
        productName: productType === 'machine' ? getMachineName(product as MachinePart) : getAccessoryName(product as MachineAccessory)
      });
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
    
    // ✅ 新增：显示主机选择成功提示
    const selectedMachineData = machines.find(m => m.id.toString() === currentMachineIdStr);
    if (selectedMachineData) {
      const machineName = getMachineName(selectedMachineData);
      success(
        t('messages.machineSelected') || '已选择主机',
        t('messages.machineSelectedDesc', { name: machineName }) || `已选择主机: ${machineName}，正在加载配件选项...`
      );
    }
    
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
      
      console.log(`🔍 [handleAccessorySelection] Level ${level} selection:`, {
        accessoryId,
        accessoryName,
        selectedAccessory: selectedAccessory ? {
          id: selectedAccessory.id,
          part_number: selectedAccessory.part_number,
          title: getAccessoryName(selectedAccessory),
          level: selectedAccessory.level,
          hasChildren: selectedAccessory.children?.length > 0,
          childrenCount: selectedAccessory.children?.length || 0,
          childrenData: selectedAccessory.children
        } : null,
        currentLevelAccessoriesCount: currentLevelAccessories.length
      });
      
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

      // Clear higher level accessory states
      const nextLevel = level + 1;
      if (nextLevel === 2) setLevel2Accessories([]);
      if (nextLevel === 3) setLevel3Accessories([]);
      if (nextLevel === 4) setLevel4Accessories([]);
      if (nextLevel === 5) setLevel5Accessories([]);
      
      // Also clear any subsequent levels
      for (let i = nextLevel + 1; i <= 5; i++) {
        if (i === 2) setLevel2Accessories([]);
        if (i === 3) setLevel3Accessories([]);
        if (i === 4) setLevel4Accessories([]);
        if (i === 5) setLevel5Accessories([]);
      }

      // Update context message
      if (nextLevel <= 5) {
        const contextMessage = document.getElementById(`level${nextLevel}-context-message`);
        if (contextMessage) {
          let contextText = `${accessoryName} ${t('accessories.compatible') || '兼容配件'}`;
          if (level > 1) {
            contextText = `${t('accessories.level') || '第'} ${level} ${t('accessories.levelUnit') || '级'} ${accessoryName} ${t('accessories.subCompatible') || '的子配件'}`;
          }
          contextMessage.textContent = contextText;
        }
      }

      // ✅ 修复：增强子配件数据处理逻辑
      console.log(`🔍 [handleAccessorySelection] Checking children for accessory ${accessoryId}:`, {
        hasChildren: selectedAccessory?.children?.length > 0,
        childrenCount: selectedAccessory?.children?.length || 0,
        childrenType: typeof selectedAccessory?.children,
        childrenIsArray: Array.isArray(selectedAccessory?.children),
        actualChildren: selectedAccessory?.children
      });

      if (selectedAccessory?.children && Array.isArray(selectedAccessory.children) && selectedAccessory.children.length > 0) {
        console.log(`🔍 [handleAccessorySelection] Processing ${selectedAccessory.children.length} children for next level ${nextLevel}:`, selectedAccessory.children);
        
        // ✅ 修复：确保子配件数据完整性
        const nextLevelAccessories = selectedAccessory.children.map((child, index) => {
          console.log(`🔍 [handleAccessorySelection] Mapping child ${index}:`, {
            id: child.id,
            part_number: child.part_number,
            title: child.title || child.name_zh || child.name_en,
            originalLevel: child.level,
            newLevel: nextLevel,
            hasChildren: child.children?.length > 0,
            childrenCount: child.children?.length || 0
          });
          
          // ✅ 修复：确保子配件具有完整的MachineAccessory接口
          const processedChild: MachineAccessory = {
            ...child,
            id: String(child.id || child.part_number || `child-${index}`),
            title: child.title || child.name_zh || child.name_en || '',
            title_zh: child.title_zh || child.name_zh || '',
            title_en: child.title_en || child.name_en || '',
            name_zh: child.name_zh || child.title || '',
            name_en: child.name_en || child.title || '',
            part_number: child.part_number || '',
            model: child.model || '',
            brand: child.brand || '',
            level: nextLevel, // ✅ 确保子配件有正确的层级
            children: child.children || [], // ✅ 保持子配件的children数据
            parts: child.parts || [],
            parent_id: selectedAccessory.id,
            compatible_machines: child.compatible_machines || [],
            child_accessories: child.child_accessories || [],
            image_url: child.image_url || DEFAULT_IMAGE,
            status: child.status || 'publish',
            unit: child.unit || 'pcs',
            is_required: child.is_required || false,
            product_line_id: child.product_line_id || selectedAccessory.product_line_id,
            spec: child.spec || '',
            spec_imperial: child.spec_imperial || '',
            voltage: child.voltage || '',
            frequency: child.frequency || '',
            package_size_cm: child.package_size_cm || '',
            package_size_inch: child.package_size_inch || '',
            net_weight_kg: child.net_weight_kg,
            net_weight_lbs: child.net_weight_lbs,
            gross_weight_kg: child.gross_weight_kg,
            gross_weight_lbs: child.gross_weight_lbs,
            pcs_per_box: child.pcs_per_box,
            pallet_size_cm: child.pallet_size_cm || '',
            pallet_size_inch: child.pallet_size_inch || '',
            pcs_per_pallet: child.pcs_per_pallet,
            pallet_height_cm: child.pallet_height_cm,
            pallet_height_inch: child.pallet_height_inch,
            pallet_gross_weight_kg: child.pallet_gross_weight_kg,
            pallet_gross_weight_lbs: child.pallet_gross_weight_lbs,
            created_at: child.created_at,
            updated_at: child.updated_at
          };
          
          return processedChild;
        });
        
        console.log(`✅ [handleAccessorySelection] Processed next level accessories:`, nextLevelAccessories.map(a => ({
          id: a.id,
          part_number: a.part_number,
          title: a.title,
          level: a.level,
          hasChildren: a.children?.length > 0,
          childrenCount: a.children?.length || 0
        })));
        
        // ✅ 修复：确保状态正确更新
        switch (nextLevel) {
          case 2:
            console.log(`🔄 [handleAccessorySelection] Setting ${nextLevelAccessories.length} level 2 accessories`);
            setLevel2Accessories(nextLevelAccessories);
            break;
          case 3:
            console.log(`🔄 [handleAccessorySelection] Setting ${nextLevelAccessories.length} level 3 accessories`);
            setLevel3Accessories(nextLevelAccessories);
            break;
          case 4:
            console.log(`🔄 [handleAccessorySelection] Setting ${nextLevelAccessories.length} level 4 accessories`);
            setLevel4Accessories(nextLevelAccessories);
            break;
          case 5:
            console.log(`🔄 [handleAccessorySelection] Setting ${nextLevelAccessories.length} level 5 accessories`);
            setLevel5Accessories(nextLevelAccessories);
            break;
        }
        
        // ✅ 修复：确保下一级区域显示
        setTimeout(() => {
          const nextLevelDiv = document.getElementById(`accessory-level-${nextLevel}`);
          if (nextLevelDiv) {
            nextLevelDiv.style.display = 'block';
            console.log(`✅ [handleAccessorySelection] Showed level ${nextLevel} accessory area`);
            
            // 滚动到新显示的区域
            nextLevelDiv.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          } else {
            console.error(`❌ [handleAccessorySelection] Could not find accessory-level-${nextLevel} div`);
          }
        }, 100); // 小延迟确保状态更新完成
        
        // 显示成功加载下一级配件的提示
        success(
          t('accessories.nextLevelLoaded') || '下一级配件已加载',
          t('accessories.nextLevelLoadedDesc', { 
            level: nextLevel, 
            count: nextLevelAccessories.length 
          }) || `已为您加载了 ${nextLevelAccessories.length} 个第${nextLevel}级配件选项`
        );
        
        console.log(`✅ [handleAccessorySelection] Successfully processed level ${nextLevel} with ${nextLevelAccessories.length} accessories`);
      } else {
        console.log(`⚠️ [handleAccessorySelection] No children found for accessory ${accessoryId} (${accessoryName}):`, {
          hasSelectedAccessory: !!selectedAccessory,
          childrenProperty: selectedAccessory?.children,
          isArray: Array.isArray(selectedAccessory?.children),
          length: selectedAccessory?.children?.length
        });
        
        // 当没有下一级配件时的提醒消息
        if (nextLevel <= 5) {
          info(
            t('accessories.noNextLevel') || '配件选择完成',
            t('accessories.noNextLevelDesc', { 
              name: accessoryName,
              level: level 
            }) || `${accessoryName} 没有更多子级配件，您已完成第${level}级的配件选择。`
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
        t('errors.processingFailed') || '处理失败',
        err.message || t('errors.unknownError') || '未知错误'
      );
    }
  };

  /** Product Line 1 — 主机列表（Figma M4–M9；配件树另见 M11，不在此渲染函数内） */
  const renderMachinesTable = () => {
    // 如果选择了主机，只显示选中的主机
    const machinesToShow = selectedMachine 
      ? filteredMachines.filter(machine => machine.id.toString() === selectedMachine)
      : filteredMachines;
    
    return (
      <div className="ms-figma-machine-grid" data-ms-pl1-host="true" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, width: 1537}}>
        {machinesToShow.map(machine => (
          <div
            key={`machine-${machine.id}-${machine.part_number}`}
            className="ms-figma-machine-card ms-figma-machine-card--air"
            style={{
              position: 'relative',
              width: 1537,
              /* Frame 471：行高 280 固定；右栏购物车不撑满此行高，见 machines-exact-override */
              height: 280,
              minHeight: 280,
              maxHeight: 280,
              background: '#ffffff',
              boxShadow: '0px 0.5px 0px rgba(0,0,0,0.25)',
              marginBottom: 0
            }}
          >
            {/* 与 machine-selection-figma 气垫链一致：须挂 --air，图库才命中 .thumbnail-gallery-left.machine-gallery 的 Frame 205 覆盖 */}
            <div className="ms-figma-machine-card__row" style={{display: 'flex', flexDirection: 'row'}}>
            {/* Column 1: 图库 - Frame 205 - 288px */}
            <div className="ms-figma-machine-card__col-gallery" style={{position: 'absolute', left: 0, top: 1, width: 288, height: 212, background: '#fff'}}>
                <div className="relative">
                  <ThumbnailGallery
                    images={(() => {
                      const urls: string[] = [];
                      const add = (u?: string | null) => {
                        if (u == null || typeof u !== 'string' || !u.trim()) return;
                        const s = u.trim();
                        if (!urls.includes(s)) urls.push(s);
                      };
                      machine.gallery_image_urls?.forEach((img) => {
                        if (typeof img === 'string' && img.trim()) add(img);
                      });
                      add(machine.image_url);
                      if (machine.image_url?.includes('picsum.photos')) {
                        add(`https://picsum.photos/400/400?random=${machine.id}01`);
                        add(`https://picsum.photos/400/400?random=${machine.id}02`);
                      }
                      add(machine.model_image1_url);
                      add(machine.model_image2_url);
                      add((machine as { image2_url?: string }).image2_url);
                      if (urls.length === 0) add(DEFAULT_IMAGE);
                      return urls.slice(0, 4);
                    })()}
                    altText={(machine as any).code || (machine as any).part_number || `Machine ${machine.id}`}
                    layout="thumbnails-left"
                    className="machine-gallery"
                  />
                </div>
              </div>

              {/* Column 2: Info & Specs — Figma：标题行 型号 + PN + 配件链接；规格两列栅格 */}
              {/* Figma Frame 527：尺寸与间距见 figma-tokens-machine-selection.css + machines-exact-override.css */}
              <div className="ms-figma-machine-card__col-main">
                <div className="ms-figma-product-title-row">
                  <div className="ms-figma-product-title-group">
                    <h3 className="ms-figma-product-title" style={{fontFamily: 'Roboto', fontWeight: 700, fontSize: 18, lineHeight: 21, color: 'rgba(0,0,0,0.85)', margin: 0}}>{getMachineName(machine)}</h3>
                    <span className="ms-figma-pn-pill" style={{fontFamily: 'Roboto', fontWeight: 400, fontSize: 16, lineHeight: 19, color: 'rgba(0,0,0,0.85)', background: '#d9dfed', borderRadius: 8, padding: '4px 8px'}}>
                      {t('tableHeaders.pnPrefix')}: {machine.part_number}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ms-figma-link-accessories-inline"
                    style={{fontFamily: 'Roboto', fontSize: 16, color: '#2a7dfa', border: 'none', background: 'transparent', cursor: 'pointer'}}
                    onClick={() => {
                      handleMachineSelection(machine.id);
                      window.setTimeout(() => {
                        document.getElementById('accessory-level-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 200);
                    }}
                  >
                    {t('figma.showOptionalAccessories')}
                  </button>
                </div>

                <div className="ms-figma-spec-grid">
                  <div className="ms-figma-spec-grid-inner">
                    <div className="ms-figma-spec-span-full">
                      <span className="ms-figma-spec-k">{t('tableHeaders.itemDescription')}</span>
                      <span className="ms-figma-spec-v">
                        {(currentLanguage === 'zh'
                          ? machine.spec
                          : machine.spec_imperial || machine.spec) ||
                          getMachineName(machine) ||
                          '—'}
                      </span>
                    </div>
                    {/*
                      Figma Frame 830：两列竖栈（与稿面一致；左列顺序同 Dev：包装方式 → 单箱数量 → 托盘尺寸）
                      右：电压 → 单托数量 → 外箱包装尺寸
                    */}
                    <div className="ms-figma-spec-dual-cols">
                      <div className="ms-figma-spec-col">
                        <div className="ms-figma-spec-pair">
                          <span className="ms-figma-spec-k">{t('tableHeaders.packagingMethod')}</span>
                          <span className="ms-figma-spec-v">{machine.unit || '—'}</span>
                        </div>
                        <div className="ms-figma-spec-pair">
                          <span className="ms-figma-spec-k">{t('tableHeaders.pcsPerBox')}</span>
                          <span className="ms-figma-spec-v">
                            {machine.pcs_per_box !== null && machine.pcs_per_box !== undefined
                              ? machine.pcs_per_box
                              : '—'}
                          </span>
                        </div>
                        <div className="ms-figma-spec-pair">
                          <span className="ms-figma-spec-k">{getFieldWithUnit('palletSize', 'size')}</span>
                          <span className="ms-figma-spec-v">
                            {unitSystem === 'metric'
                              ? removeUnitFromValue(machine.pallet_size_cm) || '—'
                              : removeUnitFromValue(machine.pallet_size_inch) || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="ms-figma-spec-col">
                        <div className="ms-figma-spec-pair">
                          <span className="ms-figma-spec-k">{getFieldWithUnit('voltage', 'voltage')}</span>
                          <span className="ms-figma-spec-v">
                            {machine.voltage ? removeUnitFromValue(machine.voltage) : '—'}
                          </span>
                        </div>
                        <div className="ms-figma-spec-pair">
                          <span className="ms-figma-spec-k">{t('tableHeaders.pcsPerPallet')}</span>
                          <span className="ms-figma-spec-v">
                            {machine.pcs_per_pallet !== null && machine.pcs_per_pallet !== undefined
                              ? machine.pcs_per_pallet
                              : '—'}
                          </span>
                        </div>
                        <div className="ms-figma-spec-pair">
                          <span className="ms-figma-spec-k">{getFieldWithUnit('packageSize', 'size')}</span>
                          <span className="ms-figma-spec-v">
                            {unitSystem === 'metric'
                              ? removeUnitFromValue(machine.package_size_cm) || '—'
                              : removeUnitFromValue(machine.package_size_inch) || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ms-figma-machine-spec-actions">
                    <div
                      className="ms-figma-moreinfo relative"
                      data-ms-moreinfo-root={String(machine.id)}
                    >
                      <button
                        type="button"
                        className="ms-figma-moreinfo-trigger"
                        aria-expanded={moreInfoOpenId === String(machine.id)}
                        aria-haspopup="dialog"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() =>
                          setMoreInfoOpenId((id) => (id === String(machine.id) ? null : String(machine.id)))
                        }
                        style={{fontFamily: 'Roboto', fontSize: 16, fontWeight: 400, color: 'rgba(0,0,0,0.85)', background: '#d9dfed', border: '1px solid #c4dcff', borderRadius: 8, padding: '6px 12px'}}
                      >
                        <InfoCircleOutlined className="ms-figma-moreinfo-trigger__icon" aria-hidden />
                        {t('moreInfo')}
                      </button>
                      {moreInfoOpenId === String(machine.id) && (
                        <div
                          className="ms-figma-moreinfo-panel"
                          role="dialog"
                          aria-label={t('moreInfo')}
                        >
                          <div className="ms-figma-moreinfo-panel__head">
                            <InfoCircleOutlined className="ms-figma-moreinfo-panel__head-icon" aria-hidden />
                            <span className="ms-figma-moreinfo-panel__title">{t('moreInfo')}</span>
                          </div>
                          <dl className="ms-figma-moreinfo-panel__rows">
                            <div className="ms-figma-moreinfo-panel__row">
                              <dt>{getFieldWithUnit('packageSize', 'size')}</dt>
                              <dd>
                                {unitSystem === 'metric'
                                  ? removeUnitFromValue(machine.package_size_cm)
                                  : removeUnitFromValue(machine.package_size_inch)}
                              </dd>
                            </div>
                            <div className="ms-figma-moreinfo-panel__row">
                              <dt>{getFieldWithUnit('netWeight', 'weight')}</dt>
                              <dd>
                                {unitSystem === 'metric'
                                  ? machine.net_weight_kg !== null && machine.net_weight_kg !== undefined
                                    ? machine.net_weight_kg
                                    : t('pending')
                                  : machine.net_weight_lbs !== null && machine.net_weight_lbs !== undefined
                                    ? machine.net_weight_lbs
                                    : t('pending')}
                              </dd>
                            </div>
                            <div className="ms-figma-moreinfo-panel__row">
                              <dt>{getFieldWithUnit('palletHeight', 'size')}</dt>
                              <dd>
                                {unitSystem === 'metric'
                                  ? machine.pallet_height_cm !== null && machine.pallet_height_cm !== undefined
                                    ? machine.pallet_height_cm
                                    : t('pending')
                                  : machine.pallet_height_inch !== null && machine.pallet_height_inch !== undefined
                                    ? machine.pallet_height_inch
                                    : t('pending')}
                              </dd>
                            </div>
                            <div className="ms-figma-moreinfo-panel__row">
                              <dt>{getFieldWithUnit('palletGrossWeight', 'weight')}</dt>
                              <dd>
                                {unitSystem === 'metric'
                                  ? machine.pallet_gross_weight_kg !== null &&
                                    machine.pallet_gross_weight_kg !== undefined
                                    ? machine.pallet_gross_weight_kg
                                    : t('pending')
                                  : machine.pallet_gross_weight_lbs !== null &&
                                      machine.pallet_gross_weight_lbs !== undefined
                                    ? machine.pallet_gross_weight_lbs
                                    : t('pending')}
                              </dd>
                            </div>
                          </dl>
                          <p className="ms-figma-moreinfo-panel__hint">
                            {t('tooltip.hoverInfo') || ''}
                          </p>
                        </div>
                      )}
                    </div>
                  <div className="ms-figma-spec-action-links">
                    <button
                      type="button"
                      className="ms-figma-link-accessories-inline"
                      onClick={() =>
                        openMachineSpecificationPdf(machine, hostModels as HostModelRow[], showInfoToast, t)
                      }
                    >
                      {t('figma.viewDetailedSpecifications')}
                    </button>
                    <button
                      type="button"
                      className="ms-figma-link-accessories-inline"
                      onClick={() => {
                        const hostRow = findHostModelForMachinePart(machine, hostModels as HostModelRow[]) as Record<
                          string,
                          unknown
                        > | undefined;
                        const fromPart =
                          currentLanguage === 'zh'
                            ? machine.model_description_zh
                            : machine.model_description_en;
                        const fromHost =
                          currentLanguage === 'zh'
                            ? (hostRow?.model_description_zh as string | null | undefined)
                            : (hostRow?.model_description_en as string | null | undefined);
                        const body = (fromPart || fromHost || '').trim();
                        const fallback =
                          currentLanguage === 'zh'
                            ? machine.spec || ''
                            : machine.spec_imperial || machine.spec || '';
                        const text = (body || fallback).trim();
                        if (!text) {
                          showInfoToast(t('figma.introductionEmpty'));
                          return;
                        }
                        setIntroductionModalText(safeTextContent(text));
                        setIntroductionModalOpen(true);
                      }}
                    >
                      {t('figma.introductionLink')}
                    </button>
                    <button
                      type="button"
                      className="ms-figma-link-accessories-inline"
                      onClick={() => navigate(`/consumables?category=${category}`)}
                    >
                      {t('figma.filmOptionsLink')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 3: Stock + Actions（列表右栏不展示单价，避免 ¥0 占位） */}
              <div
                className="ms-figma-machine-card__col-actions ms-figma-machine-card__actions"
                style={{ position: 'absolute', right: 0, top: 0, width: 321 }}
              >
                <div className="ms-figma-purchase-rail">
                {isSales && (
                  <div className="ms-figma-stock-panel">
                    <div className="ms-figma-stock-heading">{t('figma.stockStatus')}</div>
                    <div className="ms-figma-stock-total">
                      {t('inventory.total')}:{' '}
                      {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).reduce(
                        (sum, regionKey) => sum + getRegionInventory(machine, regionKey.toString()),
                        0
                      )}
                    </div>
                    <div className="ms-figma-stock-tags">
                      {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
                        const stockStatus = getStockStatus(getRegionInventory(machine, regionKey.toString()));
                        return (
                          <span
                            key={`${machine.id}-inventory-${regionKey}`}
                            className={classNames('ms-figma-stock-pill', `ms-figma-stock-pill--${stockStatus.color}`)}
                          >
                            {REGIONS[regionKey].nameCn}: {getRegionInventory(machine, regionKey.toString())}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="ms-figma-purchase-actions-row">
                  <div className="ms-figma-qty-stepper">
                    <button
                      type="button"
                      className="ms-figma-qty-btn"
                      onClick={() =>
                        handleQuantityChange(
                          machine.id.toString(),
                          (quantities[machine.id.toString()] || 1) - 1
                        )
                      }
                      disabled={(quantities[machine.id.toString()] || 1) <= 1}
                      aria-label="−"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      className="ms-figma-qty-input"
                      value={quantities[machine.id.toString()] ?? 1}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isFinite(v) || v < 1) return;
                        handleQuantityChange(machine.id.toString(), v);
                      }}
                      aria-label={t('tableHeaders.quantity')}
                    />
                    <button
                      type="button"
                      className="ms-figma-qty-btn"
                      onClick={() =>
                        handleQuantityChange(
                          machine.id.toString(),
                          (quantities[machine.id.toString()] || 1) + 1
                        )
                      }
                      aria-label="+"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* 🎯 智能购物车按钮 - 替换原有按钮 */}
                  <SmartAddToCartButton
                    product={machine}
                    productType="machines"
                    onAddToCart={() => handleAddToCart(machine, 'machine')}
                    disabled={!canAddToCart}
                    className="ms-figma-primary-cart transition-colors duration-200"
                  >
                    <ShoppingCartOutlined className="mr-2" />
                    {canAddToCart ? t('addToCart') : t('noPermissionAdd')}
                  </SmartAddToCartButton>
                </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!selectedMachine && total > 0 && (
          <div className="flex justify-center ms-figma-pagination-wrap">
            <MsFigmaPagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              pageSizeOptions={['10', '20', '50']}
              perPageLabel={t('figma.perPage')}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              showTotal={(tot, range) => `${range[0]}-${range[1]} / ${tot}`}
            />
          </div>
        )}
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
        <button
          type="button"
          className="ms-figma-retry-btn"
          onClick={() => window.location.reload()}
        >
          <ReloadOutlined className="mr-2" aria-hidden />
          {t('retry')}
        </button>
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
      
      if (accessoryId) {
        // ✅ 修复：动态获取配件名称而不是使用缓存的名称
        let accessoryName = 'N/A';
        let accessory = null;
        
        // 根据层级查找配件对象
        const accessoryLists = [
          accessories,           // level 1
          level2Accessories,     // level 2
          level3Accessories,     // level 3
          level4Accessories,     // level 4
          level5Accessories      // level 5
        ];
        
        if (i >= 1 && i <= 5) {
          const targetList = accessoryLists[i - 1];
          accessory = targetList.find(acc => acc.id.toString() === accessoryId);
          
          if (accessory) {
            // 使用getAccessoryName函数动态获取当前语言的名称
            accessoryName = getAccessoryName(accessory);
          }
        }
        
        pathItems.push(
          <div key={`accessory-level-${level}-path-${i}-${accessoryId}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-1">
              {t('accessories.level')} {i}
            </span>
            <span 
              key={`accessory-path-name-${accessoryId}-${currentLanguage}-${forceRender}`}
              className="text-gray-800"
            >
              {accessoryName}
            </span>
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
      accessory: getAccessoryName(mainAccessory),
      accessoryId: mainAccessory.id,
      level,
      mainQuantity
    });
    
    // 这是一个简化版本，可以根据需要扩展
    // TODO: 实现完整的必选备件逻辑
    console.log('📝 [addRequiredPartsToCartForAccessory] Simplified version - skipping required parts processing');
  };

  // 渲染配件部分 - 完整恢复样式和交互
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
      partInventory, // ✅ 新增：显示库存数据
      level,
      index
    });

    // 尝试从多个位置获取数据
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

    // 获取料号 - 优先从accessoryPart获取，然后从accessory根级别
    const getPartNumber = () => {
      return accessoryPart?.part_number || 
             (accessory as any).part_number || 
             accessory.model || 
             'N/A';
    };

    // 检查是否为电气配件（有电压或频率信息）
    const isElectricalAccessory = () => {
      const voltage = getFieldValue('voltage');
      const frequency = getFieldValue('frequency');
      return voltage !== 'N/A' || frequency !== 'N/A';
    };

    const accessoryMoreKey = `${level}-${accessory.id}`;

    return (
      <div key={`accessory-level-${level}-${accessory.id}-${accessoryPart?.part_number || 'no-part'}-${index}-${currentLanguage}-${forceRender}`} className="ms-figma-accessory-card">
        <div className="ms-figma-accessory-card__row">
          {/* Column 1: Image & Selection */}
          <div className="ms-figma-accessory-card__col-gallery">
            <div className="relative mb-4">
              <img
                src={accessory.image_url || DEFAULT_IMAGE}
                alt={getAccessoryName(accessory)}
                className="ms-figma-accessory-card__image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // 避免无限循环：只有当前不是DEFAULT_IMAGE时才设置为DEFAULT_IMAGE
                  if (target.src !== DEFAULT_IMAGE) {
                    target.src = DEFAULT_IMAGE;
                  }
                }}
              />
            </div>
            <label className="ms-figma-accessory-card__select">
              <input
                type="radio"
                name={`accessory-level-${level}`}
                className="form-radio text-blue-500 mr-2"
                checked={selectedAccessories[`level${level}`] === accessory.id.toString()}
                onChange={() => handleAccessorySelection(level, accessory.id.toString(), getAccessoryName(accessory))}
              />
              <span className="text-sm font-medium">{t('actions.selectAccessory') || '选择配件'}</span>
            </label>
          </div>

          {/* Column 2: Info & Specs */}
          <div className="ms-figma-accessory-card__col-main">
            <div className="mb-4">
              <span className="ms-figma-accessory-card__pn">{getPartNumber()}</span>
              <h3
                key={`accessory-title-${accessory.id}-${currentLanguage}-${forceRender}`}
                className="ms-figma-accessory-card__title"
              >
                {getAccessoryNameDebug(accessory, 'h3-title')}
              </h3>
            </div>

            <div className="ms-figma-accessory-card__specs">
              <div className="ms-figma-accessory-card__spec-grid">
                <div className="ms-figma-accessory-card__spec-item">
                  <strong className="ms-figma-accessory-card__spec-label">{t('fields.model') || '型号'}:</strong>
                  <span className="ms-figma-accessory-card__spec-value">{accessory.model || getFieldValue('model')}</span>
                </div>
                {/* 只有当电气配件时才显示电压 */}
                {isElectricalAccessory() && getFieldValue('voltage') !== 'N/A' && (
                  <div className="ms-figma-accessory-card__spec-item">
                    <strong className="ms-figma-accessory-card__spec-label">{getFieldWithUnit('voltage', 'voltage')}:</strong>
                    <span className="ms-figma-accessory-card__spec-value">{removeUnitFromValue(getFieldValue('voltage'))}</span>
                  </div>
                )}
                {/* 频率字段强调显示，只有当电气配件时才显示 */}
                {isElectricalAccessory() && getFieldValue('frequency') !== 'N/A' && (
                  <div className="ms-figma-accessory-card__freq-highlight">
                    <strong className="freq-label">⚡ {getFieldWithUnit('frequency', 'frequency')}:</strong>
                    <span className="freq-value">{removeUnitFromValue(getFieldValue('frequency'))}</span>
                  </div>
                )}
                <div className="ms-figma-accessory-card__spec-item">
                  <strong className="ms-figma-accessory-card__spec-label">{getFieldWithUnit('packageSize', 'size')}:</strong>
                  <span className="ms-figma-accessory-card__spec-value">
                    {unitSystem === 'metric'
                      ? removeUnitFromValue(getFieldValue('package_size_cm'))
                      : removeUnitFromValue(getFieldValue('package_size_inch'))
                    }
                  </span>
                </div>
                <div className="ms-figma-accessory-card__spec-item">
                  <strong className="ms-figma-accessory-card__spec-label">{t('fields.pcsPerBox') || '单箱数量'}:</strong>
                  <span className="ms-figma-accessory-card__spec-value">{getFieldValue('pcs_per_box')}</span>
                </div>
                <div className="ms-figma-accessory-card__spec-item">
                  <strong className="ms-figma-accessory-card__spec-label">{getFieldWithUnit('palletSize', 'size')}:</strong>
                  <span className="ms-figma-accessory-card__spec-value">
                    {unitSystem === 'metric'
                      ? removeUnitFromValue(getFieldValue('pallet_size_cm'))
                      : removeUnitFromValue(getFieldValue('pallet_size_inch'))
                    }
                  </span>
                </div>
                <div className="ms-figma-accessory-card__spec-item">
                  <strong className="ms-figma-accessory-card__spec-label">{t('fields.pcsPerPallet') || '一托数量'}:</strong>
                  <span className="ms-figma-accessory-card__spec-value">{getFieldValue('pcs_per_pallet')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <button
                type="button"
                className="ms-figma-accessory-spec-btn"
                onClick={() => {
                  const accessoryPdfUrl =
                    (accessoryPart as any)?.spec_pdf ||
                    (accessory as any).spec_pdf ||
                    (accessoryPart as any)?.explosion_diagram_pdf ||
                    (accessory as any).explosion_diagram_pdf ||
                    (accessory as any).pdf_url;

                  console.log('🔍 [Accessory PDF Debug] Looking for accessory PDF:', {
                    accessory_id: accessory.id,
                    accessory_part_number: getPartNumber(),
                    accessory_title: getAccessoryName(accessory),
                    accessory_model: accessory.model,
                    pdf_sources: {
                      accessoryPart_spec_pdf: (accessoryPart as any)?.spec_pdf,
                      accessory_spec_pdf: (accessory as any).spec_pdf,
                      accessoryPart_explosion_pdf: (accessoryPart as any)?.explosion_diagram_pdf,
                      accessory_explosion_pdf: (accessory as any).explosion_diagram_pdf,
                      accessory_pdf_url: (accessory as any).pdf_url,
                    },
                    found_pdf_url: accessoryPdfUrl,
                  });

                  if (accessoryPdfUrl && !accessoryPdfUrl.includes('placeholder')) {
                    let absolutePdfUrl = accessoryPdfUrl;

                    if (!accessoryPdfUrl.startsWith('http')) {
                      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
                      let serverBaseUrl = '';

                      if (apiBaseUrl.includes('/wp-json/bjt/v1')) {
                        serverBaseUrl = apiBaseUrl.replace('/wp-json/bjt/v1', '');
                      } else {
                        serverBaseUrl = 'http://localhost:8080';
                      }

                      if (!serverBaseUrl || serverBaseUrl === '') {
                        serverBaseUrl = window.location.origin;
                      }

                      let cleanPath = accessoryPdfUrl;
                      if (cleanPath.startsWith('/frontend/public')) {
                        cleanPath = cleanPath.replace('/frontend/public', '');
                      }
                      if (!cleanPath.startsWith('/')) {
                        cleanPath = '/' + cleanPath;
                      }

                      absolutePdfUrl = serverBaseUrl + cleanPath;
                    }

                    console.log('✅ [Accessory PDF Debug] Opening PDF:', {
                      original_pdf_url: accessoryPdfUrl,
                      cleaned_pdf_url: absolutePdfUrl,
                      api_base_url: import.meta.env.VITE_API_URL,
                    });

                    window.open(absolutePdfUrl, '_blank');
                  } else {
                    showInfoToast(t('noAccessorySpecPdf') || '暂无该配件的规格说明文档');
                    console.warn('🔍 [Accessory PDF Debug] No valid PDF found for accessory:', {
                      accessory_part_number: getPartNumber(),
                      accessory_title: getAccessoryName(accessory),
                      accessory_model: accessory.model,
                      pdf_url: accessoryPdfUrl,
                    });
                  }
                }}
              >
                <InfoCircleOutlined className="mr-1" aria-hidden />
                {t('specDetails') || '规格详情'}
              </button>

              <div className="ms-figma-moreinfo relative" data-ms-accessory-moreinfo={accessoryMoreKey}>
                <button
                  type="button"
                  className="ms-figma-moreinfo-trigger"
                  aria-expanded={accessoryMoreInfoKey === accessoryMoreKey}
                  aria-haspopup="dialog"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() =>
                    setAccessoryMoreInfoKey((k) => (k === accessoryMoreKey ? null : accessoryMoreKey))
                  }
                >
                  <InfoCircleOutlined className="ms-figma-moreinfo-trigger__icon" aria-hidden />
                  {t('moreInfo') || '更多信息'}
                </button>
                {accessoryMoreInfoKey === accessoryMoreKey && (
                  <div className="ms-figma-moreinfo-panel" role="dialog" aria-label={t('moreInfo')}>
                    <div className="ms-figma-moreinfo-panel__head">
                      <InfoCircleOutlined className="ms-figma-moreinfo-panel__head-icon" aria-hidden />
                      <span className="ms-figma-moreinfo-panel__title">{t('moreInfo')}</span>
                    </div>
                    <dl className="ms-figma-moreinfo-panel__rows">
                      <div className="ms-figma-moreinfo-panel__row">
                        <dt>{getFieldWithUnit('packageSize', 'size')}</dt>
                        <dd>
                          {unitSystem === 'metric'
                            ? removeUnitFromValue(getFieldValue('package_size_cm'))
                            : removeUnitFromValue(getFieldValue('package_size_inch'))}
                        </dd>
                      </div>
                      <div className="ms-figma-moreinfo-panel__row">
                        <dt>{getFieldWithUnit('netWeight', 'weight')}</dt>
                        <dd>
                          {unitSystem === 'metric'
                            ? getFieldValue('net_weight_kg') !== 'N/A'
                              ? getFieldValue('net_weight_kg')
                              : 'N/A'
                            : getFieldValue('net_weight_lbs') !== 'N/A'
                              ? getFieldValue('net_weight_lbs')
                              : 'N/A'}
                        </dd>
                      </div>
                      <div className="ms-figma-moreinfo-panel__row">
                        <dt>{getFieldWithUnit('grossWeight', 'weight')}</dt>
                        <dd>
                          {unitSystem === 'metric'
                            ? getFieldValue('gross_weight_kg') !== 'N/A'
                              ? getFieldValue('gross_weight_kg')
                              : 'N/A'
                            : getFieldValue('gross_weight_lbs') !== 'N/A'
                              ? getFieldValue('gross_weight_lbs')
                              : 'N/A'}
                        </dd>
                      </div>
                      <div className="ms-figma-moreinfo-panel__row">
                        <dt>{getFieldWithUnit('palletHeight', 'size')}</dt>
                        <dd>
                          {unitSystem === 'metric'
                            ? getFieldValue('pallet_height_cm') !== 'N/A'
                              ? getFieldValue('pallet_height_cm')
                              : 'N/A'
                            : getFieldValue('pallet_height_inch') !== 'N/A'
                              ? getFieldValue('pallet_height_inch')
                              : 'N/A'}
                        </dd>
                      </div>
                      <div className="ms-figma-moreinfo-panel__row">
                        <dt>{getFieldWithUnit('palletGrossWeight', 'weight')}</dt>
                        <dd>
                          {unitSystem === 'metric'
                            ? getFieldValue('pallet_gross_weight_kg') !== 'N/A'
                              ? getFieldValue('pallet_gross_weight_kg')
                              : 'N/A'
                            : getFieldValue('pallet_gross_weight_lbs') !== 'N/A'
                              ? getFieldValue('pallet_gross_weight_lbs')
                              : 'N/A'}
                        </dd>
                      </div>
                    </dl>
                    <p className="ms-figma-moreinfo-panel__hint">{t('tooltip.hoverInfo') || ''}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Price, Stock, Actions */}
          <div className="ms-figma-accessory-card__col-actions">
            {/* Price */}
            <div className="mb-4">
              <div className="ms-figma-accessory-card__price-label">
                {t('tableHeaders.price') || 'Price'}:
              </div>

              <div className="ms-figma-accessory-card__price">
                {getCurrencySymbol(userRegion)}{formatPrice(partPrices?.base || 0)}
              </div>
            </div>

            {/* Inventory (Sales View) */}
            {isSales && (
              <div className="mb-4">
                <div className="ms-figma-stock-heading">
                  {t('tableHeaders.stock') || '库存'}:
                </div>
                <div className="ms-figma-stock-tags ms-figma-stock-tags--accessory">
                  {partInventory && partInventory.length > 0 ? (
                    partInventory.map((inv, invIndex) => {
                      const stockStatus = getStockStatus(inv.amount || 0);
                      return (
                        <span
                          key={`accessory-${accessory.id}-level-${level}-index-${index}-part-inventory-${inv.region}-${invIndex}`}
                          className={classNames(
                            'ms-figma-stock-pill',
                            `ms-figma-stock-pill--${stockStatus.color}`
                          )}
                        >
                          {inv.region}: {inv.amount || 0}
                        </span>
                      );
                    })
                  ) : (
                    (Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => {
                      const stockStatus = getStockStatus(0);
                      return (
                        <span
                          key={`accessory-${accessory.id}-level-${level}-index-${index}-default-inventory-${regionKey}`}
                          className={classNames(
                            'ms-figma-stock-pill',
                            `ms-figma-stock-pill--${stockStatus.color}`
                          )}
                        >
                          {REGIONS[regionKey].nameCn}: 0
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="space-y-3">
              <div className="ms-figma-qty-stepper">
                <button
                  type="button"
                  className="ms-figma-qty-btn"
                  onClick={() =>
                    handleQuantityChange(
                      accessory.id.toString(),
                      (quantities[accessory.id.toString()] || 1) - 1
                    )
                  }
                  disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                  aria-label="−"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  className="ms-figma-qty-input ms-figma-qty-input--accessory"
                  value={quantities[accessory.id.toString()] ?? 1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isFinite(v) || v < 1) return;
                    handleQuantityChange(accessory.id.toString(), v);
                  }}
                  aria-label={t('tableHeaders.quantity')}
                />
                <button
                  type="button"
                  className="ms-figma-qty-btn"
                  onClick={() =>
                    handleQuantityChange(
                      accessory.id.toString(),
                      (quantities[accessory.id.toString()] || 1) + 1
                    )
                  }
                  aria-label="+"
                >
                  +
                </button>
              </div>
              
              {/* 🎯 智能购物车按钮 - 替换配件按钮 */}
              <SmartAddToCartButton
                product={accessory}
                productType="accessories"
                onAddToCart={() => handleAddToCart(accessory, 'accessory')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 h-10 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <ShoppingCartOutlined className="mr-2" />
                {t('buttons.addToCart') || '添加到购物车'}
              </SmartAddToCartButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔧 更新后的层级展开函数 - 匹配admin RelationsPage逻辑
  const flattenAccessoriesByLevel = useCallback((
    accessories: AccessoryWithChildren[], 
    currentLevel: number = 1,
    parentPath: string = '',
    visitedNodes: Set<string> = new Set()
  ): FlattenedAccessory[] => {
    console.log(`flattenAccessoriesByLevel: Processing ${accessories.length} accessories at level ${currentLevel}`);
    console.log(`flattenAccessoriesByLevel: Parent path: ${parentPath}`);
    console.log(`flattenAccessoriesByLevel: Visited nodes:`, Array.from(visitedNodes));
    
    const flattened: FlattenedAccessory[] = [];
    
    accessories.forEach((accessory, index) => {
      // 🔧 严格按照admin逻辑：每个accessory都有唯一的relation_id
      const nodeKey = `${accessory.relation_id}-${accessory.part_number}`;
      const currentPath = parentPath ? `${parentPath} > ${accessory.part_number}` : accessory.part_number;
      
      // 🔧 循环检测：使用relation_id + part_number作为唯一标识
      if (visitedNodes.has(nodeKey)) {
        console.warn(`flattenAccessoriesByLevel: Detected cycle at ${nodeKey}, skipping`);
        return;
      }
      
      const newVisitedNodes = new Set(visitedNodes);
      newVisitedNodes.add(nodeKey);
      
      console.log(`flattenAccessoriesByLevel: Processing accessory ${index}: ${accessory.part_number} (relation_id: ${accessory.relation_id}, level: ${currentLevel})`);
      
      // 🔧 创建展开的配件对象
      const flattenedAccessory: FlattenedAccessory = {
        ...accessory,
        level: currentLevel,
        relation_id: accessory.relation_id, // 保持原始关系ID
        hierarchyPath: currentPath,
        uniqueKey: nodeKey, // 添加唯一标识
        children: [] // 清空children，因为会被展开
      };
      
      flattened.push(flattenedAccessory);
      console.log(`flattenAccessoriesByLevel: Added accessory ${accessory.part_number} at level ${currentLevel} with path: ${currentPath}`);
      
      // 🔧 严格按照admin逻辑：递归处理子配件，不做任何去重
      if (accessory.children && accessory.children.length > 0) {
        console.log(`flattenAccessoriesByLevel: Processing ${accessory.children.length} children for ${accessory.part_number}`);
        
        const childrenFlattened = flattenAccessoriesByLevel(
          accessory.children,
          currentLevel + 1,
          currentPath,
          newVisitedNodes
        );
        
        console.log(`flattenAccessoriesByLevel: Got ${childrenFlattened.length} flattened children from ${accessory.part_number}`);
        flattened.push(...childrenFlattened);
      }
    });
    
    console.log(`flattenAccessoriesByLevel: Returning ${flattened.length} flattened accessories from level ${currentLevel}`);
    return flattened;
  }, []);

  // ✅ 调试用：监听状态变化
  useEffect(() => {
    console.log('🔍 [DEBUG] Machines state changed:', {
      machinesCount: machines.length,
      machinesData: machines.slice(0, 2), // 显示前2个
      timestamp: new Date().toISOString()
    });
  }, [machines]);

  useEffect(() => {
    console.log('🔍 [DEBUG] HostModels state changed:', {
      hostModelsCount: hostModels.length,
      hostModelsData: hostModels.slice(0, 3), // 显示前3个
      timestamp: new Date().toISOString()
    });
  }, [hostModels]);

  // ✅ 监听语言变化，强制重新渲染和重新加载数据
  useEffect(() => {
    console.log('🔄 [Language Change] Current language changed to:', currentLanguage);
    
    // 清理配件相关的状态缓存
    if (selectedAccessoryNames && Object.keys(selectedAccessoryNames).length > 0) {
      console.log('🔄 [Language Change] Clearing selectedAccessoryNames cache');
      setSelectedAccessoryNames({});
    }
    
    // ✅ 强制重新渲染所有组件
    setForceRender(prev => prev + 1);
    console.log('🔄 [Language Change] Force re-render triggered');
    
    // ✅ 修复：语言切换时重新加载配件数据
    if (selectedMachine && selectedMachine !== '') {
      console.log('🔄 [Language Change] Reloading accessories data for new language');
      
      // 清除当前配件状态
      setAccessories([]);
      setLevel2Accessories([]);
      setLevel3Accessories([]);
      setLevel4Accessories([]);
      setLevel5Accessories([]);
      
      // 重新加载配件数据
      const reloadAccessoriesForLanguage = async () => {
        setAccessoriesLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          
          // 获取选中机器的信息
          const selectedMachineData = machines.find(m => m.id.toString() === selectedMachine);
          const machinePartNumber = selectedMachineData?.part_number || selectedMachine;
          
          console.log('🔄 [Language Change] Reloading accessories for machine:', machinePartNumber, 'with language:', currentLanguage);
          
          // 使用新的语言参数调用API
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
          const apiUrl = `${baseUrl}/relations/${machinePartNumber}/accessories?lang=${currentLanguage}&region=${filterRegion}&max_levels=5&status=publish`;
          
          console.log('🔄 [Language Change] API URL with new language:', apiUrl);
          
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
          console.log('✅ [Language Change] Reloaded accessories data:', jsonData);
          
          if (jsonData.success && jsonData.data && jsonData.data.accessories) {
            const accessoriesData = jsonData.data.accessories;
            
            // 应用过滤器和数据处理逻辑（复用原有逻辑）
            const filterMissingData = (items: any[]): any[] => {
              if (!Array.isArray(items)) return [];
              
              return items
                .filter(item => {
                  const isMissingData = 
                    (item.id && String(item.id).toLowerCase().startsWith('missing')) ||
                    (item.part_number && String(item.part_number).toLowerCase().startsWith('missing'));
                  
                  if (isMissingData) {
                    console.log('🚫 [filterMissingData] 过滤掉占位符数据:', {
                      id: item.id,
                      part_number: item.part_number,
                      name: item.name
                    });
                    return false;
                  }
                  return true;
                })
                .map(item => ({
                  ...item,
                  children: item.children ? filterMissingData(item.children) : []
                }));
            };
            
            const filteredAccessoriesData = filterMissingData(accessoriesData);
            console.log('✅ [Language Change] Filtered accessories data, count:', filteredAccessoriesData.length);
            
            // 处理层级数据（复用原有逻辑）
            const flattenAccessoriesByLevel = (items: any[], targetLevel: number = 1) => {
              const result: MachineAccessory[] = [];
              
              const processItems = (itemsList: any[], parentId?: string) => {
                itemsList.forEach((item: any, index: number) => {
                  if (item.level === targetLevel) {
                    const convertChildren = (childrenData: any[]): MachineAccessory[] => {
                      if (!Array.isArray(childrenData)) return [];
                      return childrenData.map((child: any) => ({
                        id: child.id?.toString() || '',
                        part_number: child.part_number || '',
                        name_zh: child.name_zh || '',
                        name_en: child.name_en || '',
                        title: child.name || child.name_zh || child.name_en || '',
                        title_zh: child.title_zh || '',
                        title_en: child.title_en || '',
                        model: child.model || '',
                        spec: child.spec || '',
                        spec_imperial: child.spec_imperial || '',
                        voltage: child.voltage || '',
                        frequency: child.frequency || '',
                        image_url: child.image_url || '',
                        explosion_diagram_pdf: child.explosion_diagram_pdf || '',
                        spec_pdf: child.spec_pdf || '',
                        unit: child.unit || 'pcs',
                        product_line_id: child.product_line_id || 1,
                        level: child.level || targetLevel,
                        parts: [], // 添加必需的parts字段
                        children: child.children ? convertChildren(child.children) : [],
                        package_size_cm: child.package_size_cm || '',
                        package_size_inch: child.package_size_inch || '',
                        net_weight_kg: child.net_weight_kg,
                        net_weight_lbs: child.net_weight_lbs,
                        gross_weight_kg: child.gross_weight_kg,
                        gross_weight_lbs: child.gross_weight_lbs,
                        pcs_per_box: child.pcs_per_box,
                        pallet_size_cm: child.pallet_size_cm || '',
                        pallet_size_inch: child.pallet_size_inch || '',
                        pcs_per_pallet: child.pcs_per_pallet,
                        pallet_height_cm: child.pallet_height_cm,
                        pallet_height_inch: child.pallet_height_inch,
                        pallet_gross_weight_kg: child.pallet_gross_weight_kg,
                        pallet_gross_weight_lbs: child.pallet_gross_weight_lbs
                      }));
                    };
                    
                    const accessoryItem: MachineAccessory = {
                      id: item.id?.toString() || '',
                      part_number: item.part_number || '',
                      name_zh: item.name_zh || '',
                      name_en: item.name_en || '',
                      title: item.name || item.name_zh || item.name_en || '',
                      title_zh: item.title_zh || '',
                      title_en: item.title_en || '',
                      model: item.model || '',
                      spec: item.spec || '',
                      spec_imperial: item.spec_imperial || '',
                      voltage: item.voltage || '',
                      frequency: item.frequency || '',
                      image_url: item.image_url || '',
                      explosion_diagram_pdf: item.explosion_diagram_pdf || '',
                      spec_pdf: item.spec_pdf || '',
                      unit: item.unit || 'pcs',
                      product_line_id: item.product_line_id || 1,
                      level: item.level || targetLevel,
                      parts: [], // 添加必需的parts字段
                      children: item.children ? convertChildren(item.children) : [],
                      package_size_cm: item.package_size_cm || '',
                      package_size_inch: item.package_size_inch || '',
                      net_weight_kg: item.net_weight_kg,
                      net_weight_lbs: item.net_weight_lbs,
                      gross_weight_kg: item.gross_weight_kg,
                      gross_weight_lbs: item.gross_weight_lbs,
                      pcs_per_box: item.pcs_per_box,
                      pallet_size_cm: item.pallet_size_cm || '',
                      pallet_size_inch: item.pallet_size_inch || '',
                      pcs_per_pallet: item.pcs_per_pallet,
                      pallet_height_cm: item.pallet_height_cm,
                      pallet_height_inch: item.pallet_height_inch,
                      pallet_gross_weight_kg: item.pallet_gross_weight_kg,
                      pallet_gross_weight_lbs: item.pallet_gross_weight_lbs
                    };
                    
                    result.push(accessoryItem);
                  }
                  
                  if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                    processItems(item.children, item.id?.toString());
                  }
                });
              };
              
              processItems(filteredAccessoriesData);
              return result;
            };
            
            // 分别获取各个层级的配件
            const level1Items = flattenAccessoriesByLevel(filteredAccessoriesData, 1);
            const level2Items = flattenAccessoriesByLevel(filteredAccessoriesData, 2);
            const level3Items = flattenAccessoriesByLevel(filteredAccessoriesData, 3);
            const level4Items = flattenAccessoriesByLevel(filteredAccessoriesData, 4);
            const level5Items = flattenAccessoriesByLevel(filteredAccessoriesData, 5);
            
            console.log('✅ [Language Change] Processed accessories by level:', {
              level1: level1Items.length,
              level2: level2Items.length,
              level3: level3Items.length,
              level4: level4Items.length,
              level5: level5Items.length
            });
            
            // 更新状态
            setAccessories(level1Items);
            setLevel2Accessories(level2Items);
            setLevel3Accessories(level3Items);
            setLevel4Accessories(level4Items);
            setLevel5Accessories(level5Items);
            setAutoLoadedAccessories(true);
            
            console.log('✅ [Language Change] Successfully reloaded accessories for new language');
          }
        } catch (error) {
          console.error('❌ [Language Change] Failed to reload accessories:', error);
        } finally {
          setAccessoriesLoading(false);
        }
      };
      
      // 延迟执行，确保状态更新完成
      setTimeout(reloadAccessoriesForLanguage, 100);
    }
  }, [currentLanguage]); // 只监听语言变化

  // Return the main component JSX
  return (
    <>
      <dialog
        ref={introductionDialogRef}
        className="ms-figma-dialog"
        onClose={() => setIntroductionModalOpen(false)}
      >
        <div className="ms-figma-dialog__surface">
          <header className="ms-figma-dialog__header">
            <h2 className="ms-figma-dialog__title">{t('figma.introductionModalTitle')}</h2>
            <button
              type="button"
              className="ms-figma-dialog__icon-close"
              onClick={() => introductionDialogRef.current?.close()}
              aria-label={t('close')}
            >
              ×
            </button>
          </header>
          <div className="ms-figma-dialog__body max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-gray-800 text-sm">
            {introductionModalText}
          </div>
          <footer className="ms-figma-dialog__footer">
            <button
              type="button"
              className="ms-figma-dialog__primary"
              onClick={() => introductionDialogRef.current?.close()}
            >
              {t('close')}
            </button>
          </footer>
        </div>
      </dialog>

      {/* Frame 264 主列 1617：面包屑(Frame 982)+页面与 Figma 同宽左对齐，避免宽屏下相对主区居中缩窄 */}
      <div className="ms-pl1-main-stack">
      <div className="ms-breadcrumb-bar ms-breadcrumb-bar--figma">
        <div className="ms-breadcrumb-path">
          <button
            type="button"
            className="ms-breadcrumb-back"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/machines'))}
            aria-label={t('figma.breadcrumbBack')}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className="ms-breadcrumb-btn ms-breadcrumb-btn--primary"
            onClick={() => navigate('/machines')}
          >
            {t('figma.machineAndAccessory')}
          </button>

          <span className="ms-breadcrumb-chev" aria-hidden>
            &gt;
          </span>

          <span className="ms-breadcrumb-chip">{t('types.airCushion')}</span>

          {selectedMachine && (
            <>
              <span className="ms-breadcrumb-chev" aria-hidden>
                &gt;
              </span>
              <span className="ms-breadcrumb-chip ms-breadcrumb-chip--host">{t('figma.hostLabel')}</span>
              <button
                type="button"
                className="ms-breadcrumb-btn ms-breadcrumb-btn--ghost"
                onClick={() => {
                  setSelectedMachine('');
                  setSelectedAccessories({});
                }}
              >
                {(() => {
                  const machine = machines.find(m => m.id.toString() === selectedMachine);
                  if (machine) {
                    return getMachineName(machine) || machine.model || machine.part_number || t('figma.unknownHost');
                  }
                  return t('figma.unknownHost');
                })()}
              </button>

              {Object.keys(selectedAccessories).length > 0 && (
                <>
                  {Object.entries(selectedAccessories)
                    .sort(([a], [b]) => parseInt(a.replace('level', '')) - parseInt(b.replace('level', '')))
                    .map(([level, accessoryId]) => {
                      const levelNum = parseInt(level.replace('level', ''));
                      let accessoryList;

                      switch (levelNum) {
                        case 1:
                          accessoryList = accessories;
                          break;
                        case 2:
                          accessoryList = level2Accessories;
                          break;
                        case 3:
                          accessoryList = level3Accessories;
                          break;
                        case 4:
                          accessoryList = level4Accessories;
                          break;
                        case 5:
                          accessoryList = level5Accessories;
                          break;
                        default:
                          accessoryList = [];
                      }

                      const accessory = accessoryList.find(acc => acc.id === accessoryId);
                      const accessoryName = accessory
                        ? accessory.name_zh ||
                          accessory.name_en ||
                          accessory.title_zh ||
                          accessory.title_en ||
                          accessory.part_number ||
                          t('figma.unknownAccessory')
                        : t('figma.unknownAccessory');

                      return (
                        <React.Fragment key={level}>
                          <span className="ms-breadcrumb-chev" aria-hidden>
                            &gt;
                          </span>
                          <button
                            type="button"
                            className="ms-breadcrumb-btn ms-breadcrumb-btn--accessory"
                            onClick={() => {
                              const newSelectedAccessories = { ...selectedAccessories };
                              Object.keys(newSelectedAccessories).forEach(key => {
                                const keyLevel = parseInt(key.replace('level', ''));
                                if (keyLevel >= levelNum) {
                                  delete newSelectedAccessories[key];
                                }
                              });
                              setSelectedAccessories(newSelectedAccessories);
                            }}
                            title={`点击移除 ${levelNum}级配件: ${accessoryName}`}
                          >
                            {levelNum}级: {accessoryName}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </>
              )}

              {Object.keys(selectedAccessories).length === 0 && (
                <>
                  <span className="ms-breadcrumb-chev" aria-hidden>
                    &gt;
                  </span>
                  <span className="ms-breadcrumb-pill-warn">{t('figma.levelOneAccessory')}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="ms-breadcrumb-spacer" aria-hidden />

      <div className="machines-page min-h-screen text-gray-900 ms-product-line-layout">
        <MockServiceStatus position="top-right" compact={true} hidden={true} />

        <div className="ms-content-column">
        
        {/* 主机型号对比图片区域 */}
        {!selectedMachine && (
          <div className="ms-compare-disclosure ms-compare-disclosure--figma-frame">
            <button
              type="button"
              className="ms-compare-disclosure__header"
              aria-expanded={compareSectionOpen}
              onClick={() => setCompareSectionOpen((o) => !o)}
            >
              <span className="inline-flex items-center gap-2">
                <FileImageOutlined className="text-blue-600" aria-hidden />
                {t('figma.modelParamComparison')}
              </span>
              <span className="ms-compare-disclosure__chev" aria-hidden>
                {compareSectionOpen ? '▾' : '▸'}
              </span>
            </button>
            {compareSectionOpen && (
              <div className="ms-compare-disclosure__panel">
                <div className="ms-figma-compare-inner">
                  <div className="ms-compare-canvas">
                    <div className="machine-comparison-container ms-compare-canvas-table-shell">
                      <div
                        className={classNames('machine-comparison-image-container', {
                          'ms-compare-visual--data-table': filteredMachines.length > 0,
                        })}
                      >
                        {filteredMachines.length > 0 ? (
                          <MachineCompareFigmaTable
                            machines={filteredMachines}
                            locale={currentLanguage === 'zh' ? 'zh' : 'en'}
                            unitSystem={unitSystem}
                          />
                        ) : (
                          <img
                            src={compareDiagramSrc}
                            alt="主机型号对比"
                            className="machine-comparison-image"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              const defaultUrl = new URL(DEFAULT_COMPARE_DIAGRAM, window.location.origin).href;
                              if (!el.dataset.compareImgFallback) {
                                el.dataset.compareImgFallback = '1';
                                if (el.src !== defaultUrl && !el.src.endsWith(DEFAULT_COMPARE_DIAGRAM)) {
                                  el.src = defaultUrl;
                                  return;
                                }
                              }
                              el.src = COMPARE_DIAGRAM_ERROR_PLACEHOLDER;
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="ms-filter-card">
          <h1 className="ms-filter-card__title">
            {selectedMachine ? t('pageTitles.accessorySelection') : t('figma.machineSelection')}
          </h1>

          <div className="ms-filter-card__row">
            <div className="ms-figma-filter-field">
              <label className="ms-figma-filter-field__label" htmlFor="ms-pl1-filter-model">
                {t('filters.model')}
              </label>
              <select
                id="ms-pl1-filter-model"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="ms-figma-native-select"
              >
                {modelOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ms-figma-filter-field">
              <label className="ms-figma-filter-field__label" htmlFor="ms-pl1-filter-voltage">
                {t('filters.voltage')}
              </label>
              <select
                id="ms-pl1-filter-voltage"
                value={selectedVoltage}
                onChange={(e) => handleVoltageChange(e.target.value)}
                className="ms-figma-native-select ms-figma-native-select--narrow"
              >
                <option value="ALL">{t('filters.allVoltages') || '全部电压'}</option>
                <option value="110V">110V</option>
                <option value="220V">220V</option>
              </select>
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
            <button
              type="button"
              className="ms-figma-accessory-close"
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-1');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
            >
              <DeleteOutlined className="mr-1" aria-hidden />
              {t('actions.close')}
            </button>
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
                      title: getAccessoryName(accessory)
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
            <button
              type="button"
              className="ms-figma-accessory-close"
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-2');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
            >
              <DeleteOutlined className="mr-1" aria-hidden />
              {t('actions.close')}
            </button>
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
            <button
              type="button"
              className="ms-figma-accessory-close"
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-3');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
            >
              <DeleteOutlined className="mr-1" aria-hidden />
              {t('actions.close')}
            </button>
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
            <button
              type="button"
              className="ms-figma-accessory-close"
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-4');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
            >
              <DeleteOutlined className="mr-1" aria-hidden />
              {t('actions.close')}
            </button>
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
            <button
              type="button"
              className="ms-figma-accessory-close"
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-5');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
            >
              <DeleteOutlined className="mr-1" aria-hidden />
              {t('actions.close')}
            </button>
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

        {/* 购物车通知浮层 */}
        {/* {showNotification && ( ... )} */}

        </div>

        <CartAnimation
          isActive={cartAnimation.isActive}
          startElement={cartAnimation.startElement}
          targetElement={cartAnimation.targetElement}
          productImage={cartAnimation.productImage}
          productName={cartAnimation.productName}
          onComplete={() =>
            setCartAnimation((prev) => ({
              ...prev,
              isActive: false,
              startElement: null,
              targetElement: null
            }))
          }
        />
      </div>
      </div>
    </>
  );
};

export default ProductLine1Page;