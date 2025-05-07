# 前端代码实现计划

## 一、现有代码结构分析

### 1.1 目录结构
```
src/
├── pages/                    # 页面组件
│   ├── Consumables/         # 耗材页面
│   └── SpareParts/          # 备件页面
├── components/              # 公共组件
├── contexts/               # 上下文管理
├── services/              # API服务
│   └── apiAnalysis/      # API分析文档
└── utils/                # 工具函数
```

### 1.2 已实现功能
1. 耗材页面
   - 筛选功能
   - 列表展示
   - 购物车集成
   - Tooltip展示
   - 权限控制

2. 备件页面
   - 产品类型筛选
   - 型号选择
   - 列表展示
   - 购物车功能

## 二、新功能开发计划

### 2.1 产品线管理页面
```typescript
// src/pages/ProductLines/index.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, message } from 'antd';
import { productLineApi } from '../../services/api';

const ProductLinesPage: React.FC = () => {
  // 复用现有的状态管理和API调用模式
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [productLines, setProductLines] = useState([]);

  // 表格列定义
  const columns = [
    {
      title: t('productLine.code'),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: t('productLine.name'),
      dataIndex: 'name',
      render: (name: any) => (
        <>
          <div>{name.cn}</div>
          <div>{name.en}</div>
        </>
      ),
    },
    // ... 其他列
  ];

  return (
    <div className="product-lines-page">
      <Table 
        columns={columns}
        dataSource={productLines}
        loading={loading}
      />
    </div>
  );
};
```

### 2.2 设备管理页面
```typescript
// src/pages/Machines/index.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Select, Button } from 'antd';
import { machineApi } from '../../services/api';

const MachinesPage: React.FC = () => {
  // 复用现有的筛选和列表逻辑
  const [productLineId, setProductLineId] = useState<string>('');
  const [machines, setMachines] = useState([]);

  // 复用现有的Tooltip组件
  const MachineTooltip = React.lazy(() => 
    import('../../components/Tooltip/MachineTooltip')
  );

  return (
    <div className="machines-page">
      {/* 复用现有的筛选组件结构 */}
      <div className="filter-container">
        <ProductLineSelect 
          value={productLineId}
          onChange={setProductLineId}
        />
      </div>

      {/* 复用现有的表格结构 */}
      <Table 
        columns={machineColumns}
        dataSource={machines}
      />
    </div>
  );
};
```

### 2.3 组件复用与扩展

1. 筛选组件扩展
```typescript
// src/components/Filters/ProductLineFilter.tsx
import { Select } from 'antd';
import { useProductLines } from '../../hooks/useProductLines';

export const ProductLineFilter: React.FC<FilterProps> = ({
  value,
  onChange,
}) => {
  const { productLines, loading } = useProductLines();

  return (
    <Select
      value={value}
      onChange={onChange}
      loading={loading}
      placeholder={t('filter.selectProductLine')}
    >
      {productLines.map(line => (
        <Select.Option key={line.id} value={line.id}>
          {line.name.cn} / {line.name.en}
        </Select.Option>
      ))}
    </Select>
  );
};
```

2. Tooltip组件复用
```typescript
// src/components/Tooltip/BaseTooltip.tsx
import React from 'react';
import { Tooltip } from 'antd';

export const BaseTooltip: React.FC<BaseTooltipProps> = ({
  item,
  children,
  content,
}) => {
  // 复用现有的Tooltip逻辑
  return (
    <Tooltip
      title={content}
      trigger="click"
      placement="right"
    >
      {children}
    </Tooltip>
  );
};
```

### 2.4 API服务扩展

1. 产品线API
```typescript
// src/services/productLineApi.ts
import { request } from '../utils/request';

export const productLineApi = {
  getProductLines: () =>
    request('/wp-json/bjt/v1/product-lines'),

  createProductLine: (data: ProductLineData) =>
    request('/wp-json/bjt/v1/product-lines', {
      method: 'POST',
      data,
    }),

  updateProductLine: (id: string, data: ProductLineData) =>
    request(`/wp-json/bjt/v1/product-lines/${id}`, {
      method: 'PUT',
      data,
    }),

  deleteProductLine: (id: string) =>
    request(`/wp-json/bjt/v1/product-lines/${id}`, {
      method: 'DELETE',
    }),
};
```

2. 设备API
```typescript
// src/services/machineApi.ts
import { request } from '../utils/request';

export const machineApi = {
  getMachines: (params: MachineQueryParams) =>
    request('/wp-json/bjt/v1/machines', {
      params,
    }),

  getMachinesByProductLine: (productLineId: string) =>
    request(`/wp-json/bjt/v1/product-lines/${productLineId}/machines`),
};
```

### 2.5 状态管理扩展

1. 产品线Context
```typescript
// src/contexts/ProductLineContext.tsx
import React, { createContext, useContext, useState } from 'react';

export const ProductLineContext = createContext<ProductLineContextType>(null);

export const ProductLineProvider: React.FC = ({ children }) => {
  const [productLines, setProductLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);

  // 复用现有的缓存逻辑
  const { cacheManager } = useCache();

  return (
    <ProductLineContext.Provider
      value={{
        productLines,
        selectedLine,
        setSelectedLine,
        // ... 其他方法
      }}
    >
      {children}
    </ProductLineContext.Provider>
  );
};
```

2. 机器Context
```typescript
// src/contexts/MachineContext.tsx
import React, { createContext, useContext, useState } from 'react';

export const MachineContext = createContext<MachineContextType>(null);

export const MachineProvider: React.FC = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const { selectedLine } = useProductLine();

  useEffect(() => {
    if (selectedLine) {
      loadMachines(selectedLine.id);
    }
  }, [selectedLine]);

  return (
    <MachineContext.Provider
      value={{
        machines,
        setMachines,
        // ... 其他方法
      }}
    >
      {children}
    </MachineContext.Provider>
  );
};
```

## 三、开发步骤

1. 基础设施搭建（1-2天）
   - 复用现有的工具函数
   - 扩展API服务
   - 扩展状态管理

2. 组件开发（3-4天）
   - 产品线管理页面
   - 设备管理页面
   - 复用和扩展公共组件

3. 功能联调（2-3天）
   - API联调
   - 状态管理测试
   - 组件交互测试

4. 优化和测试（2天）
   - 性能优化
   - 单元测试
   - 集成测试

## 四、注意事项

1. 代码复用
   - 优先复用现有组件
   - 保持代码风格一致
   - 复用现有的工具函数

2. 性能优化
   - 复用现有的缓存策略
   - 组件按需加载
   - 状态管理优化

3. 测试覆盖
   - 复用现有的测试用例
   - 补充新功能测试
   - 端到端测试 