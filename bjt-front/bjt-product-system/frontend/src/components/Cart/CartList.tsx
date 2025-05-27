import React from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';
import { RequiredPartCartItem } from './RequiredPartCartItem';

interface CartListProps {
  items: ExtendedCartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
  userRegion?: string;
}

// 普通购物车项目组件
const CartItem: React.FC<{
  item: ExtendedCartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
}> = ({ item, onUpdateQuantity, onRemove, language = 'zh' }) => {
  const displayName = language === 'zh' ? (item.name_zh || item.name) : (item.name_en || item.name);
  
  return (
    <div className="cart-item border border-gray-200 bg-white p-4 rounded-lg mb-3">
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
          <h4 className="font-medium text-gray-900 mb-1">{displayName}</h4>
          <p className="text-sm text-gray-600 mb-2">
            {language === 'zh' ? '料号' : 'Part Number'}: {item.part_number}
          </p>
          
          {/* 数量和价格 */}
          <div className="flex items-center justify-between">
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
              <div className="font-semibold text-blue-600">
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

export const CartList: React.FC<CartListProps> = ({
  items,
  onUpdateQuantity,
  onRemove,
  language = 'zh',
  userRegion = 'cn'
}) => {
  // 分离主要商品和必选备件
  const mainItems = items.filter(item => !item.is_required);
  const requiredItems = items.filter(item => item.is_required);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{language === 'zh' ? '购物车为空' : 'Cart is empty'}</p>
        <p className="text-sm mt-2">
          {language === 'zh' ? '添加一些商品开始购物吧' : 'Add some items to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 主要商品区域 */}
      {mainItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {language === 'zh' ? '主要商品' : 'Main Items'}
          </h3>
          <div className="space-y-3">
            {mainItems.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* 必选备件区域 */}
      {requiredItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-orange-600">
              {language === 'zh' ? '必选备件' : 'Required Parts'}
            </h3>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-orange-700">
              {language === 'zh' 
                ? '以下备件是主商品的必选配套组件，已自动添加到购物车。'
                : 'The following parts are required components for the main items and have been automatically added to the cart.'
              }
            </p>
          </div>
          <div className="space-y-3">
            {requiredItems.map(item => (
              <RequiredPartCartItem
                key={item.id}
                item={item as ExtendedCartItem & { is_required: true }}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                language={language}
                userRegion={userRegion}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 