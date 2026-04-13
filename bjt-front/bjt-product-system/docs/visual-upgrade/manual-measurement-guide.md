# 手动测量与 Figma 对齐指南

> 使用 Chrome DevTools 进行像素级比对

## 方法：Figma 截图 + DevTools 测量

### 步骤 1: 获取 Figma 截图

1. 打开 Figma 文件链接
2. 按 `Ctrl+\` (Windows) 或 `Cmd+\` (Mac) 进入 Dev Mode
3. 选中要测量的元素
4. 右侧 Inspect 面板会显示尺寸
5. 截图保存

### 步骤 2: 在浏览器中测量实现版本

1. 打开本地开发服务器 (`npm run dev`)
2. 右键元素 → "检查"
3. 使用 DevTools 测量工具：

#### 测量按钮尺寸
```javascript
// 在 DevTools Console 中运行
const btn = document.querySelector('.product-link');
const styles = window.getComputedStyle(btn);
console.table({
  '高度': styles.height,
  '宽度': styles.width,
  'Padding Top': styles.paddingTop,
  'Padding Right': styles.paddingRight,
  'Padding Bottom': styles.paddingBottom,
  'Padding Left': styles.paddingLeft,
  '字体大小': styles.fontSize,
  '字重': styles.fontWeight,
  '圆角': styles.borderRadius,
  '边框': styles.border
});
```

#### 测量卡片阴影
```javascript
const card = document.querySelector('.ms-figma-card');
const styles = window.getComputedStyle(card);
console.log('Box Shadow:', styles.boxShadow);
```

#### 测量间距系统
```javascript
// 获取所有 gap 值
const elements = document.querySelectorAll('*');
const gaps = new Set();
elements.forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.gap && style.gap !== '0px') gaps.add(style.gap);
  if (style.margin && style.margin !== '0px') gaps.add(`margin: ${style.margin}`);
  if (style.padding && style.padding !== '0px') gaps.add(`padding: ${style.padding}`);
});
console.log('所有间距值:', [...gaps].sort());
```

### 步骤 3: 创建对比表格

| 属性 | Figma 值 | 当前实现 | 差异 | 需调整 |
|------|----------|----------|------|--------|
| 按钮高度 | 56px | 56px | 0 | - |
| 按钮 Padding | 16px 24px | 16px 24px | 0 | - |
| 卡片阴影 | ? | 待测量 | ? | ? |

---

## 关键测量点

### 1. Sidebar 侧边栏

需要测量的元素：
- [ ] 菜单项高度
- [ ] 图标尺寸 (当前使用 20px)
- [ ] 图标与文字间距
- [ ] 子菜单缩进
- [ ] 激活状态左边框宽度
- [ ] 激活状态背景色透明度

测量代码：
```javascript
const menuItem = document.querySelector('.admin-sidebar .admin-sidebar-menu > div');
const icon = document.querySelector('.admin-sidebar svg');
console.table({
  '菜单项高度': window.getComputedStyle(menuItem).height,
  '图标尺寸': icon?.getBoundingClientRect(),
  'Padding': window.getComputedStyle(menuItem).padding
});
```

### 2. Home 首页

需要测量的元素：
- [ ] 产品卡片内边距
- [ ] 卡片圆角
- [ ] 按钮高度、padding
- [ ] 按钮字体大小
- [ ] 卡片间距 (gap)
- [ ] 图片区高度

### 3. Machines 选型页

需要测量的元素：
- [ ] 主机卡片三列比例
- [ ] 卡片高度
- [ ] 配件卡片缩进
- [ ] 选择按钮尺寸
- [ ] 图片区宽度

---

## 颜色提取

### 从 Figma 获取颜色值

1. Figma Dev Mode 中选中元素
2. 右侧 Fill 面板显示颜色
3. 复制 hex 值

### 验证当前颜色

```javascript
// 获取所有使用的主色
const allElements = document.querySelectorAll('*');
const colors = new Set();
allElements.forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    colors.add(`bg: ${style.backgroundColor}`);
  }
  if (style.color) colors.add(`text: ${style.color}`);
  if (style.borderColor) colors.add(`border: ${style.borderColor}`);
});
console.log([...colors].sort().slice(0, 20)); // 前20个颜色
```

---

## 快速调整工作流

### 1. 实时调整测试

在 DevTools Elements 面板中：
1. 选中元素
2. 直接修改样式值
3. 观察变化效果
4. 确认后更新代码

### 2. 对比截图

```javascript
// 添加半透明白色遮罩便于对比
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: url('figma-screenshot.png') center/contain no-repeat;
  opacity: 0.5; pointer-events: none; z-index: 9999;
`;
document.body.appendChild(overlay);
```

---

## 需要确认的关键数值

### 颜色系统
```
--ff-primary: #00338D?        // 主色
--ff-bg: #F5F7FA?             // 背景色
--ff-card: #FFFFFF?           // 卡片白
--ff-border: #E5E7EB?         // 边框色
--ff-text-primary: rgba(0,0,0,0.85)?   // 主文字
--ff-text-secondary: rgba(0,0,0,0.65)? // 次要文字
```

### 间距系统
```
--ff-space-xs: 4px?
--ff-space-sm: 8px?
--ff-space-md: 16px?
--ff-space-lg: 24px?
--ff-space-xl: 32px?
```

### 字体系统
```
--ff-font-family: 'Roboto', 'PingFang SC', sans-serif?
--ff-title-weight: 600?
--ff-body-weight: 400?
--ff-line-height: 1.5?
```

---

## 输出格式

测量完成后，请提供以下格式的数据：

```yaml
# 示例输出格式
sidebar:
  menu_item_height: 48px
  icon_size: 20px
  icon_text_gap: 12px
  submenu_indent: 48px
  active_border_width: 3px
  active_bg_opacity: 0.12

home:
  button:
    height: 56px
    padding: 16px 24px
    font_size: 16px
    font_weight: 500
    border_radius: 8px
  card:
    padding: 24px
    gap: 24px
    border_radius: 12px
    shadow: "0 4px 12px rgba(0,0,0,0.08)"

machines:
  card:
    min_height: 280px
    columns: [20%, 60%, 20%]
    column_gap: 24px
  accessory:
    indent_per_level: 24px
```
