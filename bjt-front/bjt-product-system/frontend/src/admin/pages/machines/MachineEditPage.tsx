import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';
import { useNavigate, useParams } from 'react-router-dom';
import AdminService from '../../api/adminService';
import type { HostModel, ProductLine } from '../../../types';

const { TextArea } = Input;

interface MachineEditPageProps {
  mode: 'create' | 'edit';
}

const MachineEditPage: React.FC<MachineEditPageProps> = ({ mode }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [explosionFileList, setExplosionFileList] = useState<UploadFile[]>([]);

  // 加载产品线数据
  const loadProductLines = async () => {
    try {
      const response = await AdminService.getProductLines();
      setProductLines(response.items);
    } catch (error) {
      message.error('加载产品线失败');
    }
  };

  // 加载主机型号数据（编辑模式）
  const loadHostModel = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await AdminService.getHostModel(id);
      const hostModel = response.data;

      // 设置表单数据
      form.setFieldsValue({
        name: hostModel.name,
        code: hostModel.code,
        productLineId: hostModel.productLineId,
        description: hostModel.description,
      });

      // 设置图片
      if (hostModel.imageUrl) {
        setFileList([
          {
            uid: '-1',
            name: '主机图片',
            status: 'done',
            url: hostModel.imageUrl,
          },
        ]);
      }

      // 设置爆炸图
      if (hostModel.explosionUrl) {
        setExplosionFileList([
          {
            uid: '-1',
            name: '爆炸图',
            status: 'done',
            url: hostModel.explosionUrl,
          },
        ]);
      }
    } catch (error) {
      message.error('加载主机型号失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadProductLines();
    if (mode === 'edit') {
      loadHostModel();
    }
  }, [mode, id]);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('code', values.code);
      formData.append('productLineId', values.productLineId);
      if (values.description) {
        formData.append('description', values.description);
      }

      // 添加图片
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      // 添加爆炸图
      if (explosionFileList.length > 0 && explosionFileList[0].originFileObj) {
        formData.append('explosion', explosionFileList[0].originFileObj);
      }

      if (mode === 'create') {
        await AdminService.createHostModel(formData);
        message.success('创建成功');
      } else {
        await AdminService.updateHostModel(id!, formData);
        message.success('更新成功');
      }

      navigate('/admin/machines');
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理图片上传前的验证
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
      return false;
    }
    return true;
  };

  // 处理爆炸图上传前的验证
  const beforeUploadExplosion = (file: RcFile) => {
    const isPDF = file.type === 'application/pdf';
    if (!isPDF) {
      message.error('只能上传PDF文件！');
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('PDF大小不能超过 10MB！');
      return false;
    }
    return true;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        {mode === 'create' ? '新增主机型号' : '编辑主机型号'}
      </h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="max-w-2xl"
      >
        <Form.Item
          name="name"
          label="型号名称"
          rules={[{ required: true, message: '请输入型号名称' }]}
        >
          <Input placeholder="请输入型号名称" />
        </Form.Item>

        <Form.Item
          name="code"
          label="型号代码"
          rules={[{ required: true, message: '请输入型号代码' }]}
        >
          <Input placeholder="请输入型号代码" />
        </Form.Item>

        <Form.Item
          name="productLineId"
          label="所属产品线"
          rules={[{ required: true, message: '请选择所属产品线' }]}
        >
          <Select placeholder="请选择所属产品线">
            {productLines.map((line) => (
              <Select.Option key={line.id} value={line.id}>
                {line.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea rows={4} placeholder="请输入描述" />
        </Form.Item>

        <Form.Item
          label="主机图片"
          extra="支持jpg、png格式，大小不超过2MB"
        >
          <Upload
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={beforeUpload}
          >
            <Button icon={<UploadOutlined />}>上传图片</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          label="爆炸图"
          extra="支持PDF格式，大小不超过10MB"
        >
          <Upload
            maxCount={1}
            fileList={explosionFileList}
            onChange={({ fileList }) => setExplosionFileList(fileList)}
            beforeUpload={beforeUploadExplosion}
          >
            <Button icon={<UploadOutlined />}>上传爆炸图</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <div className="flex space-x-4">
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === 'create' ? '创建' : '保存'}
            </Button>
            <Button onClick={() => navigate('/admin/machines')}>
              取消
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default MachineEditPage; 