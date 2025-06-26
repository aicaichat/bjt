import React, { useEffect, useState, useCallback } from 'react';
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
  Tabs,
  Spin,
  AutoComplete,
  Tag,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import DictionarySelect from '../../components/common/DictionarySelect';
import FileUrlInput from '../../components/common/FileUrlInput';
import { useAdminApi } from '../../hooks/useAdminApi';
import { consumableService, ConsumableFormData } from '../../services/admin-consumable.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import adminDictionaryService from '../../services/admin-dictionary.service';

const { Option } = Select;
const { TextArea } = Input;

const ConsumableEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const { t } = useAdminI18n();
  const [submitting, setSubmitting] = useState(false);

  // 智能提示功能状态
  const [selectedProductLineId, setSelectedProductLineId] = useState<number>(1);
  const [consumablePartOptions, setConsumablePartOptions] = useState<Array<{value: string}>>([]);
  const [consumableSpecOptions, setConsumableSpecOptions] = useState<Array<{value: string}>>([]);
  const [consumableSpecImperialOptions, setConsumableSpecImperialOptions] = useState<Array<{value: string}>>([]);
  const [consumableBrandOptions, setConsumableBrandOptions] = useState<Array<{value: string}>>([]);
  const [consumableMaterialOptions, setConsumableMaterialOptions] = useState<Array<{value: string}>>([]);
  
  // 袋型选项状态
  const [bagTypeOptions, setBagTypeOptions] = useState<Array<{code: string, name: string}>>([]);
  const [bagTypeLoading, setBagTypeLoading] = useState(false);

  // 材料选项状态
  const [materialOptions, setMaterialOptions] = useState<Array<{code: string, name: string}>>([]);
  const [materialLoading, setMaterialLoading] = useState(false);

  // 适配机型选项状态
  const [compatibleModelOptions, setCompatibleModelOptions] = useState<Array<{value: string, label: string}>>([]);
  const [compatibleModelLoading, setCompatibleModelLoading] = useState(false);

  const isEdit = !!id;
  const productLineFromUrl = searchParams.get('product_line_id');

  // 获取产品线列表
  const {
    data: productLineData,
    loading: productLineLoading
  } = useAdminApi(
    adminProductLineService.getProductLines.bind(adminProductLineService),
    {
      page: 1,
      per_page: 100,
      status: 'publish'
    }
  );

  // 获取耗材详情（编辑时）
  const {
    data: consumableData,
    loading: consumableLoading
  } = useAdminApi(
    () => isEdit ? consumableService.getConsumable(parseInt(id!)) : Promise.resolve(null),
    {},
    [id, isEdit]
  );

  // 使用useCallback定义fetchConsumableContextData函数
  const fetchConsumableContextData = useCallback(async (productLineId: number, model?: string) => {
    try {
      console.log('[ConsumableEditPage] 获取耗材上下文数据', { productLineId, model });
      
      const queryParams: any = {
        page: 1,
        per_page: 100,
        product_line_id: productLineId,
        status: 'publish'
      };
      
      if (model) {
        queryParams.model = model;
      }
      
      const response = await consumableService.getConsumables(queryParams);
      
      console.log('[ConsumableEditPage] 耗材上下文数据API响应', response);
      
      const consumables = response.items || [];
      
      // 提取料号选项（去重）
      const partOptions = [...new Set(
        consumables
          .filter(item => item.part_number)
          .map(item => item.part_number)
      )].map(partNumber => ({ value: partNumber }));
      
      // 提取规格选项（去重）
      const specOptions = [...new Set(
        consumables
          .filter(item => item.spec)
          .map(item => item.spec)
      )].map(spec => ({ value: spec }));
      
      // 提取英制规格选项（去重）
      const specImperialOptions = [...new Set(
        consumables
          .filter(item => item.spec_imperial)
          .map(item => item.spec_imperial)
      )].map(spec => ({ value: spec }));
      
      // 提取品牌选项（去重）
      const brandOptions = [...new Set(
        consumables
          .filter(item => item.brand)
          .map(item => item.brand)
      )].map(brand => ({ value: brand }));
      
      // 提取材质选项（去重）
      const materialOptions = [...new Set(
        consumables
          .filter(item => item.material)
          .map(item => item.material)
      )].map(material => ({ value: material }));
      
      console.log('[ConsumableEditPage] 处理后的选项', {
        partOptions: partOptions.length,
        specOptions: specOptions.length,
        specImperialOptions: specImperialOptions.length,
        brandOptions: brandOptions.length,
        materialOptions: materialOptions.length
      });
      
      // 更新状态
      setConsumablePartOptions(partOptions);
      setConsumableSpecOptions(specOptions);
      setConsumableSpecImperialOptions(specImperialOptions);
      setConsumableBrandOptions(brandOptions);
      setConsumableMaterialOptions(materialOptions);
      
    } catch (error) {
      console.error('[ConsumableEditPage] 获取耗材上下文数据失败:', error);
      // 清空所有选项
      setConsumablePartOptions([]);
      setConsumableSpecOptions([]);
      setConsumableSpecImperialOptions([]);
      setConsumableBrandOptions([]);
      setConsumableMaterialOptions([]);
    }
  }, []);

  // 获取适配机型数据 - 参考备件的实现方式
  const fetchCompatibleModels = useCallback(async (productLineId: number) => {
    try {
      setCompatibleModelLoading(true);
      console.log('[ConsumableEditPage] 获取适配机型选项, 产品线ID:', productLineId);
      
      // 直接调用筛选选项API端点
      const token = localStorage.getItem('admin_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/wp-json/bjt/v1';
      
      const response = await fetch(`${baseUrl}/consumables/filter-options?lang=zh&product_line_id=${productLineId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      console.log('[ConsumableEditPage] 筛选选项API响应状态', response.status);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const jsonData = await response.json();
      console.log('[ConsumableEditPage] 筛选选项API响应数据', jsonData);
      
      if (jsonData.success && jsonData.data) {
        const { hostModels = [], accessoryModels = [] } = jsonData.data;
        
        // 合并主机型号和配件型号，并添加标识前缀
        const modelOptions = [
          // 主机型号
          ...hostModels.map((model: string) => ({
            value: model,
            label: `${model} (主机)`
          })),
          // 配件型号
          ...accessoryModels.map((model: string) => ({
            value: model,
            label: `${model} (配件)`
          }))
        ].sort((a, b) => a.label.localeCompare(b.label));
        
        console.log('[ConsumableEditPage] 处理后的适配机型选项', {
          总数: modelOptions.length,
          主机型号数: hostModels.length,
          配件型号数: accessoryModels.length
        });
        
        setCompatibleModelOptions(modelOptions);
      } else {
        console.warn('[ConsumableEditPage] 筛选选项API返回空数据，使用备用选项');
        // 使用备用的适配机型选项 - 基于产品线提供不同的选项
        const fallbackOptions = productLineId === 1 ? [
          { value: 'LA-E4C', label: 'LA-E4C (主机)' },
          { value: 'LA-E4S V2.0', label: 'LA-E4S V2.0 (主机)' },
          { value: 'LA-E5P', label: 'LA-E5P (主机)' },
          { value: 'LA-F2', label: 'LA-F2 (主机)' },
          { value: 'LA-E4S(paper)', label: 'LA-E4S(paper) (配件)' },
        ] : [
          { value: 'HOST-001', label: 'HOST-001 (主机)' },
          { value: 'HOST-002', label: 'HOST-002 (主机)' },
          { value: 'ACC-001', label: 'ACC-001 (配件)' },
        ];
        
        setCompatibleModelOptions(fallbackOptions);
      }
    } catch (error) {
      console.error('[ConsumableEditPage] 获取适配机型选项失败:', error);
      // 失败时使用备用选项
      const fallbackOptions = [
        { value: 'LA-E4C', label: 'LA-E4C (主机)' },
        { value: 'LA-E4S V2.0', label: 'LA-E4S V2.0 (主机)' },
        { value: 'LA-E5P', label: 'LA-E5P (主机)' },
        { value: 'LA-F2', label: 'LA-F2 (主机)' },
        { value: 'LA-E4S(paper)', label: 'LA-E4S(paper) (配件)' },
      ];
      setCompatibleModelOptions(fallbackOptions);
    } finally {
      setCompatibleModelLoading(false);
    }
  }, []);

  // 使用useCallback定义handleProductLineChange函数
  const handleProductLineChange = useCallback((productLineId: number) => {
    console.log('[ConsumableEditPage] 产品线变化', { productLineId });
    setSelectedProductLineId(productLineId);
    
    // 清空相关字段
    form.setFieldValue('model', '');
    form.setFieldValue('part_number', '');
    form.setFieldValue('app_model', []);  // 清空适配机型为空数组
    
    // 清空所有智能提示选项
    setConsumablePartOptions([]);
    setConsumableSpecOptions([]);
    setConsumableSpecImperialOptions([]);
    setConsumableBrandOptions([]);
    setConsumableMaterialOptions([]);
    setCompatibleModelOptions([]);  // 清空适配机型选项
    
    // 加载产品线级别的数据
    fetchConsumableContextData(productLineId);
    // 加载适配机型数据
    fetchCompatibleModels(productLineId);
  }, [fetchConsumableContextData, fetchCompatibleModels, form]);

  // 使用useCallback定义handleSpecChange函数
  const handleSpecChange = useCallback((spec: string) => {
    console.log('[ConsumableEditPage] 规格描述变化', { spec });
    
    // 清空料号字段
    form.setFieldValue('part_number', '');
    
    // 清空料号相关的智能提示选项
    setConsumablePartOptions([]);
    
    // 重新加载该规格下的数据
    if (selectedProductLineId && spec) {
      fetchConsumableContextData(selectedProductLineId, spec);
    }
  }, [selectedProductLineId, fetchConsumableContextData, form]);

  // 获取袋型数据
  const fetchBagTypes = useCallback(async () => {
    try {
      setBagTypeLoading(true);
      console.log('[ConsumableEditPage] 获取袋型数据');
      
      const response = await adminDictionaryService.general.getBagTypes('zh');
      console.log('[ConsumableEditPage] 袋型数据响应:', response);
      
      // 🔥 修复：显示code字段和英文名称，格式为 "Code - English Name"
      const bagTypeOptions = response.map(item => ({
        code: item.code,
        name: `${item.code} - ${item.name_en || item.name || item.code}`
      }));
      
      setBagTypeOptions(bagTypeOptions);
    } catch (error) {
      console.error('[ConsumableEditPage] 获取袋型数据失败:', error);
      // 降级到硬编码选项 - 使用形状表的code字段和英文名称
      setBagTypeOptions([
        { code: 'MEX', name: 'MEX - Air Pillow' },
        { code: 'MEY', name: 'MEY - Precut Air Pillow' },
        { code: 'MFB', name: 'MFB - Bubble' },
        { code: 'MFC', name: 'MFC - Tube' },
        { code: 'MFF', name: 'MFF - Bubble' },
        { code: 'MEX_PAPER', name: 'MEX_PAPER - Paper Air Pillow' }
      ]);
    } finally {
      setBagTypeLoading(false);
    }
  }, []);

  // 获取材料数据
  const fetchMaterials = useCallback(async () => {
    try {
      setMaterialLoading(true);
      console.log('[ConsumableEditPage] 获取材料数据');
      
      const response = await adminDictionaryService.general.getMaterials('zh');
      console.log('[ConsumableEditPage] 材料数据响应:', response);
      
      // 🔥 修复：显示code字段，格式为 "Code"
      const materialOptions = response.map(item => ({
        code: item.code,
        name: item.code // 直接显示code字段
      }));
      
      setMaterialOptions(materialOptions);
    } catch (error) {
      console.error('[ConsumableEditPage] 获取材料数据失败:', error);
      // 降级到硬编码选项 - 使用材料表的code字段
      setMaterialOptions([
        { code: '30% HDPE', name: '30% HDPE' },
        { code: '50% HDPE', name: '50% HDPE' },
        { code: 'HDPE', name: 'HDPE' },
        { code: '50% LDPE', name: '50% LDPE' },
        { code: 'LDPE', name: 'LDPE' },
        { code: 'PAPE', name: 'PAPE' },
        { code: 'PAPER', name: 'PAPER' }
      ]);
    } finally {
      setMaterialLoading(false);
    }
  }, []);

  // 当获取到数据时，填充表单
  useEffect(() => {
    if (consumableData && isEdit) {
      form.setFieldsValue({
        product_line_id: consumableData.product_line_id,
        model: consumableData.model || '',
        model_imperial: consumableData.model_imperial || '',
        part_number: consumableData.part_number,
        spec: consumableData.spec || '',
        spec_imperial: consumableData.spec_imperial || '',
        brand: consumableData.brand || '',
        app_model: consumableData.app_model ? 
          (typeof consumableData.app_model === 'string' ? 
            consumableData.app_model.split(',').map(model => model.trim()).filter(model => model) : 
            (Array.isArray(consumableData.app_model) ? consumableData.app_model : [])
          ) : [],
        bag_type: consumableData.bag_type || '',
        material: consumableData.material || '',
        thickness_met: Number(consumableData.thickness_met) || 0,
        thickness_imp: Number(consumableData.thickness_imp) || 0,
        width_met: Number(consumableData.width_met) || 0,
        width_imp: Number(consumableData.width_imp) || 0,
        length_met: Number(consumableData.length_met) || 0,
        length_imp: Number(consumableData.length_imp) || 0,
        bubble_diameter_met: Number(consumableData.bubble_diameter_met) || 0,
        bubble_diameter_imp: Number(consumableData.bubble_diameter_imp) || 0,
        total_length_met: Number(consumableData.total_length_met) || 0,
        total_length_imp: Number(consumableData.total_length_imp) || 0,
        package_type: consumableData.package_type || '',
        package_size_cm: consumableData.package_size_cm || '',
        package_size_inch: consumableData.package_size_inch || '',
        net_weight_kg: Number(consumableData.net_weight_kg) || 0,
        net_weight_lbs: Number(consumableData.net_weight_lbs) || 0,
        gross_weight_kg: Number(consumableData.gross_weight_kg) || 0,
        gross_weight_lbs: Number(consumableData.gross_weight_lbs) || 0,
        pcs_per_box: Number(consumableData.pcs_per_box) || 0,
        image_url: consumableData.image_url || '',
        package_image_url: consumableData.package_image_url || '',
        pallet_size_cm: consumableData.pallet_size_cm || '',
        pallet_size_inch: consumableData.pallet_size_inch || '',
        pcs_per_pallet_a: Number(consumableData.pcs_per_pallet_a) || 0,
        pallet_gross_weight_a_kg: Number(consumableData.pallet_gross_weight_a_kg) || 0,
        pallet_gross_weight_a_lbs: Number(consumableData.pallet_gross_weight_a_lbs) || 0,
        pallet_height_a_cm: Number(consumableData.pallet_height_a_cm) || 0,
        pallet_height_a_inch: Number(consumableData.pallet_height_a_inch) || 0,
        pcs_per_pallet_b: Number(consumableData.pcs_per_pallet_b) || 0,
        pallet_gross_weight_b_kg: Number(consumableData.pallet_gross_weight_b_kg) || 0,
        pallet_gross_weight_b_lbs: Number(consumableData.pallet_gross_weight_b_lbs) || 0,
        pallet_height_b_cm: Number(consumableData.pallet_height_b_cm) || 0,
        pallet_height_b_inch: Number(consumableData.pallet_height_b_inch) || 0,
        pcs_per_pallet_c: Number(consumableData.pcs_per_pallet_c) || 0,
        pallet_gross_weight_c_kg: Number(consumableData.pallet_gross_weight_c_kg) || 0,
        pallet_gross_weight_c_lbs: Number(consumableData.pallet_gross_weight_c_lbs) || 0,
        pallet_height_c_cm: Number(consumableData.pallet_height_c_cm) || 0,
        pallet_height_c_inch: Number(consumableData.pallet_height_c_inch) || 0,
        tube_inner_diameter_cm: Number(consumableData.tube_inner_diameter_cm) || 0,
        tube_inner_diameter_inch: Number(consumableData.tube_inner_diameter_inch) || 0,
        status: consumableData.status,
        unit: consumableData.unit || 'roll',
        name_zh: consumableData.name_zh || '',
        name_en: consumableData.name_en || '',
      });
      
      // 设置产品线ID用于智能提示
      if (consumableData.product_line_id) {
        setSelectedProductLineId(consumableData.product_line_id);
      }
    } else if (!isEdit) {
      // 新建时设置默认值
      const defaultProductLineId = productLineFromUrl ? parseInt(productLineFromUrl) : 1;
      form.setFieldsValue({
        product_line_id: defaultProductLineId,
        status: 'publish',
        unit: 'roll',
      });
      setSelectedProductLineId(defaultProductLineId);
    }
  }, [consumableData, form, isEdit, productLineFromUrl]);

  // 加载上下文数据
  useEffect(() => {
    if (selectedProductLineId) {
      fetchConsumableContextData(selectedProductLineId);
      fetchCompatibleModels(selectedProductLineId);
    }
  }, [selectedProductLineId, fetchConsumableContextData, fetchCompatibleModels]);

  // 初始化时获取袋型数据
  useEffect(() => {
    fetchBagTypes();
    fetchMaterials();
  }, [fetchBagTypes, fetchMaterials]);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      console.log('[ConsumableEditPage] 提交表单数据', values);

      // 客户端验证
      if (!values.product_line_id) {
        message.error('请选择产品线');
        return;
      }
      if (!values.part_number) {
        message.error('请输入料号');
        return;
      }
      if (!values.model) {
        message.error('请输入型号');
        return;
      }
      if (!values.status) {
        message.error('请选择状态');
        return;
      }
      if (!values.unit) {
        message.error('请选择单位');
        return;
      }

      // 验证数字字段
      console.log('[ConsumableEditPage] 表单原始数据验证:', {
        product_line_id: values.product_line_id,
        part_number: values.part_number,
        status: values.status,
        unit: values.unit,
        thickness_met: values.thickness_met,
        thickness_met_type: typeof values.thickness_met
      });

      // 创建最小化的测试数据
      const minimalFormData = {
        product_line_id: values.product_line_id,
        part_number: values.part_number,
        model: values.model || 'test-model',
        status: values.status,
        unit: values.unit,
        name_zh: values.name_zh || '',
        name_en: values.name_en || '',
      };

      console.log('[ConsumableEditPage] 最小化测试数据:', minimalFormData);

      // 🔥 修复：只有当值确实存在且有效时才转换为数字，否则保持undefined以避免错误的0值
      const processNumericField = (value: any, fieldName: string) => {
        // 如果值为undefined、null、空字符串，返回undefined（不更新字段）
        if (value === undefined || value === null || value === '') {
          console.log(`[ConsumableEditPage] 字段 ${fieldName} 为空，跳过更新`);
          return undefined;
        }
        
        // 如果值为0，需要确认这是用户的真实意图
        if (value === 0 || value === '0') {
          console.log(`[ConsumableEditPage] 字段 ${fieldName} 为0，保持0值`);
          return 0;
        }
        
        // 尝试转换为数字
        const numValue = Number(value);
        if (isNaN(numValue)) {
          console.log(`[ConsumableEditPage] 字段 ${fieldName} 无法转换为数字: ${value}，跳过更新`);
          return undefined;
        }
        
        console.log(`[ConsumableEditPage] 字段 ${fieldName} 转换为数字: ${value} -> ${numValue}`);
        return numValue;
      };

      const formData: ConsumableFormData = {
        product_line_id: values.product_line_id,
        model: values.model || '',
        model_imperial: values.model_imperial || '',
        part_number: values.part_number,
        spec: values.spec || '',
        spec_imperial: values.spec_imperial || '',
        brand: values.brand || '',
        app_model: Array.isArray(values.app_model) ? values.app_model.join(', ') : (values.app_model || ''),
        bag_type: values.bag_type || '',
        material: values.material || '',
        // 🔥 修复：使用新的数字字段处理函数
        thickness_met: processNumericField(values.thickness_met, 'thickness_met'),
        thickness_imp: processNumericField(values.thickness_imp, 'thickness_imp'),
        width_met: processNumericField(values.width_met, 'width_met'),
        width_imp: processNumericField(values.width_imp, 'width_imp'),
        length_met: processNumericField(values.length_met, 'length_met'),
        length_imp: processNumericField(values.length_imp, 'length_imp'),
        bubble_diameter_met: processNumericField(values.bubble_diameter_met, 'bubble_diameter_met'),
        bubble_diameter_imp: processNumericField(values.bubble_diameter_imp, 'bubble_diameter_imp'),
        total_length_met: processNumericField(values.total_length_met, 'total_length_met'),
        total_length_imp: processNumericField(values.total_length_imp, 'total_length_imp'),
        package_type: values.package_type || '',
        package_size_cm: values.package_size_cm || '',
        package_size_inch: values.package_size_inch || '',
        net_weight_kg: processNumericField(values.net_weight_kg, 'net_weight_kg'),
        net_weight_lbs: processNumericField(values.net_weight_lbs, 'net_weight_lbs'),
        gross_weight_kg: processNumericField(values.gross_weight_kg, 'gross_weight_kg'),
        gross_weight_lbs: processNumericField(values.gross_weight_lbs, 'gross_weight_lbs'),
        pcs_per_box: processNumericField(values.pcs_per_box, 'pcs_per_box'),
        image_url: values.image_url || '',
        package_image_url: values.package_image_url || '',
        pallet_size_cm: values.pallet_size_cm || '',
        pallet_size_inch: values.pallet_size_inch || '',
        pcs_per_pallet_a: processNumericField(values.pcs_per_pallet_a, 'pcs_per_pallet_a'),
        pallet_gross_weight_a_kg: processNumericField(values.pallet_gross_weight_a_kg, 'pallet_gross_weight_a_kg'),
        pallet_gross_weight_a_lbs: processNumericField(values.pallet_gross_weight_a_lbs, 'pallet_gross_weight_a_lbs'),
        pallet_height_a_cm: processNumericField(values.pallet_height_a_cm, 'pallet_height_a_cm'),
        pallet_height_a_inch: processNumericField(values.pallet_height_a_inch, 'pallet_height_a_inch'),
        pcs_per_pallet_b: processNumericField(values.pcs_per_pallet_b, 'pcs_per_pallet_b'),
        pallet_gross_weight_b_kg: processNumericField(values.pallet_gross_weight_b_kg, 'pallet_gross_weight_b_kg'),
        pallet_gross_weight_b_lbs: processNumericField(values.pallet_gross_weight_b_lbs, 'pallet_gross_weight_b_lbs'),
        pallet_height_b_cm: processNumericField(values.pallet_height_b_cm, 'pallet_height_b_cm'),
        pallet_height_b_inch: processNumericField(values.pallet_height_b_inch, 'pallet_height_b_inch'),
        pcs_per_pallet_c: processNumericField(values.pcs_per_pallet_c, 'pcs_per_pallet_c'),
        pallet_gross_weight_c_kg: processNumericField(values.pallet_gross_weight_c_kg, 'pallet_gross_weight_c_kg'),
        pallet_gross_weight_c_lbs: processNumericField(values.pallet_gross_weight_c_lbs, 'pallet_gross_weight_c_lbs'),
        pallet_height_c_cm: processNumericField(values.pallet_height_c_cm, 'pallet_height_c_cm'),
        pallet_height_c_inch: processNumericField(values.pallet_height_c_inch, 'pallet_height_c_inch'),
        tube_inner_diameter_cm: processNumericField(values.tube_inner_diameter_cm, 'tube_inner_diameter_cm'),
        tube_inner_diameter_inch: processNumericField(values.tube_inner_diameter_inch, 'tube_inner_diameter_inch'),
        status: values.status,
        unit: values.unit,
        name_zh: values.name_zh || '',
        name_en: values.name_en || '',
      };

      console.log('[ConsumableEditPage] 准备发送的formData:', formData);

      // 转换为API期望的格式 - 将part_number映射为code，model映射为name
      const apiData = {
        ...formData,
        code: formData.part_number, // API期望code字段
        name: formData.model, // API期望name字段
        // 保留原字段以防后端需要两个字段
      };
      
      console.log('[ConsumableEditPage] 转换为API格式的数据:', apiData);
      console.log('[ConsumableEditPage] API数据关键字段检查:', {
        code: apiData.code,
        name: apiData.name,
        part_number: apiData.part_number,
        model: apiData.model,
        product_line_id: apiData.product_line_id,
        status: apiData.status,
        unit: apiData.unit
      });

      if (isEdit) {
        await consumableService.updateConsumable(parseInt(id!), apiData);
        message.success('耗材更新成功');
      } else {
        await consumableService.createConsumable(apiData);
        message.success('耗材创建成功');
      }
      navigate('/admin/consumables');
    } catch (error: any) {
      console.error('[ConsumableEditPage] 提交失败:', error);
      
      // 检查错误对象的结构
      console.error('[ConsumableEditPage] 错误对象详情:', {
        hasResponse: !!error.response,
        hasSuccess: 'success' in error,
        hasMessage: 'message' in error,
        hasCode: 'code' in error,
        hasData: 'data' in error,
        errorKeys: Object.keys(error)
      });
      
      // 打印JSON格式的详细错误信息
      try {
        console.error('[ConsumableEditPage] 完整错误对象:', JSON.stringify({
          success: error?.success,
          message: error?.message,
          code: error?.code,
          data: error?.data,
          // 备用：传统axios错误格式
          axiosResponse: error?.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : null
        }, null, 2));
      } catch (jsonError) {
        console.error('[ConsumableEditPage] 无法序列化错误对象:', jsonError);
        console.error('[ConsumableEditPage] 原始错误对象:', error);
      }
      
      // 详细错误处理 - 优先处理HttpAdminService格式
      if (error?.success === false) {
        // HttpAdminService格式的错误
        console.error('[ConsumableEditPage] HttpAdminService错误详情:', {
          success: error.success,
          message: error.message,
          code: error.code,
          data: error.data
        });
        
        if (error.code === 400 || error.code === '400') {
          // 400错误的详细处理
          if (error.data && typeof error.data === 'object') {
            console.error('[ConsumableEditPage] 400错误data详情:', JSON.stringify(error.data, null, 2));
            
            if (error.data.errors) {
              // 字段级别的错误
              const errorMessages = Object.entries(error.data.errors).map(([field, msgs]: [string, any]) => 
                `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
              ).join('; ');
              message.error(`字段验证错误: ${errorMessages}`);
            } else if (error.data.message) {
              message.error(`请求数据错误: ${error.data.message}`);
            } else {
              message.error(`请求数据错误: ${error.message || '请检查必填字段'}`);
            }
          } else {
            message.error(`请求数据错误: ${error.message || '请检查必填字段'}`);
          }
        } else {
          message.error(`提交失败: ${error.message || '未知错误'}`);
        }
      } else if (error?.response?.status === 400) {
        // 传统axios格式的400错误
        const errorData = error.response.data;
        console.error('[ConsumableEditPage] 传统400错误详情:', JSON.stringify(errorData, null, 2));
        
        if (errorData?.message) {
          message.error(`请求数据错误: ${errorData.message}`);
        } else if (errorData?.errors) {
          const errorMessages = Object.entries(errorData.errors).map(([field, msgs]: [string, any]) => 
            `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
          ).join('; ');
          message.error(`字段验证错误: ${errorMessages}`);
        } else {
          message.error('请求数据格式错误，请检查必填字段');
        }
      } else if (error?.response?.data?.message) {
        message.error(`提交失败: ${error.response.data.message}`);
      } else if (error?.message) {
        message.error(`提交失败: ${error.message}`);
      } else {
        message.error(isEdit ? '更新耗材失败' : '创建耗材失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/consumables');
  };

  const productLines = (productLineData as any)?.items || [];

  if (productLineLoading || (isEdit && consumableLoading)) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminPageHeader
        title={isEdit ? t('edit.title', { ns: 'consumables' }) : t('create.title', { ns: 'consumables' })}
        onBack={handleCancel}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            product_line_id: 1,
            status: 'publish',
            unit: 'roll',
          }}
        >
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: "基本信息 (Basic Info)",
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="product_line_id"
                          label="产品线 (Product Line)"
                          rules={[{ required: true, message: '请选择产品线' }]}
                        >
                          <Select placeholder="请选择产品线" onChange={handleProductLineChange}>
                            {productLines.map((line: any) => (
                              <Option key={line.id} value={line.id}>
                                {line.title_zh || line.title_en}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="part_number"
                          label="料号 (Part Number)"
                          rules={[{ required: true, message: "请输入料号" }]}
                          extra={`参考该产品线下的耗材料号，当前共 ${consumablePartOptions.length} 个料号`}
                        >
                          <AutoComplete
                            options={consumablePartOptions}
                            placeholder="请输入料号，可参考下拉提示"
                            filterOption={(inputValue, option) =>
                              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="model"
                          label="型号 (Model)"
                          rules={[{ required: true, message: '请输入型号' }]}
                        >
                          <Input placeholder="请输入型号" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="model_imperial"
                          label="型号(英制) (model Imperial)"
                        >
                          <Input placeholder="请输入英制型号" />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* 新增：中文/英文名称 */}
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="name_zh"
                          label={t('fields.name_zh', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterChineseName', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="name_en"
                          label={t('fields.name_en', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterEnglishName', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="bag_type"
                          label={t('fields.bag_type', { ns: 'consumables' })}
                        >
                          <Select 
                            placeholder={t('placeholders.selectBagType', { ns: 'consumables' })} 
                            loading={bagTypeLoading}
                          >
                            {bagTypeOptions.map((option) => (
                              <Option key={option.code} value={option.code}>
                                {option.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="material"
                          label={t('fields.material', { ns: 'consumables' })}
                          extra={t('extra.materialOptions', { ns: 'consumables', count: materialOptions.length })}
                        >
                          <Select
                            placeholder={t('placeholders.selectMaterial', { ns: 'consumables' })}
                            loading={materialLoading}
                          >
                            {materialOptions.map((option) => (
                              <Option key={option.code} value={option.code}>
                                {option.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="brand"
                          label={t('fields.brand', { ns: 'consumables' })}
                        >
                          <Select
                            placeholder={t('placeholders.selectBrand', { ns: 'consumables' })}
                          >
                            <Option value="LockedAir">LockedAir</Option>
                            <Option value="LockedPaper">LockedPaper</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="spec"
                          label={t('fields.spec', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterSpec', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="spec_imperial"
                          label={t('fields.spec_imperial', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterImperialSpec', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="app_model"
                          label={t('fields.app_model', { ns: 'consumables' })}
                        >
                          <Select
                            mode="multiple"
                            placeholder={t('placeholders.selectCompatibleModels', { ns: 'consumables' })}
                            loading={compatibleModelLoading}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            optionLabelProp="children"
                            tagRender={(tagProps) => {
                              const { label } = tagProps;
                              return (
                                <Tag style={{ marginRight: 3 }} closable={false} color="blue">
                                  {label}
                                </Tag>
                              );
                            }}
                          >
                            {compatibleModelOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="unit"
                          label={t('fields.unit', { ns: 'consumables' })}
                          rules={[{ required: true, message: t('validation.unitRequired', { ns: 'consumables' }) }]}
                        >
                          <Select placeholder={t('placeholders.selectUnit', { ns: 'consumables' })}>
                            <Option value="roll">{t('units.roll', { ns: 'consumables' })}</Option>
                            <Option value="pcs">{t('units.pieces', { ns: 'consumables' })}</Option>
                            <Option value="box">{t('units.box', { ns: 'consumables' })}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="status"
                          label={t('fields.status', { ns: 'consumables' })}
                          rules={[{ required: true, message: t('validation.statusRequired', { ns: 'consumables' }) }]}
                        >
                          <Select placeholder={t('placeholders.selectStatus', { ns: 'consumables' })}>
                            <Option value="publish">{t('status.publish', { ns: 'consumables' })}</Option>
                            <Option value="draft">{t('status.draft', { ns: 'consumables' })}</Option>
                            <Option value="trash">{t('status.trash', { ns: 'consumables' })}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="image_url"
                          label={t('fields.image_url', { ns: 'consumables' })}
                        >
                          <FileUrlInput
                            placeholder={t('placeholders.enterProductImageUrl', { ns: 'consumables' })}
                            uploadPath="/uploads/consumables/images/"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="package_image_url"
                          label={t('fields.package_image_url', { ns: 'consumables' })}
                        >
                          <FileUrlInput
                            placeholder={t('placeholders.enterPackageImageUrl', { ns: 'consumables' })}
                            uploadPath="/uploads/consumables/images/"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'dimensions',
                label: t('sections.specInfo', { ns: 'consumables' }),
                children: (
                  <>
                    <Divider orientation="left">{t('sections.thickness', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        {/* 动态切换厚度 / 克重(gsm) 标签 */}
                        <Form.Item shouldUpdate={(prev, cur) => prev.material !== cur.material} noStyle>
                          {({ getFieldValue }) => {
                            const material = getFieldValue('material');
                            const isPaper = material && material.toString().toUpperCase().includes('PAPER');
                            const labelText = isPaper ? '克重(gsm)' : '厚度(um)';
                            const placeholderText = isPaper ? '请输入克重(gsm)' : '请输入厚度(um)';
                            return (
                              <Form.Item name="thickness_met" label={labelText}>
                                <InputNumber
                                  min={0}
                                  step={isPaper ? 1 : 0.1}
                                  precision={isPaper ? 0 : 1}
                                  style={{ width: '100%' }}
                                  placeholder={placeholderText}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        {/* 动态切换厚度 / 克重(lb) 标签 */}
                        <Form.Item shouldUpdate={(prev, cur) => prev.material !== cur.material} noStyle>
                          {({ getFieldValue }) => {
                            const material = getFieldValue('material');
                            const isPaper = material && material.toString().toUpperCase().includes('PAPER');
                            const labelText = isPaper ? '克重(lb)' : '厚度(mil)';
                            const placeholderText = isPaper ? '请输入克重(lb)' : '请输入厚度(mil)';
                            return (
                              <Form.Item name="thickness_imp" label={labelText}>
                                <InputNumber
                                  min={0}
                                  step={0.1}
                                  precision={1}
                                  style={{ width: '100%' }}
                                  placeholder={placeholderText}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">{t('sections.dimensionInfo', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="width_met"
                          label={t('fields.width_met', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="width_imp"
                          label={t('fields.width_imp', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="length_met"
                          label={t('fields.length_met', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="length_imp"
                          label={t('fields.length_imp', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">{t('sections.otherSpecInfo', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="bubble_diameter_met"
                          label={t('fields.bubble_diameter_met', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="bubble_diameter_imp"
                          label={t('fields.bubble_diameter_imp', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="total_length_met"
                          label={t('fields.total_length_met', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="total_length_imp"
                          label={t('fields.total_length_imp', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">{t('sections.tubeInfo', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="tube_inner_diameter_cm"
                          label={t('fields.tube_inner_diameter_cm', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="tube_inner_diameter_inch"
                          label={t('fields.tube_inner_diameter_inch', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterSize', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'packaging',
                label: t('sections.packagingInfo', { ns: 'consumables' }),
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="package_type"
                          label={t('fields.packagingType', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterPackagingType', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="package_size_cm"
                          label={t('fields.package_size_cm', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterSize', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="package_size_inch"
                          label={t('fields.package_size_inch', { ns: 'consumables' })}
                        >
                          <Input placeholder={t('placeholders.enterSize', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="net_weight_kg"
                          label={t('fields.netWeight', { ns: 'consumables' }) + '(kg)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterNetWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="net_weight_lbs"
                          label={t('fields.netWeight', { ns: 'consumables' }) + '(lbs)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterNetWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="gross_weight_kg"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(kg)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="gross_weight_lbs"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(lbs)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pcs_per_box"
                          label={t('fields.pcsPerBox', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterPcsPerBox', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'pallet',
                label: t('sections.palletInfo', { ns: 'consumables' }),
                children: (
                  <>
                    <Divider orientation="left">{t('fields.palletSize', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_size_cm"
                          label={t('fields.size', { ns: 'consumables' }) + '(cm)'}
                        >
                          <Input placeholder={t('placeholders.enterSize', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_size_inch"
                          label={t('fields.size', { ns: 'consumables' }) + '(inch)'}
                        >
                          <Input placeholder={t('placeholders.enterSize', { ns: 'consumables' })} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">{t('sections.palletA', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="pcs_per_pallet_a"
                          label={t('fields.pcsPerPallet', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterPcsPerPallet', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_a_cm"
                          label={t('fields.height', { ns: 'consumables' }) + '(cm)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterHeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_a_inch"
                          label={t('fields.height', { ns: 'consumables' }) + '(inch)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterHeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_a_kg"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(kg)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_a_lbs"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(lbs)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">{t('sections.palletB', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="pcs_per_pallet_b"
                          label={t('fields.pcsPerPallet', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterPcsPerPallet', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_b_cm"
                          label={t('fields.height', { ns: 'consumables' }) + '(cm)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterHeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_b_inch"
                          label={t('fields.height', { ns: 'consumables' }) + '(inch)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterHeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_b_kg"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(kg)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_b_lbs"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(lbs)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">{t('sections.palletC', { ns: 'consumables' })}</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="pcs_per_pallet_c"
                          label={t('fields.pcsPerPallet', { ns: 'consumables' })}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterPcsPerPallet', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_c_cm"
                          label={t('fields.height', { ns: 'consumables' }) + '(cm)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterHeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_c_inch"
                          label={t('fields.height', { ns: 'consumables' }) + '(inch)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterHeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_c_kg"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(kg)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_c_lbs"
                          label={t('fields.grossWeight', { ns: 'consumables' }) + '(lbs)'}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder={t('placeholders.enterGrossWeight', { ns: 'consumables' })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
            ]}
          />

          <div className="flex justify-end mt-6">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? t('buttons.update', { ns: 'consumables' }) : t('buttons.create', { ns: 'consumables' })}
              </Button>
              <Button onClick={handleCancel} icon={<ArrowLeftOutlined />}>
                {t('buttons.cancel', { ns: 'consumables' })}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ConsumableEditPage; 