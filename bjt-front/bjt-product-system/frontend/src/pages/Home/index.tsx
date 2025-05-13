import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { ProductLine } from '../../services/api';
import mockService, { mockProductLines } from '../../services/mockService';
import { Loading, Error } from '../../components/common';
import { useTranslation } from 'react-i18next';
import { useMockData, IMAGE_BASE_URL } from '../../config/env';
import { ROUTES } from '../../config/routes';

// 占位图片路径
const placeholderImage = `${IMAGE_BASE_URL}/images/placeholders/placeholder-300x200.svg`;

// 定义API响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
  total?: number;
  total_pages?: number;
}

// 定义分页数据类型
interface PaginatedData<T> {
  items: T[];
  total: number;
  total_pages: number;
}

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
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
        
        if (useMockData) {
          // 使用模拟数据
          await mockService.randomDelay(300, 800);
          const response = {
            success: true,
            data: mockProductLines,
            total: mockProductLines.length
          };
          
          setProductLines(response.data);
          if (response.total) {
            setTotalPages(Math.ceil(response.total / 10)); // 假设每页10条
          }
        } else {
          try {
            // 真实API直接返回数据数组
            const data = await apiService.getProductLines();
            setProductLines(data);
            setTotalPages(1); // 假设真实API不支持分页
          } catch (apiError) {
            setError(t('errors.failedToLoadProducts'));
            console.error('API error:', apiError);
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch product lines:', error);
        
        // 根据错误类型和错误码处理
        if (error.response && error.response.data) {
          const { message, code } = error.response.data;
          // 根据错误码显示不同的错误信息
          switch (code) {
            case 1001:
              setError(t('errors.authenticationFailed'));
              break;
            case 2001:
              setError(t('errors.productLineNotFound'));
              break;
            default:
              setError(message || t('errors.loadingFailed'));
          }
        } else {
          setError(t('errors.networkError'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductLines();
  }, [i18n.language, currentPage, t]);

  // 处理产品链接点击事件，直接重定向到登录页面而不是显示提示
  const handleProductLinkClick = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      // 直接重定向到登录页面，并记录用户尝试访问的页面以便登录后重定向回来
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
                <p className="introduction">{t('home.introduction')}</p>
                <div className="divider"></div>
                <p>{getDescription(line)}</p>
                
                <div className="product-links">
                  <Link 
                    to={`${ROUTES.MACHINES}?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `${ROUTES.MACHINES}?category=${line.id}`)}
                  >
                    {t('home.links.machines', 'View Machines')} 
                  </Link>
                  <Link 
                    to={`${ROUTES.CONSUMABLES}?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `${ROUTES.CONSUMABLES}?category=${line.id}`)}
                  >
                    {t('home.links.consumables', 'View Consumables')}
                  </Link>
                  <Link 
                    to={`${ROUTES.SPARE_PARTS}?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `${ROUTES.SPARE_PARTS}?category=${line.id}`)}
                  >
                    {t('home.links.spareParts', 'View Spare Parts')}
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