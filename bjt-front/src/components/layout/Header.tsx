import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/global.css';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

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

const Header: React.FC<HeaderProps> = ({
  logo = '/images/logo-1.webp',
  navItems = [
    { label: 'home', path: '/', requiresAuth: false },
    { 
      label: 'products', 
      path: '/products',
      requiresAuth: false,
      children: [
        { 
          title: 'Air Cushioning System',
          items: [
            { label: 'Air Cushion Machine & Accessory', url: '/products?category=air&type=machine' },
            { label: 'Film options', url: '/products?category=air&type=film' },
            { label: 'Spare parts', url: '/products?category=air&type=spare' },
          ] 
        },
        { 
          title: 'Paper Cushioning System',
          items: [
            { label: 'Paper Cushion Machine & Accessory', url: '/products?category=paper&type=machine' },
            { label: 'Paper options', url: '/products?category=paper&type=options' },
            { label: 'Spare parts', url: '/products?category=paper&type=spare' },
          ] 
        },
        { 
          title: 'Water Cushioning System',
          items: [
            { label: 'Water Activated Tape Dispenser & Accessory', url: '/products?category=water&type=dispenser' },
            { label: 'Water Activated Tape options', url: '/products?category=water&type=tape' },
            { label: 'Spare parts', url: '/products?category=water&type=spare' },
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
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, getTranslatedUserName } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as 'en' | 'cn';
    setLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
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

  return (
    <header id="header" className={`header ${isMenuOpen ? 'menu-open' : ''} ${className}`}>
      <div className="header-container container">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="BJT Logo" />
          </Link>
        </div>
        
        <div className="navigation">
          <nav>
            <ul className={`nav-menu ${isMenuOpen ? 'show' : ''}`}>
              {filteredNavItems.map((item) => (
                <li key={item.label} className={item.children || item.simpleDropdown ? 'dropdown' : ''}>
                  <Link 
                    to={item.path} 
                    className="nav-link"
                    onClick={(e) => {
                      if (item.children || item.simpleDropdown) {
                        e.preventDefault();
                        toggleDropdown(item.label);
                      } else {
                        setIsMenuOpen(false);
                      }
                    }}
                  >
                    {t(item.label, item.label)}
                  </Link>
                  
                  {item.children && (
                    <div className={`dropdown-menu ${openDropdown === item.label ? 'show' : ''}`}>
                      {item.children.map((section) => (
                        <div key={section.title} className="dropdown-section">
                          <h3 className="dropdown-title">{section.title}</h3>
                          <ul className="dropdown-list">
                            {section.items.map((subitem) => (
                              <li key={subitem.label}>
                                <Link
                                  to={subitem.url}
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    setIsMenuOpen(false);
                                  }}
                                >
                                  {subitem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {item.simpleDropdown && (
                    <div className={`dropdown-menu ${openDropdown === item.label ? 'show' : ''}`}>
                      <ul className="dropdown-list">
                        {item.simpleDropdown.map((subitem) => (
                          <li key={subitem.label}>
                            <Link
                              to={subitem.url}
                              onClick={() => {
                                setOpenDropdown(null);
                                setIsMenuOpen(false);
                              }}
                            >
                              {subitem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="header-right">
          <select
            className="language-select"
            onChange={handleLanguageChange}
            value={language}
          >
            <option value="en">🇬🇧 {t('english')}</option>
            <option value="cn">🇨🇳 {t('chinese')}</option>
          </select>
          
          {user ? (
            <div className="user-dropdown">
              <button 
                className="user-info flex items-center space-x-2"
                onClick={(e) => {
                  e.preventDefault();
                  toggleUserMenu();
                }}
              >
                <div className="user-avatar">
                  {getTranslatedUserName(user.name).charAt(0).toUpperCase()}
                </div>
                <span className="user-name">
                  {getTranslatedUserName(user.name)}
                </span>
              </button>
              <div className={`dropdown-menu ${userMenuOpen ? 'show' : ''}`}>
                <ul className="dropdown-list">
                  <li><Link to="/profile" onClick={() => setUserMenuOpen(false)}>{t('profile')}</Link></li>
                  <li><Link to="/orders" onClick={() => setUserMenuOpen(false)}>{t('myOrders')}</Link></li>
                  <li>
                    <button onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}>
                      {t('logout')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <button
              className="login-btn"
              onClick={handleLogin}
            >
              {t('login')}
            </button>
          )}
          
          <button 
            className="mobile-menu-toggle" 
            aria-label="Toggle menu"
            onClick={toggleMenu}
          >
            <span className="hamburger-icon"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;