# 🚀 BJT产品系统 Phase-2分支 新开发机器部署指南

## 📖 概述

Phase-2分支包含大量数据库结构和数据的改动，本指南将帮助你在新的开发机器上完整部署Phase-2环境。

## 🔧 环境要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+  
- **Git**: 2.30+
- **磁盘空间**: 至少5GB可用空间
- **内存**: 至少4GB RAM
- **端口**: 确保5173, 8080, 80, 3306端口未被占用

## 📥 代码获取

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

## 🗄️ 数据库部署方案

### 方案一：全自动部署（推荐）

Phase-2包含完整的自动化部署脚本，会自动处理数据库初始化：

```bash
# 1. 给部署脚本执行权限
chmod +x deploy-with-db-init.sh
chmod +x rebuilddb_production_v2.sh

# 2. 执行自动部署（包含数据库初始化）
./deploy-with-db-init.sh
```

**自动部署包含以下步骤：**
- 创建Docker容器和网络
- 自动初始化MySQL数据库
- 导入数据库结构 (`docker/dev/mysql/init.sql`)
- 导入设备数据 (`generated_sql_imports/_设备.sql`)
- 导入耗材数据 (`generated_sql_imports/_耗材.sql`)
- 导入测试用户数据 (`docker/dev/mysql/test_users.sql`)
- 启动所有服务

### 方案二：手动步骤部署

如果自动部署失败，可以按步骤手动部署：

#### 步骤1：启动基础服务
```bash
# 启动MySQL和基础服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d mysql
```

#### 步骤2：等待MySQL就绪
```bash
# 等待MySQL服务完全启动
sleep 30

# 检查MySQL状态
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1"
```

#### 步骤3：手动初始化数据库
```bash
# 1. 创建数据库
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS bjt_product CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入数据库结构
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product < docker/dev/mysql/init.sql

# 3. 导入设备数据
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product < generated_sql_imports/_设备.sql

# 4. 导入耗材数据  
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product < generated_sql_imports/_耗材.sql

# 5. 导入测试用户
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product < docker/dev/mysql/test_users.sql
```

#### 步骤4：启动所有服务
```bash
# 启动所有服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d

# 检查服务状态
docker-compose -f docker/dev/docker-compose.nginx.yml ps
```

## 📊 数据库结构说明

Phase-2的主要数据库变更包括：

### 新增表结构
- `wp_bjt_product_lines` - 产品线管理
- `wp_bjt_host_models` - 主机型号
- `wp_bjt_accessory_models` - 配件型号  
- `wp_bjt_spare_part_models` - 备件型号
- `wp_bjt_consumables` - 耗材产品
- `wp_bjt_relations` - 产品关联关系
- `wp_bjt_users` - 用户管理
- `wp_bjt_orders` - 订单管理
- `wp_bjt_cart_items` - 购物车
- 等等...

### 核心数据文件
1. **`docker/dev/mysql/init.sql`** - 完整数据库结构
2. **`generated_sql_imports/_设备.sql`** - 设备基础数据（产品线、主机、配件、备件）
3. **`generated_sql_imports/_耗材.sql`** - 耗材基础数据
4. **`docker/dev/mysql/test_users.sql`** - 测试用户账号

## 🔍 部署验证

### 1. 检查服务状态
```bash
# 查看所有容器状态
docker-compose -f docker/dev/docker-compose.nginx.yml ps

# 应该看到以下服务运行：
# - mysql (3306端口)
# - wordpress (8080端口) 
# - nginx (80端口)
# - frontend (5173端口)
```

### 2. 检查数据库
```bash
# 连接数据库检查表结构
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product -e "SHOW TABLES LIKE 'wp_bjt_%';"

# 检查关键数据
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product -e "SELECT COUNT(*) as total_products FROM wp_bjt_consumables;"
```

### 3. 访问测试
- **前端**: http://localhost:5173
- **WordPress后台**: http://localhost:8080/wp-admin  
- **API接口**: http://localhost:8080/wp-json/bjt/v1

### 4. 测试账号
| 用户类型 | 用户名 | 密码 | 说明 |
|---------|--------|------|------|
| 管理员 | admin | password123 | 完整权限 |
| 销售人员 | sales_user | password123 | 销售权限 |
| 合作伙伴 | partner_user | password123 | 合作伙伴权限 |
| 普通客户 | customer_user | password123 | 客户权限 |

## ⚠️ 常见问题与解决方案

### 问题1：端口冲突
```bash
# 检查端口占用
lsof -ti:5173 | xargs kill -9  # 杀死5173端口进程
lsof -ti:8080 | xargs kill -9  # 杀死8080端口进程
lsof -ti:3306 | xargs kill -9  # 杀死3306端口进程
```

### 问题2：MySQL连接失败
```bash
# 重启MySQL服务
docker-compose -f docker/dev/docker-compose.nginx.yml restart mysql

# 检查MySQL日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs mysql
```

### 问题3：数据导入失败
```bash
# 清空数据库重新导入
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "DROP DATABASE IF EXISTS bjt_product;"

# 重新执行数据库初始化步骤
```

### 问题4：前端编译错误
```bash
# 进入前端目录重新安装依赖
cd frontend
npm install
npm run dev

# 或使用Docker重启前端服务
docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend
```

## 🔄 数据同步说明

### 从现有环境同步数据
如果需要从现有的phase-2环境同步最新数据：

```bash
# 1. 从现有环境导出数据
mysqldump -h <existing_host> -u <user> -p bjt_product > phase2_data_backup.sql

# 2. 导入到新环境
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} bjt_product < phase2_data_backup.sql
```

### 保持数据同步
```bash
# 定期从主环境同步数据（谨慎使用）
./scripts/sync-from-production.sh  # 如果有此脚本
```

## 📝 开发注意事项

### 环境变量配置
确保以下环境变量正确配置：
```bash
# .env文件示例
MYSQL_ROOT_PASSWORD=bjtpassword123
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress  
MYSQL_PASSWORD=wordpress
WORDPRESS_DB_HOST=mysql:3306
```

### 开发工作流
1. **前端开发**: 修改 `frontend/src/` 下的文件
2. **后端开发**: 修改 `plugins/bjt-core-entities/` 下的PHP文件
3. **数据库变更**: 创建迁移脚本并更新 `init.sql`

### 代码提交
```bash
# 提交前确保在正确分支
git branch  # 确认在 phase-2 分支

# 提交更改
git add .
git commit -m "feat: 描述你的更改"
git push origin phase-2
```

## 🎯 下一步

部署完成后，你可以：

1. **开始开发**: 环境已就绪，可以进行功能开发
2. **运行测试**: 使用测试账号验证功能
3. **查看文档**: 参考 `docs/phase-2/` 目录下的详细文档
4. **联系团队**: 如遇问题可联系项目团队获取支持

## 📞 技术支持

如果在部署过程中遇到问题：
1. 检查Docker和Docker Compose版本
2. 确认所有端口未被占用
3. 查看容器日志排查具体错误
4. 联系项目技术团队获取支持

---

**部署成功标志**: 
- ✅ 所有Docker容器正常运行
- ✅ 数据库包含完整的BJT表结构和数据
- ✅ 前端页面可以正常访问和登录
- ✅ API接口响应正常 