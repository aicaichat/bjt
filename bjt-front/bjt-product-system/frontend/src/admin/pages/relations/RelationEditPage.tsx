import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Radio,
  AutoComplete,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import MultilingualInput from '../../components/common/MultilingualInput';
import DictionarySelect from '../../components/common/DictionarySelect';
import adminRelationService from '../../services/admin-relation.service';
import adminProductLineService from '../../services/admin-product-line.service';
import adminPartService from '../../services/admin-part.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

// 严格对应wp_bjt_relations表的13个字段
interface RelationFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  host_part_number: number;       // 主机料号-0级 - 必填 (新增字段)
  part_number: string;           // 自身料号 - 必填
  parent_part_number?: string;   // 父项料号
  child_part_number?: string;    // 子项料号
  child_type: 'accessory' | 'spare_part'; // 子项类型：配件/备件
  level: number;                 // 层级(1-5)，备件固定为1
  quantity: number;              // 子项在父项中的数量
  required_parts?: string;       // 依赖关联料号 (多个用逗号分隔)
  required_quantity?: string;    // 依赖关联料号对应的数量 (多个用逗号分隔)
  sort_order: number;           // 同级排序
  status: 'publish' | 'draft' | 'trash'; // 状态
  created_at?: string;          // 只读
  updated_at?: string;          // 只读
}

const { Option } = Select;

const RelationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [hostParts, setHostParts] = useState<any[]>([]);
  const [allParts, setAllParts] = useState<any[]>([]);
  const [partOptions, setPartOptions] = useState<any[]>([]);
  const { t } = useAdminI18n();

  const isEditMode = !!id;
  const parentId = searchParams.get('parent_id');
  const level = searchParams.get('level');

  // 初始化数据
  useEffect(() => {
    loadProductLines();
    loadHostParts();
    loadAllParts();
    
    if (isEditMode && id) {
      loadRelation(parseInt(id));
    } else {
      // 新建时设置默认值
      form.setFieldsValue({
        product_line_id: undefined,
        host_part_number: undefined,
        part_number: '',
        parent_part_number: parentId || '',
        child_part_number: '',
        child_type: 'accessory',
        level: level ? parseInt(level) : 1,
        quantity: 1,
        required_parts: '',
        required_quantity: '',
        sort_order: 1,
        status: 'draft',
      });
    }
  }, [id, isEditMode, form, parentId, level]);

  const loadProductLines = async () => {
    try {
      const response = await adminProductLineService.getProductLines();
      setProductLines((response as any)?.items || []);
    } catch (error) {
      console.error('加载产品线失败:', error);
      message.error('加载产品线失败');
    }
  };

  const loadHostParts = async () => {
    try {
      const response = await adminPartService.getParts({ page: 1, page_size: 100 });
      setHostParts((response as any)?.items || []);
    } catch (error) {
      console.error('加载主机料号失败:', error);
      message.error('加载主机料号失败');
    }
  };

  const loadAllParts = async () => {
    try {
      const response = await adminPartService.getParts({ page: 1, page_size: 500 });
      const items = (response as any)?.items || [];
      setAllParts(items);
      setPartOptions(items.map((part: any) => ({
        value: part.part_number,
        label: `${part.part_number} - ${part.name_zh}`,
        part: part
      })));
    } catch (error) {
      console.error('加载料号失败:', error);
      message.error('加载料号失败');
    }
  };

  const loadRelation = async (relationId: number) => {
    try {
      setLoading(true);
      const data = await adminRelationService.getRelation(relationId);
      
      form.setFieldsValue({
        product_line_id: data.product_line_id,
        host_part_number: data.host_part_number,
        part_number: data.part_number,
        parent_part_number: data.parent_part_number,
        child_part_number: data.child_part_number,
        child_type: data.child_type,
        level: data.level,
        quantity: data.quantity,
        required_parts: data.required_parts,
        required_quantity: data.required_quantity,
        sort_order: data.sort_order,
        status: data.status,
      });
    } catch (error) {
      console.error('加载关联关系数据失败:', error);
      message.error('加载关联关系数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理子项类型变化
  const handleChildTypeChange = (value: 'accessory' | 'spare_part') => {
    if (value === 'spare_part') {
      // 备件固定为1级
      form.setFieldValue('level', 1);
    }
  };

  // 验证料号格式和唯一性
  const validatePartNumber = async (rule: any, value: string) => {
    if (!value) {
      throw new Error('请输入料号');
    }

    const productLineId = form.getFieldValue('product_line_id');
    if (!productLineId) {
      throw new Error('请先选择产品线');
    }

    // TODO: 检查料号在同产品线下的唯一性
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      // 1. 数据清理和验证 - 按照标准指南
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => {
          // 过滤掉空字符串、null、undefined
          return value !== '' && value !== null && value !== undefined;
        })
      );

      // 2. 查找主机料号字符串（从选择的ID转换为料号字符串）
      let hostPartNumberString = cleanedValues.host_part_number;
      if (typeof cleanedValues.host_part_number === 'number') {
        const selectedHostPart = hostParts.find(part => part.id === cleanedValues.host_part_number);
        hostPartNumberString = selectedHostPart?.part_number;
      }

      // 3. 转换表单数据为API格式 - 确保类型正确
      const formData = {
        product_line_id: cleanedValues.product_line_id ? Number(cleanedValues.product_line_id) : undefined,
        host_part_number: hostPartNumberString ? String(hostPartNumberString) : undefined,
        part_number: String(cleanedValues.part_number || ''),
        parent_part_number: cleanedValues.parent_part_number ? String(cleanedValues.parent_part_number) : undefined,
        child_part_number: cleanedValues.child_part_number ? String(cleanedValues.child_part_number) : undefined,
        child_type: cleanedValues.child_type,
        level: cleanedValues.level ? Number(cleanedValues.level) : undefined,
        quantity: cleanedValues.quantity ? Number(cleanedValues.quantity) : undefined,
        required_parts: cleanedValues.required_parts ? String(cleanedValues.required_parts) : undefined,
        required_quantity: cleanedValues.required_quantity ? String(cleanedValues.required_quantity) : undefined,
        sort_order: cleanedValues.sort_order ? Number(cleanedValues.sort_order) : 0,
        status: cleanedValues.status || 'publish',
      };

      // 4. 过滤掉undefined值
      const finalData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      // 5. 添加调试日志
      console.log('RelationEditPage.onFinish - Original values:', values);
      console.log('RelationEditPage.onFinish - Cleaned values:', cleanedValues);
      console.log('RelationEditPage.onFinish - Final data:', finalData);

      // 6. 验证必填字段
      if (!finalData.product_line_id || !finalData.host_part_number || !finalData.part_number || !finalData.child_type || !finalData.level || !finalData.quantity) {
        throw new Error('缺少必填字段');
      }

      // 7. API调用
      if (isEditMode && id) {
        await adminRelationService.updateRelation(parseInt(id), finalData as any);
        message.success('关联关系更新成功');
      } else {
        await adminRelationService.createRelation(finalData as any);
        message.success('关联关系创建成功');
      }

      navigate('/admin/relations');
    } catch (error) {
      console.error('保存关联关系失败:', error);
      
      // 8. 详细错误处理
      let errorMessage = '保存关联关系失败';
      if (error instanceof Error) {
        errorMessage = `保存失败: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/relations');
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
  const RadioComponent = Radio as any;
  const AutoCompleteComponent = AutoComplete as any;
  const SpaceComponent = Space as any;
  const ArrowLeftIcon = ArrowLeftOutlined as any;
  const SaveIcon = SaveOutlined as any;

  return (
    <div className="relation-edit-page">
      <AdminPageHeader
        title={isEditMode ? t('edit.title', { ns: 'relations' }) : t('create.title', { ns: 'relations' })}
        description={isEditMode ? t('edit.description', { ns: 'relations' }) + ` ID: ${id}` : t('create.title', { ns: 'relations' })}
        extra={
          <ButtonComponent key="back" icon={<ArrowLeftIcon />} onClick={handleBack}>
            {t('actions.back', { ns: 'relations' })}
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
              <DividerComponent orientation="left">{t('sections.basicInfo', { ns: 'relations' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label={t('fields.productLine', { ns: 'relations' })}
                name="product_line_id"
                rules={[{ required: true, message: t('validation.productLineRequired', { ns: 'relations' }) }]}
              >
                <SelectComponent placeholder={t('placeholders.selectProductLine', { ns: 'relations' })}>
                  {productLines.map((line) => (
                    <OptionComponent key={line.id} value={line.id}>
                      {line.title?.zh || line.name || `${t('fields.productLine', { ns: 'relations' })}${line.id}`}
                    </OptionComponent>
                  ))}
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label={t('fields.hostPartNumber', { ns: 'relations' })}
                name="host_part_number"
                rules={[{ required: true, message: t('validation.hostPartNumberRequired', { ns: 'relations' }) }]}
              >
                <SelectComponent 
                  placeholder={t('placeholders.enterPartNumber', { ns: 'relations' })}
                  showSearch
                  filterOption={(input: string, option: any) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {hostParts.map((part) => (
                    <OptionComponent key={part.id} value={part.id}>
                      {part.part_number} - {part.name_zh}
                    </OptionComponent>
                  ))}
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label={t('fields.childType', { ns: 'relations' })}
                name="child_type"
                rules={[{ required: true, message: t('validation.childTypeRequired', { ns: 'relations' }) }]}
              >
                <RadioComponent.Group onChange={(e: any) => handleChildTypeChange(e.target.value)}>
                  <RadioComponent value="accessory">{t('childTypes.accessory', { ns: 'relations' })}</RadioComponent>
                  <RadioComponent value="spare_part">{t('childTypes.spare_part', { ns: 'relations' })}</RadioComponent>
                </RadioComponent.Group>
              </FormItemComponent>
            </ColComponent>

            {/* 料号信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('sections.partInfo', { ns: 'relations' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label={t('fields.partNumber', { ns: 'relations' })}
                name="part_number"
                rules={[
                  { required: true, message: t('validation.partNumberRequired', { ns: 'relations' }) },
                  { validator: validatePartNumber },
                ]}
                extra={t('tips.partNumberInfo', { ns: 'relations' })}
              >
                <AutoCompleteComponent
                  options={partOptions}
                  placeholder={t('placeholders.enterPartNumber', { ns: 'relations' })}
                  filterOption={(inputValue: string, option: any) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label={t('fields.parentPartNumber', { ns: 'relations' })}
                name="parent_part_number"
                extra={t('tips.parentPartNumberInfo', { ns: 'relations' })}
              >
                <AutoCompleteComponent
                  options={partOptions}
                  placeholder={t('placeholders.enterParentPartNumber', { ns: 'relations' })}
                  filterOption={(inputValue: string, option: any) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label={t('fields.childPartNumber', { ns: 'relations' })}
                name="child_part_number"
                extra={t('tips.childPartNumberInfo', { ns: 'relations' })}
              >
                <AutoCompleteComponent
                  options={partOptions}
                  placeholder={t('placeholders.enterChildPartNumber', { ns: 'relations' })}
                  filterOption={(inputValue: string, option: any) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </FormItemComponent>
            </ColComponent>

            {/* 层级和数量信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('sections.levelAndQuantityInfo', { ns: 'relations' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label={t('fields.level', { ns: 'relations' })}
                name="level"
                rules={[{ required: true, message: t('validation.levelRequired', { ns: 'relations' }) }]}
                extra={t('tips.levelInfo', { ns: 'relations' })}
              >
                <InputNumberComponent 
                  min={1} 
                  max={5} 
                  style={{ width: '100%' }}
                  disabled={form.getFieldValue('child_type') === 'spare_part'}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label={t('fields.quantity', { ns: 'relations' })}
                name="quantity"
                rules={[{ required: true, message: t('validation.quantityRequired', { ns: 'relations' }) }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label={t('fields.sortOrder', { ns: 'relations' })}
                name="sort_order"
                rules={[{ required: true, message: t('validation.sortOrderRequired', { ns: 'relations' }) }]}
                extra={t('tips.sortOrderInfo', { ns: 'relations' })}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label={t('fields.status', { ns: 'relations' })}
                name="status"
                rules={[{ required: true, message: t('validation.statusRequired', { ns: 'relations' }) }]}
              >
                <DictionarySelect
                  dictionaryType="statuses"
                  placeholder={t('placeholders.selectStatus', { ns: 'relations' })}
                />
              </FormItemComponent>
            </ColComponent>

            {/* 依赖关联料号管理 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">{t('sections.dependencyInfo', { ns: 'relations' })}</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label={t('fields.requiredParts', { ns: 'relations' })}
                name="required_parts"
                extra={t('tips.requiredPartsFormat', { ns: 'relations' })}
              >
                <InputComponent.TextArea 
                  rows={3}
                  placeholder={t('placeholders.enterRequiredParts', { ns: 'relations' })}
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label={t('fields.requiredQuantity', { ns: 'relations' })}
                name="required_quantity"
                extra={t('tips.requiredQuantityFormat', { ns: 'relations' })}
              >
                <InputComponent.TextArea 
                  rows={3}
                  placeholder={t('placeholders.enterRequiredQuantity', { ns: 'relations' })}
                />
              </FormItemComponent>
            </ColComponent>
          </RowComponent>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleBack}>
                {t('buttons.cancel', { ns: 'relations' })}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                icon={<SaveIcon />}
              >
                {isEditMode ? t('buttons.update', { ns: 'relations' }) : t('buttons.create', { ns: 'relations' })}
              </Button>
            </Space>
          </div>
        </FormComponent>
      </CardComponent>
    </div>
  );
};

export default RelationEditPage; 