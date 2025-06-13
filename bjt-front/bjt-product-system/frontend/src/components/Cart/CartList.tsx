import React, { useContext, useRef, useEffect, useState } from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';
import { RequiredPartCartItem } from './RequiredPartCartItem';
import { CartContext } from '../../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '../../config/appConfig';
import { SmartFieldValue } from '../SmartFieldValue';
import { SmartFieldLabel } from '../SmartFieldLabel';
import { SmartFieldRow } from '../SmartFieldRow';
import { useSmartFieldMapping } from '../../hooks/useSmartFieldMapping';
import { useSmartFieldLabels } from '../../hooks/useSmartFieldLabels';
import { useSmartUnitSystem } from '../../hooks/useSmartUnitSystem';

interface CartListProps {
  items: ExtendedCartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onBulkRemove?: (ids: string[]) => void;
  language?: 'zh' | 'en';
  showBulkActions?: boolean;
}

// 🌐 **多语言属性key映射**
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
  package_size: 'packageSize',
  pallet_size_cm: 'palletSize',
  pallet_size_inch: 'palletSize',
  pallet_size: 'palletSize',
  net_weight_kg: 'netWeight',
  net_weight_lbs: 'netWeight',
  net_weight: 'netWeight',
  gross_weight_kg: 'grossWeight',
  gross_weight_lbs: 'grossWeight',
  gross_weight: 'grossWeight',
  brand: 'brand',
  unit: 'unit',
  app_model: 'compatibleModel',
  app_sn: 'applicableSN',
  film_width: 'filmWidth',
  bubble_diameter: 'bubbleDiameter'
};

// 🌐 **多语言标签获取函数**
const getLabel = (key: string, t: any, language: 'zh' | 'en' = 'zh') => {
  const i18nKey = propertyKeyMap[key] || key;
  
  // 直接从cart命名空间的fields获取翻译
  try {
    const translation = t(`fields.${i18nKey}`);
    if (translation && translation !== `fields.${i18nKey}`) {
      return translation;
    }
  } catch (e) {
    console.log(`Translation not found for fields.${i18nKey}`);
  }
  
  // 如果没有找到翻译，返回默认值
  const defaultLabels: Record<string, { zh: string; en: string }> = {
    partNumber: { zh: '料号', en: 'Part Number' },
    model: { zh: '型号', en: 'Model' },
    voltage: { zh: '电压', en: 'Voltage' },
    frequency: { zh: '频率', en: 'Frequency' },
    spec: { zh: '规格', en: 'Spec.' },
    specImperial: { zh: '规格(英制)', en: 'Spec.(Imperial)' },
    pcsPerBox: { zh: '单箱数量', en: 'Pcs per Box' },
    pcsPerPallet: { zh: '一托数量', en: 'Pcs per Pallet' },
    packageSize: { zh: '包装尺寸', en: 'Package Size' },
    palletSize: { zh: '托盘尺寸', en: 'Pallet Size' },
    netWeight: { zh: '净重', en: 'Net Weight' },
    grossWeight: { zh: '毛重', en: 'Gross Weight' },
    brand: { zh: '品牌', en: 'Brand' },
    unit: { zh: '单位', en: 'Unit' },
    compatibleModel: { zh: '适配机型', en: 'Compatible Model' },
    applicableSN: { zh: '适配序列号', en: 'Applicable S.N.' },
    filmWidth: { zh: '膜宽', en: 'Film Width' },
    bubbleDiameter: { zh: '气泡直径', en: 'Bubble Diameter' }
  };
  
  return defaultLabels[i18nKey]?.[language] || key;
};

// 🌐 **多语言数值获取函数**
const getValue = (value: any, t: any, language: 'zh' | 'en' = 'zh') => {
  // 更严格的空值检查，只有真正为空或undefined时才显示N/A
  if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'Not Specified') {
    return language === 'zh' ? '不可用' : 'N/A';
  }
  return String(value);
};

// 详细字段渲染函数，参考侧边栏
const renderDetails = (item: ExtendedCartItem, language: 'zh' | 'en' = 'zh', t: any) => {
  const props = item.properties || {};
  const type = item.product_type || item.type;
  
  // 在渲染函数中直接使用hooks，确保能够响应单位制变化
  const { preferredUnitSystem } = useSmartFieldMapping();
  
  // 智能字段组件 - 使用修复的标签获取函数
  const SmartField: React.FC<{ fieldKey: string; customLabel?: string }> = React.memo(({ fieldKey, customLabel }) => {
    const { getSmartFieldMapping, getFieldUnit } = useSmartFieldMapping();
    const { preferredUnitSystem } = useSmartUnitSystem();
    
    // 获取基础标签
    const baseLabel = customLabel || getLabel(fieldKey, t, language);
    
    // 获取目标字段和单位
    const targetField = getSmartFieldMapping(fieldKey, item);
    const unit = getFieldUnit(targetField);
    
    // 生成带单位的标签
    const labelWithUnit = unit ? `${baseLabel}(${unit})` : baseLabel;
    
    return (
      <div className="property-item">
        <span className="property-label">
          {labelWithUnit}:
        </span>
        <span className="property-value">
          <SmartFieldValue product={item} fieldKey={fieldKey} />
        </span>
      </div>
    );
  });
  
  // 普通字段组件（无单位制）
  const RegularField: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <div className="property-item">
      <span className="property-label">{label}:</span>
      <span className="property-value">{getValue(value, t, language)}</span>
    </div>
  );
  
  // 主机
  if (["machine", "host", "设备"].includes(type)) {
    return (
      <div className="cart-item-properties" key={`machine-${preferredUnitSystem}`}>
        <RegularField label={getLabel('part_number', t, language)} value={(item as any).part_number || props.part_number} />
        <RegularField label={getLabel('model', t, language)} value={(item as any).model || props.model} />
        <RegularField label={getLabel('voltage', t, language)} value={(item as any).voltage || props.voltage} />
        <RegularField label={getLabel('pcs_per_box', t, language)} value={(item as any).pcs_per_box || props.pcs_per_box} />
        <RegularField label={getLabel('pcs_per_pallet', t, language)} value={(item as any).pcs_per_pallet || props.pcs_per_pallet} />
        <SmartField fieldKey="package_size" customLabel={getLabel('package_size', t, language)} />
        <SmartField fieldKey="pallet_size" customLabel={getLabel('pallet_size', t, language)} />
        <SmartField fieldKey="net_weight" customLabel={getLabel('net_weight', t, language)} />
      </div>
    );
  }
  // 耗材
  if (["consumable", "耗材"].includes(type)) {
    return (
      <div className="cart-item-properties" key={`consumable-${preferredUnitSystem}`}>
        <RegularField label={getLabel('part_number', t, language)} value={(item as any).part_number || props.part_number} />
        <RegularField label={getLabel('brand', t, language)} value={(item as any).brand || props.brand} />
        <RegularField label={getLabel('model', t, language)} value={(item as any).model || props.model} />
        <SmartField fieldKey="spec" customLabel={getLabel('spec', t, language)} />
        <SmartField fieldKey="film_width" customLabel={getLabel('film_width', t, language)} />
        <SmartField fieldKey="bubble_diameter" customLabel={getLabel('bubble_diameter', t, language)} />
        <RegularField label={getLabel('pcs_per_box', t, language)} value={(item as any).pcs_per_box || props.pcs_per_box} />
      </div>
    );
  }
  // 备件
  if (["spare_part", "spare", "备件"].includes(type)) {
    return (
      <div className="cart-item-properties" key={`spare-${preferredUnitSystem}`}>
        <div className="property-item"><span className="property-label">{getLabel('part_number', t, language)}:</span><span className="property-value">{getValue((item as any).part_number || props.part_number, t, language)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('model', t, language)}:</span><span className="property-value">{getValue((item as any).model || props.model, t, language)}</span></div>
        <SmartField fieldKey="spec" customLabel={getLabel('spec', t, language)} />
        <div className="property-item"><span className="property-label">{getLabel('app_model', t, language)}:</span><span className="property-value">{getValue((item as any).app_model || props.app_model, t, language)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcs_per_box', t, language)}:</span><span className="property-value">{getValue((item as any).pcs_per_box || props.pcs_per_box, t, language)}</span></div>
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
    
    return (
      <div className="cart-item-properties" key={`accessory-${preferredUnitSystem}`}>
        <div className="property-item"><span className="property-label">{getLabel('part_number', t, language)}:</span><span className="property-value">{getSafeValue((item as any).part_number, props.part_number)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('model', t, language)}:</span><span className="property-value">{getSafeValue((item as any).model, props.model)}</span></div>
        <SmartField fieldKey="voltage" customLabel={getLabel('voltage', t, language)} />
        <SmartField fieldKey="frequency" customLabel={getLabel('frequency', t, language)} />
        <div className="property-item"><span className="property-label">{getLabel('pcs_per_box', t, language)}:</span><span className="property-value">{getSafeValue((item as any).pcs_per_box, props.pcs_per_box)}</span></div>
        <div className="property-item"><span className="property-label">{getLabel('pcs_per_pallet', t, language)}:</span><span className="property-value">{getSafeValue((item as any).pcs_per_pallet, props.pcs_per_pallet)}</span></div>
        <SmartField fieldKey="package_size" customLabel={getLabel('package_size', t, language)} />
        <SmartField fieldKey="pallet_size" customLabel={getLabel('pallet_size', t, language)} />
      </div>
    );
  }
  // fallback
  return <div className="cart-item-properties"><div className="property-item">{language === 'zh' ? '未知产品类型' : 'Unknown Product Type'}</div></div>;
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
}> = React.memo(({ item, onUpdateQuantity, onRemove, language = 'zh', isSelected, onSelect, t }) => {
  const props = item.properties || {};
  const { preferredUnitSystem } = useSmartFieldMapping(); // 添加单位制状态
  
  // 优先取 properties 里的图片和标题
  const imageUrl = props.image_url || props.image || item.image_url || item.image || ASSETS.DEFAULT_IMAGE;
  
  // 🌐 **多语言商品名称获取逻辑**
  const getDisplayName = (): string => {
    if (language === 'zh') {
      // 中文模式：优先使用中文名称字段
      const zhName = props.name_zh || item.name_zh;
      if (zhName) {
        return zhName;
      }
      
      // 如果没有中文名称，尝试从翻译获取
      const originalName = props.name_en || item.name_en || props.name || item.name;
      if (originalName) {
        // 明确指定cart命名空间
        const translatedName = t(`cart:productNames.${originalName}`);
        if (translatedName && translatedName !== `cart:productNames.${originalName}`) {
          return translatedName;
        }
      }
      
      // 最后的兜底逻辑
      const fallback = originalName || props.code || item.code || props.part_number || item.part_number || '商品';
      return fallback;
    } else {
      // 英文模式：优先使用英文名称字段
      const enName = props.name_en || item.name_en;
      if (enName) {
        return enName;
      }
      
      // 如果没有专门的英文名称，使用原始名称（通常已经是英文）
      const originalName = props.name || item.name;
      if (originalName) {
        // 在英文环境下，如果原始名称已经是英文，直接返回
        return originalName;
      }
      
      // 最后的兜底逻辑
      return props.code || item.code || props.part_number || item.part_number || 'Product';
    }
  };
  
  const displayName = getDisplayName();
  
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
          <h4 className="font-medium text-gray-900 mb-2">
            {displayName}
          </h4>
          {/* 详细字段 */}
          <div>
            {renderDetails(item, language, t)}
          </div>
          
          {/* 数量和价格 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t('quantity')}:
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
                {t('subtotal')}:
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
          className="text-red-500 hover:text-red-700 p-2 rounded"
          title={language === 'zh' ? '删除商品' : 'Remove Item'}
        >
          ✕
        </button>
      </div>
    </div>
  );
});

export const CartList: React.FC<CartListProps> = ({
  items = [],
  onUpdateQuantity,
  onRemove,
  onBulkRemove,
  language = 'zh',
  showBulkActions = true
}) => {
  const { t, i18n } = useTranslation(['cart', 'spareParts', 'consumables', 'machines']);
  const { isItemSelected, toggleItemSelection, selectAll, selectedItems } = useContext(CartContext);
  const { preferredUnitSystem } = useSmartUnitSystem();
  
  // 🌐 **确保语言参数与i18n同步**
  const currentLanguage: 'zh' | 'en' = (language || i18n.language === 'en' ? 'en' : 'zh') as 'zh' | 'en';
  
  // 分组显示：主要商品和必选备件
  const mainItems = items.filter(item => !item.is_required);
  const requiredItems = items.filter(item => item.is_required);

  return (
    <div className="cart-list space-y-6">
      {/* 🔄 **全选功能** */}
      {mainItems.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 accent-blue-600"
              checked={mainItems.every(item => isItemSelected(item.id))}
              onChange={(e) => {
                mainItems.forEach(item => {
                  toggleItemSelection(item.id, e.target.checked);
                });
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              {currentLanguage === 'zh' ? '全选' : 'Select All'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {currentLanguage === 'zh' 
              ? `已选择 ${selectedItems.length} / ${mainItems.length} 件商品`
              : `${selectedItems.length} / ${mainItems.length} items selected`
            }
          </div>
        </div>
      )}

      {/* 主要商品 */}
      {mainItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {currentLanguage === 'zh' ? '主商品' : 'Main Items'}
          </h3>
          <div className="space-y-3">
            {mainItems.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                language={currentLanguage}
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
              {currentLanguage === 'zh' ? '必选备件' : 'Required Parts'}
            </h3>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-orange-700">
              {currentLanguage === 'zh' 
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
                language={currentLanguage}
                userRegion="cn"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 