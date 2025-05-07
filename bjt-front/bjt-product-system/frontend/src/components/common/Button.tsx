import React from 'react';
import '../../styles/global.css';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  // 根据尺寸生成样式
  const getSizeClass = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-3';
      case 'lg':
        return 'text-lg py-3 px-6';
      case 'md':
      default:
        return 'text-sm py-2 px-4';
    }
  };

  // 生成按钮类名
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    getSizeClass(),
    fullWidth ? 'w-full' : '',
    isLoading ? 'opacity-70 cursor-wait' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      type={props.type || 'button'}
      {...props}
    >
      {isLoading && (
        <span className="loading-spinner mr-2" aria-hidden="true">
          {/* 简单的加载动画 */}
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="icon-left mr-2">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {icon && iconPosition === 'right' && (
        <span className="icon-right ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button; 