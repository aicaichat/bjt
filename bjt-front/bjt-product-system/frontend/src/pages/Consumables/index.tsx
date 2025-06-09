import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// 新增：导入标准化字段显示组件
import { 
  ConsumableProductList, 
  ConsumableCartItem, 
  ConsumableTooltip,
  ConsumablePOPage,
  ConsumableFields
} from '../../components/ConsumableFieldDisplay';
import { useConsumableFieldDisplay } from '../../hooks/useConsumableFieldDisplay';
import { CONSUMABLE_DISPLAY_CONFIG } from '../../config/consumable-display-config';

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
  FilterOptionsType,
  FilterOptionItem
} from '../../services/consumablesService';
import { DEFAULT_REGION } from '../../config/env';
import { REGIONS, getCurrencySymbol } from '../../config/constants';
import { ASSETS } from '../../config/appConfig';
import './Consumables.css';

// 在文件顶部的import部分添加
import { adminSpecificationService, SpecificationData } from '../../admin/services/admin-dictionary.service';
import './consumables.scss'; // 引入Premium样式

const { Option } = Select;

// Define interface for regional prices
interface RegionPrices {
  eu: number;
  na: number;
  au: number;
  cn: number;
}

// 使用内联SVG数据URI作为占位图片，避免404请求
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCA0MEg1NlY0OEgyNFY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+ZxGQ9Ik0zMiAzMkgzMFYzNEgzMlYzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
const shapePlaceholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMEg1NlYzOEgyNFYzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
const dimensionGuidePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDQ4MCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0ODAiIGhlaWdodD0iMjIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTEwSDI4MFYxMzBIMjAwVjExMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
const infoIconPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2QjdCODQiLz4KPHBhdGggZD0iTTEyIDhIMTJWMTZIMTJWOFoiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNiIgcj0iMSIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';

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

// 工具函数：清理图片路径，去除多余引号并标准化斜杠
function cleanImageUrl(url: string | undefined | null): string {
  if (!url) return placeholderImage;
  let fixed = url.trim().replace(/^'+|'+$/g, '').replace(/\\/g, '/');
  // 修正错误的 /assets/images/ 前缀
  fixed = fixed.replace(/^\/assets\/images\//, '/images/');
  if (!fixed.startsWith('/')) fixed = '/' + fixed;
  // 如果没有扩展名，自动补 .png
  if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(fixed)) {
    fixed += '.png';
  }
  
  console.log('🖼️ [Image URL] 处理结果:', {
    original: url,
    cleaned: fixed
  });
  return fixed;
}

// 动态Tooltip内容组件
interface ConsumableTooltipContentProps {
  item: ConsumableProduct;
  userRegion: string;
}

// 字段分组配置
const TOOLTIP_FIELD_GROUPS = {
  BASIC_INFO: {
    title: { zh: '基础信息', en: 'Basic Information' },
    icon: '📋',
    fields: ['app_model', 'name', 'shape', 'material'],
    priority: 1
  },
  
  SPECIFICATIONS: {
    title: { zh: '规格参数', en: 'Specifications' },
    icon: '📏',
    fields: ['thickness', 'width', 'length', 'bubble_diameter'],
    priority: 2
  },
  
  PACKAGING: {
    title: { zh: '包装信息', en: 'Packaging Details' },
    icon: '📦',
    fields: ['package_size', 'unit_weight', 'pcs_per_box', 'packaging_type'],
    priority: 3
  },
  
  PALLET_INFO: {
    title: { zh: '打托信息', en: 'Pallet Information' },
    icon: '🏗️',
    fields: [
      'pallet_size', 'pallet_rolls_a', 'pallet_weight_a', 'pallet_height_a',
      'pallet_rolls_b', 'pallet_weight_b', 'pallet_height_b',
      'pallet_rolls_c', 'pallet_weight_c', 'pallet_height_c'
    ],
    priority: 4
  },
  
  TECHNICAL: {
    title: { zh: '技术参数', en: 'Technical Details' },
    icon: '⚙️',
    fields: ['core_diameter', 'roll_length', 'total_length'],
    priority: 5
  }
};

// 单个字段组件
const TooltipField = ({ fieldKey, label, value }: { fieldKey: string; label: string; value: string }) => {
  const hasUnit = label.includes('(') && label.includes(')');
  const isNumeric = /^\d+(\.\d+)?$/.test(value);
  const isEmpty = !value || value === 'N/A' || value === '';
  
  return (
    <div className="tooltip-field">
      <span 
        className="field-label" 
        data-has-unit={hasUnit}
      >
        {label}
      </span>
      <span 
        className="field-value"
        data-field-type={isNumeric ? 'numeric' : 'text'}
        data-empty={isEmpty}
      >
        {isEmpty ? '' : value}
      </span>
    </div>
  );
};

// 保持向后兼容的原始Tooltip组件
const ConsumableTooltipContent: React.FC<ConsumableTooltipContentProps> = ({ item, userRegion }) => {
  // 检查是否启用Premium设计
  const usePremiumTooltip = import.meta.env.VITE_USE_PREMIUM_TOOLTIP !== 'false'; // 默认启用
  
  // 暂时注释掉PremiumTooltipContent，因为它未定义
  // if (usePremiumTooltip) {
  //   return <PremiumTooltipContent item={item} userRegion={userRegion} />;
  // }
  
  // 原有的Tooltip逻辑保持不变 (向后兼容)
  const { t, i18n } = useTranslation(['consumables', 'common']);
  
  // 🔥 强制设置英语显示
  React.useEffect(() => {
    if (i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }
  }, [i18n]);
  
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // 使用useRef防止重复请求
  const isRequestInProgress = useRef(false);
  const requestTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // 清理之前的超时
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }

    const fetchDetailData = async () => {
      // 防止重复请求
      if (isRequestInProgress.current) {
        console.log('🚫 [ConsumableTooltipContent] Request already in progress, skipping');
        return;
      }
      
      if (!item.id) {
        console.warn('⚠️ [ConsumableTooltipContent] No item ID found:', item);
        setDebugInfo(`${String(t('ui.noProductId') || '无产品ID信息')}: ${JSON.stringify(item, null, 2)}`);
        return;
      }

      // 添加防抖延迟
      requestTimeoutRef.current = setTimeout(async () => {
        isRequestInProgress.current = true;
        setLoading(true);
        setError(null);
        setDebugInfo('');

        try {
          console.log('🔍 [ConsumableTooltipContent] Fetching details for item ID:', item.id);
          
          // 使用现有的WordPress API URL格式和item.id
          const token = localStorage.getItem('auth_token');
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
          const apiUrl = `${baseUrl}/consumables/${item.id}?lang=${navigator.language.startsWith('zh') ? 'zh' : 'en'}&region=${userRegion}`;
          
          console.log('🔍 [ConsumableTooltipContent] API URL:', apiUrl);
          setDebugInfo(`API调用: ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
          
          console.log('🔍 [ConsumableTooltipContent] Response status:', response.status);
          setDebugInfo(prev => `${prev}\nHTTP状态: ${response.status}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const jsonData = await response.json();
          console.log('✅ [ConsumableTooltipContent] Detail data loaded:', jsonData);
          
          // 添加详细的数据结构调试信息
          setDebugInfo(prev => `${prev}\nAPI原始响应: ${JSON.stringify(jsonData, null, 2)}`);
          
          let finalData = null;
          
          if (jsonData.success && jsonData.data) {
            finalData = jsonData.data;
          } else if (jsonData.data) {
            finalData = jsonData.data;
          } else if (Array.isArray(jsonData) && jsonData.length > 0) {
            finalData = jsonData[0];
          } else if (jsonData && typeof jsonData === 'object') {
            finalData = jsonData;
          } else {
            throw new Error('No valid data structure found in API response');
          }
          
          console.log('🔍 [ConsumableTooltipContent] Final mapped data:', finalData);
          setDebugInfo(prev => `${prev}\n最终数据: ${JSON.stringify(finalData, null, 2)}`);
          setDetailData(finalData);
          
        } catch (err: any) {
          console.error('❌ [ConsumableTooltipContent] Failed to fetch detail data:', err);
          setError(err.message || 'Failed to fetch detail data');
          setDebugInfo(prev => `${prev}\n错误信息: ${err.message}`);
          
          // 使用基础数据作为fallback
          const fallbackData = {
            // 基本信息
            material: item.specs?.material || 'N/A',
            thickness: item.specs?.thickness || 'N/A',
            width: item.specs?.width || 'N/A',
            width_cm: item.specs?.width || 'N/A',
            width_inch: item.specs?.width || 'N/A',
            length: item.specs?.length || 'N/A',
            length_cm: item.specs?.length || 'N/A',
            length_inch: item.specs?.length || 'N/A',
            rollLength: item.specs?.rollLength || 'N/A',
            roll_length_m: item.specs?.rollLength || 'N/A',
            roll_length_ft: item.specs?.rollLength || 'N/A',
            
            // 包装属性
            packaging_type: String(t('tooltip.cartonPack') || 'Carton Pack'),
            package_size_cm: String(t('common.toBeFilled') || 'To be filled'),
            package_size_inch: String(t('common.toBeFilled') || 'To be filled'),
            unit_weight_kg: String(t('common.toBeFilled') || 'To be filled'),
            unit_weight_lbs: String(t('common.toBeFilled') || 'To be filled'),
            pallet_size_cm: String(t('common.toBeFilled') || 'To be filled'),
            package_image_url: '',
            
            // 打托属性
            pallet_rolls_a: String(t('common.toBeFilled') || 'To be filled'),
            pallet_weight_a_kg: String(t('common.toBeFilled') || 'To be filled'),
            pallet_weight_a_lbs: String(t('common.toBeFilled') || 'To be filled'),
            pallet_height_a_cm: String(t('common.toBeFilled') || 'To be filled'),
            pallet_height_a_inch: String(t('common.toBeFilled') || 'To be filled'),
            pallet_rolls_b: String(t('common.toBeFilled') || 'To be filled'),
            pallet_weight_b_kg: String(t('common.toBeFilled') || 'To be filled'),
            pallet_weight_b_lbs: String(t('common.toBeFilled') || 'To be filled'),
            pallet_height_b_cm: String(t('common.toBeFilled') || 'To be filled'),
            pallet_height_b_inch: String(t('common.toBeFilled') || 'To be filled'),
            pallet_rolls_c: String(t('common.toBeFilled') || 'To be filled'),
            pallet_weight_c_kg: String(t('common.toBeFilled') || 'To be filled'),
            pallet_weight_c_lbs: String(t('common.toBeFilled') || 'To be filled'),
            pallet_height_c_cm: String(t('common.toBeFilled') || 'To be filled'),
            pallet_height_c_inch: String(t('common.toBeFilled') || 'To be filled'),
            core_diameter_cm: String(t('common.toBeFilled') || 'To be filled'),
            core_diameter_inch: String(t('common.toBeFilled') || 'To be filled')
          };
          setDetailData(fallbackData);
          setDebugInfo(prev => `${prev}\n使用Fallback数据: ${JSON.stringify(fallbackData, null, 2)}`);
        } finally {
          setLoading(false);
          isRequestInProgress.current = false;
        }
      }, 300); // 300ms 防抖延迟
    };

    fetchDetailData();
    
    // 清理函数
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      isRequestInProgress.current = false;
    };
  }, [item.id]); // 移除userRegion依赖，避免频繁重复请求

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Spin size="small" />
          <span className="ml-2 text-gray-600">{String(t('ui.loadingDetails') || '加载详细信息中...')}</span>
        </div>
      </div>
    );
  }

  const data = detailData || {};
  
  // 安全获取数据的辅助函数
  const safeGet = (field: string, fallback: string = 'N/A'): string => {
    let value = data[field];
    
    // 如果直接字段不存在，尝试从specs中获取
    if ((value === null || value === undefined || value === '') && data.specs) {
      value = data.specs[field];
    }
    
    // 特殊字段映射 - 完整的33个字段映射
    const fieldMappings: { [key: string]: string[] } = {
      // 基本信息映射
      'material': ['material', 'specs.material'],
      'thickness': ['thickness', 'specs.thickness', 'thickness_met', 'thickness_imp'], 
      'width': ['width', 'specs.width', 'width_met', 'width_imp'],
      'length': ['length', 'specs.length', 'length_met', 'length_imp'],
      'rollLength': ['rollLength', 'specs.rollLength', 'total_length_met', 'total_length_imp'],
      'shape': ['shape', 'specs.shape'],
      
      // 单位转换字段映射
      'width_cm': ['width_met', 'width_met_val', 'specs.width', 'width'],
      'width_inch': ['width_imp', 'width_imp_val', 'specs.width_imperial', 'model_imperial'],
      'length_cm': ['length_met', 'length_met_val', 'specs.length', 'length'],
      'length_inch': ['length_imp', 'length_imp_val', 'specs.length_imperial', 'model_imperial'],
      'roll_length_m': ['total_length_met', 'total_length_met_val', 'specs.rollLength', 'rollLength'],
      'roll_length_ft': ['total_length_imp', 'total_length_imp_val', 'specs.rollLength_imperial', 'model_imperial'],
      
      // 🔥 新增：产品标识字段
      'part_number': ['part_number', 'code', 'product_code', 'specs.part_number'],
      'model': ['model', 'model_met', 'specs.model'],
      'model_imperial': ['model_imperial', 'model_imp', 'specs.model_imperial'],
      'spec': ['spec', 'spec_met', 'specs.spec'],
      'spec_imperial': ['spec_imperial', 'spec_imp', 'specs.spec_imperial'],
      'brand': ['brand', 'specs.brand'],
      
      // 🔥 新增：泡径字段（条件显示）
      'bubble_diameter_met': ['bubble_diameter_met', 'specs.bubble_diameter_met'],
      'bubble_diameter_inch': ['bubble_diameter_inch', 'specs.bubble_diameter_inch'],
      
      // 包装属性映射
      'packaging_type': ['package_type', 'packaging_type', 'sales_unit', 'specs.package_type'],
      'package_size_cm': ['package_size_cm', 'specs.package_size_cm'],
      'package_size_inch': ['package_size_inch', 'specs.package_size_inch'],
      'unit_weight_kg': ['net_weight_kg', 'unit_weight_kg', 'specs.net_weight_kg'],
      'unit_weight_lbs': ['net_weight_lbs', 'unit_weight_lbs', 'specs.net_weight_lbs'],
      // 🔥 新增：包装毛重和单箱数量
      'package_gross_weight_kg': ['package_gross_weight_kg', 'gross_weight_kg', 'specs.package_gross_weight_kg'],
      'package_gross_weight_lbs': ['package_gross_weight_lbs', 'gross_weight_lbs', 'specs.package_gross_weight_lbs'],
      'pcs_per_box': ['pcs_per_box', 'per_box', 'box_quantity', 'specs.pcs_per_box'],
      'pallet_size_cm': ['pallet_size_cm', 'specs.pallet_size_cm'],
      'package_image_url': ['package_image_url', 'packaging_image', 'specs.package_image_url'],
      
      // 打托属性映射
      'pallet_rolls_a': ['pcs_per_pallet_a', 'pallet_rolls_a', 'specs.pcs_per_pallet_a'],
      'pallet_weight_a_kg': ['pallet_gross_weight_a_kg', 'specs.pallet_gross_weight_a_kg'],
      'pallet_weight_a_lbs': ['pallet_gross_weight_a_lbs', 'specs.pallet_gross_weight_a_lbs'],
      'pallet_height_a_cm': ['pallet_height_a_cm', 'specs.pallet_height_a_cm'],
      'pallet_height_a_inch': ['pallet_height_a_inch', 'specs.pallet_height_a_inch'],
      'pallet_rolls_b': ['pcs_per_pallet_b', 'pallet_rolls_b', 'specs.pcs_per_pallet_b'],
      'pallet_weight_b_kg': ['pallet_gross_weight_b_kg', 'specs.pallet_gross_weight_b_kg'],
      'pallet_weight_b_lbs': ['pallet_gross_weight_b_lbs', 'specs.pallet_gross_weight_b_lbs'],
      'pallet_height_b_cm': ['pallet_height_b_cm', 'specs.pallet_height_b_cm'],
      'pallet_height_b_inch': ['pallet_height_b_inch', 'specs.pallet_height_b_inch'],
      'pallet_rolls_c': ['pcs_per_pallet_c', 'pallet_rolls_c', 'specs.pcs_per_pallet_c'],
      'pallet_weight_c_kg': ['pallet_gross_weight_c_kg', 'specs.pallet_gross_weight_c_kg'],
      'pallet_weight_c_lbs': ['pallet_gross_weight_c_lbs', 'specs.pallet_gross_weight_c_lbs'],
      'pallet_height_c_cm': ['pallet_height_c_cm', 'specs.pallet_height_c_cm'],
      'pallet_height_c_inch': ['pallet_height_c_inch', 'specs.pallet_height_c_inch'],
      'core_diameter_cm': ['tube_inner_diameter_cm', 'core_diameter_cm', 'specs.tube_inner_diameter_cm'],
      'core_diameter_inch': ['tube_inner_diameter_inch', 'core_diameter_inch', 'specs.tube_inner_diameter_inch']
    };
    
    // 尝试映射字段
    if (fieldMappings[field]) {
      for (const mappedField of fieldMappings[field]) {
        let mappedValue;
        
        // 处理嵌套字段如 'specs.width'
        if (mappedField.includes('.')) {
          const [parentKey, childKey] = mappedField.split('.');
          mappedValue = data[parentKey]?.[childKey];
        } else {
          mappedValue = data[mappedField];
        }
        
        if (mappedValue !== null && mappedValue !== undefined && mappedValue !== '') {
          value = mappedValue;
          break;
        }
      }
    }
    
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    return String(value);
  };

  // 🔥 新增：条件显示逻辑
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
      {/* 标题区域 */}
      <div className="tooltip-header">
        <div className="product-image">
          <img 
            src={cleanImageUrl(item.image_url)} 
            alt={String(item.name || '')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.startsWith('data:')) {
                target.src = placeholderImage;
              }
            }}
          />
        </div>
        <div className="product-title">
          <h4>{String(item.name || '')}</h4>
          <div className="product-code">{String(item.code || item.id || '')}</div>
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
                  {userRegion === 'na' || userRegion === 'au' ? 
                    t('tooltip.thickness.imperial', 'Thickness(mil)') : 
                    t('tooltip.thickness.metric', 'Thickness(μm)')
                  }
                </span>
                <span className="spec-value">
                  {(() => {
                    if (userRegion === 'na' || userRegion === 'au') {
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
                  {userRegion === 'na' || userRegion === 'au' ? 
                    t('tooltip.dimensions.imperial', 'Dimensions(inch)') : 
                    t('tooltip.dimensions.metric', 'Dimensions(cm)')
                  }
                </span>
                <span className="spec-value">
                  {(() => {
                    const width = userRegion === 'na' || userRegion === 'au' ? 
                      safeGet('width_imp', safeGet('width', '')) : 
                      safeGet('width_met', safeGet('width', ''));
                    const length = userRegion === 'na' || userRegion === 'au' ? 
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
                    {userRegion === 'na' || userRegion === 'au' ? 
                      t('tooltip.bubbleDiameter.imperial', 'Bubble Diameter(inch)') : 
                      t('tooltip.bubbleDiameter.metric', 'Bubble Diameter(cm)')
                    }
                  </span>
                  <span className="spec-value">
                    {(() => {
                      if (userRegion === 'na' || userRegion === 'au') {
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
                const weightA = safeGet(userRegion === 'na' || userRegion === 'au' ? 'pallet_gross_weight_a_lbs' : 'pallet_gross_weight_a_kg', '');
                
                if (pcsA !== 'N/A' && pcsA !== '' && weightA !== 'N/A' && weightA !== '') {
                  return (
                    <div className="pallet-config-row">
                      <span className="config-label">{t('tooltip.configA', 'Configuration A')}</span>
                      <span className="config-value">{pcsA}卷 | {weightA}{userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'}</span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* 配置B */}
              {(() => {
                const pcsB = safeGet('pcs_per_pallet_b', '');
                const weightB = safeGet(userRegion === 'na' || userRegion === 'au' ? 'pallet_gross_weight_b_lbs' : 'pallet_gross_weight_b_kg', '');
                
                if (pcsB !== 'N/A' && pcsB !== '' && weightB !== 'N/A' && weightB !== '') {
                  return (
                    <div className="pallet-config-row">
                      <span className="config-label">{t('tooltip.configB', 'Configuration B')}</span>
                      <span className="config-value">{pcsB}卷 | {weightB}{userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'}</span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* 配置C */}
              {(() => {
                const pcsC = safeGet('pcs_per_pallet_c', '');
                const weightC = safeGet(userRegion === 'na' || userRegion === 'au' ? 'pallet_gross_weight_c_lbs' : 'pallet_gross_weight_c_kg', '');
                
                if (pcsC !== 'N/A' && pcsC !== '' && weightC !== 'N/A' && weightC !== '') {
                  return (
                    <div className="pallet-config-row">
                      <span className="config-label">{t('tooltip.configC', 'Configuration C')}</span>
                      <span className="config-value">{pcsC}卷 | {weightC}{userRegion === 'na' || userRegion === 'au' ? 'lbs' : 'kg'}</span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* 托盘尺寸 */}
              {(() => {
                const palletSize = safeGet(userRegion === 'na' || userRegion === 'au' ? 'pallet_size_inch' : 'pallet_size_cm', '');
                if (palletSize !== 'N/A' && palletSize !== '') {
                  return (
                    <div className="pallet-config-row">
                      <span className="config-label">{t('tooltip.palletSize', 'Pallet Size')}</span>
                      <span className="config-value">{palletSize}</span>
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
                <span className="package-label">{t('tooltip.packagingMethod', 'Packaging Method')}</span>
                <span className="package-value">
                  {(() => {
                    const packagingType = safeGet('packaging_type', '');
                    const salesUnit = safeGet('sales_unit', '');
                    if (packagingType !== 'N/A' && packagingType !== '') {
                      return packagingType;
                    } else if (salesUnit !== 'N/A' && salesUnit !== '') {
                      return salesUnit === 'Carton' ? t('tooltip.cartonPack', 'Carton Pack') : salesUnit;
                    }
                    return t('tooltip.cartonPack', 'Carton Pack');
                  })()}
                </span>
              </div>
              <div className="package-row">
                <span className="package-label">{t('tooltip.pcsPerBox', 'Pieces per Box')}</span>
                <span className="package-value">
                  {(() => {
                    const pcsPerBox = safeGet('pcs_per_box', '');
                    return pcsPerBox !== 'N/A' && pcsPerBox !== '' ? pcsPerBox : t('common.toBeFilled', 'To be filled');
                  })()}
                </span>
              </div>
              <div className="package-row">
                <span className="package-label">
                  {userRegion === 'na' || userRegion === 'au' ? 
                    t('tooltip.unitWeight.imperial', 'Unit Weight(lbs)') : 
                    t('tooltip.unitWeight.metric', 'Unit Weight(kg)')
                  }
                </span>
                <span className="package-value">
                  {(() => {
                    const weightField = userRegion === 'na' || userRegion === 'au' ? 'net_weight_lbs' : 'net_weight_kg';
                    const weight = safeGet(weightField, '');
                    return weight !== 'N/A' && weight !== '' ? weight : t('common.toBeFilled', 'To be filled');
                  })()}
                </span>
              </div>
              <div className="package-row">
                <span className="package-label">
                  {userRegion === 'na' || userRegion === 'au' ? 
                    t('tooltip.totalLength.imperial', 'Total Length(ft)') : 
                    t('tooltip.totalLength.metric', 'Total Length(m)')
                  }
                </span>
                <span className="package-value">
                  {(() => {
                    if (userRegion === 'na' || userRegion === 'au') {
                      const totalLengthFt = safeGet('total_length_ft', '');
                      const rollLengthFt = safeGet('roll_length_ft', '');
                      const rollLength = safeGet('rollLength', '');
                      if (totalLengthFt !== 'N/A' && totalLengthFt !== '') {
                        return totalLengthFt;
                      } else if (rollLengthFt !== 'N/A' && rollLengthFt !== '') {
                        return rollLengthFt;
                      } else if (rollLength !== 'N/A' && rollLength !== '') {
                        return rollLength;
                      }
                      return 'N/A';
                    } else {
                      const totalLengthM = safeGet('total_length_m', '');
                      const rollLengthM = safeGet('roll_length_m', '');
                      const rollLength = safeGet('rollLength', '');
                      if (totalLengthM !== 'N/A' && totalLengthM !== '') {
                        return totalLengthM;
                      } else if (rollLengthM !== 'N/A' && rollLengthM !== '') {
                        return rollLengthM;
                      } else if (rollLength !== 'N/A' && rollLength !== '') {
                        return rollLength;
                      }
                      return 'N/A';
                    }
                  })()}
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
              {(() => {
                const tubeField = userRegion === 'na' || userRegion === 'au' ? 'tube_inner_diameter_inch' : 'tube_inner_diameter_cm';
                const tubeDiameter = safeGet(tubeField, '');
                const packageSize = safeGet(userRegion === 'na' || userRegion === 'au' ? 'package_size_inch' : 'package_size_cm', '');
                
                if (tubeDiameter !== 'N/A' && tubeDiameter !== '') {
                  return (
                    <div className="tech-param-row">
                      <span className="param-label">
                        {userRegion === 'na' || userRegion === 'au' ? 
                          t('tooltip.tubeInnerDiameter.imperial', 'Core Diameter(inch)') : 
                          t('tooltip.tubeInnerDiameter.metric', 'Core Diameter(cm)')
                        }
                      </span>
                      <span className="param-value">{tubeDiameter}</span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {(() => {
                const packageSize = safeGet(userRegion === 'na' || userRegion === 'au' ? 'package_size_inch' : 'package_size_cm', '');
                if (packageSize !== 'N/A' && packageSize !== '') {
                  return (
                    <div className="tech-param-row">
                      <span className="param-label">
                        {userRegion === 'na' || userRegion === 'au' ? 
                          t('tooltip.packageSize.imperial', 'Package Size(inch)') : 
                          t('tooltip.packageSize.metric', 'Package Size(cm)')
                        }
                      </span>
                      <span className="param-value">{packageSize}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 新增：标准化产品项展示组件
interface StandardConsumableItemProps {
  item: ConsumableProduct;
  userRegion: string;
  index: number;
  onAddToCart: (itemId: string, buttonElement?: HTMLElement) => void;
  onQuantityChange: (itemId: string, value: number) => void;
  quantities: Record<string, number>;
  getCurrencySymbolByRegion: () => string;
  getRegionalPrice: (product: ConsumableProduct, quantity: number) => number;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const StandardConsumableItem: React.FC<StandardConsumableItemProps> = ({
  item,
  userRegion,
  index,
  onAddToCart,
  onQuantityChange,
  quantities,
  getCurrencySymbolByRegion,
  getRegionalPrice,
  handleImageError
}) => {
  const { t } = useTranslation(['consumables', 'common']);
  const { 
    getLocalizedValue, 
    shouldShowField, 
    getFieldLabel,
    isImperial 
  } = useConsumableFieldDisplay();
  
  // 获取标准化字段配置
  const fieldsToDisplay = CONSUMABLE_DISPLAY_CONFIG.STANDARD_FIELDS.PRODUCT_LIST;
  
  // 获取库存状态
  const totalStock = Object.values(item.inventory || {}).reduce((sum, stock) => sum + (Number(stock) || 0), 0);
  const stockStatus = totalStock > 10 ? 'high' : totalStock > 0 ? 'low' : 'out';
  const stockColor = stockStatus === 'high' ? 'text-green-600' : stockStatus === 'low' ? 'text-yellow-600' : 'text-red-600';
  const stockBg = stockStatus === 'high' ? 'bg-green-50' : stockStatus === 'low' ? 'bg-yellow-50' : 'bg-red-50';
  
  // 计算最优价格
  const bestPrice = item.pricing?.reduce((min, pricing) => {
    const quantity = parseInt(pricing.range.replace(/[^0-9]/g, '') || '1') || 1;
    const priceValue = getRegionalPrice(item, quantity);
    return priceValue > 0 && priceValue < min ? priceValue : min;
  }, Infinity) || 0;

  return (
    <div className="consumable-product-card slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* 库存状态标签 */}
      <div className={`stock-status-badge ${stockStatus === 'high' ? 'high-stock' : stockStatus === 'low' ? 'low-stock' : 'out-stock'}`}>
        {stockStatus === 'high' ? String(t('ui.stockStatus.sufficient') || '库存充足') : 
         stockStatus === 'low' ? String(t('ui.stockStatus.low') || '库存紧张') : 
         String(t('ui.stockStatus.out') || '暂时缺货')}
      </div>

      <div className="product-card-content">
        <div className="product-layout">
          {/* 产品图片区域 */}
          <div className="product-image-section">
            <div className="image-container">
              <img 
                src={cleanImageUrl(getLocalizedValue(item, 'image_url'))} 
                alt={getLocalizedValue(item, 'name')} 
                onError={handleImageError} 
              />
            </div>
            <div className="product-code-badge">
              {getLocalizedValue(item, 'code')}
            </div>
          </div>

          {/* 产品信息区域 */}
          <div className="product-info-section">
            <div className="product-title">
              <h3 className="product-name">
                {getLocalizedValue(item, 'name')}
              </h3>
              
              {/* 适用机型信息 */}
              {shouldShowField(item, 'app_model') && (
                <div className="compatibility-info">
                  <span className="label">{getFieldLabel('app_model')}:</span>
                  <span className="value">{getLocalizedValue(item, 'app_model')}</span>
                </div>
              )}
              
              <div className="product-id">
                {getFieldLabel('id')}: {getLocalizedValue(item, 'id')}
              </div>
            </div>

            {/* 规格展示卡片 */}
            <div className="specs-showcase">
              <div className="specs-title">
                <svg className="title-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="title-text">{String(t('ui.productSpecs') || '产品规格')}</span>
              </div>
              
              <div className="specs-grid">
                {/* 形状字段 */}
                {fieldsToDisplay.includes('shape') && shouldShowField(item, 'shape') && (
                  <div className="spec-badge">
                    <div className="spec-label">{getFieldLabel('shape')}</div>
                    <div className="spec-value">{getLocalizedValue(item, 'shape')}</div>
                  </div>
                )}
                
                {/* 材质字段 */}
                {fieldsToDisplay.includes('material') && shouldShowField(item, 'material') && (
                  <div className="spec-badge">
                    <div className="spec-label">{getFieldLabel('material')}</div>
                    <div className="spec-value">{getLocalizedValue(item, 'material')}</div>
                  </div>
                )}
                
                {/* 型号字段 - 注释掉避免重复显示 */}
                {/* {fieldsToDisplay.includes('model') && shouldShowField(item, 'model') && (
                  <div className="spec-badge">
                    <div className="spec-label">{getFieldLabel('model')}</div>
                    <div className="spec-value">{getLocalizedValue(item, 'model')}</div>
                  </div>
                )} */}
                
                {/* 规格字段 */}
                {fieldsToDisplay.includes('spec') && shouldShowField(item, 'spec') && (
                  <div className="spec-badge">
                    <div className="spec-label">{getFieldLabel('spec')}</div>
                    <div className="spec-value">{getLocalizedValue(item, 'spec')}</div>
                  </div>
                )}
                
                {/* 泡径字段 - 条件显示 */}
                {fieldsToDisplay.includes('bubble_diameter') && shouldShowField(item, 'bubble_diameter') && (
                  <div className="spec-badge">
                    <div className="spec-label">{getFieldLabel('bubble_diameter')}</div>
                    <div className="spec-value">{getLocalizedValue(item, 'bubble_diameter')}</div>
                  </div>
                )}
                
                {/* 单箱数量字段 */}
                {fieldsToDisplay.includes('pcs_per_box') && shouldShowField(item, 'pcs_per_box') && (
                  <div className="spec-badge">
                    <div className="spec-label">{getFieldLabel('pcs_per_box')}</div>
                    <div className="spec-value">{getLocalizedValue(item, 'pcs_per_box')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮区域 */}
            <div className="product-actions">
              <Tooltip
                title={<ConsumableTooltipContent item={item} userRegion={userRegion} />}
                placement="topRight"
                classNames={{ tooltip: "consumables-custom-tooltip" }}
                color="white"
                arrow={false}
                trigger="hover"
                destroyTooltipOnHide={true}
                fresh={true}
                overlayStyle={{
                  maxWidth: 'min(600px, 90vw)',
                  zIndex: 10000
                }}
              >
                <button className="tooltip-trigger-btn">
                  <InfoCircleOutlined className="action-icon" />
                  {String(t('ui.viewDetailedSpecs') || '查看详细规格')}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* 价格与购买区域 */}
          <div className="price-purchase-section">
            {/* 价格展示 */}
            <div className="price-display">
              <div className="price-label">{String(t('ui.startingPrice') || '起始价格')}</div>
              <div className="price-value">
                {getCurrencySymbolByRegion()}{(bestPrice === Infinity || bestPrice === 0) ? String(t('ui.priceInquiry') || '询价') : bestPrice.toFixed(2)}
              </div>
              <div className="price-note">{String(t('ui.minimumOrder') || '最低订购量')}</div>
            </div>

            {/* 价格阶梯 */}
            <div className="price-tiers">
              <div className="tiers-title">{String(t('ui.priceSteps') || '价格阶梯')}</div>
              {item.pricing?.slice(0, 3).map((price, idx) => {
                const quantity = parseInt(price.range.replace(/[^0-9]/g, '') || '1') || 1;
                const priceValue = getRegionalPrice(item, quantity);
                const displayPrice = isNaN(priceValue) ? 0 : priceValue;
                
                return (
                  <div key={idx} className="tier-item">
                    <span className="tier-range">{price.range}</span>
                    <span className="tier-price">
                      {getCurrencySymbolByRegion()}{displayPrice.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              {item.pricing && item.pricing.length > 3 && (
                <div className="more-tiers">
                  +{item.pricing.length - 3} {String(t('ui.moreSteps') || '更多价格')}
                </div>
              )}
            </div>

            {/* 库存信息 */}
            <div className={`stock-info ${stockStatus === 'high' ? 'high-stock' : stockStatus === 'low' ? 'low-stock' : 'out-stock'}`}>
              <div className="stock-header">
                <span className="stock-label">{String(t('ui.stockStatus') || '库存状态')}</span>
                <span className="stock-status-text">
                  {stockStatus === 'high' ? String(t('ui.sufficient') || '✓ 充足') : 
                   stockStatus === 'low' ? String(t('ui.lowWarning') || '⚠ 紧张') : 
                   String(t('ui.outIcon') || '✗ 缺货')}
                </span>
              </div>
              <div className="stock-details">
                <div className="total-stock">
                  {String(t('ui.totalStock') || '总库存')}: <span className="stock-number">{totalStock}</span>
                </div>
              </div>
            </div>

            {/* 购买操作 */}
            <div className="purchase-actions">
              <div className="quantity-selector">
                <InputNumber
                  min={1}
                  value={quantities[item.id] || 1}
                  onChange={(value) => onQuantityChange(item.id, value || 1)}
                  className="quantity-input"
                  size="large"
                  disabled={stockStatus === 'out'}
                />
              </div>
              
              {/* 库存警告 */}
              {stockStatus === 'low' && (
                <div className="stock-warning">
                  <div className="warning-text">
                    {String(t('ui.lowStockWarning') || '⚠️ 库存紧张，建议尽快下单')}
                  </div>
                </div>
              )}
              
              <div className="action-buttons">
                <Button
                  type="primary"
                  onClick={(e) => onAddToCart(item.id, e.currentTarget)}
                  disabled={stockStatus === 'out'}
                  className={`add-to-cart-btn ${stockStatus === 'out' ? 'unavailable' : 'available'}`}
                  icon={<ShoppingCartOutlined />}
                >
                  {stockStatus === 'out' ? String(t('ui.stockStatus.out') || '暂时缺货') : String(t('ui.addToCart') || '加入购物车')}
                </Button>
                
                {/* 快速购买按钮 */}
                {stockStatus !== 'out' && (
                  <Button
                    className="quick-buy-btn"
                    onClick={() => {
                      onAddToCart(item.id);
                      // 这里可以添加跳转到结算页面的逻辑
                      // success(String(t('ui.addedToCart') || '商品已添加，点击购物车进行结算'));
                    }}
                  >
                    {String(t('ui.buyNow') || '立即购买')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 在组件外部定义映射
const shapeIdToSpecsShape: Record<string, string> = {
  MEX: 'paper air Pillow',
  MEY: 'paper Bubble',
  MFB: 'Tube',
  MFC: 'Tube',
  MFF: 'Tube'
};

const materialIdToSpecsMaterial: Record<string, string> = {
  'hdpe': 'HDPE',
  'ldpe': 'LDPE',
  'paper': 'PAPER',
  'paper+pe': 'PAPER+PE',
  'nylon': 'NYLON'
};

// 类型定义
interface SpecificationsOptions {
  thickness: SpecificationData[];
  weight: SpecificationData[];
  width: SpecificationData[];
  length: SpecificationData[];
}

// 增强的智能筛选选项类型
interface SmartFilterOptionsType {
  models: SmartFilterOption[];
  shapes: SmartFilterOption[];
  materials: SmartFilterOption[];
  thicknesses: SmartFilterOption[];
  weights: SmartFilterOption[];
  widths: SmartFilterOption[];
  lengths: SmartFilterOption[];
  bubbleDiameters: SmartFilterOption[];
}

// 智能筛选选项接口
interface SmartFilterOption {
  id: string;
  name: string;
  count: number;
  disabled: boolean;
  originalData?: any; // 保存原始数据引用
  children?: SmartFilterOption[]; // 子级选项
}

// 筛选配置选项
interface SmartFilterConfig {
  showCount: boolean;
  hideEmptyOptions: boolean; // 保持显示但禁用，提供更好的用户体验
  cascadeUpdate: boolean;
  enableAnimation: boolean;
  minCount: number; // 最小显示数量阈值
}

// 筛选状态接口
interface FilterState {
  selectedModel: string;
  selectedShape: string;
  selectedMaterial: string;
  selectedSpecs: {
    thickness: string;
    weight: string;
    width: string;
    length: string;
    bubbleDiameter: string;
  };
}

// 性能缓存接口
interface FilterCache {
  key: string;
  timestamp: number;
  result: SmartFilterOptionsType;
}

// 工具函数
const normalize = (v: any) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');

const extractNumber = (value: string | number | undefined | null): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? undefined : num;
  }
  return undefined;
};

// 获取本地化选项名称
const getLocalizedOptionName = (option: FilterOptionItem): string => {
  // 简化处理，直接返回中文名称
  return option.name_zh || option.name_en || '';
};

// 智能筛选配置
const smartFilterConfig: SmartFilterConfig = {
  showCount: true,
  hideEmptyOptions: false, // 保持显示但禁用，提供更好的用户体验
  cascadeUpdate: true,
  enableAnimation: true,
  minCount: 0
};

// 智能筛选选项组件
interface SmartFilterSelectProps {
  title: string;
  value: string;
  options: SmartFilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  showCount?: boolean;
  disabled?: boolean;
  totalCount?: number; // 新增：用于"全部"选项的正确计数
}

const SmartFilterSelect: React.FC<SmartFilterSelectProps> = ({
  title,
  value,
  options,
  onChange,
  placeholder = '请选择',
  showCount = true,
  disabled = false,
  totalCount // 新增参数
}) => {
  const { t } = useTranslation(['consumables', 'common']);
  
  // 计算"全部"选项的正确计数
  const getAllCount = () => {
    // 优先使用传入的totalCount
    if (totalCount !== undefined) {
      return totalCount;
    }
    
    // 如果没有传入totalCount，则使用子选项计数相加作为fallback
    // 但这种方式在某些情况下可能不准确（如有重复计数）
    return options.reduce((sum, opt) => sum + opt.count, 0);
  };
  
  return (
    <div className="smart-filter-select">
      <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
      <Select
        value={value}
        onChange={onChange}
        className="w-full"
        size="large"
        placeholder={placeholder}
        disabled={disabled}
        style={{ minWidth: '200px' }}
      >
        <Option value="all">
          <div className="flex items-center justify-between">
            <span>{String(t('filter.all') || '全部')}</span>
            {showCount && (
              <span className="text-gray-500 text-xs ml-2">
                ({getAllCount()})
              </span>
            )}
          </div>
        </Option>
        {options.map((option) => (
          <Option 
            key={option.id} 
            value={option.id}
            disabled={option.disabled}
          >
            <div className={`flex items-center justify-between ${option.disabled ? 'opacity-50 text-gray-400' : ''}`}>
              <span className={option.disabled ? 'line-through' : ''}>{option.name}</span>
              {showCount && (
                <span className={`text-xs ml-2 ${option.disabled ? 'text-gray-300' : 'text-blue-500'}`}>
                  ({option.count})
                </span>
              )}
            </div>
          </Option>
        ))}
      </Select>
    </div>
  );
};

// 筛选面包屑组件
interface FilterBreadcrumbProps {
  filters: {
    model?: string;
    shape?: string;
    material?: string;
    thickness?: string;
    weight?: string;
    width?: string;
    length?: string;
  };
  onRemoveFilter: (filterType: string) => void;
  onClearAll: () => void;
}

const FilterBreadcrumb: React.FC<FilterBreadcrumbProps> = ({ filters, onRemoveFilter, onClearAll }) => {
  const { t } = useTranslation(['consumables', 'common']);
  
  const hasActiveFilters = Object.values(filters).some(value => value && value !== '' && value !== 'all');
  
  if (!hasActiveFilters) return null;
  
  return (
    <div className="filter-breadcrumb bg-blue-50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {String(t('ui.activeFilters') || '当前筛选条件')}:
        </span>
        <Button type="text" size="small" onClick={onClearAll} className="text-blue-600 hover:text-blue-800">
          {String(t('ui.clearAll') || '清除全部')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(filters).map(([type, value]) => (
          <div
            key={type}
            className="inline-flex items-center bg-white border border-blue-200 rounded-full px-3 py-1 text-sm"
          >
            <span className="text-gray-600 mr-1">
              {String(t(`filter.${type}`) || type)}:
            </span>
            <span className="font-medium text-gray-900">{value}</span>
            <button
              onClick={() => onRemoveFilter(type)}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConsumablesPage: React.FC = () => {
  // ===== 所有hooks必须在组件最顶部，不能有条件调用 =====
  
  // 基础hooks - 顺序固定，不能变化
  const { t, i18n } = useTranslation('consumables');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // ===== 所有状态定义 - 按功能分组，确保调用顺序一致 =====
  
  // 1. 基础页面状态
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [apiFailureCount, setApiFailureCount] = useState(0);
  
  // 2. 数据状态
  const [consumables, setConsumables] = useState<ConsumableProduct[]>([]);
  const [allConsumables, setAllConsumables] = useState<ConsumableProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType | null>(null);
  const [specOptions, setSpecOptions] = useState<SpecificationsOptions>({
    thickness: [],
    weight: [],
    width: [],
    length: []
  });
  
  // 3. 购物车状态
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
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
  
  // 4. 分页状态
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // 5. 筛选状态
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  
  // 6. 智能筛选状态
  const [smartFilterOptions, setSmartFilterOptions] = useState<SmartFilterOptionsType>({
    models: [],
    shapes: [],
    materials: [],
    thicknesses: [],
    weights: [],
    widths: [],
    lengths: [],
    bubbleDiameters: []
  });
  
  // 7. 模态框状态
  const [selectedProduct, setSelectedProduct] = useState<ConsumableProduct | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'info' | 'danger';
    loading: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    loading: false,
    onConfirm: () => {}
  });
  
  // 8. UI辅助状态
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const currentLanguage = i18n.language;
  const userRegion = getUserRegionFromEmail(user?.email || '');
  
  // 9. 性能缓存状态
  const [filterCache, setFilterCache] = useState<Map<string, FilterCache>>(new Map());
  const cacheTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ===== 动态计算变量（非状态） =====
  const currentDimensionImage = useMemo(() => {
    if (selectedShape === 'all') return shapePlaceholderImage;
    
    const shapeData = filterOptions?.shapes?.find(s => s.id === selectedShape);
    return shapeData?.image_url || shapePlaceholderImage;
  }, [selectedShape, filterOptions?.shapes]);
  
  // 筛选后的耗材数据
  const filteredConsumables = useMemo(() => {
    console.log('🔄 [筛选计算] 开始重新计算筛选结果...');
    console.log('🔄 筛选条件:', {
      selectedModel, selectedShape, selectedMaterial,
      selectedThickness, selectedWeight, selectedWidth, selectedLength
    });
    
    if (!allConsumables?.length) {
      console.log('🔄 [筛选计算] 没有可筛选的数据');
      return [];
    }
    
    const filtered = allConsumables.filter((item) => {
      // 1. 设备型号筛选（基于app_model字段）
      if (selectedModel !== 'all') {
        const itemModelId = item.app_model?.toString() || '';
        if (itemModelId !== selectedModel) {
          return false;
        }
      }
      
      // 2. 形状筛选（基于shape字段）
      if (selectedShape !== 'all') {
        const itemShape = normalize(item.shape || '');
        const targetShape = normalize(selectedShape);
        if (itemShape !== targetShape) {
          return false;
        }
      }
      
      // 3. 材质筛选（基于material字段）
      if (selectedMaterial !== 'all') {
        const itemMaterial = normalize(item.material || '');
        const targetMaterial = normalize(selectedMaterial);
        if (itemMaterial !== targetMaterial) {
          return false;
        }
      }
      
      // 4. 厚度/重量筛选（基于thickness_met字段，根据材质判断是厚度还是重量）
      if (isPaperMaterial(item.material || '')) {
        // 纸质材料按重量筛选
        if (selectedWeight !== 'all') {
          const itemWeight = extractNumber(item.thickness_met);
          const targetWeight = extractNumber(selectedWeight);
          if (itemWeight !== targetWeight) {
            return false;
          }
        }
      } else {
        // 非纸质材料按厚度筛选
        if (selectedThickness !== 'all') {
          const itemThickness = extractNumber(item.thickness_met);
          const targetThickness = extractNumber(selectedThickness);
          if (itemThickness !== targetThickness) {
            return false;
          }
        }
      }
      
      // 5. 宽度筛选（基于width_met字段）
      if (selectedWidth !== 'all') {
        const itemWidth = extractNumber(item.width_met);
        const targetWidth = extractNumber(selectedWidth);
        if (itemWidth !== targetWidth) {
          return false;
        }
      }
      
      // 6. 长度筛选（基于length_met字段）
      if (selectedLength !== 'all') {
        const itemLength = extractNumber(item.length_met);
        const targetLength = extractNumber(selectedLength);
        if (itemLength !== targetLength) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`🔄 [筛选计算] 筛选完成: ${filtered.length}/${allConsumables.length} 个产品符合条件`);
    return filtered;
  }, [
    allConsumables, selectedModel, selectedShape, selectedMaterial,
    selectedThickness, selectedWeight, selectedWidth, selectedLength
  ]);
  
  // ===== 智能筛选选项计算的函数 =====
  const calculateSmartFilterOptions = useCallback(() => {
    if (!allConsumables?.length) {
      console.log('📊 [智能筛选] 没有数据，跳过计算');
      return;
    }
    
    console.log('📊 [智能筛选] 开始计算智能筛选选项...');
    
    // 生成缓存键
    const cacheKey = `${selectedModel}-${selectedShape}-${selectedMaterial}-${selectedThickness}-${selectedWeight}-${selectedWidth}-${selectedLength}`;
    const now = Date.now();
    
    // 检查缓存
    const cached = filterCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < 5000) { // 5秒缓存
      console.log('📊 [智能筛选] 使用缓存结果');
      setSmartFilterOptions(cached.result);
      return;
    }
    
    // 清理过期缓存
    if (cacheTimeoutRef.current) {
      clearTimeout(cacheTimeoutRef.current);
    }
    cacheTimeoutRef.current = setTimeout(() => {
      setFilterCache(prev => {
        const newCache = new Map(prev);
        for (const [key, value] of newCache.entries()) {
          if (now - value.timestamp > 30000) { // 30秒后清理
            newCache.delete(key);
          }
        }
        return newCache;
      });
    }, 1000);
    
    // 创建筛选条件快照
    const currentFilters: FilterState = {
      selectedModel,
      selectedShape,
      selectedMaterial,
      selectedSpecs: {
        thickness: selectedThickness,
        weight: selectedWeight,
        width: selectedWidth,
        length: selectedLength,
        bubbleDiameter: 'all'
      }
    };
    
    // 智能联动筛选逻辑
    const calculateCascadingOptions = (excludeField?: keyof FilterState) => {
      return allConsumables.filter(item => {
        // 应用除了排除字段外的所有筛选条件
        if (excludeField !== 'selectedModel' && currentFilters.selectedModel !== 'all') {
          // 🔥 修复：正确解析app_model字段
          const appModels = (item.app_model || '').split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
          const matches = appModels.some(m => normalize(m) === normalize(currentFilters.selectedModel));
          if (!matches) return false;
        }
        
        if (excludeField !== 'selectedShape' && currentFilters.selectedShape !== 'all') {
          // 🔥 修复：直接使用shape字段
          if (normalize(item.shape || '') !== normalize(currentFilters.selectedShape)) return false;
        }
        
        if (excludeField !== 'selectedMaterial' && currentFilters.selectedMaterial !== 'all') {
          // 🔥 修复：直接使用material字段
          if (normalize(item.material || '') !== normalize(currentFilters.selectedMaterial)) return false;
        }
        
        // 规格筛选
        const isPaper = isPaperMaterial(item.material || '');
        
        if (isPaper && excludeField !== 'selectedSpecs' && currentFilters.selectedSpecs.weight !== 'all') {
          const itemWeight = extractNumber(item.thickness_met);
          const targetWeight = extractNumber(currentFilters.selectedSpecs.weight);
          if (itemWeight !== targetWeight) return false;
        } else if (!isPaper && excludeField !== 'selectedSpecs' && currentFilters.selectedSpecs.thickness !== 'all') {
          const itemThickness = extractNumber(item.thickness_met);
          const targetThickness = extractNumber(currentFilters.selectedSpecs.thickness);
          if (itemThickness !== targetThickness) return false;
        }
        
        if (excludeField !== 'selectedSpecs' && currentFilters.selectedSpecs.width !== 'all') {
          const itemWidth = extractNumber(item.width_met);
          const targetWidth = extractNumber(currentFilters.selectedSpecs.width);
          if (itemWidth !== targetWidth) return false;
        }
        
        if (excludeField !== 'selectedSpecs' && currentFilters.selectedSpecs.length !== 'all') {
          const itemLength = extractNumber(item.length_met);
          const targetLength = extractNumber(currentFilters.selectedSpecs.length);
          if (itemLength !== targetLength) return false;
        }
        
        return true;
      });
    };
    
    // 生成机型选项
    const generateModelOptions = (): SmartFilterOption[] => {
      // 1. 收集所有型号
      const modelCountMap = new Map<string, number>();
      allConsumables.forEach(item => {
        (item.app_model || '').split(',').forEach(m => {
          const model = m.trim().replace(/^[\"']|[\"']$/g, '');
          if (model) {
            modelCountMap.set(model, (modelCountMap.get(model) || 0) + 1);
          }
        });
      });

      // 2. 生成选项数组
      const modelOptions = Array.from(modelCountMap.entries())
        .map(([model, count]) => ({
          id: model,
          name: model,
          count,
          disabled: false
        }))
        // 3. 按数量降序、字母顺序排序
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      return modelOptions;
    };
    
    // 生成形状选项
    const generateShapeOptions = (): SmartFilterOption[] => {
      const availableItems = calculateCascadingOptions('selectedShape');
      const shapeCountMap = new Map<string, number>();

      // 🔥 修复：使用真实数据库的shape字段统计数量
      availableItems.forEach(item => {
        if (item.shape) {
          const normalizedShape = item.shape.trim();
          shapeCountMap.set(normalizedShape, (shapeCountMap.get(normalizedShape) || 0) + 1);
        }
      });

      console.log('🔧 [Shape筛选] 数据库中的形状统计:', Object.fromEntries(shapeCountMap));
      console.log('🔧 [Shape筛选] API返回的形状配置:', filterOptions?.shapes);

      // 动态生成形状选项，优先使用API返回的形状配置
      const shapeOptions: SmartFilterOption[] = [];
      const processedShapes = new Set<string>();

      // 1. 🔥 修复：处理API返回的形状配置，正确映射数据库记录
      if (filterOptions?.shapes && Array.isArray(filterOptions.shapes)) {
        console.log('🔧 [Shape筛选] 开始处理API形状配置...');
        
        filterOptions.shapes.forEach(shapeConfig => {
          // 🔥 优化：支持多种形状标识方式
          const possibleIds = [
            shapeConfig.id,
            shapeConfig.name_en, 
            shapeConfig.name_zh,
            shapeConfig.shape_name,
            shapeConfig.category_name
          ].filter(Boolean);
          
          console.log('🔧 [Shape筛选] 处理形状配置:', {
            config: shapeConfig,
            possibleIds
          });
          
          // 🔥 修复：智能匹配形状数量，支持中英文名称
          let matchedCount = 0;
          let matchedShapeId = '';
          
          for (const id of possibleIds) {
            if (shapeCountMap.has(id)) {
              matchedCount = shapeCountMap.get(id) || 0;
              matchedShapeId = id;
              break;
            }
          }
          
          // 如果没有直接匹配，尝试模糊匹配
          if (matchedCount === 0) {
            for (const [dbShape, count] of shapeCountMap.entries()) {
              for (const configId of possibleIds) {
                const normalizedDbShape = dbShape.toLowerCase().replace(/\s+/g, '');
                const normalizedConfigId = configId.toLowerCase().replace(/\s+/g, '');
                
                if (normalizedDbShape.includes(normalizedConfigId) || 
                    normalizedConfigId.includes(normalizedDbShape)) {
                  matchedCount = count;
                  matchedShapeId = dbShape;
                  console.log('🔧 [Shape筛选] 模糊匹配成功:', { dbShape, configId, count });
                  break;
                }
              }
              if (matchedCount > 0) break;
            }
          }
          
          const finalShapeId = matchedShapeId || possibleIds[0] || shapeConfig.id;
          
          if (finalShapeId && !processedShapes.has(finalShapeId)) {
            // 🔥 修复：正确使用数据库中的图片URL
            const imageUrl = cleanImageUrl(shapeConfig.image_url || shapeConfig.featured_image);
            
            console.log('🔧 [Shape筛选] 添加形状选项:', {
              id: finalShapeId,
              name: shapeConfig.name_zh || shapeConfig.name_en || finalShapeId,
              count: matchedCount,
              imageUrl: imageUrl,
              originalImageUrl: shapeConfig.image_url
            });
            
            shapeOptions.push({
              id: finalShapeId,
              name: shapeConfig.name_zh || shapeConfig.name_en || finalShapeId,
              count: matchedCount,
              disabled: matchedCount === 0,
              originalData: {
                ...shapeConfig,
                // 🔥 修复：直接使用数据库中的图片URL
                image_url: imageUrl
              }
            });
            processedShapes.add(finalShapeId);
          }
        });
      }

      // 2. 🔥 补充：处理数据库中存在但API配置中没有的形状
      shapeCountMap.forEach((count, shapeId) => {
        if (!processedShapes.has(shapeId) && count > 0) {
          console.log('🔧 [Shape筛选] 添加API未配置的形状:', { shapeId, count });
          
          shapeOptions.push({
            id: shapeId,
            name: shapeId,
            count,
            disabled: false,
            originalData: {
              id: shapeId,
              name_zh: shapeId,
              name_en: shapeId,
              // 对于API未配置的形状，使用占位符图片
              image_url: shapePlaceholderImage
            }
          });
          processedShapes.add(shapeId);
        }
      });

      // 3. 按数量排序
      shapeOptions.sort((a, b) => b.count - a.count);

      console.log('🔧 [Shape筛选] 最终生成的形状选项:', shapeOptions);
      return shapeOptions;
    };
    
    // 生成材质选项
    const generateMaterialOptions = (): SmartFilterOption[] => {
      const availableItems = calculateCascadingOptions('selectedMaterial');
      const materialCountMap = new Map<string, number>();
      
      // 🔥 修复：直接使用material字段统计
      availableItems.forEach(item => {
        if (item.material) {
          materialCountMap.set(item.material, (materialCountMap.get(item.material) || 0) + 1);
        }
      });
      
      const materialOptions: SmartFilterOption[] = [];
      
      // 按真实数据库中的材质数量排序
      Array.from(materialCountMap.entries())
        .sort(([, a], [, b]) => b - a)
        .forEach(([material, count]) => {
          materialOptions.push({
            id: material,
            name: `${material}`,
            count: count,
            disabled: false
          });
        });
      
      console.log('🔧 [Material筛选] 动态生成的材质选项:', materialOptions);
      return materialOptions;
    };
    
    // 生成规格选项（厚度、重量、宽度、长度）
    const generateSpecOptions = (fieldName: 'thickness' | 'weight' | 'width' | 'length'): SmartFilterOption[] => {
      const availableItems = calculateCascadingOptions('selectedSpecs');
      const specCountMap = new Map<string, number>();
      
      availableItems.forEach(item => {
        let value: number | undefined;
        
        switch (fieldName) {
          case 'thickness':
          case 'weight':
            value = extractNumber(item.thickness_met);
            break;
          case 'width':
            value = extractNumber(item.width_met);
            break;
          case 'length':
            value = extractNumber(item.length_met);
            break;
        }
        
        if (value !== undefined) {
          const key = value.toString();
          specCountMap.set(key, (specCountMap.get(key) || 0) + 1);
        }
      });
      
      return Array.from(specCountMap.entries())
        .map(([value, count]) => ({
          id: value,
          name: `${value} ${userRegion === 'na' || userRegion === 'au' ? 
            (fieldName === 'thickness' ? 'mil' : fieldName === 'weight' ? '#' : 'inch') : 
            (fieldName === 'thickness' ? 'μm' : fieldName === 'weight' ? 'gsm' : 'cm')
          }`,
          count,
          disabled: !smartFilterConfig.hideEmptyOptions && count === 0,
          originalData: { value: parseFloat(value), fieldName }
        }))
        .filter(option => smartFilterConfig.hideEmptyOptions ? option.count > 0 : true)
        .sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
    };
    
    // 生成泡径选项（如果适用）
    const generateBubbleDiameterOptions = (): SmartFilterOption[] => {
      const availableItems = calculateCascadingOptions();
      const bubbleCountMap = new Map<string, number>();
      
      availableItems.forEach(item => {
        // 检查泡径信息，使用现有字段
        const bubbleDiameter = item.bubble_diameter_met;
        if (bubbleDiameter) {
          const value = extractNumber(bubbleDiameter);
          if (value !== undefined) {
            const key = value.toString();
            bubbleCountMap.set(key, (bubbleCountMap.get(key) || 0) + 1);
          }
        }
      });
      
      return Array.from(bubbleCountMap.entries())
        .map(([value, count]) => ({
          id: value,
          name: `Φ${value} ${userRegion === 'na' || userRegion === 'au' ? 'inch' : 'cm'}`,
          count,
          disabled: !smartFilterConfig.hideEmptyOptions && count === 0,
          originalData: { value: parseFloat(value), fieldName: 'bubbleDiameter' }
        }))
        .filter(option => smartFilterConfig.hideEmptyOptions ? option.count > 0 : true)
        .sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
    };
    
    // 生成最终的筛选选项
    const newSmartFilterOptions: SmartFilterOptionsType = {
      models: generateModelOptions(),
      shapes: generateShapeOptions(),
      materials: generateMaterialOptions(),
      thicknesses: generateSpecOptions('thickness'),
      weights: generateSpecOptions('weight'),
      widths: generateSpecOptions('width'),
      lengths: generateSpecOptions('length'),
      bubbleDiameters: generateBubbleDiameterOptions()
    };
    
    // 缓存结果
    setFilterCache(prev => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, {
        key: cacheKey,
        timestamp: now,
        result: newSmartFilterOptions
      });
      return newCache;
    });
    
    setSmartFilterOptions(newSmartFilterOptions);
    console.log('📊 [智能筛选] 计算完成:', newSmartFilterOptions);
  }, [
    allConsumables, selectedModel, selectedShape, selectedMaterial,
    selectedThickness, selectedWeight, selectedWidth, selectedLength,
    filterOptions, userRegion, filterCache
  ]);
  
  // ===== useEffect hooks - 确保调用顺序一致 =====
  
  // 1. 更新consumables和总数
  useEffect(() => {
    setConsumables(filteredConsumables);
    setTotalItems(filteredConsumables.length);
    setTotalPages(Math.ceil(filteredConsumables.length / 20));
    setCurrentPage(1);
  }, [filteredConsumables]);
  
  // 2. 智能筛选选项计算
  useEffect(() => {
    calculateSmartFilterOptions();
  }, [calculateSmartFilterOptions]);
  
  // 使用useCallback稳定回调函数引用
  const handleConsumablesSuccess = useCallback((data: any) => {
    console.log('✅ 耗材页面数据加载成功:', data);
  }, []);
  
  const handleConsumablesError = useCallback((error: string) => {
    console.error('❌ 耗材页面数据加载失败:', error);
  }, []);
  
  // 🔥 强制使用真实API数据 - 直接调用WordPress API
  useEffect(() => {
    const fetchRealApiData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 开始从真实API获取耗材数据...');
        
        // 直接调用WordPress API，绕过服务层的mock判断
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
        const apiUrl = `${baseUrl}/consumables?page=1&per_page=1000`;
        
        console.log('🔍 API URL:', apiUrl);
        
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
        console.log('✅ 真实API数据获取成功:', data);
        
        // 处理API响应格式
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
        
        console.log(`📊 解析到 ${consumablesData.length} 个耗材产品`);
        console.log('🔍 数据样本:', consumablesData.slice(0, 2));
        
        setAllConsumables(consumablesData);
        setFilterOptions(filterOptionsData);
        setLoading(false);
        
        // 触发筛选选项重新计算
        setTimeout(() => {
          console.log('🔄 开始计算智能筛选选项...');
        }, 100);
        
      } catch (err: any) {
        console.error('❌ 真实API数据获取失败:', err);
        setError(err.message || '加载耗材数据失败');
        setLoading(false);
      }
    };
    
    fetchRealApiData();
  }, []);
  
  // 获取形状和材料数据
  const { data: shapesData } = useShapes();
  
  const { data: materialsData } = useMaterials();
 
  useEffect(() => {
    console.log('当前筛选后的 consumables:', consumables);
  }, [consumables]);
  // 3. 本地筛选和分页逻辑全部放在一个useEffect
  useEffect(() => {
    // 🔥 修复：移除错误的字段映射，直接使用数据库真实字段
    const normalize = (v: any) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');

    // 打印当前筛选条件
    console.log('【筛选条件】', {
      model: selectedModel,
      shape: selectedShape,
      material: selectedMaterial,
      thickness: selectedThickness,
      weight: selectedWeight,
      width: selectedWidth,
      length: selectedLength
    });

    // 打印数据样本，展示真实的数据库字段
    allConsumables.slice(0, 3).forEach((item, idx) => {
      console.log(`【数据${idx}分析】`, {
        id: item.id,
        name: item.name,
        shape: item.shape,              // 🔥 直接使用shape字段
        material: item.material,        // 🔥 直接使用material字段
        app_model: item.app_model,      // 🔥 兼容性字段
        thickness_met: item.thickness_met, 
        width_met: item.width_met,      
        length_met: item.length_met,    
        specs: item.specs
      });
    });

    const filtered = allConsumables.filter(item => {
      // 型号筛选 - 🔥 修复：正确解析app_model字段的复杂格式
      if (selectedModel !== 'all') {
        const appModels = (item.app_model || '').split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
        const matches = appModels.some(m => normalize(m) === normalize(selectedModel));
        if (!matches) {
          console.log(`🔍 [型号筛选] ${item.id} 不匹配: ${item.app_model} vs ${selectedModel}`);
          return false;
        }
      }

      // 🔥 修复：形状筛选 - 直接使用shape字段，移除错误的bag_type映射
      if (selectedShape !== 'all') {
        const itemShape = normalize(item.shape);
        const targetShape = normalize(selectedShape);
        
        // 支持多种匹配方式
        let shapeMatches = false;
        if (itemShape === targetShape) {
          shapeMatches = true;
        } else {
          // 查找选中形状的配置信息
          const selectedShapeConfig = smartFilterOptions.shapes.find(s => s.id === selectedShape);
          if (selectedShapeConfig && selectedShapeConfig.originalData) {
            const config = selectedShapeConfig.originalData;
            // 支持中英文名称匹配
            shapeMatches = itemShape === normalize(config.name_en) || 
                          itemShape === normalize(config.name_zh) ||
                          normalize(config.name_en) === targetShape ||
                          normalize(config.name_zh) === targetShape;
          }
        }
        
        if (!shapeMatches) {
          console.log(`🔍 [形状筛选] ${item.id} 不匹配: ${item.shape} vs ${selectedShape}`);
          return false;
        }
      }

      // 🔥 修复：材质筛选 - 直接使用material字段
      if (selectedMaterial !== 'all') {
        if (normalize(item.material) !== normalize(selectedMaterial)) {
          console.log(`🔍 [材质筛选] ${item.id} 不匹配: ${item.material} vs ${selectedMaterial}`);
          return false;
        }
      }

      // 🔥 修复：数值筛选 - 正确处理字符串数值
      const extractNumber = (value: string | number | undefined | null): number | undefined => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'number') return value;
        const numValue = parseFloat(String(value));
        return isNaN(numValue) ? undefined : numValue;
      };

      // 厚度筛选 - 使用thickness_met字段
      if (selectedThickness !== 'all') {
        const itemThickness = extractNumber(item.thickness_met);
        const targetThickness = extractNumber(selectedThickness);
        if (itemThickness === undefined || targetThickness === undefined || 
            Math.abs(itemThickness - targetThickness) > 0.01) {
          console.log(`🔍 [厚度筛选] ${item.id} 不匹配: ${itemThickness} vs ${targetThickness}`);
          return false;
        }
      }

      // 重量筛选 - 纸质材料使用厚度字段作为重量（gsm）
      if (selectedWeight !== 'all') {
        let itemWeight;
        if (isPaperMaterial(item.material)) {
          // 纸质材料的"重量"实际存储在thickness_met字段
          itemWeight = extractNumber(item.thickness_met);
        } else {
          itemWeight = extractNumber(item.net_weight_kg) || extractNumber(item.specs?.weight);
        }
        const targetWeight = extractNumber(selectedWeight);
        if (itemWeight === undefined || targetWeight === undefined || 
            Math.abs(itemWeight - targetWeight) > 0.01) {
          console.log(`🔍 [重量筛选] ${item.id} 不匹配: ${itemWeight} vs ${targetWeight}`);
          return false;
        }
      }

      // 宽度筛选 - 使用width_met字段
      if (selectedWidth !== 'all') {
        const itemWidth = extractNumber(item.width_met);
        const targetWidth = extractNumber(selectedWidth);
        if (itemWidth === undefined || targetWidth === undefined || 
            Math.abs(itemWidth - targetWidth) > 0.01) {
          console.log(`🔍 [宽度筛选] ${item.id} 不匹配: ${itemWidth} vs ${targetWidth}`);
          return false;
        }
      }

      // 长度筛选 - 使用length_met字段
      if (selectedLength !== 'all') {
        const itemLength = extractNumber(item.length_met);
        const targetLength = extractNumber(selectedLength);
        if (itemLength === undefined || targetLength === undefined || 
            Math.abs(itemLength - targetLength) > 0.01) {
          console.log(`🔍 [长度筛选] ${item.id} 不匹配: ${itemLength} vs ${targetLength}`);
          return false;
        }
      }

      return true;
    });

    console.log(`✅ [筛选结果] 从 ${allConsumables.length} 个耗材中筛选出 ${filtered.length} 个`);

    // 分页逻辑
    const pageSize = 10;
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > pages) {
      setCurrentPage(1);
      return;
    }
    const paged = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);
    setConsumables(paged);
    setTotalItems(total);
    setTotalPages(pages);
    
    // 初始化数量状态
    const initialQuantities = paged.reduce((acc, item) => {
      acc[item.id] = 1;
      return acc;
    }, {} as Record<string, number>);
    setQuantities(initialQuantities);
  }, [allConsumables, selectedModel, selectedShape, selectedMaterial, selectedThickness, selectedWeight, selectedWidth, selectedLength, currentPage]);
  
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
      // 手动补全 properties 字段，合并 specs 并兜底
      const specs: Partial<{
        width: string;
        length: string;
        thickness: string;
        material: string;
        shape: string;
        rollLength: string;
        compatibility: string;
      }> = product.specs || {};
      const image_url = cleanImageUrl(product.image_url);
      
      // 添加更详细的名称兜底逻辑
      const resolvedName = 
        product.name || 
        product.code || 
        product.part_number ||
        product.id || 
        'N/A';

      // 调试日志：分析名称来源
      console.log('[addToCart] 耗材名称分析:', {
        'product.name': product.name,
        'product.code': product.code, 
        'product.part_number': product.part_number,
        'product.id': product.id,
        'resolvedName': resolvedName
      });

      const properties = {
        ...product,
        ...specs,
        image_url,
        brand: product.brand || 'N/A',
        model: product.model || 'N/A',
        spec: product.spec || 'N/A',
        part_number: product.part_number || product.code || product.id,
        name: resolvedName,
        // 添加多语言名称支持
        name_zh: product.name || product.code || product.id,
        name_en: product.name || product.code || product.id,
        // 添加产品代码兜底
        code: product.code || product.id,
        // 确保图片字段完整
        image: image_url,
        // 规格信息
        width: specs?.width || 'N/A',
        length: specs?.length || 'N/A',
        thickness: specs?.thickness || 'N/A',
        material: specs?.material || 'N/A',
        shape: specs?.shape || 'N/A',
        rollLength: specs?.rollLength || 'N/A',
        compatibility: specs?.compatibility || 'N/A',
        // 添加完整的 specs 嵌套对象
        specs: {
          ...specs,
          material: specs?.material || 'N/A',
          shape: specs?.shape || 'N/A',
          thickness: specs?.thickness || 'N/A',
          width: specs?.width || 'N/A',
          length: specs?.length || 'N/A',
          rollLength: specs?.rollLength || 'N/A',
          compatibility: specs?.compatibility || 'N/A'
        }
      };

      const cartItem: ExtendedCartItem = {
        item_id: parseInt(itemId) || 0,
        product_type: 'consumable',
        product_id: parseInt(itemId) || 0,
        part_number: properties.part_number,
        quantity,
        name: resolvedName,
        image_url: properties.image_url,
        unit_price: getRegionalPrice(product, quantity),
        currency: getCurrencySymbolByRegion(),
        line_total: getRegionalPrice(product, quantity) * quantity,
        inventory_status: 'in_stock',
        added_at: new Date().toISOString(),
        id: itemId,
        code: properties.part_number,
        partNumber: properties.part_number,
        image: properties.image_url,
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
          partNumber: properties.part_number,
          productName: resolvedName
        },
        price: getRegionalPrice(product, quantity),
        properties
      };
      // 调试日志
      console.log('[addToCart] product:', product);
      console.log('[addToCart] 耗材产品详细字段分析:');
      console.log('  - product.id:', product.id, '(type:', typeof product.id, ')');
      console.log('  - product.name:', product.name, '(type:', typeof product.name, ')');
      console.log('  - product.code:', product.code, '(type:', typeof product.code, ')');
      console.log('  - product.part_number:', product.part_number, '(type:', typeof product.part_number, ')');
      console.log('  - product.image_url:', product.image_url, '(type:', typeof product.image_url, ')');
      console.log('  - product.model:', product.model, '(type:', typeof product.model, ')');
      console.log('  - product.brand:', product.brand, '(type:', typeof product.brand, ')');
      console.log('  - resolvedName:', resolvedName);
      console.log('[addToCart] cartItem:', cartItem);
      console.log('[addToCart] cartItem.properties:', cartItem.properties);
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
      let errorMessage = String(t('ui.addToCartFailed') || '添加到购物车失败');
      if (error instanceof Error) {
        if (error.message?.includes('part_number')) {
          errorMessage = String(t('ui.partNumberMissing') || '产品料号信息缺失，请刷新页面重试');
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          errorMessage = String(t('ui.authExpired') || '认证失效，请刷新页面重新登录');
        } else if (error.message?.includes('400')) {
          errorMessage = String(t('ui.invalidRequest') || '请求参数错误，请检查产品信息');
        }
      }
      
      showErrorToast('添加失败', errorMessage);
    }
  };
  
  // 切换购物车模态框
  const toggleCartModal = () => {
    setShowCartModal(!showCartModal);
  };
  
  // 处理面包屑筛选移除
  const handleRemoveFilter = (filterType: string) => {
    console.log(`🗑️ [Filter Remove] Removing filter: ${filterType}`);
    
    switch (filterType) {
      case 'model':
    setSelectedModel('all');
        break;
      case 'shape':
    setSelectedShape('all');
        break;
      case 'material':
    setSelectedMaterial('all');
        break;
      case 'thickness':
    setSelectedThickness('all');
        break;
      case 'weight':
    setSelectedWeight('all');
        break;
      case 'width':
    setSelectedWidth('all');
        break;
      case 'length':
    setSelectedLength('all');
        break;
    }
    setCurrentPage(1);
  };
  
  // 智能重置筛选器
  const handleSmartResetFilters = () => {
    console.log('🔄 [Smart Reset] 智能重置所有筛选条件');
    
    // 使用动画效果重置
    if (smartFilterConfig.enableAnimation) {
      const resetWithDelay = (setter: Function, delay: number) => {
        setTimeout(() => setter('all'), delay);
      };
      
      resetWithDelay(setSelectedModel, 0);
      resetWithDelay(setSelectedShape, 100);
      resetWithDelay(setSelectedMaterial, 200);
      resetWithDelay(setSelectedThickness, 300);
      resetWithDelay(setSelectedWeight, 300);
      resetWithDelay(setSelectedWidth, 400);
      resetWithDelay(setSelectedLength, 500);
    } else {
      setSelectedModel('all');
      setSelectedShape('all');
      setSelectedMaterial('all');
      setSelectedThickness('all');
      setSelectedWeight('all');
      setSelectedWidth('all');
      setSelectedLength('all');
    }
    
    setCurrentPage(1);
    
    // 清理缓存
    setFilterCache(new Map());
  };

  // 重置筛选
  const handleResetFilters = () => {
    handleSmartResetFilters();
  };
  
  // 应用筛选
  const handleApplyFilters = () => {
    // 现在使用本地筛选，只需要重置页码即可触发useEffect重新筛选
    console.log('🔍 [handleApplyFilters] 应用筛选，重置页码触发本地筛选');
    setCurrentPage(1);
  };

  // 处理机器型号变更
  const handleModelChange = (value: string) => {
    console.log('🔧 [Model Filter] Changed:', selectedModel, '->', value);
    setSelectedModel(value);
    setCurrentPage(1); // 重置页码
    // 移除setTimeout和handleApplyFilters调用，依赖useEffect触发
  };

  // 处理形状变更
  const handleShapeChange = (value: string) => {
    console.log('🔧 [Shape Filter] Changed:', selectedShape, '->', value);
    setSelectedShape(value);
    setCurrentPage(1); // 重置页码
    // 移除setTimeout和handleApplyFilters调用
  };

  // 处理材质变更
  const handleMaterialChange = (value: string) => {
    console.log('🔧 [Material Filter] Changed:', selectedMaterial, '->', value);
    setSelectedMaterial(value);
    setCurrentPage(1); // 重置页码
    // 移除setTimeout和handleApplyFilters调用
  };

  // 处理厚度变更
  const handleThicknessChange = (value: string | number) => {
    const newValue = value === undefined ? 'all' : String(value);
    console.log('🔧 [Thickness Filter] Changed:', selectedThickness, '->', newValue);
    setSelectedThickness(newValue);
    setCurrentPage(1);
    // 移除setTimeout和handleApplyFilters调用
  };

  // 处理重量变更
  const handleWeightChange = (value: string | number) => {
    const newValue = value === undefined ? 'all' : String(value);
    console.log('🔧 [Weight Filter] Changed:', selectedWeight, '->', newValue);
    setSelectedWeight(newValue);
    setCurrentPage(1);
    // 移除setTimeout和handleApplyFilters调用
  };

  // 处理宽度变更
  const handleWidthChange = (value: string | number) => {
    const newValue = value === undefined ? 'all' : String(value);
    console.log('🔧 [Width Filter] Changed:', selectedWidth, '->', newValue);
    setSelectedWidth(newValue);
    setCurrentPage(1);
    // 移除setTimeout和handleApplyFilters调用
  };

  // 处理长度变更
  const handleLengthChange = (value: string | number) => {
    const newValue = value === undefined ? 'all' : String(value);
    console.log('🔧 [Length Filter] Changed:', selectedLength, '->', newValue);
    setSelectedLength(newValue);
    setCurrentPage(1);
    // 移除setTimeout和handleApplyFilters调用
  };

  // 处理图片错误 - 简化版本，使用数据URI避免404
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    
    // 如果当前图片已经是数据URI，说明出现了更严重的问题，不再处理
    if (target.src.startsWith('data:')) {
      console.warn('Data URI image failed to load, possible browser issue');
      return;
    }
    
    // 直接使用数据URI作为fallback，避免网络请求
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
        <div className="flex justify-center items-center p-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <LoadingState 
            size="large" 
            text={String(t('ui.loadingProductData') || '正在加载产品数据...')} 
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{String(t('ui.dataLoadFailed') || '数据加载失败')}</h3>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <Button 
            type="primary"
            onClick={() => window.location.reload()} 
            className="flex items-center px-6 py-3 shadow-lg"
          >
            <ReloadOutlined className="mr-2" />
            {String(t('ui.reload') || '重新加载')}
          </Button>
        </div>
      );
    }

    if (consumables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{String(t('ui.noMatchingProducts') || '暂无匹配产品')}</h3>
          <p className="text-gray-600 mb-6">{String(t('ui.noProductsFound') || '未找到符合当前筛选条件的耗材产品')}</p>
          <Button type="primary" onClick={handleResetFilters} className="px-6 py-3 shadow-lg">
            {String(t('ui.resetFilterConditions') || '重置筛选条件')}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {consumables.map((item, index) => {
          // 功能开关：启用标准化字段显示
          const useStandardizedFields = import.meta.env.VITE_USE_STANDARDIZED_FIELDS === 'true' || true; // 临时启用
          
          if (useStandardizedFields) {
            // 使用新的标准化产品项组件
            return (
              <StandardConsumableItem
                key={item.id}
                item={item}
                userRegion={userRegion}
                index={index}
                onAddToCart={addToCart}
                onQuantityChange={handleQuantityChange}
                quantities={quantities}
                getCurrencySymbolByRegion={getCurrencySymbolByRegion}
                getRegionalPrice={getRegionalPrice}
                handleImageError={handleImageError}
              />
            );
          }
          
          // 保留原有的产品项显示逻辑（向后兼容）
          // 获取库存状态
          const totalStock = Object.values(item.inventory || {}).reduce((sum, stock) => sum + (Number(stock) || 0), 0);
          const stockStatus = totalStock > 10 ? 'high' : totalStock > 0 ? 'low' : 'out';
          const stockColor = stockStatus === 'high' ? 'text-green-600' : stockStatus === 'low' ? 'text-yellow-600' : 'text-red-600';
          const stockBg = stockStatus === 'high' ? 'bg-green-50' : stockStatus === 'low' ? 'bg-yellow-50' : 'bg-red-50';
          
          // 计算最优价格
          const bestPrice = item.pricing?.reduce((min, pricing) => {
            const quantity = parseInt(pricing.range.replace(/[^0-9]/g, '') || '1') || 1;
            const priceValue = getRegionalPrice(item, quantity);
            return priceValue > 0 && priceValue < min ? priceValue : min;
          }, Infinity) || 0;

          return (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden group relative slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* 库存状态标签 */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${stockBg} ${stockColor} z-10`}>
                {stockStatus === 'high' ? String(t('ui.stockStatus.sufficient') || '库存充足') : 
                 stockStatus === 'low' ? String(t('ui.stockStatus.low') || '库存紧张') : 
                 String(t('ui.stockStatus.out') || '暂时缺货')}
              </div>

              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 产品图片区域 */}
                  <div className="lg:w-1/4 flex justify-center">
                    <div className="relative group-hover:scale-105 transition-transform duration-300">
                      <div className="w-40 h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-inner flex items-center justify-center">
                        <img 
                          src={cleanImageUrl(item.image_url)} 
                          alt={String(item.name || '')} 
                          className="max-w-full max-h-full object-contain drop-shadow-sm"
                          onError={handleImageError} 
                        />
                      </div>
                      {/* 产品编号标签 */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {String(item.code || '')}
                      </div>
                    </div>
                  </div>

                  {/* 产品信息区域 */}
                  <div className="lg:w-1/2 space-y-4">
                    {/* 产品标题 */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors duration-200">
                        {String(item.name || '')}
                      </h3>
                      {item.model && (
                        <p className="text-sm text-gray-600 mb-1">
                          {String(t('ui.compatibleModel') || '适用型号')}: <span className="font-medium text-gray-800">{String(item.model || '')}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{String(t('ui.productId') || '产品ID')}: {String(item.id || '')}</p>
                    </div>

                    {/* 产品规格卡片 */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {String(t('ui.productSpecs') || '产品规格')}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600 font-medium">{String(t('filter.width') || '宽度')}</span>
                          <span className="text-gray-900 font-semibold">
                            {userRegion === 'na' || userRegion === 'au' ? 
                              (item.specs?.width ? item.specs.width + ' inch' : 'N/A') : 
                              (item.specs?.width ? item.specs.width : 'N/A')
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600 font-medium">{String(t('filter.length') || '长度')}</span>
                          <span className="text-gray-900 font-semibold">
                            {userRegion === 'na' || userRegion === 'au' ? 
                              (item.specs?.length ? item.specs.length + ' inch' : 'N/A') : 
                              (item.specs?.length ? item.specs.length : 'N/A')
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600 font-medium">{String(t('rollLength') || '总长')}</span>
                          <span className="text-gray-900 font-semibold">{item.specs?.rollLength || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600 font-medium">{String(t('filter.material') || '材质')}</span>
                          <span className="text-gray-900 font-semibold">{item.specs?.material || 'N/A'}</span>
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
                        destroyTooltipOnHide={true}
                        fresh={true}
                        overlayStyle={{
                          maxWidth: 'min(600px, 90vw)',
                          zIndex: 10000
                        }}
                      >
                        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200 font-medium text-sm">
                          <InfoCircleOutlined className="mr-2" />
                          {String(t('ui.viewDetailedSpecs') || '查看详细规格')}
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* 价格与操作区域 */}
                  <div className="lg:w-1/4 flex flex-col justify-between">
                    {/* 价格展示 */}
                    <div className="mb-4">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-600 mb-1">{String(t('ui.startingPrice') || '起始价格')}</div>
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {getCurrencySymbolByRegion()}{(bestPrice === Infinity || bestPrice === 0) ? String(t('ui.priceInquiry') || '询价') : bestPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{String(t('ui.minimumOrder') || '最低订购量')}</div>
                      </div>

                      {/* 梯级价格表 */}
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-medium text-gray-700 mb-2 sticky top-0 bg-gray-50">{String(t('ui.priceSteps') || '价格阶梯')}</div>
                        {item.pricing?.slice(0, 3).map((price, idx) => {
                          const quantity = parseInt(price.range.replace(/[^0-9]/g, '') || '1') || 1;
                          const priceValue = getRegionalPrice(item, quantity);
                          const displayPrice = isNaN(priceValue) ? 0 : priceValue;
                          
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 font-medium">{price.range}</span>
                              <span className="font-bold text-green-600">
                                {getCurrencySymbolByRegion()}{displayPrice.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                        {item.pricing && item.pricing.length > 3 && (
                          <div className="text-center text-xs text-blue-500 font-medium">
                            +{item.pricing.length - 3} {String(t('ui.moreSteps') || '更多价格')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 库存信息 */}
                    <div className="mb-4">
                      <div className={`rounded-lg p-3 ${stockBg} border`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">{String(t('ui.stockStatus') || '库存状态')}</span>
                          <span className={`text-xs font-bold ${stockColor}`}>
                            {stockStatus === 'high' ? String(t('ui.sufficient') || '✓ 充足') : stockStatus === 'low' ? String(t('ui.lowWarning') || '⚠ 紧张') : String(t('ui.outIcon') || '✗ 缺货')}
                          </span>
                        </div>
                        {user?.role === 'sales' || user?.role === 'admin' ? (
                          <div className="text-xs space-y-1">
                            {Object.entries(item.inventory || {}).map(([region, stock]) => (
                              <div key={region} className="flex justify-between">
                                <span className="text-gray-600">{region.toUpperCase()}</span>
                                <span className="font-medium">{Number(stock) || 0}</span>
                              </div>
                            ))}
                            <div className="border-t pt-1 mt-1 flex justify-between font-medium">
                              <span>总计</span>
                              <span>{totalStock}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-center text-gray-600">
                            {String(t('ui.totalStock') || '总库存')}: <span className="font-medium">{totalStock}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 购买操作 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <InputNumber
                          min={1}
                          value={quantities[item.id] || 1}
                          onChange={(value) => handleQuantityChange(item.id, value || 1)}
                          className="flex-1"
                          size="large"
                          disabled={stockStatus === 'out'}
                        />
                      </div>
                      
                      {/* 库存警告 */}
                      {stockStatus === 'low' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
                          {String(t('ui.lowStockWarning') || '⚠️ 库存紧张，建议尽快下单')}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Button
                          type="primary"
                          onClick={(e) => addToCart(item.id, e.currentTarget)}
                          disabled={stockStatus === 'out'}
                          className={`
                            w-full h-12 font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300
                            ${stockStatus === 'out' 
                              ? 'bg-gray-300 border-gray-300 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                            }
                          `}
                          icon={<ShoppingCartOutlined />}
                        >
                          {stockStatus === 'out' ? String(t('ui.stockStatus.out') || '暂时缺货') : String(t('ui.addToCart') || '加入购物车')}
                        </Button>
                        
                        {/* 快速购买按钮 */}
                        {stockStatus !== 'out' && (
                          <Button
                            type="default"
                            onClick={() => {
                              addToCart(item.id);
                              // 这里可以添加跳转到结算页面的逻辑
                              success(String(t('ui.addedToCart') || '商品已添加，点击购物车进行结算'));
                            }}
                            className="w-full h-10 font-medium text-sm border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                          >
                            {String(t('ui.buyNow') || '立即购买')}
                          </Button>
                        )}
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
  
  // 获取筛选选项，确保过滤掉无效数据
  const shapes = (filterOptions?.shapes || []).filter(item => item && item.id && item.name_zh);
  const materials = (filterOptions?.materials || []).filter(item => item && item.id && item.name_zh);
  const models = (filterOptions?.models || []).filter(item => item && item.id && item.name_zh);
  const thicknesses = (filterOptions?.thicknesses || []).filter(item => item && item.id && item.name_zh);
  const weights = (filterOptions?.weights || []).filter(item => item && item.id && item.name_zh);
  const widths = (filterOptions?.widths || []).filter(item => item && item.id && item.name_zh);
  const lengths = (filterOptions?.lengths || []).filter(item => item && item.id && item.name_zh);
  const modelExplodedViews = filterOptions?.modelExplodedViews || {};
  
  // 调试日志
  console.log('🔍 Debug - Current shapes data:', shapes);
  shapes.forEach((shape, index) => {
    console.log(`🔍 Shape ${index}:`, {
      id: shape.id,
      name_zh: shape.name_zh,
      name_en: shape.name_en,
      localized_name: getLocalizedOptionName(shape),
      image_url: shape.image_url,
      hasImageUrl: !!shape.image_url
    });
  });
  
  // 调试筛选选项数据
  console.log('🔍 [Debug] Filter Options Data:', {
    currentLanguage,
    i18nLanguage: i18n.language,
    filterOptions,
    shapesCount: shapes.length,
    materialsCount: materials.length,
    modelsCount: models.length,
    sampleShape: shapes[0],
    sampleMaterial: materials[0],
    sampleModel: models[0]
  });
  
  // 条件性渲染 - 加载中状态
  if (loading) {
    return (
      <div className="consumables-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h3>{String(t('loading') || 'Loading data...')}</h3>
            <p>{String(t('loading.description') || 'Please wait while we fetch the product information.')}</p>
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
            <h3>{String(t('error.title') || 'Error')}</h3>
            <p>{error}</p>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              {String(t('error.retry') || 'Retry')}
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
        {/* 现代化页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {String(t('title') || '耗材产品')}
              </h1>
              <p className="text-lg text-gray-600">
                {String(t('subtitle') || '选择适合您设备的高品质耗材')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-500">
                <div>{String(t('ui.totalProducts', { count: totalItems }) || `总计 ${totalItems} 款产品`)}</div>
                <div>{String(t('ui.pageInfo', { current: currentPage, total: totalPages }) || `第 ${currentPage} / ${totalPages} 页`)}</div>
              </div>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={toggleCartModal}
                className="h-12 px-6 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                ref={cartButtonRef}
              >
                {String(t('button.cart') || '查看购物车')}
              </Button>
            </div>
          </div>
        </div>

        {/* 现代化筛选器设计 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden fade-in">
          {/* 筛选器标题栏 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center pulse">
                  <FilterOutlined className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{String(t('ui.smartFilter') || '智能筛选')}</h3>
                  <p className="text-sm text-gray-600">{String(t('ui.smartFilterDescription') || '精确找到您需要的耗材产品')}</p>
                </div>
              </div>
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleResetFilters}
                className="flex items-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
              >
                {String(t('ui.resetFilters') || '重置筛选')}
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* 筛选面包屑 */}
            <FilterBreadcrumb
              filters={{
                model: selectedModel !== 'all' ? selectedModel : undefined,
                shape: selectedShape !== 'all' ? selectedShape : undefined,
                material: selectedMaterial !== 'all' ? selectedMaterial : undefined,
                thickness: selectedThickness !== 'all' ? selectedThickness : undefined,
                weight: selectedWeight !== 'all' ? selectedWeight : undefined,
                width: selectedWidth !== 'all' ? selectedWidth : undefined,
                length: selectedLength !== 'all' ? selectedLength : undefined
              }}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleSmartResetFilters}
            />

            {/* 第一行：机器型号筛选 */}
            <div className="bg-gray-50 rounded-xl p-5 slide-up">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center pulse">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <h4 className="text-base font-semibold text-gray-800">{String(t('ui.selectDeviceModel') || '选择设备型号')}</h4>
                <Tooltip title={String(t('ui.deviceModelTooltip') || '选择您的设备型号以显示兼容的耗材')}>
                  <InfoCircleOutlined className="text-gray-400 hover:text-blue-500 cursor-help transition-colors duration-200" />
                </Tooltip>
              </div>
              <SmartFilterSelect
                title={String(t('filter.model') || '设备型号')}
                value={selectedModel} 
                options={smartFilterOptions.models}
                onChange={handleModelChange}
                placeholder={String(t('ui.selectDeviceModelPlaceholder') || '请选择设备型号')}
                showCount={smartFilterConfig.showCount}
                totalCount={allConsumables.length}
              />
            </div>

            {/* 第二行：产品形状筛选 */}
            <div className="slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center pulse">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <h4 className="text-base font-semibold text-gray-800">{String(t('ui.selectProductShape') || '选择产品形状')}</h4>
                <Tooltip title={String(t('ui.productShapeTooltip') || '不同形状的耗材适用于不同的包装需求')}>
                  <InfoCircleOutlined className="text-gray-400 hover:text-blue-500 cursor-help transition-colors duration-200" />
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                {/* 全部选项 */}
                <div className="relative">
                  <input 
                    type="radio"
                    id="shape-all"
                    name="shape"
                    checked={selectedShape === 'all'}
                    onChange={() => handleShapeChange('all')}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="shape-all" 
                    className={`
                      block p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center
                      ${selectedShape === 'all' 
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-blue-25'
                      }
                    `}
                  >
                    <div className="mb-4 flex justify-center">
                      <div className="h-28 w-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium">
                        {String(t('filter.all') || '全部')}
                      </div>
                    </div>
                    <div className={`
                      text-base font-medium transition-colors duration-200 flex flex-col items-center
                      ${selectedShape === 'all' ? 'text-blue-700' : 'text-gray-700'}
                    `}>
                      <span>全部形状</span>
                      {smartFilterConfig.showCount && (
                        <span className="text-xs mt-1 text-blue-500">
                          ({allConsumables.length})
                        </span>
                      )}
                    </div>
                    {selectedShape === 'all' && (
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                </div>
                {smartFilterOptions.shapes.map((shape, index) => (
                  <div key={`shape-${shape.id}-${index}`} className="relative">
                    <input 
                      type="radio"
                      id={`shape-${shape.id}`}
                      name="shape"
                      checked={selectedShape === shape.id}
                      onChange={() => handleShapeChange(shape.id)}
                      className="sr-only"
                      disabled={shape.disabled}
                    />
                    <label 
                      htmlFor={`shape-${shape.id}`} 
                      className={`
                        block p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center
                        ${shape.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
                        ${selectedShape === shape.id 
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-blue-25'
                        }
                      `}
                    >
                      <div className="mb-4 flex justify-center">
                        <img
                          src={shape.originalData?.image_url || shapePlaceholderImage}
                          alt={shape.name}
                          className="h-28 w-32 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.startsWith('data:')) {
                              console.warn('🖼️ [Shape Image] 加载失败，使用占位图片:', shape.originalData?.image_url);
                              target.src = shapePlaceholderImage;
                            }
                          }}
                        />
                      </div>
                      <div className={`
                        text-base font-medium transition-colors duration-200 flex flex-col items-center
                        ${selectedShape === shape.id ? 'text-blue-700' : 'text-gray-700'}
                        ${shape.disabled ? 'text-gray-400' : ''}
                      `}>
                        <span className={shape.disabled ? 'line-through' : ''}>{shape.name}</span>
                        {smartFilterConfig.showCount && (
                          <span className={`text-xs mt-1 ${shape.disabled ? 'text-gray-300' : 'text-blue-500'}`}>
                            ({shape.count})
                          </span>
                        )}
                      </div>
                      {selectedShape === shape.id && !shape.disabled && (
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 第三行：材质和规格筛选 */}
            <div className="bg-gray-50 rounded-xl p-5 slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center pulse">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <h4 className="text-base font-semibold text-gray-800">{String(t('ui.materialAndSpecs') || '材质与规格筛选')}</h4>
              </div>

              {/* 材质选择器 */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">{String(t('ui.materialType') || '材质类型')}</h5>
                <div className="flex flex-wrap gap-2">
                  <button 
                    className={`
                      material-btn px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm relative overflow-hidden flex items-center
                      ${selectedMaterial === 'all' 
                        ? 'bg-purple-500 text-white border-purple-500 shadow-md scale-105' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm hover:scale-105'
                      }
                    `}
                    onClick={() => handleMaterialChange('all')}
                  >
                    <span>{String(t('ui.allMaterials') || '全部材质')}</span>
                    {smartFilterConfig.showCount && (
                      <span className="ml-2 text-xs">
                        ({allConsumables.length})
                      </span>
                    )}
                  </button>
                  {smartFilterOptions.materials.map((material, index) => (
                    <button 
                      key={`material-${material.id}-${index}`}
                      className={`
                        material-btn px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm relative overflow-hidden flex items-center
                        ${material.disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                        ${selectedMaterial === material.id 
                          ? 'bg-purple-500 text-white border-purple-500 shadow-md active scale-105' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm hover:scale-105'
                        }
                      `}
                      onClick={() => !material.disabled && handleMaterialChange(material.id)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      disabled={material.disabled}
                    >
                      <span className={material.disabled ? 'line-through' : ''}>{material.name}</span>
                      {smartFilterConfig.showCount && (
                        <span className={`ml-2 text-xs ${material.disabled ? 'text-gray-300' : ''}`}>
                          ({material.count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 尺寸筛选器 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <SmartFilterSelect
                    title={isPaperMaterial(selectedMaterial) ? String(t('ui.weight') || '重量') : String(t('ui.thickness') || '厚度')}
                      value={isPaperMaterial(selectedMaterial) ? selectedWeight : selectedThickness}
                    options={isPaperMaterial(selectedMaterial) ? smartFilterOptions.weights : smartFilterOptions.thicknesses}
                      onChange={isPaperMaterial(selectedMaterial) ? handleWeightChange : handleThicknessChange}
                      placeholder={isPaperMaterial(selectedMaterial) ? String(t('ui.selectWeight') || '选择重量') : String(t('ui.selectThickness') || '选择厚度')}
                    showCount={smartFilterConfig.showCount}
                    totalCount={allConsumables.length}
                  />
                  
                  <SmartFilterSelect
                    title={String(t('filter.width') || '宽度')}
                      value={selectedWidth}
                    options={smartFilterOptions.widths}
                      onChange={handleWidthChange}
                      placeholder={String(t('ui.selectWidth') || '选择宽度')}
                    showCount={smartFilterConfig.showCount}
                    totalCount={allConsumables.length}
                  />
                  
                  <SmartFilterSelect
                    title={String(t('filter.length') || '长度')}
                      value={selectedLength}
                    options={smartFilterOptions.lengths}
                      onChange={handleLengthChange}
                      placeholder={String(t('ui.selectLength') || '选择长度')}
                    showCount={smartFilterConfig.showCount}
                    totalCount={allConsumables.length}
                  />
                </div>
                
                {/* 尺寸指导图片 */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-sm font-medium text-gray-700 mb-3">{String(t('ui.dimensionGuide') || '尺寸指导图')}</div>
                  <div className="w-full h-48 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    <img 
                      src={currentDimensionImage} 
                      alt={String(t('ui.dimensionGuideAlt') || '产品尺寸指导')}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 产品列表容器 */}
        <div className="products-container">
          {renderConsumablesTable()}
          
          {/* 翻页组件 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2 bg-white rounded-xl shadow-md border border-gray-200 p-2">
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  {String(t('ui.previousPage') || '上一页')}
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page < 1 || page > totalPages) return null;
                    
                    return (
                      <button
                        key={`page-${page}`}
                        className={`
                          w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200
                          ${currentPage === page 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }
                        `}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  }).filter(Boolean)}
                </div>
                
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  {String(t('ui.nextPage') || '下一页')}
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
        title={selectedProduct ? `${String(selectedProduct.name || '')} - ${String(t('ui.detailInfo') || '详细信息')}` : String(t('ui.productDetail') || '产品详细信息')}
        open={detailModalVisible}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            {String(t('ui.close') || '关闭')}
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
              {String(t('ui.addToCart') || '加入购物车')}
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
                  src={cleanImageUrl(selectedProduct.image_url) || placeholderImage}
                  alt={String(selectedProduct.name || '')}
                  className="w-full h-64 object-contain border border-border rounded-lg bg-card-alt p-4"
                  onError={handleImageError}
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="mb-4">
                  <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg mb-2">
                    {String(selectedProduct.code || '')}
                  </span>
                  <h3 className="text-xl font-bold text-title mb-2">{String(selectedProduct.name || '')}</h3>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">{String(t('length') || 'Length')}:</span>
                    <span className="text-content">
                      {userRegion === 'na' || userRegion === 'au' ? 
                        (selectedProduct.specs?.length ? selectedProduct.specs.length + ' inch' : 'N/A') : 
                        (selectedProduct.specs?.length ? selectedProduct.specs.length : 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">{String(t('rollLength') || 'Roll Length')}:</span>
                    <span className="text-content">{selectedProduct.specs?.rollLength || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">{String(t('filter.material') || 'Material')}:</span>
                    <span className="text-content">{selectedProduct.specs?.material || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label font-medium">{String(t('filter.thickness') || 'Thickness')}:</span>
                    <span className="text-content">{selectedProduct.specs?.thickness || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">{String(t('filter.shape') || 'Shape')}:</span>
                    <span className="text-content">{selectedProduct.specs?.shape || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">{String(t('product.model') || 'Model')}:</span>
                    <span className="text-content">{selectedProduct.specs?.compatibility || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 库存信息（仅管理员/销售可见） */}
            {(user?.role === 'sales' || user?.role === 'admin') && (
              <div className="bg-card-alt rounded-lg p-4">
                <h4 className="font-medium text-base text-label mb-3">{String(t('inventory') || 'Inventory')}:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(selectedProduct.inventory).map(([region, count]) => (
                    <div key={region} className="bg-background rounded-lg p-3 text-center">
                      <div className="text-sm text-label font-medium mb-1">{region.toUpperCase()}</div>
                      <div className={`text-lg font-bold ${(count || 0) > 0 ? 'text-success' : 'text-error'}`}>
                        {typeof count === 'number' ? count : (isNaN(Number(count)) ? 0 : Number(count))}
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