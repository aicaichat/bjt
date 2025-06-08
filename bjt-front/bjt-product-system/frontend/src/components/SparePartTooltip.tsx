import React, { useEffect, useRef } from 'react';
import { SparePart } from '../types/spareParts';
import { useTranslation } from 'react-i18next';
import { formatCompositeDimension, formatWeight } from '../utils/formatUtils';

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
  const { t } = useTranslation(['spareParts']);

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
  
  // 根据用户区域确定单位制
  const unitSystem = (userRegion === 'na' || userRegion === 'au') ? 'imperial' : 'metric';
  
  // 智能选择规格显示
  const displaySpec = (() => {
    if (unitSystem === 'metric') {
      return sparePart.spec?.trim() || sparePart.spec_imperial?.trim() || '';
    } else {
      return sparePart.spec_imperial?.trim() || sparePart.spec?.trim() || '';
    }
  })();

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

      {/* 详细信息 - 严格按照3个必需字段展示 */}
      <div className="space-y-2 mb-4">
        <h4 className="font-medium text-blue-400 text-sm">
          {language === 'zh' ? '详细信息' : 'Detailed Information'}
        </h4>
        
        {/* 适配序列号 - 第1个必需字段 */}
          <div className="flex justify-between text-sm">
          <span className="text-gray-400">{language === 'zh' ? '适配序列号' : 'Compatible Serial Number'}:</span>
            <span className="text-white max-w-48 text-right">
            {sparePart.app_sn || (language === 'zh' ? '通用' : 'Universal')}
            </span>
          </div>

        {/* 包装尺寸 - 第2个必需字段，智能显示单位制 */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
            {(() => {
              if (unitSystem === 'metric') {
                return String(t('details.properties.packageSizeCm', { ns: 'spareParts' }) || (language === 'zh' ? '包装尺寸(cm)' : 'Package Size(cm)'));
              } else {
                return String(t('details.properties.packageSizeInch', { ns: 'spareParts' }) || (language === 'zh' ? '包装尺寸(inch)' : 'Package Size(inch)'));
              }
            })()}:
            </span>
            <span className="text-white max-w-48 text-right">
            {(() => {
              if (unitSystem === 'metric') {
                return formatCompositeDimension(sparePart.package_size_cm) || 
                       formatCompositeDimension(sparePart.package_size_inch) || 
                       (language === 'zh' ? '请咨询客服' : 'Please contact service');
              } else {
                return formatCompositeDimension(sparePart.package_size_inch) || 
                       formatCompositeDimension(sparePart.package_size_cm) || 
                       (language === 'zh' ? '请咨询客服' : 'Please contact service');
              }
            })()}
            </span>
          </div>
        
        {/* 单件净重 - 第3个必需字段，智能显示单位制 */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
            {(() => {
              if (unitSystem === 'metric') {
                return String(t('details.properties.netWeightKg', { ns: 'spareParts' }) || (language === 'zh' ? '净重(kg)' : 'Net Weight(kg)'));
              } else {
                return String(t('details.properties.netWeightLbs', { ns: 'spareParts' }) || (language === 'zh' ? '净重(lbs)' : 'Net Weight(lbs)'));
              }
            })()}:
            </span>
            <span className="text-white">
            {(() => {
              if (unitSystem === 'metric') {
                return formatWeight(sparePart.net_weight_kg) || 
                       formatWeight(sparePart.net_weight_lbs) || 
                       (language === 'zh' ? '请咨询客服' : 'Please contact service');
              } else {
                return formatWeight(sparePart.net_weight_lbs) || 
                       formatWeight(sparePart.net_weight_kg) || 
                       (language === 'zh' ? '请咨询客服' : 'Please contact service');
              }
            })()}
            </span>
          </div>
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