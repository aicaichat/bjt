import React from 'react';
import { useProductInfo, useProductDisplayName, useProductImage } from '../../hooks/useProductInfo';
import './ProductCard.css';

export interface ProductCardProps {
  partNumber: string;
  quantity?: number;
  price?: number;
  showPrice?: boolean;
  showQuantity?: boolean;
  showSpecs?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
}

// 价格格式化函数
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(price);
};

const ProductCard: React.FC<ProductCardProps> = ({
  partNumber,
  quantity = 1,
  price,
  showPrice = false,
  showQuantity = true,
  showSpecs = true,
  size = 'medium',
  onClick,
  className = ''
}) => {
  const { productInfo, loading, error } = useProductInfo(partNumber);
  const displayName = useProductDisplayName(partNumber);
  const imageUrl = useProductImage(partNumber);

  if (loading) {
    return (
      <div className={`product-card loading ${size} ${className}`}>
        <div className="product-card-image skeleton"></div>
        <div className="product-card-content">
          <div className="skeleton-text skeleton-title"></div>
          <div className="skeleton-text skeleton-subtitle"></div>
        </div>
      </div>
    );
  }

  if (error || !productInfo) {
    console.log('[ProductCard] 产品信息获取失败:', {
      partNumber,
      error,
      productInfo,
      displayName,
      imageUrl
    });
    
    return (
      <div className={`product-card error ${size} ${className}`} onClick={onClick}>
        <div className="product-card-image">
          <img 
            src={imageUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%22120%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E'} 
            alt="产品图片" 
          />
        </div>
        <div className="product-card-content">
          <div className="product-card-title">
            {displayName || partNumber || '未知产品'}
          </div>
          <div className="product-card-subtitle text-error">
            料号: {partNumber}
          </div>
          {showSpecs && (
            <div className="product-card-specs">
              <span>产品类型: 耗材</span>
            </div>
          )}
          {error && <div className="error-message">加载失败: {error}</div>}
          {showPrice && price && (
            <div className="product-card-price">
              {formatPrice(price * quantity)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`product-card ${size} ${className}`} onClick={onClick}>
      <div className="product-card-image">
        <img 
          src={imageUrl} 
          alt={displayName}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%22120%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
          }}
        />
        {showQuantity && quantity > 1 && (
          <div className="product-card-quantity-badge">
            x{quantity}
          </div>
        )}
      </div>
      
      <div className="product-card-content">
        <div className="product-card-title">{displayName}</div>
        <div className="product-card-subtitle">
          料号: {partNumber}
        </div>
        
        {showSpecs && (productInfo.spec || productInfo.voltage) && (
          <div className="product-card-specs">
            {productInfo.spec && <span>{productInfo.spec}</span>}
            {productInfo.voltage && <span>电压: {productInfo.voltage}</span>}
            {productInfo.unit && <span>单位: {productInfo.unit}</span>}
          </div>
        )}
        
        {showPrice && price && (
          <div className="product-card-price">
            {formatPrice(price * quantity)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 