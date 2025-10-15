# 数据库表丢失原因分析

## 🔍 可能的原因

### 1. **Docker Volume 数据丢失** ⚠️ 最可能
在重新部署时，如果执行了 `docker-compose down -v`（带 `-v` 参数），会删除所有 volumes，包括数据库数据。

**证据：**
- 之前磁盘空间满了（91% 使用率）
- 执行了大量清理操作
- 可能在清理过程中误删了 volume

**检查方法：**
```bash
# 查看当前 volumes
docker volume ls | grep prod

# 查看 mysql 数据 volume 的创建时间
docker volume inspect prod_mysql_data
```

### 2. **db-init 服务覆盖了数据** 
`db-init` 服务在启动时会执行数据库初始化脚本。如果脚本中有 `DROP TABLE` 或 `TRUNCATE` 语句，可能会清空表。

**证据：**
- Docker Compose 配置中有 `db-init` 服务
- 之前日志显示：`ERROR 1050 (42S01): Table 'wp_bjt_accessories' already exists`
- 这说明 `db-init` 试图创建已存在的表

**检查方法：**
```bash
# 查看初始化脚本内容
cat docker/mysql/init-db.sh
ls -la docker/mysql/init/
```

### 3. **MySQL 容器重启时数据未持久化**
如果 volume 挂载配置错误，MySQL 重启时数据可能丢失。

**检查 docker-compose.prod.yml：**
```yaml
mysql:
  volumes:
    - mysql_data:/var/lib/mysql  # ✅ 正确：使用 named volume
    # ❌ 错误示例：./data:/var/lib/mysql（如果 ./data 被删除）
```

### 4. **数据库文件损坏**
磁盘空间耗尽时，MySQL 正在写入数据，可能导致数据文件损坏。

**症状：**
- 表结构存在但数据丢失
- MySQL 日志中有错误信息

### 5. **环境变量配置错误导致连接到空数据库**
如果 `.env.production` 文件丢失或配置错误，可能连接到了不同的数据库。

**检查：**
```bash
# 查看当前连接的数据库
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
docker-compose exec mysql mysql -u root -p -e "USE bjt; SHOW TABLES;"
```

## 📊 时间线回顾

1. **磁盘空间危机**
   - 磁盘使用率 91%
   - 执行了大量清理操作（Docker、npm、日志等）
   - 清理后降至 18%

2. **重新部署**
   - 停止所有容器
   - 可能执行了 `docker-compose down -v` 或 volume 清理
   - 重新启动服务

3. **结果**
   - WordPress 返回 500 错误
   - 数据库连接失败
   - 用户表丢失

## 🛡️ 如何确认数据是否完全丢失

### 方法 1：检查 MySQL Volume
```bash
# 1. 查看 volume 信息
docker volume inspect prod_mysql_data

# 2. 查看 volume 创建时间（如果是今天创建，说明数据已丢失）
docker volume inspect prod_mysql_data | grep CreatedAt

# 3. 查看 volume 数据大小
docker volume inspect prod_mysql_data | grep Mountpoint
sudo du -sh /var/lib/docker/volumes/prod_mysql_data/_data
```

### 方法 2：检查数据库内容
```bash
# 进入 MySQL 容器
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec mysql bash

# 在容器内执行
mysql -u root -p
USE bjt;
SHOW TABLES;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'bjt';
```

### 方法 3：检查备份
```bash
# 查看是否有数据库备份
ls -lh /var/bjt/backups/mysql/ 2>/dev/null
docker volume ls | grep backup
```

## 💾 数据恢复方案

### 如果有备份：
1. 从备份恢复（推荐）
2. 查看 `mysql-backup` 服务的备份文件

### 如果没有备份：
1. **检查是否真的丢失了数据**（见上述确认方法）
2. **如果确认丢失**，需要：
   - 重新初始化数据库表结构
   - 重新创建管理员用户
   - 重新导入业务数据（如果有）

## 🔐 预防措施

### 1. 定期备份
```bash
# 添加自动备份 cron job
0 2 * * * docker-compose -f /path/to/docker-compose.prod.yml exec mysql-backup /backup.sh
```

### 2. 使用 Named Volumes（已配置）
```yaml
volumes:
  mysql_data:
    driver: local
```

### 3. 永远不要使用 `docker-compose down -v`
```bash
# ❌ 危险：会删除所有数据
docker-compose down -v

# ✅ 安全：只停止容器
docker-compose down

# ✅ 安全：重启容器
docker-compose restart
```

### 4. 磁盘空间监控
```bash
# 添加磁盘空间监控脚本
*/30 * * * * df -h | grep -E '^/dev/' | awk '{if ($5+0 > 80) print "警告：磁盘使用率超过80%"}'
```

## 📝 下一步行动

请在服务器上运行以下诊断脚本，我们会根据结果确定数据是否真的丢失：

```bash
# 上传并运行诊断脚本
bash scripts/check-user-table.sh
```

如果数据确实丢失，我会帮您：
1. 重新创建数据库表结构
2. 创建管理员用户
3. 设置数据保护措施

