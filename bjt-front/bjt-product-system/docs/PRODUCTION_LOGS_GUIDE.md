# BJT产品管理系统 - 生产环境日志查看指南

## 📋 概述

本文档介绍如何在生产环境中查看和分析系统日志，包括 Docker 容器日志、应用日志和系统日志。

## 🚀 快速开始

### 使用日志查看脚本（推荐）

```bash
# 查看所有服务的最新日志
./scripts/view-production-logs.sh -a

# 实时跟踪 WordPress 日志
./scripts/view-production-logs.sh -f wordpress

# 查看最近 50 行 Nginx 错误日志
./scripts/view-production-logs.sh -t 50 -e nginx

# 查看最近 1 小时的 MySQL 日志
./scripts/view-production-logs.sh -s 1h mysql

# 搜索包含 "error" 的日志
./scripts/view-production-logs.sh -g "error" -a

# 导出所有日志到文件
./scripts/view-production-logs.sh -a -o logs/export-$(date +%Y%m%d-%H%M%S).log
```

## 📍 日志位置

### 1. Docker Compose 日志

Docker Compose 使用 `json-file` 日志驱动，日志存储在：

```bash
# Docker 日志位置（宿主机）
/var/lib/docker/containers/<container-id>/*-json.log

# 查看日志文件位置
docker inspect <container-id> | grep LogPath
```

### 2. 容器内应用日志

#### Nginx 日志
- **访问日志**: `/var/log/nginx/access.log`
- **错误日志**: `/var/log/nginx/error.log`

#### WordPress 日志
- **PHP 错误日志**: `/var/www/html/wp-content/debug.log`
- **Apache 错误日志**: `/var/log/apache2/error.log`

#### MySQL 日志
- **错误日志**: `/var/log/mysql/error.log`
- **慢查询日志**: `/var/log/mysql/slow-query.log`

## 🔧 常用命令

### Docker Compose 日志命令

```bash
# 定义 Compose 命令（在项目根目录）
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

# 查看所有服务日志
$COMPOSE logs

# 实时跟踪所有日志
$COMPOSE logs -f

# 查看最后 100 行日志
$COMPOSE logs --tail=100

# 查看最近 1 小时的日志
$COMPOSE logs --since=1h

# 查看特定服务日志
$COMPOSE logs nginx
$COMPOSE logs wordpress
$COMPOSE logs mysql

# 查看多个服务日志
$COMPOSE logs nginx wordpress

# 只显示错误日志
$COMPOSE logs | grep -i error

# 查看特定时间段的日志
$COMPOSE logs --since="2024-01-01T10:00:00" --until="2024-01-01T12:00:00"
```

### 容器内日志查看

```bash
# 查看 Nginx 访问日志
$COMPOSE exec nginx tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
$COMPOSE exec nginx tail -f /var/log/nginx/error.log

# 查看 WordPress debug.log
$COMPOSE exec wordpress tail -f /var/www/html/wp-content/debug.log

# 查看 Apache 错误日志
$COMPOSE exec wordpress tail -f /var/log/apache2/error.log

# 查看 MySQL 错误日志
$COMPOSE exec mysql tail -f /var/log/mysql/error.log

# 查看 MySQL 慢查询日志
$COMPOSE exec mysql tail -f /var/log/mysql/slow-query.log
```

### 日志过滤和分析

```bash
# 查找错误
$COMPOSE logs | grep -iE "(error|exception|fatal)"

# 查找特定 IP 的访问
$COMPOSE logs nginx | grep "192.168.1.100"

# 统计 HTTP 状态码
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c

# 查找 4xx 和 5xx 错误
$COMPOSE exec nginx awk '$9 >= 400 {print $0}' /var/log/nginx/access.log

# 查找最频繁访问的 URL
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# 查找响应时间最长的请求
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk '{print $NF, $0}' | sort -rn | head -20
```

## 📊 日志分析示例

### 1. 分析 API 错误

```bash
# 查找 API 相关的错误
$COMPOSE logs wordpress | grep -iE "wp-json/bjt/v1.*error"

# 查找认证失败
$COMPOSE logs wordpress | grep -iE "(unauthorized|forbidden|401|403)"

# 查找数据库查询错误
$COMPOSE logs wordpress | grep -iE "(mysql|database|query.*error)"
```

### 2. 分析性能问题

```bash
# 查找慢查询
$COMPOSE exec mysql cat /var/log/mysql/slow-query.log | tail -50

# 查找响应时间超过 1 秒的请求
$COMPOSE exec nginx awk '$NF > 1.0 {print $0}' /var/log/nginx/access.log

# 统计每分钟的请求数
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk '{print $4}' | cut -d: -f1-2 | uniq -c
```

### 3. 分析访问模式

```bash
# 查看最活跃的用户 IP
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# 查看最常访问的页面
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# 查看 User-Agent 统计
$COMPOSE exec nginx cat /var/log/nginx/access.log | awk -F'"' '{print $6}' | sort | uniq -c | sort -rn | head -20
```

## 🔍 故障排查

### 查看服务启动日志

```bash
# 查看服务启动时的完整日志
$COMPOSE logs --since="10m" | head -200

# 查看特定服务的启动日志
$COMPOSE logs wordpress | grep -iE "(start|ready|listening)"
```

### 查看错误堆栈

```bash
# 查找 PHP 错误堆栈
$COMPOSE exec wordpress cat /var/www/html/wp-content/debug.log | grep -A 20 "Fatal error"

# 查找 MySQL 错误详情
$COMPOSE exec mysql cat /var/log/mysql/error.log | grep -A 10 "ERROR"
```

### 查看资源使用情况

```bash
# 查看容器资源使用
docker stats --no-stream

# 查看特定容器的资源使用
docker stats --no-stream $($COMPOSE ps -q wordpress)
```

## 📦 日志导出和备份

### 导出日志到文件

```bash
# 导出所有服务日志
$COMPOSE logs > logs/all-services-$(date +%Y%m%d-%H%M%S).log

# 导出特定服务日志
$COMPOSE logs wordpress > logs/wordpress-$(date +%Y%m%d-%H%M%S).log

# 导出最近 1 小时的日志
$COMPOSE logs --since=1h > logs/recent-$(date +%Y%m%d-%H%M%S).log

# 导出错误日志
$COMPOSE logs | grep -iE "(error|exception|fatal)" > logs/errors-$(date +%Y%m%d-%H%M%S).log
```

### 导出容器内日志文件

```bash
# 导出 Nginx 访问日志
$COMPOSE exec nginx cat /var/log/nginx/access.log > logs/nginx-access-$(date +%Y%m%d-%H%M%S).log

# 导出 WordPress debug.log
$COMPOSE exec wordpress cat /var/www/html/wp-content/debug.log > logs/wordpress-debug-$(date +%Y%m%d-%H%M%S).log

# 导出 MySQL 错误日志
$COMPOSE exec mysql cat /var/log/mysql/error.log > logs/mysql-error-$(date +%Y%m%d-%H%M%S).log
```

## 🛠️ 日志轮转和清理

### Docker 日志配置

在 `docker-compose.prod.yml` 中，日志配置如下：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # 单个日志文件最大 10MB
    max-file: "3"      # 保留 3 个日志文件
```

### 手动清理日志

```bash
# 清理所有停止的容器日志
docker container prune -f

# 清理所有未使用的日志
docker system prune -a -f

# 查看 Docker 日志占用空间
du -sh /var/lib/docker/containers/*/*-json.log

# 清理特定容器的日志（谨慎使用）
truncate -s 0 /var/lib/docker/containers/<container-id>/*-json.log
```

## 📈 实时监控

### 使用脚本实时监控

```bash
# 实时监控所有服务日志
./scripts/view-production-logs.sh -f -a

# 实时监控错误日志
./scripts/view-production-logs.sh -f -e -a

# 实时监控特定服务
./scripts/view-production-logs.sh -f wordpress
```

### 使用 watch 命令

```bash
# 每 5 秒刷新服务状态
watch -n 5 "$COMPOSE ps"

# 每 2 秒刷新容器资源使用
watch -n 2 "docker stats --no-stream"
```

## 🔐 安全注意事项

1. **日志包含敏感信息**: 日志可能包含密码、API 密钥等敏感信息，导出时注意保护
2. **日志文件权限**: 确保日志文件权限设置正确，避免未授权访问
3. **日志保留策略**: 定期清理旧日志，避免占用过多磁盘空间
4. **日志传输**: 通过安全通道传输日志文件

## 📞 获取帮助

如果遇到问题，可以：

1. 查看服务状态: `$COMPOSE ps`
2. 查看容器资源使用: `docker stats --no-stream`
3. 检查磁盘空间: `df -h`
4. 查看 Docker 系统信息: `docker system df`

---

**最后更新**: 2024-01-13
