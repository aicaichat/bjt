import React from 'react';
import { Select } from 'antd';
import { countries, getCountryName } from '../../utils/countries';
import { useTranslation } from 'react-i18next';

interface CountrySelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, placeholder }) => {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const options = countries.map((c) => ({
    value: c.code,
    label: getCountryName(c.code, language),
  }));

  return (
    <Select
      showSearch
      placeholder={placeholder || 'Please select country/region'}
      value={value}
      onChange={onChange}
      optionFilterProp="label"
      filterOption={(input, option) =>
        (option?.label as string).toLowerCase().includes(input.toLowerCase())
      }
      options={options}
    />
  );
};

export default CountrySelect; 