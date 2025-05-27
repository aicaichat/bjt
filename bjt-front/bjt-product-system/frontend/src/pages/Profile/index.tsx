import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Tabs, 
  Select, 
  Radio, 
  Upload, 
  Avatar, 
  Spin, 
  Row, 
  Col, 
  Divider,
  Tag,
  Space,
  Typography
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  IdcardOutlined, 
  SettingOutlined,
  CameraOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth, UnitSystem, UserRole } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { REGIONS } from '../../config/constants';
import './Profile.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

// 角色显示映射
const roleDisplayMap = {
  [UserRole.ADMIN]: { label: '管理员', color: 'red', icon: '👑' },
  [UserRole.SALES]: { label: '销售人员', color: 'blue', icon: '💼' },
  [UserRole.PARTNER]: { label: '合作伙伴', color: 'green', icon: '🤝' },
  [UserRole.CUSTOMER]: { label: '客户', color: 'orange', icon: '👤' },
  [UserRole.UNKNOWN]: { label: '未知', color: 'default', icon: '❓' }
};

// 单位制选项
const unitSystemOptions = [
  { value: 'metric', label: '公制 (Metric)', description: '厘米、千克、摄氏度' },
  { value: 'imperial', label: '英制 (Imperial)', description: '英寸、磅、华氏度' }
];

const Profile: React.FC = () => {
  const { user, updateProfile, updatePreferredUnit, hasPermission, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [unitForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        username: user.username,
        region: user.region || 'CN',
        country: user.country,
        customerCode: user.customerCode,
        companyLogo: user.companyLogo
      });

      unitForm.setFieldsValue({
        preferredUnit: user.preferredUnit || 'metric'
      });
    }
  }, [user, form, unitForm]);

  // 处理个人资料更新
  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile({
        name: values.name,
        displayName: values.displayName,
        email: values.email,
        region: values.region,
        country: values.country,
        customerCode: values.customerCode,
        companyLogo: values.companyLogo
      });
      message.success(t('profileUpdateSuccess', '个人资料更新成功'));
    } catch (error) {
      message.error(t('profileUpdateFailed', '更新失败，请重试'));
      console.error('Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理单位制偏好更新
  const handleUnitSystemUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updatePreferredUnit(values.preferredUnit);
      message.success('单位制偏好更新成功');
    } catch (error) {
      message.error('单位制偏好更新失败，请重试');
      console.error('Unit system update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理密码更新
  const handlePasswordUpdate = async (values: any) => {
    try {
      setLoading(true);
      if (values.newPassword !== values.confirmPassword) {
        message.error(t('passwordsDoNotMatch', '两次输入的密码不一致'));
        return;
      }

      // 模拟更新密码 - 实际应用中应调用真实API
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(t('passwordUpdateSuccess', '密码更新成功'));
      passwordForm.resetFields();
    } catch (error) {
      message.error(t('passwordUpdateFailed', '密码更新失败，请重试'));
      console.error('Password update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: any) => {
    try {
      setAvatarLoading(true);
      // 这里应该上传文件并获取URL，暂时模拟
      const avatarUrl = URL.createObjectURL(file);
      await updateProfile({ avatar: avatarUrl });
      message.success('头像更新成功');
    } catch (error) {
      message.error('头像更新失败');
      console.error('Avatar upload failed:', error);
    } finally {
      setAvatarLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>{t('userNotFound', '用户信息未找到')}</p>
      </div>
    );
  }

  const roleInfo = roleDisplayMap[user.role] || roleDisplayMap[UserRole.UNKNOWN];

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 用户信息头部 */}
        <Card className="profile-header">
          <Row gutter={24} align="middle">
            <Col span={4}>
              <div className="avatar-section">
                <Avatar 
                  size={80} 
                  src={user.avatar} 
                  icon={<UserOutlined />}
                  className="user-avatar"
                />
                <Upload
                  showUploadList={false}
                  beforeUpload={(file: any) => {
                    handleAvatarUpload(file);
                    return false;
                  }}
                  accept="image/*"
                >
                  <Button 
                    icon={<CameraOutlined />} 
                    size="small" 
                    className="avatar-upload-btn"
                    loading={avatarLoading}
                  >
                    更换头像
                  </Button>
                </Upload>
              </div>
            </Col>
            <Col span={20}>
              <div className="user-info">
                <Title level={3} style={{ margin: 0 }}>
                  {user.displayName || user.name}
                  <Tag color={roleInfo.color} style={{ marginLeft: 12 }}>
                    {roleInfo.icon} {roleInfo.label}
                  </Tag>
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {user.email}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Tag icon={<GlobalOutlined />}>
                      {user.region && REGIONS[user.region as keyof typeof REGIONS] 
                        ? (language === 'cn' 
                          ? REGIONS[user.region as keyof typeof REGIONS].nameCn 
                          : REGIONS[user.region as keyof typeof REGIONS].nameEn)
                        : user.region}
                    </Tag>
                    <Tag icon={<SettingOutlined />}>
                      {user.preferredUnit === 'metric' ? '公制' : '英制'}
                    </Tag>
                    {user.customerCode && (
                      <Tag>客户代码: {user.customerCode}</Tag>
                    )}
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 详细设置 */}
        <div className="profile-editor">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={<span><IdcardOutlined /> {t('basicInfo', '基本信息')}</span>} 
              key="basic"
            >
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  className="profile-form"
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="name"
                        label={t('name', '姓名')}
                        rules={[{ required: true, message: t('nameRequired', '请输入您的姓名') }]}
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder={t('enterName', '输入姓名')} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="displayName"
                        label="显示名称"
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder="输入显示名称" 
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label={t('email', '电子邮件')}
                      >
                        <Input 
                          prefix={<MailOutlined />} 
                          disabled
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        label="用户名"
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          disabled
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="region"
                        label={t('region', '区域')}
                        rules={[{ required: true, message: t('regionRequired', '请选择区域') }]}
                      >
                        <Select placeholder={t('selectRegion', '选择区域')}>
                          {Object.entries(REGIONS).map(([key, region]) => (
                            <Option key={key} value={key}>
                              {language === 'cn' ? region.nameCn : region.nameEn}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="country"
                        label="国家"
                      >
                        <Input placeholder="输入国家" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {user.role !== UserRole.CUSTOMER && (
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item
                          name="customerCode"
                          label="客户代码"
                        >
                          <Input placeholder="输入客户代码" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="companyLogo"
                          label="公司Logo URL"
                        >
                          <Input placeholder="输入公司Logo URL" />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      size="large"
                    >
                      {t('updateProfile', '更新资料')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            <TabPane 
              tab={<span><SettingOutlined /> 单位制偏好</span>} 
              key="units"
            >
              <Card>
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>
                    <SettingOutlined /> 单位制设置
                  </Title>
                  <Text type="secondary">
                    选择您偏好的单位制，这将影响整个系统中尺寸、重量等数据的显示方式。
                  </Text>
                </div>

                <Form
                  form={unitForm}
                  layout="vertical"
                  onFinish={handleUnitSystemUpdate}
                >
                  <Form.Item
                    name="preferredUnit"
                    label="偏好单位制"
                    rules={[{ required: true, message: '请选择偏好的单位制' }]}
                  >
                    <Radio.Group>
                      {unitSystemOptions.map(option => (
                        <div key={option.value} style={{ marginBottom: 12 }}>
                          <Radio value={option.value}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {option.description}
                              </div>
                            </div>
                          </Radio>
                        </div>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <div style={{ background: '#f6f8fa', padding: 16, borderRadius: 6, marginBottom: 24 }}>
                    <Space>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      <Text>
                        当前设置: <strong>
                          {user.preferredUnit === 'metric' ? '公制 (厘米、千克)' : '英制 (英寸、磅)'}
                        </strong>
                      </Text>
                    </Space>
                  </div>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      size="large"
                    >
                      保存单位制偏好
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            <TabPane 
              tab={<span><SecurityScanOutlined /> {t('security', '安全设置')}</span>} 
              key="security"
            >
              <Card>
                <Title level={4}>
                  <LockOutlined /> {t('changePassword', '修改密码')}
                </Title>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordUpdate}
                  className="password-form"
                >
                  <Form.Item
                    name="currentPassword"
                    label={t('currentPassword', '当前密码')}
                    rules={[{ required: true, message: t('currentPasswordRequired', '请输入当前密码') }]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder={t('enterCurrentPassword', '输入当前密码')} 
                    />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label={t('newPassword', '新密码')}
                    rules={[
                      { required: true, message: t('newPasswordRequired', '请输入新密码') },
                      { min: 6, message: t('passwordMinLength', '密码至少6位') }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder={t('enterNewPassword', '输入新密码')} 
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label={t('confirmPassword', '确认新密码')}
                    rules={[{ required: true, message: t('confirmPasswordRequired', '请确认新密码') }]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder={t('confirmNewPassword', '确认新密码')} 
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      size="large"
                    >
                      {t('updatePassword', '更新密码')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            {/* 权限信息 - 仅管理员和销售可见 */}
            {hasPermission('viewAdmin') && (
              <TabPane 
                tab={<span><SecurityScanOutlined /> 权限信息</span>} 
                key="permissions"
              >
                <Card>
                  <Title level={4}>
                    <SecurityScanOutlined /> 用户权限
                  </Title>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                      当前角色: <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
                    </Text>
                  </div>
                  
                  {user.permissions && (
                    <div>
                      <Title level={5}>权限列表:</Title>
                      <Row gutter={[8, 8]}>
                        {Object.entries(user.permissions).map(([key, value]) => (
                          <Col key={key}>
                            <Tag color={value ? 'green' : 'red'}>
                              {value ? '✓' : '✗'} {key}
                            </Tag>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </Card>
              </TabPane>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile; 