# 前端代码整体说明

## 一、项目结构

### 1.1 目录结构
```
src/
├── pages/                    # 页面组件
│   ├── Consumables/         # 耗材页面
│   ├── SpareParts/          # 备件页面
│   ├── Machines/           # 设备页面
│   ├── Accessories/        # 配件页面
│   ├── Cart/               # 购物车页面
│   ├── Order/              # 订单详情页面
│   ├── OrderList/          # 订单列表页面
│   ├── Login/              # 登录页面
│   └── Home/               # 首页
├── components/              # 公共组件
│   ├── layout/             # 布局组件
│   ├── common/             # 通用组件
│   ├── Cart/               # 购物车相关组件
│   └── Machines/           # 设备相关组件
├── contexts/               # 状态管理
│   ├── AuthContext.tsx     # 认证状态
│   ├── CartContext.tsx     # 购物车状态
│   └── ProductContext.tsx  # 产品状态
├── services/              # API服务
│   ├── apiAnalysis/       # API分析文档
│   └── api/               # API调用实现
├── utils/                # 工具函数
├── config/               # 配置文件
├── i18n/                # 国际化
├── types/               # 类型定义
└── assets/              # 静态资源

```

### 1.2 核心功能模块

1. 产品展示模块
   - 耗材页面
   - 备件页面
   - 设备页面
   - 配件页面

2. 购物流程模块
   - 购物车管理
   - 订单管理
   - 价格展示
   - 库存管理

3. 用户管理模块
   - 登录认证
   - 权限控制
   - 用户信息

## 二、技术架构

### 2.1 核心技术栈
```typescript
// package.json 核心依赖
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "antd": "^5.0.0",
    "i18next": "^22.0.0",
    "axios": "^1.0.0"
  }
}
```

### 2.2 状态管理
```typescript
// 全局状态管理示例
export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  // 状态计算和缓存
  const cartTotal = useMemo(() => 
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, setItems, total: cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
```

### 2.3 路由管理
```typescript
// 路由配置
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/consumables', element: <Consumables /> },
      { path: '/spare-parts', element: <SpareParts /> },
      { path: '/machines', element: <Machines /> },
      { path: '/accessories', element: <Accessories /> }
    ]
  }
];
```

## 三、核心功能实现

### 3.1 数据流处理
```typescript
// 数据获取和缓存
const useProductData = (productId: string) => {
  const [data, setData] = useState<Product | null>(null);
  const { cacheManager } = useCache();

  useEffect(() => {
    const fetchData = async () => {
      // 检查缓存
      const cached = cacheManager.get(`product_${productId}`);
      if (cached) {
        setData(cached);
        return;
      }

      // 获取数据
      const response = await productApi.getProduct(productId);
      setData(response.data);

      // 设置缓存
      cacheManager.set(`product_${productId}`, response.data, 300000);
    };

    fetchData();
  }, [productId]);

  return data;
};
```

### 3.2 组件复用
```typescript
// 可复用的产品卡片组件
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  showInventory = true,
  showPrice = true
}) => {
  const { t } = useTranslation();
  const { userRole } = useAuth();

  return (
    <Card className="product-card">
      <Image src={product.image} fallback={defaultImage} />
      <div className="product-info">
        <Typography.Title level={5}>{product.name}</Typography.Title>
        {showPrice && userRole !== 'guest' && (
          <PriceDisplay price={product.price} />
        )}
        {showInventory && (userRole === 'admin' || userRole === 'sales') && (
          <InventoryDisplay inventory={product.inventory} />
        )}
      </div>
    </Card>
  );
};
```

### 3.3 权限控制
```typescript
// 权限控制HOC
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: string[]
) => {
  return (props: any) => {
    const { permissions } = useAuth();
    const hasPermission = requiredPermissions.every(
      permission => permissions.includes(permission)
    );

    if (!hasPermission) {
      return <NoPermission />;
    }

    return <WrappedComponent {...props} />;
  };
};
```

## 四、性能优化

### 4.1 数据缓存
```typescript
// 缓存管理器
export const cacheManager = {
  set: (key: string, data: any, ttl: number) => {
    localStorage.setItem(key, JSON.stringify({
      data,
      expires: Date.now() + ttl
    }));
  },

  get: (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, expires } = JSON.parse(cached);
    if (Date.now() > expires) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  }
};
```

### 4.2 组件优化
```typescript
// 使用React.memo优化组件渲染
export const ProductList = React.memo<ProductListProps>(({ products }) => {
  return (
    <div className="product-list">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
});

// 使用useMemo优化计算
const filteredProducts = useMemo(() => 
  products.filter(product => product.price <= maxPrice),
  [products, maxPrice]
);
```

### 4.3 懒加载
```typescript
// 路由懒加载
const Consumables = lazy(() => import('./pages/Consumables'));
const SpareParts = lazy(() => import('./pages/SpareParts'));

// 图片懒加载
const LazyImage: React.FC<LazyImageProps> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="lazy-image-container">
      <img 
        src={src}
        alt={alt}
        className={loaded ? 'loaded' : ''}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <Skeleton.Image />}
    </div>
  );
};
```

## 五、错误处理

### 5.1 全局错误处理
```typescript
// 错误边界组件
export class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 发送错误到监控系统
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 5.2 API错误处理
```typescript
// API请求错误处理
const request = async (url: string, options?: RequestOptions) => {
  try {
    const response = await axios(url, options);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // 处理认证错误
      auth.logout();
      navigate('/login');
    } else if (error.response?.status === 403) {
      // 处理权限错误
      message.error('没有权限访问');
    } else {
      // 处理其他错误
      message.error('请求失败，请稍后重试');
    }
    throw error;
  }
};
```

## 六、国际化支持

### 6.1 翻译配置
```typescript
// i18n配置
const resources = {
  zh: {
    translation: {
      product: {
        price: '价格',
        inventory: '库存',
        addToCart: '加入购物车'
      }
    }
  },
  en: {
    translation: {
      product: {
        price: 'Price',
        inventory: 'Inventory',
        addToCart: 'Add to Cart'
      }
    }
  }
};

i18n.init({
  resources,
  lng: 'zh',
  fallbackLng: 'en'
});
```

### 6.2 组件中使用
```typescript
// 在组件中使用翻译
const ProductInfo: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation();
  
  return (
    <div className="product-info">
      <div className="price">
        {t('product.price')}: {product.price}
      </div>
      <div className="inventory">
        {t('product.inventory')}: {product.inventory}
      </div>
      <Button>
        {t('product.addToCart')}
      </Button>
    </div>
  );
};
```

## 七、测试策略

### 7.1 单元测试
```typescript
// 组件测试
describe('ProductCard', () => {
  it('should render product information correctly', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 100
    };
    
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
```

### 7.2 集成测试
```typescript
// 购物流程测试
describe('Shopping Flow', () => {
  it('should add product to cart successfully', async () => {
    render(<ProductPage />);
    
    // 选择产品
    const product = screen.getByText('Test Product');
    fireEvent.click(product);
    
    // 添加到购物车
    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);
    
    // 验证购物车
    expect(screen.getByText('1 item in cart')).toBeInTheDocument();
  });
});
```

## 八、部署和构建

### 8.1 构建配置
```json
// vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'antd'],
          utils: ['lodash', 'axios']
        }
      }
    }
  },
  plugins: [
    react(),
    viteCompression()
  ]
});
```

### 8.2 环境配置
```typescript
// .env.production
VITE_API_URL=https://api.example.com
VITE_IMAGE_URL=https://static.example.com
VITE_GA_ID=UA-XXXXXXXXX-X

// .env.development
VITE_API_URL=http://localhost:3000
VITE_IMAGE_URL=http://localhost:3000
```

## 九、开发规范

### 9.1 代码规范
```typescript
// .eslintrc
{
  "extends": [
    "react-app",
    "react-app/jest",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 9.2 提交规范
```bash
# .commitlintrc
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", [
      "feat",
      "fix",
      "docs",
      "style",
      "refactor",
      "test",
      "chore"
    ]]
  }
}
``` 