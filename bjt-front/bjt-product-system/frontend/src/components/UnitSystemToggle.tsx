import React from 'react';
import { Space, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useSmartUnitSystem } from '../hooks/useSmartUnitSystem';

export interface UnitSystemDisplayProps {
  size?: 'small' | 'default' | 'large';
  showLabel?: boolean;
  placement?: 'topLeft' | 'top' | 'topRight';
}

export const UnitSystemDisplay: React.FC<UnitSystemDisplayProps> = React.memo(({ 
  size = 'default', 
  showLabel = true,
  placement = 'top'
}) => {
  const { 
    preferredUnitSystem, 
    accountUnitSetting
  } = useSmartUnitSystem();
  
  const renderTooltipContent = () => (
    <div className="unit-system-tooltip">
      <div className="tooltip-title font-semibold mb-2">
        单位制设置
      </div>
      <div className="tooltip-content space-y-2">
        <div>
          <strong>当前单位制:</strong>
          <span className="ml-2">
            {preferredUnitSystem === 'metric' ? '公制(kg/cm)' : '英制(lbs/inch)'}
          </span>
        </div>
        
        <div>
          <small className="text-gray-500">
            账户设置: {accountUnitSetting === 'metric' ? '公制' : '英制'}
          </small>
        </div>
        
        <div className="mt-2 text-xs text-blue-500">
          如需修改单位制偏好，请前往个人设置页面
        </div>
      </div>
    </div>
  );
  
  return (
    <Tooltip 
      title={renderTooltipContent()} 
      placement={placement}
      overlayClassName="unit-system-tooltip-overlay"
    >
      <Space size="small" className="unit-system-display">
        <GlobalOutlined className="text-gray-500" />
        
        {showLabel && (
          <span className="text-sm text-gray-600">
            {preferredUnitSystem === 'metric' ? '公制' : '英制'}
          </span>
        )}
        
        <span className="text-xs bg-blue-100 px-2 py-1 rounded font-medium">
          {preferredUnitSystem === 'metric' ? 'Metric' : 'Imperial'}
        </span>
      </Space>
    </Tooltip>
  );
});

// 保持向后兼容性
export const UnitSystemToggle = UnitSystemDisplay; 