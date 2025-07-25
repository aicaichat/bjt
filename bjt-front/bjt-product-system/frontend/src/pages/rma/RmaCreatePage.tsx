import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Table, 
  InputNumber, 
  Space, 
  Typography, 
  Row, 
  Col,
  message,
  Upload,
  Checkbox,
  Steps
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { RMAService } from '../../services/rma.service';
import type { 
  CreateRMARequest, 
  ReturnReasonCategory, 
  RMAPriority
} from '../../types/rma.types';

const rmaService = new RMAService();

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// 订单项目接口
interface OrderItem {
  id: number;
  part_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// 订单信息接口
interface OrderInfo {
  id: number;
  order_number: string;
  customer_name: string;
  order_date: string;
  items: OrderItem[];
  total_amount: number;
}

const RmaCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');

  // 检查是否从订单列表页面传递了订单信息
  useEffect(() => {
    const state = location.state as any;
    if (state?.orderId && state?.orderNumber && state?.source === 'order_list') {
      // 自动填充订单号并搜索
      setSearchOrderNumber(state.orderNumber);
      searchOrder(state.orderNumber);
    }
  }, [location.state]);

  // 模拟订单搜索
  const searchOrder = async (orderNumber: string) => {
    if (!orderNumber) return;
    
    setLoading(true);
    try {
      // 这里应该调用真实的订单查询API
      // 现在使用模拟数据
      const mockOrder: OrderInfo = {
        id: 1,
        order_number: orderNumber,
        customer_name: '张三',
        order_date: '2024-01-15',
        total_amount: 1500.00,
        items: [
          {
            id: 1,
            part_number: 'P001',
            product_name: '产品A',
            quantity: 2,
            unit_price: 500.00,
            total_price: 1000.00
          },
          {
            id: 2,
            part_number: 'P002',
            product_name: '产品B',
            quantity: 1,
            unit_price: 500.00,
            total_price: 500.00
          }
        ]
      };
      
      setOrderInfo(mockOrder);
      setCurrentStep(1);
      message.success('订单查询成功');
    } catch (error) {
      message.error('订单查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 订单商品列表列定义
  const orderItemColumns: ColumnsType<OrderItem> = [
    {
      title: '选择',
      key: 'select',
      render: (_, record) => (
        <Checkbox
          checked={selectedItems.some(item => item.id === record.id)}
          onChange={(e) => handleItemSelect(record, e.target.checked)}
        />
      ),
    },
    {
      title: '商品编号',
      dataIndex: 'part_number',
      key: 'part_number',
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '订购数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '小计',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
  ];

  // 退货商品列表列定义
  const returnItemColumns: ColumnsType<any> = [
    {
      title: '商品编号',
      dataIndex: 'part_number',
      key: 'part_number',
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '订购数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '退货数量',
      key: 'return_quantity',
      render: (_, record, index) => (
        <InputNumber
          min={1}
          max={record.quantity}
          value={record.return_quantity}
          onChange={(value) => handleReturnQuantityChange(index, value)}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '退款金额',
      key: 'refund_amount',
      render: (_, record) => `¥${((record.return_quantity || 0) * record.unit_price).toFixed(2)}`,
    },
    {
      title: '退货原因',
      key: 'return_reason',
      render: (_, record, index) => (
        <Input
          placeholder="请输入退货原因"
          value={record.return_reason}
          onChange={(e) => handleReturnReasonChange(index, e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record, index) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(index)}
        >
          移除
        </Button>
      ),
    },
  ];

  // 处理商品选择
  const handleItemSelect = (item: OrderItem, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, {
        ...item,
        order_item_id: item.id,
        return_quantity: 1,
        return_reason: '',
        refund_amount: item.unit_price
      }]);
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    }
  };

  // 处理退货数量变更
  const handleReturnQuantityChange = (index: number, value: number | null) => {
    if (value === null) return;
    
    const newItems = [...selectedItems];
    newItems[index].return_quantity = value;
    newItems[index].refund_amount = value * newItems[index].unit_price;
    setSelectedItems(newItems);
  };

  // 处理退货原因变更
  const handleReturnReasonChange = (index: number, value: string) => {
    const newItems = [...selectedItems];
    newItems[index].return_reason = value;
    setSelectedItems(newItems);
  };

  // 移除商品
  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  // 下一步
  const handleNext = () => {
    if (currentStep === 1 && selectedItems.length === 0) {
      message.error('请至少选择一个商品');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    if (!orderInfo) return;
    
    setLoading(true);
    try {
      const rmaData: CreateRMARequest = {
        order_id: orderInfo.id,
        reason_category: values.reason_category,
        reason_detail: values.reason_detail,
        priority: values.priority || 'normal',
        warehouse: values.warehouse,
        items: selectedItems.map(item => ({
          order_item_id: item.order_item_id,
          part_number: item.part_number,
          product_name: item.product_name,
          quantity_ordered: item.quantity,
          quantity_to_return: item.return_quantity,
          unit_price: item.unit_price,
          refund_amount: item.refund_amount,
          return_reason: item.return_reason,
        })),
        attachments: values.attachments || [],
        metadata: {
          customer_name: orderInfo.customer_name,
          order_date: orderInfo.order_date,
        },
      };

      const response = await rmaService.createRMA(rmaData);
      if (response.success) {
        message.success('售后申请创建成功');
        navigate(`/rma/${response.data.id}`);
      }
    } catch (error) {
      message.error('售后申请创建失败');
      console.error('Error creating RMA:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算总退款金额
  const getTotalRefundAmount = () => {
    return selectedItems.reduce((total, item) => total + (item.refund_amount || 0), 0);
  };

  return (
    <div className="rma-create-page">
      {/* 页面头部 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/rma')}
            style={{ marginRight: 16 }}
          >
            返回列表
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            创建售后申请
          </Title>
        </div>
        
        <Steps current={currentStep} style={{ maxWidth: 600 }}>
          <Step title="查询订单" />
          <Step title="选择商品" />
          <Step title="填写信息" />
        </Steps>
      </Card>

      {/* 步骤1: 查询订单 */}
      {currentStep === 0 && (
        <Card title="查询订单">
          <Row gutter={16}>
            <Col span={16}>
              <Input
                placeholder="请输入订单号"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                onPressEnter={() => searchOrder(searchOrderNumber)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={8}>
              <Button
                type="primary"
                loading={loading}
                onClick={() => searchOrder(searchOrderNumber)}
              >
                查询订单
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* 步骤2: 选择商品 */}
      {currentStep === 1 && orderInfo && (
        <Card title="选择退货商品">
          <div style={{ marginBottom: 16 }}>
            <Text strong>订单信息：</Text>
            <div>订单号：{orderInfo.order_number}</div>
            <div>客户：{orderInfo.customer_name}</div>
            <div>订单日期：{orderInfo.order_date}</div>
          </div>
          
          <Table
            columns={orderItemColumns}
            dataSource={orderInfo.items}
            rowKey="id"
            pagination={false}
            style={{ marginBottom: 16 }}
          />
          
          <Space>
            <Button onClick={handlePrev}>上一步</Button>
            <Button type="primary" onClick={handleNext}>
              下一步 ({selectedItems.length} 个商品)
            </Button>
          </Space>
        </Card>
      )}

      {/* 步骤3: 填写信息 */}
      {currentStep === 2 && (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="退货商品明细" style={{ marginBottom: 24 }}>
                             <Table
                 columns={returnItemColumns}
                 dataSource={selectedItems}
                 rowKey="id"
                 pagination={false}
               />
               
               <div style={{ textAlign: 'right', marginTop: 16, padding: '12px 0', borderTop: '1px solid #f0f0f0' }}>
                 <Text strong style={{ fontSize: '16px' }}>
                   总计退款金额：¥{getTotalRefundAmount().toFixed(2)}
                 </Text>
               </div>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="退货信息">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="reason_category"
                  label="退货原因分类"
                  rules={[{ required: true, message: '请选择退货原因分类' }]}
                >
                  <Select placeholder="请选择退货原因分类">
                    <Option value="quality_issue">质量问题</Option>
                    <Option value="wrong_item">发错商品</Option>
                    <Option value="damaged_shipping">运输损坏</Option>
                    <Option value="not_as_described">与描述不符</Option>
                    <Option value="defective">产品缺陷</Option>
                    <Option value="customer_change">客户改变主意</Option>
                    <Option value="other">其他原因</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="reason_detail"
                  label="详细说明"
                  rules={[{ required: true, message: '请输入详细说明' }]}
                >
                  <TextArea rows={4} placeholder="请详细描述退货原因..." />
                </Form.Item>

                <Form.Item name="priority" label="优先级">
                  <Select placeholder="请选择优先级" defaultValue="normal">
                    <Option value="low">低</Option>
                    <Option value="normal">普通</Option>
                    <Option value="high">高</Option>
                    <Option value="urgent">紧急</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="warehouse" label="退货仓库">
                  <Input placeholder="请输入退货仓库地址" />
                </Form.Item>

                <Form.Item name="attachments" label="相关附件">
                  <Upload>
                    <Button icon={<UploadOutlined />}>上传文件</Button>
                  </Upload>
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button onClick={handlePrev}>上一步</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      提交申请
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default RmaCreatePage; 