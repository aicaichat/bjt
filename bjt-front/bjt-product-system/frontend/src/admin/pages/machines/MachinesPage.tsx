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
  Dropdown,
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
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminHostModel, AdminPart } from '../../types/admin-models.types';
import adminHostModelService from '../../services/admin-host-model.service';
import AdminPartService from '../../services/admin-part.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { PaginatedResponse } from '../../../admin/types';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Models state
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsList, setModelsList] = useState<AdminHostModel[]>([]);
  const [modelsPagination, setModelsPagination] = useState({
    current: 1,
    page_size: 10,
    total: 0,
  });
  const [editingModel, setEditingModel] = useState<AdminHostModel | null>(null);
  const [isModelModalVisible, setIsModelModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AdminHostModel | null>(null);
  const [modelFilters, setModelFilters] = useState({
    product_line_id: undefined as number | undefined,
    status: undefined as string | undefined,
    search: '',
  });
  
  // Parts state
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsList, setPartsList] = useState<AdminPart[]>([]);
  const [partsPagination, setPartsPagination] = useState({
    current: 1,
    page_size: 10,
    total: 0,
  });
  const [selectedPartModelId, setSelectedPartModelId] = useState<string | undefined>(undefined);
  const [partFilters, setPartFilters] = useState({
    hostModelId: undefined as string | undefined,
    status: undefined as string | undefined,
    search: '',
  });
  const [isPartModalVisible, setIsPartModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState<AdminPart | null>(null);
  const [selectedModelForParts, setSelectedModelForParts] = useState<AdminHostModel | null>(null);

  // Common state
  const [productLines, setProductLines] = useState<any[]>([]);
  const [modelForm] = Form.useForm<AdminHostModel>();
  const [partForm] = Form.useForm<AdminPart>();

  // Data fetching
  const fetchModels = useCallback(async (page = modelsPagination.current, page_size = modelsPagination.page_size) => {
    setModelsLoading(true);
    try {
      const params = {
        page,
        page_size,
        ...modelFilters,
      };

      const response = await adminHostModelService.getHostModels(params);
      setModelsList(response.items);
      setModelsPagination({
        ...modelsPagination,
        current: response.page,
        total: response.total,
      });
    } catch (error) {
      console.error('Error fetching host models:', error);
      message.error('Failed to fetch host models');
    } finally {
      setModelsLoading(false);
    }
  }, [modelsPagination.current, modelsPagination.page_size, modelFilters]);

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

  useEffect(() => {
    fetchModels();
    fetchProductLines();
  }, [fetchModels]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // When a model is selected, update the parts filter
  const handleModelRowClick = (record: AdminHostModel) => {
    setSelectedModelForParts(record);
    setPartFilters((prev) => ({
      ...prev,
      hostModelId: record.id,
    }));
  };

  // CRUD operations for models
  const showModelModal = (record?: AdminHostModel) => {
    setEditingModel(record || null);
    
    if (record) {
      modelForm.setFieldsValue({
        product_line_id: record.product_line_id,
        model: record.model,
        title_zh: record.title_zh,
        title_en: record.title_en,
        status: record.status,
        sort_order: record.sort_order,
      });
    } else {
      modelForm.resetFields();
    }
    
    setIsModelModalVisible(true);
  };

  const handleModelSubmit = async () => {
    try {
      const values = await modelForm.validateFields();
      
      setModelsLoading(true);
      
      if (editingModel) {
        await adminHostModelService.updateHostModel(editingModel.id, values);
        message.success('主机型号更新成功');
      } else {
        await adminHostModelService.createHostModel(values);
        message.success('主机型号创建成功');
      }
      
      setIsModelModalVisible(false);
      fetchModels();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('操作失败');
    } finally {
      setModelsLoading(false);
    }
  };

  const handleModelDelete = (record: AdminHostModel) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const confirmModelDelete = async () => {
    if (!recordToDelete) return;
    
    setModelsLoading(true);
    try {
      await adminHostModelService.deleteHostModel(recordToDelete.id);
      message.success('主机型号删除成功');
      fetchModels();
      
      // If the deleted model was selected for parts, clear the selection
      if (selectedModelForParts?.id === recordToDelete.id) {
        setSelectedModelForParts(null);
        setPartFilters((prev) => ({
          ...prev,
          hostModelId: undefined,
        }));
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    } finally {
      setModelsLoading(false);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  // CRUD operations for parts
  const showPartModal = (record?: AdminPart) => {
    setEditingPart(record || null);
    
    if (record) {
      partForm.setFieldsValue({
        hostModelId: record.hostModelId,
        partNumber: record.partNumber,
        status: record.status,
      });
    } else {
      partForm.resetFields();
      if (selectedModelForParts) {
        partForm.setFieldsValue({
          hostModelId: selectedModelForParts.id,
        });
      }
    }
    
    setIsPartModalVisible(true);
  };

  const handlePartSubmit = async () => {
    try {
      const values = await partForm.validateFields();
      
      setPartsLoading(true);
      
      if (editingPart) {
        await AdminPartService.updatePart(editingPart.id, values, values.hostModelId);
        message.success('料号更新成功');
      } else {
        await AdminPartService.createPart(values, values.hostModelId);
        message.success('料号创建成功');
      }
      
      setIsPartModalVisible(false);
      fetchParts();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('操作失败');
    } finally {
      setPartsLoading(false);
    }
  };

  const handlePartDelete = async (id: string, hostModelId: string) => {
    try {
      setPartsLoading(true);
      await AdminPartService.deletePart(id, hostModelId);
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
    navigate(`/admin/parts/${record.id}/edit`);
  };

  // Navigate to the relation page
  const handlePartRelation = (record: AdminPart) => {
    navigate(`/admin/relations?part_id=${record.id}`);
  };

  // Table columns definitions
  const modelColumns: ColumnsType<AdminHostModel> = [
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
      title: '中文名称',
      dataIndex: 'title_zh',
      key: 'title_zh',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '已上架' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              showModelModal(record);
            }}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleModelDelete(record);
            }}
          />
        </Space>
      ),
    },
  ];
  
  const partColumns: ColumnsType<AdminPart> = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '型号',
      dataIndex: 'hostModelName',
      key: 'hostModelName',
      width: 150,
    },
    {
      title: '料号',
      dataIndex: 'partNumber',
      key: 'partNumber',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '正常' : '停用'}
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
            onClick={() => handlePartDelete(record.id, record.hostModelId || '')}
          />
        </Space>
      ),
    },
  ];

  // Table event handlers
  const handleModelTableChange = (pagination: any) => {
    fetchModels(pagination.current, pagination.pageSize);
  };

  const handlePartTableChange = (pagination: any) => {
    fetchParts(pagination.current, pagination.pageSize);
  };

  const handleClearPartFilter = () => {
    setSelectedModelForParts(null);
    setPartFilters((prev) => ({
      ...prev,
      hostModelId: undefined,
    }));
  };

  return (
    <div className="machines-page">
      {/* 主机型号管理卡片 */}
      <Card 
        title={<Title level={4}>主机型号管理</Title>}
        className="mb-4"
      >
        {/* 工具栏 */}
        <div className="mb-4 flex justify-between">
          <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModelModal()}>
              新增型号
            </Button>
            <Button className="ml-2" icon={<CloudUploadOutlined />}>导入</Button>
            <Button className="ml-2" icon={<CloudDownloadOutlined />}>导出</Button>
          </div>
          <div>
            <Space>
              <Select 
                placeholder="产品线" 
                style={{ width: 200 }}
                allowClear
                onChange={(value) => setModelFilters(prev => ({ ...prev, product_line_id: value }))}
              >
                {productLines.map(line => (
                  <Option key={line.id} value={line.id}>
                    {line.title_zh || line.title_en}
                  </Option>
                ))}
              </Select>
              <Select 
                placeholder="状态" 
                style={{ width: 100 }}
                allowClear
                onChange={(value) => setModelFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="active">已上架</Option>
                <Option value="inactive">已下架</Option>
              </Select>
              <Input.Search 
                placeholder="搜索型号" 
                allowClear 
                style={{ width: 200 }}
                onSearch={(value) => setModelFilters(prev => ({ ...prev, search: value }))}
              />
            </Space>
          </div>
        </div>
        
        {/* 主机型号表格 */}
        <Table 
          columns={modelColumns}
          dataSource={modelsList}
          rowKey="id"
          loading={modelsLoading}
          pagination={{
            current: modelsPagination.current,
            pageSize: modelsPagination.page_size,
            total: modelsPagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 项`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handleModelTableChange}
          onRow={(record) => ({
            onClick: () => handleModelRowClick(record),
            className: selectedModelForParts?.id === record.id ? 'ant-table-row-selected' : '',
          })}
          size="middle"
        />
      </Card>

      {/* 料号管理卡片 */}
      <Card 
        title={
          <div className="flex justify-between">
            <Title level={4}>料号管理</Title>
            {selectedModelForParts && (
              <div>
                <Text>当前型号: {selectedModelForParts.model}</Text>
                <Button type="link" onClick={handleClearPartFilter}>清除筛选</Button>
              </div>
            )}
          </div>
        }
      >
        {/* 工具栏 */}
        <div className="mb-4 flex justify-between">
          <div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showPartModal()}
              disabled={!selectedModelForParts}
            >
              新增料号
            </Button>
            <Button className="ml-2" icon={<CloudUploadOutlined />}>导入</Button>
            <Button className="ml-2" icon={<CloudDownloadOutlined />}>导出</Button>
          </div>
          <div>
            <Space>
              <Select 
                placeholder="型号" 
                style={{ width: 200 }}
                allowClear
                value={partFilters.hostModelId}
                onChange={(value) => {
                  setPartFilters(prev => ({ ...prev, hostModelId: value }));
                  if (value) {
                    const model = modelsList.find(m => m.id === value);
                    setSelectedModelForParts(model || null);
                  } else {
                    setSelectedModelForParts(null);
                  }
                }}
              >
                {modelsList.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.model}
                  </Option>
                ))}
              </Select>
              <Select 
                placeholder="状态" 
                style={{ width: 100 }}
                allowClear
                onChange={(value) => setPartFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="active">正常</Option>
                <Option value="inactive">停用</Option>
              </Select>
              <Input.Search 
                placeholder="搜索料号" 
                allowClear 
                style={{ width: 200 }}
                onSearch={(value) => setPartFilters(prev => ({ ...prev, search: value }))}
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
            showTotal: (total) => `共 ${total} 项`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handlePartTableChange}
          size="middle"
        />
      </Card>

      {/* 主机型号模态框 */}
      <Modal
        title={editingModel ? '编辑主机型号' : '新增主机型号'}
        open={isModelModalVisible}
        onCancel={() => setIsModelModalVisible(false)}
        onOk={handleModelSubmit}
        confirmLoading={modelsLoading}
        width={700}
      >
        <Form
          form={modelForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_line_id"
                label="产品线"
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <Select placeholder="请选择产品线">
                  {productLines.map(line => (
                    <Option key={line.id} value={line.id}>
                      {line.title_zh || line.title_en}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="型号编码"
                rules={[{ required: true, message: '请输入型号编码' }]}
              >
                <Input placeholder="请输入型号编码" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title_zh"
                label="中文名称"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title_en"
                label="英文名称"
                rules={[{ required: true, message: '请输入英文名称' }]}
              >
                <Input placeholder="请输入英文名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue="active"
              >
                <Select>
                  <Option value="active">上架</Option>
                  <Option value="inactive">下架</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序"
                initialValue={0}
              >
                <Input type="number" placeholder="请输入排序值" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 料号模态框 */}
      <Modal
        title={editingPart ? '编辑料号' : '新增料号'}
        open={isPartModalVisible}
        onCancel={() => setIsPartModalVisible(false)}
        onOk={handlePartSubmit}
        confirmLoading={partsLoading}
        width={700}
      >
        <Form
          form={partForm}
          layout="vertical"
        >
          <Form.Item
            name="hostModelId"
            label="型号"
            rules={[{ required: true, message: '请选择型号' }]}
          >
            <Select placeholder="请选择型号" disabled={!!selectedModelForParts}>
              {modelsList.map(model => (
                <Option key={model.id} value={model.id}>
                  {model.model}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="partNumber"
            label="料号"
            rules={[{ required: true, message: '请输入料号' }]}
          >
            <Input placeholder="请输入料号" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={showDeleteConfirm}
        onOk={confirmModelDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setRecordToDelete(null);
        }}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要删除此主机型号吗？此操作无法撤销。</p>
        {recordToDelete && (
          <p>
            型号：{recordToDelete.model}<br />
            名称：{recordToDelete.title_zh}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default MachinesPage; 