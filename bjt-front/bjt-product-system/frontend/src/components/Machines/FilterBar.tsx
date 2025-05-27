import React from 'react';
import { Input, Select, Button, Radio, RadioChangeEvent, Space } from 'antd';
import { SearchOutlined, FilterOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './FilterBar.css';

const { Search } = Input;
const { Option } = Select;

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  filterVoltage: string;
  setFilterVoltage: (voltage: string) => void;
  filterRegion?: string;
  setFilterRegion?: (region: string) => void;
  regions?: string[];
  voltageOptions: { value: string; label: string }[];
  handleFilterReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  filterVoltage,
  setFilterVoltage,
  filterRegion,
  setFilterRegion,
  regions,
  voltageOptions,
  handleFilterReset
}) => {
  const { t } = useTranslation();

  const handleVoltageChange = (e: RadioChangeEvent) => {
    setFilterVoltage(e.target.value);
  };

  const handleRegionChange = (value: string) => {
    if (setFilterRegion) {
      setFilterRegion(value);
    }
  };

  const sortOptions = [
    { value: 'name_asc', label: t('machines.sort.nameAsc'), icon: <SortAscendingOutlined /> },
    { value: 'name_desc', label: t('machines.sort.nameDesc'), icon: <SortDescendingOutlined /> },
    { value: 'price_asc', label: t('machines.sort.priceAsc'), icon: <SortAscendingOutlined /> },
    { value: 'price_desc', label: t('machines.sort.priceDesc'), icon: <SortDescendingOutlined /> }
  ];

  return (
    <div className="filter-bar">
      <div className="filter-bar-section">
        <h3 className="filter-section-title">
          <SearchOutlined /> {t('machines.filters.search')}
        </h3>
        <Search
          placeholder={t('machines.filters.searchPlaceholder')}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      <div className="filter-bar-section">
        <h3 className="filter-section-title">
          <FilterOutlined /> {t('machines.filters.voltage')}
        </h3>
        <Radio.Group onChange={handleVoltageChange} value={filterVoltage}>
          <Space direction="vertical">
            {voltageOptions.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      {regions && setFilterRegion && (
        <div className="filter-bar-section">
          <h3 className="filter-section-title">
            <FilterOutlined /> {t('machines.filters.region')}
          </h3>
          <Select
            value={filterRegion}
            onChange={handleRegionChange}
            style={{ width: '100%' }}
            placeholder={t('machines.filters.regionPlaceholder')}
          >
            <Option value="all">{t('machines.filters.allRegions')}</Option>
            {regions.map((region) => (
              <Option key={region} value={region}>
                {region}
              </Option>
            ))}
          </Select>
        </div>
      )}

      <div className="filter-bar-section">
        <h3 className="filter-section-title">
          <SortAscendingOutlined /> {t('machines.filters.sort')}
        </h3>
        <Select
          value={sortOrder}
          onChange={(value: string) => setSortOrder(value)}
          style={{ width: '100%' }}
        >
          {sortOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </Option>
          ))}
        </Select>
      </div>

      <div className="filter-bar-actions">
        <Button onClick={handleFilterReset}>{t('machines.filters.reset')}</Button>
      </div>
    </div>
  );
};

export default FilterBar; 