import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Select,
  Space,
  Divider,
  Row,
  Col,
  InputNumber,
  Radio,
  Tabs,
  Tag,
  Table,
  Modal,
  AutoComplete,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, SyncOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import FileUploader from '../../components/common/FileUploader';
import FileUrlInput from '../../components/common/FileUrlInput';
import CRMDataFetcher from '../../components/common/CRMDataFetcher';
import { sparePartService, sparePartModelService, SparePartFormData } from '../../services/admin-spare-part.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { TextArea } = Input;
const { Option } = Select;

// 必选备件项接口
interface RequiredPartItem {
  key: string;
  part_number: string;
  quantity: number;
}

const SparePartEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [autoConvert, setAutoConvert] = useState(true); // 自动公英制转换
  const [requiredParts, setRequiredParts] = useState<RequiredPartItem[]>([]); // 必选备件列表

  // 智能提示功能状态
  const [selectedProductLineId, setSelectedProductLineId] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [sparePartModelOptions, setSparePartModelOptions] = useState<Array<{value: string}>>([]);
  const [sparePartOptions, setSparePartOptions] = useState<Array<{value: string}>>([]);
  const [sparePartNameZhOptions, setSparePartNameZhOptions] = useState<Array<{value: string}>>([]);
  const [sparePartNameEnOptions, setSparePartNameEnOptions] = useState<Array<{value: string}>>([]);
  const [sparePartSpecOptions, setSparePartSpecOptions] = useState<Array<{value: string}>>([]);
  const [sparePartSpecImperialOptions, setSparePartSpecImperialOptions] = useState<Array<{value: string}>>([]);

  // 适配机型选项状态
  const [appModelOptions, setAppModelOptions] = useState<Array<{value: string, label: string}>>([]);

  const isEditMode = !!id;
  const productLineFromUrl = searchParams.get('product_line_id');

  // 公英制转换系数
  const CONVERSIONS = {
    // 重量：kg to lbs
    KG_TO_LBS: 2.20462,
    // 尺寸：cm to inch
    CM_TO_INCH: 0.393701,
  };

  // 获取备件型号选项
  const fetchSparePartModels = async (productLineId: number) => {
    try {
      console.log('[SparePartEditPage] 获取备件型号', { productLineId });
      
      const response = await sparePartModelService.getSparePartModels({
        page: 1,
        page_size: 100,
        product_line_id: productLineId,
        status: 'publish'
      });
      
      console.log('[SparePartEditPage] 备件型号API响应', response);
      
      const models = response.items || [];
      const modelOptions = models.map(model => ({
        value: model.model
      }));
      
      console.log('[SparePartEditPage] 处理后的型号选项', { modelOptions: modelOptions.length });
      
      setSparePartModelOptions(modelOptions);
      
    } catch (error) {
      console.error('[SparePartEditPage] 获取备件型号失败:', error);
      setSparePartModelOptions([]);
    }
  };

  // 获取备件上下文数据用于智能提示
  const fetchSparePartContextData = async (productLineId: number, model?: string) => {
    try {
      console.log('[SparePartEditPage] 获取备件上下文数据', { productLineId, model });
      
      const queryParams: any = {
        page: 1,
        page_size: 100,
        product_line_id: productLineId,
        status: 'publish'
      };
      
      // 如果有指定的型号，添加到查询参数中进行过滤
      if (model) {
        queryParams.model = model;
      }
      
      const response = await sparePartService.getSpareParts(queryParams);
      
      console.log('[SparePartEditPage] 备件上下文数据API响应', response);
      
      const spareParts = response.items || [];
      
      // 提取料号选项（去重）
      const partOptions = [...new Set(
        spareParts
          .filter(part => part.part_number)
          .map(part => part.part_number)
      )].map(partNumber => ({ value: partNumber }));
      
      // 提取中文名称选项（去重）
      const nameZhOptions = [...new Set(
        spareParts
          .filter(part => part.name_zh)
          .map(part => part.name_zh)
      )].map(name => ({ value: name }));
      
      // 提取英文名称选项（去重）
      const nameEnOptions = [...new Set(
        spareParts
          .filter(part => part.name_en)
          .map(part => part.name_en)
      )].map(name => ({ value: name }));
      
      // 提取规格选项（去重）
      const specOptions = [...new Set(
        spareParts
          .filter(part => part.spec)
          .map(part => part.spec)
      )].map(spec => ({ value: spec }));
      
      // 提取英制规格选项（去重）
      const specImperialOptions = [...new Set(
        spareParts
          .filter(part => part.spec_imperial)
          .map(part => part.spec_imperial)
      )].map(spec => ({ value: spec }));
      
      console.log('[SparePartEditPage] 处理后的选项', {
        partOptions: partOptions.length,
        nameZhOptions: nameZhOptions.length,
        nameEnOptions: nameEnOptions.length,
        specOptions: specOptions.length,
        specImperialOptions: specImperialOptions.length
      });
      
      // 更新状态
      setSparePartOptions(partOptions);
      setSparePartNameZhOptions(nameZhOptions);
      setSparePartNameEnOptions(nameEnOptions);
      setSparePartSpecOptions(specOptions);
      setSparePartSpecImperialOptions(specImperialOptions);
      
    } catch (error) {
      console.error('[SparePartEditPage] 获取备件上下文数据失败:', error);
      // 清空所有选项
      setSparePartOptions([]);
      setSparePartNameZhOptions([]);
      setSparePartNameEnOptions([]);
      setSparePartSpecOptions([]);
      setSparePartSpecImperialOptions([]);
    }
  };

  // 获取适配机型选项（主机型号和配件型号）
  const fetchAppModelOptions = async (productLineId?: number) => {
    try {
      console.log('[SparePartEditPage] 获取适配机型选项');
      
      // 直接调用筛选选项API端点
      const token = localStorage.getItem('admin_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/wp-json/bjt/v1';
      
      const response = await fetch(`${baseUrl}/spare-parts/filter-options?lang=zh`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      console.log('[SparePartEditPage] 筛选选项API响应状态', response.status);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const jsonData = await response.json();
      console.log('[SparePartEditPage] 筛选选项API响应数据', jsonData);
      
      if (jsonData.success && jsonData.data) {
        const { hostModels = [], accessoryModels = [] } = jsonData.data;
        
        // 合并主机型号和配件型号，并添加标识前缀
        const modelOptions = [
          // 主机型号
          ...hostModels.map(model => ({
            value: model,
            label: `${model} (主机)`
          })),
          // 配件型号
          ...accessoryModels.map(model => ({
            value: model,
            label: `${model} (配件)`
          }))
        ].sort((a, b) => a.label.localeCompare(b.label));
        
        console.log('[SparePartEditPage] 处理后的适配机型选项', {
          总数: modelOptions.length,
          主机型号数: hostModels.length,
          配件型号数: accessoryModels.length
        });
        
        setAppModelOptions(modelOptions);
      } else {
        console.warn('[SparePartEditPage] 筛选选项API返回空数据，使用备用选项');
        // 使用备用的适配机型选项
        setAppModelOptions([
          { value: 'LA-E4S', label: 'LA-E4S (主机)' },
          { value: 'LA-E5P', label: 'LA-E5P (主机)' },
          { value: 'LA-E6L', label: 'LA-E6L (主机)' },
          { value: 'EC401', label: 'EC401 (配件)' },
          { value: 'EC402', label: 'EC402 (配件)' },
        ]);
      }
    } catch (error) {
      console.error('[SparePartEditPage] 获取适配机型选项失败:', error);
      // 失败时使用备用选项
      setAppModelOptions([
        { value: 'LA-E4S', label: 'LA-E4S (主机)' },
        { value: 'LA-E5P', label: 'LA-E5P (主机)' },
        { value: 'LA-E6L', label: 'LA-E6L (主机)' },
        { value: 'EC401', label: 'EC401 (配件)' },
        { value: 'EC402', label: 'EC402 (配件)' },
      ]);
    }
  };

  // 产品线变化处理
  const handleProductLineChange = (productLineId: number) => {
    console.log('[SparePartEditPage] 产品线变化', { productLineId });
    
    setSelectedProductLineId(productLineId);
    
    // 清空相关字段 - 备件表确实有model字段
    form.setFieldsValue({
      model: undefined,
      part_number: '',
      app_model: undefined
    });
    
    // 清空选项
    setSelectedModel(undefined);
    setSparePartModelOptions([]);
    setSparePartOptions([]);
    setSparePartNameZhOptions([]);
    setSparePartNameEnOptions([]);
    setSparePartSpecOptions([]);
    setSparePartSpecImperialOptions([]);
    setAppModelOptions([]);
    
    // 重新加载数据
    if (productLineId) {
      fetchSparePartModels(productLineId);
      fetchSparePartContextData(productLineId); // 获取备件上下文数据
      fetchAppModelOptions(productLineId); // 获取适配机型选项
    }
  };

  // 型号变化处理
  const handleModelChange = (model: string) => {
    console.log('[SparePartEditPage] 型号变化', { model });
    setSelectedModel(model);
    
    // 清空料号字段
    form.setFieldValue('part_number', '');
    
    // 清空料号相关的智能提示选项
    setSparePartOptions([]);
    
    // 重新加载该型号下的数据
    if (selectedProductLineId && model) {
      fetchSparePartContextData(selectedProductLineId, model);
    }
  };

  // 配件型号选项
  const modelOptions = [
    { value: 'SP-001', label: 'SP-001 标准备件' },
    { value: 'SP-002', label: 'SP-002 易损备件' },
    { value: 'SP-003', label: 'SP-003 关键备件' },
  ];

  // 初始化钩子 - 组件加载时的逻辑
  useEffect(() => {
    console.log('[SparePartEditPage] 组件初始化', { isEditMode, id });
    const initializeComponent = async () => {
      // 加载产品线数据
      await loadProductLines();
      
      // 设置默认产品线
      const defaultProductLineId = productLineFromUrl ? parseInt(productLineFromUrl) : 1;
      setSelectedProductLineId(defaultProductLineId);
      
      // 如果是编辑模式，加载备件数据
      if (isEditMode && id) {
        await loadSparePart(parseInt(id));
      } else {
        // 如果是新建模式，设置默认值
        console.log('[SparePartEditPage] 新建模式，设置默认值');
        form.setFieldsValue({
          product_line_id: defaultProductLineId,
          status: 'publish',
          unit: 'pcs',
          is_consumable: 1, // 默认易损
          pcs_per_box: 1
        });
      }
      
      // 加载智能提示数据
      fetchSparePartModels(defaultProductLineId);
      fetchSparePartContextData(defaultProductLineId);
      fetchAppModelOptions(defaultProductLineId);
    };
    
    initializeComponent();
  }, [id, isEditMode, productLineFromUrl]);

  // 产品线变化时的智能提示数据更新
  useEffect(() => {
    if (selectedProductLineId) {
      console.log('[SparePartEditPage] 产品线变化，更新智能提示', selectedProductLineId);
      fetchSparePartModels(selectedProductLineId);
      fetchSparePartContextData(selectedProductLineId, selectedModel);
      fetchAppModelOptions(selectedProductLineId);
    }
  }, [selectedProductLineId]);

  // 型号变化时的智能提示数据更新
  useEffect(() => {
    if (selectedProductLineId && selectedModel) {
      console.log('[SparePartEditPage] 型号变化，更新智能提示', { selectedProductLineId, selectedModel });
      fetchSparePartContextData(selectedProductLineId, selectedModel);
    }
  }, [selectedProductLineId, selectedModel]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines({
        page: 1,
        per_page: 100,
        status: 'publish'
      });
      setProductLines(response.items);
    } catch (error) {
      console.error('[SparePartEditPage] 加载产品线失败:', error);
      message.error('加载产品线失败');
    }
  };

  const loadSparePart = async (sparePartId: number) => {
    try {
      setLoading(true);
      console.log('[SparePartEditPage] 加载备件数据', { sparePartId });
      
      const response = await sparePartService.getSparePart(sparePartId);
      console.log('[SparePartEditPage] 备件数据响应', response);

      // 处理多选字段，将字符串转换为数组
      const processedData = {
        ...response,
        // 处理适配机型字段 - 确保为数组格式
        app_model: (() => {
          if (!response.app_model) return [];
          if (Array.isArray(response.app_model)) return response.app_model;
          
          // 如果是字符串，去除引号并分割
          let modelStr = response.app_model.toString();
          // 去除所有引号
          modelStr = modelStr.replace(/"/g, '');
          // 按逗号分割并清理空白
          return modelStr.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        })(),
      };

      console.log('[SparePartEditPage] 处理后的数据:', {
        原始app_model: response.app_model,
        处理后app_model: processedData.app_model,
        完整数据: processedData
      });

      // 设置表单数据
      form.setFieldsValue(processedData);
      
      // 添加延迟确保表单值已设置
      setTimeout(() => {
        console.log('[SparePartEditPage] 验证表单值是否正确设置:', {
          product_line_id: form.getFieldValue('product_line_id'),
          part_number: form.getFieldValue('part_number'),
          model: form.getFieldValue('model'),
          name_zh: form.getFieldValue('name_zh'),
          name_en: form.getFieldValue('name_en'),
          app_model: form.getFieldValue('app_model'),
          is_consumable: form.getFieldValue('is_consumable')
        });
        
        // 如果关键字段为空，重新设置
        const criticalFields = ['product_line_id', 'part_number', 'name_zh', 'name_en'];
        let needsReset = false;
        const resetData: any = {};
        
        criticalFields.forEach(field => {
          if (!form.getFieldValue(field) && processedData[field]) {
            console.warn(`[SparePartEditPage] 字段 ${field} 未正确设置，重新设置`);
            resetData[field] = processedData[field];
            needsReset = true;
          }
        });
        
        if (needsReset) {
          form.setFieldsValue(resetData);
          console.log('[SparePartEditPage] 重新设置字段:', resetData);
        }
      }, 100);
      
      // 设置产品线ID用于智能提示
      if (response.product_line_id) {
        setSelectedProductLineId(response.product_line_id);
      }
      
      // 解析必选备件 - 添加安全检查
      console.log('[SparePartEditPage] 原始必选备件数据:', {
        required_parts: response.required_parts,
        required_parts_type: typeof response.required_parts,
        required_quantity: response.required_quantity,
        required_quantity_type: typeof response.required_quantity
      });
      
      if (response.required_parts && response.required_quantity) {
        let partNumbers: string[] = [];
        let quantities: number[] = [];
        
        // 处理required_parts - 可能是数组或逗号分隔的字符串
        if (Array.isArray(response.required_parts)) {
          partNumbers = response.required_parts.filter(pn => pn && pn.trim());
        } else if (typeof response.required_parts === 'string' && response.required_parts.trim()) {
          partNumbers = response.required_parts.split(',').map(pn => pn.trim()).filter(pn => pn);
        }
        
        // 处理required_quantity - 可能是字符串或数组
        if (Array.isArray(response.required_quantity)) {
          quantities = response.required_quantity.map(q => parseInt(q) || 1);
        } else if (typeof response.required_quantity === 'string' && response.required_quantity.trim()) {
          quantities = response.required_quantity.split(',').map(q => parseInt(q.trim()) || 1);
        }
        
        // 确保数量数组长度与料号数组匹配
        while (quantities.length < partNumbers.length) {
          quantities.push(1);
        }
        
        const parsedRequiredParts = partNumbers.map((partNumber: string, index: number) => ({
          key: `required_${index}`,
          part_number: partNumber,
          quantity: quantities[index] || 1,
        }));
        
        console.log('[SparePartEditPage] 解析后的必选备件:', parsedRequiredParts);
        setRequiredParts(parsedRequiredParts);
      } else {
        // 如果数据为空或格式不正确，设置为空数组
        console.log('[SparePartEditPage] 必选备件数据为空或格式不正确，设置为空数组');
        setRequiredParts([]);
      }
    } catch (error) {
      console.error('[SparePartEditPage] 加载备件数据失败:', error);
      message.error('加载备件数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 公英制单位自动转换 - 重量
  const handleWeightChange = (field: string, value: number) => {
    if (!autoConvert || !value) return;

    if (field.endsWith('_kg')) {
      const lbsField = field.replace('_kg', '_lbs');
      const convertedValue = Math.round(value * CONVERSIONS.KG_TO_LBS * 1000) / 1000;
      form.setFieldValue(lbsField, convertedValue);
    } else if (field.endsWith('_lbs')) {
      const kgField = field.replace('_lbs', '_kg');
      const convertedValue = Math.round(value / CONVERSIONS.KG_TO_LBS * 1000) / 1000;
      form.setFieldValue(kgField, convertedValue);
    }
  };

  // CRM数据获取成功处理
  const handleCRMDataFetched = (data: any) => {
    if (data) {
      // 自动填充从CRM获取的数据
      const updates: any = {};
      
      if (data.name_zh) updates.name_zh = data.name_zh;
      if (data.name_en) updates.name_en = data.name_en;
      if (data.spec) updates.spec = data.spec;
      if (data.spec_imperial) updates.spec_imperial = data.spec_imperial;
      if (data.net_weight_kg) updates.net_weight_kg = data.net_weight_kg;
      if (data.gross_weight_kg) updates.gross_weight_kg = data.gross_weight_kg;
      if (data.package_size_cm) updates.package_size_cm = data.package_size_cm;
      
      form.setFieldsValue(updates);
      message.success('CRM数据获取成功，已自动填充相关字段');
    }
  };

  // 添加必选备件
  const addRequiredPart = () => {
    const newItem: RequiredPartItem = {
      key: `required_${Date.now()}`,
      part_number: '',
      quantity: 1,
    };
    setRequiredParts([...requiredParts, newItem]);
  };

  // 删除必选备件
  const removeRequiredPart = (key: string) => {
    setRequiredParts(requiredParts.filter(item => item.key !== key));
  };

  // 更新必选备件
  const updateRequiredPart = (key: string, field: keyof RequiredPartItem, value: any) => {
    setRequiredParts(requiredParts.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  // 必选备件表格列定义
  const requiredPartsColumns = [
    {
      title: '料号',
      dataIndex: 'part_number',
      key: 'part_number',
      render: (text: string, record: RequiredPartItem) => {
        return (
          <Input
            value={text}
            placeholder="输入料号"
            onChange={(e: any) => updateRequiredPart(record.key, 'part_number', e.target.value)}
          />
        );
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value: number, record: RequiredPartItem) => {
        return (
          <InputNumber
            value={value}
            min={1}
            style={{ width: '100%' }}
            onChange={(val: any) => updateRequiredPart(record.key, 'quantity', val || 1)}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: RequiredPartItem) => {
        return (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeRequiredPart(record.key)}
          />
        );
      },
    },
  ];

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      console.log('[SparePartEditPage] 提交表单数据', values);
      
      // 🔍 详细调试is_consumable字段
      console.log('🔍 [DEBUG] is_consumable字段调试:', {
        '表单原始值': values.is_consumable,
        '字段类型': typeof values.is_consumable,
        '是否为数字': typeof values.is_consumable === 'number',
        '值对照': {
          '0 = 不显示': values.is_consumable === 0,
          '1 = 易损': values.is_consumable === 1,
          '2 = 非易损': values.is_consumable === 2
        }
      });

      // 客户端验证
      if (!values.product_line_id) {
        message.error('请选择产品线');
        return;
      }
      if (!values.part_number) {
        message.error('请输入料号');
        return;
      }
      if (!values.name_zh) {
        message.error('请输入中文名称');
        return;
      }
      if (!values.name_en) {
        message.error('请输入英文名称');
        return;
      }

      // 处理必选备件数据
      const partNumbers = requiredParts.map(item => item.part_number).filter(pn => pn.trim());
      const quantities = requiredParts.map(item => item.quantity.toString()).filter((_, index) => 
        requiredParts[index].part_number.trim()
      );

      // 转换表单数据为API格式
      const formData: SparePartFormData = {
        product_line_id: values.product_line_id,
        app_model: Array.isArray(values.app_model) ? values.app_model.join(',') : values.app_model || '',
        model: values.model || '',
        is_consumable: parseInt(values.is_consumable),
        image_url: values.image_url || '',
        part_number: values.part_number,
        name_zh: values.name_zh,
        name_en: values.name_en,
        spec: values.spec || '',
        spec_imperial: values.spec_imperial || '',
        app_sn: Array.isArray(values.app_sn) ? values.app_sn.join(',') : values.app_sn || '',
        package_size_cm: values.package_size_cm || '',
        package_size_inch: values.package_size_inch || '',
        net_weight_kg: values.net_weight_kg || 0,
        net_weight_lbs: values.net_weight_lbs || 0,
        gross_weight_kg: values.gross_weight_kg || 0,
        gross_weight_lbs: values.gross_weight_lbs || 0,
        pcs_per_box: values.pcs_per_box || 1,
        required_parts: partNumbers.join(','),
        required_quantity: quantities.join(','),
        status: values.status,
        unit: values.unit,
      };
      
      // 🔍 再次确认formData中的is_consumable值
      console.log('🔍 [DEBUG] 发送到API的formData.is_consumable:', {
        'formData.is_consumable': formData.is_consumable,
        '类型': typeof formData.is_consumable,
        '完整formData': formData
      });

      if (isEditMode && id) {
        console.log('🔍 [DEBUG] 调用updateSparePart API，ID:', id);
        await sparePartService.updateSparePart(parseInt(id), formData);
        message.success('备件更新成功');
      } else {
        console.log('🔍 [DEBUG] 调用createSparePart API');
        await sparePartService.createSparePart(formData);
        message.success('备件创建成功');
      }

      navigate('/admin/spare-parts');
    } catch (error: any) {
      console.error('[SparePartEditPage] 提交失败:', error);
      
      // 详细错误处理
      if (error?.response?.data?.message) {
        message.error(`提交失败: ${error.response.data.message}`);
      } else if (error?.message) {
        message.error(`提交失败: ${error.message}`);
      } else {
        message.error(isEditMode ? '更新备件失败' : '创建备件失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/spare-parts');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="spare-part-edit-page">
      <AdminPageHeader
        title={isEditMode ? '编辑备件' : '新增备件'}
        description={isEditMode ? `编辑备件 ID: ${id}` : '创建新的备件'}
        extra={
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
        }
      />

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={submitting}
          scrollToFirstError
        >
          <Tabs
            defaultActiveKey="basic"
            size="large"
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <div>
                    <Row gutter={24}>
                      <Col span={8}>
                        <Form.Item
                          label="所属产品线"
                          name="product_line_id"
                          rules={[{ required: true, message: '请选择所属产品线' }]}
                        >
                          <Select placeholder="请选择产品线" onChange={handleProductLineChange}>
                            {productLines && productLines.map((line) => (
                              <Option key={line.id} value={line.id}>
                                {line.title_zh || line.title_en || `产品线${line.id}`}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Form.Item
                          label="料号 (Part Number)"
                          name="part_number"
                          rules={[{ required: true, message: '请输入料号' }]}
                          extra={`参考该产品线下${selectedModel ? '同型号' : ''}的备件料号，当前共 ${sparePartOptions.length} 个料号`}
                        >
                          <div style={{ display: 'flex', gap: 8 }}>
                            <AutoComplete
                              options={sparePartOptions}
                              placeholder="请输入料号，可参考下拉提示"
                              style={{ flex: 1 }}
                              value={form.getFieldValue('part_number')}
                              onChange={(value) => form.setFieldValue('part_number', value)}
                              filterOption={(inputValue, option) =>
                                option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                              }
                            />
                            <CRMDataFetcher
                              partNumber={form ? (form.getFieldValue('part_number') || '') : ''}
                              onDataFetched={handleCRMDataFetched}
                              onError={(error: string) => message.error(`CRM数据获取失败: ${error}`)}
                              fields={['name_zh', 'name_en', 'spec', 'spec_imperial', 'net_weight_kg', 'gross_weight_kg', 'package_size_cm']}
                            />
                          </div>
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Form.Item
                          label="配件型号 (Model)"
                          name="model"
                          extra={`可选字段。参考该产品线下的备件型号，当前共 ${sparePartModelOptions.length} 个型号`}
                        >
                          <AutoComplete
                            options={sparePartModelOptions}
                            placeholder="请选择配件型号，可参考下拉提示"
                            value={form.getFieldValue('model')}
                            onChange={(value) => form.setFieldValue('model', value)}
                            onSelect={handleModelChange}
                            filterOption={(inputValue, option) =>
                              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="中文名称 (Chinese Name)"
                          name="name_zh"
                          rules={[{ required: true, message: '请输入中文名称' }]}
                          extra={`参考该产品线下${selectedModel ? '同型号' : ''}的备件中文名称，当前共 ${sparePartNameZhOptions.length} 个名称`}
                        >
                          <AutoComplete
                            options={sparePartNameZhOptions}
                            placeholder="请输入中文名称，可参考下拉提示"
                            value={form.getFieldValue('name_zh')}
                            onChange={(value) => form.setFieldValue('name_zh', value)}
                            filterOption={(inputValue, option) =>
                              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="英文名称 (English Name)"
                          name="name_en"
                          rules={[{ required: true, message: '请输入英文名称' }]}
                          extra={`参考该产品线下${selectedModel ? '同型号' : ''}的备件英文名称，当前共 ${sparePartNameEnOptions.length} 个名称`}
                        >
                          <AutoComplete
                            options={sparePartNameEnOptions}
                            placeholder="请输入英文名称，可参考下拉提示"
                            value={form.getFieldValue('name_en')}
                            onChange={(value) => form.setFieldValue('name_en', value)}
                            filterOption={(inputValue, option) =>
                              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Form.Item
                          label="是否易损备件 (Is Consumable)"
                          name="is_consumable"
                          rules={[{ required: true, message: '请选择是否易损备件' }]}
                        >
                          <Radio.Group>
                            <Radio value={1}>易损</Radio>
                            <Radio value={2}>非易损</Radio>
                            <Radio value={0}>不显示备件</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Form.Item
                          label="状态 (Status)"
                          name="status"
                          rules={[{ required: true, message: '请选择状态' }]}
                        >
                          <Select placeholder="请选择状态">
                            <Option value="publish">已发布 (Published)</Option>
                            <Option value="draft">草稿 (Draft)</Option>
                            <Option value="trash">回收站 (Trash)</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Form.Item
                          label="单位 (Unit)"
                          name="unit"
                          rules={[{ required: true, message: '请选择单位' }]}
                        >
                          <Select placeholder="请选择单位">
                            <Option value="pcs">件 (Pieces)</Option>
                            <Option value="roll">卷 (Roll)</Option>
                            <Option value="box">箱 (Box)</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="适配机型 (Compatible Models)"
                          name="app_model"
                          extra="支持多个机型，可多选"
                        >
                          <Select 
                            mode="multiple" 
                            placeholder="选择适配机型"
                            style={{ width: '100%' }}
                          >
                            {appModelOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="适配序列号 (Compatible Serial Numbers)"
                          name="app_sn"
                          extra="多个序列号用逗号分隔"
                        >
                          <Input placeholder="例如: SN001,SN002,SN003" />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="规格参数(公制) (Specification - Metric)"
                          name="spec"
                          extra={`参考该产品线下${selectedModel ? '同型号' : ''}的备件规格，当前共 ${sparePartSpecOptions.length} 个规格`}
                        >
                          <AutoComplete
                            options={sparePartSpecOptions}
                            placeholder="例如: 12V 100mA, 尺寸: 50x30x20mm"
                            value={form.getFieldValue('spec')}
                            onChange={(value) => form.setFieldValue('spec', value)}
                            filterOption={(inputValue, option) =>
                              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="规格参数(英制) (Specification - Imperial)"
                          name="spec_imperial"
                          extra={`参考该产品线下${selectedModel ? '同型号' : ''}的备件英制规格，当前共 ${sparePartSpecImperialOptions.length} 个规格`}
                        >
                          <AutoComplete
                            options={sparePartSpecImperialOptions}
                            placeholder="例如: 12V 100mA, Size: 2x1.2x0.8inch"
                            value={form.getFieldValue('spec_imperial')}
                            onChange={(value) => form.setFieldValue('spec_imperial', value)}
                            filterOption={(inputValue, option) =>
                              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item
                          label="产品图片 (Product Image)"
                          name="image_url"
                        >
                          <FileUrlInput
                            placeholder="请输入图片URL或点击上传"
                            uploadPath="/uploads/spare-parts/images/"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'packaging',
                label: '包装物流信息',
                children: (
                  <div>
                    <Divider orientation="left">
                      包装信息
                      <Space style={{ marginLeft: 16 }}>
                        <span>自动公英制转换:</span>
                        <Radio.Group 
                          value={autoConvert} 
                          onChange={(e: any) => setAutoConvert(e.target.value)}
                          size="small"
                        >
                          <Radio value={true}>开启</Radio>
                          <Radio value={false}>关闭</Radio>
                        </Radio.Group>
                        <SyncOutlined style={{ color: autoConvert ? '#1890ff' : '#ccc' }} />
                      </Space>
                    </Divider>

                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item
                          label="包装尺寸(cm)"
                          name="package_size_cm"
                        >
                          <Input placeholder="长×宽×高" />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="包装尺寸(inch)"
                          name="package_size_inch"
                        >
                          <Input placeholder="L×W×H" />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item
                          label="单件净重(kg)"
                          name="net_weight_kg"
                        >
                          <InputNumber 
                            min={0} 
                            precision={3} 
                            style={{ width: '100%' }}
                            onChange={(value: number) => handleWeightChange('net_weight_kg', value || 0)}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item
                          label="单件净重(lbs)"
                          name="net_weight_lbs"
                        >
                          <InputNumber 
                            min={0} 
                            precision={3} 
                            style={{ width: '100%' }}
                            onChange={(value: number) => handleWeightChange('net_weight_lbs', value || 0)}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item
                          label="包装毛重(kg)"
                          name="gross_weight_kg"
                        >
                          <InputNumber 
                            min={0} 
                            precision={3} 
                            style={{ width: '100%' }}
                            onChange={(value: number) => handleWeightChange('gross_weight_kg', value || 0)}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item
                          label="包装毛重(lbs)"
                          name="gross_weight_lbs"
                        >
                          <InputNumber 
                            min={0} 
                            precision={3} 
                            style={{ width: '100%' }}
                            onChange={(value: number) => handleWeightChange('gross_weight_lbs', value || 0)}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="单箱数量"
                          name="pcs_per_box"
                          rules={[{ required: true, message: '请输入单箱数量' }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'required',
                label: '必选备件',
                children: (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-base font-medium">必选备件管理</div>
                        <div className="text-sm text-gray-500">配置此备件必须配套的其他备件</div>
                      </div>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={addRequiredPart}
                      >
                        添加必选备件
                      </Button>
                    </div>

                    <Table
                      columns={requiredPartsColumns}
                      dataSource={requiredParts}
                      rowKey="key"
                      pagination={false}
                      locale={{ emptyText: '暂无必选备件，点击上方按钮添加' }}
                    />

                    {requiredParts.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded">
                        <div className="text-sm text-blue-800">
                          <strong>预览:</strong> 必选备件料号: {requiredParts && requiredParts.map(item => item.part_number).filter(pn => pn).join(', ')}
                          <br />
                          对应数量: {requiredParts && requiredParts.map(item => item.quantity).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />

          {/* 操作按钮 */}
          <Form.Item style={{ marginTop: 32, textAlign: 'center' }}>
            <Space size="large">
              <Button
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={submitting}
                size="large"
              >
                {isEditMode ? '保存更改' : '创建备件'}
              </Button>
              <Button onClick={handleBack} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SparePartEditPage;