import React from 'react';
import { Tag } from 'antd';
import type { RMAStatus, RMAStatusConfig } from '../../types/rma.types';

interface RmaStatusBadgeProps {
  status: RMAStatus;
  size?: 'small' | 'default';
}

// 状态配置
const statusConfig: RMAStatusConfig = {
  pending: {
    color: 'processing',
    text: '待处理',
    icon: '⏳',
  },
  processing: {
    color: 'processing',
    text: '处理中',
    icon: '🔄',
  },
  approved: {
    color: 'success',
    text: '已批准',
    icon: '✅',
  },
  rejected: {
    color: 'error',
    text: '已拒绝',
    icon: '❌',
  },
  completed: {
    color: 'success',
    text: '已完成',
    icon: '🎉',
  },
  cancelled: {
    color: 'default',
    text: '已取消',
    icon: '🚫',
  },
};

const RmaStatusBadge: React.FC<RmaStatusBadgeProps> = ({ status, size = 'default' }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Tag 
      color={config.color} 
      className={`rma-status-badge ${size === 'small' ? 'small' : ''}`}
    >
      {config.icon && <span className="status-icon">{config.icon}</span>}
      <span className="status-text">{config.text}</span>
    </Tag>
  );
};

export default RmaStatusBadge; 