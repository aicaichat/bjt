#!/usr/bin/env bash
# 验证生产环境容器内的关键配置是否生效
# 用法：bash scripts/verify-prod-config.sh
set -euo pipefail

COMPOSE_FILE="docker/prod/docker-compose.prod.yml"

# Helper to execute a command inside a service and print a title
exec_in() {
  local service="$1"
  shift
  echo -e "\n====================== $service ======================"
  docker compose -f "$COMPOSE_FILE" exec -T "$service" "$@"
}

# 获取 MySQL root 密码
ROOT_PASS=$(grep -E "^MYSQL_ROOT_PASSWORD=" .env.production | cut -d'=' -f2-)
if [ -z "$ROOT_PASS" ]; then
  echo "[ERROR] 未在 .env.production 中找到 MYSQL_ROOT_PASSWORD，无法验证 MySQL 变量" >&2
  exit 1
fi

# 1. 检查 MySQL 关键变量
exec_in mysql mysql -uroot -p"$ROOT_PASS" -e "\
  SELECT 'innodb_buffer_pool_size' AS Variable, @@innodb_buffer_pool_size\G;\
  SELECT 'innodb_buffer_pool_instances' AS Variable, @@innodb_buffer_pool_instances\G;\
  SELECT 'innodb_log_file_size' AS Variable, @@innodb_log_file_size\G;\
  SELECT 'innodb_flush_log_at_trx_commit' AS Variable, @@innodb_flush_log_at_trx_commit\G;\
  SELECT 'innodb_io_capacity' AS Variable, @@innodb_io_capacity\G;\
  SELECT 'performance_schema' AS Variable, @@performance_schema\G;"

# 2. 检查 PHP / OPcache / Redis 扩展
exec_in wordpress bash -c "php -i | grep -E 'memory_limit|opcache.memory_consumption|opcache.jit_buffer_size|opcache.enable|redis' | head -n 20"

# 3. 检查 Redis Ping
exec_in redis redis-cli ping

echo -e "\n✅ 验证完成，如上列值符合预期则说明配置已生效。" 