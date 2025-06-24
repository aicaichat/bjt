import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { OrderNumberManager } from '../../utils/orderNumberUtils';
import './Order.css';
import orderService from '../../services/orderService';
import { safeToLocaleString } from '../../utils/priceUtils';
import { getSortedCountries, getCountryName } from '../../utils/countries';
import { CartFieldUnifier } from '../../utils/CartFieldUnifier';
import { PRODUCT_TYPE_FIELD_MAP } from '../../config/cartDisplayFields';
import { OrderPageProductDetails } from '../../components/Cart/UnifiedProductDetails';
import '../../components/Cart/UnifiedProductDetails.css';
import { useOrder } from '../../contexts/OrderContext';
import OrderDataConverter from '../../utils/orderDataConverter';
import { UnifiedOrderData } from '../../types/orderTypes';

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
  const { t, i18n } = useTranslation(['order', 'products']);
  const { user, isAuthenticated } = useAuth(); // 使用框架的认证状态
  const { clearCart } = useCart(); // 获取清空购物车函数
  const preferredUnit = user?.preferred_unit || 'metric';
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

  // 🔧 添加国家搜索状态
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // 🔧 定义必选字段
  const requiredFields = ['contactName', 'phone', 'email', 'company', 'country', 'address'];

  // 🔧 获取排序后的国家列表
  const sortedCountries = getSortedCountries(i18n.language);

  // 🔧 过滤国家列表
  const filteredCountries = countrySearchTerm
    ? sortedCountries.filter(country => 
        getCountryName(country.code, i18n.language).toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
      )
    : sortedCountries;

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

  // Format the currency based on current locale
  const formatPrice = (price: number, locale: string = 'zh-CN'): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    } catch (error) {
      // 回退到简单格式化
      return `¥${price.toFixed(2)}`;
    }
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
          console.log('📦 [Order] Loading data from cart navigation:', rawOrderItems.length, 'items');
        } else {
          // Get data from API if not from cart
          console.log('🔍 [Order] Loading data from cart API...');
          const itemsResponse = await orderService.getCartItems();
          if (itemsResponse && itemsResponse.data) {
            rawOrderItems = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
            console.log('📦 [Order] Loaded from cart API:', rawOrderItems.length, 'items');
            
            // 🔧 检查是否为mock数据
            const isMockData = rawOrderItems.some(item => 
              item.id?.startsWith('cart-item-') || 
              item.sku?.includes('BJT-') ||
              item.name === '全自动高速包装机'
            );
            
            if (isMockData) {
              console.warn('⚠️ [Order] Detected mock data - API may not be available or user not authenticated');
              // 在页面上显示提示信息
              if (typeof window !== 'undefined') {
                const notification = document.createElement('div');
                notification.innerHTML = `
                  <div style="position: fixed; top: 20px; right: 20px; background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; max-width: 300px;">
                    <strong>📝 开发提示:</strong><br/>
                    当前显示的是演示数据。<br/>
                    <small>请登录后查看真实订单数据</small>
                  </div>
                `;
                document.body.appendChild(notification);
                setTimeout(() => {
                  document.body.removeChild(notification);
                }, 5000);
              }
            }
          } else {
            console.warn('⚠️ [Order] No data received from cart API');
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
              
              const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
              const headers = {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
              };

              if (item.product_type === 'machine' && item.product_id) {
                try {
                  const response = await fetch(`/wp-json/bjt/v1/machineparts/${item.product_id}`, { headers });
                  if (response.ok) {
                    const data = await response.json();
                    apiResponse = data.success ? data.data : data;
                  }
                } catch (apiError) {
                  console.warn('⚠️ [loadOrderData] Failed to fetch machine data:', apiError);
                }
              } else if (item.product_type === 'accessory' && item.product_id) {
                try {
                  const response = await fetch(`/wp-json/bjt/v1/accessories/${item.product_id}`, { headers });
                  if (response.ok) {
                    const data = await response.json();
                    apiResponse = data.success ? data.data : data;
                  }
                } catch (apiError) {
                  console.warn('⚠️ [loadOrderData] Failed to fetch accessory data:', apiError);
                }
              } else if ((item.product_type === 'spare_part' || item.product_type === 'spare') && item.product_id) {
                try {
                  const response = await fetch(`/wp-json/bjt/v1/spare-parts/${item.product_id}`, { headers });
                  if (response.ok) {
                    const data = await response.json();
                    apiResponse = data.success ? data.data : data;
                  } else {
                    console.log(`🔍 [loadOrderData] Spare part API call failed with status ${response.status}, skipping enhancement`);
                  }
                } catch (apiError) {
                  console.warn('⚠️ [loadOrderData] Failed to fetch spare part data:', apiError);
                }
              } else if (item.product_type === 'consumable' && item.product_id) {
                try {
                  const response = await fetch(`/wp-json/bjt/v1/consumables/${item.product_id}`, { headers });
                  if (response.ok) {
                    const data = await response.json();
                    apiResponse = data.success ? data.data : data;
                  } else {
                    console.log(`🔍 [loadOrderData] Consumable API call failed with status ${response.status}, skipping enhancement`);
                  }
                } catch (apiError) {
                  console.warn('⚠️ [loadOrderData] Failed to fetch consumable data:', apiError);
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
                  product_name: apiResponse.product_name || apiResponse.name || '', // 🔧 配件专用字段
                  image_url: apiResponse.image_url || item.image_url,
                  
                  // 🔧 修复：添加缺失的备件字段映射
                  app_model: apiResponse.app_model || '',
                  app_sn: apiResponse.app_sn || '',
                  is_consumable: apiResponse.is_consumable || '',
                  
                  // 规格信息
                  voltage: apiResponse.voltage || '',
                  frequency: apiResponse.frequency || '',
                  spec: apiResponse.spec || '',
                  spec_imperial: apiResponse.spec_imperial || '',
                  
                  // 🔧 耗材型号字段映射（支持公英制切换）
                  model_metric: apiResponse.model_metric || '',
                  model_imperial: apiResponse.model_imperial || '',
                  
                  // 🔧 修复：添加泡径字段映射（API使用_met/_imp，配置期望_mm/_inch）
                  bubble_diameter_mm: apiResponse.bubble_diameter_met || '',
                  bubble_diameter_inch: apiResponse.bubble_diameter_imp || '',
                  
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

  // 🔧 处理国家选择
  const handleCountrySelect = (countryCode: string) => {
    setShippingInfo(prev => ({
      ...prev,
      country: countryCode
    }));
    setCountrySearchTerm('');
    setShowCountryDropdown(false);
    
    // 清除国家字段的错误
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.country;
      return newErrors;
    });
  };

  // 🔧 处理国家搜索输入
  const handleCountrySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountrySearchTerm(value);
    setShowCountryDropdown(true);
  };

  // 🔧 处理国家输入框失去焦点
  const handleCountryBlur = () => {
    // 延迟隐藏下拉框，以便点击选项
    setTimeout(() => {
      setShowCountryDropdown(false);
    }, 200);
  };

  // 使用订单状态管理
  const { 
    state, 
    submitOrder, 
    setPageTransferData, 
    clearMessages 
  } = useOrder();

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
      clearMessages(); // 清除之前的消息
      
      console.log('🔧 [Order] 开始提交订单...');
      
      // 🔧 构建完整的客户信息对象
      const customerInfo = {
        companyName: shippingInfo.company,
        contactName: shippingInfo.contactName,
        address: shippingInfo.address,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        country: shippingInfo.country || 'CN',
        notes: shippingInfo.notes || ''
      };

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
        
        // 转换为统一的OrderItem格式
        return {
          id: itemData.id || itemData.item_id || Math.random().toString(36).substr(2, 9),
          productId: itemData.product_id || itemData.id,
          code: itemData.part_number || itemData.sku || itemData.code || '',
          sku: itemData.part_number || itemData.sku || '',
          name: productName,
          nameZh: itemData.properties?.name_zh || productName,
          nameEn: itemData.properties?.name_en || productName,
          quantity: parseInt(String(item.quantity)) || 1,
          unitPrice: parseFloat(String(item.unit_price || item.price)) || 0,
          lineTotal: (parseFloat(String(item.unit_price || item.price)) || 0) * (parseInt(String(item.quantity)) || 1),
          currency: 'CNY',
          specs: itemData.specs || itemData.properties || {},
          properties: itemData.properties || {},
          image: itemData.image || itemData.image_url,
          type: (itemData.product_type || itemData.type || 'machine') as any,
          model: itemData.model,
          brand: itemData.brand,
          description: itemData.description,
          category: itemData.category
        };
      });
      
      // 计算订单汇总
      const subtotal = processedOrderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const shipping = 0; // 运费
      const tax = subtotal * 0.13; // 13%税率
      const total = subtotal + shipping + tax;
      
      // 构建与ApiAdapter匹配的订单数据格式
      const orderData = {
        // 🔧 修复：使用shipping字段而不是customerInfo
        shipping: customerInfo,
        items: processedOrderItems,
        summary: {
          subtotal,
          shipping,
          tax,
          discount: 0,
          total,
          currency: 'CNY'
        },
        // 🔧 修复：使用payment对象格式
        payment: {
          method: 'bank_transfer' // 默认银行转账
        },
        // 🔧 修复：使用note字段而不是notes
        note: shippingInfo.notes || ''
      };
      
      console.log('🔧 [Order] 准备提交的订单数据:', orderData);
      
      // 使用订单状态管理提交订单
      const unifiedOrderData = await submitOrder(orderData);
      
      console.log('✅ [Order] 订单提交成功，统一数据:', unifiedOrderData);
      
      // 🛒 订单创建成功后清空购物车
      console.log('🛒 [Order] 订单创建成功，准备清空购物车');
      try {
        await clearCart();
        console.log('🛒 [Order] 购物车已成功清空');
      } catch (clearError) {
        console.error('🛒 [Order] 清空购物车失败:', clearError);
        // 清空购物车失败不应该阻止订单流程，只记录错误
      }
      
      // 创建页面传递数据
      const transferData = OrderDataConverter.createPageTransferData(
        'order',
        unifiedOrderData,
        {
          fromPage: 'order',
          submitTime: new Date().toISOString(),
          customerInfo: orderData.shipping,
          processedItems: processedOrderItems
        }
      );
      
      // 设置页面传递数据
      setPageTransferData(transferData);
      
      console.log('🚀 [Order] 准备跳转到订单列表页面...');
      
      // 跳转到订单列表页面 - 传递新创建的订单信息
      navigate('/orders', {
        state: {
          // 传递新创建的订单信息，用于在OrderList页面显示
          newOrderData: {
            id: unifiedOrderData.id || unifiedOrderData.orderNumber,
            orderNumber: unifiedOrderData.orderNumber,
            date: new Date().toISOString(),
            status: 'pending',
            total: orderData.summary.total,
            paymentMethod: 'TT',
            customerName: shippingInfo.company || shippingInfo.contactName,
            shippingInfo: {
              companyName: shippingInfo.company,
              contactName: shippingInfo.contactName,
              address: shippingInfo.address,
              phone: shippingInfo.phone,
              email: shippingInfo.email
            },
            items: processedOrderItems.map(item => ({
              id: item.id,
              part_number: item.code || item.sku,
              name: item.nameZh || item.name,
              quantity: item.quantity,
              price: item.unitPrice,
              specs: item.specs,
              model: item.model,
              brand: item.brand
            }))
          },
          fromOrder: true, // 标记来自Order页面
          source: 'order',
          timestamp: new Date().toISOString()
        },
        replace: true // 使用replace避免回退到order页面
      });
      
    } catch (error) {
      console.error('❌ [Order] 订单提交失败:', error);
      
      // 提供更详细的错误信息
      let errorMessage = t('order.errors.submitAlert', 'Failed to submit order. Please try again.');
      
      if (error instanceof Error) {
        if (error.message.includes('No authentication token')) {
          errorMessage = t('order.errors.noAuth', 'Please login first to submit order.');
        } else if (error.message.includes('Order submission failed')) {
          errorMessage = t('order.errors.apiError', 'Order submission failed. Please check your network connection and try again.');
        } else {
          errorMessage = `${t('order.errors.submitAlert', 'Failed to submit order')}: ${error.message}`;
        }
      }
      
      alert(errorMessage);
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
      {/* 临时测试组件 - 验证OrderProvider */}
      {/* <OrderProviderTest /> */}
      
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
          <div className="step-title">{t('order.steps.orderList', 'Order List')}</div>
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
              <div className="country-select-container">
                <input 
                  type="text" 
                  className={`form-input ${formErrors.country ? 'form-input-error' : ''}`}
                  placeholder={t('order.shipping.countryPlaceholder', 'Please select country/region')}
                  value={countrySearchTerm || (shippingInfo.country ? getCountryName(shippingInfo.country, i18n.language) : '')}
                  onChange={handleCountrySearchChange}
                  onFocus={() => setShowCountryDropdown(true)}
                  onBlur={handleCountryBlur}
                  autoComplete="off"
                />
                {showCountryDropdown && (
                  <div className="country-dropdown">
                    <div className="country-dropdown-header">
                      <span>{t('order.countries.searchResults', 'Search Results')}</span>
                      <span className="country-count">({filteredCountries.length})</span>
                    </div>
                    <div className="country-list">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map(country => (
                          <div
                            key={country.code}
                            className="country-option"
                            onClick={() => handleCountrySelect(country.code)}
                          >
                            <span className="country-name">{getCountryName(country.code, i18n.language)}</span>
                            <span className="country-code">({country.code})</span>
                          </div>
                        ))
                      ) : (
                        <div className="country-no-results">
                          {t('order.countries.noResults', 'No countries found')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
            
            {Array.isArray(orderItems) && orderItems.length > 0 ? orderItems.map((item, index) => {
              const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
              const productName = CartFieldUnifier.getProductName(item, currentLanguage);

              return (
                <div key={item.id || item.product_id || index} className="order-item-card">
                  <div className="item-main-info">
                    <img 
                      src={item.image_url || fallbackImageSvg} 
                      alt={productName} 
                      className="item-image"
                      onError={handleImageError}
                    />
                    <div className="item-summary">
                      <h3 className="item-name">{productName}</h3>
                      {/* 🚀 使用新的统一产品详情组件 */}
                      <OrderPageProductDetails 
                        item={item} 
                        language={currentLanguage} 
                        preferredUnit={preferredUnit}
                        showEmptyFields={true}
                      />
                    </div>
                  </div>
                  <div className="item-pricing-info">
                    <div className="item-quantity">
                      {t('quantity')}: {item.quantity}
                    </div>
                    <div className="item-price">
                      {t('unitPrice')}: {formatPrice(item.unit_price || item.price)}
                    </div>
                    <div className="item-total">
                      {t('total')}: {formatPrice((item.unit_price || item.price) * item.quantity)}
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

