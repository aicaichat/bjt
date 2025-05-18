import React, { useEffect, useState } from 'react';
import { SparePart, SparePartService } from '../api/services/spare-part.service';

// 创建备件服务实例
const sparePartService = new SparePartService();

interface SparePartListProps {
  pageSize?: number;
  showCompatibility?: boolean;
  maxItems?: number;
}

const SparePartList: React.FC<SparePartListProps> = ({ 
  pageSize = 10,
  showCompatibility = false,
  maxItems
}) => {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState<boolean>(false);

  // 获取备件列表
  useEffect(() => {
    const fetchSpareParts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await sparePartService.getSpareParts({
          page: currentPage,
          page_size: maxItems || pageSize,
          status: 'publish'
        });
        
        setSpareParts(response.items || []);
        setTotalPages(response.total_pages || 1);
      } catch (err: any) {
        setError(err.message || '获取备件列表失败');
        console.error('Error fetching spare parts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSpareParts();
  }, [currentPage, pageSize, maxItems]);
  
  // 获取备件兼容性信息
  const fetchCompatibility = async (partId: number) => {
    if (!showCompatibility) return;
    
    setCompatibilityLoading(true);
    setCompatibility(null);
    
    try {
      const compatibilityData = await sparePartService.getSparePartCompatibility(partId);
      setCompatibility(compatibilityData);
      setSelectedPart(partId);
    } catch (err: any) {
      console.error('Error fetching compatibility:', err);
    } finally {
      setCompatibilityLoading(false);
    }
  };
  
  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // 处理备件点击
  const handlePartClick = (partId: number) => {
    if (selectedPart === partId) {
      setSelectedPart(null);
      setCompatibility(null);
    } else {
      fetchCompatibility(partId);
    }
  };
  
  // 渲染分页控件
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => handlePageChange(i)}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          上一页
        </button>
        {pages}
        <button 
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          下一页
        </button>
      </div>
    );
  };
  
  // 渲染兼容性信息
  const renderCompatibility = () => {
    if (!compatibility || !showCompatibility) return null;
    
    return (
      <div className="compatibility-info">
        <h3>兼容型号</h3>
        {compatibility.compatible_models && compatibility.compatible_models.length > 0 ? (
          <ul className="compatible-models">
            {compatibility.compatible_models.map((model: any) => (
              <li key={model.id} className="compatible-model">
                <div className="model-image">
                  {model.image_url && <img src={model.image_url} alt={model.title} />}
                </div>
                <div className="model-info">
                  <h4>{model.title}</h4>
                  <p>型号: {model.model_name}</p>
                  <p>类型: {model.type}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>没有兼容型号信息</p>
        )}
        
        {compatibility.serial_number_info && compatibility.serial_number_info.length > 0 && (
          <>
            <h3>序列号信息</h3>
            <ul className="serial-number-info">
              {compatibility.serial_number_info.map((info: any, index: number) => (
                <li key={index} className="serial-info">
                  {info.type === 'range' && (
                    <p>范围: {info.range_start} - {info.range_end}</p>
                  )}
                  {info.type === 'prefix' && (
                    <p>前缀: {info.value}</p>
                  )}
                  {info.type === 'exact' && (
                    <p>精确匹配: {info.value}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };
  
  // 渲染加载状态
  if (loading && spareParts.length === 0) {
    return <div className="loading">加载中...</div>;
  }
  
  // 渲染错误状态
  if (error) {
    return <div className="error">错误: {error}</div>;
  }
  
  // 渲染空状态
  if (spareParts.length === 0) {
    return <div className="empty-state">没有找到备件</div>;
  }
  
  // 渲染备件列表
  return (
    <div className="spare-part-list">
      <h2>备件列表</h2>
      
      <div className="spare-parts">
        {spareParts.map(part => (
          <div 
            key={part.id} 
            className={`spare-part-card ${selectedPart === part.id ? 'selected' : ''}`}
            onClick={() => handlePartClick(part.id)}
          >
            <div className="part-image">
              {part.image_url && <img src={part.image_url} alt={part.name} />}
            </div>
            <div className="part-info">
              <h3>{part.name}</h3>
              <p className="part-number">零件编号: {part.part_number}</p>
              <p className="part-description">{part.description}</p>
              <div className="part-meta">
                <span className="part-price">价格: ¥{part.price.toFixed(2)}</span>
                <span className="part-stock">库存: {part.stock_quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {renderPagination()}
      
      {compatibilityLoading && (
        <div className="compatibility-loading">加载兼容性信息...</div>
      )}
      
      {renderCompatibility()}
    </div>
  );
};

export default SparePartList; 