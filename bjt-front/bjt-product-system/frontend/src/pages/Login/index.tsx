import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Row, Col, Card, Switch, Badge, Tag } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, ShoppingCartOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
import logo from '../../assets/logo.svg';
import { authService } from '../../services/auth';
import testAuthFlow from '../../utils/authTest';

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
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const testAccounts: TestAccount[] = [
    {
      username: 'admin',
      password: 'password123',
      role: 'admin',
      description: '系统管理员 - 拥有所有功能、用户管理和系统设置的完全访问权限'
    },
    {
      username: 'sales_user',
      password: 'password123',
      role: 'sales',
      description: '销售经理 - 可以访问报表、库存管理和销售相关功能'
    },
    {
      username: 'euvip_customer',
      password: 'password123',
      role: 'customer',
      description: '欧洲VIP客户 - 查看欧洲区域产品和价格（欧元）'
    },
    {
      username: 'au_customer',
      password: 'password123',
      role: 'customer',
      description: '澳洲普通客户 - 查看澳洲区域产品和价格（澳元）'
    },
    {
      username: 'na_customer',
      password: 'password123',
      role: 'customer',
      description: '北美客户 - 查看北美区域产品和价格（美元）'
    }
  ];

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
      
      // 导航到机器页面
      navigate('/machines');
    } catch (error: any) {
      console.error('❌ [Login] Login failed:', error);
      setErrorMsg(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (account: TestAccount) => {
    form.setFieldsValue({
      username: account.username,
      password: account.password,
    });
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

  const runAuthTest = async () => {
    try {
      await testAuthFlow();
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <img src={logo} alt="BJT Logo" className="logo" />
        <Title level={2} className="login-title">Welcome to BJT Management System</Title>
        <Paragraph className="login-subtitle">
          Sign in to access your account
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
            <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
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
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <div className="test-accounts-section">
          <div className="test-accounts-header">
            <span>Test Accounts</span>
            <Switch 
              checked={showTestAccounts}
              onChange={(checked: boolean) => setShowTestAccounts(checked)}
              size="small"
            />
          </div>
          
          {showTestAccounts && (
            <Card className="test-accounts-card" size="small">
              <Row gutter={[8, 16]}>
                {testAccounts.map((account, index) => (
                  <Col span={24} key={index}>
                    <div 
                      className="test-account" 
                      onClick={() => fillTestAccount(account)}
                    >
                      <div className="account-info">
                        <Badge count={getRoleIcon(account.role)} offset={[0, 3]}>
                          <span className="account-email">{account.username}</span>
                        </Badge>
                        <Tag color={
                          account.role === 'admin' ? 'red' : 
                          account.role === 'manager' ? 'blue' : 
                          'green'
                        }>
                          {account.role}
                        </Tag>
                      </div>
                      <div className="account-description">
                        {account.description}
                      </div>
                      <div className="account-password">
                        Password: <code>{account.password}</code>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item>
            <Button type="default" onClick={runAuthTest} block>
              运行认证测试
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login; 