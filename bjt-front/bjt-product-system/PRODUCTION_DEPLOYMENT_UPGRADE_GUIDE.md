# 生产环境部署脚本升级指南

## 📋 概述

基于之前遇到的部署问题（构建文件过时、缓存问题、版本不同步），我们创建了一个增强版的生产环境部署脚本 `deploy-production-enhanced.sh`，专门解决这些问题。

## 🆚 与原脚本的主要区别

### 原脚本存在的问题
1. **构建缓存问题**：没有彻底清理构建缓存，导致使用旧的构建结果
2. **版本跟踪不足**：缺少版本信息追踪和验证机制
3. **缓存破坏不够强**：简单的缓存破坏可能不够彻底
4. **健康检查简单**：没有版本验证，无法确认部署的是否为最新版本

### 增强版脚本的改进
1. **🧹 增强版缓存清理**：彻底清理所有构建缓存
2. **📊 版本追踪系统**：生成详细的版本信息和部署ID
3. **🔥 强化缓存破坏**：多重缓存破坏机制
4. **🏥 智能健康检查**：包含版本验证的健康检查
5. **📦 灵活的部署选项**：支持强制清理、跳过备份等选项

## 🚀 使用方法

### 1. 标准部署（推荐）
```bash
# 给脚本执行权限
chmod +x deploy-production-enhanced.sh

# 执行标准部署
./deploy-production-enhanced.sh
```

### 2. 强制清理部署（解决缓存问题）
```bash
# 强制清理所有缓存和依赖后部署
./deploy-production-enhanced.sh --force-clean
```

### 3. 快速部署（跳过非必要步骤）
```bash
# 跳过备份和健康检查的快速部署
./deploy-production-enhanced.sh --skip-backup --skip-health
```

### 4. 查看帮助
```bash
./deploy-production-enhanced.sh --help
```

## 🔧 主要功能详解

### 1. 增强版缓存清理
```bash
# 强制清理模式会清理：
- node_modules/ 目录
- package-lock.json 文件
- .vite/ 缓存目录
- node_modules/.vite/ 缓存
- node_modules/.cache/ 缓存
- dist/ 和 build/ 目录
- npm 缓存
```

### 2. 版本跟踪系统
```json
{
  "buildTimestamp": "1704441600",
  "buildDate": "2024-01-05 10:00:00",
  "gitCommit": "abc123def456",
  "gitBranch": "main",
  "deploymentId": "20240105_100000",
  "nodeVersion": "v18.19.0",
  "npmVersion": "10.2.3"
}
```

### 3. 强化缓存破坏
```html
<!-- 在 HTML 中添加多重缓存破坏标记 -->
<meta name="build-timestamp" content="1704441600">
<meta name="build-date" content="2024-01-05 10:00:00">
<meta name="git-commit" content="abc123def456">
<meta name="cache-buster" content="v1704441600">
<meta name="cache-control" content="no-cache, no-store, must-revalidate">
<meta name="pragma" content="no-cache">
<meta name="expires" content="0">
```

### 4. 智能健康检查
```bash
# 检查项目：
✅ 前端服务可访问性
✅ API服务可访问性  
✅ 版本信息文件可访问性
✅ 版本号匹配验证
✅ 多次重试机制
```

## 📊 部署过程监控

### 构建过程信息
```bash
🔍 检查环境变量...
🔍 检查代码版本...
💾 备份当前部署...
🔨 构建前端应用...
   - Node.js版本: v18.19.0
   - npm版本: 10.2.3
   - 构建时间: 2024-01-05 10:00:00
   - 部署版本: 1704441600
```

### 构建统计信息
```bash
📊 构建统计：
   - 构建时间: 2024-01-05 10:00:00
   - 主文件: -rw-r--r-- 1 user group 2048 Jan 5 10:00 dist/index.html
   - 构建大小: 15M dist/
   - 文件数量: 127 个文件
```

## 🎯 部署后验证

### 1. 自动验证
脚本会自动检查：
- 服务可访问性
- 版本信息匹配
- API 接口正常

### 2. 手动验证
```bash
# 1. 访问版本信息
curl https://your-domain.com/version.json

# 2. 带版本号的访问链接
https://your-domain.com/?v=1704441600
https://your-domain.com/admin?v=1704441600

# 3. 浏览器验证
- 硬刷新: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)
- 无痕模式访问
- 开发者工具检查网络请求
```

## 🛠️ 故障排除

### 1. 构建失败
```bash
# 使用强制清理模式
./deploy-production-enhanced.sh --force-clean
```

### 2. 健康检查失败
```bash
# 查看详细日志
docker compose -f docker/prod/docker-compose.prod.yml logs -f

# 跳过健康检查继续部署
./deploy-production-enhanced.sh --skip-health
```

### 3. 版本验证失败
```bash
# 检查版本信息文件
curl https://your-domain.com/version.json

# 检查 HTML 中的版本标记
curl -s https://your-domain.com | grep "build-timestamp"
```

## 📁 生成的文件

### 1. 版本信息文件
```
frontend/dist/version.json - 版本信息
```

### 2. 备份文件
```
backups/deployment_20240105_100000/
├── frontend_dist/          # 前端构建文件备份
├── .env.production         # 环境配置备份
└── database_20240105_100000.sql  # 数据库备份
```

### 3. 构建文件
```
frontend/dist/              # 构建输出
├── index.html             # 包含版本标记的主页面
├── version.json           # 版本信息文件
└── assets/                # 静态资源
```

## 🔄 从原脚本迁移

### 1. 保留原脚本
```bash
# 重命名原脚本作为备份
mv deploy-production.sh deploy-production.sh.backup
```

### 2. 使用新脚本
```bash
# 复制新脚本
cp deploy-production-enhanced.sh deploy-production.sh

# 或者直接使用新脚本名称
./deploy-production-enhanced.sh
```

### 3. 环境变量兼容
新脚本完全兼容原脚本的环境变量配置，无需修改 `.env.production` 文件。

## 💡 最佳实践

### 1. 日常部署
```bash
# 标准部署流程
git pull origin main
./deploy-production-enhanced.sh
```

### 2. 问题排查部署
```bash
# 遇到缓存问题时
./deploy-production-enhanced.sh --force-clean
```

### 3. 紧急部署
```bash
# 快速部署（跳过备份）
./deploy-production-enhanced.sh --skip-backup
```

### 4. 监控部署
```bash
# 实时监控日志
./deploy-production-enhanced.sh &
docker compose -f docker/prod/docker-compose.prod.yml logs -f
```

## 🚨 注意事项

1. **首次使用**：建议先在测试环境验证
2. **备份重要**：除非紧急情况，不要跳过备份
3. **版本验证**：部署后务必验证版本信息
4. **浏览器缓存**：部署后提醒用户清理浏览器缓存
5. **CDN缓存**：如果使用CDN，需要手动清理CDN缓存

## 📞 支持

如果遇到问题，可以：
1. 查看部署日志
2. 检查 Docker 容器状态
3. 验证版本信息文件
4. 对比备份文件 