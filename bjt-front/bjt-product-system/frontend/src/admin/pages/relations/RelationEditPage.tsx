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
import adminRelationService from '../../services/admin-relation.service';
import adminProductLineService from '../../services/admin-product-line.service';
import adminPartService from '../../services/admin-part.service';

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
      setProductLines(response.items);
    } catch (error) {
      console.error('加载产品线失败:', error);
      message.error('加载产品线失败');
    }
  };

  const loadHostParts = async () => {
    try {
      const response = await adminPartService.getParts({ page: 1, page_size: 100 });
      setHostParts(response.items);
    } catch (error) {
      console.error('加载主机料号失败:', error);
      message.error('加载主机料号失败');
    }
  };

  const loadAllParts = async () => {
    try {
      const response = await adminPartService.getParts({ page: 1, page_size: 500 });
      setAllParts(response.items);
      setPartOptions(response.items.map((part: any) => ({
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

      // 转换表单数据为API格式
      const formData: Partial<RelationFormData> = {
        product_line_id: values.product_line_id,
        host_part_number: values.host_part_number,
        part_number: values.part_number,
        parent_part_number: values.parent_part_number || null,
        child_part_number: values.child_part_number || null,
        child_type: values.child_type,
        level: values.level,
        quantity: values.quantity,
        required_parts: values.required_parts || null,
        required_quantity: values.required_quantity || null,
        sort_order: values.sort_order,
        status: values.status,
      };

      if (isEditMode && id) {
        await adminRelationService.updateRelation(parseInt(id), formData);
        message.success('关联关系更新成功');
      } else {
        await adminRelationService.createRelation(formData as RelationFormData);
        message.success('关联关系创建成功');
      }

      navigate('/admin/relations');
    } catch (error) {
      console.error('保存关联关系失败:', error);
      message.error('保存关联关系失败');
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
        title={isEditMode ? '编辑关联关系' : '新增关联关系'}
        description={isEditMode ? `编辑关联关系 ID: ${id}` : '创建新的关联关系'}
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
                  {productLines.map((line) => (
                    <OptionComponent key={line.id} value={line.id}>
                      {line.title?.zh || line.name || `产品线${line.id}`}
                    </OptionComponent>
                  ))}
                </SelectComponent>
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="主机料号-0级"
                name="host_part_number"
                rules={[{ required: true, message: '请选择主机料号' }]}
                extra="选择主机料号作为关联关系的根节点"
              >
                <SelectComponent 
                  placeholder="请选择主机料号"
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
                label="子项类型"
                name="child_type"
                rules={[{ required: true, message: '请选择子项类型' }]}
              >
                <RadioComponent.Group onChange={(e: any) => handleChildTypeChange(e.target.value)}>
                  <RadioComponent value="accessory">配件</RadioComponent>
                  <RadioComponent value="spare_part">备件</RadioComponent>
                </RadioComponent.Group>
              </FormItemComponent>
            </ColComponent>

            {/* 料号信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">料号信息</DividerComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="自身料号"
                name="part_number"
                rules={[
                  { required: true, message: '请输入自身料号' },
                  { validator: validatePartNumber },
                ]}
                extra="在同一产品线下必须唯一"
              >
                <AutoCompleteComponent
                  options={partOptions}
                  placeholder="输入或选择料号"
                  filterOption={(inputValue: string, option: any) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="父项料号"
                name="parent_part_number"
                extra="上级料号，为空表示顶级"
              >
                <AutoCompleteComponent
                  options={partOptions}
                  placeholder="输入或选择父项料号"
                  filterOption={(inputValue: string, option: any) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={8}>
              <FormItemComponent
                label="子项料号"
                name="child_part_number"
                extra="下级料号，可为空"
              >
                <AutoCompleteComponent
                  options={partOptions}
                  placeholder="输入或选择子项料号"
                  filterOption={(inputValue: string, option: any) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </FormItemComponent>
            </ColComponent>

            {/* 层级和数量信息 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">层级和数量信息</DividerComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="层级"
                name="level"
                rules={[{ required: true, message: '请输入层级' }]}
                extra="配件层级1-5，备件固定为1"
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
                label="数量"
                name="quantity"
                rules={[{ required: true, message: '请输入数量' }]}
                extra="子项在父项中的数量"
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={6}>
              <FormItemComponent
                label="同级排序"
                name="sort_order"
                rules={[{ required: true, message: '请输入排序号' }]}
              >
                <InputNumberComponent min={1} style={{ width: '100%' }} />
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

            {/* 依赖关联料号管理 */}
            <ColComponent span={24}>
              <DividerComponent orientation="left">依赖关联料号管理</DividerComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="依赖关联料号"
                name="required_parts"
                extra="多个料号用逗号分隔，如：13A00001,13A00002"
              >
                <InputComponent.TextArea 
                  rows={3}
                  placeholder="输入依赖的关联料号，多个用逗号分隔"
                />
              </FormItemComponent>
            </ColComponent>

            <ColComponent span={12}>
              <FormItemComponent
                label="依赖关联数量"
                name="required_quantity"
                extra="与依赖关联料号一一对应，如：2,1"
              >
                <InputComponent.TextArea 
                  rows={3}
                  placeholder="输入对应的数量，多个用逗号分隔"
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
                {isEditMode ? '保存更改' : '创建关联关系'}
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

export default RelationEditPage; 