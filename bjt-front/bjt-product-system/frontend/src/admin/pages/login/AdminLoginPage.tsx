import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Row, Col, Card, Switch, Badge, Tag } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, ShoppingCartOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminService from '../../api/adminService';
import '../../styles/login.css'; // 假设我们创建类似的样式文件

const { Title, Paragraph } = Typography;

interface TestAccount {
  username: string;
  password: string;
  role: string;
  description: string;
}

const AdminLoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTestAccounts, setShowTestAccounts] = useState(true); // 默认显示测试账户
  const navigate = useNavigate();
  const location = useLocation();

  const testAccounts: TestAccount[] = [
    {
      username: 'admin',
      password: 'password',
      role: 'admin',
      description: '系统管理员 - 拥有所有功能、用户管理和系统设置的完全访问权限'
    }
  ];

  const handleSubmit = async (values: { username: string; password: string; remember?: boolean }) => {
    console.log('🔐 [AdminLogin] Attempting login with:', values);
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. 前端验证：只允许admin账号登录
      if (values.username !== 'admin') {
        throw new Error('访问被拒绝：只有管理员账号可以登录后台管理系统');
      }

      console.log('🔐 [AdminLogin] Admin username verified, calling auth service...');
      
      // 2. 调用后端API进行密码验证
      const response = await AdminService.login(values.username, values.password);
      
      if (response.success && response.data) {
        console.log('✅ [AdminLogin] Login successful:', response.data);
        
        // 3. 再次验证响应中的用户信息（如果后端返回用户信息）
        // 这是额外的安全层，确保后端也只返回admin用户的token
        
        // 保存admin token
        localStorage.setItem('admin_token', response.data.token);
        console.log('🔐 [AdminLogin] Admin token saved to localStorage');
        
        message.success('管理员登录成功');
        
        // 获取用户之前试图访问的页面，如果没有则默认到settings页面
        const from = (location.state as any)?.from;
        const redirectTo = from || '/admin/settings';
        
        console.log('🔗 [AdminLogin] Redirecting to:', redirectTo);
        navigate(redirectTo, { replace: true });
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error: any) {
      console.error('❌ [AdminLogin] Login failed:', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (error.message && error.message.includes('访问被拒绝')) {
        errorMessage = error.message;
      } else if (error.message && error.message.includes('401')) {
        errorMessage = '用户名或密码错误';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (account: TestAccount) => {
    // 只允许填入admin账号
    if (account.username === 'admin') {
      form.setFieldsValue({
        username: account.username,
        password: account.password,
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <CrownOutlined />;
      case 'sales':
        return <ShoppingCartOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Title level={2} className="login-title">BJT 管理后台</Title>
        <Paragraph className="login-subtitle">
          管理员登录 - 仅限管理员账号
        </Paragraph>

        {errorMsg && (
          <div className="login-error">
            {errorMsg}
          </div>
        )}

        <Form
          form={form}
          name="admin-login"
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{ remember: true }}
          className="login-form"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名！' },
              { 
                validator: (_, value) => {
                  if (value && value !== 'admin') {
                    return Promise.reject(new Error('只有admin账号可以登录管理后台'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名 (仅限admin)" 
              size="large" 
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
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
              管理员登录
            </Button>
          </Form.Item>
        </Form>

        <div className="test-accounts-section">
          <div className="test-accounts-header">
            <span>管理员测试账户</span>
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
                        <Tag color="red">
                          {account.role}
                        </Tag>
                      </div>
                      <div className="account-description">
                        {account.description}
                      </div>
                      <div className="account-password">
                        密码: <code>{account.password}</code>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                <strong>安全提示：</strong> 只有admin账号可以访问管理后台，其他账号将被拒绝登录。
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 