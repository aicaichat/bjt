import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
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

// 使用内联SVG作为fallback图片，避免无限循环 - 修复base64编码错误
const fallbackImageSvg = 'data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="80" height="80" fill="%23F3F4F6"/%3E%3Cpath d="M24 40H56V48H24V40Z" fill="%239CA3AF"/%3E%3Cpath d="M32 32H48V34H32V32Z" fill="%239CA3AF"/%3E%3C/svg%3E';

// 安全的图片错误处理函数
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  // 防止无限循环：如果已经是fallback图片，就不再替换
  if (target.src.startsWith('data:')) {
    console.warn('Fallback image failed to load');
    return;
  }
  target.src = fallbackImageSvg;
};

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(['order']);
  const { user, isAuthenticated } = useAuth(); // 使用框架的认证状态
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    contactName: '',
    phone: '',
    email: '',
    company: '',
    country: '',
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
  
  // 🔧 添加表单验证状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔧 定义必选字段
  const requiredFields = ['contactName', 'phone', 'email', 'company', 'country', 'address'];

  // 🔧 验证单个字段
  const validateField = (name: string, value: string): string => {
    if (requiredFields.includes(name)) {
      if (!value || value.trim() === '') {
        return t(`order.validation.${name}Required`, `${name} is required`);
      }
    }
    
    // 特殊验证规则
    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t('order.validation.emailInvalid', 'Please enter a valid email address');
        }
        break;
      case 'phone':
        if (value && !/^[\d\s\-\+\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
          return t('order.validation.phoneInvalid', 'Please enter a valid phone number');
        }
        break;
    }
    
    return '';
  };

  // 🔧 验证所有必选字段
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    requiredFields.forEach(field => {
      const value = shippingInfo[field as keyof ShippingInfo];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });
    
    setFormErrors(errors);
    return isValid;
  };

  // 🔧 检查是否所有必选字段都已填写
  const isFormValid = (): boolean => {
    // 检查所有必选字段是否都有值
    const allFieldsFilled = requiredFields.every(field => {
      const value = shippingInfo[field as keyof ShippingInfo];
      return value && value.trim() !== '';
    });
    
    // 检查是否有任何非空的错误信息
    const hasErrors = Object.values(formErrors).some(error => error && error.trim() !== '');
    
    // 🔧 添加调试信息
    console.log('🔍 [isFormValid] Checking form validity:', {
      allFieldsFilled,
      hasErrors,
      shippingInfo,
      formErrors,
      requiredFields
    });
    
    return allFieldsFilled && !hasErrors;
  };

  // 安全的数据提取函数 - 移到组件内部以访问i18n
  const safeExtractString = (value: any, fallback: string = ''): string => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      // 尝试多语言字段
      const langKey = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US';
      return value[langKey] || value['zh-CN'] || value['en-US'] || Object.values(value)[0] || fallback;
    }
    return fallback;
  };

  // 从服务加载数据
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have data from location state (navigation from cart)
        const locationState = location.state as any;
        let rawOrderItems: any[] = [];
        
        if (locationState && locationState.orderItems) {
          rawOrderItems = locationState.orderItems;
          setFromCart(locationState.fromCart || false);
        } else {
          // Get data from API if not from cart
          const itemsResponse = await orderService.getCartItems();
          if (itemsResponse && itemsResponse.data) {
            rawOrderItems = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
          }
        }
        
        // 🔧 增强数据处理：如果购物车数据不完整，通过part_number获取完整信息
        const enhancedOrderItems = await Promise.all(
          rawOrderItems.map(async (item) => {
            try {
              // 检查数据是否完整
              const hasCompleteData = item.name && item.name !== 'Invalid Type' && 
                                      item.image_url && !item.image_url.includes('placeholder') &&
                                      item.properties && Object.keys(item.properties).length > 0;
              
              if (hasCompleteData) {
                return item; // 数据完整，直接返回
              }
              
              console.log('🔍 [loadOrderData] Incomplete data detected for item:', item.part_number, 'fetching from API...');
              
              // 根据product_type决定API endpoint
              let apiResponse = null;
              
              // 🔧 只有在用户已认证时才尝试API调用，避免无效的API请求
              if (!isAuthenticated || !user) {
                console.log('🔍 [loadOrderData] User not authenticated, skipping API enhancement');
                // 用户未认证时，确保基本显示信息完整
                return {
                  ...item,
                  name: item.part_number || 'Unknown Product',
                  properties: {
                    ...(item.properties || {}),
                    part_number: item.part_number,
                    model: item.part_number
                  }
                };
              }
              
              if (item.product_type === 'machine' && item.product_id) {
                try {
                  // 🔧 修复：使用正确的API端点和认证token
                  const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
                  const response = await fetch(`/wp-json/bjt/v1/machineparts/${item.product_id}`, {
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                      apiResponse = data.data;
                    } else if (data.id) {
                      // 有些接口直接返回数据而不包装在success/data中
                      apiResponse = data;
                    }
                  } else {
                    console.log(`🔍 [loadOrderData] Machine API call failed with status ${response.status}, skipping enhancement`);
                  }
                } catch (apiError) {
                  console.warn('⚠️ [loadOrderData] Failed to fetch machine data:', apiError);
                }
              } else if (item.product_type === 'accessory' && item.product_id) {
                try {
                  // 🔧 修复：配件API端点保持不变，继续使用ID查询
                  const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
                  const response = await fetch(`/wp-json/bjt/v1/accessories/${item.product_id}`, {
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                      apiResponse = data.data;
                    } else if (data.id) {
                      // 有些接口直接返回数据而不包装在success/data中
                      apiResponse = data;
                    }
                  } else {
                    console.log(`🔍 [loadOrderData] Accessory API call failed with status ${response.status}, skipping enhancement`);
                  }
                } catch (apiError) {
                  console.warn('⚠️ [loadOrderData] Failed to fetch accessory data:', apiError);
                }
              }
              
              // 如果成功获取到API数据，合并到原item中
              if (apiResponse) {
                console.log('✅ [loadOrderData] Successfully fetched complete data for:', item.part_number);
                
                // 构建完整的properties对象
                const enhancedProperties = {
                  // 保留原有properties
                  ...(item.properties || {}),
                  
                  // 基础信息
                  part_number: apiResponse.part_number || item.part_number,
                  model: apiResponse.model || apiResponse.app_model || '',
                  
                  // 🔧 改善名称映射：主机和配件的名称字段可能不同
                  name_zh: apiResponse.name_zh || apiResponse.name || '',
                  name_en: apiResponse.name_en || apiResponse.name || '',
                  image_url: apiResponse.image_url || item.image_url,
                  
                  // 规格信息
                  voltage: apiResponse.voltage || '',
                  frequency: apiResponse.frequency || '',
                  spec: apiResponse.spec || '',
                  spec_imperial: apiResponse.spec_imperial || '',
                  
                  // 包装信息
                  package_size_cm: apiResponse.package_size_cm || '',
                  package_size_inch: apiResponse.package_size_inch || '',
                  pallet_size_cm: apiResponse.pallet_size_cm || '',
                  pallet_size_inch: apiResponse.pallet_size_inch || '',
                  net_weight_kg: apiResponse.net_weight_kg || '',
                  net_weight_lbs: apiResponse.net_weight_lbs || '',
                  gross_weight_kg: apiResponse.gross_weight_kg || '',
                  gross_weight_lbs: apiResponse.gross_weight_lbs || '',
                  pcs_per_box: apiResponse.pcs_per_box || '',
                  pcs_per_pallet: apiResponse.pcs_per_pallet || '',
                  
                  // 其他信息
                  brand: apiResponse.brand || '',
                  unit: apiResponse.unit || 'pcs',
                  status: apiResponse.status || 'publish'
                };
                
                // 🔧 改善名称提取逻辑：不要在这里固定名称，保留多语言数据
                // 让显示逻辑根据当前语言动态选择名称
                
                return {
                  ...item,
                  // 保留原始name字段用于后续处理，如果没有则保留原有值
                  name: item.name,
                  image_url: apiResponse.image_url || item.image_url,
                  properties: enhancedProperties
                };
              }
              
              // 如果API调用失败，至少确保基本显示信息
              return {
                ...item,
                name: item.part_number || 'Unknown Product',
                properties: {
                  ...(item.properties || {}),
                  part_number: item.part_number,
                  model: item.part_number
                }
              };
              
            } catch (error) {
              console.error('❌ [loadOrderData] Error processing item:', item.part_number, error);
              return item; // 发生错误时返回原item
            }
          })
        );
        
        setOrderItems(enhancedOrderItems);
        
        // 获取默认收货信息
        const defaultShippingResponse = await orderService.getDefaultShippingInfo();
        const defaultShipping = defaultShippingResponse?.data || {};
        setShippingInfo({
          contactName: defaultShipping.contactName || '',
          phone: defaultShipping.phone || '',
          email: defaultShipping.email || '',
          company: defaultShipping.company || '',
          country: defaultShipping.country || '',
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

  // 处理表单字段更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 🔧 实时验证字段
    const error = validateField(name, value);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        // 如果没有错误，移除该字段的错误信息
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  // 🔧 处理字段失去焦点
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        // 如果没有错误，移除该字段的错误信息
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  // 处理提交订单
  const handleSubmitOrder = async () => {
    // 🔧 提交前验证表单
    if (!validateForm()) {
      // 滚动到第一个错误字段
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus();
        }
      }
      return;
    }

    if (isSubmitting) return; // 避免重复提交
    
    try {
      setIsSubmitting(true);
      
              // 🔧 处理订单项目数据，确保产品名称正确
        const processedOrderItems = orderItems.map(item => {
          const itemData = item as any;
          
          // 📝 安全提取商品名称 - 支持多语言和多字段回退
          let productName = '';
          
          // 🔧 优先从properties提取多语言名称，根据当前语言选择
          if (itemData.properties) {
            const currentLang = i18n.language;
            if (currentLang.startsWith('zh')) {
              productName = itemData.properties.name_zh || '';
            } else if (currentLang.startsWith('ja')) {
              productName = itemData.properties.name_ja || '';
            } else {
              productName = itemData.properties.name_en || '';
            }
            
            // 如果当前语言的名称为空，则按优先级回退
            if (!productName) {
              productName = itemData.properties.name_zh || itemData.properties.name_en || itemData.properties.productName || '';
            }
          }
          
          // 如果多语言名称为空，尝试从item.name字段提取
          if (!productName) {
            productName = safeExtractString(item.name);
          }
          
          // 最终回退到基础字段
          if (!productName) {
            productName = itemData.model || itemData.part_number || itemData.sku || 'Unknown Product';
          }
          
          // 返回处理后的商品项目，确保name字段包含正确的产品名称
          return {
            ...item,
            name: productName, // 🔧 使用处理后的产品名称
            // 保留原始的多语言名称数据供PO页面使用
            displayName: {
              'zh-CN': itemData.properties?.name_zh || productName,
              'en-US': itemData.properties?.name_en || productName,
              'ja-JP': itemData.properties?.name_ja || productName
            },
            // 确保code/sku字段用于料号显示
            code: itemData.part_number || itemData.sku || itemData.code,
            sku: itemData.part_number || itemData.sku
          };
        });

        // 🔧 构建完整的客户信息对象
        const customerInfo = {
          companyName: shippingInfo.company || '',
          contactName: shippingInfo.contactName || '',
          address: shippingInfo.address || '',
          phone: shippingInfo.phone || '',
          email: shippingInfo.email || '',
          country: shippingInfo.country || ''
        };

        // 使用 OrderService 提交订单
        const result = await orderService.submitOrder({
          shipping: shippingInfo,
          payment: {
            method: 'transfer' // 默认使用转账支付
          },
          items: processedOrderItems, // 🔧 使用处理后的订单项目
          summary: orderSummary,
          note: shippingInfo.notes
        });
        
        // 导航到 PO 页面并传递订单数据
        navigate('/po', { 
          state: { 
            poData: {
              orderId: result.data?.orderId,
              orderItems: processedOrderItems, // 🔧 传递处理后的订单项目
              customerInfo, // 🔧 使用构建的完整客户信息
              shippingInfo,
              summary: orderSummary
            } 
          } 
        });
    } catch (error) {
      console.error(t('order.errors.submitFailed', 'Error submitting order'), error);
      alert(t('order.errors.submitAlert', 'Failed to submit order. Please try again.'));
    } finally {
      setIsSubmitting(false);
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

  // Format the currency based on current locale
  const formatPrice = (price: number, symbol: string = '¥', locale: string = 'zh-CN'): string => {
    return `${symbol}${safeToLocaleString(price, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 获取商品类型显示文本
  const getTypeText = (type?: string) => {
    console.log('🔍 [getTypeText] Processing type:', type);
    
    switch (type?.toLowerCase()) {
      case 'machine':
        return t('products.types.machine', 'Machine');
      case 'accessory':
        return t('products.types.accessory', 'Accessory');
      case 'consumable':
        return t('products.types.consumable', 'Consumable');
      case 'spare':
      case 'spare_part':
        return t('products.types.spare_part', 'Spare Part');
      default:
        console.warn('⚠️ [getTypeText] Unknown product type:', type);
        // 不返回"Invalid Type"，而是返回产品类型或默认值
        return type || t('products.types.product', 'Product');
    }
  };

  // 属性key到i18n key映射
  const propertyKeyMap: Record<string, string> = {
    'part_number': 'partNumber',
    'model': 'model',
    'voltage': 'voltage',
    'frequency': 'frequency',
    'spec': 'spec',
    'spec_imperial': 'specImperial',
    'pcs_per_box': 'pcsPerBox',
    'pcs_per_pallet': 'pcsPerPallet',
    'package_size_cm': 'packageSize',
    'package_size_inch': 'packageSize',
    'pallet_size_cm': 'palletSize',
    'pallet_size_inch': 'palletSize',
    'net_weight_kg': 'netWeight',
    'net_weight_lbs': 'netWeight',
    'gross_weight_kg': 'grossWeight',
    'gross_weight_lbs': 'grossWeight',
    'brand': 'brand',
    'unit': 'unit'
  };
  const getLabel = (key: string) => t(`products.properties.${propertyKeyMap[key] || key}`, key);
  const getValue = (value: any) => value && value !== 'N/A' && value !== 'Not Specified' ? value : t('products.defaultValues.notAvailable');

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('order.common.loading', 'Loading...')}</p>
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
                    className={`form-input ${formErrors.contactName ? 'form-input-error' : ''}`}
                    placeholder={t('order.shipping.contactNamePlaceholder', 'Please enter contact name')}
                    name="contactName"
                    value={shippingInfo.contactName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                  />
                  {formErrors.contactName && (
                    <div className="form-error">{formErrors.contactName}</div>
                  )}
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label required">{t('order.shipping.phone', 'Phone')}</label>
                  <input 
                    type="tel" 
                    className={`form-input ${formErrors.phone ? 'form-input-error' : ''}`}
                    placeholder={t('order.shipping.phonePlaceholder', 'Please enter contact phone')}
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                  />
                  {formErrors.phone && (
                    <div className="form-error">{formErrors.phone}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.email', 'Email')}</label>
              <input 
                type="email" 
                className={`form-input ${formErrors.email ? 'form-input-error' : ''}`}
                placeholder={t('order.shipping.emailPlaceholder', 'Please enter email address')}
                name="email"
                value={shippingInfo.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
              {formErrors.email && (
                <div className="form-error">{formErrors.email}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.company', 'Company Name')}</label>
              <input 
                type="text" 
                className={`form-input ${formErrors.company ? 'form-input-error' : ''}`}
                placeholder={t('order.shipping.companyPlaceholder', 'Please enter company name')}
                name="company"
                value={shippingInfo.company}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
              {formErrors.company && (
                <div className="form-error">{formErrors.company}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.country', 'Country/Region')}</label>
              <select 
                className={`form-select ${formErrors.country ? 'form-input-error' : ''}`}
                name="country"
                value={shippingInfo.country}
                onChange={handleInputChange}
                onBlur={handleBlur}
              >
                <option value="">{t('order.shipping.countryPlaceholder', 'Please select country/region')}</option>
                <option value="CN">{t('order.countries.china', 'China')}</option>
                <option value="US">{t('order.countries.usa', 'United States')}</option>
                <option value="GB">{t('order.countries.uk', 'United Kingdom')}</option>
                <option value="DE">{t('order.countries.germany', 'Germany')}</option>
                <option value="JP">{t('order.countries.japan', 'Japan')}</option>
                <option value="AU">{t('order.countries.australia', 'Australia')}</option>
              </select>
              {formErrors.country && (
                <div className="form-error">{formErrors.country}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label required">{t('order.shipping.address', 'Detailed Address')}</label>
              <textarea 
                className={`form-textarea ${formErrors.address ? 'form-input-error' : ''}`}
                placeholder={t('order.shipping.addressPlaceholder', 'Please enter detailed address')}
                name="address"
                value={shippingInfo.address}
                onChange={handleInputChange}
                onBlur={handleBlur}
              ></textarea>
              {formErrors.address && (
                <div className="form-error">{formErrors.address}</div>
              )}
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
              // 🔧 使用改进的数据提取逻辑
              const itemData = item as any;
              
              // 🖼️ 安全提取图片URL - 优先级：image_url -> properties.image_url -> 默认fallback
              let imageUrl = '';
              if (itemData.image_url && typeof itemData.image_url === 'string' && itemData.image_url.trim()) {
                imageUrl = itemData.image_url.trim();
              } else if (itemData.properties?.image_url && typeof itemData.properties.image_url === 'string' && itemData.properties.image_url.trim()) {
                imageUrl = itemData.properties.image_url.trim();
              } else if (itemData.image && typeof itemData.image === 'string' && itemData.image.trim()) {
                imageUrl = itemData.image.trim();
              } else {
                // 直接使用fallback SVG，避免网络请求
                imageUrl = fallbackImageSvg;
              }
              
              // 📝 安全提取商品名称 - 支持多语言和多字段回退
              let productName = '';
              
              // 🔧 优先从properties提取多语言名称，根据当前语言选择
              if (itemData.properties) {
                const currentLang = i18n.language;
                if (currentLang.startsWith('zh')) {
                  productName = itemData.properties.name_zh || '';
                } else if (currentLang.startsWith('ja')) {
                  productName = itemData.properties.name_ja || '';
                } else {
                  productName = itemData.properties.name_en || '';
                }
                
                // 如果当前语言的名称为空，则按优先级回退
                if (!productName) {
                  productName = itemData.properties.name_zh || itemData.properties.name_en || itemData.properties.productName || '';
                }
              }
              
              // 如果多语言名称为空，尝试从item.name字段提取
              if (!productName) {
                productName = safeExtractString(item.name);
              }
              
              // 最终回退到基础字段
              if (!productName) {
                productName = itemData.model || itemData.part_number || itemData.sku || 'Unknown Product';
              }
              
              // 🏷️ 提取商品类型
              const productType = itemData.type || itemData.product_type || itemData.category || 'machine';
              
              // 📊 构建显示属性 - 改进的属性提取逻辑
              const displayProperties: Record<string, string> = {};
              
              if (itemData.properties) {
                const props = itemData.properties;
                
                // 基础信息（最重要的字段优先显示）
                if (props.part_number) displayProperties['part_number'] = props.part_number;
                if (props.model) displayProperties['model'] = props.model;
                if (props.voltage && props.voltage !== 'N/A') displayProperties['voltage'] = props.voltage + (props.voltage.includes('V') ? '' : 'V');
                if (props.frequency && props.frequency !== 'N/A') displayProperties['frequency'] = props.frequency + (props.frequency.includes('Hz') ? '' : 'Hz');
                
                // 规格信息
                if (props.spec && props.spec !== 'N/A') displayProperties['spec'] = props.spec;
                if (props.spec_imperial && props.spec_imperial !== 'N/A') displayProperties['spec_imperial'] = props.spec_imperial;
                
                // 包装信息（按重要性排序）
                if (props.pcs_per_box && props.pcs_per_box !== '0') displayProperties['pcs_per_box'] = props.pcs_per_box + ' pcs';
                if (props.pcs_per_pallet && props.pcs_per_pallet !== '0') displayProperties['pcs_per_pallet'] = props.pcs_per_pallet + ' pcs';
                
                // 尺寸信息（优先显示用户区域的单位）
                const useImperial = ['NA', 'US'].includes(itemData.userRegion || '');
                if (useImperial) {
                  if (props.package_size_inch) displayProperties['package_size_inch'] = props.package_size_inch;
                  if (props.pallet_size_inch) displayProperties['pallet_size_inch'] = props.pallet_size_inch;
                } else {
                  if (props.package_size_cm) displayProperties['package_size_cm'] = props.package_size_cm;
                  if (props.pallet_size_cm) displayProperties['pallet_size_cm'] = props.pallet_size_cm;
                }
                
                // 重量信息（优先显示用户区域的单位）
                if (useImperial) {
                  if (props.net_weight_lbs && props.net_weight_lbs !== '0') displayProperties['net_weight_lbs'] = props.net_weight_lbs + ' lbs';
                  if (props.gross_weight_lbs && props.gross_weight_lbs !== '0') displayProperties['gross_weight_lbs'] = props.gross_weight_lbs + ' lbs';
                } else {
                  if (props.net_weight_kg && props.net_weight_kg !== '0') displayProperties['net_weight_kg'] = props.net_weight_kg + ' kg';
                  if (props.gross_weight_kg && props.gross_weight_kg !== '0') displayProperties['gross_weight_kg'] = props.gross_weight_kg + ' kg';
                }
                
                // 其他信息
                if (props.brand && props.brand !== 'N/A') displayProperties['brand'] = props.brand;
                if (props.unit && props.unit !== 'N/A') displayProperties['unit'] = props.unit;
              }
              
              // 🔄 如果properties为空，从item直接字段提取
              if (Object.keys(displayProperties).length === 0) {
                if (itemData.part_number) displayProperties['part_number'] = itemData.part_number;
                if (itemData.model) displayProperties['model'] = itemData.model;
                if (itemData.sku) displayProperties['sku'] = itemData.sku;
              }

              return (
                <div key={item.id || itemData.part_number || Math.random()} className="order-item">
                  <div className="item-image">
                    <img 
                      src={imageUrl} 
                      alt={productName}
                      onError={handleImageError}
                      loading="lazy"
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
                        <span className="property-label">{getLabel(key)}:</span>
                        <span className="property-value">{getValue(value)}</span>
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
            <button 
              className={`btn btn-primary ${!isFormValid() || isSubmitting ? 'btn-disabled' : ''}`}
              onClick={handleSubmitOrder}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting 
                ? t('order.actions.submitting', 'Submitting...')
                : t('order.actions.confirmSubmit', 'Confirm & Submit')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 

