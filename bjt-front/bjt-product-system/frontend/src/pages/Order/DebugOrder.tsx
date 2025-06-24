import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../contexts/OrderContext';
import OrderDataConverter from '../../utils/orderDataConverter';

const DebugOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  // 使用订单状态管理
  const { 
    state, 
    submitOrder, 
    setPageTransferData, 
    clearMessages 
  } = useOrder();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLog(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const handleDebugSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      addLog('🔧 开始调试订单提交流程...');
      
      // 模拟订单数据
      const mockOrderData = {
        customerInfo: {
          companyName: '测试公司',
          contactName: '张三',
          address: '北京市朝阳区测试街道123号',
          phone: '13800138000',
          email: 'test@example.com',
          country: 'CN',
          notes: '测试订单'
        },
        items: [
          {
            id: 'test-item-1',
            productId: 'prod-001',
            code: 'TEST-001',
            sku: 'TEST-001',
            name: '测试产品1',
            nameZh: '测试产品1',
            nameEn: 'Test Product 1',
            quantity: 1,
            unitPrice: 1000.00,
            lineTotal: 1000.00,
            currency: 'CNY',
            type: 'machine' as any,
            specs: {},
            properties: {}
          }
        ],
        summary: {
          subtotal: 1000.00,
          shipping: 0,
          tax: 130.00,
          discount: 0,
          total: 1130.00,
          currency: 'CNY'
        },
        paymentMethod: 'bank_transfer',
        notes: '调试测试订单',
        region: 'CN',
        language: 'zh'
      };
      
      addLog('📊 模拟订单数据已准备');
      addLog(`📋 订单项目数量: ${mockOrderData.items.length}`);
      addLog(`💰 订单总金额: ${mockOrderData.summary.total}`);
      
      // 调用submitOrder
      addLog('🚀 调用submitOrder...');
      const unifiedOrderData = await submitOrder(mockOrderData);
      
      addLog('✅ submitOrder调用成功');
      addLog(`📝 返回的订单号: ${unifiedOrderData.orderNumber}`);
      addLog(`🆔 返回的订单ID: ${unifiedOrderData.id}`);
      
      // 创建页面传递数据
      addLog('📦 创建页面传递数据...');
      const transferData = OrderDataConverter.createPageTransferData(
        'order',
        unifiedOrderData,
        {
          fromPage: 'debug-order',
          submitTime: new Date().toISOString()
        }
      );
      
      addLog('💾 设置页面传递数据...');
      setPageTransferData(transferData);
      
      addLog('🧭 准备导航到PO页面...');
      addLog('🎯 目标路径: /unified-po');
      
      // 跳转到PO页面
      navigate('/unified-po', {
        state: {
          orderData: unifiedOrderData,
          source: 'debug-order',
          timestamp: new Date().toISOString()
        },
        replace: true
      });
      
      addLog('🚀 navigate调用完成');
      
    } catch (error) {
      addLog(`❌ 订单提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('调试订单提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectNavigate = () => {
    addLog('🧭 直接导航到PO页面进行测试...');
    navigate('/unified-po', {
      state: {
        orderData: null,
        source: 'direct-test',
        timestamp: new Date().toISOString()
      }
    });
  };

  const clearLog = () => {
    setDebugLog([]);
    addLog('🧹 调试日志已清除');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔧 订单提交调试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>测试控制</h3>
        <button 
          onClick={handleDebugSubmit}
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? '提交中...' : '调试订单提交'}
        </button>
        
        <button 
          onClick={handleDirectNavigate}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          直接测试PO页面
        </button>
        
        <button 
          onClick={clearLog}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          清除日志
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>OrderContext状态</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <p><strong>当前订单:</strong> {state.currentOrder ? '有数据' : '无数据'}</p>
          <p><strong>订单列表加载中:</strong> {state.orderListLoading ? '是' : '否'}</p>
          <p><strong>页面传递数据:</strong> {state.pageTransferData ? '有数据' : '无数据'}</p>
          <p><strong>提交中:</strong> {state.isSubmitting ? '是' : '否'}</p>
          <p><strong>最后错误:</strong> {state.lastError || '无'}</p>
          <p><strong>最后成功:</strong> {state.lastSuccess || '无'}</p>
        </div>
      </div>

      <div>
        <h3>调试日志</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {debugLog.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>暂无日志...</p>
          ) : (
            debugLog.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px', padding: '2px 0' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugOrderPage; 