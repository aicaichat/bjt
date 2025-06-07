# BJT Product System - 生产环境部署指南

## 概述

本文档描述了如何将 BJT Product System 部署到生产环境。系统使用 Docker Compose 进行容器化部署，包含以下组件：

- **Nginx**: 反向代理和静态文件服务
- **Frontend**: React/Vite 构建的前端应用
- **WordPress**: 后端 API 服务
- **MySQL**: 数据库服务

## 前置要求

1. **服务器要求**：
   - Ubuntu 20.04+ 或 CentOS 7+
   - 最少 2GB RAM，推荐 4GB+
   - 20GB+ 可用磁盘空间
   - Docker 20.10+
   - Docker Compose 2.0+

2. **域名和 SSL**：
   - 已配置的域名
   - SSL 证书（可使用 Let's Encrypt）

3. **端口要求**：
   - 80 (HTTP)
   - 443 (HTTPS)
   - 3306 (MySQL，仅内部使用)

## 部署步骤

### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装其他必要工具
sudo apt install -y git curl wget
```

### 2. 克隆项目

```bash
# 克隆项目
git clone https://github.com/your-repo/bjt-product-system.git
cd bjt-product-system

# 切换到生产分支（如果有）
git checkout production
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp env.production.example .env.production

# 编辑环境变量
nano .env.production
```

必须配置的环境变量：
- `DOMAIN_NAME`: 你的域名
- `MYSQL_ROOT_PASSWORD`: 数据库 root 密码
- `MYSQL_PASSWORD`: 数据库用户密码
- `JWT_AUTH_SECRET_KEY`: JWT 密钥
- WordPress 安全密钥（访问 https://api.wordpress.org/secret-key/1.1/salt/ 生成）

### 4. 准备 SSL 证书

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl

# 如果使用 Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/bjt.nh.cool/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/bjt.nh.cool/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/*
```

### 5. 运行部署脚本

```bash
# 给部署脚本执行权限
chmod +x deploy-production.sh

# 运行部署
./deploy-production.sh
```

部署脚本会自动执行以下操作：
1. 检查环境变量
2. 备份当前部署（如果存在）
3. 构建前端应用
4. 更新 Docker 镜像
5. 启动所有服务
6. 执行健康检查

### 6. 手动部署（可选）

如果不使用部署脚本，可以手动执行：

```bash
# 构建前端
cd frontend
npm ci
VITE_API_URL="https://your-domain.com/wp-json/bjt/v1" npm run build:skip-check
cd ..

# 构建和启动 Docker 容器
docker-compose -f docker/prod/docker-compose.prod.yml build
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f
```

## 维护操作

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs -f wordpress
```

### 备份数据库

```bash
# 手动备份
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup_$(date +%Y%m%d_%H%M%S).sql

# 自动备份已配置在 docker-compose.prod.yml 中
```

### 更新应用

```bash
# 拉取最新代码
git pull origin production

# 重新部署
./deploy-production.sh
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker/prod/docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx
```

### 停止服务

```bash
docker-compose -f docker/prod/docker-compose.prod.yml down
```

## 故障排查

### 1. 容器无法启动

```bash
# 检查容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看详细日志
docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=100
```

### 2. 数据库连接失败

```bash
# 检查数据库容器
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 检查数据库是否创建
SHOW DATABASES;
```

### 3. 前端无法访问 API

- 检查 Nginx 配置中的代理设置
- 确认 WordPress 容器正常运行
- 检查 CORS 设置

### 4. SSL 证书问题

```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 更新证书
sudo certbot renew
```

## 性能优化

### 1. 启用 Redis 缓存（可选）

在 `docker-compose.prod.yml` 中添加：

```yaml
redis:
  image: redis:alpine
  networks:
    - bjt_network
  restart: unless-stopped
```

### 2. 配置 CDN

- 配置 Cloudflare 或其他 CDN 服务
- 更新 Nginx 配置以支持 CDN

### 3. 数据库优化

```bash
# 进入 MySQL 容器
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 优化表
OPTIMIZE TABLE wp_posts, wp_postmeta, wp_options;
```

## 监控

### 1. 使用 Docker 统计

```bash
# 查看资源使用情况
docker stats

# 查看特定容器
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx top
```

### 2. 设置告警（推荐）

- 使用 Prometheus + Grafana
- 或使用云服务商的监控服务

## 安全建议

1. **定期更新**：
   - 更新 Docker 镜像
   - 更新 WordPress 和插件
   - 更新系统包

2. **备份策略**：
   - 每日自动备份数据库
   - 每周备份整个系统
   - 异地备份重要数据

3. **访问控制**：
   - 限制 SSH 访问
   - 使用防火墙规则
   - 启用 fail2ban

4. **SSL/TLS**：
   - 使用强加密算法
   - 定期更新证书
   - 启用 HSTS

## 联系支持

如遇到问题，请：
1. 查看日志文件
2. 检查本文档的故障排查部分
3. 提交 Issue 到项目仓库 