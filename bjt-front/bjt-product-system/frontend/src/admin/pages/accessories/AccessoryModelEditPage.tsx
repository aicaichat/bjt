import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Select, Card, Row, Col, message, Spin, InputNumber, AutoComplete
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import DictionarySelect from '../../components/common/DictionarySelect';
import FileUrlInput from '../../components/common/FileUrlInput';
import { useAdminApi } from '../../hooks/useAdminApi';
import { accessoryModelService, AccessoryModelFormData } from '../../services/admin-accessory.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Option } = Select;
const { TextArea } = Input;

const AccessoryModelEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { t } = useAdminI18n();
  const [selectedProductLineId, setSelectedProductLineId] = useState<number>(1);
  const [accessoryModelOptions, setAccessoryModelOptions] = useState<Array<{value: string}>>([]);

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

  // 获取配件型号详情（编辑时）
  const {
    data: modelData,
    loading: modelLoading
  } = useAdminApi(
    () => isEdit ? accessoryModelService.getAccessoryModel(parseInt(id!)) : Promise.resolve(null),
    {},
    [id, isEdit]
  );

  // 获取该产品线下已有的配件型号作为自动完成选项
  const fetchAccessoryModels = async (productLineId: number) => {
    try {
      console.log('AccessoryModelEditPage - Fetching accessory models for product line:', productLineId);
      const response = await accessoryModelService.getAccessoryModels({
        product_line_id: productLineId,
        status: 'publish',
        per_page: 100
      });
      
      if (response && response.items) {
        const modelOptions = response.items.map((model: any) => ({
          value: model.model
        }));
        setAccessoryModelOptions(modelOptions);
        console.log('AccessoryModelEditPage - Accessory model options loaded:', modelOptions);
      }
    } catch (error) {
      console.error('AccessoryModelEditPage - Failed to fetch accessory models:', error);
      setAccessoryModelOptions([]);
    }
  };

  // 当获取到数据时，填充表单
  useEffect(() => {
    if (modelData && isEdit) {
      form.setFieldsValue({
        product_line_id: modelData.product_line_id,
        model: modelData.model,
        title_zh: modelData.title_zh,
        title_en: modelData.title_en,
        description_zh: modelData.description_zh || '',
        description_en: modelData.description_en || '',
        type: modelData.type || '',
        image1_url: modelData.image1_url || '',
        image2_url: modelData.image2_url || '',
        explosion_diagram_pdf: modelData.explosion_diagram_pdf || '',
        status: modelData.status,
        sort_order: modelData.sort_order || 0,
      });
      setSelectedProductLineId(modelData.product_line_id);
    } else if (!isEdit) {
      // 新建时设置默认值
      console.log('AccessoryModelEditPage - Setting default values for new model');
      const defaultValues = {
        product_line_id: 1,
        status: 'publish',
        sort_order: 0,
      };
      form.setFieldsValue(defaultValues);
      setSelectedProductLineId(1);
      console.log('AccessoryModelEditPage - Default values set:', defaultValues);
    }
  }, [modelData, form, isEdit]);

  // 当产品线或默认值设置完成后，加载配件型号选项
  useEffect(() => {
    if (selectedProductLineId) {
      fetchAccessoryModels(selectedProductLineId);
    }
  }, [selectedProductLineId]);

  const handleProductLineChange = (productLineId: number) => {
    console.log('AccessoryModelEditPage - Product line changed to:', productLineId);
    setSelectedProductLineId(productLineId);
    // 清空型号字段，因为切换了产品线
    form.setFieldValue('model', '');
  };

  const handleSubmit = async (values: AccessoryModelFormData) => {
    try {
      console.log('AccessoryModelEditPage - Form values submitted:', values);
      
      // 验证必填字段（与后端一致）
      const requiredFields = {
        product_line_id: '产品线',
        model: '型号',
        title_zh: '中文名称',
        title_en: '英文名称'
      };
      
      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!values[field as keyof AccessoryModelFormData] || 
            (typeof values[field as keyof AccessoryModelFormData] === 'string' && 
             (values[field as keyof AccessoryModelFormData] as string).trim() === '')) {
          missingFields.push(label);
        }
      }
      
      if (missingFields.length > 0) {
        message.error(`请填写必填字段：${missingFields.join('、')}`);
        return;
      }

      // 准备提交数据，确保数据类型正确
      const formData: AccessoryModelFormData = {
        product_line_id: values.product_line_id,
        model: values.model,
        title_zh: values.title_zh,
        title_en: values.title_en,
        description_zh: values.description_zh || '',
        description_en: values.description_en || '',
        type: values.type || '',
        image1_url: values.image1_url || '',
        image2_url: values.image2_url || '',
        explosion_diagram_pdf: values.explosion_diagram_pdf || '',
        status: values.status || 'publish',
        sort_order: values.sort_order || 0,
      };

      console.log('AccessoryModelEditPage - Data to be submitted to API:', formData);

      if (isEdit) {
        const result = await accessoryModelService.updateAccessoryModel(parseInt(id!), formData);
        console.log('AccessoryModelEditPage - Update result:', result);
        message.success(t('message.modelUpdateSuccess', { ns: 'accessories' }));
      } else {
        const result = await accessoryModelService.createAccessoryModel(formData);
        console.log('AccessoryModelEditPage - Create result:', result);
        message.success(t('message.modelCreateSuccess', { ns: 'accessories' }));
      }
      navigate('/admin/accessories');
    } catch (error) {
      console.error('AccessoryModelEditPage - Submit error:', error);
      
      // 提供更详细的错误信息
      let errorMessage = isEdit ? t('message.modelUpdateFailed', { ns: 'accessories' }) : t('message.modelCreateFailed', { ns: 'accessories' });
      
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage += `: ${error.message}`;
        } else if ('data' in error && error.data && error.data.message) {
          errorMessage += `: ${error.data.message}`;
        }
      }
      
      message.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/admin/accessories');
  };

  const productLines = (productLineData as any)?.items || [];

  if (productLineLoading || (isEdit && modelLoading)) {
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
        title={isEdit ? t('editModel.title', { ns: 'accessories' }) : t('createModel.title', { ns: 'accessories' })}
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
            sort_order: 0,
          }}
        >
          {/* 基本信息 */}
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
                name="model"
                label="型号 (Model)"
                rules={[{ required: true, message: "请输入型号" }]}
                extra={`参考该产品线下已有的配件型号，当前共 ${accessoryModelOptions.length} 个配件型号`}
              >
                <AutoComplete
                  options={accessoryModelOptions}
                  placeholder="请输入型号，可参考下拉提示中的已有配件型号"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 名称信息 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title_zh"
                label="中文名称 (Chinese Name)"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title_en"
                label="英文名称 (English Name)"
                rules={[{ required: true, message: 'Please enter English name' }]}
              >
                <Input placeholder="Please enter English name" />
              </Form.Item>
            </Col>
          </Row>

          {/* 描述信息 */}
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

          {/* 分类和图片 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="配件类型 (Accessory Type)"
              >
                <Input placeholder="请输入配件类型" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="image1_url"
                label="主图 (Main Image)"
                extra="支持上传图片文件或输入图片URL地址，文件大小不超过 10MB"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址或点击上传"
                  fileType="image"
                  maxSize={10}
                  uploadPath="/uploads/accessories/images/"
                  preview
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 副图和PDF */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="image2_url"
                label="副图 (Secondary Image)"
                extra="支持上传图片文件或输入图片URL地址，文件大小不超过 10MB"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址或点击上传"
                  fileType="image"
                  maxSize={10}
                  uploadPath="/uploads/accessories/images/"
                  preview
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="explosion_diagram_pdf"
                label="爆炸图PDF (Explosion Diagram PDF)"
                extra="支持上传PDF文件或输入PDF URL地址，文件大小不超过 20MB"
              >
                <FileUrlInput
                  placeholder="请输入PDF URL地址或点击上传"
                  fileType="pdf"
                  maxSize={20}
                  uploadPath="/uploads/accessories/pdfs/"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 排序和状态 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="sort_order"
                label="排序 (Sort Order)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入排序数字"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态 (Status)"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="publish">发布 (Published)</Option>
                  <Option value="draft">草稿 (Draft)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancel}>取消 (Cancel)</Button>
              <Button type="primary" htmlType="submit">
                {isEdit ? '更新 (Update)' : '创建 (Create)'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AccessoryModelEditPage; 