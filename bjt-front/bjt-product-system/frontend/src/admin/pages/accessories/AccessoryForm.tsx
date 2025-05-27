import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Select, Card, Row, Col, message, Spin, InputNumber
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import { accessoryService, AccessoryFormData } from '../../services/admin-accessory.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;

const AccessoryForm: React.FC = () => {
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

  // 获取配件料号详情（编辑时）
  const {
    data: accessoryData,
    loading: accessoryLoading
  } = useAdminApi(
    () => isEdit ? accessoryService.getAccessory(parseInt(id!)) : Promise.resolve(null),
    {},
    [id, isEdit]
  );

  // 设置表单初始值
  useEffect(() => {
    if (isEdit && accessoryData) {
      form.setFieldsValue({
        product_line_id: accessoryData.product_line_id,
        model: accessoryData.model,
        brand: accessoryData.brand,
        part_number: accessoryData.part_number,
        name_zh: accessoryData.name_zh,
        name_en: accessoryData.name_en,
        spec: accessoryData.spec,
        spec_imperial: accessoryData.spec_imperial,
        voltage: accessoryData.voltage,
        frequency: accessoryData.frequency,
        package_size_cm: accessoryData.package_size_cm,
        package_size_inch: accessoryData.package_size_inch,
        net_weight_kg: accessoryData.net_weight_kg,
        net_weight_lbs: accessoryData.net_weight_lbs,
        gross_weight_kg: accessoryData.gross_weight_kg,
        gross_weight_lbs: accessoryData.gross_weight_lbs,
        pcs_per_box: accessoryData.pcs_per_box,
        pallet_size_cm: accessoryData.pallet_size_cm,
        pallet_size_inch: accessoryData.pallet_size_inch,
        pcs_per_pallet: accessoryData.pcs_per_pallet,
        pallet_height_cm: accessoryData.pallet_height_cm,
        pallet_height_inch: accessoryData.pallet_height_inch,
        pallet_gross_weight_kg: accessoryData.pallet_gross_weight_kg,
        pallet_gross_weight_lbs: accessoryData.pallet_gross_weight_lbs,
        image_url: accessoryData.image_url,
        status: accessoryData.status,
        unit: accessoryData.unit,
      });
    } else if (!isEdit) {
      // 新增时设置默认值
      form.setFieldsValue({
        status: 'publish',
        unit: 'pcs',
      });
    }
  }, [form, isEdit, accessoryData]);

  const handleSubmit = async (values: AccessoryFormData) => {
    try {
      if (isEdit) {
        await accessoryService.updateAccessory(parseInt(id!), values);
        message.success('配件料号更新成功');
      } else {
        await accessoryService.createAccessory(values);
        message.success('配件料号创建成功');
      }
      navigate('/admin/accessories');
    } catch (error) {
      console.error('Submit error:', error);
      message.error('操作失败');
    }
  };

  const handleCancel = () => {
    navigate('/admin/accessories');
  };

  if (isEdit && accessoryLoading) {
    return (
      <div className="p-6">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminPageHeader
        title={isEdit ? '编辑配件料号' : '新增配件料号'}
        extra={
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
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
          autoComplete="off"
        >
          {/* 基本信息 */}
          <Card title="基本信息" size="small" className="mb-4">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="product_line_id"
                  label="产品线"
                  rules={[{ required: true, message: '请选择产品线' }]}
                >
                  <Select 
                    placeholder="请选择产品线"
                    loading={productLineLoading}
                  >
                    {productLineData?.items?.map(line => (
                      <Option key={line.id} value={line.id}>
                        {line.title_zh || line.title_en}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="part_number"
                  label="料号"
                  rules={[{ required: true, message: '请输入料号' }]}
                >
                  <Input placeholder="请输入料号" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="model"
                  label="型号"
                >
                  <Input placeholder="请输入型号" />
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
                  <Input placeholder="请输入中文名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name_en"
                  label="英文名称"
                  rules={[{ required: true, message: '请输入英文名称' }]}
                >
                  <Input placeholder="请输入英文名称" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="brand"
                  label="品牌"
                >
                  <Input placeholder="请输入品牌" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="voltage"
                  label="电压"
                >
                  <Input placeholder="请输入电压" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="frequency"
                  label="频率"
                >
                  <Input placeholder="请输入频率" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="spec"
                  label="公制规格"
                >
                  <TextArea rows={2} placeholder="请输入公制规格参数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="spec_imperial"
                  label="英制规格"
                >
                  <TextArea rows={2} placeholder="请输入英制规格参数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
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
              </Col>
              <Col span={8}>
                <Form.Item
                  name="unit"
                  label="单位"
                  rules={[{ required: true, message: '请选择单位' }]}
                >
                  <Select placeholder="请选择单位">
                    <Option value="pcs">件(pcs)</Option>
                    <Option value="box">箱(box)</Option>
                    <Option value="roll">卷(roll)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="image_url"
                  label="产品图片URL"
                >
                  <Input placeholder="请输入产品图片URL" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 包装信息 */}
          <Card title="包装信息" size="small" className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="package_size_cm"
                  label="包装尺寸(cm)"
                >
                  <Input placeholder="长×宽×高(cm)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="package_size_inch"
                  label="包装尺寸(inch)"
                >
                  <Input placeholder="长×宽×高(inch)" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="net_weight_kg"
                  label="单件净重(kg)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="net_weight_lbs"
                  label="单件净重(lbs)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="pcs_per_box"
                  label="单箱数量"
                >
                  <InputNumber 
                    placeholder="0"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="gross_weight_kg"
                  label="包装毛重(kg)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gross_weight_lbs"
                  label="包装毛重(lbs)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 托盘信息 */}
          <Card title="托盘信息" size="small" className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pallet_size_cm"
                  label="托盘尺寸(cm)"
                >
                  <Input placeholder="长×宽(cm)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="pallet_size_inch"
                  label="托盘尺寸(inch)"
                >
                  <Input placeholder="长×宽(inch)" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="pcs_per_pallet"
                  label="一托数量"
                >
                  <InputNumber 
                    placeholder="0"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="pallet_height_cm"
                  label="打托高度(cm)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="pallet_height_inch"
                  label="打托高度(inch)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pallet_gross_weight_kg"
                  label="整托毛重(kg)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="pallet_gross_weight_lbs"
                  label="整托毛重(lbs)"
                >
                  <InputNumber 
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large">
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleCancel} size="large">
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AccessoryForm; 