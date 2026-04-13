import React from 'react';
import { Layout, Menu, Dropdown, Space, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import LanguageSwitch from '../../i18n/components/LanguageSwitch';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Header } = Layout;

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { tc } = useAdminI18n();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: String(tc('profile') || '个人信息'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: String(tc('logout') || '退出登录'),
      onClick: handleLogout,
    },
  ];

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
    <Header className="admin-header">
      <div className="flex-1" />
      <Space size="large">
        <LanguageSwitch size="small" />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span>{String(tc('admin') || '管理员')}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AdminHeader; 