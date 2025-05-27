# 🚀 BJT产品管理系统 - 快速部署指南

## 📋 部署方式选择

### 🌐 方式一：IP地址部署（推荐）
**适用场景**：有服务器但没有域名
**访问方式**：通过IP地址访问
**安全级别**：HTTP（无SSL）

### 🏠 方式二：本地部署
**适用场景**：本地开发测试
**访问方式**：localhost:8080
**安全级别**：HTTP（无SSL）

### 🆓 方式三：免费域名部署
**适用场景**：想要域名访问
**访问方式**：通过免费域名访问
**安全级别**：HTTPS（有SSL）

---

## 🌐 方式一：IP地址部署

### 前置要求
- 服务器（云服务器或VPS）
- 已安装Docker和Docker Compose
- 开放80端口

### 一键部署
```bash
# 1. 克隆项目（如果还没有）
git clone <your-repo-url>
cd bjt-product-system

# 2. 执行IP地址部署
chmod +x deploy-ip.sh
./deploy-ip.sh
```

### 部署过程
1. 脚本自动检测公网IP和内网IP
2. 选择要使用的IP地址
3. 自动配置环境变量
4. 构建并启动所有服务
5. 等待服务就绪
6. 显示访问信息

### 访问地址
```
前端应用: http://YOUR_IP
管理后台: http://YOUR_IP/wp-admin
API接口: http://YOUR_IP/wp-json/bjt/v1
```

### 注意事项
- 确保防火墙开放80端口
- 云服务器需检查安全组设置
- 使用HTTP协议，安全性较低

---

## 🏠 方式二：本地部署

### 前置要求
- 本地已安装Docker和Docker Compose
- 端口8080和3306未被占用

### 快速启动
```bash
# 1. 进入项目目录
cd bjt-product-system

# 2. 启动本地服务
docker-compose -f docker/prod/docker-compose.local.yml up -d

# 3. 等待服务启动（约2-3分钟）
docker-compose -f docker/prod/docker-compose.local.yml logs -f

# 4. 检查服务状态
docker-compose -f docker/prod/docker-compose.local.yml ps
```

### 访问地址
```
前端应用: http://localhost:8080
管理后台: http://localhost:8080/wp-admin
API接口: http://localhost:8080/wp-json/bjt/v1
MySQL数据库: localhost:3306
```

### 停止服务
```bash
docker-compose -f docker/prod/docker-compose.local.yml down
```

---

## 🆓 方式三：免费域名部署

### 1. 获取免费域名

#### 选项A：DuckDNS（推荐）
```bash
# 1. 访问 https://www.duckdns.org
# 2. 使用GitHub/Google账号登录
# 3. 创建子域名：yourapp.duckdns.org
# 4. 获取token
```

#### 选项B：Freenom
```bash
# 1. 访问 https://www.freenom.com
# 2. 注册账号
# 3. 搜索并注册免费域名（.tk, .ml, .ga等）
```

### 2. 配置DNS
```bash
# 将域名指向你的服务器IP
# A记录: yourapp.duckdns.org -> YOUR_SERVER_IP
```

### 3. 部署系统
```bash
# 1. 复制配置文件
cp env.production.example .env.production

# 2. 编辑配置文件
nano .env.production
# 修改 DOMAIN_NAME=yourapp.duckdns.org

# 3. 执行部署
chmod +x deploy.sh
./deploy.sh
```

### 4. 配置SSL证书
```bash
# 脚本会自动申请Let's Encrypt证书
# 或者手动申请：
certbot --nginx -d yourapp.duckdns.org
```

---

## 🔧 常用命令

### 查看服务状态
```bash
# IP地址部署
docker-compose -f docker/prod/docker-compose.ip.yml ps

# 本地部署
docker-compose -f docker/prod/docker-compose.local.yml ps

# 域名部署
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker/prod/docker-compose.ip.yml logs

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.ip.yml logs nginx
docker-compose -f docker/prod/docker-compose.ip.yml logs wordpress
docker-compose -f docker/prod/docker-compose.ip.yml logs mysql

# 实时查看日志
docker-compose -f docker/prod/docker-compose.ip.yml logs -f
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker/prod/docker-compose.ip.yml restart

# 重启特定服务
docker-compose -f docker/prod/docker-compose.ip.yml restart nginx
```

### 停止服务
```bash
# 停止所有服务
docker-compose -f docker/prod/docker-compose.ip.yml down

# 停止并删除数据卷（谨慎使用）
docker-compose -f docker/prod/docker-compose.ip.yml down -v
```

### 更新服务
```bash
# 重新构建并启动
docker-compose -f docker/prod/docker-compose.ip.yml build --no-cache
docker-compose -f docker/prod/docker-compose.ip.yml up -d
```

---

## 🛠️ 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :8080

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果是Apache
sudo systemctl stop nginx    # 如果是系统Nginx
```

#### 2. Docker权限问题
```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER
# 重新登录或执行
newgrp docker
```

#### 3. 服务启动失败
```bash
# 查看详细错误信息
docker-compose -f docker/prod/docker-compose.ip.yml logs

# 检查磁盘空间
df -h

# 清理Docker缓存
docker system prune -a
```

#### 4. 无法访问服务
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 8080

# 检查服务状态
curl -I http://localhost
curl -I http://YOUR_IP
```

#### 5. 数据库连接失败
```bash
# 检查MySQL容器状态
docker-compose -f docker/prod/docker-compose.ip.yml exec mysql mysql -u root -p

# 重置数据库
docker-compose -f docker/prod/docker-compose.ip.yml down
docker volume rm bjt-product-system_mysql_data
docker-compose -f docker/prod/docker-compose.ip.yml up -d
```

---

## 📞 获取帮助

### 检查系统状态
```bash
# 系统信息
uname -a
docker --version
docker-compose --version

# 服务状态
docker ps
docker-compose -f docker/prod/docker-compose.ip.yml ps

# 网络连接
curl -I http://localhost
ping google.com
```

### 日志收集
```bash
# 收集所有日志
mkdir -p logs
docker-compose -f docker/prod/docker-compose.ip.yml logs > logs/all-services.log
docker logs $(docker ps -q) > logs/all-containers.log
```

选择适合你环境的部署方式，开始使用BJT产品管理系统！ 