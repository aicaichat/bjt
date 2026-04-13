# Figma 设计数据同步系统

> 智能获取 Figma 设计规格，自动缓存和本地保存

## 功能特性

- ✅ **智能缓存** - 24小时缓存避免频繁 API 调用
- ✅ **指数退避** - 自动处理 Rate Limit，智能重试
- ✅ **批量获取** - 一次获取多个节点减少 API 调用
- ✅ **定时任务** - 支持 crontab 或 launchd 定时同步
- ✅ **本地保存** - JSON + CSS 双格式输出
- ✅ **设计令牌提取** - 自动提取颜色、间距、字体等

## 安装

```bash
cd scripts
chmod +x figma-sync.js figma-cron.sh
```

## 使用方法

### 1. 立即同步

```bash
# 使用环境变量设置 Token
export FIGMA_TOKEN=<your-figma-personal-access-token>

# 执行同步
node figma-sync.js sync
```

### 2. 使用缓存

```bash
# 如果缓存有效，直接使用缓存
node figma-sync.js sync --use-cache
```

### 3. 查看缓存

```bash
node figma-sync.js cache
```

### 4. 定时任务模式

```bash
# 每 6 小时自动同步
node figma-sync.js scheduler 6

# 每 12 小时自动同步
node figma-sync.js scheduler 12
```

## 设置定时任务 (macOS/Linux)

### 方法 1: Crontab

```bash
# 编辑 crontab
crontab -e

# 添加每 6 小时同步一次
0 */6 * * * cd /Users/mac/bjt/bjt-front/bjt-product-system && ./scripts/figma-cron.sh

# 保存退出
```

### 方法 2: macOS Launchd

```bash
# 创建 plist 文件
cat > ~/Library/LaunchAgents/com.bjt.figma-sync.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.bjt.figma-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/mac/bjt/bjt-front/bjt-product-system/scripts/figma-cron.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>21600</integer>
    <key>StandardOutPath</key>
    <string>/Users/mac/bjt/bjt-front/bjt-product-system/.figma-cache/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/mac/bjt/bjt-front/bjt-product-system/.figma-cache/launchd-error.log</string>
</dict>
</plist>
EOF

# 加载并启动
launchctl load ~/Library/LaunchAgents/com.bjt.figma-sync.plist
launchctl start com.bjt.figma-sync

# 查看状态
launchctl list | grep com.bjt.figma-sync
```

## 输出文件

同步完成后生成以下文件：

```
frontend/.figma-cache/
├── figma-data.json      # 完整节点数据
├── figma-tokens.css     # CSS 变量
└── sync.log             # 同步日志
```

## 数据结构

### figma-data.json

```json
{
  "_meta": {
    "lastUpdated": 1712934000000,
    "fileKey": "QluTLuKXbauHIiCN8AZUGJ",
    "version": "1.0"
  },
  "nodes": {
    "2679-24930": {
      "document": { ... },
      "components": { ... }
    }
  },
  "tokens": {
    "colors": {
      "Home/Button/Primary": "#00338d",
      "Home/Card/Background": "#ffffff"
    },
    "spacing": {
      "Home/Button/Height": { "width": 160, "height": 48 }
    },
    "typography": {
      "Home/Button/Label": {
        "fontSize": 14,
        "fontWeight": 500
      }
    }
  }
}
```

### figma-tokens.css

```css
/* Figma Design Tokens - Auto Generated */
:root {
  --figma-home-button-primary: #00338d;
  --figma-home-card-background: #ffffff;
  --figma-home-button-height-width: 160px;
  --figma-home-button-height-height: 48px;
}
```

## 关键节点

| 页面 | Node ID | 说明 |
|------|---------|------|
| Home | 2679:24930 | 首页 |
| Machines P1 | 2679:22612 | 气垫机选型 |
| Machines P2 | 2700:20514 | 纸垫机选型 |
| Consumables | 2679:22464 | 耗材页 |
| Cart | 2700:16715 | 购物车 |
| Header | 2679:22645 | 顶部导航 |
| Sidebar | 2443:17459 | 侧边栏 |

## 故障排除

### Rate Limit 错误

系统会自动指数退避重试，最多 5 次：
- 第 1 次: 3 秒后重试
- 第 2 次: 6 秒后重试
- 第 3 次: 12 秒后重试
- 第 4 次: 24 秒后重试
- 第 5 次: 48 秒后重试

### 检查日志

```bash
cat .figma-cache/sync.log
tail -f .figma-cache/sync.log
```

### 手动清除缓存

```bash
rm -rf .figma-cache/
```

## 与构建流程集成

在 `package.json` 中添加：

```json
{
  "scripts": {
    "figma:sync": "node scripts/figma-sync.js sync",
    "figma:scheduler": "node scripts/figma-sync.js scheduler",
    "build": "npm run figma:sync && vite build"
  }
}
```

## 安全提示

⚠️ **不要将 Token 提交到 Git！**

```bash
# 已添加到 .gitignore
echo ".figma-cache/" >> .gitignore
echo "*.token" >> .gitignore
```
