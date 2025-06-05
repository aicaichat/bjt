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
  Tooltip,
  Upload,
  Tabs,
  Popconfirm,
} from 'antd';

const { TextArea } = Input;
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  LinkOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminHostModel, AdminPart } from '../../types/admin-models.types';
import adminHostModelService from '../../services/admin-host-model.service';
import AdminPartService from '../../services/admin-part.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { PaginatedResponse } from '../../../admin/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TableImportExport from '../../components/TableImportExport';
import PdfUploader from '../../components/PdfUploader';

const { Title, Text } = Typography;
const { Option } = Select;

const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
    host_model_id: undefined as string | undefined,
    status: undefined as string | undefined,
    search: '',
  });
  const [partModelOptions, setPartModelOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedModelForParts, setSelectedModelForParts] = useState<AdminHostModel | null>(null);

  // Common state
  const [productLines, setProductLines] = useState<any[]>([]);
  const [currentProductLine, setCurrentProductLine] = useState<any>(null);
  const [modelForm] = Form.useForm();

  // 初始化认证token
  const initializeAuthToken = useCallback(async () => {
    try {
      console.log('MachinesPage: Initializing authentication token...');
      
      // 首先检查是否已有有效的token
      const existingToken = (window as any).bjtApiToken;
      if (existingToken) {
        console.log('MachinesPage: Using existing token:', existingToken.substring(0, 20) + '...');
        return;
      }
      
      // 尝试通过BJT Core Entities API获取nonce（需要已登录状态）
      const bjtResponse = await fetch('/wp-json/bjt/v1/upload/nonce', {
        credentials: 'include',
      });
      
      if (bjtResponse.ok) {
        const bjtData = await bjtResponse.json();
        console.log('MachinesPage: BJT API response:', bjtData);
        
        if (bjtData.success && bjtData.data?.nonce) {
          // 设置全局token
          (window as any).bjtApiToken = bjtData.data.nonce;
          console.log('MachinesPage: BJT API token initialized:', bjtData.data.nonce.substring(0, 20) + '...');
          return;
        }
      }
      
      // 如果上面都失败了，尝试默认用户登录获取JWT token
      console.log('MachinesPage: Attempting default user login...');
      try {
        const loginResponse = await fetch('/wp-json/bjt/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: 'admin', // 使用默认管理员账户
            password: 'password123', // 使用正确的密码
            remember_me: false
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('MachinesPage: Login response:', loginData);
          
          if (loginData.success && loginData.data?.token) {
            (window as any).bjtApiToken = loginData.data.token;
            console.log('MachinesPage: JWT token obtained from login:', loginData.data.token.substring(0, 20) + '...');
            return;
          }
        } else {
          console.warn('MachinesPage: Login failed with status:', loginResponse.status);
        }
      } catch (loginError) {
        console.warn('MachinesPage: Login attempt failed:', loginError);
      }
      
      // Fallback: 尝试通过WordPress用户API获取认证状态（兼容性）
      console.log('MachinesPage: Fallback to WordPress API...');
      const wpResponse = await fetch('/wp-json/wp/v2/users/me', {
        credentials: 'include',
      });
      
      if (wpResponse.ok) {
        const userData = await wpResponse.json();
        console.log('MachinesPage: WordPress user authentication successful:', userData);
        
        // 检查是否有Authorization header
        const authHeader = wpResponse.headers.get('Authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          (window as any).bjtApiToken = token;
          console.log('MachinesPage: WordPress token initialized:', token.substring(0, 20) + '...');
          return;
        }
        
        // 兼容旧的nonce方式
        const nonceResponse = await fetch('/wp-json/bjt/v1/nonce', {
          credentials: 'include',
        });
        
        if (nonceResponse.ok) {
          const nonceData = await nonceResponse.json();
          console.log('MachinesPage: Received legacy nonce data:', nonceData);
          
          if (nonceData.success && nonceData.nonce) {
            // 设置全局nonce（兼容性）
            if (!(window as any).wpApiSettings) {
              (window as any).wpApiSettings = {};
            }
            (window as any).wpApiSettings.nonce = nonceData.nonce;
            console.log('MachinesPage: Legacy nonce initialized:', nonceData.nonce);
          }
        } else {
          console.warn('MachinesPage: Failed to get legacy nonce from API');
        }
      } else {
        console.warn('MachinesPage: WordPress user authentication failed');
      }
    } catch (error) {
      console.error('MachinesPage: Error initializing authentication token:', error);
    }
  }, []);

  // 导入导出列配置
  const modelExportColumns = [
    { title: '型号', dataIndex: 'code' },
    { title: '中文名称', dataIndex: 'title_zh' },
    { title: '英文名称', dataIndex: 'title_en' },
    { title: '中文描述', dataIndex: 'description_zh' },
    { title: '英文描述', dataIndex: 'description_en' },
    { title: '类型', dataIndex: 'type' },
    { title: '主图URL', dataIndex: 'image1_url' },
    { title: '副图URL', dataIndex: 'image2_url' },
    { title: '爆炸图PDF', dataIndex: 'explosion_diagram_pdf' },
    { title: '规格PDF', dataIndex: 'spec_pdf' },
    { title: '状态', dataIndex: 'status' },
    { title: '排序', dataIndex: 'sort_order' },
  ];

  const partExportColumns = [
    { title: '型号', dataIndex: 'model' },
    { title: '料号', dataIndex: 'part_number' },
    { title: '中文名称', dataIndex: 'name_zh' },
    { title: '英文名称', dataIndex: 'name_en' },
    { title: '品牌', dataIndex: 'brand' },
    { title: '规格(公制)', dataIndex: 'spec' },
    { title: '规格(英制)', dataIndex: 'spec_imperial' },
    { title: '电压', dataIndex: 'voltage' },
    { title: '状态', dataIndex: 'status' },
  ];

  // Data fetching - 修复无限循环问题
  const fetchModels = useCallback(async (page = 1, page_size = 10, filters = {}) => {
    setModelsLoading(true);
    try {
      const params = {
        page,
        page_size,
        ...filters,
      };

      const response = await adminHostModelService.getHostModels(params);
      console.log('MachinesPage: Raw API response for models:', response);
      console.log('MachinesPage: Models items:', response.items);
      if (response.items && response.items.length > 0) {
        console.log('MachinesPage: First model item structure:', response.items[0]);
        console.log('MachinesPage: First model keys:', Object.keys(response.items[0]));
      }
      
      setModelsList(response.items);
      setModelsPagination({
        current: response.page,
        page_size: response.page_size || page_size,
        total: response.total,
      });
    } catch (error) {
      console.error('Error fetching host models:', error);
      message.error('Failed to fetch host models');
    } finally {
      setModelsLoading(false);
    }
  }, []); // 移除state依赖，避免无限循环

  const fetchParts = useCallback(async (page = 1, page_size = 10, filters = {}) => {
    setPartsLoading(true);
    try {
      const params = {
        page,
        page_size,
        ...filters,
      };

      const response = await AdminPartService.getParts(params);
      setPartsList(response.items);
      setPartsPagination({
        current: response.page,
        page_size: response.page_size || page_size,
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
  }, []); // 移除state依赖，避免无限循环

  const fetchProductLines = useCallback(async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      if (response && Array.isArray(response.items)) {
        setProductLines(response.items);
        
        // 获取当前产品线：优先从URL参数，然后从第一个可用的产品线
        const productLineIdFromUrl = searchParams.get('productLine');
        let currentPL = null;
        
        if (productLineIdFromUrl) {
          currentPL = response.items.find(line => line.id.toString() === productLineIdFromUrl);
        }
        
        // 如果URL中没有指定产品线或找不到，使用第一个可用的产品线
        if (!currentPL && response.items.length > 0) {
          currentPL = response.items[0];
        }
        
        setCurrentProductLine(currentPL);
      }
    } catch (error) {
      console.error('Error fetching product lines:', error);
    }
  }, [searchParams]);

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

  // 初始化数据 - 只在组件挂载时执行一次
  useEffect(() => {
    // 初始化认证token
    initializeAuthToken();
    
    // 初始化数据加载
    fetchModels(1, modelsPagination.page_size, modelFilters);
    fetchProductLines();
    fetchAllPartsForModelOptions();
  }, [initializeAuthToken]);

  // 当筛选条件变化时重新获取数据
  useEffect(() => {
    fetchModels(1, modelsPagination.page_size, modelFilters);
  }, [modelFilters, fetchModels, modelsPagination.page_size]);

  // 当料号筛选条件变化时重新获取数据
  useEffect(() => {
    fetchParts(1, partsPagination.page_size, partFilters);
  }, [partFilters, fetchParts, partsPagination.page_size]);

  // When a model is selected, update the parts filter
  const handleModelRowClick = (record: AdminHostModel) => {
    setSelectedModelForParts(record);
    setPartFilters((prev) => ({
      ...prev,
      host_model_id: record.code, // 使用code代码而不是ID，这会筛选料号表中model字段匹配的记录
    }));
  };

  // CRUD operations for models
  const showModelModal = (record?: AdminHostModel) => {
    setEditingModel(record || null);
    
    if (record) {
      modelForm.setFieldsValue({
        product_line_id: record.product_line_id,
        model: record.model || record.code, // 优先使用model字段，如果没有则使用code字段
        title_zh: record.title_zh,
        title_en: record.title_en,
        description_zh: record.description_zh,
        description_en: record.description_en,
        type: record.type,
        image1_url: record.image1_url,
        image2_url: record.image2_url,
        explosion_diagram_pdf: record.explosion_diagram_pdf,
        spec_pdf: record.spec_pdf,
        status: record.status,
        sort_order: record.sort_order,
      });
    } else {
      // 新增时自动设置当前产品线
      modelForm.setFieldsValue({
        product_line_id: currentProductLine?.id,
        status: 'publish',
        sort_order: 0,
      });
    }
    
    setIsModelModalVisible(true);
  };

  const handleModelSubmit = async () => {
    try {
      const values = await modelForm.validateFields();
      
      // 确保所有字段都被正确提交
      const submitData = {
        ...values,
        product_line_id: currentProductLine?.id,
        model: values.model,
        title_zh: values.title_zh,
        title_en: values.title_en,
        description_zh: values.description_zh,
        description_en: values.description_en,
        type: values.type,
        image1_url: values.image1_url,
        image2_url: values.image2_url,
        explosion_diagram_pdf: values.explosion_diagram_pdf,
        spec_pdf: values.spec_pdf,
        status: values.status || 'publish',
        sort_order: values.sort_order || 0,
      };
      
      setModelsLoading(true);
      
      if (editingModel) {
        await adminHostModelService.updateHostModel(editingModel.id, submitData);
        message.success('主机型号更新成功');
      } else {
        await adminHostModelService.createHostModel(submitData);
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
          host_model_id: undefined,
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

  // Navigate to create new part
  const handleCreatePartModal = () => {
    if (selectedModelForParts) {
      const params = new URLSearchParams();
      params.append('hostModel', selectedModelForParts.id);
      if (selectedModelForParts.product_line_id) {
        params.append('productLine', selectedModelForParts.product_line_id.toString());
      }
      navigate(`/admin/parts/create?${params.toString()}`);
    } else {
      navigate('/admin/parts/create');
    }
  };

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

  // Navigate to create new machine model
  const handleCreateMachine = () => {
    navigate('/admin/machines/create');
  };

  // Navigate to create new part
  const handleCreatePart = () => {
    if (selectedModelForParts) {
      navigate(`/admin/parts/create?hostModel=${selectedModelForParts.id}`);
    } else {
      navigate('/admin/parts/create');
    }
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
      render: (value, record) => {
        return value || record.code || '未设置';
      },
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
        <Tag color={status === 'publish' ? 'success' : status === 'draft' ? 'warning' : 'error'}>
          {status === 'publish' ? '已发布' : status === 'draft' ? '草稿' : '回收站'}
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              showModelModal(record);
            }}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={(e: React.MouseEvent) => {
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
  const handleModelTableChange = (pagination: any) => {
    fetchModels(pagination.current, pagination.pageSize, modelFilters);
  };

  const handlePartTableChange = (pagination: any) => {
    fetchParts(pagination.current, pagination.pageSize, partFilters);
  };

  const handleClearPartFilter = () => {
    setSelectedModelForParts(null);
    setPartFilters((prev) => ({
      ...prev,
      host_model_id: undefined,
    }));
  };

  // 导入处理函数
  const handleImportModels = async (data: AdminHostModel[]) => {
    try {
      setModelsLoading(true);
      // 批量创建主机型号
      for (const record of data) {
        const submitData = {
          ...record,
          product_line_id: currentProductLine?.id,
          status: record.status || 'publish',
          sort_order: parseInt(String(record.sort_order)) || 0,
        };
        await adminHostModelService.createHostModel(submitData);
      }
      message.success(`成功导入 ${data.length} 条主机型号记录`);
      fetchModels(); // 刷新数据
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查数据格式');
      throw error; // 重新抛出错误以便Hook处理
    } finally {
      setModelsLoading(false);
    }
  };

  const handleImportParts = async (data: AdminPart[]) => {
    try {
      setPartsLoading(true);
      // 批量创建料号
      for (const record of data) {
        const submitData = {
          ...record,
          product_line_id: currentProductLine?.id,
          status: record.status || 'publish',
        };
        await AdminPartService.createPart(submitData);
      }
      message.success(`成功导入 ${data.length} 条料号记录`);
      fetchParts(); // 刷新数据
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查数据格式');
      throw error; // 重新抛出错误以便Hook处理
    } finally {
      setPartsLoading(false);
    }
  };

  return (
    <div className="machines-page">
      {/* 当前产品线提示 */}
      {currentProductLine && (
        <Card size="small" className="mb-4" style={{ backgroundColor: '#f0f8ff' }}>
          <Text strong>当前产品线：</Text>
          <Text style={{ color: '#1890ff', fontSize: '16px', marginLeft: '8px' }}>
            {currentProductLine.title_zh || currentProductLine.title_en}
          </Text>
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            (ID: {currentProductLine.id})
          </Text>
        </Card>
      )}
      
      {/* 主机型号管理卡片 */}
      <Card 
        title={<Title level={4}>主机型号管理</Title>}
        className="mb-4"
      >
        {/* 工具栏 */}
        <div className="mb-4 flex justify-between">
          <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMachine}>
              新增型号
            </Button>
            <TableImportExport
              data={modelsList}
              columns={modelExportColumns}
              exportFileName={`主机型号_${new Date().toISOString().split('T')[0]}.csv`}
              templateFileName="主机型号导入模板.csv"
              onImportSuccess={handleImportModels}
              requiredFields={['code', 'title_zh', 'title_en']}
              fieldMapping={{
                code: 'model' // CSV中的code字段映射到数据库的model字段
              }}
              validateRow={(row, rowIndex) => {
                const errors: string[] = [];
                if (!row.code && !row.model) {
                  errors.push('缺少型号');
                }
                if (!row.title_zh) {
                  errors.push('缺少中文名称');
                }
                return { valid: errors.length === 0, errors };
              }}
              className="ml-2"
            />
          </div>
          <div>
            <Space>
              <Select 
                placeholder="产品线" 
                style={{ width: 200 }}
                allowClear
                onChange={(value: number | undefined) => setModelFilters(prev => ({ ...prev, product_line_id: value }))}
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
                onChange={(value: string | undefined) => setModelFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="publish">已发布</Option>
                <Option value="draft">草稿</Option>
                <Option value="trash">回收站</Option>
              </Select>
              <Input.Search 
                placeholder="搜索型号" 
                allowClear 
                style={{ width: 200 }}
                value={modelFilters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={(value: string) => setModelFilters(prev => ({ ...prev, search: value }))}
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
            showTotal: (total: number) => `共 ${total} 项`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handleModelTableChange}
          onRow={(record: AdminHostModel) => ({
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
              onClick={handleCreatePartModal}
              title={selectedModelForParts ? `为型号 ${selectedModelForParts.model} 新增料号` : '新增料号（未选择主机型号）'}
            >
              新增料号
            </Button>
            <TableImportExport
              data={partsList}
              columns={partExportColumns}
              exportFileName={`料号_${new Date().toISOString().split('T')[0]}.csv`}
              templateFileName="料号导入模板.csv"
              onImportSuccess={handleImportParts}
              requiredFields={['model', 'part_number', 'name_zh', 'name_en']}
              validateRow={(row, rowIndex) => {
                const errors: string[] = [];
                if (!row.model) {
                  errors.push('缺少型号');
                }
                if (!row.part_number) {
                  errors.push('缺少料号');
                }
                return { valid: errors.length === 0, errors };
              }}
              className="ml-2"
            />
          </div>
          <div>
            <Space>
              <Select 
                placeholder="料号型号" 
                style={{ width: 200 }}
                allowClear
                value={partFilters.host_model_id}
                onChange={(value: string | undefined) => {
                  setPartFilters(prev => ({ ...prev, host_model_id: value }));
                  // 清除主机型号选择状态，因为这里筛选的是料号的model字段
                  setSelectedModelForParts(null);
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

      {/* 主机型号模态框 */}
      <Modal
        title={editingModel ? '编辑主机型号' : '新增主机型号'}
        open={isModelModalVisible}
        onCancel={() => setIsModelModalVisible(false)}
        onOk={handleModelSubmit}
        confirmLoading={modelsLoading}
        width={900}
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
                help={currentProductLine ? `当前产品线：${currentProductLine.title_zh || currentProductLine.title_en}` : '未指定产品线'}
              >
                <Input 
                  value={currentProductLine ? `${currentProductLine.title_zh || currentProductLine.title_en} (ID: ${currentProductLine.id})` : ''}
                  disabled={true}
                  placeholder="当前产品线（自动设定）"
                />
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
                name="description_zh"
                label="中文描述"
              >
                <TextArea rows={3} placeholder="请输入中文描述" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description_en"
                label="英文描述"
              >
                <TextArea rows={3} placeholder="请输入英文描述" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="主机类型"
              >
                <Input placeholder="请输入主机类型" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="image1_url"
                label="主图URL"
              >
                <Input placeholder="请输入主图URL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="image2_url"
                label="副图URL"
              >
                <Input placeholder="请输入副图URL" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="explosion_diagram_pdf"
                label="爆炸图PDF URL"
              >
                <Input placeholder="请输入爆炸图PDF文件URL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="spec_pdf"
                label="规格PDF"
              >
                <PdfUploader 
                  placeholder="上传规格PDF文件" 
                  hostId={editingModel?.id ? (typeof editingModel.id === 'string' ? parseInt(editingModel.id) : editingModel.id) : undefined}
                  value={modelForm.getFieldValue('spec_pdf')}
                  onChange={(url) => {
                    modelForm.setFieldsValue({ spec_pdf: url });
                  }}
                  disabled={!editingModel?.id} // 只有编辑现有主机时才能上传
                />
                {!editingModel?.id && (
                  <div style={{ marginTop: 8, color: '#999', fontSize: '12px' }}>
                    请先保存主机型号，然后再上传PDF文件
                  </div>
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue="publish"
              >
                <Select>
                  <Option value="publish">已发布</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="trash">回收站</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序"
                initialValue={0}
              >
                <Input type="number" placeholder="请输入排序值" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* 空列保持布局 */}
            </Col>
          </Row>
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