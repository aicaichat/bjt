# 基于现有代码的开发计划

## 一、代码分析与评估（2-3天）

### 1.1 前端代码分析
1. 已实现的功能
   - 产品展示页面
   - 耗材页面
   - 备件页面
   - 购物车功能

2. 代码结构分析
   ```
   bjt-front/
   ├── src/
   │   ├── pages/
   │   │   ├── Consumables/
   │   │   └── SpareParts/
   │   ├── services/
   │   │   └── apiAnalysis/
   │   └── components/
   ```

3. 待开发功能
   - 产品线管理
   - 设备管理
   - 配件管理
   - 用户权限管理

### 1.2 后端需求分析
1. 数据库设计评估
   ```sql
   -- 已有表结构
   CREATE TABLE wp_bjt_product_lines (
     id bigint(20) NOT NULL AUTO_INCREMENT,
     code varchar(50) NOT NULL,
     name_cn varchar(100) NOT NULL,
     name_en varchar(100) NOT NULL,
     ...
   );
   ```

2. API接口评估
   - 已实现的API
   - 待开发的API
   - 接口规范统一

## 二、开发环境搭建（1天）

### 2.1 本地开发环境
```bash
# 克隆现有代码
git clone [repository_url]
cd product-management-system

# 安装依赖
cd bjt-front
npm install

# 启动开发服务器
npm start
```

### 2.2 Docker开发环境
```bash
# 使用现有的docker-compose配置
docker-compose -f docker-compose.dev.yml up -d

# 初始化WordPress环境
docker-compose exec wordpress bash
wp core install
wp plugin activate bjt-product-admin
```

## 三、后端开发计划（10-12天）

### 3.1 数据库开发
1. 补充数据表
```sql
-- 添加新的关联表
CREATE TABLE wp_bjt_relations (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  parent_type varchar(50) NOT NULL,
  parent_id bigint(20) NOT NULL,
  child_type varchar(50) NOT NULL,
  child_id bigint(20) NOT NULL,
  ...
);
```

2. 数据迁移
```php
// 数据迁移脚本
class BJT_Data_Migration {
  public function migrate_existing_data() {
    // 迁移现有数据到新表结构
  }
}
```

### 3.2 API开发
1. 产品线管理API
```php
class BJT_Product_Line_Controller extends BJT_REST_Controller {
  public function register_routes() {
    register_rest_route('bjt/v1', '/product-lines', [
      'methods' => 'GET',
      'callback' => [$this, 'get_items'],
      'permission_callback' => [$this, 'get_items_permissions_check'],
    ]);
  }
}
```

2. 设备管理API
```php
class BJT_Machine_Controller extends BJT_REST_Controller {
  public function register_routes() {
    register_rest_route('bjt/v1', '/machines', [
      'methods' => 'GET',
      'callback' => [$this, 'get_items'],
      'permission_callback' => [$this, 'get_items_permissions_check'],
    ]);
  }
}
```

### 3.3 管理界面开发
1. 产品线管理页面
```php
class BJT_Product_Line_Admin {
  public function render_page() {
    include_once BJT_PLUGIN_DIR . 'templates/admin/product-lines/list.php';
  }
}
```

2. 设备管理页面
```php
class BJT_Machine_Admin {
  public function render_page() {
    include_once BJT_PLUGIN_DIR . 'templates/admin/machines/list.php';
  }
}
```

## 四、前端开发计划（8-10天）

### 4.1 组件开发
1. 产品线管理组件
```typescript
// src/pages/ProductLines/index.tsx
const ProductLinesPage: React.FC = () => {
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  
  useEffect(() => {
    // 加载产品线数据
    loadProductLines();
  }, []);
  
  return (
    <div className="product-lines-page">
      {/* 组件内容 */}
    </div>
  );
};
```

2. 设备管理组件
```typescript
// src/pages/Machines/index.tsx
const MachinesPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  
  useEffect(() => {
    // 加载设备数据
    loadMachines();
  }, []);
  
  return (
    <div className="machines-page">
      {/* 组件内容 */}
    </div>
  );
};
```

### 4.2 API服务封装
```typescript
// src/services/api.ts
export const productLineApi = {
  getProductLines: async () => {
    const response = await fetch('/wp-json/bjt/v1/product-lines');
    return response.json();
  },
  
  createProductLine: async (data: ProductLineData) => {
    const response = await fetch('/wp-json/bjt/v1/product-lines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```

### 4.3 状态管理优化
```typescript
// src/contexts/ProductContext.tsx
export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC = ({ children }) => {
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  // 状态管理逻辑
  
  return (
    <ProductContext.Provider value={{ productLines, machines, ... }}>
      {children}
    </ProductContext.Provider>
  );
};
```

## 五、联调与测试（5-6天）

### 5.1 接口联调
1. API测试脚本
```typescript
// tests/api/product-lines.test.ts
describe('Product Lines API', () => {
  test('should fetch product lines', async () => {
    const response = await productLineApi.getProductLines();
    expect(response.success).toBe(true);
  });
});
```

2. 前端集成测试
```typescript
// tests/integration/product-lines.test.tsx
describe('Product Lines Page', () => {
  test('should render product lines', async () => {
    render(<ProductLinesPage />);
    await waitFor(() => {
      expect(screen.getByText('Product Lines')).toBeInTheDocument();
    });
  });
});
```

### 5.2 性能优化
1. 数据缓存
```typescript
// src/utils/cache.ts
export const cacheManager = {
  set: (key: string, data: any, ttl: number) => {
    localStorage.setItem(key, JSON.stringify({
      data,
      expires: Date.now() + ttl,
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
  },
};
```

2. 组件优化
```typescript
// src/components/ProductList.tsx
const ProductList: React.FC<ProductListProps> = memo(({ products }) => {
  return (
    <div className="product-list">
      {products.map(product => (
        <ProductItem key={product.id} product={product} />
      ))}
    </div>
  );
});
```

## 六、部署与上线（2-3天）

### 6.1 部署准备
1. 构建配置
```json
// package.json
{
  "scripts": {
    "build": "react-scripts build",
    "build:prod": "REACT_APP_ENV=production react-scripts build"
  }
}
```

2. 环境配置
```env
# .env.production
REACT_APP_API_URL=https://your-domain.com/wp-json/bjt/v1
```

### 6.2 部署步骤
```bash
# 1. 构建前端
cd bjt-front
npm run build:prod

# 2. 构建Docker镜像
docker-compose -f docker-compose.prod.yml build

# 3. 部署服务
docker-compose -f docker-compose.prod.yml up -d
```

## 七、开发规范

### 7.1 代码规范
1. TypeScript规范
```typescript
// 使用接口定义数据结构
interface ProductLine {
  id: string;
  code: string;
  name: {
    cn: string;
    en: string;
  };
}

// 使用枚举定义常量
enum ProductType {
  Machine = 'machine',
  Accessory = 'accessory',
  Consumable = 'consumable',
}
```

2. PHP规范
```php
// 使用命名空间
namespace BJT\ProductAdmin;

// 使用类型提示
public function get_product_line(int $id): ?ProductLine {
  // 方法实现
}
```

### 7.2 提交规范
```bash
# 功能开发
git checkout -b feature/product-line-management
git commit -m "feat: 添加产品线管理功能"

# 修复bug
git checkout -b fix/api-error-handling
git commit -m "fix: 修复API错误处理"
```

## 八、进度控制

### 8.1 每日任务
1. 早会同步
   - 昨日完成事项
   - 今日计划
   - 遇到的问题

2. 代码提交
   - 至少一次有效提交
   - 提交信息规范
   - 代码审查

### 8.2 周期总结
1. 周报内容
   - 完成的功能
   - 解决的问题
   - 下周计划

2. 代码评审
   - 代码质量
   - 性能问题
   - 安全问题 