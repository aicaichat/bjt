import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import adminI18n from '../index';

interface AdminI18nContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  isReady: boolean;
}

const AdminI18nContext = createContext<AdminI18nContextType | null>(null);

interface AdminI18nProviderProps {
  children: React.ReactNode;
}

const AdminI18nProvider: React.FC<AdminI18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 确保i18n实例已准备好
    const initI18n = async () => {
      try {
        // 获取保存的语言设置
        const savedLang = localStorage.getItem('admin_i18nextLng') || 'en';
        
        // 确保i18n已初始化
        if (!adminI18n.isInitialized) {
          await adminI18n.init();
        }
        
        // 设置语言
        await adminI18n.changeLanguage(savedLang);
        setLanguage(savedLang);
        setIsReady(true);
        
        console.log('Admin i18n initialized with language:', savedLang);
      } catch (error) {
        console.error('Failed to initialize admin i18n:', error);
        setLanguage('en');
        setIsReady(true);
      }
    };

    initI18n();
  }, []);

  const changeLanguage = async (lang: string) => {
    try {
      await adminI18n.changeLanguage(lang);
      localStorage.setItem('admin_i18nextLng', lang);
      setLanguage(lang);
      
      // 发送语言切换事件
      window.dispatchEvent(new CustomEvent('admin-language-changed', { 
        detail: { language: lang } 
      }));
      
      console.log('Admin language changed to:', lang);
    } catch (error) {
      console.error('Failed to change admin language:', error);
    }
  };

  // 在i18n未准备好时显示加载状态
  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <AdminI18nContext.Provider value={{ language, changeLanguage, isReady }}>
      <I18nextProvider i18n={adminI18n}>
        {children}
      </I18nextProvider>
    </AdminI18nContext.Provider>
  );
};

export const useAdminI18nContext = () => {
  const context = useContext(AdminI18nContext);
  if (!context) {
    throw new Error('useAdminI18nContext must be used within AdminI18nProvider');
  }
  return context;
};

export default AdminI18nProvider;
