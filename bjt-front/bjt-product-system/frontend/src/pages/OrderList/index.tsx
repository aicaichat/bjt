import React, { useState, useEffect, useCallback } from 'react';
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
import { UnifiedProduct, UnifiedOrder, CustomerInfo, ShippingInfo, OrderSummary, POData } from '../../types/product.types';
import { ProductDataConverter, OrderProduct, POProduct } from '../../types/unified-product.types';
import { OrderNumberManager } from '../../utils/orderNumberUtils';
import { useOrder } from '../../contexts/OrderContext';
import OrderDataConverter from '../../utils/orderDataConverter';
import { 
  OrderListItem, 
  OrderFilters, 
  OrderStatus, 
  ORDER_STATUS_LABELS 
} from '../../types/orderTypes';

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['orderList', 'common']);
  const { user } = useAuth();
  const notification = useNotification();
  
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

  // 状态定义
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
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
  
  // 🔧 检查location.state，看是否有新订单添加或确认
  useEffect(() => {
    const state = location.state as any;
    
    // 处理来自Order页面的新订单
    if (state?.fromOrder && state?.newOrderData) {
      setNewOrderAdded(true);
      
      console.log('🔧 [OrderList] 检测到来自Order页面的新订单:', {
        orderNumber: state.newOrderData.orderNumber,
        newOrderData: state.newOrderData,
        timestamp: state.timestamp
      });
      
      // 转换新订单数据为UnifiedOrder格式并添加到列表
      const newOrder: UnifiedOrder = {
        id: state.newOrderData.id,
        orderNumber: state.newOrderData.orderNumber,
        date: new Date(state.newOrderData.date).toLocaleDateString(),
        status: state.newOrderData.status as any,
        total: state.newOrderData.total,
        paymentMethod: state.newOrderData.paymentMethod,
        shippingInfo: formatAddressInfo(state.newOrderData.shippingInfo),
        items: state.newOrderData.items.map((item: any) => ({
          id: item.id,
          code: item.part_number,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          model: item.model,
          spec: item.specs,
          specs: item.specs,
          brand: item.brand,
          part_number: item.part_number,
          product_name: item.name,
          unit_price: item.price,
          line_total: item.price * item.quantity
        }))
      };
      
      console.log('🔧 [OrderList] 转换后的新订单:', newOrder);
      
      // 添加新订单到列表顶部
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      // 使用多语言翻译键构造通知文本
      const localizedMsg = t('messages.newOrderCreated', {
        orderNumber: state.newOrderData.orderNumber,
        ns: 'orderList',
        defaultValue: `New order ${state.newOrderData.orderNumber} created`
      });
      setNotificationMsg(localizedMsg);
      
      // 设置自动清除通知
      const timer = setTimeout(() => {
        setNewOrderAdded(false);
        setNotificationMsg('');
      }, NOTIFICATION.AUTO_DISMISS_TIMEOUT || 5000);
      
      return () => clearTimeout(timer);
    }
    
    // 检查来自PO页面的状态（保持原有逻辑）
    if (state?.fromPO) {
      setNewOrderAdded(true);
      
      console.log('🔧 [OrderList] 检测到来自PO页面的操作:', {
        action: state.action,
        poNumber: state.poNumber,
        confirmedOrderData: state.confirmedOrderData,
        timestamp: state.timestamp
      });
      
      // 🔧 如果有确认的订单数据，立即更新本地订单列表
      if (state.confirmedOrderData) {
        console.log('🔧 [OrderList] 接收到确认的订单数据，更新本地列表');
        
        setOrders(prevOrders => {
          // 🔧 检查是否已存在相同订单号的订单
          const existingOrderIndex = prevOrders.findIndex(
            order => order.orderNumber === state.confirmedOrderData.orderNumber
          );
          
          // 🔧 转换确认的订单数据为UnifiedOrder格式
          const confirmedOrder: UnifiedOrder = {
            id: state.confirmedOrderData.id,
            orderNumber: state.confirmedOrderData.orderNumber,
            date: state.confirmedOrderData.date,
            status: 'pending', // 🔧 确认后状态为待支付
            total: state.confirmedOrderData.total,
            paymentMethod: state.confirmedOrderData.paymentMethod,
            shippingInfo: formatAddressInfo(state.confirmedOrderData.shippingInfo),
            items: state.confirmedOrderData.items.map((item: any) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              model: item.model,
              spec: item.spec,
              specs: item.spec,
              brand: item.brand,
              part_number: item.code,
              product_name: item.name,
              unit_price: item.price,
              line_total: item.amount
            }))
          };
          
          console.log('🔧 [OrderList] 转换后的确认订单:', confirmedOrder);
          
          if (existingOrderIndex >= 0) {
            // 🔧 更新现有订单
            const updatedOrders = [...prevOrders];
            updatedOrders[existingOrderIndex] = confirmedOrder;
            console.log('🔧 [OrderList] 更新现有订单');
            return updatedOrders;
          } else {
            // 🔧 添加新订单到列表顶部
            console.log('🔧 [OrderList] 添加新确认的订单到列表顶部');
            return [confirmedOrder, ...prevOrders];
          }
        });
        
        // 🔧 设置通知消息
        setNotificationMsg(`订单 ${state.poNumber} 已确认`);
      }
      
      // 使用配置中的时间
      const timer = setTimeout(() => {
        setNewOrderAdded(false);
        setNotificationMsg('');
      }, NOTIFICATION.AUTO_DISMISS_TIMEOUT || 5000);
      
      return () => clearTimeout(timer);
    }
    
    // 也检查URL参数（向后兼容）
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
  }, [location.state]);
  
  // 获取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        // 🔧 修复：只从API获取订单数据，不使用mock数据
        const response: any = await orderService.getOrders({
          page: currentPage,
          perPage: 20,
          status: currentTab === 'all' ? undefined : (currentTab as any),
          search: searchValue || undefined
        });
        
        console.log('🔍 [OrderList] API响应:', response);
        
        // 检查是否有API响应数据
        let ordersData = response;
        let convertedOrders: UnifiedOrder[] = [];
        
        // 处理不同的响应格式
        if (response && typeof response === 'object') {
          // 🔧 修复：处理真实API返回的格式 {success: true, data: [...]}
          if ('success' in response && response.success && 'data' in response && Array.isArray(response.data)) {
            ordersData = response.data;
          } else if (Array.isArray(response)) {
            ordersData = response;
          } else if ('data' in response && response.data) {
            ordersData = response.data;
          }
          
          // 检查是否有items数组
          if (ordersData && 'items' in ordersData && Array.isArray(ordersData.items)) {
            // 转换API数据格式为组件需要的格式
            convertedOrders = ordersData.items.map((apiOrder: any) => {
              console.log('🔍 [OrderList] 处理API订单:', apiOrder);
              console.log('🔍 [OrderList] API订单运输信息:', apiOrder.shipping_address);
              return {
                id: String(apiOrder.id || apiOrder.order_number),
                orderNumber: apiOrder.order_number,
                date: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleDateString() : '',
                status: mapApiStatusToUIStatus(apiOrder.status),
                total: apiOrder.total_amount || 0,
                paymentMethod: apiOrder.payment_method || t('payment.method.other'),
                // 🔧 修复：保持原始运输信息对象结构，不转换为字符串
                shippingInfo: apiOrder.shipping_address || null,
                // 🔧 添加：保留原始字段名以备用
                shipping_address: apiOrder.shipping_address,
                // 🔧 添加：保留客户信息字段
                customer_info: apiOrder.customer_info,
                billing_address: apiOrder.billing_address,
                items: (apiOrder.items || []).map((item: any) => {
                  console.log('🔍 [OrderList] 处理订单项:', item);
                  
                  // 🔧 使用统一转换器处理订单项数据
                  return ProductDataConverter.fromOrderItem(item);
                })
              };
            });
          } else if (Array.isArray(ordersData)) {
            // 🔧 修复：处理API直接返回数组的情况（真实API格式）
            convertedOrders = ordersData.map((apiOrder: any) => {
              console.log('🔍 [OrderList] 处理数组API订单:', apiOrder);
              console.log('🔍 [OrderList] 数组API订单运输信息:', apiOrder.shipping_address);
              return {
                id: String(apiOrder.id || apiOrder.order_number),
                orderNumber: apiOrder.order_number,
                date: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleDateString() : '',
                status: mapApiStatusToUIStatus(apiOrder.status),
                total: apiOrder.total_amount || 0,
                paymentMethod: apiOrder.payment_method || t('payment.method.other'),
                // 🔧 修复：保持原始运输信息对象结构，不转换为字符串
                shippingInfo: apiOrder.shipping_address || null,
                // 🔧 添加：保留原始字段名以备用
                shipping_address: apiOrder.shipping_address,
                // 🔧 添加：保留客户信息字段
                customer_info: apiOrder.customer_info,
                billing_address: apiOrder.billing_address,
                items: (apiOrder.items || []).map((item: any) => {
                  console.log('🔍 [OrderList] 处理数组订单项:', item);
                  
                  // 🔧 使用统一转换器处理订单项数据
                  return ProductDataConverter.fromOrderItem(item);
                })
              };
            });
          }
        }
        
        // 🔧 修复：只显示真实API数据，如果为空就显示空状态
        console.log('🔍 [OrderList] 处理后的订单数据:', convertedOrders);
        setOrders(convertedOrders);
        setIsEmptyResults(convertedOrders.length === 0);
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
      'pending_payment': 'pending', // 🔧 添加pending_payment状态映射
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
  
  // 查看订单详情
  const handleViewOrderDetail = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.error('🔧 [OrderList] 找不到订单:', orderId);
      return;
    }
    
    console.log('🔧 [OrderList] 开始处理订单详情跳转:', order);
    
    try {
      console.log('🔧 [OrderList] 开始处理订单详情跳转，使用简化逻辑');
      
      // 🔧 修复：初始化为空值，避免默认值阻止数据提取
      let extractedCustomerInfo: CustomerInfo = {
        companyName: '',
        contactName: '', 
        address: '',
        phone: '',
        email: ''
      };
      
      let extractedShippingInfo: ShippingInfo = {
        address: '',
        contactName: '',
        phone: '', 
        notes: ''
      };
      
      // 🔧 提取客户信息 - 更全面的数据源检查
      const customerSources = [
        (order as any).customer_info,
        (order as any).user_info,
        (order as any).billing_address,
        order.shippingInfo,
        order.shipping_address  // 🔧 这是主要的数据源
      ];
      
      console.log('🔧 [OrderList] 检查客户信息来源:', customerSources);
      console.log('🔧 [OrderList] 订单shipping_address详细信息:', order.shipping_address);
      console.log('🔧 [OrderList] shipping_address类型:', typeof order.shipping_address);
      console.log('🔧 [OrderList] shipping_address字段:', order.shipping_address ? Object.keys(order.shipping_address) : 'N/A');
      
      for (const source of customerSources) {
        if (source && typeof source === 'object') {
          console.log('🔧 [OrderList] 处理客户信息源:', source);
          
          // 🔧 修复：使用API返回的正确字段名 companyName (不是 company_name)
          if (!extractedCustomerInfo.companyName && (source.companyName || source.company_name || source.company)) {
            const companyName = source.companyName || source.company_name || source.company;
            console.log('🔧 [OrderList] 提取公司名称:', companyName);
            extractedCustomerInfo.companyName = companyName;
          }
          
          // 🔧 修复：使用API返回的正确字段名 contactName (不是 contact_name)
          if (!extractedCustomerInfo.contactName && (source.contactName || source.contact_name || source.name || source.recipient_name)) {
            const contactName = source.contactName || source.contact_name || source.name || source.recipient_name;
            console.log('🔧 [OrderList] 提取联系人:', contactName);
            extractedCustomerInfo.contactName = contactName;
          }
          
          if (!extractedCustomerInfo.address && source.address) {
            console.log('🔧 [OrderList] 提取地址:', source.address);
            extractedCustomerInfo.address = source.address;
          }
          
          if (!extractedCustomerInfo.phone && (source.phone || source.contact_phone)) {
            const phone = source.phone || source.contact_phone;
            console.log('🔧 [OrderList] 提取电话:', phone);
            extractedCustomerInfo.phone = phone;
          }
          
          if (!extractedCustomerInfo.email && source.email) {
            console.log('🔧 [OrderList] 提取邮箱:', source.email);
            extractedCustomerInfo.email = source.email;
          }
        }
      }
      
      // 🔧 设置合理的默认值（如果没有提取到数据）
      if (!extractedCustomerInfo.companyName) extractedCustomerInfo.companyName = 'Customer Company';
      if (!extractedCustomerInfo.contactName) extractedCustomerInfo.contactName = 'Customer Contact';
      if (!extractedCustomerInfo.address) extractedCustomerInfo.address = 'Customer Address';
      if (!extractedCustomerInfo.phone) extractedCustomerInfo.phone = 'Customer Phone';
      
      console.log('🔧 [OrderList] 最终提取的客户信息:', extractedCustomerInfo);
      
      // 🔧 处理运输信息 - 从多个数据源提取（API返回的字段是shipping_address）
      const shippingData = order.shipping_address || order.shippingInfo || (order as any).delivery_info;
      
      console.log('🔧 [OrderList] 原始运输信息:', shippingData);
      console.log('🔧 [OrderList] 运输信息类型:', typeof shippingData);
      console.log('🔧 [OrderList] 完整订单对象:', order);
      
      if (shippingData) {
        if (typeof shippingData === 'object' && shippingData !== null) {
          // 🔧 API返回的是对象格式，直接映射字段
          extractedShippingInfo = {
            address: shippingData.address || extractedShippingInfo.address,
            contactName: shippingData.name || shippingData.contact_name || shippingData.contactName || extractedShippingInfo.contactName,
            phone: shippingData.phone || shippingData.contact_phone || shippingData.mobile || extractedShippingInfo.phone,
            notes: shippingData.notes || shippingData.note || extractedShippingInfo.notes
          };
          console.log('🔧 [OrderList] API对象格式运输信息处理结果:', extractedShippingInfo);
        } else if (typeof shippingData === 'string') {
          // 字符串格式处理（备用）
          try {
            // 尝试JSON解析
            const parsed = JSON.parse(shippingData);
            extractedShippingInfo = {
              address: parsed.address || extractedShippingInfo.address,
              contactName: parsed.name || parsed.contact_name || extractedShippingInfo.contactName,
              phone: parsed.phone || parsed.contact_phone || extractedShippingInfo.phone,
              notes: parsed.notes || parsed.note || extractedShippingInfo.notes
            };
            console.log('🔧 [OrderList] JSON字符串解析运输信息结果:', extractedShippingInfo);
          } catch (e) {
            // 分隔符格式: "地址|联系人|电话|备注"
            const parts = shippingData.split('|').map(s => s.trim());
            extractedShippingInfo = {
              address: parts[0] || extractedShippingInfo.address,
              contactName: parts[1] || extractedShippingInfo.contactName,
              phone: parts[2] || extractedShippingInfo.phone,
              notes: parts[3] || extractedShippingInfo.notes
            };
            console.log('🔧 [OrderList] 分隔符格式运输信息处理结果:', extractedShippingInfo);
          }
        }
      } else {
        console.log('🔧 [OrderList] 没有找到运输信息，尝试从其他字段提取');
        
        // 🔧 尝试从订单的其他字段提取运输信息
        const alternativeSources = [
          (order as any).recipient_info,
          (order as any).delivery_address,
          (order as any).shipping_details,
          (order as any).address_info
        ];
        
        for (const source of alternativeSources) {
          if (source && typeof source === 'object') {
            console.log('🔧 [OrderList] 找到备选运输信息源:', source);
            extractedShippingInfo = {
              address: source.address || source.delivery_address || extractedShippingInfo.address,
              contactName: source.name || source.contact_name || source.recipient_name || extractedShippingInfo.contactName,
              phone: source.phone || source.mobile || source.tel || extractedShippingInfo.phone,
              notes: source.notes || source.remark || extractedShippingInfo.notes
            };
            break;
          }
        }
      }
      
      // 🔧 如果运输信息为空，尝试从客户信息中复制
      if (extractedShippingInfo.address === 'Shipping Address' && extractedCustomerInfo.address !== 'Customer Address') {
        extractedShippingInfo.address = extractedCustomerInfo.address;
      }
      if (extractedShippingInfo.contactName === 'Shipping Contact' && extractedCustomerInfo.contactName !== 'Customer Contact') {
        extractedShippingInfo.contactName = extractedCustomerInfo.contactName;
      }
      if (extractedShippingInfo.phone === 'Shipping Phone' && extractedCustomerInfo.phone !== 'Customer Phone') {
        extractedShippingInfo.phone = extractedCustomerInfo.phone;
      }
      
      console.log('🔧 [OrderList] 提取的客户信息:', extractedCustomerInfo);
      console.log('🔧 [OrderList] 提取的运输信息:', extractedShippingInfo);
      
      // 🔧 使用统一的订单号管理器构建PO页面需要的数据格式
      const poData = OrderNumberManager.createUnifiedOrderData({
        orderObject: order,
        orderItems: order.items.map(item => ({
          id: item.id,
          code: item.part_number || item.code,
          sku: item.part_number || item.code,
          name: item.name || (item as any).product_name || item.part_number,
          name_zh: (item as any).name_zh,
          name_en: (item as any).name_en,
          quantity: item.quantity,
          price: item.price || item.unit_price || 0,
          specs: item.specs || item.spec,
          spec: item.spec || item.specs,
          // 🔧 新增：添加imperial字段支持，确保PO页面公英制切换正常工作
          spec_imperial: (item as any).spec_imperial,
          model_imperial: (item as any).model_imperial,
          unit: '个',
          type: 'product',
          model: item.model || item.part_number,
          brand: item.brand || 'Lockedair',
          properties: typeof item.specs === 'object' ? item.specs : {},
          amount: (item.price || item.unit_price || 0) * item.quantity
        })),
        customerInfo: extractedCustomerInfo,
        shippingInfo: extractedShippingInfo,
        summary: {
          subtotal: order.total,
          shipping: 0,
          tax: 0,
          total: order.total
        },
        source: 'order_list_detail'
      });
      
      console.log('🔧 [OrderList] 构建的PO数据:', poData);
      console.log('🔧 [OrderList] PO数据中的运输信息详细检查:', {
        'poData.shippingInfo': poData.shippingInfo,
        'shippingInfo类型': typeof poData.shippingInfo,
        'shippingInfo内容': JSON.stringify(poData.shippingInfo),
        '地址字段': poData.shippingInfo?.address,
        '联系人字段': poData.shippingInfo?.contactName,
        '电话字段': poData.shippingInfo?.phone,
        '备注字段': poData.shippingInfo?.notes,
        '原始extractedShippingInfo': extractedShippingInfo
      });
      
      // 4. 导航到PO页面
      navigate('/po', { 
        state: { 
          poData,
          source: 'order_list_detail',
          originalOrderId: orderId
        } 
      });
      
    } catch (error) {
      console.error('🔧 [OrderList] 处理订单详情失败:', error);
      notification.error('跳转到PO页面失败，请稍后重试');
    }
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
  
  // 过滤/搜索已取消（UI 精简）
  const renderFilterSection = () => null;
  
  // 渲染订单卡片
  const renderOrderCard = (order: UnifiedOrder) => {
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
              <span className="detail-value">{formatPrice(order.total)}</span>
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
            className="action-button secondary-button" 
            onClick={() => handleViewOrderDetail(order.id)}
          >
            {t('actions.backToPO', '返回PO页面')}
          </button>
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