# Consumables 页面逻辑总结

## 1. 核心功能流程

### 1.1 初始化流程
1. 获取用户信息和区域设置
2. 初始化筛选条件状态
3. 调用 `getConsumables` 获取耗材列表
   - 参数：filters, region, lang
   - 根据筛选条件过滤对应的耗材
4. 设置默认数量状态
5. 初始化购物车状态

### 1.2 筛选流程
1. 用户选择筛选条件
   - 型号选择
   - 单位切换（公制/英制）
   - 形状选择
   - 材质选择
   - 尺寸筛选（厚度/重量、宽度、长度）
2. 更新筛选状态
3. 重新获取数据
4. 更新视图显示

### 1.3 购物车操作流程
1. 用户设置数量
2. 点击添加到购物车
3. 创建价格层级数据
4. 调用 `addToCart` 添加商品
5. 更新购物车状态
6. 显示操作结果通知

## 2. API 定义

### 2.1 核心API
```typescript
// 获取耗材列表
interface GetConsumablesParams {
  model?: string;          // 型号
  brand?: string;          // 品牌
  part_number?: string;    // 料号
  pak_shape?: string;      // 包装形状
  material?: string;       // 材料
  thickness_met?: string;  // 厚度(公制)
  thickness_imp?: string;  // 厚度(英制)
  gram_met?: string;       // 克重(公制)
  gram_imp?: string;       // 克重(英制)
  pcs_width_met?: string;  // 宽度(公制)
  pcs_width_imp?: string;  // 宽度(英制)
  pcs_length_met?: string; // 长度(公制)
  pcs_length_imp?: string; // 长度(英制)
  page?: number;          // 分页
  page_size?: number;     // 每页数量
  region?: string;        // 区域
  lang?: string;          // 语言
}

// 添加到购物车
interface AddToCartParams {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  specs: {
    model: string;
    productName: string;
  };
  partNumber: string;
  category: 'consumables';
  productId: number;
  selected: boolean;
  image: string;
  priceTiers: PriceTier[];
}
```

### 2.2 数据结构
```typescript
// 耗材产品类型
interface ConsumableProduct {
  id: string;
  name: string;
  code: string;
  model: string;
  image_url: string;
  specs: {
    material: string;
    shape: string;
    thickness?: string;
    weight?: string;
    width: string;
    length: string;
    rollLength?: string;
    compatibility: string;
  };
  pricing: Array<{
    range: string;
    price: number;
    regionalPrices: {
      eu: number;
      na: number;
      au: number;
      cn: number;
    };
  }>;
  inventory: Record<string, number>;
}
```

## 3. 状态管理

### 3.1 核心状态
```typescript
// 产品状态
const [consumables, setConsumables] = useState<ConsumableProduct[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

// 筛选条件状态
const [selectedModel, setSelectedModel] = useState<string>('all');
const [selectedUnit, setSelectedUnit] = useState<string>('metric');
const [selectedShape, setSelectedShape] = useState<string>('pillow');
const [selectedMaterial, setSelectedMaterial] = useState<string>('hdpe');
const [selectedThickness, setSelectedThickness] = useState<string>('all');
const [selectedWeight, setSelectedWeight] = useState<string>('all');
const [selectedWidth, setSelectedWidth] = useState<string>('all');
const [selectedLength, setSelectedLength] = useState<string>('all');

// 用户选择状态
const [quantities, setQuantities] = useState<Record<string, number>>({});
```

### 3.2 状态处理
```typescript
// 处理筛选条件变更
useEffect(() => {
  const fetchConsumables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: ConsumableFilters = {
        model: selectedModel,
        shape: selectedShape,
        material: selectedMaterial,
        thickness: selectedThickness === 'all' ? undefined : selectedThickness,
        weight: selectedWeight === 'all' ? undefined : selectedWeight,
        width: selectedWidth === 'all' ? undefined : selectedWidth,
        length: selectedLength === 'all' ? undefined : selectedLength,
        page: currentPage,
        page_size: 10,
        region: userRegion,
        lang: navigator.language.startsWith('zh') ? 'zh' : 'en'
      };
      
      const response = await consumablesService.getConsumables(filters);
      
      if (response.success) {
        setConsumables(response.data.items);
        setTotalItems(response.data.total);
        setTotalPages(response.data.total_pages);
      }
    } catch (err) {
      setError(t('error.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };
  
  fetchConsumables();
}, [selectedModel, selectedShape, selectedMaterial, selectedThickness, 
    selectedWeight, selectedWidth, selectedLength, currentPage, userRegion]);
```

## 4. 用户界面组件

### 4.1 主要组件
```typescript
// 筛选器组件
const FilterContainer: React.FC = () => {
  return (
    <div className="filter-container">
      <ModelSelector />
      <UnitSelector />
      <ShapeSelector />
      <MaterialSelector />
      <DimensionFilters />
    </div>
  );
};

// 产品列表组件
const ProductsContainer: React.FC = () => {
  return (
    <div className="products-container">
      <ProductsTable />
      <MobileCards />
      <Pagination />
    </div>
  );
};

// 规格提示组件
const SpecTooltip: React.FC = () => {
  return (
    <div className="spec-tooltip">
      <h4>Product Specifications</h4>
      <div className="tooltip-content">
        <SpecificationsList />
      </div>
    </div>
  );
};
```

## 5. 错误处理

### 5.1 错误类型
```typescript
// 数据加载错误
const handleLoadError = (error: any) => {
  if (error.code === 'NETWORK_ERROR') {
    message.error(t('error.networkError'));
  } else {
    message.error(t('error.failedToLoad'));
  }
};

// 购物车操作错误
const handleCartError = (error: any) => {
  if (error.code === 'INVALID_QUANTITY') {
    message.error(t('error.invalidQuantity'));
  } else {
    message.error(t('error.addToCartFailed'));
  }
};
```

## 6. 性能优化

### 6.1 已实现的优化
1. 分页加载数据
2. 防抖处理筛选条件变更
3. 响应式布局适配
4. 图片懒加载
5. 状态缓存

### 6.2 待优化点
1. 实现数据预加载
2. 优化图片加载策略
3. 添加筛选条件缓存
4. 优化移动端性能

## 7. 国际化支持

### 7.1 语言支持
```typescript
// 语言切换
const handleLanguageChange = (lang: string) => {
  i18n.changeLanguage(lang);
  fetchConsumables(); // 重新加载数据
};

// 单位转换
const convertUnit = (value: number, from: string, to: string) => {
  if (from === 'metric' && to === 'imperial') {
    return value * 0.03937; // 公制转英制
  }
  return value / 0.03937; // 英制转公制
};
```

## 8. 待优化点

### 8.1 短期优化
1. 完善错误处理机制
2. 优化筛选条件交互
3. 改进移动端适配
4. 添加批量操作功能

### 8.2 长期优化
1. 实现智能推荐系统
2. 优化数据加载性能
3. 添加高级筛选功能
4. 实现数据导出功能

## 9. 筛选交互细节

### 9.1 筛选条件交互
```typescript
// 型号选择交互
const handleModelChange = (value: string) => {
  setSelectedModel(value);
  // 重置其他筛选条件
  setSelectedShape('pillow');
  setSelectedMaterial('hdpe');
  setSelectedThickness('all');
  setSelectedWeight('all');
  setSelectedWidth('all');
  setSelectedLength('all');
};

// 单位切换交互
const handleUnitChange = (value: string) => {
  setSelectedUnit(value);
  // 更新所有尺寸显示
  updateDimensionDisplay(value);
};

// 形状选择交互
const handleShapeChange = (value: string) => {
  setSelectedShape(value);
  // 根据形状更新可选的材质
  updateAvailableMaterials(value);
};

// 材质选择交互
const handleMaterialChange = (value: string) => {
  setSelectedMaterial(value);
  // 根据材质更新可选的厚度/重量
  updateAvailableThicknessOrWeight(value);
};
```

### 9.2 规格提示框(Tooltip)展示字段
```typescript
interface SpecTooltipContent {
  // 基本信息
  name: string;           // 产品名称
  code: string;           // 产品编码
  model: string;          // 适用型号
  
  // 物理规格
  material: string;       // 材料
  shape: string;         // 形状
  thickness: {           // 厚度
    metric: string;      // 公制(um)
    imperial: string;    // 英制(mil)
  };
  weight: {             // 重量(仅纸类)
    metric: string;     // 公制(gsm)
    imperial: string;   // 英制(#)
  };
  width: {              // 宽度
    metric: string;     // 公制(cm)
    imperial: string;   // 英制(inch)
  };
  length: {             // 长度
    metric: string;     // 公制(cm)
    imperial: string;   // 英制(inch)
  };
  rollLength?: {        // 卷长(仅卷材)
    metric: string;     // 公制(m)
    imperial: string;   // 英制(ft)
  };
  
  // 兼容性信息
  compatibility: string; // 兼容性说明
}
```

### 9.3 购物车展示字段
```typescript
interface CartItemDisplay {
  // 基本信息
  id: string;           // 产品ID
  code: string;         // 产品编码
  name: string;         // 产品名称
  image: string;        // 产品图片
  
  // 规格信息
  specs: {
    model: string;      // 适用型号
    material: string;   // 材料
    shape: string;      // 形状
    dimensions: {       // 尺寸信息
      width: string;    // 宽度
      length: string;   // 长度
      thickness?: string; // 厚度(非纸类)
      weight?: string;   // 重量(纸类)
    };
  };
  
  // 价格信息
  price: {
    current: number;    // 当前单价
    currency: string;   // 货币符号
    tiers: Array<{      // 价格区间
      range: string;    // 数量范围
      price: number;    // 区间价格
    }>;
  };
  
  // 数量信息
  quantity: {
    value: number;      // 当前数量
    unit: string;       // 单位
    min: number;        // 最小数量
    max?: number;       // 最大数量
  };
  
  // 库存信息
  inventory: {
    available: number;  // 可用库存
    region: string;     // 区域
  };
}
```

### 9.4 筛选条件联动逻辑
```typescript
// 型号与形状联动
const updateShapeOptions = (model: string) => {
  const availableShapes = getAvailableShapes(model);
  setShapeOptions(availableShapes);
  // 如果当前选择的形状不在可用选项中，重置为默认值
  if (!availableShapes.includes(selectedShape)) {
    setSelectedShape('pillow');
  }
};

// 形状与材质联动
const updateMaterialOptions = (shape: string) => {
  const availableMaterials = getAvailableMaterials(shape);
  setMaterialOptions(availableMaterials);
  // 如果当前选择的材质不在可用选项中，重置为默认值
  if (!availableMaterials.includes(selectedMaterial)) {
    setSelectedMaterial('hdpe');
  }
};

// 材质与尺寸联动
const updateDimensionOptions = (material: string) => {
  if (material === 'paper_pe') {
    // 纸类显示重量选项
    setWeightOptions(getAvailableWeights());
    setSelectedWeight('all');
  } else {
    // 非纸类显示厚度选项
    setThicknessOptions(getAvailableThicknesses());
    setSelectedThickness('all');
  }
};
```

### 9.5 单位转换处理
```typescript
// 尺寸单位转换
const convertDimensions = (value: number, from: string, to: string) => {
  const conversions = {
    // 长度转换
    'cm_to_inch': (v: number) => v / 2.54,
    'inch_to_cm': (v: number) => v * 2.54,
    // 厚度转换
    'um_to_mil': (v: number) => v * 0.03937,
    'mil_to_um': (v: number) => v / 0.03937,
    // 重量转换
    'gsm_to_lb': (v: number) => v * 0.00220462,
    'lb_to_gsm': (v: number) => v / 0.00220462
  };
  
  const key = `${from}_to_${to}`;
  return conversions[key] ? conversions[key](value) : value;
};

// 价格单位转换
const convertPrice = (price: number, fromCurrency: string, toCurrency: string) => {
  const rates = getExchangeRates();
  return price * (rates[toCurrency] / rates[fromCurrency]);
};
```

### 9.6 筛选条件缓存
```typescript
// 保存筛选条件到本地存储
const saveFilterState = () => {
  const filterState = {
    model: selectedModel,
    unit: selectedUnit,
    shape: selectedShape,
    material: selectedMaterial,
    thickness: selectedThickness,
    weight: selectedWeight,
    width: selectedWidth,
    length: selectedLength,
    timestamp: Date.now()
  };
  localStorage.setItem('consumablesFilters', JSON.stringify(filterState));
};

// 从本地存储恢复筛选条件
const restoreFilterState = () => {
  const savedState = localStorage.getItem('consumablesFilters');
  if (savedState) {
    const { timestamp, ...filters } = JSON.parse(savedState);
    // 检查缓存是否过期（24小时）
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      Object.entries(filters).forEach(([key, value]) => {
        const setter = `setSelected${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (typeof window[setter] === 'function') {
          window[setter](value);
        }
      });
    }
  }
};
```

## 10. 用户权限与展示逻辑

### 10.1 用户角色定义
```typescript
interface UserRole {
  type: 'admin' | 'sales' | 'customer' | 'vip';
  permissions: {
    viewPrice: boolean;      // 查看价格权限
    viewInventory: boolean;  // 查看库存权限
    viewCost: boolean;       // 查看成本权限
    editPrice: boolean;      // 编辑价格权限
    editInventory: boolean;  // 编辑库存权限
  };
  region: string;           // 用户所属区域
  discountRate?: number;    // 用户折扣率
}
```

### 10.2 价格展示逻辑
```typescript
// 价格计算逻辑
const calculateDisplayPrice = (product: ConsumableProduct, user: UserRole) => {
  // 获取基础价格
  const basePrice = getRegionalPrice(product, user.region);
  
  // 应用用户折扣
  if (user.discountRate) {
    return basePrice * (1 - user.discountRate);
  }
  
  // VIP用户特殊价格
  if (user.type === 'vip') {
    return basePrice * 0.9; // VIP用户9折
  }
  
  return basePrice;
};

// 价格区间展示
const getPriceTiersDisplay = (product: ConsumableProduct, user: UserRole) => {
  return product.pricing.map(tier => ({
    range: tier.range,
    price: calculateDisplayPrice({
      ...product,
      pricing: [tier]
    }, user)
  }));
};

// 价格显示格式化
const formatPriceDisplay = (price: number, user: UserRole) => {
  const currency = getCurrencyByRegion(user.region);
  const formattedPrice = formatCurrency(price, currency);
  
  // 根据用户权限决定是否显示价格
  if (!user.permissions.viewPrice) {
    return 'Contact Sales';
  }
  
  return formattedPrice;
};
```

### 10.3 库存展示逻辑
```typescript
// 库存显示逻辑
const getInventoryDisplay = (product: ConsumableProduct, user: UserRole) => {
  // 管理员和销售可以看到所有区域库存
  if (user.type === 'admin' || user.type === 'sales') {
    return {
      showInventory: true,
      inventory: product.inventory,
      showAllRegions: true
    };
  }
  
  // 普通用户只能看到自己区域的库存
  return {
    showInventory: user.permissions.viewInventory,
    inventory: {
      [user.region]: product.inventory[user.region]
    },
    showAllRegions: false
  };
};

// 库存状态显示
const getInventoryStatus = (inventory: number) => {
  if (inventory <= 0) return 'Out of Stock';
  if (inventory < 10) return 'Low Stock';
  return 'In Stock';
};

// 库存警告逻辑
const checkInventoryWarning = (product: ConsumableProduct, user: UserRole) => {
  if (user.type === 'admin' || user.type === 'sales') {
    return Object.entries(product.inventory).some(([region, count]) => count < 10);
  }
  return product.inventory[user.region] < 10;
};
```

### 10.4 用户特定展示组件
```typescript
// 价格显示组件
const PriceDisplay: React.FC<{product: ConsumableProduct, user: UserRole}> = ({product, user}) => {
  const price = calculateDisplayPrice(product, user);
  
  if (!user.permissions.viewPrice) {
    return <div className="price-contact">Contact Sales</div>;
  }
  
  return (
    <div className="price-display">
      <div className="current-price">
        {formatPriceDisplay(price, user)}
      </div>
      {user.type === 'vip' && (
        <div className="vip-badge">VIP Price</div>
      )}
      <div className="price-tiers">
        {getPriceTiersDisplay(product, user).map(tier => (
          <div key={tier.range} className="price-tier">
            <span>{tier.range}:</span>
            <span>{formatPriceDisplay(tier.price, user)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 库存显示组件
const InventoryDisplay: React.FC<{product: ConsumableProduct, user: UserRole}> = ({product, user}) => {
  const {showInventory, inventory, showAllRegions} = getInventoryDisplay(product, user);
  
  if (!showInventory) {
    return null;
  }
  
  return (
    <div className="inventory-display">
      {showAllRegions ? (
        // 显示所有区域库存
        Object.entries(inventory).map(([region, count]) => (
          <div key={region} className="inventory-region">
            <span className="region">{region.toUpperCase()}:</span>
            <span className={`count ${getInventoryStatus(count).toLowerCase()}`}>
              {count}
            </span>
          </div>
        ))
      ) : (
        // 只显示用户区域库存
        <div className="inventory-single">
          <span className={`count ${getInventoryStatus(inventory[user.region]).toLowerCase()}`}>
            {inventory[user.region]}
          </span>
        </div>
      )}
      
      {/* 库存警告 */}
      {checkInventoryWarning(product, user) && (
        <div className="inventory-warning">
          Low Stock Warning
        </div>
      )}
    </div>
  );
};
```

### 10.5 用户权限检查
```typescript
// 权限检查工具
const checkUserPermissions = (user: UserRole, requiredPermission: keyof UserRole['permissions']) => {
  return user.permissions[requiredPermission];
};

// 区域权限检查
const checkRegionAccess = (user: UserRole, region: string) => {
  if (user.type === 'admin') return true;
  return user.region === region;
};

// 价格编辑权限
const canEditPrice = (user: UserRole) => {
  return user.type === 'admin' || (user.type === 'sales' && user.permissions.editPrice);
};

// 库存编辑权限
const canEditInventory = (user: UserRole) => {
  return user.type === 'admin' || (user.type === 'sales' && user.permissions.editInventory);
};
```

## 11. 产品线集成

### 11.1 产品线数据结构
```typescript
interface ProductLine {
  id: string;
  name: string;
  code: string;
  description: string;
  consumables: string[];      // 关联的耗材ID列表
  region: string;            // 产品线所属区域
  status: 'active' | 'inactive';
}

interface ConsumableProductLine {
  productLineId: string;     // 所属产品线ID
  consumableId: string;      // 耗材ID
  isDefault: boolean;        // 是否为默认耗材
  compatibility: string[];   // 兼容的型号列表
}
```

### 11.2 产品线初始化流程
```typescript
// 页面初始化
const ConsumablesPage: React.FC<{productLineId: string}> = ({productLineId}) => {
  // 状态定义
  const [productLine, setProductLine] = useState<ProductLine | null>(null);
  const [consumables, setConsumables] = useState<ConsumableProduct[]>([]);
  
  // 初始化流程
  useEffect(() => {
    const initializePage = async () => {
      try {
        // 1. 获取产品线信息
        const productLineResponse = await getProductLine(productLineId);
        if (!productLineResponse.success) {
          throw new Error('Failed to load product line');
        }
        setProductLine(productLineResponse.data);
        
        // 2. 获取该产品线下的耗材列表
        const consumablesResponse = await getConsumablesByProductLine(productLineId);
        if (!consumablesResponse.success) {
          throw new Error('Failed to load consumables');
        }
        setConsumables(consumablesResponse.data);
        
        // 3. 设置默认筛选条件
        setDefaultFilters(productLineResponse.data);
      } catch (error) {
        handleError(error);
      }
    };
    
    initializePage();
  }, [productLineId]);
  
  // 设置默认筛选条件
  const setDefaultFilters = (productLine: ProductLine) => {
    // 根据产品线设置默认型号
    const defaultModel = getDefaultModel(productLine);
    setSelectedModel(defaultModel);
    
    // 根据产品线设置默认区域
    setUserRegion(productLine.region);
  };
};
```

### 11.3 产品线筛选逻辑
```typescript
// 获取产品线下的耗材
const getConsumablesByProductLine = async (productLineId: string) => {
  const filters: ConsumableFilters = {
    productLineId,
    model: selectedModel,
    shape: selectedShape,
    material: selectedMaterial,
    thickness: selectedThickness === 'all' ? undefined : selectedThickness,
    weight: selectedWeight === 'all' ? undefined : selectedWeight,
    width: selectedWidth === 'all' ? undefined : selectedWidth,
    length: selectedLength === 'all' ? undefined : selectedLength,
    page: currentPage,
    page_size: 10,
    region: userRegion,
    lang: navigator.language.startsWith('zh') ? 'zh' : 'en'
  };
  
  return await consumablesService.getConsumables(filters);
};

// 产品线型号筛选
const getAvailableModels = (productLine: ProductLine) => {
  return productLine.consumables
    .map(consumableId => getConsumableById(consumableId))
    .filter(Boolean)
    .map(consumable => consumable.model)
    .filter((model, index, self) => self.indexOf(model) === index);
};
```

### 11.4 产品线展示组件
```typescript
// 产品线信息展示
const ProductLineInfo: React.FC<{productLine: ProductLine}> = ({productLine}) => {
  return (
    <div className="product-line-info">
      <h2>{productLine.name}</h2>
      <p>{productLine.description}</p>
      <div className="product-line-meta">
        <span className="code">Code: {productLine.code}</span>
        <span className="region">Region: {productLine.region}</span>
      </div>
    </div>
  );
};

// 产品线耗材列表
const ProductLineConsumables: React.FC<{
  productLine: ProductLine,
  consumables: ConsumableProduct[]
}> = ({productLine, consumables}) => {
  return (
    <div className="product-line-consumables">
      <h3>Available Consumables</h3>
      <div className="consumables-list">
        {consumables.map(consumable => (
          <ConsumableCard
            key={consumable.id}
            consumable={consumable}
            isDefault={productLine.consumables.includes(consumable.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 11.5 产品线状态管理
```typescript
// 产品线状态
interface ProductLineState {
  currentProductLine: ProductLine | null;
  availableModels: string[];
  selectedModel: string;
  consumables: ConsumableProduct[];
  loading: boolean;
  error: string | null;
}

// 产品线状态更新
const updateProductLineState = (
  state: ProductLineState,
  action: ProductLineAction
): ProductLineState => {
  switch (action.type) {
    case 'SET_PRODUCT_LINE':
      return {
        ...state,
        currentProductLine: action.payload,
        availableModels: getAvailableModels(action.payload)
      };
    case 'SET_SELECTED_MODEL':
      return {
        ...state,
        selectedModel: action.payload
      };
    case 'SET_CONSUMABLES':
      return {
        ...state,
        consumables: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};
```

### 11.6 产品线路由处理
```typescript
// 路由配置
const routes = [
  {
    path: '/product-lines/:productLineId/consumables',
    component: ConsumablesPage,
    exact: true
  }
];

// 路由参数处理
const useProductLineParams = () => {
  const { productLineId } = useParams<{productLineId: string}>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!productLineId) {
      navigate('/product-lines');
    }
  }, [productLineId, navigate]);
  
  return productLineId;
};
```

## 12. API与数据库设计优化建议

### 12.1 API接口优化
```typescript
// 1. 产品线相关接口缺失
interface GetConsumablesByProductLine {
  path: '/product-lines/{productLineId}/consumables';
  method: 'GET';
  params: {
    productLineId: string;
    region?: string;
    lang?: string;
    page?: number;
    page_size?: number;
    filters?: ConsumableFilters;
  };
  response: {
    success: boolean;
    data: {
      items: ConsumableProduct[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    };
  };
}

// 2. 批量操作接口缺失
interface BatchOperations {
  // 批量获取价格
  path: '/consumables/prices/batch';
  method: 'POST';
  body: {
    consumableIds: string[];
    region?: string;
    quantity?: number;
  };
  
  // 批量获取库存
  path: '/consumables/inventory/batch';
  method: 'POST';
  body: {
    consumableIds: string[];
    region?: string;
  };
  
  // 批量添加到购物车
  path: '/cart/batch-add';
  method: 'POST';
  body: {
    items: Array<{
      consumableId: string;
      quantity: number;
      properties?: Record<string, any>;
    }>;
  };
}

// 3. 耗材兼容性接口
interface CompatibilityCheck {
  path: '/consumables/{consumableId}/compatibility';
  method: 'GET';
  params: {
    machineId?: string;
    accessoryId?: string;
  };
  response: {
    success: boolean;
    data: {
      compatible: boolean;
      reasons?: string[];
      alternatives?: ConsumableProduct[];
    };
  };
}
```

### 12.2 数据库设计优化
```sql
-- 1. 耗材表缺少与产品线的关联
ALTER TABLE consumables
ADD COLUMN product_line_id varchar(100) AFTER id,
ADD CONSTRAINT fk_consumable_product_line
FOREIGN KEY (product_line_id) REFERENCES lines(id);

-- 2. 耗材规格字段需要标准化
CREATE TABLE consumable_specifications (
  id bigint(20) PRIMARY KEY AUTO_INCREMENT,
  consumable_id bigint(20) NOT NULL,
  spec_key varchar(50) NOT NULL,
  spec_value_metric varchar(100),
  spec_value_imperial varchar(100),
  display_order int(11) DEFAULT 0,
  FOREIGN KEY (consumable_id) REFERENCES consumables(id)
);

-- 3. 耗材兼容性关系表
CREATE TABLE consumable_compatibility (
  id bigint(20) PRIMARY KEY AUTO_INCREMENT,
  consumable_id bigint(20) NOT NULL,
  target_type ENUM('machine', 'accessory') NOT NULL,
  target_id bigint(20) NOT NULL,
  compatibility_level ENUM('full', 'partial', 'none') NOT NULL,
  notes text,
  FOREIGN KEY (consumable_id) REFERENCES consumables(id)
);

-- 4. 耗材价格区间表
CREATE TABLE consumable_price_tiers (
  id bigint(20) PRIMARY KEY AUTO_INCREMENT,
  consumable_id bigint(20) NOT NULL,
  min_quantity int(11) NOT NULL,
  max_quantity int(11),
  price_cn decimal(10,2),
  price_eu decimal(10,2),
  price_na decimal(10,2),
  price_au decimal(10,2),
  FOREIGN KEY (consumable_id) REFERENCES consumables(id)
);
```

### 12.3 性能优化建议
```typescript
// 1. 数据缓存策略
interface CacheStrategy {
  // 产品线数据缓存
  productLineCache: {
    key: `product_line:${productLineId}`;
    ttl: 3600; // 1小时
    fields: ['basic', 'consumables', 'specifications'];
  };
  
  // 耗材列表缓存
  consumablesCache: {
    key: `consumables:${productLineId}:${filters}`;
    ttl: 1800; // 30分钟
    fields: ['list', 'count'];
  };
  
  // 价格库存缓存
  inventoryCache: {
    key: `inventory:${consumableId}:${region}`;
    ttl: 300; // 5分钟
  };
}

// 2. 查询优化
interface QueryOptimization {
  // 预加载关联数据
  preloadRelations: {
    withProductLine: boolean;
    withSpecifications: boolean;
    withPriceTiers: boolean;
    withCompatibility: boolean;
  };
  
  // 字段筛选
  selectFields: {
    basic: ['id', 'product_id', 'model', 'name'];
    detailed: ['*'];
    custom: string[];
  };
}
```

### 12.4 安全性优化建议
```typescript
// 1. 输入验证增强
interface InputValidation {
  // 产品线ID验证
  validateProductLineId: (id: string) => {
    format: /^[A-Z0-9]{2,10}$/;
    required: true;
  };
  
  // 数量验证
  validateQuantity: (quantity: number) => {
    min: 1;
    max: 9999;
    required: true;
  };
  
  // 规格验证
  validateSpecifications: (specs: Record<string, any>) => {
    allowedKeys: string[];
    valueTypes: Record<string, 'string' | 'number' | 'boolean'>;
  };
}

// 2. 权限控制增强
interface PermissionControl {
  // 产品线访问权限
  productLineAccess: {
    view: ['customer', 'sales', 'admin'];
    edit: ['sales', 'admin'];
  };
  
  // 价格查看权限
  priceAccess: {
    base: ['customer', 'sales', 'admin'];
    cost: ['sales', 'admin'];
    special: ['vip', 'sales', 'admin'];
  };
  
  // 库存查看权限
  inventoryAccess: {
    view: ['customer', 'sales', 'admin'];
    edit: ['admin'];
    viewAll: ['sales', 'admin'];
  };
}
```

### 12.5 待优化功能
1. API接口优化
   - 添加产品线相关的耗材接口
   - 实现批量操作接口
   - 增加兼容性检查接口
   - 优化价格和库存查询接口

2. 数据库优化
   - 添加产品线关联
   - 规范化规格字段
   - 增加兼容性关系表
   - 优化价格区间存储

3. 性能优化
   - 实现多级缓存策略
   - 优化查询性能
   - 添加字段筛选功能
   - 实现批量预加载

4. 安全性优化
   - 增强输入验证
   - 细化权限控制
   - 加强数据访问控制
   - 实现操作审计

---

> 注：本文档的更新主要针对以下优化建议：
> 1. API接口完整性和规范性
> 2. 数据库结构的合理性和扩展性
> 3. 系统性能和安全性
> 4. 功能完整性和用户体验 