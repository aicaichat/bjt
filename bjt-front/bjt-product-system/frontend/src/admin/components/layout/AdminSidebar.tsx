import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import {
  ProductLineIcon,
  AirCushionMachineIcon,
  PaperMachineIcon,
  TapeMachineIcon,
  UserManagementIcon,
  SystemSettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '../icons/AdminIcons';

interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const AdminSidebar: React.FC = () => {
  const { t } = useAdminI18n();
  const [openKeys, setOpenKeys] = useState<string[]>(['page-edit']);

  const handleMenuClick = (key: string, hasChildren: boolean) => {
    if (hasChildren) {
      setOpenKeys((prevOpenKeys) =>
        prevOpenKeys.includes(key) ? prevOpenKeys.filter((k) => k !== key) : [...prevOpenKeys, key]
      );
    }
  };

  // 侧边栏样式
  const sidebarStyle: React.CSSProperties = {
    width: '220px',
    backgroundColor: '#1a3c70',
    color: '#fff',
    padding: '15px 0',
    height: '100vh',
    overflowY: 'auto'
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'transparent',
    fontSize: '14px',
    lineHeight: '20px',
    transition: 'all 0.2s ease'
  };

  const activeMenuItemStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderLeftColor: '#4dabf7'
  };

  const subMenuStyle: React.CSSProperties = {
    marginLeft: '0',
    backgroundColor: 'rgba(0,0,0,0.12)'
  };

  const subMenuItemStyle: React.CSSProperties = {
    ...menuItemStyle,
    paddingLeft: '48px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)'
  };

  const iconStyle: React.CSSProperties = {
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const expanderStyle: React.CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.7
  };

  const menuItems: MenuItem[] = [
    {
      key: 'page-edit',
      label: t('productLineManagement', { ns: 'navigation' }),
      icon: <ProductLineIcon size={20} color="currentColor" />,
      children: [
        { key: 'product-line-1', label: t('productLine1', { ns: 'navigation' }), path: '/admin/product-lines/edit/1' },
        { key: 'product-line-2', label: t('productLine2', { ns: 'navigation' }), path: '/admin/product-lines/edit/2' },
        { key: 'product-line-3', label: t('productLine3', { ns: 'navigation' }), path: '/admin/product-lines/edit/3' },
        { key: 'product-line-4', label: t('productLine4', { ns: 'navigation' }), path: '/admin/product-lines/edit/4' },
      ],
    },
    {
      key: 'air-cushion-machine',
      label: t('airCushionMachine', { ns: 'navigation' }),
      icon: <AirCushionMachineIcon size={20} color="currentColor" />,
      children: [
        { key: 'ac-main', label: t('hostMachine', { ns: 'navigation' }), path: '/admin/machines?type=air-cushion' },
        { key: 'ac-relations', label: t('relations', { ns: 'navigation' }), path: '/admin/relations?type=air-cushion' },
        { key: 'ac-accessories', label: t('accessories', { ns: 'navigation' }), path: '/admin/accessories?type=air-cushion' },
        { key: 'ac-consumables', label: t('consumables', { ns: 'navigation' }), path: '/admin/consumables?type=air-cushion' },
        { key: 'ac-consumables-dictionary', label: t('consumablesDictionary', { ns: 'navigation' }), path: '/admin/consumables/dictionary?type=air-cushion' },
        { key: 'ac-spare-parts', label: t('spareParts', { ns: 'navigation' }), path: '/admin/spare-parts?type=air-cushion' },
      ],
    },
    {
      key: 'paper-machine',
      label: t('paperMachine', { ns: 'navigation' }),
      icon: <PaperMachineIcon size={20} color="currentColor" />,
      children: [
        { key: 'pm-main', label: t('hostMachine', { ns: 'navigation' }), path: '/admin/machines?type=paper' },
        { key: 'pm-relations', label: t('relations', { ns: 'navigation' }), path: '/admin/relations?type=paper' },
        { key: 'pm-accessories', label: t('accessories', { ns: 'navigation' }), path: '/admin/accessories?type=paper' },
        { key: 'pm-consumables', label: t('consumables', { ns: 'navigation' }), path: '/admin/consumables?type=paper' },
        { key: 'pm-consumables-dictionary', label: t('consumablesDictionary', { ns: 'navigation' }), path: '/admin/consumables/dictionary?type=paper' },
        { key: 'pm-spare-parts', label: t('spareParts', { ns: 'navigation' }), path: '/admin/spare-parts?type=paper' },
      ],
    },
    {
      key: 'tape-machine',
      label: t('tapeMachine', { ns: 'navigation' }),
      icon: <TapeMachineIcon size={20} color="currentColor" />,
      children: [
        { key: 'tm-main', label: t('hostMachine', { ns: 'navigation' }), path: '/admin/machines?type=tape' },
        { key: 'tm-relations', label: t('relations', { ns: 'navigation' }), path: '/admin/relations?type=tape' },
        { key: 'tm-accessories', label: t('accessories', { ns: 'navigation' }), path: '/admin/accessories?type=tape' },
        { key: 'tm-consumables', label: t('consumables', { ns: 'navigation' }), path: '/admin/consumables?type=tape' },
        { key: 'tm-consumables-dictionary', label: t('consumablesDictionary', { ns: 'navigation' }), path: '/admin/consumables/dictionary?type=tape' },
        { key: 'tm-spare-parts', label: t('spareParts', { ns: 'navigation' }), path: '/admin/spare-parts?type=tape' },
      ],
    },
    {
      key: 'user-management',
      label: t('userManagement', { ns: 'navigation' }),
      icon: <UserManagementIcon size={20} color="currentColor" />,
      path: '/admin/users',
    },
    {
      key: 'system-settings',
      label: t('systemSettings', { ns: 'navigation' }),
      icon: <SystemSettingsIcon size={20} color="currentColor" />,
      path: '/admin/settings',
    },
  ];

  const renderMenuItems = (items: MenuItem[], isSubmenu = false) => {
    return items.map((item) => {
      const isExpanded = item.children && openKeys.includes(item.key);
      const currentItemStyle = isSubmenu ? subMenuItemStyle : menuItemStyle;
      const isActive = openKeys.includes(item.key) && item.children;

      return (
        <React.Fragment key={item.key}>
          {item.path ? (
            <NavLink
              to={item.path}
              style={({ isActive: navIsActive }) =>
                navIsActive || isActive ? {...currentItemStyle, ...activeMenuItemStyle} : currentItemStyle
              }
              onClick={() => handleMenuClick(item.key, !!item.children)}
            >
              {item.icon && <span style={iconStyle}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.children && (
                <span style={expanderStyle}>
                  {isExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
                </span>
              )}
            </NavLink>
          ) : (
            <div
              style={isActive ? {...currentItemStyle, ...activeMenuItemStyle} : currentItemStyle}
              onClick={() => handleMenuClick(item.key, !!item.children)}
            >
              {item.icon && <span style={iconStyle}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.children && (
                <span style={expanderStyle}>
                  {isExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
                </span>
              )}
            </div>
          )}
          {isExpanded && item.children && (
            <div style={subMenuStyle}>
              {renderMenuItems(item.children, true)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <aside className="admin-sidebar" style={sidebarStyle}>
      <div className="admin-sidebar-menu">
        {renderMenuItems(menuItems)}
      </div>
    </aside>
  );
};

export default AdminSidebar;
