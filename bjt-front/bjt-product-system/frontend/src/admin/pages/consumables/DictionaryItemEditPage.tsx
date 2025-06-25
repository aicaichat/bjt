import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Typography,
  Row,
  Col,
  Upload,
  Switch,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import {
  ShapeData,
  MaterialData,
  SpecificationData,
  adminShapeService,
  adminMaterialService,
  adminSpecificationService,
} from '../../services/admin-dictionary.service';
import FileUrlInput from '../../components/common/FileUrlInput';

const { Title, Text } = Typography;
const { Option } = Select;

interface DictionaryItemEditPageProps {
  type: 'shape' | 'material' | 'specification';
  mode: 'create' | 'edit';
}

const DictionaryItemEditPage: React.FC<DictionaryItemEditPageProps> = ({ type, mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<ShapeData | MaterialData | SpecificationData | null>(null);
  
  const productLineId = parseInt(searchParams.get('product_line_id') || '1');
  
  // 获取类型相关的配置
  const getTypeConfig = () => {
    switch (type) {
      case 'shape':
        return {
          title: '形状',
          service: adminShapeService,
          fields: ['code', 'name_zh', 'name_en', 'image_url', 'image_url2', 'status', 'sort_order'],
        };
      case 'material':
        return {
          title: '材料',
          service: adminMaterialService,
          fields: ['code', 'name_zh', 'name_en', 'base_material', 'status', 'sort_order'],
        };
      case 'specification':
        return {
          title: '规格',
          service: adminSpecificationService,
          fields: ['code', 'metric_value', 'metric_unit', 'imperial_value', 'imperial_unit', 'status', 'sort_order'],
        };
      default:
        return { title: '', service: null, fields: [] };
    }
  };

  const typeConfig = getTypeConfig();

  // 获取数据（编辑模式）
  useEffect(() => {
    if (mode === 'edit' && id && typeConfig.service) {
      fetchData();
    }
  }, [mode, id, type]);

  const fetchData = async () => {
    if (!id || !typeConfig.service) return;
    
    setLoading(true);
    try {
      let response;
      switch (type) {
        case 'shape':
          // 这里需要实现单个获取的API，暂时使用列表API
          const shapesResponse = await adminShapeService.getShapes({ lang: 'zh' });
          response = shapesResponse.data.items.find(item => item.id.toString() === id);
          break;
        case 'material':
          const materialsResponse = await adminMaterialService.getMaterials({ lang: 'zh' });
          response = materialsResponse.data.items.find(item => item.id.toString() === id);
          break;
        case 'specification':
          const specificationsResponse = await adminSpecificationService.getSpecifications({ lang: 'zh' });
          response = specificationsResponse.data.items.find(item => item.id.toString() === id);
          break;
      }
      
      if (response) {
        setData(response);
        form.setFieldsValue(response);
      } else {
        message.error('数据不存在');
        navigate(-1);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const submitData = {
        ...values,
        product_line_id: productLineId,
      };
      
      if (mode === 'create') {
        switch (type) {
          case 'shape':
            await adminShapeService.createShape(submitData);
            break;
          case 'material':
            await adminMaterialService.createMaterial(submitData);
            break;
          case 'specification':
            await adminSpecificationService.createSpecification(submitData);
            break;
        }
        message.success(`${typeConfig.title}创建成功`);
      } else {
        if (!id) return;
        switch (type) {
          case 'shape':
            await adminShapeService.updateShape(parseInt(id), submitData);
            break;
          case 'material':
            await adminMaterialService.updateMaterial(parseInt(id), submitData);
            break;
          case 'specification':
            await adminSpecificationService.updateSpecification(parseInt(id), submitData);
            break;
        }
        message.success(`${typeConfig.title}更新成功`);
      }
      
      navigate(-1);
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染表单字段
  const renderFormFields = () => {
    switch (type) {
      case 'shape':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="形状代码"
                  rules={[{ required: true, message: '请输入形状代码' }]}
                >
                  <Input placeholder="如：MEX, BUB等" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sort_order"
                  label="排序"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name_zh"
                  label="中文名称"
                  rules={[{ required: true, message: '请输入中文名称' }]}
                >
                  <Input placeholder="如：气泡枕" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name_en"
                  label="英文名称"
                  rules={[{ required: true, message: '请输入英文名称' }]}
                >
                  <Input placeholder="如：Air Cushion" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="image_url"
                  label="主图URL"
                >
                  <FileUrlInput
                    placeholder="上传或输入主图URL"
                    fileType="image"
                    uploadPath="/uploads/shapes/images/"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="image_url2"
                  label="示意图URL"
                >
                  <FileUrlInput
                    placeholder="上传或输入示意图URL"
                    fileType="image"
                    uploadPath="/uploads/shapes/images/"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="status"
              label="状态"
              initialValue="publish"
            >
              <Select>
                <Option value="publish">已发布</Option>
                <Option value="draft">草稿</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'material':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="材料代码"
                  rules={[{ required: true, message: '请输入材料代码' }]}
                >
                  <Input placeholder="如：HDPE, LDPE等" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sort_order"
                  label="排序"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name_zh"
                  label="中文名称"
                  rules={[{ required: true, message: '请输入中文名称' }]}
                >
                  <Input placeholder="如：高密度聚乙烯" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name_en"
                  label="英文名称"
                  rules={[{ required: true, message: '请输入英文名称' }]}
                >
                  <Input placeholder="如：High Density Polyethylene" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="base_material"
              label="基材"
            >
              <Input placeholder="基础材料" />
            </Form.Item>
            
            <Form.Item
              name="status"
              label="状态"
              initialValue="publish"
            >
              <Select>
                <Option value="publish">已发布</Option>
                <Option value="draft">草稿</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'specification':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="规格类型"
                  rules={[{ required: true, message: '请选择规格类型' }]}
                >
                  <Select placeholder="选择规格类型">
                    <Option value="thickness">厚度</Option>
                    <Option value="weight">克重</Option>
                    <Option value="width">宽度</Option>
                    <Option value="length">虚线间距</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sort_order"
                  label="排序"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="metric_value"
                  label="公制数值"
                  rules={[{ required: true, message: '请输入公制数值' }]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="metric_unit"
                  label="公制单位"
                  rules={[{ required: true, message: '请输入公制单位' }]}
                >
                  <Input placeholder="如：mm, cm, kg等" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="imperial_value"
                  label="英制数值"
                  rules={[{ required: true, message: '请输入英制数值' }]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="imperial_unit"
                  label="英制单位"
                  rules={[{ required: true, message: '请输入英制单位' }]}
                >
                  <Input placeholder="如：inch, ft, lbs等" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="status"
              label="状态"
              initialValue="publish"
            >
              <Select>
                <Option value="publish">已发布</Option>
                <Option value="draft">草稿</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="dictionary-item-edit-page">
      <AdminPageHeader
        title={`${mode === 'create' ? '新增' : '编辑'}${typeConfig.title}`}
        description={`${mode === 'create' ? '创建新的' : '编辑现有的'}${typeConfig.title}信息`}
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {renderFormFields()}
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                {mode === 'create' ? '创建' : '保存'}
              </Button>
              <Button onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DictionaryItemEditPage; 