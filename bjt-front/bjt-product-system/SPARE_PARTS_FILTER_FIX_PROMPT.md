# 备件页面筛选功能精确修复提示词

## 问题描述
备件页面的筛选功能（如备件型号、类别、品牌、适用机型、规格等）无法正确过滤数据。需要在不影响其他功能的前提下，最小化修改代码来修复筛选逻辑。

## 重要发现
1. **数据结构不一致**：
   - 筛选条件使用的是 ID 或 value（如 'MOTOR'、'brandA'）
   - 实际数据中使用的是描述性值或顶层字段（如 '电机'、'BrandA'）
   - 需要建立 ID 到实际值的映射关系
2. **字段位置问题**：
   - 筛选逻辑可能直接使用顶层字段（item.model, item.brand）
   - 实际数据可能在 item.specs 或 item.details 等嵌套对象中
   - 需要修改筛选逻辑以使用正确的字段路径
3. **值格式问题**：
   - 筛选条件中的值可能是小写（如 'brandb'）
   - 数据中的值可能是大写或首字母大写（如 'BrandB'）
   - 需要统一大小写处理
4. **兼容性/适用机型字段处理**：
   - 适用机型可能存储在 item.compatibility 或 item.specs.compatibility 中
   - 值可能是逗号分隔的字符串
   - 需要正确分割和匹配

## ⚠️ 现实问题补充
- 即使按照上述修复，**实际项目中筛选功能仍然存在无法正确过滤数据的问题**。
- 具体表现为：筛选条件和数据字段已严格一一映射、大小写处理、字段路径修正后，依然出现"无任何数据返回"或"全部被过滤掉"的现象。
- 这说明项目中可能还存在如下隐性问题：
  1. **筛选条件的 value 与数据字段的真实值仍未完全对齐**（如 specs 字段和顶层字段混用、部分数据缺失、部分字段为 null/undefined）。
  2. **部分数据字段实际为 undefined/null 或格式不一致**，导致比较时全部不通过。
  3. **部分筛选条件的默认值与数据实际内容不符**（如默认 category/brand/model 不是 'all'，而数据中没有对应值）。
  4. **数据源本身与筛选 UI 选项的 value 不一致**，如 UI 选项是 id，数据是 name。
  5. **部分字段在 mock 数据和 API 数据结构不一致**。

### 建议的后续排查方向
- 逐步打印所有数据和所有筛选条件，**对比每一项的实际值和筛选条件**。
- 检查所有字段的 null/undefined 情况，必要时加默认值兜底。
- 检查 UI 下拉选项的 value 是否与数据字段完全一致。
- 检查 mock 数据和 API 数据结构是否完全一致。
- 尝试只用一个筛选条件，逐步叠加，定位是哪一项导致全部被过滤。
- 必要时在 filter 里打印被过滤掉的项和原因。

## 修复原则
1. **最小化修改**：只修改筛选相关的代码
2. **保持稳定**：不改变其他功能
3. **精确定位**：只修改筛选逻辑部分
4. **可追踪**：添加必要的调试日志
5. **数据映射**：建立 ID 到实际值的映射关系
6. **仅限前端**：本修复仅允许修改前端筛选逻辑，**禁止修改后端API的任何逻辑**。
7. **修改前必须先备份重要文件**，如 .md、.ts、.tsx、.json 等，确保可回滚。
8. **所有修改应保证最小粒度、可回退，优先由开发者自主完成。**

## machine页面筛选核心逻辑梳理与对照迁移建议

### 1. machine页面筛选核心逻辑梳理
- **筛选项 value 与数据字段一一对应**：所有下拉/多选/输入框的 value 必须与数据字段的实际值完全一致（如 id、name、code、brand等）。
- **字段路径统一**：筛选逻辑直接用 item.xxx（如 item.model、item.brand、item.category），不混用 specs、details 等嵌套对象，或有则统一处理。
- **大小写和空格处理**：如有必要，统一用 normalize（toLowerCase、trim）处理后再比较。
- **默认值与数据一致**：筛选项的默认值（如 'all'）与数据实际内容一致，且数据中有对应项。
- **UI value 与数据字段完全一致**：下拉选项 value 必须与数据字段值一一对应。
- **调试日志**：打印当前筛选条件和数据样本，便于排查。
- **分页与数据流转**：筛选、分页、数据展示分离，互不干扰。

### 2. 迁移建议/对照清单（备件页面参考 machine 页面）
- [ ] 所有筛选项 value 必须与数据字段实际值一一对应（如 id、name、code、brand等）
- [ ] 筛选逻辑统一用顶层字段（如 item.model、item.brand），如有嵌套 specs、details，需统一处理
- [ ] 比较时如有大小写/空格差异，统一 normalize 处理
- [ ] 筛选项的默认值与数据实际内容一致，且数据中有对应项
- [ ] UI 下拉/多选/输入框的 value 与数据字段完全一致
- [ ] 添加调试日志，打印当前筛选条件和数据样本
- [ ] 分页、数据展示、筛选逻辑分离，互不干扰
- [ ] 不要修改后端API逻辑，所有修复仅限前端

### 3. 推荐迁移步骤
1. 先对比 machine 页面的筛选 useEffect（或核心筛选函数）和备件页面的筛选代码，找出所有差异点。
2. 逐项对照上方清单，修正备件页面的筛选项 value、字段路径、normalize 处理、默认值等。
3. 添加调试日志，逐步验证每个筛选条件的实际效果。
4. 保证分页、数据展示、筛选逻辑分离，互不影响。
5. 验证所有筛选项组合均能正确过滤数据。

## 具体修复步骤

### 1. 添加映射关系（如有必要）
```typescript
// category id 到 specs.category 的映射
const categoryIdToSpecsCategory: Record<string, string> = {
  MOTOR: '电机',
  SENSOR: '传感器',
  // ... 其他类别
};

// brand id 到 specs.brand 的映射
const brandIdToSpecsBrand: Record<string, string> = {
  'brandA': 'BrandA',
  'brandB': 'BrandB',
  // ... 其他品牌
};
```

### 2. 添加调试日志
在筛选 useEffect 中添加以下日志：
```typescript
// 打印当前筛选条件
console.log('【筛选条件】', {
  model: selectedModel,
  category: selectedCategory,
  brand: selectedBrand,
  compatibility: selectedCompatibility,
  // ... 其他筛选项
});

// 打印数据样本
allSpareParts.slice(0, 3).forEach((item, idx) => {
  console.log(`【数据${idx}】`, {
    id: item.id,
    model: item.model,
    compatibility: item.compatibility || item.specs?.compatibility,
    category: item.category || item.specs?.category,
    brand: item.brand || item.specs?.brand,
    // ... 其他字段
  });
});
```

### 3. 修复筛选逻辑
在 useEffect 中修改筛选逻辑：
```typescript
const normalize = v => (v ?? '').toString().toLowerCase().replace(/\s+/g, '');

const filtered = allSpareParts.filter(item => {
  // 型号筛选
  if (selectedModel !== 'all') {
    const compat = item.compatibility || item.specs?.compatibility || '';
    const compatArr = compat.split(',').map(normalize);
    if (!compatArr.some(c => c.includes(normalize(selectedModel)))) return false;
  }

  // 类别筛选
  if (selectedCategory !== 'all') {
    const expectedCategory = categoryIdToSpecsCategory[selectedCategory];
    if ((item.category || item.specs?.category || '') !== expectedCategory) return false;
  }

  // 品牌筛选
  if (selectedBrand !== 'all') {
    const expectedBrand = brandIdToSpecsBrand[selectedBrand.toLowerCase()];
    if ((item.brand || item.specs?.brand || '').toLowerCase() !== expectedBrand.toLowerCase()) return false;
  }

  // ... 其他筛选项

  return true;
});
```

## 验证步骤
1. 检查控制台日志，确认筛选条件正确
2. 验证数据样本的字段值
3. 测试每个筛选条件：
   - 选择单个筛选条件
   - 组合多个筛选条件
   - 重置筛选条件
4. 确认分页功能正常
5. 确认其他功能（如购物车、详情等）不受影响

## 注意事项
1. 不要修改其他功能代码
2. 保持现有的状态管理逻辑
3. 不改变UI组件结构
4. 不修改API调用逻辑
5. 保持现有的错误处理机制
6. 注意数据字段的位置（item.specs.xxx 或 item.xxx）
7. 注意大小写敏感性
8. 注意数值比较的精度问题
9. **禁止修改后端API的任何逻辑，所有修复仅限前端实现。**
10. **修改前必须先备份重要文件，确保可回滚。**

## 预期结果
1. 筛选条件能正确过滤数据
2. 控制台显示清晰的调试信息
3. 分页正确显示筛选后的数据
4. 其他功能保持正常工作
5. 筛选条件与数据字段正确匹配
6. 数值比较准确可靠 