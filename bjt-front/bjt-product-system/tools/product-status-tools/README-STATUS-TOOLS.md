# 产品上下线状态检查工具包

基于修复经验总结的自动化检查和修复工具，用于确保产品线、主机、配件、备件、耗材的上下架功能正常工作。

## 🚀 快速使用

```bash
# 1. 检查当前状态
./tools/simple-status-check.sh

# 2. 自动修复问题  
./tools/quick-fix-status.sh api-params

# 3. 验证修复结果
./tools/simple-status-check.sh
```

## 📁 工具包结构

```
docs/
├── product-status-checklist.md     # 📋 完整检查清单 
├── product-status-usage-guide.md   # 🎯 使用指南
└── README-STATUS-TOOLS.md          # 📖 本文档

tools/
├── simple-status-check.sh          # ⚡ 快速检查工具
├── product-status-checker.sh       # 🔍 完整检查工具  
└── quick-fix-status.sh             # 🔧 自动修复工具
```

## 🔍 工具功能

### 1. 快速检查工具 (推荐)
```bash
./tools/simple-status-check.sh
```
- ✅ 检查API调用status参数
- ✅ 简单易用，快速反馈
- ✅ 适合日常开发检查

### 2. 完整检查工具  
```bash
./tools/product-status-checker.sh [all|frontend|api]
```
- 🔍 全面检查前端代码
- 🌐 验证API响应状态
- 📊 详细统计报告

### 3. 自动修复工具
```bash
./tools/quick-fix-status.sh [all|api-params|typescript|mock-data]
```
- 🔧 自动添加API参数
- 📝 修复类型定义  
- 🗃️ 更新Mock数据
- 💾 自动备份文件

## 📋 核心检查项

### 🎯 关键问题（必须修复）
- [ ] `machineparts` API包含 `status=publish` 参数
- [ ] `host-models` API包含 `status=publish` 参数
- [ ] TypeScript类型定义包含 `status?: string` 字段

### ⚠️ 优化建议
- [ ] `accessories` API添加status参数
- [ ] `consumables` API添加status参数  
- [ ] 移除硬编码状态过滤逻辑

## 🔧 修复经验

### 问题模式
1. **API调用缺少status参数** → 前端显示草稿数据
2. **后端状态设置不当** → 测试数据污染生产环境
3. **前端过滤逻辑不统一** → 不同页面行为不一致

### 解决策略
1. **最小改动原则** - 优先API参数，避免大范围修改
2. **统一标准** - 所有产品类型使用相同逻辑  
3. **自动化工具** - 减少人工错误

### 标准修复
```typescript
// ❌ 修复前
const apiUrl = `${baseUrl}/machineparts?lang=${lang}`;

// ✅ 修复后  
const apiUrl = `${baseUrl}/machineparts?status=publish&lang=${lang}`;
```

## 📝 使用流程

### 开发阶段
```bash
# 开发前检查
./tools/simple-status-check.sh

# 发现问题时修复
./tools/quick-fix-status.sh api-params

# 修复后验证  
./tools/simple-status-check.sh
```

### 部署前检查
```bash
# 完整检查
./tools/product-status-checker.sh all

# 确认状态
./tools/simple-status-check.sh

# 功能验证
cd frontend && npm run dev
```

### 问题排查
```bash
# 1. 运行检查工具
./tools/simple-status-check.sh

# 2. 查看详细问题  
grep -r "machineparts" frontend/src --include="*.ts*" | grep -v "status=publish"

# 3. 自动修复
./tools/quick-fix-status.sh api-params

# 4. 验证结果
./tools/simple-status-check.sh
```

## 🎯 成功标准

### ✅ 检查通过标志
1. `./tools/simple-status-check.sh` 显示所有检查通过
2. 前端页面不显示测试/草稿数据
3. 产品线切换功能正常
4. 现有功能无异常

### 📊 性能要求
- API响应时间无明显增加
- 页面加载速度正常
- 内存使用无异常增长

## 🆘 常见问题

### Q: 工具提示"文件不存在"？
A: 确保在项目根目录运行工具，检查文件路径是否正确。

### Q: 修复后仍显示草稿数据？  
A: 清除浏览器缓存，重启API服务，检查数据库状态字段。

### Q: 自动修复失败？
A: 检查文件权限，手动备份重要文件，参考详细文档进行手动修复。

## 📚 文档说明

- **📋 [product-status-checklist.md](docs/product-status-checklist.md)** - 详细检查清单和技术细节
- **🎯 [product-status-usage-guide.md](docs/product-status-usage-guide.md)** - 使用指南和最佳实践
- **📖 README-STATUS-TOOLS.md** - 本文档，工具包概览

## 🔄 持续改进

### 工具优化方向
1. 添加更多API端点检查
2. 支持批量文件修复
3. 集成到CI/CD流程
4. 添加性能监控

### 反馈和贡献
- 发现问题请记录具体错误信息
- 提供复现步骤和文件路径
- 建议改进方案和新功能

---

**让产品上下线管理更简单、更可靠！** 🚀

> 💡 **提示**: 建议在每次部署前运行 `./tools/simple-status-check.sh` 确保状态检查通过。 