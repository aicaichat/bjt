import React, { useEffect, useState } from 'react';
import { OrderService } from '../../services/orderService';
import { NotificationService } from '../../services/notificationService';
import { Button, Table, Card, Spin, Space, Typography } from 'antd';

const { Title } = Typography;

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: number;
}

const OrderListExample: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const orderService = new OrderService();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // 这里应该从orderService获取订单列表
      // 由于当前我们还没有实现这个方法，使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockOrders: Order[] = [
        { id: 'ORD-001', date: '2023-10-01', total: 125.99, status: '已完成', items: 3 },
        { id: 'ORD-002', date: '2023-10-05', total: 79.50, status: '待发货', items: 2 },
        { id: 'ORD-003', date: '2023-10-10', total: 299.99, status: '已发货', items: 1 },
      ];
      setOrders(mockOrders);
    } catch (error) {
      notificationService.error('加载订单失败', '请稍后再试');
      console.error('加载订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewOrder = async () => {
    setLoading(true);
    try {
      // 获取购物车商品
      const cartItems = await orderService.getCartItems();
      
      // 获取默认收货信息
      const shippingInfo = await orderService.getDefaultShippingInfo();
      
      // 计算订单摘要
      const summary = await orderService.calculateOrderSummary(cartItems, shippingInfo);
      
      // 提交订单
      const result = await orderService.submitOrder(cartItems, shippingInfo, summary);
      
      if (result.success) {
        notificationService.success('订单创建成功', `订单号: ${result.data.orderId}`);
        loadOrders(); // 重新加载订单列表
      } else {
        notificationService.error('订单创建失败', result.message || '请稍后再试');
      }
    } catch (error) {
      notificationService.error('创建订单失败', '请稍后再试');
      console.error('创建订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '商品数量',
      dataIndex: 'items',
      key: 'items',
    },
    {
      title: '总金额 (¥)',
      dataIndex: 'total',
      key: 'total',
      render: (text: number) => `¥${text.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button type="link">查看详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>订单管理示例</Title>
          <Button type="primary" onClick={createNewOrder} loading={loading}>
            创建新订单
          </Button>
        </div>
        
        <Spin spinning={loading}>
          <Table 
            dataSource={orders} 
            columns={columns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default OrderListExample; 