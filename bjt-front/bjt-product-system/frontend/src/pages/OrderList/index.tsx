import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderList.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { ROUTES } from '../../config/routes';
import { PAGINATION, NOTIFICATION } from '../../config/appConfig';
import { safeToLocaleString } from '../../utils/priceUtils';

// 订单项接口定义
interface OrderItem {
  id: string;
  image: string;
  name: string;
  specs: string | any; // specs can be string or object
  price: number;
  quantity: number;
}

// 订单接口定义
interface Order {
  id: string;
  date: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  total: number;
  paymentMethod: string;
  shippingInfo: string;
  items: OrderItem[];
}

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
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
  const [notification, setNotification] = useState('');
  
  // Helper function to convert object to string
  const formatSpecs = (specs: any): string => {
    if (!specs) return '-';
    
    // If it's already a string, return it
    if (typeof specs === 'string') {
      return specs;
    }
    
    // Try to parse if it's a stringified object
    if (typeof specs === 'string' && specs.startsWith('{') && specs.endsWith('}')) {
      try {
        specs = JSON.parse(specs);
      } catch (e) {
        console.error('Error parsing specs JSON:', e);
        // Continue with the original string value if parsing fails
      }
    }
    
    // Handle object
    if (typeof specs === 'object' && specs !== null) {
      try {
        // Check if the object has keys: contactName, phone, email, etc. (shipping info object)
        if ('contactName' in specs || 'phone' in specs || 'email' in specs) {
          return `${specs.contactName || ''} - ${specs.phone || ''}`;
        }
        
        // Regular object conversion
        return Object.entries(specs)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      } catch (error) {
        console.error('Error formatting specs:', error);
        return '-';
      }
    }
    
    // Handle any other type by converting to string
    return String(specs);
  };
  
  // Format shipping info object to string
  const formatShippingInfo = (info: any): string => {
    if (!info) return '-';
    
    if (typeof info === 'string') {
      return info;
    }
    
    // If it's an object with shipping info properties
    if (typeof info === 'object' && info !== null) {
      try {
        const parts = [];
        
        if (info.contactName) parts.push(info.contactName);
        if (info.company) parts.push(info.company);
        if (info.address) parts.push(info.address);
        if (info.phone) parts.push(info.phone);
        
        return parts.join(' | ');
      } catch (error) {
        console.error('Error formatting shipping info:', error);
        return JSON.stringify(info);
      }
    }
    
    return String(info);
  };
  
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
      try {
        setLoading(true);
        
        // 从localStorage获取订单数据
        const savedOrdersJson = localStorage.getItem('orders');
        let savedOrders: Order[] = [];
        
        if (savedOrdersJson) {
          try {
            savedOrders = JSON.parse(savedOrdersJson);
            
            // Ensure specs is properly formatted
            savedOrders = savedOrders.map(order => ({
              ...order,
              items: order.items.map(item => ({
                ...item,
                specs: item.specs // Keep original specs for now
              })),
              // Ensure shippingInfo is handled properly
              shippingInfo: typeof order.shippingInfo === 'string' 
                ? order.shippingInfo
                : order.shippingInfo // Keep as object for formatShippingInfo to handle
            }));
          } catch (e) {
            console.error(t('orderList.parseError'), e);
            // 解析错误时使用空数组
            savedOrders = [];
          }
        }
        
        // 模拟API延迟
        setTimeout(() => {
          // 模拟订单数据
          const mockOrders: Order[] = [
            {
              id: 'BJT20231015001',
              date: '2023-10-15 14:30:25',
              status: 'shipped',
              total: 234670,
              paymentMethod: t('orderList.paymentMethod.bankTransfer'),
              shippingInfo: '李四 | 浙江省杭州市滨江区滨盛路1508号 | 13800138000',
              items: [
                {
                  id: '1',
                  image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ELP-V1%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
                  name: 'LP-V1 包装机',
                  specs: '标准型号 | SKU: LP-V1-001',
                  price: 100000,
                  quantity: 2
                },
                {
                  id: '2',
                  image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3EFS%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
                  name: 'Floor Stand',
                  specs: '标准配置 | SKU: FS-001',
                  price: 8000,
                  quantity: 2
                },
                {
                  id: '3',
                  image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ECH%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
                  name: 'Cable Holder',
                  specs: '3米 | SKU: CH-001',
                  price: 500,
                  quantity: 4
                }
              ]
            },
            {
              id: 'BJT20231012005',
              date: '2023-10-12 09:15:10',
              status: 'completed',
              total: 45000,
              paymentMethod: '支付宝',
              shippingInfo: '王五 | 上海市浦东新区张江高科技园区博云路100号 | 13900139000',
              items: [
                {
                  id: '1',
                  image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ELP-F1%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
                  name: 'LP-F1 包装机',
                  specs: '标准型号 | SKU: LP-F1-001',
                  price: 45000,
                  quantity: 1
                }
              ]
            },
            {
              id: 'BJT20231001015',
              date: '2023-10-01 16:45:33',
              status: 'pending',
              total: 15800,
              paymentMethod: '待选择',
              shippingInfo: '赵六 | 北京市海淀区中关村南大街5号 | 13700137000',
              items: [
                {
                  id: '1',
                  image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ESF%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
                  name: '特种薄膜',
                  specs: 'A4/100张/包 | SKU: SF-A4-100',
                  price: 150,
                  quantity: 20
                },
                {
                  id: '2',
                  image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ELK%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
                  name: 'Label Kit',
                  specs: '标准配置 | SKU: LK-001',
                  price: 2800,
                  quantity: 5
                }
              ]
            }
          ];
          
          // 合并本地存储的订单和模拟订单，优先展示本地存储的订单
          const combinedOrders = [...savedOrders, ...mockOrders];
          
          // 应用筛选
          let filteredOrders = combinedOrders;
          
          // 状态筛选
          if (currentTab !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === currentTab);
          }
          
          // 搜索筛选
          if (searchValue) {
            const searchLower = searchValue.toLowerCase();
            filteredOrders = filteredOrders.filter(order => 
              order.id.toLowerCase().includes(searchLower) || 
              order.items.some(item => item.name.toLowerCase().includes(searchLower))
            );
          }
          
          // 日期筛选
          if (startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // Include the full end date
            
            filteredOrders = filteredOrders.filter(order => {
              const orderDate = new Date(order.date.split(' ')[0]).getTime();
              return orderDate >= start && orderDate <= end;
            });
          }
          
          // 设置为空结果如果没有符合条件的订单
          setIsEmptyResults(filteredOrders.length === 0);
          
          setOrders(filteredOrders);
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error(t('orderList.fetchError'), error);
        setLoading(false);
        setIsEmptyResults(true);
        setError(t('orderList.fetchErrorMessage'));
      }
    };
    
    fetchOrders();
  }, [currentTab, searchValue, startDate, endDate, t]);
  
  // 展开/收起订单详情
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  // 处理状态标签切换
  const handleTabChange = (status: string) => {
    setCurrentTab(status);
    setCurrentPage(1);
  };
  
  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1);
  };
  
  // 处理日期更改
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'start-date') {
      setStartDate(value);
    } else if (id === 'end-date') {
      setEndDate(value);
    }
    setCurrentPage(1);
  };
  
  // 导出PO单
  const handleExportPO = (orderId: string) => {
    setNotification(t('orderList.exportingPO', `Exporting PO for order ${orderId}...`));
    // 在实际应用中，这里应该调用API并下载文件
  };
  
  // 查看订单详情
  const handleViewOrderDetail = (orderId: string) => {
    navigate(`/po?orderId=${orderId}`);
  };
  
  // 取消订单
  const handleCancelOrder = (orderId: string) => {
    if (window.confirm(t('orderList.confirmCancel', `Are you sure you want to cancel order ${orderId}?`))) {
      setNotification(t('orderList.cancelSuccess', `Order ${orderId} has been cancelled successfully`));
      // 在实际应用中，这里应该调用API取消订单
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
    return t(`orderList.status.${status}`);
  };
  
  // 渲染状态标签
  const renderStatusTabs = () => {
    const tabs = [
      { id: 'all', text: t('orderList.tabs.all') },
      { id: 'pending', text: t('orderList.tabs.pending') },
      { id: 'paid', text: t('orderList.tabs.paid') },
      { id: 'shipped', text: t('orderList.tabs.shipped') },
      { id: 'completed', text: t('orderList.tabs.completed') },
      { id: 'cancelled', text: t('orderList.tabs.cancelled') }
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
          <span>{t('orderList.dateRange')}：</span>
          <input 
            type="date" 
            className="date-input" 
            id="start-date"
            value={startDate}
            onChange={handleDateChange}
          />
          <span>{t('orderList.to')}</span>
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
            placeholder={t('orderList.searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>{t('orderList.search')}</button>
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
          <div className="order-id">{t('orderList.orderNumber')}：{order.id}</div>
          <div className="order-date">{t('orderList.orderDate')}：{order.date}</div>
          <div>
            <span className={`order-status status-${order.status}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
        <div className="order-details">
          <div className="detail-row">
            <div>
              <span className="detail-label">{t('orderList.totalAmount')}：</span>
              <span className="detail-value">¥{formatPrice(order.total)}</span>
            </div>
            <div>
              <span className="detail-label">{t('orderList.paymentMethod')}：</span>
              <span className="detail-value">{order.paymentMethod}</span>
            </div>
          </div>
          <div className="detail-row">
            <div>
              <span className="detail-label">{t('orderList.shippingInfo')}：</span>
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
                navigate(`/po?orderId=${order.id}`);
              }
            }}
          >
            <span className="expand-icon">▶</span> {t('orderList.viewItems')}
          </button>
          <div>
            {order.status === 'pending' ? (
              <>
                <button 
                  className="action-button secondary-button" 
                  onClick={() => handleCancelOrder(order.id)}
                >
                  {t('orderList.cancelOrder')}
                </button>
                <button 
                  className="action-button primary-button"
                  onClick={() => handleGoToPay(order.id)}
                >
                  {t('orderList.goToPay')}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="action-button secondary-button"
                  onClick={() => handleExportPO(order.id)}
                >
                  {t('orderList.exportPO')}
                </button>
                <button 
                  className="action-button primary-button"
                  onClick={() => handleViewOrderDetail(order.id)}
                >
                  {t('orderList.viewDetails')}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="order-items">
          {order.items.map(item => (
            <div className="item-card" key={item.id}>
              <img src={item.image} alt={item.name} className="item-image" />
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="item-specs">{formatSpecs(item.specs)}</div>
                <div className="item-price">¥{formatPrice(item.price)}</div>
              </div>
              <div className="item-quantity">x{item.quantity}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 渲染分页控件
  const renderPagination = () => {
    // 简单的分页示例，实际应用中应根据API响应的总页数计算
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
        <h3>{t('orderList.noOrdersFound')}</h3>
        <p>{t('orderList.tryAdjustFilters')}</p>
      </div>
    );
  };
  
  // 渲染通知组件
  const renderNotification = () => {
    if (!notification) return null;
    
    return (
      <div className="notification">
        <span className="notification-text">{notification}</span>
        <button className="close-button" onClick={() => setNotification('')}>×</button>
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
        <p>{t('orderList.loading')}</p>
      </div>
    );
  }
  
  return (
    <div className="order-list-container">
      <h1 className="page-title">{t('orderList.title')}</h1>
      
      {/* 错误和通知 */}
      {renderError()}
      {renderNotification()}
      
      {/* 新订单通知 */}
      {newOrderAdded && (
        <div className="new-order-notification">
          <span className="success-icon">✓</span>
          <span className="notification-text">{t('orderList.orderCreatedSuccess')}</span>
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