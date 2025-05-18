import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f7f9fc' // From mockup body
  };

  const mainContainerStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden' // Prevent double scrollbars if sidebar or content overflows
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '20px', // From mockup .main-content margin + padding
    overflowY: 'auto',
    backgroundColor: '#fff', // From mockup .main-content
    margin: '20px', // From mockup .main-content
    borderRadius: '8px', // From mockup .main-content
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)' // From mockup .main-content
  };

  return (
    <div style={layoutStyle}>
      <AdminHeader />
      <div style={mainContainerStyle}>
        <AdminSidebar />
        <main style={contentStyle}>
          <React.Suspense fallback={<div>Loading page...</div>}>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 