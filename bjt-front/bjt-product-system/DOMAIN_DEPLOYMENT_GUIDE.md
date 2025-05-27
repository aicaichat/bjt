# 🌐 BJT产品管理系统 - 带域名正式部署指南

## 📋 部署前准备

### 1. 域名要求
- 已购买的域名（如：example.com）
- 域名DNS已指向你的服务器IP
- 服务器开放80和443端口

### 2. 服务器要求
- Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- 2GB+ RAM，20GB+ 存储空间
- 已安装Docker和Docker Compose
- 具有sudo权限

---

## 🚀 完整部署流程

### 第一步：配置域名DNS

#### 1.1 添加DNS记录
在你的域名管理面板中添加以下记录：

```
类型    名称    值              TTL
A       @       YOUR_SERVER_IP  300
A       www     YOUR_SERVER_IP  300
```

#### 1.2 验证DNS解析
```bash
# 检查域名是否正确解析到服务器IP
nslookup your-domain.com
dig your-domain.com

# 确保返回的IP是你的服务器IP
```

### 第二步：服务器环境准备

#### 2.1 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2.2 安装Docker（如果未安装）
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用docker组权限
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

### 第三步：下载和配置项目

#### 3.1 克隆项目
```bash
# 克隆项目到服务器
git clone <your-repo-url> bjt-product-system
cd bjt-product-system

# 或者如果已有项目，拉取最新代码
git pull origin main
```

#### 3.2 配置环境变量
```bash
# 复制环境配置模板
cp env.production.example .env.production

# 编辑配置文件
nano .env.production
```

#### 3.3 环境配置详解
```bash
# .env.production 配置示例

# 数据库配置（请使用强密码）
MYSQL_ROOT_PASSWORD=your_very_secure_root_password_123!
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=your_secure_wp_password_456!

# WordPress数据库配置
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=your_secure_wp_password_456!
WORDPRESS_DB_CHARSET=utf8mb4
WORDPRESS_DB_COLLATE=

# WordPress安全密钥（访问 https://api.wordpress.org/secret-key/1.1/salt/ 生成）
WORDPRESS_AUTH_KEY='your_unique_auth_key_here'
WORDPRESS_SECURE_AUTH_KEY='your_unique_secure_auth_key_here'
WORDPRESS_LOGGED_IN_KEY='your_unique_logged_in_key_here'
WORDPRESS_NONCE_KEY='your_unique_nonce_key_here'
WORDPRESS_AUTH_SALT='your_unique_auth_salt_here'
WORDPRESS_SECURE_AUTH_SALT='your_unique_secure_auth_salt_here'
WORDPRESS_LOGGED_IN_SALT='your_unique_logged_in_salt_here'
WORDPRESS_NONCE_SALT='your_unique_nonce_salt_here'

# JWT认证密钥（生成一个64位随机字符串）
JWT_AUTH_SECRET_KEY='your_jwt_secret_key_64_characters_long_random_string_here'

# 域名配置（替换为你的实际域名）
DOMAIN_NAME=your-domain.com
WP_HOME=https://your-domain.com
WP_SITEURL=https://your-domain.com

# SSL配置
USE_SSL=true
FORCE_SSL_ADMIN=true

# WordPress配置
WP_DEBUG=false
WP_DEBUG_LOG=false
WP_DEBUG_DISPLAY=false
WP_CACHE=true

# 备份配置
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# 性能配置
PHP_MEMORY_LIMIT=512M
PHP_MAX_EXECUTION_TIME=300
PHP_UPLOAD_MAX_FILESIZE=64M
PHP_POST_MAX_SIZE=64M

# MySQL配置
MYSQL_INNODB_BUFFER_POOL_SIZE=512M
MYSQL_MAX_CONNECTIONS=200

# 时区配置
TZ=Asia/Shanghai
```

### 第四步：SSL证书配置

#### 4.1 自动申请Let's Encrypt证书（推荐）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 临时启动nginx获取证书
sudo nginx -t && sudo systemctl start nginx

# 申请SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 停止临时nginx
sudo systemctl stop nginx
```

#### 4.2 手动配置SSL证书
如果你有自己的SSL证书：

```bash
# 创建SSL目录
mkdir -p nginx/ssl

# 复制证书文件
cp your-certificate.crt nginx/ssl/cert.pem
cp your-private-key.key nginx/ssl/private.key

# 设置正确的权限
chmod 600 nginx/ssl/private.key
chmod 644 nginx/ssl/cert.pem
```

#### 4.3 生成自签名证书（仅用于测试）
```bash
# 创建SSL目录
mkdir -p nginx/ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/private.key \
    -out nginx/ssl/cert.pem \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=YourCompany/CN=your-domain.com"
```

### 第五步：执行部署

#### 5.1 一键部署
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

#### 5.2 手动部署（如果自动部署失败）
```bash
# 停止现有服务
docker-compose -f docker/prod/docker-compose.prod.yml down

# 拉取最新镜像
docker-compose -f docker/prod/docker-compose.prod.yml pull

# 构建自定义镜像
docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache

# 启动服务
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 第六步：验证部署

#### 6.1 检查服务状态
```bash
# 查看所有容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 检查网络连接
curl -I https://your-domain.com
```

#### 6.2 访问测试
```bash
# 测试前端应用
curl -I https://your-domain.com

# 测试API接口
curl -I https://your-domain.com/wp-json/bjt/v1

# 测试WordPress管理后台
curl -I https://your-domain.com/wp-admin
```

#### 6.3 SSL证书验证
```bash
# 检查SSL证书
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# 在线SSL检测
# 访问：https://www.ssllabs.com/ssltest/
```

---

## 🔧 部署后配置

### 1. WordPress初始化

#### 1.1 访问管理后台
```
URL: https://your-domain.com/wp-admin
```

#### 1.2 创建管理员账户
- 用户名：admin（建议修改为其他名称）
- 密码：使用强密码
- 邮箱：你的邮箱地址

#### 1.3 激活插件
在WordPress管理后台激活以下插件：
- BJT Core Entities
- BJT Product Admin
- BJT CORS

### 2. 前端应用配置

#### 2.1 API连接测试
访问前端应用，检查是否能正常加载数据：
```
https://your-domain.com
```

#### 2.2 用户注册和登录测试
- 测试用户注册功能
- 测试用户登录功能
- 测试JWT认证

### 3. 数据库初始化

#### 3.1 导入示例数据（可选）
```bash
# 进入MySQL容器
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 导入示例数据
mysql> USE bjt_product;
mysql> SOURCE /path/to/sample_data.sql;
```

#### 3.2 创建数据库索引
```sql
-- 优化查询性能
CREATE INDEX idx_product_name ON products(name);
CREATE INDEX idx_product_category ON products(category);
CREATE INDEX idx_created_at ON products(created_at);
```

---

## 📊 监控和维护

### 1. 日志管理

#### 1.1 查看实时日志
```bash
# 查看所有服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs -f wordpress
docker-compose -f docker/prod/docker-compose.prod.yml logs -f mysql
```

#### 1.2 日志轮转配置
```bash
# 配置Docker日志轮转
sudo nano /etc/docker/daemon.json

{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 重启Docker服务
sudo systemctl restart docker
```

### 2. 备份策略

#### 2.1 自动数据库备份
```bash
# 查看备份服务状态
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql-backup

# 手动执行备份
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql-backup /backup.sh
```

#### 2.2 文件备份
```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz \
    -C docker/prod/volumes wordpress_uploads

# 备份配置文件
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
    .env.production nginx/ssl nginx/conf.d
```

### 3. 性能监控

#### 3.1 资源使用监控
```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
df -h
free -h
```

#### 3.2 网站性能测试
```bash
# 使用curl测试响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# curl-format.txt内容：
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

---

## 🛠️ 故障排除

### 1. 常见问题

#### 1.1 SSL证书问题
```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"

# 续期Let's Encrypt证书
sudo certbot renew --dry-run
sudo certbot renew
```

#### 1.2 域名解析问题
```bash
# 检查DNS解析
nslookup your-domain.com
dig your-domain.com

# 清除本地DNS缓存
sudo systemctl flush-dns  # Ubuntu
sudo dscacheutil -flushcache  # macOS
```

#### 1.3 服务启动失败
```bash
# 查看详细错误信息
docker-compose -f docker/prod/docker-compose.prod.yml logs

# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 检查磁盘空间
df -h

# 清理Docker资源
docker system prune -a
```

### 2. 紧急恢复

#### 2.1 服务重启
```bash
# 重启所有服务
docker-compose -f docker/prod/docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx
docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress
```

#### 2.2 数据库恢复
```bash
# 从备份恢复数据库
docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
    mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < backup.sql
```

#### 2.3 回滚部署
```bash
# 停止当前服务
docker-compose -f docker/prod/docker-compose.prod.yml down

# 恢复到之前的版本
git checkout previous-stable-tag

# 重新部署
./deploy.sh
```

---

## 🔐 安全加固

### 1. 服务器安全

#### 1.1 SSH安全配置
```bash
# 编辑SSH配置
sudo nano /etc/ssh/sshd_config

# 建议配置：
Port 2222                    # 修改默认端口
PermitRootLogin no          # 禁止root登录
PasswordAuthentication no   # 禁用密码登录
PubkeyAuthentication yes    # 启用密钥登录

# 重启SSH服务
sudo systemctl restart sshd
```

#### 1.2 安装fail2ban
```bash
# 安装fail2ban
sudo apt install fail2ban -y

# 配置fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# 启动fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. 应用安全

#### 2.1 WordPress安全
- 定期更新WordPress核心和插件
- 使用强密码和双因素认证
- 限制登录尝试次数
- 隐藏WordPress版本信息

#### 2.2 数据库安全
- 使用强密码
- 限制数据库访问权限
- 定期备份数据库
- 启用数据库审计日志

---

## 📈 性能优化

### 1. 缓存配置

#### 1.1 Nginx缓存
已在配置中启用：
- 静态文件长期缓存
- API响应短期缓存
- Gzip压缩

#### 1.2 WordPress缓存
- 启用对象缓存
- 使用CDN加速
- 优化数据库查询

### 2. 数据库优化

#### 2.1 MySQL配置优化
```sql
-- 查看当前配置
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'max_connections';

-- 优化查询
EXPLAIN SELECT * FROM products WHERE category = 'electronics';
```

#### 2.2 定期维护
```sql
-- 优化表
OPTIMIZE TABLE products;
OPTIMIZE TABLE accessories;
OPTIMIZE TABLE spare_parts;

-- 分析表
ANALYZE TABLE products;
```

---

## 🎯 部署检查清单

### 部署前检查
- [ ] 域名DNS已正确配置
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

恭喜！你的BJT产品管理系统已成功部署到生产环境！ 