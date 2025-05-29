import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // 检查admin token
  const adminToken = localStorage.getItem('admin_token');
  
  // 如果没有admin token，重定向到admin登录页面
  if (!adminToken) {
    console.log('🔐 [ProtectedAdminRoute] No admin token found, redirecting to login');
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  
  // TODO: 这里可以添加token验证逻辑
  // 比如检查token是否过期，或者调用API验证token有效性
  
  console.log('✅ [ProtectedAdminRoute] Admin token found, allowing access');
  return <>{children}</>;
};

export default ProtectedAdminRoute; 