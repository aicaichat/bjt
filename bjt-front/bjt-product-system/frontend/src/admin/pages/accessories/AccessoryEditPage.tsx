import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Select, Card, Row, Col, message, Spin, InputNumber, Divider, AutoComplete
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import DictionarySelect from '../../components/common/DictionarySelect';
import FileUrlInput from '../../components/common/FileUrlInput';
import { useAdminApi } from '../../hooks/useAdminApi';
import { accessoryService, AccessoryFormData, accessoryModelService } from '../../services/admin-accessory.service';
import adminProductLineService from '../../services/admin-product-line.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Option } = Select;
const { TextArea } = Input;

const AccessoryEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { t } = useAdminI18n();

  // 型号自动完成功能状态
  const [selectedProductLineId, setSelectedProductLineId] = useState<number>(1);
  const [accessoryModelOptions, setAccessoryModelOptions] = useState<Array<{value: string}>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [accessoryPartOptions, setAccessoryPartOptions] = useState<Array<{value: string}>>([]);
  const [accessoryNameZhOptions, setAccessoryNameZhOptions] = useState<Array<{value: string}>>([]);
  const [accessoryNameEnOptions, setAccessoryNameEnOptions] = useState<Array<{value: string}>>([]);
  const [accessoryBrandOptions, setAccessoryBrandOptions] = useState<Array<{value: string}>>([]);
  const [accessorySpecOptions, setAccessorySpecOptions] = useState<Array<{value: string}>>([]);
  const [accessorySpecImperialOptions, setAccessorySpecImperialOptions] = useState<Array<{value: string}>>([]);

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

  // 获取配件详情（编辑时）
  const {
    data: accessoryData,
    loading: accessoryLoading
  } = useAdminApi(
    () => isEdit ? accessoryService.getAccessory(parseInt(id!)) : Promise.resolve(null),
    {},
    [id, isEdit]
  );

  // 获取配件型号列表用于自动完成
  const fetchAccessoryModels = async (productLineId: number) => {
    try {
      console.log('[AccessoryEditPage] 获取配件型号列表', { productLineId });
      const response = await accessoryModelService.getAccessoryModels({
        product_line_id: productLineId,
        status: 'publish',
        per_page: 100
      });
      
      console.log('[AccessoryEditPage] 配件型号API响应', response);
      
      const modelOptions = response.items.map(model => ({
        value: model.model
      }));
      
      console.log('[AccessoryEditPage] 处理后的型号选项', modelOptions);
      setAccessoryModelOptions(modelOptions);
    } catch (error) {
      console.error('[AccessoryEditPage] 获取配件型号失败:', error);
      setAccessoryModelOptions([]);
    }
  };

  // 获取配件相关信息用于智能提示
  const fetchAccessoryContextData = async (productLineId: number, model?: string) => {
    try {
      console.log('[AccessoryEditPage] 获取配件上下文数据', { productLineId, model });
      
      const params: any = {
        product_line_id: productLineId,
        status: 'publish',
        per_page: 100
      };
      
      if (model) {
        params.model = model;
      }
      
      const response = await accessoryService.getAccessories(params);
      console.log('[AccessoryEditPage] 配件上下文数据API响应', response);
      
      const accessories = response.items || [];
      
      // 提取料号选项
      const partOptions = accessories.map(accessory => ({
        value: accessory.part_number
      }));
      
      // 提取中文名称选项（去重）
      const nameZhOptions = [...new Set(
        accessories
          .filter(accessory => accessory.name_zh)
          .map(accessory => accessory.name_zh)
      )].map(name => ({ value: name }));
      
      // 提取英文名称选项（去重）
      const nameEnOptions = [...new Set(
        accessories
          .filter(accessory => accessory.name_en)
          .map(accessory => accessory.name_en)
      )].map(name => ({ value: name }));
      
      // 提取品牌选项（去重）
      const brandOptions = [...new Set(
        accessories
          .filter(accessory => accessory.brand)
          .map(accessory => accessory.brand)
      )].map(brand => ({ value: brand }));
      
      // 提取规格选项（去重）
      const specOptions = [...new Set(
        accessories
          .filter(accessory => accessory.spec)
          .map(accessory => accessory.spec)
      )].map(spec => ({ value: spec }));
      
      // 提取英制规格选项（去重）
      const specImperialOptions = [...new Set(
        accessories
          .filter(accessory => accessory.spec_imperial)
          .map(accessory => accessory.spec_imperial)
      )].map(spec => ({ value: spec }));
      
      console.log('[AccessoryEditPage] 处理后的选项', {
        partOptions: partOptions.length,
        nameZhOptions: nameZhOptions.length,
        nameEnOptions: nameEnOptions.length,
        brandOptions: brandOptions.length,
        specOptions: specOptions.length,
        specImperialOptions: specImperialOptions.length
      });
      
      // 更新状态
      setAccessoryPartOptions(partOptions);
      setAccessoryNameZhOptions(nameZhOptions);
      setAccessoryNameEnOptions(nameEnOptions);
      setAccessoryBrandOptions(brandOptions);
      setAccessorySpecOptions(specOptions);
      setAccessorySpecImperialOptions(specImperialOptions);
      
    } catch (error) {
      console.error('[AccessoryEditPage] 获取配件上下文数据失败:', error);
      // 清空所有选项
      setAccessoryPartOptions([]);
      setAccessoryNameZhOptions([]);
      setAccessoryNameEnOptions([]);
      setAccessoryBrandOptions([]);
      setAccessorySpecOptions([]);
      setAccessorySpecImperialOptions([]);
    }
  };

  // 获取配件料号列表用于自动完成（保持向后兼容）
  const fetchAccessoryParts = async (productLineId: number, model: string) => {
    await fetchAccessoryContextData(productLineId, model);
  };

  // 产品线变化处理
  const handleProductLineChange = (productLineId: number) => {
    console.log('[AccessoryEditPage] 产品线变化', { productLineId });
    setSelectedProductLineId(productLineId);
    setSelectedModel('');
    form.setFieldValue('model', ''); // 清空型号字段
    form.setFieldValue('part_number', ''); // 清空料号字段
    
    // 清空所有智能提示选项
    setAccessoryPartOptions([]);
    setAccessoryNameZhOptions([]);
    setAccessoryNameEnOptions([]);
    setAccessoryBrandOptions([]);
    setAccessorySpecOptions([]);
    setAccessorySpecImperialOptions([]);
    
    // 加载产品线级别的数据（不限制型号）
    fetchAccessoryContextData(productLineId);
  };

  // 型号变化处理
  const handleModelChange = (model: string) => {
    console.log('[AccessoryEditPage] 型号变化', { model });
    setSelectedModel(model);
    form.setFieldValue('part_number', ''); // 清空料号字段
    
    if (model && selectedProductLineId) {
      // 加载特定型号的数据
      fetchAccessoryContextData(selectedProductLineId, model);
    } else if (selectedProductLineId) {
      // 如果型号为空，加载产品线级别的数据
      fetchAccessoryContextData(selectedProductLineId);
    } else {
      // 清空所有选项
      setAccessoryPartOptions([]);
      setAccessoryNameZhOptions([]);
      setAccessoryNameEnOptions([]);
      setAccessoryBrandOptions([]);
      setAccessorySpecOptions([]);
      setAccessorySpecImperialOptions([]);
    }
  };

  // 当获取到数据时，填充表单
  useEffect(() => {
    if (accessoryData && isEdit) {
      console.log('[AccessoryEditPage] 填充编辑数据', accessoryData);
      form.setFieldsValue({
        product_line_id: accessoryData.product_line_id,
        model: accessoryData.model || '',
        brand: accessoryData.brand || '',
        part_number: accessoryData.part_number,
        name_zh: accessoryData.name_zh,
        name_en: accessoryData.name_en,
        spec: accessoryData.spec || '',
        spec_imperial: accessoryData.spec_imperial || '',
        voltage: accessoryData.voltage || '',
        frequency: accessoryData.frequency || '',
        package_size_cm: accessoryData.package_size_cm || '',
        package_size_inch: accessoryData.package_size_inch || '',
        net_weight_kg: accessoryData.net_weight_kg || 0,
        net_weight_lbs: accessoryData.net_weight_lbs || 0,
        gross_weight_kg: accessoryData.gross_weight_kg || 0,
        gross_weight_lbs: accessoryData.gross_weight_lbs || 0,
        pcs_per_box: accessoryData.pcs_per_box || 0,
        pallet_size_cm: accessoryData.pallet_size_cm || '',
        pallet_size_inch: accessoryData.pallet_size_inch || '',
        pcs_per_pallet: accessoryData.pcs_per_pallet || 0,
        pallet_height_cm: accessoryData.pallet_height_cm || 0,
        pallet_height_inch: accessoryData.pallet_height_inch || 0,
        pallet_gross_weight_kg: accessoryData.pallet_gross_weight_kg || 0,
        pallet_gross_weight_lbs: accessoryData.pallet_gross_weight_lbs || 0,
        image_url: accessoryData.image_url || '',
        status: accessoryData.status,
        unit: accessoryData.unit || 'pcs',
      });
      
      // 设置产品线ID和型号用于加载选项
      if (accessoryData.product_line_id) {
        setSelectedProductLineId(accessoryData.product_line_id);
      }
      if (accessoryData.model) {
        setSelectedModel(accessoryData.model);
      }
    }
  }, [accessoryData, form, isEdit]);

  // 加载型号选项
  useEffect(() => {
    if (selectedProductLineId) {
      fetchAccessoryModels(selectedProductLineId);
    }
  }, [selectedProductLineId]);

  // 加载料号选项
  useEffect(() => {
    if (selectedProductLineId && selectedModel) {
      fetchAccessoryParts(selectedProductLineId, selectedModel);
    }
  }, [selectedProductLineId, selectedModel]);

  const handleSubmit = async (values: AccessoryFormData) => {
    try {
      console.log('[AccessoryEditPage] 提交表单数据', values);
      
      // 客户端验证
      if (!values.product_line_id) {
        message.error('请选择产品线');
        return;
      }
      if (!values.model) {
        message.error('请输入型号');
        return;
      }
      if (!values.part_number) {
        message.error('请输入料号');
        return;
      }
      if (!values.name_zh) {
        message.error('请输入中文名称');
        return;
      }

      if (isEdit) {
        await accessoryService.updateAccessory(parseInt(id!), values);
        message.success(t('message.updateSuccess', { ns: 'accessories' }));
      } else {
        await accessoryService.createAccessory(values);
        message.success(t('message.createSuccess', { ns: 'accessories' }));
      }
      navigate('/admin/accessories');
    } catch (error: any) {
      console.error('[AccessoryEditPage] 提交失败:', error);
      
      // 详细错误处理
      if (error?.response?.data?.message) {
        message.error(`提交失败: ${error.response.data.message}`);
      } else if (error?.message) {
        message.error(`提交失败: ${error.message}`);
      } else {
        message.error(isEdit ? t('message.updateFailed', { ns: 'accessories' }) : t('message.createFailed', { ns: 'accessories' }));
      }
    }
  };

  const handleCancel = () => {
    navigate('/admin/accessories');
  };

  const productLines = (productLineData as any)?.items || [];

  if (productLineLoading || (isEdit && accessoryLoading)) {
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
        title={isEdit ? t('edit.title', { ns: 'accessories' }) : t('create.title', { ns: 'accessories' })}
        onBack={handleCancel}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            product_line_id: 1,
            status: 'publish',
            unit: 'pcs',
            net_weight_kg: 0,
            net_weight_lbs: 0,
            gross_weight_kg: 0,
            gross_weight_lbs: 0,
            pcs_per_box: 0,
            pcs_per_pallet: 0,
            pallet_height_cm: 0,
            pallet_height_inch: 0,
            pallet_gross_weight_kg: 0,
            pallet_gross_weight_lbs: 0,
          }}
        >
          {/* 基本信息 */}
          <Divider orientation="left">基本信息 (Basic Info)</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_line_id"
                label="产品线 (Product Line)"
                rules={[{ required: true, message: "请选择产品线" }]}
              >
                <Select 
                  placeholder="请选择产品线"
                  onChange={handleProductLineChange}
                >
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
                label="型号 (Model)"
                rules={[{ required: true, message: "请输入型号" }]}
                extra={`参考该产品线下已有的配件型号，当前共 ${accessoryModelOptions.length} 个型号`}
              >
                <AutoComplete
                  options={accessoryModelOptions}
                  placeholder="请输入型号，可参考下拉提示中的已有配件型号"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                  onChange={handleModelChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="品牌 (Brand)"
                extra={`参考该产品线下已有的配件品牌，当前共 ${accessoryBrandOptions.length} 个品牌`}
              >
                <AutoComplete
                  options={accessoryBrandOptions}
                  placeholder="请输入品牌，可参考下拉提示中的已有品牌"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="part_number"
                label="料号 (Part No.)"
                rules={[{ required: true, message: "请输入料号" }]}
                extra={selectedModel ? `参考该产品线下同型号的已有配件料号，当前共 ${accessoryPartOptions.length} 个料号` : '请先选择型号以获取料号提示'}
              >
                <AutoComplete
                  options={accessoryPartOptions}
                  placeholder="请输入料号，可参考下拉提示中的已有配件料号"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name_zh"
                label="中文名称 (Chinese Item)"
                rules={[{ required: true, message: "请输入中文名称" }]}
                extra={`参考该产品线下已有的配件中文名称，当前共 ${accessoryNameZhOptions.length} 个名称`}
              >
                <AutoComplete
                  options={accessoryNameZhOptions}
                  placeholder="请输入中文名称，可参考下拉提示中的已有名称"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name_en"
                label="英文名称 (English Item)"
                extra={`参考该产品线下已有的配件英文名称，当前共 ${accessoryNameEnOptions.length} 个名称`}
              >
                <AutoComplete
                  options={accessoryNameEnOptions}
                  placeholder="请输入英文名称，可参考下拉提示中的已有名称"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="spec"
                label="规格 (Metric Spec)"
                extra={`参考该产品线下已有的配件规格，当前共 ${accessorySpecOptions.length} 个规格`}
              >
                <AutoComplete
                  options={accessorySpecOptions}
                  placeholder="请输入规格，可参考下拉提示中的已有规格"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="spec_imperial"
                label="英制规格 (Imperial Spec)"
                extra={`参考该产品线下已有的配件英制规格，当前共 ${accessorySpecImperialOptions.length} 个规格`}
              >
                <AutoComplete
                  options={accessorySpecImperialOptions}
                  placeholder="请输入英制规格，可参考下拉提示中的已有规格"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="voltage"
                label="电压 (Voltage)"
              >
                <Input placeholder="请输入电压" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="frequency"
                label="频率 (Frequency)"
              >
                <Input placeholder="请输入频率" />
              </Form.Item>
            </Col>
          </Row>

          {/* 包装信息 */}
          <Divider orientation="left">包装信息 (Package Information)</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="package_size_cm"
                label="包装尺寸 cm (Package Size cm)"
              >
                <Input placeholder="请输入包装尺寸 (cm)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="package_size_inch"
                label="包装尺寸 inch (Package Size inch)"
              >
                <Input placeholder="请输入包装尺寸 (inch)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="net_weight_kg"
                label="净重 kg (Net Weight kg)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入净重 (kg)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="net_weight_lbs"
                label="净重 lbs (Net Weight lbs)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入净重 (lbs)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="gross_weight_kg"
                label="毛重 kg (Gross Weight kg)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入毛重 (kg)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="gross_weight_lbs"
                label="毛重 lbs (Gross Weight lbs)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入毛重 (lbs)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pcs_per_box"
                label="每箱数量 (Pcs per Box)"
              >
                <InputNumber
                  min={0}
                  placeholder="请输入每箱数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 托盘信息 */}
          <Divider orientation="left">托盘信息 (Pallet Information)</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pallet_size_cm"
                label="托盘尺寸 cm (Pallet Size cm)"
              >
                <Input placeholder="请输入托盘尺寸 (cm)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pallet_size_inch"
                label="托盘尺寸 inch (Pallet Size inch)"
              >
                <Input placeholder="请输入托盘尺寸 (inch)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="pcs_per_pallet"
                label="每托盘数量 (Pcs per Pallet)"
              >
                <InputNumber
                  min={0}
                  placeholder="请输入每托盘数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="pallet_height_cm"
                label="托盘高度 cm (Pallet Height cm)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入托盘高度 (cm)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="pallet_height_inch"
                label="托盘高度 inch (Pallet Height inch)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入托盘高度 (inch)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pallet_gross_weight_kg"
                label="托盘毛重 kg (Pallet Gross Weight kg)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入托盘毛重 (kg)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pallet_gross_weight_lbs"
                label="托盘毛重 lbs (Pallet Gross Weight lbs)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="请输入托盘毛重 (lbs)"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 其他信息 */}
          <Divider orientation="left">其他信息 (Other Information)</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="image_url"
                label="图片 (Image)"
              >
                <FileUrlInput 
                  placeholder="请输入图片URL或点击上传"
                  uploadPath="/uploads/accessories/images/"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unit"
                label="单位 (Unit)"
                rules={[{ required: true, message: "请选择单位" }]}
              >
                <DictionarySelect dictionaryType="units" placeholder="请选择单位" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="status"
                label="状态 (Status)"
                rules={[{ required: true, message: "请选择状态" }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="publish">已发布 (Published)</Option>
                  <Option value="draft">草稿 (Draft)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancel}>取消 (Cancel)</Button>
              <Button type="primary" htmlType="submit">
                {isEdit ? '更新配件 (Update Accessory)' : '创建配件 (Add Accessory)'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AccessoryEditPage; 