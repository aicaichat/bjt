import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Space,
  Card,
  message,
  Select,
  InputNumber,
  Row,
  Col,
  Divider,
  Checkbox,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, SyncOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import MultilingualInput from '../../components/common/MultilingualInput';
import FileUrlInput from '../../components/common/FileUrlInput';
import CRMDataFetcher, { CRMPartData } from '../../components/common/CRMDataFetcher';
import DictionarySelect from '../../components/common/DictionarySelect';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import adminPartService from '../../services/admin-part.service';
import adminProductLineService from '../../services/admin-product-line.service';

// 严格对应wp_bjt_parts表的25个字段 - 包含完整物流参数
interface PartFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 型号 - 必填
  voltage: string;               // 电压
  image_url: string;             // 图片URL
  part_number: string;           // 料号 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  brand: string;                 // 品牌
  
  // 规格参数
  spec: string;                  // 规格参数(公制)
  spec_imperial: string;         // 规格参数(英制)
  
  // 包装信息
  package_size_cm: string;       // 包装尺寸(cm)
  package_size_inch: string;     // 包装尺寸(inch)
  net_weight_kg: number;         // 单件净重(kg)
  net_weight_lbs: number;        // 单件净重(lbs)
  gross_weight_kg: number;       // 包装毛重(kg)
  gross_weight_lbs: number;      // 包装毛重(lbs)
  pcs_per_box: number;          // 单箱数量
  
  // 托盘信息
  pallet_size_cm: string;       // 托盘尺寸(cm)
  pallet_size_inch: string;     // 托盘尺寸(inch)
  pcs_per_pallet: number;       // 一托数量
  pallet_height_cm: number;     // 打托高度(cm)
  pallet_height_inch: number;   // 打托高度(inch)
  pallet_gross_weight_kg: number; // 整托毛重(kg)
  pallet_gross_weight_lbs: number; // 整托毛重(lbs)
  
  status: 'publish' | 'draft' | 'trash'; // 状态
  unit: 'pcs' | 'roll' | 'box'; // 单位
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

const { Option } = Select;

const PartEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [autoConvert, setAutoConvert] = useState(true); // 自动公英制转换
  const { t } = useAdminI18n();

  const isEditMode = !!id;
  const hostModelId = searchParams.get('hostModel'); // 从主机管理页面传递的主机型号ID

  // 公英制转换系数
  const CONVERSIONS = {
    // 重量：kg to lbs
    KG_TO_LBS: 2.20462,
    // 尺寸：cm to inch
    CM_TO_INCH: 0.393701,
  };

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      console.log('PartEditPage - Product lines loaded:', response.items);
      setProductLines(response.items);
      
      // 确保默认产品线存在
      const defaultProductLine = response.items.find((line: any) => line.id === 1);
      if (defaultProductLine) {
        console.log('PartEditPage - Default product line found:', defaultProductLine);
        
        // 如果是新建模式且product_line_id未设置，设置默认值
        if (!isEditMode && !form.getFieldValue('product_line_id')) {
          console.log('PartEditPage - Setting default product_line_id after load');
          form.setFieldValue('product_line_id', 1);
        }
      } else {
        console.warn('PartEditPage - Default product line (ID=1) not found in response');
      }
    } catch (error) {
      console.error(t('message.loadProductLinesFailed', { ns: 'machines' }), error);
      message.error(t('message.loadProductLinesFailed', { ns: 'machines' }));
    }
  };

  // 初始化数据
  useEffect(() => {
    const initializeForm = async () => {
      await loadProductLines();
      
      if (isEditMode && id) {
        loadPart(parseInt(id));
      } else {
        // 新建时设置默认值 - 修复默认值问题
        const defaultValues = {
          product_line_id: 1, // 默认气垫机产品线
          model: '',
          voltage: '',
          image_url: '',
          part_number: '', // 唯一必填字段
          name: { zh: '', en: '' },
          brand: '',
          spec: '',
          spec_imperial: '',
          package_size_cm: '',
          package_size_inch: '',
          net_weight_kg: 0,
          net_weight_lbs: 0,
          gross_weight_kg: 0,
          gross_weight_lbs: 0,
          pcs_per_box: 1,
          pallet_size_cm: '',
          pallet_size_inch: '',
          pcs_per_pallet: 1,
          pallet_height_cm: 0,
          pallet_height_inch: 0,
          pallet_gross_weight_kg: 0,
          pallet_gross_weight_lbs: 0,
          status: 'publish', // 默认发布状态
          unit: 'pcs', // 默认单位
        };
        
        console.log('PartEditPage - Setting default values:', defaultValues);
        form.setFieldsValue(defaultValues);
        
        // 确保产品线默认值设置成功
        setTimeout(() => {
          if (form.getFieldValue('product_line_id') !== 1) {
            console.log('PartEditPage - Retry setting product_line_id default value');
            form.setFieldValue('product_line_id', 1);
          }
        }, 100);
      }
    };
    
    initializeForm();
  }, [id, isEditMode, form]);

  const loadPart = async (partId: number) => {
    try {
      setLoading(true);
      const data = await adminPartService.getPart(partId.toString());
      
      // 转换数据格式以适应表单 - 使用any避免类型冲突
      const partData = data as any;
      
      form.setFieldsValue({
        product_line_id: partData.product_line_id || partData.productLineId,
        model: partData.model,
        voltage: partData.voltage,
        image_url: partData.image_url || partData.imageUrl,
        part_number: partData.part_number || partData.partNumber,
        name: { 
          zh: partData.name_zh || partData.name?.zh || '', 
          en: partData.name_en || partData.name?.en || '' 
        },
        brand: partData.brand,
        spec: partData.spec,
        spec_imperial: partData.spec_imperial,
        package_size_cm: partData.package_size_cm,
        package_size_inch: partData.package_size_inch,
        net_weight_kg: partData.net_weight_kg,
        net_weight_lbs: partData.net_weight_lbs,
        gross_weight_kg: partData.gross_weight_kg,
        gross_weight_lbs: partData.gross_weight_lbs,
        pcs_per_box: partData.pcs_per_box || 1,
        pallet_size_cm: partData.pallet_size_cm,
        pallet_size_inch: partData.pallet_size_inch,
        pcs_per_pallet: partData.pcs_per_pallet || 1,
        pallet_height_cm: partData.pallet_height_cm,
        pallet_height_inch: partData.pallet_height_inch,
        pallet_gross_weight_kg: partData.pallet_gross_weight_kg,
        pallet_gross_weight_lbs: partData.pallet_gross_weight_lbs,
        status: partData.status || 'draft',
        unit: partData.unit || 'pcs',
      });
    } catch (error) {
      console.error(t('message.loadPartDataFailed', { ns: 'machines' }), error);
      message.error(t('message.loadPartDataFailed', { ns: 'machines' }));
    } finally {
      setLoading(false);
    }
  };

  // 处理CRM数据获取
  const handleCRMDataFetched = (crmData: CRMPartData) => {
    const currentValues = form.getFieldsValue();
    
    // 合并CRM数据到表单
    const updatedValues = {
      ...currentValues,
      name: {
        zh: crmData.name_zh || currentValues.name?.zh || '',
        en: crmData.name_en || currentValues.name?.en || '',
      },
      brand: crmData.brand || currentValues.brand,
      spec: crmData.spec || currentValues.spec,
      spec_imperial: crmData.spec_imperial || currentValues.spec_imperial,
      voltage: crmData.voltage || currentValues.voltage,
      net_weight_kg: crmData.net_weight_kg || currentValues.net_weight_kg,
      net_weight_lbs: crmData.net_weight_lbs || currentValues.net_weight_lbs,
      gross_weight_kg: crmData.gross_weight_kg || currentValues.gross_weight_kg,
      gross_weight_lbs: crmData.gross_weight_lbs || currentValues.gross_weight_lbs,
      package_size_cm: crmData.package_size_cm || currentValues.package_size_cm,
      package_size_inch: crmData.package_size_inch || currentValues.package_size_inch,
      pcs_per_box: crmData.pcs_per_box || currentValues.pcs_per_box,
      pallet_size_cm: crmData.pallet_size_cm || currentValues.pallet_size_cm,
      pallet_size_inch: crmData.pallet_size_inch || currentValues.pallet_size_inch,
      pcs_per_pallet: crmData.pcs_per_pallet || currentValues.pcs_per_pallet,
      pallet_height_cm: crmData.pallet_height_cm || currentValues.pallet_height_cm,
      pallet_height_inch: crmData.pallet_height_inch || currentValues.pallet_height_inch,
      pallet_gross_weight_kg: crmData.pallet_gross_weight_kg || currentValues.pallet_gross_weight_kg,
      pallet_gross_weight_lbs: crmData.pallet_gross_weight_lbs || currentValues.pallet_gross_weight_lbs,
      image_url: crmData.image_url || currentValues.image_url,
      unit: crmData.unit || currentValues.unit,
    };

    form.setFieldsValue(updatedValues);
  };

  // 公英制单位自动转换
  const handleWeightChange = (field: string, value: number) => {
    if (!autoConvert || !value) return;

    const formValues = form.getFieldsValue();
    
    if (field.endsWith('_kg')) {
      const lbsField = field.replace('_kg', '_lbs');
      const convertedValue = Math.round(value * CONVERSIONS.KG_TO_LBS * 100) / 100;
      form.setFieldValue(lbsField, convertedValue);
    } else if (field.endsWith('_lbs')) {
      const kgField = field.replace('_lbs', '_kg');
      const convertedValue = Math.round(value / CONVERSIONS.KG_TO_LBS * 100) / 100;
      form.setFieldValue(kgField, convertedValue);
    }
  };

  const handleSizeChange = (field: string, value: string) => {
    if (!autoConvert || !value) return;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    if (field.endsWith('_cm')) {
      const inchField = field.replace('_cm', '_inch');
      const convertedValue = Math.round(numericValue * CONVERSIONS.CM_TO_INCH * 100) / 100;
      form.setFieldValue(inchField, convertedValue.toString());
    } else if (field.endsWith('_inch')) {
      const cmField = field.replace('_inch', '_cm');
      const convertedValue = Math.round(numericValue / CONVERSIONS.CM_TO_INCH * 100) / 100;
      form.setFieldValue(cmField, convertedValue.toString());
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      console.log('PartEditPage.onFinish - Original form values:', values);

      // 转换表单数据为API格式 - 根据Machine Part Controller的API要求
      // 必填字段：product_line_id, model, part_number, name_zh, name_en, unit
      const formData = {
        product_line_id: Number(values.product_line_id) || 1, // 必填，确保数字类型
        model: values.model ? String(values.model) : '', // 必填
        part_number: String(values.part_number || ''), // 必填
        // 处理多语言名称字段
        name_zh: values.name?.zh ? String(values.name.zh) : '',  // 必填
        name_en: values.name?.en ? String(values.name.en) : '',  // 必填
        unit: values.unit || 'pcs', // 必填，默认值
        // 可选字段
        voltage: values.voltage ? String(values.voltage) : undefined,
        image_url: values.image_url ? String(values.image_url) : undefined,
        brand: values.brand ? String(values.brand) : undefined,
        spec: values.spec ? String(values.spec) : undefined,
        spec_imperial: values.spec_imperial ? String(values.spec_imperial) : undefined,
        package_size_cm: values.package_size_cm ? String(values.package_size_cm) : undefined,
        package_size_inch: values.package_size_inch ? String(values.package_size_inch) : undefined,
        net_weight_kg: values.net_weight_kg ? Number(values.net_weight_kg) : undefined,
        net_weight_lbs: values.net_weight_lbs ? Number(values.net_weight_lbs) : undefined,
        gross_weight_kg: values.gross_weight_kg ? Number(values.gross_weight_kg) : undefined,
        gross_weight_lbs: values.gross_weight_lbs ? Number(values.gross_weight_lbs) : undefined,
        pcs_per_box: values.pcs_per_box ? Number(values.pcs_per_box) : undefined,
        pallet_size_cm: values.pallet_size_cm ? String(values.pallet_size_cm) : undefined,
        pallet_size_inch: values.pallet_size_inch ? String(values.pallet_size_inch) : undefined,
        pcs_per_pallet: values.pcs_per_pallet ? Number(values.pcs_per_pallet) : undefined,
        pallet_height_cm: values.pallet_height_cm ? Number(values.pallet_height_cm) : undefined,
        pallet_height_inch: values.pallet_height_inch ? Number(values.pallet_height_inch) : undefined,
        pallet_gross_weight_kg: values.pallet_gross_weight_kg ? Number(values.pallet_gross_weight_kg) : undefined,
        pallet_gross_weight_lbs: values.pallet_gross_weight_lbs ? Number(values.pallet_gross_weight_lbs) : undefined,
        status: values.status || 'publish',
      };

      // 过滤掉undefined值，但保留必填字段
      const requiredFields = ['product_line_id', 'model', 'part_number', 'name_zh', 'name_en', 'unit', 'status'];
      const finalData = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          return requiredFields.includes(key) || (value !== undefined && value !== '' && value !== null);
        })
      );

      console.log('PartEditPage.onFinish - Processed form data:', formData);
      console.log('PartEditPage.onFinish - Final data to submit:', finalData);

      if (isEditMode && id) {
        await adminPartService.updatePart(id, finalData as any);
        message.success(t('message.partUpdateSuccess', { ns: 'machines' }));
      } else {
        await adminPartService.createPart(finalData as any);
        message.success(t('message.partCreateSuccess', { ns: 'machines' }));
      }

      // 根据来源返回不同页面
      if (hostModelId) {
        navigate(`/admin/machines?tab=parts&hostModel=${hostModelId}`);
      } else {
        navigate('/admin/machines?tab=parts');
      }
    } catch (error: any) {
      console.error(t('message.savePartFailed', { ns: 'machines' }), error);
      
      // 详细错误信息调试
      console.error('PartEditPage.onFinish - Detailed error:', {
        error,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers
      });
      
      // 显示更详细的错误信息
      let errorMessage = t('message.savePartFailed', { ns: 'machines' });
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (hostModelId) {
      navigate(`/admin/machines?tab=parts&hostModel=${hostModelId}`);
    } else {
      navigate('/admin/machines?tab=parts');
    }
  };

  // 使用类型断言解决React组件类型问题
  const ButtonComponent = Button as any;
  const CardComponent = Card as any;
  const FormComponent = Form as any;
  const FormItemComponent = Form.Item as any;
  const RowComponent = Row as any;
  const ColComponent = Col as any;
  const DividerComponent = Divider as any;
  const SelectComponent = Select as any;
  const OptionComponent = Option as any;
  const InputComponent = Input as any;
  const InputNumberComponent = InputNumber as any;
  const CheckboxComponent = Checkbox as any;
  const SpaceComponent = Space as any;
  const ArrowLeftIcon = ArrowLeftOutlined as any;
  const SaveIcon = SaveOutlined as any;
  const SyncIcon = SyncOutlined as any;

  const partNumber = form.getFieldValue('part_number');

  return (
    <div className="part-edit-page">
      <AdminPageHeader
        title={isEditMode ? t('edit.title', { ns: 'machines' }) : t('create.title', { ns: 'machines' })}
        description={isEditMode ? `${t('edit.description', { ns: 'machines' })} ID: ${id}` : t('create.description', { ns: 'machines' })}
        extra={
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('buttons.back', { ns: 'machines' })}
          </Button>
        }
      />

      <CardComponent loading={loading}>
        <FormComponent
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={submitting}
          scrollToFirstError
        >
          <RowComponent gutter={24}>
            {/* 基本信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">基本信息</DividerComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="产品线 (Product Line)"
                name="product_line_id"
                initialValue={1}
              >
                <SelectComponent 
                  placeholder="请选择产品线"
                  value={form.getFieldValue('product_line_id')}
                  onChange={(value) => {
                    console.log('PartEditPage - Product line changed to:', value);
                    form.setFieldValue('product_line_id', value);
                  }}
                >
                  {productLines.map((line) => (
                    <OptionComponent key={line.id} value={line.id}>
                      {line.title?.zh || line.name || `产品线${line.id}`}
                    </OptionComponent>
                  ))}
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="型号 (Model)"
                name="model"
              >
                <InputComponent placeholder="例如: BJT-A100" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="电压 (Voltage)"
                name="voltage"
              >
                <DictionarySelect
                  dictionaryType="voltages"
                  placeholder="请选择电压"
                  allowClear={true}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 料号和CRM集成 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">料号信息 (Part No. Info)</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="料号 (Part No.)"
                name="part_number"
                rules={[{ required: true, message: '请输入料号' }]}
                extra="在同一产品线下必须唯一"
              >
                <InputComponent placeholder="例如: 13A00001" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent label="CRM数据获取 (CRM Data Fetch)">
                <CRMDataFetcher
                  partNumber={partNumber || ''}
                  onDataFetched={handleCRMDataFetched}
                  onError={(error) => message.error(error)}
                  fields={[
                    'name_zh', 'name_en', 'brand', 'spec', 'spec_imperial', 'voltage',
                    'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs',
                    'package_size_cm', 'package_size_inch', 'pcs_per_box',
                    'pallet_size_cm', 'pallet_size_inch', 'pcs_per_pallet',
                    'pallet_height_cm', 'pallet_height_inch',
                    'pallet_gross_weight_kg', 'pallet_gross_weight_lbs',
                    'image_url', 'unit'
                  ]}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="品牌 (Brand)"
                name="brand"
              >
                <DictionarySelect
                  dictionaryType="brands"
                  placeholder="请选择品牌"
                  allowClear={true}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="状态 (Status)"
                name="status"
              >
                <DictionarySelect
                  dictionaryType="statuses"
                  placeholder="请选择状态"
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="单位 (Unit)"
                name="unit"
              >
                <DictionarySelect
                  dictionaryType="units"
                  placeholder="请选择单位"
                />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言名称 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">名称信息 (Item Info)</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="名称 (Item)"
                name="name"
              >
                <MultilingualInput
                  type="input"
                  required={false}
                  placeholder={{ zh: '请输入中文名称', en: 'Please enter English name' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 规格参数 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">规格信息 (Specification Info)</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="规格描述 (Spec.)"
                name="spec"
              >
                <InputComponent placeholder="例如: 长×宽×高(cm)" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="规格描述 (Spec.) - 英制"
                name="spec_imperial"
              >
                <InputComponent placeholder="例如: L×W×H(inch)" />
              </FormItemComponent>
            </ColComponent>

            {/* 公英制转换设置 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">
                包装信息 (Package Info)
                <CheckboxComponent 
                  checked={autoConvert} 
                  onChange={(e: any) => setAutoConvert(e.target.checked)}
                  style={{ marginLeft: 16 }}
                >
                  <SyncIcon style={{ marginRight: 4 }} />
                  自动公英制转换
                </CheckboxComponent>
              </DividerComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="包装尺寸 (Packaging Dim.) - 公制"
                name="package_size_cm"
              >
                <InputComponent 
                  placeholder="长×宽×高"
                  onChange={(e: any) => handleSizeChange('package_size_cm', e.target.value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="包装尺寸 (Packaging Dim.) - 英制"
                name="package_size_inch"
              >
                <InputComponent 
                  placeholder="L×W×H"
                  onChange={(e: any) => handleSizeChange('package_size_inch', e.target.value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="单箱数量 (Qty per Carton)"
                name="pcs_per_box"
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="单件净重 (Net Weight) - kg"
                name="net_weight_kg"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={3} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('net_weight_kg', value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="单件净重 (Net Weight) - lbs"
                name="net_weight_lbs"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={3} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('net_weight_lbs', value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="包装毛重 (Gross Weight) - kg"
                name="gross_weight_kg"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={3} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('gross_weight_kg', value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="包装毛重 (Gross Weight) - lbs"
                name="gross_weight_lbs"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={3} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('gross_weight_lbs', value)}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 托盘信息 */}
            <ColComponent span={24}>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 16, marginBottom: 16 }}>托盘信息 (Pallet Info)</div>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="托盘尺寸 (Pallet Size) - 公制"
                name="pallet_size_cm"
              >
                <InputComponent 
                  placeholder="长×宽"
                  onChange={(e: any) => handleSizeChange('pallet_size_cm', e.target.value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="托盘尺寸 (Pallet Size) - 英制"
                name="pallet_size_inch"
              >
                <InputComponent 
                  placeholder="L×W"
                  onChange={(e: any) => handleSizeChange('pallet_size_inch', e.target.value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="一托数量 (Packs per Pallet)"
                name="pcs_per_pallet"
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="打托高度 (Pallet Height) - cm"
                name="pallet_height_cm"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={2} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('pallet_height_cm', value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="打托高度 (Pallet Height) - inch"
                name="pallet_height_inch"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={2} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('pallet_height_inch', value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="整托毛重 (GW per Pallet) - kg"
                name="pallet_gross_weight_kg"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={3} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('pallet_gross_weight_kg', value)}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="整托毛重 (GW per Pallet) - lbs"
                name="pallet_gross_weight_lbs"
              >
                <InputNumberComponent 
                  min={0} 
                  precision={3} 
                  style={{ width: '100%' }}
                  onChange={(value: any) => handleWeightChange('pallet_gross_weight_lbs', value)}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 产品图片 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品图片 (Product Image)</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品图片 (Product Image)"
                name="image_url"
                extra="支持上传图片文件或输入图片URL地址，文件大小不超过 10MB"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址或点击上传"
                  fileType="image"
                  maxSize={10}
                  uploadPath="/uploads/parts/images/"
                  preview
                />
              </FormItemComponent>
            </ColComponent>
          </RowComponent>

          {/* 操作按钮 */}
          <FormItemComponent style={{ marginTop: 32, textAlign: 'center' }}>
            <SpaceComponent size="large">
              <ButtonComponent
                type="primary"
                htmlType="submit"
                icon={<SaveIcon />}
                loading={submitting}
                size="large"
              >
                {isEditMode ? '保存更改' : '创建料号'}
              </ButtonComponent>
              <ButtonComponent onClick={handleBack} size="large">
                取消
              </ButtonComponent>
            </SpaceComponent>
          </FormItemComponent>
        </FormComponent>
      </CardComponent>
    </div>
  );
};

export default PartEditPage; 