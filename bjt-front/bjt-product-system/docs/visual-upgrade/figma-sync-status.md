# Figma 数据同步状态报告

## 1. 当前状态

### 1.1 已完成
- [x] 创建 Figma 同步脚本 `frontend/scripts/figma-sync.js`
- [x] 实现指数退避重试机制（3s, 6s, 12s, 24s, 48s）
- [x] 实现本地缓存系统（24小时有效期）
- [x] Sidebar SVG 图标组件已替换 emoji 图标

### 1.2 API 限流问题

**状态**: ⚠️ 严重限流

| Token | 状态 | 限制情况 |
|-------|------|----------|
| 旧 Token | ❌ 失效 | 完全无法使用 |
| 新 Token | ⚠️ 受限 | 即使单个节点请求也被限流 |

**错误信息**:
```
[WARN] Rate limited, 3000ms 后重试...
...
[ERROR] 获取失败: RATE_LIMIT
```

**分析**: Figma API 对免费/低权限 Token 有严格的限流策略，即使使用：
- 深度=1（最小数据获取）
- 单节点批次（batchSize=1）
- 10秒间隔延迟
- 指数退避重试

仍然无法获取数据。

---

## 2. 替代方案

### 方案 A: 手动获取（推荐，立即可行）

请提供以下任一信息：

#### 1. Figma Dev Mode 截图
- 打开 Figma 文件
- 按 `Ctrl+\` 或 `Cmd+\` 进入 Dev Mode
- 选中以下元素并截图显示尺寸：
  - Sidebar 图标（Node: 2443:17459）
  - Home 按钮（Node: 2679:24930）
  - Machine 卡片（Node: 2679:22612, 2700:20514）

#### 2. 导出资源文件
- 右键菜单图标 → Export → SVG
- 右键颜色样式 → Copy as CSS
- 右键文本 → Copy properties

#### 3. 直接提供数值
回复格式示例：
```
Home按钮: 高度56px, padding 16px 24px, 字体16px/500
主色: #00338D
背景: #F5F7FA
卡片阴影: 0 4px 12px rgba(0,0,0,0.08)
```

### 方案 B: Figma Enterprise Token

如果有 Figma Enterprise 账户：
1. 生成高配额 Token
2. 使用脚本 `node scripts/figma-sync.js sync`

### 方案 C: 设计规范文档

如果存在设计规范 PDF/文档，直接参考文档中的数值。

---

## 3. 已完成的视觉修复

### 3.1 Sidebar 图标 ✅
**文件**: `src/admin/components/icons/AdminIcons.tsx`

已替换的图标：
| 菜单项 | 旧图标 | 新图标 |
|--------|--------|--------|
| 产品线管理 | 📄 | 文档编辑 SVG |
| 气垫机 | 🛋️ | 机器设备 SVG |
| 纸垫机 | 📃 | 文档堆叠 SVG |
| 胶带机 | 🧵 | 胶带卷 SVG |
| 用户管理 | 👤 | 用户头像 SVG |
| 系统设置 | ⚙️ | 齿轮设置 SVG |

### 3.2 等待精确数据的项目

| 优先级 | 项目 | 需要的数值 |
|--------|------|------------|
| P0 | Home 按钮 | 高度, padding, 字体大小, 字重, 圆角 |
| P0 | 卡片阴影 | X, Y, Blur, Spread, Color |
| P0 | 颜色系统 | 主色, 背景, 边框, 文字色的精确 hex |
| P1 | 字体系统 | 字体族, 标题/正文字重, 行高 |
| P1 | 间距系统 | 8px/16px/24px 网格确认 |
| P2 | 动画时长 | transition 时间 |

---

## 4. 定时任务配置

已创建脚本和配置，但需等待 API 问题解决后启用：

### 启动定时同步（限流解决后）
```bash
# 方式1: Crontab
crontab -e
# 添加: 0 */6 * * * cd /Users/mac/bjt/bjt-front/bjt-product-system && ./scripts/figma-cron.sh

# 方式2: Launchd (macOS)
launchctl load ~/Library/LaunchAgents/com.bjt.figma-sync.plist
```

### 手动触发同步
```bash
export FIGMA_TOKEN="your_token"
node scripts/figma-sync.js sync
```

---

## 5. 下一步行动

### 立即可做（无需 Figma 数据）
1. ✅ Sidebar 图标已完成替换
2. 🔄 使用 Chrome DevTools 测量当前实现与 Figma 的差距
3. 🔄 根据视觉反馈微调现有样式

### 需要 Figma 数据
1. ⏳ 获取 Sidebar 图标精确尺寸和间距
2. ⏳ 获取 Home 按钮精确规格
3. ⏳ 获取卡片阴影精确值
4. ⏳ 获取颜色/字体设计令牌

---

## 6. 建议

鉴于 API 限流问题，建议采用 **方案 A（手动获取）**：

1. **最低要求**: 请提供 3-5 张 Figma Dev Mode 截图（关键组件）
2. **推荐**: 导出 SVG 图标文件 + 颜色/间距数值表
3. **理想**: 完整设计规范文档

收到数据后，我可以：
- 精确调整所有组件样式
- 更新 CSS 设计令牌
- 完成像素级对齐
