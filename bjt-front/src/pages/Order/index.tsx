import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Order.css';

// 定义类型
interface OrderItem {
  id: string;
  model: string;
  type: 'machine' | 'accessory' | 'consumable' | 'spare';
  image: string;
  sku: string;
  name: string;
  properties: Record<string, string>;
  detailInfo: {
    title: string;
    sections: Array<{
      title?: string;
      properties: Array<{
        label: string;
        value: string;
      }>;
    }>;
  };
  price: number;
  quantity: number;
}

interface ShippingInfo {
  contactName: string;
  phone: string;
  email: string;
  company: string;
  country: string;
  address: string;
  notes: string;
}

interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    contactName: 'Eric',
    phone: '+86 13057101000',
    email: 'eric@bingjiatech.com',
    company: 'Hangzhou Bingjia Tech. Co., Ltd.',
    country: 'CN',
    address: '1818-2, Wenyixi Road, Hangzhou, Zhejiang Province, China',
    notes: ''
  });
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: 0,
    tax: 0,
    shipping: 200,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 从购物车获取数据
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setIsLoading(true);
        
        // 模拟从API获取购物车数据
        // 实际项目中，这里应调用真实API
        setTimeout(() => {
          const mockItems: OrderItem[] = [
            {
              id: '1',
              model: 'LA-E5P',
              type: 'machine',
              image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ELA-E5P%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
              sku: 'BJT-LA-E5P-2023',
              name: '全自动高速包装机',
              properties: {
                '料号': 'BJT-LA-E5P-2023',
                '产品名称': '全自动高速包装机',
                '托盘尺寸': '120 × 80 × 80 cm',
                '一托数量': '1台'
              },
              detailInfo: {
                title: 'LA-E5P 详细信息',
                sections: [{
                  properties: [
                    { label: '包装尺寸', value: '120 × 80 × 80 cm' },
                    { label: '包装毛重', value: '130 kg' },
                    { label: '打托后总高度', value: '90 cm' }
                  ]
                }]
              },
              price: 7500,
              quantity: 2
            },
            {
              id: '2',
              model: 'EC2007 控制板',
              type: 'accessory',
              image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3EEC2007%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
              sku: 'BJT-EC2007-2023',
              name: '高级控制面板',
              properties: {
                '型号': 'EC2007',
                '料号': 'BJT-EC2007-2023',
                '产品名称': '高级控制面板',
                '电压': '220V/110V',
                '频率': '50Hz/60Hz',
                '托盘尺寸': '80 × 60 × 20 cm',
                '一托数量': '100个'
              },
              detailInfo: {
                title: 'EC2007 控制板详细信息',
                sections: [{
                  properties: [
                    { label: '包装尺寸', value: '20 × 15 × 5 cm' },
                    { label: '包装毛重', value: '0.3 kg' },
                    { label: '打托后总高度', value: '60 cm' }
                  ]
                }]
              },
              price: 2400,
              quantity: 1
            },
            {
              id: '3',
              model: '填充气泡膜-SS',
              type: 'consumable',
              image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ESS%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
              sku: 'BJT-SS-2023',
              name: '填充气泡膜',
              properties: {
                '适配机型': 'ALL',
                '料号': 'BJT-SS-2023',
                '规格': '300mm×200m',
                '材质': 'HDPE'
              },
              detailInfo: {
                title: '填充气泡膜-SS 详细信息',
                sections: [
                  {
                    properties: [
                      { label: '包装材质', value: 'HDPE高密度聚乙烯' }
                    ]
                  },
                  {
                    title: '公制规格',
                    properties: [
                      { label: '厚度', value: '0.05mm' },
                      { label: '克重', value: '45g/m²' },
                      { label: '膜宽', value: '300mm' },
                      { label: '袋长', value: '200m' }
                    ]
                  },
                  {
                    title: '英制规格',
                    properties: [
                      { label: '厚度', value: '2 mil' },
                      { label: '克重', value: '1.3 oz/yd²' },
                      { label: '膜宽', value: '11.8 inch' },
                      { label: '袋长', value: '656 ft' }
                    ]
                  }
                ]
              },
              price: 2800,
              quantity: 1
            }
          ];
          
          setOrderItems(mockItems);
          calculateOrderSummary(mockItems);
          setIsLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error fetching cart items:', error);
        setIsLoading(false);
      }
    };
    
    fetchCartItems();
  }, []);

  // 计算订单摘要
  const calculateOrderSummary = (items: OrderItem[]) => {
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 假设税率为5%
    const shipping = 200; // 固定运费
    const total = subtotal + tax + shipping;
    
    setOrderSummary({
      subtotal,
      tax,
      shipping,
      total
    });
  };

  // 处理提交订单
  const handleSubmitOrder = async () => {
    try {
      // 构建PO订单数据
      const poData = {
        orderItems,
        customerInfo: shippingInfo,
        shippingInfo,
        summary: orderSummary
      };
      
      // 实际项目中，这里应调用真实API提交订单
      alert('正在生成PO订单...');
      
      // 导航到PO页面并传递订单数据
      navigate('/po', { state: { poData } });
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('提交订单时出错，请稍后再试');
    }
  };

  // 处理回到购物车
  const handleBackToCart = () => {
    navigate('/cart');
  };

  // 处理表单字段更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 格式化价格显示
  const formatPrice = (price: number) => {
    return price.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // 获取产品类型标签样式和文本
  const getTypeTagStyle = (type: string) => {
    switch (type) {
      case 'machine': return 'tag-machine';
      case 'accessory': return 'tag-accessory';
      case 'consumable': return 'tag-consumable';
      case 'spare': return 'tag-accessory';
      default: return '';
    }
  };

  const getTypeTagText = (type: string) => {
    switch (type) {
      case 'machine': return '主机';
      case 'accessory': return '配件';
      case 'consumable': return '耗材';
      case 'spare': return '备件';
      default: return '';
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载订单信息...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>确认订单</h1>
      
      {/* 进度指示器 */}
      <div className="progress-indicator">
        <div className="progress-bar"></div>
        <div className="progress-bar-active"></div>
        
        <div className="progress-step">
          <div className="step-circle completed">✓</div>
          <div className="step-title">购物车</div>
        </div>
        
        <div className="progress-step">
          <div className="step-circle active">2</div>
          <div className="step-title active">确认订单</div>
        </div>
        
        <div className="progress-step">
          <div className="step-circle">3</div>
          <div className="step-title">完成</div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="main-content">
        {/* 左侧内容 */}
        <div className="left-column">
          {/* 收货信息 */}
          <div className="shipping-form">
            <h2 className="form-title">收货信息</h2>
            
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label required">联系人</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="请输入联系人姓名" 
                    name="contactName"
                    value={shippingInfo.contactName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label required">电话</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="请输入联系电话" 
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label required">邮箱</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="请输入电子邮箱" 
                name="email"
                value={shippingInfo.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">公司名称</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="请输入公司名称" 
                name="company"
                value={shippingInfo.company}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">国家/地区</label>
              <select 
                className="form-select"
                name="country"
                value={shippingInfo.country}
                onChange={handleInputChange}
              >
                <option value="CN">中国</option>
                <option value="US">美国</option>
                <option value="GB">英国</option>
                <option value="DE">德国</option>
                <option value="JP">日本</option>
                <option value="AU">澳大利亚</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label required">详细地址</label>
              <textarea 
                className="form-textarea" 
                placeholder="请输入详细地址"
                name="address"
                value={shippingInfo.address}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea 
                className="form-textarea" 
                placeholder="可选：添加订单备注"
                name="notes"
                value={shippingInfo.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
          
          {/* 订单明细 */}
          <div className="order-details">
            <h2 className="form-title">订单明细</h2>
            
            {orderItems.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="item-image">
                  <img src={item.image} alt={`${item.model} 图片`} />
                </div>
                <div className="item-details">
                  <div className="item-model">
                    {item.model}
                    <span className={`item-type-tag ${getTypeTagStyle(item.type)}`}>
                      {getTypeTagText(item.type)}
                    </span>
                    <div className="info-tooltip">i
                      <div className="tooltip-content">
                        <div className="tooltip-title">{item.detailInfo.title}</div>
                        {item.detailInfo.sections.map((section, sectionIndex) => (
                          <div className="tooltip-section" key={sectionIndex}>
                            {section.title && (
                              <div className="tooltip-title">{section.title}</div>
                            )}
                            {section.properties.map((prop, propIndex) => (
                              <div className="tooltip-property" key={propIndex}>
                                <span className="tooltip-property-label">{prop.label}:</span>
                                <span>{prop.value}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {Object.entries(item.properties).map(([key, value]) => (
                    <div className="item-property" key={key}>
                      <span className="property-label">{key}:</span>
                      <span className="property-value">{value}</span>
                    </div>
                  ))}
                  
                  <div className="item-price-quantity">
                    <div className="item-quantity-badge">数量: {item.quantity}</div>
                    <div className="item-price-value">¥{formatPrice(item.price * item.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 底部按钮 */}
          <div className="bottom-actions">
            <button className="btn btn-secondary" onClick={handleBackToCart}>返回购物车</button>
            <button className="btn btn-primary" onClick={handleSubmitOrder}>确认提交</button>
          </div>
          
          {/* 提示信息 */}
          <div style={{ marginTop: '20px', color: '#666', fontSize: '13px' }}>
            <p style={{ color: '#e74c3c' }}>* 库存不足商品仅支持PO订单</p>
            <p>* PO订单将以PDF文件形式生成，可用于与销售人员沟通</p>
          </div>
        </div>
        
        {/* 右侧价格摘要 */}
        <div className="order-summary">
          <h2 className="summary-title">价格结算</h2>
          
          <div className="fee-section">
            <div className="fee-item">
              <span>商品总额：</span>
              <span>¥{formatPrice(orderSummary.subtotal)}</span>
            </div>
            <div className="fee-item">
              <span>税费：</span>
              <span>¥{formatPrice(orderSummary.tax)}</span>
            </div>
            <div className="fee-item">
              <span>运费：</span>
              <span>¥{formatPrice(orderSummary.shipping)}</span>
            </div>
            
            <div className="fee-total">
              <span>订单总额：</span>
              <span>¥{formatPrice(orderSummary.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 