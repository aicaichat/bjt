# BJT产品管理系统 - 生产环境故障排除指南

## 📋 概述

本文档提供BJT产品管理系统在生产环境部署和运维过程中可能遇到的问题及其解决方案。

## 🚨 常见问题分类

### 1. 🔧 Docker和容器相关问题

#### 问题1.1: 容器启动失败
**症状**: 
- 服务无法正常启动
- 容器状态显示 `Exited` 或 `Restarting`
- 应用无法访问

**可能原因**:
- 系统资源不足（内存/磁盘空间）
- 端口冲突（80/443被占用）
- 环境变量配置错误
- Docker守护进程问题

**诊断命令**:
```bash
# 检查系统资源
df -h  # 磁盘空间
free -m  # 内存使用
docker system df  # Docker空间使用

# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :443
lsof -i :80
lsof -i :443

# 检查容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql
```

**解决方案**:
```bash
# 释放系统资源
docker system prune -a -f
docker volume prune -f

# 释放被占用的端口
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp

# 检查环境变量
cat .env.production
grep -v '^#' .env.production | grep -v '^$'

# 重启服务
docker-compose -f docker/prod/docker-compose.prod.yml down
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 分步启动调试
docker-compose -f docker/prod/docker-compose.prod.yml up mysql
docker-compose -f docker/prod/docker-compose.prod.yml up wordpress
docker-compose -f docker/prod/docker-compose.prod.yml up nginx
```

#### 问题1.2: Docker镜像构建失败
**症状**:
- 部署脚本在build阶段失败
- "no space left on device" 错误
- 网络超时错误

**可能原因**:
- 磁盘空间不足
- 网络问题导致依赖下载失败
- Dockerfile配置错误
- Docker缓存问题

**解决方案**:
```bash
# 清理Docker缓存和无用镜像
docker system prune -a -f
docker builder prune -a -f

# 检查磁盘空间
df -h
du -sh /var/lib/docker

# 分步构建调试
docker-compose -f docker/prod/docker-compose.prod.yml build nginx --no-cache
docker-compose -f docker/prod/docker-compose.prod.yml build wordpress --no-cache

# 查看详细构建日志
docker-compose -f docker/prod/docker-compose.prod.yml build --progress=plain

# 手动构建测试
cd docker/nginx
docker build -t test-nginx -f Dockerfile.prod ../../
```

#### 问题1.3: 容器网络问题
**症状**:
- 容器间无法通信
- 数据库连接失败
- API接口无法访问

**解决方案**:
```bash
# 检查网络配置
docker network ls
docker network inspect bjt-product-system_bjt_network

# 重建网络
docker-compose -f docker/prod/docker-compose.prod.yml down
docker network prune -f
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 测试容器间连接
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress ping mysql
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ping wordpress
```

### 2. 🗃️ 数据库相关问题

#### 问题2.1: 数据库连接失败
**症状**:
- "Error establishing a database connection"
- WordPress安装页面出现
- API返回数据库错误

**可能原因**:
- 数据库密码错误
- MySQL容器未启动或启动失败
- 网络配置问题
- 数据库初始化未完成

**诊断命令**:
```bash
# 检查MySQL容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps mysql
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# 测试数据库连接
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysqladmin ping -u root -p${MYSQL_ROOT_PASSWORD}

# 检查数据库
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"

# 检查用户权限
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT User, Host FROM mysql.user;"
```

**解决方案**:
```bash
# 检查环境变量配置
grep -E "MYSQL_|DB_" .env.production

# 重启MySQL容器
docker-compose -f docker/prod/docker-compose.prod.yml restart mysql

# 等待MySQL完全启动
sleep 60

# 重建数据库
./rebuilddb_production_v2.sh

# 手动创建用户（如果需要）
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
"
```

#### 问题2.2: 字符编码问题
**症状**:
- 中文数据显示为乱码或问号
- 数据保存失败
- API返回编码错误

**可能原因**:
- 数据库字符集不是UTF-8
- 数据导入时编码不一致
- 客户端连接字符集错误

**解决方案**:
```bash
# 检查数据库字符集
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
SHOW VARIABLES LIKE 'character%';
SHOW VARIABLES LIKE 'collation%';
"

# 设置正确的字符集
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
SET GLOBAL character_set_server = utf8mb4;
SET GLOBAL character_set_database = utf8mb4;
SET GLOBAL character_set_connection = utf8mb4;
SET GLOBAL character_set_client = utf8mb4;
SET GLOBAL character_set_results = utf8mb4;
SET GLOBAL collation_server = utf8mb4_unicode_ci;
SET GLOBAL collation_database = utf8mb4_unicode_ci;
SET GLOBAL collation_connection = utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
"

# 重新导入数据（确保UTF-8编码）
./rebuilddb_production_v2.sh

# 检查表的字符集
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
SELECT TABLE_NAME, TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = '${MYSQL_DATABASE}';
"
```

#### 问题2.3: 数据库性能问题
**症状**:
- 查询响应缓慢
- 页面加载时间长
- CPU使用率高

**解决方案**:
```bash
# 查看数据库进程
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW PROCESSLIST;"

# 查看慢查询
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SHOW VARIABLES LIKE '%slow%';
"

# 优化表
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
OPTIMIZE TABLE wp_bjt_parts;
OPTIMIZE TABLE wp_bjt_consumables;
OPTIMIZE TABLE wp_bjt_relations;
"

# 查看索引使用情况
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
SHOW INDEX FROM wp_bjt_parts;
SHOW INDEX FROM wp_bjt_consumables;
"
```

### 3. 📁 文件权限和上传问题

#### 问题3.1: 文件上传失败
**症状**:
- PDF文件上传返回错误
- "Permission denied" 错误
- 上传接口返回500错误

**可能原因**:
- 目录权限不正确
- 磁盘空间不足
- 文件大小超限
- nginx配置错误

**解决方案**:
```bash
# 使用专用权限修复脚本
chmod +x scripts/setup-uploads-permissions.sh
./scripts/setup-uploads-permissions.sh --create --repair

# 检查磁盘空间
df -h
du -sh frontend/public/uploads/

# 手动修复权限
sudo chmod -R 755 frontend/public/uploads
sudo chown -R www-data:www-data frontend/public/uploads

# 检查容器内权限
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress ls -la /var/www/html/frontend/public/uploads/

# 修复容器内权限
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx chown -R nginx:nginx /usr/share/nginx/html/uploads
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress chown -R www-data:www-data /var/www/html/frontend/public/uploads

# 重启相关服务
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx wordpress
```

#### 问题3.2: 静态文件404错误
**症状**:
- 上传的文件无法访问
- 返回404 Not Found
- 图片/PDF无法显示

**可能原因**:
- nginx路径配置错误
- 文件未正确挂载
- 权限问题

**解决方案**:
```bash
# 检查文件是否存在
ls -la frontend/public/uploads/specifications/
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/

# 测试nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -t

# 检查nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -T | grep -A 10 "location /uploads"

# 重新加载nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload

# 测试文件访问
curl -I "https://your-domain.com/uploads/specifications/test.pdf"

# 查看nginx访问日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx | grep uploads
```

### 4. 🌐 SSL和网络问题

#### 问题4.1: SSL证书问题
**症状**:
- HTTPS显示"不安全"警告
- 证书过期错误
- ERR_CERT_AUTHORITY_INVALID错误

**可能原因**:
- 证书文件路径错误
- 证书已过期
- 域名不匹配
- 自签名证书

**解决方案**:
```bash
# 检查证书文件
ls -la nginx/ssl/
file nginx/ssl/cert.pem
file nginx/ssl/private.key

# 检查证书内容
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 检查证书域名
openssl x509 -in nginx/ssl/cert.pem -noout -subject

# 更新Let's Encrypt证书
sudo certbot renew --dry-run
sudo certbot renew

# 复制新证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key

# 设置正确权限
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/private.key

# 重启nginx
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx

# 测试SSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### 问题4.2: DNS解析问题
**症状**:
- 域名无法访问
- DNS解析失败
- 间歇性连接问题

**解决方案**:
```bash
# 检查DNS解析
nslookup your-domain.com
dig your-domain.com

# 检查A记录
dig A your-domain.com

# 刷新DNS缓存
sudo systemctl flush-dns  # Ubuntu
sudo dscacheutil -flushcache  # macOS

# 测试不同DNS服务器
dig @8.8.8.8 your-domain.com
dig @1.1.1.1 your-domain.com
```

#### 问题4.3: API接口无法访问
**症状**:
- 前端无法调用WordPress API
- CORS错误
- 401/403权限错误

**可能原因**:
- nginx代理配置错误
- WordPress插件未激活
- CORS配置问题
- 认证问题

**解决方案**:
```bash
# 测试API直接访问
curl -k "https://your-domain.com/wp-json/bjt/v1/"
curl -k "https://your-domain.com/wp-json/bjt/v1/products"

# 检查WordPress插件状态
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress wp plugin list

# 激活必要插件
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress wp plugin activate bjt-core-entities
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress wp plugin activate bjt-product-admin
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress wp plugin activate jwt-authentication-for-wp-rest-api

# 检查nginx代理配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -T | grep -A 5 "location /wp-json"

# 测试认证
curl -X POST "https://your-domain.com/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 检查CORS设置
curl -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  "https://your-domain.com/wp-json/bjt/v1/"
```

### 5. 🚀 前端部署问题

#### 问题5.1: 前端应用白屏
**症状**:
- 网站显示空白页面
- 浏览器控制台显示JavaScript错误
- 资源加载失败

**可能原因**:
- 前端构建失败
- API URL配置错误
- 静态文件路径问题
- JavaScript错误

**解决方案**:
```bash
# 检查前端构建文件
ls -la frontend/build/
ls -la frontend_builds/prod/

# 重新构建前端
cd frontend
npm ci
VITE_API_URL="https://your-domain.com/wp-json/bjt/v1" npm run build

# 使用热部署修复
./deploy-frontend-hot.sh -e prod --force

# 检查API URL配置
grep -r VITE_API_URL frontend/
cat frontend/.env.production

# 检查浏览器控制台错误
# 打开开发者工具查看Console和Network标签

# 验证静态文件
curl -I "https://your-domain.com/index.html"
curl -I "https://your-domain.com/assets/index.js"
```

#### 问题5.2: 前端资源加载失败
**症状**:
- CSS样式丢失
- JavaScript文件404
- 图片无法显示

**解决方案**:
```bash
# 检查nginx静态文件配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -T | grep -A 10 "location ~.*\.(css\|js"

# 清理nginx缓存
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload

# 重新部署前端
./deploy-frontend-hot.sh -e prod -s blue-green

# 检查静态文件路径
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/assets/

# 验证文件权限
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/

# 测试静态文件访问
curl -I "https://your-domain.com/assets/index.css"
curl -I "https://your-domain.com/favicon.ico"
```

### 6. 🔐 认证和权限问题

#### 问题6.1: JWT认证失败
**症状**:
- 用户无法登录
- Token验证失败
- 401 Unauthorized错误

**可能原因**:
- JWT密钥配置错误
- Token过期时间设置问题
- 系统时间不同步
- 插件配置问题

**解决方案**:
```bash
# 检查JWT配置
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
SELECT option_name, option_value FROM wp_options WHERE option_name LIKE '%jwt%';
"

# 测试登录接口
curl -X POST "https://your-domain.com/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' \
  -v

# 检查系统时间
date
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress date
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql date

# 更新JWT配置
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
UPDATE wp_options SET option_value='your-new-jwt-secret-key-2024' WHERE option_name='bjt_jwt_secret';
"

# 重启WordPress容器
docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress

# 验证插件状态
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress wp plugin list | grep jwt
```

#### 问题6.2: 用户权限异常
**症状**:
- 用户无法访问应有功能
- 权限检查失败
- 数据访问被拒绝

**解决方案**:
```bash
# 检查用户数据
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
SELECT id, username, email, role, status FROM wp_bjt_users;
"

# 重新导入测试用户
./rebuilddb_production_v2.sh

# 验证用户密码哈希
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
SELECT username, password FROM wp_bjt_users WHERE username = 'admin';
"

# 测试各角色用户登录
for user in admin sales_user customer_user; do
  echo "Testing $user..."
  curl -X POST "https://your-domain.com/wp-json/bjt/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$user\",\"password\":\"password123\"}"
done
```

### 7. 📊 性能和监控问题

#### 问题7.1: 响应速度慢
**症状**:
- 页面加载时间超过5秒
- API响应缓慢
- 数据库查询慢

**可能原因**:
- 服务器资源不足
- 数据库查询未优化
- 缓存配置不当
- 网络问题

**解决方案**:
```bash
# 监控系统资源
top
htop
docker stats

# 检查磁盘IO
iostat -x 1

# 监控内存使用
free -m
cat /proc/meminfo

# 检查数据库性能
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads%';
SHOW STATUS LIKE 'Questions';
SHOW STATUS LIKE 'Uptime';
"

# 启用慢查询日志
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 'ON';
"

# 优化数据库表
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "
ANALYZE TABLE wp_bjt_parts;
OPTIMIZE TABLE wp_bjt_parts;
ANALYZE TABLE wp_bjt_consumables;
OPTIMIZE TABLE wp_bjt_consumables;
"

# 检查nginx缓存
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -T | grep cache

# 测试响应时间
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com/"
```

#### 问题7.2: 内存泄漏
**症状**:
- 内存使用持续增长
- 系统变慢
- Out of Memory错误

**解决方案**:
```bash
# 监控容器内存使用
docker stats --no-stream

# 重启占用内存过多的容器
docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress

# 检查MySQL内存配置
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'max_connections';
"

# 清理系统缓存
sync && echo 3 > /proc/sys/vm/drop_caches

# 检查日志文件大小
du -sh /var/lib/docker/containers/*/*-json.log
```

### 8. 🔍 日志和调试

#### 问题8.1: 错误日志分析
**关键日志位置**:
```bash
# 容器日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress  
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# Nginx日志
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# WordPress日志
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress tail -f /var/www/html/wp-content/debug.log

# MySQL日志
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql tail -f /var/log/mysql/error.log
```

**常见错误模式**:
```bash
# 查找错误模式
docker-compose -f docker/prod/docker-compose.prod.yml logs | grep -i error
docker-compose -f docker/prod/docker-compose.prod.yml logs | grep -i "500\|502\|503\|504"
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx | grep " 4[0-9][0-9] \| 5[0-9][0-9] "

# 分析访问日志
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx awk '$9 >= 400 {print $0}' /var/log/nginx/access.log
```

#### 问题8.2: 性能监控
```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)"
    echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%"), $3/$2 * 100.0}')"
    echo "Disk: $(df / | tail -1 | awk '{print $5}')"
    echo "Containers:"
    docker-compose -f docker/prod/docker-compose.prod.yml ps | grep Up | wc -l
    echo "---"
    sleep 60
done
EOF

chmod +x monitor.sh
```

## 🛠️ 预防性措施

### 1. 部署前检查清单
```bash
#!/bin/bash
# pre-deploy-check.sh

echo "=== 部署前检查 ==="

# 检查磁盘空间（至少10GB可用）
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "❌ 磁盘空间不足: ${DISK_USAGE}%"
    exit 1
fi
echo "✅ 磁盘空间充足: ${DISK_USAGE}%"

# 检查内存（至少2GB可用）
MEMORY_FREE=$(free -m | grep Available | awk '{print $2}')
if [ $MEMORY_FREE -lt 2048 ]; then
    echo "❌ 可用内存不足: ${MEMORY_FREE}MB"
    exit 1
fi
echo "✅ 内存充足: ${MEMORY_FREE}MB"

# 检查端口
if netstat -tulpn | grep -q :80; then
    echo "❌ 端口80被占用"
    exit 1
fi
if netstat -tulpn | grep -q :443; then
    echo "❌ 端口443被占用"
    exit 1
fi
echo "✅ 端口可用"

# 检查环境配置
if [ ! -f ".env.production" ]; then
    echo "❌ 缺少 .env.production 文件"
    exit 1
fi
echo "✅ 环境配置存在"

# 检查SSL证书
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/private.key" ]; then
    echo "❌ SSL证书文件缺失"
    exit 1
fi
echo "✅ SSL证书存在"

# 验证docker-compose配置
if ! docker-compose -f docker/prod/docker-compose.prod.yml config > /dev/null; then
    echo "❌ Docker Compose配置错误"
    exit 1
fi
echo "✅ Docker Compose配置正确"

echo "✅ 所有检查通过，可以开始部署"
```

### 2. 自动监控脚本
```bash
#!/bin/bash
# health-monitor.sh

DOMAIN="your-domain.com"
EMAIL="admin@company.com"
LOG_FILE="/var/log/bjt-monitor.log"

log_message() {
    echo "[$(date)] $1" >> $LOG_FILE
}

send_alert() {
    echo "$1" | mail -s "BJT系统告警" $EMAIL
    log_message "ALERT: $1"
}

# 检查网站可访问性
if ! curl -f -s -m 10 "https://$DOMAIN" > /dev/null; then
    send_alert "网站无法访问: https://$DOMAIN"
fi

# 检查API接口
if ! curl -f -s -m 10 "https://$DOMAIN/wp-json/bjt/v1/" > /dev/null; then
    send_alert "API接口异常: https://$DOMAIN/wp-json/bjt/v1/"
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    send_alert "磁盘空间不足: ${DISK_USAGE}%"
fi

# 检查内存使用
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
if [ $(echo "$MEMORY_USAGE > 90" | bc) -eq 1 ]; then
    send_alert "内存使用过高: ${MEMORY_USAGE}%"
fi

# 检查容器状态
RUNNING_CONTAINERS=$(docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -c "Up")
if [ $RUNNING_CONTAINERS -lt 3 ]; then
    send_alert "容器状态异常，运行中容器数: $RUNNING_CONTAINERS"
fi

# 检查SSL证书过期
SSL_EXPIRE_DATE=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate | cut -d= -f2)
SSL_EXPIRE_TIMESTAMP=$(date -d "$SSL_EXPIRE_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_TO_EXPIRE=$(( (SSL_EXPIRE_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))

if [ $DAYS_TO_EXPIRE -lt 30 ]; then
    send_alert "SSL证书即将过期，剩余天数: $DAYS_TO_EXPIRE"
fi

log_message "健康检查完成"
```

### 3. 自动备份脚本
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/bjt-$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# 备份数据库
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$BACKUP_DIR/database.sql"

# 备份上传文件
tar -czf "$BACKUP_DIR/uploads.tar.gz" frontend/public/uploads/

# 备份配置文件
cp .env.production "$BACKUP_DIR/"
cp -r nginx/ssl "$BACKUP_DIR/"

# 清理旧备份
find /backup -name "bjt-*" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} +

echo "备份完成: $BACKUP_DIR"
```

### 4. 自动恢复脚本
```bash
#!/bin/bash
# auto-recovery.sh

LOG_FILE="/var/log/bjt-recovery.log"

log_message() {
    echo "[$(date)] $1" >> $LOG_FILE
}

# 检测并重启异常容器
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"
FAILED_SERVICES=$(docker-compose -f $COMPOSE_FILE ps | grep -v "Up" | awk 'NR>1 {print $1}')

if [ -n "$FAILED_SERVICES" ]; then
    log_message "发现异常容器: $FAILED_SERVICES"
    
    for service in $FAILED_SERVICES; do
        log_message "重启服务: $service"
        docker-compose -f $COMPOSE_FILE restart $service
        sleep 30
    done
    
    # 等待服务恢复
    sleep 60
    
    # 验证恢复结果
    if curl -f -s "https://your-domain.com" > /dev/null; then
        log_message "服务恢复成功"
    else
        log_message "服务恢复失败，需要手动干预"
        echo "BJT系统自动恢复失败，需要手动检查" | mail -s "自动恢复失败" admin@company.com
    fi
fi

# 清理磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    log_message "磁盘空间不足，开始清理"
    docker system prune -f
    docker volume prune -f
    log_message "磁盘清理完成"
fi
```

## 📞 紧急处理流程

### 第一级响应 (0-5分钟)
1. **确认问题**
   ```bash
   # 快速状态检查
   curl -I https://your-domain.com
   docker-compose -f docker/prod/docker-compose.prod.yml ps
   ```

2. **初步诊断**
   ```bash
   # 查看最新日志
   docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=50
   ```

### 第二级响应 (5-15分钟)
1. **详细诊断**
   ```bash
   # 系统资源检查
   df -h
   free -m
   docker stats --no-stream
   ```

2. **服务重启**
   ```bash
   # 快速重启
   docker-compose -f docker/prod/docker-compose.prod.yml restart
   ```

### 第三级响应 (15-30分钟)
1. **深度修复**
   ```bash
   # 数据库修复
   ./rebuilddb_production_v2.sh
   
   # 权限修复
   ./scripts/setup-uploads-permissions.sh --repair
   
   # 前端重部署
   ./deploy-frontend-hot.sh -e prod --force
   ```

2. **回滚计划**
   ```bash
   # 恢复备份
   docker-compose -f docker/prod/docker-compose.prod.yml down
   # 恢复最近的备份数据
   # 重新启动服务
   ```

### 第四级响应 (30分钟以上)
1. **根因分析**
2. **制定长期解决方案**
3. **更新预防措施**
4. **完善监控机制**

## 📋 故障报告模板

```markdown
# BJT系统故障报告

## 基本信息
- **故障时间**: 
- **影响范围**: 
- **严重程度**: [高/中/低]
- **发现方式**: [监控告警/用户反馈/例行检查]

## 故障描述
- **症状**: 
- **错误信息**: 
- **影响的功能**: 

## 诊断过程
- **检查步骤**: 
- **发现的问题**: 
- **初步原因**: 

## 解决方案
- **采取的措施**: 
- **修复时间**: 
- **验证结果**: 

## 根本原因
- **技术原因**: 
- **流程原因**: 
- **人为因素**: 

## 预防措施
- **短期措施**: 
- **长期措施**: 
- **监控改进**: 

## 经验教训
- **技术收获**: 
- **流程改进**: 
- **团队协作**: 
```

## 📚 相关文档

- [部署架构详解](DEPLOYMENT_ARCHITECTURE.md)
- [上传权限配置指南](UPLOADS_PERMISSIONS_GUIDE.md) 
- [测试用户指南](TEST_USERS_GUIDE.md)
- [生产环境部署检查清单](DEPLOYMENT_CHECKLIST.md)

---

**注意**: 本指南需要根据实际生产环境和运维经验持续更新完善。建议定期review和优化故障处理流程。 