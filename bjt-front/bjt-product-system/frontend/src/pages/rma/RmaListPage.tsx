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
  Tabs
} from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, ToolOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import RmaStatusBadge from '../../components/RMA/RmaStatusBadge';
import { RMAService } from '../../services/rma.service';
import type { RMARequest, RMAStatus } from '../../types/rma.types';

// 导入维修工单组件
import RepairTicketSystemPage from '../repair/RepairTicketSystemPage';

const rmaService = new RMAService();

// 定义筛选器类型
interface RMAListFilters {
  page: number;
  per_page: number;
  search: string;
  status?: RMAStatus;
}

// 格式化日期函数
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const RmaListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rmaList, setRmaList] = useState<RMARequest[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('rma');
  const [filters, setFilters] = useState<RMAListFilters>({
    page: 1,
    per_page: 10,
    search: '',
    status: undefined,
  });

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
    if (activeTab === 'rma') {
      fetchRmaList();
    }
  }, [filters, activeTab]);

  // 表格列定义
  const columns: ColumnsType<RMARequest> = [
    {
      title: '售后编号',
      dataIndex: 'rma_number',
      key: 'rma_number',
      render: (text: string, record: RMARequest) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/rma/${record.id}`)}
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
      render: (status: RMAStatus) => <RmaStatusBadge status={status} size="small" />,
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
            onClick={() => navigate(`/rma/${record.id}`)}
          >
            查看详情
          </Button>
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

  // 渲染RMA列表内容
  const renderRmaContent = () => (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>售后退货管理</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/rma/create')}
          >
            创建售后
          </Button>
        </Space>
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
    </div>
  );

  return (
    <div className="rma-list-page">
      <Card>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>售后服务管理</Title>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane 
            tab={
              <Space>
                <FileTextOutlined />
                <span>售后退货</span>
              </Space>
            } 
            key="rma"
          >
            {renderRmaContent()}
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <ToolOutlined />
                <span>维修工单</span>
              </Space>
            } 
            key="repair"
          >
            <RepairTicketSystemPage />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default RmaListPage; 