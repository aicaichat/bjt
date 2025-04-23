import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Form, Input, Button, Select, Card, Tabs, message, Spin, Avatar } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import './Profile.css';
import { useLanguage } from '../../contexts/LanguageContext';

const { TabPane } = Tabs;
const { Option } = Select;

// 区域配置
const REGIONS = {
  CN: {
    code: 'CN',
    nameCn: '中国',
    nameEn: 'China',
    currencySymbol: '¥',
    voltage: '220V',
  },
  EU: {
    code: 'EU',
    nameCn: '欧洲',
    nameEn: 'Europe',
    currencySymbol: '€',
    voltage: '220V',
  },
  NA: {
    code: 'NA',
    nameCn: '北美',
    nameEn: 'North America',
    currencySymbol: '$',
    voltage: '110V',
  },
  AU: {
    code: 'AU',
    nameCn: '澳洲',
    nameEn: 'Australia',
    currencySymbol: 'A$',
    voltage: '220V',
  }
};

const Profile: React.FC = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        region: user.region || 'CN',
      });
    }
  }, [user, form]);

  // 处理个人资料更新
  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile({
        name: values.name,
        region: values.region,
      });
      message.success(t('profileUpdateSuccess', '个人资料更新成功'));
    } catch (error) {
      message.error(t('profileUpdateFailed', '更新失败，请重试'));
      console.error('Profile update failed:', error);
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
        <p>{t('notLoggedIn', '您尚未登录，请先登录再访问此页面')}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t('myProfile', '我的个人资料')}</h1>
        <p>{t('profileSubtitle', '查看和更新您的个人信息')}</p>
      </div>

      <div className="profile-content">
        <div className="profile-summary">
          <Card className="summary-card">
            <div className="user-avatar-container">
              <Avatar 
                size={80} 
                icon={<UserOutlined />} 
                src={user.avatar}
                className="user-avatar"
              />
              <h2>{user.name}</h2>
              <p className="user-email">{user.email}</p>
              <p className="user-role">{t(`role_${user.role}`, user.role)}</p>
              {user.region && (
                <p className="user-region">
                  <GlobalOutlined /> {REGIONS[user.region as keyof typeof REGIONS]?.nameEn || user.region}
                </p>
              )}
              {user.vipLevel && user.vipLevel > 0 && (
                <div className="vip-badge">
                  VIP {user.vipLevel}
                </div>
              )}
            </div>
          </Card>
        </div>

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

                  <Form.Item
                    name="email"
                    label={t('email', '电子邮件')}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      disabled
                    />
                  </Form.Item>

                  <Form.Item
                    name="region"
                    label={t('region', '区域')}
                    rules={[{ required: true, message: t('regionRequired', '请选择区域') }]}
                  >
                    <Select placeholder={t('selectRegion', '选择区域')}>
                      <Option value="CN">{language === 'cn' ? REGIONS.CN.nameCn : REGIONS.CN.nameEn}</Option>
                      <Option value="EU">{language === 'cn' ? REGIONS.EU.nameCn : REGIONS.EU.nameEn}</Option>
                      <Option value="NA">{language === 'cn' ? REGIONS.NA.nameCn : REGIONS.NA.nameEn}</Option>
                      <Option value="AU">{language === 'cn' ? REGIONS.AU.nameCn : REGIONS.AU.nameEn}</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      className="update-button"
                    >
                      {t('updateProfile', '更新个人资料')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            <TabPane 
              tab={<span><LockOutlined /> {t('password', '密码')}</span>} 
              key="password"
            >
              <Card>
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
                      { min: 8, message: t('passwordMinLength', '密码长度不得少于8个字符') }
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
                    rules={[
                      { required: true, message: t('confirmPasswordRequired', '请确认新密码') },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error(t('passwordsDoNotMatch', '两次输入的密码不一致')));
                        },
                      }),
                    ]}
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
                      className="update-button"
                    >
                      {t('updatePassword', '更新密码')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile; 