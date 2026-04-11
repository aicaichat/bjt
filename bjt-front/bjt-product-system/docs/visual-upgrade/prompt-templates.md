# 视觉升级提示词模板（可直接复用）

## 1) 单模块像素对齐模板

```text
你是前端视觉对齐工程师。请仅改动指定文件，完成 Figma 严格像素对齐。

任务目标：
- 页面：{{page}}
- 路由：{{route}}
- 模块：{{feature}}
- Figma 文件：{{figmaFileUrl}}
- Figma 节点：{{figmaNodeId}}
- 基准视口：{{viewport}}（DPR=1，缩放100%）

允许改动文件：
- {{componentFiles}}
- {{styleFiles}}

必须遵守：
1) 色值/尺寸优先使用 token（var(--ff-*)），禁止新增硬编码色值。
2) 禁止新增无命名空间 !important。
3) 不得改动未在白名单内的文件。
4) 保持现有业务逻辑不变，仅处理视觉与布局。

验收标准：
- 关键区域与 Figma 叠图误差 <= 1px
- 状态一致：default/hover/focus/active/disabled
- 通过 npm run build:skip-check + npm run lint

输出要求：
- 改动文件列表
- 关键样式差异点（前后）
- 剩余风险与下一步
```

## 2) 全局冲突治理模板（fix.css 收敛）

```text
请审计并收敛全局样式冲突，仅处理以下文件：
- frontend/src/styles/page-layout-fix.css
- frontend/src/styles/header-layout-fix.css
- frontend/src/styles/sidebar-functional-fix.css

目标：
1) 清理无边界 !important；
2) 所有覆盖规则加页面壳层命名空间（如 .figma-front）；
3) 不影响 admin 路由；
4) 输出冲突清单与迁移建议。

验收：
- 主要前台页面无布局回退
- 通过 npm run build:skip-check
```

## 3) 测试用例生成模板（视觉 + 交互）

```text
根据以下映射项生成 Playwright 用例：
- page: {{page}}
- route: {{route}}
- feature: {{feature}}
- testCaseIds: {{testCaseIds}}

要求：
1) 视觉快照：1920x1080 全页；
2) 状态快照：hover/focus/active；
3) 关键交互：导航/筛选/分页/提交；
4) 失败时输出定位信息（selector + screenshot name）。
```

## 4) 你需要提供给我（最少材料）

1. 每个页面唯一验收 Frame 的 `node-id`（没有就先给页面级 node）。  
2. 设计冻结版本号（或日期），避免改着改着稿子变化。  
3. 优先级列表（P0/P1/P2），我按优先级分批提交。  
4. 如果有特殊平台差异（例如 Safari 字体渲染容差），请提前标注。
