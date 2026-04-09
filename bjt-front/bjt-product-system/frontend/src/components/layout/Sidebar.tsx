import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Menu } from 'antd';
import { MenuOutlined, CreditCardOutlined } from '@ant-design/icons';
import {
  NavIconHome,
  NavIconAirCushion,
  NavIconPaper,
  NavIconWaterTape,
  NavIconAirColumn,
  NavIconSupport,
  NavIconContact,
} from './sidebarNavIcons';
import { safeRender } from '../../utils/renderUtils';
import classNames from 'classnames';
import '../../styles/sidebar.css';
import '../../styles/sidebar-figma.css';

interface NavSubItem {
  label: string;
  url: string;
  /** Figma 二级行左侧图标（如 Pay by Card 信用卡） */
  leadingIcon?: React.ReactNode;
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
  /** 无子菜单时打开外部页（图一气柱袋为直达、无折叠箭头） */
  externalHref?: string;
  requiresAuth?: boolean;
}

export interface SidebarProps {
  className?: string;
  /** 桌面端侧栏是否收起（由 MainLayout 持有，与主区/顶栏 --bjt-sidebar-effective-width 联动） */
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  collapsed,
  onCollapsedChange,
}: SidebarProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 导航项配置
  const navItems: NavItem[] = [
    { 
      label: 'nav.home', 
      path: '/', 
      icon: <NavIconHome />,
      requiresAuth: false 
    },
    { 
      label: 'menu.Air Cushioning System',
      path: '/air-cushioning',
      icon: <NavIconAirCushion />,
      requiresAuth: false,
      simpleDropdown: [
        { label: 'menu.Air Cushion Machine & Accessory', url: '/machines/product-line-1' },
        { label: 'menu.Film options', url: '/consumables?category=1' },
        { label: 'menu.Spare parts', url: '/spare-parts?category=1' },
      ]
    },
    { 
      label: 'menu.Paper Cushioning System',
      path: '/paper-cushioning',
      icon: <NavIconPaper />,
      requiresAuth: false,
      simpleDropdown: [
        { label: 'menu.Paper Cushion Machine & Accessory', url: '/machines/product-line-2' },
        { label: 'menu.Paper options', url: '/consumables/product-line-2' },
        { label: 'menu.Spare parts', url: '/spare-parts?category=2' },
      ]
    },
    { 
      label: 'menu.Water Activated Tape System',
      path: '/water-tape',
      icon: <NavIconWaterTape />,
      requiresAuth: false,
      simpleDropdown: [
        { label: 'menu.Water Activated Tape Dispenser & Accessory', url: '/machines/product-line-3' },
        { label: 'menu.Water Activated Tape options', url: '/consumables/product-line-3' },
        { label: 'menu.Spare parts', url: '/spare-parts?category=3' },
      ]
    },
    {
      label: 'menu.Air Column Bag System',
      path: '/air-column-bag',
      icon: <NavIconAirColumn />,
      requiresAuth: false,
      externalHref: 'https://www.lockedair.com/water-activated-tape-dispenser1/',
    },
    { 
      label: 'nav.support',
      path: '/support',
      icon: <NavIconSupport />,
      requiresAuth: false,
      simpleDropdown: [
        { label: 'menu.After-sales service', url: '/rma' },
        { label: 'menu.Document Download', url: 'https://www.lockedair.com/document-download/' },
        { label: 'menu.FAQ', url: 'https://www.lockedair.com/faq/' },
        {
          label: 'menu.Pay by Card',
          url: '/checkout',
          leadingIcon: <CreditCardOutlined className="sidebar-sub-leading-anticon" />,
        },
      ]
    },
    { 
      label: 'nav.contactUs', 
      path: '/contact', 
      icon: <NavIconContact />,
      requiresAuth: false 
    }
  ];

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredNavItems = useMemo(
    () => navItems.filter(item => !item.requiresAuth || user),
    [user]
  );

  /** 与菜单项 key 一致：含 query，便于二级「_machine & Accessory」等选中态（Figma 深蓝底+白字） */
  const selectedKeys = useMemo(() => {
    const full = `${location.pathname}${location.search || ''}`;
    return [full === '' ? '/' : full];
  }, [location.pathname, location.search]);

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search || ''}`;
    const next: string[] = [];
    filteredNavItems.forEach(navItem => {
      if (!navItem.simpleDropdown) return;
      const hit = navItem.simpleDropdown.some(
        sub => !sub.url.startsWith('http') && sub.url === fullPath
      );
      if (hit) next.push(navItem.path);
    });
    setOpenKeys(next);
  }, [location.pathname, location.search, filteredNavItems]);

  const subMenuItemKey = (parentPath: string, item: NavSubItem, itemIndex: number) =>
    item.url.startsWith('http') ? `${parentPath}__ext-${itemIndex}` : item.url;

  const wrapSubContent = (item: NavSubItem, content: React.ReactNode) => (
    <span className="sidebar-sub-link-inner">
      {item.leadingIcon ? (
        <span className="sidebar-sub-leading-wrap" aria-hidden>
          {item.leadingIcon}
        </span>
      ) : null}
      {content}
    </span>
  );

  // 切换侧边栏展开/收起
  const toggleCollapsed = () => {
    if (!isMobile) {
      onCollapsedChange(!collapsed);
    }
  };

  // 切换移动端菜单
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const generateMenuItems = () => {
    return filteredNavItems.map((navItem, index) => {
      const navLabel = typeof navItem.label === 'string' ? navItem.label : 'nav.products';
      const fallbackKey = `nav-${index}`;

      if (navItem.children) {
        const children = navItem.children.map((section, sectionIndex) => ({
          key: `${fallbackKey}-section-${sectionIndex}`,
          label: safeRender(t(section.title)),
          type: 'group' as const,
          children: section.items.map((item, itemIndex) => ({
            key: `${fallbackKey}-section-${sectionIndex}-item-${itemIndex}`,
            label: item.url.startsWith('http') ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-sub-external"
              >
                {wrapSubContent(item, (
                  <>
                    {safeRender(t(item.label))}
                    <span className="sidebar-ext-icon">↗</span>
                  </>
                ))}
              </a>
            ) : (
              <Link to={item.url} className="sidebar-sub-link">
                {wrapSubContent(item, safeRender(t(item.label)))}
              </Link>
            ),
          })),
        }));

        return {
          key: navItem.path,
          icon: navItem.icon,
          label: safeRender(t(navLabel)),
          children,
        };
      }

      if (navItem.simpleDropdown) {
        const parentKey = navItem.path;
        const children = navItem.simpleDropdown.map((item, itemIndex) => ({
          key: subMenuItemKey(parentKey, item, itemIndex),
          label: item.url.startsWith('http') ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-sub-external"
            >
              {wrapSubContent(item, (
                <>
                  {safeRender(t(item.label))}
                  <span className="sidebar-ext-icon">↗</span>
                </>
              ))}
            </a>
          ) : (
            <Link to={item.url} className="sidebar-sub-link">
              {wrapSubContent(item, safeRender(t(item.label)))}
            </Link>
          ),
        }));

        return {
          key: parentKey,
          icon: navItem.icon,
          label: safeRender(t(navLabel)),
          children,
        };
      }

      if (navItem.externalHref) {
        return {
          key: navItem.path,
          icon: navItem.icon,
          label: (
            <a
              href={navItem.externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-top-link sidebar-top-link--external"
            >
              {safeRender(t(navLabel))}
              <span className="sidebar-ext-icon" aria-hidden>
                ↗
              </span>
            </a>
          ),
        };
      }

      return {
        key: navItem.path,
        icon: navItem.icon,
        label: (
          <Link to={navItem.path} className="sidebar-top-link">
            {safeRender(t(navLabel))}
          </Link>
        ),
      };
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
      <div
        className={classNames('sidebar', 'sidebar--figma', className, {
          collapsed: !isMobile && collapsed,
          'mobile-open': isMobile && mobileMenuOpen,
        })}
      >
        {/* 侧边栏头部 */}
        <div className="sidebar-header sidebar-header--figma-brand">
          {/* Figma Frame 86：303×109 品牌区（列、居中、gap 20）；收折按钮在框外同排 */}
          <div className="sidebar-header__frame86">
            <div className="sidebar-brand">
              <div className="sidebar-brand__bjt">
                <img src="/images/logo-1.webp" alt="BJT" />
              </div>
              {!collapsed && !isMobile && (
                <div className="sidebar-brand__wordmark">
                  <span className="sidebar-brand__line1">Locked Air®</span>
                  <span className="sidebar-brand__rule" aria-hidden />
                  <span className="sidebar-brand__line2">LOCKED PAPER™</span>
                </div>
              )}
            </div>
          </div>
          {!isMobile && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
            >
              <MenuOutlined />
            </button>
          )}
        </div>

        {/* 导航菜单 */}
        <div className="sidebar-menu">
          <Menu
            mode="inline"
            inlineCollapsed={!isMobile && collapsed}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            selectedKeys={selectedKeys}
            items={generateMenuItems()}
            className="sidebar-menu-content"
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar; 