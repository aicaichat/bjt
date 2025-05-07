/**
 * 路由配置文件
 * 集中管理应用中使用的所有路由路径
 */

export const ROUTES = {
  // 主页
  HOME: '/',
  
  // 用户相关
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  
  // 产品相关
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  MACHINES: '/machines',
  CONSUMABLES: '/consumables',
  SPARE_PARTS: '/spare-parts',
  
  // 订单相关
  CART: '/cart',
  ORDER: '/order',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  PO: '/po',
  PAYMENT: '/payment',
  
  // 获取详情页面路由
  getProductDetail: (id: string) => `/products/${id}`,
  getMachineDetail: (id: string) => `/machines/${id}`,
  getConsumableDetail: (id: string) => `/consumables/${id}`,
  getSparePartDetail: (id: string) => `/spare-parts/${id}`,
  getOrderDetail: (id: string) => `/orders/${id}`,
  getPaymentPage: (orderId: string) => `/payment/${orderId}`,
  
  // 管理后台
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_USERS: '/admin/users',
};

export default ROUTES; 