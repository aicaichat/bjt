import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Select, Row, Col, Divider, Typography
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { sparePartModelService, SparePartModelFormData, SparePartModel } from '../../services/admin-spare-part.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface SparePartModelEditPageProps {
  mode?: 'create' | 'edit';
}

const SparePartModelEditPage: React.FC<SparePartModelEditPageProps> = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 获取产品线列表
  const fetchProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines({
        page: 1,
        page_size: 100,
        status: 'publish'
      });
      setProductLines(response.items || []);
    } catch (error) {
      message.error('获取产品线列表失败');
    }
  };
  
  // 获取备件型号详情
  const fetchSparePartModel = async (modelId: number) => {
    try {
      setIsLoading(true);
      const data = await sparePartModelService.getSparePartModel(modelId);
      
      // 填充表单数据
      form.setFieldsValue({
        model: data.model,
        product_line_id: data.product_line_id,
        description: data.description,
        status: data.status
      });
    } catch (error) {
      message.error('获取备件型号详情失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始化
  useEffect(() => {
    fetchProductLines();
    
    // 编辑模式下获取备件型号详情
    if (mode === 'edit' && id) {
      fetchSparePartModel(Number(id));
    }
  }, [mode, id]);
  
  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      const formData: SparePartModelFormData = {
        model: values.model,
        product_line_id: values.product_line_id,
        description: values.description,
        status: values.status || 'publish'
      };
      
      let result: SparePartModel;
      if (mode === 'edit' && id) {
        result = await sparePartModelService.updateSparePartModel(Number(id), formData);
        message.success('备件型号更新成功');
      } else {
        result = await sparePartModelService.createSparePartModel(formData);
        message.success('备件型号创建成功');
      }
      
      // 返回列表页
      navigate('/admin/spare-parts');
    } catch (error) {
      message.error(mode === 'edit' ? '更新备件型号失败' : '创建备件型号失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title={mode === 'edit' ? '编辑备件型号' : '新增备件型号'}
        extra={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/admin/spare-parts')}
            >
              返回列表
            </Button>
          </Space>
        }
      />
      
      <Card loading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'publish',
            description: {
              zh: '',
              en: ''
            }
          }}
        >
          <Title level={5}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_line_id"
                label="产品线"
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <Select placeholder="选择产品线">
                  {productLines.map(item => (
                    <Option key={item.id} value={item.id}>{item.title.zh}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="model"
                label="型号名称"
                rules={[{ required: true, message: '请输入型号名称' }]}
              >
                <Input placeholder="请输入备件型号名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['description', 'zh']}
                label="描述(中文)"
              >
                <TextArea rows={3} placeholder="请输入备件型号中文描述" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name={['description', 'en']}
                label="描述(英文)"
              >
                <TextArea rows={3} placeholder="请输入备件型号英文描述" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="publish">已发布</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="trash">已删除</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={isSubmitting}
            >
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SparePartModelEditPage; 