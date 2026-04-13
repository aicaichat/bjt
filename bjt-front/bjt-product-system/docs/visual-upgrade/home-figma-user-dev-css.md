# Home 页 — Figma Dev Mode CSS 原文（信源存档）

**入库日期：2026-04-12**

完整原文与对话粘贴一致，保存在（便于 diff / 审计，避免单 md 体积过大）：

- [`sources/home-figma-dev-export-2026-04-12.css`](./sources/home-figma-dev-export-2026-04-12.css)

内容含：**侧面导航栏**、**Frame 529 / 1015 / 3**、**Frame 745 / 743 / 744**（三产品线卡片）、**Frame 738 / 740 / 739 / 594 / 595 / 805 / 593** 等。

实现层同步：`frontend/src/styles/figma-tokens-home.css`、`frontend/src/figma-tokens/home.json`、`frontend/src/pages/Home/Home.css`；侧栏见 `frontend/src/styles/sidebar-figma.css`；顶栏见 `frontend/src/styles/figma-front-shell.css` / `figma-design-tokens.css`。

---

## 维护约定

1. **Cursor Agent（Skill `css-figma-strict-implementation`）**：收到用户粘贴的 Home Dev CSS 时，**必须**写入 `sources/home-figma-dev-export-YYYY-MM-DD.css`（或本 md 内 fenced 块），再改 token / 页面 CSS。
2. 人工改稿：先更新 `.css` 原文，再同步 token。
3. 对齐任务可 `@` 本文件或 `@` `sources/home-figma-dev-export-2026-04-12.css`，**数值以该文件为准**。
