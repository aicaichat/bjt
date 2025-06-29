import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Tooltip } from 'antd';
import './CartTooltip.css';

// 占位符图片
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwQzEwNSA5NSAxMTAgOTUgMTE1IDEwMEMxMTAgMTA1IDEwNSAxMDUgMTAwIDEwMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';

interface CartTooltipProps {
  item: any;
  userRegion?: string;
  placement?: any;
  children: React.ReactNode;
}

// 耗材Tooltip内容组件 - 与耗材页面完全相同
interface ConsumableTooltipContentProps {
  item: any;
  userRegion: string;
}

// 全局缓存，避免重复请求
const tooltipDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 清理图片URL的函数
function cleanImageUrl(url: string | undefined | null): string {
  if (!url || url === 'null' || url === 'undefined') {
    return placeholderImage;
  }
  
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 🔧 处理缺少文件扩展名的情况
  if (url.startsWith('/')) {
    // 检查是否已有文件扩展名
    const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    if (!hasExtension) {
      // 对于包装图片，使用 .png 格式
      if (url.includes('/Package/') || url.includes('/package/')) {
        return url + '.png';
      }
      
      // 对于其他图片，默认尝试 .jpg
      return url + '.jpg';
    }
    return url;
  }
  
  // 🔧 处理相对路径，同样检查扩展名
  const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  if (!hasExtension) {
    // 对于包装相关的图片，使用 .png
    if (url.includes('Package') || url.includes('package')) {
      return `/images/${url}.png`;
    }
    return `/images/${url}.jpg`;
  }
  
  return `/images/${url}`;
}

// 判断是否为纸质材料
const isPaperMaterial = (materialId: string): boolean => {
  return (
    materialId === 'PAPER' ||
    materialId === 'paper_pe' ||
    (materialId || '').toLowerCase().includes('paper')
  );
};

const ConsumableTooltipContent: React.FC<ConsumableTooltipContentProps> = ({ item, userRegion }) => {
  const { t, i18n } = useTranslation(['consumables', 'common']);
  const { getPreferredUnit } = useAuth();
  
  const preferredUnit = getPreferredUnit();
  const isImperialUnit = preferredUnit === 'imperial';
  
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isRequestInProgress = useRef(false);
  const hasFetched = useRef(false);

  const cacheKey = `${item.id}-${userRegion}`;

  // 🔍 添加详细的调试日志
  console.log('🔍 [CartTooltip] ConsumableTooltipContent initialized with item:', {
    itemId: item.id,
    itemName: item.name,
    itemKeys: Object.keys(item),
    itemData: item,
    userRegion,
    cacheKey
  });

  useEffect(() => {
    if (hasFetched.current && detailData) {
      console.log('🔍 [CartTooltip] Using existing detailData:', detailData);
      return;
    }

    const fetchDetailData = async () => {
      if (isRequestInProgress.current) {
        console.log('🚫 [CartTooltip] Request already in progress, skipping');
        return;
      }
      
      if (!item.id) {
        console.warn('⚠️ [CartTooltip] No item ID found:', item);
        return;
      }

      const cached = tooltipDataCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('✅ [CartTooltip] Using cached data for:', item.id, cached.data);
        setDetailData(cached.data);
        hasFetched.current = true;
        return;
      }

      isRequestInProgress.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 [CartTooltip] Fetching details for item ID:', item.id);
        
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const apiUrl = `${baseUrl}/consumables/${item.id}?lang=${navigator.language.startsWith('zh') ? 'zh' : 'en'}&region=${userRegion}`;
        
        console.log('🔍 [CartTooltip] API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        console.log('🔍 [CartTooltip] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        console.log('✅ [CartTooltip] Raw API response:', jsonData);
        
        let finalData = null;
        
        if (jsonData.success && jsonData.data) {
          finalData = jsonData.data;
          console.log('🔍 [CartTooltip] Using jsonData.data structure');
        } else if (jsonData.data) {
          finalData = jsonData.data;
          console.log('🔍 [CartTooltip] Using direct jsonData.data');
        } else if (Array.isArray(jsonData) && jsonData.length > 0) {
          finalData = jsonData[0];
          console.log('🔍 [CartTooltip] Using first array element');
        } else if (jsonData && typeof jsonData === 'object') {
          finalData = jsonData;
          console.log('🔍 [CartTooltip] Using direct jsonData object');
        } else {
          throw new Error('No valid data structure found in API response');
        }
        
        console.log('🔍 [CartTooltip] Final mapped data keys:', Object.keys(finalData || {}));
        console.log('🔍 [CartTooltip] Final mapped data sample:', {
          material: finalData?.material,
          thickness: finalData?.thickness,
          width: finalData?.width,
          length: finalData?.length,
          pcs_per_pallet_a: finalData?.pcs_per_pallet_a,
          package_image_url: finalData?.package_image_url
        });
        
        tooltipDataCache.set(cacheKey, {
          data: finalData,
          timestamp: Date.now()
        });
        
        setDetailData(finalData);
        hasFetched.current = true;
        
      } catch (err: any) {
        console.error('❌ [CartTooltip] Failed to fetch detail data:', err);
        const msg = err?.message || '';
        // 对于 404 错误静默处理，只使用 fallback 数据，不显示黄框
        if (msg.startsWith('HTTP 404')) {
          console.warn('⚠️ [CartTooltip] 404 Not Found - using fallback data silently');
          setError(null); // 不显示错误横幅
        } else {
          setError(msg || 'Failed to fetch detail data');
        }
        
        // 🔍 详细的fallback数据调试
        console.log('🔍 [CartTooltip] Creating fallback data from item:', {
          itemKeys: Object.keys(item),
          material: item.material,
          specs: item.specs,
          pcs_per_pallet_a: item.pcs_per_pallet_a,
          package_image_url: item.package_image_url
        });
        
        const fallbackData = {
          // 基本信息
          material: item.specs?.material || item.material || 'N/A',
          thickness: item.specs?.thickness || item.thickness_met || 'N/A',
          thickness_met: item.specs?.thickness || item.thickness_met || 'N/A',
          thickness_imp: item.specs?.thickness || item.thickness_imp || 'N/A',
          width: item.specs?.width || item.width_met || 'N/A',
          width_met: item.specs?.width || item.width_met || 'N/A',
          width_imp: item.specs?.width || item.width_imp || 'N/A',
          length: item.specs?.length || item.length_met || 'N/A',
          length_met: item.specs?.length || item.length_met || 'N/A',
          length_imp: item.specs?.length || item.length_imp || 'N/A',
          bubble_diameter: item.bubble_diameter_mm || item.bubble_diameter || 'N/A',
          bubble_diameter_met: item.bubble_diameter_mm || item.bubble_diameter || 'N/A',
          bubble_diameter_imp: item.bubble_diameter_inch || 'N/A',
          rollLength: item.specs?.rollLength || item.total_length_met || 'N/A',
          roll_length_m: item.specs?.rollLength || item.total_length_met || 'N/A',
          roll_length_ft: item.specs?.rollLength || item.total_length_imp || 'N/A',
          total_length_m: item.total_length_met || 'N/A',
          total_length_ft: item.total_length_imp || 'N/A',
          
          // 包装属性
          packaging_type: item.package_type || String(t('tooltip.cartonPack') || 'Carton Pack'),
          package_type: item.package_type || String(t('tooltip.cartonPack') || 'Carton Pack'),
          package_size_cm: item.package_size_cm || String(t('common.toBeFilled') || 'To be filled'),
          package_size_inch: item.package_size_inch || String(t('common.toBeFilled') || 'To be filled'),
          net_weight_kg: item.net_weight_kg || String(t('common.toBeFilled') || 'To be filled'),
          net_weight_lbs: item.net_weight_lbs || String(t('common.toBeFilled') || 'To be filled'),
          pallet_size_cm: item.pallet_size_cm || String(t('common.toBeFilled') || 'To be filled'),
          pallet_size_inch: item.pallet_size_inch || String(t('common.toBeFilled') || 'To be filled'),
          package_image_url: item.package_image_url || '',
          pcs_per_box: item.pcs_per_box || String(t('common.toBeFilled') || 'To be filled'),
          
          // 打托属性 - A配置
          pcs_per_pallet_a: item.pcs_per_pallet_a || String(t('common.toBeFilled') || 'To be filled'),
          pallet_gross_weight_a_kg: item.pallet_gross_weight_a_kg || String(t('common.toBeFilled') || 'To be filled'),
          pallet_gross_weight_a_lbs: item.pallet_gross_weight_a_lbs || String(t('common.toBeFilled') || 'To be filled'),
          pallet_height_a_cm: item.pallet_height_a_cm || String(t('common.toBeFilled') || 'To be filled'),
          pallet_height_a_inch: item.pallet_height_a_inch || String(t('common.toBeFilled') || 'To be filled'),
          
          // 打托属性 - B配置
          pcs_per_pallet_b: item.pcs_per_pallet_b || String(t('common.toBeFilled') || 'To be filled'),
          pallet_gross_weight_b_kg: item.pallet_gross_weight_b_kg || String(t('common.toBeFilled') || 'To be filled'),
          pallet_gross_weight_b_lbs: item.pallet_gross_weight_b_lbs || String(t('common.toBeFilled') || 'To be filled'),
          pallet_height_b_cm: item.pallet_height_b_cm || String(t('common.toBeFilled') || 'To be filled'),
          pallet_height_b_inch: item.pallet_height_b_inch || String(t('common.toBeFilled') || 'To be filled'),
          
          // 打托属性 - C配置
          pcs_per_pallet_c: item.pcs_per_pallet_c || String(t('common.toBeFilled') || 'To be filled'),
          pallet_gross_weight_c_kg: item.pallet_gross_weight_c_kg || String(t('common.toBeFilled') || 'To be filled'),
          pallet_gross_weight_c_lbs: item.pallet_gross_weight_c_lbs || String(t('common.toBeFilled') || 'To be filled'),
          pallet_height_c_cm: item.pallet_height_c_cm || String(t('common.toBeFilled') || 'To be filled'),
          pallet_height_c_inch: item.pallet_height_c_inch || String(t('common.toBeFilled') || 'To be filled'),
          
          // 技术参数
          tube_inner_diameter_cm: item.tube_inner_diameter_cm || String(t('common.toBeFilled') || 'To be filled'),
          tube_inner_diameter_inch: item.tube_inner_diameter_inch || String(t('common.toBeFilled') || 'To be filled'),
          
          // 形状信息
          shape: item.shape || item.film_type || 'N/A'
        };
        
        console.log('🔍 [CartTooltip] Created fallback data sample:', {
          material: fallbackData.material,
          thickness: fallbackData.thickness,
          pcs_per_pallet_a: fallbackData.pcs_per_pallet_a,
          package_image_url: fallbackData.package_image_url
        });
        
        tooltipDataCache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now()
        });
        
        setDetailData(fallbackData);
        hasFetched.current = true;
      } finally {
        setLoading(false);
        isRequestInProgress.current = false;
      }
    };

    fetchDetailData();
    
  }, [item.id, cacheKey]);

  if (loading && !detailData) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[400px]">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-600 text-sm">{String(t('ui.loadingDetails') || '加载详细信息中...')}</span>
          </div>
        </div>
      </div>
    );
  }

  const data = detailData || {};
  
  // 🔍 调试数据获取
  console.log('🔍 [CartTooltip] Current data for rendering:', {
    dataKeys: Object.keys(data),
    dataSample: {
      material: data.material,
      thickness: data.thickness,
      pcs_per_pallet_a: data.pcs_per_pallet_a,
      package_image_url: data.package_image_url
    }
  });
  
  // 安全获取数据的辅助函数
  const safeGet = (field: string, fallback: string = 'N/A'): string => {
    let value = data[field];
    
    if ((value === null || value === undefined || value === '') && data.specs) {
      value = data.specs[field];
    }
    
    // 🔧 增强字段映射系统 - 优先从购物车item中获取数据
    const fieldMappings: { [key: string]: string[] } = {
      // 基本信息映射 - 增加购物车字段
      'material': ['material', 'specs.material', 'Material', 'materialName', 'brand'], // 使用brand作为material的fallback
      'thickness': ['thickness', 'thickness_met', 'specs.thickness', 'Thickness', 'thicknessMet'],
      'thickness_met': ['thickness_met', 'thickness', 'specs.thickness', 'Thickness'],
      'thickness_imp': ['thickness_imp', 'thickness_imperial', 'specs.thickness_imperial'],
      'width': ['width', 'width_met', 'specs.width', 'Width', 'widthMet', 'film_width_cm'],
      'width_met': ['width_met', 'width', 'specs.width', 'Width', 'film_width_cm'],
      'width_imp': ['width_imp', 'width_imperial', 'specs.width_imperial', 'film_width_inch'],
      'length': ['length', 'length_met', 'specs.length', 'Length', 'lengthMet', 'bag_length_cm'],
      'length_met': ['length_met', 'length', 'specs.length', 'Length', 'bag_length_cm'],
      'length_imp': ['length_imp', 'length_imperial', 'specs.length_imperial', 'bag_length_inch'],
      'bubble_diameter': ['bubble_diameter', 'bubble_diameter_met', 'bubbleDiameter', 'bubble_diameter_mm'],
      'bubble_diameter_met': ['bubble_diameter_met', 'bubble_diameter', 'bubbleDiameter', 'bubble_diameter_mm'],
      'bubble_diameter_imp': ['bubble_diameter_imp', 'bubble_diameter_imperial', 'bubble_diameter_inch'],
      
      // 总长映射
      'rollLength': ['rollLength', 'roll_length_m', 'total_length_m', 'specs.rollLength'],
      'roll_length_m': ['roll_length_m', 'rollLength', 'total_length_m', 'specs.rollLength'],
      'roll_length_ft': ['roll_length_ft', 'total_length_ft', 'rollLength_imperial'],
      'total_length_m': ['total_length_m', 'roll_length_m', 'rollLength'],
      'total_length_ft': ['total_length_ft', 'roll_length_ft'],
      
      // 包装信息映射 - 直接映射购物车字段
      'packaging_type': ['packaging_type', 'package_type', 'packagingMethod', 'sales_unit'],
      'package_type': ['package_type', 'packaging_type', 'packagingMethod', 'sales_unit'],
      'package_size_cm': ['package_size_cm', 'packageSize', 'package_dimensions_cm'],
      'package_size_inch': ['package_size_inch', 'package_dimensions_inch'],
      'net_weight_kg': ['net_weight_kg', 'unit_weight_kg', 'netWeight', 'unitWeight'],
      'net_weight_lbs': ['net_weight_lbs', 'unit_weight_lbs', 'netWeight_imperial'],
      'pcs_per_box': ['pcs_per_box', 'qtyPerCarton', 'quantity_per_box'],
      'package_image_url': ['package_image_url', 'packageImageUrl', 'packagingImage', 'image_url', 'image'], // 使用image_url作为fallback
      
      // 托盘信息映射
      'pallet_size_cm': ['pallet_size_cm', 'palletSize', 'pallet_dimensions_cm'],
      'pallet_size_inch': ['pallet_size_inch', 'pallet_dimensions_inch'],
      
      // A配置托盘映射 - 从购物车的pcs_per_pallet等字段获取
      'pcs_per_pallet_a': ['pcs_per_pallet_a', 'pallet_rolls_a', 'palletRollsA', 'packsPerPalletA', 'pcs_per_pallet'],
      'pallet_gross_weight_a_kg': ['pallet_gross_weight_a_kg', 'pallet_weight_a_kg', 'palletWeightA', 'gross_weight_kg'],
      'pallet_gross_weight_a_lbs': ['pallet_gross_weight_a_lbs', 'pallet_weight_a_lbs', 'palletWeightA_imperial', 'gross_weight_lbs'],
      'pallet_height_a_cm': ['pallet_height_a_cm', 'palletHeightA'],
      'pallet_height_a_inch': ['pallet_height_a_inch', 'palletHeightA_imperial'],
      
      // B配置托盘映射
      'pcs_per_pallet_b': ['pcs_per_pallet_b', 'pallet_rolls_b', 'palletRollsB', 'packsPerPalletB'],
      'pallet_gross_weight_b_kg': ['pallet_gross_weight_b_kg', 'pallet_weight_b_kg', 'palletWeightB'],
      'pallet_gross_weight_b_lbs': ['pallet_gross_weight_b_lbs', 'pallet_weight_b_lbs', 'palletWeightB_imperial'],
      'pallet_height_b_cm': ['pallet_height_b_cm', 'palletHeightB'],
      'pallet_height_b_inch': ['pallet_height_b_inch', 'palletHeightB_imperial'],
      
      // C配置托盘映射
      'pcs_per_pallet_c': ['pcs_per_pallet_c', 'pallet_rolls_c', 'palletRollsC', 'packsPerPalletC'],
      'pallet_gross_weight_c_kg': ['pallet_gross_weight_c_kg', 'pallet_weight_c_kg', 'palletWeightC'],
      'pallet_gross_weight_c_lbs': ['pallet_gross_weight_c_lbs', 'pallet_weight_c_lbs', 'palletWeightC_imperial'],
      'pallet_height_c_cm': ['pallet_height_c_cm', 'palletHeightC'],
      'pallet_height_c_inch': ['pallet_height_c_inch', 'palletHeightC_imperial'],
      
      // 技术参数映射
      'tube_inner_diameter_cm': ['tube_inner_diameter_cm', 'core_diameter_cm', 'innerDiameter'],
      'tube_inner_diameter_inch': ['tube_inner_diameter_inch', 'core_diameter_inch', 'innerDiameter_imperial'],
      
      // 形状映射 - 从spec字段中提取
      'shape': ['shape', 'film_type', 'bagType', 'filmType']
    };
    
    // 🔧 优先从购物车item中查找字段
    if (value === null || value === undefined || value === '') {
      const possibleFields = fieldMappings[field] || [field];
      for (const possibleField of possibleFields) {
        if (possibleField.includes('.')) {
          const parts = possibleField.split('.');
          let tempValue = data;
          for (const part of parts) {
            tempValue = tempValue?.[part];
            if (tempValue === null || tempValue === undefined) break;
          }
          if (tempValue !== null && tempValue !== undefined && tempValue !== '') {
            value = tempValue;
            console.log(`🔍 [CartTooltip] Found ${field} via nested path ${possibleField}:`, tempValue);
            break;
          }
        } else {
          // 🔧 优先从购物车item中查找
          const tempValue = data[possibleField] || item[possibleField];
          if (tempValue !== null && tempValue !== undefined && tempValue !== '') {
            value = tempValue;
            console.log(`🔍 [CartTooltip] Found ${field} via ${possibleField}:`, tempValue);
            break;
          }
        }
      }
    }
    
         // 🔧 特殊处理：从spec字段中提取信息
     if (value === null || value === undefined || value === '') {
       const spec = item.spec || item.spec_imperial || '';
       if (spec) {
         console.log(`🔍 [CartTooltip] Trying to extract ${field} from spec:`, spec);
         
         // 从spec中提取材质信息
         if (field === 'material') {
           if (spec.toLowerCase().includes('paper')) {
             value = 'Paper';
           } else if (spec.toLowerCase().includes('pe')) {
             value = 'PE';
           } else if (spec.toLowerCase().includes('film')) {
             value = 'Film';
           }
         }
         
         // 从spec中提取厚度信息 (例如: "45g paper" -> "45g")
         if (field === 'thickness' || field === 'thickness_met') {
           const thicknessMatch = spec.match(/(\d+\.?\d*)\s*g/i);
           if (thicknessMatch) {
             value = thicknessMatch[1] + 'g';
           }
         }
         
         // 从spec中提取尺寸信息 (例如: "20cmx13cm" -> width: 20cm, length: 13cm)
         if (field === 'width' || field === 'width_met') {
           const widthMatch = spec.match(/(\d+\.?\d*)\s*cm\s*x\s*(\d+\.?\d*)\s*cm/i);
           if (widthMatch) {
             value = widthMatch[1] + 'cm';
           }
         }
         
         if (field === 'length' || field === 'length_met') {
           const lengthMatch = spec.match(/(\d+\.?\d*)\s*cm\s*x\s*(\d+\.?\d*)\s*cm/i);
           if (lengthMatch) {
             value = lengthMatch[2] + 'cm';
           }
         }
         
         // 从spec中提取总长信息 (例如: "220m" -> "220m")
         if (field === 'total_length_m' || field === 'roll_length_m') {
           const lengthMatch = spec.match(/(\d+\.?\d*)\s*m/i);
           if (lengthMatch) {
             value = lengthMatch[1] + 'm';
           }
         }
         
         // 从spec中提取托盘信息 (例如: "180R/PL" -> "180")
         if (field === 'pcs_per_pallet_a') {
           const palletMatch = spec.match(/(\d+)\s*R\/PL/i);
           if (palletMatch) {
             value = palletMatch[1];
           }
         }
         
         if (value && value !== 'N/A') {
           console.log(`🔍 [CartTooltip] Extracted ${field} from spec:`, value);
         }
       }
     }
    
    if (value === null || value === undefined || value === '') {
      console.log(`🔍 [CartTooltip] Field ${field} not found, using fallback:`, fallback);
      return fallback;
    }
    
    console.log(`🔍 [CartTooltip] Field ${field} resolved to:`, value);
    return String(value);
  };

  const shouldShowBubbleDiameter = (): boolean => {
    const shape = safeGet('shape', '').toLowerCase();
    return shape.includes('bubble') || shape.includes('葫芦') || 
           shape.includes('mfb') || shape.includes('气泡');
  };

  const shouldShowField = (fieldName: string): boolean => {
    const value = safeGet(fieldName, '');
    return value !== 'N/A' && value !== '' && value !== 'To be filled';
  };

  return (
    <div className="consumable-tooltip">
      {/* 标题区域 - 包含图片和产品名称 */}
      <div className="tooltip-header">
        <div className="product-image">
          <img 
            src={cleanImageUrl(safeGet('package_image_url', item.image_url))} 
            alt={String(item.name || item.name_zh || item.name_en || item.code || '')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.startsWith('data:')) {
                target.src = placeholderImage;
              }
            }}
          />
        </div>
        <div className="product-title">
          <h4>{String(item.name || item.name_zh || item.name_en || item.code || '')}</h4>
          <div className="product-code">{String(item.code || item.part_number || item.id || '')}</div>
        </div>
      </div>
      
      {error && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700" style={{ margin: '0 16px 16px 16px' }}>
          ⚠️ {String(t('tooltip.apiError') || 'API调用失败，显示基础信息')}: {error}
        </div>
      )}
      
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
                  {isPaperMaterial(safeGet('material', ''))
                    ? safeGet('thickness', t('common.toBeFilled', 'To be filled'))
                    : (
                        isImperialUnit
                          ? safeGet('thickness_mil', safeGet('thickness', t('common.toBeFilled', 'To be filled')))
                          : safeGet('thickness_met', safeGet('thickness', t('common.toBeFilled', 'To be filled')))
                      )}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">
                  {isImperialUnit
                    ? t('tooltip.width.imperial', 'Width(inch)')
                    : t('tooltip.width.metric', 'Width(cm)')}
                </span>
                <span className="spec-value">
                  {isImperialUnit
                    ? safeGet('width_imp', safeGet('film_width_inch', t('common.toBeFilled', 'To be filled')))
                    : safeGet('width_met', safeGet('film_width_cm', t('common.toBeFilled', 'To be filled')))}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">
                  {isImperialUnit
                    ? t('tooltip.length.imperial', 'Length(inch)')
                    : t('tooltip.length.metric', 'Length(cm)')}
                </span>
                <span className="spec-value">
                  {isImperialUnit
                    ? safeGet('length_imp', safeGet('bag_length_inch', t('common.toBeFilled', 'To be filled')))
                    : safeGet('length_met', safeGet('bag_length_cm', t('common.toBeFilled', 'To be filled')))}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">
                  {isImperialUnit
                    ? t('tooltip.rollLength.imperial', 'Roll Length(ft)')
                    : t('tooltip.rollLength.metric', 'Roll Length(m)')}
                </span>
                <span className="spec-value">
                  {isImperialUnit
                    ? safeGet('roll_length_ft', safeGet('total_length_ft', t('common.toBeFilled', 'To be filled')))
                    : safeGet('roll_length_m', safeGet('total_length_m', t('common.toBeFilled', 'To be filled')))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：包装信息 */}
        <div className="right-column">
          {/* 包装信息 */}
          <div className="package-info-card">
            <h5 className="section-title">
              <span className="title-icon">📦</span>
              {t('tooltip.packageInfo', 'Package Information')}
            </h5>
            
            {/* 包装图片展示区域 */}
            {(() => {
              const packageImageUrl = safeGet('package_image_url', '');
              if (packageImageUrl !== 'N/A' && packageImageUrl !== '') {
                return (
                  <div className="package-image-section">
                    <div className="package-image-container">
                      <img 
                        src={cleanImageUrl(packageImageUrl)} 
                        alt={String(t('tooltip.packageImage') || '包装图片')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.startsWith('data:')) {
                            target.src = placeholderImage;
                          }
                        }}
                      />
                      <div className="image-label">{String(t('tooltip.packageImage') || '包装图片')}</div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="package-details">
              {(() => {
                const packageType = safeGet('package_type', '');
                const packagingType = safeGet('packaging_type', '');
                const salesUnit = safeGet('sales_unit', '');
                
                let displayValue = '';
                
                if (packageType !== 'N/A' && packageType !== '') {
                  switch (packageType.toLowerCase()) {
                    case 'roll':
                      displayValue = t('tooltip.rollPack', '卷装');
                      break;
                    case 'piece':
                      displayValue = t('tooltip.piecePack', '片装');
                      break;
                    case 'carton':
                      displayValue = t('tooltip.cartonPack', '纸箱装');
                      break;
                    case 'box':
                      displayValue = t('tooltip.boxPack', '盒装');
                      break;
                    default:
                      displayValue = packageType;
                  }
                } else if (packagingType !== 'N/A' && packagingType !== '') {
                  displayValue = packagingType;
                } else if (salesUnit !== 'N/A' && salesUnit !== '') {
                  displayValue = salesUnit === 'Carton' ? t('tooltip.cartonPack', '纸箱装') : salesUnit;
                }
                
                if (displayValue) {
                  return (
                    <div className="package-row">
                      <span className="package-label">{t('tooltip.packagingMethod', 'Packaging Method')}</span>
                      <span className="package-value">{displayValue}</span>
                    </div>
                  );
                }
                
                return null;
              })()}
              
              <div className="package-row">
                <span className="package-label">
                  {t('tooltip.packageSize', 'Package Size')}({isImperialUnit ? 'inch' : 'cm'}):
                </span>
                <span className="package-value">
                  {isImperialUnit
                    ? safeGet('package_size_inch', t('common.toBeFilled', 'To be filled'))
                    : safeGet('package_size_cm', t('common.toBeFilled', 'To be filled'))}
                </span>
              </div>
              
              <div className="package-row">
                <span className="package-label">
                  {t('tooltip.netWeight', 'Net Weight')}({isImperialUnit ? 'lbs' : 'kg'}):
                </span>
                <span className="package-value">
                  {isImperialUnit
                    ? safeGet('net_weight_lbs', t('common.toBeFilled', 'To be filled'))
                    : safeGet('net_weight_kg', t('common.toBeFilled', 'To be filled'))}
                </span>
              </div>
              
              <div className="package-row">
                <span className="package-label">{t('tooltip.pcsPerBox', 'Pcs per Box')}:</span>
                <span className="package-value">{safeGet('pcs_per_box', t('common.toBeFilled', 'To be filled'))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 备件专用tooltip组件
const SparePartTooltip: React.FC<{ item: any; userRegion?: string }> = ({ item, userRegion = 'cn' }) => {
  const { t, i18n } = useTranslation(['consumables', 'common']);
  const { getPreferredUnit } = useAuth();
  
  // 获取用户偏好单位制
  const preferredUnit = getPreferredUnit();
  const isImperialUnit = preferredUnit === 'imperial';
  
  // 智能字段值获取函数 - 支持公英制切换
  const getFieldValue = (baseFieldKey: string, unitType?: 'metric' | 'imperial'): string => {
    const currentUnit = unitType || (isImperialUnit ? 'imperial' : 'metric');
    
    // 构建字段名映射
    const fieldMappings: { [key: string]: { metric: string[]; imperial: string[] } } = {
      'package_size': {
        metric: ['package_size_cm', 'package_size', 'packaging_dim_cm', 'packaging_dim'],
        imperial: ['package_size_inch', 'package_size_in', 'packaging_dim_inch', 'packaging_dim_in']
      },
      'net_weight': {
        metric: ['net_weight_kg', 'net_weight', 'weight_kg'],
        imperial: ['net_weight_lbs', 'net_weight_lb', 'weight_lbs', 'weight_lb']
      }
    };
    
    // 获取当前单位制对应的字段名列表
    const fieldNames = fieldMappings[baseFieldKey] 
      ? fieldMappings[baseFieldKey][currentUnit]
      : [`${baseFieldKey}_${currentUnit === 'metric' ? 'cm' : 'inch'}`, `${baseFieldKey}_${currentUnit === 'metric' ? 'kg' : 'lbs'}`, baseFieldKey];
    
    // 通用字段路径
    const commonPaths = [baseFieldKey, `properties.${baseFieldKey}`, `specs.${baseFieldKey}`, `product.${baseFieldKey}`];
    
    // 合并所有可能的路径
    const allPaths = [...fieldNames, ...commonPaths];
    
    for (const fieldKey of allPaths) {
      const paths = [fieldKey, `properties.${fieldKey}`, `specs.${fieldKey}`, `product.${fieldKey}`];
      
      for (const path of paths) {
        const keys = path.split('.');
        let value = item;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = null;
            break;
          }
        }
        
        if (value !== null && value !== undefined && value !== '') {
          // 对于重量字段，格式化为两位小数
          if (baseFieldKey.includes('weight') || baseFieldKey.includes('net_weight')) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              return numValue.toFixed(2);
            }
          }
          return String(value);
        }
      }
    }
    
    return t('common.toBeFilled') || 'N/A';
  };

  // 获取单位后缀
  const getUnitSuffix = (fieldType: string): string => {
    const unitMappings: { [key: string]: { metric: string; imperial: string } } = {
      'dimension': { metric: 'cm', imperial: 'inch' },
      'weight': { metric: 'kg', imperial: 'lb' }
    };
    
    const mapping = unitMappings[fieldType];
    if (!mapping) return '';
    
    return isImperialUnit ? mapping.imperial : mapping.metric;
  };

  return (
    <div className="consumable-tooltip compact">
      <div className="tooltip-content-grid">
        <div className="package-info-card">
          <div className="package-details">
            <div className="package-row">
              <span className="package-label">
                🔧 {t('tooltip.applicableSN', '适配序列号')}:
              </span>
              <span className="package-value">
                {getFieldValue('app_sn') || getFieldValue('applicable_sn') || 'ALL'}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                📦 {t('tooltip.packageSize', '包装尺寸')}({getUnitSuffix('dimension')}):
              </span>
              <span className="package-value">
                {getFieldValue('package_size', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                ⚖️ {t('tooltip.netWeight', '净重')}({getUnitSuffix('weight')}):
              </span>
              <span className="package-value">
                {getFieldValue('net_weight', isImperialUnit ? 'imperial' : 'metric') || '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 配件tooltip组件 - 5个字段，支持多语言和公英制切换
const AccessoryTooltip: React.FC<{ item: any; userRegion?: string }> = ({ item, userRegion = 'cn' }) => {
  const { t, i18n } = useTranslation(['consumables', 'common']);
  const { getPreferredUnit } = useAuth();
  
  // 获取用户偏好单位制
  const preferredUnit = getPreferredUnit();
  const isImperialUnit = preferredUnit === 'imperial';
  
  // 智能字段值获取函数 - 支持公英制切换
  const getFieldValue = (baseFieldKey: string, unitType?: 'metric' | 'imperial'): string => {
    const currentUnit = unitType || (isImperialUnit ? 'imperial' : 'metric');
    
    // 构建字段名映射
    const fieldMappings: { [key: string]: { metric: string[]; imperial: string[] } } = {
      'package_size': {
        metric: ['package_size_cm', 'package_size', 'packaging_dim_cm', 'packaging_dim'],
        imperial: ['package_size_inch', 'package_size_in', 'packaging_dim_inch', 'packaging_dim_in']
      },
      'net_weight': {
        metric: ['net_weight_kg', 'net_weight', 'weight_kg'],
        imperial: ['net_weight_lbs', 'net_weight_lb', 'weight_lbs', 'weight_lb']
      },
      'package_gross_weight': {
        metric: ['package_gross_weight_kg', 'package_gross_weight', 'gross_weight_kg'],
        imperial: ['package_gross_weight_lbs', 'package_gross_weight_lb', 'gross_weight_lbs']
      },
      'pallet_height': {
        metric: ['pallet_height_cm', 'stacking_height_cm', 'pallet_height'],
        imperial: ['pallet_height_inch', 'stacking_height_inch', 'pallet_height_in']
      },
      'pallet_gross_weight': {
        metric: ['pallet_gross_weight_kg', 'pallet_weight_kg', 'pallet_gross_weight'],
        imperial: ['pallet_gross_weight_lbs', 'pallet_weight_lbs', 'pallet_gross_weight_lb']
      }
    };
    
    // 获取当前单位制对应的字段名列表
    const fieldNames = fieldMappings[baseFieldKey] 
      ? fieldMappings[baseFieldKey][currentUnit]
      : [`${baseFieldKey}_${currentUnit === 'metric' ? 'cm' : 'inch'}`, `${baseFieldKey}_${currentUnit === 'metric' ? 'kg' : 'lbs'}`, baseFieldKey];
    
    // 通用字段路径
    const commonPaths = [baseFieldKey, `properties.${baseFieldKey}`, `specs.${baseFieldKey}`, `product.${baseFieldKey}`];
    
    // 合并所有可能的路径
    const allPaths = [...fieldNames, ...commonPaths];
    
    for (const fieldKey of allPaths) {
      const paths = [fieldKey, `properties.${fieldKey}`, `specs.${fieldKey}`, `product.${fieldKey}`];
      
      for (const path of paths) {
        const keys = path.split('.');
        let value = item;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = null;
            break;
          }
        }
        
        if (value !== null && value !== undefined && value !== '') {
          // 对于重量字段，格式化为两位小数
          if (baseFieldKey.includes('weight')) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              return numValue.toFixed(2); // 显示两位小数，如10.00
            }
          }
          return String(value);
        }
      }
    }
    
    return t('common.toBeFilled') || 'N/A';
  };

  // 获取单位后缀
  const getUnitSuffix = (fieldType: string): string => {
    const unitMappings: { [key: string]: { metric: string; imperial: string } } = {
      'dimension': { metric: 'cm', imperial: 'inch' },
      'weight': { metric: 'kg', imperial: 'lb' }
    };
    
    const mapping = unitMappings[fieldType];
    if (!mapping) return '';
    
    return isImperialUnit ? mapping.imperial : mapping.metric;
  };

  return (
    <div className="consumable-tooltip">
      <div className="tooltip-content-grid">
        <div className="package-info-card">
          <div className="package-details">
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Packaging Dim.' : '包装尺寸'}({getUnitSuffix('dimension')}):
              </span>
              <span className="package-value">
                {getFieldValue('package_size', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Net Weight' : '单件净重'}({getUnitSuffix('weight')}):
              </span>
              <span className="package-value">
                {getFieldValue('net_weight', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Gross Weight' : '包装毛重'}({getUnitSuffix('weight')}):
              </span>
              <span className="package-value">
                {getFieldValue('package_gross_weight', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Pallet Height' : '打托高度'}({getUnitSuffix('dimension')}):
              </span>
              <span className="package-value">
                {getFieldValue('pallet_height', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'GW per Pallet' : '整托毛重'}({getUnitSuffix('weight')}):
              </span>
              <span className="package-value">
                {getFieldValue('pallet_gross_weight', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主机tooltip组件 - 4个字段，支持多语言和公英制切换
const MachineTooltip: React.FC<{ item: any; userRegion?: string }> = ({ item, userRegion = 'cn' }) => {
  const { t, i18n } = useTranslation(['consumables', 'common']);
  const { getPreferredUnit } = useAuth();
  
  // 获取用户偏好单位制
  const preferredUnit = getPreferredUnit();
  const isImperialUnit = preferredUnit === 'imperial';
  
  // 智能字段值获取函数 - 支持公英制切换
  const getFieldValue = (baseFieldKey: string, unitType?: 'metric' | 'imperial'): string => {
    const currentUnit = unitType || (isImperialUnit ? 'imperial' : 'metric');
    
    // 构建字段名映射
    const fieldMappings: { [key: string]: { metric: string[]; imperial: string[] } } = {
      'package_size': {
        metric: ['package_size_cm', 'package_size', 'packaging_dim_cm', 'packaging_dim'],
        imperial: ['package_size_inch', 'package_size_in', 'packaging_dim_inch', 'packaging_dim_in']
      },
      'net_weight': {
        metric: ['net_weight_kg', 'net_weight', 'weight_kg'],
        imperial: ['net_weight_lbs', 'net_weight_lb', 'weight_lbs', 'weight_lb']
      },
      'package_gross_weight': {
        metric: ['package_gross_weight_kg', 'package_gross_weight', 'gross_weight_kg'],
        imperial: ['package_gross_weight_lbs', 'package_gross_weight_lb', 'gross_weight_lbs']
      },
      'pallet_height': {
        metric: ['pallet_height_cm', 'stacking_height_cm', 'pallet_height'],
        imperial: ['pallet_height_inch', 'stacking_height_inch', 'pallet_height_in']
      },
      'pallet_gross_weight': {
        metric: ['pallet_gross_weight_kg', 'pallet_weight_kg', 'pallet_gross_weight'],
        imperial: ['pallet_gross_weight_lbs', 'pallet_weight_lbs', 'pallet_gross_weight_lb']
      }
    };
    
    // 获取当前单位制对应的字段名列表
    const fieldNames = fieldMappings[baseFieldKey] 
      ? fieldMappings[baseFieldKey][currentUnit]
      : [`${baseFieldKey}_${currentUnit === 'metric' ? 'cm' : 'inch'}`, `${baseFieldKey}_${currentUnit === 'metric' ? 'kg' : 'lbs'}`, baseFieldKey];
    
    // 通用字段路径
    const commonPaths = [baseFieldKey, `properties.${baseFieldKey}`, `specs.${baseFieldKey}`, `product.${baseFieldKey}`];
    
    // 合并所有可能的路径
    const allPaths = [...fieldNames, ...commonPaths];
    
    for (const fieldKey of allPaths) {
      const paths = [fieldKey, `properties.${fieldKey}`, `specs.${fieldKey}`, `product.${fieldKey}`];
      
      for (const path of paths) {
        const keys = path.split('.');
        let value = item;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = null;
            break;
          }
        }
        
        if (value !== null && value !== undefined && value !== '') {
          // 对于重量字段，格式化为两位小数
          if (baseFieldKey.includes('weight')) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              return numValue.toFixed(2); // 显示两位小数，如10.00
            }
          }
          return String(value);
        }
      }
    }
    
    return t('common.toBeFilled') || 'N/A';
  };

  // 获取单位后缀
  const getUnitSuffix = (fieldType: string): string => {
    const unitMappings: { [key: string]: { metric: string; imperial: string } } = {
      'dimension': { metric: 'cm', imperial: 'inch' },
      'weight': { metric: 'kg', imperial: 'lb' }
    };
    
    const mapping = unitMappings[fieldType];
    if (!mapping) return '';
    
    return isImperialUnit ? mapping.imperial : mapping.metric;
  };

  return (
    <div className="consumable-tooltip">
      <div className="tooltip-content-grid">
        <div className="package-info-card">
          <div className="package-details">
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Packaging Dim.' : '包装尺寸'}({getUnitSuffix('dimension')}):
              </span>
              <span className="package-value">
                {getFieldValue('package_size', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Net Weight' : '单件净重'}({getUnitSuffix('weight')}):
              </span>
              <span className="package-value">
                {getFieldValue('net_weight', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'Pallet Height' : '打托高度'}({getUnitSuffix('dimension')}):
              </span>
              <span className="package-value">
                {getFieldValue('pallet_height', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
            <div className="package-row">
              <span className="package-label">
                {i18n.language === 'en' ? 'GW per Pallet' : '整托毛重'}({getUnitSuffix('weight')}):
              </span>
              <span className="package-value">
                {getFieldValue('pallet_gross_weight', isImperialUnit ? 'imperial' : 'metric')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主要的CartTooltip组件
const CartTooltip: React.FC<CartTooltipProps> = ({ item, userRegion = 'cn', placement = 'topRight', children }) => {
  // 检测产品类型
  const detectProductType = (item: any): string => {
    // 1. 优先检查明确的产品类型字段
    if (item.product_type) {
      return item.product_type.toLowerCase();
    }
    
    if (item.type) {
      return item.type.toLowerCase();
    }
    
    // 2. 基于特征字段检测
    if (item.material || item.thickness || item.bubble_diameter) {
      return 'consumable';
    }
    
    if (item.voltage || item.frequency) {
      return item.power ? 'machine' : 'accessory';
    }
    
    // 3. 基于表名推断
    if (item.table_name) {
      const tableName = item.table_name.toLowerCase();
      if (tableName.includes('consumable')) return 'consumable';
      if (tableName.includes('machine') || tableName.includes('host')) return 'machine';
      if (tableName.includes('accessory')) return 'accessory';
      if (tableName.includes('spare')) return 'spare_part';
    }
    
    // 4. 默认为备件
    return 'spare_part';
  };

  const productType = detectProductType(item);

  // 渲染tooltip内容
  const renderTooltipContent = () => {
    // 对于耗材，使用完整的耗材tooltip
    if (productType === 'consumable') {
      return <ConsumableTooltipContent item={item} userRegion={userRegion} />;
    }

    // 对于备件，使用专门的备件tooltip
    if (productType === 'spare_part') {
      return <SparePartTooltip item={item} userRegion={userRegion} />;
    }

    // 对于配件，使用5个字段的配件tooltip
    if (productType === 'accessory') {
      return <AccessoryTooltip item={item} userRegion={userRegion} />;
    }

    // 对于主机，使用4个字段的主机tooltip
    return <MachineTooltip item={item} userRegion={userRegion} />;
  };

  return (
    <Tooltip
      title={renderTooltipContent()}
      placement={placement}
      trigger="hover"
      overlayClassName="consumables-custom-tooltip"
      mouseEnterDelay={0.3}
      destroyTooltipOnHide={true}
    >
      {children}
    </Tooltip>
  );
};

export default CartTooltip; 