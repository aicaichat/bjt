# 数据丢失根本原因分析

## 🔴 **问题确认**

**是的，在清理磁盘空间时，我们不小心删除了数据库数据！**

## 💥 **问题发生过程**

### 时间线回顾

1. **磁盘空间告急** (磁盘使用率 91%)
   ```bash
   df -h
   # /dev/vda1  40G  36G  1.8G  91% /
   ```

2. **执行清理脚本** (`scripts/cleanup-disk-space.sh`)
   
   脚本执行了以下操作：
   ```bash
   # 停止容器
   docker container prune -f
   
   # 删除未使用的镜像
   docker image prune -a -f
   
   # ⚠️ 关键错误：删除未使用的 volumes
   docker volume prune -f   # 第 42 行
   ```

3. **致命错误**
   - 容器停止后，`prod_mysql_data` volume 变成"未使用"状态
   - `docker volume prune -f` 将其删除
   - **所有 MySQL 数据永久丢失**

## 🔍 **为什么会发生这个问题？**

### 问题 1: 清理脚本设计缺陷

**原始脚本** (`scripts/cleanup-disk-space.sh:42`):
```bash
echo "清理未使用的卷..."
docker volume prune -f  # ❌ 危险！会删除所有未使用的 volumes
```

**正确的做法**应该是：
```bash
# ✅ 安全方式：明确排除数据库 volumes
docker volume prune -f --filter "label!=com.docker.compose.project=prod"

# 或者完全不清理 volumes
# docker volume prune -f  # 注释掉
```

### 问题 2: Docker Compose 配置问题

在 `docker-compose.prod.yml` 中，volume 定义正确：
```yaml
volumes:
  mysql_data:
    driver: local
```

但是**没有添加保护标签**来防止误删。应该这样：
```yaml
volumes:
  mysql_data:
    driver: local
    labels:
      - "bjt.protection=keep"
      - "bjt.data=critical"
```

### 问题 3: 没有备份策略

- 没有定期数据库备份
- 没有 volume 快照
- 没有冗余存储

## 📊 **数据丢失确认方法**

请在服务器上运行验证脚本：

```bash
# 上传验证脚本
cd /var/bjt/www/bjt/bjt-front/bjt-product-system

# 运行验证
bash scripts/verify-data-loss.sh
```

### 判断标准：

1. **如果 `prod_mysql_data` volume 创建时间是最近的（清理之后）**
   - ✅ 确认：数据已丢失
   
2. **如果 volume 大小 < 100MB**
   - ✅ 确认：数据已丢失（空数据库）
   
3. **如果 `SHOW TABLES` 返回 0 个或很少表**
   - ✅ 确认：数据已丢失

## 💾 **恢复方案**

### 方案 A: 从备份恢复（如果有）

```bash
# 检查是否有备份
ls -lh /var/bjt/backups/mysql/*.sql
docker volume ls | grep backup

# 如果有备份，恢复
docker-compose exec mysql mysql -u root -p bjt < /backup/latest.sql
```

### 方案 B: 重新初始化（如果无备份）

**由于数据已丢失，需要：**

1. **重建数据库表结构**
   ```bash
   # db-init 服务会自动创建表
   docker-compose up db-init
   ```

2. **创建管理员用户**
   ```sql
   INSERT INTO wp_bjt_users (username, password, email, role, status) 
   VALUES (
     'admin', 
     MD5('BJTeorder601'),  -- 或使用 password_hash()
     'admin@example.com',
     'admin',
     'active'
   );
   ```

3. **重新导入业务数据**（如果有其他来源）

### 方案 C: 联系云服务商（最后希望）

某些云服务商可能有：
- 自动快照
- Volume 回收站（30天内）
- 存储层备份

**立即操作**：
```bash
# 阿里云 - 检查快照
aliyun ecs DescribeSnapshots

# 查看是否有自动备份策略
# 登录阿里云控制台 -> ECS -> 快照 -> 自动快照策略
```

## 🛡️ **预防措施（必须立即实施）**

### 1. 修复清理脚本

```bash
# 永久禁用 volume 清理
sed -i 's/docker volume prune -f/# docker volume prune -f  # DISABLED for safety/' scripts/cleanup-disk-space.sh

# 或者添加保护过滤器
sed -i 's/docker volume prune -f/docker volume prune -f --filter "label!=bjt.data=critical"/' scripts/cleanup-disk-space.sh
```

### 2. 添加 Volume 保护

修改 `docker-compose.prod.yml`：
```yaml
volumes:
  mysql_data:
    driver: local
    labels:
      - "bjt.data=critical"
      - "bjt.protection=keep"
  
  redis_data:
    driver: local
    labels:
      - "bjt.data=critical"
      - "bjt.protection=keep"
```

### 3. 设置自动备份

创建 cron job：
```bash
# 每天凌晨 2 点备份数据库
0 2 * * * docker-compose -f /var/bjt/www/bjt/bjt-front/bjt-product-system/docker/prod/docker-compose.prod.yml exec -T mysql mysqldump -u root -p'password' bjt > /var/bjt/backups/mysql/bjt_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### 4. 添加备份验证

```bash
# 测试备份恢复（每周）
0 3 * * 0 bash /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/test-backup-restore.sh
```

## 📝 **经验教训**

1. **永远不要在生产环境运行 `docker volume prune`**
2. **清理脚本必须经过充分测试**
3. **关键数据必须有多重备份**
4. **使用 volume labels 保护重要数据**
5. **定期验证备份可用性**

## ⚠️ **下次清理的安全方式**

```bash
# 1. 只清理构建缓存（最安全）
docker builder prune -a -f

# 2. 清理未使用的镜像
docker image prune -a -f

# 3. 清理停止的容器
docker container prune -f

# 4. 清理未使用的网络
docker network prune -f

# 5. ❌ 永远不要清理 volumes（除非明确知道在做什么）
# docker volume prune -f  # 禁用
```

## 🚨 **立即行动清单**

- [ ] 运行 `scripts/verify-data-loss.sh` 确认数据状态
- [ ] 检查阿里云是否有自动快照
- [ ] 如果有备份，立即恢复
- [ ] 如果无备份，准备重新初始化数据库
- [ ] 修复所有清理脚本，移除 `volume prune`
- [ ] 添加 volume 保护标签
- [ ] 设置自动备份策略
- [ ] 建立备份验证机制

