import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// 支持的语言
export type Language = 'en' | 'cn';

// 获取i18next格式的语言代码
export function getI18nLanguage(lang: Language): string {
  return lang === 'cn' ? 'zh' : 'en';
}

// 语言上下文接口
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
  getI18nLanguage: (lang: Language) => string;
}

// 创建语言上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 初始翻译数据 - 用于不在i18n中的简单UI元素和导航项
const translations: Record<string, Record<string, string>> = {
  en: {
    // 通用
    'home': 'Home',
    'nav.home': 'Home',
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
    'nav.home': '首页',
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
  const { i18n } = useTranslation();
  
  // 从i18next语言映射到我们的语言格式
  const mapI18nextLanguage = (lang: string): Language => {
    return lang.startsWith('zh') ? 'cn' : 'en';
  };
  
  // 从我们的语言格式映射到i18next格式
  const mapToI18nextLanguage = (lang: Language): string => {
    return lang === 'cn' ? 'zh' : 'en';
  };
  
  // 初始语言基于i18next的当前语言
  const [language, setLanguageState] = useState<Language>(mapI18nextLanguage(i18n.language));

  // 使用useEffect监听i18next语言变化
  useEffect(() => {
    const newLang = mapI18nextLanguage(i18n.language);
    if (newLang !== language) {
      setLanguageState(newLang);
    }
  }, [i18n.language]);

  // 设置语言的函数同时更新i18next和本地状态
  const setLanguage = (lang: Language) => {
    const i18nextLang = mapToI18nextLanguage(lang);
    
    // 更新i18next语言
    i18n.changeLanguage(i18nextLang);
    
    // 更新本地存储
    localStorage.setItem('language', lang);
    
    // 更新HTML lang属性
    document.documentElement.lang = lang === 'cn' ? 'zh-CN' : 'en';
    
    // 更新本地状态
    setLanguageState(lang);
  };

  // 翻译函数，优先使用i18next，找不到再用本地存储
  const t = (key: string, defaultValue?: string): string => {
    // 特殊处理导航项键
    if (key === 'home' || key === 'nav.home' || key === 'products' || key === 'support' || key === 'contactUs') {
      // 这些键是顶级导航项，应该使用本地翻译
      const localTranslation = translations[language]?.[key];
      if (localTranslation) return localTranslation;
    }
    
    // 检查键是否包含点号，如果是，则直接使用i18next
    if (key.includes('.') && key !== 'nav.home') {
      try {
        const i18nextTranslation = i18n.t(key);
        if (typeof i18nextTranslation === 'string') {
          return i18nextTranslation;
        }
      } catch (error) {
        console.warn(`Error translating ${key}:`, error);
      }
    } else {
      // 对于非点号键，先尝试使用i18next
      try {
        const i18nextTranslation = i18n.t(key, { defaultValue: null });
        // 确保返回的是字符串而不是嵌套对象
        if (typeof i18nextTranslation === 'string' && i18nextTranslation !== key) {
          return i18nextTranslation;
        }
      } catch (error) {
        console.warn(`Error translating ${key}:`, error);
      }
    }
    
    // 回退到本地翻译
    const localTranslation = translations[language]?.[key];
    if (localTranslation) return localTranslation;
    
    // 如果提供了默认值，则使用默认值
    if (defaultValue) return defaultValue;
    
    // 如果找不到翻译，返回原始键
    return key;
  };

  // 提供上下文值
  const contextValue = {
    language,
    setLanguage,
    t,
    getI18nLanguage
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