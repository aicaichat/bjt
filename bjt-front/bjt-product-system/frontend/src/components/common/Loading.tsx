import React from 'react';
import { Spin, Progress, SpinProps } from 'antd';
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

// 安全渲染函数，确保值被转换为字符串
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'object') {
    // 检查是否是React元素
    if (value.$$typeof) {
      return '[React Element]';
    }
    // 检查是否是包含特定键的对象（可能导致错误的对象）
    if (value.products || value.productDetails || value.cart || value.order || value.machines || value.accessories) {
      console.warn('Loading component detected problematic object with keys:', Object.keys(value));
      return 'Loading...';
    }
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
};

// 安全的翻译函数
const safeTranslate = (t: any, key: string, fallback: string = key): string => {
  try {
    const result = t(key);
    if (typeof result === 'string') {
      return result;
    }
    if (typeof result === 'object') {
      console.warn(`Loading component: Translation for '${key}' returned an object:`, result);
      return fallback;
    }
    return String(result) || fallback;
  } catch (error) {
    console.warn(`Loading component: Translation error for key '${key}':`, error);
    return fallback;
  }
};

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
  
  // 安全处理tip和翻译
  const safeTip = tip ? safeRender(tip) : safeTranslate(t, 'loading', 'Loading...');
  const loadingTip = safeTip || 'Loading...';
  
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

  // 根据Ant Design文档，tip只能在fullScreen模式或嵌套模式下使用
  const spinProps: SpinProps = {
    size,
  };

  // 只有在全屏模式或嵌套模式下才使用tip属性
  if (fullPage || nested) {
    spinProps.tip = loadingTip;
  }

  return (
    <div className={`loading-container ${fullPage ? 'full-page' : ''} ${nested ? 'nested' : ''} ${className}`}>
      <div className="loading-content">
        <Spin {...spinProps} />
        
        {/* 非全屏/非嵌套模式下，手动显示提示文本 */}
        {!(fullPage || nested) && loadingTip && (
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