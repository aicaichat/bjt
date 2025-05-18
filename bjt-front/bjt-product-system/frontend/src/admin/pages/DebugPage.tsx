import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, List, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

const DebugPage: React.FC = () => {
  // 备件管理相关路由
  const sparePartsRoutes = [
    { path: '/admin/spare-parts', description: '备件管理主页' },
    { path: '/admin/spare-parts/create', description: '创建备件料号' },
    { path: '/admin/spare-parts/edit/1', description: '编辑备件料号 (ID=1)' },
    { path: '/admin/spare-parts/models/create', description: '创建备件型号' },
    { path: '/admin/spare-parts/models/edit/1', description: '编辑备件型号 (ID=1)' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>调试页面</Title>
      
      <Card title="应用信息" style={{ marginBottom: '20px' }}>
        <Paragraph>
          <Text strong>环境:</Text> {import.meta.env.MODE}
        </Paragraph>
        <Paragraph>
          <Text strong>API基础URL:</Text> {import.meta.env.VITE_API_BASE_URL || '未设置'}
        </Paragraph>
        <Paragraph>
          <Text strong>当前路径:</Text> {window.location.pathname}
        </Paragraph>
      </Card>
      
      <Card title="备件管理路由" style={{ marginBottom: '20px' }}>
        <Paragraph>
          点击下面的链接测试各个页面是否能够正常访问
        </Paragraph>
        <List
          bordered
          dataSource={sparePartsRoutes}
          renderItem={item => (
            <List.Item>
              <Link to={item.path}>{item.path}</Link> - {item.description}
            </List.Item>
          )}
        />
      </Card>
      
      <Card title="解决方案建议">
        <Title level={4}>如果页面无法访问，可能的原因：</Title>
        <List
          bordered
          dataSource={[
            "路由配置问题：检查 admin/routes.tsx 中的路由配置",
            "组件导入问题：确保所有组件正确导入和导出",
            "路由层级问题：可能嵌套路由配置有误",
            "URL 路径问题：确保基础路径正确",
            "组件渲染错误：查看控制台错误信息"
          ]}
          renderItem={item => <List.Item>{item}</List.Item>}
        />
      </Card>
      
      <Divider />
      
      <div style={{ marginTop: '20px' }}>
        <Link to="/admin">返回管理后台</Link>
      </div>
    </div>
  );
};

export default DebugPage; 