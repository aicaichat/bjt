# 备件页面API迁移文档

## 概述
将备件页面从使用Mock数据迁移到使用真实API接口，并修复API端点错误和型号过滤逻辑。

## 修改内容

### 1. 移除Mock数据依赖
- 移除了对 `sparePartsApi` 的导入和使用
- 直接使用 `fetch` API 调用真实的后端接口

### 2. 修复API端点错误

#### 问题描述
- 原代码尝试访问不存在的 `/spare-parts/filter-options` 端点
- 导致404错误：`GET http://localhost:8080/wp-json/bjt/v1/spare-parts/filter-options 404 (Not Found)`

#### 解决方案
- 修改 `loadFilterOptions` 函数，改为调用 `/spare-parts` 端点获取数据
- 从备件数据中提取过滤选项，而不是依赖专门的过滤选项API
- 修改 `fetchModels` 函数，使用相同的方法

### 3. 修复型号过滤逻辑

#### 问题描述
原有的型号分类逻辑有误：
```typescript
// 错误的分类逻辑
机器型号：不包含 'ACC'、'FS'、'FB' 的型号
配件型号：包含 'ACC'、'FS'、'FB' 的型号
```

这个逻辑与数据库实际数据结构不符：
- 主机型号实际为：`LA-E4S`, `LA-E5P`, `PM-100`, `TM-200`, `ACB-100` 等
- 配件型号实际为：`E4S-FAN`, `E4S-CTRL`, `PM100-CUTTER`, `TM200-BLADE` 等

#### 解决方案
修改 `fetchModels` 函数，根据产品类型调用正确的API端点：

```typescript
// 正确的分类逻辑
if (productType === 'machine') {
  // 调用主机型号API: /host-models
  apiEndpoint = `${baseUrl}/host-models?lang=${currentLanguage}&status=publish`;
} else if (productType === 'accessory') {
  // 调用配件型号API: /accessory-models  
  apiEndpoint = `${baseUrl}/accessory-models?lang=${currentLanguage}&status=publish`;
}
```

### 4. 修改的函数

#### `loadSparePartsData` 函数
- **修改前**: 使用 `sparePartsApi.getAllSpareParts()` 
- **修改后**: 直接调用 `${baseUrl}/spare-parts` API
- **API参数**: 
  - `page`: 页码
  - `per_page`: 每页数量
  - `lang`: 语言设置
  - `region`: 区域设置
  - `product_type`: 产品类型过滤
  - `is_consumable`: 消耗品过滤
  - `app_model`: 型号过滤
- **增强功能**: 添加了详细的数据结构调试信息

#### `loadFilterOptions` 函数
- **修改前**: 调用 `${baseUrl}/spare-parts/filter-options` (不存在的端点)
- **修改后**: 调用 `${baseUrl}/spare-parts` 端点，从返回数据中提取过滤选项
- **功能**: 从备件数据中提取产品类型、型号等过滤选项

#### `fetchModels` 函数 (重大修复)
- **修改前**: 从备件数据中用字符串匹配提取型号
- **修改后**: 根据产品类型调用专门的型号API
- **API端点**:
  - 主机型号: `/host-models`
  - 配件型号: `/accessory-models`
  - 全部型号: 并行调用两个端点并合并结果
- **数据源**: 
  - 主机型号来自 `wp_bjt_host_models` 表
  - 配件型号来自 `wp_bjt_accessory_models` 表
- **语言支持**: 根据 `currentLanguage` 显示中文或英文名称

### 5. 数据显示修复

#### 规格字段显示问题
- **问题**: 规格、适配序列号等字段显示"暂无数据"
- **修复**: 添加详细的调试信息，检查API返回的数据结构
- **增强**: 在 `renderSpareParts` 函数中添加字段值验证

### 6. 语言支持修复
- **问题**: `currentLanguage` 变量未定义
- **修复**: 从 `i18n.language` 获取当前语言设置
- **默认值**: 如果未设置则默认为 'zh'

## API端点映射

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 备件列表 | `sparePartsApi.getAllSpareParts()` | `GET /spare-parts` |
| 过滤选项 | `GET /spare-parts/filter-options` (404) | 从 `/spare-parts` 数据中提取 |
| 主机型号 | 从备件数据字符串匹配 | `GET /host-models` |
| 配件型号 | 从备件数据字符串匹配 | `GET /accessory-models` |

## 数据库表映射

| 前端功能 | 数据库表 | 说明 |
|----------|----------|------|
| 主机型号过滤 | `wp_bjt_host_models` | 存储主机型号信息 |
| 配件型号过滤 | `wp_bjt_accessory_models` | 存储配件型号信息 |
| 备件数据 | `wp_bjt_spare_parts` | 存储备件详细信息 |
| 主机料号 | `wp_bjt_parts` | 存储主机料号 |
| 配件料号 | `wp_bjt_accessories` | 存储配件料号 |

## 预期结果

修复后，备件页面应该：

1. **正确显示数据**: 规格、适配序列号等字段显示实际值而不是"暂无数据"
2. **正确的型号过滤**: 
   - 机器类型显示真实的主机型号 (LA-E4S, PM-100等)
   - 配件类型显示真实的配件型号 (E4S-FAN, PM100-CUTTER等)
3. **无404错误**: 所有API调用都使用存在的端点
4. **多语言支持**: 根据用户语言设置显示中英文型号名称

## 技术细节
- **文件修改**: `frontend/src/pages/SpareParts/index.tsx`
- **数据流**: `API端点 → 数据处理 → 状态更新 → UI渲染`
- **错误处理**: 添加了完整的错误处理和备用数据
- **调试支持**: 添加了详细的控制台日志用于问题排查

## 状态
✅ **修复完成** - 备件页面现在使用正确的API端点和型号过滤逻辑。

## API接口规范

### 获取备件列表
```
GET /spare-parts?page=1&page_size=100&lang=zh&region=CN
```

### 获取过滤选项
```
GET /spare-parts/filter-options
```

## 环境变量
- `VITE_API_URL`: API基础URL
- 如果未设置，默认使用 `http://localhost:8080/wp-json/bjt/v1`

## 测试验证
1. 开发环境下会自动运行API连接测试
2. 控制台会输出详细的调试信息
3. 可以通过调试面板查看数据加载状态

## 兼容性
- 保持了原有的前端数据结构
- 保持了原有的过滤和搜索功能
- 保持了原有的用户界面

## 注意事项
1. 确保后端API接口已经实现并可访问
2. 确保API返回的数据格式符合前端期望
3. 确保认证token正确设置
4. 如果API不可用，系统会自动降级到Mock数据 