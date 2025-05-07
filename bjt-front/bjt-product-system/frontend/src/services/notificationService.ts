import { message, notification, Modal } from 'antd';
import { NotificationType } from '../contexts/NotificationContext';
import { NOTIFICATION } from '../config/appConfig';

// 回调注册器，用于在组件内部捕获通知
type NotifyCallback = (type: NotificationType, message: string, description?: string, options?: any) => void;
const callbacks: NotifyCallback[] = [];

/**
 * 注册通知回调，在组件中使用，以允许通过上下文显示通知
 * @param callback 回调函数
 * @returns 注销回调的方法
 */
export const registerNotifyCallback = (callback: NotifyCallback): () => void => {
  callbacks.push(callback);
  return () => {
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
};

/**
 * 全局通知服务
 * 当在React组件树外部使用时，使用antd的message组件
 * 当在React组件树内部使用时，使用注册的回调函数
 */
class NotificationService {
  /**
   * 显示成功通知
   * @param message 通知标题
   * @param description 通知描述
   * @param options 其他选项
   */
  success(title: string, description?: string, options?: any): void {
    if (callbacks.length > 0) {
      callbacks.forEach(callback => callback(NotificationType.SUCCESS, title, description, options));
    } else {
      // 在React组件树外部，使用antd message
      message.success({
        content: description ? `${title}: ${description}` : title,
        duration: options?.duration || NOTIFICATION.AUTO_DISMISS_TIMEOUT / 1000
      });
    }
  }

  /**
   * 显示错误通知
   * @param message 通知标题
   * @param description 通知描述
   * @param options 其他选项
   */
  error(title: string, description?: string, options?: any): void {
    if (callbacks.length > 0) {
      callbacks.forEach(callback => callback(NotificationType.ERROR, title, description, options));
    } else {
      // 在React组件树外部，使用antd message
      message.error({
        content: description ? `${title}: ${description}` : title,
        duration: options?.duration || NOTIFICATION.AUTO_DISMISS_TIMEOUT / 1000
      });
    }
  }

  /**
   * 显示警告通知
   * @param message 通知标题
   * @param description 通知描述
   * @param options 其他选项
   */
  warning(title: string, description?: string, options?: any): void {
    if (callbacks.length > 0) {
      callbacks.forEach(callback => callback(NotificationType.WARNING, title, description, options));
    } else {
      // 在React组件树外部，使用antd message
      message.warning({
        content: description ? `${title}: ${description}` : title,
        duration: options?.duration || NOTIFICATION.AUTO_DISMISS_TIMEOUT / 1000
      });
    }
  }

  /**
   * 显示信息通知
   * @param message 通知标题
   * @param description 通知描述
   * @param options 其他选项
   */
  info(title: string, description?: string, options?: any): void {
    if (callbacks.length > 0) {
      callbacks.forEach(callback => callback(NotificationType.INFO, title, description, options));
    } else {
      // 在React组件树外部，使用antd message
      message.info({
        content: description ? `${title}: ${description}` : title,
        duration: options?.duration || NOTIFICATION.AUTO_DISMISS_TIMEOUT / 1000
      });
    }
  }

  /**
   * 显示加载中通知
   * @param message 通知标题
   * @param description 通知描述
   * @returns 关闭加载通知的方法
   */
  loading(title: string, description?: string): () => void {
    // antd的message不支持NotificationType.LOADING，所以直接使用message.loading
    const hide = message.loading({
      content: description ? `${title}: ${description}` : title,
      duration: 0
    });
    return hide;
  }

  /**
   * 显示确认对话框
   * @param title 对话框标题
   * @param content 对话框内容
   * @param onOk 确认回调
   * @param onCancel 取消回调
   */
  confirm(title: string, content: string, onOk?: () => void, onCancel?: () => void): void {
    // 使用antd的Modal.confirm进行确认，避免手动操作DOM
    Modal.confirm({
      title,
      content,
      onOk: () => {
        if (onOk) onOk();
      },
      onCancel: () => {
        if (onCancel) onCancel();
      },
      okText: '确认',
      cancelText: '取消',
    });
  }
}

// 导出单例实例
export default new NotificationService(); 