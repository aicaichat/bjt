# CSV字段对比工具使用说明

## 🎯 工具概述

这套工具用于确保备件页面的字段定义在源头文档中保持一致性，避免前端实现时出现字段遗漏或不匹配的问题。

## 📁 文件结构

```
project/
├── scripts/
│   ├── csv_field_comparison.cjs        # 自动解析CSV的对比脚本
│   └── manual_field_extractor.cjs      # 手动修正版对比脚本(推荐)
├── generated_sql_imports/
│   ├── sparepart.csv                   # 备件页面字段定义
│   └── name统一.csv                    # 字段标准规范
└── docs/
    ├── 备件页面字段对照检查表.md        # 详细的字段对照表
    ├── 字段完整性检查脚本.js           # 前端字段验证脚本
    ├── 备件页面修复实施计划.md          # 具体的修复计划
    ├── csv_field_comparison_report_manual.md  # 详细对比报告
    └── 备件页面源头数据一致性分析总结.md    # 总结分析报告
```

## 🚀 快速开始

### 1. 运行字段对比分析

```bash
# 进入项目目录
cd /path/to/bjt-product-system

# 运行手动修正版脚本（推荐）
node scripts/manual_field_extractor.cjs

# 或运行自动解析版脚本
node scripts/csv_field_comparison.cjs
```

### 2. 查看分析结果

脚本会生成详细的分析报告：
- `docs/csv_field_comparison_report_manual.md` - 详细对比报告
- 控制台输出 - 关键统计信息

### 3. 查看总结和建议

查看 `docs/备件页面源头数据一致性分析总结.md` 获取：
- 关键问题总结
- 修复优先级
- 具体行动清单

## 📊 输出解读

### 控制台输出示例
```
📊 关键统计:
✅ 完全匹配: 5
⚠️ 模糊匹配: 8  
❌ 缺失规范: 5
📋 额外规范: 32
🚨 影响场景的缺失字段: 4
```

### 字段匹配状态说明

| 状态 | 说明 | 处理建议 |
|------|------|----------|
| ✅ 完全匹配 | 字段名称完全一致 | 无需处理 |
| ⚠️ 模糊匹配 | 字段名称相似但不完全一致 | 统一命名 |
| ❌ 缺失规范 | sparepart.csv中有但name统一.csv中没有 | 添加规范 |
| 📋 额外规范 | name统一.csv中有但sparepart.csv中不需要 | 可忽略 |

## 🔧 问题修复流程

### 第一步：源头修复
根据总结报告中的建议，修改源头文件：

1. **修改 name统一.csv（推荐）**
   ```csv
   # 添加缺失的字段规范
   物品属性,适配机型,适配机型,Applicable Machine,,LA-E4C/LA-E4S
   物品属性,产品图片,产品图片,Product Image,,
   ```

2. **或修改 sparepart.csv**
   - 统一字段命名
   - 确保与标准规范一致

### 第二步：验证修复
```bash
# 重新运行分析脚本
node scripts/manual_field_extractor.cjs

# 检查是否还有❌缺失规范的字段
```

### 第三步：前端代码修复
参考 `docs/备件页面修复实施计划.md` 进行前端代码修复。

## 🎭 场景分析

工具会分析4个关键使用场景：

1. **选型页的商品展示** - 用户看到的商品列表
2. **购物车与PO确认** - 购物车中的商品信息
3. **详细信息弹气泡显示** - 鼠标悬停时的详细信息
4. **PO页** - 订单页面的商品信息

每个场景都会显示：
- 必需字段数
- 有规范字段数  
- 缺失规范数

## ⚙️ 自定义配置

### 修改字段列表
编辑 `scripts/manual_field_extractor.cjs` 中的配置：

```javascript
// 备件字段定义
const SPARE_PART_FIELDS = [
  '适配机型',
  '是否易损', 
  // ... 添加或修改字段
];

// 场景要求定义
const SCENARIO_REQUIREMENTS = {
  '选型页的商品展示': [
    '适配机型',
    // ... 添加或修改字段
  ]
};
```

### 修改匹配规则
调整字段匹配的精确度：

```javascript
// 降低匹配阈值以获得更多匹配
if (score >= 0.4) { // 从0.5降低到0.4
  fuzzyMatches.push({ type: 'keywords', field: standardField, score });
}
```

## 🚨 常见问题

### Q: 脚本报错 "require is not defined"
A: 使用 `.cjs` 扩展名的脚本文件：
```bash
node scripts/manual_field_extractor.cjs
```

### Q: 找不到CSV文件
A: 确保文件路径正确：
```
generated_sql_imports/sparepart.csv
generated_sql_imports/name统一.csv
```

### Q: 分析结果不准确
A: 使用手动修正版脚本，它使用预定义的字段列表：
```bash
node scripts/manual_field_extractor.cjs
```

### Q: 如何添加新的分析场景
A: 修改 `SCENARIO_REQUIREMENTS` 配置：
```javascript
const SCENARIO_REQUIREMENTS = {
  '新场景名称': [
    '字段1',
    '字段2'
  ]
};
```

## 📋 检查清单

### 使用前检查
- [ ] 确保Node.js环境已安装
- [ ] 确保CSV文件存在且格式正确
- [ ] 确保项目目录结构正确

### 分析后检查  
- [ ] 查看控制台输出的关键统计
- [ ] 阅读详细的分析报告
- [ ] 确认P0级别的问题并优先处理
- [ ] 制定修复计划和时间表

### 修复后验证
- [ ] 重新运行分析脚本
- [ ] 确认所有❌状态已解决
- [ ] 验证前端代码是否使用正确的字段
- [ ] 测试相关页面功能

## 🔄 持续使用

建议将此工具集成到开发流程中：

1. **每次字段变更后运行** - 确保一致性
2. **定期运行** - 发现潜在问题
3. **CI/CD集成** - 自动化检查
4. **团队培训** - 确保所有人了解使用方法

---

**提示**: 优先解决影响核心功能的P0级别问题，然后再处理命名一致性等P1/P2问题。 