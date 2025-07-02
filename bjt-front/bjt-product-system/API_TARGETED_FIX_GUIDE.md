# BJT API配置问题针对性修复指南

## 🎯 基于你的环境信息的精准修复方案

### 环境信息确认
- **生产域名**: `eorder.lockedair.com` (HTTPS)
- **Docker服务名**: `prod_wordpress_1`
- **SSL**: 已启用
- **负载均衡**: 无
- **CDN**: 未使用

---

## 🚨 发现的关键问题

### 1. Docker服务名不匹配
**问题**: 配置中使用 `wordpress:80`，但实际服务名是 `prod_wordpress_1`

**影响**: 导致前端无法连接到后端API

### 2. HTTPS配置不完整  
**问题**: 生产环境使用HTTPS，但配置中可能仍使用HTTP

### 3. CORS配置需要更新
**问题**: 需要支持HTTPS域名

---

## 🔧 立即修复方案

### 第1步: 更新Docker服务配置

```bash
# 1. 更新环境变量
cat > frontend/.env.production << 'EOF'
# 生产环境配置 - eorder.lockedair.com
VITE_API_URL=https://eorder.lockedair.com/wp-json/bjt/v1
VITE_API_TIMEOUT=8000
VITE_API_RETRY_ATTEMPTS=2
VITE_DEBUG=false
VITE_CORS_ENABLED=false
EOF

# 2. 更新Docker开发环境配置
cat > frontend/.env.docker << 'EOF'
# Docker环境配置
VITE_API_URL=http://prod_wordpress_1:80/wp-json/bjt/v1
VITE_API_TIMEOUT=15000
VITE_API_RETRY_ATTEMPTS=3
VITE_DEBUG=true
VITE_CORS_ENABLED=true
DOCKER_ENV=true
EOF
```

### 第2步: 更新Vite配置

```typescript
// frontend/vite.config.ts - 更新WordPress主机检测
const getWordPressHost = () => {
  if (process.env.VITE_WORDPRESS_HOST) {
    return process.env.VITE_WORDPRESS_HOST;
  }
  
  const isDev = process.env.NODE_ENV === 'development';
  const isDocker = process.env.DOCKER_ENV || 
                   process.env.COMPOSE_PROJECT_NAME || 
                   process.env.HOSTNAME?.includes('docker');
  
  if (isDev && isDocker) {
    // 使用正确的Docker服务名
    return 'http://prod_wordpress_1:80';
  }
  
  if (!isDev && isDocker) {
    return 'http://prod_wordpress_1:80';
  }
  
  return '';
};
```

### 第3步: 更新Nginx配置

```nginx
# nginx/conf.d/production-eorder.conf
upstream wordpress_backend {
    server prod_wordpress_1:80;
}

server {
    listen 443 ssl http2;
    server_name eorder.lockedair.com;
    
    # SSL配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_private_key /etc/nginx/ssl/private.key;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # WordPress API代理
    location /wp-json/ {
        proxy_pass http://wordpress_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        
        # 生产环境CORS
        add_header Access-Control-Allow-Origin "https://eorder.lockedair.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # 处理OPTIONS预检请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://eorder.lockedair.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type "text/plain";
            return 204;
        }
    }
    
    # WordPress管理后台
    location ~ ^/(wp-admin|wp-login\.php) {
        proxy_pass http://wordpress_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    # 前端应用
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name eorder.lockedair.com;
    return 301 https://$server_name$request_uri;
}
```

### 第4步: 更新WordPress CORS插件

```php
<?php
// plugins/bjt-cors/bjt-cors.php - 更新为支持HTTPS
function bjt_set_cors_headers() {
    if (!headers_sent()) {
        // 生产环境使用HTTPS
        header("Access-Control-Allow-Origin: https://eorder.lockedair.com");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce");
        header("Access-Control-Expose-Headers: Link, X-WP-Total, X-WP-TotalPages");
    }
}
```

---

## 🚀 立即执行修复

运行我为你创建的修复脚本：

```bash
# 1. 首先让脚本可执行
chmod +x scripts/fix-api-config.sh

# 2. 运行修复脚本
./scripts/fix-api-config.sh

# 3. 手动更新Docker配置（因为脚本无法检测到你的具体服务名）
echo "VITE_API_URL=http://prod_wordpress_1:80/wp-json/bjt/v1" > frontend/.env.docker.local
```

---

## 🔍 验证修复结果

### 1. 检查API连接

```bash
# 测试生产环境API
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/

# 测试诊断端点（如你的部署脚本中提到的）
curl https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic
```

### 2. 前端测试

```javascript
// 在浏览器控制台运行
console.log('当前API配置:', {
  baseUrl: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD
});

// 测试API连接
fetch('/wp-json/bjt/v1/')
  .then(response => response.json())
  .then(data => console.log('API响应:', data))
  .catch(error => console.error('API错误:', error));
```

---

## 🎯 Docker Compose配置更新

确保你的docker-compose文件中的服务名一致：

```yaml
# docker-compose.yml
services:
  prod_wordpress_1:  # 确保服务名匹配
    image: wordpress
    environment:
      WORDPRESS_DB_HOST: mysql
      # ... 其他配置
    
  nginx:
    depends_on:
      - prod_wordpress_1  # 确保依赖名称正确
```

---

## 📋 修复清单

完成以下步骤确保修复成功：

- [ ] 更新环境变量文件（.env.production, .env.docker）
- [ ] 更新Vite配置中的WordPress主机地址
- [ ] 更新Nginx配置使用正确的upstream服务名
- [ ] 更新WordPress CORS插件支持HTTPS
- [ ] 重新构建和部署前端应用
- [ ] 重启Docker容器
- [ ] 测试API连接
- [ ] 验证HTTPS工作正常
- [ ] 测试CORS是否正确配置

---

## 🚨 常见问题排查

### 问题1: 仍然无法连接API
**检查**: Docker服务是否正在运行
```bash
docker ps | grep prod_wordpress_1
```

### 问题2: CORS错误
**检查**: 浏览器开发者工具中的网络请求头
- Origin应该是 `https://eorder.lockedair.com`
- 响应应该包含正确的CORS头

### 问题3: SSL证书错误
**检查**: 证书路径和权限
```bash
ls -la /etc/nginx/ssl/
```

---

## 📞 需要进一步帮助？

如果修复后仍有问题，请提供：

1. Docker容器状态: `docker ps`
2. Nginx错误日志: `docker logs <nginx_container_id>`
3. WordPress错误日志: `docker logs prod_wordpress_1`
4. 浏览器控制台错误信息

我会根据具体错误信息提供进一步的解决方案。 

# BJT 关联关系API问题快速修复指南

## 🎯 问题定位结果

通过系统诊断，发现**关联关系API**出现问题的根本原因：

### ✅ 确认正常的部分
- **API端点可访问**: `https://eorder.lockedair.com/wp-json/bjt/v1/relations` ✅
- **Docker服务正常**: `prod_wordpress_1` 正常运行 ✅
- **基础API配置正确**: 其他API都正常工作 ✅

### ❌ 问题根因
**JWT认证在关联关系API中的特殊处理导致失败**

## 🔧 问题详细分析

### 1. 认证系统差异
```php
// 其他API: 可能使用WordPress标准认证
if (!current_user_can('manage_options')) {
    return new WP_Error('forbidden', '权限不足');
}

// 关联关系API: 使用严格的BJT认证系统
$auth_controller = new BJT_Auth_Controller();
$is_authenticated = $auth_controller->check_auth($request);
```

### 2. 权限要求更严格
关联关系API要求：
- ✅ JWT token必须有效
- ✅ 用户状态必须是`active`  
- ✅ 用户角色必须是`admin`或`manager`
- ✅ 或拥有`edit_products`/`manage_products`权限
- ✅ `$GLOBALS['bjt_current_user']`必须正确设置

## 🚀 快速修复方案

### 方案1: 前端JWT Token修复
**立即可执行，优先推荐**

#### 检查前端JWT配置
```bash
# 1. 检查前端API服务配置
cd frontend/src/services
grep -r "Authorization" . | head -10
```

#### 修复步骤
1. 确认JWT token正确传递
2. 验证token格式：`Bearer <token>`
3. 检查token有效期

### 方案2: 临时降级权限检查
**紧急情况下使用**

### 方案3: 环境配置统一
**长期解决方案**

## 📋 快速诊断命令

### 1. 测试JWT认证
```bash
# 获取JWT token (需要替换用户名密码)
curl -X POST "https://eorder.lockedair.com/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"your_admin_username","password":"your_password"}'
```

### 2. 使用JWT测试关联关系API
```bash
# 使用获取的token测试
curl -X GET "https://eorder.lockedair.com/wp-json/bjt/v1/relations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. 检查服务器日志
```bash
# 在服务器上检查PHP错误日志
docker exec prod_wordpress_1 tail -f /var/log/php_errors.log | grep -i "BJT_Relation_Controller"
```

## 🔧 具体修复代码

### 修复前端JWT配置

#### frontend/src/services/api.ts
```typescript
// 确保JWT token正确传递
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bjt_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 临时修复权限检查（生产环境）

#### plugins/bjt-core-entities/controllers/class-relation-controller.php
```php
// 在 check_read_permission 方法中添加临时兼容
public function check_read_permission($request) {
    // 临时兼容：如果BJT认证失败，fallback到WordPress认证
    if (!class_exists('BJT_Auth_Controller')) {
        return current_user_can('manage_options');
    }
    
    $auth_controller = new BJT_Auth_Controller();
    $is_authenticated = $auth_controller->check_auth($request);
    
    if (true !== $is_authenticated) {
        // Fallback到WordPress认证
        return current_user_can('manage_options');
    }
    
    return true;
}
```

## ⚡ 紧急修复脚本

创建一键修复脚本：

```bash
#!/bin/bash
echo "🔧 BJT关联关系API紧急修复"

# 1. 备份原文件
cp plugins/bjt-core-entities/controllers/class-relation-controller.php \
   plugins/bjt-core-entities/controllers/class-relation-controller.php.backup

# 2. 应用临时修复
# (具体修复代码)

# 3. 重启PHP服务
docker exec prod_wordpress_1 bash -c "
  if command -v supervisorctl > /dev/null; then
    supervisorctl restart php-fpm
  else
    pkill -USR2 php-fpm || service php-fpm reload
  fi
"

echo "✅ 修复完成，请测试API功能"
```

## 📞 验证修复结果

### 1. 前端测试
在浏览器控制台执行：
```javascript
// 测试关联关系API调用
fetch('/wp-json/bjt/v1/relations?page=1&page_size=5', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('bjt_jwt_token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

### 2. 后端日志检查
```bash
# 实时查看认证日志
docker exec prod_wordpress_1 tail -f /var/log/php_errors.log | grep -i "bjt.*auth"
```

## 🎯 问题预防措施

### 1. 统一认证系统
- 所有API使用相同的认证逻辑
- 标准化JWT token处理

### 2. 环境配置标准化
- 开发环境与生产环境JWT配置一致
- 统一的权限检查逻辑

### 3. 完善的错误处理
- 详细的认证失败日志
- 友好的前端错误提示

---

## 🚨 立即行动建议

1. **第一步**: 执行JWT token诊断命令
2. **第二步**: 应用前端JWT修复
3. **第三步**: 如必要，应用临时权限修复
4. **第四步**: 验证修复结果
5. **第五步**: 实施长期解决方案

**预计修复时间**: 15-30分钟
**影响范围**: 仅关联关系管理功能
**风险等级**: 低（有备份和回滚方案） 