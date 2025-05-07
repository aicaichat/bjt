import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import './Notification.css';

// 通知类型
type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 通知接口
interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

// 通知上下文接口
interface NotificationContextType {
  notifications: Notification[];
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeNotification: (id: string) => void;
}

// 创建通知上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 默认消息显示时间(毫秒)
const DEFAULT_NOTIFICATION_DURATION = 3000;

// 通知提供者组件
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 生成唯一id
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 添加通知
  const addNotification = useCallback((type: NotificationType, message: string, title?: string, duration?: number) => {
    const id = generateId();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration: duration || DEFAULT_NOTIFICATION_DURATION
    };

    setNotifications(prev => [...prev, notification]);

    return id;
  }, []);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // 成功通知
  const success = useCallback((message: string, title?: string) => {
    return addNotification('success', message, title);
  }, [addNotification]);

  // 错误通知
  const error = useCallback((message: string, title?: string) => {
    return addNotification('error', message, title);
  }, [addNotification]);

  // 警告通知
  const warning = useCallback((message: string, title?: string) => {
    return addNotification('warning', message, title);
  }, [addNotification]);

  // 信息通知
  const info = useCallback((message: string, title?: string) => {
    return addNotification('info', message, title);
  }, [addNotification]);

  // 自动移除通知
  useEffect(() => {
    // 检查是否有需要自动移除的通知
    const timers = notifications.map(notification => {
      return setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    });

    // 清理定时器
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        success,
        error,
        warning,
        info,
        removeNotification
      }}
    >
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            role="alert"
          >
            <div className="notification-content">
              {notification.title && (
                <div className="notification-title">{notification.title}</div>
              )}
              <div className="notification-message">{notification.message}</div>
            </div>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="关闭通知"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// 使用通知的钩子
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 