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
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

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
  const { t } = useAdminI18n();
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
      message.error(t('messages.error', { ns: 'productLines' }));
    } finally {
      setLoading(false);
    }
  };

  const validateCode = async (rule: any, value: string) => {
    if (!value) {
      throw new Error(t('form.validation.codeRequired', { ns: 'productLines' }));
    }

    if (!/^[A-Z0-9_-]+$/.test(value)) {
      throw new Error(t('form.validation.codeFormat', { ns: 'productLines' }));
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
        message.success(t('messages.success.updated', { ns: 'productLines' }));
      } else {
        await adminProductLineService.createProductLine(formData);
        message.success(t('messages.success.created', { ns: 'productLines' }));
      }

      navigate('/admin/product-lines');
    } catch (error) {
      console.error('保存产品线失败:', error);
      message.error(isEditMode ? t('messages.error.update', { ns: 'productLines' }) : t('messages.error.create', { ns: 'productLines' }));
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
        title={isEditMode ? t('form.title.edit', { ns: 'productLines' }) : t('form.title.add', { ns: 'productLines' })}
        description={isEditMode ? t('form.description.edit', { ns: 'productLines', id }) : t('form.description.add', { ns: 'productLines' })}
        extra={
          <ButtonComponent key="back" icon={<ArrowLeftIcon />} onClick={handleBack}>
            {t('actions.backToList', { ns: 'productLines' })}
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
              <DividerComponent orientation="left">{t('form.sections.basicInfo', { ns: 'productLines' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label={t('form.fields.code', { ns: 'productLines' })}
                name="code"
                rules={[
                  { required: true, message: t('form.validation.codeRequired', { ns: 'productLines' }) },
                  { validator: validateCode },
                ]}
                extra={t('form.help.codeFormat', { ns: 'productLines' })}
              >
                <InputComponent placeholder={t('form.placeholders.code', { ns: 'productLines' })} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label={t('form.fields.status', { ns: 'productLines' })}
                name="status"
                rules={[{ required: true, message: t('form.validation.statusRequired', { ns: 'productLines' }) }]}
              >
                <SelectComponent>
                  <OptionComponent value="draft">{t('filters.status.draft', { ns: 'productLines' })}</OptionComponent>
                  <OptionComponent value="publish">{t('filters.status.publish', { ns: 'productLines' })}</OptionComponent>
                  <OptionComponent value="trash">{t('filters.status.trash', { ns: 'productLines' })}</OptionComponent>
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label={t('form.fields.sortOrder', { ns: 'productLines' })}
                name="sort_order"
                rules={[{ required: true, message: t('form.validation.sortOrderRequired', { ns: 'productLines' }) }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言标题 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('form.sections.title', { ns: 'productLines' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label={t('form.fields.name', { ns: 'productLines' })}
                name="title"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject(t('form.validation.nameRequired', { ns: 'productLines' }));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: t('form.placeholders.nameZh', { ns: 'productLines' }), en: t('form.placeholders.nameEn', { ns: 'productLines' }) }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言描述 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('form.sections.description', { ns: 'productLines' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label={t('form.fields.description', { ns: 'productLines' })}
                name="description"
              >
                <MultilingualInput
                  type="textarea"
                  rows={4}
                  placeholder={{ zh: t('form.placeholders.descriptionZh', { ns: 'productLines' }), en: t('form.placeholders.descriptionEn', { ns: 'productLines' }) }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 子项目设置 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('form.sections.subitems', { ns: 'productLines' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label={t('form.fields.subitem1', { ns: 'productLines' })}
                name="subitem1"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject(t('form.validation.subitem1Required', { ns: 'productLines' }));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: t('form.placeholders.subitem1Zh', { ns: 'productLines' }), en: t('form.placeholders.subitem1En', { ns: 'productLines' }) }}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label={t('form.fields.subitem2', { ns: 'productLines' })}
                name="subitem2"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject(t('form.validation.subitem2Required', { ns: 'productLines' }));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: t('form.placeholders.subitem2Zh', { ns: 'productLines' }), en: t('form.placeholders.subitem2En', { ns: 'productLines' }) }}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label={t('form.fields.subitem3', { ns: 'productLines' })}
                name="subitem3"
              >
                <MultilingualInput
                  type="input"
                  placeholder={{ zh: t('form.placeholders.subitem3Zh', { ns: 'productLines' }), en: t('form.placeholders.subitem3En', { ns: 'productLines' }) }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 产品线图片 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('form.sections.image', { ns: 'productLines' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label={t('form.fields.image', { ns: 'productLines' })}
                name="image_url"
                extra={t('form.help.imageFormat', { ns: 'productLines' })}
              >
                <FileUploader
                  type="image"
                  maxSize={10}
                  placeholder={t('form.placeholders.image', { ns: 'productLines' })}
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
                {isEditMode ? t('actions.saveChanges', { ns: 'productLines' }) : t('actions.create', { ns: 'productLines' })}
              </ButtonComponent>
              <ButtonComponent onClick={handleBack} size="large">
                {t('actions.cancel', { ns: 'productLines' })}
              </ButtonComponent>
            </SpaceComponent>
          </FormItemComponent>
        </FormComponent>
      </CardComponent>
    </div>
  );
};

export default ProductLineEditPage; 