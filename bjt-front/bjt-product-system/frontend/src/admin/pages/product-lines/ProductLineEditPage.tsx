import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Tabs,
  Typography,
  Upload,
  Space,
  Card,
  message,
} from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import AdminService from '../../api/adminService'; // Import AdminService
import type { AdminProductLine, AdminSubItem } from '../../../admin/types'; // Import admin types

const { Title } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ProductLineFormData can now be largely represented by AdminProductLine
// SubItem can be represented by AdminSubItem

const ProductLineEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<AdminProductLine>(); // Use AdminProductLine for form typings
  const [activeLangTab, setActiveLangTab] = useState('zh');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      AdminService.getProductLine(id)
        .then(response => {
          const productLine = response.data; // Assuming APIResponse<AdminProductLine>
          // Transform AdminProductLine to form values
          form.setFieldsValue({
            title_zh: productLine.title_zh,
            title_en: productLine.title_en,
            description_zh: productLine.description_zh,
            description_en: productLine.description_en,
            subitem1_zh: productLine.subitem1_zh,
            subitem1_en: productLine.subitem1_en,
            subitem2_zh: productLine.subitem2_zh,
            subitem2_en: productLine.subitem2_en,
            subitem3_zh: productLine.subitem3_zh,
            subitem3_en: productLine.subitem3_en,
            image_url: productLine.image_url,
            subItems: (productLine.subItems || []).map((item, index) => ({
              ...item, // Spread existing subitem properties (like id)
              key: item.id || String(index), // Use subitem id for key if available
            })),
          });
          if (productLine.image_url) setImageUrl(productLine.image_url);
          setLoading(false);
        })
        .catch(error => {
          message.error('加载产品线数据失败!');
          console.error(error);
          setLoading(false);
        });
    } else {
      // Default values for new product line form
      form.setFieldsValue({
        title_zh: '',
        title_en: '',
        description_zh: '',
        description_en: '',
        subitem1_zh: '',
        subitem1_en: '',
        subitem2_zh: '',
        subitem2_en: '',
        subitem3_zh: '',
        subitem3_en: '',
        image_url: undefined,
        subItems: [{ key: '0', title_zh: '', title_en: '', description_zh: '', description_en: '' }],
      });
    }
  }, [id, form, isEditMode]);

  const onFinish = async (values: AdminProductLine) => {
    setLoading(true);
    // The form values are already in the AdminProductLine structure thanks to form typing
    // and field names matching AdminMultilingualText structure (e.g., name=["title", "zh"])
    // However, subItems from Form.List might need their `key` property removed if it's not part of the backend model.
    const payload: Partial<AdminProductLine> = {
        ...values,
        subItems: values.subItems?.map(si => {
            const { key, ...restOfSubItem } = si; // Remove React key if not needed by backend
            return restOfSubItem as AdminSubItem; // Ensure it's AdminSubItem type
        }),
    };

    try {
      if (isEditMode && id) {
        await AdminService.updateProductLine(id, payload);
        message.success('产品线更新成功！');
      } else {
        await AdminService.createProductLine(payload);
        message.success('产品线创建成功！');
      }
      navigate('/admin/dashboard'); // Or to product lines list page
    } catch (error) {
      message.error('保存产品线失败。');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
      setImageUrl(info.file.response?.url || URL.createObjectURL(info.file.originFileObj)); 
      form.setFieldsValue({ image_url: info.file.response?.url || URL.createObjectURL(info.file.originFileObj) });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败。`);
    }
  };

  // Initial form values for Form.List, ensuring multilingual structure
  const initialSubItem: AdminSubItem = {
    title_zh: '',
    title_en: '',
    description_zh: '',
    description_en: '',
    key: String(Date.now()), // React key
  };

  return (
    <Card>
      <Title level={2}>{isEditMode ? '编辑产品线' : '创建产品线'}</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        // Set initial values for the whole form, especially for new entries
        initialValues={{
          title_zh: '',
          title_en: '',
          description_zh: '',
          description_en: '',
          subitem1_zh: '',
          subitem1_en: '',
          subitem2_zh: '',
          subitem2_en: '',
          subitem3_zh: '',
          subitem3_en: '',
          image_url: undefined,
          subItems: [initialSubItem],
        }}
        disabled={loading}
      >
        <Tabs activeKey={activeLangTab} onChange={setActiveLangTab}>
          <TabPane tab="中文" key="zh">
            <Form.Item
              label="标题 (中文)"
              name={['title_zh']}
              rules={[{ required: true, message: '请输入中文标题!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="描述 (中文)"
              name={['description_zh']}
              rules={[{ required: true, message: '请输入中文描述!' }]}
            >
              <TextArea rows={4} />
            </Form.Item>
          </TabPane>
          <TabPane tab="English" key="en">
            <Form.Item
              label="Title (English)"
              name={['title_en']}
              rules={[{ required: true, message: 'Please enter English title!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Description (English)"
              name={['description_en']}
              rules={[{ required: true, message: 'Please enter English description!' }]}
            >
              <TextArea rows={4} />
            </Form.Item>
          </TabPane>
        </Tabs>

        <Title level={4} style={{ marginTop: 20 }}>子项目</Title>
        <Form.List name="subItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} style={{ marginBottom: 16 }} bodyStyle={{paddingBottom: 0}}>
                  <Tabs defaultActiveKey="zh" size="small">
                    <TabPane tab="中文" key="zh">
                       <Form.Item
                        {...restField}
                        name={[name, 'title_zh']}
                        label="子项目标题 (中文)"
                        rules={[{ required: true, message: '请输入子项目中文标题' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'description_zh']}
                        label="子项目描述 (中文)"
                        rules={[{ required: true, message: '请输入子项目中文描述' }]}
                      >
                        <TextArea rows={2} />
                      </Form.Item>
                    </TabPane>
                    <TabPane tab="English" key="en">
                       <Form.Item
                        {...restField}
                        name={[name, 'title_en']}
                        label="Subitem Title (English)"
                        rules={[{ required: true, message: 'Please enter subitem English title' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'description_en']}
                        label="Subitem Description (English)"
                        rules={[{ required: true, message: 'Please enter subitem English description' }]}
                      >
                        <TextArea rows={2} />
                      </Form.Item>
                    </TabPane>
                  </Tabs>
                  <Form.Item style={{textAlign: 'right'}}>
                    <Button danger onClick={() => remove(name)} icon={<DeleteOutlined />}>
                      删除子项目
                    </Button>
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add(initialSubItem)} block icon={<PlusOutlined />}>
                  添加子项目
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        
        <Title level={4} style={{ marginTop: 20 }}>产品图片</Title>
        <Form.Item name="image_url">
          <Upload
            name="productImage"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            action="/api/upload" // Replace with actual upload endpoint from adminConfig
            beforeUpload={(file) => {
              const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
              if (!isJpgOrPng) {
                message.error('只能上传 JPG/PNG 文件!');
              }
              const isLt2M = file.size / 1024 / 1024 < 2;
              if (!isLt2M) {
                message.error('图片必须小于 2MB!');
              }
              return isJpgOrPng && isLt2M;
            }}
            onChange={handleImageUpload}
            // We might need to include headers for auth if the upload endpoint requires it
            // headers={AdminService.getAuthHeaders()} // Assuming such a method exists or can be added
          >
            {imageUrl ? <img src={imageUrl} alt="product" style={{ width: '100%' }} /> : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? '保存更改' : '创建产品线'}
            </Button>
            <Button onClick={() => navigate(-1)} disabled={loading}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProductLineEditPage; 