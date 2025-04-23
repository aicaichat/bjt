import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PO.css';

// 定义类型
interface POProduct {
  id: string;
  code: string;
  name: string;
  specs: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
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
  total: number;
}

// 定义从Order页面接收的数据类型
interface POLocationState {
  poData: {
    orderItems: any[];
    customerInfo: any;
    shippingInfo: any;
    summary: any;
  };
}

const POPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDirectAccess, setIsDirectAccess] = useState(true);
  const [poNumber, setPONumber] = useState('PO-202504-0123');
  const [poDate, setPODate] = useState('2025-04-04');
  const [products, setProducts] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    companyName: '',
    contactName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    contactName: '',
    phone: '',
    notes: ''
  });
  const [summary, setSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否有从Order页面传递的数据
    const state = location.state as POLocationState | null;
    
    if (state && state.poData) {
      // 如果有数据，使用传递的数据并更新状态
      setIsDirectAccess(false);
      setProducts(state.poData.orderItems);
      setCustomerInfo(state.poData.customerInfo);
      setShippingInfo(state.poData.shippingInfo);
      setSummary(state.poData.summary);
      setIsLoading(false);
    } else {
      // 如果没有数据，设置直接访问标志
      setIsDirectAccess(true);
      // 简单的直接访问检测
      const timer = setTimeout(() => {
        if (isDirectAccess) {
          // 如果是直接访问，重定向到订单页面
          navigate('/order');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, isDirectAccess]);

  // 导出Excel
  const exportToExcel = () => {
    alert('正在导出Excel文件...');
    // 实际应用中这里会调用导出Excel的API
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
  const completePO = () => {
    try {
      // 创建订单对象
      const orderItems = products.map(product => ({
        id: product.id,
        image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3E' + product.name.substring(0, 2) + '%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        name: product.name,
        specs: product.specs || (product.properties ? Object.entries(product.properties).map(([key, value]) => `${key}: ${value}`).join(', ') : ''),
        price: product.price,
        quantity: product.quantity
      }));

      const newOrder = {
        id: `BJT${new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'pending',
        total: summary.total,
        paymentMethod: '银行转账',
        shippingInfo: `${customerInfo.contactName} | ${customerInfo.address} | ${customerInfo.phone}`,
        items: orderItems
      };

      // 从本地存储获取现有订单列表，如果没有则创建新的
      const existingOrdersJson = localStorage.getItem('orders');
      const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
      
      // 将新订单添加到列表中
      const updatedOrders = [newOrder, ...existingOrders];
      
      // 保存回本地存储
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      alert('采购订单已完成！');
      
      // 导航到订单列表页面，添加参数表示来自PO完成
      navigate('/orders?fromPO=true');
    } catch (error) {
      console.error('完成订单时出错:', error);
      alert('处理订单时遇到问题，请重试');
    }
  };

  // 格式化价格显示
  const formatPrice = (price: number) => {
    return price.toLocaleString('zh-CN');
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="po-loading-container">
        <div className="po-spinner"></div>
        <p>正在生成采购订单...</p>
      </div>
    );
  }

  return (
    <div className="po-container">
      {/* 操作按钮 */}
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={exportToExcel}>导出Excel</button>
        <button className="btn btn-primary" onClick={printPO}>打印PO单</button>
      </div>
      
      {/* 头部区域 */}
      <div className="header">
        <div className="logo-title">
          <img src="/api/placeholder/150/50" alt="BJT Logo" className="logo" />
          <div className="title">采购订单</div>
        </div>
        <div className="po-info">
          <div className="po-number">PO编号: {poNumber}</div>
          <div className="po-date">日期: {poDate}</div>
        </div>
      </div>
      
      {/* 客户信息 */}
      <div className="customer-info">
        <div className="info-box">
          <h3>购买方信息</h3>
          <p><strong>公司名称:</strong> {customerInfo.companyName}</p>
          <p><strong>联系人:</strong> {customerInfo.contactName}</p>
          <p><strong>地址:</strong> {customerInfo.address}</p>
          <p><strong>电话:</strong> {customerInfo.phone}</p>
          <p><strong>邮箱:</strong> {customerInfo.email}</p>
        </div>
        <div className="info-box">
          <h3>收货信息</h3>
          <p><strong>收货地址:</strong> {shippingInfo.address}</p>
          <p><strong>联系人:</strong> {shippingInfo.contactName}</p>
          <p><strong>电话:</strong> {shippingInfo.phone}</p>
          <p><strong>备注:</strong> {shippingInfo.notes}</p>
        </div>
      </div>
      
      {/* 产品表格 */}
      <table className="product-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>序号</th>
            <th style={{ width: '15%' }}>商品编码</th>
            <th style={{ width: '25%' }}>商品名称</th>
            <th style={{ width: '20%' }}>规格</th>
            <th style={{ width: '5%' }}>单位</th>
            <th style={{ width: '10%' }}>数量</th>
            <th style={{ width: '10%' }}>单价</th>
            <th style={{ width: '10%' }}>金额</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product.id}>
              <td>{index + 1}</td>
              <td>{product.code || product.sku || product.model}</td>
              <td>{product.name}</td>
              <td>{product.specs || (product.properties ? Object.entries(product.properties).map(([key, value]) => `${key}: ${value}`).join(', ') : '')}</td>
              <td>{product.unit || '件'}</td>
              <td>{product.quantity}</td>
              <td>¥{formatPrice(product.price)}</td>
              <td>¥{formatPrice(product.price * product.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 摘要部分 */}
      <div className="summary">
        <table className="summary-table">
          <tbody>
            <tr>
              <td className="label">商品总额:</td>
              <td className="value">¥{formatPrice(summary.subtotal)}</td>
            </tr>
            <tr>
              <td className="label">运费:</td>
              <td className="value">¥{formatPrice(summary.shipping)}</td>
            </tr>
            <tr>
              <td className="label">税费:</td>
              <td className="value">¥{formatPrice(summary.tax)}</td>
            </tr>
            <tr>
              <td className="label final-total">总计金额:</td>
              <td className="value final-total">¥{formatPrice(summary.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 底部 */}
      <div className="footer">
        <button className="btn btn-secondary" onClick={handleGoBack}>返回</button>
        <button className="btn btn-primary" onClick={completePO}>完成</button>
      </div>
    </div>
  );
};

export default POPage; 