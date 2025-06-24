import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Row,
  Col,
  Select,
  Upload,
  Avatar,
  Space,
  Tabs,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAdminApi } from '../../hooks/useAdminApi';
import adminUserService from '../../services/admin-user.service';

const { Option } = Select;
const { Password } = Input;

// 用户表单数据接口
interface UserFormData {
  username: string;
  email: string;
  password?: string;
  customer_code: string;
  role: string;
  country: string;
  region: string;
  company_logo: string;
  status: 'active' | 'inactive' | 'suspended';
  preferred_unit: 'metric' | 'imperial';
}

const UserEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  
  const isEditMode = !!id;

  // 获取用户信息（编辑模式）
  const fetchUser = async () => {
    if (!isEditMode) return;
    
    setLoading(true);
    try {
      const response = await adminUserService.getUser(parseInt(id));
      const user = response.data;
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        customer_code: user.customer_code,
        role: user.role,
        country: user.country,
        region: user.region,
        status: user.status,
        preferred_unit: user.preferred_unit,
      });
      setLogoUrl(user.company_logo || '');
    } catch (error) {
      message.error('获取用户信息失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  // 提交表单
  const handleSubmit = async (values: UserFormData) => {
    setSubmitting(true);
    try {
      const formData = {
        ...values,
        company_logo: logoUrl,
      };

      if (isEditMode) {
        await adminUserService.updateUser(parseInt(id), formData);
        message.success('用户更新成功');
      } else {
        await adminUserService.createUser(formData);
        message.success('用户创建成功');
      }
      
      navigate('/admin/users');
    } catch (error) {
      message.error((isEditMode ? '更新' : '创建') + '失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  // 头像上传处理
  const handleLogoUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // 这里应该从服务器响应中获取文件URL
      const url = info.file.response?.url || URL.createObjectURL(info.file.originFileObj);
      setLogoUrl(url);
      message.success('头像上传成功');
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  // 根据国家获取地区选项
  const getRegionOptions = (country: string) => {
    const regions: Record<string, string[]> = {
      CN: ['北京', '上海', '广东', '江苏', '浙江', '山东', '河南', '四川', '湖北', '湖南'],
      US: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
      UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
      DE: ['Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Lower Saxony', 'Hesse', 'Saxony', 'Rhineland-Palatinate', 'Schleswig-Holstein'],
      JP: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Saitama', 'Chiba', 'Hyogo', 'Hokkaido', 'Fukuoka', 'Shizuoka'],
    };
    return regions[country] || [];
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱地址"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          {!isEditMode && (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6个字符' }
                  ]}
                >
                  <Password placeholder="请输入密码" />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }: any) => ({
                      validator(_: any, value: any) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Password placeholder="请再次输入密码" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="customer_code"
                label="客户代码"
                rules={[{ required: true, message: '请输入客户代码' }]}
              >
                <Input placeholder="请输入客户代码" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="role"
                label="用户角色"
                rules={[{ required: true, message: '请选择用户角色' }]}
              >
                <Select placeholder="请选择用户角色">
                  <Option value="admin">管理员</Option>
                  <Option value="sales">销售</Option>
                  <Option value="partner">合作伙伴</Option>
                  <Option value="customer">客户</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'location',
      label: '地区信息',
      children: (
        <>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="country"
                label="国家"
                rules={[{ required: true, message: '请选择国家' }]}
              >
                <Select 
                  placeholder="请选择国家"
                  onChange={(value: string) => {
                    form.setFieldsValue({ region: undefined });
                  }}
                >
                  <Option value="CN">中国</Option>
                  <Option value="US">美国</Option>
                  <Option value="UK">英国</Option>
                  <Option value="DE">德国</Option>
                  <Option value="JP">日本</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="region"
                label="地区"
                rules={[{ required: true, message: '请选择地区' }]}
              >
                <Select placeholder="请选择地区">
                  {getRegionOptions(form.getFieldValue('country')).map(region => (
                    <Option key={region} value={region}>{region}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="preferred_unit"
                label="单位偏好"
                rules={[{ required: true, message: '请选择单位偏好' }]}
              >
                <Select placeholder="请选择单位偏好">
                  <Option value="metric">公制</Option>
                  <Option value="imperial">英制</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="status"
                label="账户状态"
                rules={[{ required: true, message: '请选择账户状态' }]}
              >
                <Select placeholder="请选择账户状态">
                  <Option value="active">活跃</Option>
                  <Option value="inactive">未激活</Option>
                  <Option value="suspended">已暂停</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'company',
      label: '公司信息',
      children: (
        <Row gutter={24}>
          <Col span={24}>
            <Form.Item label="公司Logo">
              <div className="flex items-center gap-4">
                <Avatar 
                  size={80} 
                  src={logoUrl} 
                  icon={<UserOutlined />}
                />
                <Upload
                  name="logo"
                  listType="text"
                  showUploadList={false}
                  onChange={handleLogoUpload}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>
                    上传Logo
                  </Button>
                </Upload>
                <div className="text-sm text-gray-500">
                  支持 JPG、PNG 格式，建议尺寸 200x200 像素
                </div>
              </div>
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/users')}
          >
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? '编辑用户' : '新增用户'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode ? '修改用户信息和权限设置' : '创建新的系统用户'}
            </p>
          </div>
        </Space>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            role: 'customer',
            preferred_unit: 'metric',
            country: 'CN'
          }}
        >
          <Tabs defaultActiveKey="basic" items={tabItems} />

          <Divider />

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
              >
                {isEditMode ? '保存更改' : '创建用户'}
              </Button>
              <Button 
                onClick={() => navigate('/admin/users')}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserEditPage; 