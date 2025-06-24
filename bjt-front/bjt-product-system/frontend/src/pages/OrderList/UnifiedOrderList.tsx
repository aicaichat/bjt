import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../../contexts/OrderContext';
import OrderDataConverter from '../../utils/orderDataConverter';
import { 
  OrderListItem, 
  OrderFilters, 
  OrderStatus, 
  ORDER_STATUS_LABELS 
} from '../../types/orderTypes';
import './OrderList.css';

const UnifiedOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['order', 'common']);
  
  // 使用订单状态管理
  const {
    state,
    loadOrderList,
    setOrderListFilters,
    refreshOrderList,
    setPageTransferData,
    getOrderById
  } = useOrder();
  
  // 本地状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 初始化加载订单列表
  useEffect(() => {
    loadOrderList();
  }, [loadOrderList]);

  // 处理筛选条件变化
  const handleFilterChange = useCallback(() => {
    const filters: OrderFilters = {
      search: searchTerm || undefined,
      status: selectedStatus || undefined,
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
      page: 1, // 重置到第一页
      pageSize: 20
    };
    
    console.log('🔧 [OrderList] 应用筛选条件:', filters);
    setOrderListFilters(filters);
    loadOrderList(filters);
  }, [searchTerm, selectedStatus, dateRange, setOrderListFilters, loadOrderList]);

  // 处理分页
  const handlePageChange = useCallback((page: number) => {
    const filters: OrderFilters = {
      ...state.orderListFilters,
      page
    };
    
    setOrderListFilters(filters);
    loadOrderList(filters);
  }, [state.orderListFilters, setOrderListFilters, loadOrderList]);

  // 查看订单详情
  const handleViewOrder = useCallback(async (orderItem: OrderListItem) => {
    console.log('🔧 [OrderList] 查看订单详情:', orderItem);
    
    try {
      // 尝试获取完整订单数据
      const fullOrderData = await getOrderById(orderItem.orderId);
      
      if (fullOrderData) {
        // 创建页面传递数据
        const transferData = OrderDataConverter.createPageTransferData(
          'orderlist',
          fullOrderData,
          {
            fromPage: 'orderlist',
            listItem: orderItem,
            viewTime: new Date().toISOString()
          }
        );
        
        // 设置页面传递数据
        setPageTransferData(transferData);
        
        // 跳转到PO页面
        navigate('/po', {
          state: {
            orderData: fullOrderData,
            source: 'orderlist',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        console.error('❌ [OrderList] 无法获取完整订单数据');
        alert('无法获取订单详情，请稍后重试');
      }
    } catch (error) {
      console.error('❌ [OrderList] 获取订单详情失败:', error);
      alert('获取订单详情失败，请稍后重试');
    }
  }, [getOrderById, setPageTransferData, navigate]);

  // 导出Excel
  const handleExportExcel = useCallback(async (orderItem: OrderListItem) => {
    console.log('🔧 [OrderList] 导出Excel:', orderItem);
    
    try {
      const fullOrderData = await getOrderById(orderItem.orderId);
      
      if (fullOrderData) {
        const excelData = OrderDataConverter.toExcelExportData(
          fullOrderData,
          'OrderList User'
        );
        
        // 这里调用Excel导出服务
        console.log('📊 [OrderList] Excel导出数据:', excelData);
        alert('Excel导出功能开发中...');
      }
    } catch (error) {
      console.error('❌ [OrderList] Excel导出失败:', error);
      alert('Excel导出失败，请稍后重试');
    }
  }, [getOrderById]);

  // 排序处理
  const sortedOrders = React.useMemo(() => {
    const orders = [...state.orderList];
    
    orders.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return orders;
  }, [state.orderList, sortBy, sortOrder]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化价格
  const formatPrice = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="order-list-page">
      <div className="page-header">
        <h1>{t('order.list.title', '订单列表')}</h1>
        <button 
          className="btn btn-primary"
          onClick={refreshOrderList}
          disabled={state.orderListLoading}
        >
          {state.orderListLoading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 筛选区域 */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>{t('order.list.search', '搜索')}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('order.list.searchPlaceholder', '搜索订单号、客户名称...')}
              className="form-control"
            />
          </div>
          
          <div className="filter-group">
            <label>{t('order.list.status', '状态')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | '')}
              className="form-control"
            >
              <option value="">{t('order.list.allStatus', '全部状态')}</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{t('order.list.dateRange', '日期范围')}</label>
            <div className="date-range">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-control"
              />
              <span>-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-control"
              />
            </div>
          </div>
          
          <button 
            className="btn btn-secondary"
            onClick={handleFilterChange}
          >
            {t('order.list.filter', '筛选')}
          </button>
        </div>
      </div>

      {/* 排序区域 */}
      <div className="sort-section">
        <div className="sort-controls">
          <label>{t('order.list.sortBy', '排序')}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-control"
          >
            <option value="createdAt">{t('order.list.sortByDate', '创建时间')}</option>
            <option value="totalAmount">{t('order.list.sortByAmount', '订单金额')}</option>
            <option value="status">{t('order.list.sortByStatus', '状态')}</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="form-control"
          >
            <option value="desc">{t('order.list.descending', '降序')}</option>
            <option value="asc">{t('order.list.ascending', '升序')}</option>
          </select>
        </div>
      </div>

      {/* 错误信息 */}
      {state.orderListError && (
        <div className="error-message">
          {state.orderListError}
        </div>
      )}

      {/* 订单列表 */}
      <div className="order-list">
        {state.orderListLoading ? (
          <div className="loading">
            {t('order.list.loading', '加载中...')}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="empty-state">
            {t('order.list.empty', '暂无订单数据')}
          </div>
        ) : (
          <div className="order-table">
            <div className="table-header">
              <div className="col-order-number">{t('order.list.orderNumber', '订单号')}</div>
              <div className="col-customer">{t('order.list.customer', '客户')}</div>
              <div className="col-amount">{t('order.list.amount', '金额')}</div>
              <div className="col-status">{t('order.list.status', '状态')}</div>
              <div className="col-date">{t('order.list.date', '创建时间')}</div>
              <div className="col-actions">{t('order.list.actions', '操作')}</div>
            </div>
            
            {sortedOrders.map((order) => (
              <div key={order.orderId} className="table-row">
                <div className="col-order-number">
                  <span className="order-number">{order.orderNumber}</span>
                  <span className="item-count">({order.itemCount} 项)</span>
                </div>
                
                <div className="col-customer">
                  {order.customerName}
                </div>
                
                <div className="col-amount">
                  {formatPrice(order.totalAmount, order.currency)}
                </div>
                
                <div className="col-status">
                  <span className={`status-badge status-${order.status}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                
                <div className="col-date">
                  {formatDate(order.createdAt)}
                </div>
                
                <div className="col-actions">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleViewOrder(order)}
                  >
                    {t('order.list.view', '查看')}
                  </button>
                  
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleExportExcel(order)}
                  >
                    {t('order.list.export', '导出')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {state.orderListPagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-sm"
            disabled={state.orderListPagination.currentPage === 1}
            onClick={() => handlePageChange(state.orderListPagination.currentPage - 1)}
          >
            {t('common.previous', '上一页')}
          </button>
          
          <span className="page-info">
            {t('order.list.pageInfo', '第 {{current}} 页，共 {{total}} 页', {
              current: state.orderListPagination.currentPage,
              total: state.orderListPagination.totalPages
            })}
          </span>
          
          <button 
            className="btn btn-sm"
            disabled={state.orderListPagination.currentPage === state.orderListPagination.totalPages}
            onClick={() => handlePageChange(state.orderListPagination.currentPage + 1)}
          >
            {t('common.next', '下一页')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedOrderListPage; 