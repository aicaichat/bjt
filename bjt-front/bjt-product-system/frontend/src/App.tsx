import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/global.css';
import './styles/theme.css';

// 导入 BJT Tech 主题
import { ThemeProvider } from './contexts/ThemeContext';

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
import ProductDetail from './pages/ProductDetail';
import Order from './pages/Order';
import PO from './pages/PO';
import OrderList from './pages/OrderList';
import Profile from './pages/Profile';
import DashboardPage from './pages/DashboardPage';
import SqlExcelConverterPage from './pages/SqlExcelConverter';
// 导入示例组件
import OrderListExample from './examples/OrderListExample';
// 其他页面组件（占位符）
const Checkout = () => <div className="container mx-auto p-4">结账页面（待实现）</div>;
const OrderDetail = () => <div className="container mx-auto p-4">订单详情页面（待实现）</div>;

// 导入指南组件
import GuideIndex from './guide/index';

// 导入认证上下文
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
// 导入购物车上下文和组件
import { CartProvider } from './contexts/CartContext';
import { CartButton, CartSidebar } from './components/Cart';
// 导入通知上下文
import { NotificationProvider } from './contexts/NotificationContext';
// 导入现代化UI组件
import { ToastProvider } from './components/ui';

import MockDataManager from './components/MockDataManager';
import { useMockData, BASE_URL } from './config/env';
// 导入错误边界组件
import ErrorBoundary from './components/ErrorBoundary';
// 导入安全渲染包装器
import SafeRenderWrapper from './components/SafeRenderWrapper';

// 导入管理后台路由
import AdminRoutes from './admin/routes';

// 路由保护组件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Near the beginning of the file, before the App component, add this lazy-loaded component
const UnicodeTest = React.lazy(() => import('./pages/DevTests/UnicodeTest'));

// 内部组件用于获取location和user状态
const AppContent: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMockManagerOpen, setIsMockManagerOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // 打开购物车
  const openCart = () => {
    setIsCartOpen(true);
  };

  // 关闭购物车
  const closeCart = () => {
    setIsCartOpen(false);
  };

  // 判断是否应该显示购物车（不在首页或已登录）
  const shouldShowCart = user || location.pathname !== '/';

  return (
    <div className="App">
      {/* Mock数据管理组件 */}
      <MockDataManager 
        isOpen={isMockManagerOpen} 
        onClose={() => setIsMockManagerOpen(false)} 
      />
      
      <Routes>
        {/* 管理后台路由 - MOVED TO TOP FOR TESTING */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* 首页 - 公开访问 */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />
        
        {/* Dashboard页面 */}
        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          }
        />
        
        {/* Home 路径重定向到首页 */}
        <Route
          path="/home"
          element={<Navigate to="/" replace />}
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

        {/* SQL-Excel转换器页面 */}
        <Route
          path="/sql-excel-converter"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SqlExcelConverterPage />
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
        
        {/* 订单确认页面 */}
        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Order />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* 添加 /order/confirm 路径重定向到 /order */}
        <Route
          path="/order/confirm"
          element={<Navigate to="/order" replace />}
        />
        
        {/* PO页面 */}
        <Route
          path="/po"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PO />
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
        
        {/* Unicode测试页面 - 仅在开发环境下可用 */}
        {process.env.NODE_ENV === 'development' && (
          <Route
            path="/dev/unicode-test"
            element={
              <MainLayout>
                <Suspense fallback={<div>Loading...</div>}>
                  <UnicodeTest />
                </Suspense>
              </MainLayout>
            }
          />
        )}
        
        {/* 订单列表示例 */}
        <Route
          path="/example/order-list"
          element={
            <MainLayout>
              <OrderListExample />
            </MainLayout>
          }
        />
        
        {/* 用户资料页面 */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* 登录页面 */}
        <Route path="/login" element={<Login />} />
        
        {/* 产品详情页面 */}
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProductDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* 404页面 */}
        <Route
          path="*"
          element={
            <MainLayout>
              <div className="container mx-auto p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">页面不存在</h1>
                <p className="mb-4">您访问的页面不存在，请检查网址是否正确。</p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.history.back()}
                >
                  返回上一页
                </button>
              </div>
            </MainLayout>
          }
        />
      </Routes>
      
      {/* 只在非首页或已登录时显示购物车侧边栏和按钮 */}
      {shouldShowCart && (
        <>
          <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
          <CartButton onClick={openCart} />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="bjt-tech" defaultMode="light">
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <ErrorBoundary>
                <SafeRenderWrapper>
                  <Router>
                    <CartProvider>
                      <AppContent />
                    </CartProvider>
                  </Router>
                </SafeRenderWrapper>
              </ErrorBoundary>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
