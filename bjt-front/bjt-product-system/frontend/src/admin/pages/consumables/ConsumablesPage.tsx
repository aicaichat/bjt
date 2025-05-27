import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Tag,
  Typography,
  Row,
  Col,
  message,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Consumable } from '../../services/admin-consumable.service';
import { useAdminApi } from '../../hooks/useAdminApi';
import { consumableService } from '../../services/admin-consumable.service';

const { Title, Text } = Typography;
const { Option } = Select;

// 简化的数据类型，与API返回的格式一致
interface ConsumableData {
  id: number;
  product_line_id: number;
  model: string;
  part_number: string;
  spec?: string;
  spec_imperial?: string;
  brand?: string;
  app_model?: string;
  bag_type?: string;
  material?: string;
  thickness_met?: number;
  thickness_imp?: number;
  width_met?: number;
  width_imp?: number;
  length_met?: number;
  length_imp?: number;
  bubble_diameter_met?: number;
  bubble_diameter_imp?: number;
  total_length_met?: number;
  total_length_imp?: number;
  package_type?: string;
  package_size_cm?: string;
  package_size_inch?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  pcs_per_box?: number;
  image_url?: string;
  package_image_url?: string;
  status: string;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

const ConsumablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 获取产品线ID - 从URL参数或默认值
  const productLineId = useMemo(() => {
    const paramId = searchParams.get('productLine');
    return paramId ? parseInt(paramId) : 1; // 默认为1（气垫机）
  }, [searchParams]);

  // 过滤条件状态
  const [filters, setFilters] = useState({
    search: '',
    model: '',
    bag_type: '',
    material: '',
    status: '',
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 使用 useMemo 确保查询参数稳定，避免无限循环
  const queryParams = useMemo(() => ({
    page: pagination.current,
    per_page: pagination.pageSize,
    product_line_id: productLineId,
    search: filters.search || undefined,
    model: filters.model || undefined,
    bag_type: filters.bag_type || undefined,
    material: filters.material || undefined,
    status: filters.status || undefined,
  }), [pagination.current, pagination.pageSize, productLineId, filters]);

  // 使用现代 hook 获取数据
  const { 
    data: response, 
    loading, 
    error, 
    refetch 
  } = useAdminApi(
    () => consumableService.getConsumables(queryParams),
    [queryParams] // 依赖queryParams，当查询条件变化时重新获取
  );

  // 处理数据
  const dataSource = useMemo(() => {
    if (!response?.items) return [];
    const mappedData = response.items.map((item: Consumable) => ({
      ...item,
      key: item.id.toString(),
    }));
    return mappedData;
  }, [response]);

  const totalCount = response?.total || 0;

  // 表格列定义
  const columns: ColumnsType<ConsumableData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 180,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '料号',
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
    },
    {
      title: '袋型',
      dataIndex: 'bag_type',
      key: 'bag_type',
      width: 120,
    },
    {
      title: '材质',
      dataIndex: 'material',
      key: 'material',
      width: 100,
    },
    {
      title: '厚度(μm)',
      dataIndex: 'thickness_met',
      key: 'thickness_met',
      width: 100,
      render: (value) => value ? `${value} μm` : '-',
    },
    {
      title: '宽度(mm)',
      dataIndex: 'width_met',
      key: 'width_met',
      width: 100,
      render: (value) => value ? `${value} mm` : '-',
    },
    {
      title: '长度(m)',
      dataIndex: 'length_met',
      key: 'length_met',
      width: 100,
      render: (value) => value ? `${value} m` : '-',
    },
    {
      title: '规格(公制)',
      dataIndex: 'spec',
      key: 'spec',
      width: 200,
      ellipsis: true,
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'publish' ? 'success' : status === 'draft' ? 'warning' : 'error'}>
          {status === 'publish' ? '已发布' : status === 'draft' ? '草稿' : '回收站'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="编辑"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record)}
            title="删除"
          />
        </Space>
      ),
    },
  ];

  // 事件处理函数
  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || '',
    }));
    // 重置到第一页
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationInfo: TablePaginationConfig) => {
    setPagination({
      current: paginationInfo.current || 1,
      pageSize: paginationInfo.pageSize || 10,
    });
  };

  const handleAdd = () => {
    const params = new URLSearchParams();
    params.append('productLine', productLineId.toString());
    navigate(`/admin/consumables/create?${params.toString()}`);
  };

  const handleEdit = (record: ConsumableData) => {
    const params = new URLSearchParams();
    params.append('productLine', productLineId.toString());
    navigate(`/admin/consumables/edit/${record.id}?${params.toString()}`);
  };

  const handleDelete = async (record: ConsumableData) => {
    try {
      await consumableService.deleteConsumable(record.id);
      message.success('删除成功');
      refetch(); // 重新获取数据
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    }
  };

  const handleGoToDictionary = () => {
    navigate('/admin/consumables/dictionary');
  };

  // 更多操作菜单
  const moreActionsItems = [
    {
      key: 'dictionary',
      label: '字典管理',
      icon: <SettingOutlined />,
      onClick: handleGoToDictionary,
    },
    {
      key: 'export',
      label: '导出数据',
      icon: <DownloadOutlined />,
      onClick: () => message.info('导出功能开发中'),
    },
    {
      key: 'import',
      label: '导入数据',
      icon: <UploadOutlined />,
      onClick: () => message.info('导入功能开发中'),
    },
  ];

  return (
    <div className="consumables-page">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={4} className="mb-2">耗材管理</Title>
            <Text type="secondary">
              管理耗材料号 ({totalCount}条完整管理)
            </Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              新增耗材
            </Button>
            <Dropdown menu={{ items: moreActionsItems }} placement="bottomRight">
              <Button icon={<SettingOutlined />}>
                更多操作
              </Button>
            </Dropdown>
          </Space>
        </div>

        {/* 过滤条件 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col span={6}>
            <Input.Search
              placeholder="搜索型号、料号或名称"
              allowClear
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
              onSearch={(value: string) => handleFilterChange('search', value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="型号"
              allowClear
              style={{ width: '100%' }}
              value={filters.model || undefined}
              onChange={(value: string) => handleFilterChange('model', value)}
            >
              {/* 这里可以添加型号选项 */}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="袋型"
              allowClear
              style={{ width: '100%' }}
              value={filters.bag_type || undefined}
              onChange={(value: string) => handleFilterChange('bag_type', value)}
            >
              <Option value="Tube">Tube</Option>
              <Option value="Bubble">Bubble</Option>
              <Option value="Pillow">Pillow</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="材质"
              allowClear
              style={{ width: '100%' }}
              value={filters.material || undefined}
              onChange={(value: string) => handleFilterChange('material', value)}
            >
              <Option value="HDPE">HDPE</Option>
              <Option value="PAPER">PAPER</Option>
              <Option value="50% HDPE">50% HDPE</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(value: string) => handleFilterChange('status', value)}
            >
              <Option value="publish">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="trash">回收站</Option>
            </Select>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: totalCount,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default ConsumablesPage; 