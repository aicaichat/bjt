import React from 'react';
import { useOrder } from '../../contexts/OrderContext';

const OrderProviderTest: React.FC = () => {
  try {
    const { state } = useOrder();
    
    return (
      <div style={{ padding: '20px', border: '1px solid green', margin: '10px' }}>
        <h3>✅ OrderProvider 工作正常</h3>
        <p>当前订单状态: {state.currentOrder ? '有订单' : '无订单'}</p>
        <p>是否正在提交: {state.isSubmitting ? '是' : '否'}</p>
        <p>订单列表长度: {state.orderList.length}</p>
      </div>
    );
  } catch (error) {
    return (
      <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
        <h3>❌ OrderProvider 错误</h3>
        <p>错误信息: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
};

export default OrderProviderTest; 