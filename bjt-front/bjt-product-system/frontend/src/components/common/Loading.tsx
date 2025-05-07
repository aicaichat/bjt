import React from 'react';
import { Spin, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import './common.css';

interface LoadingProps {
  tip?: string;
  fullPage?: boolean;
  className?: string;
  size?: 'small' | 'default' | 'large';
  progress?: number; // 进度值（0-100）
  showProgress?: boolean; // 是否显示进度条
  spinDelay?: number; // 延迟显示Loading的时间（毫秒）
  nested?: boolean; // 是否嵌套在其他组件中
}

/**
 * 通用加载组件
 * @param tip 提示文本，默认使用i18n中的"loading"
 * @param fullPage 是否全页面加载
 * @param className 额外的CSS类名
 * @param size 加载图标大小
 * @param progress 进度值（0-100）
 * @param showProgress 是否显示进度条
 * @param spinDelay 延迟显示Loading的时间（毫秒）
 * @param nested 是否嵌套在其他组件中
 */
const Loading: React.FC<LoadingProps> = ({ 
  tip, 
  fullPage = false, 
  className = '',
  size = 'large',
  progress,
  showProgress = false,
  spinDelay = 0,
  nested = false
}) => {
  const { t } = useTranslation();
  const loadingTip = tip || t('loading', 'Loading...');
  const [showSpin, setShowSpin] = React.useState(spinDelay === 0);
  
  // 如果设置了延迟，则在延迟后显示加载组件
  React.useEffect(() => {
    if (spinDelay > 0) {
      const timer = setTimeout(() => {
        setShowSpin(true);
      }, spinDelay);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [spinDelay]);
  
  if (!showSpin) {
    return null;
  }

  // 只有在fullPage或nested时才使用tip属性
  // Ant Design's Spin 组件的tip属性在非嵌套模式下会显示警告
  const isFullPageOrNested = fullPage || nested;
  
  const spinProps = {
    size,
    ...(fullPage || nested ? { tip: isFullPageOrNested ? loadingTip : undefined } : {}),
  };

  return (
    <div className={`loading-container ${fullPage ? 'full-page' : ''} ${nested ? 'nested' : ''} ${className}`}>
      <div className="loading-content">
        <Spin {...spinProps} />
        
        {!isFullPageOrNested && loadingTip && (
          <div className="loading-tip">{loadingTip}</div>
        )}
        
        {showProgress && typeof progress === 'number' && (
          <div className="loading-progress">
            <Progress 
              percent={Math.min(Math.max(progress, 0), 100)} 
              status={progress >= 100 ? 'success' : 'active'} 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Loading; 