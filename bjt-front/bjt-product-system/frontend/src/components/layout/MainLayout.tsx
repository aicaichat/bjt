import React, { useState, useEffect } from 'react';
import Header, { HeaderProps } from './Header';
import Sidebar from './Sidebar';
import Footer, { FooterProps } from './Footer';
import '../../styles/sidebar.css';

interface MainLayoutProps {
  children: React.ReactNode;
  headerProps?: HeaderProps;
  footerProps?: FooterProps;
  showFooter?: boolean;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  headerProps,
  footerProps,
  showFooter = true,
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

  return (
    <div className={`flex flex-col min-h-screen ${className}`}>
      {/* Header - 包含搜索、语言切换、购物车、用户信息 */}
      <Header 
        {...headerProps} 
        className="site-header" 
        onSearch={handleSearch}
      />
      
      <div className="flex flex-1">
        {/* Sidebar - 包含Logo和导航菜单，置顶显示 */}
        <Sidebar />
        
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-20' : 'ml-70'
        }`}>
          <div className="min-h-full flex flex-col">
            <div className="flex-grow">
              {children}
            </div>
            
            {showFooter && (
              <Footer {...footerProps} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 