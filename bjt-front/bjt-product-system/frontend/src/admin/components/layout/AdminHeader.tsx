import React from 'react';
import { Layout, Menu, Dropdown, Space, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人信息
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const languageMenu = (
    <Menu>
      <Menu.Item key="zh">中文</Menu.Item>
      <Menu.Item key="en">English</Menu.Item>
    </Menu>
  );

  // Basic styling to match mockup
  const headerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    padding: '15px 25px',
    borderBottom: '1px solid #e1e5eb',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    position: 'relative',
    zIndex: 10,
    height: '70px' // Approximate height based on mockup logo size + padding
  };

  const logoStyle: React.CSSProperties = {
    height: '45px',
  };

  const navLinksStyle: React.CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  };

  const linkStyle: React.CSSProperties = {
    color: '#1a3c70',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500
  };

  const langSwitcherStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e1e5eb',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer'
  };

  return (
    <Header className="bg-white px-6 flex justify-between items-center border-b">
      <div className="flex-1" />
      <Space size="large">
        <Dropdown overlay={languageMenu} placement="bottomRight">
          <GlobalOutlined className="text-lg cursor-pointer" />
        </Dropdown>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span>管理员</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AdminHeader; 