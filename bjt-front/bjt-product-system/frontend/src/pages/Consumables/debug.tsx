import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { consumablesService } from '../../services/consumablesService';

const ConsumablesDebugPage: React.FC = () => {
  const [status, setStatus] = useState<string>('未开始');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    setStatus('正在测试API...');
    setData(null);
    setError(null);

    try {
      console.log('🚀 开始测试API调用...');
      const result = await consumablesService.getConsumables({ page: 1, page_size: 10 });
      console.log('✅ API调用成功:', result);
      
      setStatus('API调用成功');
      setData(result);
    } catch (err: any) {
      console.error('❌ API调用失败:', err);
      setStatus('API调用失败');
      setError(err.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const testNetworkConnection = () => {
    setStatus('测试网络连接...');
    
    // 测试基本网络连接
    fetch('https://httpbin.org/get')
      .then(res => res.json())
      .then(() => {
        setStatus('网络连接正常，但API可能有问题');
      })
      .catch(() => {
        setStatus('网络连接失败');
      });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>耗材页面调试工具</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>状态: {status}</h3>
        {loading && <div>⏳ 加载中...</div>}
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Button type="primary" onClick={testApiCall} loading={loading}>
          测试耗材API
        </Button>
        <Button onClick={testNetworkConnection}>
          测试网络连接
        </Button>
        <Button onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      </div>

      {error && (
        <div style={{ 
          background: '#fff2f0', 
          border: '1px solid #ffccc7', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#cf1322', margin: '0 0 10px 0' }}>错误信息:</h4>
          <pre style={{ margin: 0, color: '#cf1322' }}>{error}</pre>
        </div>
      )}

      {data && (
        <div style={{ 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#389e0d', margin: '0 0 10px 0' }}>API响应数据:</h4>
          <div style={{ marginBottom: '10px' }}>
            <strong>产品数量:</strong> {data.items?.length || 0}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>总数:</strong> {data.total || 'N/A'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>是否有筛选选项:</strong> {data.filterOptions ? '是' : '否'}
          </div>
          <details>
            <summary style={{ cursor: 'pointer', color: '#389e0d' }}>查看完整数据</summary>
            <pre style={{ 
              margin: '10px 0 0 0', 
              padding: '10px', 
              background: '#fff', 
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={{ 
        background: '#fafafa', 
        border: '1px solid #d9d9d9', 
        padding: '15px', 
        borderRadius: '6px'
      }}>
        <h4>调试信息:</h4>
        <div><strong>当前URL:</strong> {window.location.href}</div>
        <div><strong>API Base URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1'}</div>
        <div><strong>Node Environment:</strong> {import.meta.env.NODE_ENV}</div>
        <div><strong>用户Agent:</strong> {navigator.userAgent}</div>
      </div>
    </div>
  );
};

export default ConsumablesDebugPage; 