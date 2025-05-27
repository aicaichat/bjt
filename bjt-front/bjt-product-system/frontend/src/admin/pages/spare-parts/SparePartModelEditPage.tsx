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
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import MultilingualInput from '../../components/common/MultilingualInput';
import FileUploader from '../../components/common/FileUploader';
import adminProductLineService from '../../services/admin-product-line.service';

// 严格对应wp_bjt_spare_part_models表的13个字段
interface SparePartModelFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 备件型号编码 - 必填，同产品线下唯一
  title_zh: string;              // 中文名称 - 必填
  title_en: string;              // 英文名称 - 必填
  description_zh: string;        // 中文描述
  description_en: string;        // 英文描述
  type: string;                  // 备件类型
  image1_url: string;            // 主图URL
  image2_url: string;            // 副图URL
  explosion_diagram_pdf: string; // 爆炸图PDF文件URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

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

  const isEditMode = !!id;
  const productLineFromUrl = searchParams.get('product_line_id');

  // 备件类型选项
  const typeOptions = [
    { value: 'standard', label: '标准备件' },
    { value: 'consumable', label: '易损备件' },
    { value: 'critical', label: '关键备件' },
    { value: 'optional', label: '可选备件' },
  ];

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    
    if (isEditMode && id) {
      loadSparePartModel(parseInt(id));
    } else {
      // 新建时设置默认值
      const defaultValues = {
        product_line_id: productLineFromUrl ? parseInt(productLineFromUrl) : undefined,
        model: '',
        title_zh: '',
        title_en: '',
        description_zh: '',
        description_en: '',
        type: 'standard',
        image1_url: '',
        image2_url: '',
        explosion_diagram_pdf: '',
        status: 'draft' as const,
        sort_order: 0,
      };
      form.setFieldsValue(defaultValues);
    }
  }, [id, isEditMode, form, productLineFromUrl]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      setProductLines(response.items);
    } catch (error) {
      console.error('加载产品线失败:', error);
      message.error('加载产品线失败');
    }
  };

  const loadSparePartModel = async (modelId: number) => {
    try {
      setLoading(true);
      // Mock API调用 - 实际应该调用备件型号服务
      const mockData = {
        id: modelId,
        product_line_id: 1,
        model: 'SPM-001',
        title_zh: '标准备件型号',
        title_en: 'Standard Spare Part Model',
        description_zh: '这是一个标准备件型号的描述',
        description_en: 'This is a description of standard spare part model',
        type: 'standard',
        image1_url: '/images/spare-parts/spm-001-main.jpg',
        image2_url: '/images/spare-parts/spm-001-side.jpg',
        explosion_diagram_pdf: '/files/spare-parts/spm-001-diagram.pdf',
        status: 'publish',
        sort_order: 1,
      };

      form.setFieldsValue(mockData);
    } catch (error) {
      console.error('加载备件型号数据失败:', error);
      message.error('加载备件型号数据失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      // 转换表单数据为API格式
      const formData: Partial<SparePartModelFormData> = {
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
        // await sparePartModelService.updateSparePartModel(parseInt(id), formData);
        message.success('备件型号更新成功');
      } else {
        // await sparePartModelService.createSparePartModel(formData);
        message.success('备件型号创建成功');
      }

      navigate('/admin/spare-parts');
    } catch (error) {
      console.error('保存备件型号失败:', error);
      message.error('保存备件型号失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/spare-parts');
  };

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
        >
          {/* 基本信息 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">基本信息</h3>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  label="所属产品线"
                  name="product_line_id"
                  rules={[{ required: true, message: '请选择所属产品线' }]}
                >
                  <Select placeholder="请选择产品线">
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
                  label="备件型号编码"
                  name="model"
                  rules={[{ required: true, message: '请输入备件型号编码' }]}
                  extra="在同一产品线下必须唯一"
                >
                  <Input placeholder="例如: SPM-001" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="备件类型"
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

              <Col span={12}>
                <Form.Item
                  label="中文名称"
                  name="title_zh"
                  rules={[{ required: true, message: '请输入中文名称' }]}
                >
                  <Input placeholder="例如: 标准备件型号" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="英文名称"
                  name="title_en"
                  rules={[{ required: true, message: '请输入英文名称' }]}
                >
                  <Input placeholder="例如: Standard Spare Part Model" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="中文描述"
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
                  label="英文描述"
                  name="description_en"
                >
                  <TextArea 
                    rows={3}
                    placeholder="Detailed English description of spare part model" 
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="状态"
                  name="status"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select>
                    <Option value="draft">草稿</Option>
                    <Option value="publish">已发布</Option>
                    <Option value="trash">回收站</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="排序"
                  name="sort_order"
                  extra="数值越小排序越靠前"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* 图片上传 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">图片资料</h3>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  label="主图"
                  name="image1_url"
                  extra="支持 JPG, PNG, GIF, WEBP 格式，文件大小不超过 10MB"
                >
                  <FileUploader
                    type="image"
                    maxSize={10}
                    placeholder="上传主图"
                    preview
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="副图"
                  name="image2_url"
                  extra="支持 JPG, PNG, GIF, WEBP 格式，文件大小不超过 10MB"
                >
                  <FileUploader
                    type="image"
                    maxSize={10}
                    placeholder="上传副图"
                    preview
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="爆炸图PDF"
                  name="explosion_diagram_pdf"
                  extra="支持 PDF 格式，文件大小不超过 20MB"
                >
                  <FileUploader
                    type="pdf"
                    maxSize={20}
                    placeholder="上传爆炸图PDF"
                    accept=".pdf"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

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
                {isEditMode ? '保存更改' : '创建备件型号'}
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

export default SparePartModelEditPage; 