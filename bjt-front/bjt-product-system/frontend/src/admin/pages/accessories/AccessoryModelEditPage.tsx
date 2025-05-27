import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Select, Card, Row, Col, message, Spin, InputNumber
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import { accessoryModelService, AccessoryModelFormData } from '../../services/admin-accessory.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;

const AccessoryModelEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();

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
    }
  }, [modelData, form, isEdit]);

  const handleSubmit = async (values: AccessoryModelFormData) => {
    try {
      if (isEdit) {
        await accessoryModelService.updateAccessoryModel(parseInt(id!), values);
        message.success('配件型号更新成功');
      } else {
        await accessoryModelService.createAccessoryModel(values);
        message.success('配件型号创建成功');
      }
      navigate('/admin/accessories');
    } catch (error) {
      console.error('提交失败:', error);
      message.error(isEdit ? '更新失败' : '创建失败');
    }
  };

  const handleCancel = () => {
    navigate('/admin/accessories');
  };

  const productLines = productLineData?.items || [];

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
        title={isEdit ? '编辑配件型号' : '新增配件型号'}
        onBack={handleCancel}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'publish',
            sort_order: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_line_id"
                label="产品线"
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <Select placeholder="选择产品线">
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
                label="型号编码"
                rules={[{ required: true, message: '请输入型号编码' }]}
              >
                <Input placeholder="请输入型号编码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title_zh"
                label="中文名称"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title_en"
                label="英文名称"
                rules={[{ required: true, message: '请输入英文名称' }]}
              >
                <Input placeholder="请输入英文名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="description_zh"
                label="中文描述"
              >
                <TextArea rows={3} placeholder="请输入中文描述" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description_en"
                label="英文描述"
              >
                <TextArea rows={3} placeholder="请输入英文描述" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="配件类型"
              >
                <Input placeholder="请输入配件类型" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="image1_url"
                label="主图URL"
              >
                <Input placeholder="请输入主图URL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="image2_url"
                label="副图URL"
              >
                <Input placeholder="请输入副图URL" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="explosion_diagram_pdf"
                label="爆炸图PDF URL"
              >
                <Input placeholder="请输入爆炸图PDF文件URL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="publish">已发布</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="trash">回收站</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序"
              >
                <InputNumber 
                  min={0} 
                  placeholder="请输入排序值"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {isEdit ? '保存更改' : '创建型号'}
            </Button>
            <Button onClick={handleCancel}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AccessoryModelEditPage; 