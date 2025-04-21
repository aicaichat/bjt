import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 支持的语言
export type Language = 'en' | 'cn';

// 语言上下文接口
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

// 创建语言上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 初始翻译数据
const translations: Record<string, Record<string, string>> = {
  en: {
    // 通用
    'home': 'Home',
    'products': 'Products',
    'support': 'Support',
    'contactUs': 'Contact Us',
    'login': 'Login',
    'logout': 'Logout',
    'profile': 'Profile',
    'myOrders': 'My Orders',
    'loading': 'Loading...',
    'error': 'Error loading data. Please try again later.',
    'introduction': 'Introduction',
    'pleaseLogin': 'Please login to access this content',
    
    // 产品相关
    'addToCart': 'Add to Cart',
    'quantity': 'Quantity',
    'price': 'Price',
    'stock': 'Stock',
    'inStock': 'In Stock',
    'outOfStock': 'Out of Stock',
    'lowStock': 'Low Stock',
    'preOrder': 'Pre-order',
    'specifications': 'Specifications',
    'features': 'Features',
    
    // 购物车
    'cart': 'Cart',
    'viewCart': 'View Cart',
    'checkout': 'Checkout',
    'emptyCart': 'Your cart is empty',
    'clearCart': 'Clear Cart',
    'total': 'Total',
    'continueShopping': 'Continue Shopping',
    'remove': 'Remove',
    'update': 'Update',
    
    // 语言选择
    'language': 'Language',
    'english': 'English',
    'chinese': 'Chinese',
  },
  cn: {
    // 通用
    'home': '首页',
    'products': '产品中心',
    'support': '客户支持',
    'contactUs': '联系我们',
    'login': '登录',
    'logout': '退出登录',
    'profile': '个人资料',
    'myOrders': '我的订单',
    'loading': '加载中...',
    'error': '数据加载失败，请稍后再试。',
    'introduction': '简介',
    'pleaseLogin': '请先登录以访问此内容',
    
    // 产品相关
    'addToCart': '加入购物车',
    'quantity': '数量',
    'price': '价格',
    'stock': '库存',
    'inStock': '现货',
    'outOfStock': '缺货',
    'lowStock': '低库存',
    'preOrder': '预订',
    'specifications': '规格参数',
    'features': '产品特点',
    
    // 购物车
    'cart': '购物车',
    'viewCart': '查看购物车',
    'checkout': '结算',
    'emptyCart': '购物车为空',
    'clearCart': '清空购物车',
    'total': '总计',
    'continueShopping': '继续购物',
    'remove': '移除',
    'update': '更新',
    
    // 语言选择
    'language': '语言',
    'english': '英文',
    'chinese': '中文',
  }
};

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 从本地存储获取初始语言，默认为英文
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage === 'cn' || savedLanguage === 'en') ? savedLanguage : 'en';
  });

  // 当语言变化时保存到本地存储
  useEffect(() => {
    localStorage.setItem('language', language);
    // 更新HTML lang属性
    document.documentElement.lang = language === 'cn' ? 'zh-CN' : 'en';
  }, [language]);

  // 翻译函数
  const t = (key: string, defaultValue?: string): string => {
    const translated = translations[language]?.[key];
    if (translated) return translated;
    if (defaultValue) return defaultValue;
    return key; // 如果找不到翻译，返回原始键
  };

  // 提供上下文值
  const contextValue = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// 使用语言上下文的自定义钩子
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext; 