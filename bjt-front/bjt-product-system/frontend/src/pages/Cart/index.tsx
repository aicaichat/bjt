import React, { useContext, useState, useEffect, useRef } from 'react';
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
  // 🔧 新增：购物选项菜单状态
  const [showShoppingOptions, setShowShoppingOptions] = useState(false);
  // 🔧 新增：菜单引用，用于点击外部关闭
  const shoppingOptionsRef = useRef<HTMLDivElement>(null);

  // 🔧 新增：点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shoppingOptionsRef.current && !shoppingOptionsRef.current.contains(event.target as Node)) {
        setShowShoppingOptions(false);
      }
    };

    if (showShoppingOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShoppingOptions]);

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

  // 🔧 改进：智能导航到购物页面
  const handleContinueShopping = () => {
    // 检查浏览器历史，如果上一页是购物页面则返回，否则导航到主页
    const referrer = document.referrer;
    const currentHost = window.location.origin;
    
    // 如果来源是本站的购物页面，则返回上一页
    if (referrer.startsWith(currentHost) && 
        (referrer.includes('/consumables') || 
         referrer.includes('/spare-parts') || 
         referrer.includes('/machines'))) {
      navigate(-1);
    } else {
      // 否则导航到主页
      navigate(ROUTES.HOME);
    }
  };

  // 🔧 改进：为空购物车提供更好的导航
  const handleStartShopping = () => {
    // 新用户引导到主页
    navigate(ROUTES.HOME);
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
          <div className="space-y-4">
                          <button
                onClick={handleStartShopping}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === 'zh' ? '开始购物' : 'Start Shopping'}
              </button>
            
            {/* 🔧 新增：快速产品分类选择 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate(ROUTES.CONSUMABLES)}
                className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                🧪 {currentLanguage === 'zh' ? '耗材' : 'Consumables'}
              </button>
              
              <button
                onClick={() => navigate(ROUTES.SPARE_PARTS)}
                className="px-4 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
              >
                🔧 {currentLanguage === 'zh' ? '备件' : 'Parts'}
              </button>
              
              <button
                onClick={() => navigate(ROUTES.MACHINES)}
                className="px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                ⚙️ {currentLanguage === 'zh' ? '设备' : 'Machines'}
              </button>
            </div>
          </div>
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
                  onClick={handleContinueShopping}
                  className="w-full px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {currentLanguage === 'zh' ? '继续购物' : 'Continue Shopping'}
                </button>
                
                {/* 🔧 新增：购物选项下拉菜单 */}
                <div className="relative" ref={shoppingOptionsRef}>
                  <button
                    onClick={() => setShowShoppingOptions(!showShoppingOptions)}
                    className="w-full px-6 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {currentLanguage === 'zh' ? '浏览商品分类' : 'Browse Categories'}
                    <svg 
                      className={`w-4 h-4 transition-transform ${showShoppingOptions ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showShoppingOptions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate(ROUTES.CONSUMABLES);
                            setShowShoppingOptions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            🧪
                          </div>
                          <div>
                            <div className="font-medium">
                              {currentLanguage === 'zh' ? '耗材' : 'Consumables'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {currentLanguage === 'zh' ? '实验室耗材用品' : 'Laboratory consumables'}
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate(ROUTES.SPARE_PARTS);
                            setShowShoppingOptions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            🔧
                          </div>
                          <div>
                            <div className="font-medium">
                              {currentLanguage === 'zh' ? '备件' : 'Spare Parts'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {currentLanguage === 'zh' ? '设备备件配件' : 'Equipment spare parts'}
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate(ROUTES.MACHINES);
                            setShowShoppingOptions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            ⚙️
                          </div>
                          <div>
                            <div className="font-medium">
                              {currentLanguage === 'zh' ? '设备' : 'Machines'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {currentLanguage === 'zh' ? '实验室设备' : 'Laboratory equipment'}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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