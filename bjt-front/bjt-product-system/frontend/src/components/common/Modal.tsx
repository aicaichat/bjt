import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  centered?: boolean;
  showCloseButton?: boolean;
  className?: string;
  backdropClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  centered = false,
  showCloseButton = true,
  className = '',
  backdropClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // 获取大小类名
  const getSizeClass = (): string => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-3xl';
      case 'xl':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-full m-4';
      case 'md':
      default:
        return 'max-w-xl';
    }
  };

  // 生成modal容器类名
  const modalClasses = [
    'fixed inset-0 z-[var(--z-index-modal)] flex items-start justify-center',
    'p-4 overflow-y-auto',
    centered ? 'items-center' : 'items-start pt-16',
    className
  ].filter(Boolean).join(' ');

  // 生成背景类名
  const backdropClasses = [
    'fixed inset-0 bg-black bg-opacity-40 transition-opacity',
    'z-[var(--z-index-modal-backdrop)]',
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
    backdropClassName
  ].filter(Boolean).join(' ');

  // 生成内容类名
  const contentClasses = [
    'bg-white rounded-lg shadow-lg relative z-10 w-full',
    'transform transition-all duration-300 ease-out',
    getSizeClass(),
    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
    contentClassName
  ].filter(Boolean).join(' ');

  // 如果不显示，返回null
  if (!isOpen) return null;

  return (
    <div className={modalClasses} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      {/* 背景 */}
      <div className={backdropClasses} aria-hidden="true"></div>
      
      {/* 内容 */}
      <div className={contentClasses} ref={modalRef}>
        {/* 标题栏 */}
        {(title || showCloseButton) && (
          <div className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${headerClassName}`}>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            
            {showCloseButton && (
              <button
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
                aria-label="关闭"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* 内容区域 */}
        <div className={`px-6 py-4 ${bodyClassName}`}>
          {children}
        </div>
        
        {/* 底部 */}
        {footer && (
          <div className={`px-6 py-4 border-t border-gray-200 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal; 