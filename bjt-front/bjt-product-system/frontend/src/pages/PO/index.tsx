import React, { useState, useEffect, Fragment, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import './PO.css';
import { ASSETS } from '../../config/appConfig';
import { useNotification } from '../../contexts/NotificationContext';
import { ROUTES } from '../../config/routes';
import { format, addDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, Spin, Space, Table, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { safeToLocaleString } from '../../utils/priceUtils';
import logo from '../../assets/logo.svg';
import orderService, { Order, OrderStatus, CreateOrderRequest } from '../../api/services/order.service';
import { Loading, Error } from '../../components/common';
import * as XLSX from 'xlsx';
import { CartFieldUnifier, CartExcelNormalizer } from '../../utils/CartFieldUnifier';
import { UnifiedProduct, CustomerInfo, ShippingInfo, OrderSummary, POLocationState } from '../../types/product.types';
import { useCart } from '../../contexts/CartContext';
import { OrderNumberManager } from '../../utils/orderNumberUtils';


// 1. 新增仿Excel模板的表格CSS
const poExcelTableStyle = `
.po-excel-table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 32px;
  font-family: 'Arial', sans-serif;
}
.po-excel-table th, .po-excel-table td {
  border: 1px solid #000;
  padding: 8px;
  font-size: 15px;
  vertical-align: middle;
}
.po-excel-table th {
  font-weight: bold;
  background: #f2f2f2;
  text-align: center;
}

/* 统一的区域标题样式 (Buyer, Vendor, Ship To) */
.po-excel-table .section-header {
  font-weight: bold;
  background: #f0f0f0 !important;
  padding: 8px !important;
  font-size: 14px !important;
  text-align: center;
}

/* 统一的字段标签样式 */
.po-excel-table .field-label {
  font-weight: bold !important;
  padding: 6px !important;
  font-size: 12px !important;
  background: #f8f8f8 !important;
  text-align: left;
}

/* 统一的字段值样式 */
.po-excel-table .field-value {
  padding: 6px !important;
  font-size: 12px !important;
  text-align: left;
}

/* 特殊样式 */
.po-excel-table .amount-cell {
  color: #e74c3c;
  font-weight: bold;
  text-align: right;
}
.po-excel-table .summary-label {
  font-weight: bold;
  background: #f2f2f2;
  text-align: right;
}
.po-excel-table .remarks-cell {
  font-style: italic;
  background: #fafafa;
}

/* 打印样式优化 */
@media print {
  .po-excel-table {
    font-size: 12px;
  }
  .po-excel-table .section-header {
    font-size: 13px !important;
  }
  .po-excel-table .field-label,
  .po-excel-table .field-value {
    font-size: 11px !important;
  }
}
`;

const POPage: React.FC = () => {
  const { t, i18n } = useTranslation('po');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const notification = useNotification();
  
  const [isDirectAccess, setIsDirectAccess] = useState(true);
  
  // 获取当前日期的格式化字符串
  const getFormattedDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [poNumber, setPONumber] = useState<string>(''); // 初始为空，等待从传入数据设置
  const [poDate, setPODate] = useState<string>(getFormattedDate());
  const [paymentMethod, setPaymentMethod] = useState<string>(language === 'cn' ? '银行转账' : 'Bank Transfer');
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    companyName: '',
    contactName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    contactName: '',
    phone: '',
    notes: ''
  });
  const [summary, setSummary] = useState<OrderSummary>({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    format(addDays(new Date(), 15), 'yyyy-MM-dd')
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const poRef = useRef<HTMLDivElement>(null);

  // 当前语言
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
  
  // 🔧 修复：获取用户的单位制偏好
  const preferredUnit = user?.preferred_unit || 'metric';
  
  // 检查用户是否已登录
  useEffect(() => {
    const isPublicPage = false; // PO页面需要登录
    if (!user && !isPublicPage) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  // 获取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await orderService.getOrders({
          page: currentPage,
          perPage: 100
        });
        
        setOrders(response.items);
        setTotalPages(response.total_pages);
      } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        setError(t('errors.failedToLoadOrders'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [i18n.language, currentPage, t, user]);

  useEffect(() => {
    // 检查是否有从Order页面或OrderList页面传递的数据
    const state = location.state as POLocationState | null;
    
    console.log('🔧 [PO Page] 接收到的location.state:', state);
    
    if (state && state.poData) {
      try {
        // 🔧 修复：简化数据处理逻辑，不需要复杂的数组检查
        let targetOrder = state.poData;
        
        console.log('🔧 [PO Page] 处理订单数据:', targetOrder);
        console.log('🔧 [PO Page] 运输信息详细检查:', {
          'targetOrder.shippingInfo': targetOrder.shippingInfo,
          'shippingInfo类型': typeof targetOrder.shippingInfo,
          'shippingInfo内容': JSON.stringify(targetOrder.shippingInfo),
          '是否为空': !targetOrder.shippingInfo,
          '是否为对象': typeof targetOrder.shippingInfo === 'object',
          '对象键': targetOrder.shippingInfo ? Object.keys(targetOrder.shippingInfo) : 'N/A'
        });
        
        // 🔧 统一：使用OrderNumberManager统一处理订单号
        const orderInfo = OrderNumberManager.extractFromOrderObject(targetOrder);
        console.log('🔧 [PO Page] 提取的订单号信息:', orderInfo);
        setPONumber(orderInfo.displayNumber);
        
        // 🔧 设置商品数据
        if (targetOrder.orderItems && Array.isArray(targetOrder.orderItems)) {
          console.log('🔧 [PO Page] 设置商品数据，数量:', targetOrder.orderItems.length);
          setProducts(targetOrder.orderItems);
          setTotalPages(Math.ceil(targetOrder.orderItems.length / 10));
        } else {
          console.warn('⚠️ [PO Page] 商品数据无效或为空');
          setProducts([]);
        }
        
        // 🔧 统一：使用统一的客户信息处理逻辑
        const standardCustomerInfo = standardizeCustomerInfo(targetOrder.customerInfo, targetOrder.shippingInfo);
        console.log('🔧 [PO Page] 标准化后的客户信息:', standardCustomerInfo);
        setCustomerInfo(standardCustomerInfo);
        
        // 🔧 统一：使用统一的运输信息处理逻辑 - 添加详细日志
        console.log('🔧 [PO Page] 准备标准化运输信息...');
        console.log('🔧 [PO Page] 原始运输信息:', targetOrder.shippingInfo);
        
        const standardShippingInfo = standardizeShippingInfo(targetOrder.shippingInfo);
        console.log('🔧 [PO Page] 标准化后的运输信息:', standardShippingInfo);
        console.log('🔧 [PO Page] 运输信息字段检查:', {
          'address': standardShippingInfo.address,
          'contactName': standardShippingInfo.contactName,
          'phone': standardShippingInfo.phone,
          'notes': standardShippingInfo.notes,
          '地址是否为默认值': standardShippingInfo.address === 'Shipping Address',
          '联系人是否为默认值': standardShippingInfo.contactName === 'Shipping Contact'
        });
        
        setShippingInfo(standardShippingInfo);
        
        // 🔧 统一：使用统一的汇总信息处理逻辑
        const standardSummary = standardizeOrderSummary(targetOrder.summary, targetOrder.orderItems || []);
        console.log('🔧 [PO Page] 标准化后的订单汇总:', standardSummary);
        setSummary(standardSummary);
        
        // 注意：POData类型不包含paymentMethod和date字段，使用默认值
        // 如果需要这些字段，应当扩展POData类型定义
        
        setIsLoading(false);
        setDataReady(true);
        
        // 如果标记了自动打印，则延迟打印
        if (state.autoPrint) {
          console.log('🖨️ [PO Page] 检测到自动打印标志，准备打印');
          setTimeout(() => {
            printPO();
          }, 1000);
        }
        
      } catch (error) {
        console.error('❌ [PO Page] 数据处理失败:', error);
        setError('订单数据处理失败');
        setIsLoading(false);
      }
    } else {
      // 🔧 直接访问处理：统一重定向逻辑
      setIsDirectAccess(true);
      setIsLoading(true);
      
      console.log('🔧 [PO Page] 没有接收到数据，检查是否为直接访问');
      
      // 检查URL参数，看是否有其他方式传递的数据
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdFromUrl = urlParams.get('orderId');
      const poNumberFromUrl = urlParams.get('poNumber');
      
      if (orderIdFromUrl || poNumberFromUrl) {
        console.log('🔧 [PO Page] 检测到URL参数，尝试加载订单数据:', { orderIdFromUrl, poNumberFromUrl });
        loadOrderFromParams(orderIdFromUrl, poNumberFromUrl);
      } else {
        // 确认为直接访问，延迟重定向
        const timer = setTimeout(() => {
          if (isDirectAccess) {
            console.log('🔧 [PO Page] 确认为直接访问，重定向到订单页面');
            navigate(ROUTES.ORDER || '/order');
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [location.state, navigate, isDirectAccess]);
  
  // 🔧 新增：统一的数据处理方法
  const processIncomingPOData = (poData: any, source: string) => {
    console.log('🔧 [PO Page] 开始统一数据处理，来源:', source);
    
    // 根据来源使用不同的处理策略
    switch (source) {
      case 'order_list_detail':
      case 'order_list_standardized':
        // OrderList传入的数据已经经过标准化
        return poData;
        
      case 'order_page':
      case 'cart_checkout':
        // Order页面传入的数据，可能需要额外处理
        return processOrderPageData(poData);
        
      default:
        // 未知来源，使用通用处理
        return processGenericData(poData);
    }
  };
  
  // 🔧 新增：标准化客户信息 - 增强版本
  const standardizeCustomerInfo = (customerInfo: any, shippingInfo?: any): CustomerInfo => {
    console.log('🔧 [标准化] 原始客户信息:', customerInfo);
    console.log('🔧 [标准化] 备用运输信息:', shippingInfo);
    
    // 🔧 修复：优先使用已经提取好的customerInfo，特别是来自OrderList的数据
    if (customerInfo && typeof customerInfo === 'object') {
      const extractedCompanyName = customerInfo.companyName || customerInfo.company_name || customerInfo.company;
      const extractedContactName = customerInfo.contactName || customerInfo.contact_name || customerInfo.name;
      const extractedAddress = customerInfo.address;
      const extractedPhone = customerInfo.phone || customerInfo.contact_phone;
      const extractedEmail = customerInfo.email || '';
      
      console.log('🔧 [标准化] 从customerInfo提取的字段值:', {
        companyName: extractedCompanyName,
        contactName: extractedContactName,
        address: extractedAddress,
        phone: extractedPhone,
        email: extractedEmail
      });
      
      // 🔧 如果customerInfo中有任何有效字段，优先使用它们
      if (extractedCompanyName || extractedContactName || extractedAddress || extractedPhone) {
        const result = {
          companyName: extractedCompanyName || 'Customer Company',
          contactName: extractedContactName || 'Customer Contact',
          address: extractedAddress || 'Customer Address',
          phone: extractedPhone || 'Customer Phone',
          email: extractedEmail
        };
        console.log('🔧 [标准化] 使用customerInfo中的数据:', result);
        return result;
      }
    }
    
    // 🔧 如果customerInfo无效，才从shippingInfo中提取，因为API数据主要在shipping_address中
    if (shippingInfo && typeof shippingInfo === 'object') {
      console.log('🔧 [标准化] customerInfo无效，从运输信息中提取客户信息');
      
      const extractedCompanyName = shippingInfo.companyName || shippingInfo.company_name || shippingInfo.company;
      const extractedContactName = shippingInfo.contactName || shippingInfo.contact_name || shippingInfo.name;
      const extractedAddress = shippingInfo.address;
      const extractedPhone = shippingInfo.phone || shippingInfo.contact_phone;
      const extractedEmail = shippingInfo.email || '';
      
      console.log('🔧 [标准化] 从shippingInfo提取的字段值:', {
        companyName: extractedCompanyName,
        contactName: extractedContactName,
        address: extractedAddress,
        phone: extractedPhone,
        email: extractedEmail
      });
      
      // 🔧 如果有任何有效字段，就使用从shippingInfo提取的数据
      if (extractedCompanyName || extractedContactName || extractedAddress || extractedPhone) {
        const result = {
          companyName: extractedCompanyName || 'Customer Company',
          contactName: extractedContactName || 'Customer Contact',
          address: extractedAddress || 'Customer Address',
          phone: extractedPhone || 'Customer Phone',
          email: extractedEmail
        };
        console.log('🔧 [标准化] 从运输信息中成功提取客户数据:', result);
        return result;
      }
    }
    
    // 最后使用默认值
    console.log('🔧 [标准化] 使用默认客户信息');
    return {
      companyName: 'Hangzhou Bingjia Tech. Co., Ltd.',
      contactName: 'Customer Contact',
      address: 'Customer Address',
      phone: 'Customer Phone',
      email: ''
    };
  };
  
  // 🔧 新增：标准化运输信息 - 增强版本
  const standardizeShippingInfo = (shippingInfo: any): ShippingInfo => {
    console.log('🔧 [标准化] 原始运输信息:', shippingInfo);
    console.log('🔧 [标准化] 运输信息类型:', typeof shippingInfo);
    
    if (!shippingInfo) {
      console.log('🔧 [标准化] 运输信息为空，使用默认值');
      return {
        address: 'Shipping Address',
        contactName: 'Shipping Contact',
        phone: 'Shipping Phone',
        notes: ''
      };
    }
    
    // 处理字符串格式 "地址|联系人|电话|备注"
    if (typeof shippingInfo === 'string') {
      console.log('🔧 [标准化] 处理字符串格式运输信息');
      const parts = shippingInfo.split('|').map(s => s.trim());
      const result = {
        address: parts[0] || 'Shipping Address',
        contactName: parts[1] || 'Shipping Contact',
        phone: parts[2] || 'Shipping Phone',
        notes: parts[3] || ''
      };
      console.log('🔧 [标准化] 字符串格式转换结果:', result);
      return result;
    }
    
    // 处理对象格式 - 🔧 修复字段映射逻辑，匹配数据库字段
    if (typeof shippingInfo === 'object') {
      console.log('🔧 [标准化] 处理对象格式运输信息');
      console.log('🔧 [标准化] 对象字段:', Object.keys(shippingInfo));
      
      const result = {
        // 🔧 地址字段映射：优先使用address字段
        address: shippingInfo.address || 
                shippingInfo.delivery_address || 
                shippingInfo.shipping_address || 
                'Shipping Address',
        
        // 🔧 修复：联系人字段映射逻辑 - 优先使用已处理的contactName字段
        contactName: shippingInfo.contactName ||   // 🔧 优先使用OrderList已处理的contactName
                    shippingInfo.name ||           // 🔧 数据库原始name字段
                    shippingInfo.contact_name || 
                    shippingInfo.recipient_name || 
                    shippingInfo.receiver_name || 
                    'Shipping Contact',
        
        // 🔧 电话字段映射：优先使用phone字段
        phone: shippingInfo.phone ||                // 🔧 数据库主要字段
               shippingInfo.contact_phone || 
               shippingInfo.mobile || 
               shippingInfo.tel || 
               'Shipping Phone',
        
        // 🔧 备注字段映射：支持多种备注字段名
        notes: shippingInfo.notes || 
               shippingInfo.note || 
               shippingInfo.remark || 
               shippingInfo.comment || 
               ''
      };
      
      console.log('🔧 [标准化] 对象格式转换结果:', result);
      console.log('🔧 [标准化] 字段映射详情:', {
        '原始contactName字段': shippingInfo.contactName,
        '原始name字段': shippingInfo.name,
        '原始phone字段': shippingInfo.phone,
        '原始address字段': shippingInfo.address,
        '映射后contactName': result.contactName,
        '映射后phone': result.phone,
        '映射后address': result.address,
        '是否使用默认值': result.address === 'Shipping Address'
      });
      
      return result;
    }
    
    console.log('🔧 [标准化] 未知格式，使用默认值');
    return {
      address: 'Shipping Address',
      contactName: 'Shipping Contact',
      phone: 'Shipping Phone',
      notes: ''
    };
  };
  
  // 🔧 新增：标准化订单汇总
  const standardizeOrderSummary = (summary: any, orderItems: UnifiedProduct[]): OrderSummary => {
    if (summary && typeof summary === 'object' && summary.total) {
      return {
        subtotal: summary.subtotal || summary.total,
        shipping: summary.shipping || 0,
        tax: summary.tax || 0,
        total: summary.total
      };
    }
    
    // 如果没有汇总信息，从商品列表计算
    const calculatedTotal = orderItems.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);
    
    return {
      subtotal: calculatedTotal,
      shipping: 0,
      tax: 0,
      total: calculatedTotal
    };
  };
  
  // 🔧 新增：处理Order页面数据
  const processOrderPageData = (poData: any) => {
    // Order页面的数据可能需要特殊处理
    console.log('🔧 [PO Page] 处理Order页面数据');
    return poData;
  };
  
  // 🔧 新增：处理通用数据
  const processGenericData = (poData: any) => {
    // 通用数据处理逻辑
    console.log('🔧 [PO Page] 处理通用数据');
    return poData;
  };
  
  // 🔧 新增：错误恢复处理
  const fallbackDataProcessing = (poData: any) => {
    console.log('🔧 [PO Page] 启用错误恢复处理');
    
    // 基础的数据设置，不进行复杂验证
    if (poData.orderItems && Array.isArray(poData.orderItems)) {
      setProducts(poData.orderItems);
    }
    
    if (poData.customerInfo) {
      setCustomerInfo(poData.customerInfo);
    }
    
    if (poData.shippingInfo) {
      setShippingInfo(poData.shippingInfo);
    }
    
    if (poData.summary) {
      setSummary(poData.summary);
    }
    
    setIsLoading(false);
    setDataReady(true);
  };
  
  // 🔧 新增：从URL参数加载订单数据
  const loadOrderFromParams = async (orderId: string, poNumber: string) => {
    try {
      console.log('🔧 [PO Page] 从URL参数加载订单数据:', { orderId, poNumber });
      
      // 这里可以调用API获取订单数据
      // const orderData = await orderService.getOrderById(orderId);
      // 然后使用统一的数据处理逻辑
      
      // 暂时设置为直接访问
      setIsDirectAccess(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error('🔧 [PO Page] 从URL参数加载订单失败:', error);
      navigate(ROUTES.ORDER || '/order');
    }
  };

  // Helper function to convert object to string
  const objectToString = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return '-';
    
    try {
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch (error) {
      console.error('Error converting object to string:', error);
      return '-';
    }
  };

  // 🔧 统一的Excel导出方法
  const exportToExcel = async () => {
    try {
      console.log('🔧 [PO] 开始统一Excel导出，当前语言:', currentLanguage);
      console.log('🔧 [PO] 当前PO数据:', {
        poNumber,
        poDate,
        paymentMethod,
        customerInfo,
        shippingInfo,
        productsCount: products.length,
        summary
      });
      
      // 🔧 统一：构造与PO页面显示完全一致的订单数据，使用业务订单号
      const orderData = {
        id: poNumber, // 🔧 使用PO页面当前显示的订单号
        orderNumber: poNumber, // 🔧 业务订单号
        date: poDate, // 🔧 使用PO页面当前显示的日期
        status: 'pending' as const,
        paymentMethod, // 🔧 使用PO页面当前显示的支付方式
        total: summary.total,
        // 🔧 修复：使用与PO页面完全一致的客户和运输信息结构
        shippingInfo: {
          companyName: customerInfo.companyName, // 对应PO页面Buyer的Company Name
          contactName: customerInfo.contactName || shippingInfo.contactName, // 优先使用客户联系人
          address: customerInfo.address || shippingInfo.address, // 优先使用客户地址
          phone: customerInfo.phone || shippingInfo.phone, // 优先使用客户电话
          notes: shippingInfo.notes,
          email: customerInfo.email || (shippingInfo as any).email || '',
          company: customerInfo.companyName,
          country: (shippingInfo as any).country || ''
        },
        // 🔧 修复：添加供应商信息
        vendor: getVendorAddress(),
        language: (currentLanguage === 'zh' ? 'zh' : 'en') as 'zh' | 'en',
        items: products.map(product => {
          // 🔧 只对耗材类型使用CartFieldUnifier，其他类型保持原有逻辑
          const productType = product.product_type || product.category || product.type;
          let productName: string;
          
          if (productType === 'consumable') {
            // 只对耗材使用CartFieldUnifier
            productName = CartFieldUnifier.getProductName(product, currentLanguage);
          } else {
            // 其他产品类型保持原有逻辑
            productName = product.name || (product as any).product_name || product.model || product.code || String(product.id);
          }
          
          return {
            id: product.id,
            code: product.code || product.sku,
            name: productName, // 🔧 使用条件性的名称获取方法
            quantity: product.quantity,
            price: product.price,
            model: product.model,
            spec: product.spec,
            brand: product.brand,
            amount: (product.price || 0) * (product.quantity || 1)
          };
        })
      };
      
      console.log('🔧 [PO Excel Export] 最终订单数据:', {
        id: orderData.id,
        date: orderData.date,
        paymentMethod: orderData.paymentMethod,
        customerInfo: orderData.shippingInfo,
        vendorInfo: orderData.vendor,
        itemsCount: orderData.items.length
      });
      
      // 🔧 使用统一的ExcelExporter导出
      const { ExcelExporter } = await import('../../utils/excelExporter');
      await ExcelExporter.exportToExcel(orderData);
      
      notification.success(t('exportSuccess', 'Excel导出成功'));
    } catch (error) {
      console.error('🔧 [PO] Excel导出失败:', error);
      notification.error(t('exportError', 'Excel导出失败'));
    }
  };

  // 🔧 移除简化导出方法，统一使用上面的方法
  const exportToExcelSimple = exportToExcel;

  // 打印PO单
  const printPO = () => {
    try {
      console.log('🖨️ 开始打印PO单:', poNumber);
      
      // 保存当前页面标题
      const originalTitle = document.title;
      document.title = `PO单-${poNumber}`;
      
      // 直接调用浏览器打印，依赖CSS中的@media print样式
      window.print();
      
      // 恢复标题
      setTimeout(() => {
        document.title = originalTitle;
        console.log('🖨️ 打印完成');
      }, 500);
      
    } catch (error) {
      console.error('❌ 打印失败:', error);
      alert('打印失败，请重试');
    }
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  // 🔧 修复：PO页面确认订单后，确保数据一致性和正确跳转
  const completePO = async () => {
    try {
      setIsLoading(true);
      
      // 🔧 检查是否有有效的订单数据
      if (!products || products.length === 0) {
        console.error('🔧 [PO] 没有有效的订单数据');
        notification.error(t('errors.noOrderData', 'No order data available'));
        return;
      }
      
      console.log('🔧 [PO] 开始确认PO操作');
      console.log('🔧 [PO] 当前PO号:', poNumber);
      console.log('🔧 [PO] 订单项目数量:', products.length);
      console.log('🔧 [PO] 客户信息:', customerInfo);
      console.log('🔧 [PO] 运输信息:', shippingInfo);
      console.log('🔧 [PO] 订单汇总:', summary);
      
      // 🔧 构造完整的订单数据，确保与PO页面显示的数据完全一致
      const orderDataForList = {
        id: poNumber,
        orderNumber: poNumber, // 🔧 确保订单号一致
        date: poDate,
        status: 'pending' as const,
        total: summary.total,
        paymentMethod: paymentMethod,
        shippingInfo: {
          companyName: customerInfo.companyName,
          contactName: customerInfo.contactName || shippingInfo.contactName,
          address: customerInfo.address || shippingInfo.address,
          phone: customerInfo.phone || shippingInfo.phone,
          notes: shippingInfo.notes,
          email: customerInfo.email || ''
        },
        items: products.map(product => {
          // 🔧 只对耗材类型使用CartFieldUnifier，其他类型保持原有逻辑
          const productType = product.product_type || product.category || product.type;
          let productName: string;
          
          if (productType === 'consumable') {
            // 只对耗材使用CartFieldUnifier
            productName = CartFieldUnifier.getProductName(product, currentLanguage);
          } else {
            // 其他产品类型保持原有逻辑
            productName = product.name || (product as any).product_name || product.model || product.code || String(product.id);
          }
          
          return {
            id: product.id,
            code: product.code || product.sku,
            name: productName, // 🔧 使用条件性的名称获取方法
            quantity: product.quantity,
            price: product.price,
            model: product.model,
            spec: product.spec,
            brand: product.brand,
            amount: (product.price || 0) * (product.quantity || 1)
          };
        })
      };
      
      console.log('🔧 [PO] 构造的完整订单数据:', orderDataForList);
      
      // 🔧 尝试更新订单状态（如果有API支持）
      try {
        // 这里可以调用API更新订单状态
        // await orderService.updateOrderStatus(poNumber, 'confirmed');
        console.log('🔧 [PO] 订单状态更新（模拟）');
      } catch (apiError) {
        console.warn('🔧 [PO] API更新失败，继续本地操作:', apiError);
      }
      
      notification.success(t('poConfirmed', 'PO confirmed successfully'));
      
      // 🔧 导航回订单列表页面，传递完整的订单数据
      navigate(ROUTES.ORDERS || '/orders', { 
        state: { 
          fromPO: true, 
          poNumber: poNumber,
          confirmedOrderData: orderDataForList, // 🔧 传递完整的订单数据
          action: 'confirmed',
          timestamp: Date.now() // 🔧 添加时间戳确保状态更新
        },
        replace: true // 🔧 使用replace避免用户返回到PO页面
      });
      
    } catch (error) {
      console.error('🔧 [PO] 确认PO时出错:', error);
      notification.error(t('processingError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Format price display based on language
  const formatPrice = (price: number) => {
    return safeToLocaleString(price, language === 'cn' ? 'zh-CN' : 'en-US');
  };

  // 获取当前页的产品
  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = Math.min(startIndex + 10, products.length);
    return products.slice(startIndex, endIndex);
  };

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 🎯 获取产品名称（使用统一系统，解决BUG-003：中英文显示混乱）
  const getProductName = (product: UnifiedProduct) => {
    console.log('🔧 [PO Page] getProductName调用:', {
      currentLanguage,
      productCode: product.code,
      productId: product.id,
      name: product.name,
      name_zh: (product as any).name_zh,
      name_en: (product as any).name_en,
      model: product.model,
      '完整产品对象': product
    });
    
    const result = CartFieldUnifier.getProductName(product, currentLanguage);
    console.log('🔧 [PO Page] getProductName结果:', result);
    
    return result;
  };

  // 根据语言或地区获取供应商地址
  const getVendorAddress = () => {
    // 可以基于language或其他条件扩展到更多国家/地区
    if (language === 'cn') {
      return {
        companyName: 'BJT Pack 中国分公司',
        address: '浙江省杭州市西湖区文一西路1818号',
        city: '杭州市, 浙江省 310000',
        country: '中国'
      };
    } else {
      return {
        companyName: 'BJT Pack, Inc.',
        address: '5275 Naiman Parkway, Suite B',
        city: 'Solon, Ohio 44139',
        country: 'USA'
      };
    }
  };

  const vendorAddress = getVendorAddress();

  // 添加格式化货币的函数
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'cn' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: language === 'cn' ? 'CNY' : 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // 仿Excel模板表格组件，定义在POPage内部，props传递数据
  const POExcelTable: React.FC<{products: UnifiedProduct[], language: string, shippingInfo: ShippingInfo, summary: OrderSummary}> = ({products, language, shippingInfo, summary}) => (
    <>
      <style>{poExcelTableStyle}</style>
      {/* 第一页：PO元信息 - 按模板布局 */}
      <table className="po-excel-table" style={{marginBottom: '32px', tableLayout: 'fixed'}}>
        <colgroup>
          <col style={{width: '25%'}} />
          <col style={{width: '25%'}} />
          <col style={{width: '25%'}} />
          <col style={{width: '25%'}} />
        </colgroup>
        <tbody>
          {/* 第一行：Logo和标题 */}
          <tr>
            <td rowSpan={3} style={{border: "1px solid #000", width: '25%', textAlign: "center", verticalAlign: "middle", padding: '10px'}}>
              <img src="/images/logo-1.webp" alt="Company Logo" style={{maxWidth: '120px', maxHeight: '60px', objectFit: "contain"}} />
            </td>
            <td style={{border: "1px solid #000", width: '25%'}}></td>
            <td rowSpan={3} style={{border: "1px solid #000", width: '25%', textAlign: "center", verticalAlign: "middle", fontSize: '24px', fontWeight: 'bold'}}>
              {t('header.purchaseOrder')}
            </td>
            <td style={{border: "1px solid #000", width: '25%', fontSize: '12px', padding: '4px'}}>
              <div style={{fontWeight: "bold", display: 'inline'}}>{t('header.purchaseOrderNumber')}</div>
              <br />
              <div style={{fontWeight: 'bold', color: '#000', fontSize: '13px'}}>{poNumber}</div>
            </td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontSize: '12px', padding: '4px'}}>
              <div style={{fontWeight: "bold", display: 'inline'}}>{t('header.date')}</div>
              <br />
              <div style={{fontWeight: 'bold', color: '#000', fontSize: '13px'}}>{poDate}</div>
            </td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontSize: '12px', padding: '4px'}}>
              <div style={{fontWeight: "bold", display: 'inline'}}>{t('header.paymentMethod')}</div>
              <br />
              <div style={{fontWeight: 'bold', color: '#000', fontSize: '13px'}}>{paymentMethod}</div>
            </td>
          </tr>
          
          {/* Buyer区域 */}
          <tr>
            <td className="section-header">{t('sections.buyer')}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="section-header">{t('sections.shipTo')}</td>
          </tr>
          <tr>
            <td className="field-label">{t('fields.companyName')}</td>
            <td className="field-value" style={{height: '30px'}}>{customerInfo.companyName}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-label">{t('fields.contactName')}</td>
          </tr>
          <tr>
            <td className="field-label">{t('fields.address')}</td>
            <td className="field-value" style={{height: '30px'}}>{customerInfo.address}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-value">{shippingInfo.contactName}</td>
          </tr>
          
          {/* Vendor区域 */}
          <tr>
            <td className="section-header">{t('sections.vendor')}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-label">{t('fields.phone')}</td>
          </tr>
          <tr>
            <td className="field-label">{t('fields.companyName')}</td>
            <td className="field-value">{vendorAddress.companyName}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-value">{shippingInfo.phone}</td>
          </tr>
          <tr>
            <td className="field-label">{t('fields.address')}</td>
            <td className="field-value">{`${vendorAddress.address}, ${vendorAddress.city}`}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-label">{t('fields.address')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-value">{shippingInfo.address}</td>
          </tr>
          
          {/* Ship to详细信息 */}
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-label">{t('fields.notes')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td className="field-value" style={{color: '#d00'}}>{shippingInfo.notes}</td>
          </tr>
        </tbody>
      </table>

      {/* 第二页：产品表格 */}
      <table className="po-excel-table">
        <colgroup>
          <col style={{width: '12%'}} />
          <col style={{width: '18%'}} />
          <col style={{width: '10%'}} />
          <col style={{width: '25%'}} />
          <col style={{width: '10%'}} />
          <col style={{width: '8%'}} />
          <col style={{width: '8%'}} />
          <col style={{width: '9%'}} />
        </colgroup>
        <thead>
          <tr style={{backgroundColor: '#f8f9fa'}}>
            <th style={{width: '12%', minWidth: '100px'}}>{t('table.columns.partNumber')}</th>
            <th style={{width: '25%', minWidth: '200px'}}>{t('table.columns.item')}</th>
            <th style={{width: '12%', minWidth: '100px'}}>{t('table.columns.model')}</th>
            <th style={{width: '30%', minWidth: '250px'}}>{t('table.columns.description')}</th>
            <th style={{width: '10%', minWidth: '80px'}}>{t('table.columns.brandName')}</th>
            <th style={{width: '8%', minWidth: '60px'}}>{t('table.columns.quantity')}</th>
            <th style={{width: '10%', minWidth: '80px'}}>{t('table.columns.unitPrice')}</th>
            <th style={{width: '10%', minWidth: '80px'}}>{t('table.columns.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}}>
              <td style={{textAlign: 'center', fontFamily: 'monospace'}}>{p.code || p.sku || '-'}</td>
              <td style={{fontWeight: '500'}}>
                {getProductName(p)}
              </td>
              <td style={{textAlign: 'center'}}>
                {
                  (() => {
                    console.log('🔧 [PO Page] 处理产品Model字段:', {
                      idx,
                      productCode: p.code,
                      model: p.model,
                      app_model: (p as any).app_model,
                      name: p.name,
                      item_name: (p as any).item_name,
                      '完整产品对象': p
                    });
                    
                    // 优先级：model > app_model > name > item_name > 默认值
                    const modelValue = p.model || (p as any).app_model || p.name || (p as any).item_name || 'N/A';
                    console.log(`🔧 [PO Page] 产品${idx} Model字段最终值:`, modelValue);
                    return modelValue;
                  })()
                }
              </td>
              <td style={{fontSize: '13px', lineHeight: '1.4'}}>
                {
                  // 🔧 修复：优先显示spec字段作为Item description
                  (() => {
                    console.log('🔧 [PO Page] 处理商品规格信息:', {
                      idx,
                      productCode: p.code,
                      productId: p.id,
                      spec: p.spec,
                      specs: p.specs,
                      spec_imperial: p.spec_imperial,
                      properties: p.properties,
                      model: p.model,
                      brand: p.brand,
                      description: (p as any).description,
                      '完整产品对象': p
                    });
                    
                    const descriptions = [];
                    
                    // 🔧 修复：优先使用spec字段，然后是description字段
                    if (p.spec && typeof p.spec === 'string' && p.spec.trim() !== '') {
                      console.log(`🔧 [PO Page] 产品${idx}使用spec字段:`, p.spec);
                      descriptions.push(p.spec);
                    } else if ((p as any).description && typeof (p as any).description === 'string' && (p as any).description.trim() !== '') {
                      console.log(`🔧 [PO Page] 产品${idx}使用description字段:`, (p as any).description);
                      descriptions.push((p as any).description);
                    } else if (p.specs && typeof p.specs === 'string' && p.specs.trim() !== '') {
                      console.log(`🔧 [PO Page] 产品${idx}使用specs字符串:`, p.specs);
                      descriptions.push(p.specs);
                    } else if (p.specs && typeof p.specs === 'object') {
                      const specsText = Object.entries(p.specs)
                        .filter(([k, v]) => v && v !== 'N/A' && v !== 'Not Specified')
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ');
                      if (specsText) {
                        console.log(`🔧 [PO Page] 产品${idx}使用specs对象:`, specsText);
                        descriptions.push(specsText);
                      }
                    }
                    
                    // 从properties中添加关键规格
                    if (p.properties && typeof p.properties === 'object') {
                      const importantSpecs = [];
                      if (p.properties.voltage && p.properties.voltage !== 'N/A') {
                        importantSpecs.push(`${p.properties.voltage}${p.properties.voltage.includes('V') ? '' : 'V'}`);
                      }
                      if (p.properties.frequency && p.properties.frequency !== 'N/A') {
                        importantSpecs.push(`${p.properties.frequency}${p.properties.frequency.includes('Hz') ? '' : 'Hz'}`);
                      }
                      if (importantSpecs.length > 0) {
                        descriptions.push(importantSpecs.join(', '));
                      }
                    }
                    
                    // 🔧 修复：如果仍然没有描述，使用产品名称或型号作为备用
                    if (descriptions.length === 0) {
                      const fallbackDescription = String(p.name || p.model || '产品规格待补充');
                      descriptions.push(fallbackDescription);
                    }
                    
                    const finalDescription = descriptions.length > 0 ? descriptions.join(' | ') : '-';
                    console.log(`🔧 [PO Page] 产品${idx}最终描述:`, finalDescription);
                    
                    return finalDescription;
                  })()
                }
              </td>
              <td style={{textAlign: 'center'}}>
                {
                  (() => {
                    console.log('🔧 [PO Page] 处理产品Brand字段:', {
                      idx,
                      productCode: p.code,
                      brand: p.brand,
                      brand_name: (p as any).brand_name,
                      manufacturer: (p as any).manufacturer,
                      '完整产品对象': p
                    });
                    
                    // 优先级：brand > brand_name > manufacturer > 默认值
                    const brandValue = p.brand || (p as any).brand_name || (p as any).manufacturer || 'Lockedair';
                    console.log(`🔧 [PO Page] 产品${idx} Brand字段最终值:`, brandValue);
                    return brandValue;
                  })()
                }
              </td>
              <td style={{textAlign: 'center', fontWeight: 'bold'}}>{p.quantity}</td>
              <td className="amount-cell" style={{textAlign: 'right', fontFamily: 'monospace'}}>{Number(p.price).toFixed(2)}</td>
              <td className="amount-cell" style={{textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold'}}>{Number(p.price * p.quantity).toFixed(2)}</td>
            </tr>
          ))}
          {/* 合计、备注等行 */}
          <tr style={{backgroundColor: '#e9ecef'}}>
            <td className="remarks-cell" colSpan={6} style={{fontStyle: 'italic', padding: '12px 8px'}}>{t('table.summary.remarks')}{shippingInfo.notes || ''}</td>
            <td className="summary-label" style={{fontWeight: 'bold', textAlign: 'right'}}>{t('table.summary.total')}</td>
            <td className="amount-cell" style={{fontWeight: 'bold', textAlign: 'right', fontFamily: 'monospace'}}>{Number(summary.subtotal).toFixed(2)}</td>
          </tr>
          <tr style={{backgroundColor: '#e9ecef'}}>
            <td colSpan={6}></td>
            <td className="summary-label" style={{fontWeight: 'bold', textAlign: 'right'}}>{t('table.summary.freightCharge')}</td>
            <td className="amount-cell" style={{fontWeight: 'bold', textAlign: 'right', fontFamily: 'monospace'}}>{Number(summary.shipping).toFixed(2)}</td>
          </tr>
          <tr style={{backgroundColor: '#d4edda', border: '2px solid #28a745'}}>
            <td colSpan={6}></td>
            <td className="summary-label" style={{fontWeight: 'bold', textAlign: 'right', fontSize: '16px'}}>{t('table.summary.totalAmount')}</td>
            <td className="amount-cell" style={{fontWeight: 'bold', textAlign: 'right', fontFamily: 'monospace', fontSize: '16px', color: '#28a745'}}>{Number(summary.total).toFixed(2)}</td>
          </tr>
          <tr>
            <td className="remarks-cell" colSpan={8} style={{fontSize: '11px', color: '#6c757d', padding: '8px', textAlign: 'center', fontStyle: 'italic'}}>{t('tips.excelStyling')}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  if (isLoading) {
    return <Loading fullPage={true} />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="po-container">
      {/* 操作按钮 - 只在屏幕显示，打印时隐藏 */}
      <div className="action-buttons no-print" style={{background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '16px 0', margin: '48px 0 24px 0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <button className="btn btn-primary" style={{fontSize: 18, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8}} onClick={exportToExcelSimple}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M17 3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm0 2H3v10h14V5zm-7 2a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H7a1 1 0 1 1 0-2h2V8a1 1 0 0 1 1-1z"/></svg>
            {t('exportExcel', '导出Excel')}
          </button>
          <div style={{width: 1, height: 32, background: '#eee', margin: '0 12px'}}></div>
          <button className="btn btn-primary" style={{fontSize: 18, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8}} onClick={printPO}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v2h12V4a2 2 0 0 0-2-2H6zm10 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-4 10H8v-2h4v2z"/></svg>
            {t('printPO', '打印PO单')}
          </button>
        </div>
      </div>

      {/* PO单内容 - 专门用于打印的容器 */}
      <div id="po-print-content" className="po-print-content">
        <POExcelTable products={products} language={language} shippingInfo={shippingInfo} summary={summary} />
      </div>

      {/* 底部按钮 - 只在屏幕显示，打印时隐藏 */}
      <div className="footer no-print">
        <button className="btn btn-secondary" onClick={handleGoBack}>{t('back')}</button>
        <button className="btn btn-primary" onClick={completePO}>{t('confirmPO', 'Confirm PO')}</button>
      </div>
    </div>
  );
};

export default POPage; 