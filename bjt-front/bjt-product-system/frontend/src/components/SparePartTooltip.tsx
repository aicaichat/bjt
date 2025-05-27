import React, { useEffect, useRef } from 'react';
import { SparePart } from '../types/spareParts';

interface SparePartTooltipProps {
  sparePart: SparePart | null;
  position: { left: number; top: number };
  visible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  language?: 'zh' | 'en';
  userRegion?: string; // 用于判断公制/英制
}

export const SparePartTooltip: React.FC<SparePartTooltipProps> = ({
  sparePart,
  position,
  visible,
  onMouseEnter,
  onMouseLeave,
  language = 'zh',
  userRegion = 'cn'
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 调整tooltip位置，避免超出屏幕边界
  useEffect(() => {
    if (visible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedLeft = position.left;
      let adjustedTop = position.top;

      // 右边界检查
      if (rect.right > viewportWidth) {
        adjustedLeft = viewportWidth - rect.width - 10;
      }

      // 左边界检查
      if (adjustedLeft < 10) {
        adjustedLeft = 10;
      }

      // 下边界检查
      if (rect.bottom > viewportHeight) {
        adjustedTop = position.top - rect.height - 10;
      }

      // 上边界检查
      if (adjustedTop < 10) {
        adjustedTop = 10;
      }

      tooltip.style.left = `${adjustedLeft}px`;
      tooltip.style.top = `${adjustedTop}px`;
    }
  }, [visible, position]);

  if (!visible || !sparePart) {
    return null;
  }

  const displayName = language === 'zh' ? sparePart.name_zh : sparePart.name_en;
  const displaySpec = language === 'zh' ? sparePart.spec : sparePart.spec_imperial;
  
  // 根据用户区域选择公制或英制
  const isImperial = userRegion === 'na' || userRegion === 'au';

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl p-4 max-w-md"
      style={{
        left: position.left,
        top: position.top,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 标题区域 */}
      <div className="border-b border-gray-700 pb-3 mb-3">
        <h3 className="font-semibold text-lg text-white mb-1">
          {displayName || sparePart.part_number}
        </h3>
        <p className="text-sm text-gray-300">
          {language === 'zh' ? '料号' : 'Part Number'}: {sparePart.part_number}
        </p>
      </div>

      {/* 基础信息 - 严格按照展示逻辑 */}
      <div className="space-y-2 mb-4">
        <h4 className="font-medium text-orange-400 text-sm">
          {language === 'zh' ? '基础信息' : 'Basic Information'}
        </h4>
        
        {/* 适配机型 */}
        {sparePart.app_model && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{language === 'zh' ? '适配机型' : 'Compatible Model'}:</span>
            <span className="text-white max-w-48 text-right">{sparePart.app_model}</span>
          </div>
        )}
        
        {/* 规格 */}
        {displaySpec && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{language === 'zh' ? '规格' : 'Specification'}:</span>
            <span className="text-white max-w-48 text-right">
              {isImperial ? (sparePart.spec_imperial || sparePart.spec) : (sparePart.spec || sparePart.spec_imperial)}
            </span>
          </div>
        )}
        
        {/* 适配序列号 */}
        {sparePart.app_sn && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{language === 'zh' ? '适配序列号' : 'Compatible S/N'}:</span>
            <span className="text-white max-w-48 text-right">{sparePart.app_sn}</span>
          </div>
        )}

        {/* 单箱数量 */}
        {sparePart.pcs_per_box && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{language === 'zh' ? '单箱数量' : 'Pcs per Box'}:</span>
            <span className="text-white">{sparePart.pcs_per_box}</span>
          </div>
        )}
      </div>

      {/* 包装信息 - 严格按照展示逻辑 */}
      <div className="space-y-2 mb-4">
        <h4 className="font-medium text-blue-400 text-sm">
          {language === 'zh' ? '包装信息' : 'Packaging Information'}
        </h4>
        
        {/* 包装尺寸 */}
        {(sparePart.package_size_cm || sparePart.package_size_inch) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {language === 'zh' ? '包装尺寸' : 'Package Size'}:
            </span>
            <span className="text-white max-w-48 text-right">
              {isImperial 
                ? `${sparePart.package_size_inch || 'N/A'} inch`
                : `${sparePart.package_size_cm || 'N/A'} cm`
              }
            </span>
          </div>
        )}
        
        {/* 单件净重 */}
        {(sparePart.net_weight_kg || sparePart.net_weight_lbs) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {language === 'zh' ? '单件净重' : 'Net Weight'}:
            </span>
            <span className="text-white">
              {isImperial 
                ? `${sparePart.net_weight_lbs || 'N/A'} lbs`
                : `${sparePart.net_weight_kg || 'N/A'} kg`
              }
            </span>
          </div>
        )}
      </div>

      {/* 必选备件信息（如果有） */}
      {sparePart.required_parts && (
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-orange-400 font-medium text-sm">
              {language === 'zh' ? '包含必选备件' : 'Includes Required Parts'}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {language === 'zh' 
              ? '此备件包含必选配套组件，将自动添加到购物车'
              : 'This part includes required components that will be automatically added to cart'
            }
          </p>
        </div>
      )}

      {/* 三角形指示器 */}
      <div 
        className="absolute w-3 h-3 bg-gray-900 transform rotate-45"
        style={{
          left: '20px',
          top: '-6px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRight: 'none',
          borderBottom: 'none'
        }}
      />
    </div>
  );
}; 