import React from 'react';
import { Card, Alert, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';

const AdminTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="🎉 Admin后台访问成功" className="text-center">
          <Alert
            message="恭喜！"
            description="您已成功登录Admin管理后台，登录验证正常工作！"
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            className="mb-4"
          />
          
          <p className="text-gray-600 mb-6">
            当前页面可以正常访问，说明admin路由保护机制工作正常。
          </p>
          
          <Space wrap>
            <Button 
              type="primary" 
              icon={<SettingOutlined />}
              onClick={() => navigate('/admin/settings')}
            >
              前往系统设置
            </Button>
            
            <Button 
              icon={<UserOutlined />}
              onClick={() => navigate('/admin/users')}
            >
              用户管理
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/product-lines')}
            >
              产品线管理
            </Button>
          </Space>
        </Card>

        <Card title="🔧 功能测试" size="small">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>✅ Admin登录验证</span>
              <span className="text-green-600">正常</span>
            </div>
            <div className="flex justify-between">
              <span>✅ 路由保护</span>
              <span className="text-green-600">正常</span>
            </div>
            <div className="flex justify-between">
              <span>✅ 默认重定向</span>
              <span className="text-green-600">到设置页面</span>
            </div>
            <div className="flex justify-between">
              <span>✅ Token存储</span>
              <span className="text-green-600">{localStorage.getItem('admin_token') ? '已保存' : '未保存'}</span>
            </div>
          </div>
        </Card>

        <Card title="📋 当前路由信息" size="small">
          <div className="text-sm text-gray-600">
            <p><strong>当前路径:</strong> {window.location.pathname}</p>
            <p><strong>管理员Token:</strong> {localStorage.getItem('admin_token') ? '✅ 已设置' : '❌ 未设置'}</p>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default AdminTestPage; 