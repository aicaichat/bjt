import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';
import { productLineService, ProductLine } from '../../api/services';
import { Loading, Error } from '../../components/common';
import { useTranslation } from 'react-i18next';
import { useMockData, IMAGE_BASE_URL } from '../../config/env';
import { ROUTES } from '../../config/routes';
import { Modal } from 'antd';

// 占位图片路径
const placeholderImage = `${IMAGE_BASE_URL}/images/placeholders/placeholder-300x200.jpg`;

// 定义Home页面组件
const Home: React.FC = () => {
  const { t, i18n } = useTranslation(['home', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 当前语言，基于i18n.language
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';

  // 获取产品线数据
  useEffect(() => {
    const fetchProductLines = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 使用productLineService获取产品线数据
        const response = await productLineService.getProductLines({
          per_page: 4,
          status: 'publish'
        });
        
        // 设置获取到的产品线数据
        setProductLines(response.items);
      } catch (error: any) {
        console.error('Failed to fetch product lines:', error);
        setError(t('errors.loadingFailed', { ns: 'translation' }));
      } finally {
        setLoading(false);
      }
    };

    fetchProductLines();
  }, [i18n.language, t]);

  // 处理产品链接点击事件，未登录时显示登录提示
  const handleProductLinkClick = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      
      // 显示登录提示对话框
      Modal.confirm({
        title: t('loginRequired', { ns: 'common' }),
        content: t('loginPrompt', { ns: 'common' }),
        okText: t('login', { ns: 'common' }),
        cancelText: t('cancel', { ns: 'common' }),
        onOk: () => {
          // 重定向到登录页面，并记录用户尝试访问的页面以便登录后重定向回来
          navigate('/login', { state: { from: path } });
        }
      });
    }
  };
  
  // 获取产品线标题
  const getTitle = (line: ProductLine) => 
    currentLanguage === 'en' ? line.title_en : line.title_zh;
  
  // 获取产品线描述
  const getDescription = (line: ProductLine) => 
    currentLanguage === 'en' ? line.description_en : line.description_zh;
  
  // 获取产品线图片
  const getImage = (line: ProductLine) => 
    line.image_url ? `${IMAGE_BASE_URL}${line.image_url}` : placeholderImage;

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
      {/* 顶部横幅 */}
      <section className="hero">
        <div className="hero-content">
          <h1>{t('welcome')}</h1>
          <p>{t('slogan')}</p>
          <div className="hero-buttons">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  {t('enterDashboard')}
                </Link>
                <Link to="/machines" className="btn btn-secondary btn-large">
                  {t('browseProducts')}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-large">
                  {t('login', { ns: 'common' })}
                </Link>
                <Link to="/guide" className="btn btn-secondary btn-large">
                  {t('systemGuide')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* 产品线分类区域 */}
      <section className="product-line-section">
        <div className="container">
          <h2 className="section-title">{t('productLines')}</h2>
          <div className="product-line-grid">
            {productLines.length > 0 ? (
              productLines.map((line) => (
                <div key={line.id} className="product-line-card">
                  <div className="product-line-image">
                    <img src={getImage(line)} alt={getTitle(line)} />
                  </div>
                  <div className="product-line-content">
                    <h3>{getTitle(line)}</h3>
                    <p>{getDescription(line)}</p>
                    <Link 
                      to={`/products?line=${line.id}`} 
                      className="view-products-btn"
                      onClick={(e) => handleProductLinkClick(e, `/products?line=${line.id}`)}
                    >
                      {t('viewProducts')}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-product-lines">
                <p>{t('noProductLines')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* 特色功能区域 */}
      <section className="feature-section">
        <div className="container">
          <h2 className="section-title">{t('features')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t('productManagement')}</h3>
              <p>{t('productManagementDesc')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>{t('productSearch')}</h3>
              <p>{t('productSearchDesc')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🛒</div>
              <h3>{t('orderManagement')}</h3>
              <p>{t('orderManagementDesc')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>{t('apiIntegration')}</h3>
              <p>{t('apiIntegrationDesc')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 关于系统区域 */}
      <section className="about-section">
        <div className="container">
          <h2 className="section-title">{t('aboutSystem')}</h2>
          <div className="about-content">
            <p>{t('aboutSystemDesc')}</p>
            <div className="about-buttons">
              <Link to="/support?type=download" className="btn btn-outline">
                {t('documentDownload')}
              </Link>
              <Link to="/support?type=service" className="btn btn-outline">
                {t('afterSalesService')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 