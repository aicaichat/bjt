import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Typography,
  message,
  Modal,
  Form,
  Select,
  Input,
  Timeline,
  Divider,
  Table,
  Row,
  Col,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { RMAService } from '../../../services/rma.service';
import type { RMARequest, RMAStatus, RMAItem, RMAComment } from '../../../types/rma.types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AdminRmaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rmaData, setRmaData] = useState<RMARequest | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [form] = Form.useForm();

  const rmaService = new RMAService();

  // 获取RMA详情
  const fetchRmaDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await rmaService.getRMADetail(id);
      if (response.success && response.data) {
        setRmaData(response.data);
      }
    } catch (error) {
      message.error('获取售后详情失败');
      console.error('Error fetching RMA detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRmaDetail();
  }, [id]);

  // 状态颜色映射
  const getStatusColor = (status: RMAStatus): string => {
    const colorMap = {
      pending: 'orange',
      processing: 'blue',
      approved: 'green',
      rejected: 'red',
      completed: 'purple',
      cancelled: 'gray',
    };
    return colorMap[status] || 'default';
  };

  // 状态文本映射
  const getStatusText = (status: RMAStatus): string => {
    const textMap = {
      pending: '待处理',
      processing: '处理中',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成',
      cancelled: '已取消',
    };
    return textMap[status] || status;
  };

  // 处理状态更新
  const handleStatusUpdate = () => {
    if (!rmaData) return;
    
    setStatusModalVisible(true);
    form.setFieldsValue({
      status: rmaData.status,
      admin_notes: rmaData.admin_notes || '',
    });
  };

  // 提交状态更新
  const handleStatusSubmit = async () => {
    if (!rmaData) return;
    
    try {
      const values = await form.validateFields();
      await rmaService.updateRMA(rmaData.id, values);
      message.success('状态更新成功');
      setStatusModalVisible(false);
      fetchRmaDetail();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 退货商品列表列定义
  const itemColumns: ColumnsType<RMAItem> = [
    {
      title: '商品料号',
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
      dataIndex: 'quantity_ordered',
      key: 'quantity_ordered',
    },
    {
      title: '退货数量',
      dataIndex: 'quantity_to_return',
      key: 'quantity_to_return',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '退款金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '退货原因',
      dataIndex: 'return_reason',
      key: 'return_reason',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!rmaData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="secondary">未找到售后记录</Text>
      </div>
    );
  }

  return (
    <div className="admin-rma-detail-page">
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/rma')}
          style={{ marginRight: 16 }}
        >
          返回列表
        </Button>
        <Title level={2} style={{ display: 'inline-block', margin: 0 }}>
          售后详情 - {rmaData.rma_number}
        </Title>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="售后编号">{rmaData.rma_number}</Descriptions.Item>
              <Descriptions.Item label="订单编号">{rmaData.order_number}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{rmaData.customer_name || '未知'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(rmaData.status)}>{getStatusText(rmaData.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="退货原因" span={2}>
                {rmaData.reason_detail || '无详细说明'}
              </Descriptions.Item>
              <Descriptions.Item label="总退款金额">
                ¥{rmaData.total_refund_amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(rmaData.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {rmaData.admin_notes && (
                <Descriptions.Item label="管理员备注" span={2}>
                  {rmaData.admin_notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 退货商品 */}
          <Card title="退货商品" style={{ marginBottom: 24 }}>
            <Table
              columns={itemColumns}
              dataSource={rmaData.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          {/* 处理记录 */}
          {rmaData.comments && rmaData.comments.length > 0 && (
            <Card title="处理记录">
              <Timeline>
                {rmaData.comments.map((comment: RMAComment) => (
                  <Timeline.Item key={comment.id}>
                    <div>
                      <Text strong>{comment.user_name || '系统'}</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {new Date(comment.created_at).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {comment.content}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}
        </Col>

        <Col span={8}>
          {/* 操作面板 */}
          <Card title="操作" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={handleStatusUpdate}
                block
              >
                更新状态
              </Button>
              
              {rmaData.status === 'pending' && (
                <>
                  <Button 
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={async () => {
                      try {
                        await rmaService.updateRMA(rmaData.id, {
                          status: 'approved',
                          admin_notes: '管理员快速批准',
                        });
                        message.success('已批准');
                        fetchRmaDetail();
                      } catch (error) {
                        message.error('批准失败');
                      }
                    }}
                    block
                  >
                    批准申请
                  </Button>
                  
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={async () => {
                      try {
                        await rmaService.updateRMA(rmaData.id, {
                          status: 'rejected',
                          admin_notes: '管理员快速拒绝',
                        });
                        message.success('已拒绝');
                        fetchRmaDetail();
                      } catch (error) {
                        message.error('拒绝失败');
                      }
                    }}
                    block
                  >
                    拒绝申请
                  </Button>
                </>
              )}
            </Space>
          </Card>

          {/* 统计信息 */}
          <Card title="统计信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="商品总数">
                {rmaData.items.reduce((sum, item) => sum + item.quantity_to_return, 0)}
              </Descriptions.Item>
              <Descriptions.Item label="退款总额">
                ¥{rmaData.total_refund_amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="处理时长">
                {Math.ceil((new Date().getTime() - new Date(rmaData.created_at).getTime()) / (1000 * 60 * 60 * 24))} 天
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 状态更新弹窗 */}
      <Modal
        title="更新售后状态"
        visible={statusModalVisible}
        onOk={handleStatusSubmit}
        onCancel={() => setStatusModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="approved">已批准</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="admin_notes"
            label="管理员备注"
          >
            <TextArea rows={4} placeholder="请输入处理备注..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminRmaDetailPage; 