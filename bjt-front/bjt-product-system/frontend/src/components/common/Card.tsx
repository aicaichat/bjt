import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  noPadding?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  bodyClassName = '',
  footerClassName = '',
  elevation = 'md',
  noPadding = false,
  hoverable = true,
  bordered = false,
}) => {
  // 获取阴影类名
  const getShadowClass = (): string => {
    switch (elevation) {
      case 'none':
        return '';
      case 'sm':
        return 'shadow-sm';
      case 'lg':
        return 'shadow-lg';
      case 'md':
      default:
        return 'shadow-md';
    }
  };

  // 生成卡片类名
  const cardClasses = [
    'bg-white rounded-lg',
    bordered ? 'border border-gray-200' : '',
    getShadowClass(),
    hoverable ? 'transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg' : '',
    className
  ].filter(Boolean).join(' ');

  // 生成标题类名
  const headerTitleClasses = [
    'text-xl font-semibold text-gray-800',
    titleClassName
  ].filter(Boolean).join(' ');

  // 生成副标题类名
  const headerSubtitleClasses = [
    'text-sm text-gray-600 mt-1',
    subtitleClassName
  ].filter(Boolean).join(' ');

  // 生成内容类名
  const bodyClasses = [
    !noPadding ? 'p-4' : '',
    bodyClassName
  ].filter(Boolean).join(' ');

  // 生成底部类名
  const footerClasses = [
    'px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg',
    footerClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className="px-4 pt-4 pb-2">
          {title && <div className={headerTitleClasses}>{title}</div>}
          {subtitle && <div className={headerSubtitleClasses}>{subtitle}</div>}
        </div>
      )}
      
      <div className={bodyClasses}>{children}</div>
      
      {footer && <div className={footerClasses}>{footer}</div>}
    </div>
  );
};

export default Card; 