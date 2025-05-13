import React from 'react';
import { Typography } from 'antd';
import './PageTitle.css';

const { Title } = Typography;

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="page-title-container">
      {icon && <div className="page-title-icon">{icon}</div>}
      <div className="page-title-content">
        <Title level={2} className="page-title">{title}</Title>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default PageTitle; 