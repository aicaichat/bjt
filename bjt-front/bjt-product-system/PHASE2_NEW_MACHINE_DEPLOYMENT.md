# 🚀 BJT产品系统 Phase-2 新开发机器完整部署指南

## 📋 目录
- [环境要求](#环境要求)
- [Docker配置检查](#docker配置检查)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [验证部署](#验证部署)
- [常见问题](#常见问题)
- [开发环境配置](#开发环境配置)

## 🔧 环境要求

### 系统要求
- **操作系统**: macOS 10.15+, Ubuntu 20.04+, CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **磁盘空间**: 至少5GB可用空间
- **内存**: 至少4GB RAM
- **端口**: 确保5173, 8080, 80, 3306端口未被占用

### 软件安装
```bash
# macOS (使用Homebrew)
brew install docker docker-compose git

# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose git

# CentOS/RHEL
sudo yum install docker docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
```

## 🐳 Docker配置检查

### ✅ 已支持的Docker配置

经过检查，Phase-2代码包含完整的Docker支持：

#### 1. 开发环境配置
- **文件位置**: `docker/dev/docker-compose.nginx.yml`
- **前端**: Node.js 18 + Vite开发服务器
- **后端**: WordPress + PHP 8.0
- **数据库**: MySQL 8.0
- **代理**: Nginx反向代理

#### 2. 生产环境配置
- **文件位置**: `docker/prod/docker-compose.prod.yml`
- **前端**: Nginx + 静态文件服务
- **后端**: WordPress + PHP 8.0 + Redis缓存
- **数据库**: MySQL 8.0
- **负载均衡**: Nginx负载均衡

#### 3. 自动部署脚本
- **文件位置**: `deploy-with-db-init.sh`
- **功能**: 自动数据库初始化 + 完整环境部署

### 🔍 Docker文件结构
```
docker/
├── dev/                          # 开发环境
│   ├── docker-compose.nginx.yml  # 开发环境配置
│   ├── deployment-guide.md       # 部署指南
│   ├── mysql/                    # MySQL配置
│   ├── nginx/                    # Nginx配置
│   └── wordpress/                # WordPress配置
├── prod/                         # 生产环境
│   ├── docker-compose.prod.yml   # 生产环境配置
│   ├── docker-compose.hot-deploy.yml
│   └── mysql/                    # 生产MySQL配置
├── frontend/                     # 前端Docker配置
├── mysql/                        # MySQL初始化
├── nginx/                        # Nginx配置
└── wordpress/                    # WordPress配置
```

## ⚡ 快速部署

### 方案一：一键自动部署（推荐）

```bash
# 1. 克隆代码
git clone <repository-url> bjt-product-system
cd bjt-product-system
git checkout phase-2

# 2. 给脚本执行权限
chmod +x deploy-with-db-init.sh

# 3. 执行自动部署
./deploy-with-db-init.sh
```

### 方案二：开发环境快速启动

```bash
# 1. 克隆代码
git clone <repository-url> bjt-product-system
cd bjt-product-system
git checkout phase-2

# 2. 启动开发环境
docker-compose -f docker/dev/docker-compose.nginx.yml up -d

# 3. 等待服务启动（约2-3分钟）
sleep 180

# 4. 验证部署
curl http://localhost:5173
```

## 📝 详细部署步骤

### 步骤1：环境准备

```bash
# 检查Docker版本
docker --version
docker-compose --version

# 检查端口占用
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3306 | xargs kill -9 2>/dev/null || true
```

### 步骤2：代码获取

```bash
# 克隆仓库
git clone <repository-url> bjt-product-system
cd bjt-product-system

# 切换到phase-2分支
git checkout phase-2
git pull origin phase-2

# 确认当前分支
git branch  # 应该显示 * phase-2
```

### 步骤3：环境配置

```bash
# 创建环境配置文件
cp .env.example .env.development 2>/dev/null || true

# 编辑环境配置
cat > .env.development << EOF
# 数据库配置
MYSQL_ROOT_PASSWORD=bjtpassword123
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress

# WordPress配置
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress
WORDPRESS_DB_CHARSET=utf8mb4
WORDPRESS_DB_COLLATE=utf8mb4_unicode_ci

# JWT配置
JWT_AUTH_SECRET_KEY=bjt-secret-key-2023

# 域名配置
DOMAIN_NAME=localhost
WP_HOME=http://localhost:8080
WP_SITEURL=http://localhost:8080

# 前端配置
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_MOCK_DATA=false
VITE_USE_PROXY=true
DOCKER_ENV=true
EOF
```

### 步骤4：数据库初始化

```bash
# 检查数据库初始化文件
ls -la docker/dev/mysql/
ls -la generated_sql_imports/

# 启动MySQL服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d mysql

# 等待MySQL就绪
echo "等待MySQL服务启动..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
        echo "✅ MySQL服务已启动"
        break
    fi
    echo -n "."
    sleep 2
    timeout=$((timeout-2))
done

# 验证数据库初始化
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

### 步骤5：启动完整服务

```bash
# 启动所有服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d

# 检查服务状态
docker-compose -f docker/dev/docker-compose.nginx.yml ps

# 查看服务日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs -f
```

### 步骤6：验证数据库数据

```bash
# 检查BJT表结构
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product -e "SHOW TABLES LIKE 'wp_bjt_%';"

# 检查关键数据
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product -e "
SELECT 'wp_bjt_product_lines' as table_name, COUNT(*) as count FROM wp_bjt_product_lines
UNION ALL
SELECT 'wp_bjt_consumables' as table_name, COUNT(*) as count FROM wp_bjt_consumables
UNION ALL
SELECT 'wp_bjt_users' as table_name, COUNT(*) as count FROM wp_bjt_users;"
```

## ✅ 验证部署

### 1. 服务状态检查

```bash
# 检查所有容器状态
docker-compose -f docker/dev/docker-compose.nginx.yml ps

# 应该看到以下服务运行：
# - mysql (3306端口)
# - wordpress (8080端口) 
# - nginx (80端口)
# - frontend (5173端口)
```

### 2. 访问测试

```bash
# 测试前端
curl -I http://localhost:5173

# 测试WordPress
curl -I http://localhost:8080

# 测试API
curl -I http://localhost:8080/wp-json/bjt/v1
```

### 3. 浏览器访问

- **前端应用**: http://localhost:5173
- **WordPress后台**: http://localhost:8080/wp-admin
- **API接口**: http://localhost:8080/wp-json/bjt/v1

### 4. 测试账号

| 用户类型 | 用户名 | 密码 | 说明 |
|---------|--------|------|------|
| 管理员 | admin | password123 | 完整权限 |
| 销售人员 | sales_user | password123 | 销售权限 |
| 合作伙伴 | partner_user | password123 | 合作伙伴权限 |
| 普通客户 | customer_user | password123 | 客户权限 |

## 🔧 开发环境配置

### 前端开发

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 后端开发

```bash
# WordPress插件开发
cd plugins/bjt-core-entities

# 查看API接口
curl http://localhost:8080/wp-json/bjt/v1/consumables
```

### 数据库开发

```bash
# 连接数据库
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product

# 查看表结构
SHOW TABLES LIKE 'wp_bjt_%';
```

## ⚠️ 常见问题

### 问题1：端口冲突

```bash
# 检查端口占用
lsof -i :5173
lsof -i :8080
lsof -i :3306

# 杀死占用进程
lsof -ti:5173 | xargs kill -9
lsof -ti:8080 | xargs kill -9
lsof -ti:3306 | xargs kill -9
```

### 问题2：MySQL连接失败

```bash
# 重启MySQL服务
docker-compose -f docker/dev/docker-compose.nginx.yml restart mysql

# 检查MySQL日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs mysql

# 手动连接测试
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1;"
```

### 问题3：前端编译错误

```bash
# 清理并重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install

# 重启前端服务
docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend
```

### 问题4：WordPress权限问题

```bash
# 修复文件权限
docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress chown -R www-data:www-data /var/www/html

# 重启WordPress服务
docker-compose -f docker/dev/docker-compose.nginx.yml restart wordpress
```

### 问题5：数据导入失败

```bash
# 清空数据库重新导入
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "DROP DATABASE IF EXISTS bjt_product; CREATE DATABASE bjt_product CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 重新启动服务（会自动重新导入数据）
docker-compose -f docker/dev/docker-compose.nginx.yml down
docker-compose -f docker/dev/docker-compose.nginx.yml up -d
```

## 🎯 部署成功标志

- ✅ 所有Docker容器正常运行
- ✅ 数据库包含完整的BJT表结构和数据
- ✅ 前端页面可以正常访问和登录
- ✅ API接口响应正常
- ✅ WordPress后台可以正常访问
- ✅ 测试账号可以正常登录

## 📞 技术支持

如果在部署过程中遇到问题：

1. **检查日志**: 查看相关容器日志
2. **验证配置**: 确认环境变量和配置文件正确
3. **重启服务**: 尝试重启相关服务
4. **联系团队**: 联系项目技术团队获取支持

---

**部署完成后，您就可以开始Phase-2功能的开发和测试了！** 🚀 