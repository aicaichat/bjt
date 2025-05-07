import React from 'react';
import { Alert, Button, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { ReloadOutlined, BugOutlined, LeftOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './common.css';

const { Paragraph, Text } = Typography;

// 错误类型枚举
export enum ErrorType {
  SYSTEM = 'system',
  NETWORK = 'network',
  API = 'api',
  AUTH = 'auth',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

interface ErrorMessageProps {
  message?: string;
  description?: string;
  errorCode?: string | number;
  errorType?: ErrorType;
  onRetry?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
  showDetails?: boolean;
  details?: string | React.ReactNode;
  className?: string;
  fullPage?: boolean;
}

/**
 * 通用错误消息组件
 * @param message 错误消息标题
 * @param description 错误详细描述
 * @param errorCode 错误代码
 * @param errorType 错误类型
 * @param onRetry 重试回调函数
 * @param showRetry 是否显示重试按钮
 * @param showGoBack 是否显示返回按钮
 * @param showGoHome 是否显示返回首页按钮
 * @param showDetails 是否显示详细错误信息
 * @param details 详细错误信息
 * @param className 额外的CSS类名
 * @param fullPage 是否全页面错误
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  description,
  errorCode,
  errorType = ErrorType.UNKNOWN,
  onRetry,
  showRetry = true,
  showGoBack = false,
  showGoHome = false,
  showDetails = false,
  details,
  className = '',
  fullPage = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDetailsVisible, setIsDetailsVisible] = React.useState(false);
  
  // 根据错误类型获取默认错误消息
  const getDefaultErrorMessage = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return t('error.networkError');
      case ErrorType.API:
        return t('error.apiError');
      case ErrorType.AUTH:
        return t('error.authError');
      case ErrorType.VALIDATION:
        return t('error.validationError');
      case ErrorType.NOT_FOUND:
        return t('error.notFoundError');
      case ErrorType.PERMISSION:
        return t('error.permissionError');
      case ErrorType.SYSTEM:
        return t('error.systemError');
      case ErrorType.UNKNOWN:
      default:
        return t('error.unknownError');
    }
  };
  
  const defaultMessage = t('error.title');
  const defaultDescription = getDefaultErrorMessage(errorType);
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const toggleDetails = () => {
    setIsDetailsVisible(!isDetailsVisible);
  };
  
  return (
    <div className={`error-container ${fullPage ? 'full-page' : ''} ${className}`}>
      <Alert
        type="error"
        message={message || defaultMessage}
        description={
          <div className="error-description">
            <Paragraph>
              {description || defaultDescription}
            </Paragraph>
            
            {errorCode && (
              <div className="error-code">
                <Text code>{t('error.code')}: {errorCode}</Text>
              </div>
            )}
            
            {showDetails && details && (
              <div className="error-details-section">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={toggleDetails}
                  className="details-toggle"
                >
                  {isDetailsVisible ? t('error.hideDetails') : t('error.showDetails')}
                </Button>
                
                {isDetailsVisible && (
                  <div className="error-details">
                    {typeof details === 'string' ? (
                      <Paragraph code className="error-details-text">
                        {details}
                      </Paragraph>
                    ) : (
                      details
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        }
        showIcon
        action={
          <Space direction="vertical" style={{ width: '100%' }}>
            {(showRetry && onRetry) || showGoBack || showGoHome ? (
              <div className="error-actions">
                {showRetry && onRetry && (
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={onRetry}
                  >
                    {t('error.retry')}
                  </Button>
                )}
                
                {showGoBack && (
                  <Button 
                    icon={<LeftOutlined />} 
                    onClick={handleGoBack}
                  >
                    {t('error.goBack')}
                  </Button>
                )}
                
                {showGoHome && (
                  <Button 
                    icon={<HomeOutlined />} 
                    onClick={handleGoHome}
                  >
                    {t('error.goHome')}
                  </Button>
                )}
              </div>
            ) : null}
          </Space>
        }
      />
    </div>
  );
};

export default ErrorMessage; 