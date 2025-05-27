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
  Typography,
  Spin,
  Alert
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import AdminPartService from '../../services/admin-part.service';
import adminHostModelService from '../../services/admin-host-model.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { AdminPart, AdminHostModel } from '../../types/admin-models.types';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const PartEditPage: React.FC = () => {
  console.log('PartEditPage: Component starting to render');
  
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
  const [debugInfo, setDebugInfo] = useState<any>({});

  console.log('PartEditPage: Component state', {
    isEdit,
    id,
    loading,
    error,
    productLinesCount: productLines.length,
    hostModelsCount: hostModels.length,
    selectedProductLineId,
    searchParams: Object.fromEntries(searchParams.entries())
  });
  
  // Load data on mount
  useEffect(() => {
    console.log('PartEditPage: useEffect triggered', { isEdit, id });
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('PartEditPage: Starting to load initial data');
        
        // 使用 Promise.allSettled 来并行加载数据，即使某些失败也能继续
        const [productLinesResult, hostModelsResult] = await Promise.allSettled([
          fetchProductLines(),
          fetchHostModels()
        ]);

        console.log('PartEditPage: API results', {
          productLinesResult: productLinesResult.status,
          hostModelsResult: hostModelsResult.status
        });

        // 记录调试信息
        setDebugInfo({
          productLinesLoaded: productLinesResult.status === 'fulfilled',
          hostModelsLoaded: hostModelsResult.status === 'fulfilled',
          productLinesError: productLinesResult.status === 'rejected' ? String(productLinesResult.reason) : null,
          hostModelsError: hostModelsResult.status === 'rejected' ? String(hostModelsResult.reason) : null,
          loadTime: new Date().toLocaleTimeString()
        });
        
        if (isEdit && id) {
          console.log('PartEditPage: Loading part data for edit mode', { id });
          await loadPart(id);
        } else {
          console.log('PartEditPage: Setting default values for create mode');
          // If creating new part with pre-selected host model
          const hostModelId = searchParams.get('hostModel');
          const productLineId = searchParams.get('productLine');
          
          console.log('PartEditPage: URL parameters', { hostModelId, productLineId });
          
          const defaultValues: any = {
            status: 'publish',
            unit: 'pcs'
          };
          
          if (hostModelId) {
            defaultValues.host_model_id = hostModelId;
          }
          if (productLineId) {
            const productLineIdNum = parseInt(productLineId);
            defaultValues.product_line_id = productLineIdNum;
            setSelectedProductLineId(productLineIdNum);
          }
          
          console.log('PartEditPage: Setting form default values', defaultValues);
          form.setFieldsValue(defaultValues);
        }
      } catch (error) {
        const errorMessage = `页面初始化失败: ${String(error)}`;
        console.error('PartEditPage: Load data error', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
        console.log('PartEditPage: Data loading completed');
      }
    };
    
    loadData();
  }, [id, isEdit, searchParams, form]);

  const fetchProductLines = async () => {
    console.log('PartEditPage: Fetching product lines');
    try {
      const response = await adminProductLineService.getProductLines();
      console.log('PartEditPage: Product lines response', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        setProductLines(response.items);
        console.log('PartEditPage: Product lines loaded successfully', response.items.length);
      } else {
        console.warn('PartEditPage: Invalid product lines response format', response);
        setProductLines([]);
      }
    } catch (error) {
      console.error('PartEditPage: Failed to fetch product lines', error);
      setProductLines([]);
      throw error;
    }
  };

  const fetchHostModels = async () => {
    console.log('PartEditPage: Fetching host models');
    try {
      const response = await adminHostModelService.getHostModels({ page: 1, page_size: 100 });
      console.log('PartEditPage: Host models response', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        setHostModels(response.items);
        console.log('PartEditPage: Host models loaded successfully', response.items.length);
      } else {
        console.warn('PartEditPage: Invalid host models response format', response);
        setHostModels([]);
      }
    } catch (error) {
      console.error('PartEditPage: Failed to fetch host models', error);
      setHostModels([]);
      throw error;
    }
  };

  const loadPart = async (partId: string) => {
    console.log('PartEditPage: Loading part data', { partId });
    setLoading(true);
    try {
      const response = await AdminPartService.getPart(partId);
      console.log('PartEditPage: Part data response', response);
      
      // Check if response is wrapped in ApiResponse format
      let part: AdminPart | null = null;
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) {
          // If it's wrapped in ApiResponse format
          part = response.data as AdminPart;
        } else {
          // If it's direct data
          part = response as AdminPart;
        }
      }
      
      if (!part) {
        throw new Error('无法获取料号数据');
      }
      
      console.log('PartEditPage: Processing part data', part);
      
      // Fill form with part data
      const formValues = {
        host_model_id: part.model || part.host_model_id, // 后端返回的是model字段
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
      
      console.log('PartEditPage: Setting form values', formValues);
      form.setFieldsValue(formValues);
      setSelectedProductLineId(part.product_line_id);
    } catch (error: any) {
      console.error('PartEditPage: Error loading part data', error);
      
      let errorMessage = '加载料号数据失败';
      
      if (error && typeof error === 'object') {
        if (error.code === 401 || error.message?.includes('permission')) {
          errorMessage = '认证失败或权限不足，请检查登录状态';
        } else if (error.code === 404) {
          errorMessage = `料号 ID ${partId} 不存在`;
        } else if (error.message) {
          errorMessage = `加载失败: ${error.message}`;
        } else {
          errorMessage = `加载失败: ${JSON.stringify(error)}`;
        }
      } else {
        errorMessage = `加载失败: ${String(error)}`;
      }
      
      message.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    console.log('PartEditPage: Form submitted', values);
    setSubmitting(true);
    try {
      
      // 根据后端BJT_Machine_Part_Controller的字段映射
      const formData: any = {
        product_line_id: values.product_line_id,
        model: values.host_model_id, // 后端使用model字段表示主机型号代码
        voltage: values.voltage,
        part_number: values.part_number,
        name_zh: values.name_zh,
        name_en: values.name_en,
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
        image_url: values.image_url,
        status: values.status,
        unit: values.unit,
      };

      console.log('PartEditPage: Sending data to API', formData);

      if (isEdit && id) {
        await AdminPartService.updatePart(id, formData);
        message.success('料号更新成功');
        console.log('PartEditPage: Part updated successfully');
      } else {
        await AdminPartService.createPart(formData);
        message.success('料号创建成功');
        console.log('PartEditPage: Part created successfully');
      }
      
      navigate('/admin/machines');
    } catch (error) {
      console.error('PartEditPage: Submit error', error);
      message.error(isEdit ? '料号更新失败' : '料号创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    console.log('PartEditPage: Navigating back to machines page');
    navigate('/admin/machines');
  };

  const handleProductLineChange = (productLineId: number) => {
    console.log('PartEditPage: Product line changed', productLineId);
    setSelectedProductLineId(productLineId);
    // Filter host models by product line
    form.setFieldsValue({ host_model_id: undefined });
  };

  const filteredHostModels = selectedProductLineId 
    ? hostModels.filter(model => model.product_line_id === selectedProductLineId.toString())
    : hostModels;

  console.log('PartEditPage: Filtered host models', {
    selectedProductLineId,
    totalHostModels: hostModels.length,
    filteredCount: filteredHostModels.length
  });

  if (loading) {
    console.log('PartEditPage: Rendering loading state');
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
        <span className="ml-2">正在加载数据...</span>
      </div>
    );
  }

  if (error) {
    console.log('PartEditPage: Rendering error state', error);
    return (
      <div className="p-6">
        <Alert
          message="页面加载错误"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={() => window.location.reload()}>
                重新加载
              </Button>
              <Button onClick={handleBack}>
                返回列表
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  console.log('PartEditPage: Rendering main form');

  return (
    <div className="p-6">
      
      <AdminPageHeader
        title={isEdit ? '编辑料号' : '新增料号'}
        description={isEdit ? `编辑料号 ID: ${id}` : '创建新的料号记录'}
        extra={
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
        }
      />

      {/* 调试信息卡片 - 开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6f6f6' }}>
          <Title level={5}>调试信息</Title>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            <div>页面模式: {isEdit ? '编辑' : '创建'}</div>
            <div>料号ID: {id || '无'}</div>
            <div>加载状态: {loading ? '加载中' : '完成'}</div>
            <div>产品线数量: {productLines.length}</div>
            <div>主机型号数量: {hostModels.length}</div>
            <div>当前表单值: {JSON.stringify(form.getFieldsValue(), null, 2)}</div>
            <div>调试信息: {JSON.stringify(debugInfo, null, 2)}</div>
          </div>
        </Card>
      )}

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
              <Divider orientation="left">基本信息</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="产品线"
                name="product_line_id"
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
                label="主机型号"
                name="host_model_id"
                rules={[{ required: true, message: '请选择主机型号' }]}
              >
                <Select 
                  placeholder="请选择主机型号"
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
                label="料号"
                name="part_number"
                rules={[{ required: true, message: '请输入料号' }]}
              >
                <Input placeholder="请输入料号" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="型号"
                name="model"
              >
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="电压"
                name="voltage"
              >
                <Input placeholder="例如: 220V" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="品牌"
                name="brand"
              >
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>

            {/* 名称信息 */}
            <Col span={24}>
              <Divider orientation="left">名称信息</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
                label="中文名称"
                name="name_zh"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="英文名称"
                name="name_en"
                rules={[{ required: true, message: '请输入英文名称' }]}
              >
                <Input placeholder="请输入英文名称" />
              </Form.Item>
            </Col>

            {/* 规格参数 */}
            <Col span={24}>
              <Divider orientation="left">规格参数</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
                label="规格参数(公制)"
                name="spec"
              >
                <TextArea rows={3} placeholder="请输入公制规格参数" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="规格参数(英制)"
                name="spec_imperial"
              >
                <TextArea rows={3} placeholder="请输入英制规格参数" />
              </Form.Item>
            </Col>

            {/* 包装信息 */}
            <Col span={24}>
              <Divider orientation="left">包装信息</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="包装尺寸(cm)"
                name="package_size_cm"
              >
                <Input placeholder="例如: 40×34.5×39" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="包装尺寸(inch)"
                name="package_size_inch"
              >
                <Input placeholder="例如: 15.7×13.6×15.4" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="单箱数量"
                name="pcs_per_box"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入单箱数量" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="净重(kg)"
                name="net_weight_kg"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="净重" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="净重(lbs)"
                name="net_weight_lbs"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="净重" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="毛重(kg)"
                name="gross_weight_kg"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="毛重" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="毛重(lbs)"
                name="gross_weight_lbs"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="毛重" />
              </Form.Item>
            </Col>

            {/* 托盘信息 */}
            <Col span={24}>
              <Divider orientation="left">托盘信息</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="托盘尺寸(cm)"
                name="pallet_size_cm"
              >
                <Input placeholder="例如: 100×120" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="托盘尺寸(inch)"
                name="pallet_size_inch"
              >
                <Input placeholder="例如: 39.4×47.2" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="一托数量"
                name="pcs_per_pallet"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="一托数量" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="打托高度(cm)"
                name="pallet_height_cm"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="打托高度" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="打托高度(inch)"
                name="pallet_height_inch"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="打托高度" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="整托毛重(kg)"
                name="pallet_gross_weight_kg"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="整托毛重" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="整托毛重(lbs)"
                name="pallet_gross_weight_lbs"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="整托毛重" />
              </Form.Item>
            </Col>

            {/* 其他信息 */}
            <Col span={24}>
              <Divider orientation="left">其他信息</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
                label="产品图片URL"
                name="image_url"
              >
                <Input placeholder="请输入图片URL" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="publish">已发布</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="trash">回收站</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="单位"
                name="unit"
                rules={[{ required: true, message: '请选择单位' }]}
              >
                <Select>
                  <Option value="pcs">个</Option>
                  <Option value="roll">卷</Option>
                  <Option value="box">箱</Option>
                </Select>
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
                {isEdit ? '保存更改' : '创建料号'}
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

export default PartEditPage; 