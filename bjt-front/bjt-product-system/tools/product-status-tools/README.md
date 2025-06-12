# 产品上下线状态检查工具包

> 基于实际修复经验总结的自动化检查和修复工具，确保产品线、主机、配件、备件、耗材的上下架功能正常工作。

## 🚀 快速开始

```bash
# 1. 进入工具目录
cd tools/product-status-tools

# 2. 检查当前状态
./simple-status-check.sh

# 3. 自动修复问题
./quick-fix-status.sh api-params

# 4. 验证修复结果
./simple-status-check.sh
``` 

## 📁 工具包结构

```
tools/product-status-tools/
├── README.md                      # 📖 本文档 - 工具包入口
├── simple-status-check.sh         # ⚡ 快速检查工具 (推荐)
├── product-status-checker.sh      # 🔍 完整检查工具 
├── quick-fix-status.sh            # 🔧 自动修复工具
├── product-status-checklist.md    # 📋 详细检查清单
├── product-status-usage-guide.md  # 🎯 使用指南和最佳实践
└── README-STATUS-TOOLS.md         # 📚 详细工具包说明
```

## 🔧 工具说明

### ⚡ 快速检查工具 (推荐日常使用)
```bash
./simple-status-check.sh
```
- ✅ 检查API调用status参数
- ✅ 简单易用，快速反馈
- ✅ 适合开发前后的常规检查

### 🔍 完整检查工具
```bash
./product-status-checker.sh [all|frontend|api]
```
- 🔍 全面检查前端代码和API响应
- 📊 详细统计报告和问题分析
- 🌐 验证API服务状态（需要后端服务运行）

### 🛠️ 自动修复工具
```bash
./quick-fix-status.sh [all|api-params|typescript|mock-data]
```
- 🔧 自动添加缺失的API status参数
- 📝 修复TypeScript类型定义
- 🗃️ 更新Mock数据状态设置
- 💾 自动备份原文件（支持回滚）

## 📋 核心检查项

### 🎯 关键问题（必须修复）
- [ ] `machineparts` API包含 `status=publish` 参数
- [ ] `host-models` API包含 `status=publish` 参数
- [ ] TypeScript类型定义包含 `status?: string` 字段

### ⚠️ 优化建议（建议修复）
- [ ] `accessories` API添加 `status=publish` 参数
- [ ] `consumables` API添加 `status=publish` 参数
- [ ] 移除前端硬编码状态过滤逻辑

## 🎯 使用场景

### 📅 日常开发
```bash
# 开发新功能前检查
cd tools/product-status-tools
./simple-status-check.sh

# 发现问题时快速修复
./quick-fix-status.sh api-params

# 提交代码前验证
./simple-status-check.sh
```

### 🚀 部署前检查
```bash
cd tools/product-status-tools

# 完整检查（包括API验证）
./product-status-checker.sh all

# 确认状态
./simple-status-check.sh

# 功能验证
cd ../../frontend && npm run dev
```

### 🔍 问题排查
```bash
cd tools/product-status-tools

# 1. 快速诊断
./simple-status-check.sh

# 2. 查看详细报告
./product-status-checker.sh frontend

# 3. 自动修复
./quick-fix-status.sh all

# 4. 验证修复效果
./simple-status-check.sh
```

## 🏆 成功标准

### ✅ 检查通过的标志
1. `./simple-status-check.sh` 显示 **"🎉 所有检查都通过了！"**
2. 前端页面不显示任何测试/草稿数据
3. 产品线切换功能正常工作
4. 现有功能无任何异常

### 📊 性能要求
- API响应时间无明显增加
- 页面加载速度正常
- 内存使用无异常增长

## 🔧 修复经验要点

### 问题根因
1. **API调用缺少status参数** → 前端显示草稿数据
2. **后端状态设置不当** → 测试数据污染生产环境
3. **前端过滤逻辑不统一** → 不同页面行为不一致

### 修复策略
1. **最小改动原则** - 优先通过API参数过滤，避免大范围代码修改
2. **统一标准** - 所有产品类型使用相同的状态过滤逻辑
3. **自动化工具** - 使用脚本检查和修复，减少人工错误

### 标准修复模式
```typescript
// ❌ 修复前
const apiUrl = `${baseUrl}/machineparts?lang=${lang}`;

// ✅ 修复后
const apiUrl = `${baseUrl}/machineparts?status=publish&lang=${lang}`;
```

## 🆘 常见问题

### Q: 工具提示"文件不存在"？
**A**: 确保在项目根目录运行，或使用完整路径：
```bash
cd /path/to/bjt-product-system
./tools/product-status-tools/simple-status-check.sh
```

### Q: 修复后仍显示草稿数据？
**A**: 检查以下几点：
1. 清除浏览器缓存和localStorage
2. 重启API后端服务
3. 检查数据库中的status字段值
4. 验证Mock数据模式

### Q: 端口被占用无法启动前端？
**A**: 使用不同端口启动或杀死占用进程：
```bash
# 使用不同端口
npm run dev -- --port 5174

# 或杀死占用端口的进程
lsof -ti:5173 | xargs kill -9
```

## 📚 详细文档

- **📋 [product-status-checklist.md](product-status-checklist.md)** - 详细的技术检查清单
- **🎯 [product-status-usage-guide.md](product-status-usage-guide.md)** - 使用指南和最佳实践
- **📖 [README-STATUS-TOOLS.md](README-STATUS-TOOLS.md)** - 完整工具包说明

## 🔄 持续改进

### 工具优化方向
1. 添加更多API端点检查支持
2. 支持批量文件修复功能
3. 集成到CI/CD流程中
4. 添加性能监控指标

### 反馈和贡献
如有问题或建议：
1. 记录具体错误信息和文件路径
2. 提供复现步骤
3. 建议改进方案

---

**🎉 让产品上下线管理更简单、更可靠！**

> 💡 **最佳实践**: 建议在每次代码提交前运行 `./simple-status-check.sh` 确保状态检查通过。 