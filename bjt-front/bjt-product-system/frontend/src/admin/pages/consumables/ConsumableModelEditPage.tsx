import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Select,
  Space,
  Divider
} from 'antd';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { consumableModelService, ConsumableModelFormData } from '../../services/admin-consumable.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;

const ConsumableModelEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [loadingProductLines, setLoadingProductLines] = useState(false);
  
  const isEditMode = !!id;
  const title = isEditMode ? '编辑消耗品型号' : '新增消耗品型号';
  
  // 加载产品线数据
  useEffect(() => {
    const fetchProductLines = async () => {
      setLoadingProductLines(true);
      try {
        const response = await adminProductLineService.getProductLines({
          page: 1,
          page_size: 100,
          status: 'publish'
        });
        setProductLines(response.items || []);
      } catch (error) {
        message.error('获取产品线数据失败');
      } finally {
        setLoadingProductLines(false);
      }
    };
    
    fetchProductLines();
  }, []);
  
  // 加载消耗品型号数据
  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchConsumableModel = async () => {
      setLoading(true);
      try {
        const model = await consumableModelService.getConsumableModel(Number(id));
        
        // 填充表单
        form.setFieldsValue({
          model: model.model,
          product_line_id: model.product_line_id,
          description: model.description,
          status: model.status
        });
      } catch (error) {
        message.error('获取消耗品型号数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsumableModel();
  }, [id, form, isEditMode]);
  
  // 表单提交
  const handleSubmit = async (values: ConsumableModelFormData) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        await consumableModelService.updateConsumableModel(Number(id), values);
        message.success('消耗品型号更新成功');
      } else {
        await consumableModelService.createConsumableModel(values);
        message.success('消耗品型号创建成功');
      }
      navigate('/admin/consumables');
    } catch (error) {
      message.error(isEditMode ? '更新消耗品型号失败' : '创建消耗品型号失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title={title}
        onBack={() => navigate('/admin/consumables')}
      />
      
      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'publish',
            description: { zh: '', en: '' }
          }}
        >
          <Form.Item
            name="product_line_id"
            label="产品线"
            rules={[{ required: true, message: '请选择产品线' }]}
          >
            <Select
              placeholder="选择产品线"
              loading={loadingProductLines}
            >
              {productLines.map(item => (
                <Option key={item.id} value={item.id}>{item.title.zh}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="model"
            label="型号名称"
            rules={[{ required: true, message: '请输入型号名称' }]}
          >
            <Input placeholder="请输入型号名称" />
          </Form.Item>
          
          <Form.Item
            label="型号描述"
          >
            <Form.Item
              name={['description', 'zh']}
              label="中文描述"
            >
              <TextArea rows={3} placeholder="请输入中文描述" />
            </Form.Item>
            <Form.Item
              name={['description', 'en']}
              label="英文描述"
            >
              <TextArea rows={3} placeholder="请输入英文描述" />
            </Form.Item>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="publish">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="trash">已删除</Option>
            </Select>
          </Form.Item>
          
          <Divider />
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
              >
                {isEditMode ? '保存更改' : '创建型号'}
              </Button>
              <Button 
                onClick={() => navigate('/admin/consumables')}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ConsumableModelEditPage; 