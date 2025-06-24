import React from 'react';
import { CartFieldUnifier } from '../../utils/CartFieldUnifier';
import { getFieldsForProductType, DisplayScenario } from '../../config/cartDisplayFields';

interface UnifiedProductDetailsProps {
  item: any; // 产品数据
  scenario: DisplayScenario; // 显示场景
  language: 'zh' | 'en';
  preferredUnit: 'metric' | 'imperial';
  className?: string;
  showEmptyFields?: boolean; // 是否显示空字段
}

/**
 * 🎯 统一的产品详情显示组件
 * 基于配置驱动，支持多种显示场景和产品类型
 */
export const UnifiedProductDetails: React.FC<UnifiedProductDetailsProps> = ({
  item,
  scenario,
  language = 'zh',
  preferredUnit = 'metric',
  className = '',
  showEmptyFields = false
}) => {
  // 获取产品类型
  const productType = item.product_type || item.type || 'spare_part';
  
  // 获取该产品类型在当前场景下的字段列表
  const fieldList = getFieldsForProductType(productType, scenario);
  
  // 🔍 调试日志
  if (productType === 'spare_part' && scenario === 'order_page') {
    console.log('🔍 UnifiedProductDetails Debug:', {
      productType,
      scenario,
      fieldListLength: fieldList.length,
      fieldList,
      showEmptyFields,
      itemId: item.id
    });
  }
  
  // 如果没有字段配置，显示警告
  if (!fieldList || fieldList.length === 0) {
    console.warn(`No field configuration found for product type: ${productType}, scenario: ${scenario}`);
    return (
      <div className={`unified-product-details ${className}`}>
        <div className="no-config-warning">
          {language === 'zh' ? '暂无字段配置' : 'No field configuration'}
        </div>
      </div>
    );
  }

  return (
    <div className={`unified-product-details ${className}`}>
      {fieldList.map(fieldKey => {
        const label = CartFieldUnifier.getFieldLabel(fieldKey, language, preferredUnit);
        const value = CartFieldUnifier.getFieldValue(item, fieldKey, language, preferredUnit);
        
        // 判断是否显示该字段
        const hasValue = value && 
          !value.includes('Not Available') && 
          !value.includes('暂无数据') &&
          value !== 'N/A' &&
          value.trim() !== '';
        
        // 如果字段为空且不显示空字段，则跳过
        if (!hasValue && !showEmptyFields) {
          return null;
        }
        
        return (
          <div key={fieldKey} className="detail-item">
            <span className="detail-label">{label}:</span>
            <span className={`detail-value ${!hasValue ? 'empty-value' : ''}`}>
              {hasValue ? value : (language === 'zh' ? '暂无' : 'N/A')}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 🎨 针对不同场景的样式变体
 */

// 购物车列表样式 - 🔧 修改为使用order_page配置，与Order页面保持一致
export const CartListProductDetails: React.FC<Omit<UnifiedProductDetailsProps, 'scenario' | 'className'>> = (props) => (
  <UnifiedProductDetails 
    {...props} 
    scenario="order_page" 
    className="cart-list-details"
  />
);

// 购物车侧边栏样式 - 🔧 修改为使用order_page配置，与Cart页面保持一致
export const CartSidebarProductDetails: React.FC<Omit<UnifiedProductDetailsProps, 'scenario' | 'className'>> = (props) => {
  // 🔧 强制重新实现以确保正确渲染
  const productType = props.item.product_type || props.item.type || 'spare_part';
  const fieldList = getFieldsForProductType(productType, 'order_page');
  
  // 🔍 强制调试日志 - 增强版
  console.log('🚨 CartSidebarProductDetails 强制调试 [' + new Date().toISOString() + ']:', {
    productType,
    fieldCount: fieldList.length,
    fields: fieldList,
    itemId: props.item.id,
    itemData: props.item,
    scenario: 'order_page',
    timestamp: Date.now()
  });
  
  // 🔧 强制输出每个字段的值
  fieldList.forEach(fieldKey => {
    const label = CartFieldUnifier.getFieldLabel(fieldKey, props.language, props.preferredUnit);
    const value = CartFieldUnifier.getFieldValue(props.item, fieldKey, props.language, props.preferredUnit);
    console.log(`🔍 Field [${fieldKey}]: "${label}" = "${value}"`);
  });
  
  return (
    <UnifiedProductDetails 
      {...props} 
      scenario="order_page" 
      className={`cart-sidebar-details-${Date.now()}`} // 🔧 强制唯一className
      showEmptyFields={true} // 🔧 修复：侧边栏也显示空字段，确保字段一致性
    />
  );
};

// 订单页面样式
export const OrderPageProductDetails: React.FC<Omit<UnifiedProductDetailsProps, 'scenario' | 'className'>> = (props) => (
  <UnifiedProductDetails 
    {...props} 
    scenario="order_page" 
    className="order-page-details"
    showEmptyFields={props.showEmptyFields ?? true} // 订单页面默认显示空字段
  />
);

// Tooltip样式
export const TooltipProductDetails: React.FC<Omit<UnifiedProductDetailsProps, 'scenario' | 'className'>> = (props) => (
  <UnifiedProductDetails 
    {...props} 
    scenario="tooltip" 
    className="tooltip-details"
  />
); 