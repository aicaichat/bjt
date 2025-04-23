import React, { useEffect, useState } from 'react';
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
import ProductDetail from './pages/ProductDetail';
import Order from './pages/Order';
import PO from './pages/PO';
import OrderList from './pages/OrderList';
import Profile from './pages/Profile';
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

import MockDataManager from './components/MockDataManager';
import { useMockData } from './config/env';

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
  // 购物车侧边栏状态
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMockManagerOpen, setIsMockManagerOpen] = useState<boolean>(false);

  // 打开购物车
  const openCart = () => {
    setIsCartOpen(true);
  };

  // 关闭购物车
  const closeCart = () => {
    setIsCartOpen(false);
  };

  return (
    <div className="App">
      {/* 如果是开发环境并使用模拟数据则显示mock数据管理按钮 */}
      {useMockData && import.meta.env.DEV && (
        <button 
          onClick={() => setIsMockManagerOpen(true)}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg z-50"
          title="打开Mock数据管理器"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </button>
      )}
      
      {/* Mock数据管理组件 */}
      <MockDataManager 
        isOpen={isMockManagerOpen} 
        onClose={() => setIsMockManagerOpen(false)} 
      />
      
      <Router>
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
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

                {/* 认证页面 - 不带标准布局 */}
                <Route path="/login" element={<Login />} />

                {/* 个人资料页面 */}
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

                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/:type/:id" element={<ProductDetail />} />
              </Routes>
              
              {/* 全局购物车组件 */}
              <CartButton onClick={openCart} />
              <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </div>
  );
};

export default App;
