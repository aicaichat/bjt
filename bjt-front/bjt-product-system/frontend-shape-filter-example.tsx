// ShapeFilterExample.tsx - 形状筛选组件示例
import React, { useState, useEffect } from 'react';
import './ShapeFilter.scss';

interface ShapeData {
  id: string;          // 形状代码，如 "MEX", "MFB" 等
  code: string;        // 形状代码
  name: string;        // 当前语言的显示名称
  name_zh: string;     // 中文名称
  name_en: string;     // 英文名称
  image_url: string;   // 主图片URL
  image_url2?: string; // 备用图片URL
  sort_order: number;  // 排序
  product_line_id: number;
  original_id: number; // 数据库原始ID
}

interface ConsumableApiResponse {
  data: {
    items: any[];
    filterOptions: {
      shapes: ShapeData[];
    };
  };
}

const ShapeFilterExample: React.FC = () => {
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');
  const [loading, setLoading] = useState(true);

  // 获取形状数据
  useEffect(() => {
    const fetchShapes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/wp-json/bjt/v1/consumables?limit=1');
        const data: ConsumableApiResponse = await response.json();
        
        console.log('形状筛选选项数据:', data.data.filterOptions.shapes);
        
        // 按排序顺序排列形状
        const sortedShapes = data.data.filterOptions.shapes.sort(
          (a, b) => a.sort_order - b.sort_order
        );
        
        setShapes(sortedShapes);
      } catch (error) {
        console.error('获取形状数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShapes();
  }, []);

  // 获取形状显示名称
  const getShapeDisplayName = (shape: ShapeData): string => {
    if (currentLanguage === 'zh') {
      return shape.name_zh || shape.name || shape.code;
    } else {
      return shape.name_en || shape.name || shape.code;
    }
  };

  // 获取形状图片URL
  const getShapeImageUrl = (shape: ShapeData): string => {
    // 优先使用主图片
    if (shape.image_url) {
      return shape.image_url;
    }
    
    // 备用图片
    if (shape.image_url2) {
      return shape.image_url2;
    }
    
    // 默认图片
    return '/images/shapes/default-shape.png';
  };

  // 处理形状选择
  const handleShapeChange = (shapeId: string) => {
    setSelectedShape(shapeId);
    console.log('选择的形状:', shapeId);
    
    // 这里可以触发筛选逻辑
    // onShapeFilter && onShapeFilter(shapeId);
  };

  // 图片加载错误处理
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    img.src = '/images/shapes/default-shape.png';
  };

  if (loading) {
    return (
      <div className="shape-filter-loading">
        <div className="loading-spinner"></div>
        <span>正在加载形状选项...</span>
      </div>
    );
  }

  return (
    <div className="shape-filter-container">
      {/* 语言切换按钮 */}
      <div className="language-toggle">
        <button 
          className={currentLanguage === 'zh' ? 'active' : ''}
          onClick={() => setCurrentLanguage('zh')}
        >
          中文
        </button>
        <button 
          className={currentLanguage === 'en' ? 'active' : ''}
          onClick={() => setCurrentLanguage('en')}
        >
          English
        </button>
      </div>

      {/* 形状筛选选项 */}
      <div className="shape-filter">
        <h3 className="filter-title">
          {currentLanguage === 'zh' ? '选择袋型形状' : 'Select Bag Shape'}
        </h3>
        
        {/* 全选选项 */}
        <div className="shape-option all-option">
          <input 
            type="radio"
            id="shape-all"
            name="shape"
            value="all"
            checked={selectedShape === 'all'}
            onChange={() => handleShapeChange('all')}
          />
          <label htmlFor="shape-all" className="shape-label all-label">
            <div className="all-icon">📋</div>
            <span className="shape-name">
              {currentLanguage === 'zh' ? '全部形状' : 'All Shapes'}
            </span>
          </label>
        </div>

        {/* 具体形状选项 */}
        <div className="shapes-grid">
          {shapes.map((shape) => (
            <div key={shape.id} className="shape-option">
              <input 
                type="radio"
                id={`shape-${shape.id}`}
                name="shape"
                value={shape.id}
                checked={selectedShape === shape.id}
                onChange={() => handleShapeChange(shape.id)}
              />
              <label htmlFor={`shape-${shape.id}`} className="shape-label">
                {/* 形状图片 */}
                <div className="shape-image-container">
                  <img 
                    src={getShapeImageUrl(shape)} 
                    alt={getShapeDisplayName(shape)}
                    className="shape-image"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  {/* 选中状态指示器 */}
                  <div className="selection-indicator">
                    <div className="checkmark">✓</div>
                  </div>
                </div>
                
                {/* 形状信息 */}
                <div className="shape-info">
                  <span className="shape-name">
                    {getShapeDisplayName(shape)}
                  </span>
                  <span className="shape-code">
                    {shape.code}
                  </span>
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* 无数据提示 */}
        {shapes.length === 0 && (
          <div className="no-shapes">
            <span>
              {currentLanguage === 'zh' ? '暂无形状选项' : 'No shape options available'}
            </span>
          </div>
        )}
      </div>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h4>调试信息</h4>
          <p>当前选择: {selectedShape}</p>
          <p>可用形状数量: {shapes.length}</p>
          <details>
            <summary>形状数据详情</summary>
            <pre>{JSON.stringify(shapes, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ShapeFilterExample; 
 
 