import React, { useEffect, useState } from 'react';
import { productLineService, ProductLine } from '../api/services';

interface ProductLineListProps {
  maxItems?: number;
}

const ProductLineList: React.FC<ProductLineListProps> = ({ maxItems = 10 }) => {
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductLines = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productLineService.getProductLines({
          per_page: maxItems,
          status: 'publish'
        });

        setProductLines(response.items || []);
      } catch (err: any) {
        console.error('Error fetching product lines:', err);
        setError(err.message || 'Failed to fetch product lines');
      } finally {
        setLoading(false);
      }
    };

    fetchProductLines();
  }, [maxItems]);

  if (loading) {
    return <div className="loading">Loading product lines...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (productLines.length === 0) {
    return <div className="empty">No product lines found</div>;
  }

  return (
    <div className="product-line-list">
      <h2>Product Lines</h2>
      <ul>
        {productLines.map((productLine) => (
          <li key={productLine.id} className="product-line-item">
            <div className="product-line-header">
              <h3>{productLine.title_zh || productLine.title_en}</h3>
              <span className="product-line-code">{productLine.code}</span>
            </div>
            {productLine.image_url && (
              <img 
                src={productLine.image_url} 
                alt={productLine.title_zh || productLine.title_en} 
                className="product-line-image" 
              />
            )}
            <p className="product-line-description">
              {productLine.description_zh || productLine.description_en || 'No description available'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductLineList; 