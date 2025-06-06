import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../hooks/useAdminI18n';

interface LanguageSwitchProps {
  size?: 'small' | 'middle' | 'large';
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ 
  size = 'middle', 
  type = 'default' 
}) => {
  const { language, changeLanguage } = useLanguage();

  const languageOptions = [
    {
      key: 'zh',
      label: '中文',
      onClick: () => changeLanguage('zh'),
    },
    {
      key: 'en',
      label: 'English',
      onClick: () => changeLanguage('en'),
    },
  ];

  const currentLanguageLabel = language === 'zh' ? '中文' : 'English';

  return (
    <Dropdown
      menu={{ 
        items: languageOptions,
        selectedKeys: [language],
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button type={type} size={size} icon={<GlobalOutlined />}>
        <Space>
          {currentLanguageLabel}
        </Space>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitch;
