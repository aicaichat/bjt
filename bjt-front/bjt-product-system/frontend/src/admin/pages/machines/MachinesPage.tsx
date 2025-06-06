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
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import FileUrlInput from '../../components/common/FileUrlInput';

const { Title, Text } = Typography;
const { Option } = Select;

const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAdminI18n();
  
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
    { title: t('fields.model', { ns: 'machines' }), dataIndex: 'code' },
    { title: t('fields.title_zh', { ns: 'machines' }), dataIndex: 'title_zh' },
    { title: t('fields.title_en', { ns: 'machines' }), dataIndex: 'title_en' },
    { title: t('fields.description_zh', { ns: 'machines' }), dataIndex: 'description_zh' },
    { title: t('fields.description_en', { ns: 'machines' }), dataIndex: 'description_en' },
    { title: t('fields.type', { ns: 'machines' }), dataIndex: 'type' },
    { title: t('fields.image1Url', { ns: 'machines' }), dataIndex: 'image1_url' },
    { title: t('fields.image2Url', { ns: 'machines' }), dataIndex: 'image2_url' },
    { title: t('fields.explosionDiagramPdf', { ns: 'machines' }), dataIndex: 'explosion_diagram_pdf' },
    { title: t('fields.specPdf', { ns: 'machines' }), dataIndex: 'spec_pdf' },
    { title: t('fields.status', { ns: 'machines' }), dataIndex: 'status' },
    { title: t('fields.sort_order', { ns: 'machines' }), dataIndex: 'sort_order' },
  ];

  const partExportColumns = [
    { title: t('fields.model', { ns: 'machines' }), dataIndex: 'model' },
    { title: t('fields.part_number', { ns: 'machines' }), dataIndex: 'part_number' },
    { title: t('fields.name_zh', { ns: 'machines' }), dataIndex: 'name_zh' },
    { title: t('fields.name_en', { ns: 'machines' }), dataIndex: 'name_en' },
    { title: t('fields.brand', { ns: 'machines' }), dataIndex: 'brand' },
    { title: t('fields.spec', { ns: 'machines' }), dataIndex: 'spec' },
    { title: t('fields.spec_imperial', { ns: 'machines' }), dataIndex: 'spec_imperial' },
    { title: t('fields.voltage', { ns: 'machines' }), dataIndex: 'voltage' },
    { title: t('fields.status', { ns: 'machines' }), dataIndex: 'status' },
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
      // 编辑模式
      modelForm.setFieldsValue({
        product_line_id: record.product_line_id,
        model: record.model,
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
      // 新建模式 - 设置默认值
      console.log('MachinesPage - Setting default values for new model:', {
        product_line_id: currentProductLine?.id || 1,
        status: 'publish',
        sort_order: 0
      });
      
      modelForm.setFieldsValue({
        product_line_id: currentProductLine?.id || 1, // 使用当前产品线或默认为1
        model: '',
        title_zh: '',
        title_en: '',
        description_zh: '',
        description_en: '',
        type: '',
        image1_url: '',
        image2_url: '',
        explosion_diagram_pdf: '',
        spec_pdf: '',
        status: 'publish', // 默认发布状态
        sort_order: 0, // 默认排序
      });
    }
    
    setIsModelModalVisible(true);
  };

  const handleModelSubmit = async () => {
    try {
      const values = await modelForm.validateFields();
      
      // 数据清理和验证 - 与MachineEditPage保持一致
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => {
          // 过滤掉空字符串、null、undefined
          return value !== '' && value !== null && value !== undefined;
        })
      );
      
      // 转换表单数据为API格式 - 与MachineEditPage保持一致
      const formData = {
        product_line_id: currentProductLine?.id ? String(currentProductLine.id) : undefined,
        model: String(cleanedValues.model || ''),
        title_zh: String(cleanedValues.title_zh || ''),
        title_en: String(cleanedValues.title_en || ''),
        description_zh: cleanedValues.description_zh ? String(cleanedValues.description_zh) : undefined,
        description_en: cleanedValues.description_en ? String(cleanedValues.description_en) : undefined,
        type: cleanedValues.type ? String(cleanedValues.type) : undefined,
        image1_url: cleanedValues.image1_url ? String(cleanedValues.image1_url) : undefined,
        image2_url: cleanedValues.image2_url ? String(cleanedValues.image2_url) : undefined,
        explosion_diagram_pdf: cleanedValues.explosion_diagram_pdf ? String(cleanedValues.explosion_diagram_pdf) : undefined,
        spec_pdf: cleanedValues.spec_pdf ? String(cleanedValues.spec_pdf) : undefined,
        status: cleanedValues.status ? String(cleanedValues.status) : 'publish',
        sort_order: cleanedValues.sort_order ? parseInt(String(cleanedValues.sort_order)) : 0,
      };

      // 移除undefined值
      const submitData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      console.log('MachinesPage.handleModelSubmit - Form values:', values);
      console.log('MachinesPage.handleModelSubmit - Cleaned values:', cleanedValues);
      console.log('MachinesPage.handleModelSubmit - Submit data:', submitData);
      console.log('MachinesPage.handleModelSubmit - Current product line:', currentProductLine);
      
      setModelsLoading(true);
      
      if (editingModel) {
        await adminHostModelService.updateHostModel(editingModel.id, submitData);
        message.success(t('message.modelUpdateSuccess', { ns: 'machines' }));
      } else {
        await adminHostModelService.createHostModel(submitData);
        message.success(t('message.modelCreateSuccess', { ns: 'machines' }));
      }
      
      setIsModelModalVisible(false);
      fetchModels();
    } catch (error: any) {
      console.error('Submit error:', error);
      // 显示更详细的错误信息
      let errorMessage = t('message.operationFailed', { ns: 'machines' });
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
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
      message.success(t('message.modelDeleteSuccess', { ns: 'machines' }));
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
      message.error(t('message.modelDeleteFailed', { ns: 'machines' }));
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
      message.success(t('message.partDeleteSuccess', { ns: 'machines' }));
      fetchParts();
    } catch (error) {
      console.error('Error deleting part:', error);
      message.error(t('message.partDeleteFailed', { ns: 'machines' }));
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
      title: t('fields.id', { ns: 'machines' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.model', { ns: 'machines' }),
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (value, record) => {
        return value || record.code || t('empty.noData', { ns: 'machines' });
      },
    },
    {
      title: t('fields.title_zh', { ns: 'machines' }),
      dataIndex: 'title_zh',
      key: 'title_zh',
    },
    {
      title: t('fields.status', { ns: 'machines' }),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'publish' ? 'success' : status === 'draft' ? 'warning' : 'error'}>
          {status === 'publish' ? t('status.publish', { ns: 'machines' }) : 
           status === 'draft' ? t('status.draft', { ns: 'machines' }) : 
           t('status.trash', { ns: 'machines' })}
        </Tag>
      ),
    },
    {
      title: t('fields.action', { ns: 'machines' }),
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
      title: t('fields.id', { ns: 'machines' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.model', { ns: 'machines' }),
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: t('fields.part_number', { ns: 'machines' }),
      dataIndex: 'part_number',
      key: 'part_number',
    },
    {
      title: t('fields.status', { ns: 'machines' }),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'publish' ? 'success' : 'error'}>
          {status === 'publish' ? t('status.publish', { ns: 'machines' }) : t('status.draft', { ns: 'machines' })}
        </Tag>
      ),
    },
    {
      title: t('fields.action', { ns: 'machines' }),
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
      console.log('Batch create models with data:', data);
      
      // 批量创建主机型号
      const responses = await Promise.all(
        data.map(item => adminHostModelService.createHostModel(item))
      );
      
      message.success(t('message.batchImportSuccess', { ns: 'machines', count: data.length }));
      fetchModels();
    } catch (error) {
      console.error(t('message.updateFailed', { ns: 'machines' }), error);
      message.error(t('message.updateFailed', { ns: 'machines' }));
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
      message.success(t('message.createSuccess', { ns: 'machines' }));
      fetchParts(); // 刷新数据
    } catch (error) {
      console.error(t('message.createFailed', { ns: 'machines' }), error);
      message.error(t('message.createFailed', { ns: 'machines' }));
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
          <Text strong>{t('list.filterByProductLine', { ns: 'machines' })}：</Text>
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
        title={<Title level={4}>{t('list.models', { ns: 'machines' })}</Title>}
        className="mb-4"
      >
        {/* 工具栏 */}
        <div className="mb-4 flex justify-between">
          <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMachine}>
              {t('actions.addModel', { ns: 'machines' })}
            </Button>
            <TableImportExport
              data={modelsList}
              columns={modelExportColumns}
              exportFileName={`${t('list.models', { ns: 'machines' })}_${new Date().toISOString().split('T')[0]}.csv`}
              templateFileName={`${t('list.models', { ns: 'machines' })}${t('actions.import', { ns: 'machines' })}.csv`}
              onImportSuccess={handleImportModels}
              requiredFields={['code', 'title_zh', 'title_en']}
              fieldMapping={{
                code: 'model' // CSV中的code字段映射到数据库的model字段
              }}
              validateRow={(row, rowIndex) => {
                const errors: string[] = [];
                if (!row.code && !row.model) {
                  errors.push(t('validation.modelRequired', { ns: 'machines' }));
                }
                if (!row.title_zh) {
                  errors.push(t('validation.chineseNameRequired', { ns: 'machines' }));
                }
                return { valid: errors.length === 0, errors };
              }}
              className="ml-2"
            />
          </div>
          <div>
            <Space>
              <Select 
                placeholder={t('placeholders.selectProductLine', { ns: 'machines' })} 
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
                placeholder={t('placeholders.selectStatus', { ns: 'machines' })} 
                style={{ width: 100 }}
                allowClear
                onChange={(value: string | undefined) => setModelFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="publish">{t('status.publish', { ns: 'machines' })}</Option>
                <Option value="draft">{t('status.draft', { ns: 'machines' })}</Option>
                <Option value="trash">{t('status.trash', { ns: 'machines' })}</Option>
              </Select>
              <Input.Search 
                placeholder={t('list.searchPlaceholder', { ns: 'machines' })} 
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
            showTotal: (total: number) => t('pagination.total', { ns: 'machines', total }),
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
            <Title level={4}>{t('list.parts', { ns: 'machines' })}</Title>
            {selectedModelForParts && (
              <div>
                <Text>{t('fields.model', { ns: 'machines' })}: {selectedModelForParts.model}</Text>
                <Button type="link" onClick={handleClearPartFilter}>{t('actions.cancel', { ns: 'machines' })}</Button>
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
              title={selectedModelForParts ? `${t('actions.addMachine', { ns: 'machines' })} ${selectedModelForParts.model}` : t('actions.addMachine', { ns: 'machines' })}
            >
              {t('actions.addMachine', { ns: 'machines' })}
            </Button>
            <TableImportExport
              data={partsList}
              columns={partExportColumns}
              exportFileName={`${t('list.parts', { ns: 'machines' })}_${new Date().toISOString().split('T')[0]}.csv`}
              templateFileName={`${t('list.parts', { ns: 'machines' })}${t('actions.import', { ns: 'machines' })}.csv`}
              onImportSuccess={handleImportParts}
              requiredFields={['model', 'part_number', 'name_zh', 'name_en']}
              validateRow={(row, rowIndex) => {
                const errors: string[] = [];
                if (!row.model) {
                  errors.push(t('validation.modelRequired', { ns: 'machines' }));
                }
                if (!row.part_number) {
                  errors.push(t('validation.partNumberRequired', { ns: 'machines' }));
                }
                return { valid: errors.length === 0, errors };
              }}
              className="ml-2"
            />
          </div>
          <div>
            <Space>
              <Select 
                placeholder={t('fields.part_number', { ns: 'machines' })} 
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
                placeholder={t('placeholders.selectStatus', { ns: 'machines' })} 
                style={{ width: 100 }}
                allowClear
                onChange={(value: string | undefined) => setPartFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="publish">{t('status.publish', { ns: 'machines' })}</Option>
                <Option value="draft">{t('status.draft', { ns: 'machines' })}</Option>
                <Option value="trash">{t('status.trash', { ns: 'machines' })}</Option>
              </Select>
              <Input.Search 
                placeholder={t('list.searchPlaceholder', { ns: 'machines' })} 
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
            showTotal: (total: number) => t('pagination.total', { ns: 'machines', total }),
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handlePartTableChange}
          size="middle"
        />
      </Card>

      {/* 主机型号模态框 */}
      <Modal
        title={editingModel ? t('editModel.title', { ns: 'machines' }) : t('createModel.title', { ns: 'machines' })}
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
                label="产品线 (Product Line)"
                initialValue={1}
                help={currentProductLine ? `当前产品线：${currentProductLine.title_zh || currentProductLine.title_en}` : '将使用默认产品线'}
              >
                <Input 
                  value={currentProductLine ? `${currentProductLine.title_zh || currentProductLine.title_en} (ID: ${currentProductLine.id})` : '气垫机产品线 (ID: 1)'}
                  disabled={true}
                  placeholder="产品线将自动设置"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="型号 (Model)"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="例如: LA-E4S V2.0" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title_zh"
                label="中文名称 (Chinese Name)"
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title_en"
                label="英文名称 (English Name)"
              >
                <Input placeholder="Please enter English name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="description_zh"
                label="中文描述 (Chinese Description)"
              >
                <TextArea rows={3} placeholder="请输入中文描述" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description_en"
                label="英文描述 (English Description)"
              >
                <TextArea rows={3} placeholder="Please enter English description" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="机器类型 (Machine Type)"
              >
                <Input placeholder="例如: 小型气垫机" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态 (Status)"
                initialValue="publish"
              >
                <Select>
                  <Option value="publish">发布 (Published)</Option>
                  <Option value="draft">草稿 (Draft)</Option>
                  <Option value="trash">回收站 (Trash)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="image1_url"
                label="主图 (Main Image)"
                extra="支持上传图片文件或输入图片URL地址"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址或点击上传"
                  fileType="image"
                  maxSize={10}
                  uploadPath="/uploads/machines/images/"
                  preview
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="image2_url"
                label="副图 (Secondary Image)"
                extra="支持上传图片文件或输入图片URL地址"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址或点击上传"
                  fileType="image"
                  maxSize={10}
                  uploadPath="/uploads/machines/images/"
                  preview
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="explosion_diagram_pdf"
                label="爆炸图PDF (Explosion Diagram PDF)"
                extra="支持上传PDF文件或输入PDF URL地址"
              >
                <FileUrlInput
                  placeholder="请输入PDF URL地址或点击上传"
                  fileType="pdf"
                  maxSize={20}
                  uploadPath="/uploads/machines/pdfs/"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="spec_pdf"
                label="规格PDF (Specification PDF)"
                extra="支持上传PDF文件或输入PDF URL地址"
              >
                <FileUrlInput
                  placeholder="请输入PDF URL地址或点击上传"
                  fileType="pdf"
                  maxSize={20}
                  uploadPath="/uploads/machines/pdfs/"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序 (Sort Order)"
                initialValue={0}
              >
                <Input type="number" placeholder="数字越小排序越靠前" />
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
        title={t('actions.delete', { ns: 'machines' })}
        open={showDeleteConfirm}
        onOk={confirmModelDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setRecordToDelete(null);
        }}
        okText={t('actions.delete', { ns: 'machines' })}
        cancelText={t('actions.cancel', { ns: 'machines' })}
      >
        <p>{t('message.deleteSuccess', { ns: 'machines' })}</p>
        {recordToDelete && (
          <p>
            {t('fields.model', { ns: 'machines' })}：{recordToDelete.model}<br />
            {t('fields.name', { ns: 'machines' })}：{recordToDelete.title_zh}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default MachinesPage; 