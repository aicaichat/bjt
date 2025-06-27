import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Menu } from 'antd';

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
  const SUPPORTED = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' }
  ];

  const currentCode = SUPPORTED.find(l => i18n.language.startsWith(l.code))?.code || 'en';

  const menuItems = SUPPORTED.map(l => ({
    key: l.code,
    label: l.label
  }));

  const menu = (
    <Menu
      items={menuItems}
      onClick={({ key }) => {
        if (key !== currentCode) i18n.changeLanguage(key);
      }}
      selectedKeys={[currentCode]}
    />
  );

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

  const currentLabel = SUPPORTED.find(l => l.code === currentCode)?.label || currentCode.toUpperCase();

  return (
    <Dropdown overlay={menu} trigger={['click']} placement="bottomLeft">
      <button
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
      >
        {/* globe icon */}
        <svg
          width={iconSize[size]}
          height={iconSize[size]}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-1.78 0-3.4-.58-4.72-1.55.2-.32.4-.66.6-1.01H16.1c.2.35.4.69.6 1.01C15.4 19.42 13.78 20 12 20zm-4.38-3c-.25-.66-.46-1.34-.62-2h9.99c-.16.66-.37 1.34-.62 2H7.62zM6.9 13c-.06-.33-.1-.66-.12-1H17.2c-.02.34-.06.67-.12 1H6.9zm.28-3c.16-.68.37-1.35.62-2h9.4c.25.65.46 1.32.62 2H7.18zM8.02 6c1.18-1.22 2.76-2 4.52-2s3.34.78 4.52 2H8.02z" />
        </svg>
        {showText && <span>{currentLabel}</span>}
      </button>
    </Dropdown>
  );
};

export default LanguageSwitcher; 