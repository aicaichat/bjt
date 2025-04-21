import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Row, Col, Card, Switch, Badge, Tag } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, ShopOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
import logo from '../../assets/logo.svg';

const { Title, Paragraph } = Typography;

interface TestAccount {
  email: string;
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
      email: 'admin@bjt.com',
      password: 'admin123',
      role: 'admin',
      description: '系统管理员 - 拥有所有功能、用户管理和系统设置的完全访问权限'
    },
    {
      email: 'sales@bjt.com',
      password: 'admin123',
      role: 'sales',
      description: '销售经理 - 可以访问报表、库存管理和销售相关功能'
    },
    {
      email: 'eu-vip@customer.com',
      password: 'admin123',
      role: 'customer',
      description: '欧洲VIP客户 - 查看欧洲区域产品和价格（欧元）'
    },
    {
      email: 'au@customer.com',
      password: 'admin123',
      role: 'customer',
      description: '澳洲普通客户 - 查看澳洲区域产品和价格（澳元）'
    },
    {
      email: 'northamerica@user.com',
      password: 'admin123',
      role: 'customer',
      description: '北美客户 - 查看北美区域产品和价格（美元）'
    }
  ];

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMsg('');

    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (account: TestAccount) => {
    form.setFieldsValue({
      email: account.email,
      password: account.password,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <BankOutlined />;
      case 'sales':
        return <ShopOutlined />;
      case 'customer':
      case 'partner':
        return <UserSwitchOutlined />;
      default:
        return <UserOutlined />;
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
            name="email"
            rules={[
              { required: true, message: 'Please input your Email!' },
              { type: 'email', message: 'Please enter a valid email address!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
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
              onChange={(checked) => setShowTestAccounts(checked)}
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
                          <span className="account-email">{account.email}</span>
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
      </div>
    </div>
  );
};

export default Login; 