import React, { useState, useEffect, Fragment, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import './PO.css';
import { ASSETS } from '../../config/appConfig';
import { shouldUseMockData } from '../../services/mockService';
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

// 定义类型
export interface POProduct {
  id: string;
  code?: string;
  sku?: string;
  model?: string;
  name: string | { [key: string]: string };
  specs?: string | Record<string, string>;
  properties?: Record<string, string>;
  unit?: string;
  quantity: number;
  price: number;
  amount?: number;
  image?: string;
  type?: string;
  brand?: string;
}

interface CustomerInfo {
  companyName: string;
  contactName: string;
  address: string;
  phone: string;
  email: string;
}

interface ShippingInfo {
  address: string;
  contactName: string;
  phone: string;
  notes: string;
}

interface POSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
}

// 定义从Order页面接收的数据类型
interface POLocationState {
  poData: {
    orderId?: string;
    orderItems: POProduct[];
    customerInfo: CustomerInfo;
    shippingInfo: ShippingInfo;
    summary: POSummary;
  };
}

// 1. 新增仿Excel模板的表格CSS
const poExcelTableStyle = `
.po-excel-table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 32px;
}
.po-excel-table th, .po-excel-table td {
  border: 1px solid #000;
  padding: 8px;
  font-size: 15px;
}
.po-excel-table th {
  font-weight: bold;
  background: #f2f2f2;
  text-align: center;
}
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
`;

const POPage: React.FC = () => {
  const { t, i18n } = useTranslation('po');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const notification = useNotification();
  
  const [isDirectAccess, setIsDirectAccess] = useState(true);
  
  // 生成一个当前日期和随机ID的PO编号
  const generatePONumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO-${year}${month}${day}-${random}`;
  };
  
  // 获取当前日期的格式化字符串
  const getFormattedDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [poNumber, setPONumber] = useState<string>(generatePONumber());
  const [poDate, setPODate] = useState<string>(getFormattedDate());
  const [paymentMethod, setPaymentMethod] = useState<string>(language === 'cn' ? '银行转账' : 'Bank Transfer');
  const [products, setProducts] = useState<POProduct[]>([]);
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
  const [summary, setSummary] = useState<POSummary>({
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
    // 检查是否有从Order页面传递的数据
    const state = location.state as POLocationState | null;
    
    if (state && state.poData) {
      // 如果有数据，使用传递的数据并更新状态
      setIsDirectAccess(false);
      
      // Ensure data is valid
      if (state.poData.orderItems && Array.isArray(state.poData.orderItems)) {
        setProducts(state.poData.orderItems);
        // Calculate total pages
        setTotalPages(Math.ceil(state.poData.orderItems.length / 10));
      }
      
      if (state.poData.customerInfo) {
        setCustomerInfo(state.poData.customerInfo);
      }
      
      if (state.poData.shippingInfo) {
        setShippingInfo(state.poData.shippingInfo);
      }
      
      if (state.poData.summary) {
        setSummary(state.poData.summary);
      }
      
      setIsLoading(false);
      setDataReady(true);
    } else {
      // 如果没有数据，设置直接访问标志
      setIsDirectAccess(true);
      setIsLoading(true);
      
      // 简单的直接访问检测
      const timer = setTimeout(() => {
        if (isDirectAccess) {
          // 如果是直接访问，重定向到订单页面
          navigate(ROUTES.ORDER || '/order');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, isDirectAccess]);

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

  // 导出Excel（前端用模板填充）
  const exportToExcel = async () => {
    try {
      // 1. 加载模板
      const response = await fetch('/template/PO单模版 V1.0.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // 2. 获取第一个sheet（假设为PO信息页）
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];

      // 3. 填充右侧信息（Purchase Order Number、Date、Payment Method）
      ws['D1'] = { t: 's', v: `${t('header.purchaseOrderNumber')}${poNumber}` };
      ws['D2'] = { t: 's', v: `${t('header.date')}${poDate}` };
      ws['D3'] = { t: 's', v: `${t('header.paymentMethod')}${paymentMethod}` };

      // 4. 填充Buyer信息
      ws['A5'] = { t: 's', v: t('fields.companyName') };
      ws['B5'] = { t: 's', v: customerInfo.companyName };
      ws['A6'] = { t: 's', v: t('fields.address') };
      ws['B6'] = { t: 's', v: customerInfo.address };

      // 5. 填充Vendor信息
      ws['A8'] = { t: 's', v: vendorAddress.companyName };
      ws['A9'] = { t: 's', v: vendorAddress.address };
      ws['A10'] = { t: 's', v: vendorAddress.city };

      // 6. 填充Ship to信息
      ws['D5'] = { t: 's', v: t('fields.contactName') };
      ws['D6'] = { t: 's', v: shippingInfo.contactName };
      ws['D7'] = { t: 's', v: t('fields.phone') };
      ws['D8'] = { t: 's', v: shippingInfo.phone };
      ws['D9'] = { t: 's', v: t('fields.address') };
      ws['D10'] = { t: 's', v: shippingInfo.address };
      ws['D11'] = { t: 's', v: t('fields.notes') };
      ws['D12'] = { t: 's', v: shippingInfo.notes };

      // 7. 填充商品明细（假设明细从第15行开始，A15:H15）
      let startRow = 15;
      products.forEach((item, idx) => {
        const row = startRow + idx;
        ws[`A${row}`] = { t: 's', v: item.code || item.sku || '-' };
        // 🔧 优先使用处理后的name字段
        ws[`B${row}`] = { t: 's', v: 
          item.name && typeof item.name === 'string' ? item.name :
          typeof item.name === 'object' ? (item.name['zh-CN'] || item.name['en-US'] || '-') : 
          item.model || item.code || item.sku || '-'
        };
        ws[`C${row}`] = { t: 's', v: item.model || '-' };
        // 🔧 按照PO单模版格式，简化Item description
        ws[`D${row}`] = { t: 's', v: (() => {
          const descriptions = [];
          
          // 添加规格信息
          if (item.specs && typeof item.specs === 'string') {
            descriptions.push(item.specs);
          } else if (item.specs && typeof item.specs === 'object') {
            const specsText = Object.entries(item.specs)
              .filter(([k, v]) => v && v !== 'N/A' && v !== 'Not Specified')
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
            if (specsText) descriptions.push(specsText);
          }
          
          // 从properties中添加关键规格
          if (item.properties) {
            const importantSpecs = [];
            if (item.properties.voltage && item.properties.voltage !== 'N/A') {
              importantSpecs.push(`${item.properties.voltage}${item.properties.voltage.includes('V') ? '' : 'V'}`);
            }
            if (item.properties.frequency && item.properties.frequency !== 'N/A') {
              importantSpecs.push(`${item.properties.frequency}${item.properties.frequency.includes('Hz') ? '' : 'Hz'}`);
            }
            if (importantSpecs.length > 0) {
              descriptions.push(importantSpecs.join(', '));
            }
          }
          
          return descriptions.length > 0 ? descriptions.join(' | ') : '-';
        })() };
        ws[`E${row}`] = { t: 's', v: item.brand || '-' };
        ws[`F${row}`] = { t: 'n', v: item.quantity };
        ws[`G${row}`] = { t: 'n', v: item.price };
        ws[`H${row}`] = { t: 'n', v: item.price * item.quantity };
      });

      // 8. 填充合计信息
      const summaryStartRow = startRow + products.length + 2;
      ws[`G${summaryStartRow}`] = { t: 's', v: t('table.summary.total') };
      ws[`H${summaryStartRow}`] = { t: 'n', v: summary.subtotal };
      ws[`G${summaryStartRow + 1}`] = { t: 's', v: t('table.summary.freightCharge') };
      ws[`H${summaryStartRow + 1}`] = { t: 'n', v: summary.shipping };
      ws[`G${summaryStartRow + 2}`] = { t: 's', v: t('table.summary.totalAmount') };
      ws[`H${summaryStartRow + 2}`] = { t: 'n', v: summary.total };

      // 9. 导出
      XLSX.writeFile(workbook, `PO-${poNumber}.xlsx`);
    } catch (error) {
      console.error('导出Excel时出错:', error);
      notification.error(t('exportError'));
    }
  };

  // 打印PO单
  const printPO = () => {
    window.print();
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  // 完成PO单
  const completePO = async () => {
    try {
      // 创建订单对象
      const orderItems = products.map(product => ({
        order_item_id: Date.now() + Math.floor(Math.random() * 1000),
        product_type: 'machine' as const,
        product_id: parseInt(product.id),
        part_number: product.code || product.sku || '',
        name: typeof product.name === 'object' ? 
              product.name[language === 'cn' ? 'zh-CN' : 'en-US'] : 
              product.name,
        quantity: product.quantity,
        unit_price: product.price,
        line_total: product.price * product.quantity,
        properties: product.properties || {}
      }));

      const newOrder: CreateOrderRequest = {
        shipping_address: {
          name: shippingInfo.contactName,
          phone: shippingInfo.phone,
          address: shippingInfo.address
        },
        billing_address: {
          name: customerInfo.contactName,
          phone: customerInfo.phone,
          address: customerInfo.address
        },
        payment_method: paymentMethod,
        notes: shippingInfo.notes
      };

      setIsLoading(true);
      
      if (shouldUseMockData()) {
        // 使用本地存储模拟API
        // 从本地存储获取现有订单列表，如果没有则创建新的
        const existingOrdersJson = localStorage.getItem('orders');
        const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
        
        // 将新订单添加到列表中
        const updatedOrders = [newOrder, ...existingOrders];
        
        // 保存回本地存储
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        notification.success(t('orderCompleted'));
      } else {
        // 实际API调用
        const response = await orderService.createOrder(newOrder);
        
        if (response) {
          notification.success(t('orderCompleted'));
        } else {
          notification.error(t('processingError'));
        }
      }
      
      // 导航到订单列表页面，添加参数表示来自PO完成
      navigate(ROUTES.ORDERS || '/orders', { 
        state: { fromPO: true, poNumber: poNumber } 
      });
    } catch (error) {
      console.error('完成订单时出错:', error);
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

  // 获取产品名称
  const getProductName = (product: POProduct) => {
    // 🔧 优先使用处理后的name字段
    if (product.name && typeof product.name === 'string') {
      return product.name;
    }
    
    // 如果name是对象，按语言选择
    if (typeof product.name === 'object') {
      return product.name[language === 'cn' ? 'zh-CN' : 'en-US'] || product.name['en-US'] || '-';
    }
    
    // 最后的回退
    return product.model || product.code || product.sku || 'Unknown Product';
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
  const POExcelTable: React.FC<{products: POProduct[], language: string, shippingInfo: ShippingInfo, summary: POSummary}> = ({products, language, shippingInfo, summary}) => (
    <>
      <style>{poExcelTableStyle}</style>
      {/* 第一页：PO元信息 - 按模板布局 */}
      <table className="po-excel-table" style={{marginBottom: '32px', tableLayout: 'fixed'}}>
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
            <td style={{border: "1px solid #000", width: '25%'}}>
              <span style={{fontWeight: "bold"}}>{t('header.purchaseOrderNumber')}</span>
              <span style={{color: '#ff0000', fontSize: '14px'}}>{poNumber}</span>
            </td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}>
              <span style={{fontWeight: "bold"}}>{t('header.date')}</span>
              <span style={{color: '#ff0000', fontSize: '14px'}}>{poDate}</span>
            </td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}>
              <span style={{fontWeight: "bold"}}>{t('header.paymentMethod')}</span>
              <span style={{color: '#ff0000', fontSize: '14px'}}>{paymentMethod}</span>
            </td>
          </tr>
          
          {/* Buyer区域 */}
          <tr>
            <td style={{border: "1px solid #000", fontWeight: "bold", background: '#f0f0f0'}}>{t('sections.buyer')}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontWeight: "bold", background: '#f0f0f0'}}>{t('sections.shipTo')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{t('fields.companyName')}</td>
            <td style={{border: "1px solid #000", height: '30px'}}>{customerInfo.companyName}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{t('fields.contactName')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{t('fields.address')}</td>
            <td style={{border: "1px solid #000", height: '30px'}}>{customerInfo.address}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}>{shippingInfo.contactName}</td>
          </tr>
          
          {/* Vendor区域 */}
          <tr>
            <td style={{border: "1px solid #000", fontWeight: "bold", background: '#f0f0f0'}}>{t('sections.vendor')}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{t('fields.phone')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{vendorAddress.companyName}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}>{shippingInfo.phone}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}>{vendorAddress.address}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{t('fields.address')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}>{vendorAddress.city}</td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}>{shippingInfo.address}</td>
          </tr>
          
          {/* Ship to详细信息 */}
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", fontWeight: "bold"}}>{t('fields.notes')}</td>
          </tr>
          <tr>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000"}}></td>
            <td style={{border: "1px solid #000", color: '#d00'}}>{shippingInfo.notes}</td>
          </tr>
        </tbody>
      </table>

      {/* 第二页：产品表格 */}
      <table className="po-excel-table">
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
                {
                  // 🔧 优先使用处理后的name字段，这应该已经包含正确的产品名称
                  p.name && typeof p.name === 'string' ? p.name :
                  // 如果name是对象，按语言选择
                  typeof p.name === 'object' ? 
                    (p.name[language === 'cn' ? 'zh-CN' : 'en-US'] || p.name['en-US'] || '-') : 
                  // 最后的回退
                  p.model || p.code || p.sku || '-'
                }
              </td>
              <td style={{textAlign: 'center'}}>{p.model || '-'}</td>
              <td style={{fontSize: '13px', lineHeight: '1.4'}}>
                {
                  // 🔧 按照PO单模版格式，简化Item description显示
                  (() => {
                    const descriptions = [];
                    
                    // 添加规格信息
                    if (p.specs && typeof p.specs === 'string') {
                      descriptions.push(p.specs);
                    } else if (p.specs && typeof p.specs === 'object') {
                      const specsText = Object.entries(p.specs)
                        .filter(([k, v]) => v && v !== 'N/A' && v !== 'Not Specified')
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ');
                      if (specsText) descriptions.push(specsText);
                    }
                    
                    // 从properties中添加关键规格
                    if (p.properties) {
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
                    
                    return descriptions.length > 0 ? descriptions.join(' | ') : '-';
                  })()
                }
              </td>
              <td style={{textAlign: 'center'}}>{p.brand || '-'}</td>
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
      {/* 操作按钮 */}
      <div className="action-buttons" style={{background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '16px 0', margin: '48px 0 24px 0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16}}>
        <button className="btn btn-primary" style={{fontSize: 18, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8}} onClick={exportToExcel}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M17 3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm0 2H3v10h14V5zm-7 2a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H7a1 1 0 1 1 0-2h2V8a1 1 0 0 1 1-1z"/></svg>
          {t('exportExcel', '导出Excel')}
        </button>
        <div style={{width: 1, height: 32, background: '#eee', margin: '0 12px'}}></div>
        <button className="btn btn-primary" style={{fontSize: 18, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8}} onClick={printPO}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v2h12V4a2 2 0 0 0-2-2H6zm10 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-4 10H8v-2h4v2z"/></svg>
          {t('printPO', '打印PO单')}
        </button>
      </div>

      {/* 两页Excel样式表格 */}
      <POExcelTable products={products} language={language} shippingInfo={shippingInfo} summary={summary} />

      {/* 底部按钮 */}
      <div className="footer">
        <button className="btn btn-secondary" onClick={handleGoBack}>{t('back')}</button>
        <button className="btn btn-primary" onClick={completePO}>{t('complete')}</button>
      </div>
    </div>
  );
};

export default POPage; 