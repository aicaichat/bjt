import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Menu, Dropdown, Button, Space, Divider, Badge } from 'antd';
import { 
  DownOutlined, 
  MenuOutlined, 
  UserOutlined, 
  ShoppingCartOutlined, 
  GlobalOutlined,
  HomeOutlined,
  AppstoreOutlined,
  CustomerServiceOutlined,
  ContactsOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { safeRender } from '../../utils/renderUtils';
import classNames from 'classnames';
import { useCart } from '../../contexts/CartContext';
import '../../styles/sidebar.css';

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
  icon?: React.ReactNode;
  children?: NavSection[];
  simpleDropdown?: NavSubItem[];
  requiresAuth?: boolean;
}

export interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  className = '',
}: SidebarProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 导航项配置
  const navItems: NavItem[] = [
    { 
      label: 'nav.home', 
      path: '/', 
      icon: <HomeOutlined />,
      requiresAuth: false 
    },
    { 
      label: 'nav.products',
      path: '/products',
      icon: <AppstoreOutlined />,
      requiresAuth: false,
      children: [
        { 
          title: 'menu.Air Cushioning System',
          items: [
            { label: 'menu.Air Cushion Machine & Accessory', url: '/machines/product-line-1' },
            { label: 'menu.Film options', url: '/consumables?category=1' },
            { label: 'menu.Spare parts', url: '/spare-parts?category=1' },
          ] 
        },
        { 
          title: 'menu.Paper Cushioning System',
          items: [
            { label: 'menu.Paper Cushion Machine & Accessory', url: '/machines/product-line-2' },
            { label: 'menu.Paper options', url: '/consumables/product-line-2' },
            { label: 'menu.Spare parts', url: '/spare-parts?category=2' },
          ] 
        },
        { 
          title: 'menu.Water Activated Tape System',
          items: [
            { label: 'menu.Water Activated Tape Dispenser & Accessory', url: '/machines/product-line-3' },
            { label: 'menu.Water Activated Tape options', url: '/consumables/product-line-3' },
            { label: 'menu.Spare parts', url: '/spare-parts?category=3' },
          ] 
        },
        { 
          title: 'menu.Air Column Bag System',
          items: [
            { label: 'menu.Air Column Bag Products', url: 'https://www.lockedair.com/water-activated-tape-dispenser1/' },
          ] 
        }
      ]
    },
    { 
      label: 'nav.support',
      path: '/support',
      icon: <CustomerServiceOutlined />,
      requiresAuth: false,
      simpleDropdown: [
        { label: 'menu.After-sales service', url: '/rma' },
        { label: 'menu.Document Download', url: 'https://www.lockedair.com/document-download/' },
        { label: 'menu.FAQ', url: 'https://www.lockedair.com/faq/' },
      ]
    },
    { 
      label: 'nav.contactUs', 
      path: '/contact', 
      icon: <ContactsOutlined />,
      requiresAuth: false 
    }
  ];

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 根据认证状态筛选导航项
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || user
  );

  // 切换侧边栏展开/收起
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 切换移动端菜单
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // 生成菜单项
  const generateMenuItems = () => {
    return filteredNavItems.map((navItem, index) => {
      const navLabel = typeof navItem.label === 'string' ? navItem.label : 'nav.products';
      const key = `nav-${index}`;
      
      if (navItem.children) {
        // 复杂下拉菜单
        const children = navItem.children.map((section, sectionIndex) => ({
          key: `${key}-section-${sectionIndex}`,
          label: safeRender(t(section.title)),
          type: 'group' as const,
          children: section.items.map((item, itemIndex) => ({
            key: `${key}-section-${sectionIndex}-item-${itemIndex}`,
            label: item.url.startsWith('http') ? (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                {safeRender(t(item.label))}
                <span style={{ marginLeft: '4px', fontSize: '12px' }}>↗</span>
              </a>
            ) : (
              <Link to={item.url}>
                {safeRender(t(item.label))}
              </Link>
            ),
          })),
        }));

        return {
          key,
          icon: navItem.icon,
          label: safeRender(t(navLabel)),
          children,
        };
      } else if (navItem.simpleDropdown) {
        // 简单下拉菜单
        const children = navItem.simpleDropdown.map((item, itemIndex) => ({
          key: `${key}-simple-${itemIndex}`,
          label: item.url.startsWith('http') ? (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              {safeRender(t(item.label))}
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>↗</span>
            </a>
          ) : (
            <Link to={item.url}>
              {safeRender(t(item.label))}
            </Link>
          ),
        }));

        return {
          key,
          icon: navItem.icon,
          label: safeRender(t(navLabel)),
          children,
        };
      } else {
        // 普通菜单项
        return {
          key,
          icon: navItem.icon,
          label: (
            <Link to={navItem.path}>
              {safeRender(t(navLabel))}
            </Link>
          ),
        };
      }
    });
  };

  return (
    <>
      {/* 移动端菜单按钮 */}
      {isMobile && (
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      )}

      {/* 侧边栏遮罩 */}
      {isMobile && mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileMenu} />
      )}

      {/* 侧边栏 */}
      <div className={classNames('sidebar', className, {
        'collapsed': collapsed,
        'mobile-open': isMobile && mobileMenuOpen
      })}>
        {/* 侧边栏头部 */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/images/logo-1.webp" alt="BJT Tech Logo" />
          </div>
          {!collapsed && (
            <button className="sidebar-toggle" onClick={toggleCollapsed}>
              <CloseOutlined />
            </button>
          )}
        </div>

        {/* 导航菜单 */}
        <div className="sidebar-menu">
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            selectedKeys={[location.pathname]}
            items={generateMenuItems()}
            className="sidebar-menu-content"
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar; 