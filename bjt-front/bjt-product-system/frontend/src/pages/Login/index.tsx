import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Row, Col, Card, Switch, Badge, Tag } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, ShoppingCartOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
const logo = '/images/logo-1.webp';
import { authService } from '../../services/auth';
import testAuthFlow from '../../utils/authTest';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

interface TestAccount {
  username: string;
  password: string;
  role: string;
  description: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation('login');

  const handleSubmit = async (values: { username: string; password: string; remember?: boolean }) => {
    console.log('🔐 [Login] Attempting login with:', values);
    console.log('🔐 [Login] Current environment:', {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA
    });
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      console.log('🔐 [Login] Calling auth service login...');
      const user = await login(values.username, values.password);
      console.log('✅ [Login] Login successful:', user);
      
      // 验证token是否正确保存
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      console.log('🔐 [Login] Post-login verification:', {
        hasSavedToken: !!savedToken,
        tokenLength: savedToken?.length,
        tokenPreview: savedToken ? savedToken.substring(0, 15) + '...' : 'none',
        hasSavedUser: !!savedUser,
        userObject: user
      });
      
      // 解析跳转目标：既支持对象形式({pathname:"/xxx"})，也支持直接字符串形式("/xxx")
      const stateFrom = (location.state as any)?.from;
      const redirectPath =
        // 1) location.state.from 可以是对象或字符串
        (typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname) ||
        // 其次检查查询参数中的 redirect 字段（手动调用 /login?redirect=/target ）
        new URLSearchParams(location.search).get('redirect') ||
        // 默认回退到机器页面
        '/machines';

      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error('❌ [Login] Login failed:', error);
      setErrorMsg(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <CrownOutlined />;
      case 'sales':
        return <ShoppingCartOutlined />;
      case 'customer':
      case 'partner':
        return <TeamOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.login(values.username, values.password);
      if (response.success) {
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <img src={logo} alt="BJT Logo" className="logo" />
        <Title level={2} className="login-title">{t('pageTitle')}</Title>
        <Paragraph className="login-subtitle">
          {t('signInToAccessYourAccount')}
        </Paragraph>

        {errorMsg && (
          <div className="login-error">
            {errorMsg}
          </div>
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{ remember: true }}
          className="login-form"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Please input your Username!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('username')} size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('password')}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="login-button"
            >
              {t('login')}
            </Button>
          </Form.Item>
          
          <Form.Item>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ color: '#666' }}>{t('register.title')}</span>
              <Link to="/register" style={{ marginLeft: '8px', color: '#1890ff' }}>
                {t('register.link')}
              </Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login; 