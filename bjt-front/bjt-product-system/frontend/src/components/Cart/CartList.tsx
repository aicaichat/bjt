import React, { useContext, useRef, useEffect } from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';
import { RequiredPartCartItem } from './RequiredPartCartItem';
import { CartContext } from '../../contexts/CartContext';

interface CartListProps {
  items: ExtendedCartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
  userRegion?: string;
  isItemSelected: (id: string) => boolean;
  toggleItemSelection: (id: string, selected: boolean) => void;
  selectAll: (selected: boolean) => void;
}

// 详细字段渲染函数，参考侧边栏
const renderDetails = (item: ExtendedCartItem, language: 'zh' | 'en' = 'zh') => {
  const props = item.properties || {};
  const type = item.product_type || item.type;
  // 主机
  if (["machine", "host", "设备"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">料号:</span><span className="property-value">{props.part_number || item.part_number || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">型号:</span><span className="property-value">{props.model || (item as any).model || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">电压:</span><span className="property-value">{props.voltage || (item as any).voltage || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">单箱数量:</span><span className="property-value">{props.pcs_per_box || (item as any).pcs_per_box || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">一托数量:</span><span className="property-value">{props.pcs_per_pallet || (item as any).pcs_per_pallet || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">包装尺寸:</span><span className="property-value">{props.package_size_cm || (item as any).package_size_cm || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">托盘尺寸:</span><span className="property-value">{props.pallet_size_cm || (item as any).pallet_size_cm || 'N/A'}</span></div>
      </div>
    );
  }
  // 耗材
  if (["consumable", "耗材"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">料号:</span><span className="property-value">{props.part_number || item.part_number || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">品牌:</span><span className="property-value">{props.brand || (item as any).brand || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">型号:</span><span className="property-value">{props.model || (item as any).model || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">规格:</span><span className="property-value">{props.spec || (item as any).spec || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">单箱数量:</span><span className="property-value">{props.pcs_per_box || (item as any).pcs_per_box || 'N/A'}</span></div>
      </div>
    );
  }
  // 备件
  if (["spare_part", "spare", "备件"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">料号:</span><span className="property-value">{props.part_number || item.part_number || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">型号:</span><span className="property-value">{props.model || (item as any).model || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">规格:</span><span className="property-value">{props.spec || (item as any).spec || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">适配机型:</span><span className="property-value">{props.app_model || (item as any).app_model || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">单箱数量:</span><span className="property-value">{props.pcs_per_box || (item as any).pcs_per_box || 'N/A'}</span></div>
      </div>
    );
  }
  // 配件
  if (["accessory", "配件"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">料号:</span><span className="property-value">{props.part_number || item.part_number || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">型号:</span><span className="property-value">{props.model || (item as any).model || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">电压:</span><span className="property-value">{props.voltage || (item as any).voltage || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">频率:</span><span className="property-value">{props.frequency || (item as any).frequency || 'N/A'}</span></div>
        <div className="property-item"><span className="property-label">单箱数量:</span><span className="property-value">{props.pcs_per_box || (item as any).pcs_per_box || 'N/A'}</span></div>
      </div>
    );
  }
  // fallback
  return <div className="cart-item-properties"><div className="property-item">Invalid Type</div></div>;
};

// 普通购物车项目组件
const CartItem: React.FC<{
  item: ExtendedCartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}> = ({ item, onUpdateQuantity, onRemove, language = 'zh', isSelected, onSelect }) => {
  const props = item.properties || {};
  // 优先取 properties 里的图片和标题
  const imageUrl = props.image_url || props.image || item.image_url || item.image || '/images/placeholder.jpg';
  const displayName = language === 'zh'
    ? (props.name_zh || props.name || item.name_zh || item.name)
    : (props.name_en || props.name || item.name_en || item.name);
  
  return (
    <div className={`cart-item border border-gray-200 bg-white p-4 rounded-lg mb-3${isSelected ? ' ring-2 ring-primary' : ''}`}>
      <div className="flex gap-4">
        {/* 选择框 */}
        <input
          type="checkbox"
          className="mt-2 mr-2 accent-primary"
          checked={isSelected}
          onChange={e => onSelect(e.target.checked)}
        />
        {/* 产品图片 */}
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={imageUrl}
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
          {/* 详细字段 */}
          {renderDetails(item, language)}
          
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
  userRegion = 'cn',
  isItemSelected,
  toggleItemSelection,
  selectAll
}) => {
  // 分离主要商品和必选备件
  const mainItems = items.filter(item => !item.is_required);
  const requiredItems = items.filter(item => item.is_required);

  // 全选状态
  const allSelected = items.length > 0 && items.every(item => isItemSelected(item.id));
  const someSelected = items.some(item => isItemSelected(item.id));

  // 修复 indeterminate
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

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
      {/* 全选栏 */}
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="accent-primary mr-2"
          checked={allSelected}
          ref={selectAllRef}
          onChange={e => selectAll(e.target.checked)}
        />
        <span className="text-gray-700 text-sm">{language === 'zh' ? '全选' : 'Select All'}</span>
      </div>
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
                isSelected={isItemSelected(item.id)}
                onSelect={selected => toggleItemSelection(item.id, selected)}
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