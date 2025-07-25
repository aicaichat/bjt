import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Table, 
  Input, 
  Select,
  message,
  Modal,
  Form,
  Upload,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PlusOutlined, 
  UploadOutlined,
  DownloadOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import RmaStatusBadge from '../../components/RMA/RmaStatusBadge';
import RmaTimeline from '../../components/RMA/RmaTimeline';
import { RMAService } from '../../services/rma.service';
import type { 
  RMARequest, 
  RMAStatus, 
  RMAComment, 
  CreateRMACommentRequest,
  UpdateRMARequest
} from '../../types/rma.types';

const rmaService = new RMAService();

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const RmaDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(false);
  const [rmaData, setRmaData] = useState<RMARequest | null>(null);
  const [comments, setComments] = useState<RMAComment[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();

  // 获取RMA详情
  const fetchRmaDetail = async () => {
    
    if (!id) {
      message.error('无效的售后单号');
      navigate('/rma');
      return;
    }
    
    // 处理创建页面的情况
    if (id === 'create') {
      navigate('/rma/create');
      return;
    }
    
    // 额外的ID验证
    if (id.trim() === '' || id === 'undefined' || id === 'null') {
      message.error('无效的售后单号');
      navigate('/rma');
      return;
    }
    
    setLoading(true);
    try {
      const response = await rmaService.getRMADetail(id);
      if (response.success && response.data) {
        setRmaData(response.data);
        // 获取评论
        const commentsResponse = await rmaService.getRMAComments(id);
        if (commentsResponse.success) {
          setComments(commentsResponse.data);
        }
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

  // 商品列表列定义
  const itemColumns: ColumnsType<any> = [
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

  // 提交评论
  const handleCommentSubmit = async (values: any) => {
    if (!rmaData) return;

    try {
      const commentData: CreateRMACommentRequest = {
        content: values.content,
        comment_type: 'comment',
        is_internal: values.is_internal || false,
        attachments: values.attachments || [],
      };

      const response = await rmaService.createRMAComment(rmaData.id, commentData);
      if (response.success) {
        message.success('评论添加成功');
        setCommentModalVisible(false);
        form.resetFields();
        fetchRmaDetail(); // 刷新数据
      }
    } catch (error) {
      message.error('评论添加失败');
      console.error('Error adding comment:', error);
    }
  };

  // 更新状态
  const handleStatusUpdate = async (values: any) => {
    if (!rmaData) return;

    try {
      const updateData: UpdateRMARequest = {
        status: values.status,
        priority: values.priority,
      };

      const response = await rmaService.updateRMA(rmaData.id, updateData);
      if (response.success) {
        message.success('状态更新成功');
        setStatusModalVisible(false);
        statusForm.resetFields();
        fetchRmaDetail(); // 刷新数据
      }
    } catch (error) {
      message.error('状态更新失败');
      console.error('Error updating status:', error);
    }
  };

  if (!rmaData) {
    return <div>加载中...</div>;
  }

  return (
    <div className="rma-detail-page">
      {/* 页面头部 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/rma')}
              style={{ marginRight: 16 }}
            >
              返回列表
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              售后详情 - {rmaData.rma_number}
            </Title>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setStatusModalVisible(true)}
            >
              更新状态
            </Button>
            <Button 
              icon={<PlusOutlined />}
              onClick={() => setCommentModalVisible(true)}
            >
              添加评论
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={24}>
        {/* 左侧主要信息 */}
        <Col span={16}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Text strong>售后编号:</Text>
                <div>{rmaData.rma_number}</div>
              </div>
              <div>
                <Text strong>状态:</Text>
                <div><RmaStatusBadge status={rmaData.status} /></div>
              </div>
              <div>
                <Text strong>原订单号:</Text>
                <div>{rmaData.order_number}</div>
              </div>
              <div>
                <Text strong>客户名称:</Text>
                <div>{rmaData.customer_name || '未知'}</div>
              </div>
              <div>
                <Text strong>退货类型:</Text>
                <div>{rmaData.reason_category}</div>
              </div>
              <div>
                <Text strong>优先级:</Text>
                <div>{rmaData.priority}</div>
              </div>
              <div>
                <Text strong>创建时间:</Text>
                <div>{new Date(rmaData.created_at).toLocaleString('zh-CN')}</div>
              </div>
              <div>
                <Text strong>更新时间:</Text>
                <div>{new Date(rmaData.updated_at).toLocaleString('zh-CN')}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Text strong>退款总额:</Text>
                <div>¥{rmaData.total_refund_amount.toFixed(2)}</div>
              </div>
              {rmaData.reason_detail && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Text strong>详细说明:</Text>
                  <div>{rmaData.reason_detail}</div>
                </div>
              )}
            </div>
          </Card>

          {/* 商品列表 */}
          <Card title="退货商品" style={{ marginBottom: 24 }}>
            <Table
              columns={itemColumns}
              dataSource={rmaData.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          {/* 评论区域 */}
          <Card title="沟通记录">
            <div className="comments-section">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item" style={{ marginBottom: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      <Text strong>{comment.user_name || '系统'}</Text>
                      {comment.is_internal && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>(内部)</Text>
                      )}
                    </div>
                    <Text type="secondary">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </div>
                  <div>{comment.content}</div>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {comment.attachments.map((attachment, index) => (
                        <Button
                          key={index}
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          href={attachment.url}
                          target="_blank"
                        >
                          {attachment.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧时间线 */}
        <Col span={8}>
          <Card title="处理时间线" style={{ marginBottom: 24 }}>
            <RmaTimeline rma={rmaData} comments={comments} />
          </Card>
        </Col>
      </Row>

      {/* 添加评论弹窗 */}
      <Modal
        title="添加评论"
        open={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCommentSubmit} layout="vertical">
          <Form.Item
            name="content"
            label="评论内容"
            rules={[{ required: true, message: '请输入评论内容' }]}
          >
            <TextArea rows={4} placeholder="请输入评论内容..." />
          </Form.Item>
          
          <Form.Item name="is_internal" valuePropName="checked">
            <input type="checkbox" /> 内部评论（客户不可见）
          </Form.Item>

          <Form.Item name="attachments" label="附件">
            <Upload>
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交评论
              </Button>
              <Button onClick={() => setCommentModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新状态弹窗 */}
      <Modal
        title="更新状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Form form={statusForm} onFinish={handleStatusUpdate} layout="vertical">
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="approved">已批准</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>

          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择优先级">
              <Option value="low">低</Option>
              <Option value="normal">普通</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新状态
              </Button>
              <Button onClick={() => setStatusModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RmaDetailPage; 