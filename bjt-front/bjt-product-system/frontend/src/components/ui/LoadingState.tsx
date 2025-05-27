import React from 'react';
import './LoadingState.css';

export interface LoadingStateProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  className?: string;
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'medium',
  text,
  overlay = false,
  className = '',
  type = 'spinner'
}) => {
  const renderSpinner = () => (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="loading-spinner-circle"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`loading-dots loading-dots-${size}`}>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse loading-pulse-${size}`}>
      <div className="loading-pulse-circle"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`loading-skeleton loading-skeleton-${size}`}>
      <div className="loading-skeleton-line loading-skeleton-line-1"></div>
      <div className="loading-skeleton-line loading-skeleton-line-2"></div>
      <div className="loading-skeleton-line loading-skeleton-line-3"></div>
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={`loading-state loading-state-${size} ${className}`}>
      {renderLoader()}
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState; 