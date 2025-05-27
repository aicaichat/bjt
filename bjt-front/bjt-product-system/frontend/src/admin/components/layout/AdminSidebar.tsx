import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [

  {
    key: 'page-edit',
    label: '产品线管理',
    icon: '📄',
    children: [
      { key: 'product-line-1', label: '产品线1', path: '/admin/product-lines/edit/1' },
      { key: 'product-line-2', label: '产品线2', path: '/admin/product-lines/edit/2' },
      { key: 'product-line-3', label: '产品线3', path: '/admin/product-lines/edit/3' },
    ],
  },
  {
    key: 'air-cushion-machine',
    label: '气垫机',
    icon: '🛋️',
    children: [
      { key: 'ac-main', label: '主机', path: '/admin/machines?type=air-cushion' },
      { key: 'ac-relations', label: '关联关系', path: '/admin/relations?type=air-cushion' },
      { key: 'ac-accessories', label: '配件', path: '/admin/accessories?type=air-cushion' },
      { key: 'ac-consumables', label: '耗材管理', path: '/admin/consumables?type=air-cushion' },
      { key: 'ac-consumables-dictionary', label: '耗材字典', path: '/admin/consumables/dictionary?type=air-cushion' },
      { key: 'ac-spare-parts', label: '备件', path: '/admin/spare-parts?type=air-cushion' },
    ],
  },
  {
    key: 'paper-machine',
    label: '纸机',
    icon: '📃',
    children: [
      { key: 'pm-main', label: '主机', path: '/admin/machines?type=paper' },
      { key: 'pm-relations', label: '关联关系', path: '/admin/relations?type=paper' },
      { key: 'pm-accessories', label: '配件', path: '/admin/accessories?type=paper' },
      { key: 'pm-consumables', label: '耗材管理', path: '/admin/consumables?type=paper' },
      { key: 'pm-consumables-dictionary', label: '耗材字典', path: '/admin/consumables/dictionary?type=paper' },
      { key: 'pm-spare-parts', label: '备件', path: '/admin/spare-parts?type=paper' },
    ],
  },
  {
    key: 'tape-machine',
    label: '胶带机',
    icon: '🧵',
    children: [
      { key: 'tm-main', label: '主机', path: '/admin/machines?type=tape' },
      { key: 'tm-relations', label: '关联关系', path: '/admin/relations?type=tape' },
      { key: 'tm-accessories', label: '配件', path: '/admin/accessories?type=tape' },
      { key: 'tm-consumables', label: '耗材管理', path: '/admin/consumables?type=tape' },
      { key: 'tm-consumables-dictionary', label: '耗材字典', path: '/admin/consumables/dictionary?type=tape' },
      { key: 'tm-spare-parts', label: '备件', path: '/admin/spare-parts?type=tape' },
    ],
  },
  {
    key: 'user-management',
    label: '用户管理',
    icon: '👤',
    path: '/admin/users',
  },
  {
    key: 'system-settings',
    label: '系统设置',
    icon: '⚙️',
    path: '/admin/settings',
  },
];

const AdminSidebar: React.FC = () => {
  const [openKeys, setOpenKeys] = useState<string[]>(['page-edit']); // Default open based on mockup

  const handleMenuClick = (key: string, hasChildren: boolean) => {
    if (hasChildren) {
      setOpenKeys((prevOpenKeys) =>
        prevOpenKeys.includes(key) ? prevOpenKeys.filter((k) => k !== key) : [...prevOpenKeys, key]
      );
    }
  };

  // Basic styling to match mockup
  const sidebarStyle: React.CSSProperties = {
    width: '220px',
    backgroundColor: '#1a3c70',
    color: '#fff',
    padding: '15px 0',
    height: '100vh', // Make sidebar full height
    overflowY: 'auto'
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'transparent',
    fontSize: '14px'
  };

  const activeMenuItemStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    borderLeftColor: '#4dabf7' 
  };

  const subMenuStyle: React.CSSProperties = {
    marginLeft: '0',
    backgroundColor: 'rgba(0,0,0,0.15)'
  };
  
  const subMenuItemStyle: React.CSSProperties = {
    ...menuItemStyle, // Inherit base styles
    paddingLeft: '40px',
    fontSize: '13px'
  };

  const iconStyle: React.CSSProperties = { marginRight: '10px', opacity: 0.8, fontSize: '16px' };
  const expanderStyle: React.CSSProperties = { fontSize: '10px', marginLeft: 'auto' };

  const renderMenuItems = (items: MenuItem[], isSubmenu = false) => {
    return items.map((item) => {
      const isExpanded = item.children && openKeys.includes(item.key);
      const currentItemStyle = isSubmenu ? subMenuItemStyle : menuItemStyle;

      return (
        <React.Fragment key={item.key}>
          {item.path ? (
            <NavLink
              to={item.path}
              style={({ isActive }) => 
                isActive ? {...currentItemStyle, ...activeMenuItemStyle} : currentItemStyle
              }
              onClick={() => handleMenuClick(item.key, !!item.children)}
            >
              {item.icon && <span style={iconStyle}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.children && <span style={expanderStyle}>{isExpanded ? '▼' : '▶'}</span>}
            </NavLink>
          ) : (
            <div
              style={openKeys.includes(item.key) && item.children ? {...currentItemStyle, ...activeMenuItemStyle} : currentItemStyle}
              onClick={() => handleMenuClick(item.key, !!item.children)}
            >
              {item.icon && <span style={iconStyle}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.children && <span style={expanderStyle}>{isExpanded ? '▼' : '▶'}</span>}
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

  return <div style={sidebarStyle}>{renderMenuItems(menuItems)}</div>;
};

export default AdminSidebar; 