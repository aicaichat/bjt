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
  Divider,
  Tabs,
  InputNumber
} from 'antd';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { consumableService, ConsumableFormData } from '../../services/admin-consumable.service';
import { consumableModelService } from '../../services/admin-consumable.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;

const ConsumableEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [productLines, setProductLines] = useState<any[]>([]);
  const [consumableModels, setConsumableModels] = useState<any[]>([]);
  const [loadingProductLines, setLoadingProductLines] = useState(false);
  const [loadingConsumableModels, setLoadingConsumableModels] = useState(false);
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>(undefined);

  const isEditMode = !!id;
  const title = isEditMode ? '编辑消耗品料号' : '新增消耗品料号';
  
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
  
  // 根据产品线加载消耗品型号
  useEffect(() => {
    if (!selectedProductLineId) {
      setConsumableModels([]);
      return;
    }
    
    const fetchConsumableModels = async () => {
      setLoadingConsumableModels(true);
      try {
        const response = await consumableModelService.getConsumableModels({
          page: 1,
          page_size: 100,
          product_line_id: selectedProductLineId,
          status: 'publish'
        });
        setConsumableModels(response.items || []);
      } catch (error) {
        message.error('获取消耗品型号数据失败');
      } finally {
        setLoadingConsumableModels(false);
      }
    };
    
    fetchConsumableModels();
  }, [selectedProductLineId]);
  
  // 加载消耗品数据
  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchConsumable = async () => {
      setLoading(true);
      try {
        const consumable = await consumableService.getConsumable(Number(id));
        
        // 设置产品线和型号的关联
        setSelectedProductLineId(consumable.product_line_id);
        
        // 填充表单
        form.setFieldsValue({
          pn: consumable.pn,
          name: consumable.name,
          model_id: consumable.model_id,
          product_line_id: consumable.product_line_id,
          description: consumable.description,
          usage: consumable.usage,
          replacement_cycle: consumable.replacement_cycle,
          status: consumable.status,
          logistics: consumable.logistics || {
            weight: 0,
            length: 0,
            width: 0,
            height: 0,
            package_quantity: 1
          },
          specs: consumable.specs || []
        });
      } catch (error) {
        message.error('获取消耗品数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsumable();
  }, [id, form, isEditMode]);
  
  // 处理产品线变更
  const handleProductLineChange = (value: number) => {
    setSelectedProductLineId(value);
    form.setFieldValue('model_id', undefined);
  };
  
  // 表单提交
  const handleSubmit = async (values: ConsumableFormData) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        await consumableService.updateConsumable(Number(id), values);
        message.success('消耗品料号更新成功');
      } else {
        await consumableService.createConsumable(values);
        message.success('消耗品料号创建成功');
      }
      navigate('/admin/consumables');
    } catch (error) {
      message.error(isEditMode ? '更新消耗品料号失败' : '创建消耗品料号失败');
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
            description: { zh: '', en: '' },
            usage: { zh: '', en: '' },
            logistics: {
              weight: 0,
              length: 0,
              width: 0,
              height: 0,
              package_quantity: 1
            },
            specs: []
          }}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <>
                    <Form.Item
                      name="product_line_id"
                      label="产品线"
                      rules={[{ required: true, message: '请选择产品线' }]}
                    >
                      <Select
                        placeholder="选择产品线"
                        loading={loadingProductLines}
                        onChange={handleProductLineChange}
                      >
                        {productLines.map(item => (
                          <Option key={item.id} value={item.id}>{item.title.zh}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="model_id"
                      label="消耗品型号"
                      rules={[{ required: true, message: '请选择消耗品型号' }]}
                    >
                      <Select
                        placeholder="选择消耗品型号"
                        loading={loadingConsumableModels}
                        disabled={!selectedProductLineId}
                      >
                        {consumableModels.map(item => (
                          <Option key={item.id} value={item.id}>{item.model}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="pn"
                      label="料号"
                      rules={[{ required: true, message: '请输入料号' }]}
                    >
                      <Input placeholder="请输入料号" />
                    </Form.Item>
                    
                    <Form.Item
                      label="消耗品名称"
                      required
                    >
                      <Space.Compact style={{ display: 'flex' }}>
                        <Form.Item
                          name={['name', 'zh']}
                          noStyle
                          rules={[{ required: true, message: '请输入中文名称' }]}
                        >
                          <Input placeholder="中文名称" style={{ width: '50%' }} />
                        </Form.Item>
                        <Form.Item
                          name={['name', 'en']}
                          noStyle
                          rules={[{ required: true, message: '请输入英文名称' }]}
                        >
                          <Input placeholder="英文名称" style={{ width: '50%' }} />
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                    
                    <Form.Item
                      label="消耗品描述"
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
                      label="使用说明"
                      required
                    >
                      <Form.Item
                        name={['usage', 'zh']}
                        label="中文说明"
                        rules={[{ required: true, message: '请输入中文使用说明' }]}
                      >
                        <TextArea rows={3} placeholder="请输入中文使用说明" />
                      </Form.Item>
                      <Form.Item
                        name={['usage', 'en']}
                        label="英文说明"
                        rules={[{ required: true, message: '请输入英文使用说明' }]}
                      >
                        <TextArea rows={3} placeholder="请输入英文使用说明" />
                      </Form.Item>
                    </Form.Item>
                    
                    <Form.Item
                      name="replacement_cycle"
                      label="更换周期(天)"
                      extra="消耗品的建议更换周期，单位为天"
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
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
                  </>
                )
              },
              {
                key: 'logistics',
                label: '物流信息',
                children: (
                  <>
                    <Form.Item
                      name={['logistics', 'weight']}
                      label="重量(克)"
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item label="尺寸(mm)">
                      <Space.Compact style={{ display: 'flex' }}>
                        <Form.Item
                          name={['logistics', 'length']}
                          noStyle
                        >
                          <InputNumber min={0} placeholder="长" style={{ width: '33%' }} />
                        </Form.Item>
                        <Form.Item
                          name={['logistics', 'width']}
                          noStyle
                        >
                          <InputNumber min={0} placeholder="宽" style={{ width: '33%' }} />
                        </Form.Item>
                        <Form.Item
                          name={['logistics', 'height']}
                          noStyle
                        >
                          <InputNumber min={0} placeholder="高" style={{ width: '33%' }} />
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                    
                    <Form.Item
                      name={['logistics', 'package_quantity']}
                      label="包装数量"
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </>
                )
              }
            ]}
          />
          
          <Divider />
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
              >
                {isEditMode ? '保存更改' : '创建消耗品'}
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

export default ConsumableEditPage; 