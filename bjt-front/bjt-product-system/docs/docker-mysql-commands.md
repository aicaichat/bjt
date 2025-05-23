# Docker MySQL 常用命令

## 重置数据库为init.sql初始状态（最干净）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml down -v && docker-compose -f docker/dev/docker-compose.dev.yml up -d
```

> 这会删除所有数据库数据卷，容器重启后MySQL会自动用init.sql初始化数据库。

适用于本项目 docker-compose.dev.yml 环境。

---

## 1. 进入 MySQL 容器

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec mysql bash
```

---

## 2. 登录 MySQL 数据库

```bash
mysql -uwordpress -pwordpress bjt_product
```

> 密码：wordpress

---

## 3. 查看所有数据库

```sql
SHOW DATABASES;
```

---

## 4. 查看所有表

```sql
SHOW TABLES;
```

---

## 5. 查看表结构（字段信息）

以主机料号表为例：

```sql
DESC wp_bjt_parts;
```
或
```sql
SHOW COLUMNS FROM wp_bjt_parts;
```

---

## 6. 直接用一条命令查看表结构（无需进入容器）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec mysql \
  mysql -uwordpress -pwordpress -e "USE bjt_product; DESC wp_bjt_parts;"
```

---

## 7. 导出数据库（备份）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec mysql \
  mysqldump -uwordpress -pwordpress bjt_product > backup.sql
```

docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql \
  mysqldump -uwordpress -pwordpress bjt_product > mockup.sql
---

## 8. 恢复数据库（还原）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec -T mysql \
  mysql -uwordpress -pwordpress bjt_product < backup.sql
```


docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
  mysql -uwordpress -pwordpress bjt_product  < docker/dev/mysql/consumable.sql
---


docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress -e "USE bjt_product; SHOW TABLES; "

## 9. 退出 MySQL 和容器

```sql
exit
```

```bash
exit
```

---

如需查看其它表，把 `wp_bjt_parts` 换成你要查的表名即可。

---

## 10. 在 WordPress 容器内启用 Apache mod_rewrite（伪静态）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress a2enmod rewrite
```

---

## 11. 重启 Apache 服务（在容器内）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress service apache2 restart
```

---

## 12. 检查 Apache 已启用的模块（确认 rewrite_module 是否存在）

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress apache2ctl -M
```

--- 
查看错误日志

docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress cat /var/www/html/wp-content/debug.log



docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress wp option update bjt_jwt_secret "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA"  --allow-root


lsof -ti:5173,5174,5175,5176,5177,5178 | xargs kill -9