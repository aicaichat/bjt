# 多语言工具集 - 快速入门

## 🎯 工具集概述

这是一套完整的前端多语言国际化工具，用于自动化发现、修复和管理项目中的多语言问题。

### ✨ 主要功能
- 🔍 **智能扫描**: 自动发现硬编码文本、单位重复等问题
- 🛠️ **批量修复**: 生成翻译文件模板，半自动化修复流程
- 📚 **完整文档**: 从入门到精通的完整指南和最佳实践
- 🎯 **问题分析**: 详细的项目扫描报告和优先级建议

---

## 🚀 快速开始（3分钟上手）

### 1. 设置工具环境
```bash
# 初始化工具权限
./tools/i18n-scanner/i18n-tools.sh setup
```

### 2. 扫描项目问题
```bash
# 全量扫描所有页面
./tools/i18n-scanner/i18n-tools.sh scan-all frontend/src/pages

# 查看详细报告
cat i18n-issues-report.txt
```

### 3. 查看项目状态
```bash
# 查看完整项目状态
cat PROJECT-I18N-STATUS.md
```

---

## 📂 目录结构

```
🛠️ tools/
├── i18n-scanner/           # 扫描工具 🔍
│   ├── i18n-tools.sh      # 🎯 主入口
│   ├── scan-all.sh        # 全量扫描
│   ├── scan-file.sh       # 单文件扫描
│   └── quick-scan.sh      # 快速查找
├── i18n-fixer/            # 修复工具 🔧
│   ├── fix-hardcoded.sh   # 硬编码修复
│   └── generate-i18n-files.sh # 翻译文件生成

📚 docs/
├── i18n-guides/           # 使用指南
│   ├── README.md          # 📖 完整指南
│   ├── best-practices.md  # 最佳实践
│   ├── scanner-guide.md   # 扫描工具详解
│   └── usage-examples.md  # 使用示例
└── i18n-templates/        # 模板文件
    ├── common-patterns.md     # 常见问题模式
    ├── integration-guide.md   # 集成指南
    └── page-fix-template.md   # 页面修复模板

📄 PROJECT-I18N-STATUS.md  # 项目状态总览
📄 verify-tools.sh         # 工具验证脚本
```

---

## 🎯 常用命令

### 🔍 扫描相关
```bash
# 扫描单个页面
./tools/i18n-scanner/i18n-tools.sh scan-file frontend/src/pages/Profile/index.tsx

# 查找问题最多的文件
./tools/i18n-scanner/i18n-tools.sh quick top-issues

# 查找特定模式
./tools/i18n-scanner/i18n-tools.sh quick pattern "更新.*成功" frontend/src/pages
```

### 🛠️ 修复相关
```bash
# 生成翻译文件模板
./tools/i18n-fixer/generate-i18n-files.sh profile page

# 半自动修复硬编码
./tools/i18n-fixer/fix-hardcoded.sh frontend/src/pages/Profile/index.tsx profile
```

### 📊 项目状态
```bash
# 查看工具版本
./tools/i18n-scanner/i18n-tools.sh version

# 验证工具正常
./verify-tools.sh
```

---

## 📊 当前项目状态

| 指标 | 状态 |
|------|------|
| **发现问题总数** | 87处 |
| **硬编码中文** | 33处 |
| **中英文混合** | 50处 |
| **工具完成度** | ✅ 100% |
| **文档完成度** | ✅ 100% |

### 🔥 优先修复页面
1. **ProductDetail** (3处硬编码) - 🔴 高优先级
2. **Profile** (6处硬编码) - 🔴 高优先级  
3. **Cart** (1处硬编码) - 🔴 高优先级
4. **Machines** (2处硬编码) - 🟡 中优先级

---

## 📖 核心文档

| 文档 | 描述 | 链接 |
|------|------|------|
| **完整指南** | 工具使用从入门到精通 | [docs/i18n-guides/README.md](docs/i18n-guides/README.md) |
| **项目状态** | 当前项目多语言化状态 | [PROJECT-I18N-STATUS.md](PROJECT-I18N-STATUS.md) |
| **最佳实践** | 多语言开发规范指南 | [docs/i18n-guides/best-practices.md](docs/i18n-guides/best-practices.md) |
| **常见模式** | 问题解决方案模板 | [docs/i18n-templates/common-patterns.md](docs/i18n-templates/common-patterns.md) |

---

## 🎯 修复流程建议

### Phase 1: 紧急修复（1-2天）
```bash
# 1. 扫描高优先级页面
./tools/i18n-scanner/i18n-tools.sh scan-file frontend/src/pages/Profile/index.tsx
./tools/i18n-scanner/i18n-tools.sh scan-file frontend/src/pages/ProductDetail/index.tsx
./tools/i18n-scanner/i18n-tools.sh scan-file frontend/src/pages/Cart/CartPage.tsx

# 2. 生成翻译文件
./tools/i18n-fixer/generate-i18n-files.sh profile
./tools/i18n-fixer/generate-i18n-files.sh product-detail
./tools/i18n-fixer/generate-i18n-files.sh cart

# 3. 手动修复硬编码文本（参考模板文档）
# 4. 验证修复效果
```

### Phase 2: 系统性修复（3-5天）
```bash
# 修复功能页面（Machines, Consumables等）
# 参考: docs/i18n-templates/integration-guide.md
```

---

## 📝 字段名与单位规范性检查

- 工具支持自动比对所有页面字段名与 `generated_sql_imports/name统一.csv`，确保中英文名完全一致。
- 单位显示规则：**单位应在字段标题上显示，值本身不应带单位**。
- 检查命令：
```bash
./tools/i18n-scanner/i18n-tools.sh check-fields frontend/src/pages/Machines/index.tsx
```
- 修复命令（即将支持）：
```bash
./tools/i18n-fixer/fix-fields.sh frontend/src/pages/Machines/index.tsx
```
- 检查内容：
  - 字段名是否与CSV一致
  - 单位是否只在字段标题显示，值不带单位
  - 翻译文件中中英文名是否规范

---

## ❓ 获取帮助

### 🔍 问题排查
1. **运行验证脚本**: `./verify-tools.sh`
2. **查看完整文档**: `docs/i18n-guides/README.md`
3. **检查项目状态**: `PROJECT-I18N-STATUS.md`

### 📝 报告问题
- 提供具体的错误信息
- 包含文件路径和复现步骤
- 附上工具扫描结果

---

## 🌟 特色功能

- ✅ **零配置**: 开箱即用，无需复杂设置
- ✅ **智能分析**: 自动识别5种类型的多语言问题
- ✅ **优先级排序**: 自动分析问题严重程度
- ✅ **批量处理**: 支持目录级别的批量扫描
- ✅ **详细报告**: 生成完整的问题统计报告
- ✅ **模板驱动**: 提供可复用的解决方案模板

---

**开始你的多语言国际化之旅！** 🌍

需要帮助？查看 [完整文档](docs/i18n-guides/README.md) 或 [项目状态](PROJECT-I18N-STATUS.md) 