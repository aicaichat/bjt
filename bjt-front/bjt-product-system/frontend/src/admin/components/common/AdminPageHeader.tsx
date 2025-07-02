import React from 'react';
import { Button, Space, Breadcrumb } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  extra?: React.ReactNode;
  onAdd?: () => void;
  addButtonText?: string;
  onBack?: () => void;
  backTo?: string;
}

function AdminPageHeader({
  title,
  description,
  breadcrumb,
  actions,
  extra,
  onAdd,
  addButtonText = '新增',
  onBack
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb
          className="mb-4"
          items={breadcrumb.map((item, index) => ({
            key: index,
            title: item.path ? (
              <a href={item.path}>{item.title}</a>
            ) : (
              item.title
            )
          }))}
        />
      )}
      
      <div className="flex justify-between items-start">
        <div>
          {onBack && (
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />} 
              onClick={onBack} 
              className="ml-[-16px] mb-2"
            >
              返回
            </Button>
          )}
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        <Space>
          {onAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
            >
              {addButtonText}
            </Button>
          )}
          {actions}
          {extra}
        </Space>
      </div>
    </div>
  );
}

export default AdminPageHeader; 