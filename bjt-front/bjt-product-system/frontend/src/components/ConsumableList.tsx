import React, { useEffect, useState } from 'react';
import { consumableService, Consumable } from '../api/services';
import '../styles/ConsumableList.css';

interface ConsumableListProps {
  productLineId?: number;
  maxItems?: number;
}

const ConsumableList: React.FC<ConsumableListProps> = ({
  productLineId,
  maxItems = 10
}) => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 获取耗材列表
  useEffect(() => {
    const fetchConsumables = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await consumableService.getConsumables({
          page: currentPage,
          per_page: maxItems,
          status: 'publish',
          product_line_id: productLineId
        });

        setConsumables(response.items || []);
        setTotalPages(response.total_pages || 1);
      } catch (err: any) {
        console.error('Error fetching consumables:', err);
        setError(err.message || 'Failed to fetch consumables');
      } finally {
        setLoading(false);
      }
    };

    fetchConsumables();
  }, [currentPage, maxItems, productLineId]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="loading">Loading consumables...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (consumables.length === 0) {
    return <div className="empty">No consumables found</div>;
  }

  return (
    <div className="consumable-list">
      <h2>Consumables</h2>
      <div className="consumable-grid">
        {consumables.map((consumable) => (
          <div key={consumable.id} className="consumable-card">
            <div className="consumable-image">
              {consumable.image_url && (
                <img 
                  src={consumable.image_url} 
                  alt={consumable.name_zh || consumable.name_en} 
                />
              )}
            </div>
            <div className="consumable-info">
              <h3>{consumable.name_zh || consumable.name_en}</h3>
              <div className="consumable-model">{consumable.model}</div>
              <div className="consumable-part-number">{consumable.part_number}</div>
              <p className="consumable-spec">{consumable.spec}</p>
              <div className="consumable-meta">
                <div className="consumable-price">
                  ¥{consumable.unit_price.toFixed(2)}/{consumable.unit}
                </div>
                <div className="consumable-stock">
                  <span className={`stock-indicator ${consumable.stock > 10 ? 'in-stock' : 'low-stock'}`}></span>
                  Stock: {consumable.stock}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="prev-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`page-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button 
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="next-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ConsumableList; 