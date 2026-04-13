# Figma 像素级对齐验收指南

## 实施完成总结

### 已完成的文件

1. **CSS 覆盖层**
   - `frontend/src/styles/figma-exact/machines-exact-override.css`
   - 使用 `!important` 确保优先级最高
   - 覆盖所有机器卡片和配件卡片的样式

2. **更新导入的页面文件**
   - `frontend/src/pages/Machines/ProductLine1Page.tsx` ✓
   - `frontend/src/pages/Machines/ProductLine2Page.tsx` ✓
   - `frontend/src/pages/Machines/ProductLine3Page.tsx` ✓
   - `frontend/src/pages/Machines/index.tsx` ✓

### 关键改进

| 项目 | 旧实现 | 新实现 (Figma 精确值) |
|------|--------|---------------------|
| 机器卡片宽度 | 百分比/响应式 | 1537px (固定) |
| 机器卡片高度 | 自适应 | 280px (固定) |
| 图片区宽度 | 20% 或 288px | 288px (固定) |
| 主内容区宽度 | flex: 1 | 864px (固定) |
| 操作区宽度 | 20% 或自适应 | 321px (固定) |
| 卡片间距 | 混用 gap-4/gap-6 | 24px (精确) |
| 字体 | Arial/system | Roboto |
| 背景色 | 变量映射 | #FFFFFF (直接) |

---

## 验收步骤

### 步骤 1: 设置环境

1. 启动开发服务器
   ```bash
   cd frontend
   npm run dev
   ```

2. 打开浏览器 DevTools (F12)

3. 设置视口尺寸为 1920px
   - Chrome: DevTools → Toggle Device Toolbar → 选择 "Responsive" → 设置宽度 1920

### 步骤 2: 验证机器卡片

#### 检查尺寸
1. 选中机器卡片元素
2. 在 Computed 面板中验证:
   - [ ] width: 1537px
   - [ ] height: 280px
   - [ ] background: #FFFFFF
   - [ ] box-shadow: 0px 0.5px 0px rgba(0, 0, 0, 0.25)

#### 检查三列布局
1. **图片区 (Frame 205)**:
   - [ ] width: 288px
   - [ ] height: 212px
   - [ ] 包含缩略图列表 (68px × 3)
   - [ ] 主图 212×212px

2. **主内容区 (Frame 487)**:
   - [ ] width: 864px
   - [ ] padding: 16px 24px
   - [ ] gap: 24px

3. **操作区 (Frame 1017)**:
   - [ ] width: 321px
   - [ ] position: absolute right: 0

### 步骤 3: 验证配件卡片

1. 展开配件选择区域
2. 选中配件卡片
3. 验证:
   - [ ] width: 1537px
   - [ ] 三列布局与机器卡片一致
   - [ ] 边框: 1px solid #DEDEDE
   - [ ] 阴影: 0px 0.5px 0px rgba(0, 0, 0, 0.25)

### 步骤 4: 验证字体

1. 选中任意文本元素
2. 在 Computed 面板中验证:
   - [ ] font-family: 'Roboto', sans-serif
   - [ ] font-size: 16px (正文)
   - [ ] font-weight: 400 (正常) / 700 (粗体)
   - [ ] line-height: 19px
   - [ ] color: rgba(0, 0, 0, 0.85) (主文字)

### 步骤 5: 视觉对比

1. 打开 Figma 设计稿
2. 使用 PerfectPixel 插件或截图对比:
   - [ ] 叠图后主要元素对齐
   - [ ] 间距一致
   - [ ] 颜色一致

---

## 常见问题排查

### 问题 1: 样式未生效
**症状**: 元素尺寸仍显示旧值

**排查**:
```bash
# 检查 CSS 是否正确加载
1. DevTools → Network → CSS
2. 确认 machines-exact-override.css 已加载
3. 检查是否有 404 错误
```

**解决**:
- 刷新页面 (Ctrl+F5 强制刷新)
- 检查导入路径是否正确
- 确认 CSS 文件在文件系统中存在

### 问题 2: 某些元素尺寸不对
**症状**: 部分元素未按 Figma 规格显示

**排查**:
```bash
# 在 DevTools Console 中运行
// 检查元素计算的样式
const el = document.querySelector('.ms-figma-machine-card');
console.log(getComputedStyle(el).width);
```

**可能原因**:
- 元素使用了内联样式覆盖了 CSS
- Tailwind 工具类优先级更高
- 其他 CSS 文件后加载覆盖了样式

**解决**:
- 在 machines-exact-override.css 中添加更具体的选择器
- 使用 `!important` (已使用)

### 问题 3: 响应式丢失
**症状**: 小屏幕下布局混乱

**说明**:
这是预期行为。当前实现专注于桌面端 (1920px) 的像素级对齐。
响应式适配应作为第二阶段单独处理。

---

## 快速验证命令

### 检查 CSS 加载
```bash
grep -r "machines-exact-override" frontend/src/pages/Machines/
```

### 检查关键类名存在
```bash
grep -E "^\.ms-figma-machine-card" frontend/src/styles/figma-exact/machines-exact-override.css
```

### 验证文件存在
```bash
ls -la frontend/src/styles/figma-exact/
```

---

## 回滚计划

如需回滚，只需移除导入:

```tsx
// 移除这行
import '../../styles/figma-exact/machines-exact-override.css';
```

原有样式将恢复生效。

---

## 后续优化建议

1. **响应式适配**
   - 在 1920px 精确对齐完成后，添加响应式断点
   - 保持桌面端 1537px 卡片宽度
   - 小屏幕下考虑横向滚动或堆叠布局

2. **性能优化**
   - 考虑将关键 CSS 内联
   - 使用 CSS containment 优化渲染性能

3. **维护性改进**
   - 将 Figma 精确值提取为 CSS 变量
   - 建立自动化工具同步 Figma → CSS

---

## 联系与支持

如需调整或有疑问，请查看:
- 最佳实践: `figma-pixel-perfect-best-practices.md`
- 实施计划: `figma-pixel-perfect-implementation-plan.md`
- Figma 规格: `figma-machine-page-raw.css`
