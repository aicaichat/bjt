# BJT 产品管理系统 · Phase-2 文档索引

> 本文件为二期（Phase-2）全部文档的统一入口，提供目录导航、命名规范与贡献指南。请在阅读或新增文档前先查阅本说明。

---

## 1️⃣ 目录结构概览

```text
phase-2/
├─ requirements/        # 需求规范（业务、非功能、验收）
│  ├─ functional.md
│  └─ ...
├─ architecture/        # 架构设计与技术方案
│  ├─ wc-bridge.md
│  ├─ diagrams/
│  │  ├─ registration-audit.mmd
│  │  └─ ...
│  └─ ...
├─ backend/             # 后端实现细节（接口、数据库、服务）
├─ frontend/            # 前端实现细节（页面、组件、状态管理）
├─ database/            # ER 图、迁移脚本与字段映射
├─ testing/             # 测试计划、测试用例、覆盖率报告
├─ deployment/          # Dev/Test/Prod 部署说明、CI/CD 流程
├─ release/             # 版本发布记录与变更日志
└─ prompts/             # AI Prompt 文件（统一模板）
```

> 📌 **约定**：每个子文件夹中可再细分 README.md，以说明该目录内的文件目的及使用方式。

---

## 2️⃣ 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 文档文件 | 使用 **kebab-case** 英文名 + `.md` | `inventory-price-sync.md` |
| Prompt 文件 | 主题 + `-prompt.md` | `rma-prompt.md` |
| 图片/图表 | 与文档同名、序号后缀 | `checkout-payment-01.png` |
| Mermaid 图 | `.mmd` 后缀存放于 `architecture/diagrams/` | `registration-audit.mmd` |

---

## 3️⃣ 贡献指南

1. **编辑前同步**：确保 `main`/`phase-2` 分支为最新，避免冲突。
2. **写作语言**：文档正文使用 **简体中文**；变量名、API、代码示例保持英文。
3. **Markdown 样式**：遵循 [中文技术文档写作规范](https://github.com/sparanoid/chinese-copywriting-guidelines)。
4. **Linter**：提交前请运行 `npm run lint:md`（待 CI 添加 markdown-lint）。
5. **链接引用**：使用 **相对路径**；外部资源需注明访问日期。
6. **Commit Message**：`docs(scope): 描述`，如 `docs(requirements): add FR-13 for live chat`。
7. **审阅流程**：PR 需至少 1 名 Reviewer 通过后合并。

---

## 4️⃣ 快速入口

- 📝 需求文档：[`requirements/functional.md`](requirements/functional.md)
- 🗺️ 架构方案：[`architecture/`](architecture/)
- 🛠️ 后端接口：[`backend/`](backend/)
- 💻 前端规范：[`frontend/`](frontend/)
- 🗄️ 数据库变更：[`database/`](database/)
- 🔍 测试计划：[`testing/`](testing/)
- 🚀 部署指南：[`deployment/`](deployment/)
- 💡 Prompt 模板：[`prompts/prompt-template.md`](prompts/prompt-template.md)

---

## 5️⃣ 修订历史

| 版本 | 日期 | 作者 | 说明 |
|-------|------|------|------|
| 0.1 | 2025-07-07 | 系统自动生成 | 初始版本，建立索引与规范 |

---

> 若有疑问或改进建议，请在 PR 或 Issue 中留言。感谢您的贡献！
