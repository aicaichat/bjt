import React, { useState, useEffect } from 'react';
import { Input, Tabs } from 'antd';

const { TextArea } = Input;

export interface MultilingualValue {
  zh: string;
  en: string;
}

export interface MultilingualInputProps {
  value?: MultilingualValue;
  onChange?: (value: MultilingualValue) => void;
  placeholder?: MultilingualValue;
  required?: boolean;
  type?: 'input' | 'textarea';
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

const MultilingualInput: React.FC<MultilingualInputProps> = ({
  value = { zh: '', en: '' },
  onChange,
  placeholder = { zh: '请输入中文', en: 'Please enter English' },
  required = false,
  type = 'input',
  maxLength,
  rows = 4,
  disabled = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'zh' | 'en'>('zh');
  const [internalValue, setInternalValue] = useState<MultilingualValue>(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleValueChange = (lang: 'zh' | 'en', newValue: string) => {
    const updatedValue = {
      ...internalValue,
      [lang]: newValue,
    };
    setInternalValue(updatedValue);
    onChange?.(updatedValue);
  };

  const renderInput = (lang: 'zh' | 'en') => {
    const commonProps = {
      value: internalValue[lang],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleValueChange(lang, e.target.value),
      placeholder: placeholder[lang],
      maxLength,
      disabled,
      showCount: !!maxLength,
    };

    if (type === 'textarea') {
      const TextAreaComponent = TextArea as any;
      return <TextAreaComponent rows={rows} {...commonProps} />;
    }

    const InputComponent = Input as any;
    return <InputComponent {...commonProps} />;
  };

  const tabItems = [
    {
      key: 'zh',
      label: (
        <span>
          中文 {required && <span style={{ color: '#ff4d4f' }}>*</span>}
          {internalValue.zh && <span style={{ color: '#52c41a' }}> ✓</span>}
        </span>
      ),
      children: renderInput('zh'),
    },
    {
      key: 'en',
      label: (
        <span>
          English {required && <span style={{ color: '#ff4d4f' }}>*</span>}
          {internalValue.en && <span style={{ color: '#52c41a' }}> ✓</span>}
        </span>
      ),
      children: renderInput('en'),
    },
  ];

  const TabsComponent = Tabs as any;

  return (
    <div className={`multilingual-input ${className}`}>
      <TabsComponent
        activeKey={activeTab}
        onChange={(key: string) => setActiveTab(key as 'zh' | 'en')}
        size="small"
        items={tabItems}
      />
    </div>
  );
};

export default MultilingualInput; 