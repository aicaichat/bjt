# Machines 页面更新实现计划

## 1. 前期准备工作

### 1.1 API服务层更新
```typescript
// src/services/machinesService.ts

// 1. 添加产品线相关接口
interface ProductLineResponse {
  id: string;
  name: string;
  code: string;
  machines: string[];
}

// 2. 更新getMachines接口
interface GetMachinesParams {
  productLineId: string;
  region?: string;
  lang?: string;
}

// 3. 添加必选备件接口
interface RequiredAccessoryResponse {
  id: string;
  name: string;
  quantity: number;
  is_required: boolean;
}

const machinesService = {
  // 获取产品线信息
  getProductLine: async (id: string) => {
    return HttpService.get(`/product-lines/${id}`);
  },
  
  // 更新获取设备列表
  getMachines: async (params: GetMachinesParams) => {
    return HttpService.get('/machines', { params });
  },
  
  // 获取必选备件
  getRequiredAccessories: async (accessoryId: string) => {
    return HttpService.get(`/accessories/${accessoryId}/required`);
  }
};
```

### 1.2 类型定义更新
```typescript
// src/types/machines.ts

export interface ProductLine {
  id: string;
  name: string;
  code: string;
  machines: string[];
}

export interface RequiredAccessory {
  id: string;
  name: string;
  quantity: number;
  is_required: boolean;
  description: string;
}

// 更新现有类型
export interface MachineProduct {
  id: string;
  name: string;
  productLineId: string; // 新增
  voltageOptions: string[]; // 新增
  // ... 其他现有字段
}
```

## 2. 组件实现顺序

### 2.1 第一阶段：产品线集成
1. 路由参数处理
```typescript
// src/pages/Machines/index.tsx

const MachinesPage: React.FC = () => {
  const { productLineId } = useParams<{ productLineId: string }>();
  const [productLine, setProductLine] = useState<ProductLine | null>(null);
  
  useEffect(() => {
    const fetchProductLineData = async () => {
      if (!productLineId) return;
      try {
        const response = await machinesService.getProductLine(productLineId);
        setProductLine(response.data);
        fetchMachines(response.data.id);
      } catch (error) {
        handleProductLineError(error);
      }
    };
    
    fetchProductLineData();
  }, [productLineId]);
  
  // ... 其他逻辑
};
```

2. 产品线过滤逻辑
```typescript
const fetchMachines = async (productLineId: string) => {
  try {
    const response = await machinesService.getMachines({
      productLineId,
      region: userRegion,
      lang: currentLang
    });
    setMachines(response.data);
  } catch (error) {
    handleApiError(error);
  }
};
```

### 2.2 第二阶段：电压选择器
1. 电压选择器组件
```typescript
// src/components/VoltageSelector/index.tsx

interface VoltageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

const VoltageSelector: React.FC<VoltageSelectorProps> = ({
  value,
  onChange,
  options
}) => {
  return (
    <div className="voltage-selector">
      <Select
        value={value}
        onChange={onChange}
        placeholder="选择电压"
      >
        {options.map(voltage => (
          <Option key={voltage} value={voltage}>
            {voltage}V
          </Option>
        ))}
      </Select>
    </div>
  );
};
```

2. 电压选择逻辑
```typescript
const getVoltageOptions = (region: string): string[] => {
  const voltageMap = {
    CN: ['220'],
    EU: ['230'],
    NA: ['110'],
    AU: ['240']
  };
  return voltageMap[region as keyof typeof voltageMap] || ['220'];
};

const handleVoltageChange = (voltage: string) => {
  setSelectedVoltage(voltage);
};
```

### 2.3 第三阶段：必选备件
1. 必选备件服务
```typescript
const fetchRequiredAccessories = async (accessoryId: string) => {
  try {
    const response = await machinesService.getRequiredAccessories(accessoryId);
    setRequiredAccessories(response.data);
  } catch (error) {
    handleRequiredAccessoriesError(error);
  }
};
```

2. 购物车逻辑更新
```typescript
const handleAddToCart = async (product: MachineProduct) => {
  try {
    // 1. 添加主商品
    await addMainProduct(product);
    
    // 2. 检查并添加必选备件
    if (product.type === 'accessory') {
      const required = await fetchRequiredAccessories(product.id);
      await addRequiredAccessories(required);
    }
    
    // 3. 显示成功提示
    showSuccessNotification(product, required);
  } catch (error) {
    handleAddToCartError(error);
  }
};
```

3. 必选备件提示组件
```typescript
// src/components/RequiredAccessoriesNotification/index.tsx

interface NotificationProps {
  accessories: RequiredAccessory[];
  onClose: () => void;
}

const RequiredAccessoriesNotification: React.FC<NotificationProps> = ({
  accessories,
  onClose
}) => {
  return (
    <Alert
      type="info"
      message="必选备件已添加"
      description={
        <div>
          <p>以下必选备件已自动添加到购物车：</p>
          <ul>
            {accessories.map(acc => (
              <li key={acc.id}>
                {acc.name} x {acc.quantity}
              </li>
            ))}
          </ul>
        </div>
      }
      closable
      onClose={onClose}
    />
  );
};
```

## 3. 样式更新

### 3.1 新增样式
```scss
// src/pages/Machines/Machines.scss

.voltage-selector {
  margin: 16px 0;
  
  .ant-select {
    min-width: 120px;
  }
}

.required-accessories-notification {
  margin-bottom: 16px;
  
  ul {
    margin-top: 8px;
    padding-left: 20px;
  }
}
```

### 3.2 布局调整
```scss
.machines-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  
  .product-line-info {
    flex: 1;
  }
  
  .voltage-selector {
    margin-left: 16px;
  }
}
```

## 4. 测试计划

### 4.1 单元测试
```typescript
// src/pages/Machines/__tests__/index.test.tsx

describe('MachinesPage', () => {
  it('should load product line data', async () => {
    // 测试产品线数据加载
  });
  
  it('should filter machines by product line', async () => {
    // 测试机器过滤
  });
  
  it('should handle voltage selection', async () => {
    // 测试电压选择
  });
  
  it('should add required accessories to cart', async () => {
    // 测试必选备件添加
  });
});
```

### 4.2 集成测试
```typescript
describe('Machines Integration', () => {
  it('should handle complete purchase flow', async () => {
    // 测试完整购买流程
  });
});
```

## 5. 实施步骤

### 5.1 第一周
1. API服务层更新
2. 类型定义更新
3. 产品线集成实现
4. 基本单元测试

### 5.2 第二周
1. 电压选择器实现
2. 必选备件逻辑实现
3. 样式更新
4. 集成测试

### 5.3 第三周
1. 性能优化
2. 错误处理完善
3. 文档更新
4. 用户体验优化

## 6. 注意事项

### 6.1 性能考虑
1. 使用 `useMemo` 缓存计算结果
2. 实现数据预加载
3. 优化必选备件加载策略

### 6.2 错误处理
1. 完善错误提示信息
2. 添加重试机制
3. 实现优雅降级

### 6.3 兼容性
1. 确保电压选择器在不同区域正常工作
2. 处理必选备件的边界情况
3. 保持与现有功能的兼容性

---

> 注：本实施计划应根据实际开发进度和需求变更及时调整。 