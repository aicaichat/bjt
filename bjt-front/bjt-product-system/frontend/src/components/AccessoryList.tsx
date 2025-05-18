import React, { useEffect, useState } from 'react';
import { accessoryService, Accessory, AccessoryChild } from '../api/services';
import '../styles/AccessoryList.css';

interface AccessoryListProps {
  productLineId?: number;
  maxItems?: number;
  showChildren?: boolean;
}

const AccessoryList: React.FC<AccessoryListProps> = ({ 
  productLineId,
  maxItems = 10,
  showChildren = false
}) => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedAccessory, setSelectedAccessory] = useState<number | null>(null);
  const [children, setChildren] = useState<Record<string, AccessoryChild[]>>({});
  const [childrenLoading, setChildrenLoading] = useState<boolean>(false);

  // 获取配件列表
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await accessoryService.getAccessories({
          page: currentPage,
          per_page: maxItems,
          status: 'publish',
          product_line_id: productLineId
        });

        setAccessories(response.items || []);
        setTotalPages(response.total_pages || 1);
      } catch (err: any) {
        console.error('Error fetching accessories:', err);
        setError(err.message || 'Failed to fetch accessories');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessories();
  }, [currentPage, maxItems, productLineId]);

  // 获取配件子配件
  const fetchChildren = async (accessoryId: number) => {
    if (!showChildren) return;
    
    try {
      setChildrenLoading(true);
      
      const response = await accessoryService.getAccessoryChildren(accessoryId);
      setChildren(response.items || {});
      setSelectedAccessory(accessoryId);
    } catch (err: any) {
      console.error(`Error fetching children for accessory ${accessoryId}:`, err);
    } finally {
      setChildrenLoading(false);
    }
  };

  // 处理配件点击
  const handleAccessoryClick = (accessoryId: number) => {
    if (selectedAccessory === accessoryId) {
      setSelectedAccessory(null);
      setChildren({});
    } else {
      fetchChildren(accessoryId);
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedAccessory(null);
    setChildren({});
  };

  if (loading) {
    return <div className="loading">Loading accessories...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (accessories.length === 0) {
    return <div className="empty">No accessories found</div>;
  }

  return (
    <div className="accessory-list">
      <h2>Accessories</h2>
      <div className="accessory-grid">
        {accessories.map((accessory) => (
          <div 
            key={accessory.id} 
            className={`accessory-card ${selectedAccessory === accessory.id ? 'selected' : ''}`}
            onClick={() => handleAccessoryClick(accessory.id)}
          >
            <div className="accessory-image">
              {accessory.image_url && (
                <img 
                  src={accessory.image_url} 
                  alt={accessory.name_zh || accessory.name_en} 
                />
              )}
            </div>
            <div className="accessory-info">
              <h3>{accessory.name_zh || accessory.name_en}</h3>
              <div className="accessory-model">{accessory.model}</div>
              <div className="accessory-part-number">{accessory.part_number}</div>
              <p className="accessory-spec">{accessory.spec}</p>
              <div className="accessory-meta">
                <span className="accessory-voltage">{accessory.voltage}</span>
                <span className="accessory-frequency">{accessory.frequency}</span>
              </div>
            </div>
            
            {showChildren && selectedAccessory === accessory.id && (
              <div className="accessory-children">
                {childrenLoading ? (
                  <div className="loading">Loading children...</div>
                ) : (
                  <>
                    <h4>Components</h4>
                    {children[accessory.id] && children[accessory.id].length > 0 ? (
                      <ul className="children-list">
                        {children[accessory.id].map((child) => (
                          <li key={child.id} className="child-item">
                            <div className="child-image">
                              {child.image_url && (
                                <img 
                                  src={child.image_url} 
                                  alt={child.name_zh || child.name_en} 
                                />
                              )}
                            </div>
                            <div className="child-info">
                              <h5>{child.name_zh || child.name_en}</h5>
                              <div className="child-part-number">{child.part_number}</div>
                              <div className="child-quantity">Quantity: {child.quantity}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No components found</p>
                    )}
                  </>
                )}
              </div>
            )}
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

export default AccessoryList; 