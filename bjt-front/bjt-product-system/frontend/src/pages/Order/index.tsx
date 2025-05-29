import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Order.css';
import orderService from '../../services/orderService';
import { safeToLocaleString } from '../../utils/priceUtils';

// 定义商品类型
interface OrderItem {
  id: string;
  model?: string;
  type?: string;
  image?: string;
  sku?: string;
  name: string | { [key: string]: string };
  properties?: Record<string, string>;
  detailInfo?: {
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
  unit_price?: number;
  quantity: number;
  shippingInfo?: ShippingInfo;
  specs?: Record<string, string>;
  part_number?: string;
  image_url?: string;
  product_type?: string;
  category?: string;
  item_id?: number;
  product_id?: number;
}

// 定义收货信息类型
interface ShippingInfo {
  contactName: string;
  phone: string;
  email: string;
  company: string;
  country: string;
  address: string;
  notes: string;
}

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    contactName: '',
    phone: '',
    email: '',
    company: '',
    country: 'CN',
    address: '',
    notes: ''
  });
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fromCart, setFromCart] = useState(false);

  // 从服务加载数据
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have data from location state (navigation from cart)
        const locationState = location.state as any;
        if (locationState && locationState.orderItems) {
          setOrderItems(locationState.orderItems);
          setFromCart(locationState.fromCart || false);
        } else {
          // Get data from API if not from cart
          const itemsResponse = await orderService.getCartItems();
          if (itemsResponse && itemsResponse.data) {
            setOrderItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : []);
          } else {
            setOrderItems([]);
          }
        }
        
        // 获取默认收货信息
        const defaultShippingResponse = await orderService.getDefaultShippingInfo();
        const defaultShipping = defaultShippingResponse?.data || {};
        setShippingInfo({
          contactName: defaultShipping.contactName || '',
          phone: defaultShipping.phone || '',
          email: defaultShipping.email || '',
          company: defaultShipping.company || '',
          country: defaultShipping.country || 'CN',
          address: defaultShipping.address || '',
          notes: ''
        });
        
        // 计算订单摘要
        const summaryResponse = await orderService.calculateOrderSummary();
        const summary = summaryResponse?.data || {
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
          total: 0
        };
        setOrderSummary({
          subtotal: summary.subtotal || 0,
          tax: summary.tax || 0,
          shipping: summary.shipping || 0,
          discount: summary.discount || 0,
          total: summary.total || 0
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error(t('order.errors.loadingData', 'Error loading order data'), error);
        setIsLoading(false);
      }
    };
    
    loadOrderData();
  }, [t, location.state]);

  // 处理提交订单
  const handleSubmitOrder = async () => {
    try {
      // 使用 OrderService 提交订单
      const result = await orderService.submitOrder({
        shipping: shippingInfo,
        payment: {
          method: 'transfer' // 默认使用转账支付
        },
        items: orderItems,
        summary: orderSummary,
        note: shippingInfo.notes
      });
      
      // 导航到 PO 页面并传递订单数据
      navigate('/po', { 
        state: { 
          poData: {
            orderId: result.data?.orderId,
            orderItems,
            shippingInfo,
            summary: orderSummary
          } 
        } 
      });
    } catch (error) {
      console.error(t('order.errors.submitFailed', 'Error submitting order'), error);
      alert(t('order.errors.submitAlert', 'Failed to submit order. Please try again.'));
    }
  };

  // 处理回到购物车
  const handleBackToCart = () => {
    // Always pass the current order items back to ensure cart is preserved
    // This handles both cases: coming from cart or direct navigation
    
    // Make sure any complex objects in orderItems are properly stringified
    const serializableItems = orderItems.map(item => ({
      ...item,
      // Handle complex object types that can't be directly rendered
      shippingInfo: typeof item.shippingInfo === 'object' ? 
        JSON.stringify(item.shippingInfo) : item.shippingInfo,
      // Convert any other object properties that might cause rendering issues
      specs: typeof item.specs === 'object' ? 
        JSON.stringify(item.specs) : item.specs
    }));
    
    navigate('/cart', {
      state: { 
        returnedItems: serializableItems
      }
    });
  };

  // 处理表单字段更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format the currency based on current locale
  const formatPrice = (price: number, symbol: string = '¥', locale: string = 'zh-CN'): string => {
    return `${symbol}${safeToLocaleString(price, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 获取商品类型显示文本
  const getTypeText = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'machine':
        return t('products.types.machine', 'Machine');
      case 'accessory':
        return t('products.types.accessory', 'Accessory');
      case 'consumable':
        return t('products.types.consumable', 'Consumable');
      case 'spare':
        return t('products.types.spare', 'Spare Part');
      default:
        return t('products.types.product', 'Product');
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>{t('order.title', 'Confirm Order')}</h1>
      
      {/* 进度指示器 */}
      <div className="progress-indicator">
        <div className="progress-bar"></div>
        <div className="progress-bar-active"></div>
        
        <div className="progress-step">
          <div className="step-circle completed">✓</div>
          <div className="step-title">{t('order.steps.cart', 'Cart')}</div>
        </div>
        
        <div className="progress-step">
          <div className="step-circle active">2</div>
          <div className="step-title active">{t('order.steps.confirmOrder', 'Confirm Order')}</div>
        </div>
        
        <div className="progress-step">
          <div className="step-circle">3</div>
          <div className="step-title">{t('order.steps.complete', 'Complete')}</div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="main-content">
        {/* 左侧内容 */}
        <div className="left-column">
          {/* 收货信息 */}
          <div className="shipping-form">
            <h2 className="form-title">{t('order.shipping.title', 'Shipping Information')}</h2>
            
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label required">{t('order.shipping.contactName', 'Contact Name')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={t('order.shipping.contactNamePlaceholder', 'Please enter contact name')}
                    name="contactName"
                    value={shippingInfo.contactName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label required">{t('order.shipping.phone', 'Phone')}</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder={t('order.shipping.phonePlaceholder', 'Please enter contact phone')}
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.email', 'Email')}</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder={t('order.shipping.emailPlaceholder', 'Please enter email address')}
                name="email"
                value={shippingInfo.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.company', 'Company Name')}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t('order.shipping.companyPlaceholder', 'Please enter company name')}
                name="company"
                value={shippingInfo.company}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.country', 'Country/Region')}</label>
              <select 
                className="form-select"
                name="country"
                value={shippingInfo.country}
                onChange={handleInputChange}
              >
                <option value="CN">{t('countries.china', 'China')}</option>
                <option value="US">{t('countries.usa', 'United States')}</option>
                <option value="GB">{t('countries.uk', 'United Kingdom')}</option>
                <option value="DE">{t('countries.germany', 'Germany')}</option>
                <option value="JP">{t('countries.japan', 'Japan')}</option>
                <option value="AU">{t('countries.australia', 'Australia')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.address', 'Detailed Address')}</label>
              <textarea 
                className="form-textarea" 
                placeholder={t('order.shipping.addressPlaceholder', 'Please enter detailed address')}
                name="address"
                value={shippingInfo.address}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label">{t('order.shipping.notes', 'Notes')}</label>
              <textarea 
                className="form-textarea" 
                placeholder={t('order.shipping.notesPlaceholder', 'Optional: Add order notes')}
                name="notes"
                value={shippingInfo.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
          
          {/* 订单明细 */}
          <div className="order-details">
            <h2 className="form-title">{t('order.details.title', 'Order Details')}</h2>
            
            {Array.isArray(orderItems) && orderItems.length > 0 ? orderItems.map(item => {
              // 从购物车数据中提取商品信息
              const itemData = item as any; // 购物车传递的ExtendedCartItem数据
              
              // 提取图片URL，支持多种字段名
              let imageUrl = itemData.image_url || itemData.image || '';
              if (!imageUrl && itemData.properties?.image_url) {
                imageUrl = itemData.properties.image_url;
              }
              if (!imageUrl) {
                imageUrl = `https://via.placeholder.com/80x80?text=${encodeURIComponent(itemData.model || itemData.part_number || 'Product')}`;
              }
              
              // 提取商品名称，支持多种字段名和多语言
              let productName = '';
              if (typeof item.name === 'object') {
                productName = item.name[i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'] || 
                             item.name['zh-CN'] || item.name['en-US'] || '';
              } else if (typeof item.name === 'string') {
                productName = item.name;
              }
              
              // 如果名称为空，尝试从properties中获取
              if (!productName) {
                if (i18n.language.startsWith('zh')) {
                  productName = itemData.properties?.name_zh || itemData.properties?.productName || itemData.properties?.name || '';
                } else {
                  productName = itemData.properties?.name_en || itemData.properties?.productName || itemData.properties?.name || '';
                }
              }
              
              // 最后的fallback
              if (!productName) {
                productName = itemData.model || itemData.part_number || 'Unknown Product';
              }
              
              // 提取商品类型
              let productType = item.type || itemData.product_type || itemData.category || '';
              
              // 构建显示用的properties
              const displayProperties: Record<string, string> = {};
              
              // 从购物车properties中提取所有显示字段
              if (itemData.properties) {
                const props = itemData.properties;
                
                // 基础字段
                if (props.part_number) displayProperties['料号'] = props.part_number;
                if (props.model) displayProperties['型号'] = props.model;
                if (props.voltage) displayProperties['电压'] = props.voltage;
                if (props.frequency) displayProperties['频率'] = props.frequency;
                if (props.pcs_per_box) displayProperties['单箱数量'] = props.pcs_per_box.toString();
                if (props.pcs_per_pallet) displayProperties['一托数量'] = props.pcs_per_pallet.toString();
                
                // 包装字段
                if (props.package_size_cm) displayProperties['包装尺寸(cm)'] = props.package_size_cm;
                if (props.package_size_inch) displayProperties['包装尺寸(inch)'] = props.package_size_inch;
                if (props.pallet_size_cm) displayProperties['托盘尺寸(cm)'] = props.pallet_size_cm;
                if (props.pallet_size_inch) displayProperties['托盘尺寸(inch)'] = props.pallet_size_inch;
                
                // 重量字段
                if (props.net_weight_kg) displayProperties['净重(kg)'] = props.net_weight_kg.toString();
                if (props.net_weight_lbs) displayProperties['净重(lbs)'] = props.net_weight_lbs.toString();
                if (props.gross_weight_kg) displayProperties['毛重(kg)'] = props.gross_weight_kg.toString();
                if (props.gross_weight_lbs) displayProperties['毛重(lbs)'] = props.gross_weight_lbs.toString();
                
                // 规格字段
                if (props.spec) displayProperties['规格'] = props.spec;
                if (props.spec_imperial) displayProperties['规格(英制)'] = props.spec_imperial;
                if (props.brand) displayProperties['品牌'] = props.brand;
                if (props.unit) displayProperties['单位'] = props.unit;
              }
              
              // 如果没有从properties提取到足够信息，使用默认字段
              if (Object.keys(displayProperties).length === 0) {
                if (itemData.part_number) displayProperties['料号'] = itemData.part_number;
                if (itemData.model) displayProperties['型号'] = itemData.model;
              }

              return (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    <img 
                      src={imageUrl} 
                      alt={productName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/80x80?text=${encodeURIComponent(itemData.model || itemData.part_number || 'Product')}`;
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <div className="item-model">
                      {productName}
                      <span className={`item-type-tag tag-${productType?.toLowerCase() || 'machine'}`}>
                        {getTypeText(productType)}
                      </span>
                      
                      {item.detailInfo && (
                        <div className="info-tooltip">i
                          <div className="tooltip-content">
                            <div className="tooltip-title">{t('products.detailInfo', '{{name}} Detailed Information', { name: item.detailInfo.title })}</div>
                            {item.detailInfo.sections.map((section, idx) => (
                              <div key={idx} className="tooltip-section">
                                {section.title && <div className="tooltip-title">{t(`products.sections.${section.title}`, section.title)}</div>}
                                {section.properties.map((prop, propIdx) => (
                                  <div key={propIdx} className="tooltip-property">
                                    <span className="tooltip-property-label">{t(`products.properties.${prop.label}`, prop.label)}:</span>
                                    <span>{prop.value}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {Object.entries(displayProperties).map(([key, value]) => (
                      <div key={key} className="item-property">
                        <span className="property-label">{t(`products.properties.${key}`, key)}:</span>
                        <span className="property-value">{value}</span>
                      </div>
                    ))}
                    
                    <div className="item-price-quantity">
                      <div className="item-quantity-badge">{t('products.quantity', 'Quantity')}: {item.quantity}</div>
                      <div className="item-price-value">{formatPrice((item.price || item.unit_price || 0) * item.quantity)}</div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="empty-order-items">
                {t('order.noItems', 'No items in your order. Please add some items to your cart first.')}
              </div>
            )}
          </div>
          
          {/* 提示信息 */}
          <div style={{ marginTop: '20px', color: '#666', fontSize: '13px' }}>
            <p style={{ color: '#e74c3c' }}>{t('order.note.inventory', '* Out of stock items are only available for PO orders')}</p>
            <p>{t('order.note.po', '* PO order will be generated as a PDF file, which can be used to communicate with sales representatives')}</p>
          </div>
        </div>
        
        {/* 右侧价格摘要 */}
        <div className="order-summary">
          <h2 className="summary-title">{t('order.summary.title', 'Price Summary')}</h2>
          
          <div className="fee-section">
            <div className="fee-item">
              <span>{t('order.summary.subtotal', 'Subtotal')}:</span>
              <span>{formatPrice(orderSummary.subtotal)}</span>
            </div>
            <div className="fee-item">
              <span>{t('order.summary.tax', 'Tax')}:</span>
              <span>{formatPrice(orderSummary.tax)}</span>
            </div>
            <div className="fee-item">
              <span>{t('order.summary.shipping', 'Shipping')}:</span>
              <span>{formatPrice(orderSummary.shipping)}</span>
            </div>
            {orderSummary.discount > 0 && (
              <div className="fee-item">
                <span>{t('order.summary.discount', 'Discount')}:</span>
                <span>-{formatPrice(orderSummary.discount)}</span>
              </div>
            )}
            
            <div className="fee-total">
              <span>{t('order.summary.total', 'Order Total')}:</span>
              <span>{formatPrice(orderSummary.total)}</span>
            </div>
          </div>
          
          {/* 底部按钮 - 移动到右侧 */}
          <div className="bottom-actions">
            <button className="btn btn-secondary" onClick={handleBackToCart}>
              {t('order.actions.backToCart', 'Back to Cart')}
            </button>
            <button className="btn btn-primary" onClick={handleSubmitOrder}>
              {t('order.actions.confirmSubmit', 'Confirm & Submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 

