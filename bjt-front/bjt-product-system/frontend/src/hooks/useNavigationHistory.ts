import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 购物页面路径列表
const SHOPPING_PAGES = [
  '/consumables',
  '/spare-parts',
  '/machines',
  '/products'
];

// 导航历史管理Hook
export const useNavigationHistory = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // 检查当前页面是否为购物页面
    const isShoppingPage = SHOPPING_PAGES.some(page => 
      currentPath.startsWith(page)
    );

    if (isShoppingPage) {
      // 保存当前购物页面到sessionStorage
      const fullPath = currentPath + location.search; // 包含查询参数
      sessionStorage.setItem('lastShoppingPage', fullPath);
      
      console.log('[NavigationHistory] 记录购物页面访问:', {
        path: currentPath,
        fullPath,
        search: location.search
      });
    }
  }, [location.pathname, location.search]);

  // 获取上次访问的购物页面
  const getLastShoppingPage = (): string | null => {
    return sessionStorage.getItem('lastShoppingPage');
  };

  // 清除导航历史
  const clearNavigationHistory = () => {
    sessionStorage.removeItem('lastShoppingPage');
    console.log('[NavigationHistory] 清除导航历史');
  };

  // 检查是否有有效的购物页面历史
  const hasValidShoppingHistory = (): boolean => {
    const lastPage = getLastShoppingPage();
    return lastPage !== null && SHOPPING_PAGES.some(page => 
      lastPage.includes(page)
    );
  };

  return {
    getLastShoppingPage,
    clearNavigationHistory,
    hasValidShoppingHistory
  };
};

export default useNavigationHistory; 