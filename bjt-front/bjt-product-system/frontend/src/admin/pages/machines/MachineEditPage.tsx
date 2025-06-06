import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  AutoComplete,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import DictionarySelect from '../../components/common/DictionarySelect';
import MultilingualInput, { MultilingualValue } from '../../components/common/MultilingualInput';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import adminHostModelService from '../../services/admin-host-model.service';
import { AdminHostModel } from '../../types/admin-models.types';
import adminProductLineService from '../../services/admin-product-line.service';
import { useTranslation } from 'react-i18next';
import FileUrlInput from '../../components/common/FileUrlInput';

// 使用AdminHostModel接口
const { Option } = Select;

interface MachineEditPageProps {
  mode?: 'create' | 'edit';
}

const MachineEditPage: React.FC<MachineEditPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [modelOptions, setModelOptions] = useState<{ value: string; label: string }[]>([]);
  
  const { t } = useAdminI18n();

  const isEditMode = mode === 'edit' || !!id;

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    if (isEditMode && id) {
      loadHostModel(id);
    } else {
      // 新建时设置默认值
      form.setFieldsValue({
        product_line_id: 1, // 默认设置为气垫机产品线
        model: '',
        title: {
          zh: '',
          en: ''
        },
        description: {
          zh: '',
          en: ''
        },
        image1_url: '',
        image2_url: '',
        explosion_diagram_pdf: '',
        spec_pdf: '',
        status: 'publish',
        sort_order: 1,
      });
      // 加载默认产品线的主机型号
      loadHostModels(1);
    }
  }, [id, isEditMode, form]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      if (response && response.items && Array.isArray(response.items)) {
        setProductLines(response.items);
      } else {
        console.warn('Invalid product lines response:', response);
        setProductLines([]);
      }
    } catch (error) {
      console.error('加载产品线失败', error);
      message.error('加载产品线失败');
      setProductLines([]);
    }
  };

  const loadHostModels = async (productLineId?: number) => {
    try {
      // 只获取当前产品线的主机型号
      const currentProductLineId = productLineId || form.getFieldValue('product_line_id') || 1;
      const response = await adminHostModelService.getHostModels({
        product_line_id: currentProductLineId,
        status: 'publish', // 只显示已发布的型号
        page_size: 100 // 获取更多数据用于自动完成
      });
      
      if (response && response.items && Array.isArray(response.items)) {
        const models = response.items
          .filter(item => item.model && item.model.trim()) // 过滤掉空值
          .map(item => ({
            value: item.model,
            label: `${item.model}${item.title_zh ? ` - ${item.title_zh}` : ''}`
          }));
        setModelOptions(models);
        console.log('加载主机型号成功:', models);
      } else {
        setModelOptions([]);
        console.log('没有找到主机型号数据');
      }
    } catch (error) {
      console.error('加载主机型号失败', error);
      setModelOptions([]);
    }
  };

  const loadHostModel = async (hostModelId: string) => {
    try {
      setLoading(true);
      const data = await adminHostModelService.getHostModel(hostModelId);
      
      // 转换数据格式以适应表单
      form.setFieldsValue({
        product_line_id: data.product_line_id,
        model: data.model,
        title: {
          zh: data.title_zh || '',
          en: data.title_en || ''
        },
        description: {
          zh: data.description_zh || '',
          en: data.description_en || ''
        },
        image1_url: data.image1_url,
        image2_url: data.image2_url,
        explosion_diagram_pdf: data.explosion_diagram_pdf,
        spec_pdf: data.spec_pdf,
        status: data.status,
        sort_order: data.sort_order,
      });
    } catch (error) {
      console.error(t('message.loadMachineDataFailed', { ns: 'machines' }), error);
      message.error(t('message.loadMachineDataFailed', { ns: 'machines' }));
    } finally {
      setLoading(false);
    }
  };

  const validateModel = async (rule: any, value: string) => {
    if (!value) {
      throw new Error("请输入型号");
    }
    // 可以在这里添加更多的型号格式验证逻辑
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      console.log('MachineEditPage.onFinish - Original form values:', values);

      // 转换表单数据为API格式，不过滤多语言对象
      const formData: Partial<AdminHostModel> = {
        product_line_id: values.product_line_id ? String(values.product_line_id) : '1', // 默认值
        model: values.model ? String(values.model) : '', // 必填字段，不能为undefined
        title_zh: values.title?.zh ? String(values.title.zh) : undefined,
        title_en: values.title?.en ? String(values.title.en) : undefined,
        description_zh: values.description?.zh ? String(values.description.zh) : undefined,
        description_en: values.description?.en ? String(values.description.en) : undefined,
        image1_url: values.image1_url ? String(values.image1_url) : undefined,
        image2_url: values.image2_url ? String(values.image2_url) : undefined,
        explosion_diagram_pdf: values.explosion_diagram_pdf ? String(values.explosion_diagram_pdf) : undefined,
        spec_pdf: values.spec_pdf ? String(values.spec_pdf) : undefined,
        status: values.status ? String(values.status) : 'publish',
        sort_order: values.sort_order ? parseInt(String(values.sort_order)) : 0,
      };

      // 移除undefined值，但保留必填字段
      const submitData = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          // 保留必填字段即使为空字符串
          const requiredFields = ['product_line_id', 'model', 'status', 'sort_order'];
          return requiredFields.includes(key) || value !== undefined;
        })
      );

      console.log('MachineEditPage.onFinish - Processed submit data:', submitData);

      if (isEditMode && id) {
        await adminHostModelService.updateHostModel(id, submitData);
        message.success(t('message.updateSuccess', { ns: 'machines' }));
      } else {
        await adminHostModelService.createHostModel(submitData);
        message.success(t('message.createSuccess', { ns: 'machines' }));
      }

      navigate('/admin/machines');
    } catch (error: any) {
      console.error(t('message.saveFailed', { ns: 'machines' }), error);
      
      // 详细错误信息调试
      console.error('MachineEditPage.onFinish - Detailed error:', {
        error,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers
      });
      
      // 显示更详细的错误信息
      let errorMessage = t('message.saveFailed', { ns: 'machines' });
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
    navigate('/admin/machines');
  };

  return (
    <div className="machine-edit-page">
      <AdminPageHeader
        title={isEditMode ? "编辑主机型号" : "新增主机型号"}
        description={isEditMode ? `编辑主机型号 ID: ${id}` : "创建新的主机型号"}
        extra={
          <Space>
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
          </Space>
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
          <Row gutter={24}>
            {/* 基本信息 */}
            <Col span={24}>
              <Divider orientation="left">基本信息 (Basic Info)</Divider>
            </Col>

            <Col span={8}>
              <Form.Item
                label="产品线 (Product Line)"
                name="product_line_id"
              >
                <Select placeholder="请选择产品线" onChange={(value) => {
                  form.setFieldValue('model', '');
                  loadHostModels(value);
                }}>
                  {(productLines || []).map((line) => (
                    <Option key={line.id} value={line.id}>
                      {line.title_zh || line.title_en || line.name || `产品线${line.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="型号 (Model)"
                name="model"
                rules={[
                  { required: true, message: "请输入型号" },
                  { validator: validateModel },
                ]}
                extra="请输入机器型号，如：LA-E4C"
              >
                <AutoComplete
                  options={modelOptions}
                  placeholder="请输入机器型号"
                  filterOption={(inputValue, option) =>
                    option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1 ||
                    option?.label?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  allowClear
                  autoComplete="off"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="状态 (Status)"
                name="status"
              >
                <DictionarySelect
                  dictionaryType="statuses"
                  placeholder="请选择状态"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="排序 (Sort Order)"
                name="sort_order"
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            {/* 多语言名称 */}
            <Col span={24}>
              <Divider orientation="left">名称信息 (Item Info)</Divider>
            </Col>

            <Col span={24}>
              <Form.Item
                label="名称 (Item)"
                name="title"
              >
                <MultilingualInput
                  type="input"
                  required={false}
                  enableI18nUI={true}
                  showCopyButton={true}
                  showTranslateHint={true}
                  placeholder={{
                    zh: "请输入中文名称",
                    en: "请输入英文名称"
                  }}
                />
              </Form.Item>
            </Col>

            {/* 描述信息 */}
            <Col span={24}>
              <Divider orientation="left">描述信息 (Description)</Divider>
            </Col>

            <Col span={24}>
              <Form.Item
                label="描述 (Description)"
                name="description"
              >
                <MultilingualInput
                  type="textarea"
                  rows={4}
                  enableI18nUI={true}
                  showCopyButton={true}
                  showTranslateHint={true}
                  placeholder={{
                    zh: "请输入中文描述",
                    en: "请输入英文描述"
                  }}
                />
              </Form.Item>
            </Col>

            {/* 图片和文档 */}
            <Col span={24}>
              <Divider orientation="left">图片和文档 (Images & Documents)</Divider>
            </Col>

            <Col span={12}>
              <Form.Item
                label="主图URL (Main Image URL)"
                name="image1_url"
                extra="请输入图片URL地址"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址"
                  fileType="image"
                  uploadPath="/uploads/machines/images/"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="副图URL (Secondary Image URL)"
                name="image2_url"
                extra="请输入图片URL地址"
              >
                <FileUrlInput
                  placeholder="请输入图片URL地址"
                  fileType="image"
                  uploadPath="/uploads/machines/images/"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="爆炸图PDF (Explosion Diagram PDF)"
                name="explosion_diagram_pdf"
                extra="请输入PDF文件URL地址"
              >
                <FileUrlInput
                  placeholder="请输入PDF文件URL地址"
                  fileType="pdf"
                  uploadPath="/uploads/machines/pdfs/"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="规格PDF (Specification PDF)"
                name="spec_pdf"
                extra="请输入PDF文件URL地址"
              >
                <FileUrlInput
                  placeholder="请输入PDF文件URL地址"
                  fileType="pdf"
                  uploadPath="/uploads/machines/pdfs/"
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
                {isEditMode ? "保存修改" : "创建型号"}
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

export default MachineEditPage; 