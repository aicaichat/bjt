import React, { useState, useEffect } from 'react';
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
  Switch,
  InputNumber,
  Tabs,
  Divider,
  Space,
  Alert
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  GlobalOutlined,
  SettingOutlined,
  MailOutlined,
  SecurityScanOutlined,
  UploadOutlined
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import adminSettingsService from '../../services/admin-settings.service';

const { Option } = Select;
const { TextArea } = Input;

// 系统设置接口
interface SystemSettings {
  // 基础信息
  company_name: string;
  contact_info: string;
  logo_url: string;
  
  // 系统设置
  default_language: 'zh' | 'en';
  theme: string;
  timezone: string;
  date_format: string;
  
  // 邮件设置
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: 'none' | 'ssl' | 'tls';
  mail_from_address: string;
  mail_from_name: string;
  
  // API设置
  payment_api: string;
  logistics_api: string;
  inventory_api: string;
  
  // 安全设置
  session_timeout: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  login_attempts: number;
  lockout_duration: number;
}

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // 获取系统设置
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await adminSettingsService.getSettings();
      const settings = response.data;
      form.setFieldsValue(settings);
      setLogoUrl(settings.logo_url || '');
    } catch (error) {
      message.error('获取设置失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 提交设置
  const handleSubmit = async (values: SystemSettings) => {
    setSubmitting(true);
    try {
      const formData = {
        ...values,
        logo_url: logoUrl,
      };
      await adminSettingsService.updateSettings(formData);
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存设置失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  // Logo上传处理
  const handleLogoUpload = (info: any) => {
    if (info.file.status === 'done') {
      const url = info.file.response?.url || URL.createObjectURL(info.file.originFileObj);
      setLogoUrl(url);
      message.success('Logo上传成功');
    } else if (info.file.status === 'error') {
      message.error('Logo上传失败');
    }
  };

  // 测试邮件设置
  const testEmailSettings = async () => {
    setTestingEmail(true);
    try {
      await adminSettingsService.testEmailSettings();
      message.success('邮件测试发送成功，请检查邮箱');
    } catch (error) {
      message.error('邮件测试失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setTestingEmail(false);
    }
  };

  // 重置为默认设置
  const resetToDefault = () => {
    form.resetFields();
    setLogoUrl('');
    message.info('已重置为默认设置');
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <AdminPageHeader
        title="系统设置"
        breadcrumb={[
          { title: '首页', path: '/admin' },
          { title: '系统设置' }
        ]}
      />
      
      <div className="mb-4 flex justify-end">
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={resetToDefault}
          >
            重置默认
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={submitting}
          >
            保存设置
          </Button>
        </Space>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            default_language: 'zh',
            theme: 'light',
            timezone: 'Asia/Shanghai',
            date_format: 'YYYY-MM-DD',
            smtp_port: 587,
            smtp_encryption: 'tls',
            session_timeout: 30,
            password_policy: {
              min_length: 8,
              require_uppercase: true,
              require_lowercase: true,
              require_numbers: true,
              require_symbols: false
            },
            login_attempts: 5,
            lockout_duration: 15
          }}
        >
          <Tabs 
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: (
                  <span className="flex items-center gap-2">
                    <GlobalOutlined />
                    基础信息
                  </span>
                ),
                children: (
                  <>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item
                          name="company_name"
                          label="公司名称"
                          rules={[{ required: true, message: '请输入公司名称' }]}
                        >
                          <Input placeholder="请输入公司名称" />
                        </Form.Item>
                      </Col>
                      
                      <Col span={12}>
                        <Form.Item
                          name="default_language"
                          label="默认语言"
                          rules={[{ required: true, message: '请选择默认语言' }]}
                        >
                          <Select placeholder="请选择默认语言">
                            <Option value="zh">中文</Option>
                            <Option value="en">English</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col span={24}>
                        <Form.Item
                          name="contact_info"
                          label="联系方式"
                        >
                          <TextArea
                            rows={3}
                            placeholder="请输入联系方式信息"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col span={24}>
                        <Form.Item label="公司Logo">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover rounded" />
                              ) : (
                                <GlobalOutlined className="text-2xl text-gray-400" />
                              )}
                            </div>
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
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              },

            {/* 系统设置 */}
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <SettingOutlined />
                  系统设置
                </span>
              }
              key="system"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="theme"
                    label="系统主题"
                  >
                    <Select placeholder="请选择系统主题">
                      <Option value="light">明亮主题</Option>
                      <Option value="dark">暗黑主题</Option>
                      <Option value="auto">跟随系统</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="timezone"
                    label="时区设置"
                  >
                    <Select placeholder="请选择时区">
                      <Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Option>
                      <Option value="America/New_York">美国东部时间 (UTC-5)</Option>
                      <Option value="Europe/London">英国时间 (UTC+0)</Option>
                      <Option value="Asia/Tokyo">日本标准时间 (UTC+9)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="date_format"
                    label="日期格式"
                  >
                    <Select placeholder="请选择日期格式">
                      <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                      <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                      <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="session_timeout"
                    label="会话超时时间（分钟）"
                  >
                    <InputNumber
                      min={5}
                      max={480}
                      placeholder="请输入超时时间"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            {/* 邮件设置 */}
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <MailOutlined />
                  邮件设置
                </span>
              }
              key="email"
            >
              <Alert
                message="邮件配置"
                description="配置SMTP服务器用于发送系统邮件，如密码重置、通知等。"
                type="info"
                className="mb-6"
              />

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="smtp_host"
                    label="SMTP服务器"
                    rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
                  >
                    <Input placeholder="例如: smtp.gmail.com" />
                  </Form.Item>
                </Col>
                
                <Col span={6}>
                  <Form.Item
                    name="smtp_port"
                    label="端口"
                    rules={[{ required: true, message: '请输入端口号' }]}
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      placeholder="587"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={6}>
                  <Form.Item
                    name="smtp_encryption"
                    label="加密方式"
                  >
                    <Select placeholder="选择加密方式">
                      <Option value="none">无加密</Option>
                      <Option value="ssl">SSL</Option>
                      <Option value="tls">TLS</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="smtp_username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入SMTP用户名' }]}
                  >
                    <Input placeholder="请输入SMTP用户名" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="smtp_password"
                    label="密码"
                    rules={[{ required: true, message: '请输入SMTP密码' }]}
                  >
                    <Input.Password placeholder="请输入SMTP密码" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="mail_from_address"
                    label="发件人邮箱"
                    rules={[
                      { required: true, message: '请输入发件人邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="no-reply@company.com" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="mail_from_name"
                    label="发件人名称"
                  >
                    <Input placeholder="系统通知" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="mt-4">
                <Button
                  type="dashed"
                  loading={testingEmail}
                  onClick={testEmailSettings}
                >
                  测试邮件设置
                </Button>
              </div>
            </TabPane>

            {/* API设置 */}
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <GlobalOutlined />
                  API设置
                </span>
              }
              key="api"
            >
              <Alert
                message="第三方API配置"
                description="配置外部服务API接口，用于支付、物流、库存等功能集成。"
                type="info"
                className="mb-6"
              />

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    name="payment_api"
                    label="支付接口API"
                  >
                    <Input placeholder="https://api.payment.com/v1" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    name="logistics_api"
                    label="物流API接口"
                  >
                    <Input placeholder="https://api.logistics.com/v1" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    name="inventory_api"
                    label="价格库存接口"
                  >
                    <Input placeholder="https://api.inventory.com/v1" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            {/* 安全设置 */}
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <SecurityScanOutlined />
                  安全设置
                </span>
              }
              key="security"
            >
              <Alert
                message="安全策略配置"
                description="配置密码策略和登录安全限制，增强系统安全性。"
                type="warning"
                className="mb-6"
              />

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name={['password_policy', 'min_length']}
                    label="密码最小长度"
                  >
                    <InputNumber
                      min={6}
                      max={20}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="login_attempts"
                    label="登录失败次数限制"
                  >
                    <InputNumber
                      min={3}
                      max={10}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="lockout_duration"
                    label="账户锁定时间（分钟）"
                  >
                    <InputNumber
                      min={5}
                      max={60}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">密码策略</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name={['password_policy', 'require_uppercase']}
                    label="要求大写字母"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name={['password_policy', 'require_lowercase']}
                    label="要求小写字母"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name={['password_policy', 'require_numbers']}
                    label="要求数字"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name={['password_policy', 'require_symbols']}
                    label="要求特殊字符"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage; 