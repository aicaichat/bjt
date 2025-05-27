import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Space,
  Card,
  message,
  Select,
  InputNumber,
  Row,
  Col,
  Divider,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import adminHostModelService from '../../services/admin-host-model.service';
import { AdminHostModel } from '../../types/admin-models.types';
import adminProductLineService from '../../services/admin-product-line.service';

// 使用AdminHostModel接口
const { Option } = Select;

interface MachineEditPageProps {
  mode?: 'create' | 'edit';
}

const MachineEditPage: React.FC<MachineEditPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);

  const isEditMode = mode === 'edit' || !!id;

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    if (isEditMode && id) {
      loadHostModel(id);
    } else {
      // 新建时设置默认值
      form.setFieldsValue({
        product_line_id: undefined,
        model: '',
        title_zh: '',
        title_en: '',
        description_zh: '',
        description_en: '',
        type: '',
        image1_url: '',
        image2_url: '',
        explosion_diagram_pdf: '',
        status: 'publish',
        sort_order: 1,
      });
    }
  }, [id, isEditMode, form]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      if (response && response.items && Array.isArray(response.items)) {
        setProductLines(response.items);
      } else {
        console.warn('Invalid product lines response:', response);
        setProductLines([]);
      }
    } catch (error) {
      console.error('加载产品线失败:', error);
      message.error('加载产品线失败');
      setProductLines([]); // 确保设置为空数组而不是 undefined
    }
  };

  const loadHostModel = async (hostModelId: string) => {
    try {
      setLoading(true);
      const data = await adminHostModelService.getHostModel(hostModelId);
      
      // 转换数据格式以适应表单
      form.setFieldsValue({
        product_line_id: data.product_line_id,
        model: data.model,
        title_zh: data.title_zh,
        title_en: data.title_en,
        description_zh: data.description_zh,
        description_en: data.description_en,
        type: data.type,
        image1_url: data.image1_url,
        image2_url: data.image2_url,
        explosion_diagram_pdf: data.explosion_diagram_pdf,
        status: data.status,
        sort_order: data.sort_order,
      });
    } catch (error) {
      console.error('加载主机型号数据失败:', error);
      message.error('加载主机型号数据失败');
    } finally {
      setLoading(false);
    }
  };

  const validateModel = async (rule: any, value: string) => {
    if (!value) {
      throw new Error('请输入主机型号编码');
    }

    const productLineId = form.getFieldValue('product_line_id');
    if (!productLineId) {
      throw new Error('请先选择产品线');
    }

    // TODO: 检查型号在同产品线下的唯一性
    // const isUnique = await checkModelUnique(productLineId, value, id);
    // if (!isUnique) {
    //   throw new Error('该型号在当前产品线下已存在');
    // }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      // 转换表单数据为API格式
      const formData: Partial<AdminHostModel> = {
        product_line_id: values.product_line_id,
        model: values.model,
        title_zh: values.title_zh,
        title_en: values.title_en,
        description_zh: values.description_zh,
        description_en: values.description_en,
        type: values.type,
        image1_url: values.image1_url,
        image2_url: values.image2_url,
        explosion_diagram_pdf: values.explosion_diagram_pdf,
        status: values.status,
        sort_order: values.sort_order,
      };

      if (isEditMode && id) {
        await adminHostModelService.updateHostModel(id, formData);
        message.success('主机型号更新成功');
      } else {
        await adminHostModelService.createHostModel(formData);
        message.success('主机型号创建成功');
      }

      navigate('/admin/machines');
    } catch (error) {
      console.error('保存主机型号失败:', error);
      message.error('保存主机型号失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/machines');
  };

  // 使用类型断言解决React组件类型问题
  const ButtonComponent = Button as any;
  const CardComponent = Card as any;
  const FormComponent = Form as any;
  const FormItemComponent = Form.Item as any;
  const RowComponent = Row as any;
  const ColComponent = Col as any;
  const DividerComponent = Divider as any;
  const SelectComponent = Select as any;
  const OptionComponent = Option as any;
  const InputComponent = Input as any;
  const InputNumberComponent = InputNumber as any;
  const SpaceComponent = Space as any;
  const ArrowLeftIcon = ArrowLeftOutlined as any;
  const SaveIcon = SaveOutlined as any;

  return (
    <div className="machine-edit-page">
      <AdminPageHeader
        title={isEditMode ? '编辑主机型号' : '新增主机型号'}
        description={isEditMode ? `编辑主机型号 ID: ${id}` : '创建新的主机型号'}
        extra={
          <ButtonComponent key="back" icon={<ArrowLeftIcon />} onClick={handleBack}>
            返回列表
          </ButtonComponent>
        }
      />

      <CardComponent loading={loading}>
        <FormComponent
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={submitting}
          scrollToFirstError
        >
          <RowComponent gutter={24}>
            {/* 基本信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">基本信息</DividerComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="所属产品线"
                name="product_line_id"
                rules={[{ required: true, message: '请选择所属产品线' }]}
              >
                <SelectComponent placeholder="请选择产品线">
                  {(productLines || []).map((line) => (
                    <OptionComponent key={line.id} value={line.id}>
                      {line.title_zh || line.title_en || line.name || `产品线${line.id}`}
                    </OptionComponent>
                  ))}
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="主机型号编码"
                name="model"
                rules={[
                  { required: true, message: '请输入主机型号编码' },
                  { validator: validateModel },
                ]}
                extra="在同一产品线下必须唯一"
              >
                <InputComponent placeholder="例如: BJT-A100" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="主机类型"
                name="type"
                rules={[{ required: true, message: '请输入主机类型' }]}
              >
                <InputComponent placeholder="例如: 包装机" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <SelectComponent>
                  <OptionComponent value="draft">草稿</OptionComponent>
                  <OptionComponent value="publish">已发布</OptionComponent>
                  <OptionComponent value="trash">回收站</OptionComponent>
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="排序"
                name="sort_order"
                rules={[{ required: true, message: '请输入排序号' }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言名称 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">主机名称</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="中文名称"
                name="title_zh"
                rules={[{ required: true, message: '请输入中文名称' }]}
              >
                <InputComponent placeholder="请输入中文名称" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="英文名称"
                name="title_en"
                rules={[{ required: true, message: '请输入英文名称' }]}
              >
                <InputComponent placeholder="Please enter English name" />
              </FormItemComponent>
            </ColComponent>

            {/* 描述信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">主机描述</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="中文描述"
                name="description_zh"
              >
                <InputComponent.TextArea rows={4} placeholder="请输入中文描述" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="英文描述"
                name="description_en"
              >
                <InputComponent.TextArea rows={4} placeholder="Please enter English description" />
              </FormItemComponent>
            </ColComponent>

            {/* 图片和文档 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">图片和文档</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="主图URL"
                name="image1_url"
                extra="请输入图片URL地址"
              >
                <InputComponent placeholder="例如: https://example.com/image1.jpg" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="副图URL"
                name="image2_url"
                extra="请输入图片URL地址"
              >
                <InputComponent placeholder="例如: https://example.com/image2.jpg" />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="爆炸图PDF URL"
                name="explosion_diagram_pdf"
                extra="请输入PDF文件URL地址"
              >
                <InputComponent placeholder="例如: https://example.com/diagram.pdf" />
              </FormItemComponent>
            </ColComponent>
          </RowComponent>

          {/* 操作按钮 */}
          <FormItemComponent style={{ marginTop: 32, textAlign: 'center' }}>
            <SpaceComponent size="large">
              <ButtonComponent
                type="primary"
                htmlType="submit"
                icon={<SaveIcon />}
                loading={submitting}
                size="large"
              >
                {isEditMode ? '保存更改' : '创建主机型号'}
              </ButtonComponent>
              <ButtonComponent onClick={handleBack} size="large">
                取消
              </ButtonComponent>
            </SpaceComponent>
          </FormItemComponent>
        </FormComponent>
      </CardComponent>
    </div>
  );
};

export default MachineEditPage; 