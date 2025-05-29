import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FilterOptionsType
} from '../../services/consumablesService';
import { DEFAULT_REGION } from '../../config/env';
import { REGIONS, getCurrencySymbol } from '../../config/constants';
import { ASSETS } from '../../config/appConfig';
import './Consumables.css';

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
  let fixed = url.trim().replace(/^'+|'+$/g, '');
  fixed = fixed.replace(/\\/g, '/');
  if (!fixed.startsWith('/')) fixed = '/' + fixed;
  
  // 如果是相对路径，添加基础URL
  if (fixed.startsWith('/')) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    // 去掉API路径部分，只保留域名
    const domainUrl = baseUrl.replace('/wp-json/bjt/v1', '');
    return `${domainUrl}${fixed}`;
  }
  
  return fixed;
}

// 动态Tooltip内容组件
interface ConsumableTooltipContentProps {
  item: ConsumableProduct;
  userRegion: string;
}

const ConsumableTooltipContent: React.FC<ConsumableTooltipContentProps> = ({ item, userRegion }) => {
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
        setDebugInfo(`无产品ID信息: ${JSON.stringify(item, null, 2)}`);
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
            packaging_type: '纸箱装',
            package_size_cm: '待补充',
            package_size_inch: '待补充',
            unit_weight_kg: '待补充',
            unit_weight_lbs: '待补充',
            pallet_size_cm: '待补充',
            package_image_url: '',
            
            // 打托属性
            pallet_rolls_a: '待补充',
            pallet_weight_a_kg: '待补充',
            pallet_weight_a_lbs: '待补充',
            pallet_height_a_cm: '待补充',
            pallet_height_a_inch: '待补充',
            pallet_rolls_b: '待补充',
            pallet_weight_b_kg: '待补充',
            pallet_weight_b_lbs: '待补充',
            pallet_height_b_cm: '待补充',
            pallet_height_b_inch: '待补充',
            pallet_rolls_c: '待补充',
            pallet_weight_c_kg: '待补充',
            pallet_weight_c_lbs: '待补充',
            pallet_height_c_cm: '待补充',
            pallet_height_c_inch: '待补充',
            core_diameter_cm: '待补充',
            core_diameter_inch: '待补充'
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
          <span className="ml-2 text-gray-600">加载详细信息中...</span>
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
    
    // 特殊字段映射
    const fieldMappings: { [key: string]: string[] } = {
      // 基本信息映射
      'material': ['material', 'specs.material'],
      'thickness': ['thickness', 'specs.thickness'], 
      'width': ['width', 'specs.width'],
      'length': ['length', 'specs.length'],
      'rollLength': ['rollLength', 'specs.rollLength'],
      
      // 单位转换字段映射
      'width_cm': ['width_met_val', 'specs.width', 'width'],
      'width_inch': ['width_imp_val', 'specs.width_imperial', 'model_imperial'],
      'length_cm': ['length_met_val', 'specs.length', 'length'],
      'length_inch': ['length_imp_val', 'specs.length_imperial', 'model_imperial'],
      'roll_length_m': ['total_length_met_val', 'specs.rollLength', 'rollLength'],
      'roll_length_ft': ['total_length_imp_val', 'specs.rollLength_imperial', 'model_imperial'],
      
      // 包装属性映射
      'packaging_type': ['package_type', 'specs.package_type'],
      'package_size_cm': ['package_size_cm', 'specs.package_size_cm'],
      'package_size_inch': ['package_size_inch', 'specs.package_size_inch'],
      'unit_weight_kg': ['net_weight_kg', 'specs.net_weight_kg'],
      'unit_weight_lbs': ['net_weight_lbs', 'specs.net_weight_lbs'],
      'pallet_size_cm': ['pallet_size_cm', 'specs.pallet_size_cm'],
      'package_image_url': ['package_image_url', 'specs.package_image_url'],
      
      // 打托属性映射
      'pallet_rolls_a': ['pcs_per_pallet_a', 'specs.pcs_per_pallet_a'],
      'pallet_weight_a_kg': ['pallet_gross_weight_a_kg', 'specs.pallet_gross_weight_a_kg'],
      'pallet_weight_a_lbs': ['pallet_gross_weight_a_lbs', 'specs.pallet_gross_weight_a_lbs'],
      'pallet_height_a_cm': ['pallet_height_a_cm', 'specs.pallet_height_a_cm'],
      'pallet_height_a_inch': ['pallet_height_a_inch', 'specs.pallet_height_a_inch'],
      'pallet_rolls_b': ['pcs_per_pallet_b', 'specs.pcs_per_pallet_b'],
      'pallet_weight_b_kg': ['pallet_gross_weight_b_kg', 'specs.pallet_gross_weight_b_kg'],
      'pallet_weight_b_lbs': ['pallet_gross_weight_b_lbs', 'specs.pallet_gross_weight_b_lbs'],
      'pallet_height_b_cm': ['pallet_height_b_cm', 'specs.pallet_height_b_cm'],
      'pallet_height_b_inch': ['pallet_height_b_inch', 'specs.pallet_height_b_inch'],
      'pallet_rolls_c': ['pcs_per_pallet_c', 'specs.pcs_per_pallet_c'],
      'pallet_weight_c_kg': ['pallet_gross_weight_c_kg', 'specs.pallet_gross_weight_c_kg'],
      'pallet_weight_c_lbs': ['pallet_gross_weight_c_lbs', 'specs.pallet_gross_weight_c_lbs'],
      'pallet_height_c_cm': ['pallet_height_c_cm', 'specs.pallet_height_c_cm'],
      'pallet_height_c_inch': ['pallet_height_c_inch', 'specs.pallet_height_c_inch'],
      'core_diameter_cm': ['tube_inner_diameter_cm', 'specs.tube_inner_diameter_cm'],
      'core_diameter_inch': ['tube_inner_diameter_inch', 'specs.tube_inner_diameter_inch']
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
        <InfoCircleOutlined className="text-blue-500 mr-2" />
        <span className="font-bold text-gray-800 text-base">{item.name} - 详细信息</span>
      </div>
      
      {error && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          ⚠️ API调用失败，显示基础信息: {error}
        </div>
      )}
      
      {/* 调试信息展示 (开发环境) */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <details className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <summary className="cursor-pointer font-medium">🔍 调试信息 (点击展开)</summary>
          <pre className="mt-2 whitespace-pre-wrap overflow-x-auto">{debugInfo}</pre>
        </details>
      )}
      
      {/* 包装图片调试信息 (开发环境) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <summary className="cursor-pointer font-medium">📦 包装图片调试信息</summary>
          <div className="mt-2 space-y-1">
            <div><strong>原始URL:</strong> {data.package_image_url || 'undefined'}</div>
            <div><strong>SafeGet结果:</strong> {safeGet('package_image_url', '')}</div>
            <div><strong>清理后URL:</strong> {cleanImageUrl(safeGet('package_image_url', ''))}</div>
            <div><strong>是否显示图片:</strong> {safeGet('package_image_url', '') !== 'N/A' && safeGet('package_image_url', '') !== '' ? '是' : '否'}</div>
          </div>
        </details>
      )}
      
      {/* 基本规格 */}
      <div className="mb-5">
        <div className="font-bold text-gray-700 text-sm mb-3 bg-gray-50 px-3 py-2 rounded">基本规格</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700 font-medium text-sm">材质:</span>
            <span className="text-gray-900 font-semibold text-sm bg-blue-50 px-3 py-1 rounded">
              {safeGet('material', item.specs?.material || 'N/A')}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700 font-medium text-sm">
              {userRegion === 'na' || userRegion === 'au' ? '厚度/克重 mil/#:' : '厚度/克重 um/gsm:'}
            </span>
            <span className="text-gray-900 font-semibold text-sm bg-green-50 px-3 py-1 rounded">
              {(() => {
                const material = safeGet('material', '').toUpperCase();
                const thickness = safeGet('thickness', 'N/A');
                
                // 如果是纸质材料，显示格式可能不同
                if (material === 'PAPER' || material.includes('PAPER')) {
                  if (userRegion === 'na' || userRegion === 'au') {
                    // 英制：显示mil/#格式 
                    return thickness !== 'N/A' ? thickness : 'N/A';
                  } else {
                    // 公制：显示um/gsm格式
                    return thickness !== 'N/A' ? thickness : 'N/A';
                  }
                } else {
                  // 非纸质材料，显示厚度
                  if (userRegion === 'na' || userRegion === 'au') {
                    return thickness !== 'N/A' ? `${thickness} mil` : 'N/A';
                  } else {
                    return thickness !== 'N/A' ? thickness : 'N/A';
                  }
                }
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700 font-medium text-sm">
              {userRegion === 'na' || userRegion === 'au' ? '膜宽 inch:' : '膜宽 cm:'}
            </span>
            <span className="text-gray-900 font-semibold text-sm bg-yellow-50 px-3 py-1 rounded">
              {(() => {
                if (userRegion === 'na' || userRegion === 'au') {
                  const widthInch = safeGet('width_inch', '');
                  const width = safeGet('width', '');
                  if (widthInch !== 'N/A' && widthInch !== '') {
                    return widthInch.includes('inch') ? widthInch : `${widthInch} inch`;
                  } else if (width !== 'N/A' && width !== '') {
                    return width.includes('inch') || width.includes('mm') ? width : `${width} inch`;
                  }
                  return 'N/A';
                } else {
                  const widthCm = safeGet('width_cm', '');
                  const width = safeGet('width', '');
                  if (widthCm !== 'N/A' && widthCm !== '') {
                    return widthCm.includes('cm') || widthCm.includes('mm') ? widthCm : `${widthCm} cm`;
                  } else if (width !== 'N/A' && width !== '') {
                    return width;
                  }
                  return 'N/A';
                }
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700 font-medium text-sm">
              {userRegion === 'na' || userRegion === 'au' ? '袋长 inch:' : '袋长 cm:'}
            </span>
            <span className="text-gray-900 font-semibold text-sm bg-purple-50 px-3 py-1 rounded">
              {(() => {
                if (userRegion === 'na' || userRegion === 'au') {
                  const lengthInch = safeGet('length_inch', '');
                  const length = safeGet('length', '');
                  if (lengthInch !== 'N/A' && lengthInch !== '') {
                    return lengthInch.includes('inch') ? lengthInch : `${lengthInch} inch`;
                  } else if (length !== 'N/A' && length !== '') {
                    return length.includes('inch') || length.includes('m') ? length : `${length} inch`;
                  }
                  return 'N/A';
                } else {
                  const lengthCm = safeGet('length_cm', '');
                  const length = safeGet('length', '');
                  if (lengthCm !== 'N/A' && lengthCm !== '') {
                    return lengthCm.includes('cm') || lengthCm.includes('m') ? lengthCm : `${lengthCm} cm`;
                  } else if (length !== 'N/A' && length !== '') {
                    return length;
                  }
                  return 'N/A';
                }
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 col-span-2">
            <span className="text-gray-700 font-medium text-sm">
              {userRegion === 'na' || userRegion === 'au' ? '总长 ft:' : '总长 m:'}
            </span>
            <span className="text-gray-900 font-semibold text-sm bg-pink-50 px-3 py-1 rounded">
              {(() => {
                if (userRegion === 'na' || userRegion === 'au') {
                  const rollLengthFt = safeGet('roll_length_ft', '');
                  const rollLength = safeGet('rollLength', '');
                  if (rollLengthFt !== 'N/A' && rollLengthFt !== '') {
                    return rollLengthFt.includes('ft') ? rollLengthFt : `${rollLengthFt} ft`;
                  } else if (rollLength !== 'N/A' && rollLength !== '') {
                    return rollLength.includes('ft') || rollLength.includes('m') ? rollLength : `${rollLength} ft`;
                  }
                  return 'N/A';
                } else {
                  const rollLengthM = safeGet('roll_length_m', '');
                  const rollLength = safeGet('rollLength', '');
                  if (rollLengthM !== 'N/A' && rollLengthM !== '') {
                    return rollLengthM.includes('m') ? rollLengthM : `${rollLengthM} m`;
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

      {/* 包装属性 Package Info */}
      <div className="mb-5">
        <div className="font-bold text-gray-700 text-sm mb-3 bg-gray-50 px-3 py-2 rounded">包装属性 Package Info</div>
        <div className="grid grid-cols-2 gap-4">
          {/* 左侧：包装信息 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700 font-medium text-sm">包装方式:</span>
              <span className="text-gray-900 font-semibold text-sm bg-blue-50 px-3 py-1 rounded">
                {(() => {
                  const packagingType = safeGet('packaging_type', '');
                  const salesUnit = safeGet('sales_unit', '');
                  if (packagingType !== 'N/A' && packagingType !== '') {
                    return packagingType;
                  } else if (salesUnit !== 'N/A' && salesUnit !== '') {
                    return salesUnit === 'Carton' ? '纸箱装' : salesUnit;
                  }
                  return '纸箱装'; // 默认值
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700 font-medium text-sm">
                {userRegion === 'na' || userRegion === 'au' ? '包装尺寸 inch:' : '包装尺寸 cm:'}
              </span>
              <span className="text-gray-900 font-semibold text-sm bg-green-50 px-3 py-1 rounded">
                {(() => {
                  const sizeField = userRegion === 'na' || userRegion === 'au' ? 'package_size_inch' : 'package_size_cm';
                  const size = safeGet(sizeField, '');
                  return size !== 'N/A' && size !== '' ? size : '待补充';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700 font-medium text-sm">
                {userRegion === 'na' || userRegion === 'au' ? '单件净重 lbs:' : '单件净重 kg:'}
              </span>
              <span className="text-gray-900 font-semibold text-sm bg-yellow-50 px-3 py-1 rounded">
                {(() => {
                  const weightField = userRegion === 'na' || userRegion === 'au' ? 'unit_weight_lbs' : 'unit_weight_kg';
                  const weight = safeGet(weightField, '');
                  return weight !== 'N/A' && weight !== '' ? weight : '待补充';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700 font-medium text-sm">托盘尺寸 cm:</span>
              <span className="text-gray-900 font-semibold text-sm bg-purple-50 px-3 py-1 rounded">
                {(() => {
                  const palletSize = safeGet('pallet_size_cm', '');
                  return palletSize !== 'N/A' && palletSize !== '' ? palletSize : '待补充';
                })()}
              </span>
            </div>
          </div>
          
          {/* 右侧：包装实物图片 */}
          <div className="flex flex-col items-center">
            <div className="text-gray-700 font-medium text-sm mb-2">包装实物图片</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 w-full h-32 flex items-center justify-center">
              {safeGet('package_image_url', '') !== 'N/A' && safeGet('package_image_url', '') !== '' ? (
                <img 
                  src={cleanImageUrl(safeGet('package_image_url', ''))} 
                  alt="包装实物图片"
                  className="max-w-full max-h-full object-contain rounded"
                  onError={(e) => {
                    const originalUrl = safeGet('package_image_url', '');
                    const cleanedUrl = cleanImageUrl(originalUrl);
                    console.error('包装图片加载失败:');
                    console.error('  原始URL:', originalUrl);
                    console.error('  清理后URL:', cleanedUrl);
                    console.error('  实际请求URL:', (e.target as HTMLImageElement).src);
                    
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.package-fallback') as HTMLElement;
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }
                  }}
                />
              ) : null}
              <div className={`text-center text-gray-500 text-xs package-fallback ${safeGet('package_image_url', '') !== 'N/A' && safeGet('package_image_url', '') !== '' ? 'hidden' : ''}`}>
                <div>📦</div>
                <div>暂无包装图片</div>
                {/* 调试信息 */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-1">
                    图片URL: {safeGet('package_image_url', '')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 打托属性 Pallet Info */}
      <div className="mb-4">
        <div className="font-bold text-gray-700 text-sm mb-3 bg-gray-50 px-3 py-2 rounded">打托属性 Pallet Info</div>
        <div className="grid grid-cols-3 gap-4">
          {/* 配置A */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-blue-800 text-sm mb-2">配置A</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700">一托卷数:</span>
                <span className="font-semibold text-gray-800">{safeGet('pallet_rolls_a', '') !== 'N/A' ? safeGet('pallet_rolls_a', '') : '待补充'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {userRegion === 'na' || userRegion === 'au' ? '毛重 lbs:' : '毛重 kg:'}
                </span>
                <span className="font-semibold text-gray-800">
                  {(() => {
                    const weightField = userRegion === 'na' || userRegion === 'au' ? 'pallet_weight_a_lbs' : 'pallet_weight_a_kg';
                    const weight = safeGet(weightField, '');
                    return weight !== 'N/A' ? weight : '待补充';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {userRegion === 'na' || userRegion === 'au' ? '高度 inch:' : '高度 cm:'}
                </span>
                <span className="font-semibold text-gray-800">
                  {(() => {
                    const heightField = userRegion === 'na' || userRegion === 'au' ? 'pallet_height_a_inch' : 'pallet_height_a_cm';
                    const height = safeGet(heightField, '');
                    return height !== 'N/A' ? height : '待补充';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* 配置B */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-green-800 text-sm mb-2">配置B</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700">一托卷数:</span>
                <span className="font-semibold text-gray-800">{safeGet('pallet_rolls_b', '') !== 'N/A' ? safeGet('pallet_rolls_b', '') : '待补充'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {userRegion === 'na' || userRegion === 'au' ? '毛重 lbs:' : '毛重 kg:'}
                </span>
                <span className="font-semibold text-gray-800">
                  {(() => {
                    const weightField = userRegion === 'na' || userRegion === 'au' ? 'pallet_weight_b_lbs' : 'pallet_weight_b_kg';
                    const weight = safeGet(weightField, '');
                    return weight !== 'N/A' ? weight : '待补充';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {userRegion === 'na' || userRegion === 'au' ? '高度 inch:' : '高度 cm:'}
                </span>
                <span className="font-semibold text-gray-800">
                  {(() => {
                    const heightField = userRegion === 'na' || userRegion === 'au' ? 'pallet_height_b_inch' : 'pallet_height_b_cm';
                    const height = safeGet(heightField, '');
                    return height !== 'N/A' ? height : '待补充';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* 配置C */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="font-semibold text-yellow-800 text-sm mb-2">配置C</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700">一托卷数:</span>
                <span className="font-semibold text-gray-800">{safeGet('pallet_rolls_c', '') !== 'N/A' ? safeGet('pallet_rolls_c', '') : '待补充'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {userRegion === 'na' || userRegion === 'au' ? '毛重 lbs:' : '毛重 kg:'}
                </span>
                <span className="font-semibold text-gray-800">
                  {(() => {
                    const weightField = userRegion === 'na' || userRegion === 'au' ? 'pallet_weight_c_lbs' : 'pallet_weight_c_kg';
                    const weight = safeGet(weightField, '');
                    return weight !== 'N/A' ? weight : '待补充';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {userRegion === 'na' || userRegion === 'au' ? '高度 inch:' : '高度 cm:'}
                </span>
                <span className="font-semibold text-gray-800">
                  {(() => {
                    const heightField = userRegion === 'na' || userRegion === 'au' ? 'pallet_height_c_inch' : 'pallet_height_c_cm';
                    const height = safeGet(heightField, '');
                    return height !== 'N/A' ? height : '待补充';
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 纸筒内径 */}
        <div className="mt-3 bg-purple-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium text-sm">
              {userRegion === 'na' || userRegion === 'au' ? '纸筒内径 inch:' : '纸筒内径 cm:'}
            </span>
            <span className="text-gray-900 font-semibold text-sm bg-white px-3 py-1 rounded shadow-sm">
              {(() => {
                const diameterField = userRegion === 'na' || userRegion === 'au' ? 'core_diameter_inch' : 'core_diameter_cm';
                const diameter = safeGet(diameterField, '');
                return diameter !== 'N/A' ? diameter : '待补充';
              })()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <span className="text-sm text-gray-500">💡 产品详细规格信息</span>
      </div>
    </div>
  );
};

const ConsumablesPage: React.FC = () => {
  const { t, i18n } = useTranslation('consumables');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  
  // 现代化UI组件hooks
  const { success, error: showErrorToast, warning, info } = useToastNotifications();
  
  // 获取当前语言
  const currentLanguage = i18n.language || 'zh';
  
  // 所有状态定义 - 必须在组件顶部，不能有条件调用
  const [consumables, setConsumables] = useState<ConsumableProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType | null>(null);
  
  // 筛选条件状态
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedShape, setSelectedShape] = useState<string>('MEX');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [selectedWidth, setSelectedWidth] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  const [showModelUsage, setShowModelUsage] = useState<boolean>(false);
  
  // 详细信息Modal状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ConsumableProduct | null>(null);
  
  // 添加状态来跟踪当前选中形状的尺寸图片
  const [currentDimensionImage, setCurrentDimensionImage] = useState<string>(dimensionGuidePlaceholder);

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

  // 获取用户区域
  const userRegion = user?.region || DEFAULT_REGION;

  // 在组件开始处添加ref
  const cartButtonRef = useRef<HTMLElement>(null);
  
  // 使用useCallback稳定回调函数引用
  const handleConsumablesSuccess = useCallback((data: any) => {
    console.log('✅ 耗材页面数据加载成功:', data);
  }, []);
  
  const handleConsumablesError = useCallback((error: string) => {
    console.error('❌ 耗材页面数据加载失败:', error);
  }, []);
  
  // SQL Mock数据服务Hook
  const { 
    data: mockConsumablesData, 
    loading: mockLoading, 
    error: mockError 
  } = useConsumables({
    page: 1,
    pageSize: 20,
    shape: 'all',
    material: 'all'
  }, {
    onSuccess: handleConsumablesSuccess,
    onError: handleConsumablesError
  });
  
  // 获取形状和材料数据
  const { data: shapesData } = useShapes();
  
  const { data: materialsData } = useMaterials();
  
  // 初始化默认尺寸图片
  useEffect(() => {
    if (filterOptions?.shapes && filterOptions.shapes.length > 0) {
      // 查找默认选中形状(MEX)的image_url2
      const defaultShape = filterOptions.shapes.find(shape => shape.id === selectedShape);
      if (defaultShape && defaultShape.image_url2) {
        setCurrentDimensionImage(defaultShape.image_url2);
      }
    }
  }, [filterOptions?.shapes, selectedShape]);

  // 获取耗材数据
  useEffect(() => {
    const fetchConsumables = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const categoryFilter = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;
        
        // 构建筛选参数
        const filters: ConsumableFilters = {
          model: selectedModel,
          shape: selectedShape,
          material: selectedMaterial,
          thickness: selectedThickness === 'all' ? undefined : selectedThickness,
          weight: selectedWeight === 'all' ? undefined : selectedWeight,
          width: selectedWidth === 'all' ? undefined : selectedWidth,
          length: selectedLength === 'all' ? undefined : selectedLength,
          page: currentPage,
          page_size: 10,
          region: userRegion,
          lang: navigator.language.startsWith('zh') ? 'zh' : 'en',
          category_id: categoryFilter
        };
        
        const consumableData = await consumablesService.getConsumables(filters);
        console.log('ConsumableData received in Page:', JSON.stringify(consumableData, null, 2));
        console.log('🔍 Debug - FilterOptions shapes:', consumableData.filterOptions?.shapes);
        
        // 添加翻页数据调试信息
        console.log('📄 [Pagination Debug] API Response Pagination Data:');
        console.log('  - Total Items:', consumableData.total);
        console.log('  - Total Pages:', consumableData.total_pages);
        console.log('  - Current Page:', consumableData.page);
        console.log('  - Items Length:', consumableData.items?.length);
        console.log('  - Page Size:', consumableData.page_size);
        console.log('  - Request Filters:', filters);
        
        setConsumables(consumableData.items || []);
        
        // 确保翻页数据都是有效数字
        const totalFromAPI = Number(consumableData.total) || 0;
        const totalPagesFromAPI = Number(consumableData.total_pages) || 1;
        
        setTotalItems(totalFromAPI);
        setTotalPages(Math.max(1, totalPagesFromAPI));
        
        // 注释掉这行代码，它会重置用户选择的页码，导致页数变了但内容没变
        // setCurrentPage(prev => Math.max(1, Math.min(prev, totalPagesFromAPI)));
        
        setFilterOptions(consumableData.filterOptions);
        
        // 添加状态设置后的调试信息
        console.log('📄 [Pagination Debug] State After Setting:');
        console.log('  - totalItems will be set to:', totalFromAPI);
        console.log('  - totalPages will be set to:', Math.max(1, totalPagesFromAPI));
        console.log('  - currentPage preserved as:', currentPage, '(user choice maintained)');
          
          // 初始化数量状态
          const initialQuantities: Record<string, number> = {};
        consumableData.items.forEach(item => {
            initialQuantities[item.id] = 1;
          });
          setQuantities(initialQuantities);

      } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : t('error.systemError');
        console.error('Failed to fetch consumables:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsumables();
  }, [selectedModel, selectedShape, selectedMaterial, selectedThickness, 
      selectedWeight, selectedWidth, selectedLength, currentPage, userRegion, t, searchParams]);
  
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
      const properties = {
        ...product,
        ...specs,
        image_url,
        brand: product.brand || 'N/A',
        model: product.model || 'N/A',
        spec: product.spec || 'N/A',
        part_number: product.part_number || product.code || product.id,
        name: product.name || 'N/A',
        width: specs?.width || 'N/A',
        length: specs?.length || 'N/A',
        thickness: specs?.thickness || 'N/A',
        material: specs?.material || 'N/A',
        shape: specs?.shape || 'N/A',
        rollLength: specs?.rollLength || 'N/A',
        compatibility: specs?.compatibility || 'N/A',
      };
      const cartItem: ExtendedCartItem = {
        item_id: parseInt(itemId) || 0,
        product_type: 'consumable',
        product_id: parseInt(itemId) || 0,
        part_number: properties.part_number,
        quantity,
        name: properties.name,
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
          productName: properties.name
        },
        price: getRegionalPrice(product, quantity),
        properties
      };
      // 调试日志
      console.log('[addToCart] product:', product);
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
      let errorMessage = '添加到购物车失败';
      if (error instanceof Error) {
        if (error.message?.includes('part_number')) {
          errorMessage = '产品料号信息缺失，请刷新页面重试';
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          errorMessage = '认证失效，请刷新页面重新登录';
        } else if (error.message?.includes('400')) {
          errorMessage = '请求参数错误，请检查产品信息';
        }
      }
      
      showErrorToast('添加失败', errorMessage);
    }
  };
  
  // 切换购物车模态框
  const toggleCartModal = () => {
    setShowCartModal(!showCartModal);
  };
  
  // 处理型号变更
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };
  
  // 处理形状变更
  const handleShapeChange = (value: string) => {
    setSelectedShape(value);
    
    // 查找选中形状的image_url2并更新尺寸图片
    const selectedShapeData = shapesData?.find(shape => shape.id === value);
    if (selectedShapeData && selectedShapeData.image_url2) {
      setCurrentDimensionImage(selectedShapeData.image_url2);
    } else {
      // 如果没有image_url2，回退到默认图片
      setCurrentDimensionImage(dimensionGuidePlaceholder);
    }
  };
  
  // 处理材质变更
  const handleMaterialChange = (value: string) => {
    setSelectedMaterial(value);
  };
  
  // 处理厚度变更
  const handleThicknessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedThickness(event.target.value);
  };
  
  // 处理重量变更
  const handleWeightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeight(event.target.value);
  };
  
  // 处理宽度变更
  const handleWidthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWidth(event.target.value);
  };
  
  // 处理长度变更
  const handleLengthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLength(event.target.value);
  };
  
  // 重置筛选
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedShape('MEX');
    setSelectedMaterial('hdpe');
    setSelectedThickness('all');
    setSelectedWeight('all');
    setSelectedWidth('all');
    setSelectedLength('all');
    
    // 重置后自动应用筛选
    setCurrentPage(1);
  };
  
  // 应用筛选
  const handleApplyFilters = () => {
    // 重置页码并触发数据加载
    setCurrentPage(1);
  };

  // 处理图片错误 - 简化版本，使用数据URI避免404
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    // 如果当前图片已经是数据URI，说明出现了更严重的问题，不再处理
    if (target.src.startsWith('data:')) {
      console.warn('数据URI图片加载失败，可能是浏览器问题');
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
        <div className="flex justify-center items-center p-16 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
          <LoadingState 
            size="large" 
            text={t('loading', 'Loading data...')} 
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
          <Button 
            type="primary"
            onClick={() => window.location.reload()} 
            className="flex items-center"
          >
            <ReloadOutlined className="mr-2" />
            {t('error.retry', '重试')}
          </Button>
        </div>
      );
    }

    if (consumables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-lg shadow-md">
          <svg className="h-16 w-16 text-content-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-title">{t('noProducts.title', '没有找到符合条件的产品')}</h3>
          <p className="mt-2 text-content-light">{t('noProducts.message', '请尝试调整筛选条件')}</p>
          <Button type="primary" onClick={handleResetFilters} className="mt-4">
            {t('button.resetFilters', '重置筛选条件')}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {consumables.map((item) => (
          <div 
            key={item.id} 
            className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border text-content overflow-hidden"
          >
            <div className="flex flex-col md:flex-row p-6">
              {/* 列1: 图片 */}
              <div className="w-full md:w-1/6 flex items-center justify-center md:justify-start mb-4 md:mb-0">
                <div className="relative">
                  <img 
                    src={cleanImageUrl(item.image_url) || placeholderImage} 
                    alt={item.name} 
                    className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-card-alt p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                    onError={handleImageError}
                  />
                </div>
              </div>

              {/* 列2: 信息与规格 */}
              <div className="w-full md:w-3/6 md:px-4">
                <div className="mb-4">
                  <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">{item.code}</span>
                  <h3 className="text-xl font-bold text-title mt-2 leading-tight line-clamp-2">{item.name}</h3>
                  {item.model && (
                    <div className="text-sm text-content-light mt-1">
                      <span>型号: {item.model}</span>
                    </div>
                  )}
                  {/* 可选显示 productId */}
                  <div className="text-xs text-content-light mt-1 opacity-60">ID: {item.id}</div>
                </div>

                {/* 规格信息（公制/英制自动切换） */}
                <div className="bg-card-alt rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">宽度:</strong>
                      <span className="text-content font-medium ml-2">
                        {userRegion === 'na' || userRegion === 'au' ? 
                          (item.specs?.width ? item.specs.width + ' inch' : 'N/A') : 
                          (item.specs?.width ? item.specs.width : 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">长度:</strong>
                      <span className="text-content font-medium ml-2">
                        {userRegion === 'na' || userRegion === 'au' ? 
                          (item.specs?.length ? item.specs.length + ' inch' : 'N/A') : 
                          (item.specs?.length ? item.specs.length : 'N/A')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">卷长:</strong>
                      <span className="text-content font-medium ml-2">{item.specs?.rollLength || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <strong className="w-16 text-label font-medium">材质:</strong>
                      <span className="text-content font-medium ml-2">{item.specs?.material || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-buttons-container">
                  <Tooltip
                    title={<ConsumableTooltipContent item={item} userRegion={userRegion} />}
                    placement="topRight"
                    styles={{ 
                      root: {
                        maxWidth: '650px',
                        zIndex: 10000
                      }
                    }}
                    classNames={{ root: "consumables-custom-tooltip" }}
                    color="white"
                    arrow={true}
                    trigger="hover"
                  >
                    <button className="more-info-btn">
                      <InfoCircleOutlined />
                      更多信息
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* 列3: 价格与操作 */}
              <div className="w-full md:w-2/6 flex flex-col justify-between mt-4 md:mt-0 md:pl-4 md:border-l md:border-border">
                <div>
                  <h4 className="font-medium text-sm text-label mb-2">价格:</h4>
                  <div className="space-y-1">
                    {item.pricing.map((price, idx) => {
                      const quantity = parseInt(price.range.replace(/[^0-9]/g, '') || '1') || 1;
                      const priceValue = getRegionalPrice(item, quantity);
                      const displayPrice = isNaN(priceValue) ? 0 : priceValue;
                      
                      return (
                        <div key={idx} className="flex justify-between items-center bg-background rounded px-3 py-1 text-sm hover:bg-brand-light transition-colors">
                          <span className="text-content-light">{price.range}:</span>
                          <span className="font-semibold text-brand-primary">
                            {getCurrencySymbolByRegion()}{displayPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 库存信息（仅管理员/销售可见） */}
                  {(user?.role === 'sales' || user?.role === 'admin') && (
                    <div className="mt-3 bg-background p-2 rounded border border-border">
                      <h4 className="font-medium text-sm text-label mb-1">库存:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(item.inventory).map(([region, count]) => (
                          <div key={region} className="flex justify-between items-center px-2 py-1 rounded border border-border">
                            <span className="font-medium">{region.toUpperCase()}:</span>
                            <span className={`font-medium ${(count || 0) > 0 ? 'text-success' : 'text-error'}`}>
                              {isNaN(count) ? 0 : count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  {/* 自定义数量选择器 */}
                  <div className="quantity-selector-container">
                    <label className="quantity-label">数量:</label>
                    <div className="quantity-selector">
                      <button 
                        className="quantity-btn quantity-decrease"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                        disabled={(quantities[item.id] || 1) <= 1}
                        type="button"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={quantities[item.id] || 1}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                        max="9999"
                      />
                      <button 
                        className="quantity-btn quantity-increase"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="primary"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => addToCart(item.id, e.currentTarget)}
                    className="cart-add-button"
                    icon={<ShoppingCartOutlined />}
                    size="large"
                  >
                    加入购物车
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 获取筛选选项
  const shapes = filterOptions?.shapes || [];
  const materials = filterOptions?.materials || [];
  const models = filterOptions?.models || [];
  const thicknesses = filterOptions?.thicknesses || [];
  const weights = filterOptions?.weights || [];
  const widths = filterOptions?.widths || [];
  const lengths = filterOptions?.lengths || [];
  const modelExplodedViews = filterOptions?.modelExplodedViews || {};
  
  // 调试日志
  console.log('🔍 Debug - Current shapes data:', shapes);
  shapes.forEach((shape, index) => {
    console.log(`🔍 Shape ${index}:`, {
      id: shape.id,
      name: shape.name,
      image_url: shape.image_url,
      hasImageUrl: !!shape.image_url
    });
  });
  
  // 条件性渲染 - 加载中状态
  if (loading) {
    return (
      <div className="consumables-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h3>{t('loading', 'Loading data...')}</h3>
            <p>{t('loading.description', 'Please wait while we fetch the product information.')}</p>
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
            <h3>{t('error.title', 'Error')}</h3>
            <p>{error}</p>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              {t('error.retry', 'Retry')}
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
        <div className="section-title">
          <div className="title-text">
            <h2>{t('title', 'Consumable Products')}</h2>
            <p>{t('subtitle', 'BJT Bubble Films, Cushioning Bags and Other Products')}</p>
          </div>
          <div className="ml-auto flex items-center">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={toggleCartModal}
              className="flex items-center cart-button"
              ref={cartButtonRef}
            >
              {t('button.cart', 'View Cart')}
            </Button>
          </div>
        </div>
        
        <div className="filter-container">
          {/* 优化筛选区标题 */}
          <div className="mb-4 flex items-center">
            <FilterOutlined className="mr-2 text-brand-primary" />
            <h3 className="text-lg font-semibold m-0 text-title">{t('filter.title', 'Product Filters')}</h3>
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
              className="ml-auto text-sm"
              size="small"
            >
              {t('button.reset', 'Reset')}
            </Button>
          </div>

          <div className="filter-section">
            <div className="filter-group">
              <label className="block text-sm font-medium mb-2 text-label">{t('filter.machine', 'Machine Model')}:</label>
              <div className="flex items-center">
                <Select 
                  value={selectedModel} 
                  onChange={(value: string) => setSelectedModel(value)}
                  style={{ width: '100%', maxWidth: '300px' }}
                  className="mr-2"
                >
                {models.map(model => (
                    <Option key={model.id} value={model.id}>{model.name}</Option>
                  ))}
                </Select>
                <Tooltip title={t('help.machineModel', 'Select the machine model to filter compatible consumables')}>
                  <Button type="text" shape="circle" icon={<InfoCircleOutlined />} />
                </Tooltip>
              </div>
            </div>
          </div>
          
          <div className="filter-section">
            <h3 className="text-base font-medium mb-3 text-label">{t('filter.shape', 'Shape')}</h3>
            <div className="shape-selector">
              {shapes.map(shape => (
                <div key={shape.id} className="shape-option">
                  <input 
                    type="radio"
                    id={`shape-${shape.id}`}
                    name="shape"
                    checked={selectedShape === shape.id}
                    onChange={() => handleShapeChange(shape.id)}
                  />
                  <label htmlFor={`shape-${shape.id}`} className="shape-label bg-card shadow-sm hover:shadow-md transition-shadow">
                    <img src={shape.image_url || shapePlaceholderImage} alt={shape.name} className="object-contain h-14 w-20" />
                    <span className="mt-2 font-medium text-sm">{shape.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="filter-section">
            <div className="filter-row mb-3">
              <div className="filter-group">
                <label className="block text-sm font-medium mb-2 text-label">{t('filter.material', 'Material')}:</label>
                <div className="material-selector">
                  {materials.map(material => (
                    <button 
                      key={material.id}
                      className={`material-btn ${selectedMaterial === material.id ? 'active' : ''}`}
                      onClick={() => handleMaterialChange(material.id)}
                    >
                      {material.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="dimensions-container">
              <div className="dimensions-filters grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-7/12">
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{isPaperMaterial(selectedMaterial) ? t('filter.weight', 'Weight') : t('filter.thickness', 'Thickness')}:</label>
                  <Select 
                    value={isPaperMaterial(selectedMaterial) ? selectedWeight : selectedThickness}
                    onChange={isPaperMaterial(selectedMaterial) ? (value: string) => setSelectedWeight(value) : (value: string) => setSelectedThickness(value)}
                    style={{ width: '100%' }}
                  >
                    {(isPaperMaterial(selectedMaterial) ? weights : thicknesses).map(item => (
                      <Option key={item.id} value={item.id}>{item.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{t('filter.width', 'Width')}:</label>
                  <Select
                    value={selectedWidth}
                    onChange={(value: string) => setSelectedWidth(value)}
                    style={{ width: '100%' }}
                  >
                    {widths.map(width => (
                      <Option key={width.id} value={width.id}>{width.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="filter-group vertical">
                  <label className="block text-sm font-medium mb-2 text-label">{t('filter.length', 'Length')}:</label>
                  <Select
                    value={selectedLength}
                    onChange={(value: string) => setSelectedLength(value)}
                    style={{ width: '100%' }}
                  >
                    {lengths.map(length => (
                      <Option key={length.id} value={length.id}>{length.name}</Option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="dimension-image w-full md:w-5/12 flex justify-center items-center">
                <img 
                  src={currentDimensionImage} 
                  alt={t('filter.dimensions', 'Product Dimensions')} 
                  className="object-contain max-h-60 border border-border rounded p-2 bg-card"
                />
              </div>
            </div>
          </div>
          
          <div className="filter-actions flex justify-end mt-4">
            <Button 
              type="primary" 
              onClick={handleApplyFilters} 
              className="btn-apply"
            >
              {t('button.apply', 'Apply Filters')}
            </Button>
          </div>
        </div>
        
        <div className="products-container">
          {/* 表格式布局 */}
          {renderConsumablesTable()}
          
          {/* 翻页组件 */}
          {(() => {
            console.log('📄 [Render] Pagination check - totalPages:', totalPages, 'currentPage:', currentPage, 'totalItems:', totalItems);
            return null;
          })()}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              {/* 调试信息 (开发环境显示) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-600 border">
                  <strong>翻页调试信息:</strong> 当前页={currentPage}, 总页数={totalPages}, 总记录={totalItems}, 
                  每页={10}条
                </div>
              )}
              <div className="pagination">
                <button 
                  className="pagination-button"
                  onClick={() => {
                    const targetPage = Math.max(1, currentPage - 1);
                    console.log('📄 [Previous Page] Click Event:');
                    console.log('  - Current Page:', currentPage);
                    console.log('  - Target Page:', targetPage);
                    console.log('  - Will trigger useEffect:', targetPage !== currentPage);
                    setCurrentPage(targetPage);
                  }}
                  disabled={currentPage === 1}
                >
                  上一页
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    // 确保page是有效数字且在合理范围内
                    if (page < 1 || page > totalPages) {
                      return null;
                    }
                    return (
                      <button
                        key={`page-${page}`}
                        className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        onClick={() => {
                          console.log('📄 [Page] Click Event:');
                          console.log('  - Current Page:', currentPage);
                          console.log('  - Target Page:', page);
                          console.log('  - Will trigger useEffect:', page !== currentPage);
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </button>
                    );
                  }).filter(Boolean)}
                </div>
                <button 
                  className="pagination-button"
                  onClick={() => {
                    const targetPage = Math.min(totalPages, currentPage + 1);
                    console.log('📄 [Next Page] Click Event:');
                    console.log('  - Current Page:', currentPage);
                    console.log('  - Target Page:', targetPage);
                    console.log('  - Total Pages:', totalPages);
                    console.log('  - Will trigger useEffect:', targetPage !== currentPage);
                    setCurrentPage(targetPage);
                  }}
                  disabled={currentPage === totalPages}
                >
                  下一页
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
        title={selectedProduct ? `${selectedProduct.name} - 详细信息` : '产品详细信息'}
        open={detailModalVisible}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            关闭
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
              加入购物车
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
                  alt={selectedProduct.name}
                  className="w-full h-64 object-contain border border-border rounded-lg bg-card-alt p-4"
                  onError={handleImageError}
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="mb-4">
                  <span className="inline-block bg-primary text-white px-3 py-1 text-sm font-bold rounded-lg mb-2">
                    {selectedProduct.code}
                  </span>
                  <h3 className="text-xl font-bold text-title mb-2">{selectedProduct.name}</h3>
                  {selectedProduct.model && (
                    <p className="text-content-light mb-2">型号: {selectedProduct.model}</p>
                  )}
                  <p className="text-xs text-content-light opacity-60">产品ID: {selectedProduct.id}</p>
                </div>
                
                {/* 价格信息 */}
                <div className="bg-card-alt rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-sm text-label mb-2">价格信息:</h4>
                  <div className="space-y-2">
                    {selectedProduct.pricing.map((price, idx) => {
                      const quantity = parseInt(price.range.replace(/[^0-9]/g, '') || '1') || 1;
                      const priceValue = getRegionalPrice(selectedProduct, quantity);
                      const displayPrice = isNaN(priceValue) ? 0 : priceValue;
                      
                      return (
                        <div key={idx} className="flex justify-between items-center bg-background rounded px-3 py-2">
                          <span className="text-content-light">{price.range}:</span>
                          <span className="font-semibold text-brand-primary text-lg">
                            {getCurrencySymbolByRegion()}{displayPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 详细规格 */}
            <div className="bg-card-alt rounded-lg p-4 mb-4">
              <h4 className="font-medium text-base text-label mb-3">详细规格:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label font-medium">宽度:</span>
                    <span className="text-content">
                      {userRegion === 'na' || userRegion === 'au' ? 
                        (selectedProduct.specs?.width ? selectedProduct.specs.width + ' inch' : 'N/A') : 
                        (selectedProduct.specs?.width ? selectedProduct.specs.width : 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">长度:</span>
                    <span className="text-content">
                      {userRegion === 'na' || userRegion === 'au' ? 
                        (selectedProduct.specs?.length ? selectedProduct.specs.length + ' inch' : 'N/A') : 
                        (selectedProduct.specs?.length ? selectedProduct.specs.length : 'N/A')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">卷长:</span>
                    <span className="text-content">{selectedProduct.specs?.rollLength || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">材质:</span>
                    <span className="text-content">{selectedProduct.specs?.material || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label font-medium">厚度:</span>
                    <span className="text-content">{selectedProduct.specs?.thickness || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">形状:</span>
                    <span className="text-content">{selectedProduct.specs?.shape || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label font-medium">兼容性:</span>
                    <span className="text-content">{selectedProduct.specs?.compatibility || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 库存信息（仅管理员/销售可见） */}
            {(user?.role === 'sales' || user?.role === 'admin') && (
              <div className="bg-card-alt rounded-lg p-4">
                <h4 className="font-medium text-base text-label mb-3">库存信息:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(selectedProduct.inventory).map(([region, count]) => (
                    <div key={region} className="bg-background rounded-lg p-3 text-center">
                      <div className="text-sm text-label font-medium mb-1">{region.toUpperCase()}</div>
                      <div className={`text-lg font-bold ${(count || 0) > 0 ? 'text-success' : 'text-error'}`}>
                        {isNaN(count) ? 0 : count}
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