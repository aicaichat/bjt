import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './OrderList.css';

// 模拟订单数据
const mockOrder = {
  id: 'BJT20231015001',
  orderNumber: 'BJT20231015001',
  date: '2023-10-15 14:30:25',
  status: 'shipped',
  total: 234670,
  paymentMethod: '银行转账',
  shippingInfo: {
    name: '张三',
    address: '北京市朝阳区xxx街道xxx号',
    phone: '13800138000'
  },
  items: [
    {
      id: '1',
      part_number: '60A01143',
      name: 'LA-E4S V2.0主机-标准版',
      price: 100000,
      quantity: 2,
      specs: {
        '功率': '1000W',
        '尺寸': '400x300x200mm',
        '重量': '15kg'
      }
    },
    {
      id: '2',
      part_number: '60A01144',
      name: 'LP-V1 包装机',
      price: 34670,
      quantity: 1,
      specs: {
        '功率': '500W',
        '尺寸': '300x250x150mm',
        '重量': '8kg'
      }
    }
  ]
};

const OrderDetailDemo: React.FC = () => {
  const { t } = useTranslation(['orderList', 'common']);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // 切换订单展开状态
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(price);
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待支付',
      'paid': '已支付',
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 格式化收货信息
  const formatShippingInfo = (info: any): string => {
    if (!info) return '';
    if (typeof info === 'string') return info;
    if (typeof info === 'object') {
      const parts = [];
      if (info.name) parts.push(info.name);
      if (info.address) parts.push(info.address);
      if (info.phone) parts.push(info.phone);
      return parts.join(' | ');
    }
    return String(info);
  };

  // 渲染订单卡片
  const renderOrderCard = (order: any) => {
    const isExpanded = expandedOrders[order.id] || false;
    
    return (
      <div className={`order-card ${isExpanded ? 'expanded' : ''}`} key={order.id}>
        <div className="order-header">
          <div className="order-id">{t('orderCard.orderNumber')}{order.orderNumber}</div>
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
          {/* 查看详情按钮 */}
          <button 
            className="action-button expand-button" 
            onClick={() => toggleOrderExpansion(order.id)}
          >
            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
            {isExpanded ? t('actions.hideDetails', '收起详情') : t('actions.viewDetails', '查看详情')}
          </button>
          <button className="action-button secondary-button">
            {t('actions.backToPO', '返回PO页面')}
          </button>
        </div>
        {/* 订单商品列表 - 展开时显示 */}
        <div className="order-items">
          {order.items.length > 0 ? (
            <>
              <div className="order-items-header">
                <h4>{t('orderCard.orderItems', '订购商品')} ({order.items.length}件)</h4>
              </div>
              {order.items.map((item: any) => (
                <div key={item.id} className="enhanced-item-wrapper">
                  <div className="product-card">
                    <div className="product-card-content">
                      <div className="product-card-title">{item.name}</div>
                      <div className="product-card-subtitle">型号: {item.part_number}</div>
                      <div className="product-card-specs">
                        {Object.entries(item.specs || {}).map(([key, value]) => (
                          <span key={key}>{key}: {value} </span>
                        ))}
                      </div>
                      <div className="product-card-price">
                        数量: {item.quantity} | 单价: {formatPrice(item.price)} | 小计: {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="no-items-message">
              {t('orderCard.noItems', '暂无商品信息')}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="order-list-container">
      <h1 className="page-title">订单详情展开功能演示</h1>
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
        点击"查看详情"按钮展开订单商品列表，再次点击"收起详情"按钮收起列表
      </p>
      
      <div className="order-list">
        {renderOrderCard(mockOrder)}
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>功能说明：</h3>
        <ul>
          <li>✅ 点击"查看详情"按钮可以展开订单商品列表</li>
          <li>✅ 展开后显示订单中的所有商品信息</li>
          <li>✅ 每个商品显示名称、型号、规格、数量、价格等信息</li>
          <li>✅ 支持收起功能，点击"收起详情"按钮可以隐藏商品列表</li>
          <li>✅ 展开/收起有平滑的动画效果</li>
          <li>✅ 支持国际化，中英文切换</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderDetailDemo; 