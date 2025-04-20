import React from 'react';
import Header, { HeaderProps } from './Header';
import Footer, { FooterProps } from './Footer';
import ThemeSwitcher from '../ThemeSwitcher';
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
      
      <main className="flex-grow">
        {children}
      </main>
      
      {showFooter && (
        <>
          <ThemeSwitcher className="my-6" />
          <Footer {...footerProps} />
        </>
      )}
    </div>
  );
};

export default MainLayout; 