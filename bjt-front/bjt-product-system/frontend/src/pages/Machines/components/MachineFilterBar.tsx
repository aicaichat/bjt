import React from 'react';
import { Select, Input, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachineFilterOptions } from '../hooks/useMachineFilters';

const { Search } = Input;

interface MachineFilterBarProps {
  filters: {
    type: string;
    region: string;
    voltage: string;
    search: string;
  };
  filterOptions: MachineFilterOptions;
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 text-gray-900 border border-gray-200 transition-colors duration-300">
      <div className="flex flex-wrap gap-4 items-end">
        {/* 搜索框 */}
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 text-sm font-medium text-gray-600 block">
            {t('filters.search')}
          </label>
          <Search
            placeholder={t('filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
            className="w-full"
          />
        </div>

        {/* 型号筛选 */}
        <div className="w-[180px]">
          <label className="mb-1 text-sm font-medium text-gray-600 block">
            {t('filters.model')}
          </label>
          <Select
            value={filters.type}
            onChange={onTypeChange}
            className="w-full"
            loading={loading}
            options={filterOptions.types}
          />
        </div>

        {/* 电压筛选 */}
        <div className="w-[120px]">
          <label className="mb-1 text-sm font-medium text-gray-600 block">
            {t('filters.voltage')}
          </label>
          <Select
            value={filters.voltage}
            onChange={onVoltageChange}
            className="w-full"
            options={filterOptions.voltages}
          />
        </div>

        {/* 区域筛选 */}
        <div className="w-[120px]">
          <label className="mb-1 text-sm font-medium text-gray-600 block">
            {t('filters.region')}
          </label>
          <Select
            value={filters.region}
            onChange={onRegionChange}
            className="w-full"
            options={filterOptions.regions}
          />
        </div>

        {/* 重置按钮 */}
        <div>
          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            className="h-[32px]"
          >
            {t('common.reset')}
          </Button>
        </div>
      </div>
    </div>
  );
}; 