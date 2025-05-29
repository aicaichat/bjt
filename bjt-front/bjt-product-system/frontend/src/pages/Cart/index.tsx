import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../../contexts/CartContext';
import { CartList } from '../../components/Cart/CartList';
import { useToastNotifications } from '../../components/ui';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['cart', 'translation']);
  const { items, updateQuantity, removeItem, clearCart, isItemSelected, toggleItemSelection, selectAll, selectedItems, selectedTotal, selectedCount } = useContext(CartContext);
  const { success, warning } = useToastNotifications();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentLanguage = i18n.language || 'zh';

  // 计算总价
  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.unit_price * item.quantity);
    }, 0);
  };

  // 处理清空购物车
  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    success(t('cartCleared', { ns: 'cart' }));
  };

  // 处理结算
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      warning(t('emptyCartWarning', { ns: 'cart' }));
      return;
    }
    // 只结算选中的商品
    navigate('/order', { state: { orderItems: selectedItems, fromCart: true } });
  };

  return (
    <div className="cart-page min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title', { ns: 'cart' })}
          </h1>
          <p className="text-gray-600">
            {t('subtitle', { ns: 'cart' })} ({items.length} {t('items', { ns: 'cart' })})
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 购物车商品列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('itemsList', { ns: 'cart' })}
                </h2>
                {items.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    {t('clearAll', { ns: 'cart' })}
                  </button>
                )}
              </div>

              <CartList
                items={items}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                language={currentLanguage as 'zh' | 'en'}
                isItemSelected={isItemSelected}
                toggleItemSelection={toggleItemSelection}
                selectAll={selectAll}
              />
            </div>
          </div>

          {/* 订单摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('orderSummary', { ns: 'cart' })}
              </h3>

              {/* 价格明细 */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('selectedSubtotal', { ns: 'cart', defaultValue: '选中小计' })}:</span>
                  <span className="font-medium">¥{selectedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('shipping', { ns: 'cart' })}:</span>
                  <span className="font-medium text-green-600">{t('freeShipping', { ns: 'cart' })}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('selectedTotal', { ns: 'cart', defaultValue: '选中合计' })}:</span>
                    <span className="text-primary">¥{selectedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{t('selectedCount', { ns: 'cart', defaultValue: '已选商品数' })}:</span>
                    <span>{selectedCount}</span>
                  </div>
                </div>
              </div>

              {/* 结算按钮 */}
              <button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors duration-200"
              >
                {t('proceedToCheckout', { ns: 'cart' })}
              </button>

              {/* 继续购物 */}
              <button
                onClick={() => navigate('/spare-parts')}
                className="w-full mt-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 rounded-lg transition-colors duration-200"
              >
                {t('continueShopping', { ns: 'cart' })}
              </button>
            </div>
          </div>
        </div>

        {/* 清空购物车确认对话框 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('confirmClear', { ns: 'cart' })}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('confirmClearMessage', { ns: 'cart' })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 rounded-lg transition-colors duration-200"
                >
                  {t('cancel', { ns: 'cart' })}
                </button>
                <button
                  onClick={handleClearCart}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors duration-200"
                >
                  {t('confirm', { ns: 'cart' })}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;