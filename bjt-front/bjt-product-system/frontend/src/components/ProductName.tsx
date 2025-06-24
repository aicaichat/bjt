import React from 'react';
import { useProductName } from '../hooks/useProductName';

interface ProductNameProps {
  product: any;
  className?: string;
}

/**
 * 产品名称显示组件
 * 自动根据当前语言显示正确的产品名称
 */
export const ProductName: React.FC<ProductNameProps> = ({ product, className }) => {
  const name = useProductName(product);
  return <span className={className}>{name}</span>;
};

export default ProductName; 