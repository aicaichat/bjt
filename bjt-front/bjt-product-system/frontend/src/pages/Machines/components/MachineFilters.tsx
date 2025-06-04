import React from 'react';
import { Select, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface MachineFiltersProps {
  filterType: string;
  filterRegion: string;
  selectedVoltage: string;
  onFilterTypeChange: (value: string) => void;
  onFilterRegionChange: (value: string) => void;
  onVoltageChange: (value: string) => void;
  onReset: () => void;
  regions: Array<{ code: string; name: string }>;
  voltageOptions: string[];
}

export const MachineFilters: React.FC<MachineFiltersProps> = ({
  filterType,
  filterRegion,
  selectedVoltage,
  onFilterTypeChange,
  onFilterRegionChange,
  onVoltageChange,
  onReset,
  regions,
  voltageOptions
}) => {
  const { t } = useTranslation();

  return (
    <div className="machine-filters">
      <div className="filters-row">
        {/* 机器类型筛选 */}
        <div className="filter-item">
          <label>{t('filters.type')}:</label>
          <Select
            value={filterType}
            onChange={onFilterTypeChange}
            style={{ width: 150 }}
            placeholder={t('filters.selectType')}
          >
            <Option value="all">{t('common.all')}</Option>
            <Option value="automatic">{t('types.automatic')}</Option>
            <Option value="manual">{t('types.manual')}</Option>
            <Option value="semi-automatic">{t('types.semiAutomatic')}</Option>
          </Select>
        </div>

        {/* 区域筛选 */}
        <div className="filter-item">
          <label>{t('filters.region')}:</label>
          <Select
            value={filterRegion}
            onChange={onFilterRegionChange}
            style={{ width: 120 }}
            placeholder={t('filters.selectRegion')}
          >
            {regions.map(region => (
              <Option key={region.code} value={region.code}>
                {region.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* 电压筛选 */}
        <div className="filter-item">
          <label>{t('filters.voltage')}:</label>
          <Select
            value={selectedVoltage}
            onChange={onVoltageChange}
            style={{ width: 100 }}
            placeholder={t('filters.selectVoltage')}
          >
            {voltageOptions.map(voltage => (
              <Option key={voltage} value={voltage}>
                {voltage}
              </Option>
            ))}
          </Select>
        </div>

        {/* 重置按钮 */}
        <div className="filter-item">
          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            type="default"
          >
            {t('common.reset')}
          </Button>
        </div>
      </div>
    </div>
  );
}; 