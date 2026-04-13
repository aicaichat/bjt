import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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

/** 默认展开二级的首条产品线（Air Cushioning）；其余产品线 / Support 默认收起 */
const FIRST_PRODUCT_LINE_PATH = '/air-cushioning';

/** 侧栏内不用 Ant Design icons：Pay by Card 左侧小卡图标 */
function CreditCardGlyph() {
  return (
    <svg
      className="sidebar-sub-leading-anticon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

interface NavSubItem {
  label: string;
  url: string;
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
  externalHref?: string;
  requiresAuth?: boolean;
}

export interface SidebarProps {
  className?: string;
  /** 桌面端窄条模式；移动端抽屉不受此影响 */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  /** 用户显式切换某组二级显隐；undefined 表示走默认（首条产品线开 + 路由命中子链时开） */
  const [sectionExplicit, setSectionExplicit] = useState<Record<string, boolean | undefined>>({});

  const desktopCollapsed = Boolean(collapsed && !isMobile);

  const navItems: NavItem[] = [
    {
      label: 'nav.home',
      path: '/',
      icon: <NavIconHome />,
      requiresAuth: false,
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
      ],
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
      ],
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
      ],
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
          leadingIcon: <CreditCardGlyph />,
        },
      ],
    },
    {
      label: 'nav.contactUs',
      path: '/contact',
      icon: <NavIconContact />,
      requiresAuth: false,
    },
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredNavItems = useMemo(
    () => navItems.filter(item => !item.requiresAuth || user),
    [user]
  );

  const currentPath = useMemo(() => {
    const full = `${location.pathname}${location.search || ''}`;
    return full === '' ? '/' : full;
  }, [location.pathname, location.search]);

  const activeSimpleDropdownParentPath = useMemo(() => {
    for (const navItem of filteredNavItems) {
      if (!navItem.simpleDropdown) continue;
      const hit = navItem.simpleDropdown.some(
        sub => !sub.url.startsWith('http') && sub.url === currentPath
      );
      if (hit) return navItem.path;
    }
    return undefined;
  }, [currentPath, filteredNavItems]);

  const isSectionExpanded = useCallback(
    (parentPath: string) => {
      const ex = sectionExplicit[parentPath];
      if (ex === false) return false;
      if (ex === true) return true;
      if (activeSimpleDropdownParentPath === parentPath) return true;
      return parentPath === FIRST_PRODUCT_LINE_PATH;
    },
    [sectionExplicit, activeSimpleDropdownParentPath]
  );

  const toggleSection = useCallback(
    (parentPath: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSectionExplicit(prev => {
        const ex = prev[parentPath];
        const onChild = activeSimpleDropdownParentPath === parentPath;
        let current: boolean;
        if (ex === false) current = false;
        else if (ex === true) current = true;
        else if (onChild) current = true;
        else current = parentPath === FIRST_PRODUCT_LINE_PATH;
        return { ...prev, [parentPath]: !current };
      });
    },
    [activeSimpleDropdownParentPath]
  );

  const subKey = (parentPath: string, item: NavSubItem, itemIndex: number) =>
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

  const afterNavClick = useCallback(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  const toggleMobileMenu = () => setMobileMenuOpen(v => !v);

  const toggleDesktopSidebar = useCallback(() => {
    onCollapsedChange?.(!collapsed);
  }, [collapsed, onCollapsedChange]);

  const navRows = useMemo(() => {
    const rows: React.ReactNode[] = [];

    filteredNavItems.forEach((navItem, index) => {
      const navLabel = typeof navItem.label === 'string' ? navItem.label : 'nav.products';
      const fallbackKey = `nav-${index}`;

      if (navItem.children) {
        navItem.children.forEach((section, sectionIndex) => {
          section.items.forEach((item, itemIndex) => {
            const key = `${fallbackKey}-section-${sectionIndex}-item-${itemIndex}`;
            const sel = !item.url.startsWith('http') && item.url === currentPath;
            rows.push(
              <li
                key={key}
                className={classNames('sidebar-figma-nav__item', 'sidebar-figma-nav__item--l2', {
                  'sidebar-figma-nav__item--selected': sel,
                })}
              >
                <span className="sidebar-figma-nav__body">
                  {item.url.startsWith('http') ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sidebar-sub-external"
                      onClick={afterNavClick}
                    >
                      {wrapSubContent(item, (
                        <>
                          {safeRender(t(item.label))}
                          <span className="sidebar-ext-icon">↗</span>
                        </>
                      ))}
                    </a>
                  ) : (
                    <Link to={item.url} className="sidebar-sub-link" onClick={afterNavClick}>
                      {wrapSubContent(item, safeRender(t(item.label)))}
                    </Link>
                  )}
                </span>
              </li>
            );
          });
        });
        return;
      }

      if (navItem.simpleDropdown) {
        const parentKey = navItem.path;
        const childRouteActive = activeSimpleDropdownParentPath === parentKey;
        const hubSelected = currentPath === parentKey;
        const l2Open = isSectionExpanded(parentKey);

        if (desktopCollapsed) {
          rows.push(
            <li
              key={parentKey}
              className={classNames(
                'sidebar-figma-nav__item',
                'sidebar-figma-nav__item--l1',
                'sidebar-figma-nav__item--collapsed-icon',
                {
                  'sidebar-figma-nav__item--selected': hubSelected,
                  'sidebar-figma-nav__item--child-route-active': childRouteActive && !hubSelected,
                }
              )}
            >
              <Link
                to={parentKey}
                className="sidebar-figma-nav__collapsed-link"
                aria-label={safeRender(t(navLabel))}
                title={safeRender(t(navLabel))}
                onClick={afterNavClick}
              >
                <span className="sidebar-figma-nav__icon">{navItem.icon}</span>
              </Link>
            </li>
          );
          return;
        }

        rows.push(
          <li
            key={parentKey}
            className={classNames(
              'sidebar-figma-nav__item',
              'sidebar-figma-nav__item--l1',
              {
                'sidebar-figma-nav__item--selected': hubSelected,
                'sidebar-figma-nav__item--child-route-active': childRouteActive && !hubSelected,
                'sidebar-figma-nav__item--l1--section-collapsed': !l2Open,
              }
            )}
          >
            <span className="sidebar-figma-nav__icon">{navItem.icon}</span>
            <span className="sidebar-figma-nav__body">
              <div className="sidebar-l1-row">
                <Link to={parentKey} className="sidebar-top-link" onClick={afterNavClick}>
                  {safeRender(t(navLabel))}
                </Link>
                <button
                  type="button"
                  className="sidebar-l1-chevron sidebar-l1-chevron-btn"
                  aria-expanded={l2Open}
                  aria-label={l2Open ? t('sidebar.collapseSection', 'Collapse section') : t('sidebar.expandSection', 'Expand section')}
                  onClick={e => toggleSection(parentKey, e)}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3.5 5.25L7 8.75L10.5 5.25"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </span>
          </li>
        );

        if (l2Open) {
          navItem.simpleDropdown.forEach((item, itemIndex) => {
            const k = subKey(parentKey, item, itemIndex);
            const sel = !item.url.startsWith('http') && item.url === currentPath;
            rows.push(
              <li
                key={k}
                className={classNames('sidebar-figma-nav__item', 'sidebar-figma-nav__item--l2', {
                  'sidebar-figma-nav__item--selected': sel,
                })}
              >
                <span className="sidebar-figma-nav__body">
                  {item.url.startsWith('http') ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sidebar-sub-external"
                      onClick={afterNavClick}
                    >
                      {wrapSubContent(item, (
                        <>
                          {safeRender(t(item.label))}
                          <span className="sidebar-ext-icon">↗</span>
                        </>
                      ))}
                    </a>
                  ) : (
                    <Link to={item.url} className="sidebar-sub-link" onClick={afterNavClick}>
                      {wrapSubContent(item, safeRender(t(item.label)))}
                    </Link>
                  )}
                </span>
              </li>
            );
          });
        }
        return;
      }

      if (navItem.externalHref) {
        const sel = false;
        if (desktopCollapsed) {
          rows.push(
            <li
              key={navItem.path}
              className={classNames(
                'sidebar-figma-nav__item',
                'sidebar-figma-nav__item--leaf',
                'sidebar-figma-nav__item--collapsed-icon',
                { 'sidebar-figma-nav__item--selected': sel }
              )}
            >
              <a
                href={navItem.externalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-figma-nav__collapsed-link"
                aria-label={safeRender(t(navLabel))}
                title={safeRender(t(navLabel))}
                onClick={afterNavClick}
              >
                <span className="sidebar-figma-nav__icon">{navItem.icon}</span>
              </a>
            </li>
          );
          return;
        }
        rows.push(
          <li
            key={navItem.path}
            className={classNames('sidebar-figma-nav__item', 'sidebar-figma-nav__item--leaf', {
              'sidebar-figma-nav__item--selected': sel,
            })}
          >
            <span className="sidebar-figma-nav__icon">{navItem.icon}</span>
            <span className="sidebar-figma-nav__body">
              <a
                href={navItem.externalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-top-link sidebar-top-link--external"
                onClick={afterNavClick}
              >
                {safeRender(t(navLabel))}
                <span className="sidebar-ext-icon" aria-hidden>
                  ↗
                </span>
              </a>
            </span>
          </li>
        );
        return;
      }

      const sel = currentPath === navItem.path;
      if (desktopCollapsed) {
        rows.push(
          <li
            key={navItem.path}
            className={classNames(
              'sidebar-figma-nav__item',
              'sidebar-figma-nav__item--leaf',
              'sidebar-figma-nav__item--collapsed-icon',
              { 'sidebar-figma-nav__item--selected': sel }
            )}
          >
            <Link
              to={navItem.path}
              className="sidebar-figma-nav__collapsed-link"
              aria-label={safeRender(t(navLabel))}
              title={safeRender(t(navLabel))}
              onClick={afterNavClick}
            >
              <span className="sidebar-figma-nav__icon">{navItem.icon}</span>
            </Link>
          </li>
        );
        return;
      }
      rows.push(
        <li
          key={navItem.path}
          className={classNames('sidebar-figma-nav__item', 'sidebar-figma-nav__item--leaf', {
            'sidebar-figma-nav__item--selected': sel,
          })}
        >
          <span className="sidebar-figma-nav__icon">{navItem.icon}</span>
          <span className="sidebar-figma-nav__body">
            <Link to={navItem.path} className="sidebar-top-link" onClick={afterNavClick}>
              {safeRender(t(navLabel))}
            </Link>
          </span>
        </li>
      );
    });

    return rows;
  }, [
    filteredNavItems,
    t,
    currentPath,
    activeSimpleDropdownParentPath,
    afterNavClick,
    desktopCollapsed,
    isSectionExpanded,
    toggleSection,
  ]);

  return (
    <>
      {isMobile && (
        <button
          type="button"
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      )}

      {isMobile && mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileMenu} aria-hidden />
      )}

      <div
        className={classNames('sidebar', 'sidebar--figma', className, {
          collapsed: desktopCollapsed,
          'mobile-open': isMobile && mobileMenuOpen,
        })}
      >
        <div className="sidebar-header sidebar-header--figma-brand">
          {!isMobile && onCollapsedChange ? (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleDesktopSidebar}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? t('sidebar.expandSidebar', 'Expand sidebar')
                  : t('sidebar.collapseSidebar', 'Collapse sidebar')
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                {collapsed ? (
                  <path d="M10 17l5-5-5-5v10zM4 17h2V7H4v10zm12 0h2V7h-2v10z" />
                ) : (
                  <path d="M14 17l-5-5 5-5v10zM8 17H6V7h2v10zm6 0h2V7h-2v10z" />
                )}
              </svg>
            </button>
          ) : null}
          <div className="sidebar-header__frame86">
            <div className="sidebar-brand">
              <div className="sidebar-brand__bjt">
                <img src="/images/logo-1.webp" alt="BJT" />
              </div>
              {!isMobile && (
                <div className="sidebar-brand__wordmark">
                  <span className="sidebar-brand__line1">Locked Air®</span>
                  <span className="sidebar-brand__rule" aria-hidden />
                  <span className="sidebar-brand__line2">LOCKED PAPER™</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          <nav className="sidebar-menu-content sidebar-figma-nav" aria-label="Main">
            <ul className="sidebar-figma-nav__list">{navRows}</ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
