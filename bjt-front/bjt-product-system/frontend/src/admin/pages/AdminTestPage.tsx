import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { useAdminI18n } from '../i18n/hooks/useAdminI18n';
import LanguageSwitch from '../i18n/components/LanguageSwitch';

const { Title, Text } = Typography;

const AdminTestPage: React.FC = () => {
  const { tc, language, t } = useAdminI18n();

  return (
    <div style={{ padding: '20px' }}>
      <Card title="多语言切换测试页面" extra={<LanguageSwitch />}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>当前语言信息</Title>
            <Text>当前语言: <strong>{language}</strong></Text>
          </div>

          <div>
            <Title level={4}>翻译测试</Title>
            <Space direction="vertical">
              <Text>保存按钮: <strong>{String(tc('actions.save'))}</strong></Text>
              <Text>取消按钮: <strong>{String(tc('actions.cancel'))}</strong></Text>
              <Text>删除按钮: <strong>{String(tc('actions.delete'))}</strong></Text>
              <Text>个人信息: <strong>{String(tc('profile'))}</strong></Text>
              <Text>退出登录: <strong>{String(tc('logout'))}</strong></Text>
              <Text>管理员: <strong>{String(tc('admin'))}</strong></Text>
              <Text>切换语言: <strong>{String(tc('switchLanguage'))}</strong></Text>
            </Space>
          </div>

          <div>
            <Title level={4}>i18n 实例信息</Title>
            <Text>实例状态: <strong>{t ? '已加载' : '未加载'}</strong></Text>
          </div>

          <div>
            <Title level={4}>调试信息</Title>
            <Text>localStorage 存储: <strong>{localStorage.getItem('admin_i18nextLng') || '未设置'}</strong></Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AdminTestPage; 