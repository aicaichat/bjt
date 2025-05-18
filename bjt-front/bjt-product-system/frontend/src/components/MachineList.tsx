import React, { useEffect, useState } from 'react';
import { machineService, Machine } from '../api/services';

interface MachineListProps {
  productLineId?: number;
  maxItems?: number;
}

const MachineList: React.FC<MachineListProps> = ({ 
  productLineId,
  maxItems = 10 
}) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await machineService.getMachines({
          page: currentPage,
          per_page: maxItems,
          status: 'publish',
          product_line_id: productLineId
        });

        setMachines(response.items || []);
        setTotalPages(response.total_pages || 1);
      } catch (err: any) {
        console.error('Error fetching machines:', err);
        setError(err.message || 'Failed to fetch machines');
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, [currentPage, maxItems, productLineId]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="loading">Loading machines...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (machines.length === 0) {
    return <div className="empty">No machines found</div>;
  }

  return (
    <div className="machine-list">
      <h2>Machines</h2>
      <div className="machine-grid">
        {machines.map((machine) => (
          <div key={machine.id} className="machine-card">
            <div className="machine-image">
              {machine.image_url && (
                <img 
                  src={machine.image_url} 
                  alt={machine.title_zh || machine.title_en} 
                />
              )}
            </div>
            <div className="machine-info">
              <h3>{machine.title_zh || machine.title_en}</h3>
              <div className="machine-code">{machine.code}</div>
              <p className="machine-description">
                {machine.description_zh || machine.description_en || 'No description available'}
              </p>
              <div className="machine-type">
                <span className="label">Type:</span>
                <span className="value">{machine.type}</span>
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

export default MachineList; 