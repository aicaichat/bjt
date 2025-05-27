import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    setToasts(prev => {
      const newToasts = [...prev, { ...toast, id, onClose: () => {} }];
      // 限制最大Toast数量
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts);
      }
      return newToasts;
    });
    
    return id;
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    hideAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={hideToast}
        />
      ))}
    </ToastContext.Provider>
  );
};

// 便捷的Hook函数
export const useToastNotifications = () => {
  const { showToast } = useToast();

  const success = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    });
  }, [showToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options
    });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    });
  }, [showToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    });
  }, [showToast]);

  return { success, error, warning, info };
}; 