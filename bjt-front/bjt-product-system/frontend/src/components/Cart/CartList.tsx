import React, { useContext, useRef, useEffect, useState } from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';
import { RequiredPartCartItem } from './RequiredPartCartItem';
import { CartContext } from '../../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ASSETS } from '../../config/appConfig';
import { getSimpleProductName } from '../../utils/simpleProductName';
import { CartListProductDetails } from './UnifiedProductDetails';
import CartTooltip from './CartTooltip';
import './UnifiedProductDetails.css';
import './CartList.css';

interface CartListProps {
  items: ExtendedCartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onBulkRemove?: (ids: string[]) => void;
  language?: 'zh' | 'en';
  showBulkActions?: boolean;
}

// 🌐 **多语言数值获取函数**
const getValue = (value: any, t: any, language: 'zh' | 'en' = 'zh') => {
  // 更严格的空值检查，只有真正为空或undefined时才显示N/A
  if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'Not Specified') {
    return language === 'zh' ? '不可用' : 'N/A';
  }
  return String(value);
};

export const CartList: React.FC<CartListProps> = ({
  items = [],
  onUpdateQuantity,
  onRemove,
  onBulkRemove,
  language = 'zh',
  showBulkActions = true
}) => {
  const { isItemSelected, toggleItemSelection, selectedItems, selectAll } = useContext(CartContext);
  const { user } = useAuth();
  const { t } = useTranslation(['cart', 'products']);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // 🌐 **当前语言设置**
  const currentLanguage: 'zh' | 'en' = language === 'en' ? 'en' : 'zh';
  
  // 🔧 **获取用户偏好单位制**
  const preferredUnit = user?.preferred_unit || 'metric';

  // 🔧 **批量操作相关逻辑**
  useEffect(() => {
    if (selectedItems) {
      setSelectedItemIds(selectedItems.map(item => item.id));
    }
  }, [selectedItems]);

  const handleSelectAll = () => {
    const allSelected = items.every(item => selectedItemIds.includes(item.id));
    if (allSelected) {
      selectAll(false);
    } else {
      selectAll(true);
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    toggleItemSelection(itemId, checked);
  };

  const handleBulkRemove = () => {
    if (onBulkRemove && selectedItemIds.length > 0) {
      onBulkRemove(selectedItemIds);
    }
  };

  // 🔧 **拖拽相关逻辑**
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedItem(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedItem(null);
    }
  };

  // 🖼️ **获取商品图片**
  const getItemImage = (item: ExtendedCartItem): string => {
    const props = item.properties || {};
    return props.image_url || 
           item.image_url || 
           props.image || 
           item.image || 
           ASSETS.DEFAULT_IMAGE;
  };

  // 📝 **获取商品名称**
  const getDisplayName = (item: ExtendedCartItem): string => {
    return getSimpleProductName(item, currentLanguage);
  };

  // 💰 **计算商品价格**
  const calculateItemPrice = (item: ExtendedCartItem): number => {
    // 阶梯价格逻辑
    if (item.priceTiers && item.priceTiers.length > 0) {
      const quantity = item.quantity || 1;
      const applicableTier = item.priceTiers.find(tier => {
        if (tier.max === null) {
          return quantity >= tier.min;
        }
        return quantity >= tier.min && quantity <= tier.max;
      });
      return applicableTier ? applicableTier.price : (item.unit_price || item.price || 0);
    }
    return item.unit_price || item.price || 0;
  };

  if (!items || items.length === 0) {
    return (
      <div className="cart-empty-state">
        <div className="empty-cart-icon">🛒</div>
        <h3 className="empty-cart-title">
          {currentLanguage === 'zh' ? '购物车为空' : 'Cart is Empty'}
        </h3>
        <p className="empty-cart-message">
          {currentLanguage === 'zh' 
            ? '您还没有添加任何商品到购物车'
            : 'You haven\'t added any items to your cart yet'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="cart-list">
      {/* 批量操作栏 */}
      {showBulkActions && (
        <div className="cart-bulk-actions">
          <div className="bulk-select">
            <input
              type="checkbox"
              id="select-all"
              checked={items.length > 0 && items.every(item => selectedItemIds.includes(item.id))}
              onChange={handleSelectAll}
              className="bulk-checkbox"
            />
            <label htmlFor="select-all" className="bulk-label">
              {currentLanguage === 'zh' ? '全选' : 'Select All'} ({selectedItemIds.length}/{items.length})
            </label>
          </div>
          
          {selectedItemIds.length > 0 && (
            <button
              onClick={handleBulkRemove}
              className="bulk-remove-btn"
            >
              {currentLanguage === 'zh' ? `删除选中 (${selectedItemIds.length})` : `Remove Selected (${selectedItemIds.length})`}
            </button>
          )}
        </div>
      )}

      {/* 商品列表 */}
      <div className="cart-items-container">
        {items.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          const isDragged = draggedItem === item.id;
          const itemPrice = calculateItemPrice(item);
          const itemTotal = itemPrice * item.quantity;

          return (
            <div
              key={item.id}
              className={`cart-item ${isSelected ? 'selected' : ''} ${isDragged ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {/* 选择框 */}
              <div className="cart-item-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                  className="item-checkbox"
                />
              </div>

              {/* 商品图片 */}
              <div className="cart-item-image">
                <img 
                  src={getItemImage(item)} 
                  alt={getDisplayName(item)}
                  className="item-image"
                  loading="lazy"
                />
              </div>

              {/* 商品信息 */}
              <div className="cart-item-info">
                <div className="item-header">
                  <h3 className="item-name">{getDisplayName(item)}</h3>
                  <div className="item-actions">
                    <CartTooltip item={item} placement="topRight">
                      <button
                        className="tooltip-btn"
                        title={currentLanguage === 'zh' ? '查看详细信息' : 'View Details'}
                      >
                        ℹ️
                      </button>
                    </CartTooltip>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="remove-btn"
                      title={currentLanguage === 'zh' ? '删除' : 'Remove'}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 🎯 使用统一的产品详情组件 - 与Order页面保持一致 */}
                <CartListProductDetails 
                  item={item} 
                  language={currentLanguage} 
                  preferredUnit={preferredUnit}
                  showEmptyFields={true}
                />

                {/* 必选配件 */}
                {(item as any).requiredParts && (item as any).requiredParts.length > 0 && (
                  <div className="required-parts-section">
                    <h4 className="required-parts-title">
                      {currentLanguage === 'zh' ? '必选配件' : 'Required Parts'}
                    </h4>
                    <div className="required-parts-list">
                      {(item as any).requiredParts.map((part: any, index: number) => (
                        <RequiredPartCartItem
                          key={`${item.id}-required-${index}`}
                          item={part}
                          language={currentLanguage}
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemove}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 价格和数量 */}
              <div className="cart-item-pricing">
                <div className="item-price">
                  <span className="price-label">
                    {currentLanguage === 'zh' ? '单价' : 'Unit Price'}
                  </span>
                  <span className="price-value">¥{itemPrice.toFixed(2)}</span>
                </div>

                <div className="item-quantity">
                  <span className="quantity-label">
                    {currentLanguage === 'zh' ? '数量' : 'Quantity'}
                  </span>
                  <div className="quantity-controls">
                    <button
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="quantity-btn"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        onUpdateQuantity(item.id, Math.max(1, newQuantity));
                      }}
                      className="quantity-input"
                      min="1"
                    />
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="item-total">
                  <span className="total-label">
                    {currentLanguage === 'zh' ? '小计' : 'Subtotal'}
                  </span>
                  <span className="total-value">¥{itemTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 