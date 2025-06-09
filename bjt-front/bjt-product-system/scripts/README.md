# 树形结构验证脚本

## 概述

这个脚本用于验证数据库中的关联关系树形结构与前端API展示是否完全一致。它会：

1. 从数据库中读取所有主机的关联关系数据
2. 使用与前端相同的逻辑构建树形结构
3. 调用前端API获取相同的树形结构
4. 递归比较两个树形结构的一致性
5. 生成详细的验证报告

## 安装依赖

```bash
npm install
# 或者
npm install mysql2 axios
```

## 配置

1. 复制配置文件示例：
```bash
cp scripts/verify-config.example.js scripts/verify-config.js
```

2. 修改 `scripts/verify-config.js` 中的数据库连接信息和API配置

## 使用方法

### 验证所有主机

```bash
# 验证所有主机的树形结构
node scripts/verify-tree-structure.js

# 或者使用npm脚本
npm run verify
```

### 验证特定主机

```bash
# 验证特定主机料号
node scripts/verify-tree-structure.js 60A01149

# 验证另一个主机
node scripts/verify-tree-structure.js 14A01246
```

### 调试模式

```bash
# 启用详细日志输出
DEBUG=1 node scripts/verify-tree-structure.js

# 或者直接修改脚本中的 currentLogLevel
```

## 输出报告

脚本会生成详细的验证报告，包括：

### 总体统计
- 总主机数量
- 验证成功数量
- 验证失败数量
- 有问题的主机数量
- 完全一致的主机数量

### 按产品线统计
- 每个产品线的验证情况
- 成功率和问题分布

### 详细问题报告
- 按问题类型分组
- 问题路径和具体描述
- 相关的数据值对比

## 问题类型

### COUNT_MISMATCH
节点数量不匹配：数据库和API返回的子节点数量不一致

```
节点数量不匹配: 数据库 3 vs API 6
```

### MISSING_IN_API
数据库中存在但API中缺失的节点

```
数据库中的节点在API中缺失: /14A01246/子配件1
```

### EXTRA_IN_API
API中存在但数据库中不存在的节点

```
API中的节点在数据库中不存在: /14A01246/神秘配件
```

### PROPERTY_MISMATCH
节点属性不匹配（层级、数量、类型等）

```
属性 level 不匹配: 数据库 2 vs API 1
```

## 示例输出

```
================================================================================
📊 树形结构验证报告
================================================================================

📈 总体统计:
   总主机数量: 5
   验证成功: 5
   验证失败: 0
   有问题的主机: 2
   完全一致的主机: 3

📋 按产品线统计:
   air-cushion: 4/4 成功, 2 个有问题
   paper: 1/1 成功, 0 个有问题

❌ 问题详情:

   主机: 60A01149 (产品线: 1)
   问题数量: 3
     COUNT_MISMATCH: 1 个
       - /14A01246: 节点数量不匹配: 数据库 3 vs API 6
     PROPERTY_MISMATCH: 2 个
       - /14A01246/14A01067: 属性 level 不匹配
       - /14A01246/14A01175: 属性 quantity 不匹配

   主机: 421343214123412343212142141 (产品线: 1)
   问题数量: 1
     MISSING_IN_API: 1 个
       - /434131: 数据库中的节点在API中缺失

================================================================================
```

## 故障排除

### 数据库连接失败
1. 检查数据库配置信息
2. 确认数据库服务正在运行
3. 验证用户权限

### API调用失败
1. 检查API服务是否正在运行
2. 验证API URL配置
3. 检查网络连接

### 树形结构逻辑问题
1. 检查关系表数据完整性
2. 验证host_part_number一致性
3. 检查循环引用问题

## 自动化集成

### CI/CD集成

```yaml
# GitHub Actions 示例
name: Tree Structure Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run verify
```

### 定时验证

```bash
# 添加到crontab，每日验证
0 2 * * * cd /path/to/project && npm run verify >> /var/log/tree-validation.log 2>&1
```

## 扩展功能

### 数据修复建议

脚本可以扩展以提供自动修复建议：

```javascript
// 未来功能：自动修复建议
if (issue.type === 'COUNT_MISMATCH') {
  suggestions.push({
    action: 'check_missing_relations',
    sql: `SELECT * FROM wp_bjt_relations WHERE part_number = '${node.part_number}'`
  });
}
```

### 性能监控

监控验证脚本的执行时间和资源使用：

```javascript
// 性能监控
const startTime = process.hrtime();
// ... 验证逻辑
const [seconds, nanoseconds] = process.hrtime(startTime);
console.log(`验证耗时: ${seconds}.${Math.floor(nanoseconds/1000000)}秒`);
```

## 联系和支持

如果遇到问题或需要支持，请：

1. 检查本文档的故障排除部分
2. 查看脚本的详细日志输出
3. 联系开发团队获取技术支持

---

## 版本历史

- v1.0.0: 初始版本，支持基本的树形结构验证
- 计划中的功能：
  - 数据修复建议
  - 性能优化
  - 更多验证规则
  - Web界面 