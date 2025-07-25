import React from 'react';
import './ProductModelCard.css';

interface ProductModelCardProps {
  value: string;
  label: string;
  imageSrc?: string;
  selected: boolean;
  onSelect: (value: string) => void;
  description?: string;
}

const ProductModelCard: React.FC<ProductModelCardProps> = ({
  value,
  label,
  imageSrc,
  selected,
  onSelect,
  description
}) => {
  const handleClick = () => {
    onSelect(value);
  };

  return (
    <div
      className={`product-model-card ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      {/* 选中状态指示器 */}
      <div className="selection-indicator">
        {selected && (
          <div className="check-icon">
            ✓
          </div>
        )}
      </div>

      {/* 产品型号图片 */}
      <div className="model-image-container">
        <img
          src={imageSrc || '/images/placeholder.jpg'}
          alt={label}
          className="model-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder.jpg';
          }}
        />
      </div>

      {/* 产品型号信息 */}
      <div className="model-info">
        <h4 className="model-name">{label}</h4>
        {description && (
          <p className="model-description">{description}</p>
        )}
      </div>
    </div>
  );
};

export default ProductModelCard; 