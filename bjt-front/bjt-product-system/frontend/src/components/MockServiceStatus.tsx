import React, { useState, useEffect } from 'react';
import { getMockServiceStatus } from '../services/integrated-mock-service';
import { switchDataSource, getCurrentDataSourceType, type DataSourceType } from '../config/mock-config';

interface MockServiceStatusProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  showControls?: boolean;
  hidden?: boolean;
}

const MockServiceStatus: React.FC<MockServiceStatusProps> = ({ 
  position = 'top-right',
  compact = false,
  showControls = true,
  hidden = false
}) => {
  const [status, setStatus] = useState(getMockServiceStatus());
  const [currentDataSource, setCurrentDataSource] = useState<DataSourceType>(getCurrentDataSourceType());
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    // 定期更新状态
    const interval = setInterval(() => {
      const newStatus = getMockServiceStatus();
      const newDataSource = getCurrentDataSourceType();
      setStatus(newStatus);
      setCurrentDataSource(newDataSource);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDataSourceSwitch = (dataSourceType: DataSourceType) => {
    switchDataSource(dataSourceType);
    const newStatus = getMockServiceStatus();
    const newDataSource = getCurrentDataSourceType();
    setStatus(newStatus);
    setCurrentDataSource(newDataSource);
    console.log(`🔄 数据源已切换到: ${dataSourceType}`);
  };

  const getDataSourceIcon = (dataSourceType: DataSourceType) => {
    switch (dataSourceType) {
      case 'real-api':
        return '🌐';
      case 'sql-mock':
        return '🗄️';
      case 'mock':
        return '📁';
      default:
        return '❓';
    }
  };

  const getDataSourceName = (dataSourceType: DataSourceType) => {
    switch (dataSourceType) {
      case 'real-api':
        return 'API (8080)';
      case 'sql-mock':
        return 'SQL Mock';
      case 'mock':
        return 'Mock Files';
      default:
        return 'Unknown';
    }
  };

  const getPositionStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: isExpanded ? '15px' : '8px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'Monaco, Consolas, monospace',
      minWidth: isExpanded ? '300px' : '120px',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: 10, left: 10 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 10, right: 10 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 10, left: 10 };
      default:
        return { ...baseStyles, top: 10, right: 10 };
    }
  };

  const renderCompactView = () => (
    <div style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(true)}>
      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
        {status.isActive ? '🟢' : '🔴'} Mock服务
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>
        {getDataSourceIcon(currentDataSource)} {status.dataSource} ({status.totalRecords} 记录)
      </div>
    </div>
  );

  const renderExpandedView = () => (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h4 style={{ margin: 0, fontSize: '14px' }}>Mock服务状态</h4>
        {compact && (
          <button 
            onClick={() => setIsExpanded(false)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: status.isActive ? '#4ade80' : '#f87171' }}>
          {status.isActive ? '🟢 活跃' : '🔴 停用'}
        </span>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>数据源:</strong> 
        <span style={{ 
          color: currentDataSource === 'real-api' ? '#10b981' : 
                currentDataSource === 'sql-mock' ? '#60a5fa' : '#fbbf24',
          marginLeft: '5px'
        }}>
          {getDataSourceIcon(currentDataSource)} {status.dataSource}
        </span>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>环境:</strong> <span style={{ color: '#a78bfa' }}>{status.config.mockEnvironment}</span>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>总表数:</strong> <span style={{ color: '#34d399' }}>{status.totalTables}</span>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>总记录数:</strong> <span style={{ color: '#fbbf24' }}>{status.totalRecords}</span>
      </div>
      
      <div style={{ marginBottom: '5px', fontSize: '10px', opacity: 0.7 }}>
        <div>缓存: {status.config.enableCaching ? '✅' : '❌'}</div>
        <div>网络延迟: {status.config.networkDelay ? '✅' : '❌'}</div>
        {status.config.apiBaseUrl && (
          <div>API地址: {status.config.apiBaseUrl}</div>
        )}
      </div>

      {showControls && (
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ marginBottom: '5px', fontSize: '10px', opacity: 0.8 }}>切换数据源:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => handleDataSourceSwitch('real-api')}
              style={{
                background: currentDataSource === 'real-api' ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
                color: 'white',
                border: currentDataSource === 'real-api' ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.5)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🌐 真实API (localhost:8080)
            </button>
            <button
              onClick={() => handleDataSourceSwitch('sql-mock')}
              style={{
                background: currentDataSource === 'sql-mock' ? '#00338d' : 'rgba(0, 51, 141, 0.3)',
                color: 'white',
                border: currentDataSource === 'sql-mock' ? '1px solid #00338d' : '1px solid rgba(0, 51, 141, 0.5)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🗄️ SQL Mock数据
            </button>
            <button
              onClick={() => handleDataSourceSwitch('mock')}
              style={{
                background: currentDataSource === 'mock' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)',
                color: 'white',
                border: currentDataSource === 'mock' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.5)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              📁 传统Mock文件
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If hidden prop is true, don't render anything
  if (hidden) {
    return null;
  }

  return (
    <div style={getPositionStyles()}>
      {isExpanded ? renderExpandedView() : renderCompactView()}
    </div>
  );
};

export default MockServiceStatus; 