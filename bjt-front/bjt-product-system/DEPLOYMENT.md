# BJT产品管理系统 - 生产环境部署指南

## 概述

本文档详细说明如何在生产服务器上部署BJT产品管理系统。该系统包含：
- React前端应用
- WordPress后端API
- MySQL数据库
- Nginx反向代理

## 系统要求

### 硬件要求
- CPU: 2核心以上
- 内存: 4GB以上
- 存储: 20GB以上可用空间
- 网络: 稳定的互联网连接

### 软件要求
- Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- Docker 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL（用于SSL证书）

## 部署步骤

### 1. 准备服务器环境

#### 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 配置防火墙
```bash
# 开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 2. 克隆项目代码

```bash
git clone <your-repository-url> bjt-product-system
cd bjt-product-system
```

### 3. 配置环境变量

```bash
# 复制环境配置文件
cp env.production.example .env.production

# 编辑配置文件
nano .env.production
```

#### 必须修改的配置项：

```bash
# 数据库密码（请使用强密码）
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_wp_password

# 域名配置
DOMAIN_NAME=your-domain.com
WP_HOME=https://your-domain.com
WP_SITEURL=https://your-domain.com

# WordPress安全密钥
# 访问 https://api.wordpress.org/secret-key/1.1/salt/ 生成
WORDPRESS_AUTH_KEY=generated_key_here
WORDPRESS_SECURE_AUTH_KEY=generated_key_here
# ... 其他密钥

# JWT密钥
JWT_AUTH_SECRET_KEY=your_jwt_secret_key
```

### 4. 配置SSL证书

#### 选项A: 使用Let's Encrypt（推荐）
```bash
# 安装Certbot
sudo apt install certbot

# 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key
sudo chown $USER:$USER nginx/ssl/*
```

#### 选项B: 使用自签名证书（仅用于测试）
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/private.key \
    -out nginx/ssl/cert.pem \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 5. 执行部署

```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

部署脚本会自动：
1. 检查系统要求
2. 验证配置文件
3. 构建前端应用
4. 备份现有数据库（如果存在）
5. 启动所有服务
6. 等待服务就绪

### 6. 验证部署

部署完成后，访问以下地址验证：

- 前端应用: `https://your-domain.com`
- WordPress管理后台: `https://your-domain.com/wp-admin`
- API接口: `https://your-domain.com/wp-json/bjt/v1`

## 服务管理

### 查看服务状态
```bash
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs -f wordpress
docker-compose -f docker/prod/docker-compose.prod.yml logs -f mysql
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

### 更新应用
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh
```

## 数据备份

### 自动备份
系统已配置自动备份，每天凌晨2点执行，保留30天的备份文件。

### 手动备份
```bash
# 创建备份目录
mkdir -p backups

# 备份数据库
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql \
    mysqldump -u root -p${MYSQL_ROOT_PASSWORD} bjt_product \
    > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql

# 备份上传文件
tar -czf backups/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    -C docker/prod/volumes wordpress_uploads
```

### 恢复备份
```bash
# 恢复数据库
docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
    mysql -u root -p${MYSQL_ROOT_PASSWORD} bjt_product < backups/backup_file.sql

# 恢复上传文件
tar -xzf backups/uploads_backup_file.tar.gz \
    -C docker/prod/volumes/
```

## 监控和维护

### 系统监控
```bash
# 查看系统资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 日志轮转
```bash
# 配置Docker日志轮转（已在docker-compose中配置）
# 日志文件最大10MB，保留3个文件
```

### 清理Docker资源
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理未使用的网络
docker network prune
```

## 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 检查Docker服务
sudo systemctl status docker
```

#### 2. 数据库连接失败
```bash
# 检查MySQL服务状态
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# 检查数据库连接
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql \
    mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

#### 3. SSL证书问题
```bash
# 检查证书文件
ls -la nginx/ssl/

# 验证证书
openssl x509 -in nginx/ssl/cert.pem -text -noout
```

#### 4. 前端无法访问API
```bash
# 检查Nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx \
    nginx -t

# 重新加载Nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx \
    nginx -s reload
```

### 性能优化

#### 1. 数据库优化
```bash
# 调整MySQL配置
# 编辑 docker/mysql/conf.d/mysql.cnf
[mysqld]
innodb_buffer_pool_size = 512M
max_connections = 200
query_cache_size = 64M
```

#### 2. 缓存配置
```bash
# 启用Redis缓存（可选）
# 在docker-compose.prod.yml中添加Redis服务
```

## 安全建议

1. **定期更新系统和Docker**
2. **使用强密码和密钥**
3. **定期备份数据**
4. **监控系统日志**
5. **限制SSH访问**
6. **使用防火墙**
7. **定期更新SSL证书**

## 支持

如果遇到问题，请：
1. 查看日志文件
2. 检查配置文件
3. 参考故障排除部分
4. 联系技术支持团队

---

**注意**: 这是生产环境部署，请确保在部署前充分测试所有功能。 