import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
// 使用真实API替换Mock数据服务
import { useProductLines } from '../../hooks/useRealProductLines';
import { Loading, Error } from '../../components/common';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';

// 占位图片路径
const placeholderImage = '/images/placeholders/placeholder-300x200.svg';

// 产品链接图标映射 - 专业to B版本
const getProductLinkIcon = (index: number) => {
  const icons = [
    'machine', // 机器设备 - 使用专业机械图标
    'supply',  // 耗材 - 使用供应链图标
    'service'  // 备件 - 使用服务图标
  ];
  return icons[index] || 'machine';
};

const Home: React.FC = () => {
  const { t, i18n } = useTranslation('home');
  const { user } = useAuth();
  const { theme, mode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 使用useCallback稳定回调函数引用
  const handleSuccess = useCallback((data: any) => {
    console.log('✅ 首页产品线数据加载成功 (真实API):', data);
  }, []);
  
  const handleError = useCallback((error: string) => {
    console.error('❌ 首页产品线数据加载失败 (真实API):', error);
  }, []);
  
  // 使用真实API数据服务Hook
  const { data: productLines, loading, error } = useProductLines({
    onSuccess: handleSuccess,
    onError: handleError,
    per_page: 20, // 首页显示更多产品线
    status: 'publish' // 只显示已发布的产品线
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 当前语言，基于i18n.language
  const currentLanguage = i18n.language.includes('zh') ? 'zh' : 'en';
  
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

  // 健壮获取标题
  const getTitle = (line: any) => {
    if (currentLanguage === 'en' && line.title_en) return line.title_en;
    if (currentLanguage === 'zh' && line.title_zh) return line.title_zh;
    return line.title_en || line.title_zh || '';
  };
  // 健壮获取描述
  const getDescription = (line: any) => {
    if (currentLanguage === 'en' && line.description_en) return line.description_en;
    if (currentLanguage === 'zh' && line.description_zh) return line.description_zh;
    return line.description_en || line.description_zh || '';
  };
  // 获取子标题/子链接文案
  const getSubitem1 = (line: any) => {
    if (currentLanguage === 'en' && line.subitem1_en) return line.subitem1_en;
    if (currentLanguage === 'zh' && line.subitem1_zh) return line.subitem1_zh;
    return line.subitem1_en || line.subitem1_zh || '';
  };
  const getSubitem2 = (line: any) => {
    if (currentLanguage === 'en' && line.subitem2_en) return line.subitem2_en;
    if (currentLanguage === 'zh' && line.subitem2_zh) return line.subitem2_zh;
    return line.subitem2_en || line.subitem2_zh || '';
  };
  const getSubitem3 = (line: any) => {
    if (currentLanguage === 'en' && line.subitem3_en) return line.subitem3_en;
    if (currentLanguage === 'zh' && line.subitem3_zh) return line.subitem3_zh;
    return line.subitem3_en || line.subitem3_zh || '';
  };

  // 创建产品链接数据
  const createProductLinks = (line: any) => {
    const links = [
      {
        text: getSubitem1(line),
        path: `${ROUTES.MACHINES}?category=${line.id}`,
        icon: getProductLinkIcon(0)
      },
      {
        text: getSubitem2(line),
        path: `${ROUTES.CONSUMABLES}?category=${line.id}`,
        icon: getProductLinkIcon(1)
      },
      {
        text: getSubitem3(line),
        path: `${ROUTES.SPARE_PARTS}?category=${line.id}`,
        icon: getProductLinkIcon(2)
      }
    ];
    return links.filter(link => link.text); // 过滤掉空文本的链接
  };
  
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
        {/* 产品线展示 */}
        {productLines && productLines.map((line: any, lineIndex: number) => (
          <div key={line.id} className="product-section">
            <div className="section-header">
              {getTitle(line)}
            </div>
            <div className="section-content">
              <div className="section-text">
                <h3 className="introduction">{getTitle(line)}</h3>
                <div className="divider"></div>
                <p>{getDescription(line)}</p>
                
                {/* 革命性的产品链接设计 */}
                <div className="product-links">
                  {createProductLinks(line).map((linkData, index) => (
                    <Link 
                      key={index}
                      to={linkData.path}
                      className="product-link" 
                      onClick={(e) => handleProductLinkClick(e, linkData.path)}
                    >
                      <div className="product-link-content">
                        <div 
                          className="product-link-icon"
                          data-icon={linkData.icon}
                        ></div>
                        <div className="product-link-text">
                          {linkData.text}
                        </div>
                      </div>
                    </Link>
                  ))}
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
                <span>{page}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home; 