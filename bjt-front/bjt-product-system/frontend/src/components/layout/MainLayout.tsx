import React, { useState, useEffect, useMemo } from 'react';
import Header, { HeaderProps } from './Header';
import Sidebar from './Sidebar';
import '../../styles/sidebar.css';
/** 前台整站 Figma 壳层（Header / 主内容）；Admin 不使用 MainLayout */
import '../../styles/figma-front-shell.css';

interface MainLayoutProps {
  children: React.ReactNode;
  headerProps?: HeaderProps;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  headerProps,
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 检测设备类型（窄屏仍用抽屉侧栏 + mobile-menu-toggle，与桌面全宽侧栏分离）
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理搜索
  const handleSearch = (searchTerm: string) => {
    console.log('Search term:', searchTerm);
    // 这里可以添加搜索逻辑
  };

  /** 与左侧侧栏、顶栏 `figma-front-shell`、主列 `ml-[--bjt-sidebar-effective-width]` 同源 */
  const figmaLayoutStyle = useMemo(() => {
    if (isMobile) {
      return { '--bjt-sidebar-effective-width': '0px' } as React.CSSProperties;
    }
    return {
      '--bjt-sidebar-effective-width': sidebarCollapsed
        ? 'var(--bjt-sidebar-collapsed-width)'
        : 'var(--bjt-sidebar-width)',
    } as React.CSSProperties;
  }, [isMobile, sidebarCollapsed]);

  return (
    <div
      className={`figma-front flex flex-col min-h-screen ${className}`}
      style={figmaLayoutStyle}
    >
      {/* Header - 包含搜索、语言切换、购物车、用户信息 */}
      <Header
        {...headerProps}
        className="site-header"
        onSearch={handleSearch}
      />
      
      <div className="flex flex-1">
        {/* Sidebar - 包含Logo和导航菜单，置顶显示 */}
        <Sidebar
          collapsed={!isMobile && sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        
        {/* Main Content：margin 与 --bjt-sidebar-effective-width 一致 */}
        <main className="figma-front-main flex-1 ml-[var(--bjt-sidebar-effective-width)]">
          <div className="figma-front-main__inner min-h-full flex flex-col">
            {/* flex-col + min-h-0：子页面根节点可用 flex:1 在竖直方向铺满 main（对齐 Figma Frame 529 flex-grow:1） */}
            <div className="flex flex-col flex-grow w-full min-h-0 min-w-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 