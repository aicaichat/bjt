import React from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';

interface RequiredPartCartItemProps {
  item: ExtendedCartItem & { is_required: true };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
  userRegion?: string; // 用于判断公制/英制
}

export const RequiredPartCartItem: React.FC<RequiredPartCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  language = 'zh',
  userRegion = 'cn'
}) => {
  const displayName = language === 'zh' ? (item.name_zh || item.name) : (item.name_en || item.name);
  
  // 根据用户区域选择公制或英制
  const isImperial = userRegion === 'na' || userRegion === 'au';
  
  return (
    <div className="required-part-cart-item border-l-4 border-orange-400 bg-orange-50 p-4 rounded-lg mb-3">
      {/* 必选备件标识 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <span className="text-orange-600 font-medium text-sm">
          {language === 'zh' ? '必选备件' : 'Required Part'}
        </span>
        <span className="text-gray-500 text-xs">
          ({language === 'zh' ? '主商品' : 'Main Item'}: {item.parent_part_number})
        </span>
      </div>

      <div className="flex gap-4">
        {/* 产品图片 */}
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={item.image || '/images/placeholder.jpg'}
            alt={displayName}
            className="w-full h-full object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.jpg';
            }}
          />
        </div>

        {/* 产品信息 */}
        <div className="flex-1 min-w-0">
          {/* 基础信息 - 严格按照展示逻辑 */}
          <div className="space-y-1">
            {/* 适配机型 */}
            {item.app_model && (
              <div className="text-sm">
                <span className="text-gray-600">{language === 'zh' ? '适配机型' : 'Compatible Model'}:</span>
                <span className="ml-2 font-medium">{item.app_model}</span>
              </div>
            )}
            
            {/* 料号 */}
            <div className="text-sm">
              <span className="text-gray-600">{language === 'zh' ? '料号' : 'Part Number'}:</span>
              <span className="ml-2 font-medium">{item.part_number}</span>
            </div>
            
            {/* 名称 */}
            <div className="text-sm">
              <span className="text-gray-600">{language === 'zh' ? '名称' : 'Name'}:</span>
              <span className="ml-2 font-medium">{displayName}</span>
            </div>
            
            {/* 规格 */}
            {(item.spec || item.spec_imperial) && (
              <div className="text-sm">
                <span className="text-gray-600">{language === 'zh' ? '规格' : 'Specification'}:</span>
                <span className="ml-2">
                  {isImperial ? (item.spec_imperial || item.spec) : (item.spec || item.spec_imperial)}
                </span>
              </div>
            )}
            
            {/* 适配序列号 */}
            {item.app_sn && (
              <div className="text-sm">
                <span className="text-gray-600">{language === 'zh' ? '适配序列号' : 'Compatible S/N'}:</span>
                <span className="ml-2">{item.app_sn}</span>
              </div>
            )}
            
            {/* 单箱数量 */}
            {item.pcs_per_box && (
              <div className="text-sm">
                <span className="text-gray-600">{language === 'zh' ? '单箱数量' : 'Pcs per Box'}:</span>
                <span className="ml-2">{item.pcs_per_box}</span>
              </div>
            )}
          </div>

          {/* 包装信息 - 严格按照展示逻辑 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* 包装尺寸 */}
              {(item.package_size_cm || item.package_size_inch) && (
                <div>
                  <span className="text-gray-600">
                    {language === 'zh' ? '包装尺寸' : 'Package Size'}:
                  </span>
                  <div className="font-medium">
                    {isImperial 
                      ? `${item.package_size_inch || 'N/A'} inch`
                      : `${item.package_size_cm || 'N/A'} cm`
                    }
                  </div>
                </div>
              )}
              
              {/* 单件净重 */}
              {(item.net_weight_kg || item.net_weight_lbs) && (
                <div>
                  <span className="text-gray-600">
                    {language === 'zh' ? '单件净重' : 'Net Weight'}:
                  </span>
                  <div className="font-medium">
                    {isImperial 
                      ? `${item.net_weight_lbs || 'N/A'} lbs`
                      : `${item.net_weight_kg || 'N/A'} kg`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 数量和价格 */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {language === 'zh' ? '数量' : 'Quantity'}:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {language === 'zh' ? '小计' : 'Subtotal'}:
              </div>
              <div className="font-semibold text-orange-600">
                ¥{(item.unit_price * item.quantity).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 删除按钮 */}
        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-500 flex-shrink-0"
          title={language === 'zh' ? '删除' : 'Remove'}
        >
          ×
        </button>
      </div>
    </div>
  );
}; 