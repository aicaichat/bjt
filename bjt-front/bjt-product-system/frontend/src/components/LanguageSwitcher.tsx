import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showText = true, 
  size = 'medium' 
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const sizeStyles = {
    small: { fontSize: '12px', padding: '4px 8px' },
    medium: { fontSize: '14px', padding: '6px 12px' },
    large: { fontSize: '16px', padding: '8px 16px' }
  };

  const iconSize = {
    small: 14,
    medium: 16,
    large: 18
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`language-switcher ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: '1px solid #e1e5e9',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#495057',
        transition: 'all 0.2s ease',
        ...sizeStyles[size]
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f8f9fa';
        e.currentTarget.style.borderColor = '#007bff';
        e.currentTarget.style.color = '#007bff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = '#e1e5e9';
        e.currentTarget.style.color = '#495057';
      }}
      title={currentLang === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      {/* 语言图标 */}
      <svg 
        width={iconSize[size]} 
        height={iconSize[size]} 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
      
      {showText && (
        <>
          <span>{currentLang === 'zh' ? '中文' : 'EN'}</span>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="currentColor"
            style={{ opacity: 0.6 }}
          >
            <path d="M3 4.5L6 7.5L9 4.5"/>
          </svg>
        </>
      )}
    </button>
  );
};

export default LanguageSwitcher; 