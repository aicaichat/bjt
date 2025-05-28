# 🌐 BJT产品管理系统 - 远程IP部署指南

## 📋 概述

本指南将帮助您将BJT产品管理系统部署到远程服务器上，通过IP地址进行访问。这是一个开发版本的部署，适合用于开发、测试和演示环境。

## 🎯 部署特点

- ✅ **开发环境配置**：启用调试模式，便于开发和调试
- ✅ **IP地址访问**：支持公网IP和内网IP访问
- ✅ **热重载支持**：前端支持实时代码更新
- ✅ **完整功能**：包含前端、后端、数据库和API
- ✅ **自动配置**：一键部署，自动生成安全密钥
- ⚠️ **HTTP协议**：使用HTTP协议，适合开发环境

## 🔧 系统要求

### 服务器要求
- **操作系统**：Linux (Ubuntu 18.04+, CentOS 7+) 或 macOS
- **内存**：至少 2GB RAM
- **存储**：至少 10GB 可用空间
- **网络**：稳定的网络连接

### 软件要求
- **Docker**：版本 20.10+
- **Docker Compose**：版本 1.29+
- **curl**：用于健康检查
- **openssl**：用于生成安全密钥

### 端口要求
需要开放以下端口：
- **80**：Nginx反向代理（主要访问端口）
- **3306**：MySQL数据库
- **5173**：前端开发服务器
- **8080**：WordPress直接访问

## 🚀 快速部署

### 1. 准备工作

```bash
# 1. 克隆项目（如果还没有）
git clone <your-repo-url>
cd bjt-product-system

# 2. 确保Docker服务运行
sudo systemctl start docker
sudo systemctl enable docker

# 3. 检查Docker状态
docker --version
docker-compose --version
```

### 2. 一键部署

```bash
# 执行部署脚本
chmod +x deploy-remote-ip.sh
./deploy-remote-ip.sh
```

### 3. 部署过程

脚本将自动执行以下步骤：

1. **检测IP地址**：自动检测公网IP和内网IP
2. **选择IP地址**：用户选择要使用的IP地址
3. **生成配置**：自动生成环境配置文件
4. **安全设置**：生成随机密码和密钥
5. **构建镜像**：构建Docker镜像
6. **启动服务**：启动所有服务容器
7. **健康检查**：等待所有服务就绪
8. **显示信息**：显示访问地址和管理信息

## 📱 访问地址

部署完成后，您可以通过以下地址访问系统：

```
🌐 主要访问地址
├── 前端应用:        http://YOUR_IP
├── WordPress后台:   http://YOUR_IP/wp-admin
└── API接口:         http://YOUR_IP/wp-json/bjt/v1

🔧 开发访问地址
├── 前端开发服务器:   http://YOUR_IP:5173
├── WordPress直接:   http://YOUR_IP:8080
└── MySQL数据库:     YOUR_IP:3306
```

## ⚙️ 配置说明

### 环境配置文件

部署脚本会自动创建 `.env.remote-ip` 配置文件：

```bash
# 服务器IP地址
SERVER_IP=YOUR_SERVER_IP

# 数据库配置（自动生成随机密码）
MYSQL_ROOT_PASSWORD=auto_generated_password
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=auto_generated_password

# WordPress配置
WP_DEBUG=true          # 开发模式
WP_DEBUG_LOG=true      # 启用日志
WP_DEBUG_DISPLAY=false # 不在页面显示错误

# 前端配置
NODE_ENV=development   # 开发环境
VITE_HOST=0.0.0.0     # 允许外部访问
```

### Docker服务配置

系统包含以下Docker服务：

1. **nginx**：反向代理服务器（端口80）
2. **frontend**：Vue.js前端应用（端口5173）
3. **wordpress**：WordPress后端（端口8080）
4. **mysql**：MySQL数据库（端口3306）

## 🛠️ 管理命令

### 查看服务状态
```bash
docker-compose -f docker/dev/docker-compose.remote-ip.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs

# 查看特定服务日志
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs nginx
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs frontend
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs wordpress
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs mysql

# 实时查看日志
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs -f
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker/dev/docker-compose.remote-ip.yml restart

# 重启特定服务
docker-compose -f docker/dev/docker-compose.remote-ip.yml restart nginx
docker-compose -f docker/dev/docker-compose.remote-ip.yml restart frontend
```

### 停止服务
```bash
# 停止所有服务
docker-compose -f docker/dev/docker-compose.remote-ip.yml down

# 停止并删除数据卷（谨慎使用）
docker-compose -f docker/dev/docker-compose.remote-ip.yml down -v
```

### 更新代码
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose -f docker/dev/docker-compose.remote-ip.yml build --no-cache
docker-compose -f docker/dev/docker-compose.remote-ip.yml up -d
```

## 🔒 安全注意事项

### 开发环境安全
- ⚠️ 使用HTTP协议，数据传输未加密
- ⚠️ 启用了调试模式，可能暴露敏感信息
- ⚠️ 数据库端口对外开放，注意访问控制

### 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 3306
sudo ufw allow 5173
sudo ufw allow 8080

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 云服务器安全组
如果使用云服务器，需要在安全组中开放相应端口：
- 入站规则：允许TCP 80, 3306, 5173, 8080端口
- 出站规则：允许所有流量

## 🐛 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
netstat -tuln | grep :80
ss -tuln | grep :80

# 停止占用端口的服务
sudo systemctl stop nginx  # 如果有其他nginx服务
sudo systemctl stop apache2  # 如果有Apache服务
```

#### 2. Docker服务未启动
```bash
# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 检查Docker状态
sudo systemctl status docker
```

#### 3. 服务启动失败
```bash
# 查看详细错误日志
docker-compose -f docker/dev/docker-compose.remote-ip.yml logs

# 检查容器状态
docker ps -a

# 重新构建镜像
docker-compose -f docker/dev/docker-compose.remote-ip.yml build --no-cache
```

#### 4. 无法访问服务
```bash
# 检查防火墙状态
sudo ufw status  # Ubuntu/Debian
sudo firewall-cmd --list-all  # CentOS/RHEL

# 检查服务监听状态
netstat -tuln | grep :80
```

### 日志位置
- **Nginx日志**：容器内 `/var/log/nginx/`
- **WordPress日志**：容器内 `/var/www/html/wp-content/debug.log`
- **MySQL日志**：容器内 `/var/log/mysql/`

## 📈 性能优化

### 开发环境优化
```bash
# 增加Docker内存限制
echo '{"default-ulimits":{"memlock":{"Hard":-1,"Name":"memlock","Soft":-1}}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# 清理Docker缓存
docker system prune -f
```

### 数据库优化
```sql
-- 连接到MySQL
mysql -h YOUR_IP -u root -p

-- 查看数据库状态
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
```

## 🔄 升级和维护

### 定期维护
```bash
# 1. 备份数据库
docker-compose -f docker/dev/docker-compose.remote-ip.yml exec mysql \
  mysqldump -u root -p bjt_product > backup_$(date +%Y%m%d).sql

# 2. 更新系统
git pull
docker-compose -f docker/dev/docker-compose.remote-ip.yml build --no-cache
docker-compose -f docker/dev/docker-compose.remote-ip.yml up -d

# 3. 清理旧镜像
docker image prune -f
```

### 监控服务
```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    docker-compose -f docker/dev/docker-compose.remote-ip.yml ps
    echo ""
    sleep 60
done
EOF

chmod +x monitor.sh
./monitor.sh
```

## 📞 技术支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查服务日志：`docker-compose logs`
3. 确认网络和防火墙配置
4. 联系技术支持团队

---

**注意**：这是开发环境部署，不适合生产环境使用。生产环境请使用HTTPS协议和更严格的安全配置。

## 🛠️ 开发工具（可选）

部署完成后，您可以选择安装额外的开发工具：

### 数据库管理工具
- **phpMyAdmin**: `http://YOUR_IP:8081` - 功能完整的MySQL管理界面
- **Adminer**: `http://YOUR_IP:8082` - 轻量级数据库管理工具

### 安装开发工具
```bash
# 启动开发工具
docker-compose -f docker-compose.dev-tools.yml up -d

# 停止开发工具
docker-compose -f docker-compose.dev-tools.yml down
```

### 开发工具端口
需要额外开放以下端口：
- **8081**: phpMyAdmin
- **8082**: Adminer

## 📊 监控和维护

### 健康检查
```bash
# 运行系统健康检查
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

健康检查包含：
- Docker服务状态
- 容器运行状态
- 网络连接测试
- 数据库连接测试
- API接口测试
- 磁盘和内存使用情况
- 错误日志统计

### 数据备份
```bash
# 创建完整备份
chmod +x scripts/backup-remote.sh
./scripts/backup-remote.sh
```

备份内容包括：
- MySQL数据库
- WordPress文件（uploads, themes, plugins）
- 配置文件
- Docker配置

### 自动化监控
```bash
# 创建定时健康检查（每小时执行一次）
echo "0 * * * * /path/to/bjt-product-system/scripts/health-check.sh >> /var/log/bjt-health.log 2>&1" | crontab -

# 创建定时备份（每天凌晨2点执行）
echo "0 2 * * * /path/to/bjt-product-system/scripts/backup-remote.sh >> /var/log/bjt-backup.log 2>&1" | crontab -
``` 