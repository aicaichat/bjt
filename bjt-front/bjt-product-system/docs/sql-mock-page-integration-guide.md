# SQL Mock数据服务 - 页面集成指南

## 🚀 立即开始使用

### 1. 核心服务导入

在你的页面组件中，导入集成Mock服务：

```typescript
// 方式1: 使用集成服务类 (推荐)
import { IntegratedMockService } from '../services/integrated-mock-service';

// 方式2: 使用便捷导出函数
import { 
  getMachinesData, 
  getAccessoriesData, 
  getConsumablesData, 
  getSparePartsData,
  getProductLinesData,
  getShapesData,
  getMaterialsData 
} from '../services/integrated-mock-service';

// 方式3: 直接使用SQL生成器 (高级用法)
import { sqlMockGenerator, getTableData, filterData } from '../services/sql-mock-generator';
```

### 2. 服务配置

```typescript
// 配置Mock服务
const mockService = IntegratedMockService.getInstance();

// 开发环境配置
mockService.setConfig({
  useRealSQLData: true,      // 使用真实SQL数据
  mockEnvironment: 'development',
  enableCaching: true,       // 启用缓存
  networkDelay: false        // 关闭网络延迟模拟
});

// 生产环境配置
mockService.setConfig({
  useRealSQLData: false,     // 使用传统Mock数据
  mockEnvironment: 'production',
  enableCaching: true,
  networkDelay: true         // 启用网络延迟模拟
});
```

---

## 📱 各页面集成示例

### 1. 首页 (Home Page) 集成

```tsx
// frontend/src/pages/Home/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { getProductLinesData } from '../../services/integrated-mock-service';

interface ProductLine {
  id: number;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  image_url?: string;
  code: string;
}

const HomePage: React.FC = () => {
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductLines();
  }, []);

  const loadProductLines = async () => {
    try {
      setLoading(true);
      const data = await getProductLinesData();
      setProductLines(data);
      console.log('✅ 首页产品线数据加载成功:', data.length);
    } catch (error) {
      console.error('❌ 首页数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="home-page">
      <h1>BJT产品管理系统</h1>
      <div className="product-lines-grid">
        {productLines.map(line => (
          <div key={line.id} className="product-line-card">
            <img src={line.image_url} alt={line.title_zh} />
            <h3>{line.title_zh}</h3>
            <p>{line.description_zh}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
```

### 2. 机器页面 (Machines Page) 集成

```tsx
// frontend/src/pages/Machines/MachinesPage.tsx
import React, { useState, useEffect } from 'react';
import { getMachinesData } from '../../services/integrated-mock-service';
import type { MachineListData } from '../../types/api.types';

const MachinesPage: React.FC = () => {
  const [machinesData, setMachinesData] = useState<MachineListData | null>(null);
  const [filters, setFilters] = useState({
    category: undefined as number | undefined,
    search: '',
    page: 1,
    pageSize: 10
  });

  useEffect(() => {
    loadMachines();
  }, [filters]);

  const loadMachines = async () => {
    try {
      const data = await getMachinesData(filters);
      setMachinesData(data);
      console.log('✅ 机器数据加载成功:', data.total);
    } catch (error) {
      console.error('❌ 机器数据加载失败:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="machines-page">
      {/* 筛选器 */}
      <div className="filters">
        <select 
          value={filters.category || ''} 
          onChange={e => handleFilterChange('category', Number(e.target.value) || undefined)}
        >
          <option value="">所有产品线</option>
          <option value="1">气垫系列</option>
          <option value="2">纸垫系列</option>
          <option value="3">胶带系列</option>
        </select>
        
        <input
          type="text"
          placeholder="搜索机器..."
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
        />
      </div>

      {/* 机器列表 */}
      <div className="machines-list">
        {machinesData?.items.map(machine => (
          <div key={machine.id} className="machine-card">
            <img src={machine.image_url} alt={machine.title_zh} />
            <h3>{machine.title_zh}</h3>
            <p>型号: {machine.model}</p>
            <p>电压: {machine.voltage}</p>
            <p>料号: {machine.part_number}</p>
            <div className="price">价格: ¥{machine.price}</div>
            <div className="inventory">库存: {machine.inventory}</div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {machinesData && (
        <div className="pagination">
          {Array.from({ length: machinesData.total_pages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={filters.page === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MachinesPage;
```

### 3. 配件页面 (Accessories Page) 集成

```tsx
// frontend/src/pages/Accessories/AccessoriesPage.tsx
import React, { useState, useEffect } from 'react';
import { getAccessoriesData } from '../../services/integrated-mock-service';
import type { AccessoryListData } from '../../types/api.types';

const AccessoriesPage: React.FC = () => {
  const [accessoriesData, setAccessoriesData] = useState<AccessoryListData | null>(null);
  const [filters, setFilters] = useState({
    machineId: undefined as string | undefined,
    category: undefined as number | undefined,
    search: '',
    page: 1,
    pageSize: 12
  });

  useEffect(() => {
    loadAccessories();
  }, [filters]);

  const loadAccessories = async () => {
    try {
      const data = await getAccessoriesData(filters);
      setAccessoriesData(data);
      console.log('✅ 配件数据加载成功:', data.total);
    } catch (error) {
      console.error('❌ 配件数据加载失败:', error);
    }
  };

  const groupedAccessories = React.useMemo(() => {
    if (!accessoriesData?.items) return {};
    
    return accessoriesData.items.reduce((groups, accessory) => {
      const type = accessory.type || '其他';
      if (!groups[type]) groups[type] = [];
      groups[type].push(accessory);
      return groups;
    }, {} as Record<string, any[]>);
  }, [accessoriesData]);

  return (
    <div className="accessories-page">
      <h1>配件中心</h1>
      
      {/* 筛选器 */}
      <div className="filters">
        <select 
          value={filters.category || ''} 
          onChange={e => setFilters(prev => ({ ...prev, category: Number(e.target.value) || undefined }))}
        >
          <option value="">所有产品线</option>
          <option value="1">气垫系列</option>
        </select>
        
        <input
          type="text"
          placeholder="搜索配件..."
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      {/* 配件分组显示 */}
      {Object.entries(groupedAccessories).map(([type, accessories]) => (
        <div key={type} className="accessory-group">
          <h2>{type}</h2>
          <div className="accessories-grid">
            {accessories.map(accessory => (
              <div key={accessory.id} className="accessory-card">
                <img src={accessory.image_url} alt={accessory.name} />
                <h4>{accessory.name}</h4>
                <p>型号: {accessory.model}</p>
                <p>电压: {accessory.voltage}</p>
                <p>料号: {accessory.part_number}</p>
                <button className="add-to-cart">加入购物车</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccessoriesPage;
```

### 4. 耗材页面 (Consumables Page) 集成

```tsx
// frontend/src/pages/Consumables/ConsumablesPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  getConsumablesData, 
  getShapesData, 
  getMaterialsData 
} from '../../services/integrated-mock-service';
import type { ConsumableListData } from '../../types/api.types';

const ConsumablesPage: React.FC = () => {
  const [consumablesData, setConsumablesData] = useState<ConsumableListData | null>(null);
  const [shapes, setShapes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category: undefined as number | undefined,
    shape: '',
    material: '',
    search: '',
    page: 1,
    pageSize: 12
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadConsumables();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [shapesData, materialsData] = await Promise.all([
        getShapesData(),
        getMaterialsData()
      ]);
      setShapes(shapesData);
      setMaterials(materialsData);
      console.log('✅ 耗材筛选数据加载成功');
    } catch (error) {
      console.error('❌ 筛选数据加载失败:', error);
    }
  };

  const loadConsumables = async () => {
    try {
      const data = await getConsumablesData(filters);
      setConsumablesData(data);
      console.log('✅ 耗材数据加载成功:', data.total);
    } catch (error) {
      console.error('❌ 耗材数据加载失败:', error);
    }
  };

  return (
    <div className="consumables-page">
      <h1>耗材中心</h1>
      
      {/* 高级筛选器 */}
      <div className="advanced-filters">
        <div className="filter-group">
          <label>形状类型:</label>
          <select 
            value={filters.shape} 
            onChange={e => setFilters(prev => ({ ...prev, shape: e.target.value }))}
          >
            <option value="">所有形状</option>
            {shapes.map(shape => (
              <option key={shape.id} value={shape.code}>
                {shape.name_zh} ({shape.code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>材质:</label>
          <select 
            value={filters.material} 
            onChange={e => setFilters(prev => ({ ...prev, material: e.target.value }))}
          >
            <option value="">所有材质</option>
            {materials.map(material => (
              <option key={material.id} value={material.code}>
                {material.name_zh} ({material.code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>搜索:</label>
          <input
            type="text"
            placeholder="搜索耗材..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>

      {/* 耗材网格 */}
      <div className="consumables-grid">
        {consumablesData?.items.map(consumable => (
          <div key={consumable.id} className="consumable-card">
            <div className="consumable-images">
              <img src={consumable.image_url} alt={consumable.model} />
              {consumable.package_image_url && (
                <img src={consumable.package_image_url} alt="包装图" />
              )}
            </div>
            
            <div className="consumable-info">
              <h4>{consumable.model}</h4>
              <p>材质: {consumable.material}</p>
              <p>厚度: {consumable.thickness_met}μm / {consumable.thickness_imp}mil</p>
              <p>宽度: {consumable.width_met}cm / {consumable.width_imp}"</p>
              <p>袋长: {consumable.length_met}cm / {consumable.length_imp}"</p>
              <p>料号: {consumable.part_number}</p>
            </div>

            <div className="consumable-actions">
              <button className="btn-detail">查看详情</button>
              <button className="btn-cart">加入购物车</button>
            </div>
          </div>
        ))}
      </div>

      {/* 分页组件 */}
      {consumablesData && consumablesData.total_pages > 1 && (
        <div className="pagination">
          <button 
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            上一页
          </button>
          
          <span>第 {filters.page} 页，共 {consumablesData.total_pages} 页</span>
          
          <button 
            disabled={filters.page === consumablesData.total_pages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default ConsumablesPage;
```

### 5. 备件页面 (Spare Parts Page) 集成

```tsx
// frontend/src/pages/SpareParts/SparePartsPage.tsx
import React, { useState, useEffect } from 'react';
import { getSparePartsData } from '../../services/integrated-mock-service';
import type { SparePartListData } from '../../types/api.types';

const SparePartsPage: React.FC = () => {
  const [sparePartsData, setSparePartsData] = useState<SparePartListData | null>(null);
  const [filters, setFilters] = useState({
    machineModel: '',
    isConsumable: undefined as boolean | undefined,
    search: '',
    page: 1,
    pageSize: 20
  });

  useEffect(() => {
    loadSpareParts();
  }, [filters]);

  const loadSpareParts = async () => {
    try {
      const data = await getSparePartsData(filters);
      setSparePartsData(data);
      console.log('✅ 备件数据加载成功:', data.total);
    } catch (error) {
      console.error('❌ 备件数据加载失败:', error);
    }
  };

  const groupedParts = React.useMemo(() => {
    if (!sparePartsData?.items) return { consumable: [], nonConsumable: [] };
    
    return sparePartsData.items.reduce((groups, part) => {
      if (part.is_consumable) {
        groups.consumable.push(part);
      } else {
        groups.nonConsumable.push(part);
      }
      return groups;
    }, { consumable: [] as any[], nonConsumable: [] as any[] });
  }, [sparePartsData]);

  return (
    <div className="spare-parts-page">
      <h1>备件中心</h1>
      
      {/* 筛选器 */}
      <div className="filters">
        <input
          type="text"
          placeholder="机器型号 (如: LA-E4S V2.0)"
          value={filters.machineModel}
          onChange={e => setFilters(prev => ({ ...prev, machineModel: e.target.value }))}
        />
        
        <select 
          value={filters.isConsumable === undefined ? '' : filters.isConsumable.toString()} 
          onChange={e => {
            const value = e.target.value;
            setFilters(prev => ({ 
              ...prev, 
              isConsumable: value === '' ? undefined : value === 'true' 
            }));
          }}
        >
          <option value="">所有备件</option>
          <option value="true">易损件</option>
          <option value="false">非易损件</option>
        </select>
        
        <input
          type="text"
          placeholder="搜索备件..."
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      {/* 易损件组 */}
      {groupedParts.consumable.length > 0 && (
        <div className="spare-parts-group">
          <h2>🔧 易损件 ({groupedParts.consumable.length})</h2>
          <div className="parts-grid">
            {groupedParts.consumable.map(part => (
              <div key={part.id} className="spare-part-card consumable">
                <img src={part.image_url} alt={part.name_zh} />
                <div className="part-info">
                  <h4>{part.name_zh}</h4>
                  <p>适配机型: {part.app_model}</p>
                  <p>料号: {part.part_number}</p>
                  {part.spec && <p>规格: {part.spec}</p>}
                  <span className="badge consumable">易损件</span>
                </div>
                <div className="part-actions">
                  <button className="btn-detail">查看详情</button>
                  <button className="btn-cart">加入购物车</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 非易损件组 */}
      {groupedParts.nonConsumable.length > 0 && (
        <div className="spare-parts-group">
          <h2>⚙️ 非易损件 ({groupedParts.nonConsumable.length})</h2>
          <div className="parts-grid">
            {groupedParts.nonConsumable.map(part => (
              <div key={part.id} className="spare-part-card non-consumable">
                <img src={part.image_url} alt={part.name_zh} />
                <div className="part-info">
                  <h4>{part.name_zh}</h4>
                  <p>适配机型: {part.app_model}</p>
                  <p>料号: {part.part_number}</p>
                  {part.spec && <p>规格: {part.spec}</p>}
                  <span className="badge non-consumable">非易损件</span>
                </div>
                <div className="part-actions">
                  <button className="btn-detail">查看详情</button>
                  <button className="btn-cart">加入购物车</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SparePartsPage;
```

---

## ⚙️ 自定义配置

### 1. 环境配置

```typescript
// frontend/src/config/mock-config.ts
import { IntegratedMockService } from '../services/integrated-mock-service';

export const configureMockService = () => {
  const mockService = IntegratedMockService.getInstance();
  
  // 根据环境变量配置
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isDevelopment) {
    mockService.setConfig({
      useRealSQLData: true,
      mockEnvironment: 'development',
      enableCaching: true,
      networkDelay: false
    });
    console.log('🔧 开发环境: 使用SQL Mock数据');
  } else if (isTest) {
    mockService.setConfig({
      useRealSQLData: true,
      mockEnvironment: 'testing',
      enableCaching: false,
      networkDelay: false
    });
    console.log('🧪 测试环境: 使用SQL Mock数据，关闭缓存');
  } else {
    mockService.setConfig({
      useRealSQLData: false,
      mockEnvironment: 'production',
      enableCaching: true,
      networkDelay: true
    });
    console.log('🚀 生产环境: 使用传统Mock数据');
  }
};
```

### 2. 在App.tsx中初始化

```tsx
// frontend/src/App.tsx
import { useEffect } from 'react';
import { configureMockService } from './config/mock-config';

function App() {
  useEffect(() => {
    // 初始化Mock服务配置
    configureMockService();
  }, []);

  return (
    <div className="App">
      {/* 你的应用组件 */}
    </div>
  );
}

export default App;
```

### 3. 高级自定义Hook

```typescript
// frontend/src/hooks/useMockData.ts
import { useState, useEffect } from 'react';
import { IntegratedMockService } from '../services/integrated-mock-service';

export const useMockData = <T>(
  dataType: 'machines' | 'accessories' | 'consumables' | 'spareParts',
  params?: any
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mockService = IntegratedMockService.getInstance();

  useEffect(() => {
    loadData();
  }, [dataType, JSON.stringify(params)]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      switch (dataType) {
        case 'machines':
          result = await mockService.getMachines(params);
          break;
        case 'accessories':
          result = await mockService.getAccessories(params);
          break;
        case 'consumables':
          result = await mockService.getConsumables(params);
          break;
        case 'spareParts':
          result = await mockService.getSpareParts(params);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
      
      setData(result as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(`❌ ${dataType} 数据加载失败:`, err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadData();

  return { data, loading, error, refresh };
};
```

### 4. 使用自定义Hook简化组件

```tsx
// 简化后的机器页面
import React from 'react';
import { useMockData } from '../hooks/useMockData';
import type { MachineListData } from '../types/api.types';

const SimplifiedMachinesPage: React.FC = () => {
  const { data, loading, error, refresh } = useMockData<MachineListData>('machines', {
    category: 1,
    page: 1,
    pageSize: 10
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!data) return <div>暂无数据</div>;

  return (
    <div>
      <button onClick={refresh}>刷新数据</button>
      <div>找到 {data.total} 台机器</div>
      {/* 渲染机器列表 */}
    </div>
  );
};
```

---

## 📊 服务状态监控

```typescript
// frontend/src/components/MockServiceStatus.tsx
import React from 'react';
import { getMockServiceStatus } from '../services/integrated-mock-service';

const MockServiceStatus: React.FC = () => {
  const status = getMockServiceStatus();

  return (
    <div className="mock-service-status" style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Mock服务状态: {status.isActive ? '🟢 活跃' : '🔴 停用'}</div>
      <div>数据源: {status.dataSource}</div>
      <div>总表数: {status.totalTables}</div>
      <div>总记录数: {status.totalRecords}</div>
      <div>环境: {status.config.mockEnvironment}</div>
    </div>
  );
};

export default MockServiceStatus;
```

---

## ✅ 快速检查清单

使用此清单确保正确集成：

- [ ] ✅ 导入了正确的Mock服务
- [ ] ✅ 配置了环境相关的Mock设置
- [ ] ✅ 替换了现有的静态Mock数据
- [ ] ✅ 实现了错误处理
- [ ] ✅ 添加了加载状态
- [ ] ✅ 测试了筛选和分页功能
- [ ] ✅ 验证了数据格式匹配
- [ ] ✅ 检查了控制台日志输出

## 🎯 下一步

1. **逐步迁移**: 先在一个页面测试，确认无误后再应用到其他页面
2. **性能优化**: 使用React.memo()和useMemo()优化渲染性能
3. **缓存策略**: 实现适当的数据缓存减少重复请求
4. **错误边界**: 添加Error Boundary组件处理意外错误

现在你可以立即开始在项目中使用这些SQL Mock数据服务了！ 