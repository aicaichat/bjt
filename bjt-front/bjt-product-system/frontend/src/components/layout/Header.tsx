import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../../styles/header.css';
import '../../styles/header-search-right.css';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, getI18nLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Menu, Dropdown, Button, Space, Divider, Badge, Input } from 'antd';
import { DownOutlined, UserOutlined, ShoppingCartOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons';
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

  /**
   * 顶栏横向入口：仅移动端渲染（侧栏为抽屉时需快捷跳转）。
   * 桌面端完整 IA 在 Sidebar，避免与侧栏 Home / 各产品线 / Support / Contact 重复堆叠。
   */
  const topNavItems = useMemo(
    (): Array<{ to: string; labelKey: string; end?: boolean }> => [
      { to: '/', labelKey: 'nav.home', end: true },
      { to: '/machines', labelKey: 'nav.machines' },
      { to: '/consumables', labelKey: 'nav.consumables' },
      { to: '/support', labelKey: 'nav.support' },
      { to: '/contact', labelKey: 'nav.contactUs' },
    ],
    []
  );

  return (
    <header ref={headerRef} className={classNames('main-header', className)}>
      <div className="main-header__inner">
        {/* 品牌：桌面由 figma-front-shell 隐藏，仅侧栏出现一次 logo；移动端侧栏为抽屉时此处保留 */}
        <div className="header-figma-brand">
          <div className="header-figma-brand__logos">
            <img src="/images/logo-1.webp" alt="BJT" className="header-figma-brand__bjt-img" />
            {!isMobile && (
              <div className="header-figma-brand__wordmark" aria-hidden={false}>
                <span className="header-figma-brand__line1">Locked Air®</span>
                <span className="header-figma-brand__line2">LOCKED PAPER™</span>
              </div>
            )}
          </div>
        </div>

        {isMobile ? (
          <nav
            className="header-top-nav left-section flex min-w-0 items-center justify-center gap-1 overflow-x-auto sm:gap-3"
            aria-label={t('header.topNavAria')}
          >
            {topNavItems.map(({ to, labelKey, end: navEnd }) => (
              <NavLink
                key={to}
                to={to}
                end={navEnd ?? false}
                className={({ isActive }) =>
                  classNames('header-top-nav__link', {
                    'header-top-nav__link--active': isActive,
                  })
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
        ) : null}

        {/* Figma 顺序：搜索 → 购物车 → 语言 → 用户 */}
        <div className="right-section header-toolbar-figma flex shrink-0 flex-nowrap items-center">
          <div className="search-container-right shrink min-w-0">
            <Input
              placeholder={t('header.searchPlaceholder', '搜索产品')}
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

          <Link to="/cart" className="cart-link shrink-0">
            <Badge count={itemCount} size="small">
              <Button type="text" icon={<ShoppingCartOutlined />} className="action-button header-toolbar-btn">
                {!isMobile && <span>{safeRender(t('header.cart'))}</span>}
              </Button>
            </Badge>
          </Link>

          <Dropdown
            menu={{ items: languageMenuItems }}
            trigger={['click']}
            placement="bottomRight"
            overlayStyle={{ zIndex: 'var(--ff-z-header-dropdown)' }}
          >
            <Button
              type="text"
              icon={<GlobalOutlined />}
              className="action-button language-button header-toolbar-btn shrink-0"
            >
              {!isMobile && (
                <SafeContent>{safeRender(currentLanguageDisplay)}</SafeContent>
              )}
            </Button>
          </Dropdown>

          {user ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{ zIndex: 'var(--ff-z-header-dropdown)' }}
            >
              <Button type="text" className="user-info header-toolbar-btn shrink-0">
                <div className="user-avatar">
                  {safeRender(user.name).charAt(0).toUpperCase()}
                </div>
                {!isMobile && <span className="user-name">{safeRender(user.name)}</span>}
              </Button>
            </Dropdown>
          ) : (
            <Button
              type="text"
              icon={<UserOutlined />}
              className="action-button header-toolbar-btn header-toolbar-login-icon shrink-0"
              onClick={handleLogin}
              aria-label={safeRender(t('header.login'))}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;