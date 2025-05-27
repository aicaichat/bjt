import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
  Card,
  Row,
  Col,
  Tag,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminPart, AdminHostModel } from '../../types/admin-models.types';
import AdminPartService from '../../services/admin-part.service';
import adminHostModelService from '../../services/admin-host-model.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const PartsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Parts state
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsList, setPartsList] = useState<AdminPart[]>([]);
  const [partsPagination, setPartsPagination] = useState({
    current: 1,
    page_size: 10,
    total: 0,
  });
  const [partFilters, setPartFilters] = useState({
    host_model_id: undefined as string | undefined,
    product_line_id: undefined as number | undefined,
    status: undefined as string | undefined,
    search: '',
  });
  const [partModelOptions, setPartModelOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Common state
  const [productLines, setProductLines] = useState<any[]>([]);
  const [hostModels, setHostModels] = useState<AdminHostModel[]>([]);

  // Data fetching
  const fetchParts = useCallback(async (page = partsPagination.current, page_size = partsPagination.page_size) => {
    setPartsLoading(true);
    try {
      const params = {
        page,
        page_size,
        ...partFilters,
      };

      const response = await AdminPartService.getParts(params);
      setPartsList(response.items);
      setPartsPagination({
        ...partsPagination,
        current: response.page,
        total: response.total,
      });

      // 提取料号表中的所有唯一model值用于筛选下拉框
      const uniqueModels = [...new Set(response.items.map(part => part.model).filter(Boolean))];
      const modelOptions = uniqueModels.map(model => ({
        value: model as string,
        label: model as string
      }));
      setPartModelOptions(modelOptions);
    } catch (error) {
      console.error('Error fetching parts:', error);
      message.error('Failed to fetch parts');
    } finally {
      setPartsLoading(false);
    }
  }, [partsPagination.current, partsPagination.page_size, partFilters]);

  const fetchProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      if (response && Array.isArray(response.items)) {
        setProductLines(response.items);
      }
    } catch (error) {
      console.error('Error fetching product lines:', error);
    }
  };

  const fetchHostModels = async () => {
    try {
      const response = await adminHostModelService.getHostModels({ page: 1, page_size: 100 });
      if (response && Array.isArray(response.items)) {
        setHostModels(response.items);
      }
    } catch (error) {
      console.error('Error fetching host models:', error);
    }
  };

  // 首次获取所有料号数据以构建model选项
  const fetchAllPartsForModelOptions = useCallback(async () => {
    try {
      // 获取更多数据以构建完整的model选项列表
      const response = await AdminPartService.getParts({ page: 1, page_size: 100 });
      const uniqueModels = [...new Set(response.items.map(part => part.model).filter(Boolean))];
      const modelOptions = uniqueModels.map(model => ({
        value: model as string,
        label: model as string
      }));
      setPartModelOptions(modelOptions);
    } catch (error) {
      console.error('Error fetching parts for model options:', error);
    }
  }, []);

  useEffect(() => {
    fetchParts();
    fetchProductLines();
    fetchHostModels();
    fetchAllPartsForModelOptions();
  }, [fetchParts, fetchAllPartsForModelOptions]);

  // 添加搜索防抖
  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      if (partFilters.search !== undefined && partFilters.search.length > 0) {
        setPartsPagination(prev => ({ ...prev, current: 1 })); // 重置到第一页
        fetchParts(1, partsPagination.page_size);
      } else if (partFilters.search === '') {
        // 清空搜索时也需要重新获取数据
        setPartsPagination(prev => ({ ...prev, current: 1 }));
        fetchParts(1, partsPagination.page_size);
      }
    }, 500); // 500ms 防抖

    return () => clearTimeout(searchDebounce);
  }, [partFilters.search, fetchParts, partsPagination.page_size]);

  const handlePartDelete = async (id: string, host_model_id: string) => {
    try {
      setPartsLoading(true);
      await AdminPartService.deletePart(id, host_model_id);
      message.success('料号删除成功');
      fetchParts();
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    } finally {
      setPartsLoading(false);
    }
  };

  // Navigate to the part edit page
  const handleEditPart = (record: AdminPart) => {
    const params = new URLSearchParams();
    if (record.host_model_id) {
      params.append('hostModel', record.host_model_id);
    }
    if (record.product_line_id) {
      params.append('productLine', record.product_line_id.toString());
    }
    navigate(`/admin/parts/edit/${record.id}?${params.toString()}`);
  };

  // Navigate to create new part
  const handleCreatePart = () => {
    navigate('/admin/parts/create');
  };

  // Navigate to the relation page
  const handlePartRelation = (record: AdminPart) => {
    navigate(`/admin/relations?part_id=${record.id}`);
  };

  // Table columns definitions
  const partColumns: ColumnsType<AdminPart> = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: '料号',
      dataIndex: 'part_number',
      key: 'part_number',
    },
    {
      title: '中文名称',
      dataIndex: 'name_zh',
      key: 'name_zh',
    },
    {
      title: '英文名称',
      dataIndex: 'name_en',
      key: 'name_en',
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
      width: 120,
      render: (status) => (
        <Tag color={status === 'publish' ? 'success' : 'error'}>
          {status === 'publish' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditPart(record)}
          />
          <Button 
            type="text" 
            icon={<LinkOutlined />} 
            onClick={() => handlePartRelation(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handlePartDelete(record.id, record.host_model_id || '')}
          />
        </Space>
      ),
    },
  ];

  // Table event handlers
  const handlePartTableChange = (pagination: any) => {
    fetchParts(pagination.current, pagination.pageSize);
  };

  return (
    <div className="parts-page">
      {/* 料号管理卡片 */}
      <Card 
        title={<Title level={4}>料号管理</Title>}
      >
        {/* 工具栏 */}
        <div className="mb-4 flex justify-between">
          <div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreatePart}
            >
              新增料号
            </Button>
            <Button className="ml-2" icon={<UploadOutlined />}>导入</Button>
            <Button className="ml-2" icon={<DownloadOutlined />}>导出</Button>
          </div>
          <div>
            <Space>
              <Select 
                placeholder="产品线" 
                style={{ width: 200 }}
                allowClear
                value={partFilters.product_line_id}
                onChange={(value: number | undefined) => setPartFilters(prev => ({ ...prev, product_line_id: value }))}
              >
                {productLines.map(line => (
                  <Option key={line.id} value={line.id}>
                    {line.title_zh || line.title_en}
                  </Option>
                ))}
              </Select>
              <Select 
                placeholder="料号型号" 
                style={{ width: 200 }}
                allowClear
                value={partFilters.host_model_id}
                onChange={(value: string | undefined) => {
                  setPartFilters(prev => ({ ...prev, host_model_id: value }));
                }}
              >
                {partModelOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Select 
                placeholder="状态" 
                style={{ width: 100 }}
                allowClear
                onChange={(value: string | undefined) => setPartFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="publish">已发布</Option>
                <Option value="draft">草稿</Option>
                <Option value="trash">回收站</Option>
              </Select>
              <Input.Search 
                placeholder="搜索料号" 
                allowClear 
                style={{ width: 200 }}
                value={partFilters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPartFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={(value: string) => setPartFilters(prev => ({ ...prev, search: value }))}
              />
            </Space>
          </div>
        </div>
        
        {/* 料号表格 */}
        <Table 
          columns={partColumns}
          dataSource={partsList}
          rowKey="id"
          loading={partsLoading}
          pagination={{
            current: partsPagination.current,
            pageSize: partsPagination.page_size,
            total: partsPagination.total,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 项`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handlePartTableChange}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default PartsPage; 