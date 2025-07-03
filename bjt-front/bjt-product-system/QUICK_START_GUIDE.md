# 🚀 BJT产品系统 - 快速启动指南

## 📋 一键启动（推荐）

### 方式1：项目根目录启动
```bash
# 自动检测环境并启动
./start-dev.sh
```

### 方式2：使用配置脚本
```bash
# 自动检测并配置环境
./scripts/setup-env.sh

# 自动检测、配置并启动
./scripts/setup-env.sh --start
```

### 方式3：前端目录启动
```bash
cd frontend

# 自动配置并启动
npm run dev:auto

# 强制使用Docker环境
npm run dev:docker

# 强制使用本地环境
npm run dev:local
```

## 🔧 环境说明

### 自动检测逻辑
脚本会按以下顺序检测环境：

1. **Docker开发环境** - 检测到运行中的Docker容器（名称包含"dev-"）
2. **本地开发环境** - 检测到`http://localhost:8080/wp-json/bjt/v1`可访问
3. **生产环境** - 检测到`.env.production`文件存在
4. **默认** - 使用本地开发环境配置

### 环境配置对比

| 环境 | API目标 | 前端端口 | 配置文件 |
|------|---------|----------|----------|
| Docker开发 | `http://wordpress:80` | 5173 (容器) | `.env.local` |
| 本地开发 | `http://localhost:8080` | 5173 | `.env.local` |
| 生产环境 | `/wp-json/bjt/v1` (相对路径) | - | `.env.local` |

## 🛠️ 手动配置（高级用户）

### Docker开发环境
```bash
# 启动Docker服务
cd docker/dev
docker-compose -f docker-compose.nginx.yml up -d

# 配置前端
./scripts/setup-env.sh --docker

# 访问: http://localhost:5173
```

### 本地开发环境
```bash
# 确保WordPress在localhost:8080运行
# 配置前端
./scripts/setup-env.sh --local

# 启动前端
cd frontend && npm run dev

# 访问: http://localhost:5173
```

### 生产环境
```bash
# 配置生产环境
./scripts/setup-env.sh --production

# 构建前端
cd frontend && npm run build:production

# 部署
./deploy-production.sh
```

## 🔍 故障排除

### 端口冲突
```bash
# 检查端口占用
lsof -ti:5173

# 脚本会自动处理端口冲突
./scripts/setup-env.sh --start
```

### 环境变量问题
```bash
# 查看当前配置
cat frontend/.env.local

# 重新生成配置
./scripts/setup-env.sh --local  # 或 --docker
```

### API连接问题
```bash
# 测试API连接
curl http://localhost:8080/wp-json/bjt/v1

# Docker环境测试
docker exec dev-wordpress-1 curl http://localhost/wp-json/bjt/v1
```

## 📞 获取帮助

```bash
# 查看脚本帮助
./scripts/setup-env.sh --help

# 查看当前环境状态
./scripts/setup-env.sh
```

## 🎯 常用命令速查

```bash
# 快速启动
./start-dev.sh

# 停止Docker环境
docker-compose -f docker/dev/docker-compose.nginx.yml down

# 重启前端容器
docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend

# 查看日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs -f frontend

# 清理端口占用
lsof -ti:5173 | xargs kill -9
```

---

**💡 提示**: 推荐使用 `./start-dev.sh` 一键启动，脚本会自动处理所有配置！ 