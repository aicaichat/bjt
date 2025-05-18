import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Select, Switch, InputNumber,
  Divider, Typography, Row, Col
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { sparePartService, SparePartFormData, SparePart } from '../../services/admin-spare-part.service';
import { sparePartModelService } from '../../services/admin-spare-part.service';
import adminProductLineService from '../../services/admin-product-line.service';
import adminMachineService from '../../services/admin-machine.service';
import adminPartService from '../../services/admin-part.service';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface SparePartEditPageProps {
  mode?: 'create' | 'edit';
}

const SparePartEditPage: React.FC<SparePartEditPageProps> = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [sparePartModels, setSparePartModels] = useState<any[]>([]);
  const [machineModels, setMachineModels] = useState<any[]>([]);
  const [partModels, setPartModels] = useState<any[]>([]);
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>(undefined);
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

  // 获取备件型号列表
  const fetchSparePartModels = async (productLineId?: number) => {
    try {
      const response = await sparePartModelService.getSparePartModels({
        page: 1,
        page_size: 100,
        product_line_id: productLineId,
        status: 'publish'
      });
      setSparePartModels(response.items || []);
    } catch (error) {
      message.error('获取备件型号列表失败');
    }
  };

  // 获取主机型号列表
  const fetchMachineModels = async () => {
    try {
      const response = await adminMachineService.getMachines({
        page: 1,
        page_size: 100,
        status: 'publish'
      });
      setMachineModels(response.items || []);
    } catch (error) {
      message.error('获取主机型号列表失败');
    }
  };

  // 获取料号列表
  const fetchPartModels = async () => {
    try {
      const response = await adminPartService.getParts({
        page: 1,
        page_size: 100,
        status: 'publish'
      });
      setPartModels(response.items || []);
    } catch (error) {
      message.error('获取料号列表失败');
    }
  };

  // 获取备件料号详情
  const fetchSparePart = async (sparePartId: number) => {
    try {
      setIsLoading(true);
      const data = await sparePartService.getSparePart(sparePartId);
      
      // 设置产品线和型号选项
      setSelectedProductLineId(data.product_line_id);
      await fetchSparePartModels(data.product_line_id);
      
      // 填充表单数据
      form.setFieldsValue({
        pn: data.pn,
        name: data.name,
        model_id: data.model_id,
        product_line_id: data.product_line_id,
        description: data.description,
        compatibility: data.compatibility,
        is_critical: data.is_critical,
        lead_time: data.lead_time,
        status: data.status,
        logistics: data.logistics,
        specs: data.specs || []
      });
    } catch (error) {
      message.error('获取备件料号详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    fetchProductLines();
    fetchMachineModels();
    fetchPartModels();
    
    // 编辑模式下获取备件料号详情
    if (mode === 'edit' && id) {
      fetchSparePart(Number(id));
    }
  }, [mode, id]);

  // 处理产品线变更
  const handleProductLineChange = async (value: number) => {
    setSelectedProductLineId(value);
    form.setFieldValue('model_id', undefined);
    await fetchSparePartModels(value);
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      const formData: SparePartFormData = {
        pn: values.pn,
        name: values.name,
        model_id: values.model_id,
        product_line_id: values.product_line_id,
        description: values.description,
        compatibility: values.compatibility || {
          machine_models: [],
          part_models: []
        },
        is_critical: values.is_critical || false,
        lead_time: values.lead_time,
        status: values.status || 'publish',
        logistics: values.logistics || {
          weight: 0,
          length: 0,
          width: 0,
          height: 0,
          package_quantity: 1
        },
        specs: values.specs || []
      };
      
      let result: SparePart;
      if (mode === 'edit' && id) {
        result = await sparePartService.updateSparePart(Number(id), formData);
        message.success('备件料号更新成功');
      } else {
        result = await sparePartService.createSparePart(formData);
        message.success('备件料号创建成功');
      }
      
      // 返回列表页
      navigate('/admin/spare-parts');
    } catch (error) {
      message.error(mode === 'edit' ? '更新备件料号失败' : '创建备件料号失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title={mode === 'edit' ? '编辑备件料号' : '新增备件料号'}
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
            is_critical: false,
            logistics: {
              weight: 0,
              length: 0,
              width: 0,
              height: 0,
              package_quantity: 1
            },
            compatibility: {
              machine_models: [],
              part_models: []
            }
          }}
        >
          <Title level={5}>基本信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="product_line_id"
                label="产品线"
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <Select
                  placeholder="选择产品线"
                  onChange={handleProductLineChange}
                >
                  {productLines.map(item => (
                    <Option key={item.id} value={item.id}>{item.title.zh}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="model_id"
                label="备件型号"
                rules={[{ required: true, message: '请选择备件型号' }]}
              >
                <Select
                  placeholder="选择备件型号"
                  disabled={!selectedProductLineId}
                >
                  {sparePartModels.map(item => (
                    <Option key={item.id} value={item.id}>{item.model}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="pn"
                label="料号"
                rules={[{ required: true, message: '请输入料号' }]}
              >
                <Input placeholder="请输入料号" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['name', 'zh']}
                label="名称(中文)"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入备件中文名称" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name={['name', 'en']}
                label="名称(英文)"
                rules={[{ required: true, message: '请输入英文名称' }]}
              >
                <Input placeholder="请输入备件英文名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['description', 'zh']}
                label="描述(中文)"
              >
                <TextArea rows={3} placeholder="请输入备件中文描述" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name={['description', 'en']}
                label="描述(英文)"
              >
                <TextArea rows={3} placeholder="请输入备件英文描述" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
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
            
            <Col span={8}>
              <Form.Item
                name="is_critical"
                label="关键备件"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren={<WarningOutlined />}
                  unCheckedChildren={<WarningOutlined />}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="lead_time"
                label="采购周期(天)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="备件采购周期(天)"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={5}>兼容性信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['compatibility', 'machine_models']}
                label="兼容主机型号"
              >
                <Select
                  mode="multiple"
                  placeholder="选择兼容的主机型号"
                  style={{ width: '100%' }}
                  optionFilterProp="children"
                >
                  {machineModels.map(item => (
                    <Option key={item.id} value={item.model}>{item.model}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name={['compatibility', 'part_models']}
                label="兼容料号型号"
              >
                <Select
                  mode="multiple"
                  placeholder="选择兼容的料号型号"
                  style={{ width: '100%' }}
                  optionFilterProp="children"
                >
                  {partModels.map(item => (
                    <Option key={item.id} value={item.model}>{item.model}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={5}>物流信息</Title>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name={['logistics', 'weight']}
                label="重量(kg)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="重量(kg)"
                />
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item
                name={['logistics', 'length']}
                label="长度(cm)"
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="长度(cm)"
                />
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item
                name={['logistics', 'width']}
                label="宽度(cm)"
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="宽度(cm)"
                />
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item
                name={['logistics', 'height']}
                label="高度(cm)"
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="高度(cm)"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name={['logistics', 'package_quantity']}
                label="包装数量"
                rules={[{ required: true, message: '请输入包装数量' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="包装数量"
                />
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

export default SparePartEditPage;