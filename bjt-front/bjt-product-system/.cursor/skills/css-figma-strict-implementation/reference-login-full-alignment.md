# 前台商城登录页 — 全元素块枚举（Figma ↔ 代码）

**路由**：`/login`  
**实现**：`frontend/src/pages/Login/index.tsx` + `Login.css`  
**域 token**：`frontend/src/styles/figma-tokens-login.css`（在 `main.tsx` 中于 `figma-design-tokens.css` 之后加载）

本表 **不提供数值**，数值 **只** 来自你粘贴的 Figma Dev CSS。用于 **全页对齐** 时的 **覆盖表**（防漏块）。

## 1. 块清单 L1–L8

| # | 区域说明 | DOM / class |
|---|----------|-------------|
| L1 | 整页背景与布局（居中 / 绝对定位以稿为准） | `.login-page` |
| L2 | 登录卡片容器（宽、内边距、圆角、阴影） | `.login-container` |
| L3 | Logo | `.logo`（`img`） |
| L4 | 主标题、副标题 | `.login-title`、`.login-subtitle`（Ant `Title` / `Paragraph`） |
| L5 | 登录失败错误条 | `.login-error` |
| L6 | 表单与输入框（用户名、密码） | `.login-form`、`Form.Item`、`Input` / `Input.Password` |
| L7 | 主按钮（登录） | `.login-button`（Ant `Button` primary） |
| L8 | 底部注册引导与链接 | `.login-register-footer`、`Link` → `/register` |

## 2. Ant Design 与稿面

- 表单项、按钮的 **默认高度/边框** 若与稿不一致，须在 **`.login-page`** 下用 token + 选择器覆盖（如 `.login-page .ant-input-affix-wrapper`），**禁止**只改外层而忽略 Ant 内部节点（以 Dev 实测为准）。
- **子选择器**：若 CSS 写 `form > .ant-row`，须核对 DOM 是否真有该层级。

## 3. PC / 移动（与 Skill 一致）

- **PC 宽屏**：若 Figma 为 **绝对定位 + 固定卡片**，按 CSS 落实；`figma-tokens-login.css` 的 `@media` 中覆写为流式。
- **窄屏**：已有 `max-width: 480px` 的 token 覆写示例；可按稿增加 `768` / `1024` 断点。

## 4. 全页任务交付物

1. **全页块覆盖表**（L1–L8：已对齐 / 待补 CSS / 共用 token 说明）  
2. **CSS → class / token 映射**（`--ff-login-*` 与全局 `--ff-*`）  
3. **Token 审计**  
4. **已入库路径**：`docs/visual-upgrade/sources/login-figma-dev-export-*.css`（若使用「以下 CSS 为唯一信源」）  
5. **`npm run build:skip-check`**
