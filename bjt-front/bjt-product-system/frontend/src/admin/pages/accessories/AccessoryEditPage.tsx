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
  Tabs
} from 'antd';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { accessoryService, AccessoryFormData } from '../../services/admin-accessory.service';
import { accessoryModelService } from '../../services/admin-accessory.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;

const AccessoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [productLines, setProductLines] = useState<any[]>([]);
  const [accessoryModels, setAccessoryModels] = useState<any[]>([]);
  const [loadingProductLines, setLoadingProductLines] = useState(false);
  const [loadingAccessoryModels, setLoadingAccessoryModels] = useState(false);
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>(undefined);

  const isEditMode = !!id;
  const title = isEditMode ? '编辑配件料号' : '新增配件料号';
  
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
  
  // 根据产品线加载配件型号
  useEffect(() => {
    if (!selectedProductLineId) {
      setAccessoryModels([]);
      return;
    }
    
    const fetchAccessoryModels = async () => {
      setLoadingAccessoryModels(true);
      try {
        const response = await accessoryModelService.getAccessoryModels({
          page: 1,
          page_size: 100,
          product_line_id: selectedProductLineId,
          status: 'publish'
        });
        setAccessoryModels(response.items || []);
      } catch (error) {
        message.error('获取配件型号数据失败');
      } finally {
        setLoadingAccessoryModels(false);
      }
    };
    
    fetchAccessoryModels();
  }, [selectedProductLineId]);
  
  // 加载配件数据
  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchAccessory = async () => {
      setLoading(true);
      try {
        const accessory = await accessoryService.getAccessory(Number(id));
        
        // 设置产品线和型号的关联
        setSelectedProductLineId(accessory.product_line_id);
        
        // 填充表单
        form.setFieldsValue({
          pn: accessory.pn,
          name: accessory.name,
          model_id: accessory.model_id,
          product_line_id: accessory.product_line_id,
          description: accessory.description,
          status: accessory.status,
          logistics: accessory.logistics || {
            weight: 0,
            length: 0,
            width: 0,
            height: 0,
            package_quantity: 1
          },
          specs: accessory.specs || []
        });
      } catch (error) {
        message.error('获取配件数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccessory();
  }, [id, form, isEditMode]);
  
  // 处理产品线变更
  const handleProductLineChange = (value: number) => {
    setSelectedProductLineId(value);
    form.setFieldValue('model_id', undefined);
  };
  
  // 表单提交
  const handleSubmit = async (values: AccessoryFormData) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        await accessoryService.updateAccessory(Number(id), values);
        message.success('配件料号更新成功');
      } else {
        await accessoryService.createAccessory(values);
        message.success('配件料号创建成功');
      }
      navigate('/admin/accessories');
    } catch (error) {
      message.error(isEditMode ? '更新配件料号失败' : '创建配件料号失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title={title}
        onBack={() => navigate('/admin/accessories')}
      />
      
      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'publish',
            description: { zh: '', en: '' },
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
                      label="配件型号"
                      rules={[{ required: true, message: '请选择配件型号' }]}
                    >
                      <Select
                        placeholder="选择配件型号"
                        loading={loadingAccessoryModels}
                        disabled={!selectedProductLineId}
                      >
                        {accessoryModels.map(item => (
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
                      label="配件名称"
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
                      label="配件描述"
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
                      <Input type="number" min={0} />
                    </Form.Item>
                    
                    <Form.Item label="尺寸(mm)">
                      <Space.Compact style={{ display: 'flex' }}>
                        <Form.Item
                          name={['logistics', 'length']}
                          noStyle
                        >
                          <Input type="number" min={0} placeholder="长" style={{ width: '33%' }} />
                        </Form.Item>
                        <Form.Item
                          name={['logistics', 'width']}
                          noStyle
                        >
                          <Input type="number" min={0} placeholder="宽" style={{ width: '33%' }} />
                        </Form.Item>
                        <Form.Item
                          name={['logistics', 'height']}
                          noStyle
                        >
                          <Input type="number" min={0} placeholder="高" style={{ width: '33%' }} />
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                    
                    <Form.Item
                      name={['logistics', 'package_quantity']}
                      label="包装数量"
                    >
                      <Input type="number" min={1} />
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
                {isEditMode ? '保存更改' : '创建配件'}
              </Button>
              <Button 
                onClick={() => navigate('/admin/accessories')}
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

export default AccessoryEditPage; 