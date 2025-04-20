import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/global.css';
import './styles/theme.css';

// 导入布局组件
import MainLayout from './components/layout/MainLayout';

// 导入页面组件
import Home from './pages/Home/index';
import Login from './pages/Login/index';
import Products from './pages/Products/index';
import Consumables from './pages/Consumables/index';
import SpareParts from './pages/SpareParts/index';
import Machines from './pages/Machines/index';
import Cart from './pages/Cart';
// 其他页面组件（占位符）
const Checkout = () => <div className="container mx-auto p-4">结账页面（待实现）</div>;
const OrderDetail = () => <div className="container mx-auto p-4">订单详情页面（待实现）</div>;
const OrderList = () => <div className="container mx-auto p-4">订单列表页面（待实现）</div>;

// 导入指南组件
import GuideIndex from './guide/index';

// 导入认证上下文
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// 路由保护组件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 加载中状态
  if (loading) {
    return <div className="loading-container">验证登录状态...</div>;
  }

  // 已登录，显示受保护的路由
  if (user) {
    return <>{children}</>;
  }

  // 未登录，重定向到登录页
  return <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

const App: React.FC = () => {
  // 初始化主题系统
  useEffect(() => {
    // Theme initialization is handled by ThemeSwitcher component
  }, []);

  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* 首页 - 公开访问 */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <Home />
                </MainLayout>
              }
            />

            {/* 受保护的页面 - 需要登录 */}
            {/* 旧路径重定向 */}
            <Route
              path="/products"
              element={<Navigate to="/machines" replace />}
            />
            
            <Route
              path="/products/consumables"
              element={<Navigate to="/consumables" replace />}
            />
            
            <Route
              path="/products/spare-parts"
              element={<Navigate to="/spare-parts" replace />}
            />
            
            {/* 设备选型页面 */}
            <Route
              path="/machines"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Machines />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* 耗材选择页面 */}
            <Route
              path="/consumables"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Consumables />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* 备件选择页面 */}
            <Route
              path="/spare-parts"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SpareParts />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* 购物车页面 */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Cart />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* 订单相关页面 */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Checkout />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OrderList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OrderDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* UI 组件指南 */}
            <Route
              path="/guide"
              element={
                <MainLayout>
                  <GuideIndex />
                </MainLayout>
              }
            />

            {/* 认证页面 - 不带标准布局 */}
            <Route path="/login" element={<Login />} />

            {/* 404页面 */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <div className="container mx-auto p-4 text-center">
                      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                      <p className="text-lg text-gray-600">页面不存在</p>
                    </div>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
