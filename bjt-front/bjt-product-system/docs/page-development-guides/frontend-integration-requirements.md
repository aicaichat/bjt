# BJT产品管理系统前端集成需求文档

## 📋 **目录**
1. [总体架构设计](#1-总体架构设计)
2. [页面功能需求与API集成](#2-页面功能需求与api集成)
3. [数据流设计](#3-数据流设计)
4. [状态管理规范](#4-状态管理规范)
5. [自动化测试用例](#5-自动化测试用例)
6. [性能优化策略](#6-性能优化策略)
7. [部署与监控](#7-部署与监控)

---

## **1. 总体架构设计**

### 1.1 技术栈与工具
```yaml
前端框架: React 18 + TypeScript
状态管理: Context API + useReducer
路由管理: React Router v6
UI组件库: Ant Design + 自定义组件
国际化: react-i18next
数据获取: React Query + Axios
测试框架: Jest + React Testing Library + Cypress
构建工具: Vite
样式方案: CSS Modules + Styled Components
```

### 1.2 项目结构
```
src/
├── components/           # 通用组件
│   ├── common/          # 基础组件
│   ├── business/        # 业务组件
│   └── layout/          # 布局组件
├── pages/               # 页面组件
├── contexts/            # 状态管理
├── services/            # API服务
├── hooks/               # 自定义Hook
├── utils/               # 工具函数
├── types/               # 类型定义
├── constants/           # 常量定义
├── i18n/               # 国际化资源
└── tests/              # 测试文件
```

---

## **2. 页面功能需求与API集成**

### 2.1 首页/产品导航页面

#### 2.1.1 功能需求
- 展示4个产品分类卡片，包含产品线图片、名称和简短描述
- 顶部导航栏包含公司logo、产品分类下拉菜单、文档下载入口、售后服务入口和语言切换器
- 右上角登录按钮，未登录用户点击产品链接时提示登录
- 响应式设计：移动端导航栏转为汉堡菜单，产品卡片变为单列布局

#### 2.1.2 API集成点
```typescript
const homePageAPI = {
  getProductLines: '/product-lines?page=1&page_size=10&lang={lang}',
  getUserStatus: '/user/me' // 条件调用
};
```

### 2.2 登录页面

#### 2.2.1 功能需求
- 登录表单包含邮箱输入框、密码输入框（带可见性切换图标）
- "记住我"复选框和"登录"按钮
- 表单上方显示提示文字："账号由管理员分配，如需账号请联系您的客户经理"
- 支持"忘记密码"功能

#### 2.2.2 API集成点
```typescript
const loginPageAPI = {
  login: 'POST /auth/login',
  refreshToken: 'POST /auth/refresh',
  forgotPassword: 'POST /auth/forgot-password'
};
```

### 2.3 产品选择页面（主机/配件）

#### 2.3.1 功能需求
- 产品列表展示：图片、料号、产品名称、托盘尺寸、一托数量等
- 根据账号类型展示阶梯价格，销售账号能看到库存
- "更多信息"浮层显示包装尺寸、包装毛重、打托后总高度
- 多级配件展示（最多5级），选择产品后自动展开配件
- 浮动购物车，支持页面内预览

#### 2.3.2 API集成点
```typescript
const productSelectionAPI = {
  getMachines: 'GET /machines?product_line_id={id}&region={region}&lang={lang}',
  getMachineAccessories: 'GET /machines/{hostPartNumber}/accessories?level={level}',
  addToCart: 'POST /cart/items',
  getBatchPricing: 'POST /prices/batch'
};
```

### 2.4 耗材选择页面

#### 2.4.1 功能需求
- 智能筛选器：Model、Unit、Shape（显示示例图片）、Material选择
- 当选择Paper材料时，筛选项为weight、width、Length
- 当选择其他材料时，weight修改为Thickness筛选项
- 产品列表显示编号、图片、spec、属性、适配型号、库存、阶梯价格、料号
- "更多信息"显示包装材质和度量信息（公制或英制）

#### 2.4.2 API集成点
```typescript
const consumableSelectionAPI = {
  getConsumables: 'GET /consumables?product_line_id={id}&material={material}&shape={shape}',
  getShapes: 'GET /dictionaries/shapes?lang={lang}',
  getMaterials: 'GET /dictionaries/materials?lang={lang}',
  getBatchPricing: 'POST /consumables/prices/batch',
  getBatchInventory: 'POST /consumables/inventory/batch'
};
```

### 2.5 备件选择页面

#### 2.5.1 功能需求
- Model选项筛选和Consumable/non-consumable筛选
- 备件列表显示产品图片、料号、名称、适配序列号、包装尺寸、包装毛重
- 根据用户账号类别展示不同的阶梯价格
- 销售账号显示库存信息

#### 2.5.2 API集成点
```typescript
const sparePartSelectionAPI = {
  getSpareParts: 'GET /spare-parts?product_line_id={id}&is_consumable={bool}',
  getSparePartCompatibility: 'GET /spare-parts/{id}/compatibility',
  addToCart: 'POST /cart/items'
};
```

### 2.6 购物车页面

#### 2.6.1 功能需求
- 购物进度指示器（购物车>确认订单>完成）
- 购物车表格显示商品图片、信息、单价、数量、小计金额和操作
- 库存不足商品行以浅红色背景高亮显示
- 费用摘要显示商品总额、预估运费、总计金额

#### 2.6.2 API集成点
```typescript
const cartPageAPI = {
  getCart: 'GET /cart?region={region}&lang={lang}',
  updateCartItem: 'PUT /cart/items/{item_id}',
  removeCartItem: 'DELETE /cart/items/{item_id}',
  clearCart: 'POST /cart/clear'
};
```

### 2.7 订单确认页面

#### 2.7.1 功能需求
- 收货信息表单：联系人、电话、邮箱、国家/地区、详细地址
- 订单摘要显示所有商品信息，库存不足商品标注"库存不足"
- 费用计算：商品总额、运费（动态计算）、税费、订单总额
- "生成PO订单"按钮和条件满足时的"Order"按钮

#### 2.7.2 API集成点
```typescript
const orderConfirmationAPI = {
  validateAddress: 'POST /addresses/validate',
  calculateShipping: 'POST /shipping/calculate',
  createOrder: 'POST /orders',
  checkInventory: 'POST /inventory/check'
};
```

### 2.8 PO生成页面

#### 2.8.1 功能需求
- 专业采购单据风格显示
- 三个区域：客户信息区、商品信息区、汇总区
- "导出Excel"和"打印PO单"功能

#### 2.8.2 API集成点
```typescript
const poGenerationAPI = {
  generatePO: 'POST /orders/{id}/po',
  exportExcel: 'GET /orders/{id}/export/excel',
  getPOData: 'GET /orders/{id}/po-data'
};
```

### 2.9 支付页面

#### 2.9.1 功能需求
- 根据用户所属地区显示不同支付选项
- 订单摘要显示关键信息和最终支付金额
- 安全支付图标和说明

#### 2.9.2 API集成点
```typescript
const paymentPageAPI = {
  getPaymentMethods: 'GET /payment/methods?region={region}',
  processPayment: 'POST /payment/process',
  verifyPayment: 'GET /payment/verify/{transaction_id}'
};
```

### 2.10 订单列表页面

#### 2.10.1 功能需求
- 订单状态筛选选项卡（全部、待付款、待发货、已发货、已完成、已取消）
- 高级筛选区：时间范围选择器和搜索框
- 订单卡片显示完整信息和操作按钮

#### 2.10.2 API集成点
```typescript
const orderListAPI = {
  getOrders: 'GET /orders?page={page}&status={status}&search={search}',
  exportPO: 'GET /orders/{id}/export/po',
  cancelOrder: 'POST /orders/{id}/cancel'
};
```

---

## **3. 数据流设计**

### 3.1 统一数据模型
```typescript
// 统一产品接口
interface UnifiedProduct {
  id: string;
  type: 'machine' | 'accessory' | 'consumable' | 'spare_part';
  partNumber: string;
  name_zh: string;
  name_en: string;
  image_url: string;
  specifications: Record<string, any>;
  pricing: PricingData[];
  inventory: InventoryData[];
  compatibility: string[];
}

// 购物车项目接口
interface CartItem {
  id: string;
  product: UnifiedProduct;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addedAt: string;
}

// 订单接口
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  totals: OrderTotals;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 API响应适配器
```typescript
// 数据适配器
export class DataAdapter {
  static adaptMachineToUnified(machine: MachineProduct): UnifiedProduct {
    return {
      id: machine.id.toString(),
      type: 'machine',
      partNumber: machine.code,
      name_zh: machine.title_zh,
      name_en: machine.title_en,
      image_url: machine.image_url,
      specifications: {
        voltage: machine.voltage,
        frequency: machine.frequency,
        palletSize: machine.pallet_size_cm
      },
      pricing: machine.pricing || [],
      inventory: machine.inventory || [],
      compatibility: machine.app_model?.split(',') || []
    };
  }
  
  static adaptAccessoryToUnified(accessory: Accessory): UnifiedProduct {
    // 类似适配逻辑
  }
}
```

---

## **4. 状态管理规范**

### 4.1 Context设计
```typescript
// 应用状态上下文
interface AppContextType {
  user: UserInfo | null;
  language: string;
  region: string;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
}

// 购物车上下文
interface CartContextType {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  addItem: (product: UnifiedProduct, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

// 产品上下文
interface ProductContextType {
  selectedProduct: string | null;
  filters: ProductFilters;
  accessories: AccessoryLevel[];
  setSelectedProduct: (productId: string) => void;
  updateFilters: (filters: Partial<ProductFilters>) => void;
  loadAccessories: (productId: string, level: number) => Promise<void>;
}
```

### 4.2 自定义Hooks
```typescript
// 产品数据Hook
export const useProducts = (type: ProductType, filters: ProductFilters) => {
  return useQuery(
    ['products', type, filters],
    () => getProductsByType(type, filters),
    {
      staleTime: 300000,
      cacheTime: 600000,
      keepPreviousData: true
    }
  );
};

// 购物车Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// 权限Hook
export const usePermissions = () => {
  const { user } = useAuth();
  
  return useMemo(() => ({
    canViewPrices: user?.permissions?.includes('view_prices') || user?.role === 'SALES',
    canViewInventory: user?.role === 'SALES',
    canEditProfile: user?.permissions?.includes('edit_profile')
  }), [user]);
};
```

---

## **5. 自动化测试用例**

### 5.1 E2E测试场景
```typescript
// 完整购买流程测试
describe('完整购买流程', () => {
  it('用户应能完成从产品选择到订单确认的完整流程', () => {
    // 1. 登录
    cy.login('sales@example.com', 'password123');
    
    // 2. 选择产品线
    cy.visit('/');
    cy.get('[data-testid="product-line-machines"]').click();
    
    // 3. 筛选和选择产品
    cy.get('[data-testid="voltage-filter"]').select('220V');
    cy.get('[data-testid="product-item"]').first().click();
    
    // 4. 选择配件
    cy.get('[data-testid="accessory-item"]').first().click();
    
    // 5. 添加到购物车
    cy.get('[data-testid="quantity-input"]').type('2');
    cy.get('[data-testid="add-to-cart"]').click();
    
    // 6. 查看购物车
    cy.get('[data-testid="floating-cart"]').click();
    cy.get('[data-testid="checkout-button"]').click();
    
    // 7. 填写订单信息
    cy.fillOrderForm({
      contact: 'John Doe',
      phone: '13800138000',
      address: 'Test Address 123'
    });
    
    // 8. 确认订单
    cy.get('[data-testid="create-order-button"]').click();
    cy.get('[data-testid="order-success"]').should('be.visible');
  });
});
```

### 5.2 组件单元测试
```typescript
// 产品卡片组件测试
describe('ProductCard组件', () => {
  const mockProduct: UnifiedProduct = {
    id: '1',
    type: 'machine',
    partNumber: 'BJT-M001',
    name_zh: '测试产品',
    name_en: 'Test Product',
    image_url: '/images/test.jpg',
    specifications: { voltage: '220V' },
    pricing: [{ price: 1000, currency: 'CNY' }],
    inventory: [{ quantity: 10, warehouse: 'Main' }],
    compatibility: ['Model-A']
  };

  it('应正确渲染产品信息', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('测试产品')).toBeInTheDocument();
    expect(screen.getByText('BJT-M001')).toBeInTheDocument();
    expect(screen.getByText('¥1,000')).toBeInTheDocument();
  });

  it('应根据权限控制价格显示', () => {
    const mockUser = { role: 'CUSTOMER', permissions: [] };
    
    render(
      <AuthProvider value={{ user: mockUser }}>
        <ProductCard product={mockProduct} />
      </AuthProvider>
    );
    
    expect(screen.queryByText('¥1,000')).not.toBeInTheDocument();
    expect(screen.getByText('请联系销售')).toBeInTheDocument();
  });
});
```

### 5.3 API集成测试
```typescript
// API服务测试
describe('ProductService', () => {
  it('应正确获取产品列表', async () => {
    const mockResponse = {
      success: true,
      data: {
        items: [mockProduct],
        total: 1,
        page: 1
      }
    };
    
    jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);
    
    const result = await productService.getMachines({
      product_line_id: 1,
      region: 'CN',
      lang: 'zh'
    });
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject(mockProduct);
  });

  it('应正确处理API错误', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network Error'));
    
    await expect(
      productService.getMachines({ product_line_id: 1 })
    ).rejects.toThrow('Network Error');
  });
});
```

### 5.4 性能测试
```typescript
// 性能基准测试
describe('性能测试', () => {
  it('大量数据渲染性能', () => {
    const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
      ...mockProduct,
      id: i.toString()
    }));

    const startTime = performance.now();
    
    render(<VirtualizedProductList products={largeProductList} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(100); // 渲染时间应小于100ms
  });

  it('API响应时间测试', async () => {
    const startTime = performance.now();
    
    await productService.getMachines({ product_line_id: 1 });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(2000); // API响应应小于2秒
  });
});
```

---

## **6. 性能优化策略**

### 6.1 数据缓存策略
```typescript
// React Query缓存配置
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

// 缓存键策略
export const cacheKeys = {
  products: (type: string, filters: any) => ['products', type, filters],
  productDetail: (id: string) => ['product', id],
  cart: (userId: string) => ['cart', userId],
  orders: (userId: string, filters: any) => ['orders', userId, filters]
};
```

### 6.2 虚拟化和懒加载
```typescript
// 虚拟化列表组件
export const VirtualizedProductList: React.FC = ({ products }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const handleScroll = useCallback((scrollTop: number) => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = Math.min(start + VISIBLE_COUNT, products.length);
    setVisibleRange({ start, end });
  }, [products.length]);
  
  return (
    <VirtualList
      height={600}
      itemCount={products.length}
      itemSize={ITEM_HEIGHT}
      onScroll={handleScroll}
    >
      {({ index, style }) => (
        <div style={style}>
          <ProductCard product={products[index]} />
        </div>
      )}
    </VirtualList>
  );
};

// 图片懒加载
export const LazyImage: React.FC = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={inView ? src : '/images/placeholder.jpg'}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
};
```

### 6.3 代码分割策略
```typescript
// 路由级代码分割
const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProductSelectionPage = lazy(() => import('../pages/ProductSelectionPage'));

// 组件级代码分割
const HeavyComponent = lazy(() => 
  import('../components/HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);

// 动态导入工具函数
const importUtils = async () => {
  const { formatCurrency, formatDate } = await import('../utils/formatters');
  return { formatCurrency, formatDate };
};
```

---

## **7. 部署与监控**

### 7.1 环境配置
```typescript
// 环境变量配置
interface EnvironmentConfig {
  API_BASE_URL: string;
  USE_MOCK_DATA: boolean;
  DEFAULT_REGION: string;
  SUPPORTED_LANGUAGES: string[];
  CACHE_TTL: number;
  MAX_CART_ITEMS: number;
  ENABLE_ANALYTICS: boolean;
  SENTRY_DSN?: string;
}

export const getConfig = (): EnvironmentConfig => {
  const env = import.meta.env.MODE || 'development';
  return environments[env] || environments.development;
};
```

### 7.2 错误监控
```typescript
// 错误边界组件
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 发送错误到监控服务
    if (getConfig().ENABLE_ANALYTICS) {
      Sentry.captureException(error, {
        contexts: { react: errorInfo }
      });
    }
    
    // 记录到控制台
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// 性能监控
export const performanceMonitor = {
  measurePageLoad: (pageName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // 发送性能数据
      analytics.track('page_load_time', {
        page: pageName,
        duration: loadTime
      });
    };
  },
  
  measureAPICall: (endpoint: string) => {
    const startTime = performance.now();
    
    return (success: boolean) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      analytics.track('api_call_performance', {
        endpoint,
        duration,
        success
      });
    };
  }
};
```

### 7.3 构建优化
```typescript
// Vite构建配置优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['antd'],
          utils: ['lodash', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  // PWA配置
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ]
});
```

---

## **8. 开发规范与最佳实践**

### 8.1 编码规范
```typescript
// TypeScript严格模式配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}

// ESLint规则
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

### 8.2 组件设计原则
```typescript
// 组件Props接口规范
interface ComponentProps {
  // 必需属性在前
  data: DataType;
  onAction: (item: DataType) => void;
  
  // 可选属性在后
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  disabled?: boolean;
  
  // 事件处理器以on开头
  onClick?: () => void;
  onChange?: (value: any) => void;
}

// 组件实现规范
export const MyComponent: React.FC<ComponentProps> = ({
  data,
  onAction,
  className,
  loading = false,
  ...props
}) => {
  // Hooks在顶部
  const { t } = useTranslation();
  const [state, setState] = useState<StateType>();
  
  // 事件处理器
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, [dependencies]);
  
  // 副作用
  useEffect(() => {
    // 副作用逻辑
  }, [dependencies]);
  
  // 渲染逻辑
  return (
    <div className={cn('my-component', className)} {...props}>
      {/* JSX内容 */}
    </div>
  );
};
```

---

## **9. 质量保证流程**

### 9.1 代码审查清单
- [ ] 类型定义完整且准确
- [ ] 错误处理完善
- [ ] 性能优化（useMemo、useCallback使用合理）
- [ ] 可访问性支持（ARIA标签、键盘导航）
- [ ] 响应式设计实现
- [ ] 国际化文本使用翻译键
- [ ] 测试用例覆盖核心功能
- [ ] 文档更新

### 9.2 发布流程
1. **开发分支**：功能开发和单元测试
2. **集成测试**：合并到测试分支，运行E2E测试
3. **性能测试**：检查构建大小和运行性能
4. **用户验收测试**：产品经理验收
5. **生产部署**：蓝绿部署，监控指标
6. **回滚准备**：准备快速回滚方案

---

此文档为BJT产品管理系统前端开发提供全面的技术指导和规范，确保系统的高质量交付和持续维护。 