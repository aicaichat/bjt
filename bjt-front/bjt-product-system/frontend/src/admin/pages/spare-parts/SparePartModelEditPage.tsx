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
  Row,
  Col,
  InputNumber,
  Divider,
  AutoComplete,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import MultilingualInput from '../../components/common/MultilingualInput';
import FileUploader from '../../components/common/FileUploader';
import FileUrlInput from '../../components/common/FileUrlInput';
import { sparePartModelService, SparePartModelFormData } from '../../services/admin-spare-part.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { TextArea } = Input;
const { Option } = Select;

const SparePartModelEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);

  // 智能提示功能状态
  const [selectedProductLineId, setSelectedProductLineId] = useState<number>(1);
  const [sparePartModelOptions, setSparePartModelOptions] = useState<Array<{value: string}>>([]);
  const [sparePartTitleZhOptions, setSparePartTitleZhOptions] = useState<Array<{value: string}>>([]);
  const [sparePartTitleEnOptions, setSparePartTitleEnOptions] = useState<Array<{value: string}>>([]);
  const [sparePartTypeOptions, setSparePartTypeOptions] = useState<Array<{value: string}>>([]);

  const isEditMode = !!id;
  const productLineFromUrl = searchParams.get('product_line_id');

  // 备件类型选项
  const typeOptions = [
    { value: 'standard', label: '标准备件 (Standard)' },
    { value: 'consumable', label: '易损备件 (Consumable)' },
    { value: 'critical', label: '关键备件 (Critical)' },
    { value: 'optional', label: '可选备件 (Optional)' },
  ];

  // 获取备件型号上下文数据用于智能提示
  const fetchSparePartModelContextData = async (productLineId: number) => {
    try {
      console.log('[SparePartModelEditPage] 获取备件型号上下文数据', { productLineId });
      
      const response = await sparePartModelService.getSparePartModels({
        page: 1,
        page_size: 100,
        product_line_id: productLineId,
        status: 'publish'
      });
      
      console.log('[SparePartModelEditPage] 备件型号上下文数据API响应', response);
      
      const sparePartModels = response.items || [];
      
      // 提取型号选项
      const modelOptions = sparePartModels.map(model => ({
        value: model.model
      }));
      
      // 提取中文标题选项（去重）
      const titleZhOptions = [...new Set(
        sparePartModels
          .filter(model => model.title_zh)
          .map(model => model.title_zh)
      )].map(title => ({ value: title }));
      
      // 提取英文标题选项（去重）
      const titleEnOptions = [...new Set(
        sparePartModels
          .filter(model => model.title_en)
          .map(model => model.title_en)
      )].map(title => ({ value: title }));
      
      // 提取类型选项（去重）
      const typeOptionsFromData = [...new Set(
        sparePartModels
          .filter(model => model.type)
          .map(model => model.type)
      )].map(type => ({ value: type }));
      
      console.log('[SparePartModelEditPage] 处理后的选项', {
        modelOptions: modelOptions.length,
        titleZhOptions: titleZhOptions.length,
        titleEnOptions: titleEnOptions.length,
        typeOptions: typeOptionsFromData.length
      });
      
      // 更新状态
      setSparePartModelOptions(modelOptions);
      setSparePartTitleZhOptions(titleZhOptions);
      setSparePartTitleEnOptions(titleEnOptions);
      setSparePartTypeOptions(typeOptionsFromData);
      
    } catch (error) {
      console.error('[SparePartModelEditPage] 获取备件型号上下文数据失败:', error);
      // 清空所有选项
      setSparePartModelOptions([]);
      setSparePartTitleZhOptions([]);
      setSparePartTitleEnOptions([]);
      setSparePartTypeOptions([]);
    }
  };

  // 产品线变化处理
  const handleProductLineChange = (productLineId: number) => {
    console.log('[SparePartModelEditPage] 产品线变化', { productLineId });
    setSelectedProductLineId(productLineId);
    
    // 清空相关字段
    form.setFieldValue('model', '');
    
    // 清空所有智能提示选项
    setSparePartModelOptions([]);
    setSparePartTitleZhOptions([]);
    setSparePartTitleEnOptions([]);
    setSparePartTypeOptions([]);
    
    // 加载产品线级别的数据
    fetchSparePartModelContextData(productLineId);
  };

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    
    if (isEditMode && id) {
      loadSparePartModel(parseInt(id));
    } else {
      // 新建时设置默认值
      const defaultProductLineId = productLineFromUrl ? parseInt(productLineFromUrl) : 1;
      const defaultValues = {
        product_line_id: defaultProductLineId,
        model: '',
        title_zh: '',
        title_en: '',
        description_zh: '',
        description_en: '',
        type: 'standard',
        image1_url: '',
        image2_url: '',
        explosion_diagram_pdf: '',
        status: 'publish' as const,
        sort_order: 0,
      };
      form.setFieldsValue(defaultValues);
      setSelectedProductLineId(defaultProductLineId);
    }
  }, [id, isEditMode, form, productLineFromUrl]);

  // 加载上下文数据
  useEffect(() => {
    if (selectedProductLineId) {
      fetchSparePartModelContextData(selectedProductLineId);
    }
  }, [selectedProductLineId]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines({
        page: 1,
        per_page: 100,
        status: 'publish'
      });
      setProductLines(response.items);
    } catch (error) {
      console.error('[SparePartModelEditPage] 加载产品线失败:', error);
      message.error('加载产品线失败');
    }
  };

  const loadSparePartModel = async (modelId: number) => {
    try {
      setLoading(true);
      console.log('[SparePartModelEditPage] 加载备件型号数据', { modelId });
      
      const response = await sparePartModelService.getSparePartModel(modelId);
      console.log('[SparePartModelEditPage] 备件型号数据响应', response);
      
      form.setFieldsValue(response);
      
      // 设置产品线ID用于智能提示
      if (response.product_line_id) {
        setSelectedProductLineId(response.product_line_id);
      }
    } catch (error) {
      console.error('[SparePartModelEditPage] 加载备件型号数据失败:', error);
      message.error('加载备件型号数据失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      console.log('[SparePartModelEditPage] 提交表单数据', values);

      // 客户端验证
      if (!values.product_line_id) {
        message.error('请选择产品线');
        return;
      }
      if (!values.model) {
        message.error('请输入备件型号编码');
        return;
      }
      if (!values.title_zh) {
        message.error('请输入中文名称');
        return;
      }
      if (!values.title_en) {
        message.error('请输入英文名称');
        return;
      }

      // 转换表单数据为API格式
      const formData: SparePartModelFormData = {
        product_line_id: values.product_line_id,
        model: values.model,
        title_zh: values.title_zh,
        title_en: values.title_en,
        description_zh: values.description_zh || '',
        description_en: values.description_en || '',
        type: values.type,
        image1_url: values.image1_url || '',
        image2_url: values.image2_url || '',
        explosion_diagram_pdf: values.explosion_diagram_pdf || '',
        status: values.status,
        sort_order: values.sort_order || 0,
      };

      if (isEditMode && id) {
        await sparePartModelService.updateSparePartModel(parseInt(id), formData);
        message.success('备件型号更新成功');
      } else {
        await sparePartModelService.createSparePartModel(formData);
        message.success('备件型号创建成功');
      }

      navigate('/admin/spare-parts');
    } catch (error: any) {
      console.error('[SparePartModelEditPage] 提交失败:', error);
      
      // 详细错误处理
      if (error?.response?.data?.message) {
        message.error(`提交失败: ${error.response.data.message}`);
      } else if (error?.message) {
        message.error(`提交失败: ${error.message}`);
      } else {
        message.error(isEditMode ? '更新备件型号失败' : '创建备件型号失败');
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
    <div className="spare-part-model-edit-page">
      <AdminPageHeader
        title={isEditMode ? '编辑备件型号' : '新增备件型号'}
        description={isEditMode ? `编辑备件型号 ID: ${id}` : '创建新的备件型号'}
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
          initialValues={{
            product_line_id: 1,
            status: 'publish',
            sort_order: 0,
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
                label="备件型号编码 (Model Code)"
                name="model"
                rules={[{ required: true, message: '请输入备件型号编码' }]}
                extra={`参考该产品线下已有的备件型号，当前共 ${sparePartModelOptions.length} 个型号`}
              >
                <AutoComplete
                  options={sparePartModelOptions}
                  placeholder="请输入备件型号编码，可参考下拉提示"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="备件类型 (Spare Part Type)"
                name="type"
                rules={[{ required: true, message: '请选择备件类型' }]}
              >
                <Select placeholder="选择备件类型">
                  {typeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="中文名称 (Chinese Title)"
                name="title_zh"
                rules={[{ required: true, message: '请输入中文名称' }]}
                extra={`参考该产品线下已有的备件中文名称，当前共 ${sparePartTitleZhOptions.length} 个名称`}
              >
                <AutoComplete
                  options={sparePartTitleZhOptions}
                  placeholder="请输入中文名称，可参考下拉提示"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="英文名称 (English Title)"
                name="title_en"
                rules={[{ required: true, message: '请输入英文名称' }]}
                extra={`参考该产品线下已有的备件英文名称，当前共 ${sparePartTitleEnOptions.length} 个名称`}
              >
                <AutoComplete
                  options={sparePartTitleEnOptions}
                  placeholder="请输入英文名称，可参考下拉提示"
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
                label="中文描述 (Chinese Description)"
                name="description_zh"
              >
                <TextArea 
                  rows={3}
                  placeholder="备件型号的详细中文描述" 
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="英文描述 (English Description)"
                name="description_en"
              >
                <TextArea 
                  rows={3}
                  placeholder="Detailed English description of spare part model" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
                label="排序 (Sort Order)"
                name="sort_order"
                extra="数值越小排序越靠前"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入排序数值" />
              </Form.Item>
            </Col>
          </Row>

          {/* 图片资料 */}
          <Divider orientation="left">图片资料 (Images & Documents)</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="主图 (Main Image)"
                name="image1_url"
              >
                <FileUrlInput
                  placeholder="请输入图片URL或点击上传"
                  uploadPath="/uploads/spare-parts/images/"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="副图 (Secondary Image)"
                name="image2_url"
              >
                <FileUrlInput
                  placeholder="请输入图片URL或点击上传"
                  uploadPath="/uploads/spare-parts/images/"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="爆炸图PDF (Explosion Diagram PDF)"
                name="explosion_diagram_pdf"
              >
                <FileUrlInput
                  placeholder="请输入PDF URL或点击上传"
                  uploadPath="/uploads/spare-parts/pdfs/"
                  accept=".pdf"
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
                {isEditMode ? '更新备件型号 (Update Model)' : '创建备件型号 (Create Model)'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SparePartModelEditPage; 