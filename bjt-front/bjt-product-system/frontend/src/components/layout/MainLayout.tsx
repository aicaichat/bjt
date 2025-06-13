import React from 'react';
import Header, { HeaderProps } from './Header';
import Footer, { FooterProps } from './Footer';
import '../../styles/global.css';

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
  return (
    <div className={`flex flex-col min-h-screen ${className}`}>
      <Header {...headerProps} className="site-header" />
      
      <main className="flex-grow" style={{ paddingTop: '72px' }}>
        {children}
      </main>
      
      {showFooter && (
        <Footer {...footerProps} />
      )}
    </div>
  );
};

export default MainLayout; 