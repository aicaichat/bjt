# 🗄️ 数据库自动初始化功能

## 📖 概述

BJT产品管理系统现在支持在Docker构建和部署时自动初始化数据库，包括：
- 数据库结构创建
- 基础数据导入
- 设备数据导入
- 耗材数据导入

## 🚀 功能特性

### ✅ 自动化初始化
- 首次部署时自动创建数据库结构
- 自动导入Excel转换的SQL数据
- 智能检测是否已初始化，避免重复执行

### ✅ 数据完整性
- 包含完整的BJT产品管理系统表结构
- 导入设备和耗材的基础数据
- 支持增量数据更新

### ✅ 容错机制
- 文件不存在时给出警告但不中断部署
- 数据库连接失败时自动重试
- 初始化失败时提供详细错误信息

---

## 📁 文件结构

```
bjt-product-system/
├── docker/
│   └── mysql/
│       ├── init-db.sh              # 数据库初始化脚本
│       └── Dockerfile.init         # 初始化容器Dockerfile
├── docker/dev/mysql/
│   └── init.sql                    # 数据库结构SQL
├── generated_sql_imports/
│   ├── _设备.sql                   # 设备数据SQL
│   └── _耗材.sql                   # 耗材数据SQL
└── deploy-with-db-init.sh          # 包含数据库初始化的部署脚本
```

---

## 🔧 使用方法

### 方法一：使用新的部署脚本（推荐）

```bash
# 给脚本执行权限
chmod +x deploy-with-db-init.sh

# 执行包含数据库初始化的部署
./deploy-with-db-init.sh
```

### 方法二：使用标准部署脚本

标准的部署脚本（`deploy.sh`、`deploy-ip.sh`）现在也包含了数据库自动初始化功能：

```bash
# 域名部署
./deploy.sh

# IP地址部署
./deploy-ip.sh

# 本地部署
docker-compose -f docker/prod/docker-compose.local.yml up -d
```

---

## 📋 初始化流程

### 1. 服务启动顺序
```
MySQL容器启动 → 数据库初始化服务 → WordPress容器 → Nginx容器
```

### 2. 初始化步骤
1. **等待MySQL服务就绪**
2. **检查是否已初始化**（通过检查`wp_bjt_product_lines`表）
3. **创建数据库**（如果不存在）
4. **导入数据库结构**（`init.sql`）
5. **导入设备数据**（`_设备.sql`）
6. **导入耗材数据**（`_耗材.sql`）
7. **验证初始化结果**

### 3. 初始化检查
- 检查BJT相关表的数量
- 验证关键表是否存在
- 输出详细的初始化日志

---

## 🔍 监控和调试

### 查看初始化日志
```bash
# 查看数据库初始化服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs db-init

# 查看MySQL容器日志
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# 实时查看所有日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f
```

### 检查初始化状态
```bash
# 检查容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 进入MySQL容器检查数据
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 在MySQL中检查表
mysql> USE bjt_product;
mysql> SHOW TABLES LIKE 'wp_bjt_%';
mysql> SELECT COUNT(*) FROM wp_bjt_product_lines;
```

---

## 🛠️ 自定义配置

### 添加自定义初始化数据

1. **创建SQL文件**
   ```bash
   # 将自定义SQL文件放在 generated_sql_imports/ 目录
   cp your-custom-data.sql generated_sql_imports/
   ```

2. **更新Docker Compose配置**
   ```yaml
   # 在mysql服务的volumes中添加
   - ../../generated_sql_imports/your-custom-data.sql:/docker-entrypoint-initdb.d/04-custom.sql:ro
   ```

3. **更新初始化脚本**
   ```bash
   # 在 docker/mysql/init-db.sh 中添加导入逻辑
   if [ -f "/docker-entrypoint-initdb.d/your-custom-data.sql" ]; then
       echo "导入自定义数据..."
       mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/your-custom-data.sql
   fi
   ```

### 修改初始化行为

编辑 `docker/mysql/init-db.sh` 文件：

```bash
# 跳过某些数据导入
SKIP_DEVICES=false
SKIP_CONSUMABLES=false

# 添加额外的验证
REQUIRED_TABLES=("wp_bjt_product_lines" "wp_bjt_parts" "wp_bjt_accessories")

# 自定义初始化完成后的操作
post_init_actions() {
    echo "执行自定义初始化后操作..."
    # 添加你的自定义逻辑
}
```

---

## ⚠️ 注意事项

### 数据安全
- 初始化只在首次部署时执行
- 已有数据不会被覆盖
- 建议在生产环境部署前备份数据

### 文件依赖
- 确保 `docker/dev/mysql/init.sql` 文件存在
- 确保 `generated_sql_imports/` 目录下有相应的SQL文件
- 文件不存在时会显示警告但不会中断部署

### 性能考虑
- 大量数据导入可能需要较长时间
- 可以通过调整MySQL配置优化导入速度
- 建议在低峰期进行初始化

---

## 🔧 故障排除

### 常见问题

#### 1. 初始化超时
```bash
# 检查MySQL容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps mysql

# 检查MySQL日志
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# 增加超时时间（在脚本中修改）
timeout=300  # 增加到5分钟
```

#### 2. SQL文件导入失败
```bash
# 检查SQL文件语法
mysql -u root -p < generated_sql_imports/_设备.sql

# 检查文件编码
file generated_sql_imports/_设备.sql

# 检查文件权限
ls -la generated_sql_imports/
```

#### 3. 数据库连接失败
```bash
# 检查环境变量
cat .env.production | grep MYSQL

# 检查网络连接
docker-compose -f docker/prod/docker-compose.prod.yml exec db-init ping mysql

# 手动测试连接
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u wordpress -p
```

### 重新初始化数据库

如果需要重新初始化数据库：

```bash
# 1. 停止所有服务
docker-compose -f docker/prod/docker-compose.prod.yml down

# 2. 删除数据库卷（注意：这会删除所有数据）
docker volume rm bjt-product-system_mysql_data

# 3. 重新启动服务
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 4. 查看初始化日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f db-init
```

---

## 📈 性能优化

### MySQL配置优化
```bash
# 在 docker/mysql/conf.d/mysql.cnf 中添加
[mysqld]
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
max_allowed_packet = 64M
bulk_insert_buffer_size = 64M
```

### 导入速度优化
```sql
-- 在SQL文件开头添加
SET autocommit = 0;
SET unique_checks = 0;
SET foreign_key_checks = 0;

-- 在SQL文件结尾添加
SET foreign_key_checks = 1;
SET unique_checks = 1;
COMMIT;
```

---

## 🎯 最佳实践

1. **定期备份**：在初始化前自动备份现有数据
2. **版本控制**：将SQL文件纳入版本控制
3. **测试验证**：在测试环境验证初始化脚本
4. **监控日志**：定期检查初始化日志
5. **文档更新**：及时更新数据结构文档

通过数据库自动初始化功能，BJT产品管理系统的部署变得更加简单和可靠！🚀 