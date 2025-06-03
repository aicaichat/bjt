import React, { useContext, useRef, useEffect } from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';
import { RequiredPartCartItem } from './RequiredPartCartItem';
import { CartContext } from '../../contexts/CartContext';
import { useTranslation } from 'react-i18next';

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

// 属性key到i18n key映射
const propertyKeyMap: Record<string, string> = {
  part_number: 'partNumber',
  model: 'model',
  voltage: 'voltage',
  frequency: 'frequency',
  spec: 'spec',
  spec_imperial: 'specImperial',
  pcs_per_box: 'pcsPerBox',
  pcs_per_pallet: 'pcsPerPallet',
  package_size_cm: 'packageSize',
  package_size_inch: 'packageSize',
  pallet_size_cm: 'palletSize',
  pallet_size_inch: 'palletSize',
  net_weight_kg: 'netWeight',
  net_weight_lbs: 'netWeight',
  gross_weight_kg: 'grossWeight',
  gross_weight_lbs: 'grossWeight',
  brand: 'brand',
  unit: 'unit'
};
const getLabel = (key: string, t: any) => t(`products.properties.${propertyKeyMap[key] || key}`, key);
const getValue = (value: any, t: any) => value && value !== 'N/A' && value !== 'Not Specified' ? value : t('products.defaultValues.notAvailable');

// 详细字段渲染函数，参考侧边栏
const renderDetails = (item: ExtendedCartItem, language: 'zh' | 'en' = 'zh', t: any) => {
  const props = item.properties || {};
  const type = item.product_type || item.type;
  // 调试日志
  console.log('[CartList.renderDetails] type:', type, 'item:', item, 'props:', props);
  // 主机
  if (["machine", "host", "设备"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">{getLabel('partNumber', t)}:</span><span className="property-value">{getValue(props.part_number, t) || getValue(item.part_number, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('model', t)}:</span><span className="property-value">{getValue(props.model, t) || getValue((item as any).model, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('voltage', t)}:</span><span className="property-value">{getValue(props.voltage, t) || getValue((item as any).voltage, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcsPerBox', t)}:</span><span className="property-value">{getValue(props.pcs_per_box, t) || getValue((item as any).pcs_per_box, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcsPerPallet', t)}:</span><span className="property-value">{getValue(props.pcs_per_pallet, t) || getValue((item as any).pcs_per_pallet, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('packageSize', t)}:</span><span className="property-value">{getValue(props.package_size_cm, t) || getValue((item as any).package_size_cm, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('palletSize', t)}:</span><span className="property-value">{getValue(props.pallet_size_cm, t) || getValue((item as any).pallet_size_cm, t)}</span></div>
      </div>
    );
  }
  // 耗材
  if (["consumable", "耗材"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">{getLabel('partNumber', t)}:</span><span className="property-value">{getValue(props.part_number, t) || getValue(item.part_number, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('brand', t)}:</span><span className="property-value">{getValue(props.brand, t) || getValue((item as any).brand, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('model', t)}:</span><span className="property-value">{getValue(props.model, t) || getValue((item as any).model, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('spec', t)}:</span><span className="property-value">{getValue(props.spec, t) || getValue((item as any).spec, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcsPerBox', t)}:</span><span className="property-value">{getValue(props.pcs_per_box, t) || getValue((item as any).pcs_per_box, t)}</span></div>
      </div>
    );
  }
  // 备件
  if (["spare_part", "spare", "备件"].includes(type)) {
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">{getLabel('partNumber', t)}:</span><span className="property-value">{getValue(props.part_number, t) || getValue(item.part_number, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('model', t)}:</span><span className="property-value">{getValue(props.model, t) || getValue((item as any).model, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('spec', t)}:</span><span className="property-value">{getValue(props.spec, t) || getValue((item as any).spec, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('app_model', t)}:</span><span className="property-value">{getValue(props.app_model, t) || getValue((item as any).app_model, t)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcsPerBox', t)}:</span><span className="property-value">{getValue(props.pcs_per_box, t) || getValue((item as any).pcs_per_box, t)}</span></div>
      </div>
    );
  }
  // 配件
  if (["accessory", "配件"].includes(type)) {
    // 🔥 **强化字段获取函数，处理空字符串问题**
    const getSafeValue = (primaryValue: any, fallbackValue: any, defaultValue: string = 'N/A'): string => {
      // 检查主值
      if (primaryValue !== null && primaryValue !== undefined && primaryValue !== '') {
        return String(primaryValue);
      }
      // 检查备用值
      if (fallbackValue !== null && fallbackValue !== undefined && fallbackValue !== '') {
        return String(fallbackValue);
      }
      // 返回默认值
      return defaultValue;
    };
    
    console.log('[CartList.renderDetails.accessory] Detailed field analysis:', {
      'item.frequency': item.frequency,
      'props.frequency': props.frequency,
      'frequency_type': typeof item.frequency,
      'frequency_isEmpty': item.frequency === '',
      'voltage_details': { item: item.voltage, props: props.voltage },
      'item_mainFields': Object.keys(item).filter(key => 
        key.toLowerCase().includes('freq') || key.toLowerCase().includes('volt')
      ),
      'props_fields': Object.keys(props)
    });
    
    return (
      <div className="cart-item-properties">
        <div className="property-item"><span className="property-label">{getLabel('partNumber', t)}:</span><span className="property-value">{getSafeValue(item.part_number, props.part_number)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('model', t)}:</span><span className="property-value">{getSafeValue(item.model, props.model)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('voltage', t)}:</span><span className="property-value">{getSafeValue(item.voltage, props.voltage)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('frequency', t)}:</span><span className="property-value">{getSafeValue(item.frequency, props.frequency)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcsPerBox', t)}:</span><span className="property-value">{getSafeValue(item.pcs_per_box, props.pcs_per_box)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcsPerPallet', t)}:</span><span className="property-value">{getSafeValue(item.pcs_per_pallet, props.pcs_per_pallet)}</span></div>
      </div>
    );
  }
  // fallback
  return <div className="cart-item-properties"><div className="property-item">{t('defaultValues.unknown', {ns: 'spareParts'})}</div></div>;
};

// 普通购物车项目组件
const CartItem: React.FC<{
  item: ExtendedCartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language?: 'zh' | 'en';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  t: any;
}> = ({ item, onUpdateQuantity, onRemove, language = 'zh', isSelected, onSelect, t }) => {
  const props = item.properties || {};
  // 调试日志
  console.log('[CartList.CartItem] item:', item, 'props:', props);
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
          {renderDetails(item, language, t)}
          
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
                {t('subtotal', {ns: 'cart'})}:
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
          title={t('remove', {ns: 'cart'})}
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
  const { t } = useTranslation(['spareParts', 'cart']);
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
        <span className="text-gray-700 text-sm">{t('selectAll', {ns: 'cart'})}</span>
      </div>
      {/* 主要商品区域 */}
      {mainItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {t('mainItems', {ns: 'cart'})}
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
                t={t}
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
              {t('cart.requiredParts', {ns: 'spareParts'})}
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