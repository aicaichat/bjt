import React from 'react';
import { Select, Button, Input } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import '../../../styles/machine-filter-bar.css';

const { Search } = Input;

interface FilterOption {
  value: string;
  label: string;
}

interface FilterOptions {
  types: FilterOption[];
  voltages: FilterOption[];
  regions: FilterOption[];
}

interface MachineFilters {
  search: string;
  type: string;
  voltage: string;
  region: string;
}

interface MachineFilterBarProps {
  filters: MachineFilters;
  filterOptions: FilterOptions;
  onTypeChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onVoltageChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  loading?: boolean;
}

export const MachineFilterBar: React.FC<MachineFilterBarProps> = ({
  filters,
  filterOptions,
  onTypeChange,
  onRegionChange,
  onVoltageChange,
  onSearchChange,
  onReset,
  loading = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="machine-filter-card p-5 mb-6 text-gray-900">
      <div className="machine-filter-container">
        {/* 左侧筛选器组 */}
        <div className="machine-filter-left">
          {/* 型号筛选 */}
          <div className="w-[180px]">
            <label className="machine-filter-label block">
              {t('filters.model')}
            </label>
            <Select
              value={filters.type}
              onChange={onTypeChange}
              className="w-full machine-filter-select"
              loading={loading}
              options={filterOptions.types}
            />
          </div>

          {/* 电压筛选 */}
          <div className="w-[120px]">
            <label className="machine-filter-label block">
              {t('filters.voltage')}
            </label>
            <Select
              value={filters.voltage}
              onChange={onVoltageChange}
              className="w-full machine-filter-select"
              options={filterOptions.voltages}
            />
          </div>

          {/* 区域筛选 */}
          <div className="w-[120px]">
            <label className="machine-filter-label block">
              {t('filters.region')}
            </label>
            <Select
              value={filters.region}
              onChange={onRegionChange}
              className="w-full machine-filter-select"
              options={filterOptions.regions}
            />
          </div>

          {/* 重置按钮 */}
          <div>
            <Button
              icon={<ReloadOutlined />}
              onClick={onReset}
              className="h-[32px] machine-reset-button"
            >
              {t('filters.reset')}
            </Button>
          </div>
        </div>

        {/* 右侧搜索框组 */}
        <div className="machine-filter-right">
          <div className="w-[300px]">
            <label className="machine-filter-label block">
              {t('filters.search')}
            </label>
            <Search
              placeholder={t('filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              className="w-full machine-search-input"
              size="middle"
              enterButton
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 