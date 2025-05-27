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
import MultilingualInput, { MultilingualValue } from '../../components/common/MultilingualInput';
import FileUploader from '../../components/common/FileUploader';
import adminProductLineService, { ProductLineFormData } from '../../services/admin-product-line.service';

// 严格对应wp_bjt_product_lines表的14个字段
interface ExtendedProductLineFormData {
  id?: number;
  code: string;                    // 产品线代码 - 必填
  title_zh: string;               // 中文标题 - 必填
  title_en: string;               // 英文标题 - 必填
  description_zh: string;         // 中文描述
  description_en: string;         // 英文描述
  subitem1_zh: string;           // 子项1中文 (耗材)
  subitem1_en: string;           // 子项1英文
  subitem2_zh: string;           // 子项2中文 (备件)
  subitem2_en: string;           // 子项2英文
  subitem3_zh?: string;          // 子项3中文 (可选)
  subitem3_en?: string;          // 子项3英文 (可选)
  image_url: string;             // 图片URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

const { Option } = Select;

const ProductLineEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!id;

  // 初始化表单数据
  useEffect(() => {
    if (isEditMode && id) {
      loadProductLine(parseInt(id));
    } else {
      // 新建时设置默认值
      form.setFieldsValue({
        code: '',
        title: { zh: '', en: '' },
        description: { zh: '', en: '' },
        subitem1: { zh: '耗材', en: 'Consumables' },
        subitem2: { zh: '备件', en: 'Spare Parts' },
        subitem3: { zh: '', en: '' },
        image_url: '',
        status: 'draft',
        sort_order: 1,
      });
    }
  }, [id, isEditMode, form]);

  const loadProductLine = async (productLineId: number) => {
    try {
      setLoading(true);
      const data = await adminProductLineService.getProductLine(productLineId);
      
      console.log('API返回的原始数据:', data);
      
      // 转换数据格式以适应表单 - 从API的平坦结构转换为表单的嵌套结构
      const formValues = {
        code: data.code || data.id?.toString() || '',
        title: {
          zh: data.title_zh || '',
          en: data.title_en || ''
        },
        description: {
          zh: data.description_zh || '',
          en: data.description_en || ''
        },
        subitem1: {
          zh: data.subitem1_zh || '耗材',
          en: data.subitem1_en || 'Consumables'
        },
        subitem2: {
          zh: data.subitem2_zh || '备件',
          en: data.subitem2_en || 'Spare Parts'
        },
        subitem3: {
          zh: data.subitem3_zh || '',
          en: data.subitem3_en || ''
        },
        image_url: data.image_url || '',
        status: data.status || 'draft',
        sort_order: data.sort_order || 1,
      };
      
      console.log('转换后的表单数据:', formValues);
      
      form.setFieldsValue(formValues);
    } catch (error) {
      console.error('加载产品线数据失败:', error);
      message.error('加载产品线数据失败');
    } finally {
      setLoading(false);
    }
  };

  const validateCode = async (rule: any, value: string) => {
    if (!value) {
      throw new Error('请输入产品线代码');
    }

    if (!/^[A-Z0-9_-]+$/.test(value)) {
      throw new Error('产品线代码只能包含大写字母、数字、下划线和短横线');
    }

    // TODO: 检查代码唯一性 - 需要后端API支持
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      console.log('表单提交的原始值:', values);

      // 转换表单数据为API格式 - 从表单的嵌套结构转换为API的平坦结构
      const formData: ProductLineFormData = {
        code: values.code,
        title_zh: values.title?.zh || '',
        title_en: values.title?.en || '',
        description_zh: values.description?.zh || '',
        description_en: values.description?.en || '',
        subitem1_zh: values.subitem1?.zh || '',
        subitem1_en: values.subitem1?.en || '',
        subitem2_zh: values.subitem2?.zh || '',
        subitem2_en: values.subitem2?.en || '',
        subitem3_zh: values.subitem3?.zh || '',
        subitem3_en: values.subitem3?.en || '',
        image_url: values.image_url || '',
        status: values.status || 'draft',
        sort_order: values.sort_order || 1,
      };

      console.log('转换后的API数据:', formData);

      if (isEditMode && id) {
        await adminProductLineService.updateProductLine(parseInt(id), formData);
        message.success('产品线更新成功');
      } else {
        await adminProductLineService.createProductLine(formData);
        message.success('产品线创建成功');
      }

      navigate('/admin/product-lines');
    } catch (error) {
      console.error('保存产品线失败:', error);
      message.error('保存产品线失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/product-lines');
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
    <div className="product-line-edit-page">
      <AdminPageHeader
        title={isEditMode ? '编辑产品线' : '新增产品线'}
        description={isEditMode ? `编辑产品线 ID: ${id}` : '创建新的产品线'}
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

            <ColComponent span={12}>
              <FormItemComponent
                label="产品线代码"
                name="code"
                rules={[
                  { required: true, message: '请输入产品线代码' },
                  { validator: validateCode },
                ]}
                extra="只能包含大写字母、数字、下划线和短横线，在系统中必须唯一"
              >
                <InputComponent placeholder="例如: BJT_MACHINE_A" />
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

            {/* 多语言标题 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品线标题</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品线标题"
                name="title"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入中英文标题');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '请输入中文标题', en: 'Please enter English title' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言描述 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品线描述</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品线描述"
                name="description"
              >
                <MultilingualInput
                  type="textarea"
                  rows={4}
                  placeholder={{ zh: '请输入中文描述', en: 'Please enter English description' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 子项目设置 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">子项目设置</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="子项目1 (耗材)"
                name="subitem1"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入子项目1的中英文名称');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '耗材', en: 'Consumables' }}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="子项目2 (备件)"
                name="subitem2"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入子项目2的中英文名称');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '备件', en: 'Spare Parts' }}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="子项目3 (可选)"
                name="subitem3"
              >
                <MultilingualInput
                  type="input"
                  placeholder={{ zh: '可选子项目', en: 'Optional subitem' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 产品线图片 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品线图片</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品线图片"
                name="image_url"
                extra="支持 JPG, PNG, GIF, WEBP 格式，文件大小不超过 10MB"
              >
                <FileUploader
                  type="image"
                  maxSize={10}
                  placeholder="上传产品线图片"
                  preview
                />
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
                {isEditMode ? '保存更改' : '创建产品线'}
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

export default ProductLineEditPage; 