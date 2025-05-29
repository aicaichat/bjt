import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/global.css';
import '../../styles/header.css';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, getI18nLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Menu, Dropdown, Button, Space, Divider, Badge } from 'antd';
import { DownOutlined, MenuOutlined, UserOutlined, ShoppingCartOutlined, GlobalOutlined } from '@ant-design/icons';
// 导入环境变量
import { IMAGE_BASE_URL } from '../../config/env';
import { IMAGES } from '../../config/constants';
// 导入安全渲染工具
import { safeRender, safeRenderProduct } from '../../utils/renderUtils';
import classNames from 'classnames';
// 导入购物车上下文
import { useCart } from '../../contexts/CartContext';

interface NavSubItem {
  label: string;
  url: string;
}

interface NavSection {
  title: string;
  items: NavSubItem[];
}

interface NavItem {
  label: string;
  path: string;
  children?: NavSection[];
  simpleDropdown?: NavSubItem[];
  requiresAuth?: boolean;
}

export interface HeaderProps {
  logo?: string;
  navItems?: NavItem[];
  className?: string;
  onLanguageChange?: (language: string) => void;
}

// 内联样式声明logo图片路径
const logoImage = IMAGES.LOGO;

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
 * 确保导航标签安全渲染
 */
const renderNavLabel = (label: any): string => {
  try {
    const { t } = useTranslation();
    // 尝试翻译文本，然后确保安全渲染
    if (typeof label === 'string') {
      return safeRender(t(label));
    }
    return safeRender(label);
  } catch (error) {
    console.error('Error rendering nav label:', error);
    return safeRender(label, '[Label]');
  }
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
  logo = logoImage, // 使用导入的logo图片
  navItems = [
    { label: 'nav.home', path: '/', requiresAuth: false },
    { 
      label: 'nav.products', // 确保使用翻译键，而不是对象
      path: '/products',
      requiresAuth: false,
      children: [
        { 
          title: 'Air Cushioning System',
          items: [
            { label: 'Air Cushion Machine & Accessory', url: '/machines?category=1' },
            { label: 'Film options', url: '/consumables?category=1' },
            { label: 'Spare parts', url: '/spare-parts?category=1' },
          ] 
        },
        { 
          title: 'Paper Cushioning System',
          items: [
            { label: 'Paper Cushion Machine & Accessory', url: '/machines?category=1' },
            { label: 'Paper options', url: '/consumables?category=1' },
            { label: 'Spare parts', url: '/spare-parts?category=1' },
          ] 
        },
        { 
          title: 'Water Cushioning System',
          items: [
            { label: 'Water Activated Tape Dispenser & Accessory', url: '/machines?category=1' },
            { label: 'Water Activated Tape options', url: '/consumables?category=1' },
            { label: 'Spare parts', url: '/spare-parts?category=1' },
          ] 
        }
      ]
    },
    { 
      label: 'support', 
      path: '/support',
      requiresAuth: false,
      simpleDropdown: [
        { label: 'After-sales service', url: '/support?type=service' },
        { label: 'Document Download', url: '/support?type=download' },
        { label: 'FAQ', url: '/support?type=faq' },
      ]
    },
    { label: 'contactUs', path: '/contact', requiresAuth: false }
  ],
  className = '',
  onLanguageChange,
}: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, getI18nLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  // 获取购物车数据
  const { items: cartItems = [], itemCount } = useCart();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      // 关闭菜单时也关闭所有下拉菜单
      setOpenDropdown(null);
      setUserMenuOpen(false);
    }
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

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

  // 根据认证状态筛选导航项
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || user
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

  // 渲染导航项目
  const renderNavItems = () => {
    return filteredNavItems.map((navItem, index) => {
      // 确保导航项标签是字符串，防止对象
      const navLabel = typeof navItem.label === 'string' ? navItem.label : 'nav.products';
      
      if (navItem.children) {
        // 复杂下拉菜单渲染
        return (
          <li key={`nav-${index}`} className="nav-item">
            <Dropdown
              menu={{
                items: navItem.children.map((section, sectionIndex) => ({
                  key: `section-${sectionIndex}`,
                  type: 'group',
                  label: safeRender(section.title),
                  children: section.items.map((item, itemIndex) => ({
                    key: `${sectionIndex}-${itemIndex}`,
                    label: (
                      <Link to={item.url}>
                        {safeRender(item.label)}
                      </Link>
                    ),
                  })),
                })),
              }}
              onOpenChange={(open: boolean) => toggleDropdown(navLabel)}
              open={openDropdown === navLabel}
            >
              <a
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown(navLabel);
                }}
                className={classNames('nav-link', {
                  active: location.pathname === navItem.path,
                })}
              >
                <SafeContent>
                  {safeRender(t(navLabel))}
                  <DownOutlined
                    className={classNames('dropdown-icon', {
                      open: openDropdown === navLabel,
                    })}
                  />
                </SafeContent>
              </a>
            </Dropdown>
          </li>
        );
      } else if (navItem.simpleDropdown) {
        // 简单下拉菜单渲染
        return (
          <li key={`nav-${index}`} className="nav-item">
            <Dropdown
              menu={{
                items: navItem.simpleDropdown.map((item, itemIndex) => ({
                  key: `simple-${itemIndex}`,
                  label: (
                    <Link to={item.url}>
                      {safeRender(item.label)}
                    </Link>
                  ),
                })),
              }}
              onOpenChange={(open: boolean) => toggleDropdown(navLabel)}
              open={openDropdown === navLabel}
            >
              <a
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown(navLabel);
                }}
                className={classNames('nav-link', {
                  active: location.pathname === navItem.path,
                })}
              >
                <SafeContent>
                  {safeRender(t(navLabel))}
                  <DownOutlined
                    className={classNames('dropdown-icon', {
                      open: openDropdown === navLabel,
                    })}
                  />
                </SafeContent>
              </a>
            </Dropdown>
          </li>
        );
      } else {
        // 普通导航项渲染
        return (
          <li key={`nav-${index}`} className="nav-item">
            <Link
              to={navItem.path}
              className={classNames('nav-link', {
                active: location.pathname === navItem.path,
              })}
            >
              <SafeContent>
                {safeRender(t(navLabel))}
              </SafeContent>
            </Link>
          </li>
        );
      }
    });
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
    <header ref={headerRef} className={classNames('main-header', className, { 'menu-open': isMobileMenuOpen })}>
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <a href="/" className="logo">
          <img src={logo} alt="Logo" />
        </a>

        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            {renderNavItems()}
          </ul>
        </nav>

        <div className="right-section flex items-center space-x-4">
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

          <Link to="/cart" className="cart-link">
            <Badge count={itemCount} size="small">
              <Button type="text" icon={<ShoppingCartOutlined />} className="action-button">
                {safeRender(t('header.cart'))}
              </Button>
            </Badge>
          </Link>

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