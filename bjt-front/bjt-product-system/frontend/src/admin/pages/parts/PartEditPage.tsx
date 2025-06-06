import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  message, 
  Card, 
  Select,
  Row, 
  Col, 
  InputNumber, 
  Divider, 
  Space,
  Spin,
  Alert
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import FileUrlInput from '../../components/common/FileUrlInput';
import AdminPartService from '../../services/admin-part.service';
import adminHostModelService from '../../services/admin-host-model.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { AdminPart, AdminHostModel } from '../../types/admin-models.types';
import DictionarySelect from '../../components/common/DictionarySelect';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Option } = Select;
const { TextArea } = Input;

const PartEditPage: React.FC = () => {
  const { t } = useAdminI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [hostModels, setHostModels] = useState<AdminHostModel[]>([]);
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load data in parallel
        const [productLinesResult, hostModelsResult] = await Promise.allSettled([
          fetchProductLines(),
          fetchHostModels()
        ]);
        
        if (isEdit && id) {
          await loadPart(id);
        } else {
          // 新建时设置默认值 - 修复默认值问题
          const hostModelId = searchParams.get('hostModel');
          const productLineId = searchParams.get('productLine');
          
          const defaultValues: any = {
            product_line_id: productLineId ? parseInt(productLineId) : 1, // 默认气垫机产品线
            status: 'publish', // 默认发布状态
            unit: 'pcs' // 默认单位
          };
          
          if (hostModelId) {
            defaultValues.host_model_id = hostModelId;
          }
          
          console.log('PartEditPage - Setting default values:', defaultValues);
          form.setFieldsValue(defaultValues);
          
          if (productLineId) {
            setSelectedProductLineId(parseInt(productLineId));
          } else {
            setSelectedProductLineId(1); // 默认产品线ID
          }
        }
      } catch (error) {
        const errorMessage = `${t('message.loadPartDataFailed', { ns: 'machines' })}: ${String(error)}`;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, isEdit, searchParams, form, t]);

  // 确保产品线和主机型号数据加载完成后，重新设置默认选中的产品线
  useEffect(() => {
    if (!isEdit && productLines.length > 0 && hostModels.length > 0) {
      const productLineId = searchParams.get('productLine');
      const defaultProductLineId = productLineId ? parseInt(productLineId) : 1;
      
      console.log('PartEditPage - Data loaded, ensuring product line selection:', {
        defaultProductLineId,
        currentSelectedProductLineId: selectedProductLineId,
        productLinesCount: productLines.length,
        hostModelsCount: hostModels.length
      });
      
      // 如果还没有选中产品线，设置默认值
      if (!selectedProductLineId) {
        setSelectedProductLineId(defaultProductLineId);
        console.log('PartEditPage - Set default selectedProductLineId:', defaultProductLineId);
      }
      
      // 同时确保表单字段也有正确的值
      const currentFormProductLineId = form.getFieldValue('product_line_id');
      if (!currentFormProductLineId) {
        console.log('PartEditPage - Setting form product_line_id:', defaultProductLineId);
        form.setFieldValue('product_line_id', defaultProductLineId);
      }
    }
  }, [productLines, hostModels, selectedProductLineId, isEdit, searchParams, form]);

  const fetchProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      console.log('PartEditPage - Product lines loaded:', response.items);
      
      if (response && response.items && Array.isArray(response.items)) {
        setProductLines(response.items);
        
        // 确保默认产品线存在
        const defaultProductLine = response.items.find((line: any) => line.id === 1);
        if (defaultProductLine) {
          console.log('PartEditPage - Default product line found:', defaultProductLine);
        } else {
          console.warn('PartEditPage - Default product line (ID=1) not found in response');
        }
      } else {
        setProductLines([]);
      }
    } catch (error) {
      setProductLines([]);
      throw error;
    }
  };

  const fetchHostModels = async () => {
    try {
      const response = await adminHostModelService.getHostModels({ page: 1, page_size: 100 });
      console.log('PartEditPage - Host models API response:', {
        success: !!response,
        itemsCount: response?.items?.length || 0,
        totalCount: response?.total || 0
      });
      
      if (response && response.items && Array.isArray(response.items)) {
        setHostModels(response.items);
        if (response.items.length > 0) {
          console.log('PartEditPage - First host model structure:', JSON.stringify(response.items[0], null, 2));
          console.log('PartEditPage - Host models product_line_id values:', response.items.map(model => ({
            id: model.id,
            model: model.model || model.code,
            product_line_id: model.product_line_id,
            product_line_id_type: typeof model.product_line_id
          })));
        }
      } else {
        console.warn('PartEditPage - Host models response format unexpected:', response);
        setHostModels([]);
      }
    } catch (error) {
      console.error('PartEditPage - Failed to fetch host models:', error);
      setHostModels([]);
      // 不要抛出错误，继续运行
    }
  };

  const loadPart = async (partId: string) => {
    setLoading(true);
    try {
      const response = await AdminPartService.getPart(partId);
      
      // Check if response is wrapped in ApiResponse format
      let part: AdminPart | null = null;
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) {
          part = response.data as AdminPart;
        } else {
          part = response as AdminPart;
        }
      }
      
      if (!part) {
        throw new Error(t('message.loadPartDataFailed', { ns: 'machines' }));
      }
      
      // Fill form with part data
      const formValues = {
        host_model_id: part.model || part.host_model_id,
        product_line_id: part.product_line_id,
        voltage: part.voltage,
        part_number: part.part_number,
        name_zh: part.name_zh,
        name_en: part.name_en,
        brand: part.brand,
        spec: part.spec,
        spec_imperial: part.spec_imperial,
        package_size_cm: part.package_size_cm,
        package_size_inch: part.package_size_inch,
        net_weight_kg: part.net_weight_kg,
        net_weight_lbs: part.net_weight_lbs,
        gross_weight_kg: part.gross_weight_kg,
        gross_weight_lbs: part.gross_weight_lbs,
        pcs_per_box: part.pcs_per_box,
        pallet_size_cm: part.pallet_size_cm,
        pallet_size_inch: part.pallet_size_inch,
        pcs_per_pallet: part.pcs_per_pallet,
        pallet_height_cm: part.pallet_height_cm,
        pallet_height_inch: part.pallet_height_inch,
        pallet_gross_weight_kg: part.pallet_gross_weight_kg,
        pallet_gross_weight_lbs: part.pallet_gross_weight_lbs,
        image_url: part.image_url,
        status: part.status || 'publish',
        unit: part.unit || 'pcs',
      };
      
      form.setFieldsValue(formValues);
      setSelectedProductLineId(part.product_line_id);
    } catch (error) {
      throw new Error(t('message.loadPartDataFailed', { ns: 'machines' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // 调试：打印提交的表单数据
      console.log('PartEditPage - Form values submitted:', values);
      
      // 验证必填字段（与后端一致）
      const requiredFields = {
        product_line_id: '产品线',
        model: '型号', // 注意：这里需要的是型号代码，不是ID
        part_number: '料号',
        name_zh: '中文名称',
        name_en: '英文名称',
        unit: '单位'
      };
      
      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        const fieldValue = field === 'model' ? values.host_model_id : values[field];
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          missingFields.push(label);
        }
      }
      
      if (missingFields.length > 0) {
        message.error(`请填写必填字段：${missingFields.join('、')}`);
        return;
      }
      
      // 准备提交数据，按照后端期望的字段格式
      const formData: any = {
        product_line_id: values.product_line_id,
        model: values.host_model_id, // 这里应该是型号代码（如"LA-E4S V2.0"），不是ID
        voltage: values.voltage || '',
        part_number: values.part_number,
        name_zh: values.name_zh,
        name_en: values.name_en,
        brand: values.brand || '',
        spec: values.spec || '',
        spec_imperial: values.spec_imperial || '',
        package_size_cm: values.package_size_cm || '',
        package_size_inch: values.package_size_inch || '',
        net_weight_kg: values.net_weight_kg || null,
        net_weight_lbs: values.net_weight_lbs || null,
        gross_weight_kg: values.gross_weight_kg || null,
        gross_weight_lbs: values.gross_weight_lbs || null,
        pcs_per_box: values.pcs_per_box || null,
        pallet_size_cm: values.pallet_size_cm || '',
        pallet_size_inch: values.pallet_size_inch || '',
        pcs_per_pallet: values.pcs_per_pallet || null,
        pallet_height_cm: values.pallet_height_cm || null,
        pallet_height_inch: values.pallet_height_inch || null,
        pallet_gross_weight_kg: values.pallet_gross_weight_kg || null,
        pallet_gross_weight_lbs: values.pallet_gross_weight_lbs || null,
        image_url: values.image_url || '',
        status: values.status || 'publish',
        unit: values.unit || 'pcs',
      };

      console.log('PartEditPage - Data to be submitted to API:', formData);

      if (isEdit && id) {
        await AdminPartService.updatePart(id, formData);
        message.success(t('message.partUpdateSuccess', { ns: 'machines' }));
      } else {
        const result = await AdminPartService.createPart(formData);
        console.log('PartEditPage - Create part result:', result);
        message.success(t('message.partCreateSuccess', { ns: 'machines' }));
      }
      
      navigate('/admin/machines');
    } catch (error) {
      console.error('PartEditPage - Submit error:', error);
      
      // 提供更详细的错误信息
      let errorMessage = isEdit ? t('message.updateFailed', { ns: 'machines' }) : t('message.createFailed', { ns: 'machines' });
      
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage += `: ${error.message}`;
        } else if ('data' in error && error.data && error.data.message) {
          errorMessage += `: ${error.data.message}`;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/machines');
  };

  const handleProductLineChange = (productLineId: number) => {
    console.log('PartEditPage - Product line changed to:', productLineId);
    setSelectedProductLineId(productLineId);
    form.setFieldsValue({ host_model_id: undefined });
  };

  // 修复过滤逻辑 - 支持数字和字符串类型的product_line_id
  const filteredHostModels = selectedProductLineId 
    ? hostModels.filter(model => {
        // 支持数字和字符串类型比较
        const modelProductLineId = model.product_line_id;
        const selectedId = selectedProductLineId;
        
        // 处理不同数据类型的比较
        let isMatch = false;
        if (typeof modelProductLineId === 'string' && typeof selectedId === 'number') {
          // 字符串 vs 数字：将字符串转为数字比较
          isMatch = Number(modelProductLineId) === selectedId;
        } else if (typeof modelProductLineId === 'number' && typeof selectedId === 'number') {
          // 数字 vs 数字：直接比较
          isMatch = modelProductLineId === selectedId;
        } else if (typeof modelProductLineId === 'string' && typeof selectedId === 'string') {
          // 字符串 vs 字符串：直接比较
          isMatch = modelProductLineId === selectedId;
        } else {
          // 其他情况：转字符串比较
          isMatch = String(modelProductLineId) === String(selectedId);
        }
        
        return isMatch;
      })
    : hostModels;

  // 只在关键时刻输出过滤结果，避免日志过多
  React.useEffect(() => {
    if (selectedProductLineId && hostModels.length > 0) {
      console.log('PartEditPage - Filtering models for product line:', selectedProductLineId);
      console.log('PartEditPage - Total models:', hostModels.length);
      console.log('PartEditPage - Filtered models count:', filteredHostModels.length);
      console.log('PartEditPage - Filtered models list:', filteredHostModels.map(m => ({
        id: m.id,
        model: m.model || m.code,
        product_line_id: m.product_line_id
      })));
    }
  }, [selectedProductLineId, hostModels.length, filteredHostModels.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
        <span className="ml-2">{t('message.loadingData', { ns: 'machines' })}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message={t('message.loadFailed', { ns: 'machines' })}
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={() => window.location.reload()}>
                {t('buttons.reload', { ns: 'machines' })}
              </Button>
              <Button onClick={handleBack}>
                {t('buttons.back', { ns: 'machines' })}
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminPageHeader
        title={isEdit ? t('edit.title', { ns: 'machines' }) : t('create.title', { ns: 'machines' })}
        description={isEdit ? `${t('edit.description', { ns: 'machines' })} ID: ${id}` : t('create.description', { ns: 'machines' })}
        extra={
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('buttons.back', { ns: 'machines' })}
          </Button>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'publish', unit: 'pcs' }}
        >
          <Row gutter={24}>
            {/* 基本信息 */}
            <Col span={24}>
              <Divider orientation="left">基本信息 (Basic Information)</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="产品线 (Product Line)"
                name="product_line_id"
                initialValue={1}
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <Select 
                  placeholder="请选择产品线"
                  onChange={handleProductLineChange}
                  loading={productLines.length === 0}
                >
                  {productLines.map(line => (
                    <Option key={line.id} value={line.id}>
                      {line.title_zh || line.title_en}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="型号 (Model)"
                name="host_model_id"
                rules={[{ required: true, message: '请选择型号' }]}
              >
                <Select 
                  placeholder="请选择机器型号"
                  loading={hostModels.length === 0}
                >
                  {filteredHostModels.map(model => (
                    <Option key={model.id} value={model.model}>
                      {model.model} - {model.title_zh}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="料号 (Part No.)"
                name="part_number"
                rules={[{ required: true, message: '请输入料号' }]}
              >
                <Input placeholder="例如: 60A01001" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="电压 (Voltage)"
                name="voltage"
              >
                <DictionarySelect
                  dictionaryType="voltages"
                  placeholder="请选择电压"
                  allowClear={true}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="品牌 (Brand)"
                name="brand"
              >
                <DictionarySelect
                  dictionaryType="brands"
                  placeholder="请选择品牌"
                  allowClear={true}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="状态 (Status)"
                name="status"
                initialValue="publish"
              >
                <DictionarySelect
                  dictionaryType="statuses"
                  placeholder="请选择状态"
                />
              </Form.Item>
            </Col>

            {/* 名称信息 */}
            <Col span={24}>
              <Divider orientation="left">名称信息 (Item Info)</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
                label="中文名称 (Chinese Name)"
                name="name_zh"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="英文名称 (English Name)"
                name="name_en"
                rules={[{ required: true, message: 'Please enter English name' }]}
              >
                <Input placeholder="Please enter English name" />
              </Form.Item>
            </Col>

            {/* 规格信息 */}
            <Col span={24}>
              <Divider orientation="left">规格信息 (Specification Info)</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
                label="规格描述 (Spec.)"
                name="spec"
              >
                <Input placeholder="例如: 长×宽×高(cm)" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="规格描述 (Spec.) - 英制"
                name="spec_imperial"
              >
                <Input placeholder="例如: L×W×H(inch)" />
              </Form.Item>
            </Col>

            {/* 包装信息 */}
            <Col span={24}>
              <Divider orientation="left">包装信息 (Package Info)</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="包装尺寸 (Packaging Dim.) - 公制"
                name="package_size_cm"
              >
                <Input placeholder="长×宽×高" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="包装尺寸 (Packaging Dim.) - 英制"
                name="package_size_inch"
              >
                <Input placeholder="L×W×H" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="单箱数量 (Qty per Carton)"
                name="pcs_per_box"
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="单件净重 (Net Weight) - kg"
                name="net_weight_kg"
              >
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="单件净重 (Net Weight) - lbs"
                name="net_weight_lbs"
              >
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="包装毛重 (Gross Weight) - kg"
                name="gross_weight_kg"
              >
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="包装毛重 (Gross Weight) - lbs"
                name="gross_weight_lbs"
              >
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            {/* 托盘信息 */}
            <Col span={24}>
              <Divider orientation="left">托盘信息 (Pallet Info)</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="托盘尺寸 (Pallet Size) - 公制"
                name="pallet_size_cm"
              >
                <Input placeholder="长×宽" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="托盘尺寸 (Pallet Size) - 英制"
                name="pallet_size_inch"
              >
                <Input placeholder="L×W" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="一托数量 (Packs per Pallet)"
                name="pcs_per_pallet"
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="打托高度 (Pallet Height) - cm"
                name="pallet_height_cm"
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="打托高度 (Pallet Height) - inch"
                name="pallet_height_inch"
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="整托毛重 (GW per Pallet) - kg"
                name="pallet_gross_weight_kg"
              >
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="整托毛重 (GW per Pallet) - lbs"
                name="pallet_gross_weight_lbs"
              >
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            {/* 其他信息 */}
            <Col span={24}>
              <Divider orientation="left">其他信息 (Other Info)</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
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
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="单位 (Unit)"
                name="unit"
                initialValue="pcs"
              >
                <DictionarySelect
                  dictionaryType="units"
                  placeholder="请选择单位"
                />
              </Form.Item>
            </Col>
          </Row>

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
                {isEdit ? t('buttons.saveChanges', { ns: 'machines' }) : t('buttons.createMachine', { ns: 'machines' })}
              </Button>
              <Button onClick={handleBack} size="large">
                {t('buttons.cancel', { ns: 'machines' })}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PartEditPage; 