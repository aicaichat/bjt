import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Badge } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { usePendingUsersCount } from '../../hooks/usePendingUsersCount';

const UserManagementTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { count: pendingCount } = usePendingUsersCount();

  const activeKey = location.pathname.includes('/registrations') ? 'registrations' : 'users';

  const handleTabChange = (key: string) => {
    if (key === 'registrations') {
      navigate('/admin/registrations');
    } else {
      navigate('/admin/users');
    }
  };

  const items = [
    {
      key: 'registrations',
      label: (
        <span>
          <CheckCircleOutlined />
          注册审核
          {pendingCount > 0 && (
            <Badge 
              count={pendingCount} 
              size="small" 
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined />
          用户列表
        </span>
      ),
    },
  ];

  return (
    <Tabs 
      activeKey={activeKey} 
      items={items} 
      onChange={handleTabChange}
      style={{ marginBottom: 16 }}
    />
  );
};

export default UserManagementTabs; 