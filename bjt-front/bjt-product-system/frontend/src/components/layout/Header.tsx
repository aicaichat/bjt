import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/header.css';
import '../../styles/header-search-right.css';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, getI18nLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Menu, Dropdown, Button, Space, Divider, Badge, Input } from 'antd';
import { DownOutlined, MenuOutlined, UserOutlined, ShoppingCartOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons';
// 导入环境变量
import { IMAGE_BASE_URL } from '../../config/env';
import { IMAGES } from '../../config/constants';
// 导入安全渲染工具
import { safeRender, safeRenderProduct } from '../../utils/renderUtils';
import classNames from 'classnames';
// 导入购物车上下文
import { useCart } from '../../contexts/CartContext';

export interface HeaderProps {
  className?: string;
  onLanguageChange?: (language: string) => void;
  onSearch?: (searchTerm: string) => void;
}

/**
 * 超级安全渲染函数，专门处理产品对象类型
 */
const safeSuperRender = (value: any): string => {
  // 检查是否是产品对象 - 有多个相关字段
  const isProductObject = value && typeof value === 'object' && (
    ('model' in value && 'sku' in value) || 
    ('types' in value && 'specs' in value) ||
    ('quantity' in value && 'detailInfo' in value) ||
    ('sections' in value && 'properties' in value)
  );

  if (isProductObject) {
    console.warn('检测到产品对象直接渲染，已安全处理:', value);
    return safeRenderProduct(value);
  }

  // 一般性安全渲染
  return safeRender(value);
};

/**
 * 安全渲染包装组件 - 捕获渲染错误
 */
const SafeContent: React.FC<{children: React.ReactNode}> = ({ children }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Render error in SafeContent:', error);
    return <span>[Content Error]</span>;
  }
};

const Header = ({
  className = '',
  onLanguageChange,
  onSearch,
}: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, getI18nLanguage } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  // 获取购物车数据
  const { items: cartItems = [], itemCount } = useCart();

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLanguageChange = (e: { key: string }) => {
    changeLanguage(e.key);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const changeLanguage = (lang: string) => {
    // Map from i18next language code to internal language code
    const internalLang = lang === 'zh' ? 'cn' : 'en';
    i18n.changeLanguage(lang);
    setLanguage(internalLang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      // 可以导航到搜索结果页面或触发搜索
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // 移动端原生语言切换
  const handleMobileLanguageChange = () => {
    const newLang = language === 'cn' ? 'en' : 'zh';
    changeLanguage(newLang);
  };

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">{t('header.profile')}</Link>
    },
    {
      key: 'orders',
      label: <Link to="/orders">{t('header.orders')}</Link>
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: t('header.logout'),
      onClick: handleLogout
    }
  ];

  // 语言菜单
  const languageMenuItems = [
    {
      key: 'zh',
      label: '中文',
      onClick: () => changeLanguage('zh'),
    },
    {
      key: 'en',
      label: 'English',
      onClick: () => changeLanguage('en'),
    }
  ];

  // 修复语言显示
  const currentLanguageDisplay = language === 'cn' ? '中文' : 'English';

  return (
    <header ref={headerRef} className={classNames('main-header', className)}>
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* 左侧空白区域或其他内容 */}
        <div className="left-section flex items-center">
          {/* 可以在这里添加其他左侧内容 */}
        </div>

        <div className="right-section flex items-center space-x-4">
          {/* 搜索框 - 移动到右侧 */}
          <div className="search-container-right">
            <Input
              placeholder={t('header.searchPlaceholder', '搜索产品...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearchSubmit}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              prefix={<SearchOutlined />}
              className={classNames('search-input-right', {
                'search-focused': isSearchFocused
              })}
              allowClear
            />
          </div>
          {/* 语言切换 */}
          <Dropdown 
            menu={{ items: languageMenuItems }} 
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<GlobalOutlined />} className="action-button language-button">
              <SafeContent>
                {safeRender(currentLanguageDisplay)}
              </SafeContent>
            </Button>
          </Dropdown>

          {/* 购物车 */}
          {(user || location.pathname !== '/') && (
            <Link to="/cart" className="cart-link">
              <Badge count={itemCount} size="small">
                <Button type="text" icon={<ShoppingCartOutlined />} className="action-button">
                  {!isMobile && safeRender(t('header.cart'))}
                </Button>
              </Badge>
            </Link>
          )}

          {/* 用户菜单 */}
          {user ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" className="user-info">
                <div className="user-avatar">
                  {safeRender(user.name).charAt(0).toUpperCase()}
                </div>
                {!isMobile && <span className="user-name">{safeRender(user.name)}</span>}
              </Button>
            </Dropdown>
          ) : (
            <button className="login-button" onClick={handleLogin}>
              {safeRender(t('header.login'))}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;