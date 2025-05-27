import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';
// 替换原有的API导入为SQL Mock服务
import { useProductLines } from '../../hooks/useMockData';
import MockServiceStatus from '../../components/MockServiceStatus';
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
  
  // 使用useCallback稳定回调函数引用
  const handleSuccess = useCallback((data: any) => {
    console.log('✅ 首页产品线数据加载成功:', data);
  }, []);
  
  const handleError = useCallback((error: string) => {
    console.error('❌ 首页产品线数据加载失败:', error);
  }, []);
  
  // 使用SQL Mock数据服务Hook
  const { data: productLines, loading, error } = useProductLines({
    onSuccess: handleSuccess,
    onError: handleError
  });

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

  // 计算分页数据
  useEffect(() => {
    if (productLines && productLines.length > 0) {
      const itemsPerPage = 10;
      setTotalPages(Math.ceil(productLines.length / itemsPerPage));
    }
  }, [productLines]);

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
  const getTitle = (line: any) => currentLanguage === 'en' ? line.title_en : line.title_zh;
  
  // 根据当前语言获取描述
  const getDescription = (line: any) => currentLanguage === 'en' ? line.description_en : line.description_zh;
  
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
      {/* SQL Mock服务状态组件 */}
      <MockServiceStatus position="top-right" compact={true} hidden={true} />
      
      <main className="container">
        {productLines && productLines.map((line: any) => (
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