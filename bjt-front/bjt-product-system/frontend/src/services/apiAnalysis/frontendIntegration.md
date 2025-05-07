# 前端代码整合方案

## 一、现状分析

目前存在两处前端代码：
1. `bjt-front/` - 新的React前端项目（主代码）
2. `bjt-product-admin/public-frontend/build/` - 旧的前端代码（可删除）

## 二、整合方案

### 2.1 清理旧代码
1. 删除 `public-frontend/build` 目录
2. 更新WordPress插件配置，移除对旧前端代码的引用

### 2.2 构建流程
```bash
# 1. 前端构建
cd bjt-front
npm run build

# 2. 更新WordPress插件配置
cd ../bjt-product-admin
wp plugin deactivate bjt-product-admin
wp plugin activate bjt-product-admin
```

### 2.3 目录结构
```
bjt-front/                           # 主前端项目
├── src/
│   ├── pages/                      # 页面组件
│   ├── components/                 # 公共组件
│   ├── services/                   # API服务
│   ├── contexts/                   # 状态管理
│   ├── utils/                      # 工具函数
│   └── i18n/                       # 国际化
└── build/                          # 构建输出目录

bjt-product-admin/
└── public-frontend/                # 仅保留目录结构
```

### 2.4 路由配置
```typescript
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/machines',
        element: <Machines />
      },
      {
        path: '/accessories',
        element: <Accessories />
      },
      {
        path: '/consumables',
        element: <Consumables />
      },
      {
        path: '/spare-parts',
        element: <SpareParts />
      }
    ]
  }
]);
```

### 2.5 API配置
```typescript
// src/services/api/index.ts
export class ApiService {
  private static instance: ApiService;
  private baseURL: string;

  private constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // 产品相关API
  public async getProducts(params: ProductQueryParams): Promise<ProductResponse> {
    return this.request('/wp-json/bjt/v1/products', { method: 'GET', params });
  }

  // 购物车相关API
  public async updateCart(item: CartItem): Promise<CartResponse> {
    return this.request('/wp-json/bjt/v1/cart', { method: 'POST', data: item });
  }
}
```

## 三、部署配置

### 3.1 Nginx配置
```nginx
server {
    listen 80;
    server_name example.com;
    root /usr/share/nginx/html;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /wp-json/ {
        proxy_pass http://wordpress;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3.2 Docker配置
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.20
    ports:
      - "80:80"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - wordpress

  wordpress:
    image: wordpress:php8.0
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: bjt_product
    volumes:
      - ./wordpress:/var/www/html
      - ./plugins:/var/www/html/wp-content/plugins
```

## 四、开发流程

### 4.1 本地开发
```bash
# 启动前端开发服务器
cd bjt-front
npm run dev

# 启动WordPress开发环境
docker-compose up
```

### 4.2 构建部署
```bash
# 构建前端
cd bjt-front
npm run build

# 部署
docker-compose -f docker-compose.prod.yml up -d
```

## 五、注意事项

### 5.1 性能优化
1. 使用代码分割
2. 优化资源加载
3. 实现缓存策略

### 5.2 安全考虑
1. API请求认证
2. 数据验证
3. XSS防护

### 5.3 维护建议
1. 保持代码规范
2. 完善文档
3. 定期更新依赖

## 六、后续规划

### 6.1 功能增强
1. 添加新功能模块
2. 优化用户体验
3. 提升性能

### 6.2 技术升级
1. 更新技术栈
2. 优化构建流程
3. 改进开发工具

### 6.3 监控运维
1. 添加性能监控
2. 完善错误追踪
3. 优化部署流程 