#!/usr/bin/env bash
# Regenerate docker/dev/mysql/init.sql from the live dev database
# Usage: ./scripts/update-init-sql.sh
set -euo pipefail

COMPOSE_FILE="docker/dev/docker-compose.nginx.yml"
DB_SERVICE="mysql"
OUTPUT="docker/dev/mysql/init.sql"
TMP_FILE="/tmp/bjt_schema.sql"

echo "[1/3] Dumping schema from running container ..."
# Dump without data
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" bash -c \
  "mysqldump -uroot -p\$MYSQL_ROOT_PASSWORD --no-data --skip-add-drop-table --databases bjt_product" \
  > "$TMP_FILE"

echo "[2/3] Cleaning dump (remove AUTO_INCREMENT for stable diff) ..."
sed -i '' -E 's/ AUTO_INCREMENT=[0-9]+//g' "$TMP_FILE"

echo "[3/3] Updating $OUTPUT"
cp "$OUTPUT" "${OUTPUT}.bak.$(date +%Y%m%d%H%M%S)" || true
mv "$TMP_FILE" "$OUTPUT"

echo "Done. Review git diff and commit if correct." 