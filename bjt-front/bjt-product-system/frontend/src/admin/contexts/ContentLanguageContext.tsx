import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ContentLanguage = 'zh' | 'en';

interface ContentLanguageContextType {
  primaryContentLanguage: ContentLanguage;
  setPrimaryContentLanguage: (lang: ContentLanguage) => void;
  showAllLanguages: boolean;
  setShowAllLanguages: (show: boolean) => void;
  getDisplayText: (zhText: string, enText: string) => string;
}

const ContentLanguageContext = createContext<ContentLanguageContextType | undefined>(undefined);

export const useContentLanguage = () => {
  const context = useContext(ContentLanguageContext);
  if (!context) {
    throw new Error('useContentLanguage must be used within ContentLanguageProvider');
  }
  return context;
};

interface ContentLanguageProviderProps {
  children: ReactNode;
}

export const ContentLanguageProvider: React.FC<ContentLanguageProviderProps> = ({ children }) => {
  const [primaryContentLanguage, setPrimaryContentLanguage] = useState<ContentLanguage>('zh');
  const [showAllLanguages, setShowAllLanguages] = useState(true);

  const getDisplayText = (zhText: string, enText: string): string => {
    if (showAllLanguages) {
      return zhText && enText ? `${zhText} / ${enText}` : zhText || enText;
    }
    return primaryContentLanguage === 'zh' ? zhText : enText;
  };

  return (
    <ContentLanguageContext.Provider 
      value={{
        primaryContentLanguage,
        setPrimaryContentLanguage,
        showAllLanguages,
        setShowAllLanguages,
        getDisplayText,
      }}
    >
      {children}
    </ContentLanguageContext.Provider>
  );
};
