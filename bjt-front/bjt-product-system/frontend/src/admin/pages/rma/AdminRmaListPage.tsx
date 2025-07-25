import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Select, 
  Button, 
  Space, 
  Typography,
  Row,
  Col,
  message,
  Tag,
  Modal,
  Form,
  Popconfirm
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { RMAService } from '../../../services/rma.service';
import type { RMARequest, RMAStatus } from '../../../types/rma.types';

const { TextArea } = Input;
const rmaService = new RMAService();

// 定义筛选器类型
interface RMAListFilters {
  page: number;
  per_page: number;
  search: string;
  status?: RMAStatus;
}

// 格式化日期函数
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const { Title } = Typography;
const { Option } = Select;

const AdminRmaListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rmaList, setRmaList] = useState<RMARequest[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<RMAListFilters>({
    page: 1,
    per_page: 10,
    search: '',
    status: undefined,
  });
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedRma, setSelectedRma] = useState<RMARequest | null>(null);
  const [form] = Form.useForm();

  // 获取RMA列表
  const fetchRmaList = async () => {
    setLoading(true);
    try {
      const response = await rmaService.getRMAList(filters);
      if (response.success && response.data) {
        setRmaList(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      message.error('获取售后列表失败');
      console.error('Error fetching RMA list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRmaList();
  }, [filters]);

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

  // 表格列定义
  const columns: ColumnsType<RMARequest> = [
    {
      title: '售后编号',
      dataIndex: 'rma_number',
      key: 'rma_number',
      render: (text: string, record: RMARequest) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/admin/rma/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '原订单号',
      dataIndex: 'order_number',
      key: 'order_number',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: RMAStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '退货类型',
      dataIndex: 'reason_category',
      key: 'reason_category',
      render: (type: string) => {
        const typeMap = {
          quality_issue: '质量问题',
          damaged_shipping: '运输损坏',
          wrong_item: '发错商品',
          not_as_described: '与描述不符',
          defective: '产品缺陷',
          customer_change: '客户改变主意',
          other: '其他',
        };
        return typeMap[type as keyof typeof typeMap] || type;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: RMARequest) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/rma/${record.id}`)}
          >
            查看详情
          </Button>
          <Button 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleStatusChange(record)}
          >
            更新状态
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定要批准这个售后申请吗？"
                onConfirm={() => handleQuickApprove(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                >
                  批准
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定要拒绝这个售后申请吗？"
                onConfirm={() => handleQuickReject(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                >
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // 处理状态筛选
  const handleStatusFilter = (status: RMAStatus | undefined) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setFilters(prev => ({ 
      ...prev, 
      page: pagination.current, 
      per_page: pagination.pageSize 
    }));
  };

  // 处理状态更新
  const handleStatusChange = (record: RMARequest) => {
    setSelectedRma(record);
    setStatusModalVisible(true);
    form.setFieldsValue({
      status: record.status,
      admin_notes: (record as any).admin_notes || '',
    });
  };

  // 快速批准
  const handleQuickApprove = async (record: RMARequest) => {
    try {
      // 使用updateRMA方法更新状态
      await rmaService.updateRMA(record.id, {
        ...record,
        status: 'approved',
        admin_notes: '管理员快速批准',
      });
      message.success('售后申请已批准');
      fetchRmaList();
    } catch (error) {
      message.error('批准失败');
    }
  };

  // 快速拒绝
  const handleQuickReject = async (record: RMARequest) => {
    try {
      // 使用updateRMA方法更新状态
      await rmaService.updateRMA(record.id, {
        ...record,
        status: 'rejected',
        admin_notes: '管理员快速拒绝',
      });
      message.success('售后申请已拒绝');
      fetchRmaList();
    } catch (error) {
      message.error('拒绝失败');
    }
  };

  // 提交状态更新
  const handleStatusSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedRma) {
        await rmaService.updateRMA(selectedRma.id, {
          ...selectedRma,
          ...values,
        });
        message.success('状态更新成功');
        setStatusModalVisible(false);
        setSelectedRma(null);
        fetchRmaList();
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  return (
    <div className="admin-rma-list-page">
      <Card>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>售后管理</Title>
        </div>

        {/* 筛选区域 */}
        <div className="filters-section" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="搜索RMA编号、客户名称或订单号"
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态筛选"
                value={filters.status}
                onChange={handleStatusFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="pending">待处理</Option>
                <Option value="processing">处理中</Option>
                <Option value="approved">已批准</Option>
                <Option value="rejected">已拒绝</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Col>
            <Col span={2}>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchRmaList}
                loading={loading}
              />
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={rmaList}
          loading={loading}
          rowKey="id"
          pagination={{
            current: filters.page,
            total: total,
            pageSize: filters.per_page,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 状态更新弹窗 */}
      <Modal
        title="更新售后状态"
        visible={statusModalVisible}
        onOk={handleStatusSubmit}
        onCancel={() => {
          setStatusModalVisible(false);
          setSelectedRma(null);
        }}
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

export default AdminRmaListPage; 