import React, { useState, useEffect } from 'react';
import { Input, Button, Spin, Alert, message, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

export interface CRMPartData {
  part_number: string;
  name_zh?: string;
  name_en?: string;
  brand?: string;
  spec?: string;
  spec_imperial?: string;
  voltage?: string;
  frequency?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  package_size_cm?: string;
  package_size_inch?: string;
  pcs_per_box?: number;
  pallet_size_cm?: string;
  pallet_size_inch?: string;
  pcs_per_pallet?: number;
  pallet_height_cm?: number;
  pallet_height_inch?: number;
  pallet_gross_weight_kg?: number;
  pallet_gross_weight_lbs?: number;
  image_url?: string;
  unit?: 'pcs' | 'roll' | 'box';
}

export interface CRMDataFetcherProps {
  partNumber: string;
  onDataFetched: (data: CRMPartData) => void;
  onError: (error: string) => void;
  fields: string[]; // 需要获取的字段列表
  disabled?: boolean;
  className?: string;
  autoFetch?: boolean; // 是否在料号输入时自动获取数据
}

const CRMDataFetcher: React.FC<CRMDataFetcherProps> = ({
  partNumber,
  onDataFetched,
  onError,
  fields,
  disabled = false,
  className = '',
  autoFetch = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [lastFetchedPartNumber, setLastFetchedPartNumber] = useState<string>('');
  const [fetchResult, setFetchResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchCRMData = async (pn: string) => {
    if (!pn || !pn.trim()) {
      message.warning('请输入料号');
      return;
    }

    setLoading(true);
    setFetchResult(null);
    setErrorMessage('');

    try {
      // 模拟CRM API调用 - 实际项目中应该调用真实的CRM API
      // const response = await fetch(`/wp-json/bjt/v1/crm/part-data?part_number=${encodeURIComponent(pn)}`);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 模拟成功响应数据
      const mockData: CRMPartData = {
        part_number: pn,
        name_zh: `${pn} 中文名称`,
        name_en: `${pn} English Name`,
        brand: 'BJT',
        spec: '220V/50Hz',
        spec_imperial: '220V/60Hz',
        voltage: '220V',
        frequency: '50Hz',
        net_weight_kg: 5.5,
        net_weight_lbs: 12.1,
        gross_weight_kg: 6.2,
        gross_weight_lbs: 13.7,
        package_size_cm: '30×20×15',
        package_size_inch: '11.8×7.9×5.9',
        pcs_per_box: 10,
        pallet_size_cm: '120×100×150',
        pallet_size_inch: '47.2×39.4×59.1',
        pcs_per_pallet: 100,
        pallet_height_cm: 150,
        pallet_height_inch: 59.1,
        pallet_gross_weight_kg: 620,
        pallet_gross_weight_lbs: 1367,
        image_url: `https://example.com/images/${pn}.jpg`,
        unit: 'pcs',
      };

      // 随机模拟成功/失败
      if (Math.random() > 0.2) { // 80% 成功率
        // 过滤只返回需要的字段
        const filteredData: Partial<CRMPartData> = { part_number: pn };
        fields.forEach(field => {
          if (field in mockData) {
            (filteredData as any)[field] = (mockData as any)[field];
          }
        });

        setFetchResult('success');
        setLastFetchedPartNumber(pn);
        onDataFetched(filteredData as CRMPartData);
        message.success(`成功获取料号 ${pn} 的CRM数据`);
      } else {
        throw new Error('CRM系统中未找到该料号的数据');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取CRM数据失败';
      setFetchResult('error');
      setErrorMessage(errorMsg);
      onError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 自动获取数据
  useEffect(() => {
    if (autoFetch && partNumber && partNumber !== lastFetchedPartNumber && !loading) {
      const timer = setTimeout(() => {
        fetchCRMData(partNumber);
      }, 1000); // 防抖，1秒后执行

      return () => clearTimeout(timer);
    }
  }, [partNumber, autoFetch, lastFetchedPartNumber, loading]);

  const handleManualFetch = () => {
    fetchCRMData(partNumber);
  };

  const getStatusIcon = () => {
    if (loading) {
      const SpinComponent = Spin as any;
      return <SpinComponent size="small" />;
    }
    
    if (fetchResult === 'success') {
      return <span style={{ color: '#52c41a' }}>✓</span>;
    }
    
    if (fetchResult === 'error') {
      return <span style={{ color: '#ff4d4f' }}>✗</span>;
    }
    
    return null;
  };

  const SearchIcon = SearchOutlined as any;
  const ReloadIcon = ReloadOutlined as any;
  const InfoIcon = InfoCircleOutlined as any;
  const ButtonComponent = Button as any;
  const TooltipComponent = Tooltip as any;
  const AlertComponent = Alert as any;

  return (
    <div className={`crm-data-fetcher ${className}`}>
      <div className="flex items-center space-x-2">
        <ButtonComponent
          type="primary"
          icon={<SearchIcon />}
          onClick={handleManualFetch}
          loading={loading}
          disabled={disabled || !partNumber || !partNumber.trim()}
          size="small"
        >
          获取CRM数据
        </ButtonComponent>

        <ButtonComponent
          icon={<ReloadIcon />}
          onClick={() => fetchCRMData(partNumber)}
          loading={loading}
          disabled={disabled || !partNumber || !partNumber.trim()}
          size="small"
          title="重新获取"
        />

        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          {lastFetchedPartNumber && fetchResult === 'success' && (
            <span className="text-xs text-gray-500">
              已获取 {lastFetchedPartNumber}
            </span>
          )}
        </div>

        <TooltipComponent
          title={
            <div>
              <div>CRM数据获取功能:</div>
              <div>• 输入料号后自动获取产品信息</div>
              <div>• 获取字段: {fields.join(', ')}</div>
              <div>• 成功获取后会自动填充到表单中</div>
            </div>
          }
        >
          <InfoIcon style={{ color: '#1890ff', cursor: 'help' }} />
        </TooltipComponent>
      </div>

      {/* 错误提示 */}
      {fetchResult === 'error' && errorMessage && (
        <div className="mt-2">
          <AlertComponent
            message="CRM数据获取失败"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => {
              setFetchResult(null);
              setErrorMessage('');
            }}
          />
        </div>
      )}

      {/* 成功提示 */}
      {fetchResult === 'success' && lastFetchedPartNumber && (
        <div className="mt-2">
          <AlertComponent
            message={`成功获取料号 ${lastFetchedPartNumber} 的CRM数据`}
            description={`已获取 ${fields.length} 个字段的数据并自动填充到表单中`}
            type="success"
            showIcon
            closable
            onClose={() => setFetchResult(null)}
          />
        </div>
      )}
    </div>
  );
};

export default CRMDataFetcher; 