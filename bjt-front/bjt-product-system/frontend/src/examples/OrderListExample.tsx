import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import orderService from '../services/orderService';
import { useNotification } from '../contexts/NotificationContext';
import './OrderListExample.css';
import { safeToLocaleString } from '../utils/priceUtils';

/**
 * 订单列表页面示例组件
 * 演示如何正确使用i18n翻译及通知系统
 */
const OrderListExample: React.FC = () => {
  // 指定使用orderList命名空间
  const { t, i18n } = useTranslation('orderList');
  
  // 使用通知系统
  const { success, error, info } = useNotification();
  
  // 状态管理
  const [currentTab, setCurrentTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // 加载订单数据
  const loadOrders = async (page = 1) => {
    setLoading(true);
    try {
      const response = await orderService.getOrders({ 
        status: currentTab !== 'all' ? currentTab : undefined,
        search: searchValue || undefined,
        page,
        pageSize: 10
      });
      
      setOrders(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (err) {
      console.error(t('fetchError'), err);
      error(t('fetchErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    loadOrders(1);
    setCurrentPage(1);
  }, [currentTab, searchValue]);
  
  // 页码变化处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOrders(page);
  };

  // 取消订单
  const handleCancelOrder = async (orderId: string) => {
    const confirmMessage = t('confirmCancel', { orderId });
    if (window.confirm(confirmMessage)) {
      try {
        await orderService.cancelOrder(orderId);
        // 使用通知系统替代alert
        success(t('cancelSuccess', { orderId }));
        loadOrders(currentPage); // 重新加载当前页
      } catch (err) {
        console.error('Error cancelling order:', err);
        error(t('cancelError', { orderId }));
      }
    }
  };

  // 导出PO单
  const handleExportPO = async (orderId: string) => {
    try {
      // 使用通知系统替代alert
      info(t('exportingPO', { orderId }));
      
      const response = await orderService.exportPO(orderId);
      
      // 如果成功，打开下载链接
      if (response.data.fileUrl) {
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.download = `PO-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        success(t('exportSuccess', { orderId }));
      }
    } catch (err) {
      console.error('Error exporting PO:', err);
      error(t('exportError', { orderId }));
    }
  };

  // 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders(1);
  };

  return (
    <div className="order-list-container">
      {/* 页面标题和语言切换 */}
      <div className="order-list-header">
        <h1>{t('title')}</h1>
        <button className="language-switch" onClick={toggleLanguage}>
          {i18n.language.startsWith('zh') ? 'Switch to English' : '切换到中文'}
        </button>
      </div>
      
      {/* 搜索和筛选栏 */}
      <div className="order-list-filters">
        <div className="tabs">
          <button 
            className={currentTab === 'all' ? 'active' : ''} 
            onClick={() => setCurrentTab('all')}
          >
            {t('tabs.all')}
          </button>
          <button 
            className={currentTab === 'pending' ? 'active' : ''} 
            onClick={() => setCurrentTab('pending')}
          >
            {t('tabs.pending')}
          </button>
          <button 
            className={currentTab === 'paid' ? 'active' : ''} 
            onClick={() => setCurrentTab('paid')}
          >
            {t('tabs.paid')}
          </button>
          <button 
            className={currentTab === 'shipped' ? 'active' : ''} 
            onClick={() => setCurrentTab('shipped')}
          >
            {t('tabs.shipped')}
          </button>
          <button 
            className={currentTab === 'completed' ? 'active' : ''} 
            onClick={() => setCurrentTab('completed')}
          >
            {t('tabs.completed')}
          </button>
          <button 
            className={currentTab === 'cancelled' ? 'active' : ''} 
            onClick={() => setCurrentTab('cancelled')}
          >
            {t('tabs.cancelled')}
          </button>
        </div>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button type="submit">{t('search')}</button>
        </form>
      </div>
      
      {/* 加载状态 */}
      {loading && <div className="loading">{t('loading')}</div>}
      
      {/* 订单列表 */}
      <div className="order-list">
        {!loading && orders.length === 0 ? (
          <div className="no-orders">
            <h3>{t('noOrdersFound')}</h3>
            <p>{t('tryAdjustFilters')}</p>
          </div>
        ) : (
          <>
            {/* 订单卡片 */}
            <div className="order-cards">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <div>
                        <span className="label">{t('orderNumber')}: </span>
                        <span>{order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="label">{t('orderDate')}: </span>
                        <span>{order.orderDate}</span>
                      </div>
                    </div>
                    <div className={`order-status status-${order.status}`}>
                      {t(`status.${order.status}`)}
                    </div>
                  </div>
                  
                  <div className="order-total">
                    <span className="label">{t('totalAmount')}: </span>
                    <span className="price">¥{safeToLocaleString(order.total)}</span>
                  </div>
                  
                  <div className="order-shipping">
                    <span className="label">{t('shippingInfo')}: </span>
                    <span>{order.shippingInfo}</span>
                  </div>
                  
                  {/* 订单商品 */}
                  <div className="order-items-toggle">
                    <button className="view-items-btn">{t('viewItems')}</button>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="order-actions">
                    <button 
                      className="btn-export" 
                      onClick={() => handleExportPO(order.id)}
                    >
                      {t('exportPO')}
                    </button>
                    
                    {order.status === 'pending' && (
                      <button 
                        className="btn-cancel" 
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        {t('cancelOrder')}
                      </button>
                    )}
                    
                    <button className="btn-details">
                      {t('viewDetails')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  &laquo;
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={currentPage === page ? 'active' : ''}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderListExample; 