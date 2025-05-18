import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Form, Input, Button, message, Card, Tabs, Upload, Select,
  Row, Col, InputNumber, Spin, Divider, Alert, Space, Typography
} from 'antd';
import { 
  UploadOutlined, SearchOutlined, LoadingOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import adminPartService, { Part, PartFormData } from '../../services/admin-part.service';
import adminMachineService from '../../services/admin-machine.service';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const PartEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [pnSearchValue, setPNSearchValue] = useState('');
  const [searchingPN, setSearchingPN] = useState(false);
  const [pnSearchError, setPnSearchError] = useState('');

  // 获取料号详情数据
  const { data: part, loading: partLoading } = useAdminApi(
    () => isEdit ? adminPartService.getPart(Number(id)) : Promise.resolve(null),
    {},
    [id]
  );

  // 获取机型列表
  const { data: machineData, loading: machineLoading } = useAdminApi(
    adminMachineService.getMachines.bind(adminMachineService),
    { page: 1, page_size: 100 },
    []
  );

  // 当编辑模式且数据加载完成时，填充表单
  useEffect(() => {
    if (isEdit && part) {
      form.setFieldsValue({
        pn: part.pn,
        model_id: part.model_id,
        voltage: part.voltage,
        name_zh: part.name.zh,
        name_en: part.name.en,
        specs_zh: part.specs.zh,
        specs_en: part.specs.en,
        length: part.dimensions?.length,
        width: part.dimensions?.width,
        height: part.dimensions?.height,
        net_weight: part.weight?.net,
        gross_weight: part.weight?.gross,
        image_url: part.image_url,
        status: part.status || 'draft',
      });
    }
  }, [isEdit, part, form]);

  // 从CRM系统获取料号数据
  const handlePNSearch = async () => {
    if (!pnSearchValue) {
      message.error('请输入料号');
      return;
    }

    setSearchingPN(true);
    setPnSearchError('');

    try {
      // 查询CRM系统
      const response = await adminPartService.fetchCRMPartData(pnSearchValue);
      
      if (response && response.data) {
        const crmData = response.data;
        
        // 填充表单
        form.setFieldsValue({
          pn: crmData.pn,
          name_zh: crmData.name?.zh,
          name_en: crmData.name?.en,
          specs_zh: crmData.specs?.zh,
          specs_en: crmData.specs?.en,
          length: crmData.dimensions?.length,
          width: crmData.dimensions?.width,
          height: crmData.dimensions?.height,
          net_weight: crmData.weight?.net,
          gross_weight: crmData.weight?.gross,
        });
        
        message.success('成功获取料号数据');
      } else {
        setPnSearchError('未找到料号数据');
      }
    } catch (error) {
      setPnSearchError('获取料号数据失败');
      console.error('CRM查询错误:', error);
    } finally {
      setSearchingPN(false);
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      const formData: PartFormData = {
        pn: values.pn,
        model_id: values.model_id,
        voltage: values.voltage,
        name: {
          zh: values.name_zh,
          en: values.name_en,
        },
        specs: {
          zh: values.specs_zh,
          en: values.specs_en,
        },
        dimensions: {
          length: values.length,
          width: values.width,
          height: values.height,
        },
        weight: {
          net: values.net_weight,
          gross: values.gross_weight,
        },
        image_url: values.image_url,
        status: values.status || 'draft',
      };

      if (isEdit) {
        await adminPartService.updatePart(Number(id), formData);
        message.success('料号更新成功');
      } else {
        await adminPartService.createPart(formData);
        message.success('料号创建成功');
      }
      navigate('/admin/parts');
    } catch (error) {
      message.error(isEdit ? '料号更新失败' : '料号创建失败');
      console.error('表单提交错误:', error);
    }
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title={isEdit ? '编辑料号' : '新增料号'}
        onBack={() => navigate('/admin/parts')}
      />

      <Card loading={partLoading || machineLoading}>
        {!isEdit && (
          <div className="mb-6">
            <Title level={5}>从CRM获取料号数据</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Input
                  placeholder="输入PN号查询"
                  value={pnSearchValue}
                  onChange={(e) => setPNSearchValue(e.target.value)}
                  suffix={
                    <Button 
                      type="primary" 
                      icon={searchingPN ? <LoadingOutlined /> : <SearchOutlined />} 
                      onClick={handlePNSearch}
                      disabled={searchingPN}
                    >
                      查询
                    </Button>
                  }
                />
              </Col>
              <Col span={16}>
                {pnSearchError && (
                  <Alert 
                    message={pnSearchError} 
                    type="error" 
                    showIcon 
                    closable 
                  />
                )}
              </Col>
            </Row>
            <Divider />
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'draft' }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="料号 (PN)"
                name="pn"
                rules={[{ required: true, message: '请输入料号' }]}
              >
                <Input 
                  placeholder="请输入料号" 
                  disabled={isEdit}
                  suffix={isEdit && <InfoCircleOutlined title="料号不可修改" />}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="型号"
                name="model_id"
                rules={[{ required: true, message: '请选择型号' }]}
              >
                <Select placeholder="请选择型号">
                  {machineData?.items?.map((machine: any) => (
                    <Option key={machine.id} value={machine.id}>{machine.model}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="电压"
                name="voltage"
              >
                <Input placeholder="例如: 220V" />
              </Form.Item>
            </Col>
          </Row>

          <Tabs defaultActiveKey="zh">
            <TabPane tab="中文" key="zh">
              <Form.Item
                label="名称"
                name="name_zh"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>

              <Form.Item
                label="规格参数"
                name="specs_zh"
                rules={[{ required: true, message: '请输入中文规格参数' }]}
              >
                <TextArea rows={4} placeholder="请输入中文规格参数" />
              </Form.Item>
            </TabPane>

            <TabPane tab="English" key="en">
              <Form.Item
                label="Name"
                name="name_en"
                rules={[{ required: true, message: 'Please enter English name' }]}
              >
                <Input placeholder="Please enter English name" />
              </Form.Item>

              <Form.Item
                label="Specifications"
                name="specs_en"
                rules={[{ required: true, message: 'Please enter English specifications' }]}
              >
                <TextArea rows={4} placeholder="Please enter English specifications" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <Divider orientation="left">物流参数</Divider>
          
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="长度 (mm)"
                name="length"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="宽度 (mm)"
                name="width"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="高度 (mm)"
                name="height"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="净重 (kg)"
                name="net_weight"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="毛重 (kg)"
                name="gross_weight"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="产品图片"
            name="image_url"
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {isEdit ? '更新' : '创建'}
              </Button>
              <Button onClick={() => navigate('/admin/parts')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PartEditPage; 