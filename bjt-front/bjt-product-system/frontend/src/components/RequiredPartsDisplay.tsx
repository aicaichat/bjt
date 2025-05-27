import React, { useState, useEffect } from 'react';
import { parseRequiredParts, getRequiredPartsDetails, RequiredPart } from '../utils/requiredPartsUtils';

interface RequiredPartsDisplayProps {
  requiredParts: string | null | undefined;
  requiredQuantity: string | null | undefined;
  className?: string;
  language?: 'zh' | 'en';
}

export const RequiredPartsDisplay: React.FC<RequiredPartsDisplayProps> = ({
  requiredParts,
  requiredQuantity,
  className = '',
  language = 'zh'
}) => {
  const [partsDetails, setPartsDetails] = useState<RequiredPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requiredParts && requiredQuantity) {
      loadRequiredPartsDetails();
    } else {
      setPartsDetails([]);
    }
  }, [requiredParts, requiredQuantity]);

  const loadRequiredPartsDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 [RequiredPartsDisplay] Loading details for:', { requiredParts, requiredQuantity });
      
      const parsedParts = parseRequiredParts(requiredParts, requiredQuantity);
      
      if (parsedParts.length === 0) {
        setPartsDetails([]);
        return;
      }
      
      const detailedParts = await getRequiredPartsDetails(parsedParts);
      setPartsDetails(detailedParts);
      
      console.log('✅ [RequiredPartsDisplay] Loaded parts details:', detailedParts);
    } catch (error) {
      console.error('❌ [RequiredPartsDisplay] Failed to load required parts details:', error);
      setError('加载必选备件信息失败');
      
      // 使用基础解析结果作为fallback
      const parsedParts = parseRequiredParts(requiredParts, requiredQuantity);
      setPartsDetails(parsedParts);
    } finally {
      setLoading(false);
    }
  };

  // 如果没有必选备件，不显示组件
  if (!requiredParts || !requiredQuantity || partsDetails.length === 0) {
    return null;
  }

  return (
    <div className={`required-parts-display ${className}`}>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 text-orange-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-orange-800">
            {language === 'zh' ? '必选备件' : 'Required Parts'}
          </h4>
          {loading && (
            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-sm text-red-600 mb-2">
            {error}
          </div>
        )}

        {/* 必选备件列表 */}
        <div className="space-y-2">
          {partsDetails.map((part, index) => {
            const displayName = language === 'zh' 
              ? (part.name_zh || part.part_number) 
              : (part.name_en || part.part_number);
            
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {/* 类型图标 */}
                  <div className={`w-2 h-2 rounded-full ${
                    part.type === 'host' ? 'bg-blue-500' :
                    part.type === 'accessory' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  
                  {/* 备件信息 */}
                  <div>
                    <span className="text-gray-700 font-medium">{displayName}</span>
                    <span className="text-gray-500 ml-2 text-xs">({part.part_number})</span>
                  </div>
                </div>
                
                {/* 数量 */}
                <span className="text-orange-700 font-medium">
                  ×{part.quantity}
                </span>
              </div>
            );
          })}
        </div>

        {/* 说明文字 */}
        <div className="mt-3 pt-3 border-t border-orange-200">
          <p className="text-xs text-orange-700">
            {language === 'zh' 
              ? '这些备件将在您添加此商品到购物车时自动添加'
              : 'These parts will be automatically added when you add this item to cart'
            }
          </p>
        </div>
      </div>
    </div>
  );
}; 