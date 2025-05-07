import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Card,
  Button,
  message,
  Space,
  Upload,
  Select,
  Spin,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ProductLine } from '@/utils/api';
import api from '@/utils/api';

const { Option } = Select;
const { TextArea } = Input;

interface ProductLineFormData {
  code: string;
  name_cn: string;
  name_en: string;
  description_cn: string;
  description_en: string;
  image_url: string | null;
  status: 'publish' | 'draft' | 'trash';
  menu_order: number;
}

const ProductLineEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      fetchProductLine();
    }
  }, [id]);

  const fetchProductLine = async () => {
    try {
      setLoading(true);
      const res = await api.productLine.getDetail(Number(id));
      const data = res.data;
      form.setFieldsValue({
        code: data.code,
        name_cn: data.name_cn,
        name_en: data.name_en,
        description_cn: data.description_cn,
        description_en: data.description_en,
        status: data.status,
        menu_order: data.menu_order,
      });
      if (data.image_url) {
        setImageUrl(data.image_url);
        setFileList([
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: data.image_url,
          },
        ]);
      }
    } catch (error) {
      message.error('Failed to fetch product line details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ProductLineFormData) => {
    try {
      setLoading(true);
      const data: Partial<ProductLine> = {
        ...values,
        image_url: imageUrl || null,
      };

      if (isEdit) {
        await api.productLine.update(Number(id), data);
        message.success('Product line updated successfully');
      } else {
        await api.productLine.create(data);
        message.success('Product line created successfully');
      }
      navigate('/product-lines');
    } catch (error) {
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ file, fileList }: any) => {
    setFileList(fileList);
    if (file.status === 'done') {
      setImageUrl(file.response.url);
    }
  };

  const uploadButton = (
    <Button icon={<UploadOutlined />}>Upload Image</Button>
  );

  return (
    <Spin spinning={loading}>
      <Card title={isEdit ? 'Edit Product Line' : 'Create Product Line'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            menu_order: 0,
          }}
        >
          <Form.Item
            label="Code"
            name="code"
            rules={[
              { required: true, message: 'Please input the code' },
              {
                pattern: /^[a-z0-9-_]+$/,
                message: 'Code can only contain lowercase letters, numbers, hyphens and underscores',
              },
            ]}
          >
            <Input disabled={isEdit} />
          </Form.Item>

          <Form.Item
            label="Chinese Name"
            name="name_cn"
            rules={[{ required: true, message: 'Please input the Chinese name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="English Name"
            name="name_en"
            rules={[{ required: true, message: 'Please input the English name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Chinese Description"
            name="description_cn"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="English Description"
            name="description_en"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Image"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
          >
            <Upload
              name="file"
              listType="picture-card"
              showUploadList={true}
              action="/api/upload"
              fileList={fileList}
              onChange={handleUploadChange}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select the status' }]}
          >
            <Select>
              <Option value="publish">Published</Option>
              <Option value="draft">Draft</Option>
              <Option value="trash">Trash</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Menu Order"
            name="menu_order"
            rules={[{ type: 'number', message: 'Please input a valid number' }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {isEdit ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/product-lines')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Spin>
  );
};

export default ProductLineEdit; 