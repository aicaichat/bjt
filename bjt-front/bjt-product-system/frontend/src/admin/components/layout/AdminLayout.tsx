import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import '../../styles/admin-figma.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout--figma">
      <div className="admin-layout">
        <AdminHeader />
        <div className="admin-main-container">
          <AdminSidebar />
          <main className="admin-content">
            <React.Suspense fallback={<div>Loading page...</div>}>
              <Outlet />
            </React.Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 