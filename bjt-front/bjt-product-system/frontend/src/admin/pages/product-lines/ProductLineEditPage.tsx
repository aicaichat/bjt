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
import FileUrlInput from '../../components/common/FileUrlInput';
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
      // 新建时设置默认值 - 按照修复模板优化
      console.log('[ProductLineEditPage] 设置默认值');
      const defaultValues = {
        code: "自动分配",  // 显示提示文本，不参与提交
        title: { zh: '', en: '' },
        description: { zh: '', en: '' },
        subitem1: { zh: '耗材', en: 'Consumables' },
        subitem2: { zh: '备件', en: 'Spare Parts' },
        subitem3: { zh: '', en: '' },
        image_url: '',
        status: 'publish',    // 默认为发布状态
        sort_order: 1,
      };
      form.setFieldsValue(defaultValues);
      
      // 延迟确保默认值设置成功
      setTimeout(() => {
        console.log('[ProductLineEditPage] 验证默认值设置:', form.getFieldsValue());
      }, 100);
    }
  }, [id, isEditMode, form]);

  const loadProductLine = async (productLineId: number) => {
    try {
      setLoading(true);
      const data: any = await adminProductLineService.getProductLine(productLineId);
      
      console.log('[ProductLineEditPage] API返回的原始数据:', data);
      
      // 转换数据格式以适应表单 - 处理API字段映射
      const formValues = {
        code: data.id?.toString() || id,  // 显示产品线ID
        title: {
          // API可能返回title_zh/title_en 或 name_cn/name_en
          zh: data.title_zh || data.name_cn || '',
          en: data.title_en || data.name_en || ''
        },
        description: {
          // API可能返回description_zh/description_en 或 description_cn/description_en
          zh: data.description_zh || data.description_cn || '',
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
        status: data.status || 'publish',
        sort_order: data.sort_order || data.menu_order || 1,  // 处理menu_order字段映射
      };
      
      console.log('[ProductLineEditPage] 转换后的表单数据:', formValues);
      
      form.setFieldsValue(formValues);
      
      // 延迟验证表单值是否正确设置
      setTimeout(() => {
        const currentValues = form.getFieldsValue();
        console.log('[ProductLineEditPage] 验证表单值设置结果:', currentValues);
        
        // 检查关键字段是否正确设置
        if (!currentValues.title?.zh) {
          console.warn('[ProductLineEditPage] 关键字段未正确设置，重新设置');
          form.setFieldsValue(formValues);
        }
      }, 100);
      
    } catch (error) {
      console.error('[ProductLineEditPage] 加载产品线数据失败:', error);
      message.error('加载产品线数据失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      console.log('[ProductLineEditPage] 表单提交的原始值:', values);

      // 转换表单数据为API格式 - 修复字段映射问题
      const formData: any = {
        // code字段不提交，ID由后端自动分配或在编辑时保持不变
        name_cn: values.title?.zh || '',           // API期望name_cn，映射到数据库title_zh
        name_en: values.title?.en || '',           // API期望name_en，映射到数据库title_en
        description_cn: values.description?.zh || '', // API期望description_cn，映射到数据库description_zh
        description_en: values.description?.en || '',
        // 子项字段映射
        subitem1_zh: values.subitem1?.zh || '',
        subitem1_en: values.subitem1?.en || '',
        subitem2_zh: values.subitem2?.zh || '',
        subitem2_en: values.subitem2?.en || '',
        subitem3_zh: values.subitem3?.zh || '',
        subitem3_en: values.subitem3?.en || '',
        image_url: values.image_url || '',
        status: values.status || 'publish',        // 默认为publish而不是draft
        menu_order: values.sort_order || 1,       // API期望menu_order，映射到数据库sort_order
      };

      console.log('[ProductLineEditPage] 转换后的API数据:', formData);

      if (isEditMode && id) {
        await adminProductLineService.updateProductLine(parseInt(id), formData);
        message.success('产品线更新成功');
      } else {
        const result = await adminProductLineService.createProductLine(formData);
        console.log('[ProductLineEditPage] 创建结果:', result);
        message.success('产品线创建成功');
      }

      navigate('/admin/product-lines');
    } catch (error: any) {
      console.error('[ProductLineEditPage] 保存产品线失败:', error);
      
      // 增强错误处理
      let errorMessage = isEditMode ? '更新产品线失败' : '创建产品线失败';
      if (error?.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
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
              <DividerComponent orientation="left">基本信息 (Basic Information)</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="产品线代码 (Product Line Code)"
                name="code"
                extra="产品线的唯一数字标识，系统自动分配"
              >
                <InputComponent 
                  placeholder={isEditMode ? `产品线 ID: ${id}` : "新产品线将自动分配ID"}
                  disabled
                  value={isEditMode ? id : "自动分配"}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="状态 (Status)"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <SelectComponent>
                  <OptionComponent value="draft">草稿 (Draft)</OptionComponent>
                  <OptionComponent value="publish">已发布 (Published)</OptionComponent>
                  <OptionComponent value="trash">回收站 (Trash)</OptionComponent>
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="排序 (Sort Order)"
                name="sort_order"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言标题 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品线名称 (Product Line Name)</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品线名称 (Product Line Name)"
                name="title"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入中英文产品线名称');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '请输入中文产品线名称', en: 'Please enter English product line name' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 多语言描述 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品线描述 (Description)</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品线描述 (Product Line Description)"
                name="description"
              >
                <MultilingualInput
                  type="textarea"
                  rows={4}
                  placeholder={{ zh: '请输入中文产品线描述', en: 'Please enter English product line description' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 子项目设置 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">子项目设置 (Sub-items Configuration)</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="子项目1 (Sub-item 1) - 通常为耗材"
                name="subitem1"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入中英文子项目1名称');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '如：耗材', en: 'e.g., Consumables' }}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="子项目2 (Sub-item 2) - 通常为备件"
                name="subitem2"
                rules={[
                  {
                    validator: (_: any, value: any) => {
                      if (!value?.zh || !value?.en) {
                        return Promise.reject('请输入中英文子项目2名称');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MultilingualInput
                  type="input"
                  required
                  placeholder={{ zh: '如：备件', en: 'e.g., Spare Parts' }}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="子项目3 (Sub-item 3) - 可选"
                name="subitem3"
              >
                <MultilingualInput
                  type="input"
                  placeholder={{ zh: '可选的第三个子项目', en: 'Optional third sub-item' }}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 产品线图片 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">产品线图片 (Product Line Image)</DividerComponent>
            </ColComponent>

            <ColComponent span={24}>
              <FormItemComponent
                label="产品线图片 (Product Line Image)"
                name="image_url"
                extra="支持上传图片文件或输入图片URL地址，文件大小不超过 10MB"
              >
                <FileUrlInput
                  fileType="image"
                  maxSize={10}
                  placeholder="请输入图片URL地址或点击上传"
                  uploadPath="/uploads/product-lines/images/"
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