import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Select,
  Space,
  Divider,
  Row,
  Col,
  InputNumber,
  Tabs,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import { consumableService, ConsumableFormData } from '../../services/admin-consumable.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { TextArea } = Input;

const ConsumableEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const isEdit = !!id;
  const productLineFromUrl = searchParams.get('product_line_id');

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

  // 获取耗材详情（编辑时）
  const {
    data: consumableData,
    loading: consumableLoading
  } = useAdminApi(
    () => isEdit ? consumableService.getConsumable(parseInt(id!)) : Promise.resolve(null),
    {},
    [id, isEdit]
  );

  // 当获取到数据时，填充表单
  useEffect(() => {
    if (consumableData && isEdit) {
      form.setFieldsValue({
        product_line_id: consumableData.product_line_id,
        model: consumableData.model || '',
        model_imperial: consumableData.model_imperial || '',
        part_number: consumableData.part_number,
        spec: consumableData.spec || '',
        spec_imperial: consumableData.spec_imperial || '',
        brand: consumableData.brand || '',
        app_model: consumableData.app_model || '',
        bag_type: consumableData.bag_type || '',
        material: consumableData.material || '',
        thickness_met: consumableData.thickness_met || 0,
        thickness_imp: consumableData.thickness_imp || 0,
        width_met: consumableData.width_met || 0,
        width_imp: consumableData.width_imp || 0,
        length_met: consumableData.length_met || 0,
        length_imp: consumableData.length_imp || 0,
        bubble_diameter_met: consumableData.bubble_diameter_met || 0,
        bubble_diameter_imp: consumableData.bubble_diameter_imp || 0,
        total_length_met: consumableData.total_length_met || 0,
        total_length_imp: consumableData.total_length_imp || 0,
        package_type: consumableData.package_type || '',
        package_size_cm: consumableData.package_size_cm || '',
        package_size_inch: consumableData.package_size_inch || '',
        net_weight_kg: consumableData.net_weight_kg || 0,
        net_weight_lbs: consumableData.net_weight_lbs || 0,
        gross_weight_kg: consumableData.gross_weight_kg || 0,
        gross_weight_lbs: consumableData.gross_weight_lbs || 0,
        pcs_per_box: consumableData.pcs_per_box || 0,
        image_url: consumableData.image_url || '',
        package_image_url: consumableData.package_image_url || '',
        pallet_size_cm: consumableData.pallet_size_cm || '',
        pallet_size_inch: consumableData.pallet_size_inch || '',
        pcs_per_pallet_a: consumableData.pcs_per_pallet_a || 0,
        pallet_gross_weight_a_kg: consumableData.pallet_gross_weight_a_kg || 0,
        pallet_gross_weight_a_lbs: consumableData.pallet_gross_weight_a_lbs || 0,
        pallet_height_a_cm: consumableData.pallet_height_a_cm || 0,
        pallet_height_a_inch: consumableData.pallet_height_a_inch || 0,
        pcs_per_pallet_b: consumableData.pcs_per_pallet_b || 0,
        pallet_gross_weight_b_kg: consumableData.pallet_gross_weight_b_kg || 0,
        pallet_gross_weight_b_lbs: consumableData.pallet_gross_weight_b_lbs || 0,
        pallet_height_b_cm: consumableData.pallet_height_b_cm || 0,
        pallet_height_b_inch: consumableData.pallet_height_b_inch || 0,
        pcs_per_pallet_c: consumableData.pcs_per_pallet_c || 0,
        pallet_gross_weight_c_kg: consumableData.pallet_gross_weight_c_kg || 0,
        pallet_gross_weight_c_lbs: consumableData.pallet_gross_weight_c_lbs || 0,
        pallet_height_c_cm: consumableData.pallet_height_c_cm || 0,
        pallet_height_c_inch: consumableData.pallet_height_c_inch || 0,
        tube_inner_diameter_cm: consumableData.tube_inner_diameter_cm || 0,
        tube_inner_diameter_inch: consumableData.tube_inner_diameter_inch || 0,
        status: consumableData.status,
        unit: consumableData.unit || 'roll',
      });
    } else if (!isEdit) {
      // 新建时设置默认值
      form.setFieldsValue({
        product_line_id: productLineFromUrl ? parseInt(productLineFromUrl) : undefined,
        status: 'publish',
        unit: 'roll',
      });
    }
  }, [consumableData, form, isEdit, productLineFromUrl]);

  const handleSubmit = async (values: ConsumableFormData) => {
    try {
      if (isEdit) {
        await consumableService.updateConsumable(parseInt(id!), values);
        message.success('耗材更新成功');
      } else {
        await consumableService.createConsumable(values);
        message.success('耗材创建成功');
      }
      navigate('/admin/consumables');
    } catch (error) {
      console.error('提交失败:', error);
      message.error(isEdit ? '更新失败' : '创建失败');
    }
  };

  const handleCancel = () => {
    navigate('/admin/consumables');
  };

  const productLines = productLineData?.items || [];

  if (productLineLoading || (isEdit && consumableLoading)) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // 袋型选项
  const bagTypeOptions = [
    { value: 'FB', label: '平口袋 (Flat Bag)' },
    { value: 'GB', label: '风琴袋 (Gusseted Bag)' },
    { value: 'SB', label: '自立袋 (Stand-up Bag)' },
    { value: 'BB', label: '气泡袋 (Bubble Bag)' },
    { value: 'VB', label: '真空袋 (Vacuum Bag)' },
  ];

  // 材质选项
  const materialOptions = [
    { value: 'PE', label: '聚乙烯 (Polyethylene)' },
    { value: 'PA', label: '聚酰胺 (Polyamide)' },
    { value: 'PP', label: '聚丙烯 (Polypropylene)' },
    { value: 'PET', label: '聚酯 (Polyester)' },
    { value: 'PVC', label: '聚氯乙烯 (Polyvinyl Chloride)' },
  ];

  return (
    <div className="p-6">
      <AdminPageHeader
        title={isEdit ? '编辑耗材' : '新增耗材'}
        onBack={handleCancel}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'publish',
            unit: 'roll',
          }}
        >
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <>
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
                          name="part_number"
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
                          name="model"
                          label="型号(公制)"
                        >
                          <Input placeholder="请输入型号" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="model_imperial"
                          label="型号(英制)"
                        >
                          <Input placeholder="请输入英制型号" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="bag_type"
                          label="袋型"
                        >
                          <Select placeholder="选择袋型">
                            {bagTypeOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="material"
                          label="材质"
                        >
                          <Select placeholder="选择材质">
                            {materialOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="brand"
                          label="品牌"
                        >
                          <Input placeholder="请输入品牌" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="spec"
                          label="规格(公制)"
                        >
                          <Input placeholder="请输入规格参数(公制)" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="spec_imperial"
                          label="规格(英制)"
                        >
                          <Input placeholder="请输入规格参数(英制)" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="app_model"
                          label="适用机型"
                        >
                          <Input placeholder="请输入适用机型" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="unit"
                          label="单位"
                          rules={[{ required: true, message: '请选择单位' }]}
                        >
                          <Select placeholder="选择单位">
                            <Option value="pcs">pcs</Option>
                            <Option value="roll">roll</Option>
                            <Option value="box">box</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
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
                    </Row>
                  </>
                ),
              },
              {
                key: 'dimensions',
                label: '尺寸参数',
                children: (
                  <>
                    <Divider orientation="left">厚度/克重</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="thickness_met"
                          label="厚度/克重(μm/gsm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="厚度或克重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="thickness_imp"
                          label="厚度/克重(mil/#)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="厚度或克重"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">宽度和长度</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="width_met"
                          label="膜宽(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="膜宽"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="width_imp"
                          label="膜宽(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="膜宽"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="length_met"
                          label="袋长(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="袋长"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="length_imp"
                          label="袋长(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="袋长"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">其他尺寸</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="bubble_diameter_met"
                          label="泡径(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="泡径"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="bubble_diameter_imp"
                          label="泡径(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="泡径"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="total_length_met"
                          label="总长(m)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="总长"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="total_length_imp"
                          label="总长(ft)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="总长"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">纸筒信息</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="tube_inner_diameter_cm"
                          label="纸筒内径(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="纸筒内径"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="tube_inner_diameter_inch"
                          label="纸筒内径(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="纸筒内径"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'packaging',
                label: '包装信息',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="package_type"
                          label="包装方式"
                        >
                          <Input placeholder="如：卷装、盒装、袋装" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="package_size_cm"
                          label="包装尺寸(cm)"
                        >
                          <Input placeholder="长×宽×高(cm)" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="package_size_inch"
                          label="包装尺寸(inch)"
                        >
                          <Input placeholder="长×宽×高(inch)" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="net_weight_kg"
                          label="单件净重(kg)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="单件净重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="net_weight_lbs"
                          label="单件净重(lbs)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="单件净重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="gross_weight_kg"
                          label="包装毛重(kg)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="包装毛重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="gross_weight_lbs"
                          label="包装毛重(lbs)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="包装毛重"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pcs_per_box"
                          label="单箱数量"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="单箱数量"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="image_url"
                          label="产品图片URL"
                        >
                          <Input placeholder="产品图片URL" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="package_image_url"
                          label="包装图片URL"
                        >
                          <Input placeholder="包装图片URL" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'pallet',
                label: '托盘信息',
                children: (
                  <>
                    <Divider orientation="left">托盘基本信息</Divider>
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

                    <Divider orientation="left">托盘方案A</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="pcs_per_pallet_a"
                          label="一托数量A"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="一托数量"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_a_cm"
                          label="打托高度A(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="打托高度"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_a_inch"
                          label="打托高度A(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="打托高度"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_a_kg"
                          label="整托毛重A(kg)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="整托毛重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_a_lbs"
                          label="整托毛重A(lbs)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="整托毛重"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">托盘方案B</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="pcs_per_pallet_b"
                          label="一托数量B"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="一托数量"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_b_cm"
                          label="打托高度B(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="打托高度"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_b_inch"
                          label="打托高度B(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="打托高度"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_b_kg"
                          label="整托毛重B(kg)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="整托毛重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_b_lbs"
                          label="整托毛重B(lbs)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="整托毛重"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">托盘方案C</Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="pcs_per_pallet_c"
                          label="一托数量C"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="一托数量"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_c_cm"
                          label="打托高度C(cm)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="打托高度"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="pallet_height_c_inch"
                          label="打托高度C(inch)"
                        >
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="打托高度"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_c_kg"
                          label="整托毛重C(kg)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="整托毛重"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="pallet_gross_weight_c_lbs"
                          label="整托毛重C(lbs)"
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="整托毛重"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
            ]}
          />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? '保存更改' : '创建耗材'}
              </Button>
              <Button onClick={handleCancel} icon={<ArrowLeftOutlined />}>
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