import React, { useState, useEffect } from 'react';
import { Input, Tabs, Button, Space, Typography, Tooltip } from 'antd';
import { CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { TextArea } = Input;
const { Text } = Typography;

export interface MultilingualValue {
  zh: string;
  en: string;
}

export interface MultilingualInputProps {
  value?: MultilingualValue;
  onChange?: (value: MultilingualValue) => void;
  placeholder?: {
    zh?: string;
    en?: string;
  };
  type?: 'input' | 'textarea';
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  // 🆕 新增功能
  enableI18nUI?: boolean; // 是否启用国际化界面文本
  showCopyButton?: boolean; // 是否显示复制按钮
  showTranslateHint?: boolean; // 是否显示翻译提示
  isTextArea?: boolean; // 兼容旧版本API
}

const MultilingualInput: React.FC<MultilingualInputProps> = ({
  value = { zh: '', en: '' },
  onChange,
  placeholder = {},
  type = 'input',
  rows = 4,
  disabled = false,
  required = false,
  maxLength,
  // 🆕 新功能参数
  enableI18nUI = false,
  showCopyButton = false,
  showTranslateHint = false,
  isTextArea = false, // 兼容旧版本
}) => {
  const [activeKey, setActiveKey] = useState<string>('zh');
  
  // 🆕 使用管理后台i18n
  let tc: any, tf: any, isReady: boolean;
  try {
    const adminI18n = useAdminI18n();
    tc = adminI18n.tc;
    tf = adminI18n.tf;
    isReady = adminI18n.isReady;
  } catch (error) {
    // 降级处理
    tc = (key: string) => key;
    tf = (key: string) => key;
    isReady = false;
  }

  // 兼容旧版本API
  const inputType = isTextArea ? 'textarea' : type;

  const handleChange = (lang: 'zh' | 'en', text: string) => {
    const newValue = { ...value, [lang]: text };
    onChange?.(newValue);
  };

  // 🆕 复制功能
  const handleCopy = (from: 'zh' | 'en', to: 'zh' | 'en') => {
    if (value[from] && value[from].trim()) {
      handleChange(to, value[from]);
    }
  };

  // 🆕 获取翻译提示文本
  const getTranslateHint = (lang: 'zh' | 'en') => {
    if (!showTranslateHint || !enableI18nUI) return null;
    
    const otherLang = lang === 'zh' ? 'en' : 'zh';
    const hasOtherContent = value[otherLang] && value[otherLang].trim();
    
    if (hasOtherContent && (!value[lang] || !value[lang].trim())) {
      const hintKey = lang === 'zh' ? 'content.hints.translateFromEnglish' : 'content.hints.translateFromChinese';
      return (
        <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
          <InfoCircleOutlined /> {enableI18nUI ? tf(hintKey) : (lang === 'zh' ? '建议翻译英文内容' : 'Suggest translating Chinese content')}
        </Text>
      );
    }
    return null;
  };

  // 🆕 获取界面文本
  const getUIText = (key: string, fallback: string) => {
    return enableI18nUI && isReady ? tf(key) : fallback;
  };

  const tabItems = [
    {
      key: 'zh',
      label: (
        <Space>
          {enableI18nUI ? getUIText('content.languages.chinese', '中文') : '中文'}
          {showCopyButton && value.en && (
            <Tooltip title={enableI18nUI ? getUIText('content.actions.copyFrom', '从{{from}}复制').replace('{{from}}', 'English') : '从English复制'}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy('en', 'zh');
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
      children: (
        <div>
          {inputType === 'textarea' ? (
            <TextArea
              value={value.zh}
              onChange={(e) => handleChange('zh', e.target.value)}
              placeholder={placeholder.zh || (enableI18nUI ? getUIText('content.placeholders.enterChinese', '请输入中文内容') : '请输入中文内容')}
              rows={rows}
              disabled={disabled}
              maxLength={maxLength}
              showCount={!!maxLength}
            />
          ) : (
            <Input
              value={value.zh}
              onChange={(e) => handleChange('zh', e.target.value)}
              placeholder={placeholder.zh || (enableI18nUI ? getUIText('content.placeholders.enterChinese', '请输入中文内容') : '请输入中文内容')}
              disabled={disabled}
              maxLength={maxLength}
            />
          )}
          {getTranslateHint('zh')}
        </div>
      ),
    },
    {
      key: 'en',
      label: (
        <Space>
          {enableI18nUI ? getUIText('content.languages.english', 'English') : 'English'}
          {showCopyButton && value.zh && (
            <Tooltip title={enableI18nUI ? getUIText('content.actions.copyFrom', '从{{from}}复制').replace('{{from}}', '中文') : '从中文复制'}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy('zh', 'en');
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
      children: (
        <div>
          {inputType === 'textarea' ? (
            <TextArea
              value={value.en}
              onChange={(e) => handleChange('en', e.target.value)}
              placeholder={placeholder.en || (enableI18nUI ? getUIText('content.placeholders.enterEnglish', 'Please enter English content') : 'Please enter English content')}
              rows={rows}
              disabled={disabled}
              maxLength={maxLength}
              showCount={!!maxLength}
            />
          ) : (
            <Input
              value={value.en}
              onChange={(e) => handleChange('en', e.target.value)}
              placeholder={placeholder.en || (enableI18nUI ? getUIText('content.placeholders.enterEnglish', 'Please enter English content') : 'Please enter English content')}
              disabled={disabled}
              maxLength={maxLength}
            />
          )}
          {getTranslateHint('en')}
        </div>
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeKey}
      onChange={setActiveKey}
      items={tabItems}
      size="small"
      tabBarStyle={{ marginBottom: 8 }}
    />
  );
};

export default MultilingualInput;
