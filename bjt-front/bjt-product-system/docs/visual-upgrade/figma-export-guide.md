# Figma SVG 导出指南

## 已成功导出

| 页面 | Node ID | 文件名 | 状态 |
|------|---------|--------|------|
| Machines 页面 | 1699:2614 | machine-page.svg | ✅ 已导出 |

**导出位置**: `frontend/src/assets/icons/machine-page.svg`

---

## 从 SVG 提取的设计规格

### 颜色系统
```css
--figma-primary: #012583       /* 主色 - 深蓝色 */
--figma-text-primary: #333333  /* 主要文字 */
--figma-text-secondary: #1D1B20 /* 次要文字 */
--figma-bg-page: #F1F5F9      /* 页面背景 */
--figma-bg-card: #FFFFFF      /* 卡片背景 */
--figma-border: #DEDEDE       /* 边框色 */
```

### 尺寸系统
```css
/* Sidebar */
--figma-sidebar-width: 303px
--figma-sidebar-menu-item-width: 279px
--figma-sidebar-menu-item-height: 45px

/* 卡片 */
--figma-card-width: 550px
--figma-card-height: 305px-329px
--figma-card-border-radius: 8px

/* 图标 */
--figma-icon-size: 35px
```

---

## 导出其他页面

### 方法 1: 使用脚本

```bash
cd frontend

# 设置 Token
export FIGMA_TOKEN="<your-figma-personal-access-token>"

# 导出指定节点
node scripts/figma-sync.js export-icons "node-id" "file-name"

# 示例 - 导出 Sidebar
node scripts/figma-sync.js export-icons "2443:17459" "sidebar"

# 示例 - 导出 Home 页面
node scripts/figma-sync.js export-icons "2679:24930" "home-page"
```

### 方法 2: 手动导出（推荐用于图标）

1. 打开 Figma 文件
2. 选中要导出的图标/组件
3. 右侧面板点击 "Export"
4. 格式选择 "SVG"
5. 点击 "Export" 下载

---

## 关键节点 ID 列表

| 组件 | Node ID | 用途 |
|------|---------|------|
| Sidebar | 2443:17459 | 侧边栏完整设计 |
| Home 页面 | 2679:24930 | 首页布局 |
| Machines P1 | 2679:22612 | 气垫机选型 |
| Machines P2 | 2700:20514 | 纸垫机选型 |
| Consumables | 2679:22464 | 耗材页面 |
| Cart | 2700:16715 | 购物车 |

---

## 批量导出

如需批量导出多个图标，编辑脚本添加节点 ID：

```javascript
// frontend/scripts/figma-sync.js
const ICON_NODES = {
  'icon-product-line': 'xxxx:xxxx',
  'icon-air-cushion': 'xxxx:xxxx',
  'icon-paper': 'xxxx:xxxx',
  'icon-tape': 'xxxx:xxxx',
};
```

然后运行：
```bash
node scripts/figma-sync.js export-icons "id1,id2,id3" "name1,name2,name3"
```

---

## 从 SVG 提取信息

### 提取颜色
```bash
grep -oE 'fill="#[0-9A-F]{6}"' machine-page.svg | sort | uniq -c | sort -rn
```

### 提取尺寸
```bash
grep -oE 'width="[0-9]+" height="[0-9]+"' machine-page.svg | sort | uniq -c | sort -rn
```

### 提取圆角
```bash
grep -oE 'rx="[0-9]+"' machine-page.svg | sort | uniq -c | sort -rn
```

---

## 下一步建议

1. **导出 Sidebar 图标** (Node: 2443:17459)
   ```bash
   node scripts/figma-sync.js export-icons "2443:17459" "sidebar"
   ```

2. **导出 Home 页面** (Node: 2679:24930)
   ```bash
   node scripts/figma-sync.js export-icons "2679:24930" "home-page"
   ```

3. **手动导出单个图标**
   - Figma 中选中图标 → Export → SVG
