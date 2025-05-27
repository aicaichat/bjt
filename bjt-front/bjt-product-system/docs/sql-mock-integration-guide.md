# SQL Mock数据集成使用指南

## 🎯 **概述**

本指南介绍如何使用**严格按照数据库表结构**的Mock数据生成器，为BJT前端项目提供真实、一致的测试数据。

⚠️ **重要原则**: Mock数据**严格按照数据库表的结构和字段**，不允许随意减少或者增加字段。

## 📁 **文件结构**

```
frontend/src/services/
├── sql-mock-generator.ts           # SQL数据生成器（严格按表结构）
├── integrated-mock-service.ts      # 集成Mock服务
└── unified-mock-manager-v2.ts      # 统一Mock管理器V2

frontend/src/tests/
├── pages/
│   └── sql-mock-integration.test.ts    # SQL Mock集成测试
└── sql-mock-test-runner.ts             # SQL数据验证测试器

docs/
└── sql-mock-integration-guide.md       # 本使用指南
```

## 🚀 **快速开始**

### 1. 导入服务

```typescript
import { 
  getMachinesData, 
  getAccessoriesData, 
  getConsumablesData, 
  getSparePartsData,
  getProductLinesData,
  getMockServiceStatus
} from '@/services/integrated-mock-service';

import { 
  getTableData, 
  filterData, 
  getPaginatedData 
} from '@/services/sql-mock-generator';
```

## ⚡ **严格数据库表结构**

### 产品线数据 (wp_bjt_product_lines)

```typescript
const productLines = await getProductLinesData();
console.log('产品线数据 (严格按数据库字段):', productLines);

// 示例输出 - 包含数据库表的所有字段
// {
//   id: 1,
//   title_zh: '气垫系列',
//   title_en: 'Air Cushioning System',
//   description_zh: '专业气垫机生产商...',
//   description_en: 'Reliable Air Cushion Machine...',
//   subitem1_zh: '缓冲气垫机',
//   subitem1_en: 'Air Cushion Machine',
//   subitem2_zh: '缓冲气垫膜',
//   subitem2_en: 'Air Cushion Film',
//   subitem3_zh: '缓冲气垫外设配件',
//   subitem3_en: 'Air Cushion Accessories',
//   image_url: '/uploads/product_lines/Air Cushioning System.jpg',
//   code: 'air_cushion',
//   status: 'publish',
//   sort_order: 10,
//   created_at: '2024-01-01 00:00:00',
//   updated_at: '2024-01-01 00:00:00'
// }
```

### 主机数据 (wp_bjt_parts)

```typescript
// 获取主机数据 - 严格按照wp_bjt_parts表结构
const machines = await getMachinesData({ category: 1 });

// 数据库原始字段（完整保留）：
// id, product_line_id, model, voltage, image_url, part_number,
// name_zh, name_en, brand, spec, spec_imperial, package_size_cm,
// package_size_inch, net_weight_kg, net_weight_lbs, gross_weight_kg,
// gross_weight_lbs, pcs_per_box, pallet_size_cm, pallet_size_inch,
// pcs_per_pallet, pallet_height_cm, pallet_height_inch, 
// pallet_gross_weight_kg, pallet_gross_weight_lbs, status,
// created_at, updated_at, unit

// API适配字段（映射但不删除原字段）：
// code (映射自 part_number)
// title_zh (映射自 name_zh)
// title_en (映射自 name_en)
// type (设置为 'machine')
// description_zh (映射自 spec)
// description_en (映射自 spec_imperial)
```

### 配件数据 (wp_bjt_accessories)

```typescript
// 严格按照wp_bjt_accessories表结构
const accessories = await getAccessoriesData({ category: 1 });

// 包含所有数据库字段：
// id, product_line_id, model, brand, part_number, name_zh, name_en,
// spec, spec_imperial, voltage, frequency, package_size_cm, 
// package_size_inch, net_weight_kg, net_weight_lbs, gross_weight_kg,
// gross_weight_lbs, pcs_per_box, pallet_size_cm, pallet_size_inch,
// pcs_per_pallet, pallet_height_cm, pallet_height_inch,
// pallet_gross_weight_kg, pallet_gross_weight_lbs, image_url,
// status, created_at, updated_at, unit
```

## 🔍 **数据查询与筛选**

### 直接查询数据库表

```typescript
// 直接获取原始数据库表数据
const allParts = getTableData('wp_bjt_parts');
const allAccessories = getTableData('wp_bjt_accessories');
const allSpareParts = getTableData('wp_bjt_spare_parts');

// 按条件筛选
const filteredParts = filterData('wp_bjt_parts', { 
  product_line_id: 1, 
  voltage: '110V' 
});

// 分页查询
const paginatedData = getPaginatedData('wp_bjt_parts', 1, 10);
// 返回: { items, total, page, pageSize, totalPages }
```

### 耗材相关表查询

```typescript
// 形状数据 (wp_bjt_shapes)
const shapes = getTableData('wp_bjt_shapes');
// 字段: id, product_line_id, code, name_zh, name_en, image_url, image_url2, status, sort_order, created_at, updated_at

// 材料数据 (wp_bjt_materials) 
const materials = getTableData('wp_bjt_materials');
// 字段: id, product_line_id, code, name_zh, name_en, base_material, status, sort_order, created_at, updated_at

// 规格数据 (wp_bjt_specifications)
const specifications = getTableData('wp_bjt_specifications');
// 字段: id, product_line_id, spec_type, metric_value, metric_unit, imperial_value, imperial_unit, status, sort_order, created_at, updated_at
```

## ✅ **数据验证测试**

### 运行数据结构验证

```typescript
import { runSQLMockValidationTests } from '@/tests/sql-mock-test-runner';

// 验证数据是否严格按照数据库表结构
const results = await runSQLMockValidationTests();

console.log(`
验证结果:
✅ 通过: ${results.passed}/${results.total}
❌ 失败: ${results.failed}/${results.total}
成功率: ${((results.passed / results.total) * 100).toFixed(1)}%
`);

// 检查具体的验证项目：
// - 数据库表结构验证
// - 产品线数据完整性
// - 主机数据完整性  
// - 配件数据完整性
// - 字段映射正确性
// - 数据类型一致性
```

## 🔧 **配置与自定义**

### Mock服务配置

```typescript
import { integratedMockService } from '@/services/integrated-mock-service';

// 配置使用SQL数据
integratedMockService.setConfig({
  useRealSQLData: true,        // 使用基于SQL的真实数据结构
  mockEnvironment: 'testing',   // 测试环境
  enableCaching: true,         // 启用缓存
  networkDelay: false          // 禁用网络延迟模拟
});

// 检查服务状态
const status = getMockServiceStatus();
console.log('Mock服务状态:', status);
```

## ⚠️ **重要约束与最佳实践**

### 1. 字段完整性原则
```typescript
// ❌ 错误：删除数据库字段
const wrongData = {
  id: 1,
  name: 'Product',  // 缺少name_zh, name_en等数据库字段
  status: 'active'
};

// ✅ 正确：保持所有数据库字段
const correctData = {
  id: 1,
  product_line_id: 1,
  part_number: '60A01143',
  name_zh: 'LA-E4S V2.0主机-标准版',
  name_en: 'LA-E4S V2.0 Host-Standard',
  brand: 'Lockdeair',
  // ... 所有其他数据库字段
  status: 'publish',
  created_at: '2024-01-01 00:00:00',
  updated_at: '2024-01-01 00:00:00',
  unit: 'pcs'
};
```

### 2. 字段映射原则
```typescript
// API适配时，映射但不删除原字段
const apiData = {
  // 原始数据库字段（完整保留）
  id: part.id,
  part_number: part.part_number,
  name_zh: part.name_zh,
  name_en: part.name_en,
  // ... 所有其他数据库字段
  
  // API字段（映射自数据库字段）
  code: part.part_number,      // 映射
  title_zh: part.name_zh,      // 映射
  title_en: part.name_en,      // 映射
  type: 'machine'              // 新增（仅限API必需）
};
```

### 3. 数据类型约束
```typescript
// 确保数据类型与数据库定义一致
interface StrictDatabaseRecord {
  id: number;                    // bigint -> number
  product_line_id: number;       // bigint -> number  
  name_zh: string;               // varchar -> string
  name_en: string;               // varchar -> string
  net_weight_kg: number | null;  // decimal -> number | null
  pcs_per_box: number | null;    // int -> number | null
  status: string;                // varchar -> string
  created_at: string;            // datetime -> string
  updated_at: string;            // datetime -> string
}
```

## 📊 **数据统计与监控**

```typescript
import { sqlMockGenerator } from '@/services/sql-mock-generator';

// 获取数据统计
const stats = sqlMockGenerator.getStatistics();
console.log(`
数据统计:
- 总表数: ${stats.totalTables}
- 总记录数: ${stats.totalRecords}
- 各表详情:
${stats.tableStats.map(stat => 
  `  * ${stat.tableName}: ${stat.recordCount} 条记录, ${stat.columns} 个字段`
).join('\n')}
`);

// 获取所有表数据
const allData = sqlMockGenerator.getAllData();
console.log('所有数据表:', Object.keys(allData));

// 获取表结构信息
const allSchemas = sqlMockGenerator.getAllSchemas();
console.log('表结构信息:', allSchemas.map(s => s.tableName));
```

## 🚨 **常见错误与解决方案**

### 错误1：字段缺失
```
错误: "产品线数据缺少字段: subitem1_zh"
解决: 确保Mock数据包含数据库表的所有字段
```

### 错误2：数据类型不匹配
```
错误: "字段 id 应该是数字类型，实际是 string"
解决: 检查数据类型定义，确保与数据库表结构一致
```

### 错误3：API字段映射错误
```
错误: "主机API数据缺少字段: code"
解决: 确保API字段正确映射自数据库字段
```

## 📚 **相关文档**

- 数据库表结构: `docker/dev/mysql/init.sql`
- 数据库实际数据: `docker/dev/mysql/_设备.sql`, `docker/dev/mysql/_耗材.sql`
- API类型定义: `frontend/src/types/api.types.ts`
- 测试用例: `frontend/src/tests/pages/sql-mock-integration.test.ts`

---

**核心原则**: 严格按照数据库表结构，保证数据完整性和一致性！ 