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
  const { t } = useTranslation();
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
                paymentMethod: apiOrder.payment_method || '未知',
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
            paymentMethod: '银行转账',
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
            paymentMethod: '支付宝',
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
            id: 'BJT20231001015',
            orderNumber: 'BJT20231001015',
            date: '2023-10-01 16:45:33',
            status: 'pending',
            total: 15800,
            paymentMethod: '待选择',
            shippingInfo: '赵六 | 北京市海淀区中关村南大街5号 | 13700137000',
            items: [
              {
                id: '1',
                part_number: '08A0105795', // 8A 保险丝
                name: '8A 保险丝',
                specs: '08A0105795',
                price: 150,
                quantity: 20
              }
            ]
          }
        ];
        
        // 合并本地存储的订单和模拟订单
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
            (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
            order.items.some(item => {
              // 搜索part_number和名称
              return (item.part_number && item.part_number.toLowerCase().includes(searchLower)) ||
                     (item.name && item.name.toLowerCase().includes(searchLower));
            })
          );
        }
        
        // 日期筛选
        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000);
          
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.date.split(' ')[0]).getTime();
            return orderDate >= start && orderDate <= end;
          });
        }
        
        setIsEmptyResults(filteredOrders.length === 0);
        setOrders(filteredOrders);
        setLoading(false);
        
      } catch (error) {
        console.error('获取订单数据失败:', error);
        setError('获取订单数据失败，请稍后重试');
        setLoading(false);
        setIsEmptyResults(true);
      }
    };
    
    fetchOrders();
  }, [currentTab, searchValue, startDate, endDate, user, currentPage]);
  
  // 映射API状态到UI状态
  const mapApiStatusToUIStatus = (apiStatus: string): 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' => {
    const statusMap: Record<string, 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'> = {
      'pending_payment': 'pending',
      'processing': 'paid',
      'shipped': 'shipped',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'refunded': 'cancelled'
    };
    return statusMap[apiStatus] || 'pending';
  };

  // 格式化地址信息
  const formatAddressInfo = (address: any): string => {
    if (!address) return '暂无地址信息';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.name) parts.push(address.name);
    if (address.address) parts.push(address.address);
    if (address.phone) parts.push(address.phone);
    
    return parts.join(' | ');
  };
  
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
    setNotificationMsg(`正在导出订单 ${orderId} 的PO单...`);
    setTimeout(() => setNotificationMsg(''), 3000);
  };
  
  // 查看订单详情
  const handleViewOrderDetail = (orderId: string) => {
    // 找到对应订单并传递数据到PO页面
    const order = orders.find(o => o.id === orderId);
    if (order) {
      navigate('/po', {
        state: {
          poData: {
            orderId: order.id,
            orderItems: order.items,
            customerInfo: {
              companyName: '客户公司',
              contactName: '客户联系人',
              address: '客户地址',
              phone: '13800138000',
              email: 'customer@example.com'
            },
            shippingInfo: {
              address: typeof order.shippingInfo === 'string' ? order.shippingInfo : formatShippingInfo(order.shippingInfo),
              contactName: '收货人',
              phone: '13800138000',
              notes: '订单备注'
            },
            summary: {
              subtotal: order.total * 0.9,
              shipping: order.total * 0.05,
              tax: order.total * 0.05,
              total: order.total
            }
          }
        }
      });
    }
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
  
  // 取消订单
  const handleCancelOrder = (orderId: string) => {
    if (window.confirm(`确认要取消订单 ${orderId} 吗？`)) {
      setNotificationMsg(`订单 ${orderId} 已成功取消`);
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
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };
  
  // 渲染状态标签
  const renderStatusTabs = () => {
    const tabs = [
      { id: 'all', text: '全部订单' },
      { id: 'pending', text: '待支付' },
      { id: 'paid', text: '已支付' },
      { id: 'shipped', text: '已发货' },
      { id: 'completed', text: '已完成' },
      { id: 'cancelled', text: '已取消' }
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
          <span>日期范围：</span>
          <input 
            type="date" 
            className="date-input" 
            id="start-date"
            value={startDate}
            onChange={handleDateChange}
          />
          <span>至</span>
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
            placeholder="搜索订单号或商品名称"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>搜索</button>
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
          <div className="order-id">订单号：{order.orderNumber || order.id}</div>
          <div className="order-date">订单日期：{order.date}</div>
          <div>
            <span className={`order-status status-${order.status}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
        <div className="order-details">
          <div className="detail-row">
            <div>
              <span className="detail-label">总金额：</span>
              <span className="detail-value">¥{formatPrice(order.total)}</span>
            </div>
            <div>
              <span className="detail-label">支付方式：</span>
              <span className="detail-value">{order.paymentMethod}</span>
            </div>
          </div>
          <div className="detail-row">
            <div>
              <span className="detail-label">收货信息：</span>
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
            <span className="expand-icon">▶</span> 查看商品
          </button>
          <div>
            {order.status === 'pending' ? (
              <>
                <button 
                  className="action-button secondary-button" 
                  onClick={() => handleCancelOrder(order.id)}
                >
                  取消订单
                </button>
                <button 
                  className="action-button primary-button"
                  onClick={() => handleGoToPay(order.id)}
                >
                  去支付
                </button>
              </>
            ) : (
              <>
                <button 
                  className="action-button secondary-button"
                  onClick={() => handleExportPO(order.id)}
                >
                  导出PO单
                </button>
                <button 
                  className="action-button primary-button"
                  onClick={() => handleViewOrderDetail(order.id)}
                >
                  查看详情
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
        <h3>未找到订单</h3>
        <p>请尝试调整筛选条件或搜索关键词</p>
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
        <p>加载订单列表中...</p>
      </div>
    );
  }
  
  return (
    <div className="order-list-container">
      <h1 className="page-title">订单管理</h1>
      
      {/* 错误和通知 */}
      {renderError()}
      {renderNotification()}
      
      {/* 新订单通知 */}
      {newOrderAdded && (
        <div className="new-order-notification">
          <span className="success-icon">✓</span>
          <span className="notification-text">订单创建成功</span>
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