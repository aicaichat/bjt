import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../../contexts/CartContext';
import { CartList } from '../../components/Cart/CartList';
import { useToastNotifications } from '../../components/ui';
import { ROUTES } from '../../config/routes';


const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('cart');
  const { items, updateQuantity, removeItem, removeMultipleItems, clearCart, isItemSelected, toggleItemSelection, selectAll, selectedItems, selectedTotal, selectedCount } = useContext(CartContext);
  const { success, warning } = useToastNotifications();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // 🌐 **当前语言设置**
  const currentLanguage: 'zh' | 'en' = i18n.language === 'en' ? 'en' : 'zh';




  // 处理清空购物车
  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    success(currentLanguage === 'zh' ? '购物车已清空' : 'Cart cleared');
  };

  // 处理批量删除
  const handleBulkRemove = async (itemIds: string[]) => {
    if (itemIds.length === 0) {
      warning(currentLanguage === 'zh' ? '请选择要删除的商品' : 'Please select items to remove');
      return;
    }
    
    try {
      await removeMultipleItems(itemIds);
      success(currentLanguage === 'zh' 
        ? `已删除 ${itemIds.length} 个商品` 
        : `Removed ${itemIds.length} items`
      );
    } catch (error) {
      console.error('Bulk remove error:', error);
      warning(currentLanguage === 'zh' ? '删除商品时出错' : 'Error removing items');
    }
  };

  // 处理结算
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      warning(currentLanguage === 'zh' ? '购物车为空，无法结算' : 'Cart is empty, cannot checkout');
      return;
    }
    // 只结算选中的商品
    navigate('/order', { state: { orderItems: selectedItems, fromCart: true } });
  };

  // 🔧 改进：多策略智能导航到购物页面
  const handleContinueShopping = () => {
    console.log('[Cart] Continue Shopping - 开始导航逻辑');
    
    // 策略1：检查sessionStorage中的导航历史
    const lastShoppingPage = sessionStorage.getItem('lastShoppingPage');
    console.log('[Cart] Continue Shopping - sessionStorage中的上次购物页面:', lastShoppingPage);
    
    // 策略2：检查购物车中的商品类型，智能导航
    if (items.length > 0) {
      const firstItem = items[0];
      const productType = firstItem.product_type || firstItem.type || firstItem.category;
      
      console.log('[Cart] Continue Shopping - 根据购物车商品类型导航:', { 
        productType, 
        firstItem: { 
          product_type: firstItem.product_type,
          type: firstItem.type,
          category: firstItem.category 
        }
      });
      
      // 如果有存储的上次购物页面，优先使用
      if (lastShoppingPage && 
          (lastShoppingPage.includes('/consumables') || 
           lastShoppingPage.includes('/spare-parts') || 
           lastShoppingPage.includes('/machines'))) {
        console.log('[Cart] Continue Shopping - 使用存储的上次购物页面:', lastShoppingPage);
        navigate(lastShoppingPage);
        return;
      }
      
      // 根据商品类型智能导航
      if (productType === 'consumable' || productType === 'consumables') {
        console.log('[Cart] Continue Shopping - 根据商品类型导航到耗材页面');
        navigate(ROUTES.CONSUMABLES);
      } else if (productType === 'spare_part' || productType === 'spare-parts' || productType === 'spareParts') {
        console.log('[Cart] Continue Shopping - 根据商品类型导航到备件页面');
        navigate(ROUTES.SPARE_PARTS);
      } else if (productType === 'machine' || productType === 'machines') {
        console.log('[Cart] Continue Shopping - 根据商品类型导航到设备页面');
        navigate(ROUTES.MACHINES);
      } else if (productType === 'accessory' || productType === 'accessories') {
        console.log('[Cart] Continue Shopping - 配件归类到设备页面');
        navigate(ROUTES.MACHINES);
      } else {
        // 无法判断类型时，使用备用策略
        console.log('[Cart] Continue Shopping - 商品类型未知，使用备用策略');
        navigate(lastShoppingPage || ROUTES.CONSUMABLES);
      }
    } else {
      // 策略3：空购物车时的处理
      if (lastShoppingPage && 
          (lastShoppingPage.includes('/consumables') || 
           lastShoppingPage.includes('/spare-parts') || 
           lastShoppingPage.includes('/machines'))) {
        console.log('[Cart] Continue Shopping - 空购物车，使用存储的上次购物页面:', lastShoppingPage);
        navigate(lastShoppingPage);
      } else {
        // 策略4：最终备用策略 - 检查document.referrer
        const referrer = document.referrer;
        const currentHost = window.location.origin;
        
        console.log('[Cart] Continue Shopping - 使用referrer备用策略:', { referrer, currentHost });
        
        if (referrer.startsWith(currentHost) && 
            (referrer.includes('/consumables') || 
             referrer.includes('/spare-parts') || 
             referrer.includes('/machines'))) {
          console.log('[Cart] Continue Shopping - referrer有效，返回上一页');
          navigate(-1);
        } else {
          console.log('[Cart] Continue Shopping - 所有策略失效，导航到耗材页面');
          navigate(ROUTES.CONSUMABLES);
        }
      }
    }
  };

  // 🔧 改进：为空购物车提供更好的导航
  const handleStartShopping = () => {
    // 新用户引导到主页
    navigate(ROUTES.HOME);
  };

  return (
    <div className="cart-page cart-page--figma">
      <header className="cart-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>{currentLanguage === 'zh' ? '购物车' : 'Shopping Cart'}</h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="cart-btn-secondary"
          >
            {currentLanguage === 'zh' ? '清空购物车' : 'Clear Cart'}
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="empty-icon" aria-hidden>
            🛒
          </div>
          <p>
            {currentLanguage === 'zh' ? '购物车为空' : 'Your Cart is Empty'}
          </p>
          <p>
            {currentLanguage === 'zh'
              ? '您还没有添加任何商品到购物车'
              : "You haven't added any items to your cart yet"}
          </p>
          <button type="button" onClick={handleStartShopping} className="cart-btn-primary">
            {currentLanguage === 'zh' ? '开始购物' : 'Start Shopping'}
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-container">
            <CartList
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              onBulkRemove={handleBulkRemove}
              language={currentLanguage}
              showBulkActions={true}
            />
          </div>

          <aside className="cart-summary">
            <h4>{currentLanguage === 'zh' ? '订单摘要' : 'Order Summary'}</h4>

            <div className="summary-row">
              <span>{currentLanguage === 'zh' ? '已选择商品' : 'Selected items'}</span>
              <span>
                {selectedCount} {currentLanguage === 'zh' ? '件' : 'items'}
              </span>
            </div>

            <div className="summary-row">
              <span>{currentLanguage === 'zh' ? '商品小计' : 'Subtotal'}</span>
              <span>¥{selectedTotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>{currentLanguage === 'zh' ? '运费' : 'Shipping'}</span>
              <span>{currentLanguage === 'zh' ? '免费' : 'Free'}</span>
            </div>

            <div className="summary-row total">
              <span>{currentLanguage === 'zh' ? '总计' : 'Total'}</span>
              <span>¥{selectedTotal.toFixed(2)}</span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className="cart-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLanguage === 'zh' ? '立即结算' : 'Checkout Now'}
              </button>

              <button type="button" onClick={handleContinueShopping} className="cart-btn-secondary w-full">
                {currentLanguage === 'zh' ? '继续购物' : 'Continue Shopping'}
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[var(--cart-tint,#e8eef9)]">
              <div className="flex items-center text-sm text-[var(--cart-text-muted)]">
                <svg className="w-4 h-4 mr-2 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {currentLanguage === 'zh' ? '安全结算保障' : 'Secure Checkout'}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 🌐 **多语言清空确认对话框** */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentLanguage === 'zh' ? '确认清空购物车' : 'Confirm Clear Cart'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentLanguage === 'zh' 
                ? '确定要清空购物车吗？此操作不可恢复。'
                : 'Are you sure you want to clear the cart? This action cannot be undone.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {currentLanguage === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleClearCart}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {currentLanguage === 'zh' ? '确认清空' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;