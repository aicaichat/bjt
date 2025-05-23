import React, { ReactNode } from 'react';
import { Typography, Space } from 'antd';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0',
  };

  return (
    <div style={headerStyle}>
      <div>
        <Title level={4} style={{ marginBottom: subtitle ? 4 : 0 }}>
          {title}
        </Title>
        {subtitle && (
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        )}
      </div>
      {extra && <Space>{extra}</Space>}
    </div>
  );
};

export default PageHeader; 