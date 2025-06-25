import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../../contexts/CartContext';
import { CartList } from '../../components/Cart/CartList';
import { useToastNotifications } from '../../components/ui';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('cart');
  const { items, updateQuantity, removeItem, removeMultipleItems, clearCart, isItemSelected, toggleItemSelection, selectAll, selectedItems, selectedTotal, selectedCount } = useContext(CartContext);
  const { success, warning } = useToastNotifications();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 🌐 **当前语言设置**
  const currentLanguage: 'zh' | 'en' = i18n.language === 'en' ? 'en' : 'zh';

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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 页面标题和控制栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentLanguage === 'zh' ? '购物车' : 'Shopping Cart'}
        </h1>
        {items.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            {currentLanguage === 'zh' ? '清空购物车' : 'Clear Cart'}
          </button>
        )}
      </div>

      {/* 🔄 **左右分栏布局** */}
      {items.length === 0 ? (
        /* 空购物车状态 - 全宽显示 */
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {currentLanguage === 'zh' ? '购物车为空' : 'Your Cart is Empty'}
          </h3>
          <p className="text-gray-500 mb-6">
            {currentLanguage === 'zh' 
              ? '您还没有添加任何商品到购物车'
              : 'You haven\'t added any items to your cart yet'
            }
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentLanguage === 'zh' ? '开始购物' : 'Start Shopping'}
          </button>
        </div>
      ) : (
        /* 有商品时的左右分栏布局 */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：购物车列表 */}
          <div className="lg:col-span-2">
            <CartList
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              onBulkRemove={handleBulkRemove}
              language={currentLanguage}
              showBulkActions={true}
            />
          </div>

          {/* 右侧：结算区域 */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
              {/* 订单摘要标题 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {currentLanguage === 'zh' ? '订单摘要' : 'Order Summary'}
              </h3>

              {/* 选中商品信息 */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {currentLanguage === 'zh' ? '已选择商品:' : 'Selected Items:'}
                  </span>
                  <span className="font-medium">{selectedCount} {currentLanguage === 'zh' ? '件' : 'items'}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {currentLanguage === 'zh' ? '商品小计:' : 'Subtotal:'}
                  </span>
                  <span className="font-medium">¥{selectedTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {currentLanguage === 'zh' ? '运费:' : 'Shipping:'}
                  </span>
                  <span className="font-medium text-green-600">
                    {currentLanguage === 'zh' ? '免费' : 'Free'}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{currentLanguage === 'zh' ? '总计:' : 'Total:'}</span>
                    <span className="text-blue-600">¥{selectedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {currentLanguage === 'zh' ? '立即结算' : 'Checkout Now'}
                </button>
                
                <button
                  onClick={() => navigate(-1)}
                  className="w-full px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {currentLanguage === 'zh' ? '继续购物' : 'Continue Shopping'}
                </button>
              </div>

              {/* 安全提示 */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'zh' ? '安全结算保障' : 'Secure Checkout'}
                </div>
              </div>
            </div>
          </div>
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