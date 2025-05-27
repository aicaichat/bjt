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
import FileUploader from '../../components/common/FileUploader';
import CRMDataFetcher, { CRMPartData } from '../../components/common/CRMDataFetcher';
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

  const isEditMode = !!id;
  const hostModelId = searchParams.get('hostModel'); // 从主机管理页面传递的主机型号ID

  // 公英制转换系数
  const CONVERSIONS = {
    // 重量：kg to lbs
    KG_TO_LBS: 2.20462,
    // 尺寸：cm to inch
    CM_TO_INCH: 0.393701,
  };

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    if (isEditMode && id) {
      loadPart(parseInt(id));
    } else {
      // 新建时设置默认值
      form.setFieldsValue({
        product_line_id: undefined,
        model: '',
        voltage: '',
        image_url: '',
        part_number: '',
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
        status: 'draft',
        unit: 'pcs',
      });
    }
  }, [id, isEditMode, form]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      setProductLines(response.items);
    } catch (error) {
      console.error('加载产品线失败:', error);
      message.error('加载产品线失败');
    }
  };

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
      console.error('加载料号数据失败:', error);
      message.error('加载料号数据失败');
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

      // 转换表单数据为API格式
      const formData: Partial<PartFormData> = {
        product_line_id: values.product_line_id,
        model: values.model,
        voltage: values.voltage,
        image_url: values.image_url,
        part_number: values.part_number,
        name_zh: values.name.zh,
        name_en: values.name.en,
        brand: values.brand,
        spec: values.spec,
        spec_imperial: values.spec_imperial,
        package_size_cm: values.package_size_cm,
        package_size_inch: values.package_size_inch,
        net_weight_kg: values.net_weight_kg,
        net_weight_lbs: values.net_weight_lbs,
        gross_weight_kg: values.gross_weight_kg,
        gross_weight_lbs: values.gross_weight_lbs,
        pcs_per_box: values.pcs_per_box,
        pallet_size_cm: values.pallet_size_cm,
        pallet_size_inch: values.pallet_size_inch,
        pcs_per_pallet: values.pcs_per_pallet,
        pallet_height_cm: values.pallet_height_cm,
        pallet_height_inch: values.pallet_height_inch,
        pallet_gross_weight_kg: values.pallet_gross_weight_kg,
        pallet_gross_weight_lbs: values.pallet_gross_weight_lbs,
        status: values.status,
        unit: values.unit,
      };

      if (isEditMode && id) {
        await adminPartService.updatePart(id, formData as any);
        message.success('料号更新成功');
      } else {
        await adminPartService.createPart(formData as any);
        message.success('料号创建成功');
      }

      // 根据来源返回不同页面
      if (hostModelId) {
        navigate(`/admin/machines?tab=parts&hostModel=${hostModelId}`);
      } else {
        navigate('/admin/machines?tab=parts');
      }
    } catch (error) {
      console.error('保存料号失败:', error);
      message.error('保存料号失败');
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

  const partNumber = Form.useWatch('part_number', form);

  return (
    <div className="part-edit-page">
      <AdminPageHeader
        title={isEditMode ? '编辑主机料号' : '新增主机料号'}
        description={isEditMode ? `编辑料号 ID: ${id}` : '创建新的主机料号'}
        extra={
          <ButtonComponent key="back" icon={<ArrowLeftIcon />} onClick={handleBack}>
            返回列表
          </ButtonComponent>
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
                label="所属产品线"
                name="product_line_id"
                rules={[{ required: true, message: '请选择所属产品线' }]}
              >
                <SelectComponent placeholder="请选择产品线">
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
                label="型号"
                name="model"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <InputComponent placeholder="例如: BJT-A100" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="电压"
                name="voltage"
              >
                <InputComponent placeholder="例如: 220V" />
              </FormItemComponent>
            </ColComponent>

            {/* 料号和CRM集成 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">料号信息</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="料号"
                name="part_number"
                rules={[{ required: true, message: '请输入料号' }]}
                extra="在同一产品线下必须唯一"
              >
                <InputComponent placeholder="例如: 13A00001" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent label="CRM数据获取">
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
                label="品牌"
                name="brand"
              >
                <InputComponent placeholder="例如: BJT" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <SelectComponent>
                  <OptionComponent value="draft">草稿</OptionComponent>
                  <OptionComponent value="publish">已发布</OptionComponent>
                  <OptionComponent value="trash">回收站</OptionComponent>
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="单位"
                name="unit"
                rules={[{ required: true, message: '请选择单位' }]}
              >
                <SelectComponent>
                  <OptionComponent value="pcs">件</OptionComponent>
                  <OptionComponent value="roll">卷</OptionComponent>
                  <OptionComponent value="box">箱</OptionComponent>
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            {/* 多语言名称 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品名称</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品名称"
                name="name"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入中英文名称');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '请输入中文名称', en: 'Please enter English name' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 规格参数 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">规格参数</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="规格参数(公制)"
                name="spec"
              >
                <InputComponent placeholder="例如: 长×宽×高(cm)" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="规格参数(英制)"
                name="spec_imperial"
              >
                <InputComponent placeholder="例如: L×W×H(inch)" />
              </FormItemComponent>
            </ColComponent>

            {/* 公英制转换设置 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">
                物流参数
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

            {/* 包装信息 */}
            <ColComponent span={24}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>包装信息</div>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="包装尺寸(cm)"
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
                label="包装尺寸(inch)"
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
                label="单箱数量"
                name="pcs_per_box"
                rules={[{ required: true, message: '请输入单箱数量' }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="单件净重(kg)"
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
                label="单件净重(lbs)"
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
                label="包装毛重(kg)"
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
                label="包装毛重(lbs)"
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
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 16, marginBottom: 16 }}>托盘信息</div>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="托盘尺寸(cm)"
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
                label="托盘尺寸(inch)"
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
                label="一托数量"
                name="pcs_per_pallet"
                rules={[{ required: true, message: '请输入一托数量' }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="打托高度(cm)"
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
                label="打托高度(inch)"
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
                label="整托毛重(kg)"
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
                label="整托毛重(lbs)"
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
              <DividerComponent orientation="left">产品图片</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品图片"
                name="image_url"
                extra="支持 JPG, PNG, GIF, WEBP 格式，文件大小不超过 10MB"
              >
                <FileUploader
                  type="image"
                  maxSize={10}
                  placeholder="上传产品图片"
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