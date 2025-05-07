# Spare Parts 页面逻辑总结

## 1. 核心功能流程

### 1.1 初始化流程
1. 检查用户登录状态和权限
2. 获取用户信息和区域设置
3. 加载备件数据
4. 加载筛选选项
5. 初始化购物车状态

### 1.2 筛选流程
1. 产品类型选择
   - 机器备件 (machine)
     ```typescript
     // 当选择机器备件时
     const handleMachineTypeSelect = async (productLineId: string) => {
       try {
         // 1. 获取产品线下的主机型号列表
         const response = await machineApi.getMachinesByProductLine(productLineId);
         const machines = response.data;
         
         // 2. 提取主机型号列表
         const models = machines.map(machine => machine.model);
         setHostModels(models);
         
         // 3. 重置当前选择的型号
         setSelectedModel('');
         
         // 4. 更新筛选条件
         setCurrentProductType('machine');
         
         // 5. 重新加载备件数据
         loadSparePartsData({
           productType: 'machine',
           productLineId,
           model: '',
           type: currentPartType
         });
       } catch (error) {
         console.error('Failed to load machine models:', error);
         message.error(t('error.loadMachineModelsFailed'));
       }
     };
     ```

   - 配件备件 (accessory)
     ```typescript
     // 当选择配件备件时
     const handleAccessoryTypeSelect = async (productLineId: string) => {
       try {
         // 1. 获取产品线下的配件型号列表
         const response = await accessoryApi.getAccessoriesByProductLine(productLineId);
         const accessories = response.data;
         
         // 2. 提取配件型号列表
         const models = accessories.map(accessory => accessory.model);
         setAccessoryModels(models);
         
         // 3. 重置当前选择的型号
         setSelectedModel('');
         
         // 4. 更新筛选条件
         setCurrentProductType('accessory');
         
         // 5. 重新加载备件数据
         loadSparePartsData({
           productType: 'accessory',
           productLineId,
           model: '',
           type: currentPartType
         });
       } catch (error) {
         console.error('Failed to load accessory models:', error);
         message.error(t('error.loadAccessoryModelsFailed'));
       }
     };
     ```

2. 型号选择
   ```typescript
   // 型号选择变更处理
   const handleModelChange = async (model: string) => {
     setSelectedModel(model);
     
     // 重新加载备件数据
     loadSparePartsData({
       productType: currentProductType,
       productLineId,
       model,
       type: currentPartType
     });
   };
   ```

3. 备件类型选择
   ```typescript
   // 备件类型枚举
   enum SparePartType {
     Consumable = 'consumable',        // 消耗品备件
     NonConsumable = 'non-consumable'  // 非消耗品备件
   }

   // 备件属性枚举
   enum SparePartProperty {
     Mechanical = 'mechanical',   // 机械类
     Electrical = 'electrical',   // 电器类
     Electronic = 'electronic'    // 电子类
   }
   
   interface SparePartFilter {
     type: SparePartType;           // 备件类型
     property?: SparePartProperty;  // 备件属性（可选）
     productType: 'machine' | 'accessory';  // 产品类型
     model?: string;                // 型号
   }
   
   // 备件类型选择处理
   const handlePartTypeChange = async (type: SparePartType) => {
     setCurrentPartType(type);
     
     // 重新加载备件数据
     loadSparePartsData({
       productType: currentProductType,
       productLineId,
       model: selectedModel,
       type: type,
       property: currentProperty // 保持当前选择的属性不变
     });
   };

   // 备件属性选择处理
   const handlePropertyChange = async (property: SparePartProperty) => {
     setCurrentProperty(property);
     
     // 重新加载备件数据
     loadSparePartsData({
       productType: currentProductType,
       productLineId,
       model: selectedModel,
       type: currentPartType,
       property: property
     });
   };
   ```

### 1.2.1 数据加载逻辑
```typescript
// 更新加载备件数据的接口定义
interface LoadSparePartsParams {
  productType: 'machine' | 'accessory';
  productLineId: string;
  model: string;
  type: SparePartType;
  property?: SparePartProperty;
  page?: number;
  pageSize?: number;
}

const loadSparePartsData = async (params: LoadSparePartsParams) => {
  try {
    setLoading(true);
    setError(null);
    
    // 1. 构建API请求参数
    const apiParams = {
      product_line_id: params.productLineId,
      product_type: params.productType,
      model: params.model,
      type: params.type,
      property: params.property,
      region: userRegion,
      page: params.page || currentPage,
      page_size: params.pageSize || pageSize
    };
    
    // 2. 调用API获取数据
    const response = await sparePartsApi.getSpareParts(apiParams);
    
    // 3. 处理响应数据
    if (response.success) {
      // 更新备件列表
      setSpareParts(response.data.items);
      // 更新分页信息
      setTotalItems(response.data.total);
      setTotalPages(response.data.total_pages);
      
      // 4. 初始化数量状态
      const initialQuantities: Record<string, number> = {};
      response.data.items.forEach(item => {
        initialQuantities[item.id] = 1;
      });
      setQuantities(initialQuantities);
    } else {
      throw new Error(response.message || 'Failed to load spare parts');
    }
  } catch (error) {
    console.error('Error loading spare parts:', error);
    setError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

### 1.2.2 筛选联动关系
```typescript
// 产品类型与型号列表的联动
useEffect(() => {
  if (currentProductType === 'machine') {
    handleMachineTypeSelect(productLineId);
  } else if (currentProductType === 'accessory') {
    handleAccessoryTypeSelect(productLineId);
  }
}, [currentProductType, productLineId]);

// 型号与备件类型的联动
useEffect(() => {
  if (selectedModel) {
    // 根据选择的型号加载对应的备件类型选项
    loadPartTypeOptions(selectedModel);
  }
}, [selectedModel]);

// 加载备件类型选项
const loadPartTypeOptions = async (model: string) => {
  try {
    const response = await sparePartsApi.getPartTypeOptions(model);
    if (response.success) {
      // 更新备件类型选项
      setPartTypeOptions(response.data);
      // 如果当前选择的备件类型不在选项中，重置为默认值
      if (!response.data.includes(currentPartType)) {
        setCurrentPartType(SparePartType.Consumable);
      }
    }
  } catch (error) {
    console.error('Failed to load part type options:', error);
  }
};
```

### 1.2.3 数据验证和错误处理
```typescript
// 验证筛选参数
const validateFilterParams = (params: LoadSparePartsParams): boolean => {
  // 验证产品线ID
  if (!params.productLineId) {
    message.error(t('error.productLineRequired'));
    return false;
  }
  
  // 验证产品类型
  if (!['machine', 'accessory'].includes(params.productType)) {
    message.error(t('error.invalidProductType'));
    return false;
  }
  
  // 验证备件类型
  if (!Object.values(SparePartType).includes(params.type)) {
    message.error(t('error.invalidPartType'));
    return false;
  }
  
  return true;
};

// 错误处理
const handleLoadError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('unauthorized')) {
      // 处理授权错误
      navigate('/login');
    } else if (error.message.includes('not found')) {
      // 处理数据不存在错误
      setError(t('error.dataNotFound'));
    } else {
      // 处理其他错误
      setError(t('error.loadDataFailed'));
    }
  } else {
    setError(t('error.unknownError'));
  }
};
```

### 1.3 数据展示流程
1. 表格展示
   - 图片
   - 编码
   - 规格
   - 价格
   - 库存（仅管理员和销售可见）
   - 操作按钮

2. 规格提示框 (Tooltip)
   - 包装尺寸（公制/英制）
   - 包装重量（公制/英制）
   - 序列号
   - 适用型号
   - 详细规格

### 1.4 购物车操作流程
1. 数量调整
   - 增加/减少按钮
   - 直接输入
   - 数量验证

2. 添加到购物车
   - 创建购物车项
   - 价格计算
   - 显示成功提示

3. 购物车管理
   - 查看购物车
   - 修改数量
   - 删除商品
   - 清空购物车
   - 结算

## 2. 数据结构

### 2.1 备件数据结构
```typescript
interface SparePart {
  id: string;
  name: string;
  part_number: string;
  image_url: string;
  type: SparePartType;           // 备件类型（消耗品/非消耗品）
  property: SparePartProperty;   // 备件属性（机械/电器/电子）
  product_type: 'machine' | 'accessory';
  app_model: string | string[];
  app_sn: string;
  spec: string;
  package_size: string;
  package_size_imperial?: string;
  package_weight: number;
  box_quantity?: number;
  prices: {
    base: number;
    tier1: number;
    tier2: number;
    vip: number;
    tiers: PriceTier[];
  };
  inventory: Array<{
    region: string;
    amount: number;
  }> | {
    eu: number;
    na: number;
    au: number;
    cn: number;
  };
}
```

### 2.2 购物车项数据结构
```typescript
interface CartItem {
  id: string;
  name: string;
  code: string;
  partNumber: string;
  image: string;
  category: string;
  productId: number;
  price: number;
  quantity: number;
  selected: boolean;
  priceTiers: PriceTier[];
  properties: {
    type: string;
    productType: string;
    model: string;
  };
  specs: Record<string, any>;
}
```

## 3. 状态管理

### 3.1 筛选状态
```typescript
// 产品类型状态
const [currentProductType, setCurrentProductType] = useState('machine');
// 备件类型状态
const [currentPartType, setCurrentPartType] = useState('consumable');
// 型号状态
const [selectedModel, setSelectedModel] = useState('');
// 型号列表状态
const [hostModels, setHostModels] = useState<string[]>([]);
const [accessoryModels, setAccessoryModels] = useState<string[]>([]);
```

### 3.2 数据状态
```typescript
// 备件列表状态
const [spareParts, setSpareParts] = useState<SparePart[]>([]);
// 加载状态
const [loading, setLoading] = useState(true);
// 错误状态
const [error, setError] = useState<string | null>(null);
// 数量状态
const [quantities, setQuantities] = useState<Record<string, number>>({});
```

### 3.3 UI状态
```typescript
// 购物车模态框状态
const [showCartModal, setShowCartModal] = useState(false);
// 清空确认框状态
const [showConfirmClear, setShowConfirmClear] = useState(false);
// 提示框状态
const [showTooltip, setShowTooltip] = useState(false);
const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
```

## 4. 权限控制

### 4.1 用户角色权限
```typescript
// 库存查看权限
if (user?.role === 'sales' || user?.role === 'admin') {
  // 显示库存列
}

// VIP价格权限
if (isVipUser(user?.email)) {
  // 显示VIP价格
}
```

### 4.2 区域权限
```typescript
// 根据用户区域显示对应价格和库存
const region = currentUser.region.toLowerCase();
const regionPrice = prices[region] || prices.base;
const regionInventory = inventory[region] || 0;
```

## 5. 性能优化

### 5.1 已实现的优化
1. 使用 useMemo 缓存筛选结果
2. 图片懒加载和错误处理
3. 防抖处理筛选条件变更
4. 分页加载数据

### 5.2 待优化点
1. 实现数据预加载
2. 添加虚拟滚动
3. 优化图片加载策略
4. 添加批量操作功能

## 6. 错误处理

### 6.1 API错误处理
```typescript
try {
  const response = await sparePartsApi.getAllSpareParts();
  // 处理响应
} catch (err) {
  // 处理API错误
  if (err instanceof Error) {
    if (err.message.includes('unauthorized')) {
      // 处理授权错误
      navigate('/login');
    } else {
      // 处理其他错误
      setError(err.message);
    }
  }
}
```

### 6.2 数据验证
```typescript
// 数量验证
const validateQuantity = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

// 价格验证
const validatePrice = (price: number): number => {
  return price >= 0 ? price : 0;
};
```

## 7. 国际化支持

### 7.1 文本翻译
```typescript
const { t } = useTranslation('spareParts');

// 使用翻译
t('spareParts.title')
t('spareParts.filters.label.model')
t('spareParts.cart.total')
```

### 7.2 单位转换
```typescript
// 公制转英制
const metricToImperial = (value: number, unit: string): number => {
  switch (unit) {
    case 'weight':
      return value * 2.20462; // kg to lbs
    case 'length':
      return value * 0.393701; // mm to inch
    default:
      return value;
  }
};
```

## 8. 字段展示详情

### 8.1 列表展示字段
```typescript
interface SparePartListItem {
  // 基础信息
  image_url: string;              // 备件图片
  part_number: string;            // 料号
  name: string;                   // 备件名称
  type: SparePartType;           // 备件类型（消耗品/非消耗品）
  
  // 规格概览
  spec: string;                   // 规格简述
  app_model: string[];           // 适用型号
  box_quantity: number;          // 包装数量
  
  // 价格信息
  prices: {
    current: number;             // 当前区域价格
    original: number;            // 原始价格
    currency: string;            // 货币单位
    tiers: PriceTier[];         // 阶梯价格
  };
  
  // 库存信息（仅管理员/销售可见）
  inventory: {
    [region: string]: number;    // 各区域库存
    total: number;               // 总库存
  };
}

// 列表展示组件
const SparePartListDisplay: React.FC<{ item: SparePartListItem }> = ({ item }) => (
  <tr>
    <td className="image-cell">
      <img src={item.image_url} alt={item.name} />
    </td>
    <td className="info-cell">
      <div className="part-number">{item.part_number}</div>
      <div className="name">{item.name}</div>
      <div className="type">{t(`spareParts.type.${item.type}`)}</div>
    </td>
    <td className="spec-cell">
      <div className="spec-preview">
        <div>{item.spec}</div>
        <div>{t('spareParts.model')}: {item.app_model.join(', ')}</div>
        <div>{t('spareParts.boxQty')}: {item.box_quantity}</div>
      </div>
    </td>
    <td className="price-cell">
      <div className="current-price">
        {item.prices.currency} {item.prices.current}
      </div>
      {item.prices.tiers.map(tier => (
        <div className="price-tier" key={tier.min}>
          {tier.min}-{tier.max}: {item.prices.currency} {tier.price}
        </div>
      ))}
    </td>
    {(userRole === 'admin' || userRole === 'sales') && (
      <td className="inventory-cell">
        {Object.entries(item.inventory).map(([region, qty]) => (
          <div key={region}>{region}: {qty}</div>
        ))}
      </td>
    )}
  </tr>
);
```

### 8.2 Tooltip详细字段
```typescript
interface SparePartTooltipInfo {
  // 基础信息
  name: string;                   // 备件名称
  part_number: string;            // 料号
  type: SparePartType;           // 备件类型
  property: SparePartProperty;   // 备件属性
  
  // 包装信息
  package_info: {
    size: {
      metric: string;            // 包装尺寸（公制）
      imperial: string;          // 包装尺寸（英制）
    };
    weight: {
      metric: number;            // 包装重量（公制）
      imperial: number;          // 包装重量（英制）
    };
    quantity: number;            // 包装数量
  };
  
  // 适用信息
  compatibility: {
    models: string[];           // 适用型号列表
    serial_numbers: string[];   // 适用序列号范围
  };
  
  // 技术参数
  specifications: {
    voltage?: string;           // 电压
    power?: string;            // 功率
    material?: string;         // 材质
    dimensions?: string;       // 产品尺寸
  };
}

// Tooltip展示组件
const SparePartTooltip: React.FC<{ info: SparePartTooltipInfo }> = ({ info }) => (
  <div className="tooltip-content">
    <div className="tooltip-header">
      <h4>{info.name}</h4>
      <div className="part-number">{info.part_number}</div>
    </div>
    
    <div className="tooltip-section">
      <h5>{t('spareParts.tooltip.packaging')}</h5>
      <div className="spec-row">
        <label>{t('spareParts.tooltip.size')}:</label>
        <span>{info.package_info.size.metric}</span>
        <span>({info.package_info.size.imperial})</span>
      </div>
      <div className="spec-row">
        <label>{t('spareParts.tooltip.weight')}:</label>
        <span>{info.package_info.weight.metric} kg</span>
        <span>({info.package_info.weight.imperial} lbs)</span>
      </div>
      <div className="spec-row">
        <label>{t('spareParts.tooltip.quantity')}:</label>
        <span>{info.package_info.quantity}</span>
      </div>
    </div>
    
    <div className="tooltip-section">
      <h5>{t('spareParts.tooltip.compatibility')}</h5>
      <div className="spec-row">
        <label>{t('spareParts.tooltip.models')}:</label>
        <span>{info.compatibility.models.join(', ')}</span>
      </div>
      <div className="spec-row">
        <label>{t('spareParts.tooltip.serialNumbers')}:</label>
        <span>{info.compatibility.serial_numbers.join(', ')}</span>
      </div>
    </div>
    
    <div className="tooltip-section">
      <h5>{t('spareParts.tooltip.specifications')}</h5>
      {Object.entries(info.specifications).map(([key, value]) => (
        value && (
          <div className="spec-row" key={key}>
            <label>{t(`spareParts.tooltip.${key}`)}:</label>
            <span>{value}</span>
          </div>
        )
      ))}
    </div>
  </div>
);
```

### 8.3 购物车展示字段
```typescript
interface SparePartCartItem {
  // 基础信息
  id: string;
  image_url: string;
  name: string;
  part_number: string;
  type: SparePartType;
  
  // 数量和价格
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  
  // 规格信息
  specifications: {
    model: string;              // 适用型号
    serial_number: string;      // 序列号
    package_size: string;       // 包装尺寸
  };
  
  // 配送信息
  delivery: {
    weight: number;            // 重量
    volume: number;           // 体积
    region: string;           // 发货区域
  };
}

// 购物车展示组件
const SparePartCartDisplay: React.FC<{ item: SparePartCartItem }> = ({ item }) => (
  <div className="cart-item">
    <div className="cart-item-header">
      <img src={item.image_url} alt={item.name} className="cart-item-image" />
      <div className="cart-item-info">
        <div className="cart-item-name">{item.name}</div>
        <div className="cart-item-number">{item.part_number}</div>
        <div className="cart-item-type">
          {t(`spareParts.type.${item.type}`)}
        </div>
      </div>
    </div>
    
    <div className="cart-item-specs">
      <div className="spec-item">
        <label>{t('spareParts.cart.model')}:</label>
        <span>{item.specifications.model}</span>
      </div>
      <div className="spec-item">
        <label>{t('spareParts.cart.serialNumber')}:</label>
        <span>{item.specifications.serial_number}</span>
      </div>
      <div className="spec-item">
        <label>{t('spareParts.cart.packageSize')}:</label>
        <span>{item.specifications.package_size}</span>
      </div>
    </div>
    
    <div className="cart-item-quantity">
      <div className="quantity-controls">
        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
        <input 
          type="number" 
          value={item.quantity} 
          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))} 
        />
        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
      </div>
    </div>
    
    <div className="cart-item-price">
      <div className="unit-price">
        {item.currency} {item.unit_price} × {item.quantity}
      </div>
      <div className="total-price">
        {item.currency} {item.total_price}
      </div>
    </div>
    
    <div className="cart-item-delivery">
      <div>{t('spareParts.cart.weight')}: {item.delivery.weight}kg</div>
      <div>{t('spareParts.cart.volume')}: {item.delivery.volume}m³</div>
      <div>{t('spareParts.cart.region')}: {item.delivery.region}</div>
    </div>
  </div>
);
```

---

> 注：本文档的重点在于以下几个方面：
> 1. 完整的筛选系统：产品类型、型号、备件类型的联动
> 2. 灵活的价格系统：区域价格、VIP价格、数量区间价格
> 3. 复杂的权限控制：用户角色、区域限制
> 4. 完善的错误处理：API错误、数据验证、用户提示 