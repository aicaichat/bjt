# 🌐 域名部署快速指南

## 📋 前置条件
- ✅ 已购买域名（如：example.com）
- ✅ 域名DNS已指向服务器IP
- ✅ 服务器已安装Docker和Docker Compose
- ✅ 服务器开放80和443端口

---

## 🚀 5分钟快速部署

### 第1步：配置域名DNS
在域名管理面板添加A记录：
```
@ → YOUR_SERVER_IP
www → YOUR_SERVER_IP
```

### 第2步：配置环境变量
```bash
# 复制配置模板
cp env.production.example .env.production

# 编辑配置文件
nano .env.production
```

**必须修改的配置：**
```bash
# 数据库密码（使用强密码）
MYSQL_ROOT_PASSWORD=your_secure_password_123!
MYSQL_PASSWORD=your_wp_password_456!
WORDPRESS_DB_PASSWORD=your_wp_password_456!

# 域名配置（替换为你的域名）
DOMAIN_NAME=your-domain.com
WP_HOME=https://your-domain.com
WP_SITEURL=https://your-domain.com

# WordPress安全密钥（访问 https://api.wordpress.org/secret-key/1.1/salt/ 生成）
WORDPRESS_AUTH_KEY='生成的密钥1'
WORDPRESS_SECURE_AUTH_KEY='生成的密钥2'
WORDPRESS_LOGGED_IN_KEY='生成的密钥3'
WORDPRESS_NONCE_KEY='生成的密钥4'
WORDPRESS_AUTH_SALT='生成的密钥5'
WORDPRESS_SECURE_AUTH_SALT='生成的密钥6'
WORDPRESS_LOGGED_IN_SALT='生成的密钥7'
WORDPRESS_NONCE_SALT='生成的密钥8'

# JWT密钥（生成64位随机字符串）
JWT_AUTH_SECRET_KEY='your_64_character_random_string_here'
```

### 第3步：配置SSL证书

#### 选项A：自动申请Let's Encrypt证书（推荐）
```bash
# 安装Certbot
sudo apt install certbot -y

# 申请证书（需要先停止占用80端口的服务）
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书到项目目录
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key
sudo chown $USER:$USER nginx/ssl/*
```

#### 选项B：生成自签名证书（测试用）
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/private.key \
    -out nginx/ssl/cert.pem \
    -subj "/C=CN/ST=State/L=City/O=Company/CN=your-domain.com"
```

### 第4步：一键部署
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

### 第5步：验证部署
```bash
# 检查服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 测试访问
curl -I https://your-domain.com
```

---

## 🎯 访问地址

部署成功后，你可以通过以下地址访问：

- **前端应用**: https://your-domain.com
- **管理后台**: https://your-domain.com/wp-admin
- **API接口**: https://your-domain.com/wp-json/bjt/v1

---

## 🔧 常用管理命令

### 查看服务状态
```bash
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 查看日志
```bash
# 查看所有日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs -f wordpress
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

### 更新部署
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

---

## 🛠️ 故障排除

### 1. 域名无法访问
```bash
# 检查DNS解析
nslookup your-domain.com

# 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

### 2. SSL证书错误
```bash
# 检查证书文件
ls -la nginx/ssl/

# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"
```

### 3. 服务启动失败
```bash
# 查看详细错误
docker-compose -f docker/prod/docker-compose.prod.yml logs

# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### 4. 数据库连接失败
```bash
# 检查数据库容器
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 重置数据库（谨慎使用）
docker-compose -f docker/prod/docker-compose.prod.yml down
docker volume rm bjt-product-system_mysql_data
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

---

## 📋 部署检查清单

### 部署前
- [ ] 域名DNS已配置
- [ ] 服务器防火墙已开放80/443端口
- [ ] .env.production已正确配置
- [ ] SSL证书已准备

### 部署后
- [ ] 所有容器正常运行
- [ ] 前端应用可访问
- [ ] WordPress后台可访问
- [ ] API接口正常响应
- [ ] SSL证书有效

---

## 🔐 安全建议

1. **使用强密码**：数据库和WordPress管理员密码
2. **定期更新**：系统、Docker镜像和WordPress插件
3. **备份数据**：定期备份数据库和文件
4. **监控日志**：定期检查访问和错误日志
5. **SSL证书**：确保证书有效期充足

---

## 📞 需要帮助？

如果遇到问题，请：

1. 查看详细部署指南：`DOMAIN_DEPLOYMENT_GUIDE.md`
2. 检查服务日志：`docker-compose logs`
3. 验证配置文件：`.env.production`
4. 测试网络连接：`curl -I https://your-domain.com`

恭喜！你的BJT产品管理系统已成功部署！🎉 