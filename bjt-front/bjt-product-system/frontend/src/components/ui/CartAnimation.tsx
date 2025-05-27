import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './CartAnimation.css';

export interface CartAnimationProps {
  isActive: boolean;
  startElement?: HTMLElement | null;
  targetElement?: HTMLElement | null;
  productImage?: string;
  productName?: string;
  onComplete?: () => void;
}

const CartAnimation: React.FC<CartAnimationProps> = ({
  isActive,
  startElement,
  targetElement,
  productImage,
  productName,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isActive && startElement && targetElement) {
      const startRect = startElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      setStartPosition({
        x: startRect.left + startRect.width / 2,
        y: startRect.top + startRect.height / 2
      });

      setTargetPosition({
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2
      });

      setIsVisible(true);

      // 动画完成后的回调
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isActive, startElement, targetElement, onComplete]);

  if (!isVisible) return null;

  const animationElement = (
    <div className="cart-animation-container">
      {/* 飞行的产品图片 */}
      <div
        className="cart-animation-item"
        style={{
          left: startPosition.x,
          top: startPosition.y,
          '--target-x': `${targetPosition.x - startPosition.x}px`,
          '--target-y': `${targetPosition.y - startPosition.y}px`
        } as React.CSSProperties}
      >
        {productImage ? (
          <img 
            src={productImage} 
            alt={productName || '产品'} 
            className="cart-animation-image"
          />
        ) : (
          <div className="cart-animation-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
            </svg>
          </div>
        )}
      </div>

      {/* 成功反馈 */}
      <div
        className="cart-animation-success"
        style={{
          left: targetPosition.x,
          top: targetPosition.y
        }}
      >
        <div className="cart-animation-success-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="cart-animation-success-text">已添加到购物车</div>
      </div>

      {/* 粒子效果 */}
      <div
        className="cart-animation-particles"
        style={{
          left: targetPosition.x,
          top: targetPosition.y
        }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="cart-animation-particle"
            style={{
              '--delay': `${index * 0.1}s`,
              '--angle': `${index * 60}deg`
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(animationElement, document.body);
};

export default CartAnimation; 