# 案例：用「仅 CSS 信源」做 Home 全页对齐

本文演示 **用户发什么**、**Agent 应回什么**（结构示例，数值为虚构，仅作格式参考）。

---

## 第一轮：用户消息（复制到 Cursor Agent）

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

按本 Skill 做 **完整 Home 对齐**，**以下 CSS 为唯一信源**（数值仅来自 CSS）。**须覆盖首页全部主要区块**（对照 reference-home-full-alignment.md 的 H1–H13 防漏）；CSS 未写到的块列入「待补 CSS」，禁止编造 px。

```css
/* 示例：Figma 导出片段（故意只覆盖部分区域，演示「待补」） */

/* Frame 740 → 对应 .section-content */
.section-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 32px;
  width: 1457px;
  min-height: 303px;
  padding: 0;
}

/* 按钮 → 对应 .product-link */
.product-link {
  min-height: 56px;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 19px;
}
```
```

---

## 第一轮：Agent 回复应包含的结构（示例）

### 1. 全页块覆盖表（H1–H13）

| 块 | 状态 | 说明 |
|----|------|------|
| H1 壳层 `.home-page--figma` | 待补 CSS | 信源未含 padding/gutter/背景 |
| H2 主列 `.home-frame-529` | 待补 CSS | 信源未含 max-width/gap |
| H3 卡片 `.product-section` | 待补 CSS | 信源未含圆角/阴影 |
| H4 标题条 `.section-header` | 待补 CSS | 信源未含 |
| H5 卡体行 `.section-content` | **已对齐** | 映射见下表 |
| H6–H8 文案/链接栈 | 待补 CSS | 信源未含 `.section-text` 等 |
| H9 `.product-link` | **已对齐** | 映射见下表 |
| H10–H11 | 待补 / 随 H9 | 外链图标等未单独出现 |
| H12 `.section-image` | 待补 CSS | 信源未含 |
| H13 分页 | 待补 CSS | 信源未含 |

### 2. CSS → class / token 映射（摘录）

| 信源选择器 / 片段 | 项目 class | Token / 文件动作 |
|-------------------|------------|------------------|
| `.section-content` width/gap/min-height | `.home-page--figma .section-content` | 写入 `--ff-home-frame-740-*`、`--ff-home-section-content-gap` 等 |
| `.product-link` 尺寸字重 | `.home-page--figma .product-link` | 写入 `--ff-home-link-*` |

### 3. Token 审计（摘录）

- `--ff-home-section-content-gap: 32px` ← CSS `gap: 32px`
- `--ff-home-link-min-height: 56px` ← CSS `min-height: 56px`
- …

### 4. 代码改动摘要

- **先将用户 `css` 围栏全文写入** `docs/visual-upgrade/sources/home-figma-dev-export-YYYY-MM-DD.css` 并更新 `home-figma-user-dev-css.md` 索引（Skill 强制入库）。
- 修改 `figma-tokens-home.css`、`home.json`（若同步）、`Home.css` 等（具体以仓库为准）。

### 5. 构建

- `npm run build:skip-check` 通过 / 失败与原因。

### 6. 下一步（给用户）

> 请补充以下块的 Figma Dev CSS：**H1、H2、H3、H4、H6–H8、H12、H13**；或指定「分页与按钮同 token」等共用规则。补全后再发一轮，我会更新覆盖表直至全部 **已对齐**。

---

## 第二轮（可选）：用户补一段 CSS

用户再贴例如 `.section-header { ... }`、`.section-image { ... }`，Agent **更新覆盖表**，把对应行改为 **已对齐**，并重复映射 / 审计 / diff / 构建。

---

## 要点小结

1. **数值**只来自你贴的 CSS；**漏块**用覆盖表显式标 **待补**，不猜。  
2. Home 用 **H1–H13** 保证 **所有主要元素都被点名**。  
3. 可多轮贴 CSS，直到覆盖表无「待补」或你接受剩余待补。
