# 🌐 BJT产品管理系统 - 域名部署完整指南

## 📖 概述

本指南将帮助你将BJT产品管理系统部署到生产环境，使用自己的域名和SSL证书，实现安全的HTTPS访问。

---

## 🎯 部署目标

部署完成后，你将获得：
- ✅ 通过域名访问的前端应用
- ✅ 安全的HTTPS连接
- ✅ WordPress管理后台
- ✅ REST API接口
- ✅ 自动SSL证书续期
- ✅ 数据库自动备份

---

## 📋 准备工作

### 1. 域名要求
- 已购买的域名（如：example.com）
- 域名管理权限（能够修改DNS记录）

### 2. 服务器要求
- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **内存**: 最少2GB，推荐4GB+
- **存储**: 最少20GB，推荐50GB+
- **网络**: 公网IP，开放80和443端口

### 3. 软件要求
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 具有sudo权限的用户

---

## 🚀 部署步骤

### 第一步：配置域名DNS

在你的域名管理面板中添加以下DNS记录：

```
类型    名称    值              TTL
A       @       YOUR_SERVER_IP  300
A       www     YOUR_SERVER_IP  300
```

**验证DNS解析：**
```bash
nslookup your-domain.com
dig your-domain.com
```

### 第二步：准备服务器环境

#### 2.1 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2.2 安装Docker（如果未安装）
```bash
# 一键安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加用户到docker组
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用权限
newgrp docker
```

#### 2.3 配置防火墙
```bash
# Ubuntu (ufw)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 第三步：下载项目代码

```bash
# 克隆项目
git clone <your-repo-url> bjt-product-system
cd bjt-product-system

# 或者如果已有项目
git pull origin main
```

### 第四步：配置环境变量

#### 4.1 复制配置模板
```bash
cp env.production.example .env.production
```

#### 4.2 编辑配置文件
```bash
nano .env.production
```

#### 4.3 关键配置项

**数据库配置（使用强密码）：**
```bash
MYSQL_ROOT_PASSWORD=your_very_secure_root_password_123!
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=your_secure_wp_password_456!
```

**WordPress数据库配置：**
```bash
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=your_secure_wp_password_456!
WORDPRESS_DB_CHARSET=utf8mb4
WORDPRESS_DB_COLLATE=
```

**域名配置（替换为你的实际域名）：**
```bash
DOMAIN_NAME=your-domain.com
WP_HOME=https://your-domain.com
WP_SITEURL=https://your-domain.com
```

**WordPress安全密钥：**
访问 https://api.wordpress.org/secret-key/1.1/salt/ 生成8个唯一密钥：
```bash
WORDPRESS_AUTH_KEY='生成的密钥1'
WORDPRESS_SECURE_AUTH_KEY='生成的密钥2'
WORDPRESS_LOGGED_IN_KEY='生成的密钥3'
WORDPRESS_NONCE_KEY='生成的密钥4'
WORDPRESS_AUTH_SALT='生成的密钥5'
WORDPRESS_SECURE_AUTH_SALT='生成的密钥6'
WORDPRESS_LOGGED_IN_SALT='生成的密钥7'
WORDPRESS_NONCE_SALT='生成的密钥8'
```

**JWT认证密钥：**
```bash
JWT_AUTH_SECRET_KEY='your_64_character_random_string_here'
```

### 第五步：配置SSL证书

#### 方法A：自动申请Let's Encrypt证书（推荐）

使用我们提供的自动化脚本：
```bash
# 给脚本执行权限
chmod +x scripts/setup-ssl.sh

# 运行SSL配置脚本
sudo ./scripts/setup-ssl.sh your-domain.com
```

#### 方法B：手动申请Let's Encrypt证书

```bash
# 安装Certbot
sudo apt install certbot -y

# 申请证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书到项目目录
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key
sudo chown $USER:$USER nginx/ssl/*
```

#### 方法C：使用自有SSL证书

```bash
# 创建SSL目录
mkdir -p nginx/ssl

# 复制你的证书文件
cp your-certificate.crt nginx/ssl/cert.pem
cp your-private-key.key nginx/ssl/private.key

# 设置权限
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/private.key
```

### 第六步：执行部署

#### 6.1 一键部署（推荐）
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

#### 6.2 手动部署
```bash
# 停止现有服务
docker-compose -f docker/prod/docker-compose.prod.yml down

# 构建镜像
docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache

# 启动服务
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 第七步：验证部署

#### 7.1 检查服务状态
```bash
# 查看容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f
```

#### 7.2 测试访问
```bash
# 测试前端应用
curl -I https://your-domain.com

# 测试API接口
curl -I https://your-domain.com/wp-json/bjt/v1

# 测试WordPress后台
curl -I https://your-domain.com/wp-admin
```

#### 7.3 SSL证书验证
```bash
# 检查SSL证书
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# 在线SSL测试
# 访问：https://www.ssllabs.com/ssltest/
```

---

## 🎯 访问地址

部署成功后，你可以通过以下地址访问：

- **前端应用**: https://your-domain.com
- **WordPress管理后台**: https://your-domain.com/wp-admin
- **API接口**: https://your-domain.com/wp-json/bjt/v1

---

## 🔧 部署后配置

### 1. WordPress初始化

访问 `https://your-domain.com/wp-admin` 进行WordPress初始化：

1. **创建管理员账户**
   - 用户名：建议不使用admin
   - 密码：使用强密码
   - 邮箱：你的邮箱地址

2. **激活插件**
   在WordPress管理后台激活：
   - BJT Core Entities
   - BJT Product Admin
   - BJT CORS

### 2. 前端应用测试

访问 `https://your-domain.com` 测试：
- 页面是否正常加载
- API数据是否正常显示
- 用户注册和登录功能

### 3. 数据库初始化（可选）

```bash
# 进入MySQL容器
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 导入示例数据
mysql> USE bjt_product;
mysql> SOURCE /path/to/sample_data.sql;
```

---

## 📊 监控和维护

### 1. 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs -f wordpress
docker-compose -f docker/prod/docker-compose.prod.yml logs -f mysql
```

### 2. 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
df -h
free -h
```

### 3. 备份管理

```bash
# 查看自动备份状态
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql-backup

# 手动执行备份
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql-backup /backup.sh

# 备份配置文件
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env.production nginx/ssl nginx/conf.d
```

---

## 🛠️ 常见问题和解决方案

### 1. 域名无法访问

**问题**: 浏览器显示"无法访问此网站"

**解决方案**:
```bash
# 检查DNS解析
nslookup your-domain.com

# 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# 检查服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 2. SSL证书错误

**问题**: 浏览器显示"连接不安全"

**解决方案**:
```bash
# 检查证书文件
ls -la nginx/ssl/

# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"

# 重新申请证书
sudo certbot renew --force-renewal
```

### 3. 服务启动失败

**问题**: 容器无法启动

**解决方案**:
```bash
# 查看详细错误
docker-compose -f docker/prod/docker-compose.prod.yml logs

# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 清理Docker资源
docker system prune -a
```

### 4. 数据库连接失败

**问题**: WordPress无法连接数据库

**解决方案**:
```bash
# 检查数据库容器
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 检查环境变量
cat .env.production | grep MYSQL

# 重启数据库服务
docker-compose -f docker/prod/docker-compose.prod.yml restart mysql
```

---

## 🔐 安全建议

### 1. 密码安全
- 使用强密码（至少12位，包含大小写字母、数字、特殊字符）
- 定期更换密码
- 不要在多个地方使用相同密码

### 2. 系统安全
- 定期更新系统和软件包
- 配置SSH密钥登录，禁用密码登录
- 安装fail2ban防止暴力破解
- 定期检查系统日志

### 3. 应用安全
- 定期更新WordPress核心和插件
- 使用双因素认证
- 限制WordPress登录尝试次数
- 定期备份数据

### 4. 网络安全
- 使用防火墙限制不必要的端口
- 配置SSL/TLS加密
- 使用CDN加速和防护
- 监控异常访问

---

## 📈 性能优化

### 1. 缓存优化
- 启用Nginx静态文件缓存
- 配置WordPress对象缓存
- 使用CDN加速静态资源

### 2. 数据库优化
- 定期优化数据库表
- 配置合适的MySQL参数
- 创建必要的数据库索引

### 3. 服务器优化
- 调整PHP内存限制
- 配置合适的worker进程数
- 启用Gzip压缩

---

## 📋 部署检查清单

### 部署前检查
- [ ] 域名DNS已正确配置并生效
- [ ] 服务器防火墙已开放80/443端口
- [ ] Docker和Docker Compose已安装
- [ ] .env.production文件已正确配置
- [ ] SSL证书已准备就绪

### 部署后检查
- [ ] 所有Docker容器正常运行
- [ ] 前端应用可正常访问
- [ ] WordPress管理后台可正常访问
- [ ] API接口响应正常
- [ ] SSL证书有效且配置正确
- [ ] 数据库连接正常
- [ ] 备份服务正常运行

### 安全检查
- [ ] 使用强密码
- [ ] SSH密钥登录已配置
- [ ] 防火墙规则已设置
- [ ] SSL证书有效期充足
- [ ] WordPress插件已更新
- [ ] 数据库权限已限制

---

## 📞 获取帮助

如果在部署过程中遇到问题：

1. **查看日志**: `docker-compose -f docker/prod/docker-compose.prod.yml logs`
2. **检查配置**: 验证 `.env.production` 文件
3. **测试网络**: `curl -I https://your-domain.com`
4. **查看文档**: 
   - 详细部署指南：`DOMAIN_DEPLOYMENT_GUIDE.md`
   - 快速部署指南：`DOMAIN_QUICK_DEPLOY.md`
   - 故障排除指南：`TROUBLESHOOTING.md`

---

## 🎉 恭喜！

如果你已经完成了所有步骤，恭喜你成功部署了BJT产品管理系统！

你现在拥有一个功能完整、安全可靠的产品管理系统，包括：
- 现代化的React前端界面
- 强大的WordPress后端API
- 安全的HTTPS连接
- 自动化的备份和监控

享受你的新系统吧！🚀 