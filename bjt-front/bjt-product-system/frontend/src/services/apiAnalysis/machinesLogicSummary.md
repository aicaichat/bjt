# Machines 页面逻辑总结

## 1. 核心功能流程

### 1.1 初始化流程
1. 获取路由参数（产品线ID）
2. 获取用户信息和区域设置
3. 调用 `getProductLine` 获取产品线信息
4. 调用 `getMachines` 获取该产品线下的设备列表
   - 参数：productLineId, region, lang
   - 根据产品线过滤对应的machines
5. 设置默认数量状态
6. 自动选择第一个设备

### 1.2 设备选择流程
1. 用户选择设备
2. 清空已选配件
3. 添加电压选择器（新增）
   - 根据区域显示默认电压
   - 支持切换不同电压
4. 调用 `getMachineAccessories` 获取一级配件
5. 显示配件选择界面
6. 更新配件上下文信息

### 1.3 配件选择流程
1. 用户选择配件
2. 更新选中状态
3. 调用 `getAccessories` 获取下级配件
4. 显示下级配件界面
5. 更新配件导航路径
6. 获取并显示必选备件信息（新增）
   - 调用 `getRequiredAccessories` 获取必选备件列表
   - 自动将必选备件添加到选择列表

### 1.4 购物车操作流程
1. 用户设置数量
2. 选择电压等属性
3. 调用 `addToCart` 添加商品
4. 检查并添加必选备件（新增）
   - 获取所选配件的必选备件列表
   - 自动将必选备件加入购物车
   - 显示必选备件添加提示
5. 更新购物车状态
6. 显示操作结果通知

## 2. API 定义更新

### 2.1 新增/修改的API
```typescript
// 获取产品线下的设备
interface GetMachinesParams {
  productLineId: string;    // 产品线ID
  region?: string;          // 区域
  lang?: string;           // 语言
  page?: number;           // 分页
  page_size?: number;      // 每页数量
}

// 获取必选备件
interface GetRequiredAccessoriesParams {
  accessoryId: string;     // 配件ID
  machineId: string;       // 设备ID
  region?: string;         // 区域
  lang?: string;           // 语言
}

// 添加到购物车（更新）
interface AddToCartParams {
  product_id: string;
  product_type: 'machine' | 'accessory';
  quantity: number;
  voltage: string;         // 电压选择必填
  properties: {
    voltage: string;       // 电压信息必填
    [key: string]: any;
  };
  required_accessories?: boolean; // 是否自动添加必选备件
}
```

### 2.2 数据结构更新
```typescript
// 产品线类型
interface ProductLine {
  id: string;
  name: string;
  code: string;
  description: string;
  machines: string[];      // 关联的设备ID列表
}

// 必选备件类型
interface RequiredAccessory {
  id: string;
  name: string;
  quantity: number;        // 必选数量
  is_required: boolean;    // 是否必选
  description: string;     // 必选原因说明
}
```

## 3. 状态管理更新

### 3.1 新增状态
```typescript
// 产品线状态
const [productLine, setProductLine] = useState<ProductLine | null>(null);

// 电压选择状态
const [voltageOptions, setVoltageOptions] = useState<string[]>([]);
const [selectedVoltage, setSelectedVoltage] = useState<string>('');

// 必选备件状态
const [requiredAccessories, setRequiredAccessories] = useState<RequiredAccessory[]>([]);
```

### 3.2 状态处理
```typescript
// 处理产品线变更
useEffect(() => {
  const productLineId = getProductLineFromRoute();
  if (productLineId) {
    fetchProductLineData(productLineId);
    fetchMachinesByProductLine(productLineId);
  }
}, [productLineId]);

// 处理电压选择
useEffect(() => {
  const defaultVoltage = getDefaultVoltageByRegion(userRegion);
  setSelectedVoltage(defaultVoltage);
  setVoltageOptions(getVoltageOptionsByRegion(userRegion));
}, [userRegion]);

// 处理必选备件
useEffect(() => {
  if (selectedAccessories.length > 0) {
    fetchRequiredAccessories(selectedAccessories);
  }
}, [selectedAccessories]);
```

## 4. 用户界面更新

### 4.1 新增组件
```typescript
// 电压选择器组件
const VoltageSelector: React.FC = () => {
  return (
    <Select value={selectedVoltage} onChange={handleVoltageChange}>
      {voltageOptions.map(voltage => (
        <Option key={voltage} value={voltage}>{voltage}</Option>
      ))}
    </Select>
  );
};

// 必选备件提示组件
const RequiredAccessoriesNotification: React.FC = () => {
  return (
    <Alert
      type="info"
      message="必选备件提示"
      description={`已自动添加 ${requiredAccessories.length} 个必选备件到购物车`}
    />
  );
};
```

## 5. 错误处理更新

### 5.1 新增错误处理
```typescript
// 产品线相关错误
const handleProductLineError = (error: any) => {
  if (error.code === 'PRODUCT_LINE_NOT_FOUND') {
    message.error('未找到指定产品线');
    navigate('/');
  }
};

// 电压选择错误
const handleVoltageError = () => {
  message.error('请选择正确的电压规格');
};

// 必选备件错误
const handleRequiredAccessoriesError = () => {
  message.warning('添加必选备件失败，请手动添加');
};
```

## 6. 待优化点更新

### 6.1 短期优化
1. 完善产品线切换逻辑
2. 优化电压选择器交互
3. 改进必选备件提示方式
4. 添加批量选择功能

### 6.2 长期优化
1. 实现产品线缓存机制
2. 优化必选备件加载性能
3. 添加配件兼容性检查
4. 实现智能推荐系统

---

> 注：本文档的更新主要针对三个核心问题：
> 1. 产品线过滤：根据产品线ID筛选对应的设备
> 2. 电压选择：添加电压选择器并与区域关联
> 3. 必选备件：自动添加必选备件到购物车

## 7. 数据管理

### 7.1 核心状态
```typescript
// 产品状态
const [machines, setMachines] = useState<MachineProduct[]>([]);
const [selectedMachine, setSelectedMachine] = useState<string>('');

// 配件状态
const [accessories, setAccessories] = useState<any[]>([]);
const [selectedAccessories, setSelectedAccessories] = useState<Record<string, string>>({});

// 用户选择状态
const [quantities, setQuantities] = useState<Record<string, number>>({});
const [selectedVoltage, setSelectedVoltage] = useState<string>();
```

### 7.2 数据过滤
```typescript
const filteredMachines = React.useMemo(() => {
  if (filterType === 'all') return machines;
  return machines.filter(machine => 
    machine.model.toLowerCase().includes(filterType) || 
    machine.name.toLowerCase().includes(filterType)
  );
}, [machines, filterType]);
```

## 8. 用户交互处理

### 8.1 设备操作
- 选择设备：触发配件加载
- 查看详情：跳转详情页
- 添加购物车：更新购物车状态

### 8.2 配件操作
- 选择配件：加载下级配件
- 查看详情：显示配件信息
- 添加购物车：更新购物车状态

### 8.3 数量操作
- 增加/减少：更新数量状态
- 直接输入：验证并更新数量
- 批量设置：批量更新数量

## 9. 视图渲染

### 9.1 主要组件
1. 设备表格/卡片视图
2. 配件选择面板
3. 购物车通知组件
4. 加载/错误状态组件

### 9.2 条件渲染
```typescript
// 加载状态
if (loading) return <Loading />;

// 错误状态
if (error) return <Error message={error} />;

// 正常渲染
return (
  <div className="machines-page">
    {renderMachinesTable()}
    {showAccessoryLevels()}
    {renderCartNotification()}
  </div>
);
```

## 10. 代码组织

### 10.1 文件结构
```
src/
  pages/
    Machines/
      index.tsx          // 主页面组件
      Machines.css       // 样式文件
      accessibility.css  // 无障碍样式
  services/
    machinesService.ts   // API服务
  types/
    machines.ts         // 类型定义
```

### 10.2 代码分层
1. 视图层：渲染和用户交互
2. 业务层：数据处理和状态管理
3. 服务层：API调用和数据转换
4. 类型层：接口和类型定义

## 11. 待优化点

### 11.1 短期优化
1. 完善类型定义
2. 统一错误处理
3. 添加数据缓存
4. 优化加载反馈

### 11.2 长期优化
1. 重构配件选择逻辑
2. 实现批量操作
3. 添加性能监控
4. 优化用户体验

---

> 注：本总结文档应与具体实现保持同步更新。 