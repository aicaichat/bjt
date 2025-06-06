import { useState, useEffect } from 'react';
import adminI18n from '../index';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    adminI18n.language || 'zh'
  );

  const changeLanguage = async (langCode: string) => {
    try {
      await adminI18n.changeLanguage(langCode);
      setCurrentLanguage(langCode);
      
      // 保存到独立的localStorage key
      localStorage.setItem('admin_i18nextLng', langCode);
      
      // 发送管理后台专用事件
      window.dispatchEvent(new CustomEvent('admin-language-changed', { 
        detail: { language: langCode } 
      }));
      
    } catch (error) {
      console.error('Language change failed:', error);
    }
  };

  const getCurrentLanguageInfo = (): LanguageOption => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) 
      || SUPPORTED_LANGUAGES[0];
  };

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    adminI18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      adminI18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    getCurrentLanguageInfo,
  };
};
