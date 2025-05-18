import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
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
  actions,
  extra,
  onAdd,
  addButtonText = '新增',
  onBack
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
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