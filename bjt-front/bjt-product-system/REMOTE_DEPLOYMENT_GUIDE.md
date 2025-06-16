# 🚀 远程服务器数据库修复指南

## 📋 执行步骤

### 1. 上传文件到远程服务器

将以下文件上传到远程服务器：
```bash
# 上传到远程服务器的项目目录
scp scripts/remote-database-fix.sh user@remote-server:/path/to/project/
scp scripts/remote-database-fix.sql user@remote-server:/path/to/project/scripts/
```

### 2. 连接到远程服务器

```bash
ssh user@remote-server
cd /path/to/project/
```

### 3. 检查Docker环境

```bash
# 检查Docker是否运行
docker ps

# 查找MySQL容器
docker ps | grep mysql
```

### 4. 执行修复脚本

```bash
# 赋予执行权限
chmod +x scripts/remote-database-fix.sh

# 执行修复
./scripts/remote-database-fix.sh
```

## 🔧 手动执行方式（如果脚本有问题）

### 1. 找到MySQL容器

```bash
# 列出所有运行的容器
docker ps

# 常见的MySQL容器名：
# - dev-mysql-1
# - mysql
# - bjt-mysql
# - wordpress-mysql
```

### 2. 测试数据库连接

```bash
# 替换 CONTAINER_NAME 为实际容器名
docker exec CONTAINER_NAME mysql -uroot -proot -e "SELECT 1;"

# 如果密码不是root，尝试其他常见密码：
docker exec CONTAINER_NAME mysql -uroot -ppassword -e "SELECT 1;"
```

### 3. 检查当前数据

```bash
# 检查耗材数量
docker exec CONTAINER_NAME mysql -uroot -proot -Dbjt_product -e "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish';"

# 检查当前bag_type分布
docker exec CONTAINER_NAME mysql -uroot -proot -Dbjt_product -e "SELECT bag_type, COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type;"
```

### 4. 执行修复SQL

```bash
# 将SQL文件复制到容器
docker cp scripts/remote-database-fix.sql CONTAINER_NAME:/tmp/fix.sql

# 执行修复
docker exec CONTAINER_NAME mysql -uroot -proot -Dbjt_product -e "source /tmp/fix.sql"
```

### 5. 验证修复结果

```bash
# 检查修复后的数据分布
docker exec CONTAINER_NAME mysql -uroot -proot -Dbjt_product -e "SELECT bag_type, COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type;"
```

## 🎯 预期修复结果

修复前（内部代码格式）：
```
bag_type | count
---------|------
MEX      | 22
MFB      | 15
MFC      | 7
MEY      | 5
MFF      | 1
```

修复后（前端期望格式）：
```
bag_type           | count
-------------------|------
Pillow             | 22
paper Bubble       | 15
Tube               | 7
Precut Air Pillow  | 5
Bubble             | 1
```

## 🔙 回滚方法

如果修复有问题，可以回滚：

```bash
# 方法1：使用备份表回滚
docker exec CONTAINER_NAME mysql -uroot -proot -Dbjt_product -e "
DROP TABLE wp_bjt_consumables;
RENAME TABLE wp_bjt_consumables_backup_remote TO wp_bjt_consumables;
"

# 方法2：从备份文件恢复
docker exec -i CONTAINER_NAME mysql -uroot -proot -Dbjt_product < /tmp/bjt_remote_backup_TIMESTAMP/consumables_backup.sql
```

## 🚨 常见问题解决

### 问题1：找不到MySQL容器
```bash
# 检查所有容器（包括停止的）
docker ps -a

# 启动停止的容器
docker start CONTAINER_NAME
```

### 问题2：MySQL连接被拒绝
```bash
# 检查容器日志
docker logs CONTAINER_NAME

# 尝试不同的连接参数
docker exec CONTAINER_NAME mysql -uroot -p
```

### 问题3：数据库不存在
```bash
# 列出所有数据库
docker exec CONTAINER_NAME mysql -uroot -proot -e "SHOW DATABASES;"

# 可能的数据库名：
# - bjt_product
# - wordpress
# - wp_bjt
```

## 📞 支持联系

如果遇到问题，请提供以下信息：
1. `docker ps` 的输出
2. 错误信息截图
3. 当前数据库连接参数

执行完成后，前端的筛选功能应该能正常工作了！ 