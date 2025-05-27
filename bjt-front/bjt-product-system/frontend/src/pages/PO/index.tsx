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
import { Form, Input, Button, Spin, Space, Drawer, Table, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { safeToLocaleString } from '../../utils/priceUtils';
import logo from '../../assets/logo.svg';
import orderService, { Order, OrderStatus, CreateOrderRequest } from '../../api/services/order.service';
import { Loading, Error } from '../../components/common';

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

  // 导出Excel
  const exportToExcel = async () => {
    try {
      setIsLoading(true);
      notification.info(t('exportingExcel'));
      
      if (shouldUseMockData()) {
        // 模拟导出延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        notification.success(t('exportSuccess'));
      } else {
        // 实际API调用
        try {
          // 使用orderService的exportPO方法
          const response = await orderService.exportPO(Number(poNumber), 'excel');
          
          if (response) {
            // 创建Blob对象并下载
            const blob = new Blob([response], { 
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `PO-${poNumber}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url); // 释放URL对象
            
            notification.success(t('exportSuccess'));
          } else {
            notification.error(t('exportError'));
          }
        } catch (apiError) {
          console.error('API调用失败:', apiError);
          notification.error(t('exportError'));
        }
      }
    } catch (error) {
      console.error('Excel导出错误:', error);
      notification.error(t('exportError'));
    } finally {
      setIsLoading(false);
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
    if (typeof product.name === 'object') {
      return product.name[language === 'cn' ? 'zh-CN' : 'en-US'] || product.name['en-US'] || '-';
    }
    return product.name || '-';
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

  if (isLoading) {
    return <Loading fullPage={true} />;
  }

  if (error) {
    return <Error message={error} />;
  }

  // 修改PO单表格部分，完全按照图片精确实现
  const renderPODocument = () => {
    return (
      <div className="po-container" ref={poRef}>
        <table className="po-document">
          <colgroup>
            <col style={{width: "15%"}} />
            <col style={{width: "40%"}} />
            <col style={{width: "25%"}} />
            <col style={{width: "20%"}} />
          </colgroup>
          <tbody>
            {/* 顶部标题行 */}
            <tr>
              <td colSpan={2} style={{border: "1px solid #000", padding: "10px"}}>
                <img src={logo} alt="BJT Logo" style={{maxWidth: "150px"}} />
              </td>
              <td colSpan={2} style={{border: "1px solid #000", textAlign: "center", padding: "10px"}}>
                <div style={{fontSize: "24px", fontWeight: "bold"}}>PURCHASE ORDER</div>
              </td>
            </tr>
            
            {/* Buyer行 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px", fontWeight: "bold"}}>Buyer</td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {customerInfo.companyName}
              </td>
              <td style={{border: "1px solid #000", padding: "10px", textAlign: "right", fontWeight: "bold"}}>
                Purchase Order Number:
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {poNumber}
              </td>
            </tr>
            
            {/* 公司名字行 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px"}}>公司名字</td>
              <td style={{border: "1px solid #000", padding: "10px", height: "30px"}}>
                {customerInfo.companyName}
              </td>
              <td style={{border: "1px solid #000", padding: "10px", textAlign: "right", fontWeight: "bold"}}>
                Date:
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {poDate}
              </td>
            </tr>
            
            {/* 地址行 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px"}}>地址</td>
              <td style={{border: "1px solid #000", padding: "10px", height: "60px"}}>
                {customerInfo.address}
              </td>
              <td style={{border: "1px solid #000", padding: "10px", textAlign: "right", fontWeight: "bold"}}>
                Payment Method:
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {paymentMethod}
              </td>
            </tr>
            
            {/* Vendor行 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px", fontWeight: "bold"}}>Vendor</td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {vendorAddress.companyName}
              </td>
              <td style={{border: "1px solid #000", padding: "10px", fontWeight: "bold"}}>
                Ship to 
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {shippingInfo.address}
              </td>
            </tr>
            
            {/* BJT Pack行 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px"}}>BJT Pack, Inc.</td>
              <td style={{border: "1px solid #000", padding: "10px"}}></td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                公司名字
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {customerInfo.companyName}
              </td>
            </tr>
            
            {/* 地址行1 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px"}}>{vendorAddress.address}</td>
              <td style={{border: "1px solid #000", padding: "10px"}}></td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                地址
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {shippingInfo.address}
              </td>
            </tr>
            
            {/* 地址行2 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px"}}>{vendorAddress.city}</td>
              <td style={{border: "1px solid #000", padding: "10px"}}></td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                联系人/电话
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {shippingInfo.contactName} / {shippingInfo.phone}
              </td>
            </tr>
            
            {/* 备注行 */}
            <tr>
              <td style={{border: "1px solid #000", padding: "10px"}}></td>
              <td style={{border: "1px solid #000", padding: "10px"}}></td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                备注
              </td>
              <td style={{border: "1px solid #000", padding: "10px"}}>
                {shippingInfo.notes}
              </td>
            </tr>
            
            {/* 页码水印 */}
            <tr>
              <td colSpan={4} style={{border: "1px solid #000", textAlign: "center", height: "45px", position: "relative"}}>
                <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: "0.3", fontSize: "22px"}}>
                  {t('page')} {currentPage} {t('pageOf')} {totalPages} {t('pages')}
                </div>
              </td>
            </tr>
            
            {/* 重置表格列数为8列，用于产品表头 */}
          </tbody>
        </table>
        
        {/* 产品表格部分 - 8列 */}
        <table className="po-document product-table">
          <colgroup>
            <col style={{width: "12%"}} />
            <col style={{width: "12%"}} />
            <col style={{width: "12%"}} />
            <col style={{width: "28%"}} />
            <col style={{width: "9%"}} />
            <col style={{width: "9%"}} />
            <col style={{width: "9%"}} />
            <col style={{width: "9%"}} />
          </colgroup>
          <tbody>
            {/* 产品表头 - 8列表格 */}
            <tr>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Part No. #
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Item
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Model
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Item description
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Brand Name
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Quantity
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Unit Price
              </th>
              <th style={{border: "1px solid #000", padding: "6px", backgroundColor: "#f2f2f2", textAlign: "center"}}>
                Amount
              </th>
            </tr>
            
            {/* 产品行 */}
            {getCurrentPageProducts().map((product, index) => (
              <tr key={`product-${index}`}>
                <td style={{textAlign: "center", padding: "8px", border: "1px solid #000"}}>
                  {product.code || product.sku || '-'}
                </td>
                <td style={{padding: "8px", border: "1px solid #000"}}>
                  {getProductName(product)}
                </td>
                <td style={{padding: "8px", border: "1px solid #000"}}>
                  {product.model || '-'}
                </td>
                <td style={{padding: "8px", border: "1px solid #000"}}>
                  {typeof product.specs === 'string' 
                    ? product.specs 
                    : product.specs 
                      ? objectToString(product.specs)
                      : '-'
                  }
                </td>
                <td style={{padding: "8px", border: "1px solid #000"}}>
                  {product.brand || '-'}
                </td>
                <td style={{textAlign: "center", padding: "8px", border: "1px solid #000"}}>
                  {product.quantity}
                </td>
                <td style={{textAlign: "center", padding: "8px", border: "1px solid #000"}}>
                  {formatCurrency(product.price)}
                </td>
                <td style={{textAlign: "right", padding: "8px", border: "1px solid #000"}}>
                  {formatCurrency(product.price * product.quantity)}
                </td>
              </tr>
            ))}
            
            {/* 空行填充 */}
            {Array.from({length: Math.max(0, 10 - getCurrentPageProducts().length)}).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{border: "1px solid #000", height: "30px"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
                <td style={{border: "1px solid #000"}}>&nbsp;</td>
              </tr>
            ))}
            
            {/* 备注与总计行 */}
            <tr>
              <td style={{fontWeight: "bold", padding: "8px", border: "1px solid #000", textAlign: "left"}}>
                Remarks:
              </td>
              <td colSpan={5} style={{padding: "8px", border: "1px solid #000"}}>{shippingInfo.notes}</td>
              <td style={{textAlign: "right", padding: "8px", border: "1px solid #000", backgroundColor: "#f2f2f2", whiteSpace: "nowrap"}}>
                Total
              </td>
              <td style={{textAlign: "right", padding: "8px", border: "1px solid #000", backgroundColor: "#f2f2f2"}}>
                {formatCurrency(summary.subtotal)}
              </td>
            </tr>
            
            {/* 运费行 */}
            <tr>
              <td colSpan={6} style={{border: "1px solid #000"}}></td>
              <td style={{textAlign: "right", padding: "8px", border: "1px solid #000", whiteSpace: "nowrap"}}>
                Freight charge
              </td>
              <td style={{textAlign: "right", padding: "8px", border: "1px solid #000"}}>
                {formatCurrency(summary.shipping)}
              </td>
            </tr>
            
            {/* 总金额行 */}
            <tr>
              <td colSpan={6} style={{border: "1px solid #000"}}></td>
              <td style={{textAlign: "right", fontWeight: "bold", padding: "8px", border: "1px solid #000", backgroundColor: "#f2f2f2", whiteSpace: "nowrap"}}>
                Total amount
              </td>
              <td style={{textAlign: "right", fontWeight: "bold", padding: "8px", border: "1px solid #000", backgroundColor: "#f2f2f2"}}>
                {formatCurrency(summary.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="po-container">
      {/* 水印效果 */}
      <div className="po-watermark">PO-ORDER</div>
      
      {/* 操作按钮 - 包含导出Excel、打印PDF和语言切换 */}
      <div className="action-buttons">
        <div className="action-left">
          <button className="btn btn-primary" onClick={exportToExcel}>
            <i className="fas fa-file-excel"></i> {t('exportExcel')}
          </button>
          <button className="btn btn-primary" onClick={printPO}>
            <i className="fas fa-print"></i> {t('printPO')}
          </button>
        </div>
      
      </div>
      
      {/* 采购单表格 */}
      {renderPODocument()}
      
      {/* 分页控制 - 仅在打印之外显示 */}
      {totalPages > 1 && (
        <div className="po-pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="po-page-btn"
          >
            {t('prevPage')}
          </button>
          <span className="po-page-info">
            {`${t('page')} ${currentPage} ${t('pageOf')} ${totalPages} ${t('pages')}`}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="po-page-btn"
          >
            {t('nextPage')}
          </button>
        </div>
      )}
      
      {/* 底部按钮 */}
      <div className="footer">
        <button className="btn btn-secondary" onClick={handleGoBack}>{t('back')}</button>
        <button className="btn btn-primary" onClick={completePO}>{t('complete')}</button>
      </div>
    </div>
  );
};

export default POPage; 