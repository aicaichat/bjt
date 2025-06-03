import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './OrderList.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ROUTES } from '../../config/routes';
import { PAGINATION, NOTIFICATION } from '../../config/appConfig';
import { safeToLocaleString } from '../../utils/priceUtils';
import orderService from '../../api/services/order.service';
import { ProductCard } from '../../components/ProductInfo';
import { useBatchProductInfo } from '../../hooks/useProductInfo';

// 订单项接口定义
interface OrderItem {
  id: string;
  part_number: string; // 使用part_number作为统一标识
  name?: string; // 保留原始名称作为fallback
  specs?: string | any;
  price: number;
  quantity: number;
}

// 订单接口定义
interface Order {
  id: string;
  orderNumber?: string;
  date: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  total: number;
  paymentMethod: string;
  shippingInfo: string | any;
  items: OrderItem[];
}

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['orderList']);
  const { user } = useAuth();
  const notification = useNotification();
  
  // 状态定义
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [isEmptyResults, setIsEmptyResults] = useState(false);
  const [newOrderAdded, setNewOrderAdded] = useState(false);
  const [error, setError] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');

  // 批量获取所有订单项的产品信息
  const allPartNumbers = orders.flatMap(order => 
    order.items.map(item => item.part_number).filter(Boolean)
  );
  const { products: productInfos } = useBatchProductInfo(allPartNumbers);

  // 检查用户是否已登录
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);
  
  // 检查URL参数，看是否有新订单添加
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const fromPO = searchParams.get('fromPO');
    
    if (fromPO === 'true') {
      setNewOrderAdded(true);
      
      // 使用配置中的时间
      const timer = setTimeout(() => {
        setNewOrderAdded(false);
      }, NOTIFICATION.AUTO_DISMISS_TIMEOUT || 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // 获取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        // 尝试从API获取订单数据
        try {
          const response: any = await orderService.getOrders({
            page: currentPage,
            perPage: 20,
            status: currentTab === 'all' ? undefined : (currentTab as any),
            search: searchValue || undefined
          });
          
          // 检查是否有API响应数据（可能是包装在data属性中）
          let ordersData = response;
          
          // 处理不同的响应格式
          if (response && typeof response === 'object') {
            if ('data' in response && response.data) {
              ordersData = response.data;
            }
            
            // 检查是否有items数组
            if (ordersData && 'items' in ordersData && Array.isArray(ordersData.items)) {
              // 转换API数据格式为组件需要的格式
              const convertedOrders: Order[] = ordersData.items.map((apiOrder: any) => ({
                id: String(apiOrder.id || apiOrder.order_number),
                orderNumber: apiOrder.order_number,
                date: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleDateString() : '',
                status: mapApiStatusToUIStatus(apiOrder.status),
                total: apiOrder.total_amount || 0,
                paymentMethod: apiOrder.payment_method || t('payment.method.other'),
                shippingInfo: formatAddressInfo(apiOrder.shipping_address),
                items: (apiOrder.items || []).map((item: any) => ({
                  id: String(item.order_item_id || item.id),
                  part_number: item.part_number || `unknown-${Date.now()}`, // 确保有part_number
                  name: item.name, // 保留原始名称作为fallback
                  specs: item.part_number || '',
                  price: item.unit_price || 0,
                  quantity: item.quantity || 0
                }))
              }));
              
              setOrders(convertedOrders);
              setIsEmptyResults(convertedOrders.length === 0);
              setLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.log('API调用失败，使用模拟数据', apiError);
        }
        
        // API失败时使用本地模拟数据
        const savedOrdersJson = localStorage.getItem('orders');
        let savedOrders: Order[] = [];
        
        if (savedOrdersJson) {
          try {
            savedOrders = JSON.parse(savedOrdersJson);
          } catch (e) {
            console.error('解析本地订单数据失败:', e);
            savedOrders = [];
          }
        }
        
        // 模拟订单数据 - 使用真实的料号
        const mockOrders: Order[] = [
          {
            id: 'BJT20231015001',
            orderNumber: 'BJT20231015001',
            date: '2023-10-15 14:30:25',
            status: 'shipped',
            total: 234670,
            paymentMethod: t('payment.method.bankTransfer'),
            shippingInfo: '李四 | 浙江省杭州市滨江区滨盛路1508号 | 13800138000',
            items: [
              {
                id: '1',
                part_number: '60A01143', // LA-E4S V2.0主机
                name: 'LA-E4S V2.0主机-标准版', // fallback名称
                specs: '60A01143',
                price: 100000,
                quantity: 2
              },
              {
                id: '2',
                part_number: '60A04038', // ET400 自动分离器
                name: 'ET400 自动分离器',
                specs: '60A04038',
                price: 8000,
                quantity: 2
              }
            ]
          },
          {
            id: 'BJT20231012005',
            orderNumber: 'BJT20231012005',
            date: '2023-10-12 09:15:10',
            status: 'completed',
            total: 45000,
            paymentMethod: t('payment.method.alipay'),
            shippingInfo: '王五 | 上海市浦东新区张江高科技园区博云路100号 | 13900139000',
            items: [
              {
                id: '1',
                part_number: '60A01141', // LA-E4S V2.0主机-美标版
                name: 'LA-E4S V2.0主机-美标版',
                specs: '60A01141',
                price: 45000,
                quantity: 1
              }
            ]
          },
          {
            id: 'BJT20231010003',
            orderNumber: 'BJT20231010003',
            date: '2023-10-10 16:45:30',
            status: 'pending',
            total: 124000,
            paymentMethod: t('payment.method.bankTransfer'),
            shippingInfo: '张三 | 北京市海淀区中关村软件园2号楼 | 13700137000',
            items: [
              {
                id: '1',
                part_number: '60A01142',
                name: 'LA-E4S V2.0主机-欧标版',
                specs: '60A01142',
                price: 62000,
                quantity: 2
              }
            ]
          }
        ];
        
        // 合并保存的订单和模拟订单
        const allOrders = [...savedOrders, ...mockOrders];
        
        // 根据状态过滤
        let filteredOrders = allOrders;
        if (currentTab !== 'all') {
          filteredOrders = allOrders.filter(order => order.status === currentTab);
        }
        
        // 根据搜索条件过滤
        if (searchValue) {
          filteredOrders = filteredOrders.filter(order => 
            order.orderNumber?.toLowerCase().includes(searchValue.toLowerCase()) ||
            order.items.some(item => 
              item.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
              item.part_number?.toLowerCase().includes(searchValue.toLowerCase())
            )
          );
        }
        
        setOrders(filteredOrders);
        setIsEmptyResults(filteredOrders.length === 0);
        setLoading(false);
      } catch (error) {
        console.error('获取订单数据失败:', error);
        setError(t('messages.error'));
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [t, currentPage, currentTab, searchValue, user]);

  // API状态映射到UI状态
  const mapApiStatusToUIStatus = (apiStatus: string): 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' => {
    const statusMap: Record<string, 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'> = {
      'pending': 'pending',
      'processing': 'paid',
      'shipped': 'shipped',
      'delivered': 'completed',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    return statusMap[apiStatus] || 'pending';
  };

  // 格式化地址信息
  const formatAddressInfo = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      return `${address.name || ''} | ${address.address || ''} | ${address.phone || ''}`.replace(/\|\s*\|/g, '|').trim();
    }
    return String(address);
  };
  
  // 切换订单展开状态
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  // 处理标签切换
  const handleTabChange = (status: string) => {
    setCurrentTab(status);
    setCurrentPage(1);
  };
  
  // 搜索功能
  const handleSearch = () => {
    setCurrentPage(1);
  };
  
  // 处理日期变化
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'start-date') {
      setStartDate(value);
    } else if (id === 'end-date') {
      setEndDate(value);
    }
  };
  
  // 导出PO单
  const handleExportPO = (orderId: string) => {
    // 这里应该调用导出PO单的服务
    console.log('导出PO单:', orderId);
  };
  
  // 查看订单详情
  const handleViewOrderDetail = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // 构建PO页面需要的数据格式
    const poData = {
      orderId: order.id,
      orderItems: order.items.map(item => ({
        id: item.id,
        code: item.part_number,
        sku: item.part_number,
        name: item.name || item.part_number,
        quantity: item.quantity,
        price: item.price,
        specs: item.specs
      })),
      customerInfo: {
        companyName: '',
        contactName: '',
        address: '',
        phone: '',
        email: ''
      },
      shippingInfo: {
        address: typeof order.shippingInfo === 'string' ? order.shippingInfo : formatShippingInfo(order.shippingInfo),
        contactName: '',
        phone: '',
        notes: ''
      },
      summary: {
        subtotal: order.total,
        shipping: 0,
        tax: 0,
        total: order.total
      }
    };
    
    // 导航到PO页面
    navigate('/po', { 
      state: { 
        poData 
      } 
    });
  };
  
  // 格式化收货信息显示
  const formatShippingInfo = (info: any): string => {
    if (!info) return '';
    
    if (typeof info === 'string') {
      return info;
    }
    
    if (typeof info === 'object') {
      const parts = [];
      if (info.name) parts.push(info.name);
      if (info.address) parts.push(info.address);
      if (info.phone) parts.push(info.phone);
      return parts.join(' | ');
    }
    
    return String(info);
  };
  
  // 取消订单
  const handleCancelOrder = (orderId: string) => {
    if (window.confirm(t('messages.deleteConfirm', { orderId }))) {
      setNotificationMsg(t('messages.orderCanceled', { orderId }));
      setTimeout(() => setNotificationMsg(''), 3000);
    }
  };
  
  // 去支付
  const handleGoToPay = (orderId: string) => {
    navigate(`/checkout?order=${orderId}`);
  };
  
  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Format price with locale
  const formatPrice = (price: number) => {
    return safeToLocaleString(price, 'zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  // 获取状态文字
  const getStatusText = (status: string) => {
    return t(`status.${status}`, status);
  };
  
  // 渲染状态标签
  const renderStatusTabs = () => {
    const tabs = [
      { id: 'all', text: t('status.all') },
      { id: 'pending', text: t('status.pending') },
      { id: 'paid', text: t('status.paid') },
      { id: 'shipped', text: t('status.shipped') },
      { id: 'completed', text: t('status.completed') },
      { id: 'cancelled', text: t('status.cancelled') }
    ];
    
    return (
      <div className="status-tabs">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`status-tab ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.text}
          </div>
        ))}
      </div>
    );
  };
  
  // 渲染筛选区域
  const renderFilterSection = () => {
    return (
      <div className="filter-section">
        <div className="date-range">
          <span>{t('filters.dateRangeLabel')}</span>
          <input 
            type="date" 
            className="date-input" 
            id="start-date"
            value={startDate}
            onChange={handleDateChange}
          />
          <span>{t('filters.dateTo')}</span>
          <input 
            type="date" 
            className="date-input" 
            id="end-date"
            value={endDate}
            onChange={handleDateChange}
          />
        </div>
        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder={t('filters.searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>{t('filters.searchButton')}</button>
        </div>
      </div>
    );
  };
  
  // 渲染订单卡片
  const renderOrderCard = (order: Order) => {
    const isExpanded = expandedOrders[order.id] || false;
    
    return (
      <div className={`order-card ${isExpanded ? 'expanded' : ''}`} key={order.id}>
        <div className="order-header">
          <div className="order-id">{t('orderCard.orderNumber')}{order.orderNumber || order.id}</div>
          <div className="order-date">{t('orderCard.orderDate')}{order.date}</div>
          <div>
            <span className={`order-status status-${order.status}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
        <div className="order-details">
          <div className="detail-row">
            <div>
              <span className="detail-label">{t('orderCard.totalAmount')}</span>
              <span className="detail-value">¥{formatPrice(order.total)}</span>
            </div>
            <div>
              <span className="detail-label">{t('orderCard.paymentMethod')}</span>
              <span className="detail-value">{order.paymentMethod}</span>
            </div>
          </div>
          <div className="detail-row">
            <div>
              <span className="detail-label">{t('orderCard.shippingInfo')}</span>
              <span className="detail-value">
                {typeof order.shippingInfo === 'object' 
                  ? formatShippingInfo(order.shippingInfo)
                  : order.shippingInfo}
              </span>
            </div>
          </div>
        </div>
        <div className="order-actions">
          <button 
            className="expand-button"
            onClick={() => {
              if (order.status === 'pending') {
                // 对于待支付的订单，仅展开查看商品
                toggleOrderExpansion(order.id);
              } else {
                // 对于其他状态的订单，跳转到PO页面
                handleViewOrderDetail(order.id);
              }
            }}
          >
            <span className="expand-icon">▶</span> {t('actions.viewProducts')}
          </button>
          <div>
            {order.status === 'pending' ? (
              <>
                <button 
                  className="action-button secondary-button" 
                  onClick={() => handleCancelOrder(order.id)}
                >
                  {t('actions.cancel')}
                </button>
                <button 
                  className="action-button primary-button"
                  onClick={() => handleGoToPay(order.id)}
                >
                  {t('actions.goToPay')}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="action-button secondary-button"
                  onClick={() => handleExportPO(order.id)}
                >
                  {t('actions.exportPO')}
                </button>
                <button 
                  className="action-button primary-button"
                  onClick={() => handleViewOrderDetail(order.id)}
                >
                  {t('actions.viewDetails')}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="order-items">
          {order.items.map(item => (
            <div key={item.id} className="enhanced-item-wrapper">
              <ProductCard 
                partNumber={item.part_number}
                quantity={item.quantity}
                price={item.price}
                showPrice={true}
                showQuantity={true}
                showSpecs={true}
                size="small"
                className="list-view"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 渲染分页控件
  const renderPagination = () => {
    const totalPages = 3;
    const pageItems = [];
    
    // 上一页
    pageItems.push(
      <div 
        key="prev" 
        className="page-item"
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
      >
        «
      </div>
    );
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
      pageItems.push(
        <div 
          key={i} 
          className={`page-item ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </div>
      );
    }
    
    // 下一页
    pageItems.push(
      <div 
        key="next" 
        className="page-item"
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
      >
        »
      </div>
    );
    
    return (
      <div className="pagination">
        {pageItems}
      </div>
    );
  };
  
  // 渲染空订单状态
  const renderEmptyOrders = () => {
    return (
      <div className="empty-orders">
        <div className="empty-icon">📂</div>
        <h3>{t('messages.noOrders')}</h3>
        <p>{t('messages.emptyOrdersSubtitle')}</p>
      </div>
    );
  };
  
  // 渲染通知组件
  const renderNotification = () => {
    if (!notificationMsg) return null;
    
    return (
      <div className="notification">
        <span className="notification-text">{notificationMsg}</span>
        <button className="close-button" onClick={() => setNotificationMsg('')}>×</button>
      </div>
    );
  };
  
  // 渲染错误组件
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{error}</span>
        <button className="close-button" onClick={() => setError('')}>×</button>
      </div>
    );
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }
  
  return (
    <div className="order-list-container">
      <h1 className="page-title">{t('pageTitle')}</h1>
      
      {/* 错误和通知 */}
      {renderError()}
      {renderNotification()}
      
      {/* 新订单通知 */}
      {newOrderAdded && (
        <div className="new-order-notification">
          <span className="success-icon">✓</span>
          <span className="notification-text">{t('messages.orderCreated')}</span>
          <button className="close-button" onClick={() => setNewOrderAdded(false)}>×</button>
        </div>
      )}
      
      {/* 状态标签 */}
      {renderStatusTabs()}
      
      {/* 过滤器区域 */}
      {renderFilterSection()}
      
      <div className="order-list">
        {isEmptyResults ? (
          renderEmptyOrders()
        ) : (
          orders.map(order => renderOrderCard(order))
        )}
      </div>
      
      {!isEmptyResults && renderPagination()}
    </div>
  );
};

export default OrderListPage; 