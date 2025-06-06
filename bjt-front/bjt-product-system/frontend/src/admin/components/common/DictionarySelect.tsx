import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { adminGeneralDictionaryService, DictionaryItem } from '../../services/admin-dictionary.service';

const { Option } = Select;

interface DictionarySelectProps {
  dictionaryType: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  mode?: 'multiple' | 'tags';
  lang?: 'zh' | 'en';
}

const DictionarySelect: React.FC<DictionarySelectProps> = ({
  dictionaryType,
  value,
  onChange,
  placeholder,
  allowClear = true,
  disabled = false,
  className,
  style,
  mode,
  lang = 'zh',
  ...restProps
}) => {
  const [options, setOptions] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOptions();
  }, [dictionaryType, lang]);

  const fetchOptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminGeneralDictionaryService.getDictionaryItems(dictionaryType, { lang });
      setOptions(response.data.items);
    } catch (err) {
      console.error(`Failed to fetch ${dictionaryType} options:`, err);
      setError(`加载${dictionaryType}选项失败`);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Select
        value={value}
        onChange={onChange}
        placeholder={`${placeholder || ''} (加载失败)`}
        disabled={true}
        allowClear={allowClear}
        className={className}
        style={style}
        mode={mode}
        {...restProps}
      >
        <Option value="" disabled>加载失败，请刷新重试</Option>
      </Select>
    );
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled || loading}
      className={className}
      style={style}
      mode={mode}
      loading={loading}
      {...restProps}
    >
      {loading && (
        <Option value="" disabled>
          <Spin size="small" /> 加载中...
        </Option>
      )}
      {!loading && options.map((option) => (
        <Option key={option.code} value={option.code}>
          {option.name}
        </Option>
      ))}
    </Select>
  );
};

export default DictionarySelect; 