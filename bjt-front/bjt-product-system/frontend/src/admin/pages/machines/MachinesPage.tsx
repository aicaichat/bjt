import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Dropdown,
  Menu,
  message,
  Tooltip,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  FilterOutlined,
  UndoOutlined,
  ApiOutlined, // For Link action
  CheckCircleOutlined, // For Active status
  StopOutlined, // For Inactive status
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AdminService from '../../api/adminService';
import type {
  AdminHostModel,
  AdminPart,
  AdminModelStatus,
  ApiResponse,
  PaginatedResponse,
} from '../../../admin/types';

const { Title, Text } = Typography;
const { Option } = Select;

const MachinesPage: React.FC = () => {
  const [models, setModels] = useState<AdminHostModel[]>([]);
  const [parts, setParts] = useState<AdminPart[]>([]);

  const [modelsLoading, setModelsLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);

  const [modelsPagination, setModelsPagination] = useState({ current: 1, pageSize: 5, total: 0 });
  const [partsPagination, setPartsPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [partFilters, setPartFilters] = useState({ modelId: '', partNumber: '' });

  // Modal states
  const [isModelModalVisible, setIsModelModalVisible] = useState(false);
  const [isPartModalVisible, setIsPartModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<AdminHostModel | null>(null);
  const [editingPart, setEditingPart] = useState<AdminPart | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const [modelForm] = Form.useForm<AdminHostModel>();
  const [partForm] = Form.useForm<AdminPart>();

  const fetchModels = useCallback(async (page = modelsPagination.current, pageSize = modelsPagination.pageSize) => {
    setModelsLoading(true);
    try {
      const response = await AdminService.getHostModels({ page, pageSize });
      setModels(response.items || []);
      setModelsPagination({ current: response.page, pageSize: response.pageSize, total: response.total });
    } catch (error) {
      message.error('获取型号列表失败');
      console.error('Failed to fetch models:', error);
    } finally {
      setModelsLoading(false);
    }
  }, [modelsPagination.current, modelsPagination.pageSize]);

  const fetchParts = useCallback(async (
    page = partsPagination.current, 
    pageSize = partsPagination.pageSize,
    filters = partFilters
  ) => {
    setPartsLoading(true);
    const queryParams: any = { page, pageSize };
    if (filters.modelId) queryParams.hostModelId = filters.modelId;
    if (filters.partNumber) queryParams.partNumber_like = filters.partNumber; // Assuming API supports _like for partial match
    
    try {
      const response = await AdminService.getParts(queryParams);
      setParts(response.items || []);
      setPartsPagination({ current: response.page, pageSize: response.pageSize, total: response.total });
    } catch (error) {
      message.error('获取料号列表失败');
      console.error('Failed to fetch parts:', error);
    } finally {
      setPartsLoading(false);
    }
  }, [partsPagination.current, partsPagination.pageSize, partFilters]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    // Fetch parts when selectedModelId changes or filters change
    fetchParts(1, partsPagination.pageSize, { ...partFilters, modelId: selectedModelId || '' });
  }, [fetchParts, selectedModelId, partFilters, partsPagination.pageSize]);

  // Model Actions
  const handleAddModel = () => {
    setEditingModel(null);
    modelForm.resetFields();
    modelForm.setFieldsValue({ status: 'active' }); 
    setIsModelModalVisible(true);
  };

  const handleEditModel = (model: AdminHostModel) => {
    setEditingModel(model);
    modelForm.setFieldsValue(model);
    setIsModelModalVisible(true);
  };

  const handleDeleteModel = (model: AdminHostModel) => {
    setConfirmMessage(`确定要删除型号 "${model.name}" 吗？此操作无法撤销。`);
    setConfirmAction(() => async () => {
        await AdminService.deleteHostModel(model.id);
        message.success('型号删除成功');
        fetchModels(); // Refresh list
    });
    setIsConfirmModalVisible(true);
  };
  
  const handleToggleModelStatus = (model: AdminHostModel) => {
    const newStatus: AdminModelStatus = model.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '上架' : '下架';
    setConfirmMessage(`确定要${actionText}型号 "${model.name}" 吗？`);
    setConfirmAction(() => async () => {
        await AdminService.updateHostModel(model.id, { ...model, status: newStatus });
        message.success(`型号已${actionText}`);
        fetchModels();
    });
    setIsConfirmModalVisible(true);
  };

  const handleModelFormFinish = async (values: AdminHostModel) => {
    setModelsLoading(true);
    try {
      if (editingModel) {
        await AdminService.updateHostModel(editingModel.id, { ...editingModel, ...values });
        message.success('型号更新成功');
      } else {
        await AdminService.createHostModel(values);
        message.success('型号创建成功');
      }
      setIsModelModalVisible(false);
      fetchModels();
    } catch (error) {
      message.error('保存型号失败');
    } finally {
      setModelsLoading(false);
    }
  };

  // Part Actions (Similar structure to Model Actions)
  const handleAddPart = () => {
    setEditingPart(null);
    partForm.resetFields();
    partForm.setFieldsValue({ status: 'active', hostModelId: selectedModelId || undefined });
    setIsPartModalVisible(true);
  };

  const handleEditPart = (part: AdminPart) => {
    setEditingPart(part);
    partForm.setFieldsValue(part);
    setIsPartModalVisible(true);
  };

  const handleDeletePart = (part: AdminPart) => {
    setConfirmMessage(`确定要删除料号 "${part.partNumber}" 吗？`);
    setConfirmAction(() => async () => {
        await AdminService.deletePart(part.id);
        message.success('料号删除成功');
        fetchParts();
    });
    setIsConfirmModalVisible(true);
  };

  const handleTogglePartStatus = (part: AdminPart) => {
    const newStatus: AdminModelStatus = part.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '上架' : '下架';
    setConfirmMessage(`确定要${actionText}料号 "${part.partNumber}" 吗？`);
    setConfirmAction(() => async () => {
        await AdminService.updatePart(part.id, { ...part, status: newStatus });
        message.success(`料号已${actionText}`);
        fetchParts();
    });
    setIsConfirmModalVisible(true);
  };
  
  const handlePartFormFinish = async (values: AdminPart) => {
    setPartsLoading(true);
    try {
      const payload = { ...values, hostModelId: values.hostModelId || selectedModelId || undefined };
      if (editingPart) {
        await AdminService.updatePart(editingPart.id, { ...editingPart, ...payload });
        message.success('料号更新成功');
      } else {
        await AdminService.createPart(payload);
        message.success('料号创建成功');
      }
      setIsPartModalVisible(false);
      fetchParts();
    } catch (error) {
      message.error('保存料号失败');
    } finally {
      setPartsLoading(false);
    }
  };

  const handleConfirmOk = async () => {
    if (confirmAction) {
      setConfirmLoading(true);
      try {
        await confirmAction();
      } catch (error) {
        message.error('操作失败');
        console.error('Confirm action failed:', error);
      } finally {
        setConfirmLoading(false);
        setIsConfirmModalVisible(false);
        setConfirmAction(null);
      }
    }
  };

  const modelColumns: ColumnsType<AdminHostModel> = [
    { title: 'No', dataIndex: 'id', key: 'id', render: (text, record, index) => (modelsPagination.current - 1) * modelsPagination.pageSize + index + 1 },
    { title: '型号名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AdminModelStatus) => (
        <Tag icon={status === 'active' ? <CheckCircleOutlined /> : <StopOutlined />} color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '已上架' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button icon={<EditOutlined />} onClick={() => handleEditModel(record)} size="small" />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '下架' : '上架'}>
            <Button 
                icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => handleToggleModelStatus(record)} 
                size="small"
                type={record.status === 'active' ? 'default' : 'primary'}
                danger={record.status === 'active'}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button icon={<DeleteOutlined />} onClick={() => handleDeleteModel(record)} size="small" danger />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const partColumns: ColumnsType<AdminPart> = [
    { title: 'No', dataIndex: 'id', key: 'id', render: (text, record, index) => (partsPagination.current - 1) * partsPagination.pageSize + index + 1 },
    { title: '型号', dataIndex: 'hostModelName', key: 'hostModelName', render: (text, record) => record.hostModelName || 'N/A' }, // Assuming API populates this or we map it
    { title: '料号', dataIndex: 'partNumber', key: 'partNumber' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AdminModelStatus) => (
        <Tag icon={status === 'active' ? <CheckCircleOutlined /> : <StopOutlined />} color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '已上架' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button icon={<EditOutlined />} onClick={() => handleEditPart(record)} size="small" />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '下架' : '上架'}>
             <Button 
                icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => handleTogglePartStatus(record)} 
                size="small"
                type={record.status === 'active' ? 'default' : 'primary'}
                danger={record.status === 'active'}
            />
          </Tooltip>
          <Tooltip title="关联">
            <Button icon={<ApiOutlined />} onClick={() => message.info('关联功能待实现')} size="small" />
          </Tooltip>
          <Tooltip title="删除">
            <Button icon={<DeleteOutlined />} onClick={() => handleDeletePart(record)} size="small" danger />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleModelTableChange = (pagination: any) => {
    fetchModels(pagination.current, pagination.pageSize);
  };

  const handlePartTableChange = (pagination: any) => {
    fetchParts(pagination.current, pagination.pageSize, partFilters);
  };
  
  const handlePartFilterChange = (changedValues: any, allValues: any) => {
    setPartFilters({modelId: allValues.modelIdFilter || '', partNumber: allValues.partNumberFilter || ''});
  };

  const resetPartFilters = () => {
    setPartFilters({ modelId: '', partNumber: '' });
    // TODO: Also reset filter form fields if using a Form instance for filters
  };

  // Mockup shows export/import but functionality needs specific API endpoints
  const exportMenu = (
    <Menu onClick={({ key }) => message.info(`导出 ${key} 格式...`)}>
      <Menu.Item key="excel">Excel</Menu.Item>
      <Menu.Item key="csv">CSV</Menu.Item>
      <Menu.Item key="json">JSON</Menu.Item>
    </Menu>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>主机管理</Title>

      <Card title="型号表">
        <Space style={{ marginBottom: 16 }}>
          <Dropdown overlay={exportMenu}>
            <Button icon={<CloudDownloadOutlined />}>导出</Button>
          </Dropdown>
          <Button icon={<CloudUploadOutlined />} onClick={() => message.info('导入功能待实现')}>导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModel}>
            新增型号
          </Button>
        </Space>
        <Table
          columns={modelColumns}
          dataSource={models}
          loading={modelsLoading}
          pagination={modelsPagination}
          rowKey="id"
          onChange={handleModelTableChange}
          onRow={(record) => ({
            onClick: () => {
              setSelectedModelId(record.id);
              // Also update the filter dropdown for parts table if it's separate
              // and reset part number filter text
              setPartFilters(prev => ({...prev, modelId: record.id, partNumber: ''})); 
            },
          })}
          rowClassName={(record) => (record.id === selectedModelId ? 'ant-table-row-selected' : '')}
        />
      </Card>

      <Card title="料号表">
        <Form layout="inline" onValuesChange={handlePartFilterChange} initialValues={{modelIdFilter: selectedModelId || undefined}} style={{ marginBottom: 16 }}>
            <Form.Item name="modelIdFilter" label="型号">
                <Select placeholder="全部型号" style={{ width: 200 }} allowClear defaultValue={selectedModelId || undefined}>
                    {models.map(model => (
                        <Option key={model.id} value={model.id}>{model.name}</Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item name="partNumberFilter" label="料号">
                <Input placeholder="请输入料号" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
                <Button icon={<FilterOutlined />} onClick={() => fetchParts(1, partsPagination.pageSize, partFilters)}>筛选</Button>
            </Form.Item>
            <Form.Item>
                <Button icon={<UndoOutlined />} onClick={resetPartFilters}>重置</Button>
            </Form.Item>
        </Form>
        <Space style={{ marginBottom: 16 }}>
          <Dropdown overlay={exportMenu}>
            <Button icon={<CloudDownloadOutlined />}>导出</Button>
          </Dropdown>
          <Button icon={<CloudUploadOutlined />} onClick={() => message.info('导入功能待实现')}>导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPart}>
            新增料号
          </Button>
        </Space>
        <Table
          columns={partColumns}
          dataSource={parts}
          loading={partsLoading}
          pagination={partsPagination}
          rowKey="id"
          onChange={handlePartTableChange}
        />
      </Card>

      {/* Model Add/Edit Modal */}
      <Modal
        title={editingModel ? "编辑型号" : "新增型号"}
        visible={isModelModalVisible}
        onCancel={() => setIsModelModalVisible(false)}
        footer={null} // Using Form's submit button
        destroyOnClose
      >
        <Form form={modelForm} layout="vertical" onFinish={handleModelFormFinish} initialValues={{ status: 'active'}}>
          <Form.Item name="name" label="型号名称" rules={[{ required: true, message: '请输入型号名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="active">已上架</Option>
              <Option value="inactive">已下架</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModelModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={modelsLoading}>保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Part Add/Edit Modal */}
      <Modal
        title={editingPart ? "编辑料号" : "新增料号"}
        visible={isPartModalVisible}
        onCancel={() => setIsPartModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={partForm} layout="vertical" onFinish={handlePartFormFinish} initialValues={{ status: 'active'}}>
          <Form.Item name="hostModelId" label="归属型号" rules={[{ required: true, message: '请选择归属型号' }]}>
            <Select placeholder="选择主机型号" defaultValue={selectedModelId || undefined}>
              {models.map(model => (
                <Option key={model.id} value={model.id}>{model.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="partNumber" label="料号" rules={[{ required: true, message: '请输入料号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="active">已上架</Option>
              <Option value="inactive">已下架</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsPartModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={partsLoading}>保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Confirmation Modal */}
      <Modal
        title="确认操作"
        visible={isConfirmModalVisible}
        onOk={handleConfirmOk}
        onCancel={() => setIsConfirmModalVisible(false)}
        confirmLoading={confirmLoading}
        okText="确认"
        cancelText="取消"
      >
        <p>{confirmMessage}</p>
      </Modal>

    </Space>
  );
};

export default MachinesPage; 