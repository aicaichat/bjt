import React, { useEffect } from 'react';
import './Notification.css';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number; // 自动关闭的时间（毫秒），0表示不自动关闭
  onClose: () => void;
}

/**
 * 通知组件
 * 用于显示操作结果、错误信息等各类通知
 */
const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  // 自动关闭逻辑
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // 图标映射
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41L9,16.17z" />
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41z" />
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M1,21h22L12,2L1,21z M13,18h-2v-2h2V18z M13,14h-2v-4h2V14z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-6h2V17z M13,9h-2V7h2V9z" />
          </svg>
        );
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">{message}</div>
      <button className="notification-close" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41z" />
        </svg>
      </button>
    </div>
  );
};

export default Notification; 