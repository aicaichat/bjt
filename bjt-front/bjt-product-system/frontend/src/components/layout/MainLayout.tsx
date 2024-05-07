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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
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

  /** 与左侧 Menu、顶栏 `figma-front-shell`、页面内固定条同源 */
  const figmaLayoutStyle = useMemo(() => {
    const w = isMobile
      ? '0px'
      : sidebarCollapsed
        ? 'var(--bjt-sidebar-collapsed-width)'
        : 'var(--bjt-sidebar-width)';
    return { '--bjt-sidebar-effective-width': w } as React.CSSProperties;
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
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        
        {/* Main Content：margin 与 --bjt-sidebar-effective-width 一致 */}
        <main className="figma-front-main flex-1 transition-all duration-300 ml-[var(--bjt-sidebar-effective-width)]">
          <div className="figma-front-main__inner min-h-full flex flex-col">
            <div className="flex-grow w-full min-w-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 