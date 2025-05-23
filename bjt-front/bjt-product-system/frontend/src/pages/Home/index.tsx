import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';
import productLineService, { ProductLine } from '../../api/services/product-line.service';
import { Loading, Error } from '../../components/common';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';

// 占位图片路径
const placeholderImage = '/images/placeholders/placeholder-300x200.svg';

const Home: React.FC = () => {
  const { t, i18n } = useTranslation('home');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 当前语言，基于i18n.language
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
  
  // 检查用户是否已登录，如果需要认证但未登录则重定向
  useEffect(() => {
    const isPublicPage = true; // Home页面是公开页面，可以由配置决定
    if (!user && !isPublicPage) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  // 获取产品线数据
  useEffect(() => {
    const fetchProductLines = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await productLineService.getProductLines({
          status: 'publish',
          per_page: 100,
          page: currentPage
        });
        
        setProductLines(response.items);
        setTotalPages(response.total_pages);
      } catch (error: any) {
        console.error('Failed to fetch product lines:', error);
        setError(t('errors.failedToLoadProducts'));
      } finally {
        setLoading(false);
      }
    };

    fetchProductLines();
  }, [i18n.language, currentPage, t]);

  // 处理产品链接点击事件
  const handleProductLinkClick = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      navigate('/login', { state: { from: path } });
    }
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 根据当前语言获取标题
  const getTitle = (line: ProductLine) => currentLanguage === 'en' ? line.title_en : line.title_zh;
  
  // 根据当前语言获取描述
  const getDescription = (line: ProductLine) => currentLanguage === 'en' ? line.description_en : line.description_zh;
  
  // 使用统一的加载组件
  if (loading) {
    return <Loading fullPage={true} />;
  }

  // 使用统一的错误组件
  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="home-page">
      <main className="container">
        {productLines.map((line: ProductLine) => (
          <div key={line.id} className="product-section">
            <div className="section-header">
              {getTitle(line)}
            </div>
            <div className="section-content">
              <div className="section-text">
                <p className="introduction">{t('introduction')}</p>
                <div className="divider"></div>
                <p>{getDescription(line)}</p>
                
                <div className="product-links">
                  <Link 
                    to={`${ROUTES.MACHINES}?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `${ROUTES.MACHINES}?category=${line.id}`)}
                  >
                    {t('links.machines')} 
                  </Link>
                  <Link 
                    to={`${ROUTES.CONSUMABLES}?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `${ROUTES.CONSUMABLES}?category=${line.id}`)}
                  >
                    {t('links.consumables')}
                  </Link>
                  <Link 
                    to={`${ROUTES.SPARE_PARTS}?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `${ROUTES.SPARE_PARTS}?category=${line.id}`)}
                  >
                    {t('links.spareParts')}
                  </Link>
                </div>
              </div>
              <div className="section-image">
                <img src={line.image_url || placeholderImage} alt={getTitle(line)} />
              </div>
            </div>
          </div>
        ))}
        
        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home; 