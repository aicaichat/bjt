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
  AutoComplete,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { consumableModelService, ConsumableModelFormData } from '../../services/admin-consumable.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;

const ConsumableModelEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);

  // 智能提示功能状态
  const [selectedProductLineId, setSelectedProductLineId] = useState<number>(1);
  const [consumableModelOptions, setConsumableModelOptions] = useState<Array<{value: string}>>([]);
  const [consumableDescZhOptions, setConsumableDescZhOptions] = useState<Array<{value: string}>>([]);
  const [consumableDescEnOptions, setConsumableDescEnOptions] = useState<Array<{value: string}>>([]);

  const isEditMode = !!id;
  const productLineFromUrl = searchParams.get('product_line_id');

  // 获取耗材型号上下文数据用于智能提示
  const fetchConsumableModelContextData = async (productLineId: number) => {
    try {
      console.log('[ConsumableModelEditPage] 获取耗材型号上下文数据', { productLineId });
      
      const response = await consumableModelService.getConsumableModels({
        page: 1,
        per_page: 100,
        product_line_id: productLineId,
        status: 'publish'
      });
      
      console.log('[ConsumableModelEditPage] 耗材型号上下文数据API响应', response);
      
      const consumableModels = response.items || [];
      
      // 提取型号选项
      const modelOptions = consumableModels.map(model => ({
        value: model.model
      }));
      
      // 提取中文描述选项（去重）
      const descZhOptions = [...new Set(
        consumableModels
          .filter(model => model.description?.zh)
          .map(model => model.description.zh)
      )].map(desc => ({ value: desc }));
      
      // 提取英文描述选项（去重）
      const descEnOptions = [...new Set(
        consumableModels
          .filter(model => model.description?.en)
          .map(model => model.description.en)
      )].map(desc => ({ value: desc }));
      
      console.log('[ConsumableModelEditPage] 处理后的选项', {
        modelOptions: modelOptions.length,
        descZhOptions: descZhOptions.length,
        descEnOptions: descEnOptions.length
      });
      
      // 更新状态
      setConsumableModelOptions(modelOptions);
      setConsumableDescZhOptions(descZhOptions);
      setConsumableDescEnOptions(descEnOptions);
      
    } catch (error) {
      console.error('[ConsumableModelEditPage] 获取耗材型号上下文数据失败:', error);
      // 清空所有选项
      setConsumableModelOptions([]);
      setConsumableDescZhOptions([]);
      setConsumableDescEnOptions([]);
    }
  };

  // 产品线变化处理
  const handleProductLineChange = (productLineId: number) => {
    console.log('[ConsumableModelEditPage] 产品线变化', { productLineId });
    setSelectedProductLineId(productLineId);
    
    // 清空相关字段
    form.setFieldValue('model', '');
    
    // 清空所有智能提示选项
    setConsumableModelOptions([]);
    setConsumableDescZhOptions([]);
    setConsumableDescEnOptions([]);
    
    // 加载产品线级别的数据
    fetchConsumableModelContextData(productLineId);
  };

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    
    if (isEditMode && id) {
      loadConsumableModel(parseInt(id));
    } else {
      // 新建时设置默认值
      const defaultProductLineId = productLineFromUrl ? parseInt(productLineFromUrl) : 1;
      const defaultValues = {
        product_line_id: defaultProductLineId,
        model: '',
        description: { zh: '', en: '' },
        status: 'publish',
      };
      form.setFieldsValue(defaultValues);
      setSelectedProductLineId(defaultProductLineId);
    }
  }, [id, isEditMode, form, productLineFromUrl]);

  // 加载上下文数据
  useEffect(() => {
    if (selectedProductLineId) {
      fetchConsumableModelContextData(selectedProductLineId);
    }
  }, [selectedProductLineId]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines({
        page: 1,
        per_page: 100,
        status: 'publish'
      });
      setProductLines(response.items || []);
    } catch (error) {
      console.error('[ConsumableModelEditPage] 加载产品线失败:', error);
      message.error('获取产品线数据失败');
    }
  };

  const loadConsumableModel = async (modelId: number) => {
    try {
      setLoading(true);
      console.log('[ConsumableModelEditPage] 加载耗材型号数据', { modelId });
      
      const model = await consumableModelService.getConsumableModel(modelId);
      console.log('[ConsumableModelEditPage] 耗材型号数据响应', model);
      
      // 填充表单
      form.setFieldsValue({
        model: model.model,
        product_line_id: model.product_line_id,
        description: model.description,
        status: model.status
      });
      
      // 设置产品线ID用于智能提示
      if (model.product_line_id) {
        setSelectedProductLineId(model.product_line_id);
      }
    } catch (error) {
      console.error('[ConsumableModelEditPage] 加载耗材型号数据失败:', error);
      message.error('获取消耗品型号数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 表单提交
  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      console.log('[ConsumableModelEditPage] 提交表单数据', values);

      // 客户端验证
      if (!values.product_line_id) {
        message.error('请选择产品线');
        return;
      }
      if (!values.model) {
        message.error('请输入型号名称');
        return;
      }

      const formData: ConsumableModelFormData = {
        model: values.model,
        product_line_id: values.product_line_id,
        description: values.description || { zh: '', en: '' },
        status: values.status,
      };

      if (isEditMode) {
        await consumableModelService.updateConsumableModel(Number(id), formData);
        message.success('消耗品型号更新成功');
      } else {
        await consumableModelService.createConsumableModel(formData);
        message.success('消耗品型号创建成功');
      }
      navigate('/admin/consumables');
    } catch (error: any) {
      console.error('[ConsumableModelEditPage] 提交失败:', error);
      
      // 详细错误处理
      if (error?.response?.data?.message) {
        message.error(`提交失败: ${error.response.data.message}`);
      } else if (error?.message) {
        message.error(`提交失败: ${error.message}`);
      } else {
        message.error(isEditMode ? '更新消耗品型号失败' : '创建消耗品型号失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/consumables');
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
    <div className="consumable-model-edit-page">
      <AdminPageHeader
        title={isEditMode ? '编辑耗材型号' : '新增耗材型号'}
        description={isEditMode ? `编辑耗材型号 ID: ${id}` : '创建新的耗材型号'}
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
          onFinish={handleSubmit}
          disabled={submitting}
          scrollToFirstError
          initialValues={{
            product_line_id: 1,
            status: 'publish',
            description: { zh: '', en: '' }
          }}
        >
          {/* 基本信息 */}
          <Divider orientation="left">基本信息 (Basic Info)</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="产品线 (Product Line)"
                name="product_line_id"
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <Select
                  placeholder="请选择产品线"
                  onChange={handleProductLineChange}
                >
                  {productLines.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.title_zh || item.title_en || `产品线${item.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="型号名称 (Model Name)"
                name="model"
                rules={[{ required: true, message: '请输入型号名称' }]}
                extra={`参考该产品线下已有的耗材型号，当前共 ${consumableModelOptions.length} 个型号`}
              >
                <AutoComplete
                  options={consumableModelOptions}
                  placeholder="请输入型号名称，可参考下拉提示"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="中文描述 (Chinese Description)"
                name={['description', 'zh']}
                extra={`参考该产品线下已有的耗材中文描述，当前共 ${consumableDescZhOptions.length} 个描述`}
              >
                <AutoComplete
                  options={consumableDescZhOptions}
                  placeholder="请输入中文描述，可参考下拉提示"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="英文描述 (English Description)"
                name={['description', 'en']}
                extra={`参考该产品线下已有的耗材英文描述，当前共 ${consumableDescEnOptions.length} 个描述`}
              >
                <AutoComplete
                  options={consumableDescEnOptions}
                  placeholder="请输入英文描述，可参考下拉提示"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 操作按钮 */}
          <Form.Item style={{ marginTop: 32, textAlign: 'center' }}>
            <Space size="large">
              <Button onClick={handleBack} size="large">
                取消 (Cancel)
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={submitting}
                size="large"
              >
                {isEditMode ? '更新耗材型号 (Update Model)' : '创建耗材型号 (Create Model)'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ConsumableModelEditPage; 