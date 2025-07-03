# BJT Product System - 配置管理指南

## 概述

BJT产品系统支持多种部署环境，每种环境都有特定的配置要求。本指南详细说明了如何正确配置不同环境。

## 环境类型

### 1. 本地开发环境 (Local Development)
- **用途**: 开发人员在本地机器上进行开发和调试
- **特点**: 前端Node.js服务器 + Docker后端服务
- **端口**: 前端5173，后端8080

### 2. Docker开发环境 (Docker Development)
- **用途**: 完全容器化的开发环境
- **特点**: 所有服务都在Docker容器中运行
- **端口**: 前端5173，后端8080

### 3. 生产环境 (Production)
- **用途**: 线上生产环境
- **特点**: 使用Nginx反向代理，HTTPS，数据库持久化
- **端口**: HTTP 80，HTTPS 443

## 配置文件结构

```
bjt-product-system/
├── frontend/
│   ├── env.example              # 前端环境变量示例
│   ├── env.development          # 本地开发配置
│   ├── env.docker              # Docker开发配置
│   └── .env.local              # 本地环境变量（git忽略）
├── env.production.example       # 生产环境配置示例
├── .env.production             # 生产环境配置（git忽略）
└── scripts/
    └── config-manager.sh       # 配置管理脚本
```

## 配置优先级

### 前端配置优先级（从高到低）
1. `.env.local` (本地开发)
2. `env.development` (开发环境默认)
3. `env.docker` (Docker环境)
4. Vite内置环境变量

### 后端配置优先级（从高到低）
1. `.env.production` (生产环境)
2. Docker Compose环境变量
3. 容器内默认值

## 环境配置详解

### 本地开发环境配置

**适用场景**: 开发人员本地开发，前端热重载，后端Docker容器

**配置步骤**:
```bash
# 1. 设置配置
./scripts/config-manager.sh local

# 2. 启动后端Docker服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d mysql wordpress

# 3. 启动前端开发服务器
cd frontend && npm run dev
```

**关键配置**:
```env
# frontend/.env.local
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_WORDPRESS_HOST=http://localhost:8080
DOCKER_ENV=false
```

**代理配置**:
- 前端请求 `/wp-json/*` → 代理到 `http://localhost:8080`
- 支持热重载和实时调试

### Docker开发环境配置

**适用场景**: 完全容器化开发，接近生产环境

**配置步骤**:
```bash
# 1. 设置配置
./scripts/config-manager.sh docker

# 2. 启动所有Docker服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d
```

**关键配置**:
```env
# Docker Compose环境变量
DOCKER_ENV=true
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
```

**网络配置**:
- 前端容器请求 `/wp-json/*` → 代理到 `http://wordpress:80`
- 容器间通过Docker网络通信

### 生产环境配置

**适用场景**: 线上生产环境，HTTPS，负载均衡

**配置步骤**:
```bash
# 1. 复制配置模板
cp env.production.example .env.production

# 2. 编辑生产配置
vim .env.production

# 3. 验证配置
./scripts/config-manager.sh production

# 4. 部署
./deploy-production.sh
```

**关键配置**:
```env
# .env.production
DOMAIN_NAME=your-domain.com
WP_HOME=https://your-domain.com
WP_SITEURL=https://your-domain.com
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=false
```

## 常见问题与解决方案

### 1. 端口冲突问题

**症状**: `Port 5173 is already in use`

**原因**: 同时运行了本地Node.js服务器和Docker前端容器

**解决方案**:
```bash
# 检查当前状态
./scripts/config-manager.sh status

# 清理所有服务
./scripts/config-manager.sh cleanup

# 重新设置环境
./scripts/config-manager.sh local  # 或 docker
```

### 2. API代理失败

**症状**: `❌ Proxy error: ECONNREFUSED`

**原因**: 
- 本地环境：后端Docker服务未启动
- Docker环境：代理配置指向错误地址

**解决方案**:
```bash
# 本地环境
docker-compose -f docker/dev/docker-compose.nginx.yml up -d mysql wordpress

# Docker环境
docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend
```

### 3. 认证失败

**症状**: `Failed to get current user, token may be invalid`

**原因**: localStorage中有无效token

**解决方案**:
```javascript
// 在浏览器控制台执行
localStorage.removeItem('auth_token');
localStorage.removeItem('user');
location.reload();
```

### 4. 环境变量不生效

**症状**: 配置修改后不生效

**原因**: 
- 配置文件优先级问题
- 服务器缓存

**解决方案**:
```bash
# 清理并重新设置
./scripts/config-manager.sh cleanup
./scripts/config-manager.sh [local|docker]

# 强制重新构建Docker镜像
docker-compose -f docker/dev/docker-compose.nginx.yml build --no-cache frontend
```

## 配置验证清单

### 开发环境验证
- [ ] 前端服务运行在5173端口
- [ ] 后端API可通过8080端口访问
- [ ] API代理正常工作 (`/wp-json/*` 请求成功)
- [ ] 认证流程正常
- [ ] 热重载功能正常

### 生产环境验证
- [ ] HTTPS证书配置正确
- [ ] 域名解析正确
- [ ] 数据库连接正常
- [ ] 文件上传功能正常
- [ ] 备份任务配置正确

## 最佳实践

### 1. 环境隔离
- 不同环境使用不同的配置文件
- 敏感信息（密码、密钥）不提交到git
- 使用配置管理脚本自动化设置

### 2. 配置管理
- 定期备份生产环境配置
- 配置变更记录在版本控制中
- 使用环境变量而非硬编码配置

### 3. 故障排除
- 使用配置管理脚本的status命令检查状态
- 查看详细日志定位问题
- 保持配置文档更新

## 工具使用

### 配置管理脚本
```bash
# 查看当前状态
./scripts/config-manager.sh status

# 设置本地开发环境
./scripts/config-manager.sh local

# 设置Docker开发环境
./scripts/config-manager.sh docker

# 验证生产环境配置
./scripts/config-manager.sh production

# 清理所有配置
./scripts/config-manager.sh cleanup
```

### 调试工具
- 前端调试页面: `http://localhost:5173/debug-auth.html`
- API测试工具: `./test-api-comprehensive.sh`
- 日志查看: `docker-compose logs [service-name]`

## 总结

正确的配置管理是确保BJT产品系统稳定运行的关键。通过使用标准化的配置文件和自动化脚本，可以有效避免环境配置问题，提高开发和部署效率。

定期检查和更新配置，确保与系统架构变化保持同步。 